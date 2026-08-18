import { query } from './src/config/database';

async function updateProperNames() {
  await query(`UPDATE hms_document_template SET name = 'Biên bản hội chẩn chuyên môn (Test Studio)', description = 'Biên bản hội chẩn chuyên khoa' WHERE code LIKE 'HOI_CHAN%'`);
  console.log('Updated proper Vietnamese names.');
  process.exit(0);
}

updateProperNames().catch(e => { console.error(e); process.exit(1); });
