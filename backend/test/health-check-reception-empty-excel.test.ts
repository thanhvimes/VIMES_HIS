import test from 'node:test';
import assert from 'node:assert/strict';
import { 
    buildSpecialtyMetadata 
} from '../src/services/health-check-classifier.service';

test('Health Check Reception & Import - Empty Excel Fields Verification', async (t) => {

    await t.test('1. Empty clinical and conclusion fields produce CHUA_KHAM for all specialty tabs and conclusion', () => {
        const clinicalData = {
            examination: {
                height: '',
                weight: '',
                bmi: '',
                blood_pressure: '',
                pulse: '',
                physical_summary: '',
                kham_the_luc_pl: ''
            },
            clinical_exam: {
                internal: '',
                external: '',
                eye: '',
                ent: '',
                dental: '',
                dermatology: '',
                gynecology: ''
            }
        };

        const conclusionData = {};

        const specMeta = buildSpecialtyMetadata({
            clinicalData,
            labData: {},
            conclusionData,
            doctorId: 'admin',
            doctorName: 'Bác sĩ Khám',
            hasExam: false,
            hasConclusion: false
        });

        assert.equal(specMeta.internal.status, 'CHUA_KHAM', 'Internal exam must be CHUA_KHAM');
        assert.equal(specMeta.surgery.status, 'CHUA_KHAM', 'Surgery exam must be CHUA_KHAM');
        assert.equal(specMeta.external.status, 'CHUA_KHAM', 'External exam must be CHUA_KHAM');
        assert.equal(specMeta.eye.status, 'CHUA_KHAM', 'Eye exam must be CHUA_KHAM');
        assert.equal(specMeta.ent.status, 'CHUA_KHAM', 'ENT exam must be CHUA_KHAM');
        assert.equal(specMeta.dental.status, 'CHUA_KHAM', 'Dental exam must be CHUA_KHAM');
        assert.equal(specMeta.dermatology.status, 'CHUA_KHAM', 'Dermatology exam must be CHUA_KHAM');
        assert.equal(specMeta.gynecology.status, 'CHUA_KHAM', 'Gynecology exam must be CHUA_KHAM');
        assert.equal(specMeta.physical.status, 'CHUA_KHAM', 'Physical exam must be CHUA_KHAM');
        assert.equal(specMeta.conclusion.status, 'CHUA_KHAM', 'Conclusion tab must be CHUA_KHAM when not concluded');
    });

    await t.test('2. Having vitals only (height/weight/bp) does NOT mark specialties or conclusion as concluded', () => {
        const clinicalData = {
            examination: {
                height: '170',
                weight: '65',
                bmi: '22.49',
                blood_pressure: '120/80',
                pulse: '75',
                physical_summary: '',
                kham_the_luc_pl: ''
            },
            clinical_exam: {
                internal: '',
                external: '',
                eye: '',
                ent: '',
                dental: '',
                dermatology: '',
                gynecology: ''
            }
        };

        const conclusionData = {};

        const specMeta = buildSpecialtyMetadata({
            clinicalData,
            labData: {},
            conclusionData,
            doctorId: 'admin',
            doctorName: 'Bác sĩ Khám',
            hasExam: true,
            hasConclusion: false
        });

        // Physical is examined because vitals are present
        assert.equal(specMeta.physical.status, 'ĐÃ_KHÁM', 'Physical status should be ĐÃ_KHÁM');
        // But clinical specialties must remain CHUA_KHAM
        assert.equal(specMeta.internal.status, 'CHUA_KHAM', 'Internal exam must remain CHUA_KHAM');
        assert.equal(specMeta.surgery.status, 'CHUA_KHAM', 'Surgery exam must remain CHUA_KHAM');
        assert.equal(specMeta.eye.status, 'CHUA_KHAM', 'Eye exam must remain CHUA_KHAM');
        assert.equal(specMeta.ent.status, 'CHUA_KHAM', 'ENT exam must remain CHUA_KHAM');
        assert.equal(specMeta.dental.status, 'CHUA_KHAM', 'Dental exam must remain CHUA_KHAM');
        // AND conclusion must NOT be marked as concluded
        assert.equal(specMeta.conclusion.status, 'CHUA_KHAM', 'Conclusion must be CHUA_KHAM, not ĐÃ_KẾT_LUẬN');
    });

    await t.test('3. Partial examination in Excel (e.g., Eye and Dental only) marks only corresponding tabs as ĐÃ_KHÁM', () => {
        const clinicalData = {
            examination: {
                height: '',
                weight: '',
                bmi: '',
                blood_pressure: '',
                pulse: '',
                physical_summary: '',
                kham_the_luc_pl: ''
            },
            clinical_exam: {
                internal: '',
                external: '',
                eye: '10/10 hai mắt',
                ent: '',
                dental: 'Răng tốt, không sâu',
                dermatology: '',
                gynecology: ''
            }
        };

        const specMeta = buildSpecialtyMetadata({
            clinicalData,
            labData: {},
            conclusionData: {},
            doctorId: 'admin',
            doctorName: 'Bác sĩ Khám',
            hasExam: true,
            hasConclusion: false
        });

        assert.equal(specMeta.eye.status, 'ĐÃ_KHÁM', 'Eye must be ĐÃ_KHÁM');
        assert.equal(specMeta.dental.status, 'ĐÃ_KHÁM', 'Dental must be ĐÃ_KHÁM');
        assert.equal(specMeta.internal.status, 'CHUA_KHAM', 'Internal must remain CHUA_KHAM');
        assert.equal(specMeta.surgery.status, 'CHUA_KHAM', 'Surgery must remain CHUA_KHAM');
        assert.equal(specMeta.ent.status, 'CHUA_KHAM', 'ENT must remain CHUA_KHAM');
        assert.equal(specMeta.dermatology.status, 'CHUA_KHAM', 'Dermatology must remain CHUA_KHAM');
        assert.equal(specMeta.conclusion.status, 'CHUA_KHAM', 'Conclusion must remain CHUA_KHAM');
    });

    await t.test('4. Explicit conclusion imported from Excel properly marks conclusion as ĐÃ_KẾT_LUẬN', () => {
        const clinicalData = {
            examination: {
                height: '165',
                weight: '55',
                bmi: '20.2',
                blood_pressure: '110/70',
                pulse: '72',
                physical_summary: 'Thể lực tốt',
                kham_the_luc_pl: '1'
            },
            clinical_exam: {
                internal: 'Bình thường',
                external: 'Bình thường',
                eye: '10/10',
                ent: 'Bình thường',
                dental: 'Bình thường',
                dermatology: 'Bình thường',
                gynecology: ''
            }
        };

        const conclusionData = {
            fitness_class: '1',
            diagnosis: 'Đủ sức khỏe làm việc',
            doctor_name: 'BS. Kết Luận'
        };

        const specMeta = buildSpecialtyMetadata({
            clinicalData,
            labData: {},
            conclusionData,
            doctorId: 'bs_ketluan',
            doctorName: 'BS. Kết Luận',
            hasExam: true,
            hasConclusion: true
        });

        assert.equal(specMeta.conclusion.status, 'ĐÃ_KẾT_LUẬN', 'Conclusion must be ĐÃ_KẾT_LUẬN when hasConclusion is true');
    });

    await t.test('5. DocumentList status badge logic correctly yields "Chưa khám" for newly received patients without clinical data', () => {
        const doc: any = {
            clinical_data: {
                specialty_metadata: {
                    admin: { status: 'ĐÃ_KHÁM' },
                    history: { status: 'ĐÃ_KHÁM' },
                    physical: { status: 'CHUA_KHAM' },
                    examination: { status: 'CHUA_KHAM' },
                    internal: { status: 'CHUA_KHAM' },
                    eye: { status: 'CHUA_KHAM' },
                    ent: { status: 'CHUA_KHAM' },
                    dental: { status: 'CHUA_KHAM' },
                    surgery: { status: 'CHUA_KHAM' },
                    dermatology: { status: 'CHUA_KHAM' },
                    gynecology: { status: 'CHUA_KHAM' },
                    conclusion: { status: 'CHUA_KHAM' }
                },
                examination: {
                    height: '',
                    weight: '',
                    pulse: '',
                    bp: '',
                    blood_pressure: ''
                }
            },
            conclusion_data: {},
            signature_status: 'Unsigned',
            lab_data: {
                // Paraclinical items ordered from package, but no results entered yet
                paraclinical_items: [
                    { name: 'Tổng phân tích tế bào máu', code: 'HH01', value: '', result: '' },
                    { name: 'X-quang ngực thẳng', code: 'CDHA01', value: '', result: '' }
                ]
            }
        };

        const specMeta = doc.clinical_data?.specialty_metadata || {};
        const hasConcl = !!(
            (doc.conclusion_data?.fitness_class && String(doc.conclusion_data.fitness_class).trim()) ||
            (doc.conclusion_data?.ket_luan_loai_suc_khoe && String(doc.conclusion_data.ket_luan_loai_suc_khoe).trim()) ||
            (doc.conclusion_data?.diagnosis && String(doc.conclusion_data.diagnosis).trim())
        );
        const isConcluded = specMeta.conclusion?.status === 'ĐÃ_KẾT_LUẬN'
            || specMeta.conclusion?.status === 'ĐÃ_DUYỆT'
            || doc.signature_status === 'Signed'
            || (hasConcl && specMeta.conclusion?.status !== 'CHUA_KHAM');

        const clinicalSpecialtyKeys = ['physical', 'examination', 'internal', 'surgery', 'external', 'eye', 'ent', 'dental', 'dermatology', 'gynecology'];
        const hasAnySpecialtyExamined = clinicalSpecialtyKeys.some(k => specMeta[k]?.status === 'ĐÃ_KHÁM' || specMeta[k]?.status === 'ĐÃ_DUYỆT');
        const hasAnySpecialtyExamining = clinicalSpecialtyKeys.some(k => specMeta[k]?.status === 'ĐANG_KHÁM');

        const hasParaclinicalResults = (doc.lab_data?.paraclinical_items || []).some(
            (it: any) => (it.value && String(it.value).trim()) || (it.result && String(it.result).trim()) || it.is_his_value
        ) || !!(doc.lab_data?.blood_test?.hemoglobin || doc.lab_data?.blood_test?.glycemia || doc.lab_data?.urine_test?.protein);

        const isExamined = !isConcluded && (
            hasAnySpecialtyExamined
            || !!doc.clinical_data?.examination?.height
            || !!doc.clinical_data?.examination?.weight
            || !!doc.clinical_data?.examination?.pulse
            || !!doc.clinical_data?.examination?.bp
            || !!doc.clinical_data?.examination?.blood_pressure
            || hasParaclinicalResults
        );

        const isExamining = !isConcluded && !isExamined && hasAnySpecialtyExamining;

        let statusText = 'Chưa khám';
        if (isConcluded) statusText = 'Đã kết luận';
        else if (isExamined) statusText = 'Đã khám';
        else if (isExamining) statusText = 'Đang khám';

        assert.equal(isConcluded, false, 'Patient must not be concluded');
        assert.equal(isExamined, false, 'Patient must not be examined');
        assert.equal(statusText, 'Chưa khám', 'Document status must be "Chưa khám"');
    });
});
