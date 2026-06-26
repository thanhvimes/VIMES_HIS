import { pool } from '../src/config/database';
import * as fs from 'fs';
import * as path from 'path';

async function run() {
  try {
    const filePath = path.join(__dirname, '../migrations/018_fix_booking_slots_integrity.sql');
    console.log(`Reading migration file: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    console.log('Applying migration to database...');
    await pool.query(sql);
    console.log('✅ Migration 018 applied successfully!');
  } catch (e) {
    console.error('❌ Migration failed:', e);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

run();
