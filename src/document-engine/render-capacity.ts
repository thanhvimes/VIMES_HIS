type PendingTask<T> = {
    run: () => Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: unknown) => void;
    timer: NodeJS.Timeout;
};

const LATENCY_BUCKETS_MS = [100, 250, 500, 1_000, 2_000, 5_000, 10_000, 30_000];

export class RenderCapacity {
    private active = 0;
    private readonly queue: PendingTask<unknown>[] = [];
    private total = 0;
    private succeeded = 0;
    private failed = 0;
    private rejected = 0;
    private totalDurationMs = 0;
    private readonly latencyBuckets = new Map(LATENCY_BUCKETS_MS.map(bucket => [bucket, 0]));

    constructor(
        readonly concurrency: number,
        readonly maxQueueSize: number,
        readonly maxQueueWaitMs: number
    ) {
        if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 128) throw new Error('Invalid document render concurrency');
        if (!Number.isInteger(maxQueueSize) || maxQueueSize < 0 || maxQueueSize > 100_000) throw new Error('Invalid document render queue size');
    }

    execute<T>(run: () => Promise<T>): Promise<T> {
        if (this.active < this.concurrency) return this.start(run);
        if (this.queue.length >= this.maxQueueSize) {
            this.rejected += 1;
            return Promise.reject(Object.assign(new Error('Document render queue is full'), { status: 503, retryAfterSeconds: 2 }));
        }
        return new Promise<T>((resolve, reject) => {
            const task: PendingTask<T> = {
                run,
                resolve,
                reject,
                timer: setTimeout(() => {
                    const index = this.queue.indexOf(task as PendingTask<unknown>);
                    if (index >= 0) this.queue.splice(index, 1);
                    this.rejected += 1;
                    reject(Object.assign(new Error('Document render queue wait timed out'), { status: 503, retryAfterSeconds: 2 }));
                }, this.maxQueueWaitMs)
            };
            this.queue.push(task as PendingTask<unknown>);
        });
    }

    snapshot() {
        return {
            active: this.active,
            queued: this.queue.length,
            concurrency: this.concurrency,
            maxQueueSize: this.maxQueueSize,
            total: this.total,
            succeeded: this.succeeded,
            failed: this.failed,
            rejected: this.rejected,
            averageDurationMs: this.total ? Math.round(this.totalDurationMs / this.total) : 0,
            latencyBuckets: Object.fromEntries([...this.latencyBuckets].map(([upperBoundMs, count]) => [`le_${upperBoundMs}`, count]))
        };
    }

    private async start<T>(run: () => Promise<T>): Promise<T> {
        this.active += 1;
        this.total += 1;
        const startedAt = Date.now();
        try {
            const result = await run();
            this.succeeded += 1;
            return result;
        } catch (error) {
            this.failed += 1;
            throw error;
        } finally {
            const duration = Date.now() - startedAt;
            this.totalDurationMs += duration;
            for (const bucket of LATENCY_BUCKETS_MS) if (duration <= bucket) this.latencyBuckets.set(bucket, (this.latencyBuckets.get(bucket) || 0) + 1);
            this.active -= 1;
            this.drain();
        }
    }

    private drain(): void {
        while (this.active < this.concurrency && this.queue.length) {
            const task = this.queue.shift()!;
            clearTimeout(task.timer);
            this.start(task.run).then(task.resolve, task.reject);
        }
    }
}

export const renderCapacity = new RenderCapacity(
    Number(process.env.DOCUMENT_RENDER_CONCURRENCY || 8),
    Number(process.env.DOCUMENT_RENDER_QUEUE_SIZE || 200),
    Number(process.env.DOCUMENT_RENDER_QUEUE_WAIT_MS || 15_000)
);
