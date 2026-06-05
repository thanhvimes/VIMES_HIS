const axios = require('axios');
const { Client } = require('pg');

const BACKEND_URL = 'http://localhost:3000/api/v1/health-check-sync';

// Database connection info
const dbConfig = {
  user: 'postgres',
  host: '115.74.226.237',
  database: 'vimes_130',
  password: 'Password123!',
  port: 5432,
};

async function runTests() {
  console.log('=== KHỞI CHẠY KIỂM THỬ TỰ ĐỘNG ĐỒNG BỘ HIS & LƯU PHIẾU KSK ===\n');

  try {
    // TEST CASE 1: Lấy dữ liệu bệnh nhân Lái xe (P1003) và Lưu phiếu Mẫu 3
    console.log('1. Lấy dữ liệu bệnh nhân Lái xe (P1003) từ HIS...');
    const resP1003 = await axios.get(`${BACKEND_URL}/his-patient/P1003`);
    const patient3 = resP1003.data;
    console.log(`   -> Tìm thấy bệnh nhân: ${patient3.patient_name} (${patient3.gender})`);
    
    console.log('   -> Chuẩn bị payload phiếu KSK Lái xe (Mẫu 3)...');
    const payload3 = {
      patientId: patient3.patient_id,
      patientName: patient3.patient_name,
      cccd: patient3.cccd || '001092004567',
      dob: patient3.dob,
      gender: patient3.gender,
      docNo: `KSK-DRV-${Date.now()}`,
      formType: '3',
      clinicalData: {
        ...patient3.clinical_data,
        ma_gtin_cskcb: '1234567890123',
        cccd_date: '2022-01-01',
        cccd_place: 'Cục Cảnh sát QLHC về trật tự xã hội',
        ly_do_vv: 'Khám sức khỏe lái xe hạng B2',
        ngay_vao: new Date().toISOString().split('T')[0],
        clinical_exam: {
          ...patient3.clinical_data.clinical_exam,
          khong_kinh_mat_phai: '9/10',
          khong_kinh_mat_trai: '10/10',
          khong_kinh_hai_mat: '10/10',
          sac_giac: '0', // Bình thường
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
    console.log(`   -> Lưu thành công phiếu KSK Lái xe! ID Master: ${saveRes3.data.id}\n`);

    // TEST CASE 2: Lấy dữ liệu bệnh nhân Người lớn (P1002 - Nữ) và Lưu phiếu Mẫu 2
    console.log('2. Lấy dữ liệu bệnh nhân Người lớn Nữ (P1002) từ HIS...');
    const resP1002 = await axios.get(`${BACKEND_URL}/his-patient/P1002`);
    const patient2 = resP1002.data;
    console.log(`   -> Tìm thấy bệnh nhân: ${patient2.patient_name} (${patient2.gender})`);
    
    console.log('   -> Chuẩn bị payload phiếu KSK Người lớn (Mẫu 2) cho Nữ...');
    const payload2 = {
      patientId: patient2.patient_id,
      patientName: patient2.patient_name,
      cccd: patient2.cccd || '034198006789',
      dob: patient2.dob,
      gender: patient2.gender,
      docNo: `KSK-ADULT-${Date.now()}`,
      formType: '2',
      clinicalData: {
        ...patient2.clinical_data,
        ma_gtin_cskcb: '1234567890123',
        cccd_date: '2021-05-10',
        cccd_place: 'Cục Cảnh sát QLHC về trật tự xã hội',
        ly_do_vv: 'Khám sức khỏe định kỳ',
        ngay_vao: new Date().toISOString().split('T')[0],
        clinical_exam: {
          ...patient2.clinical_data.clinical_exam,
          khong_kinh_mat_phai: '10/10',
          khong_kinh_mat_trai: '10/10',
          khong_kinh_hai_mat: '10/10',
          tai_phai_noi_thuong: '5',
          tai_phai_noi_tham: '0.5',
          tai_trai_noi_thuong: '5',
          tai_trai_noi_tham: '0.5',
          ham_tren: 'Bình thường',
          ham_duoi: 'Bình thường',
          // Đánh giá chuyên khoa chi tiết của Mẫu 2
          kham_the_luc_pl: '1',
          noi_khoa_tuan_hoan_pl: '1',
          noi_khoa_ho_hap_pl: '1',
          noi_khoa_tieu_hoa_pl: '1',
          noi_khoa_than_tietnieu_pl: '2', // Hơi yếu nhẹ
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
          co_kinh_nguyet_nam_bao_nhieu_tuoi: 13,
          tinh_chat_kinh_nguyet: 1,
          chu_ky_kinh: 28,
          luong_kinh: 4,
          dau_bung_kinh: 0,
          da_lap_gia_dinh: 1,
          para: '1001',
          da_tung_mo_san_phu_khoa_chua: 1,
          so_lan_mo_san_phu_khoa: 1,
          ghi_ro_mo_san_phu_khoa: 'Mổ lấy thai đẻ thường lần 1',
          dang_ap_dung_bptt_khong: 0
        }
      },
      labData: patient2.lab_data,
      conclusionData: {
        ...patient2.conclusion_data,
        fitness_class: '2', // Loại II
        diagnosis: 'Đủ sức khỏe làm việc'
      }
    };

    console.log('   -> Gửi request lưu phiếu Mẫu 2...');
    const saveRes2 = await axios.post(`${BACKEND_URL}/documents`, payload2);
    console.log(`   -> Lưu thành công phiếu KSK Người lớn! ID Master: ${saveRes2.data.id}\n`);

    // TEST CASE 3: Khởi tạo hàng loạt 17 phiếu Mock để test tất cả các mẫu
    console.log('3. Khởi tạo hàng loạt 17 phiếu KSK Mock cho cả 17 mẫu biểu...');
    const mockRes = await axios.post(`${BACKEND_URL}/documents/create-mock`);
    console.log(`   -> Khởi tạo thành công ${mockRes.data.count} phiếu mock trong DB!\n`);

    // KẾT NỐI DB ĐỂ KIỂM TRA
    console.log('4. Truy vấn CSDL để đối chiếu kết quả lưu trữ...');
    const client = new Client(dbConfig);
    await client.connect();

    // Lấy 2 bản ghi vừa lưu bằng test case
    const querySql = `
      SELECT m.id, m.patient_name, m.cccd, m.form_type, m.xml_data, d.clinical_data, d.lab_data, d.conclusion_data
      FROM health_check_masters m
      JOIN health_check_details d ON m.id = d.master_id
      WHERE m.id IN ($1, $2)
    `;
    const dbRes = await client.query(querySql, [saveRes3.data.id, saveRes2.data.id]);

    console.log('\n--- KẾT QUẢ TRONG CSDL POSTGRESQL ---');
    for (const row of dbRes.rows) {
      console.log(`\n==================================================`);
      console.log(`[Master ID: ${row.id}] Bệnh nhân: ${row.patient_name} - Mẫu biểu số: ${row.form_type}`);
      console.log(`--------------------------------------------------`);
      console.log(`* Cận lâm sàng JSONB:`, JSON.stringify(row.lab_data));
      console.log(`* Kết luận JSONB:`, JSON.stringify(row.conclusion_data));
      console.log(`* Dữ liệu XML liên thông sinh ra:`);
      
      // Chỉ in 35 dòng đầu của XML để đỡ dài
      const xmlLines = row.xml_data.split('\n');
      console.log(xmlLines.slice(0, 35).join('\n'));
      console.log('... (còn tiếp) ...');
    }

    await client.end();
    console.log('\n✅ KIỂM THỬ HOÀN TẤT THÀNH CÔNG RỰC RỠ!');
  } catch (error) {
    console.error('❌ Lỗi trong quá trình chạy test:', error.message);
    if (error.response) {
      console.error('API Response Error:', error.response.data);
    }
  }
}

runTests();
