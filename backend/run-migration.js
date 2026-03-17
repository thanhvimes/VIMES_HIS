// Migration runner for portal_patient_profiles table
const { query } = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('🔄 Running migration: 005_create_portal_patient_profiles.sql');

        const sqlPath = path.join(__dirname, 'migrations', '005_create_portal_patient_profiles.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await query(sql);

        console.log('✅ Migration completed successfully!');
        console.log('📊 Table portal_patient_profiles created with indexes and triggers.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error);
        process.exit(1);
    }
}

runMigration();
