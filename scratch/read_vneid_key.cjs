const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/vimes_nb'
});

async function main() {
    await client.connect();
    const res = await client.query('SELECT ma_cskcb, vneid_url, vneid_username, vneid_private_key FROM health_check_sync_settings LIMIT 1');
    console.log('SETTINGS:');
    if (res.rows.length > 0) {
        console.log('ma_cskcb:', res.rows[0].ma_cskcb);
        console.log('vneid_url:', res.rows[0].vneid_url);
        console.log('vneid_username:', res.rows[0].vneid_username);
        console.log('vneid_private_key exists?:', !!res.rows[0].vneid_private_key);
        if (res.rows[0].vneid_private_key) {
            fs.writeFileSync('d:\\AI\\VIMES_HIS\\scratch\\real_private_key.pem', res.rows[0].vneid_private_key, 'utf8');
            console.log('Saved real private key to scratch/real_private_key.pem');
        }
    } else {
        console.log('No settings found');
    }
    await client.end();
}

main().catch(err => console.error(err.message));
