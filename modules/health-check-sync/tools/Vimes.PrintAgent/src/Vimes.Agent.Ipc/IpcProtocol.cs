using System.Buffers.Binary;
using System.IO.Pipes;
using System.Security.AccessControl;
using System.Security.Principal;
using System.Text.Json;

namespace Vimes.Agent.Ipc;

public sealed record IpcRequest(string Id, string Type, string Version, JsonElement Payload);
public sealed record IpcResponse(string Id, bool Success, string Code, string Message, JsonElement? Payload = null);
public sealed record DesktopIdentity(string UserName, string UserSid, int SessionId, string Version);

public static class DesktopPipeNames
{
    public const string ProtocolVersion = "1.0";
    public static string ForSession(int sessionId) => $"VIMES.WorkstationAgent.Desktop.{sessionId}";
}

public static class WindowsSessionLocator
{
    [System.Runtime.InteropServices.DllImport("kernel32.dll")]
    private static extern uint WTSGetActiveConsoleSessionId();

    public static int GetActiveConsoleSessionId()
    {
        var sessionId = WTSGetActiveConsoleSessionId();
        return sessionId == uint.MaxValue ? -1 : checked((int)sessionId);
    }
}

public static class IpcJsonProtocol
{
    public const int MaximumMessageBytes = 64 * 1024;
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static async Task WriteAsync<T>(Stream stream, T message, CancellationToken cancellationToken)
    {
        var payload = JsonSerializer.SerializeToUtf8Bytes(message, JsonOptions);
        if (payload.Length > MaximumMessageBytes) throw new InvalidDataException("IPC message exceeds maximum size.");
        var header = new byte[4];
        BinaryPrimitives.WriteInt32LittleEndian(header, payload.Length);
        await stream.WriteAsync(header, cancellationToken);
        await stream.WriteAsync(payload, cancellationToken);
        await stream.FlushAsync(cancellationToken);
    }

    public static async Task<T> ReadAsync<T>(Stream stream, CancellationToken cancellationToken)
    {
        var header = new byte[4];
        await ReadExactlyAsync(stream, header, cancellationToken);
        var length = BinaryPrimitives.ReadInt32LittleEndian(header);
        if (length is <= 0 or > MaximumMessageBytes) throw new InvalidDataException("Invalid IPC message size.");
        var payload = new byte[length];
        await ReadExactlyAsync(stream, payload, cancellationToken);
        return JsonSerializer.Deserialize<T>(payload, JsonOptions) ?? throw new InvalidDataException("Invalid IPC JSON payload.");
    }

    private static async Task ReadExactlyAsync(Stream stream, Memory<byte> buffer, CancellationToken cancellationToken)
    {
        var read = 0;
        while (read < buffer.Length)
        {
            var count = await stream.ReadAsync(buffer[read..], cancellationToken);
            if (count == 0) throw new EndOfStreamException("IPC connection closed before message completed.");
            read += count;
        }
    }
}

public static class SecureDesktopPipeFactory
{
    public static NamedPipeServerStream CreateForCurrentUser(string pipeName)
    {
        var currentSid = WindowsIdentity.GetCurrent().User ?? throw new InvalidOperationException("Cannot resolve current Windows user SID.");
        var systemSid = new SecurityIdentifier(WellKnownSidType.LocalSystemSid, null);
        var security = new PipeSecurity();
        security.SetAccessRuleProtection(true, false);
        security.AddAccessRule(new PipeAccessRule(currentSid, PipeAccessRights.FullControl, AccessControlType.Allow));
        security.AddAccessRule(new PipeAccessRule(systemSid, PipeAccessRights.FullControl, AccessControlType.Allow));
        return NamedPipeServerStreamAcl.Create(pipeName, PipeDirection.InOut, 1, PipeTransmissionMode.Byte,
            PipeOptions.Asynchronous | PipeOptions.WriteThrough, 65_536, 65_536, security);
    }
}

public sealed class DesktopAgentClient
{
    public async Task<IpcResponse> SendAsync(int sessionId, string type, object payload, TimeSpan timeout, CancellationToken cancellationToken)
    {
        using var timeoutSource = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeoutSource.CancelAfter(timeout);
        await using var pipe = new NamedPipeClientStream(".", DesktopPipeNames.ForSession(sessionId), PipeDirection.InOut, PipeOptions.Asynchronous);
        await pipe.ConnectAsync(timeoutSource.Token);
        var request = new IpcRequest(Guid.NewGuid().ToString("N"), type, DesktopPipeNames.ProtocolVersion, JsonSerializer.SerializeToElement(payload));
        await IpcJsonProtocol.WriteAsync(pipe, request, timeoutSource.Token);
        return await IpcJsonProtocol.ReadAsync<IpcResponse>(pipe, timeoutSource.Token);
    }
}
