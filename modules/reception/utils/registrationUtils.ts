import { CatalogItem } from '../../../services/catalogService';
import { Patient } from '../../../types';

// --- ROBUST HEX DECODER (UTF-8) ---
export const decodeHex = (hex: string): string => {
    if (!hex) return '';
    try {
        const cleanHex = hex.replace(/\s+/g, '');
        if (cleanHex.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(cleanHex)) return hex;
        const percentEncoded = cleanHex.replace(/(.{2})/g, '%$1');
        return decodeURIComponent(percentEncoded);
    } catch (e) {
        return hex;
    }
};

// --- DATE FORMATTER (DD/MM/YYYY or DDMMYYYY -> YYYY-MM-DD) ---
export const formatDateForInput = (dateStr: string) => {
    if (!dateStr || dateStr === '-' || dateStr.trim() === '') return '';
    if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
    } else if (dateStr.length === 8 && !isNaN(Number(dateStr))) {
        return `${dateStr.slice(4, 8)}-${dateStr.slice(2, 4)}-${dateStr.slice(0, 2)}`;
    }
    return '';
};

// --- BENEFIT RATE ---
export const getBenefitRate = (benefitCode: string) => {
    switch (benefitCode) {
        case '1': return '100';
        case '2': return '100';
        case '3': return '95';
        case '4': return '80';
        case '5': return '100';
        default: return '';
    }
};

export const getLocalDateString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// --- QR CODE PARSER ---
export const parseScannedData = (rawData: string) => {
    if (!rawData) return null;
    const parts = rawData.split('|');

    if (parts.length >= 10 && parts[0].length === 15 && /^[A-Z]{2}\d{13}$/.test(parts[0])) {
        try {
            const insuranceNumber = parts[0];
            const name = decodeHex(parts[1]);
            const dob = formatDateForInput(parts[2]);
            const gender = parts[3] === '1' ? 'Nam' : parts[3] === '2' ? 'Nữ' : 'Khác';
            const address = decodeHex(parts[4]);

            return {
                type: 'BHYT',
                data: {
                    name, dob, gender, address,
                    insuranceNumber,
                    insuranceRegCode: parts[5],
                    insuranceRegDate: formatDateForInput(parts[6]),
                    insuranceExp: formatDateForInput(parts[7]),
                    insurance5Year: formatDateForInput(parts[12]),
                    age: new Date().getFullYear() - parseInt(dob.split('-')[0] || '0'),
                    patientType: '4' // 4 is BHYT Xã Hội in hms_object
                }
            };
        } catch (e) { return null; }
    }

    if (parts.length >= 6 && /^\d{12}$/.test(parts[0])) {
        const dobDate = formatDateForInput(parts[3]);
        return {
            type: 'CCCD',
            data: {
                identityCard: parts[0],
                name: parts[2],
                dob: dobDate,
                gender: parts[4].toLowerCase().includes('nam') ? 'Nam' : 'Nữ',
                address: parts[5],
                identityIssueDate: formatDateForInput(parts[6]),
                age: new Date().getFullYear() - parseInt(dobDate.split('-')[0] || '0'),
                patientType: '7' // 7 is Dịch vụ in hms_object
            }
        };
    }
    return null;
};

export interface ExtendedFormData extends Patient {
    email?: string;
    nationality?: string;
    relationship?: string;
    province?: string;
    ward?: string;
    relativePhone?: string;
    workplace?: string;
    identityIssueDate?: string;
    insuranceNumber?: string;
    insuranceRegDate?: string;
    insuranceExp?: string;
    insuranceRegCode?: string;
    insuranceObject?: string;
    insurancePlace?: string;
    insuranceArea?: string;
    insurance5Year?: string;
    insuranceExempt?: string;
    insuranceRouteType?: string;
    regDate?: string;
    regDepartment?: string;
    regRoom?: string;
    regReason?: string;
    regExamType?: string;
    regPriority?: boolean;
    regEmergency?: boolean;
    regHealthCheck?: boolean;
    regDateTime?: string;
    route?: 'Đúng tuyến' | 'Trái tuyến' | 'Cấp cứu' | 'Lĩnh thuốc';
    isTransfer?: boolean;
    transferHospital?: string;
    transferHospitalCode?: string;
    transferDiagnosis?: string;
    transferFile?: string;
    provinceId?: string | number;
    wardId?: string | number;
    receptNo?: string;     // Số thứ tự hàng đợi sau khi đăng ký thành công
}

export const emptyPatient: ExtendedFormData = {
    id: '', recordNumber: '', name: '', dob: '', age: 0, gender: 'Nam',
    ethnicity: '1', occupation: '', address: '', phone: '', lastVisit: '',
    patientType: '', identityCard: '', relativeInfo: '',
    history: [],
    email: '', nationality: 'VN', relationship: '0', province: '', ward: '', relativePhone: '', workplace: '',
    identityIssueDate: '',
    insuranceNumber: '', insuranceRegDate: '', insuranceExp: '',
    insuranceRegCode: '', insuranceObject: '', insurancePlace: '',
    insuranceArea: '', insuranceExempt: '', insurance5Year: '',
    insuranceRouteType: '0',
    regReason: '', regDepartment: '', regRoom: '',
    regExamType: '', regPriority: false, regEmergency: false, regHealthCheck: false,
    regDateTime: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
    isTransfer: false, provinceId: '', wardId: '',
    route: 'Đúng tuyến',
    receptNo: ''
};

export const CURRENT_HOSPITAL_CODE = '37001';
