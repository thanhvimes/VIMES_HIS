const fs = require('fs');
const path = require('path');
const db = require('./src/config/database');

async function runMigration() {
    const sqlFile = path.join(__dirname, 'sql', 'update-booking-insurance.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('🚀 Running migration from:', sqlFile);
    try {
        await db.query(sql);
        console.log('✅ Migration successful!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        process.exit();
    }
}

runMigration();
