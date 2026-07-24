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
    if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const user = decrypt(env.DB_USER);
const password = decrypt(env.DB_PASSWORD);
const host = env.DB_HOST || '14.177.232.29';
const port = parseInt(env.DB_PORT || '8050', 10);
const database = env.DB_NAME || 'vimes_nb';

async function main() {
    const client = new Client({ user, password, host, port, database });
    await client.connect();
    const res = await client.query('SELECT id, doc_no, patient_name, xml_data FROM health_check_masters ORDER BY id DESC LIMIT 1');
    if (res.rows.length > 0) {
        console.log('Doc ID:', res.rows[0].id);
        console.log('Doc No:', res.rows[0].doc_no);
        console.log('Patient:', res.rows[0].patient_name);
        console.log('\n--- RAW XML DATA FROM DB ---');
        console.log(res.rows[0].xml_data);
    }
    await client.end();
}

main().catch(err => console.error(err.message));
