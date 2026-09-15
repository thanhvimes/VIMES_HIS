// ==================== RECEPTION HELPERS ====================
// File: backend/src/controllers/reception/helpers.ts

export interface ReceptionFormData {
    name?: string;
    identityCard?: string;
    dob?: string;
    gender?: string;
    provinceId?: string;
    districtId?: string;
    wardId?: string;
    address?: string;
    occupation?: string;
    ethnicity?: string;
    workplace?: string;
    phone?: string;
    relativeInfo?: string;
    relativePhone?: string;
    patientType?: string;
    route?: string;
    insuranceRegDate?: string;
    regDepartment?: string;
    regRoom?: number | string;
    regExamType?: string;
    regReason?: string;
    insuranceNumber?: string;
    insuranceExp?: string;
    insuranceRegCode?: string;
    insuranceArea?: string;
    insuranceRouteType?: string;
    transferHospital?: string;
    transferDiagnosis?: string;
    transferHospitalCode?: string;
    isTransfer?: boolean;
    nationality?: string;
    relationship?: string;
    workplaceId?: string;
    insurance5Year?: string;
    mode?: 'ADD_PATIENT' | 'ADD_DOC' | 'ADD_EXAM';
    recordNumber?: string;
}

export interface PatientPayload {
    patientId: string;
    surname: string;
    midName: string;
    firstName: string;
    birthDate: string | null;
    sex: 'M' | 'F';
    sin: string;
    provId: string | number | null;
    distId: string | number | null;
    villId: string | number | null;
    dtlAddr: string;
    occupation: string | number | null;
    ethnic: string | number | null;
    workplace: string;
    workplaceId?: string;
    nationality: string;
}

/**
 * Build patient object from form data
 */
export function buildPatientPayload(data: ReceptionFormData): PatientPayload {
    const nameParts = (data.name || '').trim().split(/\s+/);
    const firstName = nameParts.length > 0 ? nameParts.pop() || '' : '';
    const surname = nameParts.length > 0 ? nameParts.shift() || '' : '';
    const midName = nameParts.join(' ');

    return {
        patientId: data.identityCard || '',
        surname: surname,
        midName: midName,
        firstName: firstName,
        birthDate: data.dob || null,
        sex: data.gender === 'Nam' ? 'M' : 'F',
        sin: data.identityCard || '',
        provId: parseInt(String(data.provinceId || '0')) || null,
        distId: parseInt(String(data.districtId || '0')) || null,
        villId: parseInt(String(data.wardId || '0')) || null,
        dtlAddr: data.address || '',
        occupation: parseInt(String(data.occupation || '0')) || null,
        ethnic: parseInt(String(data.ethnicity || '0')) || null,
        workplace: data.workplace || '',
        workplaceId: data.workplaceId,
        nationality: data.nationality || 'VN'
    };
}

/**
 * Build hms_doc payload
 */
export function buildDocPayload(data: ReceptionFormData, defaultDeptId?: string) {
    let insLine = 'N';
    let emergency = 'N';
    let disRate = 80;

    if (data.route === 'Trái tuyến') { insLine = 'Y'; disRate = 48; }
    else if (data.route === 'Cấp cứu') { emergency = 'Y'; }
    else if (data.route === 'Lĩnh thuốc') { insLine = 'N'; }

    // Map patientType to numeric ho_id. Prioritize numeric input from UI.
    const pt = String(data.patientType || '7');
    let objectId: number;
    
    if (pt === 'Bảo hiểm' || pt === 'I') objectId = 4;
    else if (pt === 'Dịch vụ' || pt === 'S') objectId = 7;
    else objectId = parseInt(pt) || 7;

    return {
        telephone: data.phone || '',
        relative: data.relativeInfo || '',
        relation: parseInt(String(data.relationship || '0')) || 0,
        contactAddr: data.address || '',
        contactTel: data.relativePhone || '',
        objectId: objectId,
        insRegDate: data.insuranceRegDate || null,
        insExpDate: data.insuranceExp || null,
        over5YearDate: data.insurance5Year || null,
        disRate: disRate,
        insLine: insLine,
        admitState: '',
        admitDept: data.regDepartment || defaultDeptId || 'KKB',
        transPlace: data.transferHospital || '',
        transDiagn: data.transferDiagnosis || '',
        transPlaceId: data.transferHospitalCode || '',
        xObject: '',
        xCardNo: '',
        xIssuePlace: '',
        xIssueDate: null,
        reExam: data.isTransfer ? 'Y' : 'N',
        emergency: emergency,
        maDoiTuongKcb: data.insuranceRouteType || '1',
        docNo: data.recordNumber
    };
}

/**
 * Build hms_card payload
 */
export function buildCardPayload(data: ReceptionFormData) {
    if (!data.insuranceNumber) return { cardNo: '' };
    return {
        cardNo: data.insuranceNumber || '',
        regDate: data.insuranceRegDate || null,
        expDate: data.insuranceExp || null,
        regCode: data.insuranceRegCode || '',
        company: '',
        code: (data.insuranceNumber || '').substring(0, 2),
        discount: 80,
        area: data.insuranceArea || ''
    };
}

/**
 * Build hms_exam payload
 */
export function buildExamPayload(data: ReceptionFormData, defaultDeptId?: string) {
    return {
        deptId: data.regDepartment || defaultDeptId || 'KKB',
        roomId: data.regRoom || 1,
        examType: data.regExamType || 'E01',
        examDate: new Date().toISOString(),
        doctor: '',
        preDiagnostic: data.regReason || '',
        diagnostic: '',
        hasFee: 'N',
        isAutoPayment: false
    };
}
