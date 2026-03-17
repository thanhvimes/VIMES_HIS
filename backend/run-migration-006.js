const { query } = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('🔄 Running migration: 006_update_cccd_authentication.sql');

        const sqlPath = path.join(__dirname, 'migrations', '006_update_cccd_authentication.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await query(sql);

        console.log('✅ Migration 006 completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error);
        process.exit(1);
    }
}

runMigration();
