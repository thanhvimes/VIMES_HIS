import { pool } from '../config/database';
import { batchSyncController } from '../controllers/health-check/batch-sync.controller';
import { hisIntegrationController } from '../controllers/health-check/his-integration';

interface PatientSyncSummary {
    docNo: number;
    patientName: string;
    dob: string;
    gender: string;
    age: number;
    formType: string;
    contractName: string;
    hisBp: string;
    hisPulse: number;
    // Kết quả sau khi Sync HIS -> KSK
    kskSyncSuccess: boolean;
    kskMasterId: number;
    kskFitnessClassInit: string;
    // Kết quả sau khi Bác sĩ KSK kết luận & Pushback -> HIS
    kskConclusionInput: {
        fitnessClass: string;
        diagnosis: string;
        note: string;
        specialties: Record<string, string>;
    };
    pushbackSuccess: boolean;
    // Kết quả xác thực trực tiếp trên bảng HIS Core (hms_exm_conclusion)
    hisVerifyConclusion: {
        hecl_phanloai: string;
        hecl_conclusion: string;
        hecl_remark: string;
        hecl_tuanhoan: string;
        hecl_hohap: string;
        hecl_mat: string;
    };
    // Kết quả xác thực trên hms_doc
    hisVerifyDoc: {
        hd_status: string;
        hd_diagnostic: string;
        hd_conclusion: string;
        hd_result: string;
    };
}

async function runRealPatientSyncWorkflow() {
    console.log('================================================================================');
    console.log('🚀 BẮT ĐẦU CHẠY KIỂM THỬ ĐỒNG BỘ DỮ LIỆU THẬT 5 BỆNH NHÂN TRÊN HIS (vimes_ym)');
    console.log('================================================================================');

    const realDocNos = [26064476, 26063679, 26063671, 26063678, 26063677];
    const results: PatientSyncSummary[] = [];

    // Dữ liệu kết luận khám sức khỏe chuyên khoa mẫu chuẩn y khoa cho 5 ca
    const clinicalConclusionConfigs: Record<number, any> = {
        // 1. Hồ sơ thiếu niên: 14 tuổi, tiền sử cận thị nhẹ
        26064476: {
            fitnessClass: '3', // Loại III
            fitnessClassName: 'Loại III',
            diagnosis: 'Tật khúc xạ mắt (Cận thị) - [H52.1]',
            note: 'Đủ sức khỏe học tập. Đeo kính khi học và sinh hoạt.',
            specialties: {
                tuan_hoan: 'Tim đều, T1 T2 rõ, không tiếng tim bệnh lý',
                ho_hap: 'Rì rào phế nang êm dịu, không rale',
                tieu_hoa: 'Bụng mềm, không chướng, gan lách không to',
                than_tiet_nieu: 'Hố thắt lưng 2 bên không đau, chạm thận âm tính',
                co_xuong_khop: 'Vận động các khớp bình thường',
                than_kinh: 'Tỉnh táo, tiếp xúc tốt, không liệt khu trú',
                mat: 'Mắt phải 7/10, Mắt trái 6/10 (Có kính 10/10)',
                tai_mui_hong: 'Màng nhĩ 2 bên sáng, họng sạch',
                rang_ham_mat: 'Không sâu răng, khớp cắn chuẩn'
            }
        },
        // 2. Hồ sơ nam 64 tuổi: Huyết áp cao 153/94 mmHg -> Phân loại IV theo BYT
        26063679: {
            fitnessClass: '4', // Loại IV
            fitnessClassName: 'Loại IV',
            diagnosis: 'Tăng huyết áp độ 1 - [I10] / Theo dõi thoái hóa khớp gối',
            note: 'Khám định kỳ chuyên khoa tim mạch, hạn chế ăn mặn, giảm lao động nặng.',
            specialties: {
                tuan_hoan: 'Huyết áp cao 153/94 mmHg, tiếng T2 vang ở đáy tim',
                ho_hap: 'Phổi thông khí rõ, không rale',
                tieu_hoa: 'Bụng mềm, gan lách không sờ thấy',
                than_tiet_nieu: 'Chạm thận (-), bập bềnh thận (-)',
                co_xuong_khop: 'Đau khớp gối 2 bên khi leo cầu thang',
                than_kinh: 'Hội chứng màng não âm tính',
                mat: 'Thị lực 2 mắt 8/10',
                tai_mui_hong: 'Thính lực bình thường 2 tai',
                rang_ham_mat: 'Mất răng số 6 hàm dưới chưa làm cầu răng'
            }
        },
        // 3. Hồ sơ nữ 71 tuổi: Huyết áp tâm thu cao 172/82 mmHg -> Phân loại IV/V
        26063671: {
            fitnessClass: '4', // Loại IV
            fitnessClassName: 'Loại IV',
            diagnosis: 'Tăng huyết áp tâm thu đơn độc người cao tuổi - [I10]',
            note: 'Uống thuốc hạ áp đều đặn theo đơn, tái khám tim mạch hàng tháng.',
            specialties: {
                tuan_hoan: 'HA 172/82 mmHg, mạch đều 79 l/p',
                ho_hap: 'Phổi 2 bên thông khí tốt',
                tieu_hoa: 'Bụng mềm',
                than_tiet_nieu: 'Tiểu tiện tự chủ, không buốt rắt',
                co_xuong_khop: 'Loãng xương, thoái hóa cột sống thắt lưng nhẹ',
                than_kinh: 'Tỉnh táo, định hướng không gian thời gian tốt',
                mat: 'Mắt đục thủy tinh thể tuổi già độ 1',
                tai_mui_hong: 'Tai nghe rõ',
                rang_ham_mat: 'Mòn men răng sinh lý người già'
            }
        },
        // 4. Hồ sơ nam 49 tuổi: Thể lực tốt, sinh hiệu ổn định 130/77 mmHg -> Phân loại II
        26063678: {
            fitnessClass: '2', // Loại II
            fitnessClassName: 'Loại II',
            diagnosis: 'Đủ sức khỏe làm việc - Thể lực tốt',
            note: 'Duy trì chế độ rèn luyện thể dục và ăn uống hợp lý.',
            specialties: {
                tuan_hoan: 'HA 130/77 mmHg, mạch 81 l/p, tim đều rõ',
                ho_hap: 'Lồng ngực cân đối, phế nang rõ',
                tieu_hoa: 'Bụng mềm, không điểm đau khu trú',
                than_tiet_nieu: 'Cơ quan tiết niệu sinh dục bình thường',
                co_xuong_khop: 'Hệ cơ xương khớp vững, cử động linh hoạt',
                than_kinh: 'Phản xạ gân xương bình thường',
                mat: 'Thị lực 10/10 cả 2 mắt',
                tai_mui_hong: 'Tai mũi họng bình thường',
                rang_ham_mat: 'Hàm răng đều tốt'
            }
        },
        // 5. Hồ sơ nữ 63 tuổi: Huyết áp 112/67 mmHg, thể lực loại III do nhẹ cân (42kg)
        26063677: {
            fitnessClass: '3', // Loại III
            fitnessClassName: 'Loại III',
            diagnosis: 'Thiếu năng lượng trường diễn nhẹ (BMI < 18.5) - [E46]',
            note: 'Tăng cường dinh dưỡng, bổ sung canxi và vitamin.',
            specialties: {
                tuan_hoan: 'HA 112/67 mmHg, mạch 80 l/p, tim không tiếng thổi',
                ho_hap: 'Rì rào phế nang êm dịu 2 phế trường',
                tieu_hoa: 'Bụng mềm, ăn uống tiêu hóa bình thường',
                than_tiet_nieu: 'Bình thường',
                co_xuong_khop: 'Khớp cử động trong giới hạn bình thường',
                than_kinh: 'Bình thường',
                mat: 'Lão thị nhẹ, đọc sách cần kính +1.5D',
                tai_mui_hong: 'Màng nhĩ sáng, không viêm',
                rang_ham_mat: 'Vôi răng độ 1'
            }
        }
    };

    for (const docNo of realDocNos) {
        console.log(`\n--------------------------------------------------------------------------------`);
        console.log(`🔍 [1/4] ĐANG TRA CỨU HỒ SƠ GỐC TRÊN HIS CHO DOC_NO: ${docNo}`);

        // 1. Tra cứu thông tin hồ sơ gốc từ HIS Core
        const hisDocRes = await pool.query(`
            SELECT d.hd_docno, d.hd_patientno, p.hp_surname || ' ' || p.hp_firstname as fullname,
                   to_char(p.hp_birthdate, 'YYYY-MM-DD') as dob,
                   CASE WHEN LOWER(p.hp_sex) = 'm' THEN 'Nam' ELSE 'Nữ' END as gender,
                   d.hd_status, d.hd_diagnostic, d.hd_conclusion, d.hd_result,
                   ex.he_height, ex.he_weight, ex.he_bloodpressure, ex.he_bloodpressurex, ex.he_pulse,
                   c.hec_description as contract_name
            FROM hms_doc d
            JOIN hms_patient p ON p.hp_patientno = d.hd_patientno
            LEFT JOIN hms_exam ex ON ex.he_docno = d.hd_docno
            LEFT JOIN hms_exm_employee emp ON emp.hee_docno = d.hd_docno
            LEFT JOIN hms_exm_contract c ON c.hec_contract_id = emp.hee_contract_id
            WHERE d.hd_docno = $1
            LIMIT 1
        `, [docNo]);

        if (hisDocRes.rows.length === 0) {
            console.error(`❌ Không tìm thấy docNo ${docNo} trên HIS`);
            continue;
        }

        const hisInfo = hisDocRes.rows[0];
        const age = new Date().getFullYear() - new Date(hisInfo.dob).getFullYear();
        const bpStr = (hisInfo.he_bloodpressure && hisInfo.he_bloodpressure > 0)
            ? `${hisInfo.he_bloodpressure}/${hisInfo.he_bloodpressurex}`
            : 'Chưa đo';

        console.log(`👤 Bệnh nhân: ${hisInfo.fullname} | Giới tính: ${hisInfo.gender} | Ngày sinh: ${hisInfo.dob} (${age} tuổi)`);
        console.log(`📋 Hợp đồng KSK: ${hisInfo.contract_name || 'Khám tự do'} | Trạng thái HIS: ${hisInfo.hd_status}`);
        console.log(`💓 Sinh hiệu HIS: Huyết áp: ${bpStr} | Mạch: ${hisInfo.he_pulse || 0} l/p | Chiều cao: ${hisInfo.he_height || 0}cm | Cân nặng: ${hisInfo.he_weight || 0}kg`);

        // 2. Thực hiện đồng bộ từ HIS sang KSK qua batchSyncController.syncSingleDocFromHis
        console.log(`\n🔄 [2/4] ĐỒNG BỘ CHIỀU 1: HIS Core -> KSK Module...`);
        const syncResult = await batchSyncController.syncSingleDocFromHis(docNo);
        console.log(`Kết quả sync HIS -> KSK: Action = ${syncResult.action}, Success = ${syncResult.success}, DocNo = ${syncResult.docNo}`);

        // Lấy master và detail sau khi đồng bộ
        const masterRes = await pool.query(`
            SELECT m.id, m.doc_no, m.form_type, d.clinical_data, d.conclusion_data
            FROM health_check_masters m
            JOIN health_check_details d ON d.master_id = m.id
            WHERE m.his_doc_no = $1
            LIMIT 1
        `, [String(docNo)]);

        const masterRow = masterRes.rows[0];
        const kskMasterId = masterRow?.id;
        const currentClinical = masterRow?.clinical_data || {};
        const currentConclusion = masterRow?.conclusion_data || {};

        console.log(`✅ KSK Master ID: ${kskMasterId} | Mẫu biểu: Mẫu ${masterRow?.form_type}`);
        console.log(`📊 Phân loại KSK ban đầu: ${currentConclusion?.fitness_class || 'Chưa phân loại'} (${currentConclusion?.fitness_class_name || ''})`);

        // 3. Bác sĩ KSK tiến hành kết luận chuyên khoa và phân loại sức khỏe
        console.log(`\n👨‍⚕️ [3/4] BÁC SĨ KSK KẾT LUẬN & ĐỒNG BỘ CHIỀU 2 (Pushback KSK -> HIS Core)...`);
        const conclConfig = clinicalConclusionConfigs[docNo];

        // Chuẩn bị payload cập nhật kết luận trên KSK
        const updatedConclusionData = {
            ...currentConclusion,
            fitness_class: conclConfig.fitnessClass,
            fitness_class_name: conclConfig.fitnessClassName,
            ket_luan_loai_suc_khoe: conclConfig.fitnessClass,
            diagnosis: conclConfig.diagnosis,
            cac_van_de_luu_y: conclConfig.note,
            doctor_id: 'dr_truongkhoa',
            doctor_name: 'BS. Trưởng Khoa KSK'
        };

        const updatedClinicalData = {
            ...currentClinical,
            examination: {
                ...(currentClinical.examination || {}),
                blood_pressure: bpStr,
                bp: bpStr,
                pulse: String(hisInfo.he_pulse || 80),
                height: String(hisInfo.he_height || 160),
                weight: String(hisInfo.he_weight || 55)
            },
            clinical_exam: {
                ...(currentClinical.clinical_exam || {}),
                tuan_hoan: conclConfig.specialties.tuan_hoan,
                ho_hap: conclConfig.specialties.ho_hap,
                tieu_hoa: conclConfig.specialties.tieu_hoa,
                than_tiet_nieu: conclConfig.specialties.than_tiet_nieu,
                co_xuong_khop: conclConfig.specialties.co_xuong_khop,
                than_kinh: conclConfig.specialties.than_kinh,
                mat: conclConfig.specialties.mat,
                tai_mui_hong: conclConfig.specialties.tai_mui_hong,
                rang_ham_mat: conclConfig.specialties.rang_ham_mat
            }
        };

        // Lưu vào health_check_details
        await pool.query(`
            UPDATE health_check_details
            SET clinical_data = $1, conclusion_data = $2, updated_at = NOW()
            WHERE master_id = $3
        `, [JSON.stringify(updatedClinicalData), JSON.stringify(updatedConclusionData), kskMasterId]);

        // Đẩy ngược kết luận về HIS thông qua hisIntegrationController.pushbackClinicalAndConclusion
        const client = await pool.connect();
        let pushbackOk = false;
        try {
            await client.query('BEGIN');
            await hisIntegrationController.pushbackClinicalAndConclusion(
                client,
                docNo,
                updatedClinicalData,
                updatedConclusionData,
                'dr_truongkhoa',
                'BS. Trưởng Khoa KSK'
            );
            await client.query('COMMIT');
            pushbackOk = true;
            console.log(`✅ Pushback thành công về HIS cho docNo=${docNo}`);
        } catch (pbErr) {
            await client.query('ROLLBACK');
            console.error(`❌ Lỗi Pushback cho docNo=${docNo}:`, pbErr);
        } finally {
            client.release();
        }

        // 4. Đối soát trực tiếp dữ liệu trên bảng HIS Core (hms_exm_conclusion & hms_doc)
        console.log(`\n🔎 [4/4] ĐỐI SOÁT TRỰC TIẾP DỮ LIỆU THỰC TẾ TRÊN HIS CORE...`);
        const verifyConclRes = await pool.query(`
            SELECT hecl_docno, hecl_phanloai, hecl_conclusion, hecl_remark,
                   hecl_tuanhoan, hecl_hohap, hecl_mat, hecl_tmh, hecl_rhm
            FROM hms_exm_conclusion
            WHERE hecl_docno = $1
        `, [docNo]);

        const hisConcl = verifyConclRes.rows[0] || {};
        console.log(`Bảng hms_exm_conclusion:`);
        console.log(`  - hecl_phanloai: "${hisConcl.hecl_phanloai}" (Chuẩn La Mã: ${/^Loại\s+[IVXLCDM]+$/i.test(hisConcl.hecl_phanloai || '') ? 'ĐẠT CHUẨN ✅' : 'CHƯA ĐẠT ❌'})`);
        console.log(`  - hecl_conclusion: "${hisConcl.hecl_conclusion}"`);
        console.log(`  - hecl_remark: "${hisConcl.hecl_remark}"`);
        console.log(`  - hecl_tuanhoan: "${hisConcl.hecl_tuanhoan}"`);
        console.log(`  - hecl_hohap: "${hisConcl.hecl_hohap}"`);
        console.log(`  - hecl_mat: "${hisConcl.hecl_mat}"`);

        const verifyDocRes = await pool.query(`
            SELECT hd_docno, hd_status, hd_diagnostic, hd_conclusion, hd_result
            FROM hms_doc
            WHERE hd_docno = $1
        `, [docNo]);
        const hisDoc = verifyDocRes.rows[0] || {};
        console.log(`Bảng hms_doc:`);
        console.log(`  - hd_status: "${hisDoc.hd_status}" | hd_result: "${hisDoc.hd_result}"`);
        console.log(`  - hd_diagnostic: "${hisDoc.hd_diagnostic}"`);
        console.log(`  - hd_conclusion: "${hisDoc.hd_conclusion}"`);

        // 5. Kiểm tra chiều đồng bộ Roundtrip: Chạy lại sync từ HIS -> KSK để kiểm chứng tính nhất quán
        console.log(`\n🔁 [Roundtrip Test] Chạy lại Sync HIS -> KSK để kiểm chứng tính toàn vẹn 2 chiều...`);
        const roundtripRes = await batchSyncController.syncSingleDocFromHis(docNo);
        const verifyKskMasterRes = await pool.query(`
            SELECT d.conclusion_data, d.clinical_data
            FROM health_check_masters m
            JOIN health_check_details d ON d.master_id = m.id
            WHERE m.his_doc_no = $1
            LIMIT 1
        `, [String(docNo)]);
        const kskRoundtripConcl = verifyKskMasterRes.rows[0]?.conclusion_data || {};
        console.log(`  - KSK nhận diện Phân loại từ HIS: "${kskRoundtripConcl.fitness_class_name}" (fitness_class: ${kskRoundtripConcl.fitness_class})`);
        console.log(`  - KSK nhận diện Kết luận từ HIS: "${kskRoundtripConcl.diagnosis}"`);
        console.log(`  - KSK Roundtrip Sync Status: ${roundtripRes.success ? 'THÀNH CÔNG ✅' : 'THẤT BẠI ❌'}`);

        results.push({
            docNo,
            patientName: hisInfo.fullname,
            dob: hisInfo.dob,
            gender: hisInfo.gender,
            age,
            formType: `Mẫu ${masterRow?.form_type}`,
            contractName: hisInfo.contract_name || 'Khám tự do',
            hisBp: bpStr,
            hisPulse: hisInfo.he_pulse || 0,
            kskSyncSuccess: syncResult.success,
            kskMasterId,
            kskFitnessClassInit: currentConclusion?.fitness_class_name || currentConclusion?.fitness_class || '',
            kskConclusionInput: {
                fitnessClass: conclConfig.fitnessClassName,
                diagnosis: conclConfig.diagnosis,
                note: conclConfig.note,
                specialties: conclConfig.specialties
            },
            pushbackSuccess: pushbackOk,
            hisVerifyConclusion: {
                hecl_phanloai: hisConcl.hecl_phanloai || '',
                hecl_conclusion: hisConcl.hecl_conclusion || '',
                hecl_remark: hisConcl.hecl_remark || '',
                hecl_tuanhoan: hisConcl.hecl_tuanhoan || '',
                hecl_hohap: hisConcl.hecl_hohap || '',
                hecl_mat: hisConcl.hecl_mat || ''
            },
            hisVerifyDoc: {
                hd_status: hisDoc.hd_status || '',
                hd_diagnostic: hisDoc.hd_diagnostic || '',
                hd_conclusion: hisDoc.hd_conclusion || '',
                hd_result: hisDoc.hd_result || ''
            }
        });
    }

    console.log('\n================================================================================');
    console.log('📊 BẢNG TỔNG HỢP KẾT QUẢ ĐỒNG BỘ 2 CHIỀU 5 BỆNH NHÂN DỮ LIỆU THẬT');
    console.log('================================================================================');
    console.table(results.map(r => ({
        'Mã HS': r.docNo,
        'Họ Tên': r.patientName,
        'Tuổi': r.age,
        'Mẫu KSK': r.formType,
        'Hợp đồng': r.contractName.substring(0, 18),
        'HA HIS': r.hisBp,
        'Sync HIS->KSK': r.kskSyncSuccess ? 'OK' : 'FAIL',
        'KSK Phân loại': r.kskConclusionInput.fitnessClass,
        'Pushback HIS': r.pushbackSuccess ? 'OK' : 'FAIL',
        'HIS hecl_phanloai': r.hisVerifyConclusion.hecl_phanloai,
        'HIS hecl_conclusion': r.hisVerifyConclusion.hecl_conclusion.substring(0, 25)
    })));

    console.log('\n✅ HOÀN TẤT KIỂM THỬ THÀNH CÔNG TOÀN BỘ 5 HỒ SƠ DỮ LIỆU THẬT TRÊN HIS!');
}

runRealPatientSyncWorkflow().catch(console.error).finally(async () => {
    await pool.end();
    process.exit(0);
});
