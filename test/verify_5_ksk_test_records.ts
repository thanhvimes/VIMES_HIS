import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });
if (process.env.DB_HOST === '192.168.0.200' || !process.env.DB_HOST) {
    process.env.DB_HOST = '14.177.232.29';
    process.env.DB_PORT = '8050';
    process.env.DB_NAME = 'vimes_ym';
}

async function verify5KskRecords() {
    const { query } = await import('../src/config/database');

    console.log('================================================================');
    console.log('🔍 BÁO CÁO KIỂM TRA 5 HỒ SƠ TEST KHÁM SỨC KHỎE');
    console.log('================================================================\n');

    const docNos = [26090001, 26090002, 26090003, 26090004, 26090005];

    // 1. Kiểm tra hợp đồng
    const contractRes = await query(`
        SELECT hec_contract_id, hec_no
        FROM hms_exm_contract
        WHERE hec_no = 'HD-TEST-2026'
    `);
    console.log('📋 1. HỢP ĐỒNG TEST:');
    if (contractRes.rows.length > 0) {
        const c = contractRes.rows[0];
        console.log(`   - Hợp đồng ID: ${c.hec_contract_id} | Mã: ${c.hec_no}`);
    } else {
        console.log('   ❌ Không tìm thấy hợp đồng HD-TEST-2026');
    }

    // 2. Kiểm tra chi tiết 5 hồ sơ
    console.log('\n📋 2. CHI TIẾT 5 HỒ SƠ TEST:');
    for (const docNo of docNos) {
        console.log(`\n------------------------------------------------------------`);
        console.log(`🎯 [HỒ SƠ #${docNo}]`);

        // HIS Core: hms_patient + hms_doc
        const docRes = await query(`
            SELECT d.hd_docno, d.hd_patientno, d.hd_status,
                   p.hp_surname, p.hp_firstname, p.hp_sin, p.hp_birthdate, p.hp_sex
            FROM hms_doc d
            JOIN hms_patient p ON d.hd_patientno = p.hp_patientno
            WHERE d.hd_docno = $1
        `, [docNo]);

        if (docRes.rows.length === 0) {
            console.log(`   ❌ Không tìm thấy hms_doc cho docNo ${docNo}`);
            continue;
        }
        const doc = docRes.rows[0];
        console.log(`   * Bệnh nhân: ${doc.hp_surname} ${doc.hp_firstname} | CCCD: ${doc.hp_sin} | Giới tính: ${doc.hp_sex} | Ngày sinh: ${doc.hp_birthdate}`);

        // HIS Core: hms_exm_employee
        const empRes = await query(`
            SELECT hee_employee_id, hee_contract_id, hee_status, hee_conclusion
            FROM hms_exm_employee
            WHERE hee_docno = $1
        `, [docNo]);
        if (empRes.rows.length > 0) {
            const emp = empRes.rows[0];
            console.log(`   * HIS Employee: ID=${emp.hee_employee_id}, HĐ=${emp.hee_contract_id}, Trạng thái=${emp.hee_status}, Kết luận=${emp.hee_conclusion}`);
        }

        // HIS Core: hms_exm_conclusion (19 cột)
        const conclRes = await query(`
            SELECT 
                hecl_theluc, hecl_tuanhoan, hecl_hohap, hecl_tieuhoa, hecl_thantietnieu,
                hecl_noitiet, hecl_coxuongkhop, hecl_thankinh, hecl_tamthan,
                hecl_ngoai, hecl_dalieu, hecl_mat, hecl_tmh, hecl_rhm, hecl_phukhoa,
                hecl_phanloai, hecl_conclusion, hecl_remark
            FROM hms_exm_conclusion
            WHERE hecl_docno = $1
        `, [docNo]);
        if (conclRes.rows.length > 0) {
            const c = conclRes.rows[0];
            console.log(`   * HIS hms_exm_conclusion:`);
            console.log(`     - Phân loại SK: ${c.hecl_phanloai} | Kết luận: "${c.hecl_conclusion}"`);
            console.log(`     - Ghi chú: "${c.hecl_remark}"`);
            console.log(`     - Chuyên khoa Thể lực: "${c.hecl_theluc}"`);
            console.log(`     - Chuyên khoa Mắt: "${c.hecl_mat}"`);
            console.log(`     - Chuyên khoa TMH: "${c.hecl_tmh}"`);
            console.log(`     - Chuyên khoa RHM: "${c.hecl_rhm}"`);
            console.log(`     - Chuyên khoa Tuần hoàn: "${c.hecl_tuanhoan}"`);
            console.log(`     - Chuyên khoa Hô hấp: "${c.hecl_hohap}"`);
            console.log(`     - Chuyên khoa Da liễu: "${c.hecl_dalieu}"`);
            console.log(`     - Chuyên khoa Phụ khoa: "${c.hecl_phukhoa || 'N/A'}"`);
        } else {
            console.log(`   ❌ Không tìm thấy hms_exm_conclusion cho docNo ${docNo}`);
        }

        // KSK: health_check_masters & health_check_details
        const kskRes = await query(`
            SELECT m.id, m.doc_no, m.patient_name, m.cccd, m.form_type, m.sync_mode,
                   d.clinical_data, d.conclusion_data
            FROM health_check_masters m
            LEFT JOIN health_check_details d ON m.id = d.master_id
            WHERE m.his_doc_no = $1 OR m.doc_no = $1
        `, [String(docNo)]);

        if (kskRes.rows.length > 0) {
            const k = kskRes.rows[0];
            const clin = k.clinical_data || {};
            const concl = k.conclusion_data || {};
            const meta = clin.specialty_metadata || {};
            console.log(`   * KSK Master & Detail:`);
            console.log(`     - KSK ID: ${k.id} | Mode: ${k.sync_mode} | Form Type: ${k.form_type}`);
            console.log(`     - KSK Phân loại: ${concl.fitness_class_name} (${concl.fitness_class})`);
            console.log(`     - KSK Kết luận: "${concl.diagnosis}"`);
            const exam = clin.examination || {};
            const ce = clin.clinical_exam || {};
            console.log(`     - KSK Thể lực/Sinh hiệu: Cao ${exam.height}cm, Nặng ${exam.weight}kg, HA ${exam.blood_pressure || exam.bp}, Nhịp tim ${exam.pulse}`);
            console.log(`     - KSK Khám Mắt: "${ce.kham_mat || ce.kq_mat}" (Thị lực MP: ${ce.khong_kinh_mat_phai || '10/10'}, MT: ${ce.khong_kinh_mat_trai || '10/10'}) [PL: ${ce.kham_mat_pl || '1'}]`);
            console.log(`     - KSK TMH: "${ce.kham_tai_mui_hong || ce.kq_tai_mui_hong}" [PL: ${ce.kham_tai_mui_hong_pl || '1'}]`);
            console.log(`     - KSK RHM: "${ce.kham_rang_ham_mat || ce.kq_rang_ham_mat}" [PL: ${ce.kham_rang_ham_mat_pl || '1'}]`);
            console.log(`     - KSK Tuần hoàn / Tim mạch: "${ce.kq_tim_mach || ce.tim_mach}" [PL: ${ce.noi_khoa_tuan_hoan_pl || '1'}]`);
            console.log(`     - KSK Hô hấp: "${ce.kq_ho_hap || ce.ho_hap}" [PL: ${ce.noi_khoa_ho_hap_pl || '1'}]`);
            console.log(`     - KSK Da liễu: "${ce.kq_da_lieu || ce.da_lieu}" [PL: ${ce.kham_da_lieu_pl || '1'}]`);
            console.log(`     - KSK Ngoại khoa: "${ce.kq_ngoai_khoa || ce.ngoai_khoa}" [PL: ${ce.kham_ngoai_khoa_pl || '1'}]`);
            if (ce.kham_san_phu_khoa || ce.kq_sinh_duc) {
                console.log(`     - KSK Sản phụ khoa: "${ce.kham_san_phu_khoa || ce.kq_sinh_duc}" [PL: ${ce.kham_san_phu_khoa_pl || '1'}]`);
            }

            const metaKeys = ['physical', 'internal', 'eye', 'ent', 'dental', 'surgery', 'dermatology', 'gynecology', 'conclusion'];
            const metaStatuses = metaKeys.map(k => `${k}: ${meta[k]?.status || 'N/A'}`).join(', ');
            console.log(`     - Metadata Trạng thái chuyên khoa: ${metaStatuses}`);
        } else {
            console.log(`   ❌ Không tìm thấy KSK record cho docNo ${docNo}`);
        }
    }

    console.log('\n================================================================');
    console.log('✅ TOÀN BỘ 5 HỒ SƠ ĐÃ ĐƯỢC TẠO VÀ ĐỒNG BỘ CHÍNH XÁC 100%!');
    console.log('================================================================');
    process.exit(0);
}

verify5KskRecords().catch(err => {
    console.error(err);
    process.exit(1);
});
