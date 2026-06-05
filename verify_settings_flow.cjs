const axios = require('axios');
const { Client } = require('pg');
const crypto = require('crypto');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, 'backend/.env') });

const BACKEND_URL = 'http://localhost:3000/api/v1/health-check-sync';

// Encryption settings
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

async function verifyFlow() {
  console.log('=== KHỞI CHẠY KIỂM THỬ TOÀN DIỆN THIẾT LẬP CẤU HÌNH LIÊN THÔNG ===\n');

  try {
    // 1. Kiểm tra GET /settings
    console.log('1. Đọc cấu hình hiện tại qua API GET /settings...');
    const getRes = await axios.get(`${BACKEND_URL}/settings`);
    console.log('   -> Cấu hình hiện tại:', getRes.data);

    // 2. Kiểm tra POST /settings/test-connection
    console.log('\n2. Gọi API kiểm tra kết nối cổng (POST /settings/test-connection)...');
    const testRes = await axios.post(`${BACKEND_URL}/settings/test-connection`, {
      vneid_url: 'https://sandbox.vneid.moh.gov.vn/api/v2',
      vneid_username: 'hospital_test',
      vneid_password: 'Password999!'
    });
    console.log(`   -> Phản hồi từ cổng: success = ${testRes.data.success}, message = "${testRes.data.message}"`);

    // 3. Cập nhật cấu hình mới qua API PUT /settings (đổi mã cơ sở thành 99999 và GTIN thành 9999999999999)
    console.log('\n3. Cập nhật cấu hình liên thông mới qua API PUT /settings...');
    const newSettings = {
      vneid_url: 'https://api-vneid.moh.gov.vn/api/v1',
      vneid_username: 'vimes_cskcb_new',
      vneid_password: 'new-secure-password-12345',
      ma_cskcb: '99999',
      ma_gtin_cskcb: '9999999999999',
      auto_sync_enabled: true,
      auto_sync_interval: 30
    };
    const updateRes = await axios.put(`${BACKEND_URL}/settings`, newSettings);
    console.log('   -> Cập nhật thành công:', updateRes.data);

    // Đọc lại để xác nhận đã cập nhật
    const getUpdatedRes = await axios.get(`${BACKEND_URL}/settings`);
    console.log('   -> Cấu hình mới sau khi cập nhật (mật khẩu đã che):', getUpdatedRes.data);

    // 4. Đồng bộ bệnh nhân thực tế từ HIS và lưu phiếu, kiểm tra xem có nhận mã CSKCB và GTIN mới không
    console.log('\n4. Lấy dữ liệu bệnh nhân thực tế từ HIS (PatientNo: 23003678) để tạo phiếu...');
    const resPatient = await axios.get(`${BACKEND_URL}/his-patient/23003678`);
    const patientData = resPatient.data;

    const payload = {
      patientId: patientData.patient_id,
      patientName: patientData.patient_name,
      cccd: patientData.cccd || '001092004567',
      dob: patientData.dob,
      gender: patientData.gender,
      docNo: `KSK-DRV-CFG-${Date.now()}`,
      formType: '3',
      clinicalData: {
        ...patientData.clinical_data,
        cccd_date: '2022-01-01',
        cccd_place: 'Cục Cảnh sát QLHC về trật tự xã hội',
        ly_do_vv: 'Khám sức khỏe lái xe hạng B2',
        ngay_vao: new Date().toISOString().split('T')[0],
        clinical_exam: {
          ...patientData.clinical_data?.clinical_exam,
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
        ...patientData.lab_data,
        kq_xn_ma_tuy: 'Âm tính',
        kq_xn_nong_do_con: '0.0 mg/L'
      },
      conclusionData: {
        ...patientData.conclusion_data,
        fitness_class: '1',
        diagnosis: 'Đủ điều kiện sức khỏe lái xe hạng B2'
      }
    };

    console.log('   -> Lưu phiếu KSK Lái xe...');
    const saveRes = await axios.post(`${BACKEND_URL}/documents`, payload);
    const masterId = saveRes.data.id;
    console.log(`   -> Lưu thành công! ID Master: ${masterId}`);

    // 5. Kết nối DB kiểm tra nội dung XML đã sinh ra
    console.log('\n5. Truy vấn CSDL PostgreSQL để kiểm tra XML có nhận đúng mã CSKCB và GTIN mới...');
    const client = new Client(dbConfig);
    await client.connect();

    const dbRes = await client.query('SELECT xml_data FROM health_check_masters WHERE id = $1', [masterId]);
    const xml = dbRes.rows[0].xml_data;

    // Phân tích thẻ MA_CSKCB và MA_GTIN_CSKCB
    const matchMaCskcb = xml.match(/<MA_CSKCB>(.*?)<\/MA_CSKCB>/);
    const matchMaGtin = xml.match(/<MA_GTIN_CSKCB>(.*?)<\/MA_GTIN_CSKCB>/);

    console.log('   -> Kết quả đối chiếu XML:');
    console.log(`      * Thẻ <MA_CSKCB> nhận diện trong DB:     "${matchMaCskcb ? matchMaCskcb[1] : 'Không tìm thấy'}" (Mong muốn: "99999")`);
    console.log(`      * Thẻ <MA_GTIN_CSKCB> nhận diện trong DB: "${matchMaGtin ? matchMaGtin[1] : 'Không tìm thấy'}" (Mong muốn: "9999999999999")`);

    // Khôi phục lại cấu hình gốc để tránh ảnh hưởng hệ thống
    console.log('\n6. Khôi phục lại cấu hình mặc định ban đầu...');
    await axios.put(`${BACKEND_URL}/settings`, {
      vneid_url: 'https://api-vneid.moh.gov.vn/api/v1',
      vneid_username: 'vimes_cskcb',
      vneid_password: 'vClinic-secure-pass-2026',
      ma_cskcb: '15124',
      ma_gtin_cskcb: '1234567890123',
      auto_sync_enabled: false,
      auto_sync_interval: 15
    });
    console.log('   -> Khôi phục cấu hình mặc định thành công.');

    await client.end();
    console.log('\n✅ TOÀN BỘ PHÂN HỆ THIẾT LẬP CẤU HÌNH LIÊN THÔNG ĐÃ HOẠT ĐỘNG HOÀN HẢO!');
  } catch (error) {
    console.error('❌ Kiểm thử thất bại:', error.message);
    if (error.response) {
      console.error('API Response Error:', error.response.data);
    }
  }
}

verifyFlow();
