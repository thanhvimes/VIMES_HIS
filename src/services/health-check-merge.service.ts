/**
 * Health Check Data Merge Service
 * Solves multi-desk concurrency issues when different specialty rooms
 * examine and save results for the same patient record concurrently.
 */

export function isNonEmptyValue(v: any): boolean {
    if (v === null || v === undefined) return false;
    if (typeof v === 'string') return v.trim() !== '';
    if (typeof v === 'number') return !isNaN(v);
    if (typeof v === 'boolean') return true;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'object') return Object.keys(v).length > 0;
    return false;
}

/**
 * Safely format date input (string or Date) to standard 'YYYY-MM-DD' calendar string
 * without timezone shift (prevents day - 1 issue).
 */
export function formatYmdString(val: any): string | null {
    if (!val) return null;
    if (typeof val === 'string') {
        const trimmed = val.trim();
        if (!trimmed) return null;
        // 1. If already 'YYYY-MM-DD'
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
        // 2. If 'DD/MM/YYYY'
        if (/^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(trimmed)) {
            const parts = trimmed.split(/[/-]/);
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
        // 3. If ISO timestamp like '2001-09-01T17:00:00.000Z'
        if (trimmed.includes('T')) {
            const d = new Date(trimmed);
            if (!isNaN(d.getTime())) {
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}`;
            }
        }
        // 4. If standard date string
        const d = new Date(trimmed);
        if (!isNaN(d.getTime())) {
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        }
    }
    if (val instanceof Date && !isNaN(val.getTime())) {
        const yyyy = val.getFullYear();
        const mm = String(val.getMonth() + 1).padStart(2, '0');
        const dd = String(val.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }
    return null;
}

export function mergeSpecialtyMetadata(
    existingMeta: Record<string, any> = {},
    incomingMeta: Record<string, any> = {}
): Record<string, any> {
    const existSafe = existingMeta && typeof existingMeta === 'object' ? existingMeta : {};
    const incomingSafe = incomingMeta && typeof incomingMeta === 'object' ? incomingMeta : {};
    const allKeys = Array.from(new Set([...Object.keys(existSafe), ...Object.keys(incomingSafe)]));
    const merged: Record<string, any> = {};

    for (const key of allKeys) {
        const exist = existSafe[key];
        const incoming = incomingSafe[key];

        if (!exist) {
            merged[key] = incoming;
            continue;
        }
        if (!incoming) {
            merged[key] = exist;
            continue;
        }

        const isExistActive = exist.status === 'ĐÃ_DUYỆT' || exist.status === 'ĐÃ_KHÁM' || exist.status === 'ĐANG_KHÁM' || exist.status === 'ĐÃ_KẾT_LUẬN';
        const isIncomingActive = incoming.status === 'ĐÃ_DUYỆT' || incoming.status === 'ĐÃ_KHÁM' || incoming.status === 'ĐANG_KHÁM' || incoming.status === 'ĐÃ_KẾT_LUẬN';

        if (isIncomingActive) {
            // Incoming is actively modified or approved by this specialty room
            merged[key] = {
                ...exist,
                ...incoming,
                doctorId: incoming.doctorId || exist.doctorId || '',
                doctorName: incoming.doctorName || exist.doctorName || '',
                status: incoming.status,
                updatedAt: incoming.updatedAt || new Date().toISOString()
            };
        } else if (isExistActive) {
            // Incoming is CHUA_KHAM/blank, but existing in DB was already examined or approved by another room -> KEEP existing!
            merged[key] = {
                ...exist,
                doctorId: exist.doctorId || incoming.doctorId || '',
                doctorName: exist.doctorName || incoming.doctorName || '',
                status: exist.status
            };
        } else {
            // Both are CHUA_KHAM or not started
            merged[key] = {
                ...exist,
                ...incoming,
                doctorId: incoming.doctorId || exist.doctorId || '',
                doctorName: incoming.doctorName || exist.doctorName || '',
                status: incoming.status || exist.status || 'CHUA_KHAM'
            };
        }
    }
    return merged;
}

export function mergeObjectFields(
    existingObj: Record<string, any> = {},
    incomingObj: Record<string, any> = {}
): Record<string, any> {
    const existSafe = existingObj && typeof existingObj === 'object' ? existingObj : {};
    const incomingSafe = incomingObj && typeof incomingObj === 'object' ? incomingObj : {};
    const allKeys = Array.from(new Set([...Object.keys(existSafe), ...Object.keys(incomingSafe)]));
    const merged: Record<string, any> = {};

    for (const key of allKeys) {
        const incomingVal = incomingSafe[key];
        const existVal = existSafe[key];

        if (isNonEmptyValue(incomingVal)) {
            merged[key] = incomingVal;
        } else if (isNonEmptyValue(existVal)) {
            merged[key] = existVal;
        } else {
            merged[key] = incomingVal !== undefined ? incomingVal : (existVal !== undefined ? existVal : '');
        }
    }
    return merged;
}

export function mergeClinicalData(
    existingClinical: Record<string, any> = {},
    incomingClinical: Record<string, any> = {}
): Record<string, any> {
    const existSafe = existingClinical && typeof existingClinical === 'object' ? existingClinical : {};
    const incomingSafe = incomingClinical && typeof incomingClinical === 'object' ? incomingClinical : {};

    // 1. Root fields merge
    const merged: Record<string, any> = mergeObjectFields(existSafe, incomingSafe);

    // 2. Examination (physical measurements) merge
    merged.examination = mergeObjectFields(existSafe.examination, incomingSafe.examination);

    // 3. Clinical Exam merge
    const existClinicalExam = existSafe.clinical_exam && typeof existSafe.clinical_exam === 'object' ? existSafe.clinical_exam : {};
    const incomingClinicalExam = incomingSafe.clinical_exam && typeof incomingSafe.clinical_exam === 'object' ? incomingSafe.clinical_exam : {};

    const mergedClinicalExam = mergeObjectFields(existClinicalExam, incomingClinicalExam);
    mergedClinicalExam.specialty_metadata = mergeSpecialtyMetadata(
        existClinicalExam.specialty_metadata,
        incomingClinicalExam.specialty_metadata
    );

    merged.clinical_exam = mergedClinicalExam;

    // 4. Extra (occupational, driver, child, history extra fields) merge
    merged.extra = mergeObjectFields(existSafe.extra, incomingSafe.extra);

    return merged;
}

export function mergeLabData(
    existingLab: Record<string, any> = {},
    incomingLab: Record<string, any> = {}
): Record<string, any> {
    const existSafe = existingLab && typeof existingLab === 'object' ? existingLab : {};
    const incomingSafe = incomingLab && typeof incomingLab === 'object' ? incomingLab : {};

    const merged: Record<string, any> = mergeObjectFields(existSafe, incomingSafe);

    // 1. Paraclinical items array merge
    const existingItems = Array.isArray(existSafe.paraclinical_items) ? existSafe.paraclinical_items : [];
    const incomingItems = Array.isArray(incomingSafe.paraclinical_items) ? incomingSafe.paraclinical_items : [];

    const itemMap = new Map<string, any>();

    // First, populate with existing items
    for (const item of existingItems) {
        if (!item) continue;
        const key = `${item.order_id || ''}_${String(item.service_code || '').trim()}`;
        itemMap.set(key, { ...item });
    }

    // Next, merge incoming items
    for (const item of incomingItems) {
        if (!item) continue;
        const key = `${item.order_id || ''}_${String(item.service_code || '').trim()}`;
        const existingItem = itemMap.get(key);

        if (existingItem) {
            const hasNewValue = isNonEmptyValue(item.value);
            const hasNewConclusion = isNonEmptyValue(item.conclusion);
            const hasNewDescription = isNonEmptyValue(item.description);

            itemMap.set(key, {
                ...existingItem,
                ...item,
                value: hasNewValue ? item.value : (existingItem.value || ''),
                conclusion: hasNewConclusion ? item.conclusion : (existingItem.conclusion || ''),
                description: hasNewDescription ? item.description : (existingItem.description || ''),
                user_edited: item.user_edited !== undefined ? item.user_edited : existingItem.user_edited,
                is_his_value: item.is_his_value !== undefined ? item.is_his_value : existingItem.is_his_value
            });
        } else {
            itemMap.set(key, { ...item });
        }
    }

    merged.paraclinical_items = Array.from(itemMap.values());

    // 2. Sub-objects merge
    merged.blood_test = mergeObjectFields(existSafe.blood_test, incomingSafe.blood_test);
    merged.urine_test = mergeObjectFields(existSafe.urine_test, incomingSafe.urine_test);
    merged.nuoc_tieu_test_nhanh = mergeObjectFields(existSafe.nuoc_tieu_test_nhanh, incomingSafe.nuoc_tieu_test_nhanh);
    merged.imaging = mergeObjectFields(existSafe.imaging, incomingSafe.imaging);
    merged.ecg = mergeObjectFields(existSafe.ecg, incomingSafe.ecg);
    merged.spiro = mergeObjectFields(existSafe.spiro, incomingSafe.spiro);
    merged.us = mergeObjectFields(existSafe.us, incomingSafe.us);

    return merged;
}

export function mergeConclusionData(
    existingConclusion: Record<string, any> = {},
    incomingConclusion: Record<string, any> = {}
): Record<string, any> {
    const existSafe = existingConclusion && typeof existingConclusion === 'object' ? existingConclusion : {};
    const incomingSafe = incomingConclusion && typeof incomingConclusion === 'object' ? incomingConclusion : {};

    return mergeObjectFields(existSafe, incomingSafe);
}
