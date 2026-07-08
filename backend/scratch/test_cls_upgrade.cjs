/**
 * Test script to verify the Paraclinical Sync upgrade logic.
 * Run this script with: node backend/scratch/test_cls_upgrade.cjs
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const ALGORITHM = 'enc:';
function decrypt(cipherText) {
  if (!cipherText) return '';
  if (!cipherText.startsWith('enc:')) return cipherText;
  try {
    const rawCipherText = cipherText.replace('enc:', '');
    const masterKey = process.env.VIMES_SECURITY_KEY || 'default-secret-vClinic-2026-key-32chars';
    const data = Buffer.from(rawCipherText, 'hex');
    const salt = data.subarray(0, 64);
    const iv = data.subarray(64, 64 + 16);
    const tag = data.subarray(64 + 16, 64 + 16 + 16);
    const text = data.subarray(64 + 16 + 16);
    const key = crypto.pbkdf2Sync(masterKey, salt, 100000, 32, 'sha512');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(text, 'binary', 'utf8') + decipher.final('utf8');
  } catch (error) {
    console.error('❌ Error decrypting value:', error.message);
    return '';
  }
}

const dbConfig = {
  user: decrypt(process.env.DB_USER || 'postgres'),
  host: process.env.DB_HOST || '115.74.226.237',
  database: process.env.DB_NAME || 'vimes_130',
  password: decrypt(process.env.DB_PASSWORD || 'Password123!'),
  port: parseInt(process.env.DB_PORT || '5432', 10),
};

// 1. Simulate the Pacs Type mapping logic
async function testPacsTypeMapping(client) {
  console.log('\n--- 1. Testing PACS Type Mapping ---');
  
  // Load mappings from database
  const mappingMap = new Map();
  try {
    const mappingRes = await client.query('SELECT service_code, cls_type FROM health_check_service_mappings');
    for (const r of mappingRes.rows) {
      mappingMap.set(String(r.service_code).trim(), r.cls_type);
    }
    console.log(`Loaded ${mappingMap.size} service mappings from database.`);
  } catch (err) {
    console.error('⚠️ Check mapping: health_check_service_mappings table not loaded.', err.message);
    return false;
  }

  // The classification function under test
  const determinePacsType = (gid, gname, sname, serviceCode) => {
    if (serviceCode) {
      const cleanCode = String(serviceCode).trim();
      if (mappingMap.has(cleanCode)) {
        return mappingMap.get(cleanCode);
      }
    }
    const id = String(gid || '').toUpperCase();
    if (id.startsWith('A') || id.startsWith('B1')) return 'XN';
    if (id.startsWith('B2')) return 'HA';
    if (id.startsWith('B3')) return 'TD';
    
    const nameLower = String(gname || '').toLowerCase();
    const sNameLower = String(sname || '').toLowerCase();
    
    if (sNameLower.includes('điện tim') || sNameLower.includes('thăm dò')) return 'TD';
    if (sNameLower.includes('siêu âm') || sNameLower.includes('chụp')) return 'HA';
    return 'HA'; // Default fallback
  };

  // Assertions
  const tests = [
    { gid: 'A01', gname: 'Test', sname: 'Blood', code: 'A01.001', expected: 'XN', desc: 'Direct DB Mapping (XN)' },
    { gid: 'D10', gname: 'Test', sname: 'ECG', code: 'D10.001', expected: 'TD', desc: 'Direct DB Mapping (TD)' },
    { gid: 'B20', gname: 'Test', sname: 'US', code: 'B20.001', expected: 'HA', desc: 'Direct DB Mapping (HA)' },
    { gid: 'X99', gname: 'Test', sname: 'random', code: 'UNMAPPED_CODE', expected: 'HA', desc: 'Fallback default PACS (HA)' },
    { gid: 'A99', gname: 'Test', sname: 'random', code: 'UNMAPPED_A', expected: 'XN', desc: 'Fallback prefix starts with A (XN)' }
  ];

  let successCount = 0;
  for (const t of tests) {
    const result = determinePacsType(t.gid, t.gname, t.sname, t.code);
    if (result === t.expected) {
      console.log(`✅ Passed: ${t.desc} -> ${result}`);
      successCount++;
    } else {
      console.error(`❌ Failed: ${t.desc}. Expected ${t.expected}, got ${result}`);
    }
  }
  return successCount === tests.length;
}

// 2. Simulate Smart Merge Logic
function testSmartMerge() {
  console.log('\n--- 2. Testing Smart Merge Logic ---');

  const existingItems = [
    { order_id: '101', service_code: 'A01.001', service_name: 'WBC', value: '7.5', conclusion: 'Bình thường', user_edited: true },
    { order_id: '101', service_code: 'A01.002', service_name: 'RBC', value: '4.2', conclusion: 'Bình thường', user_edited: false },
    { order_id: '101', service_code: 'A01.003', service_name: 'HGB', value: '140', conclusion: 'Bình thường' } // user_edited is undefined (falsy)
  ];

  const newItems = [
    { order_id: '101', service_code: 'A01.001', service_name: 'WBC', value: '8.5', conclusion: 'Tăng nhẹ' },
    { order_id: '101', service_code: 'A01.002', service_name: 'RBC', value: '4.8', conclusion: 'Bình thường' },
    { order_id: '101', service_code: 'A01.003', service_name: 'HGB', value: '145', conclusion: 'Bình thường' },
    { order_id: '102', service_code: 'B20.001', service_name: 'Siêu âm bụng', value: 'Bình thường', conclusion: 'Bình thường' } // New item from HIS
  ];

  const mergedItems = [];
  const existingMap = new Map();
  existingItems.forEach((item) => {
    const key = `${item.order_id || ''}_${item.service_code || ''}`;
    existingMap.set(key, item);
  });

  const processedNewKeys = new Set();
  newItems.forEach((newItem) => {
    const key = `${newItem.order_id || ''}_${newItem.service_code || ''}`;
    processedNewKeys.add(key);

    const existingItem = existingMap.get(key);
    if (existingItem) {
      let mergedValue = '';
      let mergedConclusion = '';
      const userEdited = !!existingItem.user_edited;

      if (existingItem.user_edited) {
        // Preserves user edited values
        mergedValue = existingItem.value || '';
        mergedConclusion = existingItem.conclusion || '';
      } else {
        // Normal HIS merge
        mergedValue = newItem.value ? newItem.value : (existingItem.value || '');
        mergedConclusion = newItem.value ? (newItem.conclusion || 'Bình thường') : (existingItem.conclusion || '');
      }

      mergedItems.push({
        ...existingItem,
        ...newItem,
        value: mergedValue,
        conclusion: mergedConclusion,
        is_his_value: !!newItem.value,
        user_edited: userEdited
      });
    } else {
      mergedItems.push({
        ...newItem,
        is_his_value: !!newItem.value,
        user_edited: false
      });
    }
  });

  existingItems.forEach((item) => {
    const key = `${item.order_id || ''}_${item.service_code || ''}`;
    if (!processedNewKeys.has(key)) {
      mergedItems.push({
        ...item,
        is_his_value: false,
        user_edited: !!item.user_edited
      });
    }
  });

  // Verification
  console.log(`Total merged items: ${mergedItems.length}`);
  
  // A01.001: user_edited is true, value should remain 7.5 (not updated to 8.5)
  const item1 = mergedItems.find(i => i.service_code === 'A01.001');
  const pass1 = item1 && item1.value === '7.5' && item1.conclusion === 'Bình thường' && item1.user_edited === true;
  console.log(`${pass1 ? '✅' : '❌'} WBC (A01.001): value = ${item1?.value} (Expected: 7.5, user_edited preserved)`);

  // A01.002: user_edited is false, value should update to 4.8
  const item2 = mergedItems.find(i => i.service_code === 'A01.002');
  const pass2 = item2 && item2.value === '4.8' && item2.user_edited === false;
  console.log(`${pass2 ? '✅' : '❌'} RBC (A01.002): value = ${item2?.value} (Expected: 4.8, updated from HIS)`);

  // A01.003: user_edited is undefined (falsy), value should update to 145
  const item3 = mergedItems.find(i => i.service_code === 'A01.003');
  const pass3 = item3 && item3.value === '145' && item3.user_edited === false;
  console.log(`${pass3 ? '✅' : '❌'} HGB (A01.003): value = ${item3?.value} (Expected: 145, updated from HIS)`);

  // B20.001: new item, should be added with user_edited = false
  const item4 = mergedItems.find(i => i.service_code === 'B20.001');
  const pass4 = item4 && item4.value === 'Bình thường' && item4.user_edited === false;
  console.log(`${pass4 ? '✅' : '❌'} US (B20.001): value = ${item4?.value} (Expected: Bình thường, new item added)`);

  return pass1 && pass2 && pass3 && pass4;
}

// Execute tests
async function runTests() {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    console.log('Connected to DB for static validation.');
    
    const mappingPassed = await testPacsTypeMapping(client);
    const mergePassed = testSmartMerge();

    console.log('\n=========================================');
    if (mappingPassed && mergePassed) {
      console.log('✅ ALL LOGIC TESTS PASSED SUCCESSFULLY!');
    } else {
      console.error('❌ SOME TESTS FAILED. PLEASE CHECK THE OUTPUT.');
    }
    console.log('=========================================');
  } catch (err) {
    console.error('❌ Test runner failed to connect or query DB:', err.message);
    console.log('\nRunning offline smart merge test fallback...');
    const mergePassed = testSmartMerge();
    if (mergePassed) {
      console.log('✅ OFFLINE SMART MERGE TEST PASSED!');
    }
  } finally {
    await client.end();
  }
}

runTests();
