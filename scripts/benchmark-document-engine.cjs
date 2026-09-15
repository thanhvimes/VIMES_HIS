const fs = require('node:fs');
const path = require('node:path');

const baseUrl = (process.env.BENCHMARK_API_URL || 'http://127.0.0.1:3001/api/v1').replace(/\/$/, '');
const token = process.env.BENCHMARK_TOKEN;
const templateCode = process.env.BENCHMARK_TEMPLATE || 'OUTPATIENT_EXAM';
const total = Math.max(1, Number(process.env.BENCHMARK_REQUESTS || 200));
const concurrency = Math.max(1, Number(process.env.BENCHMARK_CONCURRENCY || 10));

if (!token) {
  console.error('BENCHMARK_TOKEN is required. Use a test/staging staff JWT; never benchmark production with real patient data.');
  process.exit(1);
}

const samplePath = path.resolve(process.cwd(), 'templates', 'documents', templateCode, 'v1', 'sample-data.json');
const data = JSON.parse(fs.readFileSync(samplePath, 'utf8'));
let cursor = 0;
let ok = 0;
let failed = 0;
const latencies = [];

async function worker() {
  while (true) {
    const index = cursor++;
    if (index >= total) return;
    const started = performance.now();
    const response = await fetch(`${baseUrl}/documents/render`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateCode, templateVersion: 1, outputFormat: 'pdf', data: { ...data, benchmarkSequence: index } })
    }).catch(() => null);
    latencies.push(performance.now() - started);
    if (response?.ok) { ok += 1; await response.arrayBuffer(); }
    else failed += 1;
  }
}

function percentile(sorted, p) {
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] || 0;
}

(async () => {
  const started = performance.now();
  await Promise.all(Array.from({ length: concurrency }, worker));
  const elapsedSeconds = (performance.now() - started) / 1000;
  latencies.sort((a, b) => a - b);
  console.log(JSON.stringify({
    templateCode, total, concurrency, ok, failed,
    elapsedSeconds: Number(elapsedSeconds.toFixed(2)),
    requestsPerSecond: Number((total / elapsedSeconds).toFixed(2)),
    latencyMs: {
      p50: Math.round(percentile(latencies, 0.50)),
      p95: Math.round(percentile(latencies, 0.95)),
      p99: Math.round(percentile(latencies, 0.99)),
      max: Math.round(latencies[latencies.length - 1] || 0)
    }
  }, null, 2));
  process.exitCode = failed ? 1 : 0;
})();
