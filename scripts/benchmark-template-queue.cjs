require('dotenv').config();
const { Queue } = require('bullmq');
const Redis = require('ioredis');

const count = Number(process.env.QUEUE_BENCHMARK_COUNT || 100);
const versionId = Number(process.env.TEMPLATE_BENCHMARK_VERSION_ID || 0);
if (!versionId) { console.error('TEMPLATE_BENCHMARK_VERSION_ID is required'); process.exit(2); }
const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', { maxRetriesPerRequest: null });
const queue = new Queue('template-studio-preview', { connection: redis });

(async () => {
  const started = Date.now();
  await queue.addBulk(Array.from({ length: count }, (_, index) => ({ name: 'benchmark', data: { benchmark: true, versionId, format: process.env.TEMPLATE_BENCHMARK_FORMAT || 'docx', index } })));
  console.log(JSON.stringify({ queued: count, elapsedMs: Date.now() - started, queue: 'template-studio-preview' }));
  await queue.close();
  await redis.quit();
})().catch(error => { console.error(error); process.exitCode = 1; });
