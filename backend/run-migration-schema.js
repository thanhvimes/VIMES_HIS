const { query } = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('🔄 Running migration: portal-schema.sql');

        // Path to the doc sql file
        const sqlPath = 'd:\\AI\\vClinic\\modules\\portal\\doc\\sql\\portal-schema.sql';

        if (!fs.existsSync(sqlPath)) {
            console.error('File not found:', sqlPath);
            process.exit(1);
        }

        const sql = fs.readFileSync(sqlPath, 'utf8');

        await query(sql);

        console.log('✅ Portal Schema applied successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error);
        process.exit(1);
    }
}

runMigration();
