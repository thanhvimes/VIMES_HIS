import { query } from '../config/database';
import fs from 'fs';
import path from 'path';

async function runQueueMigration() {
    try {
        const schemaPath = path.join(__dirname, '../sql/queue-schema.sql');
        const sql = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('📜 Executing Queue Management schema...');
        
        // PostgreSQL doesn't support multiple statements in one query with parameters, 
        // but it does support it for simple strings.
        await query(sql);
        
        console.log('✅ Queue Management schema executed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error executing Queue Management schema:', error);
        process.exit(1);
    }
}

runQueueMigration();
