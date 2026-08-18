using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging.Abstractions;
using Vimes.Agent.Contracts;
using Vimes.Agent.Ipc;
using Vimes.Agent.Persistence;
using Vimes.Agent.Signing;
using Xunit;

namespace Vimes.Agent.Tests;

public sealed class SigningJobTests : IDisposable
{
    private readonly string directory = Path.Combine(Path.GetTempPath(), "vimes-agent-tests", Guid.NewGuid().ToString("N"));

    [Fact]
    public async Task StoreEncryptsRequestAndResultAndRecoversPendingJob()
    {
        var path = Path.Combine(directory, "agent.db");
        var store = new SqliteSigningJobStore(path, new TestProtector());
        await store.InitializeAsync(CancellationToken.None);
        var job = NewJob("transaction-secret");
        job.Status = SigningJobStatus.Processing;
        job.Result = NewResult(job.Request.TransactionId);
        await store.SaveAsync(job, CancellationToken.None);

        var found = await store.FindByTransactionIdAsync("transaction-secret", CancellationToken.None);
        var pending = await store.RecoverPendingAsync(CancellationToken.None);
        var databaseText = Encoding.UTF8.GetString(await File.ReadAllBytesAsync(path));

        Assert.NotNull(found);
        Assert.Equal("signature-secret", found.Result!.SignatureBase64);
        Assert.Single(pending);
        Assert.DoesNotContain("hash-secret", databaseText);
        Assert.DoesNotContain("signature-secret", databaseText);
    }

    [Fact]
    public async Task RepeatedTransactionReturnsSameJob()
    {
        var queue = NewQueue();
        var request = NewRequest("transaction-duplicate");

        var first = await queue.EnqueueAsync(request, 7, CancellationToken.None);
        var second = await queue.EnqueueAsync(request, 7, CancellationToken.None);

        Assert.False(first.Duplicate);
        Assert.True(second.Duplicate);
        Assert.Equal(first.Job.Id, second.Job.Id);
    }

    [Fact]
    public async Task WorkerCompletesSuccessfulSigningJob()
    {
        var queue = NewQueue();
        var request = NewRequest("transaction-complete");
        var gateway = new FakeGateway(new IpcResponse("ipc", true, "OK", "Signed", JsonSerializer.SerializeToElement(NewResult(request.TransactionId))));
        var worker = new SigningJobWorker(queue, gateway, NullLogger<SigningJobWorker>.Instance);
        await worker.StartAsync(CancellationToken.None);
        var accepted = await queue.EnqueueAsync(request, 4, CancellationToken.None);

        var completed = await WaitForTerminalAsync(queue, accepted.Job.Id);
        await worker.StopAsync(CancellationToken.None);

        Assert.Equal(SigningJobStatus.Completed, completed.Status);
        Assert.Equal("signature-secret", completed.Result!.SignatureBase64);
        Assert.Equal(1, gateway.Calls);
    }

    [Fact]
    public async Task ExpiredJobNeverCallsDesktopGateway()
    {
        var queue = NewQueue();
        var gateway = new FakeGateway(new IpcResponse("ipc", true, "OK", "Signed"));
        var worker = new SigningJobWorker(queue, gateway, NullLogger<SigningJobWorker>.Instance);
        await worker.StartAsync(CancellationToken.None);
        var accepted = await queue.EnqueueAsync(NewRequest("transaction-expired", DateTimeOffset.UtcNow.AddSeconds(-1)), 4, CancellationToken.None);

        var expired = await WaitForTerminalAsync(queue, accepted.Job.Id);
        await worker.StopAsync(CancellationToken.None);

        Assert.Equal(SigningJobStatus.Expired, expired.Status);
        Assert.Equal(0, gateway.Calls);
    }

    [Fact]
    public async Task UserRejectionMapsToCancelled()
    {
        var queue = NewQueue();
        var gateway = new FakeGateway(new IpcResponse("ipc", false, "USER_CANCELLED", "Rejected"));
        var worker = new SigningJobWorker(queue, gateway, NullLogger<SigningJobWorker>.Instance);
        await worker.StartAsync(CancellationToken.None);
        var accepted = await queue.EnqueueAsync(NewRequest("transaction-cancelled"), 4, CancellationToken.None);

        var cancelled = await WaitForTerminalAsync(queue, accepted.Job.Id);
        await worker.StopAsync(CancellationToken.None);

        Assert.Equal(SigningJobStatus.Cancelled, cancelled.Status);
        Assert.Equal("USER_CANCELLED", cancelled.ErrorCode);
    }

    private SigningJobQueue NewQueue() => new(new SqliteSigningJobStore(Path.Combine(directory, $"{Guid.NewGuid():N}.db"), new TestProtector()));
    private static SigningJob NewJob(string transactionId) => new() { Id = Guid.NewGuid().ToString("N"), Request = NewRequest(transactionId), TargetSessionId = 1 };
    private static SignHashRequest NewRequest(string transactionId, DateTimeOffset? expiresAt = null) =>
        new(transactionId, "thumbprint", "hash-secret", "SHA256", "Medical record", "patient-001", expiresAt ?? DateTimeOffset.UtcNow.AddMinutes(5));
    private static SignHashResult NewResult(string transactionId) =>
        new(transactionId, "signature-secret", "certificate-secret", "thumbprint", "RSA-SHA256", DateTimeOffset.UtcNow);

    private static async Task<SigningJob> WaitForTerminalAsync(SigningJobQueue queue, string id)
    {
        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(5));
        while (!timeout.IsCancellationRequested)
        {
            var job = await queue.GetAsync(id, timeout.Token) ?? throw new InvalidOperationException();
            if (job.Status is SigningJobStatus.Completed or SigningJobStatus.Failed or SigningJobStatus.Cancelled or SigningJobStatus.Expired) return job;
            await Task.Delay(20, timeout.Token);
        }
        throw new TimeoutException("Signing job did not reach a terminal state.");
    }

    public void Dispose()
    {
        if (Directory.Exists(directory)) Directory.Delete(directory, true);
        GC.SuppressFinalize(this);
    }

    private sealed class FakeGateway(IpcResponse response) : IDesktopSigningGateway
    {
        public int Calls { get; private set; }
        public Task<IpcResponse> SignAsync(int sessionId, SignHashRequest request, CancellationToken cancellationToken) { Calls++; return Task.FromResult(response); }
    }

    private sealed class TestProtector : IPayloadProtector
    {
        public byte[] Protect(string value) => Encoding.UTF8.GetBytes(Convert.ToBase64String(Encoding.UTF8.GetBytes(value)));
        public string Unprotect(byte[] value) => Encoding.UTF8.GetString(Convert.FromBase64String(Encoding.UTF8.GetString(value)));
    }
}
