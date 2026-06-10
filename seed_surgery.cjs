const { Client } = require('d:/AI/vClinic/backend/node_modules/pg');
const crypto = require('crypto');
const dotenv = require('d:/AI/vClinic/backend/node_modules/dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'backend/.env') });

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const ITERATIONS = 100000;
const KEY_LENGTH = 32;

function decrypt(cipherText) {
  if (!cipherText) return '';
  if (!cipherText.startsWith('enc:')) {
    return cipherText;
  }
  try {
    const rawCipherText = cipherText.replace('enc:', '');
    const masterKey = process.env.VIMES_SECURITY_KEY || 'default-secret-vClinic-2026-key-32chars';
    const data = Buffer.from(rawCipherText, 'hex');

    const salt = data.subarray(0, SALT_LENGTH);
    const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = data.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const text = data.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

    const key = crypto.pbkdf2Sync(masterKey, salt, ITERATIONS, KEY_LENGTH, 'sha512');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    return decipher.update(text, 'binary', 'utf8') + decipher.final('utf8');
  } catch (error) {
    return '';
  }
}

const dbConfig = {
  host: process.env.DB_HOST || '115.74.226.237',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'vimes_130',
  user: decrypt(process.env.DB_USER),
  password: decrypt(process.env.DB_PASSWORD)
};

async function seed() {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    console.log('Connected to database!');

    // 1. Fetch 4 real patients/docs from database
    console.log('Fetching 4 patients from database...');
    const patientRes = await client.query(`
      SELECT DISTINCT d.hd_docno, d.hd_patientno,
             trim(p.hp_surname || ' ' || COALESCE(p.hp_midname,'') || ' ' || p.hp_firstname) as name
      FROM hms_doc d
      JOIN hms_patient p ON p.hp_patientno = d.hd_patientno
      ORDER BY d.hd_docno DESC LIMIT 4
    `);

    if (patientRes.rows.length < 4) {
      console.error('Not enough patient records to seed.');
      return;
    }

    const maxIdxRes = await client.query('SELECT MAX(ho_idx) as max_i FROM hms_operation');
    const maxBoardIdRes = await client.query('SELECT MAX(hob_operation_board_id) as max_b FROM hms_operation_board');
    
    let nextIdx = (maxIdxRes.rows[0].max_i || 90000) + 1;
    let nextBoardId = (maxBoardIdRes.rows[0].max_b || 0) + 1;

    const patients = patientRes.rows;
    console.log(`Fetched 4 patients:`, patients.map(p => p.name));

    // Clear old test data in hms_operation for these docnos to avoid conflict
    const docNos = patients.map(p => p.hd_docno);
    await client.query('DELETE FROM hms_operation WHERE ho_docno = ANY($1)', [docNos]);
    await client.query('DELETE FROM hms_operation_board WHERE hob_docno = ANY($1)', [docNos]);

    // Define 4 mock states for today
    const surgeryStates = [
      { status: 'P', room: 1, expected: '08:30', perform: null, desc: 'Chuẩn bị' },
      { status: 'S', room: 2, expected: '09:15', perform: '09:10', desc: 'Đang phẫu thuật' },
      { status: 'R', room: 1, expected: '10:00', perform: '09:55', desc: 'Hồi tỉnh' },
      { status: 'F', room: 2, expected: '11:30', perform: '11:25', desc: 'Đã về khoa' }
    ];

    console.log('\nSeeding ca mổ cho ngày hôm nay...');
    for (let i = 0; i < 4; i++) {
      const p = patients[i];
      const state = surgeryStates[i];
      const idx = nextIdx++;

      const expectedDate = new Date();
      const [expH, expM] = state.expected.split(':');
      expectedDate.setHours(parseInt(expH), parseInt(expM), 0, 0);

      let performDate = null;
      if (state.perform) {
        performDate = new Date();
        const [perfH, perfM] = state.perform.split(':');
        performDate.setHours(parseInt(perfH), parseInt(perfM), 0, 0);
      }

      // Insert into hms_operation
      await client.query(`
        INSERT INTO hms_operation (
          ho_idx, ho_docno, ho_patientno, ho_deptid, ho_roomid, 
          ho_startdate, ho_performdate, ho_status, ho_createddate
        ) VALUES ($1, $2, $3, 'KB', $4, $5, $6, $7, NOW())
      `, [idx, p.hd_docno, p.hd_patientno, state.room, expectedDate, performDate, state.status]);

      // Insert into hms_operation_board (for real-time board QMS tracking)
      const boardId = nextBoardId++;
      await client.query(`
        INSERT INTO hms_operation_board (
          hob_operation_board_id, hob_docno, hob_roomid, hob_date, hob_status, hob_deptid
        ) VALUES ($1, $2, $3, CURRENT_DATE, $4, 'KB')
      `, [boardId, p.hd_docno, state.room, state.status]);

      console.log(`- Ca mổ ${i+1}: ${p.name} - Phòng mổ ${state.room} - Trạng thái: ${state.desc}`);
    }

    console.log('\n✅ SEED PHÒNG MỔ THÀNH CÔNG!');
    console.log('Bạn hãy F5 màn hình phòng mổ để xem kết quả hiển thị.');

  } catch (err) {
    console.error('❌ Error seeding surgery data:', err.message);
  } finally {
    await client.end();
  }
}

seed();
