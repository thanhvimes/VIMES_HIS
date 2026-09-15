// ============================================================================
// File: backend/scripts/update-contract-address.ts
// Purpose: Cập nhật mã tỉnh, mã xã/phường và địa chỉ cho các hồ sơ bị thiếu
//          theo gói khám / hợp đồng KSK (his_contract_id / hec_contract_id).
//          Hỗ trợ:
//            - Truyền đủ: Mã tỉnh, Mã xã/phường, Chuỗi địa chỉ
//            - Hoặc chỉ truyền: Mã gói + Chuỗi địa chỉ chi tiết (Tự động nhận diện danh mục hoặc text-only)
// ============================================================================

import { Pool, PoolClient } from 'pg';
import SecurityUtils from '../src/utils/security';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env') });

interface ParsedArgs {
    contractId: number;
    provInput?: string;
    villInput?: string;
    customAddress?: string;
    onlyMissing: boolean;
    dryRun: boolean;
    docNos?: string[];
    skipPatient: boolean;
    skipDoc: boolean;
    skipXml: boolean;
    dbHost?: string;
    dbPort?: number;
    dbName?: string;
}

// Helper: Normalize string for Vietnamese text search (strip accents & symbols)
function normalizeText(str: string): string {
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
// Helper: Parse CLI Arguments
// ----------------------------------------------------------------------------
function parseArgs(): ParsedArgs {
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

    // 2. Determine Province, Ward, Address
    let provInput = flags['province'] || flags['prov'] || flags['matinh'] ? String(flags['province'] || flags['prov'] || flags['matinh']).trim() : undefined;
    let villInput = flags['ward'] || flags['vill'] || flags['village'] || flags['maxa'] ? String(flags['ward'] || flags['vill'] || flags['village'] || flags['maxa']).trim() : undefined;
    let customAddress = flags['address'] || flags['addr'] ? String(flags['address'] || flags['addr']).trim() : undefined;

    // Xử lý các tham số vị trí linh hoạt
    if (positionals.length >= 2) {
        // Trường hợp: <contract_id> <address>
        // Ví dụ: 166 "Phường Tây Hoa Lư, Ninh Bình"
        if (positionals.length === 2 && !provInput && !villInput) {
            customAddress = positionals[1].trim();
        } 
        // Trường hợp: <contract_id> <prov> <ward> [address]
        // Ví dụ: 35 37 14701 "Xã Yên Mô, Ninh Bình"
        else if (positionals.length >= 3) {
            provInput = provInput || positionals[1].trim();
            villInput = villInput || positionals[2].trim();
            if (positionals[3]) {
                customAddress = customAddress || positionals[3].trim();
            }
        }
    }

    // Kiểm tra tính hợp lệ tối thiểu
    if (!provInput && !villInput && !customAddress) {
        printUsageAndExit('Bạn cần cung cấp Mã tỉnh & Mã xã/phường (--province & --ward) HOẶC Chuỗi địa chỉ chi tiết (--address hoặc tham số thứ 2).');
    }

    // Filter modes
    const allFlag = Boolean(flags['all']);
    const onlyMissing = allFlag ? false : true;
    const dryRun = Boolean(flags['dry-run'] || flags['dryrun'] || flags['simulate']);

    // Doc Nos filter
    let docNos: string[] | undefined;
    if (flags['doc-nos'] || flags['docnos']) {
        const rawList = String(flags['doc-nos'] || flags['docnos']);
        docNos = rawList.split(',').map(s => s.trim()).filter(Boolean);
    }

    // Skip flags
    const skipPatient = Boolean(flags['skip-patient']);
    const skipDoc = Boolean(flags['skip-doc']);
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
        onlyMissing,
        dryRun,
        docNos,
        skipPatient,
        skipDoc,
        skipXml,
        dbHost,
        dbPort,
        dbName
    };
}

function printUsageAndExit(errMsg?: string): never {
    if (errMsg) {
        console.error(`\n❌ LỖI: ${errMsg}\n`);
    }
    console.log(`================================================================================`);
    console.log(` CÔNG CỤ CẬP NHẬT ĐỊA CHỈ MÃ TỈNH / XÃ PHƯỜNG CHO HỢP ĐỒNG KSK (VIMES HIS)`);
    console.log(`================================================================================`);
    console.log(`Cú pháp sử dụng:`);
    console.log(`  npx ts-node scripts/update-contract-address.ts [options]`);
    console.log(`  npx ts-node scripts/update-contract-address.ts <contract_id> <address>`);
    console.log(`  npx ts-node scripts/update-contract-address.ts <contract_id> <province_code> <ward_code> [address]\n`);
    console.log(`Các trường hợp chạy:`);
    console.log(`  1. Chỉ truyền Mã gói + Địa chỉ chi tiết (Tự động nhận diện Tỉnh/Xã từ văn bản):`);
    console.log(`     npx ts-node scripts/update-contract-address.ts 35 "Phường Tây Hoa Lư, Ninh Bình" --dry-run`);
    console.log(`     npx ts-node scripts/update-contract-address.ts --contract=35 --address="Xã Yên Mô, Ninh Bình"\n`);
    console.log(`  2. Truyền rõ Mã tỉnh & Mã xã/phường:`);
    console.log(`     npx ts-node scripts/update-contract-address.ts --contract=35 --province=37 --ward=14701`);
    console.log(`     npx ts-node scripts/update-contract-address.ts 35 37 14701\n`);
    console.log(`Các tùy chọn mở rộng:`);
    console.log(`  --dry-run             : Chạy mô phỏng, xem trước danh sách tác động, KHÔNG lưu DB`);
    console.log(`  --all                 : Cập nhật tất cả hồ sơ trong hợp đồng (mặc định: chỉ cập nhật hồ sơ thiếu)`);
    console.log(`  --doc-nos=<1,2,3>     : Chỉ cập nhật cho danh sách số hồ sơ / mã nhân viên cụ thể`);
    console.log(`  --skip-patient        : Không đồng bộ vào bảng bệnh nhân hms_patient`);
    console.log(`  --skip-doc            : Không đồng bộ vào bảng tiếp nhận hms_doc`);
    console.log(`  --skip-xml            : Không cập nhật thẻ XML trong health_check_masters`);
    console.log(`  --host=<ip>           : Chỉ định DB host nếu khác file .env`);
    console.log(`  --port=<port>         : Chỉ định DB port nếu khác file .env`);
    console.log(`  --db=<name>           : Chỉ định DB name nếu khác file .env\n`);
    process.exit(errMsg ? 1 : 0);
}

// ----------------------------------------------------------------------------
// DB Connection Helper
// ----------------------------------------------------------------------------
async function createDatabasePool(parsed: ParsedArgs): Promise<Pool> {
    const rawUser = process.env.DB_USER || '';
    const rawPassword = process.env.DB_PASSWORD || '';
    const dbUser = SecurityUtils.resolveSecret(rawUser);
    const dbPassword = SecurityUtils.resolveSecret(rawPassword);

    let host = parsed.dbHost || process.env.DB_HOST || '14.177.232.29';
    let port = parsed.dbPort || parseInt(process.env.DB_PORT || '8050', 10);
    let database = parsed.dbName || process.env.DB_NAME || 'vimes_ym';

    console.log(`\n🔌 Đang kết nối Cơ sở dữ liệu: ${host}:${port}/${database} (User: ${dbUser ? '[SECURED]' : 'NONE'})...`);

    let pool = new Pool({
        user: dbUser,
        password: dbPassword,
        host,
        port,
        database,
        connectionTimeoutMillis: 5000
    });

    try {
        const testClient = await pool.connect();
        testClient.release();
        console.log(`✅ Kết nối Database thành công!`);
        return pool;
    } catch (err: any) {
        console.warn(`⚠️ Không thể kết nối tới ${host}:${port}/${database}: ${err.message}`);
        // Fallback to 14.177.232.29:8050/vimes_ym if 192.168.0.200 timed out
        if (host === '192.168.0.200' && !parsed.dbHost) {
            console.log(`🔄 Tự động chuyển sang máy chủ từ xa 14.177.232.29:8050/vimes_ym...`);
            await pool.end().catch(() => {});
            host = '14.177.232.29';
            port = 8050;
            database = 'vimes_ym';
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
// XML Address Updater Helper
// ----------------------------------------------------------------------------
function updateXmlAddressTags(xml: string, provBhCode?: string, villBhCode?: string, addressStr?: string): string {
    let updated = xml;
    const escapeXml = (str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // 1. MATINH_CU_TRU (nếu có mã)
    if (provBhCode) {
        if (updated.includes('<MATINH_CU_TRU>')) {
            updated = updated.replace(/<MATINH_CU_TRU>(.*?)<\/MATINH_CU_TRU>/g, `<MATINH_CU_TRU>${provBhCode}</MATINH_CU_TRU>`);
        } else if (updated.includes('</THONG_TIN_HANH_CHINH>')) {
            updated = updated.replace('</THONG_TIN_HANH_CHINH>', `\t<MATINH_CU_TRU>${provBhCode}</MATINH_CU_TRU>\n\t\t\t\t\t\t</THONG_TIN_HANH_CHINH>`);
        }
    }

    // 2. MAXA_CU_TRU (nếu có mã)
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

    return updated;
}

// ----------------------------------------------------------------------------
// Main Execution
// ----------------------------------------------------------------------------
async function main() {
    const args = parseArgs();
    const pool = await createDatabasePool(args);
    const client: PoolClient = await pool.connect();

    try {
        console.log(`\n================================================================================`);
        console.log(`📋 THÔNG TIN THỰC THI`);
        console.log(`================================================================================`);
        console.log(`• Gói khám (his_contract_id) : ${args.contractId}`);
        if (args.provInput) console.log(`• Mã tỉnh nhập vào           : "${args.provInput}"`);
        if (args.villInput) console.log(`• Mã xã/phường nhập vào      : "${args.villInput}"`);
        if (args.customAddress) console.log(`• Địa chỉ truyền vào         : "${args.customAddress}"`);
        console.log(`• Chế độ cập nhật            : ${args.onlyMissing ? 'Chỉ hồ sơ bị thiếu địa chỉ' : 'Toàn bộ hồ sơ trong gói'}`);
        console.log(`• Trạng thái Dry-Run         : ${args.dryRun ? 'BẬT (Mô phỏng an toàn - ROLLBACK)' : 'TẮT (Ghi trực tiếp vào DB)'}`);
        if (args.docNos && args.docNos.length > 0) {
            console.log(`• Lọc theo số hồ sơ          : ${args.docNos.join(', ')}`);
        }
        console.log(`================================================================================\n`);

        // Bắt đầu Transaction
        await client.query('BEGIN');

        // 1. Kiểm tra hợp đồng tồn tại
        const contractRes = await client.query(`
            SELECT hec_contract_id, hec_no, hec_date, hec_desc 
            FROM hms_exm_contract 
            WHERE hec_contract_id = $1
        `, [args.contractId]);

        if (contractRes.rows.length === 0) {
            // Lấy danh sách 8 gói khám gần nhất để gợi ý cho người dùng
            const recentRes = await client.query(`
                SELECT hec_contract_id, hec_no, hec_desc, to_char(hec_date, 'YYYY-MM-DD') as hec_date
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
                mo_ta: r.hec_desc || ''
            })));
            throw new Error(`Hợp đồng ID = ${args.contractId} không tồn tại.`);
        }
        const contractInfo = contractRes.rows[0];
        console.log(`✅ Hợp đồng hợp lệ: [${contractInfo.hec_contract_id}] Số HĐ: ${contractInfo.hec_no || 'N/A'} - ${contractInfo.hec_desc || ''}`);

        // 2. Xử lý nhận diện Tỉnh / Xã / Địa chỉ
        let spId: number | undefined;
        let spIdBh: string | undefined;
        let spName: string | undefined;

        let svId: number | undefined;
        let svIdBh: string | undefined;
        let svName: string | undefined;
        let svDistId: number = 0;
        let distName: string = '';

        let fullAddress: string = args.customAddress || '';

        // TH1: Người dùng truyền rõ mã tỉnh và mã xã
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
        }
        // TH2: Người dùng chỉ truyền địa chỉ chi tiết -> Tự động nhận diện Tỉnh/Xã từ chuỗi văn bản
        else if (args.customAddress) {
            console.log(`🔍 Đang tự động phân tích và tra cứu danh mục hành chính từ địa chỉ: "${args.customAddress}"...`);
            const normAddr = normalizeText(args.customAddress);

            // A. Tra cứu Tỉnh từ sys_prov (Ưu tiên tỉnh active 'Y' trước)
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

            // B. Tra cứu Xã/Phường từ sys_vill
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

        console.log(`\n📍 KẾT QUẢ XỬ LÝ ĐỊA CHỈ:`);
        if (spId && svId) {
            console.log(`🎯 TỰ ĐỘNG NHẬN DIỆN DANH MỤC THÀNH CÔNG:`);
            console.log(`• Tỉnh/Thành phố : [ID: ${spId}] Mã BHYT: "${spIdBh}" - ${spName}`);
            console.log(`• Xã/Phường/TT   : [ID: ${svId}] Mã BHYT: "${svIdBh}" - ${svName}`);
            if (distName) console.log(`• Quận/Huyện     : [ID: ${svDistId}] ${distName}`);
            console.log(`• Chuỗi địa chỉ  : "${fullAddress}"\n`);
        } else if (spId) {
            console.log(`ℹ️ Nhận diện được Tỉnh [ID: ${spId}] Mã BHYT: "${spIdBh}" - ${spName}, nhưng không xác định được mã Xã/Phường trong danh mục.`);
            console.log(`• Chuỗi địa chỉ  : "${fullAddress}"\n`);
        } else {
            console.log(`ℹ️ Địa chỉ dạng tự do (Không nhận diện mã Tỉnh/Xã trong danh mục).`);
            console.log(`📝 Hệ thống sẽ cập nhật CHUỖI ĐỊA CHỈ (text-only) vào: hee_address, hp_dtladdr, hd_dtladdr và thẻ <DIA_CHI>.\n`);
        }

        // 3. Lấy danh sách nhân viên trong hợp đồng cần cập nhật
        let empSql = `
            SELECT hee_employee_id, hee_patientno, hee_docno, hee_surname, hee_midname, hee_firstname,
                   hee_provid, hee_villid, hee_address, hee_prov_code, hee_vill_code
            FROM hms_exm_employee
            WHERE hee_contract_id = $1
        `;
        const empParams: any[] = [args.contractId];

        if (args.docNos && args.docNos.length > 0) {
            empParams.push(args.docNos);
            empSql += ` AND (hee_docno = ANY($${empParams.length}::int[]) OR hee_employee_id::text = ANY($${empParams.length}::text[]))`;
        }

        if (args.onlyMissing) {
            if (spId && svId) {
                empSql += ` AND (hee_provid IS NULL OR hee_provid = 0 
                             OR hee_villid IS NULL OR hee_villid = 0 
                             OR hee_address IS NULL OR TRIM(hee_address) = ''
                             OR hee_prov_code IS NULL OR hee_vill_code IS NULL)`;
            } else {
                empSql += ` AND (hee_address IS NULL OR TRIM(hee_address) = '')`;
            }
        }

        empSql += ` ORDER BY hee_employee_id ASC`;

        const empRes = await client.query(empSql, empParams);
        const totalEmpFound = empRes.rows.length;

        console.log(`🔎 Tìm thấy ${totalEmpFound} hồ sơ nhân viên cần cập nhật trong hms_exm_employee.`);

        if (totalEmpFound === 0) {
            console.log(`✨ Tất cả hồ sơ trong hợp đồng này đã có đầy đủ địa chỉ. Không cần cập nhật!`);
            await client.query('ROLLBACK');
            return;
        }

        // In preview 5 bản ghi đầu
        console.log(`\n👁️ Xem trước 5 hồ sơ sẽ cập nhật:`);
        console.table(empRes.rows.slice(0, 5).map(r => ({
            emp_id: r.hee_employee_id,
            ho_ten: [r.hee_surname, r.hee_midname, r.hee_firstname].filter(Boolean).join(' '),
            docno: r.hee_docno,
            provid_cu: r.hee_provid,
            villid_cu: r.hee_villid,
            addr_cu: r.hee_address || '(Trống)'
        })));

        const targetEmpIds = empRes.rows.map(r => r.hee_employee_id);
        const targetPatientNos = empRes.rows.map(r => r.hee_patientno).filter((p): p is number => p !== null && p > 0);
        const targetDocNos = empRes.rows.map(r => r.hee_docno).filter((d): d is number => d !== null && d > 0);

        // 4. Cập nhật hms_exm_employee
        let updateEmpRes;
        if (spId && svId) {
            updateEmpRes = await client.query(`
                UPDATE hms_exm_employee
                SET hee_provid = $1,
                    hee_distid = COALESCE(NULLIF($2, 0), hee_distid, 0),
                    hee_villid = $3,
                    hee_prov_code = $4,
                    hee_vill_code = $5,
                    hee_address = COALESCE(NULLIF(TRIM(hee_address), ''), $6),
                    hee_updateddate = NOW()
                WHERE hee_employee_id = ANY($7::int[])
            `, [spId, svDistId, svId, spIdBh, svIdBh, fullAddress, targetEmpIds]);
        } else if (spId) {
            updateEmpRes = await client.query(`
                UPDATE hms_exm_employee
                SET hee_provid = $1,
                    hee_prov_code = $2,
                    hee_address = COALESCE(NULLIF(TRIM(hee_address), ''), $3),
                    hee_updateddate = NOW()
                WHERE hee_employee_id = ANY($4::int[])
            `, [spId, spIdBh, fullAddress, targetEmpIds]);
        } else {
            updateEmpRes = await client.query(`
                UPDATE hms_exm_employee
                SET hee_address = COALESCE(NULLIF(TRIM(hee_address), ''), $1),
                    hee_updateddate = NOW()
                WHERE hee_employee_id = ANY($2::int[])
            `, [fullAddress, targetEmpIds]);
        }
        console.log(`📝 [hms_exm_employee] Đã cập nhật: ${updateEmpRes.rowCount} bản ghi.`);

        // 5. Cập nhật hms_patient (nếu có bệnh nhân bị thiếu địa chỉ)
        let updatedPatientsCount = 0;
        if (!args.skipPatient && targetPatientNos.length > 0) {
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
            console.log(`📝 [hms_patient] Đã cập nhật hồ sơ bệnh nhân thiếu địa chỉ: ${updatedPatientsCount} bản ghi.`);
        }

        // 6. Cập nhật hms_doc (nếu có phiếu tiếp nhận bị thiếu địa chỉ)
        let updatedDocsCount = 0;
        if (!args.skipDoc && targetDocNos.length > 0) {
            let updateDocRes;
            if (spId && svId) {
                updateDocRes = await client.query(`
                    UPDATE hms_doc
                    SET hd_provid = $1,
                        hd_distid = COALESCE(NULLIF($2, 0), hd_distid, 0),
                        hd_villid = $3,
                        hd_dtladdr = COALESCE(NULLIF(TRIM(hd_dtladdr), ''), $4)
                    WHERE hd_docno = ANY($5::int[])
                      AND (hd_provid IS NULL OR hd_provid = 0 
                           OR hd_villid IS NULL OR hd_villid = 0 
                           OR hd_dtladdr IS NULL OR TRIM(hd_dtladdr) = '')
                `, [spId, svDistId, svId, fullAddress, targetDocNos]);
            } else {
                updateDocRes = await client.query(`
                    UPDATE hms_doc
                    SET hd_dtladdr = COALESCE(NULLIF(TRIM(hd_dtladdr), ''), $1)
                    WHERE hd_docno = ANY($2::int[])
                      AND (hd_dtladdr IS NULL OR TRIM(hd_dtladdr) = '')
                `, [fullAddress, targetDocNos]);
            }
            updatedDocsCount = updateDocRes.rowCount || 0;
            console.log(`📝 [hms_doc] Đã cập nhật phiếu tiếp nhận thiếu địa chỉ: ${updatedDocsCount} bản ghi.`);
        }

        // 7. Cập nhật health_check_masters (cập nhật xml_data thẻ MATINH, MAXA, DIA_CHI)
        let updatedMastersCount = 0;
        if (!args.skipXml) {
            const masterSql = `
                SELECT id, doc_no, his_employee_id, xml_data, signature_status
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

            console.log(`🔎 Tìm thấy ${masterRes.rows.length} hồ sơ KSK trong health_check_masters cần đồng bộ XML.`);

            const updatesToApply: Array<{ id: number; xml: string }> = [];
            for (const master of masterRes.rows) {
                if (master.xml_data) {
                    const newXml = updateXmlAddressTags(master.xml_data, spIdBh, svIdBh, fullAddress);
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
            console.log(`📝 [health_check_masters] Đã cập nhật thẻ XML: ${updatedMastersCount} hồ sơ.`);
        }

        // 8. Kết thúc Transaction
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
            console.log(`• Nhân viên hợp đồng (hms_exm_employee) : ${updateEmpRes.rowCount} bản ghi`);
            console.log(`• Hồ sơ bệnh nhân (hms_patient)         : ${updatedPatientsCount} bản ghi`);
            console.log(`• Tiếp nhận khám (hms_doc)              : ${updatedDocsCount} bản ghi`);
            console.log(`• Hồ sơ KSK & XML (health_check_masters): ${updatedMastersCount} bản ghi`);
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

// Run
main().catch(err => {
    console.error('Lỗi ngoại lệ:', err);
    process.exit(1);
});
