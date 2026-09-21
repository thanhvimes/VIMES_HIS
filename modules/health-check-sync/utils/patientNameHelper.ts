/**
 * Utility hỗ trợ chuẩn hóa họ tên và validation CCCD/SĐT cho phân hệ Khám Sức Khỏe
 */

export interface SplitNameResult {
    surname: string;
    midname: string;
    firstname: string;
}

/**
 * Tách một chuỗi họ và tên đầy đủ thành: Họ (đệm), Tên đệm, Tên chính
 * Ví dụ:
 *  - "NGUYỄN NGỌC PHAN" -> { surname: "NGUYỄN", midname: "NGỌC", firstname: "PHAN" }
 *  - "TRẦN VĂN ANH TUẤN" -> { surname: "TRẦN", midname: "VĂN ANH", firstname: "TUẤN" }
 *  - "LÊ AN" -> { surname: "LÊ", midname: "", firstname: "AN" }
 *  - "DUNG" -> { surname: "DUNG", midname: "", firstname: "DUNG" }
 */
export const splitFullName = (fullName: string): SplitNameResult => {
    const trimmed = (fullName || '').trim().replace(/\s+/g, ' ');
    if (!trimmed) {
        return { surname: '', midname: '', firstname: '' };
    }

    const parts = trimmed.split(' ');
    if (parts.length === 1) {
        return {
            surname: parts[0],
            midname: '',
            firstname: parts[0]
        };
    }

    if (parts.length === 2) {
        return {
            surname: parts[0],
            midname: '',
            firstname: parts[1]
        };
    }

    const surname = parts[0];
    const firstname = parts[parts.length - 1];
    const midname = parts.slice(1, parts.length - 1).join(' ');

    return { surname, midname, firstname };
};

/**
 * Nối các trường họ, đệm, tên thành chuỗi Họ và Tên đầy đủ
 */
export const formatFullName = (surname?: string, midname?: string, firstname?: string): string => {
    return [surname, midname, firstname]
        .map(s => (s || '').trim())
        .filter(Boolean)
        .join(' ');
};

/**
 * Bóc tách giới tính và năm sinh từ số CCCD 12 chữ số
 * - Ký tự thứ 4: Thế kỷ sinh và giới tính
 *   + 0: Nam, 19xx | 1: Nữ, 19xx
 *   + 2: Nam, 20xx | 3: Nữ, 20xx
 *   + 4: Nam, 21xx | 5: Nữ, 21xx
 * - 2 ký tự tiếp theo (vị trí 5, 6): 2 số cuối năm sinh
 */
export const parseCccdInfo = (cccd: string): { gender: 'M' | 'F' | null; birthYear: number | null; estimatedDob: string | null } => {
    const clean = (cccd || '').replace(/\D/g, '');
    if (clean.length < 6) {
        return { gender: null, birthYear: null, estimatedDob: null };
    }

    const genderCenturyChar = clean.charAt(3);
    const yearSuffix = clean.slice(4, 6);
    const yearNum = parseInt(yearSuffix, 10);

    if (isNaN(yearNum)) {
        return { gender: null, birthYear: null, estimatedDob: null };
    }

    let century = 1900;
    let gender: 'M' | 'F' = 'M';

    switch (genderCenturyChar) {
        case '0':
            century = 1900;
            gender = 'M';
            break;
        case '1':
            century = 1900;
            gender = 'F';
            break;
        case '2':
            century = 2000;
            gender = 'M';
            break;
        case '3':
            century = 2000;
            gender = 'F';
            break;
        case '4':
            century = 2100;
            gender = 'M';
            break;
        case '5':
            century = 2100;
            gender = 'F';
            break;
        default:
            return { gender: null, birthYear: null, estimatedDob: null };
    }

    const birthYear = century + yearNum;
    const estimatedDob = `${birthYear}-01-01`;

    return { gender, birthYear, estimatedDob };
};

/**
 * Kiểm tra hợp lệ số CCCD (Nếu có nhập thì bắt buộc phải đúng 12 chữ số)
 */
export const validateCccd = (cccd: string): { isValid: boolean; message?: string } => {
    const clean = (cccd || '').trim();
    if (!clean) return { isValid: true };
    if (!/^\d{12}$/.test(clean)) {
        return {
            isValid: false,
            message: `Số CCCD phải gồm chính xác 12 chữ số (Hiện tại: ${clean.length}/12)`
        };
    }
    return { isValid: true };
};

/**
 * Kiểm tra hợp lệ Số điện thoại (Nếu có nhập thì bắt buộc 10 chữ số, bắt đầu bằng 0)
 */
export const validatePhone = (phone: string): { isValid: boolean; message?: string } => {
    const clean = (phone || '').trim();
    if (!clean) return { isValid: true };
    if (!clean.startsWith('0')) {
        return {
            isValid: false,
            message: 'Số điện thoại phải bắt đầu bằng chữ số 0'
        };
    }
    if (!/^\d{10}$/.test(clean)) {
        return {
            isValid: false,
            message: `Số điện thoại phải gồm đúng 10 chữ số (Hiện tại: ${clean.length}/10)`
        };
    }
    return { isValid: true };
};

/**
 * Phân tích chuỗi quét từ mã QR trên thẻ Căn cước công dân Việt Nam
 * Cấu trúc chuẩn: CCCD|CMND_CŨ|HỌ_TÊN|NGÀY_SINH(ddMMyyyy)|GIỚI_TÍNH|ĐỊA_CHỈ|NGÀY_CẤP(ddMMyyyy)
 * Ví dụ: "001095012345|012345678|NGUYỄN VĂN AN|15031995|Nam|Hà Nội|20122021"
 */
export interface CccdQrData {
    cccd: string;
    oldCmnd?: string;
    fullName: string;
    dob: string; // YYYY-MM-DD
    gender: 'M' | 'F';
    address: string;
    issueDate: string; // YYYY-MM-DD
}

export const parseCccdQr = (qrString: string): CccdQrData | null => {
    if (!qrString || typeof qrString !== 'string' || !qrString.includes('|')) {
        return null;
    }

    const parts = qrString.split('|');
    if (parts.length < 5) {
        return null;
    }

    const cccd = (parts[0] || '').trim().replace(/\D/g, '');
    const oldCmnd = (parts[1] || '').trim();
    const fullName = (parts[2] || '').trim().toUpperCase();
    
    // Ngày sinh: ddMMyyyy -> YYYY-MM-DD
    const rawDob = (parts[3] || '').trim().replace(/\D/g, '');
    let dob = '';
    if (rawDob.length === 8) {
        const d = rawDob.substring(0, 2);
        const m = rawDob.substring(2, 4);
        const y = rawDob.substring(4, 8);
        dob = `${y}-${m}-${d}`;
    }

    // Giới tính
    const rawGender = (parts[4] || '').trim().toLowerCase();
    const gender: 'M' | 'F' = (rawGender === 'nữ' || rawGender === 'f' || rawGender === 'female') ? 'F' : 'M';

    // Địa chỉ
    const address = (parts[5] || '').trim();

    // Ngày cấp: ddMMyyyy -> YYYY-MM-DD
    const rawIssueDate = (parts[6] || '').trim().replace(/\D/g, '');
    let issueDate = '';
    if (rawIssueDate.length === 8) {
        const d = rawIssueDate.substring(0, 2);
        const m = rawIssueDate.substring(2, 4);
        const y = rawIssueDate.substring(4, 8);
        issueDate = `${y}-${m}-${d}`;
    }

    return {
        cccd,
        oldCmnd,
        fullName,
        dob,
        gender,
        address,
        issueDate
    };
};

/**
 * Chuẩn hóa chuỗi ngày bất kỳ (DD/MM/YYYY hoặc YYYY-MM-DD) về định dạng YYYY-MM-DD cho input type="date"
 */
export const formatToIsoDate = (dateStr?: string | null): string => {
    if (!dateStr) return '';
    const trimmed = String(dateStr).trim();
    if (!trimmed) return '';
    
    // Nếu đã là YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
    }

    // Nếu là DD/MM/YYYY hoặc DD-MM-YYYY
    const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
        const d = dmyMatch[1].padStart(2, '0');
        const m = dmyMatch[2].padStart(2, '0');
        const y = dmyMatch[3];
        return `${y}-${m}-${d}`;
    }

    // Nếu là YYYYMMDD
    if (/^\d{8}$/.test(trimmed)) {
        return `${trimmed.substring(0, 4)}-${trimmed.substring(4, 6)}-${trimmed.substring(6, 8)}`;
    }

    return trimmed;
};
