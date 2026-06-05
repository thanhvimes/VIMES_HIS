
import { pool } from './src/config/database';

async function search() {
    const r = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND (table_name ILIKE '%operation%' OR table_name ILIKE '%surgery%' OR table_name ILIKE '%procedure%' OR table_name ILIKE '%theat%')");
    console.log("Tables found:", r.rows.map(x => x.table_name));
    process.exit(0);
}
search();
