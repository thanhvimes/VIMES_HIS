import dotenv from 'dotenv';
import path from 'path';
import assert from 'node:assert/strict';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function createTestDoc(formType: string, typeName: string) {
    const { query, transaction } = await import('../src/config/database');
    const { generateXmlPayload } = await import('../src/controllers/health-check/xml-generator');

    const suffix = Date.now().toString().slice(-4);
    const testDocNo = `TEST-CKLS-M${formType}-${suffix}`;
    const patientName = `BỆNH NHÂN TEST MẪU ${formType} ${suffix}`;
    const cccd = `001099${suffix.padStart(6, '0')}`;
    const dob = '1992-06-15';
    const gender = 'Nam';

    // Dữ liệu lâm sàng giống hệt ảnh chụp người dùng cung cấp:
    // Chuyên khoa người lớn có kết quả chi tiết, đồng thời có các trường nhi_* mang giá trị mặc định "Bình thường"
    const clinicalData = {
        examination: {
            height: '172',
            weight: '68',
            bmi: '23.0',
            pulse: '76',
            blood_pressure: '120/80',
            blood_pressure_max: '120',
            blood_pressure_min: '80',
            breathing_rate: '18',
            physical_summary: 'Thể lực tốt, phát triển cân đối'
        },
        clinical_exam: {
            // Các trường chuyên khoa người lớn với kết quả khám chi tiết:
            kq_ho_hap: 'Lồng ngực cân đối di động theo nhịp thở. Rì rào phế nang êm dịu 2 phế trường, không rale',
            noi_khoa_ho_hap_pl: '1',

            kq_tim_mach: 'Mỏm tim đập KLS V đường giữa đòn trái. Nhịp tim đều T1 T2 rõ, không có tiếng thổi bệnh lý',
            noi_khoa_tuan_hoan_pl: '1',

            kq_tieu_hoa: 'Bụng mềm, không chướng, gan lách không to, ấn không có điểm đau khu trú',
            noi_khoa_tieu_hoa_pl: '1',

            kq_tiet_nieu: 'Hố thận 2 bên không đầy. Chạm thận âm tính, bập bềnh thận âm tính',
            noi_khoa_tiet_nieu_pl: '1',

            kq_sinh_duc: 'Cơ quan sinh dục ngoài bình thường, không phát hiện khối u',

            kq_than_kinh: 'Hiện chưa phát hiện dấu hiệu liệt thần kinh khu trú, phản xạ gân xương bình thường',
            noi_khoa_than_kinh_pl: '1',

            kq_tam_than: 'Hiện tại chưa phát hiện dấu hiệu bệnh lý, cảm xúc hành vi phù hợp',
            noi_khoa_tam_than_pl: '1',

            kq_co_xuong_khop: 'Hiện tại chưa phát hiện dấu hiệu bệnh lý cơ xương khớp, vận động khớp trong giới hạn bình thường',
            noi_khoa_co_xuong_khop_pl: '1',

            kq_noi_tiet: 'Tuyến giáp không to, không phát hiện hội chứng Cushing hay rối loạn chuyển hóa',
            noi_khoa_noi_tiet_pl: '1',

            eye: 'Mắt phải 10/10, Mắt trái 10/10',
            kham_mat_pl: '1',

            ent: 'Tai sạch, màng nhĩ hai bên bình thường, họng sạch',
            kham_tai_mui_hong_pl: '1',

            dental: 'Răng hàm mặt phát triển bình thường, không sâu răng',
            kham_rang_ham_mat_pl: '1',

            dermatology: 'Chưa phát hiện bất thường, không có bệnh da lây nhiễm',
            kham_da_lieu_pl: '1',

            // Các trường nhi_* bị gán mặc định "Bình thường" (như trong ảnh lỗi của người dùng)
            nhi_ho_hap: 'Bình thường',
            nhi_tuan_hoan: 'Bình thường',
            nhi_tieu_hoa: 'Bình thường',
            nhi_than_kinh: 'Bình thường',
            nhi_tam_than: 'Bình thường',
            nhi_tiet_nieu: 'Bình thường',
            nhi_khac: 'Bình thường'
        }
    };

    const labData = {
        paraclinical_items: [
            { service_name: 'Tổng phân tích tế bào máu ngoại vi', result: 'Các chỉ số hồng cầu, bạch cầu, tiểu cầu trong giới hạn bình thường', conclusion: 'Bình thường' },
            { service_name: 'X-quang ngực thẳng', result: 'Hình tim phổi bình thường, không thấy tổn thương thâm nhiễm', conclusion: 'Bình thường' }
        ]
    };

    const conclusionData = {
        classification: '1',
        health_grade: 'I',
        conclusion: 'Đủ điều kiện sức khỏe làm việc',
        doctor_conclusion: 'Bác sĩ Kết luận KSK',
        ngay_ket_luan: new Date().toISOString().split('T')[0]
    };

    const masterInfo = {
        patientName,
        cccd,
        dob,
        gender,
        docNo: testDocNo
    };

    console.log(`\n================================================================`);
    console.log(`--- Tạo XML Payload cho hồ sơ ${typeName} (${testDocNo}) ---`);
    const xmlData = generateXmlPayload(formType, masterInfo, clinicalData, labData, conclusionData);
    assert.ok(xmlData.length > 0, 'XML Data không được để trống');

    // Kiểm tra chuỗi XML để xác minh: Lấy đúng trường chuyên khoa, KHÔNG lấy giá trị "Bình thường" của nhi_*
    assert.ok(
        xmlData.includes('Lồng ngực cân đối di động theo nhịp thở'),
        'XML phải chứa đúng kết quả hô hấp chuyên khoa (kq_ho_hap), không bị lấy "Bình thường" từ nhi_ho_hap'
    );
    assert.ok(
        xmlData.includes('Mỏm tim đập KLS V'),
        'XML phải chứa đúng kết quả tim mạch chuyên khoa (kq_tim_mach), không bị lấy "Bình thường" từ nhi_tuan_hoan'
    );
    assert.ok(
        xmlData.includes('Bụng mềm, không chướng'),
        'XML phải chứa đúng kết quả tiêu hóa chuyên khoa (kq_tieu_hoa), không bị lấy "Bình thường" từ nhi_tieu_hoa'
    );
    assert.ok(
        xmlData.includes('Hố thận 2 bên không đầy'),
        'XML phải chứa đúng kết quả thận tiết niệu chuyên khoa (kq_tiet_nieu), không bị lấy "Bình thường" từ nhi_tiet_nieu'
    );
    assert.ok(
        xmlData.includes('Hiện chưa phát hiện dấu hiệu liệt thần kinh'),
        'XML phải chứa đúng kết quả thần kinh chuyên khoa (kq_than_kinh), không bị lấy "Bình thường" từ nhi_than_kinh'
    );
    assert.ok(
        xmlData.includes('Hiện tại chưa phát hiện dấu hiệu bệnh lý, cảm xúc'),
        'XML phải chứa đúng kết quả tâm thần chuyên khoa (kq_tam_than), không bị lấy "Bình thường" từ nhi_tam_than'
    );
    console.log(`✅ Xác minh XML ${typeName} thành công: Các thẻ chuyên khoa nhận đúng kq_*!`);

    // Ghi vào cơ sở dữ liệu thật (health_check_masters & health_check_details)
    const masterId = await transaction(async (client) => {
        await client.query(`DELETE FROM health_check_details WHERE master_id IN (SELECT id FROM health_check_masters WHERE doc_no = $1)`, [testDocNo]);
        await client.query(`DELETE FROM health_check_masters WHERE doc_no = $1`, [testDocNo]);

        const mRes = await client.query(`
            INSERT INTO health_check_masters (
                patient_name, cccd, dob, gender, doc_no, form_type, xml_data,
                signature_status, send_status, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'Unsigned', 'Unsent', NOW(), NOW())
            RETURNING id
        `, [
            patientName, cccd, dob, gender, testDocNo, formType, xmlData
        ]);
        const newId = mRes.rows[0].id;

        await client.query(`
            INSERT INTO health_check_details (
                master_id, clinical_data, lab_data, conclusion_data, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, NOW(), NOW())
        `, [
            newId,
            JSON.stringify(clinicalData),
            JSON.stringify(labData),
            JSON.stringify(conclusionData)
        ]);

        return newId;
    });

    console.log(`✅ Đã lưu ${typeName} vào DB! ID: ${masterId} | Mã: ${testDocNo} | Tên: ${patientName}`);
    return { masterId, testDocNo, patientName, formType };
}

async function createChildTestDoc() {
    const { query, transaction } = await import('../src/config/database');
    const { generateXmlPayload } = await import('../src/controllers/health-check/xml-generator');

    const suffix = Date.now().toString().slice(-4);
    const testDocNo = `TEST-TRE-EM-${suffix}`;
    const patientName = `BÉ NGUYỄN VĂN AN ${suffix}`;
    const cccd = `001224${suffix.padStart(6, '0')}`;
    const dob = '2024-03-20'; // Trẻ dưới 6 tuổi
    const gender = 'Nam';
    const formType = '1';

    const clinicalData = {
        examination: {
            height: '85',
            weight: '12',
            bmi: '16.6',
            pulse: '95',
            breathing_rate: '24',
            physical_summary: 'Trẻ phát triển bình thường theo lứa tuổi'
        },
        clinical_exam: {
            ngheTim: 'Tim đều, T1 T2 rõ',
            nghePhoi: 'Phổi trong, không rales',
            mauSacDa: 'Da dẻ hồng hào',
            hinhDangBungRon: 'Bụng mềm, rốn bình thường',
            ganLachTo: 'Gan lách không sờ thấy',
            cqSinhDucNgoai: 'Bình thường'
        },
        extra: {
            ho_ten_nguoi_di_cung: 'Lưu Thị Hoa',
            so_cccd_nguoi_di_cung: '034192004890',
            moi_quan_he_voi_tre: 'Mẹ', // Điền chữ "Mẹ" để test tự động chuyển thành mã "2"
            dien_thoai_nguoi_di_cung: '0836839292'
        }
    };

    const labData = {};
    const conclusionData = {
        conclusion: 'Trẻ phát triển bình thường',
        health_grade: 'I'
    };

    const masterInfo = {
        patientName,
        cccd,
        dob,
        gender,
        docNo: testDocNo
    };

    console.log(`\n================================================================`);
    console.log(`--- Tạo XML Payload cho hồ sơ Mẫu 1 Trẻ em (${testDocNo}) ---`);
    const xmlData = generateXmlPayload(formType, masterInfo, clinicalData, labData, conclusionData);
    assert.ok(xmlData.length > 0, 'XML Data không được để trống');

    // Kiểm tra thẻ MOI_QUAN_HE_VOI_TRE phải là mã 2
    assert.ok(
        xmlData.includes('<MOI_QUAN_HE_VOI_TRE>2</MOI_QUAN_HE_VOI_TRE>'),
        'XML Trẻ em phải chứa mã số <MOI_QUAN_HE_VOI_TRE>2</MOI_QUAN_HE_VOI_TRE> cho quan hệ Mẹ'
    );
    assert.ok(
        !xmlData.includes('<MOI_QUAN_HE_VOI_TRE>Mẹ</MOI_QUAN_HE_VOI_TRE>'),
        'XML Trẻ em KHÔNG được chứa text Mẹ'
    );
    console.log(`✅ Xác minh XML Mẫu 1 thành công: <MOI_QUAN_HE_VOI_TRE>2</MOI_QUAN_HE_VOI_TRE>`);

    const masterId = await transaction(async (client) => {
        await client.query(`DELETE FROM health_check_details WHERE master_id IN (SELECT id FROM health_check_masters WHERE doc_no = $1)`, [testDocNo]);
        await client.query(`DELETE FROM health_check_masters WHERE doc_no = $1`, [testDocNo]);

        const mRes = await client.query(`
            INSERT INTO health_check_masters (
                patient_name, cccd, dob, gender, doc_no, form_type, xml_data,
                signature_status, send_status, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'Unsigned', 'Unsent', NOW(), NOW())
            RETURNING id
        `, [
            patientName, cccd, dob, gender, testDocNo, formType, xmlData
        ]);
        const newId = mRes.rows[0].id;

        await client.query(`
            INSERT INTO health_check_details (
                master_id, clinical_data, lab_data, conclusion_data, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, NOW(), NOW())
        `, [
            newId,
            JSON.stringify(clinicalData),
            JSON.stringify(labData),
            JSON.stringify(conclusionData)
        ]);

        return newId;
    });

    console.log(`✅ Đã lưu Mẫu 1 (Trẻ em) vào DB! ID: ${masterId} | Mã: ${testDocNo} | Tên: ${patientName}`);
    return { masterId, testDocNo, patientName, formType };
}

async function seedAndVerify() {
    const doc2 = await createTestDoc('2', 'Mẫu 2 (Lái xe / Lao động)');
    const doc3 = await createTestDoc('3', 'Mẫu 3 (Khám sức khỏe tổng quát)');
    const doc1 = await createChildTestDoc();

    console.log(`\n================================================================`);
    console.log(`🎉 TỔNG KẾT DỮ LIỆU TEST ĐÃ TẠO SẴN TRÊN HỆ THỐNG:`);
    console.log(`1. MẪU 1 (Trẻ em < 6 tuổi):`);
    console.log(`   - Master ID: ${doc1.masterId}`);
    console.log(`   - Mã hồ sơ (doc_no): ${doc1.testDocNo}`);
    console.log(`   - Tên trẻ: ${doc1.patientName}`);
    console.log(`   - Người đi cùng: Lưu Thị Hoa (Mối quan hệ: Mẹ -> Mã XML: 2)`);
    console.log(`2. MẪU 2:`);
    console.log(`   - Master ID: ${doc2.masterId}`);
    console.log(`   - Mã hồ sơ (doc_no): ${doc2.testDocNo}`);
    console.log(`   - Tên bệnh nhân: ${doc2.patientName}`);
    console.log(`3. MẪU 3:`);
    console.log(`   - Master ID: ${doc3.masterId}`);
    console.log(`   - Mã hồ sơ (doc_no): ${doc3.testDocNo}`);
    console.log(`   - Tên bệnh nhân: ${doc3.patientName}`);
    console.log(`================================================================\n`);
    process.exit(0);
}

seedAndVerify().catch(err => {
    console.error('❌ Lỗi khi tạo dữ liệu test:', err);
    process.exit(1);
});
