const { Client } = require('pg');
const crypto = require('crypto');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'backend/.env') });

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
const dbHost = process.env.DB_HOST || '115.74.226.237';
const dbDatabase = process.env.DB_NAME || 'vimes_130';
const dbPort = parseInt(process.env.DB_PORT || '5432', 10);

const dbConfig = {
  user: dbUser,
  host: dbHost,
  database: dbDatabase,
  password: dbPassword,
  port: dbPort,
};

async function checkDb() {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    console.log('Connected to DB successfully!');

    console.log('\n--- 5 BAN GHI MASTER MOI NHAT ---');
    const resMaster = await client.query('SELECT id, patient_name, doc_no, form_type, created_at FROM health_check_masters ORDER BY id DESC LIMIT 5');
    console.log(resMaster.rows);

    console.log('\n--- KET NOI MASTER & DETAIL CO KHONG ---');
    const resJoin = await client.query(`
      SELECT m.id, m.patient_name, d.master_id 
      FROM health_check_masters m 
      LEFT JOIN health_check_details d ON m.id = d.master_id 
      ORDER BY m.id DESC LIMIT 5
    `);
    console.log(resJoin.rows);

  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    await client.end();
  }
}

checkDb();
