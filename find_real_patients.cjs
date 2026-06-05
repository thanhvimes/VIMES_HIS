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

async function findPatients() {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    console.log('Connected to database!');

    // Find patients that have hms_doc and hms_exam records
    const sql = `
      SELECT 
        p.hp_patientno,
        d.hd_docno,
        trim(COALESCE(p.hp_surname,'') || ' ' || COALESCE(p.hp_midname,'') || ' ' || p.hp_firstname) as patient_name,
        p.hp_sex,
        e.he_height,
        e.he_weight
      FROM hms_patient p
      JOIN hms_doc d ON d.hd_patientno = p.hp_patientno
      JOIN hms_exam e ON e.he_docno = d.hd_docno
      WHERE e.he_height > 0
      LIMIT 5
    `;
    const res = await client.query(sql);
    console.log('\n--- REAL PATIENTS IN HIS WITH EXAMS ---');
    console.log(res.rows);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

findPatients();
