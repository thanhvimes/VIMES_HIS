
import { query } from '../config/database';
import fs from 'fs';

async function runSql() {
    const sqlPath = process.argv[2];
    if (!sqlPath) {
        console.error('❌ Missing SQL file path');
        process.exit(1);
    }
    try {
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log(`📜 Running SQL from: ${sqlPath}`);
        const result = await query(sql);
        console.log('✅ SQL executed successfully');
        console.log('📊 Result Rows:', JSON.stringify(result.rows, null, 2));
        process.exit(0);
    } catch (error) {
        console.error('❌ Error executing SQL:', error);
        process.exit(1);
    }
}

runSql();
