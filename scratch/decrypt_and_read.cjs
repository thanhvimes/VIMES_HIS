const { Client } = require('pg');
const crypto = require('crypto');
const fs = require('fs');

const masterKey = 'vClinic-secure-master-key-2026-vimes-jsc-admin';

function decrypt(cipherText) {
    if (!cipherText || !cipherText.startsWith('enc:')) return cipherText;
    const data = Buffer.from(cipherText.replace('enc:', ''), 'hex');
    const salt = data.subarray(0, 64);
    const iv = data.subarray(64, 80);
    const tag = data.subarray(80, 96);
    const text = data.subarray(96);
    const key = crypto.pbkdf2Sync(masterKey, salt, 100000, 32, 'sha512');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(text, undefined, 'utf8') + decipher.final('utf8');
}

const envText = fs.readFileSync('backend/.env', 'utf8');
const env = {};
envText.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
});

const user = decrypt(env.DB_USER);
const password = decrypt(env.DB_PASSWORD);
const host = env.DB_HOST || '14.177.232.29';
const port = parseInt(env.DB_PORT || '8050', 10);
const database = env.DB_NAME || 'vimes_nb';

console.log(`Connecting to Postgres ${user}@${host}:${port}/${database} ...`);

const client = new Client({ user, password, host, port, database });

async function run() {
    await client.connect();
    const res = await client.query('SELECT ma_cskcb, vneid_url, vneid_username, vneid_private_key FROM health_check_settings LIMIT 1');
    if (res.rows.length > 0) {
        console.log('✅ MA_CSKCB:', res.rows[0].ma_cskcb);
        console.log('✅ VNeID URL:', res.rows[0].vneid_url);
        console.log('✅ Has Private Key?:', !!res.rows[0].vneid_private_key);
        if (res.rows[0].vneid_private_key) {
            const rawKey = res.rows[0].vneid_private_key;
            const decKey = rawKey.startsWith('enc:') ? decrypt(rawKey) : rawKey;
            fs.writeFileSync('scratch/real_private_key.pem', decKey, 'utf8');
            console.log('Saved REAL decrypted private key to scratch/real_private_key.pem');
        }
    } else {
        console.log('No settings row found');
    }
    await client.end();
}

run().catch(e => console.error('Error:', e.message));
