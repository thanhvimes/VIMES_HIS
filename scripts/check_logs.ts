
import { query } from '../src/config/database';
async function main() {
    const res = await query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND (table_name LIKE '%log%' OR table_name LIKE '%audit%' OR table_name LIKE '%history%')
    `);
    console.log('Existing log tables:', res.rows);
    process.exit(0);
}
main();
