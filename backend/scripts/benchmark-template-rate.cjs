require('dotenv').config();
const { Queue } = require('bullmq');
const Redis = require('ioredis');
const rate = Number(process.env.QUEUE_BENCHMARK_RATE || 10);
const seconds = Number(process.env.QUEUE_BENCHMARK_SECONDS || 30);
const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', { maxRetriesPerRequest: null });
const queue = new Queue('template-studio-preview', { connection: redis });
(async () => {
  const total = rate * seconds; const interval = 1000 / rate; const started = Date.now();
  for (let i = 0; i < total; i += 1) {
    await queue.add('rate-benchmark', { benchmark: true, actor: 'rate-benchmark', index: i });
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  console.log(JSON.stringify({ rate, seconds, queued: total, elapsedMs: Date.now() - started }));
  await queue.close(); await redis.quit();
})().catch(error => { console.error(error); process.exitCode = 1; });
