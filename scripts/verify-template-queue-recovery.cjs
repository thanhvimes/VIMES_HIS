require('dotenv').config();
const Redis = require('ioredis');
const { Queue } = require('bullmq');

const queueName = process.env.QUEUE_RECOVERY_NAME || 'template-studio-preview';
const expected = Number(process.env.QUEUE_RECOVERY_EXPECTED || 0);
const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', { maxRetriesPerRequest: null });
const queue = new Queue(queueName, { connection: redis });
(async () => {
  const counts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');
  const jobs = await queue.getJobs(['waiting', 'active', 'completed', 'failed'], 0, Math.max(expected, 1000));
  const ids = jobs.map(job => String(job.id));
  const uniqueIds = new Set(ids);
  const idempotent = jobs.filter(job => job.data && job.data.idempotencyKey).length;
  const result = { queue: queueName, counts, inspected: jobs.length, duplicateIds: ids.length - uniqueIds.size, idempotencyTagged: idempotent, expectedMinimum: expected };
  console.log(JSON.stringify(result));
  if (result.duplicateIds > 0 || (expected > 0 && jobs.length < expected)) process.exitCode = 1;
  await queue.close(); await redis.quit();
})().catch(error => { console.error(error); process.exitCode = 1; });
