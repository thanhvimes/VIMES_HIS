using System.Collections.Concurrent;
using System.Text.Json;
using System.Threading.Channels;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Vimes.Agent.Contracts;
using Vimes.Agent.Ipc;

namespace Vimes.Agent.Signing;

public sealed class SigningJob
{
    public required string Id { get; init; }
    public required SignHashRequest Request { get; init; }
    public required int TargetSessionId { get; init; }
    public SigningJobStatus Status { get; set; } = SigningJobStatus.Queued;
    public SignHashResult? Result { get; set; }
    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public SigningJobView ToView() => new(Id, Request.TransactionId, Status, CreatedAt, UpdatedAt, Request.ExpiresAt, Result, ErrorCode, ErrorMessage);
}

public interface ISigningJobStore
{
    Task InitializeAsync(CancellationToken cancellationToken);
    Task SaveAsync(SigningJob job, CancellationToken cancellationToken);
    Task UpdateAsync(SigningJob job, CancellationToken cancellationToken);
    Task<SigningJob?> GetAsync(string id, CancellationToken cancellationToken);
    Task<SigningJob?> FindByTransactionIdAsync(string transactionId, CancellationToken cancellationToken);
    Task<IReadOnlyList<SigningJob>> RecoverPendingAsync(CancellationToken cancellationToken);
}

public interface IDesktopSigningGateway
{
    Task<IpcResponse> SignAsync(int sessionId, SignHashRequest request, CancellationToken cancellationToken);
}

public sealed class IpcDesktopSigningGateway(DesktopAgentClient client) : IDesktopSigningGateway
{
    public Task<IpcResponse> SignAsync(int sessionId, SignHashRequest request, CancellationToken cancellationToken) =>
        client.SendAsync(sessionId, "signing.hash", request, TimeSpan.FromMinutes(2), cancellationToken);
}

public sealed class SigningJobQueue(ISigningJobStore store)
{
    private readonly Channel<SigningJob> queue = Channel.CreateBounded<SigningJob>(new BoundedChannelOptions(1_000) { FullMode = BoundedChannelFullMode.Wait });
    private readonly ConcurrentDictionary<string, SigningJob> jobs = new();
    private readonly ConcurrentDictionary<string, string> transactions = new(StringComparer.Ordinal);
    private readonly SemaphoreSlim initializationLock = new(1, 1);
    private bool initialized;

    public async Task InitializeAsync(CancellationToken cancellationToken)
    {
        if (initialized) return;
        await initializationLock.WaitAsync(cancellationToken);
        try
        {
            if (initialized) return;
            await store.InitializeAsync(cancellationToken);
            foreach (var job in await store.RecoverPendingAsync(cancellationToken))
            {
                job.Status = SigningJobStatus.Queued;
                job.UpdatedAt = DateTimeOffset.UtcNow;
                await store.UpdateAsync(job, cancellationToken);
                jobs[job.Id] = job;
                transactions[job.Request.TransactionId] = job.Id;
                await queue.Writer.WriteAsync(job, cancellationToken);
            }
            initialized = true;
        }
        finally { initializationLock.Release(); }
    }

    public async Task<(SigningJob Job, bool Duplicate)> EnqueueAsync(SignHashRequest request, int targetSessionId, CancellationToken cancellationToken)
    {
        await InitializeAsync(cancellationToken);
        if (transactions.TryGetValue(request.TransactionId, out var existingId) && jobs.TryGetValue(existingId, out var existing)) return (existing, true);
        var persisted = await store.FindByTransactionIdAsync(request.TransactionId, cancellationToken);
        if (persisted is not null)
        {
            jobs[persisted.Id] = persisted;
            transactions[request.TransactionId] = persisted.Id;
            return (persisted, true);
        }
        var job = new SigningJob { Id = Guid.NewGuid().ToString("N"), Request = request, TargetSessionId = targetSessionId };
        if (!transactions.TryAdd(request.TransactionId, job.Id)) return (jobs[transactions[request.TransactionId]], true);
        jobs[job.Id] = job;
        try { await store.SaveAsync(job, cancellationToken); }
        catch { jobs.TryRemove(job.Id, out _); transactions.TryRemove(request.TransactionId, out _); throw; }
        await queue.Writer.WriteAsync(job, cancellationToken);
        return (job, false);
    }

    public async Task<SigningJob?> GetAsync(string id, CancellationToken cancellationToken)
    {
        await InitializeAsync(cancellationToken);
        return jobs.TryGetValue(id, out var job) ? job : await store.GetAsync(id, cancellationToken);
    }

    public async Task<bool> CancelAsync(string id, CancellationToken cancellationToken)
    {
        var job = await GetAsync(id, cancellationToken);
        if (job is null || job.Status != SigningJobStatus.Queued) return false;
        job.Status = SigningJobStatus.Cancelled;
        job.UpdatedAt = DateTimeOffset.UtcNow;
        await store.UpdateAsync(job, cancellationToken);
        return true;
    }

    public Task UpdateAsync(SigningJob job, CancellationToken cancellationToken) => store.UpdateAsync(job, cancellationToken);
    public IAsyncEnumerable<SigningJob> ReadAllAsync(CancellationToken cancellationToken) => queue.Reader.ReadAllAsync(cancellationToken);
}

public sealed class SigningJobWorker(SigningJobQueue queue, IDesktopSigningGateway gateway, ILogger<SigningJobWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await queue.InitializeAsync(stoppingToken);
        await foreach (var job in queue.ReadAllAsync(stoppingToken))
        {
            if (job.Status == SigningJobStatus.Cancelled) continue;
            if (job.Request.ExpiresAt <= DateTimeOffset.UtcNow)
            {
                job.Status = SigningJobStatus.Expired;
                job.ErrorCode = "SIGNING_REQUEST_EXPIRED";
                job.ErrorMessage = "Yêu cầu ký đã hết hạn.";
                await PersistAsync(job, stoppingToken);
                continue;
            }
            try
            {
                job.Status = SigningJobStatus.AwaitingUser;
                await PersistAsync(job, stoppingToken);
                var response = await gateway.SignAsync(job.TargetSessionId, job.Request, stoppingToken);
                if (response.Success && response.Payload is { } payload)
                {
                    job.Result = payload.Deserialize<SignHashResult>(new JsonSerializerOptions(JsonSerializerDefaults.Web))
                        ?? throw new InvalidDataException("Desktop Companion trả về kết quả ký không hợp lệ.");
                    job.Status = SigningJobStatus.Completed;
                }
                else
                {
                    job.Status = response.Code == "USER_CANCELLED" ? SigningJobStatus.Cancelled : SigningJobStatus.Failed;
                    job.ErrorCode = response.Code;
                    job.ErrorMessage = response.Message;
                }
            }
            catch (Exception exception) when (exception is TimeoutException or IOException or UnauthorizedAccessException or JsonException)
            {
                job.Status = SigningJobStatus.Failed;
                job.ErrorCode = "DESKTOP_COMPANION_UNAVAILABLE";
                job.ErrorMessage = exception.Message;
                logger.LogError(exception, "Signing job {JobId} failed", job.Id);
            }
            finally { await PersistAsync(job, stoppingToken); }
        }
    }

    private Task PersistAsync(SigningJob job, CancellationToken cancellationToken)
    {
        job.UpdatedAt = DateTimeOffset.UtcNow;
        return queue.UpdateAsync(job, cancellationToken);
    }
}
