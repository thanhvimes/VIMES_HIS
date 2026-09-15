// File: backend/src/services/administrative-catalog.service.ts
import { query } from '../config/database';

// Memory Caches for ultra-fast (O(1)) synchronous lookup during XML generation & sync
const provIdToBh = new Map<string, string>();
const provNameToBh = new Map<string, string>();
const provBhCodes = new Set<string>();

const villIdToBh = new Map<string, string>();
const villNameToBh = new Map<string, string>();
const villBhCodes = new Set<string>();

let isInitialized = false;

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
                    villNameToBh.set(svName.toLowerCase().trim(), bhCode);
                    const norm = normalizeName(svName);
                    if (norm) villNameToBh.set(norm, bhCode);
                }
            }
        }

        isInitialized = true;
        console.log(`✅ [AdministrativeCatalog] Loaded ${provIdToBh.size} province mappings and ${villIdToBh.size} village/commune mappings.`);
    } catch (error: any) {
        console.warn('⚠️ [AdministrativeCatalog] Lỗi khi tải danh mục sys_prov/sys_vill từ database, sử dụng fallback cấu hình sẵn:', error?.message);
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
