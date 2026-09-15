import { query } from '../src/config/database';

async function inspect() {
    try {
        const res = await query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
              AND (table_name LIKE '%exm%' OR table_name LIKE '%contract%')
            ORDER BY table_name
        `);
        console.log('--- Matching Tables ---');
        res.rows.forEach(r => console.log(r.table_name));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

inspect();
