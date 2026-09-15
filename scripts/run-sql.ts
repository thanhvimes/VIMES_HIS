
import fs from 'fs';
import path from 'path';
import { pool } from '../src/config/database';

async function run() {
    const fileName = process.argv[2];
    if (!fileName) {
        console.error('Usage: ts-node scripts/run-sql.ts <filename>');
        process.exit(1);
    }

    const filePath = path.join(__dirname, '../migrations', fileName);
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
    }

    const sql = fs.readFileSync(filePath, 'utf8');
    const client = await pool.connect();

    try {
        console.log(`🚀 DEPLOYING (No Transaction): ${fileName} (${sql.length} chars)`);
        await pool.query(sql);
        console.log(`🎉 SUCCESS: ${fileName}`);
    } catch (err: any) {
        console.error(`❌ FAILED: ${fileName}`);
        console.error(err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

run();
