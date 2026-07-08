const { Client } = require('pg');
const crypto = require('crypto');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const ITERATIONS = 100000;
const KEY_LENGTH = 32;

function decrypt(cipherText) {
  if (!cipherText) return '';
  if (!cipherText.startsWith('enc:')) {
    return cipherText;
  }
  try {
    const rawCipherText = cipherText.replace('enc:', '');
    const masterKey = process.env.VIMES_SECURITY_KEY || 'default-secret-vClinic-2026-key-32chars';
    const data = Buffer.from(rawCipherText, 'hex');

    const salt = data.subarray(0, SALT_LENGTH);
    const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = data.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const text = data.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

    const key = crypto.pbkdf2Sync(masterKey, salt, ITERATIONS, KEY_LENGTH, 'sha512');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    return decipher.update(text, 'binary', 'utf8') + decipher.final('utf8');
  } catch (error) {
    console.error('❌ Error decrypting value:', error.message);
    return '';
  }
}

const dbUser = decrypt(process.env.DB_USER || 'postgres');
const dbPassword = decrypt(process.env.DB_PASSWORD || 'Password123!');
const dbHost = process.env.DB_HOST || '14.177.232.29';
const dbDatabase = process.env.DB_NAME || 'vimes_nb';
const dbPort = parseInt(process.env.DB_PORT || '8050', 10);

const dbConfig = {
  user: dbUser,
  host: dbHost,
  database: dbDatabase,
  password: dbPassword,
  port: dbPort,
};

async function checkKsk() {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    console.log('\n--- Checking health_check_details ---');
    const res = await client.query(`
      SELECT m.id, m.patient_name, m.doc_no, d.clinical_data->'clinical_exam'->'specialty_metadata' as metadata
      FROM health_check_masters m
      JOIN health_check_details d ON m.id = d.master_id
      ORDER BY m.id DESC
      LIMIT 3
    `);
    for (const row of res.rows) {
        console.log(`ID: ${row.id}, Patient: ${row.patient_name}, DocNo: ${row.doc_no}`);
        console.log('Metadata:', JSON.stringify(row.metadata, null, 2));
    }
  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    await client.end();
  }
}

checkKsk();
