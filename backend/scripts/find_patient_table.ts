
import { query } from '../src/config/database';

async function find() {
    try {
        const res = await query("SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%patient%'");
        console.log('Tables matching patient:');
        res.rows.forEach(r => console.log(r.table_name));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

find();
