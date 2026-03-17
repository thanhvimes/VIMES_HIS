
import { query } from '../src/config/database';

async function checkLocks() {
    try {
        const res = await query(`
            SELECT pid, state, query, wait_event_type, wait_event
            FROM pg_stat_activity 
            WHERE state != 'idle' AND pid != pg_backend_pid()
        `);
        console.log('Active Queries:', res.rows);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}
checkLocks();
