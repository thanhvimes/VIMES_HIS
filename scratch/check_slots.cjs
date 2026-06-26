const { Client } = require('pg');
const crypto = require('crypto');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

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

const dbUser = decrypt(process.env.DB_USER);
const dbPassword = decrypt(process.env.DB_PASSWORD);
const dbHost = process.env.DB_HOST || '10.1.3.200';
const dbDatabase = process.env.DB_NAME || 'vimes_jsc';
const dbPort = parseInt(process.env.DB_PORT || '5432', 10);

const client = new Client({
  user: dbUser,
  password: dbPassword,
  host: dbHost,
  database: dbDatabase,
  port: dbPort
});

async function main() {
  try {
    await client.connect();
    console.log('Connected to DB successfully!');

    const dateQueryStr = '2026-06-19';
    const roomId = 3;

    // Run release query
    const releaseRes = await client.query(`
      UPDATE hms_schedule_exam hse
      SET hse_status = 'O'
      WHERE hse_status = 'S'
        AND hse_date = $1
        AND hse_roomid = $2
        AND NOT EXISTS (
            SELECT 1 FROM qms_patient q
            WHERE q.qms_deptid = hse.hse_deptid
              AND q.qms_roomid = hse.hse_roomid
              AND q.qms_appointment_date = hse.hse_date
              AND q.qms_appointment_time = hse.hse_time
              AND q.qms_status IN ('O', 'S')
        )
    `, [dateQueryStr, roomId]);

    console.log(`Successfully released ${releaseRes.rowCount} orphaned slots for Room ${roomId} on ${dateQueryStr}!`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
