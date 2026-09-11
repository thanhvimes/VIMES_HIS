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
 * Làm sạch chuỗi kết luận: loại bỏ ngắt dòng \r\n, gạch đầu dòng, khoảng trắng thừa
 */
export function cleanConclusionText(text: any): string {
    if (!text) return '';
    return String(text)
        .replace(/[\r\n\t]+/g, ' ')
        .replace(/^[\s\-–—:]+/, '')
        .trim();
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
    const explicitClassFromExmConcl = parseFitnessClassFromText(params.hisExmConclusion);

    if (explicitClassFromExm) {
        resolvedClass = explicitClassFromExm;
        evaluationReason = `Kết luận phân loại trực tiếp từ HIS (hecl_phanloai = ${params.hisExmPhanLoai})`;
    } else if (explicitClassFromDoc) {
        resolvedClass = explicitClassFromDoc;
        evaluationReason = `Kết luận phân loại trực tiếp từ HIS (hd_result = ${params.hisResult})`;
    } else if (explicitClassFromDocConcl) {
        resolvedClass = explicitClassFromDocConcl;
        evaluationReason = `Trích xuất phân loại từ kết luận bác sĩ (${params.hisConclusion})`;
    } else if (explicitClassFromExmConcl) {
        resolvedClass = explicitClassFromExmConcl;
        evaluationReason = `Trích xuất phân loại từ kết luận KSK (${params.hisExmConclusion})`;
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
    // Ưu tiên chuẩn hóa:
    // 1. hecl_conclusion từ hms_exm_conclusion (Kết luận KSK chi tiết)
    // 2. hd_conclusion từ hms_doc (Kết luận chính thức của Bác sĩ đợt khám trên HIS)
    // 3. he_diagnostic / hd_diagnostic từ hms_exam / hms_doc (Chẩn đoán lâm sàng)
    // 4. icd10 từ hms_exam / hms_doc
    // 5. Chuỗi mặc định [Z00.0] Khám sức khỏe tổng quát
    const cleanExmConcl = cleanConclusionText(params.hisExmConclusion);
    const cleanDocConcl = cleanConclusionText(params.hisConclusion);
    const cleanDiag = cleanConclusionText(params.diagnostic);

    const isGenericDefault = (text: string) => {
        if (!text) return true;
        const s = text.toLowerCase().replace(/[\s\[\]\.\-_:]/g, '');
        return s === 'z000' || s === 'z000khamsuckhoetongquat' || s === 'khamsuckhoetongquat' || s === 'z000khamsuckhoe' || s === 'khamsuckhoe';
    };

    let defaultDiagnosis = '';
    if (cleanExmConcl && !isGenericDefault(cleanExmConcl)) {
        defaultDiagnosis = cleanExmConcl;
    } else if (cleanDocConcl && !isGenericDefault(cleanDocConcl)) {
        defaultDiagnosis = cleanDocConcl;
    } else if (cleanDiag && !isGenericDefault(cleanDiag)) {
        defaultDiagnosis = cleanDiag;
    } else if (cleanExmConcl) {
        defaultDiagnosis = cleanExmConcl;
    } else if (cleanDocConcl) {
        defaultDiagnosis = cleanDocConcl;
    } else if (cleanDiag) {
        defaultDiagnosis = cleanDiag;
    } else if (params.icd10 && String(params.icd10).trim()) {
        const cleanIcd = String(params.icd10).trim();
        defaultDiagnosis = `[${cleanIcd}] Khám sức khỏe`;
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
    
    // Kiểm tra thực sự có khám nội khoa hay chưa
    const hasInternal = !!(
        clinExam.internal ||
        clinExam.noi_khoa ||
        clinExam.circulatory ||
        clinExam.respiratory ||
        clinExam.digestive ||
        clinExam.kq_tim_mach || 
        clinExam.kq_ho_hap || 
        clinExam.tim_mach ||
        clinExam.ho_hap ||
        clinExam.noi_khoa_tieu_hoa || 
        clinExam.kq_tieu_hoa ||
        clinExam.kq_tiet_nieu ||
        clinExam.noi_khoa_than_tietnieu ||
        clinExam.kq_noi_tiet ||
        clinExam.kq_noi_tiet_chuyen_hoa ||
        clinExam.noi_khoa_noi_tiet ||
        clinExam.kq_co_xuong_khop ||
        clinExam.noi_khoa_co_xuong_khop ||
        clinExam.kq_than_kinh ||
        clinExam.noi_khoa_than_kinh ||
        clinExam.kq_tam_than ||
        clinExam.noi_khoa_tam_than ||
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

    const hasEye = !!(clinExam.eye || clinExam.kq_mat || clinExam.kham_mat || clinExam.kham_mat_pl || clinExam.kham_mat_m5 || clinExam.benh_khac_mat || clinExam.khong_kinh_mat_phai || clinExam.khong_kinh_mat_trai);
    const hasEnt = !!(clinExam.ent || clinExam.kq_tai_mui_hong || clinExam.kham_tai_mui_hong || clinExam.kham_tai_mui_hong_pl || clinExam.kham_tai_mui_hong_m5 || clinExam.benh_tai_mui_hong);
    const hasDental = !!(clinExam.dental || clinExam.kq_rang_ham_mat || clinExam.kham_rang_ham_mat || clinExam.kham_rang_ham_mat_pl || clinExam.benh_rang_ham_mat || clinExam.ham_tren || clinExam.ham_duoi);
    const hasExternal = !!(clinExam.surgery || clinExam.external || clinExam.ngoai_khoa || clinExam.kq_ngoai_khoa || clinExam.kham_ngoai_khoa_pl);
    const hasDerm = !!(clinExam.dermatology || clinExam.da_lieu || clinExam.kq_da_lieu || clinExam.kham_da_lieu_pl);
    const hasGyn = !!(clinExam.gynecology || clinExam.kham_san_phu_khoa || clinExam.kq_sinh_duc || clinExam.kham_san_phu_khoa_pl);
    const hasLab = !!(lab.blood_test?.hemoglobin || lab.blood_test?.glycemia || lab.urine_test?.protein || (lab.paraclinical_items && lab.paraclinical_items.length > 0));
    const hasConclData = !!(
        (concl.fitness_class && String(concl.fitness_class).trim()) ||
        (concl.ket_luan_loai_suc_khoe && String(concl.ket_luan_loai_suc_khoe).trim()) ||
        (concl.diagnosis && String(concl.diagnosis).trim())
    );
    const isConcluded = params.hasConclusion === false ? false : (params.hasConclusion === true ? true : hasConclData);

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
        surgery: { status: hasExternal ? 'ĐÃ_KHÁM' : 'CHUA_KHAM', doctorId: examDocId, doctorName: examDocName, updatedAt: nowIso },
        external: { status: hasExternal ? 'ĐÃ_KHÁM' : 'CHUA_KHAM', doctorId: examDocId, doctorName: examDocName, updatedAt: nowIso },
        dermatology: { status: hasDerm ? 'ĐÃ_KHÁM' : 'CHUA_KHAM', doctorId: examDocId, doctorName: examDocName, updatedAt: nowIso },
        gynecology: { status: hasGyn ? 'ĐÃ_KHÁM' : 'CHUA_KHAM', doctorId: examDocId, doctorName: examDocName, updatedAt: nowIso },
        lab: { status: hasLab ? 'ĐÃ_KHÁM' : 'CHUA_KHAM', doctorId: examDocId, doctorName: examDocName, updatedAt: nowIso },
        conclusion: { 
            status: isConcluded ? 'ĐÃ_KẾT_LUẬN' : 'CHUA_KHAM', 
            doctorId: conclDocId, 
            doctorName: conclDocName, 
            updatedAt: nowIso 
        }
    };
}

export interface ParsedHisParts {
    isSpecialtyMerged: boolean;
    cleanInternalText: string;
    internal?: string;
    external?: string;
    eye?: string;
    ent?: string;
    dental?: string;
    dermatology?: string;
    gynecology?: string;
    neurology?: string;
    psychiatry?: string;
}

/**
 * Phân tích và bóc tách chuỗi tóm tắt các chuyên khoa từ he_parts trên HIS Core.
 * Nếu chuỗi chứa các tiền tố chuyên khoa (Ngoại khoa:, Mắt:, TMH:, RHM:, Da liễu:, Sản phụ khoa:...),
 * hàm sẽ bóc tách chính xác từng chuyên khoa tương ứng, đồng thời loại bỏ triệt để các chuyên khoa
 * ngoại lai khỏi nội khoa (cleanInternalText).
 */
export function parseHisPartsSummary(partsText?: string | null): ParsedHisParts {
    if (!partsText || typeof partsText !== 'string' || !partsText.trim()) {
        return { isSpecialtyMerged: false, cleanInternalText: '' };
    }

    const raw = partsText.trim();

    const prefixDefs: { key: keyof Omit<ParsedHisParts, 'isSpecialtyMerged' | 'cleanInternalText'>; regex: RegExp }[] = [
        { key: 'internal', regex: /(?:^|[;\n\r\t])\s*(?:Nội\s*khoa|Noi\s*khoa|Khám\s*nội|Kham\s*noi|Nội|Noi)\s*:\s*/i },
        { key: 'external', regex: /(?:^|[;\n\r\t])\s*(?:Ngoại\s*khoa|Ngoai\s*khoa|Khám\s*ngoại|Kham\s*ngoai|Ngoại|Ngoai)\s*:\s*/i },
        { key: 'eye', regex: /(?:^|[;\n\r\t])\s*(?:Mắt|Mat|Khám\s*mắt|Kham\s*mat)\s*:\s*/i },
        { key: 'ent', regex: /(?:^|[;\n\r\t])\s*(?:TMH|Tai\s*mũi\s*họng|Tai\s*mui\s*hong|Khám\s*TMH|Khám\s*tai\s*mũi\s*họng)\s*:\s*/i },
        { key: 'dental', regex: /(?:^|[;\n\r\t])\s*(?:RHM|Răng\s*hàm\s*mặt|Rang\s*ham\s*mat|Khám\s*răng|Kham\s*rang|Khám\s*RHM)\s*:\s*/i },
        { key: 'dermatology', regex: /(?:^|[;\n\r\t])\s*(?:Da\s*liễu|Da\s*lieu|Khám\s*da\s*liễu|Khám\s*da|Kham\s*da\s*lieu)\s*:\s*/i },
        { key: 'gynecology', regex: /(?:^|[;\n\r\t])\s*(?:Sản\s*phụ\s*khoa|San\s*phu\s*khoa|Phụ\s*khoa|Phu\s*khoa|Khám\s*phụ\s*khoa|Khám\s*sản\s*phụ\s*khoa|Sản|San)\s*:\s*/i },
        { key: 'neurology', regex: /(?:^|[;\n\r\t])\s*(?:Thần\s*kinh|Than\s*kinh|Khám\s*thần\s*kinh)\s*:\s*/i },
        { key: 'psychiatry', regex: /(?:^|[;\n\r\t])\s*(?:Tâm\s*thần|Tam\s*than|Khám\s*tâm\s*thần)\s*:\s*/i },
    ];

    interface MatchPos {
        key: keyof Omit<ParsedHisParts, 'isSpecialtyMerged' | 'cleanInternalText'>;
        start: number;
        end: number;
    }

    const matches: MatchPos[] = [];
    for (const def of prefixDefs) {
        let m: RegExpExecArray | null;
        const re = new RegExp(def.regex.source, 'gi');
        while ((m = re.exec(raw)) !== null) {
            matches.push({
                key: def.key,
                start: m.index + (m[0].length - m[0].replace(/^[;\n\r\t\s]+/, '').length),
                end: m.index + m[0].length
            });
        }
    }

    matches.sort((a, b) => a.start - b.start);

    // Không tìm thấy bất kỳ tiền tố chuyên khoa nào -> Văn bản khám lâm sàng thuần túy
    if (matches.length === 0) {
        return {
            isSpecialtyMerged: false,
            cleanInternalText: raw,
            internal: raw
        };
    }

    const result: ParsedHisParts = {
        isSpecialtyMerged: true,
        cleanInternalText: ''
    };

    for (let i = 0; i < matches.length; i++) {
        const cur = matches[i];
        const nextStart = (i + 1 < matches.length) ? matches[i + 1].start : raw.length;
        const val = raw.substring(cur.end, nextStart)
            .trim()
            .replace(/[;\r\n]+$/, '')
            .trim();

        if (val) {
            result[cur.key] = val;
        }
    }

    result.cleanInternalText = result.internal || '';
    return result;
}

/**
 * Ánh xạ toàn diện dữ liệu từ bản ghi hms_exm_conclusion sang đối tượng clinical_exam của KSK
 * Đảm bảo bao phủ 100% tất cả các alias chuyên khoa, hỗ trợ đồng bộ 2 chiều và chuẩn hóa _pl
 */
export function mapConclusionRowToClinicalExam(conclRow: any, existingClinExam: any = {}, globalPhanLoai?: string | null): any {
    if (!conclRow && !existingClinExam) return {};
    const ce = { ...(existingClinExam || {}) };

    // 0. Bóc tách và vệ sinh phòng thủ các chuỗi gộp chuyên khoa từ HIS
    let partsFromHe: ParsedHisParts = { isSpecialtyMerged: false, cleanInternalText: '' };
    const rawParts = existingClinExam?.raw_he_parts || conclRow?.raw_he_parts;
    if (rawParts) {
        partsFromHe = parseHisPartsSummary(rawParts);
    }

    // Nếu noi_khoa_tuan_hoan / noi_khoa_ho_hap / internal chứa chuỗi gộp các chuyên khoa khác -> Làm sạch ngay lập tức
    if (ce.noi_khoa_tuan_hoan) {
        const p = parseHisPartsSummary(ce.noi_khoa_tuan_hoan);
        if (p.isSpecialtyMerged) {
            ce.noi_khoa_tuan_hoan = p.cleanInternalText;
            if (!partsFromHe.isSpecialtyMerged) partsFromHe = p;
        }
    }
    if (ce.noi_khoa_ho_hap) {
        const p = parseHisPartsSummary(ce.noi_khoa_ho_hap);
        if (p.isSpecialtyMerged) {
            ce.noi_khoa_ho_hap = p.cleanInternalText;
            if (!partsFromHe.isSpecialtyMerged) partsFromHe = p;
        }
    }
    if (ce.internal) {
        const p = parseHisPartsSummary(ce.internal);
        if (p.isSpecialtyMerged) {
            ce.internal = p.cleanInternalText;
            if (!partsFromHe.isSpecialtyMerged) partsFromHe = p;
        }
    }

    const parsePl = (val: any) => {
        return parseFitnessClassFromText(val) || parseFitnessClassFromText(globalPhanLoai) || '1';
    };

    const normalizeText = (val: any, defaultText: string) => {
        if (!val) return '';
        const s = String(val).trim();
        if (s === '1' || s === '01') return defaultText;
        return s;
    };

    // 1. Thể lực
    if (conclRow?.hecl_theluc) {
        const thelucText = normalizeText(conclRow.hecl_theluc, 'Thể lực tốt');
        ce.kham_the_luc = thelucText;
        ce.kham_the_luc_pl = parsePl(conclRow.hecl_theluc);
    }

    // 2. Tuần hoàn / Tim mạch (hecl_tuanhoan)
    if (conclRow?.hecl_tuanhoan) {
        const thText = normalizeText(conclRow.hecl_tuanhoan, 'Tim đều, T1 T2 rõ, bình thường');
        ce.kq_tim_mach = thText;
        ce.circulatory = thText;
        ce.tim_mach = thText;
        ce.tuan_hoan = thText;
        ce.noi_khoa_tuan_hoan = thText;
        ce.nhi_tuan_hoan = thText;
        ce.noi_khoa_tuan_hoan_pl = parsePl(conclRow.hecl_tuanhoan);
    } else if (partsFromHe.internal) {
        ce.kq_tim_mach = partsFromHe.internal;
        ce.circulatory = partsFromHe.internal;
        ce.tim_mach = partsFromHe.internal;
        ce.tuan_hoan = partsFromHe.internal;
        ce.noi_khoa_tuan_hoan = partsFromHe.internal;
        ce.nhi_tuan_hoan = partsFromHe.internal;
        ce.noi_khoa_tuan_hoan_pl = parsePl(globalPhanLoai);
    } else if (!ce.kq_tim_mach && !ce.noi_khoa_tuan_hoan) {
        // Fallback: Khi hồ sơ có kết luận hoặc đã khám các khoa khác mà tuần hoàn chưa ghi riêng
        if (conclRow?.hecl_phanloai || conclRow?.hecl_conclusion || conclRow?.hecl_theluc || partsFromHe.isSpecialtyMerged) {
            ce.kq_tim_mach = 'Tim đều, T1 T2 rõ, bình thường';
            ce.noi_khoa_tuan_hoan = 'Tim đều, T1 T2 rõ, bình thường';
            ce.circulatory = 'Tim đều, T1 T2 rõ, bình thường';
            ce.noi_khoa_tuan_hoan_pl = parsePl(conclRow?.hecl_phanloai);
        }
    }

    // 3. Hô hấp (hecl_hohap)
    if (conclRow?.hecl_hohap) {
        const hhText = normalizeText(conclRow.hecl_hohap, 'Phổi trong, rì rào phế nang rõ, bình thường');
        ce.kq_ho_hap = hhText;
        ce.respiratory = hhText;
        ce.ho_hap = hhText;
        ce.noi_khoa_ho_hap = hhText;
        ce.nhi_ho_hap = hhText;
        ce.noi_khoa_ho_hap_pl = parsePl(conclRow.hecl_hohap);
    } else if (partsFromHe.internal) {
        ce.kq_ho_hap = partsFromHe.internal;
        ce.respiratory = partsFromHe.internal;
        ce.ho_hap = partsFromHe.internal;
        ce.noi_khoa_ho_hap = partsFromHe.internal;
        ce.nhi_ho_hap = partsFromHe.internal;
        ce.noi_khoa_ho_hap_pl = parsePl(globalPhanLoai);
    } else if (!ce.kq_ho_hap && !ce.noi_khoa_ho_hap) {
        // Fallback: Khi hồ sơ có kết luận hoặc đã khám các khoa khác mà hô hấp chưa ghi riêng
        if (conclRow?.hecl_phanloai || conclRow?.hecl_conclusion || conclRow?.hecl_theluc || partsFromHe.isSpecialtyMerged) {
            ce.kq_ho_hap = 'Phổi trong, rì rào phế nang rõ, bình thường';
            ce.noi_khoa_ho_hap = 'Phổi trong, rì rào phế nang rõ, bình thường';
            ce.respiratory = 'Phổi trong, rì rào phế nang rõ, bình thường';
            ce.noi_khoa_ho_hap_pl = parsePl(conclRow?.hecl_phanloai);
        }
    }

    // 4. Tiêu hóa (hecl_tieuhoa)
    if (conclRow?.hecl_tieuhoa) {
        const thText = normalizeText(conclRow.hecl_tieuhoa, 'Bụng mềm, gan lách không to, bình thường');
        ce.noi_khoa_tieu_hoa = thText;
        ce.kq_tieu_hoa = thText;
        ce.digestive = thText;
        ce.tieu_hoa = thText;
        ce.nhi_tieu_hoa = thText;
        ce.noi_khoa_tieu_hoa_pl = parsePl(conclRow.hecl_tieuhoa);
    }

    // 5. Thận - Tiết niệu (hecl_thantietnieu)
    if (conclRow?.hecl_thantietnieu) {
        const tnText = normalizeText(conclRow.hecl_thantietnieu, 'Chạm thận (-), bập bềnh thận (-), bình thường');
        ce.kq_tiet_nieu = tnText;
        ce.noi_khoa_than_tietnieu = tnText;
        ce.urinary = tnText;
        ce.than_tiet_nieu = tnText;
        ce.tiet_nieu = tnText;
        ce.nhi_tiet_nieu = tnText;
        ce.noi_khoa_than_tietnieu_pl = parsePl(conclRow.hecl_thantietnieu);
    }

    // 6. Nội tiết (hecl_noitiet)
    if (conclRow?.hecl_noitiet) {
        const ntText = normalizeText(conclRow.hecl_noitiet, 'Tuyến giáp không to, không rối loạn nội tiết');
        ce.kq_noi_tiet = ntText;
        ce.kq_noi_tiet_chuyen_hoa = ntText;
        ce.noi_khoa_noi_tiet = ntText;
        ce.endocrine = ntText;
        ce.noi_tiet = ntText;
        ce.noi_khoa_noi_tiet_pl = parsePl(conclRow.hecl_noitiet);
    }

    // 7. Cơ xương khớp (hecl_coxuongkhop)
    if (conclRow?.hecl_coxuongkhop) {
        const cxkText = normalizeText(conclRow.hecl_coxuongkhop, 'Vận động các khớp bình thường, không đau');
        ce.kq_co_xuong_khop = cxkText;
        ce.noi_khoa_co_xuong_khop = cxkText;
        ce.musculoskeletal = cxkText;
        ce.co_xuong_khop = cxkText;
        ce.noi_khoa_co_xuong_khop_pl = parsePl(conclRow.hecl_coxuongkhop);
    }

    // 8. Thần kinh (hecl_thankinh)
    const valTk = conclRow?.hecl_thankinh || partsFromHe.neurology;
    if (valTk) {
        const tkText = normalizeText(valTk, 'Không có dấu thần kinh khu trú, bình thường');
        ce.kq_than_kinh = tkText;
        ce.noi_khoa_than_kinh = tkText;
        ce.neurology = tkText;
        ce.than_kinh = tkText;
        ce.nhi_than_kinh = tkText;
        ce.noi_khoa_than_kinh_pl = parsePl(valTk);
    }

    // 9. Tâm thần (hecl_tamthan)
    const valTt = conclRow?.hecl_tamthan || partsFromHe.psychiatry;
    if (valTt) {
        const ttText = normalizeText(valTt, 'Tâm thần ổn định, tiếp xúc tốt, bình thường');
        ce.kq_tam_than = ttText;
        ce.noi_khoa_tam_than = ttText;
        ce.psychiatry = ttText;
        ce.tam_than = ttText;
        ce.nhi_tam_than = ttText;
        ce.noi_khoa_tam_than_pl = parsePl(valTt);
    }

    // Gán internal tổng quát (Làm sạch hoàn toàn, không chứa chuyên khoa ngoại lai)
    if (!ce.internal || parseHisPartsSummary(ce.internal).isSpecialtyMerged) {
        const internalParts = [
            ce.kq_tim_mach ? `Tuần hoàn: ${ce.kq_tim_mach}` : '',
            ce.kq_ho_hap ? `Hô hấp: ${ce.kq_ho_hap}` : '',
            ce.noi_khoa_tieu_hoa ? `Tiêu hóa: ${ce.noi_khoa_tieu_hoa}` : '',
            ce.kq_tiet_nieu ? `Thận - Tiết niệu: ${ce.kq_tiet_nieu}` : ''
        ].filter(Boolean);
        if (internalParts.length > 0) {
            ce.internal = internalParts.join('; ');
        } else if (conclRow?.hecl_tuanhoan) {
            ce.internal = normalizeText(conclRow.hecl_tuanhoan, 'Bình thường');
        } else if (partsFromHe.internal) {
            ce.internal = partsFromHe.internal;
        } else if (conclRow?.hecl_phanloai || conclRow?.hecl_conclusion || partsFromHe.isSpecialtyMerged) {
            ce.internal = 'Bình thường';
        }
    }

    // 10. Ngoại khoa (hecl_ngoai hoặc bóc tách từ he_parts)
    const valNgoai = conclRow?.hecl_ngoai || conclRow?.hecl_ngoaikhoa || partsFromHe.external;
    if (valNgoai) {
        const ngText = normalizeText(valNgoai, 'Bình thường, không sẹo mổ cũ');
        ce.kq_ngoai_khoa = ngText;
        ce.external = ngText;
        ce.surgery = ngText;
        ce.ngoai_khoa = ngText;
        ce.kham_ngoai_khoa_pl = parsePl(valNgoai);
    }

    // 11. Da liễu (hecl_dalieu hoặc bóc tách từ he_parts)
    const valDalieu = conclRow?.hecl_dalieu || partsFromHe.dermatology;
    if (valDalieu) {
        const dlText = normalizeText(valDalieu, 'Không phát hiện bệnh da liễu');
        ce.kq_da_lieu = dlText;
        ce.dermatology = dlText;
        ce.da_lieu = dlText;
        ce.kham_da_lieu_pl = parsePl(valDalieu);
    }

    // 12. Mắt (hecl_mat hoặc bóc tách từ he_parts)
    const valMat = conclRow?.hecl_mat || partsFromHe.eye;
    if (valMat) {
        const matText = normalizeText(valMat, 'Mắt phải 10/10, Mắt trái 10/10');
        ce.eye = matText;
        ce.mat = matText;
        ce.kq_mat = matText;
        ce.kham_mat = matText;
        ce.kham_mat_pl = parsePl(valMat);

        // Trích xuất thị lực nếu có định dạng số/10
        const visualMatch = matText.match(/(\d+)\/10[^\d]*(\d+)\/10/);
        if (visualMatch) {
            ce.khong_kinh_mat_phai = `${visualMatch[1]}/10`;
            ce.khong_kinh_mat_trai = `${visualMatch[2]}/10`;
            ce.khong_kinh_hai_mat = `${visualMatch[1]}/10`;
        } else if (matText.includes('10/10') || matText.toLowerCase().includes('bình thường')) {
            if (!ce.khong_kinh_mat_phai) ce.khong_kinh_mat_phai = '10/10';
            if (!ce.khong_kinh_mat_trai) ce.khong_kinh_mat_trai = '10/10';
            if (!ce.khong_kinh_hai_mat) ce.khong_kinh_hai_mat = '10/10';
        }
    }

    // 13. Tai Mũi Họng (hecl_tmh / hecl_taimuihong hoặc bóc tách từ he_parts)
    const valTmh = conclRow?.hecl_tmh || conclRow?.hecl_taimuihong || partsFromHe.ent;
    if (valTmh) {
        const tmhText = normalizeText(valTmh, 'Màng nhĩ sáng, họng sạch, tai mũi họng ổn định');
        ce.ent = tmhText;
        ce.tai_mui_hong = tmhText;
        ce.kq_tai_mui_hong = tmhText;
        ce.benh_tai_mui_hong = tmhText;
        ce.kham_tai_mui_hong = tmhText;
        ce.tai_trai_noi_thuong = ce.tai_trai_noi_thuong || '5m';
        ce.tai_phai_noi_thuong = ce.tai_phai_noi_thuong || '5m';
        ce.kham_tai_mui_hong_pl = parsePl(valTmh);
    }

    // 14. Răng Hàm Mặt (hecl_rhm / hecl_ranghammat hoặc bóc tách từ he_parts)
    const valRhm = conclRow?.hecl_rhm || conclRow?.hecl_ranghammat || partsFromHe.dental;
    if (valRhm) {
        const rhmText = normalizeText(valRhm, 'Không sâu răng, không viêm lợi, khớp cắn bình thường');
        ce.dental = rhmText;
        ce.rang_ham_mat = rhmText;
        ce.kq_rang_ham_mat = rhmText;
        ce.benh_rang_ham_mat = rhmText;
        ce.kham_rang_ham_mat = rhmText;
        ce.ham_tren = ce.ham_tren || 'Bình thường';
        ce.ham_duoi = ce.ham_duoi || 'Bình thường';
        ce.kham_rang_ham_mat_pl = parsePl(valRhm);
    }

    // 15. Sản phụ khoa (hecl_phukhoa / hecl_sanphukhoa hoặc bóc tách từ he_parts)
    const valPhukhoa = conclRow?.hecl_phukhoa || conclRow?.hecl_sanphukhoa || partsFromHe.gynecology;
    if (valPhukhoa) {
        const pkText = normalizeText(valPhukhoa, 'Khám phụ khoa bình thường');
        ce.gynecology = pkText;
        ce.san_phu_khoa = pkText;
        ce.phu_khoa = pkText;
        ce.kq_sinh_duc = pkText;
        ce.kham_san_phu_khoa = pkText;
        ce.kham_san_phu_khoa_pl = parsePl(valPhukhoa);
    }

    return ce;
}

