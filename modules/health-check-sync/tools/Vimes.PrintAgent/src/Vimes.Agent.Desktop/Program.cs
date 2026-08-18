using System.Diagnostics;
using System.Collections.Concurrent;
using System.Security.Principal;
using System.Text.Json;
using Vimes.Agent.Ipc;
using Vimes.Agent.Contracts;
using Vimes.Agent.Signing;

namespace Vimes.Agent.Desktop;

internal static class Program
{
    [STAThread]
    private static void Main()
    {
        ApplicationConfiguration.Initialize();
        Application.Run(new TrayApplicationContext());
    }
}

internal sealed class TrayApplicationContext : ApplicationContext
{
    private readonly NotifyIcon trayIcon;
    private readonly CancellationTokenSource stopping = new();
    private readonly DesktopPipeServer server;
    private readonly WindowsCertificateSigningProvider signingProvider = new();
    private readonly ConcurrentDictionary<string, byte> signingTransactions = new(StringComparer.Ordinal);

    public TrayApplicationContext()
    {
        var menu = new ContextMenuStrip();
        menu.Items.Add("Trạng thái: Đang hoạt động", null, (_, _) => ShowStatus());
        menu.Items.Add("Thoát", null, (_, _) => Exit());
        trayIcon = new NotifyIcon
        {
            Icon = LoadAppIcon(),
            Text = "VIMES Workstation Agent",
            Visible = true,
            ContextMenuStrip = menu
        };
        trayIcon.DoubleClick += (_, _) => ShowStatus();
        server = new DesktopPipeServer(HandleRequestAsync);
        _ = server.RunAsync(stopping.Token);
    }

    private static Icon LoadAppIcon()
    {
        try
        {
            var assembly = typeof(Program).Assembly;
            var resourceName = assembly.GetManifestResourceNames().FirstOrDefault(n => n.EndsWith("vimes.ico", StringComparison.OrdinalIgnoreCase));
            if (!string.IsNullOrEmpty(resourceName))
            {
                using var stream = assembly.GetManifestResourceStream(resourceName);
                if (stream != null) return new Icon(stream);
            }
            var iconPath = Path.Combine(AppContext.BaseDirectory, "Assets", "vimes.ico");
            if (File.Exists(iconPath)) return new Icon(iconPath);
            var rootIconPath = Path.Combine(AppContext.BaseDirectory, "vimes.ico");
            if (File.Exists(rootIconPath)) return new Icon(rootIconPath);
            return Icon.ExtractAssociatedIcon(Process.GetCurrentProcess().MainModule?.FileName ?? string.Empty) ?? SystemIcons.Application;
        }
        catch
        {
            return SystemIcons.Application;
        }
    }

    private Task<IpcResponse> HandleRequestAsync(IpcRequest request, CancellationToken cancellationToken)
    {
        if (request.Version != DesktopPipeNames.ProtocolVersion)
            return Task.FromResult(new IpcResponse(request.Id, false, "IPC_VERSION_MISMATCH", "Phiên bản IPC không tương thích."));
        try
        {
            if (request.Type == "ping")
            {
                var identity = new DesktopIdentity(Environment.UserName, WindowsIdentity.GetCurrent().User?.Value ?? string.Empty,
                    Process.GetCurrentProcess().SessionId, Application.ProductVersion);
                return Task.FromResult(new IpcResponse(request.Id, true, "OK", "Desktop Companion đang hoạt động.", JsonSerializer.SerializeToElement(identity)));
            }
            if (request.Type == "signing.certificates.list")
            {
                var certificates = signingProvider.ListCertificates();
                return Task.FromResult(new IpcResponse(request.Id, true, "OK", "Đã đọc danh sách chứng thư.", JsonSerializer.SerializeToElement(certificates)));
            }
            if (request.Type == "signing.hash")
            {
                var signRequest = request.Payload.Deserialize<SignHashRequest>() ?? throw new SigningException("INVALID_SIGNING_REQUEST", "Dữ liệu ký không hợp lệ.");
                WindowsCertificateSigningProvider.ValidateRequest(signRequest, DateTimeOffset.UtcNow);
                if (!signingTransactions.TryAdd(signRequest.TransactionId, 0))
                    return Task.FromResult(new IpcResponse(request.Id, false, "TRANSACTION_ALREADY_PROCESSED", "Giao dịch ký đang xử lý hoặc đã hoàn tất."));
                try
                {
                var patientLine = string.IsNullOrWhiteSpace(signRequest.PatientCode) ? string.Empty : $"\nMã bệnh nhân: {signRequest.PatientCode}";
                var confirmation = MessageBox.Show(
                    $"Xác nhận ký tài liệu:\n{signRequest.DocumentLabel}{patientLine}\n\nTransaction: {signRequest.TransactionId}",
                    "VIMES - Xác nhận ký số", MessageBoxButtons.YesNo, MessageBoxIcon.Warning, MessageBoxDefaultButton.Button2);
                if (confirmation != DialogResult.Yes)
                {
                    signingTransactions.TryRemove(signRequest.TransactionId, out _);
                    return Task.FromResult(new IpcResponse(request.Id, false, "USER_CANCELLED", "Người dùng đã hủy ký số."));
                }
                var result = signingProvider.SignHash(signRequest);
                return Task.FromResult(new IpcResponse(request.Id, true, "OK", "Ký hash thành công.", JsonSerializer.SerializeToElement(result)));
                }
                catch
                {
                    signingTransactions.TryRemove(signRequest.TransactionId, out _);
                    throw;
                }
            }
            return Task.FromResult(new IpcResponse(request.Id, false, "IPC_OPERATION_NOT_SUPPORTED", "Desktop Companion chưa hỗ trợ thao tác này."));
        }
        catch (SigningException exception)
        {
            return Task.FromResult(new IpcResponse(request.Id, false, exception.Code, exception.Message));
        }
        catch (JsonException)
        {
            return Task.FromResult(new IpcResponse(request.Id, false, "INVALID_SIGNING_REQUEST", "Dữ liệu ký không đúng định dạng."));
        }
    }

    private static void ShowStatus() => MessageBox.Show("VIMES Workstation Agent Desktop Companion đang hoạt động.", "VIMES Workstation Agent", MessageBoxButtons.OK, MessageBoxIcon.Information);
    private void Exit() { stopping.Cancel(); trayIcon.Visible = false; trayIcon.Dispose(); ExitThread(); }
    protected override void Dispose(bool disposing) { if (disposing) { stopping.Cancel(); stopping.Dispose(); trayIcon.Dispose(); } base.Dispose(disposing); }
}

public sealed class DesktopPipeServer(Func<IpcRequest, CancellationToken, Task<IpcResponse>> handler)
{
    public async Task RunAsync(CancellationToken cancellationToken)
    {
        var pipeName = DesktopPipeNames.ForSession(Process.GetCurrentProcess().SessionId);
        while (!cancellationToken.IsCancellationRequested)
        {
            await using var pipe = SecureDesktopPipeFactory.CreateForCurrentUser(pipeName);
            try
            {
                await pipe.WaitForConnectionAsync(cancellationToken);
                var request = await IpcJsonProtocol.ReadAsync<IpcRequest>(pipe, cancellationToken);
                var response = await handler(request, cancellationToken);
                await IpcJsonProtocol.WriteAsync(pipe, response, cancellationToken);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { break; }
            catch (Exception exception)
            {
                if (pipe.IsConnected)
                {
                    var error = new IpcResponse(string.Empty, false, "IPC_ERROR", exception.Message);
                    try { await IpcJsonProtocol.WriteAsync(pipe, error, cancellationToken); } catch { /* connection already closed */ }
                }
            }
        }
    }
}
