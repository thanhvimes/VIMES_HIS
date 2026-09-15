
import { query } from '../src/config/database';

async function main() {
    const tableName = process.argv[2] || 'pcms_order';
    try {
        const res = await query(`
            SELECT tablename FROM pg_tables WHERE tablename = '${tableName}' OR tablename LIKE '%${tableName}%'
        `);
        console.log(`Results for ${tableName}:`);
        res.rows.forEach(r => console.log(r.tablename));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
