const { Client } = require('pg');
require('dotenv').config({ path: './.env' });

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/vclinic'
});

async function main() {
  await client.connect();
  console.log("Checking columns of hms_icd...");
  const res = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'hms_icd'
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  
  console.log("Sample records:");
  const sample = await client.query(`SELECT * FROM hms_icd LIMIT 5`);
  console.log(JSON.stringify(sample.rows, null, 2));
  await client.end();
}

main().catch(console.error);
