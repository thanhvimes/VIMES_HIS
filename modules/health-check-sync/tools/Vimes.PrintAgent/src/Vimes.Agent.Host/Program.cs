using System.Diagnostics;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.Extensions.Options;
using Vimes.Agent.Contracts;
using Vimes.Agent.Host;
using Vimes.Agent.Printing;
using Vimes.Agent.Security;
using Vimes.Agent.Persistence;
using Vimes.Agent.Ipc;
using Vimes.Agent.Signing;

var builder = WebApplication.CreateBuilder(args);
builder.Host.UseWindowsService(options => options.ServiceName = "VIMES Workstation Agent");
var localSslCert = LocalSslCertificateHelper.GetOrCreateLocalCertificate();
builder.WebHost.ConfigureKestrel(options =>
{
    options.Listen(System.Net.IPAddress.Loopback, 18181); // Standard HTTP port
    if (localSslCert != null)
    {
        options.Listen(System.Net.IPAddress.Loopback, 18182, listenOptions =>
        {
            listenOptions.UseHttps(localSslCert);
        });
    }
});
var programDataConfig = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "VIMES", "WorkstationAgent", "appsettings.json");
if (File.Exists(programDataConfig))
{
    builder.Configuration.AddJsonFile(programDataConfig, optional: true, reloadOnChange: true);
}
builder.Services.Configure<AgentOptions>(builder.Configuration.GetSection(AgentOptions.SectionName));
builder.Services.ConfigureHttpJsonOptions(options => options.SerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase)));
const string DefaultTrustedBackendPublicKeyPem = "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwV9oMwrnO/QG+PhQ2el/\nVGTnorZLgPSVcITGiyrLWUt8IlUtXxF5va/8+VR9S5PaCSEbWxobcOnOPAn3ljpU\nnktVIqPO5/18+KktD/XNZWbTRS93owEYgLfLDH+mP/xC7eO9/y17D6UW8osOKqtO\n5cziafgCWgEKR7cvqkG0Q6LoM3SfPsiwr07Wkg76glEBruUUg/LHdDdNmB35F88Y\nFdvWCV9NEQnVupuaFVMdUEPpbmmN5Rn0Tn3xLkunivOVx+21Q7YzLrOD+03A2J4x\nj5TfwMAq49Fkwo4YuxNP0yVAwadjVF0aKamnZw005Sx13RrNPz5ZpB/m9Ojjpn/W\nxQIDAQAB\n-----END PUBLIC KEY-----\n";

var securityOptions = builder.Configuration.GetSection("Security").Get<AgentSecurityOptions>() ?? new AgentSecurityOptions();
if (string.IsNullOrWhiteSpace(securityOptions.TrustedBackendPublicKeyPem))
{
    if (File.Exists(programDataConfig))
    {
        try
        {
            using var doc = JsonDocument.Parse(File.ReadAllText(programDataConfig));
            if (doc.RootElement.TryGetProperty("Security", out var secElem) &&
                secElem.TryGetProperty("TrustedBackendPublicKeyPem", out var keyElem))
            {
                var candidate = keyElem.GetString();
                if (!string.IsNullOrWhiteSpace(candidate))
                {
                    securityOptions = new AgentSecurityOptions
                    {
                        TrustedBackendPublicKeyPem = candidate,
                        ChallengeLifetimeSeconds = securityOptions.ChallengeLifetimeSeconds,
                        SessionLifetimeMinutes = securityOptions.SessionLifetimeMinutes
                    };
                }
            }
        }
        catch { /* fallback to default */ }
    }
}
if (string.IsNullOrWhiteSpace(securityOptions.TrustedBackendPublicKeyPem))
{
    securityOptions = new AgentSecurityOptions
    {
        TrustedBackendPublicKeyPem = DefaultTrustedBackendPublicKeyPem,
        ChallengeLifetimeSeconds = securityOptions.ChallengeLifetimeSeconds,
        SessionLifetimeMinutes = securityOptions.SessionLifetimeMinutes
    };
}
builder.Services.AddSingleton(securityOptions);
builder.Services.AddSingleton<AgentSessionService>();
var configuredDataDirectory = builder.Configuration[$"{AgentOptions.SectionName}:DataDirectory"];
var agentDataRoot = string.IsNullOrWhiteSpace(configuredDataDirectory)
    ? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "VIMES", "WorkstationAgent")
    : Path.GetFullPath(configuredDataDirectory);
builder.Services.AddSingleton<IPayloadProtector, DpapiMachinePayloadProtector>();
builder.Services.AddSingleton<IPrintJobStore>(services => new SqlitePrintJobStore(Path.Combine(agentDataRoot, "agent.db"), services.GetRequiredService<IPayloadProtector>()));
builder.Services.AddSingleton<PrintJobQueue>();
builder.Services.AddSingleton<IRawPrinter, Win32RawPrinter>();
builder.Services.AddHostedService<PrintWorker>();
builder.Services.AddSingleton<DesktopAgentClient>();
builder.Services.AddSingleton<ISigningJobStore>(services => new SqliteSigningJobStore(Path.Combine(agentDataRoot, "agent.db"), services.GetRequiredService<IPayloadProtector>()));
builder.Services.AddSingleton<IDesktopSigningGateway, IpcDesktopSigningGateway>();
builder.Services.AddSingleton<SigningJobQueue>();
builder.Services.AddHostedService<SigningJobWorker>();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("agent-sensitive", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "local",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 30, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
    options.OnRejected = async (context, cancellationToken) =>
        await context.HttpContext.Response.WriteAsJsonAsync(new ApiError("RATE_LIMITED", "Quá nhiều request tới Workstation Agent.", context.HttpContext.TraceIdentifier), cancellationToken);
});

var app = builder.Build();
app.UseRateLimiter();

app.Use(async (context, next) =>
{
    var correlationId = context.Request.Headers["X-Correlation-Id"].FirstOrDefault() ?? Activity.Current?.Id ?? Guid.NewGuid().ToString("N");
    context.TraceIdentifier = correlationId;
    context.Response.Headers["X-Correlation-Id"] = correlationId;
    await next();
});

app.Use(async (context, next) =>
{
    if (!context.Request.Path.StartsWithSegments("/api/v1")) { await next(); return; }
    var origin = context.Request.Headers.Origin.FirstOrDefault()
        ?? context.Request.Headers["X-Agent-Origin"].FirstOrDefault();
    var optionsMonitor = context.RequestServices.GetService<IOptionsMonitor<AgentOptions>>();
    var options = optionsMonitor?.CurrentValue ?? context.RequestServices.GetRequiredService<IOptions<AgentOptions>>().Value;

    // Support W3C Private Network Access (PNA) for Chromium browsers (Chrome/Edge)
    if (context.Request.Headers.ContainsKey("Access-Control-Request-Private-Network"))
    {
        context.Response.Headers["Access-Control-Allow-Private-Network"] = "true";
    }

    if (string.IsNullOrWhiteSpace(origin))
    {
        if (HttpMethods.IsGet(context.Request.Method)) { await next(); return; }
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        await context.Response.WriteAsJsonAsync(new ApiError("ORIGIN_REQUIRED", "Request từ browser phải có Origin.", context.TraceIdentifier));
        return;
    }

    var origins = options.AllowedOrigins ?? Array.Empty<string>();
    var allowAny = origins.Length == 0 || origins.Contains("*");
    if (!allowAny && !origins.Contains(origin, StringComparer.OrdinalIgnoreCase))
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        await context.Response.WriteAsJsonAsync(new ApiError("ORIGIN_NOT_ALLOWED", "Nguồn gọi không được Workstation Agent cho phép.", context.TraceIdentifier));
        return;
    }

    context.Response.Headers.AccessControlAllowOrigin = origin;
    context.Response.Headers.Vary = "Origin";
    context.Response.Headers["Access-Control-Allow-Private-Network"] = "true";

    if (HttpMethods.IsOptions(context.Request.Method))
    {
        context.Response.Headers.AccessControlAllowMethods = "GET,POST,OPTIONS";
        context.Response.Headers.AccessControlAllowHeaders = "Authorization,Content-Type,X-Correlation-Id,X-Idempotency-Key,X-Agent-Origin";
        context.Response.StatusCode = StatusCodes.Status204NoContent;
        return;
    }
    await next();
});

app.Use(async (context, next) =>
{
    var protectedPath = context.Request.Path.StartsWithSegments("/api/v1/printing")
        || context.Request.Path.StartsWithSegments("/api/v1/desktop")
        || context.Request.Path.StartsWithSegments("/api/v1/signing");
    if (!protectedPath) { await next(); return; }
    var authorization = context.Request.Headers.Authorization.FirstOrDefault();
    var token = authorization?.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase) == true ? authorization[7..].Trim() : string.Empty;
    var sessionService = context.RequestServices.GetRequiredService<AgentSessionService>();
    if (string.IsNullOrWhiteSpace(token) || !sessionService.Validate(token))
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        await context.Response.WriteAsJsonAsync(new ApiError("AGENT_SESSION_REQUIRED", "Cần phiên Workstation Agent hợp lệ.", context.TraceIdentifier));
        return;
    }
    await next();
});

app.MapGet("/api/v1/health", () => Results.Ok(new { status = "ok", product = "VIMES Workstation Agent", version = "1.2.0", sslEnabled = localSslCert != null, timestamp = DateTimeOffset.UtcNow }));
app.MapGet("/api/v1/version", () => Results.Ok(new { product = "VIMES Workstation Agent", version = "1.2.0", apiVersion = "v1", sslEnabled = localSslCert != null, httpsPort = 18182 }));
app.MapGet("/api/v1/capabilities", () => Results.Ok(new[]
{
    new CapabilityInfo("printing", "1.0", "available"),
    new CapabilityInfo("desktop-companion", "1.0", "available"),
    new CapabilityInfo("signing", "1.0", "available")
}));
app.MapPost("/api/v1/session/challenge", (HttpContext context, AgentSessionService sessions) =>
    Results.Ok(sessions.CreateChallenge(context.Request.Headers.Origin.ToString()))).RequireRateLimiting("agent-sensitive");
app.MapPost("/api/v1/session/authorize", (AuthorizeSessionRequest request, HttpContext context, AgentSessionService sessions) =>
{
    try { return Results.Ok(sessions.Authorize(request.ChallengeId, request.Signature, context.Request.Headers.Origin.ToString())); }
    catch (AgentSecurityException exception)
    {
        var status = exception.Code == "AGENT_NOT_ENROLLED" ? StatusCodes.Status503ServiceUnavailable : StatusCodes.Status401Unauthorized;
        return Results.Json(new ApiError(exception.Code, exception.Message, context.TraceIdentifier), statusCode: status);
    }
}).RequireRateLimiting("agent-sensitive");
app.MapGet("/api/v1/printing/printers", (IRawPrinter printer) => Results.Ok(printer.ListPrinters()));
app.MapGet("/api/v1/desktop/status", async (int? sessionId, DesktopAgentClient client, HttpContext context, CancellationToken cancellationToken) =>
{
    var targetSessionId = sessionId ?? WindowsSessionLocator.GetActiveConsoleSessionId();
    if (targetSessionId < 0) return BadRequest("INVALID_SESSION_ID", "Không tìm thấy Windows console session đang hoạt động.", context);
    try
    {
        var response = await client.SendAsync(targetSessionId, "ping", new { }, TimeSpan.FromSeconds(2), cancellationToken);
        return response.Success ? Results.Ok(response) : Results.Json(response, statusCode: StatusCodes.Status503ServiceUnavailable);
    }
    catch (Exception exception) when (exception is TimeoutException or IOException or OperationCanceledException or UnauthorizedAccessException)
    {
        return Results.Json(new ApiError("DESKTOP_COMPANION_UNAVAILABLE", "Không kết nối được Desktop Companion.", context.TraceIdentifier), statusCode: StatusCodes.Status503ServiceUnavailable);
    }
});
app.MapGet("/api/v1/signing/certificates", async (int? sessionId, DesktopAgentClient client, HttpContext context, CancellationToken cancellationToken) =>
{
    var targetSessionId = sessionId ?? WindowsSessionLocator.GetActiveConsoleSessionId();
    if (targetSessionId < 0) return BadRequest("INVALID_SESSION_ID", "Không tìm thấy Windows session đang hoạt động.", context);
    try
    {
        var response = await client.SendAsync(targetSessionId, "signing.certificates.list", new { }, TimeSpan.FromSeconds(5), cancellationToken);
        return response.Success ? Results.Ok(response.Payload) : Results.Json(response, statusCode: StatusCodes.Status422UnprocessableEntity);
    }
    catch (Exception exception) when (exception is TimeoutException or IOException or OperationCanceledException or UnauthorizedAccessException)
    {
        return Results.Json(new ApiError("DESKTOP_COMPANION_UNAVAILABLE", "Không kết nối được Desktop Companion.", context.TraceIdentifier), statusCode: StatusCodes.Status503ServiceUnavailable);
    }
});
app.MapGet("/api/v1/signing/providers", () => Results.Ok(new[]
{
    new WindowsCertificateSigningProvider().Info
}));
app.MapPost("/api/v1/signing/jobs", async (SignHashRequest request, int? sessionId, SigningJobQueue queue, HttpContext context, CancellationToken cancellationToken) =>
{
    try { WindowsCertificateSigningProvider.ValidateRequest(request, DateTimeOffset.UtcNow); }
    catch (SigningException exception) { return Results.BadRequest(new ApiError(exception.Code, exception.Message, context.TraceIdentifier)); }
    var targetSessionId = sessionId ?? WindowsSessionLocator.GetActiveConsoleSessionId();
    if (targetSessionId < 0) return BadRequest("INVALID_SESSION_ID", "Không tìm thấy Windows session đang hoạt động.", context);
    try
    {
        var (job, duplicate) = await queue.EnqueueAsync(request, targetSessionId, cancellationToken);
        return Results.Accepted($"/api/v1/signing/jobs/{job.Id}", new SigningJobAccepted(job.Id, job.Request.TransactionId, job.Status, duplicate));
    }
    catch (Exception exception) when (exception is TimeoutException or IOException or OperationCanceledException or UnauthorizedAccessException)
    {
        return Results.Json(new ApiError("DESKTOP_COMPANION_UNAVAILABLE", "Không kết nối được Desktop Companion hoặc thao tác ký hết thời gian.", context.TraceIdentifier), statusCode: StatusCodes.Status503ServiceUnavailable);
    }
}).RequireRateLimiting("agent-sensitive");

app.MapGet("/api/v1/signing/jobs/{id}", async (string id, SigningJobQueue queue, HttpContext context, CancellationToken cancellationToken) =>
    await queue.GetAsync(id, cancellationToken) is { } job
        ? Results.Ok(job.ToView())
        : Results.NotFound(new ApiError("SIGNING_JOB_NOT_FOUND", "Signing job not found.", context.TraceIdentifier)));

app.MapPost("/api/v1/signing/jobs/{id}/cancel", async (string id, SigningJobQueue queue, HttpContext context, CancellationToken cancellationToken) =>
{
    var job = await queue.GetAsync(id, cancellationToken);
    if (job is null) return Results.NotFound(new ApiError("SIGNING_JOB_NOT_FOUND", "Signing job not found.", context.TraceIdentifier));
    return await queue.CancelAsync(id, cancellationToken)
        ? Results.Ok((await queue.GetAsync(id, cancellationToken))!.ToView())
        : Results.Conflict(new ApiError("SIGNING_JOB_NOT_CANCELLABLE", "Signing job can no longer be cancelled.", context.TraceIdentifier));
}).RequireRateLimiting("agent-sensitive");

app.MapPost("/api/v1/printing/jobs", async (PrintJobRequest request, PrintJobQueue queue, IRawPrinter printer, IOptions<AgentOptions> options, HttpContext context, CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(request.Printer)) return BadRequest("PRINTER_REQUIRED", "Phải chọn máy in.", context);
    if (string.IsNullOrWhiteSpace(request.Data)) return BadRequest("PRINT_DATA_REQUIRED", "Dữ liệu in không được để trống.", context);
    if (Encoding.UTF8.GetByteCount(request.Data) > options.Value.MaximumPrintPayloadBytes) return BadRequest("PRINT_DATA_TOO_LARGE", "Dữ liệu in vượt giới hạn cho phép.", context);
    if (request.Copies is < 1 or > 20) return BadRequest("INVALID_COPIES", "Số bản in phải từ 1 đến 20.", context);
    if (request.IdempotencyKey is { Length: > 128 }) return BadRequest("INVALID_IDEMPOTENCY_KEY", "Idempotency key không được quá 128 ký tự.", context);
    if (!printer.ListPrinters().Contains(request.Printer, StringComparer.OrdinalIgnoreCase)) return BadRequest("PRINTER_NOT_FOUND", "Máy in không tồn tại trên máy trạm.", context);
    var (job, duplicate) = await queue.EnqueueAsync(request, cancellationToken);
    return Results.Accepted($"/api/v1/printing/jobs/{job.Id}", new PrintJobAccepted(job.Id, job.Status, duplicate));
}).RequireRateLimiting("agent-sensitive");

app.MapGet("/api/v1/printing/jobs/{id}", async (string id, PrintJobQueue queue, HttpContext context, CancellationToken cancellationToken) =>
    await queue.GetAsync(id, cancellationToken) is { } job
        ? Results.Ok(job.ToView())
        : Results.NotFound(new ApiError("JOB_NOT_FOUND", "Không tìm thấy tác vụ.", context.TraceIdentifier)));

app.Run();

static IResult BadRequest(string code, string message, HttpContext context) => Results.BadRequest(new ApiError(code, message, context.TraceIdentifier));

public partial class Program;
