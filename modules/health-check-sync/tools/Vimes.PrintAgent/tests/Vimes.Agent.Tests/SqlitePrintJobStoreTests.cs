using System.Text;
using Vimes.Agent.Contracts;
using Vimes.Agent.Persistence;
using Vimes.Agent.Printing;
using Xunit;

namespace Vimes.Agent.Tests;

public sealed class SqlitePrintJobStoreTests : IDisposable
{
    private readonly string directory = Path.Combine(Path.GetTempPath(), "vimes-agent-tests", Guid.NewGuid().ToString("N"));

    [Fact]
    public void DpapiMachineProtectorRoundTripsWithoutPlaintext()
    {
        var protector = new DpapiMachinePayloadProtector();

        var encrypted = protector.Protect("SENSITIVE-PATIENT-DATA");

        Assert.Equal("SENSITIVE-PATIENT-DATA", protector.Unprotect(encrypted));
        Assert.DoesNotContain("SENSITIVE-PATIENT-DATA", Encoding.UTF8.GetString(encrypted));
    }

    [Fact]
    public async Task PersistsAndRecoversPendingJobWithoutPlaintextPayload()
    {
        var path = Path.Combine(directory, "agent.db");
        var store = new SqlitePrintJobStore(path, new TestProtector());
        await store.InitializeAsync(CancellationToken.None);
        var job = new PrintJob
        {
            Id = "job-001", Printer = "Zebra", Data = "PATIENT-SECRET-ZPL", Copies = 1,
            IdempotencyKey = "idempotency-001", Status = AgentJobStatus.Processing
        };
        await store.SaveAsync(job, CancellationToken.None);

        var recovered = await store.RecoverPendingAsync(CancellationToken.None);
        var databaseBytes = await File.ReadAllBytesAsync(path);

        Assert.Single(recovered);
        Assert.Equal("PATIENT-SECRET-ZPL", recovered[0].Data);
        Assert.DoesNotContain("PATIENT-SECRET-ZPL", Encoding.UTF8.GetString(databaseBytes));
    }

    [Fact]
    public async Task FindsPersistedJobByIdempotencyKey()
    {
        var store = new SqlitePrintJobStore(Path.Combine(directory, "agent.db"), new TestProtector());
        await store.InitializeAsync(CancellationToken.None);
        await store.SaveAsync(new PrintJob { Id = "job-002", Printer = "Zebra", Data = "^XA^XZ", Copies = 1, IdempotencyKey = "same-request" }, CancellationToken.None);

        var found = await store.FindByIdempotencyKeyAsync("same-request", CancellationToken.None);

        Assert.NotNull(found);
        Assert.Equal("job-002", found.Id);
    }

    public void Dispose()
    {
        if (Directory.Exists(directory)) Directory.Delete(directory, true);
        GC.SuppressFinalize(this);
    }

    private sealed class TestProtector : IPayloadProtector
    {
        public byte[] Protect(string value) => Encoding.UTF8.GetBytes(Convert.ToBase64String(Encoding.UTF8.GetBytes(value)));
        public string Unprotect(byte[] value) => Encoding.UTF8.GetString(Convert.FromBase64String(Encoding.UTF8.GetString(value)));
    }
}
