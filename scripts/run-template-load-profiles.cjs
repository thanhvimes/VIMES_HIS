/* Reproducible queue load profiles. Run after Redis and preview workers are up. */
const { spawn } = require('node:child_process');
const path = require('node:path');

const profiles = {
  smoke10: { rate: 10, seconds: 60 },
  load20: { rate: 20, seconds: 300 },
  load40: { rate: 40, seconds: 300 },
  spike5m: { rate: 80, seconds: 300 },
  sustained30m: { rate: 20, seconds: 1800 },
  soak4h: { rate: 10, seconds: 14400 }
};
const name = process.argv[2] || 'smoke10';
if (!profiles[name]) {
  console.error(`Unknown profile '${name}'. Available: ${Object.keys(profiles).join(', ')}`);
  process.exit(2);
}
const profile = profiles[name];
const child = spawn(process.execPath, [path.join(__dirname, 'benchmark-template-rate.cjs')], {
  stdio: 'inherit', env: { ...process.env, QUEUE_BENCHMARK_RATE: String(profile.rate), QUEUE_BENCHMARK_SECONDS: String(profile.seconds) }
});
child.on('exit', code => process.exit(code ?? 1));
