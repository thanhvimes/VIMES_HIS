import test from 'node:test';
import assert from 'node:assert/strict';
import {
    mergeClinicalData,
    mergeLabData,
    mergeConclusionData,
    mergeSpecialtyMetadata
} from '../src/services/health-check-merge.service';

test('mergeSpecialtyMetadata preserves previously approved specialties when incoming specialty is CHUA_KHAM', () => {
    const existingMeta = {
        internal: { doctorId: 'bs_noi', doctorName: 'BS Nội', status: 'ĐÃ_DUYỆT', updatedAt: '2026-08-22T08:00:00.000Z' },
        eye: { doctorId: '', doctorName: '', status: 'CHUA_KHAM' }
    };

    // Incoming payload from Eye desk (where internal is still default CHUA_KHAM)
    const incomingMeta = {
        internal: { doctorId: '', doctorName: '', status: 'CHUA_KHAM' },
        eye: { doctorId: 'bs_mat', doctorName: 'BS Mắt', status: 'ĐÃ_DUYỆT', updatedAt: '2026-08-22T08:05:00.000Z' }
    };

    const merged = mergeSpecialtyMetadata(existingMeta, incomingMeta);

    // Both Internal and Eye must be ĐÃ_DUYỆT
    assert.equal(merged.internal.status, 'ĐÃ_DUYỆT');
    assert.equal(merged.internal.doctorId, 'bs_noi');
    assert.equal(merged.eye.status, 'ĐÃ_DUYỆT');
    assert.equal(merged.eye.doctorId, 'bs_mat');
});

test('mergeClinicalData preserves internal medicine exam data when eye desk submits empty internal fields', () => {
    const existingClinical = {
        address: '123 Đường ABC',
        examination: {
            height: '170',
            weight: '65',
            blood_pressure: '120/80',
            pulse: '75'
        },
        clinical_exam: {
            specialty_metadata: {
                internal: { doctorId: 'bs_noi', status: 'ĐÃ_DUYỆT' }
            },
            kq_tim_mach: 'Tiếng tim đều, rõ',
            kq_ho_hap: 'Rì rào phế nang êm dịu',
            noi_khoa_tuan_hoan_pl: '1',
            noi_khoa_ho_hap_pl: '1',
            eye: '',
            khong_kinh_mat_phai: ''
        }
    };

    // Eye desk submits: eye is filled, but internal fields are empty strings in Eye desk memory
    const incomingClinical = {
        address: '123 Đường ABC',
        examination: {
            height: '170',
            weight: '65',
            blood_pressure: '',
            pulse: ''
        },
        clinical_exam: {
            specialty_metadata: {
                internal: { doctorId: '', status: 'CHUA_KHAM' },
                eye: { doctorId: 'bs_mat', status: 'ĐÃ_DUYỆT' }
            },
            kq_tim_mach: '',
            kq_ho_hap: '',
            noi_khoa_tuan_hoan_pl: '',
            noi_khoa_ho_hap_pl: '',
            eye: 'Thị lực 10/10 hai mắt',
            khong_kinh_mat_phai: '10/10',
            khong_kinh_mat_trai: '10/10',
            kham_mat_pl: '1'
        }
    };

    const merged = mergeClinicalData(existingClinical, incomingClinical);

    // Check that internal data from room 1 is preserved
    assert.equal(merged.clinical_exam.kq_tim_mach, 'Tiếng tim đều, rõ');
    assert.equal(merged.clinical_exam.kq_ho_hap, 'Rì rào phế nang êm dịu');
    assert.equal(merged.clinical_exam.noi_khoa_tuan_hoan_pl, '1');
    assert.equal(merged.clinical_exam.specialty_metadata.internal.status, 'ĐÃ_DUYỆT');

    // Check that eye data from room 2 is saved
    assert.equal(merged.clinical_exam.eye, 'Thị lực 10/10 hai mắt');
    assert.equal(merged.clinical_exam.khong_kinh_mat_phai, '10/10');
    assert.equal(merged.clinical_exam.specialty_metadata.eye.status, 'ĐÃ_DUYỆT');

    // Check physical measurements are preserved
    assert.equal(merged.examination.blood_pressure, '120/80');
    assert.equal(merged.examination.pulse, '75');
});

test('mergeLabData preserves test results and merges paraclinical items by service_code', () => {
    const existingLab = {
        blood_test: { hemoglobin: '140', glycemia: '5.2' },
        paraclinical_items: [
            { service_code: 'XN01', service_name: 'Tổng phân tích tế bào máu', value: 'Bình thường', conclusion: 'Bình thường' },
            { service_code: 'HA01', service_name: 'X-Quang tim phổi', value: '', conclusion: '' }
        ]
    };

    const incomingLab = {
        blood_test: { hemoglobin: '', glycemia: '' },
        paraclinical_items: [
            { service_code: 'XN01', service_name: 'Tổng phân tích tế bào máu', value: '', conclusion: '' },
            { service_code: 'HA01', service_name: 'X-Quang tim phổi', value: 'Hình tim phổi bình thường', conclusion: 'Bình thường' }
        ]
    };

    const merged = mergeLabData(existingLab, incomingLab);

    assert.equal(merged.blood_test.hemoglobin, '140');
    assert.equal(merged.blood_test.glycemia, '5.2');

    const xnItem = merged.paraclinical_items.find((i: any) => i.service_code === 'XN01');
    const haItem = merged.paraclinical_items.find((i: any) => i.service_code === 'HA01');

    assert.equal(xnItem?.value, 'Bình thường');
    assert.equal(haItem?.value, 'Hình tim phổi bình thường');
});

test('mergeConclusionData merges and preserves conclusion details', () => {
    const existingConclusion = {
        fitness_class: '1',
        diagnosis: 'Sức khỏe loại I',
        doctor_id: 'bs_truongkhoa'
    };

    const incomingConclusion = {
        fitness_class: '',
        diagnosis: ''
    };

    const merged = mergeConclusionData(existingConclusion, incomingConclusion);
    assert.equal(merged.fitness_class, '1');
    assert.equal(merged.diagnosis, 'Sức khỏe loại I');
    assert.equal(merged.doctor_id, 'bs_truongkhoa');
});
