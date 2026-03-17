
import { query } from './src/config/database';

async function run() {
    try {
        const res = await query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'hms_exam'
            ORDER BY column_name
        `);
        console.log(JSON.stringify(res.rows, null, 2));
        process.exit(0);
    } catch (error: any) {
        console.error(error.message);
        process.exit(1);
    }
}
run();
