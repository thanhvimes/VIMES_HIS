import 'dotenv/config';
import { UnrecoverableError, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { templateStudioService } from '../template-studio/template-studio.service';
import { documentBatchQueue, documentProductionQueue, templatePreviewDlq } from '../template-studio/render-queue';

if (!process.env.REDIS_URL) throw new Error('REDIS_URL is required');
const connection = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
const worker = new Worker('template-studio-preview', async job => {
    await job.updateProgress(10);
    try {
        const benchmarkData = job.data.benchmark
            ? (await templateStudioService.repository.listTestCases(job.data.versionId)).find(item => item.testType === 'NORMAL' && item.isRequired)?.inputData
            : undefined;
        const result = await templateStudioService.preview(job.data.versionId, job.data.format, benchmarkData || job.data.data);
        const artifactKey = `queue-previews/v${job.data.versionId}/${job.id}.${job.data.format}`;
        await templateStudioService.storage.put(artifactKey, result.content);
        await job.updateProgress(100);
        return { filename: result.filename, sha256: result.sha256, size: result.content.length, artifactKey };
    } catch (error: any) {
        const details = Array.isArray(error?.details) ? error.details : [];
        const suffix = details.length ? ` | ${details.map((item: any) => `${item.code}@${item.location || '$'}: ${item.message}`).join('; ')}` : '';
        if (error?.status === 400 || details.some((item: any) => ['REQUIRED_FIELD', 'UNKNOWN_FIELD', 'INVALID_TYPE'].includes(item.code))) {
            throw new UnrecoverableError(`${error?.message || 'Template data validation failed'}${suffix}`);
        }
        throw new Error(`${error?.message || 'Preview render failed'}${suffix}`);
    }
}, { connection, concurrency: Number(process.env.TEMPLATE_PREVIEW_WORKER_CONCURRENCY || 4) });
worker.on('completed', job => console.log(`[template-preview-worker] completed ${job.id}`));
worker.on('failed', async (job, error) => {
    console.error(`[template-preview-worker] failed ${job?.id}:`, error);
    if (job && job.attemptsMade >= (job.opts.attempts || 1) && templatePreviewDlq) {
        await templatePreviewDlq.add('dead-letter', { originalJobId: job.id, data: job.data, error: error.message, failedAt: new Date().toISOString() });
    }
});
console.log('[template-preview-worker] listening');

const shutdown = async (signal: string) => {
    console.log(`[template-preview-worker] shutting down (${signal})`);
    await worker.close();
    if (templatePreviewDlq) await templatePreviewDlq.close();
    if (documentProductionQueue) await documentProductionQueue.close();
    if (documentBatchQueue) await documentBatchQueue.close();
    await connection.quit();
    process.exit(0);
};
process.once('SIGTERM', () => void shutdown('SIGTERM'));
process.once('SIGINT', () => void shutdown('SIGINT'));
