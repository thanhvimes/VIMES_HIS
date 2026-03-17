const { query } = require('./src/config/database');

async function checkTables() {
    try {
        console.log('🔍 Checking tables...');
        const result = await query(`
            SELECT * FROM portal_patient_links
        `);
        console.log('Links found:', result.rows);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkTables();
