const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const baseline = process.argv[2]; const actual = process.argv[3];
if (!baseline || !actual) { console.error('Usage: node visual-regression-check.cjs <baselineDir> <actualDir>'); process.exit(2); }
if (process.argv.includes('--update')) {
  fs.mkdirSync(baseline, { recursive: true });
  for (const file of fs.readdirSync(actual)) if (/\.(png|jpg|jpeg)$/i.test(file)) fs.copyFileSync(path.join(actual, file), path.join(baseline, file));
  console.log(JSON.stringify({ baseline, updated: true }));
  process.exit(0);
}
const files = dir => fs.readdirSync(dir, { withFileTypes: true }).filter(x => x.isFile() && /\.(png|jpg|jpeg)$/i.test(x.name)).map(x => x.name).sort();
const digest = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const expected = files(baseline); const observed = files(actual); const all = [...new Set([...expected, ...observed])].sort();
const ignore = process.env.VISUAL_REGRESSION_IGNORE ? new RegExp(process.env.VISUAL_REGRESSION_IGNORE) : null;
const compared = ignore ? all.filter(name => !ignore.test(name)) : all;
const differences = compared.filter(name => !fs.existsSync(path.join(baseline, name)) || !fs.existsSync(path.join(actual, name)) || digest(path.join(baseline, name)) !== digest(path.join(actual, name)));
console.log(JSON.stringify({ baseline, actual, pages: all.length, ignored: all.length - compared.length, differences, changedPages: differences.map(name => ({ page: name, baselineHash: fs.existsSync(path.join(baseline, name)) ? digest(path.join(baseline, name)) : null, actualHash: fs.existsSync(path.join(actual, name)) ? digest(path.join(actual, name)) : null })), passed: differences.length === 0 }));
if (differences.length) process.exitCode = 1;
