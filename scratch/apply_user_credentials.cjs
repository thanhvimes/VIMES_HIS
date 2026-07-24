const { Client } = require('pg');
const crypto = require('crypto');
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

// Account details from tai_khoan.txt
const rawPrivateKeyB64 = `MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDDUMitnqYjnO55+YmB1G/3/1aEj4BlygA91yia3Hd99PA7D79c2XnHN3PTZxn2nFDnfONg8om6qBxCA8fs5rBsog9ireh91YDe3dm642mEvejqxzRdtuzg4Pb6L2JZzsg5i5skZoKrvYeiF1S63bLxWzh8Vf0g1andSxdrRmAadVEpFXiu10kMtiFU2+Q+KPSquhXh10izuTGPgqibJfiaFNqxrqB+q2cW6EPJLaoHNYaPfkjwXuCAZziLNJLsZiRmJgOBFpsYdAkHwDJlSbERf5UcmE9GfwKih1OhhALU3tz+T++JE3LImLzckFvHIWwJTcRxF8ipLO9l/7oJuNvVAgMBAAECggEAXvNC28Sol9+Ov5VkF82isTlcYg0xKkrNW0Lh5ocPQBh3QP8i1IyU+xgmIruYj57mZeL81wCRnEBlnGIiKzTqx6TxPdO1lpbYk3/efVBY18NLG/fDqVtoRNqYtn+anHY+OFt6DHQZSkxVR6N3+XAVsefayfczm2bDsWTz+Z640aMkpeWm1N7bqSmoeVPDyn/6CliMHHl4+2Hb8k9tUgCHx/KKh/U4/rkHmOfGyVjGGITTeHdbY9DeOpvG76e20i5Rn9pSy9zKKJ9IQ7/2YknhZD7AIHCVK+iFgWv7RkfgCjULM4Lpkbo3hbRhT/QSx+jSROD4UGAK15fYMgarFMB58QKBgQDzSSrq1TErd/EYw+Fy4vDrtLzbiNH7NonfcBVeAliaAK0x8xfT/Pek8RHUrt+u1UD/tMfywqRXU3h+ARCFBbR7nkASN2ht1sSrbxEqUb309des1b0Qzjo3QZvhaEXCVjEDsQGQOMdILBIXVwt45T/jKvpGhpvGIgw6MEtBJ/yJKwKBgQDNhdb5gECUPn5gD6y3whpVLgWIWETNBB7Wim2VaKQFugJMxSXRIqVnsEW1EFg02FLcDHmwPkdsgqKr65HkGmYpnXkX1sfv8/1U5OMlf8LbyBbSVMy8VBjQkdugndFnuMfW2tYgJvdmz7oMHJnaI+ao3eoX29NPYQUBHGMlxVOu/wKBgQDFvqIgsFq//0S7oXOdYzL6EzUyp/otW74jHEJx4CxOOOCN6g5jI4nSypN4sQ9lVzb24OVov6a+yDz3Bjx8Mw/pLs7bP6glJ11CDwv/vuNMuYqtlCmSAF43TZ+7TnrtJAvA+V3Q8SWh1xh5WiocARK1vdgh/QWevUv8/AYfFrZgcwKBgQCHCQ06WZ4UyQrXqvTct9f9Z4OTFgv+eFqas9FUfbBnYtPoBRDX3F+5RQRH9zk9X3Txx/CccA8VqK+hLeJpcT720NSjaSds7W7hvJHSLaOmLE1yXO04QDkdsPgRDCBueeYzsQ1HitK65nljQ9eCkFwZT9VjX7fzS9ex5yjtxD07mQKBgQDXjaYD0PpKmC034w+NX/V6SDOoPpFqDibYwk3JRGhM96UDFNjQCfzY2DRkZeW90nQlldowO8o5DXNlJV+SCFFGfI75BdEHoC1fXPANZbmBMRW6x9szqpa68l5R0LUSyYQWjAHqF4fuc5doF2toz8fUxcSoD3JkNszGyg9SVCp0lQ==`;

// Format as PEM
const lines = rawPrivateKeyB64.match(/.{1,64}/g).join('\n');
const pemPrivateKey = `-----BEGIN PRIVATE KEY-----\n${lines}\n-----END PRIVATE KEY-----`;

console.log('✅ Formatted PEM Private Key successfully');

async function main() {
    const client = new Client({ user, password, host, port, database });
    await client.connect();

    const encKey = encrypt(pemPrivateKey);
    const encPass = encrypt('Abc@1234');

    await client.query(`
        UPDATE health_check_settings
        SET vneid_username = '8934285008135_api',
            vneid_password = $1,
            vneid_private_key = $2,
            vneid_url = 'https://api-sandbox.emrhub.vn'
        WHERE id = 1 OR id IS NOT NULL
    `, [encPass, encKey]);

    console.log('🎉 Updated health_check_settings with REAL Private Key & Sandbox URL in DB');
    await client.end();
}

main().catch(e => console.error('Error:', e.message));
