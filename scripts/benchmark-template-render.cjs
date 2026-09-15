require('dotenv').config();
const { Queue } = require('bullmq');
const Redis = require('ioredis');

const versionId = Number(process.env.QUEUE_BENCHMARK_VERSION_ID || 0);
const count = Number(process.env.QUEUE_BENCHMARK_COUNT || 20);
const benchmarkFormat = process.env.BENCHMARK_FORMAT || 'both'; // 'docx', 'pdf', or 'both'

if (!versionId) throw new Error('QUEUE_BENCHMARK_VERSION_ID is required');
const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', { maxRetriesPerRequest: null });
const queue = new Queue('template-studio-preview', { connection: redis });

async function runFormatBenchmark(format, jobCount) {
  const started = Date.now();
  const jobs = await queue.addBulk(Array.from({ length: jobCount }, (_, index) => ({
    name: 'render-benchmark',
    data: { versionId, format, data: {}, actor: 'benchmark', benchmark: true, index }
  })));
  const ids = new Set(jobs.map(job => String(job.id)));
  let completed = 0;
  let failed = 0;

  while (completed + failed < jobCount) {
    const current = await queue.getJobs(['completed', 'failed'], 0, jobCount * 3);
    completed = current.filter(job => ids.has(String(job.id)) && job.finishedOn && !job.failedReason).length;
    failed = current.filter(job => ids.has(String(job.id)) && Boolean(job.failedReason)).length;
    process.stdout.write(`\r[${format.toUpperCase()}] completed=${completed} failed=${failed}/${jobCount}`);
    if (completed + failed < jobCount) await new Promise(resolve => setTimeout(resolve, 500));
  }
  const elapsedMs = Date.now() - started;
  return {
    format,
    versionId,
    count: jobCount,
    completed,
    failed,
    elapsedMs,
    avgPerJobMs: Math.round(elapsedMs / Math.max(1, completed)),
    throughputPerMinute: Math.round((completed * 60000) / Math.max(1, elapsedMs))
  };
}

(async () => {
  const results = {};
  if (benchmarkFormat === 'docx' || benchmarkFormat === 'both') {
    results.docx = await runFormatBenchmark('docx', count);
    console.log(`\nDOCX Benchmark: ${JSON.stringify(results.docx)}`);
  }
  if (benchmarkFormat === 'pdf' || benchmarkFormat === 'both') {
    results.pdf = await runFormatBenchmark('pdf', count);
    console.log(`\nPDF Benchmark: ${JSON.stringify(results.pdf)}`);
  }
  console.log(`\nSummary: ${JSON.stringify(results, null, 2)}`);
  await queue.close();
  await redis.quit();
})().catch(error => { console.error(error); process.exitCode = 1; });

