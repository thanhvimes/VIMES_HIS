import { query } from '../src/config/database';

async function main() {
    try {
        console.log("=== COLUMNS IN hms_testorder ===");
        const res1 = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'hms_testorder'
        `);
        console.log(res1.rows.map(r => `${r.column_name} (${r.data_type})`).join('\n'));

        console.log("\n=== COLUMNS IN hms_pacs_test_view ===");
        const res2 = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'hms_pacs_test_view'
        `);
        console.log(res2.rows.map(r => `${r.column_name} (${r.data_type})`).join('\n'));
    } catch (err) {
        console.error(err);
    }
}

main();
