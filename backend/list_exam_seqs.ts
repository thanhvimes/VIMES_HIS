
import { query } from './src/config/database';
async function run() {
    const res = await query("SELECT relname FROM pg_class WHERE relkind = 'S' AND (relname LIKE '%exam%' OR relname LIKE '%recept%')");
    console.log("Exam/Recept sequences:");
    res.rows.forEach(r => console.log(`- ${r.relname}`));
    process.exit(0);
}
run();
