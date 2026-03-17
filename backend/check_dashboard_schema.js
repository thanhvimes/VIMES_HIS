
const { query } = require('./src/config/database');
async function check() {
    try {
        const res = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'hms_exam'");
        console.log('hms_exam columns:', res.rows.map(r => r.column_name).join(', '));
        
        const tables = await query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%fee%'");
        console.log('fee tables:', tables.rows.map(r => r.table_name).join(', '));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
check();
