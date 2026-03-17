// Migration runner for 007_add_profile_fields.sql
const path = require('path');
const fs = require('fs');
const { query } = require('./src/config/database');

async function runMigration() {
    try {
        console.log('🔄 Running migration: 007_add_profile_fields.sql');
        const sqlPath = path.join(__dirname, 'migrations', '007_add_profile_fields.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await query(sql);
        console.log('✅ Migration completed: Added ethnicity, occupation, email columns');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

runMigration();
