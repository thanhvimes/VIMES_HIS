using System.Diagnostics;
using System.Text.Json;
using Vimes.Agent.Ipc;
using Xunit;

namespace Vimes.Agent.Tests;

public sealed class IpcProtocolTests
{
    [Fact]
    public async Task JsonProtocolRoundTripsFramedMessage()
    {
        await using var stream = new MemoryStream();
        var request = new IpcRequest("request-1", "ping", DesktopPipeNames.ProtocolVersion, JsonSerializer.SerializeToElement(new { value = 42 }));

        await IpcJsonProtocol.WriteAsync(stream, request, CancellationToken.None);
        stream.Position = 0;
        var restored = await IpcJsonProtocol.ReadAsync<IpcRequest>(stream, CancellationToken.None);

        Assert.Equal(request.Id, restored.Id);
        Assert.Equal("ping", restored.Type);
        Assert.Equal(42, restored.Payload.GetProperty("value").GetInt32());
    }

    [Fact]
    public async Task JsonProtocolRejectsOversizedMessage()
    {
        await using var stream = new MemoryStream();
        var oversized = new { data = new string('X', IpcJsonProtocol.MaximumMessageBytes) };

        await Assert.ThrowsAsync<InvalidDataException>(() => IpcJsonProtocol.WriteAsync(stream, oversized, CancellationToken.None));
    }

    [Fact]
    public async Task SecureNamedPipeAllowsCurrentUserRoundTrip()
    {
        var sessionId = Process.GetCurrentProcess().SessionId;
        await using var server = SecureDesktopPipeFactory.CreateForCurrentUser(DesktopPipeNames.ForSession(sessionId));
        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(5));
        var serverTask = Task.Run(async () =>
        {
            await server.WaitForConnectionAsync(timeout.Token);
            var request = await IpcJsonProtocol.ReadAsync<IpcRequest>(server, timeout.Token);
            await IpcJsonProtocol.WriteAsync(server, new IpcResponse(request.Id, true, "OK", "pong"), timeout.Token);
        }, timeout.Token);

        var response = await new DesktopAgentClient().SendAsync(sessionId, "ping", new { }, TimeSpan.FromSeconds(3), timeout.Token);
        await serverTask;

        Assert.True(response.Success);
        Assert.Equal("pong", response.Message);
    }
}
