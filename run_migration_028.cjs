const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');

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

async function executeMigration() {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    console.log('Connected to PostgreSQL successfully!');

    const migrationFile = path.join(__dirname, 'backend/migrations/028_alter_ma_cskcb_length.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');

    console.log('Running migration 028...');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('✅ Migration 028 executed successfully!');

    // Verify column
    const resColumns = await client.query(`
      SELECT column_name, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'health_check_settings' 
        AND column_name = 'ma_cskcb'
    `);
    
    console.log('\n--- VERIFICATION ---');
    if (resColumns.rows.length > 0) {
      console.log(`Column ${resColumns.rows[0].column_name} has max length: ${resColumns.rows[0].character_maximum_length}`);
    } else {
      console.error('❌ Column ma_cskcb not found after migration!');
    }

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    try {
      await client.query('ROLLBACK');
    } catch (_) {}
  } finally {
    await client.end();
  }
}

executeMigration();
