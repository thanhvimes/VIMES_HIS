const fs = require('node:fs');
const path = require('node:path');
const root = path.join(process.cwd(), 'dist', 'assets');
const limit = Number(process.env.BUNDLE_BUDGET_BYTES || 1250000);
const oversized = fs.readdirSync(root).map(name => ({ name, size: fs.statSync(path.join(root, name)).size })).filter(x => x.size > limit);
if (oversized.length) { console.error(`Bundle budget exceeded (${limit} bytes):`, oversized); process.exit(1); }
console.log(`Bundle budget passed (${limit} bytes per asset).`);
