const axios = require('axios');
const { Client } = require('pg');
const crypto = require('crypto');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const ITERATIONS = 100000;
const KEY_LENGTH = 32;

function decrypt(cipherText) {
  if (!cipherText) return '';
  let hexText = cipherText;
  if (cipherText.startsWith('enc:')) {
    hexText = cipherText.replace('enc:', '');
  }
  try {
    const masterKey = process.env.VIMES_SECURITY_KEY || 'default-secret-vClinic-2026-key-32chars';
    const data = Buffer.from(hexText, 'hex');

    const salt = data.subarray(0, SALT_LENGTH);
    const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = data.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const text = data.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

    const key = crypto.pbkdf2Sync(masterKey, salt, ITERATIONS, KEY_LENGTH, 'sha512');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    return decipher.update(text, 'binary', 'utf8') + decipher.final('utf8');
  } catch (error) {
    return cipherText;
  }
}

const dbUser = decrypt(process.env.DB_USER || 'postgres');
const dbPassword = decrypt(process.env.DB_PASSWORD || 'Password123!');
const dbHost = process.env.DB_HOST || '115.74.226.237';
const dbDatabase = process.env.DB_NAME || 'vimes_nb';
const dbPort = parseInt(process.env.DB_PORT || '5432', 10);

const dbConfig = {
  user: dbUser,
  host: dbHost,
  database: dbDatabase,
  password: dbPassword,
  port: dbPort,
};

async function testAllEndpoints() {
  const client = new Client(dbConfig);
  try {
    console.log('Connecting to database...');
    await client.connect();
    const settingsRes = await client.query('SELECT vneid_url, vneid_username, vneid_password FROM health_check_settings LIMIT 1');
    const settings = settingsRes.rows[0];
    
    let vneidPassword = decrypt(settings.vneid_password);

    const domains = [
      'https://api.csdlksk.vn',
      'https://api.emrhub.vn'
    ];

    for (const domain of domains) {
      console.log(`\n=============================================`);
      console.log(`🌐 TESTING DOMAIN: ${domain}`);
      console.log(`=============================================`);
      
      let token = null;
      try {
        console.log(`🔐 Logging in to: ${domain}/api/auth/login ...`);
        const loginRes = await axios.post(`${domain}/api/auth/login`, {
          username: settings.vneid_username,
          password: vneidPassword
        });
        
        console.log('✅ Login Success!');
        console.log('Response headers:', loginRes.headers);
        console.log('Response body:', JSON.stringify(loginRes.data, null, 2));
        
        token = loginRes.data?.data?.token || loginRes.data?.token || loginRes.data?.data;
      } catch (err) {
        console.log(`❌ Login Failed on ${domain}:`, err.response ? `${err.response.status} - ${JSON.stringify(err.response.data)}` : err.message);
        continue;
      }

      if (!token) {
        console.log(`⚠️ No token received for ${domain}, skipping push tests.`);
        continue;
      }

      // Construct valid test payload
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
      <GIAY_KSK>
        <FACILITY>${settings.ma_cskcb}</FACILITY>
        <PATIENT_NAME>Nguyễn Văn Test</PATIENT_NAME>
        <TEST_DATA>Dummy Test XML for CSDLKSK integration</TEST_DATA>
      </GIAY_KSK>`;
      const base64Xml = Buffer.from(xmlContent).toString('base64');
      const now = new Date();
      const yy = String(now.getFullYear()).slice(-2);
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const uuidStr = crypto.randomUUID().replace(/-/g, '');
      const msgId = `${settings.ma_cskcb}${yy}${mm}${dd}${uuidStr}`;

      const payload = {
        header: {
          version: "1.0.0",
          sender_id: settings.ma_cskcb,
          receiver_id: "TDLBYT",
          txn_type: "sync_checkup",
          msg_id: msgId,
          msg_type: "101",
          data_type: "xml/base64",
          send_datetime: Date.now()
        },
        data: {
          file_content: base64Xml
        }
      };

      const candidates = [
        '/api/platform/data-sync/push',
        '/api/v1/platform/data-sync/push',
        '/api/v1/platform/data_sync/push',
        '/api/v1/platform/sync/push',
        '/api/v1/platform/sync',
        '/api/v1/sync_checkup',
        '/api/integrate/v1/G12'
      ];

      console.log(`\nTesting candidate endpoints on ${domain}...`);
      for (const pathStr of candidates) {
        const url = `${domain}${pathStr}`;
        try {
          console.log(`Testing POST to: ${url}`);
          const res = await axios.post(url, payload, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'service-type': '100'
            },
            timeout: 5000
          });
          console.log(`🔴 SUCCESS! Status: ${res.status}`);
          console.log('Response:', JSON.stringify(res.data));
        } catch (err) {
          if (err.response) {
            console.log(`❌ Status: ${err.response.status}`);
            console.log('Message:', JSON.stringify(err.response.data));
          } else {
            console.log(`❌ Error: ${err.message}`);
          }
        }
      }
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

testAllEndpoints();
