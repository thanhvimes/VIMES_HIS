import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const enabled = Boolean(process.env.REDIS_URL);
const connection = enabled ? new IORedis(process.env.REDIS_URL!, { maxRetriesPerRequest: null }) : undefined;

export const templatePreviewQueue = enabled && connection
    ? new Queue('template-studio-preview', { connection, defaultJobOptions: { removeOnComplete: 1000, removeOnFail: 5000, attempts: 3, backoff: { type: 'exponential', delay: 1000 } } })
    : null;
export const templatePreviewDlq = enabled && connection
    ? new Queue('template-studio-preview-dlq', { connection, defaultJobOptions: { removeOnComplete: 1000, removeOnFail: 5000 } })
    : null;
export const documentProductionQueue = enabled && connection
    ? new Queue('document-production', { connection, defaultJobOptions: { removeOnComplete: 2000, removeOnFail: 10000, attempts: 4, backoff: { type: 'exponential', delay: 1500 } } })
    : null;
export const documentBatchQueue = enabled && connection
    ? new Queue('document-batch', { connection, defaultJobOptions: { removeOnComplete: 1000, removeOnFail: 5000, attempts: 2, backoff: { type: 'fixed', delay: 3000 } } })
    : null;

export async function enqueueProductionDocument<T extends Record<string, unknown>>(payload: T) {
    if (!documentProductionQueue) throw Object.assign(new Error('Production queue is not enabled; configure REDIS_URL'), { status: 503 });
    const job = await documentProductionQueue.add('production-render', payload, { priority: 1 });
    return { jobId: job.id, queue: 'document-production', priority: 1 };
}

export async function enqueueBatchDocument<T extends Record<string, unknown>>(payload: T) {
    if (!documentBatchQueue) throw Object.assign(new Error('Batch queue is not enabled; configure REDIS_URL'), { status: 503 });
    const job = await documentBatchQueue.add('batch-render', payload, { priority: 10 });
    return { jobId: job.id, queue: 'document-batch', priority: 10 };
}

export async function enqueueTemplatePreview(payload: { versionId: number; format: 'docx' | 'pdf'; data?: Record<string, unknown>; actor: string; idempotencyKey?: string }) {
    if (!templatePreviewQueue) throw Object.assign(new Error('Render queue is not enabled; configure REDIS_URL'), { status: 503 });
    const counts = await templatePreviewQueue.getJobCounts('waiting', 'active', 'delayed');
    const globalLimit = Number(process.env.TEMPLATE_PREVIEW_GLOBAL_LIMIT || 1000);
    if (Object.values(counts).reduce((sum, value) => sum + value, 0) >= globalLimit) throw Object.assign(new Error('Preview queue is temporarily full'), { status: 429 });
    const jobs = await templatePreviewQueue.getJobs(['waiting', 'active', 'delayed'], 0, Math.min(globalLimit, 2000));
    const userLimit = Number(process.env.TEMPLATE_PREVIEW_USER_LIMIT || 20);
    if (jobs.filter(job => job.data?.actor === payload.actor).length >= userLimit) throw Object.assign(new Error('Preview job limit for this user has been reached'), { status: 429 });
    const jobId = payload.idempotencyKey ? `preview-${payload.idempotencyKey.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 80)}` : undefined;
    if (jobId) { const existing = await templatePreviewQueue.getJob(jobId); if (existing) return { jobId: existing.id, queue: 'template-studio-preview', duplicate: true }; }
    const job = await templatePreviewQueue.add('preview', payload, jobId ? { jobId } : undefined);
    return { jobId: job.id, queue: 'template-studio-preview' };
}

export async function getTemplatePreviewJob(jobId: string) {
    if (!templatePreviewQueue) throw Object.assign(new Error('Render queue is not enabled; configure REDIS_URL'), { status: 503 });
    const job = await templatePreviewQueue.getJob(jobId);
    if (!job) throw Object.assign(new Error('Preview job not found'), { status: 404 });
    const state = await job.getState();
    return { jobId: job.id, state, progress: job.progress, result: job.returnvalue || null, failedReason: job.failedReason || null, attemptsMade: job.attemptsMade };
}

export async function listTemplatePreviewDlq(limit = 50) {
    if (!templatePreviewDlq) throw Object.assign(new Error('Render queue is not enabled; configure REDIS_URL'), { status: 503 });
    const jobs = await templatePreviewDlq.getJobs(['waiting', 'delayed', 'completed', 'failed'], 0, Math.max(1, Math.min(limit, 200)) - 1);
    return jobs.map(job => ({ jobId: job.id, data: job.data, state: 'dead-letter', createdAt: job.timestamp, failedReason: job.data?.error }));
}

export async function retryTemplatePreviewDlq(jobId: string) {
    if (!templatePreviewDlq || !templatePreviewQueue) throw Object.assign(new Error('Render queue is not enabled; configure REDIS_URL'), { status: 503 });
    const job = await templatePreviewDlq.getJob(jobId);
    if (!job) throw Object.assign(new Error('Dead-letter job not found'), { status: 404 });
    const queued = await templatePreviewQueue.add('preview-retry', job.data.data);
    await job.remove();
    return { jobId: queued.id, queue: 'template-studio-preview' };
}

export async function getTemplatePreviewQueueMetrics() {
    if (!templatePreviewQueue || !templatePreviewDlq) throw Object.assign(new Error('Render queue is not enabled; configure REDIS_URL'), { status: 503 });
    const [main, dlq, production, batch] = await Promise.all([
        templatePreviewQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed'),
        templatePreviewDlq.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed'),
        documentProductionQueue?.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed'),
        documentBatchQueue?.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed')
    ]);
    const waiting = Number(main.waiting || 0); const failed = Number(main.failed || 0); const dlqWaiting = Number(dlq.waiting || 0);
    const waitingJobs = await templatePreviewQueue.getJobs(['waiting'], 0, Math.min(Math.max(waiting, 1), 2000) - 1);
    const waitMs = waitingJobs.map(job => Math.max(0, Date.now() - (job.timestamp || Date.now())));
    const queueWait = { samples: waitMs.length, avgMs: waitMs.length ? Math.round(waitMs.reduce((a, b) => a + b, 0) / waitMs.length) : 0, maxMs: waitMs.length ? Math.max(...waitMs) : 0 };
    return { queue: 'template-studio-preview', counts: main, queueWait, deadLetter: { queue: 'template-studio-preview-dlq', counts: dlq }, production: production || null, batch: batch || null, alerts: { backlogExceeded: waiting > Number(process.env.TEMPLATE_ALERT_QUEUE_WAITING || 500), failedExceeded: failed > Number(process.env.TEMPLATE_ALERT_QUEUE_FAILED || 20), queueWaitExceeded: queueWait.maxMs > Number(process.env.TEMPLATE_ALERT_QUEUE_WAIT_MS || 300000), deadLetterActive: dlqWaiting > 0 }, collectedAt: new Date().toISOString() };
}
