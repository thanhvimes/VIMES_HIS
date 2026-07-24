const { Client } = require('d:/AI/VIMES_HIS/backend/node_modules/pg');
const crypto = require('crypto');
const dotenv = require('d:/AI/VIMES_HIS/backend/node_modules/dotenv');
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
  host: process.env.DB_HOST || '10.1.3.200',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'vimes_jsc',
  user: decrypt(process.env.DB_USER),
  password: decrypt(process.env.DB_PASSWORD)
};

// 10 Vietnamese names
const SAMPLE_NAMES = [
  { surname: 'Nguyễn', midname: 'Văn', firstname: 'An', sex: 'M', birth: '1990-05-15', status: 'O', pending: 'O' }, // Đang chờ
  { surname: 'Trần', midname: 'Thị', firstname: 'Bình', sex: 'F', birth: '1985-08-20', status: 'O', pending: 'O' }, // Đang chờ
  { surname: 'Phạm', midname: 'Hoàng', firstname: 'Cường', sex: 'M', birth: '1975-12-02', status: 'O', pending: 'O' }, // Đang chờ
  { surname: 'Lê', midname: 'Thị', firstname: 'Dung', sex: 'F', birth: '1995-03-10', status: 'O', pending: 'O' }, // Đang chờ
  { surname: 'Hoàng', midname: 'Văn', firstname: 'Em', sex: 'M', birth: '1960-11-25', status: 'O', pending: 'A' }, // Chờ kết luận (pending = A, status = O)
  { surname: 'Vũ', midname: 'Thị', firstname: 'Hoa', sex: 'F', birth: '1988-07-30', status: 'O', pending: 'A' }, // Chờ kết luận (pending = A, status = O)
  { surname: 'Phan', midname: 'Thanh', firstname: 'Hải', sex: 'M', birth: '1992-09-18', status: 'O', pending: 'A' }, // Chờ kết luận (pending = A, status = O)
  { surname: 'Bùi', midname: 'Thị', firstname: 'Mai', sex: 'F', birth: '1950-01-05', status: 'T', pending: 'A' }, // Đã khám (pending = A, status = T)
  { surname: 'Đặng', midname: 'Văn', firstname: 'Nam', sex: 'M', birth: '1970-04-12', status: 'T', pending: 'A' }, // Đã khám (pending = A, status = T)
  { surname: 'Ngô', midname: 'Thị', firstname: 'Oanh', sex: 'F', birth: '1983-06-22', status: 'T', pending: 'A' } // Đã khám (pending = A, status = T)
];

async function seed() {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    console.log('Connected to database!');

    // Get max patient_no and doc_no to avoid PK conflicts
    const maxPatientRes = await client.query('SELECT MAX(hp_patientno) as max_p FROM hms_patient');
    const maxDocRes = await client.query('SELECT MAX(hd_docno) as max_d FROM hms_doc');
    const maxTicketRes = await client.query("SELECT MAX(hep_receptno) as max_t FROM hms_exam_pending WHERE hep_date = CURRENT_DATE");

    let nextPatientNo = (maxPatientRes.rows[0].max_p || 95000000) + 1;
    let nextDocNo = (maxDocRes.rows[0].max_d || 26000000) + 1;
    let nextTicketNo = (maxTicketRes.rows[0].max_t || 100) + 1;

    // We will use room 1, dept 'KB' as default for testing
    const targetRoomId = 1;
    const targetDeptId = 'KB';

    console.log(`Starting seed from:`);
    console.log(`- PatientNo: ${nextPatientNo}`);
    console.log(`- DocNo: ${nextDocNo}`);
    console.log(`- TicketNo (today): ${nextTicketNo}`);

    const seededPatients = [];

    for (const item of SAMPLE_NAMES) {
      const pNo = nextPatientNo++;
      const pId = String(pNo);
      const dNo = nextDocNo++;
      const tNo = nextTicketNo++;

      const fullName = `${item.surname} ${item.midname} ${item.firstname}`;

      // 1. Insert patient
      await client.query(`
        INSERT INTO hms_patient (hp_patientno, hp_patientid, hp_surname, hp_midname, hp_firstname, hp_birthdate, hp_sex, hp_createddate)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `, [pNo, pId, item.surname, item.midname, item.firstname, item.birth, item.sex]);

      // 2. Insert doc
      await client.query(`
        INSERT INTO hms_doc (hd_patientno, hd_docno, hd_status, hd_yofage, hd_createddate)
        VALUES ($1, $2, $3, $4, NOW())
      `, [pNo, dNo, item.status, new Date().getFullYear() - new Date(item.birth).getFullYear()]);

      // 3. Insert exam pending
      await client.query(`
        INSERT INTO hms_exam_pending (hep_docno, hep_deptid, hep_roomid, hep_receptidx, hep_receptno, hep_orderid, hep_pending, hep_type, hep_date)
        VALUES ($1, $2, $3, 0, $4, 0, $5, 'E', CURRENT_DATE)
      `, [dNo, targetDeptId, targetRoomId, tNo, item.pending]);

      // 4. Record output
      let stateLabel = '';
      if (item.pending === 'O') {
        stateLabel = 'Đang chờ (Waiting)';
      } else if (item.pending === 'A') {
        if (item.status === 'O') {
          stateLabel = 'Chờ kết luận (Concluding)';
        } else {
          stateLabel = 'Đã khám (Examined)';
        }
      }

      seededPatients.push({
        ticketNumber: tNo,
        patientName: fullName,
        patientNo: pNo,
        docNo: dNo,
        state: stateLabel
      });
    }

    console.log('\n✅ SEED COMPLETED SUCCESSFULLY!');
    console.log('--- SEEDED PATIENTS INFO ---');
    console.table(seededPatients);

  } catch (err) {
    console.error('❌ Error seeding patients:', err);
  } finally {
    await client.end();
  }
}

seed();
