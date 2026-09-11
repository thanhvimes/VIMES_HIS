import { query, transaction } from '../src/config/database';
import { mapConclusionRowToClinicalExam, buildSpecialtyMetadata } from '../src/services/health-check-classifier.service';
import { generateXmlPayload } from '../src/controllers/health-check/xml-generator';

async function create5TestKskRecords() {
    console.log('🚀 Đang khởi tạo 5 hồ sơ KSK test với đầy đủ 15 chuyên khoa và kết luận...');

    try {
        // 1. Kiểm tra hoặc tạo hợp đồng KSK test
        let contractId = 0;
        const contractRes = await query(`
            SELECT hec_contract_id, hec_no 
            FROM hms_exm_contract 
            WHERE hec_no = 'HD-TEST-2026'
            LIMIT 1
        `);

        if (contractRes.rows.length > 0) {
            contractId = contractRes.rows[0].hec_contract_id;
            console.log(`✅ Sử dụng hợp đồng KSK test hiện có: #ID ${contractId} (Mã: HD-TEST-2026)`);
        } else {
            await query(`
                SELECT setval(pg_get_serial_sequence('hms_exm_contract', 'hec_contract_id'), (SELECT COALESCE(MAX(hec_contract_id), 1) FROM hms_exm_contract));
            `);
            const newContract = await query(`
                INSERT INTO hms_exm_contract (
                    hec_no, hec_description, hec_status, hec_company_id, hec_date, hec_examdate, hec_form_type
                ) VALUES (
                    'HD-TEST-2026', 'Hợp đồng kiểm tra 5 hồ sơ chuyên khoa KSK (2026)', 'O', '37601', CURRENT_DATE, CURRENT_DATE, '3'
                ) RETURNING hec_contract_id
            `);
            contractId = newContract.rows[0].hec_contract_id;
            console.log(`✅ Đã tạo mới hợp đồng KSK test: #ID ${contractId} (Mã: HD-TEST-2026)`);
        }

        const maxRecRes = await query(`SELECT COALESCE(MAX(he_receptidx), 357400) as max_rec FROM hms_exam`);
        let nextReceptIdx = Number(maxRecRes.rows[0].max_rec) + 1;

        // Danh sách 5 hồ sơ test chi tiết
        const testProfiles = [
            {
                docNo: 26090001,
                patientNo: 26090001,
                surname: 'NGUYỄN VĂN',
                firstname: 'AN',
                fullName: 'NGUYỄN VĂN AN',
                dob: '1991-03-15',
                sex: 'M',
                genderStr: 'Nam',
                cccd: '001091000111',
                phone: '0912111222',
                address: 'Số 12 phố Trần Phú, Phường Điện Biên, Quận Ba Đình, Hà Nội',
                workplace: 'Công ty Cổ phần Công nghệ Y tế VIMES',
                occupation: 'Kỹ sư phần mềm',
                formType: '3',
                vitals: {
                    height: 172,
                    weight: 68,
                    bmi: 23.0,
                    bp: '120/80',
                    pulse: 75,
                    temp: 36.5,
                    breath: 18
                },
                conclRow: {
                    hecl_theluc: 'Thể lực tốt, phát triển cân đối',
                    hecl_tuanhoan: 'Tim đều, T1 T2 rõ, không tiếng thổi bệnh lý',
                    hecl_hohap: 'Phổi trong, rì rào phế nang êm dịu 2 phế trường, không rale',
                    hecl_tieuhoa: 'Bụng mềm, không chướng, gan lách không sờ thấy',
                    hecl_thantietnieu: 'Chạm thận âm tính, bập bềnh thận âm tính, tiểu tiện bình thường',
                    hecl_noitiet: 'Tuyến giáp bình thường độ 0, không có dấu hiệu run tay',
                    hecl_coxuongkhop: 'Vận động các khớp linh hoạt, không biến dạng, cột sống thẳng',
                    hecl_thankinh: 'Tỉnh táo, phản xạ gân xương bình thường, không dấu thần kinh khu trú',
                    hecl_tamthan: 'Tâm thần ổn định, tiếp xúc tốt, trí nhớ tốt',
                    hecl_ngoai: 'Không có sẹo mổ cũ, không trĩ, không thoát vị bẹn',
                    hecl_dalieu: 'Da niêm mạc hồng hào, không có ban dị ứng hay nấm da',
                    hecl_mat: 'Mắt phải 10/10, Mắt trái 10/10, sắc giác bình thường, không lác',
                    hecl_tmh: 'Màng nhĩ hai bên sáng bóng, họng sạch, không viêm amidan',
                    hecl_rhm: 'Hàm trên dưới đều, không sâu răng, không viêm nướu lợi',
                    hecl_phukhoa: '',
                    hecl_phanloai: '1',
                    hecl_conclusion: 'Đủ sức khỏe làm việc',
                    hecl_remark: 'Khám sức khỏe định kỳ hàng năm'
                }
            },
            {
                docNo: 26090002,
                patientNo: 26090002,
                surname: 'TRẦN THỊ',
                firstname: 'BÍCH',
                fullName: 'TRẦN THỊ BÍCH',
                dob: '1998-07-20',
                sex: 'F',
                genderStr: 'Nữ',
                cccd: '001198000222',
                phone: '0912333444',
                address: 'Xã Yên Từ, Huyện Yên Mô, Tỉnh Ninh Bình',
                workplace: 'Trường Tiểu học Yên Từ',
                occupation: 'Giáo viên',
                formType: '3',
                vitals: {
                    height: 160,
                    weight: 50,
                    bmi: 19.5,
                    bp: '110/70',
                    pulse: 78,
                    temp: 36.6,
                    breath: 16
                },
                conclRow: {
                    hecl_theluc: 'Thể lực bình thường',
                    hecl_tuanhoan: 'Nhịp tim đều, tiếng tim rõ, T1 T2 nghe êm',
                    hecl_hohap: 'Lồng ngực cân đối, rì rào phế nang rõ 2 bên',
                    hecl_tieuhoa: 'Bụng mềm, ấn không đau, không có u cục',
                    hecl_thantietnieu: 'Hố thắt lưng 2 bên không đầy, chạm thận âm tính',
                    hecl_noitiet: 'Tuyến giáp không to',
                    hecl_coxuongkhop: 'Khớp bình thường, biên độ vận động tốt',
                    hecl_thankinh: 'Cảm giác và vận động bình thường',
                    hecl_tamthan: 'Bình thường, tâm lý thoải mái',
                    hecl_ngoai: 'Không có sẹo mổ ngoại khoa',
                    hecl_dalieu: 'Bình thường, da sáng',
                    hecl_mat: 'MP 10/10, MT 10/10, thị trường thị lực tốt',
                    hecl_tmh: 'Tai mũi họng bình thường, màng nhĩ tốt',
                    hecl_rhm: 'Không sâu răng, có cao răng độ 1',
                    hecl_phukhoa: 'Cổ tử cung nhẵn bóng, âm đạo sạch, phần phụ hai bên mềm không đau',
                    hecl_phanloai: '1',
                    hecl_conclusion: 'Đủ điều kiện sức khỏe công tác',
                    hecl_remark: 'Lấy cao răng định kỳ 6 tháng/lần'
                }
            },
            {
                docNo: 26090003,
                patientNo: 26090003,
                surname: 'LÊ HOÀNG',
                firstname: 'CƯỜNG',
                fullName: 'LÊ HOÀNG CƯỜNG',
                dob: '1978-11-10',
                sex: 'M',
                genderStr: 'Nam',
                cccd: '001078000333',
                phone: '0912555666',
                address: 'Phường Nam Bình, Thành phố Ninh Bình, Tỉnh Ninh Bình',
                workplace: 'Xí nghiệp Vận tải Đường bộ',
                occupation: 'Quản lý kho',
                formType: '3',
                vitals: {
                    height: 168,
                    weight: 74,
                    bmi: 26.2,
                    bp: '145/90',
                    pulse: 84,
                    temp: 36.7,
                    breath: 19
                },
                conclRow: {
                    hecl_theluc: 'Thể lực trung bình, thừa cân nhẹ (BMI 26.2)',
                    hecl_tuanhoan: 'Tiếng T1 T2 rõ, huyết áp dao động 145/90 mmHg, nhịp xoang 84 ck/p',
                    hecl_hohap: 'Phế trường sáng, rì rào phế nang rõ',
                    hecl_tieuhoa: 'Bụng mềm, dày mỡ dưới da bụng, gan lách bình thường',
                    hecl_thantietnieu: 'Chạm thận âm tính, không tiểu buốt dắt',
                    hecl_noitiet: 'Tuyến giáp bình thường',
                    hecl_coxuongkhop: 'Đau mỏi thắt lưng nhẹ khi mang vác nặng, khớp gối bình thường',
                    hecl_thankinh: 'Không dấu thần kinh khu trú',
                    hecl_tamthan: 'Tâm thần bình thường',
                    hecl_ngoai: 'Sẹo mổ ruột thừa vùng hố chậu phải 4cm, sẹo mềm lành tốt',
                    hecl_dalieu: 'Không có bệnh da liễu',
                    hecl_mat: 'MP 9/10, MT 9/10, viễn thị nhẹ',
                    hecl_tmh: 'Viêm mũi xoang dị ứng mạn tính nhẹ',
                    hecl_rhm: 'Hàn răng số 4 hàm dưới, khớp cắn bình thường',
                    hecl_phukhoa: '',
                    hecl_phanloai: '3',
                    hecl_conclusion: 'Sức khỏe Loại III - Đủ sức khỏe làm việc - Theo dõi Tăng huyết áp độ 1',
                    hecl_remark: 'Hạn chế ăn mặn, tập thể dục thường xuyên, kiểm tra huyết áp mỗi tuần'
                }
            },
            {
                docNo: 26090004,
                patientNo: 26090004,
                surname: 'PHẠM THU',
                firstname: 'DUNG',
                fullName: 'PHẠM THU DUNG',
                dob: '1994-09-25',
                sex: 'F',
                genderStr: 'Nữ',
                cccd: '001194000444',
                phone: '0912777888',
                address: 'Thị trấn Yên Thịnh, Huyện Yên Mô, Tỉnh Ninh Bình',
                workplace: 'Ngân hàng Nông nghiệp Agribank',
                occupation: 'Giao dịch viên',
                formType: '3',
                vitals: {
                    height: 162,
                    weight: 52,
                    bmi: 19.8,
                    bp: '115/75',
                    pulse: 76,
                    temp: 36.5,
                    breath: 16
                },
                conclRow: {
                    // Test trường hợp bác sĩ HIS nhập số 1 tắt cho mọi chuyên khoa
                    hecl_theluc: '1',
                    hecl_tuanhoan: '1',
                    hecl_hohap: '1',
                    hecl_tieuhoa: '1',
                    hecl_thantietnieu: '1',
                    hecl_noitiet: '1',
                    hecl_coxuongkhop: '1',
                    hecl_thankinh: '1',
                    hecl_tamthan: '1',
                    hecl_ngoai: '1',
                    hecl_dalieu: '1',
                    hecl_mat: '1',
                    hecl_tmh: '1',
                    hecl_rhm: '1',
                    hecl_phukhoa: '1',
                    hecl_phanloai: '1',
                    hecl_conclusion: 'Sức khỏe Loại I - Đủ điều kiện làm việc',
                    hecl_remark: 'Duy trì chế độ sinh hoạt điều độ, tái khám định kỳ'
                }
            },
            {
                docNo: 26090005,
                patientNo: 26090005,
                surname: 'VŨ MINH',
                firstname: 'ĐỨC',
                fullName: 'VŨ MINH ĐỨC',
                dob: '1971-05-30',
                sex: 'M',
                genderStr: 'Nam',
                cccd: '001071000555',
                phone: '0912999000',
                address: 'Xã Yên Mạc, Huyện Yên Mô, Tỉnh Ninh Bình',
                workplace: 'Công ty Cổ phần Vận tải Biển Hải Phòng',
                occupation: 'Thuyền viên - Lái tàu',
                formType: '3',
                vitals: {
                    height: 175,
                    weight: 72,
                    bmi: 23.5,
                    bp: '125/80',
                    pulse: 72,
                    temp: 36.5,
                    breath: 17
                },
                conclRow: {
                    hecl_theluc: 'Thể lực rất tốt, dẻo dai, chịu sóng tốt',
                    hecl_tuanhoan: 'Tim đều, mạch rõ 72 ck/p, HA 125/80 mmHg, không tiếng thổi cơ năng',
                    hecl_hohap: 'Lồng ngực nở nang, phế trường thông khí rất tốt',
                    hecl_tieuhoa: 'Bụng mềm, các tạng trong ổ bụng bình thường',
                    hecl_thantietnieu: 'Hệ tiết niệu sinh dục bình thường',
                    hecl_noitiet: 'Tuyến giáp bình thường',
                    hecl_coxuongkhop: 'Cơ bắp phát triển tốt, sức kéo lưng và cơ bóp tay tốt',
                    hecl_thankinh: 'Phản xạ thăng bằng và phối hợp động tác tốt, không chóng mặt',
                    hecl_tamthan: 'Tâm thần ổn định, phản ứng nhanh nhạy, chịu áp lực công việc tốt',
                    hecl_ngoai: 'Cơ quan vận động hoàn toàn bình thường, không sẹo mổ',
                    hecl_dalieu: 'Không có bệnh ngoài da truyền nhiễm',
                    hecl_mat: 'Mắt phải 10/10, Mắt trái 10/10, Sắc giác chuẩn, Thị trường rộng',
                    hecl_tmh: 'Tai trái nói thường 5m, Tai phải nói thường 5m, màng nhĩ sáng bóng',
                    hecl_rhm: 'Răng hàm mặt tốt, khớp cắn vững',
                    hecl_phukhoa: '',
                    hecl_phanloai: '1',
                    hecl_conclusion: 'Đủ điều kiện sức khỏe làm việc trên tàu biển và lái xe hạng C',
                    hecl_remark: 'Khám sức khỏe chuyên ngành định kỳ 12 tháng/lần'
                }
            }
        ];

        // 2. Tiến hành ghi vào CSDL
        for (const p of testProfiles) {
            await transaction(async (client) => {
                // A. hms_patient
                await client.query(`
                    INSERT INTO hms_patient (
                        hp_patientno, hp_surname, hp_firstname, hp_birthdate, hp_sex, hp_sin, hp_dtladdr, hp_workplace
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    ON CONFLICT (hp_patientno) DO UPDATE SET
                        hp_surname = EXCLUDED.hp_surname,
                        hp_firstname = EXCLUDED.hp_firstname,
                        hp_birthdate = EXCLUDED.hp_birthdate,
                        hp_sex = EXCLUDED.hp_sex,
                        hp_sin = EXCLUDED.hp_sin,
                        hp_dtladdr = EXCLUDED.hp_dtladdr,
                        hp_workplace = EXCLUDED.hp_workplace
                `, [p.patientNo, p.surname, p.firstname, p.dob, p.sex, p.cccd, p.address, p.workplace]);

                // B. hms_doc
                await client.query(`
                    INSERT INTO hms_doc (
                        hd_docno, hd_patientno, hd_status, hd_admitdate, hd_conclusion, hd_result, hd_doctor, hd_telephone
                    ) VALUES ($1, $2, 'T', CURRENT_TIMESTAMP, $3, $4, 'ptmphuong', $5)
                    ON CONFLICT (hd_docno) DO UPDATE SET
                        hd_patientno = EXCLUDED.hd_patientno,
                        hd_status = 'T',
                        hd_conclusion = EXCLUDED.hd_conclusion,
                        hd_result = EXCLUDED.hd_result,
                        hd_doctor = EXCLUDED.hd_doctor,
                        hd_telephone = EXCLUDED.hd_telephone
                `, [p.docNo, p.patientNo, p.conclRow.hecl_conclusion, p.conclRow.hecl_phanloai, p.phone]);

                // C. hms_exam
                await client.query(`
                    DELETE FROM hms_exam WHERE he_docno = $1
                `, [p.docNo]);
                const curReceptIdx = nextReceptIdx++;
                await client.query(`
                    INSERT INTO hms_exam (
                        he_docno, he_patientno, he_deptid, he_roomid, he_receptidx,
                        he_height, he_weight, he_bmi, he_bloodpressure, he_bloodpressurex,
                        he_pulse, he_temperature, he_breathinterval, he_examine, he_parts,
                        he_diagnostic, he_status, he_doctor, he_examdate
                    ) VALUES (
                        $1, $2, 'KB', 4, $14,
                        $3, $4, $5, $6, $7,
                        $8, $9, $10, $11, $12,
                        $13, 'T', 'ptmphuong', CURRENT_TIMESTAMP
                    )
                `, [
                    p.docNo, p.patientNo,
                    p.vitals.height, p.vitals.weight, p.vitals.bmi, 
                    Number(p.vitals.bp.split('/')[0]), Number(p.vitals.bp.split('/')[1]),
                    p.vitals.pulse, p.vitals.temp, p.vitals.breath,
                    p.conclRow.hecl_theluc, p.conclRow.hecl_tuanhoan,
                    p.conclRow.hecl_conclusion,
                    curReceptIdx
                ]);

                // D. hms_exm_conclusion (Toàn bộ 19 cột chuẩn)
                await client.query(`
                    INSERT INTO hms_exm_conclusion (
                        hecl_docno, hecl_theluc, hecl_tuanhoan, hecl_hohap, hecl_tieuhoa,
                        hecl_thantietnieu, hecl_noitiet, hecl_coxuongkhop, hecl_thankinh, hecl_tamthan,
                        hecl_ngoai, hecl_dalieu, hecl_mat, hecl_tmh, hecl_rhm, hecl_phukhoa,
                        hecl_phanloai, hecl_conclusion, hecl_remark
                    ) VALUES (
                        $1, $2, $3, $4, $5,
                        $6, $7, $8, $9, $10,
                        $11, $12, $13, $14, $15, $16,
                        $17, $18, $19
                    )
                    ON CONFLICT (hecl_docno) DO UPDATE SET
                        hecl_theluc = EXCLUDED.hecl_theluc,
                        hecl_tuanhoan = EXCLUDED.hecl_tuanhoan,
                        hecl_hohap = EXCLUDED.hecl_hohap,
                        hecl_tieuhoa = EXCLUDED.hecl_tieuhoa,
                        hecl_thantietnieu = EXCLUDED.hecl_thantietnieu,
                        hecl_noitiet = EXCLUDED.hecl_noitiet,
                        hecl_coxuongkhop = EXCLUDED.hecl_coxuongkhop,
                        hecl_thankinh = EXCLUDED.hecl_thankinh,
                        hecl_tamthan = EXCLUDED.hecl_tamthan,
                        hecl_ngoai = EXCLUDED.hecl_ngoai,
                        hecl_dalieu = EXCLUDED.hecl_dalieu,
                        hecl_mat = EXCLUDED.hecl_mat,
                        hecl_tmh = EXCLUDED.hecl_tmh,
                        hecl_rhm = EXCLUDED.hecl_rhm,
                        hecl_phukhoa = EXCLUDED.hecl_phukhoa,
                        hecl_phanloai = EXCLUDED.hecl_phanloai,
                        hecl_conclusion = EXCLUDED.hecl_conclusion,
                        hecl_remark = EXCLUDED.hecl_remark
                `, [
                    p.docNo,
                    p.conclRow.hecl_theluc, p.conclRow.hecl_tuanhoan, p.conclRow.hecl_hohap, p.conclRow.hecl_tieuhoa,
                    p.conclRow.hecl_thantietnieu, p.conclRow.hecl_noitiet, p.conclRow.hecl_coxuongkhop, p.conclRow.hecl_thankinh, p.conclRow.hecl_tamthan,
                    p.conclRow.hecl_ngoai, p.conclRow.hecl_dalieu, p.conclRow.hecl_mat, p.conclRow.hecl_tmh, p.conclRow.hecl_rhm, p.conclRow.hecl_phukhoa,
                    p.conclRow.hecl_phanloai, p.conclRow.hecl_conclusion, p.conclRow.hecl_remark
                ]);

                // E. hms_exm_employee (Gán vào hợp đồng KSK)
                await client.query(`
                    DELETE FROM hms_exm_employee WHERE hee_docno = $1
                `, [p.docNo]);
                const empRes = await client.query(`
                    INSERT INTO hms_exm_employee (
                        hee_employee_id, hee_contract_id, hee_docno, hee_patientno, hee_surname, hee_firstname,
                        hee_birthdate, hee_sex, hee_cardid, hee_phone, hee_address,
                        hee_dept, hee_status, hee_isactive, hee_conclusion
                    ) VALUES (
                        (SELECT COALESCE(MAX(hee_employee_id), 82280) + 1 FROM hms_exm_employee),
                        $1, $2, $3, $4, $5,
                        $6, $7, $8, $9, $10,
                        $11, 'T', 'Y', $12
                    ) RETURNING hee_employee_id
                `, [
                    contractId, p.docNo, p.patientNo, p.surname, p.firstname,
                    p.dob, p.sex, p.cccd, p.phone, p.address,
                    p.workplace, p.conclRow.hecl_phanloai
                ]);
                const empId = empRes.rows[0].hee_employee_id;

                // F. health_check_masters & health_check_details (Đồng bộ KSK Web)
                const clinExam = mapConclusionRowToClinicalExam(p.conclRow, {}, p.conclRow.hecl_phanloai);
                const clinicalDataObj: any = {
                    phone: p.phone,
                    address: p.address,
                    workplace: p.workplace,
                    cccd: p.cccd,
                    examination: {
                        height: String(p.vitals.height),
                        weight: String(p.vitals.weight),
                        bmi: String(p.vitals.bmi),
                        blood_pressure: p.vitals.bp,
                        bp: p.vitals.bp,
                        pulse: String(p.vitals.pulse),
                        temperature: String(p.vitals.temp),
                        breathing_rate: String(p.vitals.breath),
                        physical_summary: p.conclRow.hecl_theluc
                    },
                    clinical_exam: clinExam,
                    extra: {
                        doctor_id: 'ptmphuong',
                        doctor_name: 'BS. Phạm Thị Minh Phương',
                        concl_doctor_id: 'ptmphuong',
                        concl_doctor_name: 'BS. Phạm Thị Minh Phương',
                        gio_kham: '08:30',
                        ngay_kham: new Date().toISOString().split('T')[0]
                    }
                };

                const conclusionDataObj = {
                    fitness_class: p.conclRow.hecl_phanloai,
                    fitness_class_name: p.conclRow.hecl_phanloai === '1' ? 'Loại I' : (p.conclRow.hecl_phanloai === '3' ? 'Loại III' : `Loại ${p.conclRow.hecl_phanloai}`),
                    diagnosis: p.conclRow.hecl_conclusion,
                    doctor_id: 'ptmphuong',
                    doctor_name: 'BS. Phạm Thị Minh Phương',
                    cac_van_de_luu_y: p.conclRow.hecl_remark,
                    cac_benh_tat_neu_co: p.conclRow.hecl_phanloai === '3' ? 'Tăng huyết áp độ 1' : ''
                };

                const specMetadata = buildSpecialtyMetadata({
                    clinicalData: clinicalDataObj,
                    conclusionData: conclusionDataObj,
                    examDoctorId: 'ptmphuong',
                    examDoctorName: 'BS. Phạm Thị Minh Phương',
                    conclDoctorId: 'ptmphuong',
                    conclDoctorName: 'BS. Phạm Thị Minh Phương',
                    hasExam: true,
                    hasConclusion: true
                });

                clinicalDataObj.specialty_metadata = specMetadata;
                clinicalDataObj.clinical_exam.specialty_metadata = specMetadata;

                const xmlPayload = generateXmlPayload(
                    p.formType,
                    { patientName: p.fullName, cccd: p.cccd, dob: p.dob, gender: p.genderStr, docNo: p.docNo },
                    clinicalDataObj,
                    {},
                    conclusionDataObj
                );

                // Upsert health_check_masters
                const existingMaster = await client.query(`
                    SELECT id FROM health_check_masters WHERE his_doc_no = $1 OR doc_no = $1
                `, [String(p.docNo)]);

                let masterId = 0;
                if (existingMaster.rows.length > 0) {
                    masterId = existingMaster.rows[0].id;
                    await client.query(`
                        UPDATE health_check_masters SET
                            patient_name = $1, cccd = $2, dob = $3, gender = $4,
                            form_type = $5, xml_data = $6, his_contract_id = $7, his_employee_id = $8,
                            updated_at = NOW()
                        WHERE id = $9
                    `, [p.fullName, p.cccd, p.dob, p.genderStr, p.formType, xmlPayload, contractId, empId, masterId]);
                } else {
                    const insMaster = await client.query(`
                        INSERT INTO health_check_masters (
                            patient_id, patient_name, cccd, dob, gender, doc_no, his_doc_no,
                            his_contract_id, his_employee_id, form_type, xml_data, sync_mode
                        ) VALUES (
                            $1, $2, $3, $4, $5, $6, $7,
                            $8, $9, $10, $11, 'HIS'
                        ) RETURNING id
                    `, [
                        String(p.patientNo), p.fullName, p.cccd, p.dob, p.genderStr, String(p.docNo), String(p.docNo),
                        contractId, empId, p.formType, xmlPayload
                    ]);
                    masterId = insMaster.rows[0].id;
                }

                // Upsert health_check_details
                await client.query(`DELETE FROM health_check_details WHERE master_id = $1`, [masterId]);
                await client.query(`
                    INSERT INTO health_check_details (
                        master_id, clinical_data, lab_data, conclusion_data, updated_at
                    ) VALUES (
                        $1, $2, $3, $4, NOW()
                    )
                `, [masterId, JSON.stringify(clinicalDataObj), JSON.stringify({}), JSON.stringify(conclusionDataObj)]);
            });

            console.log(`✅ [Đã tạo] #${p.docNo}: ${p.fullName} (CCCD: ${p.cccd}) - Phân loại: ${p.conclRow.hecl_phanloai} - Kết luận: "${p.conclRow.hecl_conclusion}"`);
        }

        console.log('\n🎉 ĐÃ TẠO THÀNH CÔNG 5 HỒ SƠ TEST HOÀN HẢO!');
        console.log(`📌 Mã hợp đồng KSK test: HD-TEST-2026 (Contract ID: ${contractId})`);
        console.log('📌 Danh sách 5 hồ sơ test:');
        testProfiles.forEach((p, idx) => {
            console.log(`   ${idx + 1}. [Mã HS: ${p.docNo}] [CCCD: ${p.cccd}] ${p.fullName} (${p.genderStr}, sinh ${p.dob}) -> PL: Loại ${p.conclRow.hecl_phanloai}`);
        });

    } catch (err) {
        console.error('❌ Lỗi khi tạo dữ liệu test:', err);
    } finally {
        process.exit(0);
    }
}

create5TestKskRecords();
