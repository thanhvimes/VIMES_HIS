const fs = require('node:fs');
const input = process.argv[2]; if (!input) { console.error('Usage: node evaluate-template-benchmark.cjs result.json'); process.exit(2); }
const data = JSON.parse(fs.readFileSync(input, 'utf8'));
const thresholds = { p95Ms: Number(process.env.BENCHMARK_P95_MS || 3000), queueGrowth: Number(process.env.BENCHMARK_QUEUE_GROWTH || 0), failurePercent: Number(process.env.BENCHMARK_FAILURE_PERCENT || 1) };
const checks = { p95: Number(data.p95Ms || data.p95 || 0) <= thresholds.p95Ms, queue: Number(data.queueGrowth || 0) <= thresholds.queueGrowth, failures: Number(data.failurePercent || 0) <= thresholds.failurePercent };
const result = { thresholds, checks, passed: Object.values(checks).every(Boolean), source: input };
console.log(JSON.stringify(result)); if (!result.passed) process.exitCode = 1;
