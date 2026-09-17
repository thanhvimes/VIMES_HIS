// File: backend/src/services/administrative-catalog.service.ts
import { query } from '../config/database';

// Memory Caches for ultra-fast (O(1)) synchronous lookup during XML generation & sync
const provIdToBh = new Map<string, string>();
const provNameToBh = new Map<string, string>();
const provIdToName = new Map<string, string>();
const provBhCodes = new Set<string>();

const villIdToBh = new Map<string, string>();
const villNameToBh = new Map<string, string>();
const villIdToName = new Map<string, string>();
const villBhCodes = new Set<string>();

// Memory Caches for Occupation lookup (ss_code -> 2-digit ss_vndesc)
const occCodeToVndesc = new Map<string, string>();
const occNameToVndesc = new Map<string, string>();
const occVndescSet = new Set<string>();
const occRawVndescTo2Digits = new Map<string, string>();

let isInitialized = false;

// Standard Fallback Occupations (Mapping HIS ss_code -> official standard 2-digit code)
const STATIC_OCCUPATIONS: Array<{ ss_code: string; ss_vndesc: string; ss_desc: string }> = [
    { ss_code: '1539', ss_vndesc: '00', ss_desc: 'Không có nghề nghiệp cụ thể' },
    { ss_code: '1', ss_vndesc: '01', ss_desc: 'Nông dân' },
    { ss_code: '4', ss_vndesc: '04', ss_desc: 'Viên chức' },
    { ss_code: '8', ss_vndesc: '08', ss_desc: 'Hưu trí' },
    { ss_code: '10', ss_vndesc: '10', ss_desc: 'Chính Sách' },
    { ss_code: '100', ss_vndesc: '17', ss_desc: 'Dịch vụ và tính toán' }, // 17360 -> 17
    { ss_code: '814', ss_vndesc: '01', ss_desc: 'Lực lượng quân đội' },
    { ss_code: '824', ss_vndesc: '02', ss_desc: 'Lực lượng công an' },
    { ss_code: '834', ss_vndesc: '03', ss_desc: 'Cơ yếu và lực lượng vũ trang khác' },
    { ss_code: '990', ss_vndesc: '22', ss_desc: 'Nhà chuyên môn về sức khỏe' },
    { ss_code: '1000', ss_vndesc: '22', ss_desc: 'Bác sỹ phụ tá' }, // 2240 -> 22
    { ss_code: '1005', ss_vndesc: '22', ss_desc: 'Dược sỹ' }, // 2262 -> 22
    { ss_code: '1012', ss_vndesc: '23', ss_desc: 'Nhà chuyên môn về giảng dạy' },
    { ss_code: '1471', ss_vndesc: '83', ss_desc: 'Lái xe và thợ vận hành thiết bị chuyển động' }
];

function seedStaticOccupations() {
    occRawVndescTo2Digits.set('17360', '17');
    occRawVndescTo2Digits.set('2240', '22');
    occRawVndescTo2Digits.set('2262', '22');

    for (const occ of STATIC_OCCUPATIONS) {
        let v = occ.ss_vndesc.trim();
        if (v.length >= 2) v = v.slice(0, 2);
        else if (v.length === 1) v = '0' + v;

        occCodeToVndesc.set(occ.ss_code, v);
        occVndescSet.add(v);
        occRawVndescTo2Digits.set(occ.ss_vndesc, v);
        occNameToVndesc.set(occ.ss_desc.toLowerCase().trim(), v);
        const norm = normalizeName(occ.ss_desc);
        if (norm) occNameToVndesc.set(norm, v);
    }
}
seedStaticOccupations();

// Standard 63 Provinces / Cities baseline fallback (Pre-populated so offline/tests work instantly)
const STATIC_PROVINCES: Array<{ sp_id: number; sp_id_bh: string; sp_name: string }> = [
    { sp_id: 201, sp_id_bh: '01', sp_name: 'Thành phố Hà Nội' },
    { sp_id: 202, sp_id_bh: '02', sp_name: 'Hà Giang' },
    { sp_id: 204, sp_id_bh: '04', sp_name: 'Cao Bằng' },
    { sp_id: 206, sp_id_bh: '06', sp_name: 'Bắc Kạn' },
    { sp_id: 208, sp_id_bh: '08', sp_name: 'Tuyên Quang' },
    { sp_id: 210, sp_id_bh: '10', sp_name: 'Lào Cai' },
    { sp_id: 211, sp_id_bh: '11', sp_name: 'Điện Biên' },
    { sp_id: 212, sp_id_bh: '12', sp_name: 'Lai Châu' },
    { sp_id: 214, sp_id_bh: '14', sp_name: 'Sơn La' },
    { sp_id: 215, sp_id_bh: '15', sp_name: 'Yên Bái' },
    { sp_id: 217, sp_id_bh: '17', sp_name: 'Hòa Bình' },
    { sp_id: 219, sp_id_bh: '19', sp_name: 'Thái Nguyên' },
    { sp_id: 220, sp_id_bh: '20', sp_name: 'Lạng Sơn' },
    { sp_id: 222, sp_id_bh: '22', sp_name: 'Quảng Ninh' },
    { sp_id: 224, sp_id_bh: '24', sp_name: 'Bắc Giang' },
    { sp_id: 225, sp_id_bh: '25', sp_name: 'Phú Thọ' },
    { sp_id: 226, sp_id_bh: '26', sp_name: 'Vĩnh Phúc' },
    { sp_id: 227, sp_id_bh: '27', sp_name: 'Bắc Ninh' },
    { sp_id: 230, sp_id_bh: '30', sp_name: 'Hải Dương' },
    { sp_id: 231, sp_id_bh: '31', sp_name: 'Thành phố Hải Phòng' },
    { sp_id: 233, sp_id_bh: '33', sp_name: 'Hưng Yên' },
    { sp_id: 234, sp_id_bh: '34', sp_name: 'Thái Bình' },
    { sp_id: 235, sp_id_bh: '35', sp_name: 'Hà Nam' },
    { sp_id: 236, sp_id_bh: '36', sp_name: 'Nam Định' },
    { sp_id: 237, sp_id_bh: '37', sp_name: 'Ninh Bình' },
    { sp_id: 238, sp_id_bh: '38', sp_name: 'Thanh Hóa' },
    { sp_id: 240, sp_id_bh: '40', sp_name: 'Nghệ An' },
    { sp_id: 242, sp_id_bh: '42', sp_name: 'Hà Tĩnh' },
    { sp_id: 244, sp_id_bh: '44', sp_name: 'Quảng Bình' },
    { sp_id: 245, sp_id_bh: '45', sp_name: 'Quảng Trị' },
    { sp_id: 246, sp_id_bh: '46', sp_name: 'Thừa Thiên Huế' },
    { sp_id: 248, sp_id_bh: '48', sp_name: 'Thành phố Đà Nẵng' },
    { sp_id: 249, sp_id_bh: '49', sp_name: 'Quảng Nam' },
    { sp_id: 251, sp_id_bh: '51', sp_name: 'Quảng Ngãi' },
    { sp_id: 252, sp_id_bh: '52', sp_name: 'Bình Định' },
    { sp_id: 254, sp_id_bh: '54', sp_name: 'Phú Yên' },
    { sp_id: 256, sp_id_bh: '56', sp_name: 'Khánh Hòa' },
    { sp_id: 258, sp_id_bh: '58', sp_name: 'Ninh Thuận' },
    { sp_id: 260, sp_id_bh: '60', sp_name: 'Bình Thuận' },
    { sp_id: 262, sp_id_bh: '62', sp_name: 'Kon Tum' },
    { sp_id: 264, sp_id_bh: '64', sp_name: 'Gia Lai' },
    { sp_id: 266, sp_id_bh: '66', sp_name: 'Đắk Lắk' },
    { sp_id: 267, sp_id_bh: '67', sp_name: 'Đắk Nông' },
    { sp_id: 268, sp_id_bh: '68', sp_name: 'Lâm Đồng' },
    { sp_id: 270, sp_id_bh: '70', sp_name: 'Bình Phước' },
    { sp_id: 272, sp_id_bh: '72', sp_name: 'Tây Ninh' },
    { sp_id: 274, sp_id_bh: '74', sp_name: 'Bình Dương' },
    { sp_id: 275, sp_id_bh: '75', sp_name: 'Đồng Nai' },
    { sp_id: 277, sp_id_bh: '77', sp_name: 'Bà Rịa - Vũng Tàu' },
    { sp_id: 279, sp_id_bh: '79', sp_name: 'Thành phố Hồ Chí Minh' },
    { sp_id: 280, sp_id_bh: '80', sp_name: 'Long An' },
    { sp_id: 282, sp_id_bh: '82', sp_name: 'Tiền Giang' },
    { sp_id: 283, sp_id_bh: '83', sp_name: 'Bến Tre' },
    { sp_id: 284, sp_id_bh: '84', sp_name: 'Trà Vinh' },
    { sp_id: 286, sp_id_bh: '86', sp_name: 'Vĩnh Long' },
    { sp_id: 287, sp_id_bh: '87', sp_name: 'Đồng Tháp' },
    { sp_id: 289, sp_id_bh: '89', sp_name: 'An Giang' },
    { sp_id: 291, sp_id_bh: '91', sp_name: 'Kiên Giang' },
    { sp_id: 292, sp_id_bh: '92', sp_name: 'Thành phố Cần Thơ' },
    { sp_id: 293, sp_id_bh: '93', sp_name: 'Hậu Giang' },
    { sp_id: 294, sp_id_bh: '94', sp_name: 'Sóc Trăng' },
    { sp_id: 295, sp_id_bh: '95', sp_name: 'Bạc Liêu' },
    { sp_id: 296, sp_id_bh: '96', sp_name: 'Cà Mau' },
];

// Helper: Normalize string for name lookup
function normalizeName(str: string): string {
    return String(str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/^(tinh|thanh pho|tp\.?|xa|phuong|thi tran|tt\.?)\s+/i, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// Seed baseline static data
function seedStaticProvinces(): void {
    for (const p of STATIC_PROVINCES) {
        const bhCode = p.sp_id_bh.padStart(2, '0');
        provIdToBh.set(String(p.sp_id), bhCode);
        provIdToBh.set(bhCode, bhCode);
        provBhCodes.add(bhCode);
        
        provIdToName.set(String(p.sp_id), p.sp_name);
        provIdToName.set(bhCode, p.sp_name);

        const norm = normalizeName(p.sp_name);
        if (norm) provNameToBh.set(norm, bhCode);
        provNameToBh.set(p.sp_name.toLowerCase().trim(), bhCode);
    }
}
seedStaticProvinces();

/**
 * Initialize / Refresh administrative catalog from database tables:
 * - SELECT sp_id, sp_id_bh, sp_name FROM sys_prov WHERE sp_isactive = 'Y'
 * - SELECT sv_id, sv_id_bh, sv_name, sv_provid FROM sys_vill WHERE sv_isactive = 'Y'
 */
export async function initAdministrativeCatalog(): Promise<void> {
    try {
        // 1. Load sys_prov
        const provRes = await query(`
            SELECT sp_id, sp_id_bh, sp_name, sp_isactive 
            FROM sys_prov 
            ORDER BY (CASE WHEN sp_isactive = 'Y' THEN 1 ELSE 2 END) ASC
        `);
        
        for (const row of provRes.rows) {
            const rawBh = String(row.sp_id_bh || '').trim();
            const spIdStr = String(row.sp_id || '').trim();
            const spName = String(row.sp_name || '').trim();
            
            // Format BH code (2 digits)
            let bhCode = rawBh;
            if (bhCode && bhCode.length === 1) bhCode = '0' + bhCode;
            if (!bhCode && spIdStr.length <= 2) bhCode = spIdStr.padStart(2, '0');
            
            if (bhCode) {
                if (spIdStr) provIdToBh.set(spIdStr, bhCode);
                provIdToBh.set(bhCode, bhCode);
                provBhCodes.add(bhCode);
                
                if (spName) {
                    if (spIdStr) provIdToName.set(spIdStr, spName);
                    provIdToName.set(bhCode, spName);

                    provNameToBh.set(spName.toLowerCase().trim(), bhCode);
                    const norm = normalizeName(spName);
                    if (norm) provNameToBh.set(norm, bhCode);
                }
            }
        }

        // 2. Load sys_vill
        const villRes = await query(`
            SELECT sv_id, sv_id_bh, sv_name, sv_provid, sv_isactive 
            FROM sys_vill 
            ORDER BY (CASE WHEN sv_isactive = 'Y' THEN 1 ELSE 2 END) ASC
        `);
        
        for (const row of villRes.rows) {
            const rawBh = String(row.sv_id_bh || '').trim();
            const svIdStr = String(row.sv_id || '').trim();
            const svName = String(row.sv_name || '').trim();
            
            // Format BH code (5 digits)
            let bhCode = rawBh;
            if (bhCode && bhCode.length < 5) bhCode = bhCode.padStart(5, '0');
            if (!bhCode && svIdStr.length === 5) bhCode = svIdStr;
            
            if (bhCode) {
                if (svIdStr) villIdToBh.set(svIdStr, bhCode);
                villIdToBh.set(bhCode, bhCode);
                villBhCodes.add(bhCode);
                
                if (svName) {
                    if (svIdStr) villIdToName.set(svIdStr, svName);
                    villIdToName.set(bhCode, svName);

                    villNameToBh.set(svName.toLowerCase().trim(), bhCode);
                    const norm = normalizeName(svName);
                    if (norm) villNameToBh.set(norm, bhCode);
                }
            }
        }

        // 3. Load sys_sel (sys_occupation)
        try {
            const occRes = await query(`
                SELECT trim(ss_code) as code, trim(ss_vndesc) as vndesc, trim(ss_desc) as name
                FROM sys_sel 
                WHERE trim(ss_id) = 'sys_occupation'
            `);
            for (const row of occRes.rows) {
                const code = String(row.code || '').trim();
                const rawVndesc = String(row.vndesc || '').trim();
                const name = String(row.name || '').trim();

                // Lấy 2 ký tự đầu tiên của mã nghề nghiệp vào XML khi gửi cổng (VD: 120034 -> 12, 17360 -> 17)
                let vndesc2 = '';
                const digits = rawVndesc.replace(/\D/g, '');
                if (digits.length >= 2) {
                    vndesc2 = digits.slice(0, 2);
                } else if (digits.length === 1) {
                    vndesc2 = '0' + digits;
                }

                if (code && vndesc2) {
                    occCodeToVndesc.set(code, vndesc2);
                    occVndescSet.add(vndesc2);
                    if (rawVndesc) {
                        occRawVndescTo2Digits.set(rawVndesc, vndesc2);
                    }
                    if (name) {
                        occNameToVndesc.set(name.toLowerCase().trim(), vndesc2);
                        const norm = normalizeName(name);
                        if (norm) occNameToVndesc.set(norm, vndesc2);
                    }
                }
            }
        } catch (occErr: any) {
            console.warn('⚠️ [AdministrativeCatalog] Lỗi khi tải sys_sel sys_occupation:', occErr?.message);
        }

        isInitialized = true;
        console.log(`✅ [AdministrativeCatalog] Loaded ${provIdToBh.size} province mappings, ${villIdToBh.size} village mappings, and ${occCodeToVndesc.size} occupation mappings.`);
    } catch (error: any) {
        console.warn('⚠️ [AdministrativeCatalog] Lỗi khi tải danh mục sys_prov/sys_vill/sys_occupation từ database, sử dụng fallback cấu hình sẵn:', error?.message);
    }
}

/**
 * Resolve Province Code to official 2-digit sp_id_bh (e.g. '01', '37', '79')
 */
export function resolveProvinceBhCode(rawVal: string | number | null | undefined): string {
    if (rawVal === null || rawVal === undefined) return '01';
    const str = String(rawVal).trim();
    if (!str || str === '0' || str === '00') return '01';

    // 1. Direct ID / Code match
    if (provIdToBh.has(str)) {
        return provIdToBh.get(str)!;
    }

    // 2. Pure digits handling
    const digitsOnly = str.replace(/\D/g, '');
    if (digitsOnly) {
        if (provIdToBh.has(digitsOnly)) {
            return provIdToBh.get(digitsOnly)!;
        }
        if (digitsOnly.length === 1) {
            return '0' + digitsOnly;
        }
        if (digitsOnly.length === 2) {
            return digitsOnly;
        }
        // If 3 digits (like 237, 201), check direct or slice(-2)
        if (digitsOnly.length > 2) {
            const last2 = digitsOnly.slice(-2);
            if (provIdToBh.has(last2)) return provIdToBh.get(last2)!;
            return last2;
        }
    }

    // 3. Name lookup
    const lowerName = str.toLowerCase().trim();
    if (provNameToBh.has(lowerName)) {
        return provNameToBh.get(lowerName)!;
    }
    const norm = normalizeName(str);
    if (norm && provNameToBh.has(norm)) {
        return provNameToBh.get(norm)!;
    }

    return '01';
}

/**
 * Resolve Village/Commune Code to official 5-digit sv_id_bh (e.g. '14428', '23839', '03997')
 */
export function resolveVillageBhCode(rawVal: string | number | null | undefined, _provCode?: string | number): string {
    if (rawVal === null || rawVal === undefined) return '00001';
    const str = String(rawVal).trim();
    if (!str || str === '0' || str === '00000') return '00001';

    // 1. Direct ID / Code match
    if (villIdToBh.has(str)) {
        return villIdToBh.get(str)!;
    }

    // 2. Pure digits handling
    const digitsOnly = str.replace(/\D/g, '');
    if (digitsOnly) {
        if (villIdToBh.has(digitsOnly)) {
            return villIdToBh.get(digitsOnly)!;
        }
        if (digitsOnly.length === 5) {
            return digitsOnly;
        }
        if (digitsOnly.length < 5) {
            return digitsOnly.padStart(5, '0');
        }
        // If > 5 digits (like 23714428, 25223839, 23799999), check if full ID exists or slice last 5
        if (digitsOnly.length > 5) {
            const last5 = digitsOnly.slice(-5);
            if (villIdToBh.has(last5)) return villIdToBh.get(last5)!;
            return last5.padStart(5, '0');
        }
    }

    // 3. Name lookup
    const lowerName = str.toLowerCase().trim();
    if (villNameToBh.has(lowerName)) {
        return villNameToBh.get(lowerName)!;
    }
    const norm = normalizeName(str);
    if (norm && villNameToBh.has(norm)) {
        return villNameToBh.get(norm)!;
    }

    return '00001';
}

/**
 * Resolve Occupation to official 2-digit standard code (01-99 / 00) for XML portal submission.
 * Cổng tiếp nhận chỉ nhận 2 chữ số (01-99, 00).
 * Hàm này lấy 2 ký tự đầu tiên của mã nghề nghiệp vào XML khi gửi cổng (VD: 120034 -> 12, 17360 -> 17).
 */
export function resolveOccupationBhCode(rawVal: string | number | null | undefined): string {
    if (rawVal === null || rawVal === undefined) return '00';
    const str = String(rawVal).trim();
    if (!str || str === '0' || str === '00000') return '00';

    let resolved = '';

    // 1. Direct ss_code match -> returns 2-digit vndesc (e.g. '1539' -> '00', '1471' -> '83', '100' -> '17', '4' -> '04')
    if (occCodeToVndesc.has(str)) {
        resolved = occCodeToVndesc.get(str)!;
    }
    // 2. Direct raw ss_vndesc match (e.g. '17360' -> '17', '2240' -> '22', '120034' -> '12')
    else if (occRawVndescTo2Digits.has(str)) {
        resolved = occRawVndescTo2Digits.get(str)!;
    }
    // 3. Name lookup (e.g. 'Lái xe' -> '83', 'Nông dân' -> '01')
    else {
        const lowerName = str.toLowerCase().trim();
        if (occNameToVndesc.has(lowerName)) {
            resolved = occNameToVndesc.get(lowerName)!;
        } else {
            const norm = normalizeName(str);
            if (norm && occNameToVndesc.has(norm)) {
                resolved = occNameToVndesc.get(norm)!;
            }
        }
    }

    // 4. Nếu chưa tìm thấy trong cache, xử lý trực tiếp dạng số (digitsOnly)
    if (!resolved) {
        const digitsOnly = str.replace(/\D/g, '');
        if (digitsOnly) {
            if (occCodeToVndesc.has(digitsOnly)) {
                resolved = occCodeToVndesc.get(digitsOnly)!;
            } else if (occRawVndescTo2Digits.has(digitsOnly)) {
                resolved = occRawVndescTo2Digits.get(digitsOnly)!;
            } else if (digitsOnly.length >= 2) {
                // Lấy 2 ký tự đầu tiên của mã nghề nghiệp vào XML khi gửi cổng (VD: 120034 -> 12, 17360 -> 17)
                resolved = digitsOnly.slice(0, 2);
            } else if (digitsOnly.length === 1) {
                resolved = '0' + digitsOnly;
            }
        }
    }

    // 5. Chuẩn hóa kết quả cuối cùng đảm bảo luôn đúng 2 chữ số (1-99, 00)
    if (resolved) {
        const digits = resolved.replace(/\D/g, '');
        if (digits.length >= 2) return digits.slice(0, 2);
        if (digits.length === 1) return '0' + digits;
    }

    return '00';
}

/**
 * Resolve Province Code or ID to official Province Name (e.g. '37', '237' -> 'Ninh Bình')
 */
export function resolveProvinceName(rawVal: string | number | null | undefined): string {
    if (rawVal === null || rawVal === undefined) return '';
    const str = String(rawVal).trim();
    if (!str || str === '0' || str === '00') return '';

    if (provIdToName.has(str)) {
        return provIdToName.get(str)!;
    }
    const bhCode = resolveProvinceBhCode(str);
    if (provIdToName.has(bhCode)) {
        return provIdToName.get(bhCode)!;
    }
    return '';
}

/**
 * Resolve Village/Commune Code or ID to Village Name (e.g. '14359', '23714359' -> 'Phường Nam Hoa Lư')
 */
export function resolveVillageName(rawVal: string | number | null | undefined): string {
    if (rawVal === null || rawVal === undefined) return '';
    const str = String(rawVal).trim();
    if (!str || str === '0' || str === '00000') return '';

    if (villIdToName.has(str)) {
        return villIdToName.get(str)!;
    }
    const bhCode = resolveVillageBhCode(str);
    if (villIdToName.has(bhCode)) {
        return villIdToName.get(bhCode)!;
    }
    return '';
}

