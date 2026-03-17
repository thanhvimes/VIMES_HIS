const { query } = require('../src/config/database');

async function migrate() {
    try {
        console.log('🚀 Starting migration: adding qms_idcard_issuedate...');
        await query('ALTER TABLE qms_patient ADD COLUMN IF NOT EXISTS qms_idcard_issuedate DATE;');
        console.log('✅ Column qms_idcard_issuedate added successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();
