import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.env.TEMPLATE_STUDIO_STORAGE_DIR || path.join(process.cwd(), 'storage', 'template-studio'), 'queue-previews');
const retentionDays = Number(process.env.TEMPLATE_PREVIEW_RETENTION_DAYS || 7);
const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
let removed = 0;

async function walk(dir: string) {
  let entries: any[];
  try { entries = await fs.readdir(dir, { withFileTypes: true }) as any[]; } catch (error: any) { if (error.code === 'ENOENT') return; throw error; }
  for (const entry of entries) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(file);
    else if (entry.isFile() && (await fs.stat(file)).mtimeMs < cutoff) { await fs.unlink(file); removed += 1; }
  }
}

walk(root).then(() => console.log(JSON.stringify({ root, retentionDays, removed }))).catch(error => { console.error(error); process.exitCode = 1; });
