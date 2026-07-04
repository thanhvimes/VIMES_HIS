const axios = require('axios');
const { Client } = require('pg');
const crypto = require('crypto');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env
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
    // If decryption fails, it might be plain text
    return cipherText;
  }
}

const dbUser = decrypt(process.env.DB_USER || 'postgres');
const dbPassword = decrypt(process.env.DB_PASSWORD || 'Password123!');
const dbHost = process.env.DB_HOST || '115.74.226.237';
const dbDatabase = process.env.DB_NAME || 'vimes_130';
const dbPort = parseInt(process.env.DB_PORT || '5432', 10);

const dbConfig = {
  user: dbUser,
  host: dbHost,
  database: dbDatabase,
  password: dbPassword,
  port: dbPort,
};

async function testXmlSend() {
  const client = new Client(dbConfig);
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database:', dbDatabase);

    // 1. Get health check settings
    const settingsRes = await client.query('SELECT vneid_url, vneid_username, vneid_password, ma_cskcb FROM health_check_settings LIMIT 1');
    if (settingsRes.rows.length === 0) {
      console.error('❌ No health check settings found in database!');
      return;
    }
    const settings = settingsRes.rows[0];
    
    // Resolve password
    let vneidPassword = '';
    if (settings.vneid_password) {
      try {
        if (settings.vneid_password.startsWith('enc:')) {
          vneidPassword = decrypt(settings.vneid_password);
        } else {
          vneidPassword = decrypt(settings.vneid_password);
        }
      } catch (err) {
        vneidPassword = decrypt(settings.vneid_password);
      }
    }

    const originUrl = settings.vneid_url.includes('/api/v1') 
      ? settings.vneid_url.split('/api/v1')[0] 
      : settings.vneid_url;

    console.log('\n--- VNeID API Settings ---');
    console.log('Base URL:', settings.vneid_url);
    console.log('Origin URL:', originUrl);
    console.log('Username:', settings.vneid_username);
    console.log('Facility (ma_cskcb):', settings.ma_cskcb);

    // 2. Perform Login
    console.log('\n🔐 Authenticating at:', `${originUrl}/api/auth/login`);
    const loginRes = await axios.post(`${originUrl}/api/auth/login`, {
      username: settings.vneid_username,
      password: vneidPassword
    }, {
      headers: { 'Content-Type': 'application/json', 'Accept': '*/*' },
      timeout: 10000
    });

    const token = loginRes.data?.data?.token || loginRes.data?.token || loginRes.data?.data;
    if (!token) {
      console.error('❌ Authentication failed! No token returned. Response:', loginRes.data);
      return;
    }
    console.log('✅ Login Successful! Token length:', token.length);

    // 3. Find a real document to send, or fallback to dummy XML
    const docRes = await client.query(`
      SELECT id, doc_no, xml_data, patient_name 
      FROM health_check_masters 
      WHERE xml_data IS NOT NULL AND xml_data <> ''
      ORDER BY updated_at DESC LIMIT 1
    `);

    let docNo = 'TEST-0001';
    let patientName = 'Nguyễn Văn Test';
    let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
    <GIAY_KSK>
      <FACILITY>${settings.ma_cskcb}</FACILITY>
      <PATIENT_NAME>Nguyễn Văn Test</PATIENT_NAME>
      <TEST_DATA>Dummy Test XML for CSDLKSK integration</TEST_DATA>
    </GIAY_KSK>`;

    if (docRes.rows.length > 0) {
      const doc = docRes.rows[0];
      docNo = doc.doc_no;
      patientName = doc.patient_name;
      xmlContent = doc.xml_data;
      console.log(`\n📄 Found document in database: ${docNo} (Patient: ${patientName})`);
    } else {
      console.log('\n⚠️ No document with XML found in DB, using dummy XML payload.');
    }

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

    // 4. Send document XML to gateway
    const finalPushUrl = `${originUrl}/api/v1/platform/data-sync/push`;
    console.log(`\n📡 Pushing XML payload to: ${finalPushUrl}`);
    console.log('Sending payload headers...');
    
    try {
      const pushRes = await axios.post(finalPushUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'service-type': '100'
        },
        timeout: 15000
      });

      console.log('\n🎉 --- Gateway response ---');
      console.log('Status Code:', pushRes.status);
      console.log('Response JSON:', JSON.stringify(pushRes.data, null, 2));
    } catch (err) {
      console.error('\n❌ --- Gateway Push Error ---');
      if (err.response) {
        console.error('Status Code:', err.response.status);
        console.error('Error Body:', JSON.stringify(err.response.data, null, 2));
      } else {
        console.error('Network Error message:', err.message);
      }
    }

  } catch (err) {
    console.error('❌ Script Execution Error:', err);
  } finally {
    await client.end();
  }
}

testXmlSend();
