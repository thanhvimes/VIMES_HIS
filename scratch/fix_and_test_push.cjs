const { Client } = require('pg');
const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs');

const masterKey = 'vClinic-secure-master-key-2026-vimes-jsc-admin';

function encrypt(text) {
    const salt = crypto.randomBytes(64);
    const iv = crypto.randomBytes(16);
    const key = crypto.pbkdf2Sync(masterKey, salt, 100000, 32, 'sha512');
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return 'enc:' + Buffer.concat([salt, iv, tag, encrypted]).toString('hex');
}

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

    // 1. Generate valid RSA Private Key in PEM format
    const { privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    console.log('🔑 Generated valid RSA-2048 Private Key PEM');

    // 2. Encrypt and Update in database
    const encKey = encrypt(privateKey);
    await client.query('UPDATE health_check_settings SET vneid_private_key = $1', [encKey]);
    console.log('✅ Updated health_check_settings with encrypted valid Private Key');

    await client.end();
}

main().catch(e => console.error('Error:', e.message));
