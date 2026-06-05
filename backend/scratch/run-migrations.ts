import { query } from '../src/config/database';
import * as fs from 'fs';
import * as path from 'path';

async function run() {
    const migration14 = path.join(__dirname, '../migrations/014_create_health_check_documents.sql');
    const migration15 = path.join(__dirname, '../migrations/015_setup_health_check_sync.sql');

    try {
        console.log("Applying 014_create_health_check_documents.sql...");
        const sql14 = fs.readFileSync(migration14, 'utf8');
        await query(sql14);
        console.log("014 migration applied successfully!");
    } catch (e: any) {
        console.error("014 migration failed:", e.message);
    }

    try {
        console.log("Applying 015_setup_health_check_sync.sql...");
        const sql15 = fs.readFileSync(migration15, 'utf8');
        await query(sql15);
        console.log("015 migration applied successfully!");
    } catch (e: any) {
        console.error("015 migration failed:", e.message);
    }

    process.exit(0);
}

run();
