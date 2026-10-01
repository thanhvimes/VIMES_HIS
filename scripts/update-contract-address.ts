// ============================================================================
// File: backend/scripts/update-contract-address.ts
// Purpose: Cập nhật thông tin hàng loạt theo gói khám / hợp đồng KSK (his_contract_id / hec_contract_id):
//          1. Địa chỉ, Mã tỉnh, Mã xã/phường (sys_prov, sys_vill, sys_dist)
//          2. Ngày khám (hec_examdate, hee_examdate, hd_admitdate, he_examdate, XML NGAY_VAO/NGAY_KHAM)
//          3. Phòng khám / Khoa phòng (hec_def_roomid, he_roomid, he_deptid)
//          Hỗ trợ chạy độc lập từng option hoặc kết hợp linh hoạt.
// ============================================================================

import { Pool, PoolClient } from 'pg';
import SecurityUtils from '../src/utils/security';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env') });

export interface ParsedArgs {
    contractId: number;
    // Options địa chỉ
    provInput?: string;
    villInput?: string;
    customAddress?: string;
    // Options ngày khám
    examDateInput?: string;
    // Options phòng khám
    roomInput?: string;
    deptInput?: string;
    // Bộ lọc & điều khiển
    onlyMissing: boolean;
    dryRun: boolean;
    docNos?: string[];
    skipContract: boolean;
    skipEmployee: boolean;
    skipPatient: boolean;
    skipDoc: boolean;
    skipExam: boolean;
    skipXml: boolean;
    // Cấu hình DB
    dbHost?: string;
    dbPort?: number;
    dbName?: string;
}

export interface ParsedDateResult {
    dateObj: Date;
    dateYmd: string;      // '2026-09-20'
    timestampStr: string; // '2026-09-20 08:00:00'
    xmlYmd: string;       // '20260920'
    xmlYmdHm: string;     // '202609200800'
}

export interface ResolvedRoom {
    roomId: number;
    deptId: string;
    roomName: string;
    deptName?: string;
    isActive: boolean;
}

// Helper: Normalize string for Vietnamese text search (strip accents & symbols)
export function normalizeText(str: string): string {
    return String(str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// ----------------------------------------------------------------------------
// Helper: Parse Date String to Multiple Standard Formats
// ----------------------------------------------------------------------------
export function parseExamDate(input: string): ParsedDateResult {
    const raw = input.trim();
    let year: number = 0;
    let month: number = 0;
    let day: number = 0;
    let hour = 8;
    let minute = 0;
    let second = 0;

    // 1. DD/MM/YYYY or DD-MM-YYYY (kèm HH:mm:ss nếu có)
    const dmyMatch = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
    // 2. YYYY-MM-DD or YYYY/MM/DD (kèm HH:mm:ss nếu có)
    const ymdMatch = raw.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
    // 3. YYYYMMDD (kèm HHmm nếu có)
    const compactMatch = raw.match(/^(\d{4})(\d{2})(\d{2})(?:(\d{2})(\d{2}))?$/);

    if (dmyMatch) {
        day = parseInt(dmyMatch[1], 10);
        month = parseInt(dmyMatch[2], 10);
        year = parseInt(dmyMatch[3], 10);
        if (dmyMatch[4]) hour = parseInt(dmyMatch[4], 10);
        if (dmyMatch[5]) minute = parseInt(dmyMatch[5], 10);
        if (dmyMatch[6]) second = parseInt(dmyMatch[6], 10);
    } else if (ymdMatch) {
        year = parseInt(ymdMatch[1], 10);
        month = parseInt(ymdMatch[2], 10);
        day = parseInt(ymdMatch[3], 10);
        if (ymdMatch[4]) hour = parseInt(ymdMatch[4], 10);
        if (ymdMatch[5]) minute = parseInt(ymdMatch[5], 10);
        if (ymdMatch[6]) second = parseInt(ymdMatch[6], 10);
    } else if (compactMatch) {
        year = parseInt(compactMatch[1], 10);
        month = parseInt(compactMatch[2], 10);
        day = parseInt(compactMatch[3], 10);
        if (compactMatch[4]) hour = parseInt(compactMatch[4], 10);
        if (compactMatch[5]) minute = parseInt(compactMatch[5], 10);
    } else {
        const parsed = new Date(raw);
        if (isNaN(parsed.getTime())) {
            throw new Error(`Định dạng ngày không hợp lệ: "${raw}". Vui lòng dùng YYYY-MM-DD hoặc DD/MM/YYYY.`);
        }
        year = parsed.getFullYear();
        month = parsed.getMonth() + 1;
        day = parsed.getDate();
        hour = parsed.getHours() || 8;
        minute = parsed.getMinutes() || 0;
        second = parsed.getSeconds() || 0;
    }

    if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
        throw new Error(`Giá trị ngày tháng không hợp lệ: Ngày ${day}/${month}/${year}.`);
    }

    const pad = (n: number) => String(n).padStart(2, '0');
    const dateYmd = `${year}-${pad(month)}-${pad(day)}`;
    const timeHms = `${pad(hour)}:${pad(minute)}:${pad(second)}`;
    const timestampStr = `${dateYmd} ${timeHms}`;
    const xmlYmd = `${year}${pad(month)}${pad(day)}`;
    const xmlYmdHm = `${xmlYmd}${pad(hour)}${pad(minute)}`;
    const dateObj = new Date(year, month - 1, day, hour, minute, second);

    return { dateObj, dateYmd, timestampStr, xmlYmd, xmlYmdHm };
}

// ----------------------------------------------------------------------------
// Helper: Resolve Room & Department from hms_roomlist
// ----------------------------------------------------------------------------
export async function resolveRoom(client: PoolClient, roomInput: string, deptInput?: string): Promise<ResolvedRoom> {
    const trimmedRoom = roomInput.trim();
    const isNum = /^\d+$/.test(trimmedRoom);

    let sql = `
        SELECT r.hrl_id, r.hrl_deptid, r.hrl_name, r.hrl_roomname, r.hrl_active, d.sd_name
        FROM hms_roomlist r
        LEFT JOIN sys_dept d ON d.sd_id = r.hrl_deptid
    `;
    const params: any[] = [];

    if (isNum) {
        params.push(parseInt(trimmedRoom, 10));
        sql += ` WHERE r.hrl_id = $1`;
        if (deptInput && deptInput.trim()) {
            params.push(deptInput.trim().toUpperCase());
            sql += ` AND UPPER(r.hrl_deptid) = $2`;
        }
    } else {
        params.push(`%${trimmedRoom}%`);
        sql += ` WHERE (r.hrl_name ILIKE $1 OR r.hrl_roomname ILIKE $1)`;
        if (deptInput && deptInput.trim()) {
            params.push(deptInput.trim().toUpperCase());
            sql += ` AND UPPER(r.hrl_deptid) = $2`;
        }
    }

    sql += `
        ORDER BY 
            (CASE WHEN r.hrl_active = 'Y' THEN 1 ELSE 2 END) ASC,
            (CASE WHEN r.hrl_deptid IN ('KB', 'KBYC') THEN 1 ELSE 2 END) ASC,
            r.hrl_id ASC
        LIMIT 5;
    `;

    const res = await client.query(sql, params);
    if (res.rows.length === 0) {
        // Gợi ý một số phòng KSK phổ biến nếu không tìm thấy
        const suggRes = await client.query(`
            SELECT r.hrl_id, r.hrl_deptid, r.hrl_name, r.hrl_active 
            FROM hms_roomlist r 
            WHERE r.hrl_active = 'Y' AND (r.hrl_name ILIKE '%khám%' OR r.hrl_name ILIKE '%ksk%')
            LIMIT 6
        `);
        console.log(`\n💡 GỢI Ý CÁC PHÒNG KHÁM KHẢ DỤNG:`);
        console.table(suggRes.rows.map(r => ({
            id: r.hrl_id,
            khoa: r.hrl_deptid,
            ten_phong: r.hrl_name
        })));
        throw new Error(`Không tìm thấy phòng khám phù hợp với từ khóa/mã "${roomInput}"${deptInput ? ` tại khoa "${deptInput}"` : ''} trong hms_roomlist.`);
    }

    const row = res.rows[0];
    return {
        roomId: row.hrl_id,
        deptId: row.hrl_deptid,
        roomName: row.hrl_name || row.hrl_roomname || `Phòng ${row.hrl_id}`,
        deptName: row.sd_name || row.hrl_deptid,
        isActive: row.hrl_active === 'Y'
    };
}

// ----------------------------------------------------------------------------
// Helper: Parse CLI Arguments
// ----------------------------------------------------------------------------
export function parseArgs(): ParsedArgs {
    const rawArgs = process.argv.slice(2);
    const flags: Record<string, string | boolean> = {};
    const positionals: string[] = [];

    for (const arg of rawArgs) {
        if (arg.startsWith('--')) {
            const eqIdx = arg.indexOf('=');
            if (eqIdx !== -1) {
                const key = arg.slice(2, eqIdx).toLowerCase();
                const val = arg.slice(eqIdx + 1);
                flags[key] = val;
            } else {
                const key = arg.slice(2).toLowerCase();
                flags[key] = true;
            }
        } else {
            positionals.push(arg);
        }
    }

    // 1. Contract ID
    const rawContract = flags['contract'] || flags['contract-id'] || positionals[0];
    if (!rawContract) {
        printUsageAndExit('Thiếu tham số ID gói khám / hợp đồng (--contract=<id> hoặc tham số thứ 1).');
    }
    const contractId = parseInt(String(rawContract), 10);
    if (isNaN(contractId) || contractId <= 0) {
        printUsageAndExit(`ID hợp đồng không hợp lệ: "${rawContract}". Phải là một số nguyên dương.`);
    }

    // 2. Options Địa chỉ
    let provInput = flags['province'] || flags['prov'] || flags['matinh'] ? String(flags['province'] || flags['prov'] || flags['matinh']).trim() : undefined;
    let villInput = flags['ward'] || flags['vill'] || flags['village'] || flags['maxa'] ? String(flags['ward'] || flags['vill'] || flags['village'] || flags['maxa']).trim() : undefined;
    let customAddress = flags['address'] || flags['addr'] ? String(flags['address'] || flags['addr']).trim() : undefined;

    // 3. Options Ngày khám
    const rawDate = flags['date'] || flags['exam-date'] || flags['ngay-kham'] || flags['ngay'];
    const examDateInput = rawDate ? String(rawDate).trim() : undefined;

    // 4. Options Phòng khám & Khoa
    const rawRoom = flags['room'] || flags['room-id'] || flags['phong'] || flags['maphong'];
    const roomInput = rawRoom ? String(rawRoom).trim() : undefined;
    const rawDept = flags['dept'] || flags['dept-id'] || flags['khoa'];
    const deptInput = rawDept ? String(rawDept).trim() : undefined;

    // Xử lý các tham số vị trí linh hoạt (tương thích ngược)
    if (positionals.length >= 2) {
        // Trường hợp: <contract_id> <address>
        if (positionals.length === 2 && !provInput && !villInput && !customAddress && !examDateInput && !roomInput) {
            customAddress = positionals[1].trim();
        } 
        // Trường hợp: <contract_id> <prov> <ward> [address]
        else if (positionals.length >= 3 && !provInput && !villInput) {
            provInput = positionals[1].trim();
            villInput = positionals[2].trim();
            if (positionals[3] && !customAddress) {
                customAddress = positionals[3].trim();
            }
        }
    }

    // Kiểm tra tính hợp lệ tối thiểu: Phải có ít nhất 1 option cần cập nhật
    if (!provInput && !villInput && !customAddress && !examDateInput && !roomInput) {
        printUsageAndExit('Bạn cần chỉ định ít nhất một thông tin cần cập nhật: Ngày khám (--date), Phòng khám (--room), hoặc Địa chỉ (--address / --province & --ward).');
    }

    // Filter modes
    const allFlag = Boolean(flags['all']);
    const onlyMissing = allFlag ? false : Boolean(flags['only-missing'] || (!allFlag && Boolean(customAddress || provInput || villInput)));
    const dryRun = Boolean(flags['dry-run'] || flags['dryrun'] || flags['simulate']);

    // Doc Nos filter
    let docNos: string[] | undefined;
    if (flags['doc-nos'] || flags['docnos']) {
        const rawList = String(flags['doc-nos'] || flags['docnos']);
        docNos = rawList.split(',').map(s => s.trim()).filter(Boolean);
    }

    // Skip flags
    const skipContract = Boolean(flags['skip-contract']);
    const skipEmployee = Boolean(flags['skip-employee']);
    const skipPatient = Boolean(flags['skip-patient']);
    const skipDoc = Boolean(flags['skip-doc']);
    const skipExam = Boolean(flags['skip-exam']);
    const skipXml = Boolean(flags['skip-xml']);

    // DB overrides
    const dbHost = flags['host'] || flags['db-host'] ? String(flags['host'] || flags['db-host']) : undefined;
    const dbPort = flags['port'] || flags['db-port'] ? parseInt(String(flags['port'] || flags['db-port']), 10) : undefined;
    const dbName = flags['db'] || flags['db-name'] ? String(flags['db'] || flags['db-name']) : undefined;

    return {
        contractId,
        provInput,
        villInput,
        customAddress: customAddress && customAddress.trim() ? customAddress.trim() : undefined,
        examDateInput,
        roomInput,
        deptInput,
        onlyMissing,
        dryRun,
        docNos,
        skipContract,
        skipEmployee,
        skipPatient,
        skipDoc,
        skipExam,
        skipXml,
        dbHost,
        dbPort,
        dbName
    };
}

export function printUsageAndExit(errMsg?: string): never {
    if (errMsg) {
        console.error(`\n❌ LỖI: ${errMsg}\n`);
    }
    console.log(`================================================================================`);
    console.log(` CÔNG CỤ CẬP NHẬT HỢP ĐỒNG / GÓI KHÁM SỨC KHỎE ĐA NĂNG (VIMES HIS)`);
    console.log(`================================================================================`);
    console.log(`Cú pháp sử dụng:`);
    console.log(`  npx ts-node scripts/update-contract-address.ts --contract=<id> [options]\n`);
    console.log(`Các tùy chọn cập nhật (chạy độc lập hoặc kết hợp):`);
    console.log(`  1. CẬP NHẬT NGÀY KHÁM:`);
    console.log(`     --date="2026-09-20"        : Cập nhật ngày khám dạng YYYY-MM-DD`);
    console.log(`     --date="20/09/2026"        : Hỗ trợ cả định dạng DD/MM/YYYY`);
    console.log(`     --date="2026-09-20 08:30"  : Hỗ trợ chỉ định cả giờ phút tiếp nhận/khám\n`);
    console.log(`  2. CẬP NHẬT MÃ PHÒNG KHÁM:`);
    console.log(`     --room=551                 : Cập nhật theo mã phòng hrl_id (VD: 551 - KSK Toàn Dân)`);
    console.log(`     --room="Khám Hợp Đồng"     : Tự động tra cứu phòng theo tên phòng`);
    console.log(`     --dept=KBYC                : (Tùy chọn) Chỉ định mã khoa của phòng khám\n`);
    console.log(`  3. CẬP NHẬT ĐỊA CHỈ:`);
    console.log(`     --address="Yên Mô, Ninh Bình" : Tự động nhận diện Tỉnh/Xã/Quận từ văn bản`);
    console.log(`     --province=37 --ward=14701    : Truyền trực tiếp mã tỉnh & mã xã BHYT\n`);
    console.log(`Các chế độ chạy & bộ lọc:`);
    console.log(`  --dry-run             : Chạy mô phỏng, xem trước danh sách tác động, KHÔNG lưu DB`);
    console.log(`  --all                 : Cập nhật tất cả hồ sơ trong hợp đồng`);
    console.log(`  --only-missing        : Chỉ cập nhật các bản ghi còn trống thông tin`);
    console.log(`  --doc-nos=<1,2,3>     : Chỉ cập nhật cho danh sách số hồ sơ cụ thể`);
    console.log(`  --skip-contract       : Bỏ qua bảng hợp đồng hms_exm_contract`);
    console.log(`  --skip-employee       : Bỏ qua bảng nhân viên hms_exm_employee`);
    console.log(`  --skip-patient        : Bỏ qua bảng bệnh nhân hms_patient`);
    console.log(`  --skip-doc            : Bỏ qua bảng tiếp nhận hms_doc`);
    console.log(`  --skip-exam           : Bỏ qua bảng khám bệnh hms_exam`);
    console.log(`  --skip-xml            : Bỏ qua cập nhật thẻ XML trong health_check_masters\n`);
    console.log(`Ví dụ mẫu:`);
    console.log(`  # Cập nhật ngày khám sang 20/09/2026:`);
    console.log(`  npx ts-node scripts/update-contract-address.ts --contract=160 --date="2026-09-20"`);
    console.log(`  # Cập nhật phòng khám sang phòng 551:`);
    console.log(`  npx ts-node scripts/update-contract-address.ts --contract=160 --room=551`);
    console.log(`  # Kết hợp cả Ngày khám, Phòng khám và Địa chỉ (chạy thử mô phỏng):`);
    console.log(`  npx ts-node scripts/update-contract-address.ts --contract=160 --date="2026-09-20" --room=551 --address="Yên Mô, Ninh Bình" --dry-run\n`);
    process.exit(errMsg ? 1 : 0);
}

// ----------------------------------------------------------------------------
// DB Connection Helper
// ----------------------------------------------------------------------------
export async function createDatabasePool(parsed: ParsedArgs): Promise<Pool> {
    const rawUser = process.env.DB_USER || '';
    const rawPassword = process.env.DB_PASSWORD || '';
    const dbUser = SecurityUtils.resolveSecret(rawUser);
    const dbPassword = SecurityUtils.resolveSecret(rawPassword);

    let host = parsed.dbHost || process.env.DB_HOST || '14.177.232.29';
    let port = parsed.dbPort || parseInt(process.env.DB_PORT || '8050', 10);
    let database = parsed.dbName || process.env.DB_NAME || 'vimes_nb';

    console.log(`\n🔌 Đang kết nối Cơ sở dữ liệu: ${host}:${port}/${database} (User: ${dbUser ? '[SECURED]' : 'NONE'})...`);

    let pool = new Pool({
        user: dbUser,
        password: dbPassword,
        host,
        port,
        database,
        connectionTimeoutMillis: 7000
    });

    try {
        const testClient = await pool.connect();
        testClient.release();
        console.log(`✅ Kết nối Database thành công!`);
        return pool;
    } catch (err: any) {
        console.warn(`⚠️ Không thể kết nối tới ${host}:${port}/${database}: ${err.message}`);
        if (host === '192.168.0.200' && !parsed.dbHost) {
            console.log(`🔄 Tự động chuyển sang máy chủ từ xa 14.177.232.29:8050/vimes_nb...`);
            await pool.end().catch(() => {});
            host = '14.177.232.29';
            port = 8050;
            database = 'vimes_nb';
            pool = new Pool({
                user: dbUser,
                password: dbPassword,
                host,
                port,
                database,
                connectionTimeoutMillis: 7000
            });
            const fallbackClient = await pool.connect();
            fallbackClient.release();
            console.log(`✅ Kết nối thành công máy chủ từ xa ${host}:${port}/${database}!`);
            return pool;
        }
        throw err;
    }
}

// ----------------------------------------------------------------------------
// XML Data Updater Helper (Address + Date Tags)
// ----------------------------------------------------------------------------
export function updateXmlDataTags(
    xml: string, 
    provBhCode?: string, 
    villBhCode?: string, 
    addressStr?: string,
    examDate?: ParsedDateResult
): string {
    let updated = xml;
    const escapeXml = (str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // 1. MATINH_CU_TRU (nếu có mã tỉnh)
    if (provBhCode) {
        if (updated.includes('<MATINH_CU_TRU>')) {
            updated = updated.replace(/<MATINH_CU_TRU>(.*?)<\/MATINH_CU_TRU>/g, `<MATINH_CU_TRU>${provBhCode}</MATINH_CU_TRU>`);
        } else if (updated.includes('</THONG_TIN_HANH_CHINH>')) {
            updated = updated.replace('</THONG_TIN_HANH_CHINH>', `\t<MATINH_CU_TRU>${provBhCode}</MATINH_CU_TRU>\n\t\t\t\t\t\t</THONG_TIN_HANH_CHINH>`);
        }
    }

    // 2. MAXA_CU_TRU (nếu có mã xã)
    if (villBhCode) {
        if (updated.includes('<MAXA_CU_TRU>')) {
            updated = updated.replace(/<MAXA_CU_TRU>(.*?)<\/MAXA_CU_TRU>/g, `<MAXA_CU_TRU>${villBhCode}</MAXA_CU_TRU>`);
        } else if (updated.includes('</THONG_TIN_HANH_CHINH>')) {
            updated = updated.replace('</THONG_TIN_HANH_CHINH>', `\t<MAXA_CU_TRU>${villBhCode}</MAXA_CU_TRU>\n\t\t\t\t\t\t</THONG_TIN_HANH_CHINH>`);
        }
    }

    // 3. DIA_CHI (nếu có chuỗi địa chỉ)
    if (addressStr) {
        const escapedAddr = escapeXml(addressStr);
        if (updated.includes('<DIA_CHI>')) {
            updated = updated.replace(/<DIA_CHI>(.*?)<\/DIA_CHI>/g, (m, oldAddr) => {
                if (!oldAddr || oldAddr.trim() === '' || oldAddr.trim() === 'Ninh Bình' || oldAddr.trim() === 'Hà Nội') {
                    return `<DIA_CHI>${escapedAddr}</DIA_CHI>`;
                }
                return m;
            });
        } else if (updated.includes('</THONG_TIN_HANH_CHINH>')) {
            updated = updated.replace('</THONG_TIN_HANH_CHINH>', `\t<DIA_CHI>${escapedAddr}</DIA_CHI>\n\t\t\t\t\t\t</THONG_TIN_HANH_CHINH>`);
        }
    }

    // 4. NGAY_VAO, NGAY_KHAM, NGAYLAP (nếu có ngày khám mới)
    if (examDate) {
        // NGAY_VAO: định dạng chuẩn là YYYYMMDDHHmm
        if (updated.includes('<NGAY_VAO>')) {
            updated = updated.replace(/<NGAY_VAO>(.*?)<\/NGAY_VAO>/g, (_m, oldVal) => {
                const trimmed = String(oldVal || '').trim();
                if (trimmed.length >= 12) {
                    const timePart = trimmed.slice(8); // giữ nguyên HHmm cũ nếu có
                    return `<NGAY_VAO>${examDate.xmlYmd}${timePart}</NGAY_VAO>`;
                } else if (trimmed.length === 8) {
                    return `<NGAY_VAO>${examDate.xmlYmd}</NGAY_VAO>`;
                }
                return `<NGAY_VAO>${examDate.xmlYmdHm}</NGAY_VAO>`;
            });
        }

        // NGAY_KHAM: có thể là YYYYMMDD hoặc YYYY-MM-DD
        if (updated.includes('<NGAY_KHAM>')) {
            updated = updated.replace(/<NGAY_KHAM>(.*?)<\/NGAY_KHAM>/g, (_m, oldVal) => {
                const trimmed = String(oldVal || '').trim();
                if (trimmed.includes('-')) {
                    return `<NGAY_KHAM>${examDate.dateYmd}</NGAY_KHAM>`;
                }
                return `<NGAY_KHAM>${examDate.xmlYmd}</NGAY_KHAM>`;
            });
        }

        // NGAYLAP: định dạng YYYYMMDD
        if (updated.includes('<NGAYLAP>')) {
            updated = updated.replace(/<NGAYLAP>(.*?)<\/NGAYLAP>/g, `<NGAYLAP>${examDate.xmlYmd}</NGAYLAP>`);
        }
    }

    return updated;
}

// ----------------------------------------------------------------------------
// Main Execution
// ----------------------------------------------------------------------------
export async function main() {
    const args = parseArgs();
    const pool = await createDatabasePool(args);
    const client: PoolClient = await pool.connect();

    try {
        console.log(`\n================================================================================`);
        console.log(`📋 THÔNG TIN THỰC THI NÂNG CẤP GÓI KHÁM`);
        console.log(`================================================================================`);
        console.log(`• Gói khám (his_contract_id) : ${args.contractId}`);
        if (args.examDateInput)  console.log(`• Ngày khám chỉ định         : "${args.examDateInput}"`);
        if (args.roomInput)      console.log(`• Phòng khám chỉ định        : "${args.roomInput}"${args.deptInput ? ` (Khoa: ${args.deptInput})` : ''}`);
        if (args.provInput)      console.log(`• Mã tỉnh nhập vào           : "${args.provInput}"`);
        if (args.villInput)      console.log(`• Mã xã/phường nhập vào      : "${args.villInput}"`);
        if (args.customAddress)  console.log(`• Địa chỉ truyền vào         : "${args.customAddress}"`);
        console.log(`• Chế độ cập nhật            : ${args.onlyMissing ? 'Chỉ hồ sơ bị thiếu/trống thông tin' : 'Toàn bộ hồ sơ trong gói'}`);
        console.log(`• Trạng thái Dry-Run         : ${args.dryRun ? 'BẬT (Mô phỏng an toàn - ROLLBACK)' : 'TẮT (Ghi trực tiếp vào DB)'}`);
        if (args.docNos && args.docNos.length > 0) {
            console.log(`• Lọc theo số hồ sơ          : ${args.docNos.join(', ')}`);
        }
        console.log(`================================================================================\n`);

        // Bắt đầu Transaction
        await client.query('BEGIN');

        // 1. Kiểm tra hợp đồng tồn tại
        const contractRes = await client.query(`
            SELECT hec_contract_id, hec_no, hec_date, hec_examdate, hec_def_roomid, hec_desc, hec_description
            FROM hms_exm_contract 
            WHERE hec_contract_id = $1
        `, [args.contractId]);

        if (contractRes.rows.length === 0) {
            const recentRes = await client.query(`
                SELECT hec_contract_id, hec_no, COALESCE(hec_desc, hec_description) as desc, to_char(hec_date, 'YYYY-MM-DD') as hec_date
                FROM hms_exm_contract 
                ORDER BY hec_contract_id DESC 
                LIMIT 8
            `);
            console.error(`❌ Không tìm thấy hợp đồng khám sức khỏe ID = ${args.contractId} trong bảng hms_exm_contract.`);
            console.log(`\n💡 GỢI Ý CÁC GÓI KHÁM GẦN NHẤT TRONG HỆ THỐNG:`);
            console.table(recentRes.rows.map(r => ({
                id: r.hec_contract_id,
                so_hd: r.hec_no || 'N/A',
                ngay_hd: r.hec_date || 'N/A',
                mo_ta: r.desc || ''
            })));
            throw new Error(`Hợp đồng ID = ${args.contractId} không tồn tại.`);
        }
        const contractInfo = contractRes.rows[0];
        console.log(`✅ Hợp đồng hợp lệ: [${contractInfo.hec_contract_id}] Số HĐ: ${contractInfo.hec_no || 'N/A'} - ${contractInfo.hec_desc || contractInfo.hec_description || ''}`);
        console.log(`  (Hiện tại: Ngày khám: ${contractInfo.hec_examdate || 'Chưa đặt'}, Phòng mặc định: ${contractInfo.hec_def_roomid || 'Chưa đặt'})`);

        // 2. Xử lý chuẩn hóa Ngày khám (nếu có)
        let parsedDate: ParsedDateResult | undefined;
        if (args.examDateInput) {
            parsedDate = parseExamDate(args.examDateInput);
            console.log(`\n📅 THÔNG TIN NGÀY KHÁM MỚI:`);
            console.log(`• Ngày (Date)        : ${parsedDate.dateYmd}`);
            console.log(`• Thời điểm (TS)     : ${parsedDate.timestampStr}`);
            console.log(`• Thẻ XML NGAY_VAO   : ${parsedDate.xmlYmdHm}`);
            console.log(`• Thẻ XML NGAY_KHAM  : ${parsedDate.xmlYmd}`);
        }

        // 3. Xử lý chuẩn hóa Phòng khám & Khoa (nếu có)
        let resolvedRoom: ResolvedRoom | undefined;
        if (args.roomInput) {
            resolvedRoom = await resolveRoom(client, args.roomInput, args.deptInput);
            console.log(`\n🏥 THÔNG TIN PHÒNG KHÁM MỚI:`);
            console.log(`• Mã phòng (hrl_id)  : ${resolvedRoom.roomId}`);
            console.log(`• Tên phòng khám     : ${resolvedRoom.roomName}`);
            console.log(`• Mã khoa (dept_id)  : ${resolvedRoom.deptId} (${resolvedRoom.deptName || 'N/A'})`);
            console.log(`• Trạng thái phòng   : ${resolvedRoom.isActive ? 'Đang hoạt động (Active)' : 'Ngừng hoạt động (Inactive)'}`);
        }

        // 4. Xử lý nhận diện Tỉnh / Xã / Địa chỉ (nếu có)
        let spId: number | undefined;
        let spIdBh: string | undefined;
        let spName: string | undefined;

        let svId: number | undefined;
        let svIdBh: string | undefined;
        let svName: string | undefined;
        let svDistId: number = 0;
        let distName: string = '';

        let fullAddress: string = args.customAddress || '';

        if (args.provInput && args.villInput) {
            const provRes = await client.query(`
                SELECT sp_id, sp_id_bh, sp_name 
                FROM sys_prov 
                WHERE sp_id_bh = $1 OR sp_id::text = $1
                ORDER BY (CASE WHEN sp_isactive = 'Y' THEN 1 ELSE 2 END) ASC
                LIMIT 1
            `, [args.provInput]);
            if (provRes.rows.length === 0) {
                throw new Error(`Không tìm thấy mã hoặc ID tỉnh "${args.provInput}" trong bảng sys_prov.`);
            }
            spId = provRes.rows[0].sp_id;
            spIdBh = String(provRes.rows[0].sp_id_bh || '').padStart(2, '0');
            spName = String(provRes.rows[0].sp_name || '').trim();

            const villRes = await client.query(`
                SELECT v.sv_id, v.sv_id_bh, v.sv_name, v.sv_provid, v.sv_distid,
                       d.sd_name, p.sp_name as prov_name
                FROM sys_vill v
                LEFT JOIN sys_dist d ON d.sd_id = v.sv_distid
                LEFT JOIN sys_prov p ON p.sp_id = v.sv_provid
                WHERE v.sv_id_bh = $1 OR v.sv_id::text = $1
                ORDER BY (CASE WHEN v.sv_isactive = 'Y' THEN 1 ELSE 2 END) ASC
                LIMIT 1
            `, [args.villInput]);
            if (villRes.rows.length === 0) {
                throw new Error(`Không tìm thấy mã hoặc ID xã/phường "${args.villInput}" trong bảng sys_vill.`);
            }
            svId = villRes.rows[0].sv_id;
            svIdBh = String(villRes.rows[0].sv_id_bh || '').padStart(5, '0');
            svName = String(villRes.rows[0].sv_name || '').trim();
            svDistId = (villRes.rows[0].sv_distid as number) || 0;
            distName = villRes.rows[0].sd_name ? String(villRes.rows[0].sd_name).trim() : '';

            fullAddress = args.customAddress || [svName, distName, spName].filter(Boolean).join(', ');
        } else if (args.customAddress) {
            console.log(`\n🔍 Đang tự động phân tích danh mục hành chính từ địa chỉ: "${args.customAddress}"...`);
            const normAddr = normalizeText(args.customAddress);

            // Tra cứu Tỉnh
            const allProvsRes = await client.query(`
                SELECT sp_id, sp_id_bh, sp_name, sp_isactive 
                FROM sys_prov 
                ORDER BY (CASE WHEN sp_isactive = 'Y' THEN 1 ELSE 2 END) ASC, LENGTH(sp_name) DESC
            `);

            for (const p of allProvsRes.rows) {
                const normP = normalizeText(p.sp_name).replace(/^(tinh|thanh pho|tp)\s+/, '');
                if (normP.length >= 3 && normAddr.includes(normP)) {
                    spId = p.sp_id;
                    spIdBh = String(p.sp_id_bh || '').padStart(2, '0');
                    spName = String(p.sp_name || '').trim();
                    break;
                }
            }

            // Tra cứu Xã/Phường
            let villQuery = `
                SELECT v.sv_id, v.sv_id_bh, v.sv_name, v.sv_provid, v.sv_distid,
                       d.sd_name, p.sp_name as prov_name, p.sp_id_bh as prov_bh
                FROM sys_vill v
                LEFT JOIN sys_dist d ON d.sd_id = v.sv_distid
                LEFT JOIN sys_prov p ON p.sp_id = v.sv_provid
            `;
            const villQueryParams: any[] = [];
            if (spId && spIdBh) {
                villQuery += ` WHERE (v.sv_provid = $1 OR p.sp_id_bh = $2)`;
                villQueryParams.push(spId, spIdBh);
            } else if (spId) {
                villQuery += ` WHERE v.sv_provid = $1`;
                villQueryParams.push(spId);
            }
            villQuery += ` ORDER BY (CASE WHEN v.sv_isactive = 'Y' THEN 1 ELSE 2 END) ASC, LENGTH(v.sv_name) DESC`;

            const allVillsRes = await client.query(villQuery, villQueryParams);

            for (const v of allVillsRes.rows) {
                const normV = normalizeText(v.sv_name);
                const normVNoPrefix = normV.replace(/^(xa|phuong|thi tran|tt)\s+/, '');
                if ((normV.length >= 4 && normAddr.includes(normV)) || 
                    (normVNoPrefix.length >= 4 && normAddr.includes(normVNoPrefix))) {
                    svId = v.sv_id;
                    svIdBh = String(v.sv_id_bh || '').padStart(5, '0');
                    svName = String(v.sv_name || '').trim();
                    svDistId = (v.sv_distid as number) || 0;
                    distName = v.sd_name ? String(v.sd_name).trim() : '';
                    if (!spId && v.sv_provid) {
                        spId = v.sv_provid;
                        spIdBh = String(v.prov_bh || '').padStart(2, '0');
                        spName = String(v.prov_name || '').trim();
                    }
                    break;
                }
            }
        }

        if (spId || fullAddress) {
            console.log(`\n📍 KẾT QUẢ XỬ LÝ ĐỊA CHỈ:`);
            if (spId && svId) {
                console.log(`• Tỉnh/Thành phố : [ID: ${spId}] Mã BHYT: "${spIdBh}" - ${spName}`);
                console.log(`• Xã/Phường/TT   : [ID: ${svId}] Mã BHYT: "${svIdBh}" - ${svName}`);
                if (distName) console.log(`• Quận/Huyện     : [ID: ${svDistId}] ${distName}`);
                console.log(`• Chuỗi địa chỉ  : "${fullAddress}"`);
            } else if (spId) {
                console.log(`• Tỉnh/Thành phố : [ID: ${spId}] Mã BHYT: "${spIdBh}" - ${spName} (Không tìm thấy xã trong danh mục)`);
                console.log(`• Chuỗi địa chỉ  : "${fullAddress}"`);
            } else {
                console.log(`• Chuỗi địa chỉ tự do: "${fullAddress}" (Không tra cứu mã danh mục)`);
            }
        }

        // 5. Cập nhật Bảng Hợp Đồng (hms_exm_contract)
        let contractUpdated = false;
        if (!args.skipContract && (parsedDate || resolvedRoom)) {
            const setClauses: string[] = [];
            const setParams: any[] = [];

            if (parsedDate) {
                setParams.push(parsedDate.dateYmd);
                setClauses.push(`hec_examdate = $${setParams.length}`);
                // Đồng thời cập nhật ngày tạo/kết hợp đồng nếu đang trống
                setClauses.push(`hec_date = COALESCE(hec_date, $${setParams.length})`);
            }
            if (resolvedRoom) {
                setParams.push(resolvedRoom.roomId);
                setClauses.push(`hec_def_roomid = $${setParams.length}`);
            }

            setParams.push(args.contractId);
            const contractUpdateSql = `
                UPDATE hms_exm_contract
                SET ${setClauses.join(', ')}
                WHERE hec_contract_id = $${setParams.length}
            `;
            await client.query(contractUpdateSql, setParams);
            contractUpdated = true;
            console.log(`\n📝 [hms_exm_contract] Đã cập nhật hợp đồng #${args.contractId} (Ngày khám: ${parsedDate ? parsedDate.dateYmd : 'Giữ nguyên'}, Phòng mặc định: ${resolvedRoom ? resolvedRoom.roomId : 'Giữ nguyên'}).`);
        }

        // 6. Lấy danh sách nhân viên trong hợp đồng cần cập nhật
        let empSql = `
            SELECT hee_employee_id, hee_patientno, hee_docno, hee_surname, hee_midname, hee_firstname,
                   hee_provid, hee_villid, hee_address, hee_prov_code, hee_vill_code,
                   to_char(hee_examdate, 'YYYY-MM-DD HH24:MI:SS') as hee_examdate
            FROM hms_exm_employee
            WHERE hee_contract_id = $1
        `;
        const empParams: any[] = [args.contractId];

        if (args.docNos && args.docNos.length > 0) {
            empParams.push(args.docNos);
            empSql += ` AND (hee_docno = ANY($${empParams.length}::int[]) OR hee_employee_id::text = ANY($${empParams.length}::text[]))`;
        }

        // Bộ lọc onlyMissing nếu được kích hoạt
        if (args.onlyMissing) {
            const missingConditions: string[] = [];
            if (fullAddress || spId) {
                if (spId && svId) {
                    missingConditions.push(`(hee_provid IS NULL OR hee_provid = 0 OR hee_villid IS NULL OR hee_villid = 0 OR hee_address IS NULL OR TRIM(hee_address) = '')`);
                } else {
                    missingConditions.push(`(hee_address IS NULL OR TRIM(hee_address) = '')`);
                }
            }
            if (parsedDate) {
                missingConditions.push(`(hee_examdate IS NULL)`);
            }
            if (missingConditions.length > 0) {
                empSql += ` AND (${missingConditions.join(' OR ')})`;
            }
        }

        empSql += ` ORDER BY hee_employee_id ASC`;

        const empRes = await client.query(empSql, empParams);
        const totalEmpFound = empRes.rows.length;

        console.log(`\n🔎 Tìm thấy ${totalEmpFound} hồ sơ nhân viên mục tiêu trong hms_exm_employee.`);

        const targetEmpIds = empRes.rows.map(r => r.hee_employee_id);
        const targetPatientNos = empRes.rows.map(r => r.hee_patientno).filter((p): p is number => p !== null && p > 0);
        const targetDocNos = empRes.rows.map(r => r.hee_docno).filter((d): d is number => d !== null && d > 0);

        if (totalEmpFound > 0) {
            console.log(`👁️ Xem trước 5 hồ sơ tác động:`);
            console.table(empRes.rows.slice(0, 5).map(r => ({
                emp_id: r.hee_employee_id,
                ho_ten: [r.hee_surname, r.hee_midname, r.hee_firstname].filter(Boolean).join(' '),
                docno: r.hee_docno || '(Chưa tiếp nhận)',
                ngay_kham_cu: r.hee_examdate || '(Trống)',
                addr_cu: r.hee_address || '(Trống)'
            })));
        }

        // 7. Cập nhật bảng nhân viên (hms_exm_employee)
        let updatedEmpCount = 0;
        if (!args.skipEmployee && targetEmpIds.length > 0) {
            const empSets: string[] = ['hee_updateddate = NOW()'];
            const empSetParams: any[] = [];

            // Cập nhật ngày khám cho nhân viên
            if (parsedDate) {
                empSetParams.push(parsedDate.timestampStr);
                empSets.push(`hee_examdate = $${empSetParams.length}`);
            }

            // Cập nhật địa chỉ cho nhân viên
            if (spId && svId) {
                empSetParams.push(spId, svDistId, svId, spIdBh, svIdBh, fullAddress);
                const baseIdx = empSetParams.length - 6;
                empSets.push(`hee_provid = $${baseIdx + 1}`);
                empSets.push(`hee_distid = COALESCE(NULLIF($${baseIdx + 2}, 0), hee_distid, 0)`);
                empSets.push(`hee_villid = $${baseIdx + 3}`);
                empSets.push(`hee_prov_code = $${baseIdx + 4}`);
                empSets.push(`hee_vill_code = $${baseIdx + 5}`);
                empSets.push(`hee_address = COALESCE(NULLIF(TRIM(hee_address), ''), $${baseIdx + 6})`);
            } else if (spId) {
                empSetParams.push(spId, spIdBh, fullAddress);
                const baseIdx = empSetParams.length - 3;
                empSets.push(`hee_provid = $${baseIdx + 1}`);
                empSets.push(`hee_prov_code = $${baseIdx + 2}`);
                empSets.push(`hee_address = COALESCE(NULLIF(TRIM(hee_address), ''), $${baseIdx + 3})`);
            } else if (fullAddress) {
                empSetParams.push(fullAddress);
                empSets.push(`hee_address = COALESCE(NULLIF(TRIM(hee_address), ''), $${empSetParams.length})`);
            }

            empSetParams.push(targetEmpIds);
            const updateEmpSql = `
                UPDATE hms_exm_employee
                SET ${empSets.join(', ')}
                WHERE hee_employee_id = ANY($${empSetParams.length}::int[])
            `;
            const updateEmpRes = await client.query(updateEmpSql, empSetParams);
            updatedEmpCount = updateEmpRes.rowCount || 0;
            console.log(`📝 [hms_exm_employee] Đã cập nhật: ${updatedEmpCount} bản ghi.`);
        }

        // 8. Cập nhật bảng bệnh nhân (hms_patient) - chỉ khi có địa chỉ
        let updatedPatientsCount = 0;
        if (!args.skipPatient && targetPatientNos.length > 0 && (fullAddress || spId)) {
            let updatePatRes;
            if (spId && svId) {
                updatePatRes = await client.query(`
                    UPDATE hms_patient
                    SET hp_provid = $1,
                        hp_distid = COALESCE(NULLIF($2, 0), hp_distid, 0),
                        hp_villid = $3,
                        hp_dtladdr = COALESCE(NULLIF(TRIM(hp_dtladdr), ''), $4),
                        hp_updateddate = NOW()
                    WHERE hp_patientno = ANY($5::int[])
                      AND (hp_provid IS NULL OR hp_provid = 0 
                           OR hp_villid IS NULL OR hp_villid = 0 
                           OR hp_dtladdr IS NULL OR TRIM(hp_dtladdr) = '')
                `, [spId, svDistId, svId, fullAddress, targetPatientNos]);
            } else {
                updatePatRes = await client.query(`
                    UPDATE hms_patient
                    SET hp_dtladdr = COALESCE(NULLIF(TRIM(hp_dtladdr), ''), $1),
                        hp_updateddate = NOW()
                    WHERE hp_patientno = ANY($2::int[])
                      AND (hp_dtladdr IS NULL OR TRIM(hp_dtladdr) = '')
                `, [fullAddress, targetPatientNos]);
            }
            updatedPatientsCount = updatePatRes.rowCount || 0;
            console.log(`📝 [hms_patient] Đã cập nhật địa chỉ bệnh nhân: ${updatedPatientsCount} bản ghi.`);
        }

        // 9. Cập nhật phiếu tiếp nhận (hms_doc) - Ngày khám (hd_admitdate) & Địa chỉ
        let updatedDocsCount = 0;
        if (!args.skipDoc && targetDocNos.length > 0 && (parsedDate || fullAddress || spId)) {
            const docSets: string[] = ['hd_updateddate = NOW()'];
            const docSetParams: any[] = [];

            if (parsedDate) {
                docSetParams.push(parsedDate.timestampStr);
                docSets.push(`hd_admitdate = $${docSetParams.length}`);
            }

            if (spId && svId) {
                docSetParams.push(spId, svDistId, svId, fullAddress);
                const bIdx = docSetParams.length - 4;
                docSets.push(`hd_provid = $${bIdx + 1}`);
                docSets.push(`hd_distid = COALESCE(NULLIF($${bIdx + 2}, 0), hd_distid, 0)`);
                docSets.push(`hd_villid = $${bIdx + 3}`);
                docSets.push(`hd_dtladdr = COALESCE(NULLIF(TRIM(hd_dtladdr), ''), $${bIdx + 4})`);
            } else if (fullAddress) {
                docSetParams.push(fullAddress);
                docSets.push(`hd_dtladdr = COALESCE(NULLIF(TRIM(hd_dtladdr), ''), $${docSetParams.length})`);
            }

            docSetParams.push(targetDocNos);
            const docSql = `
                UPDATE hms_doc
                SET ${docSets.join(', ')}
                WHERE hd_docno = ANY($${docSetParams.length}::int[])
            `;
            const updateDocRes = await client.query(docSql, docSetParams);
            updatedDocsCount = updateDocRes.rowCount || 0;
            console.log(`📝 [hms_doc] Đã cập nhật phiếu tiếp nhận (Ngày vào/Địa chỉ): ${updatedDocsCount} bản ghi.`);
        }

        // 10. Cập nhật bảng khám bệnh lâm sàng (hms_exam) - Ngày khám (he_examdate) & Phòng khám (he_roomid, he_deptid)
        let updatedExamsCount = 0;
        if (!args.skipExam && targetDocNos.length > 0 && (parsedDate || resolvedRoom)) {
            const examSets: string[] = ['he_updateddate = NOW()'];
            const examParams: any[] = [];

            if (parsedDate) {
                examParams.push(parsedDate.timestampStr);
                examSets.push(`he_examdate = $${examParams.length}`);
            }

            if (resolvedRoom) {
                examParams.push(resolvedRoom.roomId);
                examSets.push(`he_roomid = $${examParams.length}`);
                examParams.push(resolvedRoom.deptId);
                examSets.push(`he_deptid = $${examParams.length}`);
            }

            examParams.push(targetDocNos);
            const examSql = `
                UPDATE hms_exam
                SET ${examSets.join(', ')}
                WHERE he_docno = ANY($${examParams.length}::int[])
            `;
            const updateExamRes = await client.query(examSql, examParams);
            updatedExamsCount = updateExamRes.rowCount || 0;
            console.log(`📝 [hms_exam] Đã cập nhật phiên khám (Ngày khám/Phòng khám): ${updatedExamsCount} bản ghi.`);
        }

        // 11. Cập nhật hồ sơ KSK & thẻ XML (health_check_masters)
        let updatedMastersCount = 0;
        if (!args.skipXml && (parsedDate || fullAddress || spId)) {
            const masterSql = `
                SELECT id, doc_no, his_employee_id, his_doc_no, xml_data, signature_status
                FROM health_check_masters
                WHERE his_contract_id = $1
                  AND (his_employee_id = ANY($2::varchar[]) 
                       OR (his_doc_no IS NOT NULL AND his_doc_no = ANY($3::varchar[]))
                       OR (doc_no IS NOT NULL AND doc_no = ANY($3::varchar[])))
            `;
            const masterRes = await client.query(masterSql, [
                args.contractId,
                targetEmpIds.map(String),
                targetDocNos.map(String)
            ]);

            console.log(`🔎 Tìm thấy ${masterRes.rows.length} hồ sơ KSK trong health_check_masters để cập nhật XML.`);

            const updatesToApply: Array<{ id: number; xml: string }> = [];
            for (const master of masterRes.rows) {
                if (master.xml_data) {
                    const newXml = updateXmlDataTags(master.xml_data, spIdBh, svIdBh, fullAddress, parsedDate);
                    if (newXml !== master.xml_data) {
                        updatesToApply.push({ id: master.id, xml: newXml });
                    }
                }
            }

            // Thực thi cập nhật theo lô (Batch chunking 200 bản ghi/truy vấn)
            const CHUNK_SIZE = 200;
            for (let i = 0; i < updatesToApply.length; i += CHUNK_SIZE) {
                const chunk = updatesToApply.slice(i, i + CHUNK_SIZE);
                const valPlaceholders: string[] = [];
                const valParams: any[] = [];
                chunk.forEach((item, idx) => {
                    valPlaceholders.push(`($${idx * 2 + 1}::int, $${idx * 2 + 2}::text)`);
                    valParams.push(item.id, item.xml);
                });

                await client.query(`
                    UPDATE health_check_masters AS m
                    SET xml_data = v.new_xml, updated_at = NOW()
                    FROM (VALUES ${valPlaceholders.join(', ')}) AS v(id, new_xml)
                    WHERE m.id = v.id
                `, valParams);
                updatedMastersCount += chunk.length;
            }
            console.log(`📝 [health_check_masters] Đã cập nhật thẻ XML & Timestamp: ${updatedMastersCount} hồ sơ.`);
        }

        // 12. Kết thúc Transaction
        if (args.dryRun) {
            await client.query('ROLLBACK');
            console.log(`\n================================================================================`);
            console.log(`⚠️ CHẾ ĐỘ MÔ PHỎNG (DRY-RUN): ĐÃ ROLLBACK THÀNH CÔNG.`);
            console.log(`• Không có thay đổi nào được lưu vào Cơ sở Dữ liệu.`);
            console.log(`• Để thực hiện lưu thật, hãy chạy lại lệnh mà KHÔNG có cờ --dry-run.`);
            console.log(`================================================================================\n`);
        } else {
            await client.query('COMMIT');
            console.log(`\n================================================================================`);
            console.log(`🎉 CẬP NHẬT HOÀN TẤT VÀ ĐÃ COMMIT VÀO CƠ SỞ DỮ LIỆU THÀNH CÔNG!`);
            if (contractUpdated) console.log(`• Hợp đồng KSK (hms_exm_contract)     : Đã cập nhật HĐ #${args.contractId}`);
            if (updatedEmpCount > 0) console.log(`• Nhân viên hợp đồng (hms_exm_employee): ${updatedEmpCount} bản ghi`);
            if (updatedPatientsCount > 0) console.log(`• Hồ sơ bệnh nhân (hms_patient)        : ${updatedPatientsCount} bản ghi`);
            if (updatedDocsCount > 0) console.log(`• Tiếp nhận khám (hms_doc)             : ${updatedDocsCount} bản ghi`);
            if (updatedExamsCount > 0) console.log(`• Buồng khám lâm sàng (hms_exam)       : ${updatedExamsCount} bản ghi`);
            if (updatedMastersCount > 0) console.log(`• Hồ sơ KSK & XML (health_check_masters): ${updatedMastersCount} bản ghi`);
            console.log(`================================================================================\n`);
        }

    } catch (err: any) {
        await client.query('ROLLBACK').catch(() => {});
        console.error(`\n❌ GẶP LỖI KHI XỬ LÝ (ĐÃ ROLLBACK TOÀN BỘ):`, err.message || err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

// Chạy trực tiếp nếu file được thực thi bằng ts-node/node
if (require.main === module) {
    main().catch(err => {
        console.error('Lỗi ngoại lệ:', err);
        process.exit(1);
    });
}
