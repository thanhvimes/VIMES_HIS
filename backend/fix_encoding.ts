import { query } from './src/config/database';

async function fixEncoding() {
  const templates = await query(`SELECT id, name, description FROM hms_document_template`);
  for (const t of templates.rows) {
    let name = t.name;
    let desc = t.description;
    
    // Fix double-encoded UTF-8 strings
    if (name && name.includes('BiÃ')) {
      name = Buffer.from(name, 'latin1').toString('utf8');
    }
    if (desc && desc.includes('BiÃ')) {
      desc = Buffer.from(desc, 'latin1').toString('utf8');
    }
    
    if (name !== t.name || desc !== t.description) {
      await query(`UPDATE hms_document_template SET name = $1, description = $2 WHERE id = $3`, [name, desc, t.id]);
      console.log(`Fixed template #${t.id}: ${name}`);
    }
  }
  console.log('Encoding fix finished.');
  process.exit(0);
}

fixEncoding().catch(e => { console.error(e); process.exit(1); });
