
const { Client } = require('pg');
require('dotenv').config();

// Since the password in .env is encrypted, I should probably use the decrypted one if I can 
// but I don't know the key. 
// However, I can try to use the environment variables as is, maybe the system decrypts them.
// But wait, npx ts-node failed because it couldn't resolve the imports, not authentication.

async function check() {
    const client = new Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
    });

    try {
        await client.connect();
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'hms_doc' 
            ORDER BY column_name
        `);
        console.log('--- COLUMNS ---');
        res.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type}`));
    } catch (err) {
        // try to catch auth error to see if pwd is encrypted
        console.error('Connection failed:', err.message);
    } finally {
        await client.end();
    }
}
check();
