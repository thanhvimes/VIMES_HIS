import { pool } from '../config/database';

async function main() {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'hms_fee_group'
        `);
        console.log('--- COLUMNS ---');
        console.log(JSON.stringify(res.rows, null, 2));
        console.log('---------------');
    } catch (e) {
        console.error('Error querying columns:', e);
    } finally {
        await pool.end();
    }
}

main();
