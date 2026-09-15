
import { query } from '../src/config/database';

async function killOthers() {
    try {
        console.log('Terminating other sessions to release locks...');
        const res = await query(`
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE pid != pg_backend_pid()
              AND datname = current_database()
              AND state != 'idle'
        `);
        console.log(`Terminated ${res.rowCount} active sessions.`);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}
killOthers();
