const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, 'backend/.env') });

const ALGORITHM = 'enc:'; // To handle decrypt helper
function decrypt(cipherText) {
  if (!cipherText) return '';
  if (!cipherText.startsWith('enc:')) {
    return cipherText;
  }
  try {
    const rawCipherText = cipherText.replace('enc:', '');
    const masterKey = process.env.VIMES_SECURITY_KEY || 'default-secret-vClinic-2026-key-32chars';
    const data = Buffer.from(rawCipherText, 'hex');

    const salt = data.subarray(0, 64);
    const iv = data.subarray(64, 64 + 16);
    const tag = data.subarray(64 + 16, 64 + 16 + 16);
    const text = data.subarray(64 + 16 + 16);

    const key = crypto.pbkdf2Sync(masterKey, salt, 100000, 32, 'sha512');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
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

    const migrationFile = path.join(__dirname, 'backend/migrations/033_create_health_check_service_mappings.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');

    console.log('Running migration 033...');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('✅ Migration 033 executed successfully!');

    // Verify table structure and seed row count
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'health_check_service_mappings'
    `);
    
    console.log('\n--- VERIFICATION ---');
    if (tableCheck.rows.length > 0) {
      console.log(`Table health_check_service_mappings exists!`);
      const rowCountRes = await client.query('SELECT COUNT(*) FROM health_check_service_mappings');
      console.log(`Row count in health_check_service_mappings: ${rowCountRes.rows[0].count}`);
    } else {
      console.error(`Table health_check_service_mappings does NOT exist!`);
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
