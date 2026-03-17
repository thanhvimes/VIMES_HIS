
import { query } from './src/config/database';

async function run() {
    try {
        const res = await query(`
            SELECT 
                conname as name, 
                pg_get_constraintdef(oid) as definition
            FROM pg_constraint 
            WHERE conrelid = 'hms_exam'::regclass
        `);
        console.log("JSON_START" + JSON.stringify(res.rows) + "JSON_END");
        process.exit(0);
    } catch (error: any) {
        console.error("Error:", error.message);
        process.exit(1);
    }
}

run();
