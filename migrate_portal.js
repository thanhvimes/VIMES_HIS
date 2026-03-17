
const { query } = require('./backend/src/config/db');
const fs = require('fs');
const path = require('path');

async function runSchema() {
    try {
        const sql = fs.readFileSync(path.join(__dirname, 'backend/sql/portal-schema.sql'), 'utf8');
        console.log('📜 Executing schema...');
        await query(sql);
        console.log('✅ Schema executed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error executing schema:', error);
        process.exit(1);
    }
}

runSchema();
