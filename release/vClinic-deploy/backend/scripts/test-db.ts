
import { query } from '../src/config/database';

async function test() {
    try {
        const res = await query('SELECT CURRENT_DATABASE(), NOW()');
        console.log('Result:', res.rows[0]);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}
test();
