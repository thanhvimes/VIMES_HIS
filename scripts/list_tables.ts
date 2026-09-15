
import { query } from '../src/config/database';

async function listTables() {
    try {
        const res = await query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
        console.log('Tables in public schema:');
        res.rows.forEach(r => console.log(r.table_name));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listTables();
