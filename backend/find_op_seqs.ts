
import { pool } from './src/config/database';

async function check() {
    const r = await pool.query("SELECT relname FROM pg_class WHERE relkind = 'S' AND (relname ILIKE '%operation%' OR relname ILIKE '%surgery%')");
    console.log("Sequences:", r.rows.map(x => x.relname));
    process.exit(0);
}
check();
