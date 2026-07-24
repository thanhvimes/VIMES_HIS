const { Client } = require('pg');
require('dotenv').config({ path: './.env' });

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/vimes_his'
});

async function main() {
  await client.connect();
  console.log("Searching patient by name PHẠM MINH THƯ...");
  const resPat = await client.query(`
    SELECT * FROM hms_patient 
    WHERE trim(hp_surname || ' ' || hp_midname || ' ' || hp_firstname) ILIKE '%PHẠM MINH THƯ%'
    LIMIT 5
  `);
  console.log("Patients found:", JSON.stringify(resPat.rows, null, 2));

  console.log("Searching documents for docno 26128091...");
  const resDoc = await client.query(`
    SELECT hd_docno, hd_patientno, hd_admitdate FROM hms_doc 
    WHERE hd_docno = 26128091 OR hd_patientno = '26128091'
  `);
  console.log("Documents found:", JSON.stringify(resDoc.rows, null, 2));

  console.log("Checking hms_testorderline...");
  const resTest = await client.query(`
    SELECT hpcl_docno, count(*) 
    FROM hms_testorderline 
    WHERE hpcl_docno = 26128091
    GROUP BY hpcl_docno
  `);
  console.log("Test lines found:", JSON.stringify(resTest.rows, null, 2));

  console.log("Checking hms_pacsorderline...");
  const resPacs = await client.query(`
    SELECT hpcl_docno, count(*) 
    FROM hms_pacsorderline 
    WHERE hpcl_docno = 26128091
    GROUP BY hpcl_docno
  `);
  console.log("Pacs lines found:", JSON.stringify(resPacs.rows, null, 2));

  await client.end();
}

main().catch(console.error);
