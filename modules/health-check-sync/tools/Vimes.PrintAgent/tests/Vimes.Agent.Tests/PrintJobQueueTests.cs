using Microsoft.Extensions.Logging.Abstractions;
using Vimes.Agent.Contracts;
using Vimes.Agent.Printing;
using Xunit;

namespace Vimes.Agent.Tests;

public sealed class PrintJobQueueTests
{
    private sealed class FakeRawPrinter : IRawPrinter
    {
        public List<(string Printer, string Data)> PrintedLogs { get; } = [];
        public bool ShouldThrow { get; set; }

        public IReadOnlyList<string> ListPrinters() => ["Zebra ZD420", "Xprinter XP-350B", "Microsoft Print to PDF"];

        public void Print(string printer, string data)
        {
            if (ShouldThrow) throw new InvalidOperationException($"Lỗi kết nối máy in '{printer}'. Máy in đang ngoại tuyến.");
            PrintedLogs.Add((printer, data));
        }
    }

    [Fact]
    public async Task RepeatedIdempotencyKeyReturnsSameJob()
    {
        var queue = new PrintJobQueue();
        var request = new PrintJobRequest("Zebra", "^XA^XZ", 1, "print-001");

        var first = await queue.EnqueueAsync(request, CancellationToken.None);
        var second = await queue.EnqueueAsync(request, CancellationToken.None);

        Assert.False(first.Duplicate);
        Assert.True(second.Duplicate);
        Assert.Equal(first.Job.Id, second.Job.Id);
    }

    [Fact]
    public async Task DifferentIdempotencyKeysCreateDifferentJobs()
    {
        var queue = new PrintJobQueue();
        var first = await queue.EnqueueAsync(new PrintJobRequest("Zebra", "^XA^XZ", 1, "print-001"), CancellationToken.None);
        var second = await queue.EnqueueAsync(new PrintJobRequest("Zebra", "^XA^XZ", 1, "print-002"), CancellationToken.None);

        Assert.NotEqual(first.Job.Id, second.Job.Id);
    }

    [Fact]
    public async Task JobViewNeverExposesRawPrintData()
    {
        var queue = new PrintJobQueue();
        var result = await queue.EnqueueAsync(new PrintJobRequest("Zebra", "SECRET-ZPL", 2, "print-003"), CancellationToken.None);

        var view = result.Job.ToView();

        Assert.Equal("Zebra", view.Printer);
        Assert.Equal(2, view.Copies);
        Assert.DoesNotContain("SECRET-ZPL", System.Text.Json.JsonSerializer.Serialize(view));
    }

    [Fact]
    public async Task ZplPrintJobExecutesSuccessfullyThroughWorker()
    {
        var store = new InMemoryPrintJobStore();
        var queue = new PrintJobQueue(store);
        var fakePrinter = new FakeRawPrinter();
        var worker = new PrintWorker(queue, fakePrinter, NullLogger<PrintWorker>.Instance);

        using var cts = new CancellationTokenSource();
        var workerTask = worker.StartAsync(cts.Token);

        const string zplData = "^XA^PW400^LL240^FO20,20^A0N,25,25^FDVIMES HIS - NGUYEN VAN A^FS^FO20,60^BY2,2,60^BCN,60,Y,N,N^FD25316168^FS^XZ";
        var request = new PrintJobRequest("Zebra ZD420", zplData, 1, "zpl-test-01");

        var (job, isDuplicate) = await queue.EnqueueAsync(request, CancellationToken.None);
        Assert.False(isDuplicate);

        // Chờ worker xử lý xong job
        var deadline = DateTime.UtcNow.AddSeconds(3);
        while (job.Status != AgentJobStatus.Completed && DateTime.UtcNow < deadline)
        {
            await Task.Delay(50);
        }

        Assert.Equal(AgentJobStatus.Completed, job.Status);
        Assert.Single(fakePrinter.PrintedLogs);
        Assert.Equal("Zebra ZD420", fakePrinter.PrintedLogs[0].Printer);
        Assert.Equal(zplData, fakePrinter.PrintedLogs[0].Data);

        cts.Cancel();
        await workerTask;
    }

    [Fact]
    public async Task ZplPrintJobWithMultipleCopiesPrintsExactCopies()
    {
        var queue = new PrintJobQueue();
        var fakePrinter = new FakeRawPrinter();
        var worker = new PrintWorker(queue, fakePrinter, NullLogger<PrintWorker>.Instance);

        using var cts = new CancellationTokenSource();
        var workerTask = worker.StartAsync(cts.Token);

        const string zplTemplate = "^XA^FO50,50^ADN,36,20^FDBARCODE TEST^FS^XZ";
        var request = new PrintJobRequest("Xprinter XP-350B", zplTemplate, 3, "zpl-copies-01");

        var (job, _) = await queue.EnqueueAsync(request, CancellationToken.None);

        var deadline = DateTime.UtcNow.AddSeconds(3);
        while (job.Status != AgentJobStatus.Completed && DateTime.UtcNow < deadline)
        {
            await Task.Delay(50);
        }

        Assert.Equal(AgentJobStatus.Completed, job.Status);
        Assert.Equal(3, fakePrinter.PrintedLogs.Count);
        Assert.All(fakePrinter.PrintedLogs, log =>
        {
            Assert.Equal("Xprinter XP-350B", log.Printer);
            Assert.Equal(zplTemplate, log.Data);
        });

        cts.Cancel();
        await workerTask;
    }

    [Fact]
    public async Task ZplPrintJobHandlesPrinterErrorGracefully()
    {
        var queue = new PrintJobQueue();
        var fakePrinter = new FakeRawPrinter { ShouldThrow = true };
        var worker = new PrintWorker(queue, fakePrinter, NullLogger<PrintWorker>.Instance);

        using var cts = new CancellationTokenSource();
        var workerTask = worker.StartAsync(cts.Token);

        var request = new PrintJobRequest("Offline Printer", "^XA^XZ", 1, "zpl-fail-01");
        var (job, _) = await queue.EnqueueAsync(request, CancellationToken.None);

        var deadline = DateTime.UtcNow.AddSeconds(3);
        while (job.Status != AgentJobStatus.Failed && DateTime.UtcNow < deadline)
        {
            await Task.Delay(50);
        }

        Assert.Equal(AgentJobStatus.Failed, job.Status);
        Assert.Equal("PRINT_FAILED", job.ErrorCode);
        Assert.Contains("Lỗi kết nối máy in", job.ErrorMessage);

        cts.Cancel();
        await workerTask;
    }

    [Fact]
    public void Win32RawPrinterListsPrintersWithoutException()
    {
        var printer = new Win32RawPrinter();
        var list = printer.ListPrinters();
        Assert.NotNull(list);
    }
}
