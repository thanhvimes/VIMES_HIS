const db = require('./src/config/database');

async function checkTable(tableName) {
    try {
        const res = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = $1
            ORDER BY ordinal_position
        `, [tableName]);
        console.log(`--- ${tableName} ---`);
        res.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type}`));
    } catch (err) {
        console.error(err);
    }
}

async function start() {
    await checkTable('hms_patient');
    await checkTable('hms_doc');
    await checkTable('hms_card');
    process.exit(0);
}

start();
