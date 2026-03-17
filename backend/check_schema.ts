
import { pool } from './src/config/database';

async function checkSchema() {
    try {
        const tables = ['pcms_order', 'pcms_order_line', 'hms_feelist', 'hms_pharmacyorder'];
        for (const table of tables) {
            console.log(`--- Schema for ${table} ---`);
            const res = await pool.query(`
                SELECT column_name, data_type, character_maximum_length
                FROM information_schema.columns
                WHERE table_name = '${table}'
                ORDER BY ordinal_position;
            `);
            console.table(res.rows);
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

checkSchema();
