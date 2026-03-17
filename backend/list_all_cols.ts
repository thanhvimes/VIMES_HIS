import { query } from './src/config/database';

async function run() {
    try {
        const res = await query(`
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name IN ('hms_exam', 'hms_doc') 
            ORDER BY table_name, column_name
        `);
        console.log("TABLE COLUMNS:");
        res.rows.forEach((r: any) => {
            console.log(`${r.table_name}.${r.column_name}: ${r.data_type}`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

run();
