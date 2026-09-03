/**
 * Health Check Fitness Classification & Conclusion Engine
 * File: backend/src/services/health-check-classifier.service.ts
 * 
 * Chuẩn hóa quy tắc phân loại sức khỏe theo Tiêu chuẩn Bộ Y tế:
 * - Thông tư 32/2023/TT-BYT & Quyết định 1613/BYT-QĐ
 * - Ưu tiên 1: Kết luận phân loại trực tiếp của Bác sĩ HIS (hecl_phanloai, hd_result, hd_conclusion).
 * - Ưu tiên 2: Tự động đánh giá theo Độ tuổi (>60 tuổi -> tối đa Loại III), Huyết áp, BMI và Bệnh lý ICD-10.
 */

export interface FitnessEvaluationParams {
    dob?: string | Date | null;
    gender?: string | null;
    bloodPressure?: string | null;
    systolic?: number | null;
    diastolic?: number | null;
    bmi?: number | null;
    height?: number | null;
    weight?: number | null;
    icd10?: string | null;
    diagnostic?: string | null;
    hisResult?: string | null;          // hd_result từ hms_doc ('1'..'5')
    hisConclusion?: string | null;      // hd_conclusion từ hms_doc
    hisExmPhanLoai?: string | null;     // hecl_phanloai từ hms_exm_conclusion ('Loại 1'..'Loại 5')
    hisExmConclusion?: string | null;   // hecl_conclusion từ hms_exm_conclusion
    hisExmRemark?: string | null;       // hecl_remark từ hms_exm_conclusion
    hisTreatMethod?: string | null;     // hd_treatmethod từ hms_doc
    hisDoctorId?: string | null;
    hisDoctorName?: string | null;
    personalHistory?: string | null;    // hdh_owner từ hms_disease_hist
    formType?: string | null;           // '1', '2', '3', 'driver', '4', '5'
}

export interface FitnessEvaluationResult {
    fitnessClass: string;               // '1' | '2' | '3' | '4' | '5'
    fitnessClassName: string;           // 'Loại I' | 'Loại II' | 'Loại III' | 'Loại IV' | 'Loại V'
    diagnosis: string;
    cacVanDeLuuY: string;
    cacBenhTatNeuCo: string;
    doctorId: string;
    doctorName: string;
    isAutoEvaluated: boolean;
    evaluationReason: string;
}

/**
 * Làm sạch ngày từ HIS, loại bỏ các ngày mặc định rác như 1752-09-14, 0001-01-01, 1900-01-01 hoặc năm <= 1920
 */
export function sanitizeHisDate(d: any): string {
    if (!d) return '';
    const s = String(d).trim();
    if (!s || s === 'null' || s === 'undefined' || s.startsWith('1752') || s.startsWith('0001') || s.startsWith('1900') || s.startsWith('0000')) return '';
    if (s.includes('-')) {
        const parts = s.split('-');
        if (parts.length === 3 && parseInt(parts[0], 10) <= 1920) return '';
    }
    if (s.includes('/')) {
        const parts = s.split('/');
        if (parts.length === 3 && parseInt(parts[2], 10) <= 1920) return '';
    }
    return s;
}

/**
 * Tính số tuổi dựa trên ngày sinh
 */
export function calculateAge(dob: string | Date | null | undefined): number | null {
    if (!dob) return null;
    try {
        const cleaned = sanitizeHisDate(dob);
        if (!cleaned) return null;
        const bDate = typeof dob === 'string' ? new Date(cleaned) : dob;
        if (isNaN(bDate.getTime()) || bDate.getFullYear() <= 1920) return null;

        const today = new Date();
        let age = today.getFullYear() - bDate.getFullYear();
        const mDiff = today.getMonth() - bDate.getMonth();
        if (mDiff < 0 || (mDiff === 0 && today.getDate() < bDate.getDate())) {
            age--;
        }
        return age >= 0 ? age : null;
    } catch {
        return null;
    }
}

/**
 * Phân tích chuỗi phân loại sang mã số chuẩn '1'..'5'
 */
export function parseFitnessClassFromText(text: string | null | undefined): string | null {
    if (!text) return null;
    const str = String(text).trim();

    // 1. Kiểm tra trực tiếp số 1 -> 5 khi toàn bộ chuỗi là 1 chữ số đơn lẻ
    if (['1', '2', '3', '4', '5'].includes(str)) return str;

    // 2. Kiểm tra chuỗi chứa từ khóa "Loại" / "Phân loại"
    const upper = str.toUpperCase();
    if (upper.includes('LOẠI V') || upper.includes('LOAI V') || upper.includes('LOẠI 5') || upper.includes('LOAI 5')) return '5';
    if (upper.includes('LOẠI IV') || upper.includes('LOAI IV') || upper.includes('LOẠI 4') || upper.includes('LOAI 4')) return '4';
    if (upper.includes('LOẠI III') || upper.includes('LOAI III') || upper.includes('LOẠI 3') || upper.includes('LOAI 3')) return '3';
    if (upper.includes('LOẠI II') || upper.includes('LOAI II') || upper.includes('LOẠI 2') || upper.includes('LOAI 2')) return '2';
    if (upper.includes('LOẠI I') || upper.includes('LOAI I') || upper.includes('LOẠI 1') || upper.includes('LOAI 1')) return '1';

    // 3. Regex kiểm tra có từ khóa phân loại đứng trước số (tránh nhầm lẫn với mã ICD như E11, I10)
    const match = str.match(/(?:loại|loai|phân\s*loại|phan\s*loai|loại\s*sk|pl)\s*[:=\s-]*([1-5])/i);
    if (match) return match[1];

    return null;
}

/**
 * Trích xuất chỉ số Huyết áp Tâm thu và Tâm trương từ chuỗi '120/80' hoặc 2 tham số riêng
 */
export function parseBloodPressure(bpStr?: string | null): { systolic: number | null; diastolic: number | null } {
    if (!bpStr) return { systolic: null, diastolic: null };
    const parts = String(bpStr).split(/[/_\s-]+/);
    if (parts.length >= 2) {
        const sys = parseInt(parts[0], 10);
        const dia = parseInt(parts[1], 10);
        return {
            systolic: !isNaN(sys) && sys > 0 ? sys : null,
            diastolic: !isNaN(dia) && dia > 0 ? dia : null
        };
    } else if (parts.length === 1) {
        const sys = parseInt(parts[0], 10);
        return {
            systolic: !isNaN(sys) && sys > 0 ? sys : null,
            diastolic: null
        };
    }
    return { systolic: null, diastolic: null };
}

/**
 * Tự động đánh giá và chuẩn hóa Phân loại sức khỏe & Chẩn đoán từ dữ liệu HIS
 */
export function evaluateFitnessClass(params: FitnessEvaluationParams): FitnessEvaluationResult {
    let resolvedClass = '1';
    let isAutoEvaluated = false;
    let evaluationReason = 'Bình thường';

    // ── MỨC ƯU TIÊN 1: Lấy phân loại trực tiếp của Bác sĩ HIS ──
    const explicitClassFromExm = parseFitnessClassFromText(params.hisExmPhanLoai);
    const explicitClassFromDoc = parseFitnessClassFromText(params.hisResult);
    const explicitClassFromDocConcl = parseFitnessClassFromText(params.hisConclusion);
    const explicitClassFromDiagnostic = parseFitnessClassFromText(params.diagnostic);

    if (explicitClassFromExm) {
        resolvedClass = explicitClassFromExm;
        evaluationReason = `Kết luận phân loại trực tiếp từ HIS (hecl_phanloai = ${params.hisExmPhanLoai})`;
    } else if (explicitClassFromDoc) {
        resolvedClass = explicitClassFromDoc;
        evaluationReason = `Kết luận phân loại trực tiếp từ HIS (hd_result = ${params.hisResult})`;
    } else if (explicitClassFromDocConcl) {
        resolvedClass = explicitClassFromDocConcl;
        evaluationReason = `Trích xuất phân loại từ kết luận bác sĩ (${params.hisConclusion})`;
    } else if (explicitClassFromDiagnostic) {
        resolvedClass = explicitClassFromDiagnostic;
        evaluationReason = `Trích xuất phân loại từ chẩn đoán (${params.diagnostic})`;
    } else {
        // ── MỨC ƯU TIÊN 2: Đánh giá tự động theo Tiêu chuẩn Bộ Y tế & Quy định đợt KSK ──
        isAutoEvaluated = true;
        const reasons: string[] = [];
        const age = calculateAge(params.dob);

        // Quy tắc phân loại độ tuổi: >= 60 tuổi xếp Loại III, < 60 tuổi xếp Loại II
        let candidateClass = (age !== null && age >= 60) ? 3 : 2;
        if (age !== null && age >= 60) {
            reasons.push(`Người cao tuổi (${age} tuổi >= 60: xếp Loại III)`);
        } else if (age !== null) {
            reasons.push(`Độ tuổi lao động (${age} tuổi < 60: xếp Loại II)`);
        }

        // 2. Đánh giá theo Huyết áp
        const { systolic, diastolic } = parseBloodPressure(params.bloodPressure);
        const sysVal = params.systolic || systolic;
        const diaVal = params.diastolic || diastolic;

        if (sysVal !== null && sysVal !== undefined) {
            if (sysVal >= 160 || (diaVal !== null && diaVal >= 100)) {
                candidateClass = Math.max(candidateClass, 4);
                reasons.push(`Huyết áp cao độ 2/3 (${sysVal}/${diaVal || 0} mmHg: xếp Loại IV)`);
            } else if (sysVal >= 140 || (diaVal !== null && diaVal >= 90)) {
                candidateClass = Math.max(candidateClass, 3);
                reasons.push(`Huyết áp tăng nhẹ/độ 1 (${sysVal}/${diaVal || 0} mmHg: xếp Loại III)`);
            }
        }

        // 3. Đánh giá theo BMI / Thể lực
        let bmiVal = params.bmi;
        if (!bmiVal && params.height && params.weight && params.height > 0 && params.weight > 0) {
            const hM = params.height / 100;
            bmiVal = params.weight / (hM * hM);
        }

        if (bmiVal !== null && bmiVal !== undefined && bmiVal > 0) {
            if (bmiVal >= 30 || bmiVal < 16) {
                candidateClass = Math.max(candidateClass, 4);
                reasons.push(`BMI bất thường (${bmiVal.toFixed(1)}: béo phì độ II/suy kiệt -> xếp Loại IV)`);
            } else if (bmiVal >= 25 || bmiVal < 18.5) {
                candidateClass = Math.max(candidateClass, 2);
                reasons.push(`BMI lệch chuẩn (${bmiVal.toFixed(1)}: thừa cân/gầy nhẹ -> xếp Loại II)`);
            }
        }

        // 4. Đánh giá theo Bệnh lý mạn tính (ICD-10)
        const icdCode = (params.icd10 || '').toUpperCase().trim();
        const diagText = (params.diagnostic || params.hisConclusion || '').toLowerCase();

        if (icdCode.startsWith('E10') || icdCode.startsWith('E11') || icdCode.startsWith('E14') || diagText.includes('đái tháo đường') || diagText.includes('tiểu đường')) {
            candidateClass = Math.max(candidateClass, 3);
            reasons.push(`Bệnh đái tháo đường (${icdCode || 'E11'}: xếp Loại III/IV)`);
        } else if (icdCode.startsWith('I10') || icdCode.startsWith('I15') || diagText.includes('tăng huyết áp')) {
            candidateClass = Math.max(candidateClass, 3);
            reasons.push(`Bệnh lý tăng huyết áp (${icdCode || 'I10'}: xếp Loại III)`);
        } else if (icdCode.startsWith('J45') || diagText.includes('hen phế quản')) {
            candidateClass = Math.max(candidateClass, 3);
            reasons.push(`Bệnh hen phế quản (${icdCode || 'J45'}: xếp Loại III)`);
        } else if (icdCode && !icdCode.startsWith('Z00') && !icdCode.startsWith('Z01') && !icdCode.startsWith('Z02')) {
            candidateClass = Math.max(candidateClass, 2);
            reasons.push(`Có chẩn đoán bệnh thực thể (${icdCode})`);
        }

        resolvedClass = String(Math.min(candidateClass, 5));
        evaluationReason = reasons.length > 0 ? reasons.join('; ') : 'Thể lực & sinh hiệu bình thường';
    }

    // ── XÁC ĐỊNH CHẨN ĐOÁN (DIAGNOSIS) & LỜI DẶN (CAC_VAN_DE_LUU_Y) ──
    // Ưu tiên lấy đúng chẩn đoán ICD-10 từ HIS
    let defaultDiagnosis = '';
    if (params.diagnostic && String(params.diagnostic).trim()) {
        defaultDiagnosis = String(params.diagnostic).trim().replace(/^-\s*/, '');
    } else if (params.icd10 && String(params.icd10).trim()) {
        const cleanIcd = String(params.icd10).trim();
        defaultDiagnosis = `[${cleanIcd}] Khám sức khỏe`;
    } else if (params.hisConclusion && String(params.hisConclusion).trim()) {
        defaultDiagnosis = String(params.hisConclusion).trim().replace(/^-\s*/, '');
    } else {
        defaultDiagnosis = '[Z00.0] Khám sức khỏe tổng quát';
    }

    let cleanRemark = (params.hisExmRemark || params.hisTreatMethod || '').trim();
    if (!cleanRemark) {
        if (resolvedClass === '1') cleanRemark = 'Đủ sức khỏe làm việc';
        else if (resolvedClass === '2') cleanRemark = 'Đủ sức khỏe làm việc - Khám định kỳ';
        else if (resolvedClass === '3') cleanRemark = (calculateAge(params.dob) || 0) >= 60 
            ? 'Đủ sức khỏe làm việc (Lao động cao tuổi) - Theo dõi định kỳ' 
            : 'Đủ sức khỏe làm việc - Hạn chế lao động nặng';
        else if (resolvedClass === '4') cleanRemark = 'Cần điều trị chuyên khoa và bố trí công việc phù hợp';
        else cleanRemark = 'Không đủ điều kiện sức khỏe làm việc nặng';
    }

    const docId = params.hisDoctorId || '';
    const docName = params.hisDoctorName || 'BS. Nguyễn Văn A';
    const diseasesIfAny = (params.personalHistory || (params.icd10 && !params.icd10.startsWith('Z00') ? defaultDiagnosis : '')).trim();

    const classNames: Record<string, string> = {
        '1': 'Loại I',
        '2': 'Loại II',
        '3': 'Loại III',
        '4': 'Loại IV',
        '5': 'Loại V'
    };

    return {
        fitnessClass: resolvedClass,
        fitnessClassName: classNames[resolvedClass] || `Loại ${resolvedClass}`,
        diagnosis: defaultDiagnosis,
        cacVanDeLuuY: cleanRemark,
        cacBenhTatNeuCo: diseasesIfAny,
        doctorId: docId,
        doctorName: docName,
        isAutoEvaluated,
        evaluationReason
    };
}

/**
 * Tự động đồng bộ cấu trúc trạng thái chuyên khoa (specialty_metadata)
 * Đồng bộ các trạng thái: ĐÃ_KHÁM, ĐÃ_KẾT_LUẬN, ĐANG_KHÁM, CHUA_KHAM
 */
export function buildSpecialtyMetadata(params: {
    clinicalData?: any;
    labData?: any;
    conclusionData?: any;
    doctorId?: string;
    doctorName?: string;
    examDoctorId?: string;
    examDoctorName?: string;
    conclDoctorId?: string;
    conclDoctorName?: string;
    hasExam?: boolean;
    hasConclusion?: boolean;
}) {
    const clin = params.clinicalData || {};
    const lab = params.labData || {};
    const concl = params.conclusionData || {};
    const exam = clin.examination || {};
    const clinExam = clin.clinical_exam || {};

    const nowIso = new Date().toISOString();
    
    // Bác sĩ kết luận (ưu tiên conclDoctorId, sau đó tới conclusionData, doctorId)
    const conclDocId = params.conclDoctorId || concl.doctor_id || params.doctorId || params.examDoctorId || '';
    const conclDocName = params.conclDoctorName || concl.doctor_name || params.doctorName || params.examDoctorName || '';

    // Bác sĩ khám (ưu tiên examDoctorId, sau đó tới clinical_data.extra, doctorId, conclDoctorId)
    const examDocId = params.examDoctorId || clin.extra?.doctor_id || params.doctorId || conclDocId || '';
    const examDocName = params.examDoctorName || clin.extra?.doctor_name || params.doctorName || conclDocName || '';

    const hasVitals = !!(exam.height || exam.weight || exam.pulse || exam.bp || exam.blood_pressure || exam.temperature || exam.bmi);
    
    // Kiểm tra thực sự có khám nội khoa hay chưa (không tính text ghi chú chung he_parts)
    const hasInternal = !!(
        clinExam.kq_tim_mach || 
        clinExam.kq_ho_hap || 
        clinExam.noi_khoa_tieu_hoa || 
        clinExam.noi_khoa_tuan_hoan_pl || 
        clinExam.noi_khoa_ho_hap_pl || 
        clinExam.noi_khoa_tieu_hoa_pl || 
        clinExam.noi_khoa_than_tietnieu_pl || 
        clinExam.noi_khoa_than_kinh_pl || 
        clinExam.noi_khoa_tam_than_pl ||
        clinExam.nhi_tuan_hoan ||
        clinExam.nhi_ho_hap ||
        clinExam.nhi_tieu_hoa
    );

    const hasEye = !!(clinExam.eye || clinExam.kham_mat_pl || clinExam.kham_mat_m5);
    const hasEnt = !!(clinExam.ent || clinExam.kham_tai_mui_hong_pl || clinExam.kham_tai_mui_hong_m5);
    const hasDental = !!(clinExam.dental || clinExam.kham_rang_ham_mat_pl);
    const hasExternal = !!(clinExam.external || clinExam.kham_ngoai_khoa_pl || clinExam.kq_ngoai_khoa);
    const hasDerm = !!(clinExam.dermatology || clinExam.kham_da_lieu_pl || clinExam.kq_da_lieu);
    const hasGyn = !!(clinExam.gynecology || clinExam.kham_san_phu_khoa || clinExam.kq_sinh_duc);
    const hasLab = !!(lab.blood_test?.hemoglobin || lab.blood_test?.glycemia || lab.urine_test?.protein || (lab.paraclinical_items && lab.paraclinical_items.length > 0));
    const isConcluded = !!(params.hasConclusion || concl.fitness_class || concl.diagnosis || concl.ket_luan_loai_suc_khoe);

    const vitalsStatus = hasVitals ? 'ĐÃ_KHÁM' : 'CHUA_KHAM';

    return {
        admin: { status: 'ĐÃ_KHÁM', doctorId: examDocId, doctorName: examDocName, updatedAt: nowIso },
        history: { status: 'ĐÃ_KHÁM', doctorId: examDocId, doctorName: examDocName, updatedAt: nowIso },
        physical: { 
            status: vitalsStatus, 
            doctorId: examDocId, 
            doctorName: examDocName, 
            updatedAt: nowIso 
        },
        examination: { 
            status: vitalsStatus, 
            doctorId: examDocId, 
            doctorName: examDocName, 
            updatedAt: nowIso 
        },
        internal: { status: hasInternal ? 'ĐÃ_KHÁM' : 'CHUA_KHAM', doctorId: examDocId, doctorName: examDocName, updatedAt: nowIso },
        eye: { status: hasEye ? 'ĐÃ_KHÁM' : 'CHUA_KHAM', doctorId: examDocId, doctorName: examDocName, updatedAt: nowIso },
        ent: { status: hasEnt ? 'ĐÃ_KHÁM' : 'CHUA_KHAM', doctorId: examDocId, doctorName: examDocName, updatedAt: nowIso },
        dental: { status: hasDental ? 'ĐÃ_KHÁM' : 'CHUA_KHAM', doctorId: examDocId, doctorName: examDocName, updatedAt: nowIso },
        external: { status: hasExternal ? 'ĐÃ_KHÁM' : 'CHUA_KHAM', doctorId: examDocId, doctorName: examDocName, updatedAt: nowIso },
        dermatology: { status: hasDerm ? 'ĐÃ_KHÁM' : 'CHUA_KHAM', doctorId: examDocId, doctorName: examDocName, updatedAt: nowIso },
        gynecology: { status: hasGyn ? 'ĐÃ_KHÁM' : 'CHUA_KHAM', doctorId: examDocId, doctorName: examDocName, updatedAt: nowIso },
        lab: { status: hasLab ? 'ĐÃ_KHÁM' : 'CHUA_KHAM', doctorId: examDocId, doctorName: examDocName, updatedAt: nowIso },
        conclusion: { 
            status: isConcluded ? 'ĐÃ_KẾT_LUẬN' : (hasVitals || hasInternal ? 'ĐANG_KHÁM' : 'CHUA_KHAM'), 
            doctorId: conclDocId, 
            doctorName: conclDocName, 
            updatedAt: nowIso 
        }
    };
}
