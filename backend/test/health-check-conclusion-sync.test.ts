import test from 'node:test';
import assert from 'node:assert/strict';
import { 
    mapConclusionRowToClinicalExam, 
    buildSpecialtyMetadata, 
    evaluateFitnessClass 
} from '../src/services/health-check-classifier.service';

test('Health Check Conclusion Sync - Comprehensive Verification', async (t) => {

    await t.test('1. mapConclusionRowToClinicalExam correctly maps all 15 clinical columns from hms_exm_conclusion', () => {
        const conclRow = {
            hecl_docno: 123456,
            hecl_theluc: 'Thể lực tốt',
            hecl_tuanhoan: 'Tim đều T1 T2 rõ',
            hecl_hohap: 'Phổi trong không rale',
            hecl_tieuhoa: 'Bụng mềm không chướng',
            hecl_thantietnieu: 'Chạm thận âm tính',
            hecl_noitiet: 'Tuyến giáp không to',
            hecl_coxuongkhop: 'Vận động khớp tốt',
            hecl_thankinh: 'Không dấu thần kinh khu trú',
            hecl_tamthan: 'Tâm thần bình thường',
            hecl_ngoai: 'Không có sẹo mổ',
            hecl_dalieu: 'Không có tổn thương da',
            hecl_mat: 'MP 10/10, MT 10/10',
            hecl_tmh: 'Tai mũi họng bình thường',
            hecl_rhm: 'Không sâu răng',
            hecl_phukhoa: 'Khám phụ khoa bình thường',
            hecl_phanloai: '1',
            hecl_conclusion: 'Đủ sức khỏe làm việc',
            hecl_remark: 'Khám định kỳ hàng năm'
        };

        const clinExam = mapConclusionRowToClinicalExam(conclRow, {}, conclRow.hecl_phanloai);

        // Internal organs individual keys
        assert.equal(clinExam.kq_tim_mach, 'Tim đều T1 T2 rõ');
        assert.equal(clinExam.noi_khoa_tuan_hoan, 'Tim đều T1 T2 rõ');
        assert.equal(clinExam.kq_ho_hap, 'Phổi trong không rale');
        assert.equal(clinExam.noi_khoa_ho_hap, 'Phổi trong không rale');
        assert.equal(clinExam.noi_khoa_tieu_hoa, 'Bụng mềm không chướng');
        assert.equal(clinExam.kq_tieu_hoa, 'Bụng mềm không chướng');
        assert.equal(clinExam.kq_tiet_nieu, 'Chạm thận âm tính');
        assert.equal(clinExam.noi_khoa_than_tietnieu, 'Chạm thận âm tính');
        assert.equal(clinExam.kq_noi_tiet, 'Tuyến giáp không to');
        assert.equal(clinExam.noi_khoa_noi_tiet, 'Tuyến giáp không to');
        assert.equal(clinExam.kq_co_xuong_khop, 'Vận động khớp tốt');
        assert.equal(clinExam.noi_khoa_co_xuong_khop, 'Vận động khớp tốt');
        assert.equal(clinExam.kq_than_kinh, 'Không dấu thần kinh khu trú');
        assert.equal(clinExam.noi_khoa_than_kinh, 'Không dấu thần kinh khu trú');
        assert.equal(clinExam.kq_tam_than, 'Tâm thần bình thường');
        assert.equal(clinExam.noi_khoa_tam_than, 'Tâm thần bình thường');

        // External / Surgery
        assert.equal(clinExam.kq_ngoai_khoa, 'Không có sẹo mổ');
        assert.equal(clinExam.external, 'Không có sẹo mổ');
        assert.equal(clinExam.surgery, 'Không có sẹo mổ');

        // Dermatology
        assert.equal(clinExam.kq_da_lieu, 'Không có tổn thương da');
        assert.equal(clinExam.dermatology, 'Không có tổn thương da');

        // Eye & Acuity
        assert.equal(clinExam.kq_mat, 'MP 10/10, MT 10/10');
        assert.equal(clinExam.eye, 'MP 10/10, MT 10/10');
        assert.equal(clinExam.khong_kinh_mat_phai, '10/10');
        assert.equal(clinExam.khong_kinh_mat_trai, '10/10');

        // ENT (hecl_tmh)
        assert.equal(clinExam.kq_tai_mui_hong, 'Tai mũi họng bình thường');
        assert.equal(clinExam.ent, 'Tai mũi họng bình thường');
        assert.equal(clinExam.tai_phai_noi_thuong, '5m');

        // Dental (hecl_rhm)
        assert.equal(clinExam.kq_rang_ham_mat, 'Không sâu răng');
        assert.equal(clinExam.dental, 'Không sâu răng');
        assert.equal(clinExam.ham_tren, 'Bình thường');

        // Gynecology (hecl_phukhoa)
        assert.equal(clinExam.kq_sinh_duc, 'Khám phụ khoa bình thường');
        assert.equal(clinExam.gynecology, 'Khám phụ khoa bình thường');

        // Ratings (_pl) must all be '1'
        assert.equal(clinExam.noi_khoa_tuan_hoan_pl, '1');
        assert.equal(clinExam.noi_khoa_ho_hap_pl, '1');
        assert.equal(clinExam.noi_khoa_tieu_hoa_pl, '1');
        assert.equal(clinExam.noi_khoa_than_tietnieu_pl, '1');
        assert.equal(clinExam.noi_khoa_noi_tiet_pl, '1');
        assert.equal(clinExam.noi_khoa_co_xuong_khop_pl, '1');
        assert.equal(clinExam.noi_khoa_than_kinh_pl, '1');
        assert.equal(clinExam.noi_khoa_tam_than_pl, '1');
        assert.equal(clinExam.kham_ngoai_khoa_pl, '1');
        assert.equal(clinExam.kham_da_lieu_pl, '1');
        assert.equal(clinExam.kham_mat_pl, '1');
        assert.equal(clinExam.kham_tai_mui_hong_pl, '1');
        assert.equal(clinExam.kham_rang_ham_mat_pl, '1');
        assert.equal(clinExam.kham_san_phu_khoa_pl, '1');
    });

    await t.test('2. Normalizes raw "1" or "01" entered on HIS to proper clinical text and sets _pl to 1', () => {
        const rawConcl = {
            hecl_docno: 99999,
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
            hecl_phanloai: '1'
        };

        const clinExam = mapConclusionRowToClinicalExam(rawConcl, {}, '1');

        // Must not be the raw digit "1" in clinical text
        assert.ok(clinExam.kq_tim_mach.includes('bình thường') || clinExam.kq_tim_mach.includes('Tim đều'));
        assert.ok(clinExam.kq_ho_hap.includes('bình thường') || clinExam.kq_ho_hap.includes('Phổi'));
        assert.ok(clinExam.noi_khoa_tieu_hoa.includes('bình thường') || clinExam.noi_khoa_tieu_hoa.includes('Bụng mềm'));
        assert.ok(clinExam.kq_tiet_nieu.includes('bình thường') || clinExam.kq_tiet_nieu.includes('thận'));
        assert.ok(clinExam.kq_ngoai_khoa.includes('Bình thường'));
        assert.ok(clinExam.kq_da_lieu.includes('Không phát hiện') || clinExam.kq_da_lieu.includes('Bình thường'));
        assert.ok(clinExam.eye.includes('10/10'));
        assert.ok(clinExam.ent.includes('tai mũi họng') || clinExam.ent.includes('bình thường'));
        assert.ok(clinExam.dental.includes('răng') || clinExam.dental.includes('bình thường'));
        assert.ok(clinExam.gynecology.includes('phụ khoa') || clinExam.gynecology.includes('bình thường'));

        // All _pl must be normalized to '1'
        assert.equal(clinExam.noi_khoa_tuan_hoan_pl, '1');
        assert.equal(clinExam.kham_ngoai_khoa_pl, '1');
        assert.equal(clinExam.kham_mat_pl, '1');
        assert.equal(clinExam.kham_tai_mui_hong_pl, '1');
        assert.equal(clinExam.kham_rang_ham_mat_pl, '1');
        assert.equal(clinExam.kham_san_phu_khoa_pl, '1');
    });

    await t.test('3. buildSpecialtyMetadata sets all specialties with data to ĐÃ_KHÁM and conclusion to ĐÃ_KẾT_LUẬN', () => {
        const conclRow = {
            hecl_tuanhoan: 'Tim đều',
            hecl_hohap: 'Phổi trong',
            hecl_ngoai: 'Bình thường',
            hecl_mat: '10/10',
            hecl_tmh: 'Bình thường',
            hecl_rhm: 'Bình thường',
            hecl_phukhoa: 'Bình thường',
            hecl_dalieu: 'Bình thường',
            hecl_phanloai: '1',
            hecl_conclusion: 'Đủ sức khỏe'
        };

        const clinExam = mapConclusionRowToClinicalExam(conclRow, {}, conclRow.hecl_phanloai);
        const clinicalData = {
            examination: { height: '170', weight: '65', bp: '120/80' },
            clinical_exam: clinExam
        };
        const conclusionData = {
            fitness_class: '1',
            diagnosis: 'Khám sức khỏe'
        };

        const specMeta = buildSpecialtyMetadata({
            clinicalData,
            conclusionData,
            examDoctorId: 'DOC01',
            examDoctorName: 'BS. Test',
            conclDoctorId: 'DOC02',
            conclDoctorName: 'BS. Concl',
            hasExam: true,
            hasConclusion: true
        });

        assert.equal(specMeta.physical.status, 'ĐÃ_KHÁM');
        assert.equal(specMeta.examination.status, 'ĐÃ_KHÁM');
        assert.equal(specMeta.internal.status, 'ĐÃ_KHÁM');
        assert.equal(specMeta.surgery.status, 'ĐÃ_KHÁM');
        assert.equal(specMeta.external.status, 'ĐÃ_KHÁM');
        assert.equal(specMeta.eye.status, 'ĐÃ_KHÁM');
        assert.equal(specMeta.ent.status, 'ĐÃ_KHÁM');
        assert.equal(specMeta.dental.status, 'ĐÃ_KHÁM');
        assert.equal(specMeta.dermatology.status, 'ĐÃ_KHÁM');
        assert.equal(specMeta.gynecology.status, 'ĐÃ_KHÁM');
        assert.equal(specMeta.conclusion.status, 'ĐÃ_KẾT_LUẬN');
    });

    await t.test('4. evaluateFitnessClass correctly extracts conclusion and remarks from hms_exm_conclusion', () => {
        const evalResult = evaluateFitnessClass({
            dob: '1985-05-15',
            gender: 'M',
            bloodPressure: '120/80',
            hisExmPhanLoai: '1',
            hisExmConclusion: 'Sức khỏe loại I - Đủ điều kiện làm việc',
            hisExmRemark: 'Tái khám định kỳ theo quy định',
            formType: '3'
        });

        assert.equal(evalResult.fitnessClass, '1');
        assert.equal(evalResult.fitnessClassName, 'Loại I');
        assert.equal(evalResult.diagnosis, 'Sức khỏe loại I - Đủ điều kiện làm việc');
        assert.equal(evalResult.cacVanDeLuuY, 'Tái khám định kỳ theo quy định');
    });
});
