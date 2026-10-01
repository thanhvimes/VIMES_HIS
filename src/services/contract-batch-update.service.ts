// ============================================================================
// File: src/services/contract-batch-update.service.ts
// Purpose: Dịch vụ hiệu chỉnh hàng loạt thông tin gói khám / hợp đồng KSK:
//          - Ngày khám (hec_examdate, hee_examdate, hd_admitdate, he_examdate, thẻ XML)
//          - Buồng/Phòng khám (hec_def_roomid, he_roomid, he_deptid)
//          - Địa chỉ & Mã tỉnh/xã BHYT (hms_exm_employee, hms_patient, hms_doc, thẻ XML)
//          Hỗ trợ Dry-Run mô phỏng an toàn và Preview trước khi lưu thật.
// ============================================================================

import { Pool, PoolClient } from 'pg';

export interface BatchUpdateOptions {
    contractId: number;
    examDateInput?: string;
    roomInput?: string;
    deptInput?: string;
    customAddress?: string;
    provInput?: string;
    villInput?: string;
    onlyMissing?: boolean;
    dryRun?: boolean;
    docNos?: string[];
    skipContract?: boolean;
    skipEmployee?: boolean;
    skipPatient?: boolean;
    skipDoc?: boolean;
    skipExam?: boolean;
    skipXml?: boolean;
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

export interface BatchUpdateResult {
    success: boolean;
    dryRun: boolean;
    contractInfo: {
        id: number;
        code: string;
        desc: string;
        oldDate?: string;
        newDate?: string;
        oldRoomId?: number;
        newRoomId?: number;
        roomName?: string;
        deptId?: string;
    };
    addressInfo?: {
        provId?: number;
        provBh?: string;
        provName?: string;
        villId?: number;
        villBh?: string;
        villName?: string;
        distName?: string;
        fullAddress: string;
    };
    counts: {
        totalEmployees: number;
        contractUpdated: boolean;
        updatedEmployees: number;
        updatedPatients: number;
        updatedDocs: number;
        updatedExams: number;
        updatedMasters: number;
    };
    previewRows: Array<{
        empId: number;
        name: string;
        docNo?: number;
        oldDate?: string;
        newDate?: string;
        oldRoomId?: number;
        newRoomId?: number;
        oldAddress?: string;
        newAddress?: string;
    }>;
    message: string;
}

// ----------------------------------------------------------------------------
// Helper: Normalize Vietnamese text
// ----------------------------------------------------------------------------
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
// Helper: Parse Date String
// ----------------------------------------------------------------------------
export function parseExamDate(input: string): ParsedDateResult {
    const raw = input.trim();
    let year: number = 0;
    let month: number = 0;
    let day: number = 0;
    let hour = 8;
    let minute = 0;
    let second = 0;

    const dmyMatch = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
    const ymdMatch = raw.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
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
// Helper: Update XML data tags
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

    if (provBhCode) {
        if (updated.includes('<MATINH_CU_TRU>')) {
            updated = updated.replace(/<MATINH_CU_TRU>(.*?)<\/MATINH_CU_TRU>/g, `<MATINH_CU_TRU>${provBhCode}</MATINH_CU_TRU>`);
        } else if (updated.includes('</THONG_TIN_HANH_CHINH>')) {
            updated = updated.replace('</THONG_TIN_HANH_CHINH>', `\t<MATINH_CU_TRU>${provBhCode}</MATINH_CU_TRU>\n\t\t\t\t\t\t</THONG_TIN_HANH_CHINH>`);
        }
    }

    if (villBhCode) {
        if (updated.includes('<MAXA_CU_TRU>')) {
            updated = updated.replace(/<MAXA_CU_TRU>(.*?)<\/MAXA_CU_TRU>/g, `<MAXA_CU_TRU>${villBhCode}</MAXA_CU_TRU>`);
        } else if (updated.includes('</THONG_TIN_HANH_CHINH>')) {
            updated = updated.replace('</THONG_TIN_HANH_CHINH>', `\t<MAXA_CU_TRU>${villBhCode}</MAXA_CU_TRU>\n\t\t\t\t\t\t</THONG_TIN_HANH_CHINH>`);
        }
    }

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

    if (examDate) {
        if (updated.includes('<NGAY_VAO>')) {
            updated = updated.replace(/<NGAY_VAO>(.*?)<\/NGAY_VAO>/g, (_m, oldVal) => {
                const trimmed = String(oldVal || '').trim();
                if (trimmed.length >= 12) {
                    const timePart = trimmed.slice(8);
                    return `<NGAY_VAO>${examDate.xmlYmd}${timePart}</NGAY_VAO>`;
                } else if (trimmed.length === 8) {
                    return `<NGAY_VAO>${examDate.xmlYmd}</NGAY_VAO>`;
                }
                return `<NGAY_VAO>${examDate.xmlYmdHm}</NGAY_VAO>`;
            });
        }

        if (updated.includes('<NGAY_KHAM>')) {
            updated = updated.replace(/<NGAY_KHAM>(.*?)<\/NGAY_KHAM>/g, (_m, oldVal) => {
                const trimmed = String(oldVal || '').trim();
                if (trimmed.includes('-')) {
                    return `<NGAY_KHAM>${examDate.dateYmd}</NGAY_KHAM>`;
                }
                return `<NGAY_KHAM>${examDate.xmlYmd}</NGAY_KHAM>`;
            });
        }

        if (updated.includes('<NGAYLAP>')) {
            updated = updated.replace(/<NGAYLAP>(.*?)<\/NGAYLAP>/g, `<NGAYLAP>${examDate.xmlYmd}</NGAYLAP>`);
        }
    }

    return updated;
}

// ----------------------------------------------------------------------------
// Core Function: Execute Contract Batch Update
// ----------------------------------------------------------------------------
export async function executeContractBatchUpdate(
    pool: Pool, 
    options: BatchUpdateOptions
): Promise<BatchUpdateResult> {
    const client: PoolClient = await pool.connect();
    const dryRun = Boolean(options.dryRun);

    try {
        await client.query('BEGIN');

        // 1. Kiểm tra hợp đồng
        const contractRes = await client.query(`
            SELECT hec_contract_id, hec_no, hec_date, hec_examdate, hec_def_roomid, hec_desc, hec_description
            FROM hms_exm_contract 
            WHERE hec_contract_id = $1
        `, [options.contractId]);

        if (contractRes.rows.length === 0) {
            throw new Error(`Không tìm thấy hợp đồng khám sức khỏe ID = ${options.contractId}.`);
        }

        const contractRow = contractRes.rows[0];
        const contractDesc = contractRow.hec_desc || contractRow.hec_description || '';
        const oldContractDate = contractRow.hec_examdate ? new Date(contractRow.hec_examdate).toISOString().split('T')[0] : undefined;
        const oldRoomId = contractRow.hec_def_roomid ? parseInt(String(contractRow.hec_def_roomid), 10) : undefined;

        // 2. Phân tích Ngày khám (nếu có)
        let parsedDate: ParsedDateResult | undefined;
        if (options.examDateInput && options.examDateInput.trim()) {
            parsedDate = parseExamDate(options.examDateInput);
        }

        // 3. Phân tích Phòng khám (nếu có)
        let resolvedRoom: ResolvedRoom | undefined;
        if (options.roomInput && options.roomInput.trim()) {
            resolvedRoom = await resolveRoom(client, options.roomInput, options.deptInput);
        }

        // 4. Phân tích Địa chỉ (nếu có)
        let spId: number | undefined;
        let spIdBh: string | undefined;
        let spName: string | undefined;
        let svId: number | undefined;
        let svIdBh: string | undefined;
        let svName: string | undefined;
        let svDistId: number = 0;
        let distName: string = '';
        let fullAddress: string = options.customAddress ? options.customAddress.trim() : '';

        if (options.provInput && options.villInput) {
            const provRes = await client.query(`
                SELECT sp_id, sp_id_bh, sp_name 
                FROM sys_prov 
                WHERE sp_id_bh = $1 OR sp_id::text = $1
                ORDER BY (CASE WHEN sp_isactive = 'Y' THEN 1 ELSE 2 END) ASC
                LIMIT 1
            `, [options.provInput.trim()]);
            if (provRes.rows.length > 0) {
                spId = provRes.rows[0].sp_id;
                spIdBh = String(provRes.rows[0].sp_id_bh || '').padStart(2, '0');
                spName = String(provRes.rows[0].sp_name || '').trim();
            }

            const villRes = await client.query(`
                SELECT v.sv_id, v.sv_id_bh, v.sv_name, v.sv_provid, v.sv_distid,
                       d.sd_name, p.sp_name as prov_name
                FROM sys_vill v
                LEFT JOIN sys_dist d ON d.sd_id = v.sv_distid
                LEFT JOIN sys_prov p ON p.sp_id = v.sv_provid
                WHERE v.sv_id_bh = $1 OR v.sv_id::text = $1
                ORDER BY (CASE WHEN v.sv_isactive = 'Y' THEN 1 ELSE 2 END) ASC
                LIMIT 1
            `, [options.villInput.trim()]);
            if (villRes.rows.length > 0) {
                svId = villRes.rows[0].sv_id;
                svIdBh = String(villRes.rows[0].sv_id_bh || '').padStart(5, '0');
                svName = String(villRes.rows[0].sv_name || '').trim();
                svDistId = (villRes.rows[0].sv_distid as number) || 0;
                distName = villRes.rows[0].sd_name ? String(villRes.rows[0].sd_name).trim() : '';
            }

            if (!fullAddress && svName && spName) {
                fullAddress = [svName, distName, spName].filter(Boolean).join(', ');
            }
        } else if (fullAddress) {
            const normAddr = normalizeText(fullAddress);
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

        // 5. Cập nhật hms_exm_contract
        let contractUpdated = false;
        if (!options.skipContract && (parsedDate || resolvedRoom)) {
            const setClauses: string[] = [];
            const setParams: any[] = [];
            if (parsedDate) {
                setParams.push(parsedDate.dateYmd);
                setClauses.push(`hec_examdate = $${setParams.length}`);
                setClauses.push(`hec_date = COALESCE(hec_date, $${setParams.length})`);
            }
            if (resolvedRoom) {
                setParams.push(resolvedRoom.roomId);
                setClauses.push(`hec_def_roomid = $${setParams.length}`);
            }
            setParams.push(options.contractId);
            await client.query(`
                UPDATE hms_exm_contract
                SET ${setClauses.join(', ')}
                WHERE hec_contract_id = $${setParams.length}
            `, setParams);
            contractUpdated = true;
        }

        // 6. Lấy danh sách nhân viên trong hợp đồng
        let empSql = `
            SELECT e.hee_employee_id, e.hee_patientno, e.hee_docno, e.hee_surname, e.hee_midname, e.hee_firstname,
                   e.hee_provid, e.hee_villid, e.hee_address, e.hee_prov_code, e.hee_vill_code,
                   to_char(e.hee_examdate, 'YYYY-MM-DD HH24:MI:SS') as hee_examdate,
                   ex.he_roomid as exam_room_id
            FROM hms_exm_employee e
            LEFT JOIN hms_exam ex ON ex.he_docno = e.hee_docno
            WHERE e.hee_contract_id = $1
        `;
        const empParams: any[] = [options.contractId];

        if (options.docNos && options.docNos.length > 0) {
            empParams.push(options.docNos);
            empSql += ` AND (e.hee_docno = ANY($${empParams.length}::int[]) OR e.hee_employee_id::text = ANY($${empParams.length}::text[]))`;
        }

        if (options.onlyMissing) {
            const missingConds: string[] = [];
            if (fullAddress || spId) {
                if (spId && svId) {
                    missingConds.push(`(e.hee_provid IS NULL OR e.hee_provid = 0 OR e.hee_villid IS NULL OR e.hee_villid = 0 OR e.hee_address IS NULL OR TRIM(e.hee_address) = '')`);
                } else {
                    missingConds.push(`(e.hee_address IS NULL OR TRIM(e.hee_address) = '')`);
                }
            }
            if (parsedDate) {
                missingConds.push(`(e.hee_examdate IS NULL)`);
            }
            if (missingConds.length > 0) {
                empSql += ` AND (${missingConds.join(' OR ')})`;
            }
        }

        empSql += ` ORDER BY e.hee_employee_id ASC`;
        const empRes = await client.query(empSql, empParams);
        const totalEmpFound = empRes.rows.length;

        const targetEmpIds = empRes.rows.map(r => r.hee_employee_id);
        const targetPatientNos = empRes.rows.map(r => r.hee_patientno).filter((p): p is number => p !== null && p > 0);
        const targetDocNos = empRes.rows.map(r => r.hee_docno).filter((d): d is number => d !== null && d > 0);

        // Preview tối đa 15 dòng cho giao diện
        const previewRows = empRes.rows.slice(0, 15).map(r => ({
            empId: r.hee_employee_id,
            name: [r.hee_surname, r.hee_midname, r.hee_firstname].filter(Boolean).join(' '),
            docNo: r.hee_docno || undefined,
            oldDate: r.hee_examdate || undefined,
            newDate: parsedDate ? parsedDate.timestampStr : r.hee_examdate,
            oldRoomId: r.exam_room_id ? parseInt(String(r.exam_room_id), 10) : oldRoomId,
            newRoomId: resolvedRoom ? resolvedRoom.roomId : (r.exam_room_id || oldRoomId),
            oldAddress: r.hee_address || undefined,
            newAddress: fullAddress || r.hee_address
        }));

        // 7. Cập nhật hms_exm_employee
        let updatedEmpCount = 0;
        if (!options.skipEmployee && targetEmpIds.length > 0) {
            const empSets: string[] = ['hee_updateddate = NOW()'];
            const empSetParams: any[] = [];

            if (parsedDate) {
                empSetParams.push(parsedDate.timestampStr);
                empSets.push(`hee_examdate = $${empSetParams.length}`);
            }

            if (spId && svId) {
                empSetParams.push(spId, svDistId, svId, spIdBh, svIdBh, fullAddress);
                const bIdx = empSetParams.length - 6;
                empSets.push(`hee_provid = $${bIdx + 1}`);
                empSets.push(`hee_distid = COALESCE(NULLIF($${bIdx + 2}, 0), hee_distid, 0)`);
                empSets.push(`hee_villid = $${bIdx + 3}`);
                empSets.push(`hee_prov_code = $${bIdx + 4}`);
                empSets.push(`hee_vill_code = $${bIdx + 5}`);
                empSets.push(`hee_address = COALESCE(NULLIF(TRIM(hee_address), ''), $${bIdx + 6})`);
            } else if (spId) {
                empSetParams.push(spId, spIdBh, fullAddress);
                const bIdx = empSetParams.length - 3;
                empSets.push(`hee_provid = $${bIdx + 1}`);
                empSets.push(`hee_prov_code = $${bIdx + 2}`);
                empSets.push(`hee_address = COALESCE(NULLIF(TRIM(hee_address), ''), $${bIdx + 3})`);
            } else if (fullAddress) {
                empSetParams.push(fullAddress);
                empSets.push(`hee_address = COALESCE(NULLIF(TRIM(hee_address), ''), $${empSetParams.length})`);
            }

            empSetParams.push(targetEmpIds);
            const updateEmpRes = await client.query(`
                UPDATE hms_exm_employee
                SET ${empSets.join(', ')}
                WHERE hee_employee_id = ANY($${empSetParams.length}::int[])
            `, empSetParams);
            updatedEmpCount = updateEmpRes.rowCount || 0;
        }

        // 8. Cập nhật hms_patient (nếu có địa chỉ)
        let updatedPatientsCount = 0;
        if (!options.skipPatient && targetPatientNos.length > 0 && (fullAddress || spId)) {
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
        }

        // 9. Cập nhật hms_doc
        let updatedDocsCount = 0;
        if (!options.skipDoc && targetDocNos.length > 0 && (parsedDate || fullAddress || spId)) {
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
            const updateDocRes = await client.query(`
                UPDATE hms_doc
                SET ${docSets.join(', ')}
                WHERE hd_docno = ANY($${docSetParams.length}::int[])
            `, docSetParams);
            updatedDocsCount = updateDocRes.rowCount || 0;
        }

        // 10. Cập nhật hms_exam
        let updatedExamsCount = 0;
        if (!options.skipExam && targetDocNos.length > 0 && (parsedDate || resolvedRoom)) {
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
            const updateExamRes = await client.query(`
                UPDATE hms_exam
                SET ${examSets.join(', ')}
                WHERE he_docno = ANY($${examParams.length}::int[])
            `, examParams);
            updatedExamsCount = updateExamRes.rowCount || 0;
        }

        // 11. Cập nhật health_check_masters & XML
        let updatedMastersCount = 0;
        if (!options.skipXml && (parsedDate || fullAddress || spId)) {
            const masterSql = `
                SELECT id, doc_no, his_employee_id, his_doc_no, xml_data, signature_status
                FROM health_check_masters
                WHERE his_contract_id = $1
                  AND (his_employee_id = ANY($2::varchar[]) 
                       OR (his_doc_no IS NOT NULL AND his_doc_no = ANY($3::varchar[]))
                       OR (doc_no IS NOT NULL AND doc_no = ANY($3::varchar[])))
            `;
            const masterRes = await client.query(masterSql, [
                options.contractId,
                targetEmpIds.map(String),
                targetDocNos.map(String)
            ]);

            const updatesToApply: Array<{ id: number; xml: string }> = [];
            for (const master of masterRes.rows) {
                if (master.xml_data) {
                    const newXml = updateXmlDataTags(master.xml_data, spIdBh, svIdBh, fullAddress, parsedDate);
                    if (newXml !== master.xml_data) {
                        updatesToApply.push({ id: master.id, xml: newXml });
                    }
                }
            }

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
        }

        // 12. Commit hoặc Rollback (Dry-Run)
        if (dryRun) {
            await client.query('ROLLBACK');
        } else {
            await client.query('COMMIT');
        }

        return {
            success: true,
            dryRun,
            contractInfo: {
                id: options.contractId,
                code: contractRow.hec_no || '',
                desc: contractDesc,
                oldDate: oldContractDate,
                newDate: parsedDate?.dateYmd,
                oldRoomId,
                newRoomId: resolvedRoom?.roomId,
                roomName: resolvedRoom?.roomName,
                deptId: resolvedRoom?.deptId
            },
            addressInfo: fullAddress ? {
                provId: spId,
                provBh: spIdBh,
                provName: spName,
                villId: svId,
                villBh: svIdBh,
                villName: svName,
                distName,
                fullAddress
            } : undefined,
            counts: {
                totalEmployees: totalEmpFound,
                contractUpdated,
                updatedEmployees: updatedEmpCount,
                updatedPatients: updatedPatientsCount,
                updatedDocs: updatedDocsCount,
                updatedExams: updatedExamsCount,
                updatedMasters: updatedMastersCount
            },
            previewRows,
            message: dryRun
                ? `Mô phỏng thành công! Phát hiện ${totalEmpFound} nhân viên sẽ được cập nhật.`
                : `Đã cập nhật thành công ${updatedEmpCount} nhân viên trong hợp đồng #${options.contractId}!`
        };

    } catch (err: any) {
        await client.query('ROLLBACK').catch(() => {});
        throw err;
    } finally {
        client.release();
    }
}
