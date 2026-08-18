using System.Collections.Concurrent;
using System.ComponentModel;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Channels;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Vimes.Agent.Contracts;

namespace Vimes.Agent.Printing;

public interface IRawPrinter
{
    IReadOnlyList<string> ListPrinters();
    void Print(string printer, string data);
}

public sealed class PrintJob
{
    public required string Id { get; init; }
    public required string Printer { get; init; }
    public required string Data { get; init; }
    public required int Copies { get; init; }
    public string? IdempotencyKey { get; init; }
    public AgentJobStatus Status { get; set; } = AgentJobStatus.Queued;
    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public PrintJobView ToView() => new(Id, Status, Printer, Copies, CreatedAt, UpdatedAt, ErrorCode, ErrorMessage);
}

public interface IPrintJobStore
{
    Task InitializeAsync(CancellationToken cancellationToken);
    Task SaveAsync(PrintJob job, CancellationToken cancellationToken);
    Task UpdateAsync(PrintJob job, CancellationToken cancellationToken);
    Task<PrintJob?> GetAsync(string id, CancellationToken cancellationToken);
    Task<PrintJob?> FindByIdempotencyKeyAsync(string key, CancellationToken cancellationToken);
    Task<IReadOnlyList<PrintJob>> RecoverPendingAsync(CancellationToken cancellationToken);
}

public sealed class InMemoryPrintJobStore : IPrintJobStore
{
    private readonly ConcurrentDictionary<string, PrintJob> jobs = new();
    public Task InitializeAsync(CancellationToken cancellationToken) => Task.CompletedTask;
    public Task SaveAsync(PrintJob job, CancellationToken cancellationToken) { jobs[job.Id] = job; return Task.CompletedTask; }
    public Task UpdateAsync(PrintJob job, CancellationToken cancellationToken) { jobs[job.Id] = job; return Task.CompletedTask; }
    public Task<PrintJob?> GetAsync(string id, CancellationToken cancellationToken) => Task.FromResult(jobs.TryGetValue(id, out var job) ? job : null);
    public Task<PrintJob?> FindByIdempotencyKeyAsync(string key, CancellationToken cancellationToken) => Task.FromResult(jobs.Values.FirstOrDefault(job => job.IdempotencyKey == key));
    public Task<IReadOnlyList<PrintJob>> RecoverPendingAsync(CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<PrintJob>>(jobs.Values.Where(job => job.Status is AgentJobStatus.Queued or AgentJobStatus.Processing).ToArray());
}

public sealed class PrintJobQueue(IPrintJobStore? jobStore = null)
{
    private readonly IPrintJobStore store = jobStore ?? new InMemoryPrintJobStore();
    private readonly Channel<PrintJob> queue = Channel.CreateBounded<PrintJob>(new BoundedChannelOptions(1_000) { FullMode = BoundedChannelFullMode.Wait });
    private readonly ConcurrentDictionary<string, PrintJob> jobs = new();
    private readonly ConcurrentDictionary<string, string> idempotency = new(StringComparer.Ordinal);
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
                job.Status = AgentJobStatus.Queued;
                job.UpdatedAt = DateTimeOffset.UtcNow;
                jobs[job.Id] = job;
                if (!string.IsNullOrWhiteSpace(job.IdempotencyKey)) idempotency[job.IdempotencyKey] = job.Id;
                await queue.Writer.WriteAsync(job, cancellationToken);
            }
            initialized = true;
        }
        finally { initializationLock.Release(); }
    }

    public async Task<(PrintJob Job, bool Duplicate)> EnqueueAsync(PrintJobRequest request, CancellationToken cancellationToken)
    {
        await InitializeAsync(cancellationToken);
        if (!string.IsNullOrWhiteSpace(request.IdempotencyKey) && idempotency.TryGetValue(request.IdempotencyKey, out var existingId) && jobs.TryGetValue(existingId, out var existing))
            return (existing, true);
        if (!string.IsNullOrWhiteSpace(request.IdempotencyKey))
        {
            var persisted = await store.FindByIdempotencyKeyAsync(request.IdempotencyKey, cancellationToken);
            if (persisted is not null) { jobs[persisted.Id] = persisted; idempotency[request.IdempotencyKey] = persisted.Id; return (persisted, true); }
        }

        var job = new PrintJob { Id = Guid.NewGuid().ToString("N"), Printer = request.Printer.Trim(), Data = request.Data, Copies = request.Copies, IdempotencyKey = request.IdempotencyKey };
        jobs[job.Id] = job;
        if (!string.IsNullOrWhiteSpace(job.IdempotencyKey) && !idempotency.TryAdd(job.IdempotencyKey, job.Id))
        {
            jobs.TryRemove(job.Id, out _);
            var winnerId = idempotency[job.IdempotencyKey];
            return (jobs[winnerId], true);
        }
        await store.SaveAsync(job, cancellationToken);
        await queue.Writer.WriteAsync(job, cancellationToken);
        return (job, false);
    }

    public async Task<PrintJob?> GetAsync(string id, CancellationToken cancellationToken)
    {
        await InitializeAsync(cancellationToken);
        return jobs.TryGetValue(id, out var job) ? job : await store.GetAsync(id, cancellationToken);
    }
    public Task UpdateAsync(PrintJob job, CancellationToken cancellationToken) => store.UpdateAsync(job, cancellationToken);
    public IAsyncEnumerable<PrintJob> ReadAllAsync(CancellationToken cancellationToken) => queue.Reader.ReadAllAsync(cancellationToken);
}

public sealed class PrintWorker(PrintJobQueue queue, IRawPrinter printer, ILogger<PrintWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await queue.InitializeAsync(stoppingToken);
        await foreach (var job in queue.ReadAllAsync(stoppingToken))
        {
            try
            {
                job.Status = AgentJobStatus.Processing;
                job.UpdatedAt = DateTimeOffset.UtcNow;
                for (var copy = 0; copy < job.Copies; copy++) printer.Print(job.Printer, job.Data);
                job.Status = AgentJobStatus.Completed;
            }
            catch (Exception exception)
            {
                job.Status = AgentJobStatus.Failed;
                job.ErrorCode = "PRINT_FAILED";
                job.ErrorMessage = exception.Message;
                logger.LogError(exception, "Print job {JobId} failed", job.Id);
            }
            finally { job.UpdatedAt = DateTimeOffset.UtcNow; await queue.UpdateAsync(job, stoppingToken); }
        }
    }
}

public sealed class Win32RawPrinter : IRawPrinter
{
    private const int PrinterEnumLocal = 2;
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)] private struct PrinterInfo4 { public nint PrinterName; public nint ServerName; public int Attributes; }
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)] private struct DocInfo1 { [MarshalAs(UnmanagedType.LPWStr)] public string DocumentName; [MarshalAs(UnmanagedType.LPWStr)] public string? OutputFile; [MarshalAs(UnmanagedType.LPWStr)] public string DataType; }
    [DllImport("winspool.drv", CharSet = CharSet.Unicode, SetLastError = true)] private static extern bool EnumPrinters(int flags, string? name, int level, IntPtr buffer, int size, out int needed, out int returned);
    [DllImport("winspool.drv", CharSet = CharSet.Unicode, SetLastError = true)] private static extern bool OpenPrinter(string name, out nint handle, IntPtr defaults);
    [DllImport("winspool.drv", SetLastError = true)] private static extern bool ClosePrinter(nint handle);
    [DllImport("winspool.drv", CharSet = CharSet.Unicode, SetLastError = true)] private static extern int StartDocPrinter(nint handle, int level, ref DocInfo1 docInfo);
    [DllImport("winspool.drv", SetLastError = true)] private static extern bool EndDocPrinter(nint handle);
    [DllImport("winspool.drv", SetLastError = true)] private static extern bool StartPagePrinter(nint handle);
    [DllImport("winspool.drv", SetLastError = true)] private static extern bool EndPagePrinter(nint handle);
    [DllImport("winspool.drv", SetLastError = true)] private static extern bool WritePrinter(nint handle, byte[] data, int count, out int written);

    public IReadOnlyList<string> ListPrinters()
    {
        EnumPrinters(PrinterEnumLocal, null, 4, IntPtr.Zero, 0, out var needed, out _);
        if (needed <= 0) return [];
        var buffer = Marshal.AllocHGlobal(needed);
        try
        {
            if (!EnumPrinters(PrinterEnumLocal, null, 4, buffer, needed, out _, out var returned)) throw LastWin32Error("Không thể đọc danh sách máy in");
            var size = Marshal.SizeOf<PrinterInfo4>();
            return Enumerable.Range(0, returned).Select(index => Marshal.PtrToStructure<PrinterInfo4>(buffer + index * size))
                .Select(info => Marshal.PtrToStringUni(info.PrinterName) ?? string.Empty).Where(name => name.Length > 0).OrderBy(name => name).ToArray();
        }
        finally { Marshal.FreeHGlobal(buffer); }
    }

    public void Print(string printer, string data)
    {
        if (!OpenPrinter(printer, out var handle, IntPtr.Zero)) throw LastWin32Error($"Không mở được máy in '{printer}'");
        var documentStarted = false;
        var pageStarted = false;
        try
        {
            var docInfo = new DocInfo1 { DocumentName = "VIMES Workstation Agent", OutputFile = null, DataType = "RAW" };
            if (StartDocPrinter(handle, 1, ref docInfo) == 0) throw LastWin32Error("Không tạo được print job");
            documentStarted = true;
            if (!StartPagePrinter(handle)) throw LastWin32Error("Không bắt đầu được trang in");
            pageStarted = true;
            var bytes = Encoding.UTF8.GetBytes(data);
            if (!WritePrinter(handle, bytes, bytes.Length, out var written) || written != bytes.Length) throw LastWin32Error("Không ghi đủ dữ liệu RAW tới máy in");
        }
        finally
        {
            if (pageStarted) EndPagePrinter(handle);
            if (documentStarted) EndDocPrinter(handle);
            ClosePrinter(handle);
        }
    }

    private static Win32Exception LastWin32Error(string message) => new(Marshal.GetLastWin32Error(), message);
}
