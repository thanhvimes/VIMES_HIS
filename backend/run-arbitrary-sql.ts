import fs from 'fs';
import path from 'path';
import { query } from './src/config/database';

async function runSql() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error('Usage: ts-node run-arbitrary-sql.ts <sql_file_path>');
        process.exit(1);
    }

    const filePath = path.resolve(args[0]);
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
    }

    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`🚀 Running SQL from: ${filePath}`);

    try {
        const result = await query(sql);
        if (result && result.rows && result.rows.length > 0) {
            console.log('Results:');
            if (result.rows.length === 1 && Object.keys(result.rows[0]).length === 1) {
                // If single value result, print raw (good for function definitions)
                console.log(Object.values(result.rows[0])[0]);
            } else {
                console.table(result.rows.slice(0, 200));
                if (result.rows.length > 200) console.log(`... and ${result.rows.length - 200} more rows.`);
            }
        }
        console.log('✅ SQL execution successful!');
    } catch (error) {
        console.error('❌ SQL execution failed:', error);
    } finally {
        process.exit();
    }
}

runSql();
