const db = require('./src/config/database');

async function checkColumns() {
    try {
        const result = await db.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'hms_schedule_exam_setup'
        `);
        console.log('Columns in hms_schedule_exam_setup:');
        console.table(result.rows);
    } catch (err) {
        console.error('Error checking columns:', err);
    } finally {
        process.exit();
    }
}

checkColumns();
