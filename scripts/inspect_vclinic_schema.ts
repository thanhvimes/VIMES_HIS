let query: any;
try {
    query = require('../src/config/database').query;
} catch {
    query = require('../config/database').query;
}

async function run() {
    try {
        const t1 = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'hms_disease_hist'");
        console.log('hms_disease_hist columns:', t1.rows.map(r => r.column_name));

        const t2 = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'hms_exam'");
        console.log('hms_exam columns:', t2.rows.map(r => r.column_name));

        const cols = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'hms_roomlist'");
        console.log('hms_roomlist columns:', cols.rows.map(x => x.column_name));
        process.exit(0);
    } catch (err) {
        console.error('Error inspecting schema:', err);
        process.exit(1);
    }
}

run();
