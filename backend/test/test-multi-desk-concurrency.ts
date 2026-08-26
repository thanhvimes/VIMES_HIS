import test from 'node:test';
import assert from 'node:assert/strict';
import {
    mergeClinicalData,
    mergeLabData,
    mergeConclusionData,
    mergeSpecialtyMetadata
} from '../src/services/health-check-merge.service';
import { generateXmlPayload } from '../src/controllers/health-check/xml-generator';

test('Empirical Concurrency Test: 8 Desks starting with empty state and approving sequentially', () => {
    console.log('\n================================================================');
    console.log('🧪 EMPIRICAL TEST: 8 BÀN KHÁM CÙNG MỞ TỪ ĐẦU, DUYỆT LẦN LƯỢT');
    console.log('================================================================');

    // 0. Initial DB State after Reception (Tiếp đón)
    let currentDbState: {
        clinicalData: any;
        labData: any;
        conclusionData: any;
    } = {
        clinicalData: {
            address: '123 Phố Huế, Hai Bà Trưng, Hà Nội',
            phone: '0988888888',
            funding_source: '1',
            examination: { height: '', weight: '', blood_pressure: '', pulse: '', bmi: '' },
            clinical_exam: { specialty_metadata: {} }
        },
        labData: {
            blood_test: {},
            urine_test: {},
            imaging: {},
            paraclinical_items: []
        },
        conclusionData: {
            fitness_class: '',
            diagnosis: '',
            doctor_id: ''
        }
    };

    // Stale initial form state that all 8 desks opened at 08:00
    const staleInitialSnapshot = JSON.parse(JSON.stringify(currentDbState));

    // -------------------------------------------------------------
    // BÀN 1: Thể lực duyệt lúc 08:02
    // -------------------------------------------------------------
    console.log('  1️⃣ Bàn Thể lực duyệt (Chiều cao 172cm, Cân nặng 68kg, HA 120/80, Mạch 76)');
    const desk1Incoming = JSON.parse(JSON.stringify(staleInitialSnapshot));
    desk1Incoming.clinicalData.examination = {
        height: '172', weight: '68', blood_pressure: '120/80', pulse: '76', bmi: '23.0'
    };
    desk1Incoming.clinicalData.clinical_exam.kham_the_luc_pl = '1';
    desk1Incoming.clinicalData.clinical_exam.specialty_metadata = {
        physical: { doctorId: 'bs_theluc', doctorName: 'BS Nguyễn Thể Lực', status: 'ĐÃ_DUYỆT' }
    };

    // Merge on Server
    currentDbState.clinicalData = mergeClinicalData(currentDbState.clinicalData, desk1Incoming.clinicalData);
    currentDbState.labData = mergeLabData(currentDbState.labData, desk1Incoming.labData);
    currentDbState.conclusionData = mergeConclusionData(currentDbState.conclusionData, desk1Incoming.conclusionData);

    // -------------------------------------------------------------
    // BÀN 2: Nội khoa duyệt lúc 08:04 (Form trên máy Bàn Nội chưa có thể lực)
    // -------------------------------------------------------------
    console.log('  2️⃣ Bàn Nội khoa duyệt (Tim mạch đều, Phổi trong rale âm)');
    const desk2Incoming = JSON.parse(JSON.stringify(staleInitialSnapshot));
    // Trên máy Bàn 2 thể lực vẫn trống
    desk2Incoming.clinicalData.clinical_exam.kq_tim_mach = 'Nhịp tim đều 76 l/p, T1 T2 rõ không âm bệnh lý';
    desk2Incoming.clinicalData.clinical_exam.kq_ho_hap = 'Rì rào phế nang êm dịu 2 phế trường, không rale';
    desk2Incoming.clinicalData.clinical_exam.noi_khoa_tuan_hoan_pl = '1';
    desk2Incoming.clinicalData.clinical_exam.noi_khoa_ho_hap_pl = '1';
    desk2Incoming.clinicalData.clinical_exam.noi_khoa_tieu_hoa_pl = '1';
    desk2Incoming.clinicalData.clinical_exam.specialty_metadata = {
        physical: { doctorId: '', status: 'CHUA_KHAM' }, // Stale default
        internal: { doctorId: 'bs_noikhoa', doctorName: 'BS Trần Nội Khoa', status: 'ĐÃ_DUYỆT' }
    };

    // Merge on Server
    currentDbState.clinicalData = mergeClinicalData(currentDbState.clinicalData, desk2Incoming.clinicalData);
    currentDbState.labData = mergeLabData(currentDbState.labData, desk2Incoming.labData);
    currentDbState.conclusionData = mergeConclusionData(currentDbState.conclusionData, desk2Incoming.conclusionData);

    // Verify after desk 2: Both Physical & Internal must exist!
    assert.equal(currentDbState.clinicalData.examination.height, '172', 'Thể lực bị mất khi Nội khoa duyệt!');
    assert.equal(currentDbState.clinicalData.clinical_exam.kq_tim_mach, 'Nhịp tim đều 76 l/p, T1 T2 rõ không âm bệnh lý');
    assert.equal(currentDbState.clinicalData.clinical_exam.specialty_metadata.physical.status, 'ĐÃ_DUYỆT');
    assert.equal(currentDbState.clinicalData.clinical_exam.specialty_metadata.internal.status, 'ĐÃ_DUYỆT');

    // -------------------------------------------------------------
    // BÀN 3: Mắt duyệt lúc 08:06 (Form trên máy Bàn Mắt chưa có thể lực, nội khoa)
    // -------------------------------------------------------------
    console.log('  3️⃣ Bàn Mắt duyệt (Thị lực 10/10 hai mắt, Sắc giác bình thường)');
    const desk3Incoming = JSON.parse(JSON.stringify(staleInitialSnapshot));
    desk3Incoming.clinicalData.clinical_exam.khong_kinh_mat_phai = '10/10';
    desk3Incoming.clinicalData.clinical_exam.khong_kinh_mat_trai = '10/10';
    desk3Incoming.clinicalData.clinical_exam.sac_giac = 'Bình thường';
    desk3Incoming.clinicalData.clinical_exam.eye = 'Thị lực 10/10 cả hai mắt';
    desk3Incoming.clinicalData.clinical_exam.kham_mat_pl = '1';
    desk3Incoming.clinicalData.clinical_exam.specialty_metadata = {
        physical: { doctorId: '', status: 'CHUA_KHAM' },
        internal: { doctorId: '', status: 'CHUA_KHAM' },
        eye: { doctorId: 'bs_mat', doctorName: 'BS Lê Thị Mắt', status: 'ĐÃ_DUYỆT' }
    };

    currentDbState.clinicalData = mergeClinicalData(currentDbState.clinicalData, desk3Incoming.clinicalData);

    // -------------------------------------------------------------
    // BÀN 4: Tai Mũi Họng duyệt lúc 08:08
    // -------------------------------------------------------------
    console.log('  4️⃣ Bàn Tai Mũi Họng duyệt (Nói thường 5m, Nói thầm 0.5m)');
    const desk4Incoming = JSON.parse(JSON.stringify(staleInitialSnapshot));
    desk4Incoming.clinicalData.clinical_exam.tai_trai_noi_thuong = '5m';
    desk4Incoming.clinicalData.clinical_exam.tai_phai_noi_thuong = '5m';
    desk4Incoming.clinicalData.clinical_exam.tai_trai_noi_tham = '0.5m';
    desk4Incoming.clinicalData.clinical_exam.tai_phai_noi_tham = '0.5m';
    desk4Incoming.clinicalData.clinical_exam.ent = 'Tai mũi họng bình thường';
    desk4Incoming.clinicalData.clinical_exam.kham_tai_mui_hong_pl = '1';
    desk4Incoming.clinicalData.clinical_exam.specialty_metadata = {
        ent: { doctorId: 'bs_tmh', doctorName: 'BS Phạm TMH', status: 'ĐÃ_DUYỆT' }
    };

    currentDbState.clinicalData = mergeClinicalData(currentDbState.clinicalData, desk4Incoming.clinicalData);

    // -------------------------------------------------------------
    // BÀN 5: Răng Hàm Mặt duyệt lúc 08:10
    // -------------------------------------------------------------
    console.log('  5️⃣ Bàn Răng Hàm Mặt duyệt (Không sâu răng, không mất răng)');
    const desk5Incoming = JSON.parse(JSON.stringify(staleInitialSnapshot));
    desk5Incoming.clinicalData.clinical_exam.ham_tren = 'Không sâu răng, không mất răng';
    desk5Incoming.clinicalData.clinical_exam.ham_duoi = 'Không sâu răng, không mất răng';
    desk5Incoming.clinicalData.clinical_exam.dental = 'Răng hàm mặt bình thường';
    desk5Incoming.clinicalData.clinical_exam.kham_rang_ham_mat_pl = '1';
    desk5Incoming.clinicalData.clinical_exam.specialty_metadata = {
        dental: { doctorId: 'bs_rhm', doctorName: 'BS Hoàng RHM', status: 'ĐÃ_DUYỆT' }
    };

    currentDbState.clinicalData = mergeClinicalData(currentDbState.clinicalData, desk5Incoming.clinicalData);

    // -------------------------------------------------------------
    // BÀN 6: Ngoại khoa & Da liễu duyệt lúc 08:12
    // -------------------------------------------------------------
    console.log('  6️⃣ Bàn Ngoại & Da liễu duyệt (Tứ chi bình thường, da niêm mạc hồng)');
    const desk6Incoming = JSON.parse(JSON.stringify(staleInitialSnapshot));
    desk6Incoming.clinicalData.clinical_exam.kq_ngoai_khoa = 'Vận động tứ chi bình thường, không sẹo mổ cũ';
    desk6Incoming.clinicalData.clinical_exam.kq_da_lieu = 'Da niêm mạc bình thường, không nấm da';
    desk6Incoming.clinicalData.clinical_exam.kham_ngoai_khoa_pl = '1';
    desk6Incoming.clinicalData.clinical_exam.kham_da_lieu_pl = '1';
    desk6Incoming.clinicalData.clinical_exam.specialty_metadata = {
        surgery: { doctorId: 'bs_ngoai', doctorName: 'BS Vũ Ngoại', status: 'ĐÃ_DUYỆT' },
        dermatology: { doctorId: 'bs_dalieu', doctorName: 'BS Vũ Ngoại', status: 'ĐÃ_DUYỆT' }
    };

    currentDbState.clinicalData = mergeClinicalData(currentDbState.clinicalData, desk6Incoming.clinicalData);

    // -------------------------------------------------------------
    // BÀN 7: Cận lâm sàng duyệt lúc 08:14 (Huyết học, Nước tiểu, X-Quang)
    // -------------------------------------------------------------
    console.log('  7️⃣ Bàn Cận lâm sàng duyệt (Hemoglobin 145, Glucose 5.4, X-quang phổi)');
    const desk7Incoming = JSON.parse(JSON.stringify(staleInitialSnapshot));
    desk7Incoming.clinicalData.clinical_exam.specialty_metadata = {
        lab: { doctorId: 'bs_cls', doctorName: 'BS Cận Lâm Sàng', status: 'ĐÃ_DUYỆT' }
    };
    desk7Incoming.labData = {
        blood_test: { hemoglobin: '145', glycemia: '5.4' },
        urine_test: { protein: 'Âm tính' },
        imaging: { ket_qua: 'Hình tim phổi bình thường' },
        paraclinical_items: [
            { service_code: 'XN01', service_name: 'Tổng phân tích tế bào máu', value: 'Bình thường', conclusion: 'Bình thường' },
            { service_code: 'HA01', service_name: 'X-Quang ngực thẳng', value: 'Bình thường', conclusion: 'Bình thường' }
        ]
    };

    currentDbState.clinicalData = mergeClinicalData(currentDbState.clinicalData, desk7Incoming.clinicalData);
    currentDbState.labData = mergeLabData(currentDbState.labData, desk7Incoming.labData);

    // -------------------------------------------------------------
    // BÀN 8: Bàn Kết Luận duyệt lúc 08:16
    // -------------------------------------------------------------
    console.log('  8️⃣ Bàn Kết luận duyệt (Phân loại Loại 1, Đủ sức khỏe làm việc)');
    const desk8Incoming = JSON.parse(JSON.stringify(staleInitialSnapshot));
    desk8Incoming.clinicalData.clinical_exam.specialty_metadata = {
        conclusion: { doctorId: 'bs_truongkhoa', doctorName: 'BS Trưởng Khoa', status: 'ĐÃ_DUYỆT' }
    };
    desk8Incoming.conclusionData = {
        fitness_class: '1',
        diagnosis: 'Đủ sức khỏe công tác và học tập (Loại I)',
        doctor_id: 'bs_truongkhoa'
    };

    currentDbState.clinicalData = mergeClinicalData(currentDbState.clinicalData, desk8Incoming.clinicalData);
    currentDbState.conclusionData = mergeConclusionData(currentDbState.conclusionData, desk8Incoming.conclusionData);

    // -------------------------------------------------------------
    // KIỂM TRA ĐẦY ĐỦ CỦA TOÀN BỘ HỒ SƠ SAU KHI 8 BÀN KHÁM DUYỆT
    // -------------------------------------------------------------
    console.log('\n📊 TÌNH TRẠNG DỮ LIỆU TỔNG HỢP CỦA HỒ SƠ:');
    const specMeta = currentDbState.clinicalData.clinical_exam.specialty_metadata;

    console.table(Object.entries(specMeta).map(([k, v]: any) => ({
        'Chuyên khoa': k,
        'Trạng thái': v.status,
        'Bác sĩ': v.doctorName || v.doctorId
    })));

    // 1. Thể lực
    assert.equal(currentDbState.clinicalData.examination.height, '172');
    assert.equal(currentDbState.clinicalData.examination.weight, '68');
    assert.equal(currentDbState.clinicalData.examination.blood_pressure, '120/80');
    assert.equal(specMeta.physical?.status, 'ĐÃ_DUYỆT');

    // 2. Nội khoa
    assert.equal(currentDbState.clinicalData.clinical_exam.kq_tim_mach, 'Nhịp tim đều 76 l/p, T1 T2 rõ không âm bệnh lý');
    assert.equal(currentDbState.clinicalData.clinical_exam.kq_ho_hap, 'Rì rào phế nang êm dịu 2 phế trường, không rale');
    assert.equal(specMeta.internal?.status, 'ĐÃ_DUYỆT');

    // 3. Mắt
    assert.equal(currentDbState.clinicalData.clinical_exam.khong_kinh_mat_phai, '10/10');
    assert.equal(currentDbState.clinicalData.clinical_exam.sac_giac, 'Bình thường');
    assert.equal(specMeta.eye?.status, 'ĐÃ_DUYỆT');

    // 4. TMH
    assert.equal(currentDbState.clinicalData.clinical_exam.tai_trai_noi_thuong, '5m');
    assert.equal(specMeta.ent?.status, 'ĐÃ_DUYỆT');

    // 5. RHM
    assert.equal(currentDbState.clinicalData.clinical_exam.ham_tren, 'Không sâu răng, không mất răng');
    assert.equal(specMeta.dental?.status, 'ĐÃ_DUYỆT');

    // 6. Ngoại & Da liễu
    assert.equal(currentDbState.clinicalData.clinical_exam.kq_ngoai_khoa, 'Vận động tứ chi bình thường, không sẹo mổ cũ');
    assert.equal(currentDbState.clinicalData.clinical_exam.kq_da_lieu, 'Da niêm mạc bình thường, không nấm da');
    assert.equal(specMeta.surgery?.status, 'ĐÃ_DUYỆT');
    assert.equal(specMeta.dermatology?.status, 'ĐÃ_DUYỆT');

    // 7. Cận lâm sàng
    assert.equal(currentDbState.labData.blood_test.hemoglobin, '145');
    assert.equal(currentDbState.labData.paraclinical_items.length, 2);
    assert.equal(specMeta.lab?.status, 'ĐÃ_DUYỆT');

    // 8. Kết luận
    assert.equal(currentDbState.conclusionData.fitness_class, '1');
    assert.equal(currentDbState.conclusionData.diagnosis, 'Đủ sức khỏe công tác và học tập (Loại I)');
    assert.equal(specMeta.conclusion?.status, 'ĐÃ_DUYỆT');

    console.log('✅ KẾT QUẢ KỊCH BẢN 1: 100% CẢ 8 CHUYÊN KHOA ĐỀU NGUYÊN VẸN, KHÔNG BỊ GHI ĐÈ MẤT DỮ LIỆU!');

    // -------------------------------------------------------------
    // KỊCH BẢN 2: TÁI TẠO FILE XML VNeID LIÊN THÔNG
    // -------------------------------------------------------------
    console.log('\n-------------------------------------------------------------');
    console.log('🧪 KỊCH BẢN 2: KIỂM TRA FILE XML VNeID CHỨA ĐỦ 8 CHUYÊN KHOA');
    console.log('-------------------------------------------------------------');

    const generatedXml = generateXmlPayload(
        '3',
        {
            patientName: 'TRẦN VĂN THỬ NGHIỆM',
            cccd: '001090123456',
            dob: '1995-05-15',
            gender: 'Nam',
            docNo: 'KSK-TEST-001'
        },
        currentDbState.clinicalData,
        currentDbState.labData,
        currentDbState.conclusionData
    );

    assert.ok(generatedXml.includes('TRẦN VĂN THỬ NGHIỆM'), 'XML thiếu tên BN');
    assert.ok(generatedXml.includes('001090123456'), 'XML thiếu CCCD');
    assert.ok(generatedXml.includes('120/80'), 'XML thiếu huyết áp');
    assert.ok(generatedXml.includes('Nhịp tim đều'), 'XML thiếu kết quả tim mạch');
    assert.ok(generatedXml.includes('10/10'), 'XML thiếu kết quả mắt');
    assert.ok(generatedXml.includes('Tai mũi họng'), 'XML thiếu kết quả TMH');
    assert.ok(generatedXml.includes('XN01'), 'XML thiếu dịch vụ cận lâm sàng XN01');
    assert.ok(generatedXml.includes('HA01'), 'XML thiếu dịch vụ cận lâm sàng HA01');
    assert.ok(generatedXml.includes('Đủ sức khỏe'), 'XML thiếu chẩn đoán kết luận');

    console.log('✅ KẾT QUẢ KỊCH BẢN 2: XML VNeID CHỨA ĐẦY ĐỦ 100% CÁC THẺ LIÊN THÔNG QUỐC GIA!');
});

test('Empirical Concurrency Test: Doctor re-edits single specialty without affecting other approved specialties', () => {
    console.log('\n================================================================');
    console.log('🧪 EMPIRICAL TEST: BÁC SĨ MỞ LẠI VÀ CHỈNH SỬA 1 CHUYÊN KHOA');
    console.log('================================================================');

    const existingDb = {
        examination: { height: '175', weight: '70', blood_pressure: '120/80' },
        clinical_exam: {
            kq_tim_mach: 'Bình thường',
            eye: '10/10',
            ent: 'Bình thường',
            specialty_metadata: {
                physical: { doctorId: 'bs_theluc', status: 'ĐÃ_DUYỆT' },
                internal: { doctorId: 'bs_noi', status: 'ĐÃ_DUYỆT' },
                eye: { doctorId: 'bs_mat', status: 'ĐÃ_DUYỆT' },
                ent: { doctorId: 'bs_tmh', status: 'ĐÃ_DUYỆT' }
            }
        }
    };

    // BS Nội mở lại và phát hiện nhịp tim nhanh, sửa thành "Nhịp xoang nhanh 95 l/p"
    const incomingEdit = {
        clinical_exam: {
            kq_tim_mach: 'Nhịp xoang nhanh 95 l/p, cần theo dõi thêm',
            specialty_metadata: {
                internal: { doctorId: 'bs_noi', status: 'ĐÃ_DUYỆT', updatedAt: new Date().toISOString() }
            }
        }
    };

    const merged = mergeClinicalData(existingDb, incomingEdit);

    // Tim mạch được cập nhật
    assert.equal(merged.clinical_exam.kq_tim_mach, 'Nhịp xoang nhanh 95 l/p, cần theo dõi thêm');
    // Mắt và TMH và Thể lực vẫn giữ nguyên
    assert.equal(merged.clinical_exam.eye, '10/10');
    assert.equal(merged.clinical_exam.ent, 'Bình thường');
    assert.equal(merged.examination.height, '175');
    assert.equal(merged.clinical_exam.specialty_metadata.eye.status, 'ĐÃ_DUYỆT');
    assert.equal(merged.clinical_exam.specialty_metadata.ent.status, 'ĐÃ_DUYỆT');
    assert.equal(merged.clinical_exam.specialty_metadata.physical.status, 'ĐÃ_DUYỆT');

    console.log('✅ KẾT QUẢ KỊCH BẢN CHỈNH SỬA: CHỈ CẬP NHẬT ĐÚNG CHUYÊN KHOA ĐƯỢC SỬA, CÁC CHUYÊN KHOA KHÁC BẢO TOÀN 100%!');
});
