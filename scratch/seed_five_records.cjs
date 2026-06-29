const axios = require('axios');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load env from backend folder
const envPath = path.join(__dirname, '..', 'backend', '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const BACKEND_URL = `http://localhost:${process.env.PORT || '3001'}/api/v1/health-check-sync`;

// Updated seeded patient numbers
const testPatients = [
  {
    patientId: '251293024',
    patientName: 'NGUYỄN VĂN AN',
    cccd: '001090001234',
    dob: '1990-05-15',
    gender: 'Nam',
    docNo: 'KSK-2026-260188501',
    formType: '2',
    diagnosis: 'Đủ sức khỏe học tập và làm việc',
    fitnessClass: '1'
  },
  {
    patientId: '251293025',
    patientName: 'TRẦN THỊ BÌNH',
    cccd: '001085002345',
    dob: '1985-08-20',
    gender: 'Nữ',
    docNo: 'KSK-2026-260188502',
    formType: '2',
    diagnosis: 'Đủ sức khỏe làm việc',
    fitnessClass: '2'
  },
  {
    patientId: '251293026',
    patientName: 'PHẠM HOÀNG CƯỜNG',
    cccd: '001075003456',
    dob: '1975-12-02',
    gender: 'Nam',
    docNo: 'KSK-2026-260188503',
    formType: '3',
    diagnosis: 'Đủ điều kiện sức khỏe lái xe hạng B2',
    fitnessClass: '1'
  },
  {
    patientId: '251293027',
    patientName: 'LÊ THỊ DUNG',
    cccd: '001095004567',
    dob: '1995-03-10',
    gender: 'Nữ',
    docNo: 'KSK-2026-260188504',
    formType: '3',
    diagnosis: 'Đủ điều kiện sức khỏe lái xe hạng B1',
    fitnessClass: '2'
  },
  {
    patientId: '251293028',
    patientName: 'HOÀNG VĂN EM',
    cccd: '001060005678',
    dob: '1960-11-25',
    gender: 'Nam',
    docNo: 'KSK-2026-260188505',
    formType: '5',
    diagnosis: 'Đủ sức khỏe đi biển làm việc',
    fitnessClass: '1'
  }
];

async function seedFiveDocs() {
  console.log('=== TIẾN HÀNH THỬ NGHIỆM NHẬP LIỆU 5 HỒ SƠ KSK ĐẦY ĐỦ ===');
  console.log(`Backend Target URL: ${BACKEND_URL}\n`);

  for (let i = 0; i < testPatients.length; i++) {
    const pt = testPatients[i];
    console.log(`[Hồ sơ ${i + 1}/5] Đang gửi nhập liệu cho bệnh nhân: ${pt.patientName}...`);

    const payload = {
      patientId: pt.patientId,
      patientName: pt.patientName,
      cccd: pt.cccd,
      dob: pt.dob,
      gender: pt.gender,
      docNo: pt.docNo,
      formType: pt.formType,
      clinicalData: {
        address: '123 Đường Trần Hưng Đạo, Quận 1, TP. Hồ Chí Minh',
        phone: '090912345' + i,
        ethnic: '01',
        cccd_date: '2023-06-15',
        cccd_place: 'Cục Cảnh sát QLHC về trật tự xã hội',
        blood_group: pt.gender === 'Nam' ? 'O' : 'A',
        target_group: '13',
        funding_source: '9',
        ma_gtin_cskcb: '8930123456789',
        matinh_cu_tru: '79',
        maxa_cu_tru: '26740',
        ly_do_vv: 'Khám sức khỏe làm việc',
        ngay_vao: new Date().toISOString().split('T')[0],
        examination: {
          height: '170',
          weight: '65',
          bmi: '22.5',
          blood_pressure: '120/80',
          pulse: '80',
          vong_nguc_tb: '90'
        },
        clinical_exam: {
          specialty_metadata: {
            'internal': { doctorId: 'admin', status: 'ĐÃ_DUYỆT', updatedAt: new Date().toISOString() },
            'eye': { doctorId: 'admin', status: 'ĐÃ_DUYỆT', updatedAt: new Date().toISOString() },
            'ent': { doctorId: 'admin', status: 'ĐÃ_DUYỆT', updatedAt: new Date().toISOString() },
            'dental': { doctorId: 'admin', status: 'ĐÃ_DUYỆT', updatedAt: new Date().toISOString() },
            'external': { doctorId: 'admin', status: 'ĐÃ_DUYỆT', updatedAt: new Date().toISOString() },
            'dermatology': { doctorId: 'admin', status: 'ĐÃ_DUYỆT', updatedAt: new Date().toISOString() }
          },
          internal: 'Hô hấp, tim mạch bình thường.',
          eye: 'Thị lực 10/10 hai mắt.',
          ent: 'Tai mũi họng bình thường.',
          dental: 'Răng hàm mặt bình thường.',
          external: 'Không phát hiện dị dạng dị tật.',
          dermatology: 'Không có bệnh lý về da.',
          
          khong_kinh_mat_phai: '10/10',
          khong_kinh_mat_trai: '10/10',
          khong_kinh_hai_mat: '10/10',
          sac_giac: '0',
          thi_truong_ngang_haimat: 'Bình thường',
          thi_truong_dung_haimat: 'Bình thường',
          tai_trai_noi_thuong: '5',
          tai_trai_noi_tham: '0.5',
          tai_phai_noi_thuong: '5',
          tai_phai_noi_tham: '0.5',
          ham_tren: 'Đủ răng',
          ham_duoi: 'Đủ răng',

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
          kham_san_phu_khoa_pl: pt.gender === 'Nữ' ? '1' : '0',
          kham_mat_pl: '1',
          kham_tai_mui_hong_pl: '1',
          kham_rang_ham_mat_pl: '1'
        },
        extra: {
          hang_lai_xe: pt.formType === '3' ? (pt.gender === 'Nam' ? 'B2' : 'B1') : '',
          chuc_danh: pt.formType === '5' ? 'Thủy thủ' : '',
          noi_cong_tac: 'Đại dương xanh',
          ts_su_dung_ruou: 0,
          ts_su_dung_ma_tuy: 0,
          ts_benh_cot_song: 0
        }
      },
      labData: {
        blood_test: { 
          hemoglobin: '142', 
          glycemia: '5.4'
        },
        urine_test: { protein: 'Âm tính' },
        kq_xn_ma_tuy: 'Âm tính',
        kq_xn_nong_do_con: '0.0 mg/L',
        paraclinical_items: []
      },
      conclusionData: {
        fitness_class: pt.fitnessClass,
        diagnosis: pt.diagnosis,
        cac_van_de_luu_y: 'Không có vấn đề cần lưu ý đặc biệt.',
        doctor_id: 'admin'
      }
    };

    try {
      const res = await axios.post(`${BACKEND_URL}/documents`, payload, {
        timeout: 15000
      });
      console.log(`   -> Nhập thành công! Master ID: ${res.data.id}. Status: OK`);
    } catch (err) {
      console.error(`   -> Nhập lỗi:`, err.response ? err.response.data : err.message);
    }
  }

  console.log('\n=== HOÀN THÀNH KIỂM THỬ NHẬP LIỆU 5 HỒ SƠ KSK ===');
}

seedFiveDocs();
