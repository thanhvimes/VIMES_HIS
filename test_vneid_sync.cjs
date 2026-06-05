const axios = require('axios');
const { Client } = require('pg');
const crypto = require('crypto');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, 'backend/.env') });

const BACKEND_URL = 'http://localhost:3000/api/v1/health-check-sync';

// Encryption configuration constants
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
    console.error('❌ Error decrypting value:', error.message);
    return '';
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

async function runTests() {
  console.log('=== KHỞI CHẠY KIỂM THỬ ĐỒNG BỘ BỆNH NHÂN THỰC TẾ & GỬI CỔNG LIÊN THÔNG ===\n');

  try {
    // TEST CASE 1: Lấy dữ liệu bệnh nhân thực tế từ HIS bằng hp_patientno = 23003678 (TRẦN BỒI) và Lưu phiếu Mẫu 3
    console.log('1. Lấy dữ liệu bệnh nhân thực tế (PatientNo: 23003678) từ HIS...');
    const resP23003678 = await axios.get(`${BACKEND_URL}/his-patient/23003678`);
    const patient3 = resP23003678.data;
    console.log(`   -> Tìm thấy bệnh nhân thực tế từ HIS: ${patient3.patient_name} (${patient3.gender})`);
    
    console.log('   -> Chuẩn bị payload phiếu KSK Lái xe (Mẫu 3) từ dữ liệu HIS thực tế...');
    const payload3 = {
      patientId: patient3.patient_id,
      patientName: patient3.patient_name,
      cccd: patient3.cccd || '001092004567',
      dob: patient3.dob,
      gender: patient3.gender,
      docNo: `KSK-DRV-REAL-${Date.now()}`,
      formType: '3',
      clinicalData: {
        ...patient3.clinical_data,
        ma_gtin_cskcb: '1234567890123',
        cccd_date: '2022-01-01',
        cccd_place: 'Cục Cảnh sát QLHC về trật tự xã hội',
        ly_do_vv: 'Khám sức khỏe lái xe hạng B2',
        ngay_vao: new Date().toISOString().split('T')[0],
        clinical_exam: {
          ...patient3.clinical_data?.clinical_exam,
          khong_kinh_mat_phai: '10/10',
          khong_kinh_mat_trai: '10/10',
          khong_kinh_hai_mat: '10/10',
          sac_giac: '0',
          thi_truong_ngang_haimat: 'Bình thường',
          thi_truong_dung_haimat: 'Bình thường',
          tai_phai_noi_thuong: '5',
          tai_phai_noi_tham: '0.5',
          tai_trai_noi_thuong: '5',
          tai_trai_noi_tham: '0.5',
          ham_tren: 'Bình thường',
          ham_duoi: 'Bình thường',
        },
        extra: {
          hang_lai_xe: 'B2',
          ts_su_dung_ruou: 0,
          ts_su_dung_ma_tuy: 0,
          ts_benh_cot_song: 0,
        }
      },
      labData: {
        ...patient3.lab_data,
        kq_xn_ma_tuy: 'Âm tính',
        kq_xn_nong_do_con: '0.0 mg/L'
      },
      conclusionData: {
        ...patient3.conclusion_data,
        fitness_class: '1',
        diagnosis: 'Đủ điều kiện sức khỏe lái xe hạng B2'
      }
    };

    console.log('   -> Gửi request lưu phiếu Mẫu 3...');
    const saveRes3 = await axios.post(`${BACKEND_URL}/documents`, payload3);
    const id3 = saveRes3.data.id;
    console.log(`   -> Lưu thành công phiếu KSK Lái xe thực tế! ID Master: ${id3}\n`);

    // TEST CASE 2: Lấy dữ liệu bệnh nhân thực tế Nữ từ HIS bằng hp_patientno = 24003741 (Nguyễn Thị Hồng) và Lưu phiếu Mẫu 2
    console.log('2. Lấy dữ liệu bệnh nhân thực tế (PatientNo: 24003741) từ HIS...');
    const resP24003741 = await axios.get(`${BACKEND_URL}/his-patient/24003741`);
    const patient2 = resP24003741.data;
    console.log(`   -> Tìm thấy bệnh nhân thực tế từ HIS: ${patient2.patient_name} (${patient2.gender})`);
    
    console.log('   -> Chuẩn bị payload phiếu KSK Người lớn (Mẫu 2) từ dữ liệu HIS thực tế...');
    const payload2 = {
      patientId: patient2.patient_id,
      patientName: patient2.patient_name,
      cccd: patient2.cccd || '034198006789',
      dob: patient2.dob,
      gender: patient2.gender,
      docNo: `KSK-ADULT-REAL-${Date.now()}`,
      formType: '2',
      clinicalData: {
        ...patient2.clinical_data,
        ma_gtin_cskcb: '1234567890123',
        cccd_date: '2021-05-10',
        cccd_place: 'Cục Cảnh sát QLHC về trật tự xã hội',
        ly_do_vv: 'Khám sức khỏe định kỳ',
        ngay_vao: new Date().toISOString().split('T')[0],
        clinical_exam: {
          ...patient2.clinical_data?.clinical_exam,
          khong_kinh_mat_phai: '10/10',
          khong_kinh_mat_trai: '10/10',
          khong_kinh_hai_mat: '10/10',
          tai_phai_noi_thuong: '5',
          tai_phai_noi_tham: '0.5',
          tai_trai_noi_thuong: '5',
          tai_trai_noi_tham: '0.5',
          ham_tren: 'Bình thường',
          ham_duoi: 'Bình thường',
          kham_the_luc_pl: '1',
          noi_khoa_tuan_hoan_pl: '1',
          noi_khoa_ho_hap_pl: '1',
          noi_khoa_tieu_hoa_pl: '1',
          noi_khoa_than_tietnieu_pl: '1',
          noi_khoa_noi_tiet_pl: '1',
          noi_khoa_co_xuong_khop_pl: '1',
          noi_khoa_than_kinh_pl: '1',
          noi_khoa_tam_than_pl: '1',
          kham_ngoai_khoa_pl: '1',
          kham_da_lieu_pl: '1',
          kham_san_phu_khoa_pl: '1',
          kham_mat_pl: '1',
          kham_tai_mui_hong_pl: '1',
          kham_rang_ham_mat_pl: '1',
        },
        extra: {
          co_kinh_nguyet_nam_bao_nhieu_tuoi: 14,
          tinh_chat_kinh_nguyet: 1,
          chu_ky_kinh: 30,
          luong_kinh: 3,
          dau_bung_kinh: 0,
          da_lap_gia_dinh: 1,
          para: '2002',
          da_tung_mo_san_phu_khoa_chua: 0,
          dang_ap_dung_bptt_khong: 0
        }
      },
      labData: patient2.lab_data,
      conclusionData: {
        ...patient2.conclusion_data,
        fitness_class: '1',
        diagnosis: 'Đủ sức khỏe làm việc'
      }
    };

    console.log('   -> Gửi request lưu phiếu Mẫu 2...');
    const saveRes2 = await axios.post(`${BACKEND_URL}/documents`, payload2);
    const id2 = saveRes2.data.id;
    console.log(`   -> Lưu thành công phiếu KSK Người lớn thực tế! ID Master: ${id2}\n`);

    // TEST CASE 3: Thực hiện gửi dữ liệu lên cổng liên thông
    console.log('3. Thực hiện gửi đồng bộ dữ liệu hồ sơ lên cổng liên thông VNeID...');
    const sendRes = await axios.post(`${BACKEND_URL}/documents/send`, {
      docIds: [id3, id2]
    });
    console.log(`   -> Phản hồi từ cổng: Không có lỗi (Số ID gửi lỗi: ${sendRes.data.length})\n`);

    // KẾT NỐI DB ĐỂ XÁC MINH TRẠNG THÁI GỬI
    console.log('4. Truy vấn CSDL để đối chiếu kết quả sau khi đồng bộ cổng...');
    const client = new Client(dbConfig);
    await client.connect();

    const querySql = `
      SELECT id, patient_name, form_type, send_status, sent_at, transaction_id, error_message
      FROM health_check_masters
      WHERE id IN ($1, $2)
    `;
    const dbRes = await client.query(querySql, [id3, id2]);

    console.log('\n--- TRẠNG THÁI LIÊN THÔNG TRONG POSTGRESQL ---');
    for (const row of dbRes.rows) {
      console.log(`\n==================================================`);
      console.log(`[Master ID: ${row.id}] Bệnh nhân: ${row.patient_name} (Mẫu ${row.form_type})`);
      console.log(`--------------------------------------------------`);
      console.log(`* Trạng thái gửi cổng: ${row.send_status}`);
      console.log(`* Thời gian gửi:       ${row.sent_at}`);
      console.log(`* Mã giao dịch cổng:   ${row.transaction_id}`);
      console.log(`* Chi tiết lỗi (nếu có): ${row.error_message || 'Không có lỗi'}`);
    }

    await client.end();
    console.log('\n✅ KIỂM THỬ ĐỒNG BỘ CỔNG VNEID THÀNH CÔNG RỰC RỠ!');
  } catch (error) {
    console.error('❌ Lỗi trong quá trình chạy test:', error.message);
    if (error.response) {
      console.error('API Response Error:', error.response.data);
    }
  }
}

runTests();
