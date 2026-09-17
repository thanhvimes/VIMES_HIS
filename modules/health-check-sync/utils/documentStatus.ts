// ==================== DOCUMENT STATUS HELPERS ====================
// File: modules/health-check-sync/utils/documentStatus.ts

/**
 * Trả về metadata chuyên khoa đã được merge đầy đủ giữa:
 * clinical_data.specialty_metadata và clinical_data.clinical_exam.specialty_metadata
 */
export const getResolvedSpecMeta = (doc: any): Record<string, any> => {
    if (!doc) return {};
    let clinicalData = doc.clinical_data;
    if (typeof clinicalData === 'string') {
        try { clinicalData = JSON.parse(clinicalData); } catch { clinicalData = {}; }
    }
    const raw = clinicalData?.specialty_metadata || {};
    const exam = clinicalData?.clinical_exam?.specialty_metadata || {};
    const merged: Record<string, any> = { ...raw };
    for (const [k, v] of Object.entries(exam)) {
        if (!v || typeof v !== 'object') continue;
        const existing = merged[k];
        if (!existing) {
            merged[k] = { ...v };
        } else {
            const isNewActive = (v as any).status === 'ĐÃ_KHÁM' || (v as any).status === 'ĐÃ_DUYỆT' || (v as any).doctorId || (v as any).doctorName;
            const isExistingActive = existing.status === 'ĐÃ_KHÁM' || existing.status === 'ĐÃ_DUYỆT' || existing.doctorId || existing.doctorName;
            if (isNewActive || !isExistingActive) {
                merged[k] = { ...existing, ...v };
            } else {
                merged[k] = { ...v, ...existing };
            }
        }
    }
    return merged;
};

/**
 * Kiểm tra xem hồ sơ đã hoàn thành kết luận khám hay chưa
 */
export const isDocumentConcluded = (doc: any): boolean => {
    if (!doc) return false;
    if (doc.status === 'ĐÃ_KẾT_LUẬN' || doc.status === 'ĐÃ_DUYỆT') return true;
    if (doc.signature_status === 'Signed') return true;

    const specMeta = getResolvedSpecMeta(doc);
    if (specMeta.conclusion?.status === 'ĐÃ_KẾT_LUẬN' || specMeta.conclusion?.status === 'ĐÃ_DUYỆT') return true;

    let concl = doc.conclusion_data;
    if (typeof concl === 'string') {
        try { concl = JSON.parse(concl); } catch { concl = {}; }
    }
    concl = concl || {};

    if (concl.status === 'ĐÃ_KẾT_LUẬN' || concl.status === 'ĐÃ_DUYỆT') return true;
    if (concl.doctor_signature || concl.signature) return true;

    const hasConclValue = Boolean(
        (concl.fitness_class && String(concl.fitness_class).trim()) ||
        (concl.ket_luan_loai_suc_khoe && String(concl.ket_luan_loai_suc_khoe).trim()) ||
        (concl.diagnosis && String(concl.diagnosis).trim())
    );

    return hasConclValue;
};

/**
 * Lấy trạng thái khám tổng quan của hồ sơ: 'CONCLUDED' | 'EXAMINED' | 'EXAMINING' | 'NOT_EXAMINED'
 */
export const getDocumentExamStatus = (doc: any): { status: 'CONCLUDED' | 'EXAMINED' | 'EXAMINING' | 'NOT_EXAMINED'; label: string; color: string } => {
    if (isDocumentConcluded(doc)) {
        return {
            status: 'CONCLUDED',
            label: 'Đã kết luận',
            color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
        };
    }

    const specMeta = getResolvedSpecMeta(doc);
    const clinicalSpecialtyKeys = ['physical', 'examination', 'internal', 'surgery', 'external', 'eye', 'ent', 'dental', 'dermatology', 'gynecology'];
    const hasAnySpecialtyExamined = clinicalSpecialtyKeys.some(k => specMeta[k]?.status === 'ĐÃ_KHÁM' || specMeta[k]?.status === 'ĐÃ_DUYỆT');
    const hasAnySpecialtyExamining = clinicalSpecialtyKeys.some(k => specMeta[k]?.status === 'ĐANG_KHÁM');

    let labData = doc.lab_data;
    if (typeof labData === 'string') {
        try { labData = JSON.parse(labData); } catch { labData = {}; }
    }
    labData = labData || {};

    let clinicalData = doc.clinical_data;
    if (typeof clinicalData === 'string') {
        try { clinicalData = JSON.parse(clinicalData); } catch { clinicalData = {}; }
    }
    clinicalData = clinicalData || {};

    const hasParaclinicalResults = (labData?.paraclinical_items || []).some(
        (it: any) => (it.value && String(it.value).trim()) || (it.result && String(it.result).trim()) || it.is_his_value
    ) || Boolean(labData?.blood_test?.hemoglobin || labData?.blood_test?.glycemia || labData?.urine_test?.protein);

    const isExamined = hasAnySpecialtyExamined
        || Boolean(clinicalData?.examination?.height)
        || Boolean(clinicalData?.examination?.weight)
        || Boolean(clinicalData?.examination?.pulse)
        || Boolean(clinicalData?.examination?.bp)
        || Boolean(clinicalData?.examination?.blood_pressure)
        || hasParaclinicalResults;

    if (isExamined) {
        return {
            status: 'EXAMINED',
            label: 'Đã khám',
            color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
        };
    }

    if (hasAnySpecialtyExamining) {
        return {
            status: 'EXAMINING',
            label: 'Đang khám',
            color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
        };
    }

    return {
        status: 'NOT_EXAMINED',
        label: 'Chưa khám',
        color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
    };
};
