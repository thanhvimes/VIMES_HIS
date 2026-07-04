const { Client } = require('pg');
require('dotenv').config({ path: './.env' });
const fs = require('fs');

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/vclinic'
});

async function main() {
  await client.connect();
  const res = await client.query(`
    SELECT conname, pg_get_constraintdef(oid) as def 
    FROM pg_constraint 
    WHERE conname = 'hms_examview_he_deptidhe_roomid'
  `);
  fs.writeFileSync('d:/AI/vClinic/backend/constraint_info.json', JSON.stringify(res.rows, null, 2));

  // Also query hms_examview columns and indexes
  const indexRes = await client.query(`
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename = 'hms_examview'
  `);
  fs.appendFileSync('d:/AI/vClinic/backend/constraint_info.json', '\n\nINDEXES:\n' + JSON.stringify(indexRes.rows, null, 2));

  await client.end();
}

main().catch(console.error);
