
const { Client } = require('pg');
require('dotenv').config();

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
            AND column_name LIKE '%object%'
        `);
        console.log('Columns matching "object" in hms_doc:');
        console.log(JSON.stringify(res.rows, null, 2));

        const objRes = await client.query('SELECT ho_id, ho_desc, ho_type FROM hms_object');
        console.log('\nContent of hms_object:');
        console.log(JSON.stringify(objRes.rows, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

check();
