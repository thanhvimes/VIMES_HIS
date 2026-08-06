const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const files = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).trim().split(/\r?\n/);
const forbidden = files.filter(f => /(^|\/)\.env$/i.test(f) || /\.log$/i.test(f));
if (forbidden.length) { console.error(`Tracked secret/log files are forbidden:\n${forbidden.join('\n')}`); process.exit(1); }
const patterns = [
  ['fallback JWT secret', /JWT_SECRET\s*\|\|\s*['"][^'"]+/],
  ['fallback encryption key', /VIMES_SECURITY_KEY\s*\|\|\s*['"][^'"]+/],
  ['frontend Gemini key', /process\.env\.(API_KEY|GEMINI_API_KEY)/],
  ['known default password', /vimes@2026|Abc@1234/]
];
let failed = false;
for (const file of files.filter(f => /\.(ts|tsx|js|cjs|mjs)$/i.test(f) && /^(backend\/src|services|modules|contexts|stores|config)\/|^vite\.config\.ts$/.test(f))) {
  const content = fs.readFileSync(file, 'utf8');
  for (const [name, pattern] of patterns) if (pattern.test(content)) { console.error(`${file}: ${name}`); failed = true; }
}
if (failed) process.exit(1);
console.log('Security checks passed.');
