
import { query } from '../src/config/database';

async function inspect(tableName: string) {
    try {
        const res = await query(`
            SELECT column_name, data_type, column_default
            FROM information_schema.columns 
            WHERE table_name = '${tableName}' 
        `);
        console.log(`\n--- ${tableName} SCHEMA ---`);
        res.rows.forEach(r => {
            console.log(`${r.column_name}: ${r.data_type}`);
        });
    } catch (err) {
        console.error(err);
    }
}

async function main() {
    await inspect('hms_roomlist');
    process.exit(0);
}

main();
