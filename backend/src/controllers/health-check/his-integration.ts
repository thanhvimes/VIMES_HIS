import { Request, Response } from 'express';
import { query, transaction } from '../../config/database';
import { generateXmlPayload } from './xml-generator';
import { formatYmdString } from '../../services/health-check-merge.service';
import { evaluateFitnessClass, calculateAge, buildSpecialtyMetadata, sanitizeHisDate } from '../../services/health-check-classifier.service';

class HisIntegrationController {
    
    // Helper: Lấy dữ liệu cận lâm sàng cấu trúc cho HÀNG LOẠT docNos (Tối ưu hóa hiệu năng cao)
    public async fetchBatchStructuredParaclinicalData(docNos: number[]) {
        const resultMap = new Map<number, {
            hemoglobin: string;
            glycemia: string;
            protein: string;
            kqXnKhac: string;
            paraclinical_items: any[];
        }>();

        if (!docNos || docNos.length === 0) return resultMap;

        // Tải bản đồ ánh xạ từ bảng health_check_service_mappings
        const mappingMap = new Map<string, 'XN' | 'HA' | 'TD'>();
        try {
            const mappingRes = await query('SELECT service_code, cls_type FROM health_check_service_mappings');
            for (const r of mappingRes.rows) {
                mappingMap.set(String(r.service_code).trim(), r.cls_type as 'XN' | 'HA' | 'TD');
            }
        } catch (mapErr) {
            console.error('⚠️ [fetchBatchStructuredParaclinicalData] Lỗi truy vấn health_check_service_mappings, dùng fallback:', mapErr);
        }

        const determinePacsType = (gid: string, gname: string, sname: string, serviceCode?: string): 'XN' | 'HA' | 'TD' => {
            if (serviceCode) {
                const cleanCode = String(serviceCode).trim();
                if (mappingMap.has(cleanCode)) {
                    return mappingMap.get(cleanCode)!;
                }
            }

            const id = String(gid || '').toUpperCase();
            if (id.startsWith('A') || id.startsWith('B1')) return 'XN';
            if (id.startsWith('B2')) return 'HA';
            if (id.startsWith('B3')) return 'TD';

            const sNameLower = String(sname || '').toLowerCase();
            if (sNameLower.includes('điện tim') || sNameLower.includes('điện não') || 
                sNameLower.includes('nội soi') || sNameLower.includes('đo chức năng') || 
                sNameLower.includes('đo thính lực') || sNameLower.includes('đo thị lực') || 
                sNameLower.includes('thăm dò chức năng') || sNameLower.includes('đo loãng xương')) {
                return 'TD';
            }
            if (sNameLower.includes('siêu âm') || sNameLower.includes('x-quang') || 
                sNameLower.includes('x quang') || sNameLower.includes('chụp') || 
                sNameLower.includes('cộng hưởng từ') || sNameLower.includes('cắt lớp') || 
                sNameLower.includes('mri') || sNameLower.includes('ct')) {
                return 'HA';
            }

            const nameLower = String(gname || '').toLowerCase();
            if (nameLower.includes('hình ảnh') || nameLower.includes('siêu âm') || 
                nameLower.includes('x-quang') || nameLower.includes('x quang') || 
                nameLower.includes('chụp') || nameLower.includes('cắt lớp') || 
                nameLower.includes('mri') || nameLower.includes('ct')) {
                return 'HA';
            }
            if (nameLower.includes('thăm dò') || nameLower.includes('chức năng') || 
                nameLower.includes('nội soi') || nameLower.includes('điện tim') || 
                nameLower.includes('điện não') || nameLower.includes('đo ')) {
                return 'TD';
            }

            if (id.startsWith('C') || id.startsWith('B')) return 'HA';
            if (id.startsWith('D')) return 'TD';

            return 'HA';
        };

        const docCollectors = new Map<number, {
            items: any[];
            hemoglobin: string;
            glycemia: string;
            protein: string;
            otherTests: string[];
            pacsResults: string[];
            pacsMap: Map<string, any>;
        }>();

        for (const d of docNos) {
            docCollectors.set(d, {
                items: [],
                hemoglobin: '',
                glycemia: '',
                protein: '',
                otherTests: [],
                pacsResults: [],
                pacsMap: new Map()
            });
        }

        try {
            // 1. Batch truy vấn kết quả xét nghiệm (hms_testorderline)
            const testSql = `
                SELECT t.hpcl_docno AS doc_no,
                       TRIM(f.hfl_feeid) AS service_code, 
                       TRIM(COALESCE(p.hfl_regcode, f.hfl_regcode, f.hfl_feeid)) AS reg_code,
                       TRIM(COALESCE(f.hfl_ma_chi_so, p.hfl_ma_chi_so, p.hfl_regcode, f.hfl_regcode, f.hfl_feeid)) AS ma_chi_so,
                       TRIM(COALESCE(f.hfl_ma_chi_so, p.hfl_ma_chi_so, '')) AS hfl_ma_chi_so,
                       f.hfl_name AS service_name,
                       t.hpcl_result AS value, f.hfl_unit AS unit,
                       TRIM(f.hfl_groupid) AS group_id, g.hfg_name AS group_name,
                       t.hpcl_orderid AS order_id,
                       f.hfl_line AS line_no, TRIM(f.hfl_subitem) AS subitem,
                       p.hfl_name AS parent_name,
                       TRIM(p.hfl_feeid) AS parent_code,
                       TRIM(p.hfl_regcode) AS parent_regcode,
                       TRIM(p.hfl_ma_chi_so) AS parent_ma_chi_so,
                       COALESCE(p.hfl_line, f.hfl_line) AS parent_line
                FROM hms_testorderline t
                JOIN hms_fee_list f ON f.hfl_feeid = t.hpcl_itemid
                LEFT JOIN hms_fee_group g ON g.hfg_id = f.hfl_groupid
                LEFT JOIN hms_fee_list p ON p.hfl_feeid = f.hfl_subitem AND UPPER(TRIM(f.hfl_subitem)) <> 'Y'
                LEFT JOIN hms_testorder o ON o.hpc_orderid = t.hpcl_orderid AND o.hpc_docno = t.hpcl_docno
                WHERE t.hpcl_docno = ANY($1::int[])
                  AND COALESCE(t.hpcl_status, 'O') <> 'C'
                  AND COALESCE(o.hpc_status, 'O') <> 'C'
                ORDER BY t.hpcl_docno, f.hfl_groupid, 
                         t.hpcl_orderid, 
                         COALESCE(p.hfl_line, f.hfl_line), 
                         COALESCE(NULLIF(UPPER(TRIM(f.hfl_subitem)), 'Y'), TRIM(f.hfl_feeid)), 
                         CASE WHEN UPPER(TRIM(f.hfl_subitem)) = 'Y' THEN 0 ELSE 1 END, 
                         f.hfl_line
            `;
            const testRes = await query(testSql, [docNos]);
            for (const row of testRes.rows) {
                const col = docCollectors.get(row.doc_no);
                if (!col) continue;

                const nameLower = String(row.service_name || '').toLowerCase();
                const val = String(row.value || '').trim();
                const groupId = row.group_id || 'A01';
                const groupName = row.group_name || 'Xét nghiệm';

                if (nameLower.includes('hemoglobin') || nameLower.includes('hgb') || nameLower.includes('huyết sắc tố') || nameLower.includes('hst')) {
                    if (!col.hemoglobin) col.hemoglobin = val;
                } else if (nameLower.includes('glucose') || nameLower.includes('đường huyết') || nameLower.includes('đường máu')) {
                    if (!col.glycemia) col.glycemia = val;
                } else if (nameLower.includes('protein niệu') || nameLower.includes('protein nước tiểu') || (nameLower.includes('protein') && nameLower.includes('nước tiểu'))) {
                    if (!col.protein) col.protein = val;
                } else {
                    if (val) {
                        col.otherTests.push(`${row.service_name}: ${val}${row.unit ? ' ' + row.unit.trim() : ''}`);
                    }
                }

                col.items.push({
                    service_code: row.service_code,
                    reg_code: row.reg_code || row.service_code,
                    ma_chi_so: row.ma_chi_so || row.hfl_ma_chi_so || row.reg_code || row.service_code,
                    hfl_ma_chi_so: row.hfl_ma_chi_so || row.ma_chi_so || '',
                    service_name: row.service_name,
                    index_code: row.service_code,
                    index_name: row.service_name,
                    value: val,
                    unit: row.unit || '',
                    description: '',
                    conclusion: val ? 'Bình thường' : '',
                    group_id: groupId,
                    group_name: groupName,
                    order_id: row.order_id ? String(row.order_id) : '',
                    type: determinePacsType(groupId, groupName, row.service_name, row.service_code),
                    line_no: row.line_no,
                    subitem: row.subitem,
                    parent_name: row.parent_name || '',
                    parent_code: row.parent_code || '',
                    parent_line: row.parent_line
                });
            }

            // 1.1 Tự động nạp chỉ số xét nghiệm con nếu chỉ định cha chưa mở rộng
            const parentCodes = Array.from(new Set(testRes.rows
                .map((r: any) => String(r.service_code || '').trim())
                .filter(Boolean)));

            if (parentCodes.length > 0) {
                const subRes = await query(`
                    SELECT TRIM(f.hfl_feeid) AS service_code, 
                           TRIM(COALESCE(p.hfl_regcode, f.hfl_regcode, f.hfl_feeid)) AS reg_code,
                           TRIM(COALESCE(f.hfl_ma_chi_so, p.hfl_ma_chi_so, p.hfl_regcode, f.hfl_regcode, f.hfl_feeid)) AS ma_chi_so,
                           TRIM(COALESCE(f.hfl_ma_chi_so, p.hfl_ma_chi_so, '')) AS hfl_ma_chi_so,
                           f.hfl_name AS service_name,
                           f.hfl_unit AS unit, TRIM(f.hfl_groupid) AS group_id, g.hfg_name AS group_name,
                           f.hfl_line AS line_no, TRIM(f.hfl_subitem) AS subitem,
                           p.hfl_name AS parent_name, TRIM(p.hfl_feeid) AS parent_code,
                           TRIM(p.hfl_regcode) AS parent_regcode,
                           TRIM(p.hfl_ma_chi_so) AS parent_ma_chi_so,
                           COALESCE(p.hfl_line, f.hfl_line) AS parent_line
                    FROM hms_fee_list f
                    JOIN hms_fee_list p ON TRIM(p.hfl_feeid) = TRIM(f.hfl_subitem)
                    LEFT JOIN hms_fee_group g ON TRIM(g.hfg_id) = TRIM(f.hfl_groupid)
                    WHERE TRIM(f.hfl_subitem) = ANY($1) AND f.hfl_active = 'Y'
                    ORDER BY f.hfl_subitem, f.hfl_line
                `, [parentCodes]);

                for (const subRow of subRes.rows) {
                    for (const col of docCollectors.values()) {
                        const existing = col.items.find(it => it.service_code === subRow.service_code);
                        if (!existing) {
                            const parentItem = col.items.find(it => it.service_code === subRow.parent_code);
                            if (parentItem) {
                                col.items.push({
                                    service_code: subRow.service_code,
                                    reg_code: subRow.reg_code || subRow.service_code,
                                    ma_chi_so: subRow.ma_chi_so || subRow.hfl_ma_chi_so || subRow.reg_code || subRow.service_code,
                                    hfl_ma_chi_so: subRow.hfl_ma_chi_so || subRow.ma_chi_so || '',
                                    service_name: subRow.service_name,
                                    index_code: subRow.service_code,
                                    index_name: subRow.service_name,
                                    value: '',
                                    unit: subRow.unit || '',
                                    description: '',
                                    conclusion: '',
                                    group_id: subRow.group_id || 'B1100',
                                    group_name: subRow.group_name || 'Xét nghiệm',
                                    order_id: parentItem?.order_id || '',
                                    type: 'XN',
                                    line_no: subRow.line_no,
                                    subitem: subRow.subitem,
                                    parent_name: subRow.parent_name || '',
                                    parent_code: subRow.parent_code || '',
                                    parent_line: subRow.parent_line
                                });
                            }
                        }
                    }
                }
            }

            // 2. Batch truy vấn kết quả hình ảnh & thăm dò chức năng (hms_pacsorderline)
            const pacsSql = `
                SELECT p.hpcl_docno AS doc_no,
                       f.hfl_feeid AS service_code, 
                       TRIM(COALESCE(f.hfl_regcode, f.hfl_feeid)) AS reg_code,
                       TRIM(COALESCE(f.hfl_ma_chi_so, f.hfl_regcode, f.hfl_feeid)) AS ma_chi_so,
                       TRIM(COALESCE(f.hfl_ma_chi_so, '')) AS hfl_ma_chi_so,
                       f.hfl_name AS service_name,
                       r.hpr_desc AS result_desc, f.hfl_unit AS unit,
                       f.hfl_groupid AS group_id, g.hfg_name AS group_name,
                       r.hpr_name AS result_name,
                       p.hpcl_orderid AS order_id
                FROM hms_pacsorderline p
                LEFT JOIN hms_pacs_result r ON r.hpr_orderid = p.hpcl_orderid AND r.hpr_itemid = p.hpcl_itemid
                LEFT JOIN hms_fee_list f ON f.hfl_feeid = p.hpcl_itemid
                LEFT JOIN hms_fee_group g ON g.hfg_id = f.hfl_groupid
                LEFT JOIN hms_pacsorder po ON po.hpc_orderid = p.hpcl_orderid AND po.hpc_docno = p.hpcl_docno
                WHERE p.hpcl_docno = ANY($1::int[])
                  AND COALESCE(p.hpcl_status, 'O') <> 'C'
                  AND COALESCE(po.hpc_status, 'O') <> 'C'
                ORDER BY p.hpcl_docno, f.hfl_groupid, p.hpcl_orderid, p.hpcl_orderlineid, r.hpr_name DESC
            `;
            const pacsRes = await query(pacsSql, [docNos]);
            for (const row of pacsRes.rows) {
                const col = docCollectors.get(row.doc_no);
                if (!col) continue;

                const code = row.service_code || 'PACS';
                const orderId = row.order_id ? String(row.order_id) : '';
                const key = `${orderId}_${code}`;
                if (!col.pacsMap.has(key)) {
                    const groupId = row.group_id || 'B01';
                    const groupName = row.group_name || 'Chẩn đoán hình ảnh';
                    const serviceName = row.service_name || 'Cận lâm sàng';
                    col.pacsMap.set(key, {
                        service_code: code,
                        reg_code: row.reg_code || code,
                        ma_chi_so: row.ma_chi_so || row.hfl_ma_chi_so || row.reg_code || code,
                        hfl_ma_chi_so: row.hfl_ma_chi_so || row.ma_chi_so || '',
                        service_name: serviceName,
                        index_code: code,
                        index_name: serviceName,
                        value: '',
                        unit: row.unit || '',
                        description: '',
                        conclusion: '',
                        group_id: groupId,
                        group_name: groupName,
                        order_id: orderId,
                        type: determinePacsType(groupId, groupName, serviceName, code)
                    });
                }

                const item = col.pacsMap.get(key);
                const resName = String(row.result_name || '').trim().toLowerCase();
                const descVal = String(row.result_desc || '').trim();

                if (resName === 'conclusion' || resName === 'result') {
                    item.conclusion = descVal;
                    item.value = descVal;
                } else if (resName === 'remark') {
                    item.description = descVal;
                } else if (descVal) {
                    item.description = item.description ? `${item.description}; ${descVal}` : descVal;
                }
            }

            // 3. Tổng hợp kết quả cho tất cả docNos
            for (const [docNo, col] of docCollectors.entries()) {
                for (const item of col.pacsMap.values()) {
                    if (!item.value && item.description) {
                        item.value = item.description;
                    }
                    col.items.push(item);
                    const desc = item.conclusion || item.description || '';
                    if (desc) {
                        col.pacsResults.push(`${item.service_name}: ${desc}`);
                    }
                }

                const extraParts: string[] = [];
                if (col.otherTests.length > 0) {
                    extraParts.push(`Xét nghiệm khác: ${col.otherTests.join('; ')}`);
                }
                if (col.pacsResults.length > 0) {
                    extraParts.push(`Chẩn đoán hình ảnh: ${col.pacsResults.join('; ')}`);
                }
                const kqXnKhac = extraParts.join('. ');

                resultMap.set(docNo, {
                    hemoglobin: col.hemoglobin,
                    glycemia: col.glycemia,
                    protein: col.protein,
                    kqXnKhac,
                    paraclinical_items: col.items
                });
            }

        } catch (e) {
            console.error('Error fetching batch structured paraclinical data from HIS:', e);
        }

        return resultMap;
    }

    // Helper: Lấy dữ liệu cận lâm sàng cấu trúc từ HIS cho 1 docNo
    public async fetchStructuredParaclinicalData(docNo: number) {
        const batchMap = await this.fetchBatchStructuredParaclinicalData([docNo]);
        return batchMap.get(docNo) || {
            hemoglobin: '',
            glycemia: '',
            protein: '',
            kqXnKhac: '',
            paraclinical_items: []
        };
    }

    // 8. Đồng bộ dữ liệu KSK từ HIS — Smart UPSERT (đồng bộ đầy đủ như getHisPatient)
    async seedFromHis(req: Request, res: Response) {
        try {
            const { startDate, endDate, workplaceId } = req.body;

            // workplaceId đại diện cho contract ID được chọn
            const contractId = workplaceId ? parseInt(String(workplaceId), 10) : null;
            if (!contractId) {
                return res.status(400).json({ error: 'Vui lòng chọn Hợp đồng Khám sức khỏe để đồng bộ.' });
            }

            // Lấy mẫu KSK cấu hình trên hợp đồng
            const contractRes = await query('SELECT hec_form_type, hec_desc FROM hms_exm_contract WHERE hec_contract_id = $1', [contractId]);
            const defaultFormType = contractRes.rows[0]?.hec_form_type || '';

            let sqlFilters = '';
            const queryParams: any[] = [contractId]; // $1
            let paramIndex = 2;

            if (startDate && String(startDate).trim() !== '') {
                sqlFilters += ` AND d.hd_admitdate >= $${paramIndex}::timestamp`;
                queryParams.push(`${String(startDate).trim()} 00:00:00`);
                paramIndex++;
            }
            if (endDate && String(endDate).trim() !== '') {
                sqlFilters += ` AND d.hd_admitdate <= $${paramIndex}::timestamp`;
                queryParams.push(`${String(endDate).trim()} 23:59:59`);
                paramIndex++;
            }

            // Lấy danh sách nhân viên từ HIS theo hợp đồng (đầy đủ thông tin hms_exm_employee, hms_doc, hms_patient, sys_company)
            const hisSql = `
                SELECT 
                    hee.hee_employee_id,
                    hee.hee_id,
                    TRIM(COALESCE(hee.hee_surname, '') || ' ' || COALESCE(hee.hee_midname, '') || ' ' || COALESCE(hee.hee_firstname, '')) as employee_name,
                    p.hp_patientno as patient_id,
                    TRIM(COALESCE(p.hp_surname, '') || ' ' || COALESCE(p.hp_midname, '') || ' ' || COALESCE(p.hp_firstname, '')) as patient_name,
                    COALESCE(to_char(hee.hee_birthdate, 'YYYY-MM-DD'), to_char(p.hp_birthdate, 'YYYY-MM-DD')) as dob,
                    COALESCE(hee.hee_sex, p.hp_sex) as sex,
                    COALESCE(hee.hee_ethnic, p.hp_ethnic) as ethnic,
                    COALESCE(NULLIF(TRIM(d.hd_dtladdr), ''), NULLIF(TRIM(hee.hee_address), ''), NULLIF(TRIM(p.hp_dtladdr), ''), hms_getaddress(COALESCE(d.hd_provid, p.hp_provid, hee.hee_provid, 0), COALESCE(d.hd_distid, p.hp_distid, hee.hee_distid, 0), COALESCE(d.hd_villid, p.hp_villid, hee.hee_villid, 0)), '') as address,
                    COALESCE(hee.hee_patientno, p.hp_patientno) as patientno,
                    hee.hee_status,
                    hee.hee_docno,
                    COALESCE(NULLIF(TRIM(hee.hee_phone), ''), NULLIF(TRIM(d.hd_telephone), '')) as phone,
                    COALESCE(NULLIF(TRIM(hee.hee_cardid), ''), NULLIF(TRIM(p.hp_sin), '')) as cccd,
                    hee.hee_cardid_date,
                    to_char(p.hp_ngaycap, 'YYYY-MM-DD') as hp_ngaycap,
                    COALESCE(NULLIF(TRIM(hee.hee_cardid_place), ''), NULLIF(TRIM(p.hp_noicap), '')) as cccd_place,
                    hee.hee_guardian_name,
                    hee.hee_guardian_cccd,
                    COALESCE(hee.hee_occupation, p.hp_occupation) as occupation,
                    COALESCE(NULLIF(TRIM(p.hp_workplace), ''), NULLIF(TRIM(hee.hee_dept), ''), c.hec_desc, comp.sc_name, '') as workplace,
                    COALESCE(p.hp_nationality, hee.hee_countryid, 'VIE') as nationality,
                    COALESCE(hee.hee_abo, p.hp_abo, '') as blood_group,
                    hee.hee_target_group,
                    hee.hee_height,
                    hee.hee_weight,
                    to_char(d.hd_admitdate, 'DD/MM/YYYY') as admitdate,
                    to_char(d.hd_admitdate, 'HH24:MI') as admit_time,
                    to_char(d.hd_admitdate, 'YYYY-MM-DD') as admit_ymd,
                    COALESCE(hms_getusername(d.hd_doctor), 'BS. Nguyễn Văn A') as doctor_name,
                    COALESCE(d.hd_provid, p.hp_provid, hee.hee_provid, 0) as provid,
                    COALESCE(d.hd_distid, p.hp_distid, hee.hee_distid, 0) as distid,
                    COALESCE(d.hd_villid, p.hp_villid, hee.hee_villid, 0) as villid,
                    d.hd_cardno,
                    d.hd_result,
                    d.hd_conclusion,
                    d.hd_suggestion,
                    d.hd_treatmethod,
                    d.hd_doctor,
                    d.hd_status
                FROM hms_exm_employee hee
                LEFT JOIN hms_doc d ON d.hd_docno = hee.hee_docno
                LEFT JOIN hms_patient p ON (p.hp_patientno = hee.hee_patientno OR p.hp_patientno = d.hd_patientno)
                LEFT JOIN hms_exm_contract c ON c.hec_contract_id = hee.hee_contract_id
                LEFT JOIN sys_company comp ON comp.sc_id = c.hec_company_id
                WHERE hee.hee_contract_id = $1 AND hee.hee_isactive = 'Y' ${sqlFilters}
                ORDER BY hee.hee_employee_id
            `;
            const hisResult = await query(hisSql, queryParams);

            if (hisResult.rows.length === 0) {
                return res.status(404).json({
                    error: 'Không tìm thấy bệnh nhân nào trong hợp đồng KSK này khớp với điều kiện lọc.'
                });
            }

            const docNos = hisResult.rows.map(r => r.hee_docno).filter(d => d && Number(d) > 0);
            const patNos = hisResult.rows.map(r => r.patientno).filter(p => p && Number(p) > 0);

            // 1. Batch query hms_exam (lấy chỉ số sinh hiệu và khám lâm sàng mới nhất)
            const examMap = new Map<number, any>();
            if (docNos.length > 0) {
                const examRes = await query(`
                    SELECT DISTINCT ON (e.he_docno)
                        e.he_docno,
                        e.he_pulse, e.he_temperature, e.he_bloodpressure, e.he_bloodpressurex, 
                        e.he_breathinterval, e.he_weight, e.he_height, e.he_bmi, 
                        e.he_doctor, e.he_medical, e.he_examine, e.he_parts, 
                        e.he_prediagnostic, e.he_diagnostic, e.he_icd10, e.he_status,
                        to_char(e.he_examdate, 'YYYY-MM-DD') as exam_date,
                        to_char(e.he_examdate, 'HH24:MI') as exam_time,
                        to_char(e.he_examdate, 'YYYY-MM-DD HH24:MI:SS') as exam_datetime,
                        hms_getusername(e.he_doctor) as doctor_name
                    FROM hms_exam e 
                    WHERE e.he_docno = ANY($1::int[])
                    ORDER BY e.he_docno, (CASE WHEN e.he_status = 'T' THEN 1 ELSE 2 END), e.he_receptidx DESC
                `, [docNos]);
                for (const ex of examRes.rows) {
                    examMap.set(ex.he_docno, ex);
                }
            }

            // 2. Batch query hms_exm_conclusion (kết luận & chi tiết chuyên khoa KSK)
            const conclMap = new Map<number, any>();
            if (docNos.length > 0) {
                const conclRes = await query(`
                    SELECT 
                        hecl_docno, hecl_theluc, hecl_tuanhoan, hecl_hohap, hecl_tieuhoa,
                        hecl_thantietnieu, hecl_noitiet, hecl_coxuongkhop, hecl_thankinh, hecl_tamthan,
                        hecl_ngoai, hecl_dalieu, hecl_mat, hecl_tmh, hecl_rhm, hecl_phukhoa,
                        hecl_phanloai, hecl_conclusion, hecl_remark
                    FROM hms_exm_conclusion
                    WHERE hecl_docno = ANY($1::int[])
                `, [docNos]);
                for (const c of conclRes.rows) {
                    conclMap.set(c.hecl_docno, c);
                }
            }

            // 3. Batch query hms_disease_hist (tiền sử bệnh tật, gia đình & dị ứng thuốc)
            const histMap = new Map<string, any>();
            if (docNos.length > 0 || patNos.length > 0) {
                const histRes = await query(`
                    SELECT DISTINCT ON (COALESCE(hdh_docno, hdh_patientno))
                        hdh_docno, hdh_patientno, hdh_owner, hdh_family, hdh_drugallergy
                    FROM hms_disease_hist
                    WHERE hdh_docno = ANY($1::int[]) OR hdh_patientno = ANY($2::int[])
                    ORDER BY COALESCE(hdh_docno, hdh_patientno), hdh_createddate DESC
                `, [docNos, patNos]);
                for (const h of histRes.rows) {
                    if (h.hdh_docno) histMap.set('d_' + h.hdh_docno, h);
                    if (h.hdh_patientno) histMap.set('p_' + h.hdh_patientno, h);
                }
            }

            // 4. Batch query cận lâm sàng (Xét nghiệm + PACS/TDCN)
            const paraclinicalMap = await this.fetchBatchStructuredParaclinicalData(docNos);

            let insertedCount = 0;      // Tạo mới
            let fullUpdateCount = 0;    // Cập nhật đầy đủ từ HIS
            let skippedSignedCount = 0; // Bỏ qua: đã ký số
            let skippedSentCount = 0;   // Bỏ qua: đã gửi VNeID

            // Tìm kiếm đầy đủ hồ sơ đã có theo contractId, employee_id, doc_no hoặc his_doc_no
            const empIds = hisResult.rows.map(r => String(r.hee_employee_id)).filter(Boolean);
            const allCandidateDocNos = hisResult.rows.map(r => String(r.hee_docno || r.hee_employee_id)).filter(Boolean);
            const hisDocNos = hisResult.rows.map(r => r.hee_docno ? String(r.hee_docno) : null).filter((d): d is string => d !== null);

            const existingRes = await query(`
                SELECT id, his_employee_id, doc_no, his_doc_no, signature_status, send_status
                FROM health_check_masters
                WHERE his_contract_id = $1
                   OR his_employee_id = ANY($2::varchar[])
                   OR doc_no = ANY($3::varchar[])
                   OR (his_doc_no IS NOT NULL AND his_doc_no = ANY($4::varchar[]))
            `, [contractId, empIds, allCandidateDocNos, hisDocNos.length > 0 ? hisDocNos : ['__NONE__']]);

            const byHisEmpId = new Map<string, any>();
            const byDocNo = new Map<string, any>();
            const masterIds = existingRes.rows.map(r => r.id);
            for (const rec of existingRes.rows) {
                if (rec.his_employee_id) byHisEmpId.set(String(rec.his_employee_id), rec);
                if (rec.his_doc_no) byDocNo.set(String(rec.his_doc_no), rec);
                if (rec.doc_no) byDocNo.set(String(rec.doc_no), rec);
            }

            const detailSet = new Set<number>();
            if (masterIds.length > 0) {
                const detailRes = await query(`SELECT master_id FROM health_check_details WHERE master_id = ANY($1::int[])`, [masterIds]);
                for (const d of detailRes.rows) {
                    detailSet.add(d.master_id);
                }
            }

            const CHUNK_SIZE = 5;
            for (let i = 0; i < hisResult.rows.length; i += CHUNK_SIZE) {
                const chunk = hisResult.rows.slice(i, i + CHUNK_SIZE);
                await Promise.all(chunk.map(async (row) => {
                    const hisEmpId = String(row.hee_employee_id);
                    const docNo = String(row.hee_docno || row.hee_employee_id);
                    const docNoVal = row.hee_docno ? Number(row.hee_docno) : null;
                    const patientNoVal = row.patientno ? Number(row.patientno) : null;

                    const existing = byHisEmpId.get(hisEmpId) || byDocNo.get(docNo) || (docNoVal ? byDocNo.get(String(docNoVal)) : null);

                    // Kịch bản 1: Đã gửi VNeID thành công → BỎ QUA
                    if (existing && existing.send_status === 'Success') {
                        skippedSentCount++;
                        return;
                    }

                    // Kịch bản 2: Đã ký số → BỎ QUA
                    if (existing && existing.signature_status === 'Signed') {
                        skippedSignedCount++;
                        return;
                    }

                    // Tự động nhận diện Mẫu biểu áp dụng theo độ tuổi
                    let formType = defaultFormType;
                    if (!formType || formType === '1' || formType === '2' || formType === '3') {
                        if (row.dob) {
                            const bDate = new Date(row.dob);
                            if (!isNaN(bDate.getTime())) {
                                const today = new Date();
                                let age = today.getFullYear() - bDate.getFullYear();
                                if (today.getMonth() < bDate.getMonth() || (today.getMonth() === bDate.getMonth() && today.getDate() < bDate.getDate())) {
                                    age--;
                                }
                                if (age < 6) formType = '1';
                                else if (age < 18) formType = '2';
                                else formType = '3';
                            } else {
                                formType = formType || '3';
                            }
                        } else {
                            formType = formType || '3';
                        }
                    }

                    const examRow = docNoVal ? examMap.get(docNoVal) : null;
                    const conclRow = docNoVal ? conclMap.get(docNoVal) : null;
                    const histRow = docNoVal ? histMap.get('d_' + docNoVal) : (patientNoVal ? histMap.get('p_' + patientNoVal) : null);

                    const labAndPacs = docNoVal ? (paraclinicalMap.get(docNoVal) || {
                        hemoglobin: '', glycemia: '', protein: '', kqXnKhac: '', paraclinical_items: []
                    }) : {
                        hemoglobin: '', glycemia: '', protein: '', kqXnKhac: '', paraclinical_items: []
                    };

                    const genderVal = (row.sex || '').toLowerCase();
                    const gender = (genderVal === 'm' || genderVal.includes('nam') || genderVal === '1') ? 'Nam' : 'Nữ';
                    const patientName = (row.patient_name || row.employee_name || '').toUpperCase().trim();
                    const cccd = row.cccd || '';
                    const patientId = String(row.patientno || row.patient_id || row.hee_employee_id);

                    let bpStr = '';
                    if (examRow?.he_bloodpressure && examRow?.he_bloodpressurex) {
                        bpStr = `${examRow.he_bloodpressure}/${examRow.he_bloodpressurex}`;
                    } else if (examRow?.he_bloodpressure) {
                        bpStr = String(examRow.he_bloodpressure);
                    }

                    const heightVal = examRow?.he_height ? String(examRow.he_height) : (row.hee_height > 0 ? String(row.hee_height) : '');
                    const weightVal = examRow?.he_weight ? String(examRow.he_weight) : (row.hee_weight > 0 ? String(row.hee_weight) : '');
                    let bmiVal = '';
                    if (examRow?.he_bmi && Number(examRow.he_bmi) > 0) {
                        bmiVal = Number(examRow.he_bmi).toFixed(2);
                    } else if (heightVal && weightVal && Number(heightVal) > 0 && Number(weightVal) > 0) {
                        const hM = Number(heightVal) / 100;
                        bmiVal = (Number(weightVal) / (hM * hM)).toFixed(2);
                    }

                    const internalText = [
                        conclRow?.hecl_tuanhoan,
                        conclRow?.hecl_hohap,
                        conclRow?.hecl_tieuhoa,
                        conclRow?.hecl_thantietnieu,
                        conclRow?.hecl_noitiet,
                        conclRow?.hecl_coxuongkhop,
                        examRow?.he_examine,
                        examRow?.he_parts
                    ].filter(Boolean).map((s: string) => String(s).trim()).join('\n');

                    const docName = examRow?.doctor_name || row.doctor_name || 'BS. Nguyễn Văn A';
                    const hasConclusion = (examRow?.he_status === 'T') ||
                                          (row.hd_status === 'T') ||
                                          !!conclRow?.hecl_phanloai ||
                                          !!conclRow?.hecl_conclusion ||
                                          (examRow?.he_diagnostic && examRow.he_diagnostic.trim() !== '') ||
                                          (row.hd_conclusion && row.hd_conclusion.trim() !== '') ||
                                          (row.hd_result && row.hd_result.trim() !== '');

                    const specialtyMetadata: any = {};
                    if (hasConclusion) {
                        const keys = ['admin', 'history', 'conclusion', 'internal', 'eye', 'ent', 'dental', 'external', 'dermatology', 'gynecology'];
                        keys.forEach(k => {
                            specialtyMetadata[k] = {
                                doctorId: examRow?.he_doctor || row.hd_doctor || docName,
                                doctorName: docName,
                                status: 'ĐÃ_KHÁM',
                                updatedAt: new Date().toISOString()
                            };
                        });
                    }

                    const occCode = row.occupation ? String(row.occupation).trim() : '';
                    const cleanCccdDate = sanitizeHisDate(row.hee_cardid_date || row.hp_ngaycap);

                    const clinicalData: any = {
                        address: row.address || '',
                        phone: row.phone || '',
                        ethnic: row.ethnic ? String(row.ethnic).padStart(2, '0') : '01',
                        matinh_cu_tru: (row.provid && row.provid !== 0) ? String(row.provid) : '',
                        mahuyen_cu_tru: (row.distid && row.distid !== 0) ? String(row.distid) : '',
                        maxa_cu_tru: (row.villid && row.villid !== 0) ? String(row.villid) : '',
                        cccd_date: cleanCccdDate,
                        cccd_place: row.cccd_place || '',
                        nguoi_giam_ho: row.hee_guardian_name || '',
                        so_cccd_ngh: row.hee_guardian_cccd || '',
                        ma_nghe_nghiep: occCode,
                        occupation: occCode,
                        noi_cong_tac_hien_tai: row.workplace || '',
                        noi_cong_tac: row.workplace || '',
                        workplace: row.workplace || '',
                        quoc_tich: row.nationality || 'VNM',
                        blood_group: row.blood_group || '',
                        target_group: row.hee_target_group || '14',
                        funding_source: '9',
                        ngay_vao: examRow?.exam_date || row.admit_ymd || '',
                        gio_kham: examRow?.exam_time || row.admit_time || '',
                        insurance_card: row.hd_cardno || '',
                        examination: {
                            height: heightVal,
                            weight: weightVal,
                            bmi: bmiVal,
                            blood_pressure: bpStr,
                            bp: bpStr,
                            pulse: examRow?.he_pulse ? String(examRow.he_pulse) : '',
                            temperature: examRow?.he_temperature ? String(examRow.he_temperature) : '',
                            nhiet_do: examRow?.he_temperature ? String(examRow.he_temperature) : '',
                            breathing_rate: examRow?.he_breathinterval ? String(examRow.he_breathinterval) : '',
                            nhip_tho: examRow?.he_breathinterval ? String(examRow.he_breathinterval) : '',
                            physical_summary: conclRow?.hecl_theluc || examRow?.he_examine || ''
                        },
                        clinical_exam: {
                            specialty_metadata: specialtyMetadata,
                            internal: internalText || '',
                            eye: conclRow?.hecl_mat || '',
                            ent: conclRow?.hecl_tmh || '',
                            dental: conclRow?.hecl_rhm || '',
                            external: conclRow?.hecl_ngoai || '',
                            dermatology: conclRow?.hecl_dalieu || '',
                            gynecology: conclRow?.hecl_phukhoa || '',
                            neurology: conclRow?.hecl_thankinh || '',
                            psychiatry: conclRow?.hecl_tamthan || '',
                            noi_khoa_tuan_hoan: conclRow?.hecl_tuanhoan || (examRow?.he_parts ? String(examRow.he_parts).trim() : ''),
                            noi_khoa_ho_hap: conclRow?.hecl_hohap || (examRow?.he_parts ? String(examRow.he_parts).trim() : ''),
                            noi_khoa_tieu_hoa: conclRow?.hecl_tieuhoa || '',
                            noi_khoa_than_tietnieu_pl: conclRow?.hecl_thantietnieu || '',
                            noi_khoa_than_kinh: conclRow?.hecl_thankinh || '',
                            noi_khoa_tam_than: conclRow?.hecl_tamthan || '',
                            nhi_tuan_hoan: conclRow?.hecl_tuanhoan || (examRow?.he_parts ? String(examRow.he_parts).trim() : ''),
                            nhi_ho_hap: conclRow?.hecl_hohap || (examRow?.he_parts ? String(examRow.he_parts).trim() : ''),
                            nhi_tieu_hoa: conclRow?.hecl_tieuhoa || '',
                            nhi_than_kinh: conclRow?.hecl_thankinh || '',
                            nhi_tam_than: conclRow?.hecl_tamthan || ''
                        },
                        extra: {
                            gio_kham: examRow?.exam_time || row.admit_time || '',
                            ngay_kham: examRow?.exam_date || row.admit_ymd || '',
                            ngay_kham_his: row.admitdate || '',
                            ma_nghe_nghiep: occCode,
                            occupation: occCode,
                            noi_cong_tac_hien_tai: row.workplace || '',
                            noi_cong_tac: row.workplace || '',
                            workplace: row.workplace || '',
                            cccd_date: cleanCccdDate,
                            tsgd_mac_benh: histRow?.hdh_family ? '1' : '0',
                            tsgd_ma_benh: histRow?.hdh_family ? String(histRow.hdh_family).trim() : '',
                            ts_mac_benh: histRow?.hdh_owner ? '1' : '0',
                            tsbt_ma_benh: histRow?.hdh_owner ? String(histRow.hdh_owner).trim() : '',
                            tsbt_dang_dieu_tri_benh: (histRow?.hdh_owner || examRow?.he_medical) ? '1' : '0',
                            benh_dang_dieu_tri: (histRow?.hdh_owner || examRow?.he_medical) ? String(histRow?.hdh_owner || examRow?.he_medical).trim() : '',
                            di_ung_thuoc: histRow?.hdh_drugallergy ? String(histRow.hdh_drugallergy).trim() : '',
                            qua_trinh_benh_ly: examRow?.he_medical ? String(examRow.he_medical).trim() : '',
                            cac_benh_tat_neu_co: (histRow?.hdh_owner || conclRow?.hecl_conclusion || examRow?.he_diagnostic) ? String(histRow?.hdh_owner || conclRow?.hecl_conclusion || examRow?.he_diagnostic).trim() : '',
                            nhiet_do: examRow?.he_temperature ? String(examRow.he_temperature) : '',
                            nhip_tho: examRow?.he_breathinterval ? String(examRow.he_breathinterval) : '',
                            bmi: bmiVal,
                            doctor_name: docName
                        }
                    };

                    const labData: any = {
                        blood_test: {
                            hemoglobin: labAndPacs.hemoglobin || '',
                            glycemia: labAndPacs.glycemia || ''
                        },
                        urine_test: { protein: labAndPacs.protein || '' },
                        kq_xn_khac: labAndPacs.kqXnKhac || '',
                        paraclinical_items: (labAndPacs.paraclinical_items || []).map((item: any) => ({
                            ...item,
                            is_his_value: !!item.value,
                            user_edited: false
                        }))
                    };

                    // Form-specific extras
                    if (formType === 'driver' || formType === 'mau3-driver') {
                        clinicalData.clinical_exam = {
                            ...clinicalData.clinical_exam,
                            noi_khoa_tam_than: 'Bình thường, tâm thần ổn định',
                            noi_khoa_than_kinh: 'Không phát hiện bệnh lý thần kinh',
                            sac_giac: '0', thi_truong_ngang_haimat: 'Bình thường', thi_truong_dung_haimat: 'Bình thường'
                        };
                        clinicalData.extra = {
                            ...clinicalData.extra,
                            hang_lai_xe: 'B2', tsgd_mac_benh: 0, ts_benh_thuong_5_nam: '0',
                            ts_than_kinh_chan_thuong_dau: '0', ts_benh_mat_giam_thi_luc: '0',
                            ts_benh_tai_giam_nghe: '0', ts_benh_tim_mach: '0', ts_phau_thuat_tim_mach: '0',
                            ts_tang_huyet_ap: '0', ts_kho_tho: '0', ts_benh_phoi_hen: '0',
                            ts_benh_than_loc_mau: '0', ts_dai_thao_duong: '0', ts_benh_tam_than: '0',
                            ts_mat_roi_loan_y_thuc: '0', ts_ngat_chong_mat: '0', ts_benh_tieu_hoa: '0',
                            ts_roi_loan_giac_ngu: '0', ts_tai_bien_mach_mau_nao: '0', ts_su_dung_ruou: '0',
                            ts_su_dung_ma_tuy: '0', ts_benh_cot_song: '0', tsgd_ma_benh: '', tsbt_ma_benh: '',
                            co_dang_dieu_tri_benh: '0', ma_benh_dang_dieu_tri: '', ten_thuoc: ''
                        };
                    } else if (formType === '4') {
                        clinicalData.clinical_exam = {
                            ...clinicalData.clinical_exam,
                            kq_tam_than: 'Bình thường', kq_than_kinh: 'Bình thường',
                            kq_tim_mach: 'Bình thường', kq_ho_hap: 'Bình thường',
                            kq_noi_tiet: 'Bình thường', kq_ngoai_khoa: 'Bình thường',
                            kq_da_lieu: 'Bình thường', kq_tiet_nieu: 'Bình thường',
                            kq_sinh_duc: 'Bình thường', kq_tai_mui_hong: 'Bình thường',
                            kq_co_xuong_khop: 'Bình thường', kq_noi_tiet_chuyen_hoa: 'Bình thường',
                        };
                        clinicalData.extra = {
                            ...clinicalData.extra,
                            chuc_danh: 'Nhân viên gác chắn',
                            noi_cong_tac: 'Cung thông tin tín hiệu Hà Nội',
                            du_tieu_chuan_dk_ptgt_duong_sat: '1'
                        };
                    } else if (formType === '5') {
                        clinicalData.clinical_exam = {
                            ...clinicalData.clinical_exam,
                            tim_mach: 'Bình thường', ho_hap: 'Bình thường', tiet_nieu_sinh_duc: 'Bình thường',
                            noi_khoa_tieu_hoa: 'Bình thường', gan_mat: 'Bình thường', mau_co_quan_tao_mau: 'Bình thường',
                            da_to_chuc_duoi_da: 'Bình thường', kq_co_xuong_khop_m5: 'Bình thường',
                            than_kinh_m5: 'Bình thường', ma_benh_ngoai_khoa: 'Bình thường',
                            kham_tai_mui_hong_m5: 'Bình thường', kham_mat_m5: 'Bình thường',
                            benh_khac: 'Không', noi_tiet_dinh_duong_chuyen_hoa: 'Bình thường',
                            roi_loan_hanh_vi_tam_than: 'Không', than_kinh_tam_ly: 'Bình thường',
                            kham_mat_thi_giac_mau: '1',
                            xa_khong_kinh_mat_phai: '10/10', xa_khong_kinh_mat_trai: '10/10', xa_khong_kinh_hai_mat: '10/10',
                            xa_co_kinh_mat_phai: '', xa_co_kinh_mat_trai: '', xa_co_kinh_hai_mat: '',
                            gan_khong_kinh_mat_phai: '10/10', gan_khong_kinh_mat_trai: '10/10', gan_khong_kinh_hai_mat: '10/10',
                            gan_co_kinh_mat_phai: '', gan_co_kinh_mat_trai: '', gan_co_kinh_hai_mat: '',
                            kham_mat_thi_truong_phai: 'Bình thường', kham_mat_thi_truong_trai: 'Bình thường',
                            tai_phai_500hz: '20', tai_trai_500hz: '20', tai_phai_2000hz: '20', tai_trai_2000hz: '20',
                            tai_phai_3000hz: '20', tai_trai_3000hz: '20', tai_phai_4000hz: '20', tai_trai_4000hz: '20',
                            tai_phai_6000hz: '20', tai_trai_6000hz: '20'
                        };
                        clinicalData.extra = {
                            ...clinicalData.extra,
                            vi_tri_lam_viec: 'Boong tàu', bo_phan_lam_viec: 'Vận hành boong',
                            chuc_danh_tren_tau: 'Thủy thủ', ten_chu_tau: 'Công ty Vận tải Biển Vinalines',
                            dia_chi_chu_tau: 'Đống Đa, Hà Nội', khu_vuc_hoat_dong_tau: '1',
                            luc_bop_tay_thuan: '45', luc_bop_tay_khong_thuan: '40',
                            luc_keo_lung: '90', luc_keo_than: '95',
                            ha_tam_thu: '120', ha_tam_truong: '80', nhip_tim: '75',
                            vong_nguc_trung_binh: '88', kha_nang_chiu_song: '1',
                            han_che: '0', yeu_cau_deo_kinh: '0'
                        };
                        labData.chi_so_hc = '4.5'; labData.chi_so_bach_cau = '7.2';
                        labData.chi_so_tieu_cau = '220'; labData.cong_thuc_bc = 'Neutrophil 60%';
                        labData.thoi_gian_howell = '12'; labData.cholesterol = '4.8';
                        labData.triglycerid = '1.5'; labData.hdl = '1.3'; labData.ldl = '2.8';
                        labData.rpr = '0'; labData.tpha = '0'; labData.hbsag = '0';
                        labData.hbeag = '0'; labData.hcvab = '0'; labData.havab = '0';
                        labData.hiv = '0'; labData.nong_do_con_mau = '0';
                        labData.nuoc_tieu_ma_tuy = '0'; labData.nuoc_tieu_amphetamine = '0';
                        labData.nuoc_tieu_duong = 'Âm tính'; labData.nuoc_tieu_protein = 'Âm tính';
                        labData.nuoc_tieu_khac = '';
                    } else if (parseInt(formType) >= 6 && parseInt(formType) <= 13) {
                        clinicalData.extra = { ...clinicalData.extra, sinh_non: 0, tuan_thai_khi_sinh: 39, can_nang_luc_sinh: '3.2' };
                    } else if (parseInt(formType) >= 14) {
                        clinicalData.extra = { ...clinicalData.extra, tiem_chung_bcg: 1, tiem_chung_bh_hg_uv: 1, tiem_chung_soi: 1 };
                    }
                    const conclDoctorId = row.hd_doctor || examRow?.he_doctor || '';
                    const conclDoctorName = row.doctor_name || examRow?.doctor_name || 'BS. Nguyễn Văn A';
                    const examDoctorId = examRow?.he_doctor || row.hd_doctor || '';
                    const examDoctorName = examRow?.doctor_name || row.doctor_name || 'BS. Nguyễn Văn A';

                    if (!clinicalData.extra) clinicalData.extra = {};
                    clinicalData.extra.doctor_id = examDoctorId;
                    clinicalData.extra.doctor_name = examDoctorName;
                    clinicalData.extra.concl_doctor_id = conclDoctorId;
                    clinicalData.extra.concl_doctor_name = conclDoctorName;

                    // Đánh giá Chẩn đoán, Kết luận & Phân loại sức khỏe thông minh (Chuẩn BYT & HIS)
                    const evalResult = evaluateFitnessClass({
                        dob: row.dob,
                        gender: gender,
                        bloodPressure: bpStr,
                        systolic: examRow?.he_bloodpressure ? Number(examRow.he_bloodpressure) : null,
                        diastolic: examRow?.he_bloodpressurex ? Number(examRow.he_bloodpressurex) : null,
                        bmi: examRow?.he_bmi ? Number(examRow.he_bmi) : null,
                        height: examRow?.he_height ? Number(examRow.he_height) : (row.hee_height ? Number(row.hee_height) : null),
                        weight: examRow?.he_weight ? Number(examRow.he_weight) : (row.hee_weight ? Number(row.hee_weight) : null),
                        icd10: examRow?.he_icd10,
                        diagnostic: examRow?.he_diagnostic,
                        hisResult: row.hd_result,
                        hisConclusion: row.hd_conclusion,
                        hisExmPhanLoai: conclRow?.hecl_phanloai,
                        hisExmConclusion: conclRow?.hecl_conclusion,
                        hisExmRemark: conclRow?.hecl_remark,
                        hisTreatMethod: row.hd_treatmethod,
                        hisDoctorId: conclDoctorId,
                        hisDoctorName: conclDoctorName,
                        personalHistory: histRow?.hdh_owner,
                        formType: formType
                    });

                    const conclusionData: any = (hasConclusion || evalResult.isAutoEvaluated || evalResult.fitnessClass) ? {
                        fitness_class: evalResult.fitnessClass,
                        diagnosis: evalResult.diagnosis,
                        doctor_id: evalResult.doctorId || conclDoctorId,
                        doctor_name: evalResult.doctorName || conclDoctorName,
                        cac_van_de_luu_y: evalResult.cacVanDeLuuY,
                        cac_benh_tat_neu_co: evalResult.cacBenhTatNeuCo,
                        ket_luan_loai_suc_khoe: evalResult.fitnessClass
                    } : null;

                    // Đồng bộ cấu trúc trạng thái ĐÃ_KHÁM / ĐÃ_KẾT_LUẬN và phân công bác sĩ vào specialty_metadata
                    const specMetadata = buildSpecialtyMetadata({
                        clinicalData,
                        labData,
                        conclusionData,
                        examDoctorId: examDoctorId,
                        examDoctorName: examDoctorName,
                        conclDoctorId: conclDoctorId,
                        conclDoctorName: conclDoctorName,
                        hasExam: !!examRow,
                        hasConclusion: hasConclusion || !!conclusionData
                    });
                    clinicalData.specialty_metadata = specMetadata;
                    if (clinicalData.clinical_exam) {
                        clinicalData.clinical_exam.specialty_metadata = specMetadata;
                    }

                    const xmlData = generateXmlPayload(
                        formType,
                        { patientName, cccd, dob: row.dob || '1990-01-01', gender, docNo },
                        clinicalData, labData, conclusionData
                    );

                    if (existing) {
                        // ── Cập nhật hồ sơ tồn tại (chưa ký, chưa gửi) ──
                        await query(`
                            UPDATE health_check_masters SET
                                patient_name = $1, cccd = $2, dob = $3, gender = $4, patient_id = $5,
                                his_employee_id = $6, his_contract_id = $7, his_doc_no = $8,
                                form_type = $9, xml_data = $10, sync_mode = 'HIS', updated_at = NOW()
                            WHERE id = $11
                        `, [patientName, cccd, formatYmdString(row.dob), gender,
                            patientId, hisEmpId, contractId, row.hee_docno ? String(row.hee_docno) : null,
                            formType, xmlData, existing.id]);

                        if (detailSet.has(existing.id)) {
                            await query(`
                                UPDATE health_check_details
                                SET clinical_data = $1, lab_data = $2, conclusion_data = $3, updated_at = NOW()
                                WHERE master_id = $4
                            `, [JSON.stringify(clinicalData), JSON.stringify(labData),
                                conclusionData ? JSON.stringify(conclusionData) : null, existing.id]);
                        } else {
                            await query(`
                                INSERT INTO health_check_details (master_id, clinical_data, lab_data, conclusion_data)
                                VALUES ($1, $2, $3, $4)
                            `, [existing.id, JSON.stringify(clinicalData), JSON.stringify(labData),
                                conclusionData ? JSON.stringify(conclusionData) : null]);
                            detailSet.add(existing.id);
                        }
                        const recObj = { id: existing.id, his_employee_id: hisEmpId, doc_no: docNo, his_doc_no: row.hee_docno ? String(row.hee_docno) : null, signature_status: existing.signature_status, send_status: existing.send_status };
                        byHisEmpId.set(hisEmpId, recObj);
                        byDocNo.set(docNo, recObj);
                        if (row.hee_docno) byDocNo.set(String(row.hee_docno), recObj);
                        fullUpdateCount++;
                    } else {
                        // ── Tạo mới hồ sơ (với ON CONFLICT an toàn chống trùng doc_no) ──
                        const masterRes = await query(`
                            INSERT INTO health_check_masters (
                                patient_id, patient_name, cccd, dob, gender,
                                doc_no, form_type, xml_data,
                                signature_status, send_status,
                                his_employee_id, his_contract_id, his_doc_no, sync_mode
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Unsigned', 'Unsent', $9, $10, $11, 'HIS')
                            ON CONFLICT (doc_no) DO UPDATE SET
                                patient_name = EXCLUDED.patient_name,
                                cccd = EXCLUDED.cccd,
                                dob = EXCLUDED.dob,
                                gender = EXCLUDED.gender,
                                patient_id = EXCLUDED.patient_id,
                                his_employee_id = EXCLUDED.his_employee_id,
                                his_contract_id = EXCLUDED.his_contract_id,
                                his_doc_no = EXCLUDED.his_doc_no,
                                form_type = EXCLUDED.form_type,
                                xml_data = EXCLUDED.xml_data,
                                sync_mode = 'HIS',
                                updated_at = NOW()
                            RETURNING id, (xmax = 0) AS is_new_insert
                        `, [patientId, patientName, cccd, formatYmdString(row.dob),
                            gender, docNo, formType, xmlData, hisEmpId, contractId, row.hee_docno ? String(row.hee_docno) : null]);
                        
                        const masterId = masterRes.rows[0]?.id;
                        const isNewInsert = masterRes.rows[0]?.is_new_insert;

                        if (masterId) {
                            const recObj = { id: masterId, his_employee_id: hisEmpId, doc_no: docNo, his_doc_no: row.hee_docno ? String(row.hee_docno) : null, signature_status: 'Unsigned', send_status: 'Unsent' };
                            byHisEmpId.set(hisEmpId, recObj);
                            byDocNo.set(docNo, recObj);
                            if (row.hee_docno) byDocNo.set(String(row.hee_docno), recObj);

                            if (detailSet.has(masterId)) {
                                await query(`
                                    UPDATE health_check_details
                                    SET clinical_data = $1, lab_data = $2, conclusion_data = $3, updated_at = NOW()
                                    WHERE master_id = $4
                                `, [JSON.stringify(clinicalData), JSON.stringify(labData),
                                    conclusionData ? JSON.stringify(conclusionData) : null, masterId]);
                            } else {
                                await query(`
                                    INSERT INTO health_check_details (master_id, clinical_data, lab_data, conclusion_data)
                                    VALUES ($1, $2, $3, $4)
                                `, [masterId, JSON.stringify(clinicalData), JSON.stringify(labData),
                                    conclusionData ? JSON.stringify(conclusionData) : null]);
                                detailSet.add(masterId);
                            }

                            if (isNewInsert) {
                                insertedCount++;
                            } else {
                                fullUpdateCount++;
                            }
                        }
                    }
                }));
            }

            // Cập nhật trạng thái hợp đồng
            const syncedCount = insertedCount + fullUpdateCount;
            await query(`
                UPDATE hms_exm_contract
                SET hec_status = 'P', hec_synced_count = $2
                WHERE hec_contract_id = $1
            `, [contractId, syncedCount]);

            // Thông báo chi tiết kết quả
            const parts: string[] = [];
            if (insertedCount > 0) parts.push(`Tạo mới: ${insertedCount}`);
            if (fullUpdateCount > 0) parts.push(`Đồng bộ cập nhật: ${fullUpdateCount}`);
            if (skippedSignedCount > 0) parts.push(`Bỏ qua (đã ký): ${skippedSignedCount}`);
            if (skippedSentCount > 0) parts.push(`Bỏ qua (đã gửi VNeID): ${skippedSentCount}`);

            return res.json({
                success: true,
                count: syncedCount,
                inserted: insertedCount,
                updated: fullUpdateCount,
                skipped_signed: skippedSignedCount,
                skipped_sent: skippedSentCount,
                message: parts.length > 0 ? parts.join(' | ') : `Đồng bộ hoàn tất ${syncedCount} hồ sơ`
            });
        } catch (error: any) {
            console.error('Lỗi seed dữ liệu KSK từ HIS:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // 9. Lấy dữ liệu bệnh nhân từ HIS để đồng bộ KSK
async getHisPatient(req: Request, res: Response) {
        const identifier = String(req.params.identifier || '').trim();
        const year = new Date().getFullYear();
        const kskDocNo = identifier.startsWith('KSK-') ? identifier : `KSK-${year}-${identifier}`;
        try {
            // 1. TRUY VẤN DỮ LIỆU TỪ HỆ THỐNG KSK NỘI BỘ (health_check_masters, health_check_details)
            const sql = `
                SELECT 
                    m.id,
                    m.patient_id,
                    m.patient_name,
                    m.cccd,
                    to_char(m.dob, 'YYYY-MM-DD') as dob,
                    m.gender,
                    m.doc_no,
                    m.his_doc_no,
                    m.form_type,
                    d.clinical_data,
                    d.lab_data,
                    d.conclusion_data
                FROM health_check_masters m
                JOIN health_check_details d ON m.id = d.master_id
                WHERE m.doc_no = $1
                   OR m.doc_no = $2
                   OR m.his_doc_no = $1
                   OR m.cccd = $1
                   OR m.patient_id = $1
                   OR (d.clinical_data->>'phone' = $1)
                ORDER BY m.id DESC
                LIMIT 1
            `;
            const result = await query(sql, [identifier, kskDocNo]);

            if (result.rows.length > 0) {
                const row = result.rows[0];
                const hisDocNoStr = row.his_doc_no || row.patient_id || (row.doc_no ? row.doc_no.split('-').pop() : '');
                const docNoVal = hisDocNoStr ? parseInt(hisDocNoStr, 10) : 0;
                console.log('🔍 [getHisPatient] docNoVal:', docNoVal, 'row.his_doc_no:', row.his_doc_no, 'row.patient_id:', row.patient_id);



                // Lấy chỉ định & kết quả cận lâm sàng mới nhất trực tiếp từ HIS
                const liveParaclinical = docNoVal ? await this.fetchStructuredParaclinicalData(docNoVal) : null;
                if (liveParaclinical) {
                    console.log('🔍 [getHisPatient] liveParaclinical items count:', liveParaclinical.paraclinical_items?.length);
                }
                const labData = typeof row.lab_data === 'string' ? JSON.parse(row.lab_data) : { ...row.lab_data };

                if (liveParaclinical) {
                    if (!labData.blood_test) labData.blood_test = {};
                    if (!labData.urine_test) labData.urine_test = {};

                    labData.blood_test.hemoglobin = liveParaclinical.hemoglobin || '';
                    labData.blood_test.glycemia = liveParaclinical.glycemia || '';
                    labData.urine_test.protein = liveParaclinical.protein || '';
                    labData.kq_xn_khac = liveParaclinical.kqXnKhac || '';

                    const existingItems = Array.isArray(labData.paraclinical_items) ? labData.paraclinical_items : [];
                    const newItems = liveParaclinical.paraclinical_items || [];
                    const mergedItems: any[] = [];

                    const existingMap = new Map<string, any>();
                    existingItems.forEach((item: any) => {
                        const key = `${item.order_id || ''}_${item.service_code || ''}`;
                        existingMap.set(key, item);
                        if (item.service_code) {
                            existingMap.set(String(item.service_code).trim(), item);
                        }
                    });

                    newItems.forEach((newItem: any) => {
                        const key = `${newItem.order_id || ''}_${newItem.service_code || ''}`;
                        const existingItem = existingMap.get(key) || existingMap.get(String(newItem.service_code || '').trim());
                        if (existingItem) {
                            let mergedValue = '';
                            let mergedConclusion = '';
                            const userEdited = !!existingItem.user_edited;

                            if (existingItem.user_edited && existingItem.value && !newItem.value) {
                                // Giữ nguyên giá trị bác sĩ sửa tay nếu HIS chưa có kết quả
                                mergedValue = existingItem.value || '';
                                mergedConclusion = existingItem.conclusion || '';
                            } else {
                                // Trộn thông thường dựa trên HIS
                                mergedValue = newItem.value ? newItem.value : (existingItem.value || '');
                                mergedConclusion = newItem.value ? (newItem.conclusion || 'Bình thường') : (existingItem.conclusion || '');
                            }

                            mergedItems.push({
                                ...existingItem,
                                ...newItem,
                                value: mergedValue,
                                conclusion: mergedConclusion,
                                is_his_value: !!newItem.value,
                                user_edited: userEdited
                            });
                        } else {
                            mergedItems.push({
                                ...newItem,
                                is_his_value: !!newItem.value,
                                user_edited: false
                            });
                        }
                    });

                    labData.paraclinical_items = mergedItems;

                    // Tự động lưu bản cập nhật mới nhất vào database local
                    try {
                        await query(`
                            UPDATE health_check_details 
                            SET lab_data = $1, updated_at = NOW() 
                            WHERE master_id = $2
                        `, [JSON.stringify(labData), row.id]);
                        console.log(`✅ [getHisPatient] Tự động cập nhật lab_data vào DB cho BN: ${row.patient_name}`);
                    } catch (dbSaveErr) {
                        console.error('⚠️ [getHisPatient] Lỗi tự động lưu lab_data:', dbSaveErr);
                    }
                }

                let clinicalData = typeof row.clinical_data === 'string' ? JSON.parse(row.clinical_data) : { ...row.clinical_data };
                let conclusionData = typeof row.conclusion_data === 'string' ? JSON.parse(row.conclusion_data) : { ...row.conclusion_data };

                // Bổ sung sinh hiệu, địa chỉ, chẩn đoán & kết luận phân loại từ HIS nếu có đợt khám
                if (docNoVal) {
                    try {
                        const [examRes, docRes, conclRes, histRes] = await Promise.all([
                            query(`
                                SELECT 
                                    e.he_pulse, e.he_temperature, e.he_bloodpressure, e.he_bloodpressurex, 
                                    e.he_breathinterval, e.he_weight, e.he_height, e.he_bmi, 
                                    e.he_doctor, e.he_medical, e.he_examine, e.he_parts, 
                                    e.he_prediagnostic, e.he_diagnostic, e.he_icd10, e.he_status,
                                    to_char(e.he_examdate, 'YYYY-MM-DD') as exam_date,
                                    to_char(e.he_examdate, 'HH24:MI') as exam_time,
                                    to_char(e.he_examdate, 'YYYY-MM-DD HH24:MI:SS') as exam_datetime,
                                    hms_getusername(e.he_doctor) as doctor_name
                                FROM hms_exam e 
                                WHERE e.he_docno = $1 
                                ORDER BY (CASE WHEN e.he_status = 'T' THEN 1 ELSE 2 END), e.he_receptidx DESC 
                                LIMIT 1
                            `, [docNoVal]),
                            query(`
                                SELECT 
                                    COALESCE(NULLIF(TRIM(d.hd_dtladdr), ''), NULLIF(TRIM(p.hp_dtladdr), ''), hms_getaddress(COALESCE(d.hd_provid, p.hp_provid, 0), COALESCE(d.hd_distid, p.hp_distid, 0), COALESCE(d.hd_villid, p.hp_villid, 0)), '') as address,
                                    COALESCE(d.hd_provid, p.hp_provid, 0)::text as matinh_cu_tru,
                                    COALESCE(d.hd_villid, p.hp_villid, 0)::text as maxa_cu_tru,
                                    p.hp_occupation::text as occupation,
                                    COALESCE(p.hp_workplace, '') as workplace,
                                    d.hd_result, d.hd_conclusion, d.hd_suggestion, d.hd_treatmethod, d.hd_doctor, d.hd_status,
                                    COALESCE(hms_getusername(d.hd_doctor), 'BS. Nguyễn Văn A') as doctor_name
                                FROM hms_doc d
                                JOIN hms_patient p ON d.hd_patientno = p.hp_patientno
                                WHERE d.hd_docno = $1
                                LIMIT 1
                            `, [docNoVal]),
                            query(`
                                SELECT 
                                    hecl_docno, hecl_theluc, hecl_tuanhoan, hecl_hohap, hecl_tieuhoa,
                                    hecl_thantietnieu, hecl_noitiet, hecl_coxuongkhop, hecl_thankinh, hecl_tamthan,
                                    hecl_ngoai, hecl_dalieu, hecl_mat, hecl_tmh, hecl_rhm, hecl_phukhoa,
                                    hecl_phanloai, hecl_conclusion, hecl_remark
                                FROM hms_exm_conclusion
                                WHERE hecl_docno = $1
                                LIMIT 1
                            `, [docNoVal]),
                            query(`
                                SELECT hdh_owner, hdh_family, hdh_drugallergy 
                                FROM hms_disease_hist 
                                WHERE hdh_docno = $1 
                                ORDER BY hdh_createddate DESC 
                                LIMIT 1
                            `, [docNoVal])
                        ]);

                        const ex = examRes.rows[0] || null;
                        const a = docRes.rows[0] || null;
                        const conclRow = conclRes.rows[0] || null;
                        const histRow = histRes.rows[0] || null;

                        const conclDocId = a?.hd_doctor || ex?.he_doctor || '';
                        const conclDocName = a?.doctor_name || ex?.doctor_name || 'BS. Nguyễn Văn A';
                        const examDocId = ex?.he_doctor || a?.hd_doctor || '';
                        const examDocName = ex?.doctor_name || a?.doctor_name || 'BS. Nguyễn Văn A';

                        if (!clinicalData.extra) clinicalData.extra = {};
                        clinicalData.extra.doctor_id = examDocId;
                        clinicalData.extra.doctor_name = examDocName;
                        clinicalData.extra.concl_doctor_id = conclDocId;
                        clinicalData.extra.concl_doctor_name = conclDocName;

                        if (ex) {
                            if (!clinicalData.examination) clinicalData.examination = {};
                            if (!clinicalData.examination.height && ex.he_height) clinicalData.examination.height = String(ex.he_height);
                            if (!clinicalData.examination.weight && ex.he_weight) clinicalData.examination.weight = String(ex.he_weight);
                            if (!clinicalData.examination.pulse && ex.he_pulse) clinicalData.examination.pulse = String(ex.he_pulse);
                            if (!clinicalData.examination.temperature && ex.he_temperature) clinicalData.examination.temperature = String(ex.he_temperature);
                            if (!clinicalData.examination.nhiet_do && ex.he_temperature) clinicalData.examination.nhiet_do = String(ex.he_temperature);
                            if (!clinicalData.examination.breathing_rate && ex.he_breathinterval) clinicalData.examination.breathing_rate = String(ex.he_breathinterval);
                            if (!clinicalData.examination.nhip_tho && ex.he_breathinterval) clinicalData.examination.nhip_tho = String(ex.he_breathinterval);
                            if (!clinicalData.examination.bmi && ex.he_bmi) clinicalData.examination.bmi = Number(ex.he_bmi).toFixed(2);
                            
                            let bpLive = '';
                            if (ex.he_bloodpressure && ex.he_bloodpressurex) bpLive = `${ex.he_bloodpressure}/${ex.he_bloodpressurex}`;
                            else if (ex.he_bloodpressure) bpLive = String(ex.he_bloodpressure);
                            if (!clinicalData.examination.blood_pressure && bpLive) clinicalData.examination.blood_pressure = bpLive;
                            if (!clinicalData.examination.bp && bpLive) clinicalData.examination.bp = bpLive;

                            if (!clinicalData.ngay_vao && ex.exam_date) clinicalData.ngay_vao = ex.exam_date;
                            if (!clinicalData.gio_kham && ex.exam_time) clinicalData.gio_kham = ex.exam_time;
                            if (!clinicalData.extra.gio_kham && ex.exam_time) clinicalData.extra.gio_kham = ex.exam_time;
                            if (!clinicalData.extra.ngay_kham && ex.exam_date) clinicalData.extra.ngay_kham = ex.exam_date;
                        }

                        if (a) {
                            if (!clinicalData.address && a.address) clinicalData.address = a.address;
                            if (!clinicalData.matinh_cu_tru && a.matinh_cu_tru && a.matinh_cu_tru !== '0') clinicalData.matinh_cu_tru = a.matinh_cu_tru;
                            if (!clinicalData.maxa_cu_tru && a.maxa_cu_tru && a.maxa_cu_tru !== '0') clinicalData.maxa_cu_tru = a.maxa_cu_tru;
                            if (a.occupation) {
                                const occStr = String(a.occupation).trim();
                                clinicalData.ma_nghe_nghiep = occStr;
                                clinicalData.occupation = occStr;
                                if (!clinicalData.extra) clinicalData.extra = {};
                                clinicalData.extra.ma_nghe_nghiep = occStr;
                                clinicalData.extra.occupation = occStr;
                            }
                            if (a.workplace) {
                                clinicalData.noi_cong_tac_hien_tai = a.workplace;
                                clinicalData.workplace = a.workplace;
                                if (!clinicalData.extra) clinicalData.extra = {};
                                clinicalData.extra.noi_cong_tac_hien_tai = a.workplace;
                                clinicalData.extra.workplace = a.workplace;
                            }
                        }

                        if (clinicalData.cccd_date) {
                            clinicalData.cccd_date = sanitizeHisDate(clinicalData.cccd_date);
                            if (clinicalData.extra) clinicalData.extra.cccd_date = clinicalData.cccd_date;
                        }

                        // Đánh giá Chẩn đoán, Kết luận & Phân loại sức khỏe thông minh (Chuẩn BYT & HIS)
                        const evalResult = evaluateFitnessClass({
                            dob: row.dob,
                            gender: row.gender,
                            bloodPressure: clinicalData.examination?.blood_pressure || clinicalData.examination?.bp,
                            systolic: ex?.he_bloodpressure ? Number(ex.he_bloodpressure) : null,
                            diastolic: ex?.he_bloodpressurex ? Number(ex.he_bloodpressurex) : null,
                            bmi: clinicalData.examination?.bmi ? Number(clinicalData.examination.bmi) : null,
                            height: clinicalData.examination?.height ? Number(clinicalData.examination.height) : null,
                            weight: clinicalData.examination?.weight ? Number(clinicalData.examination.weight) : null,
                            icd10: ex?.he_icd10,
                            diagnostic: ex?.he_diagnostic,
                            hisResult: a?.hd_result,
                            hisConclusion: a?.hd_conclusion,
                            hisExmPhanLoai: conclRow?.hecl_phanloai,
                            hisExmConclusion: conclRow?.hecl_conclusion,
                            hisExmRemark: conclRow?.hecl_remark,
                            hisTreatMethod: a?.hd_treatmethod,
                            hisDoctorId: conclDocId,
                            hisDoctorName: conclDocName,
                            personalHistory: histRow?.hdh_owner,
                            formType: row.form_type
                        });

                        if (!conclusionData) conclusionData = {};
                        if (!conclusionData.fitness_class || conclusionData.fitness_class === '1' || evalResult.isAutoEvaluated || conclRow?.hecl_phanloai || a?.hd_result) {
                            conclusionData.fitness_class = evalResult.fitnessClass;
                        }
                        if (!conclusionData.diagnosis || conclusionData.diagnosis === '[Z00.0] Khám sức khỏe tổng quát' || evalResult.diagnosis) {
                            conclusionData.diagnosis = evalResult.diagnosis;
                        }
                        conclusionData.doctor_id = evalResult.doctorId || conclDocId;
                        conclusionData.doctor_name = evalResult.doctorName || conclDocName;
                        if (!conclusionData.cac_van_de_luu_y || evalResult.cacVanDeLuuY) conclusionData.cac_van_de_luu_y = evalResult.cacVanDeLuuY;
                        if (!conclusionData.cac_benh_tat_neu_co || evalResult.cacBenhTatNeuCo) conclusionData.cac_benh_tat_neu_co = evalResult.cacBenhTatNeuCo;
                        conclusionData.ket_luan_loai_suc_khoe = evalResult.fitnessClass;

                        // Đồng bộ cấu trúc trạng thái ĐÃ_KHÁM / ĐÃ_KẾT_LUẬN và phân công bác sĩ vào specialty_metadata
                        const specMetadata = buildSpecialtyMetadata({
                            clinicalData,
                            labData: row.lab_data,
                            conclusionData,
                            examDoctorId: examDocId,
                            examDoctorName: examDocName,
                            conclDoctorId: conclDocId,
                            conclDoctorName: conclDocName,
                            hasExam: !!ex,
                            hasConclusion: !!conclRow || !!a?.hd_result || !!conclusionData
                        });
                        clinicalData.specialty_metadata = specMetadata;
                        if (clinicalData.clinical_exam) {
                            clinicalData.clinical_exam.specialty_metadata = specMetadata;
                        }

                        // Tự động lưu bản cập nhật clinical_data và conclusion_data vào database local
                        await query(`
                            UPDATE health_check_details 
                            SET clinical_data = $1, conclusion_data = $2, updated_at = NOW() 
                            WHERE master_id = $3
                        `, [JSON.stringify(clinicalData), JSON.stringify(conclusionData), row.id]);
                        console.log(`✅ [getHisPatient] Tự động cập nhật clinical & conclusion cho BN: ${row.patient_name}`);
                    } catch (examErr) {
                        console.error('⚠️ [getHisPatient] Lỗi tra cứu exam & conclusion cho HEALTH_CHECK_MASTER:', examErr);
                    }
                }

                return res.json({
                    source: 'HEALTH_CHECK_MASTER',
                    id: row.id,
                    patient_id: row.patient_id,
                    doc_no: hisDocNoStr,
                    patient_name: String(row.patient_name || '').toUpperCase(),
                    cccd: row.cccd || '',
                    dob: row.dob || '',
                    gender: row.gender || 'Nam',
                    form_type: row.form_type,
                    clinical_data: clinicalData,
                    lab_data: labData,
                    conclusion_data: conclusionData
                });
            } else {
                // 2. DỰ PHÒNG FALLBACK (HIS DIRECT): Tra cứu đợt khám trực tiếp từ HIS (hms_doc JOIN hms_patient)
                console.log(`ℹ️ [getHisPatient] Không tìm thấy trong health_check_masters. Đang tra cứu dự phòng từ HIS (hms_doc & hms_patient)...`);
                
                let hisResult: any = { rows: [] };
                const cleanId = identifier.trim();
                const isAllDigits = /^\d+$/.test(cleanId);

                // 1. Trường hợp 1: Nhập Mã hồ sơ HIS (hms_doc.hd_docno) -> Tra cứu chính xác theo Primary Key hd_docno (<1ms)
                if (isAllDigits) {
                    const numId = parseInt(cleanId, 10);
                    hisResult = await query(`
                        SELECT 
                            d.hd_docno as his_doc_no,
                            p.hp_patientno as patient_id,
                            TRIM(COALESCE(p.hp_surname, '') || ' ' || COALESCE(p.hp_midname, '') || ' ' || COALESCE(p.hp_firstname, '')) as patient_name,
                            p.hp_sin as cccd,
                            to_char(p.hp_ngaycap, 'YYYY-MM-DD') as cccd_date,
                            COALESCE(p.hp_noicap, '') as cccd_place,
                            to_char(p.hp_birthdate, 'YYYY-MM-DD') as dob,
                            CASE 
                                WHEN LOWER(p.hp_sex) = 'm' OR LOWER(p.hp_sex) = 'nam' THEN 'Nam'
                                WHEN LOWER(p.hp_sex) = 'f' OR LOWER(p.hp_sex) = 'nữ' THEN 'Nữ'
                                ELSE 'Khác'
                            END as gender,
                            COALESCE(d.hd_telephone, '') as phone,
                            COALESCE(NULLIF(TRIM(d.hd_dtladdr), ''), NULLIF(TRIM(p.hp_dtladdr), ''), hms_getaddress(COALESCE(d.hd_provid, p.hp_provid, 0), COALESCE(d.hd_distid, p.hp_distid, 0), COALESCE(d.hd_villid, p.hp_villid, 0)), '') as address,
                            COALESCE(d.hd_provid, p.hp_provid, 0)::text as matinh_cu_tru,
                            COALESCE(d.hd_villid, p.hp_villid, 0)::text as maxa_cu_tru,
                            p.hp_ethnic as ethnic,
                            p.hp_occupation::text as occupation,
                            COALESCE(p.hp_workplace, '') as workplace,
                            to_char(d.hd_admitdate, 'YYYY-MM-DD') as ngay_vao,
                            c.hc_cardno as insurance_card,
                            d.hd_result, d.hd_conclusion, d.hd_suggestion, d.hd_treatmethod, d.hd_doctor, d.hd_diagnostic,
                            COALESCE(hms_getusername(d.hd_doctor), 'BS. Nguyễn Văn A') as doctor_name
                        FROM hms_doc d
                        JOIN hms_patient p ON d.hd_patientno = p.hp_patientno
                        LEFT JOIN hms_card c ON (c.hc_patientno = p.hp_patientno AND c.hc_idx = d.hd_cardidx)
                        WHERE d.hd_docno = $1
                        ORDER BY d.hd_docno DESC
                        LIMIT 1
                    `, [numId]);
                }

                // 2. Trường hợp 2: Nhập Thẻ CCCD (Chuỗi 9-12 chữ số) -> Tra cứu theo Index hp_sin (<1ms)
                if (hisResult.rows.length === 0 && isAllDigits && cleanId.length >= 9) {
                    hisResult = await query(`
                        SELECT 
                            d.hd_docno as his_doc_no,
                            p.hp_patientno as patient_id,
                            TRIM(COALESCE(p.hp_surname, '') || ' ' || COALESCE(p.hp_midname, '') || ' ' || COALESCE(p.hp_firstname, '')) as patient_name,
                            p.hp_sin as cccd,
                            to_char(p.hp_ngaycap, 'YYYY-MM-DD') as cccd_date,
                            COALESCE(p.hp_noicap, '') as cccd_place,
                            to_char(p.hp_birthdate, 'YYYY-MM-DD') as dob,
                            CASE 
                                WHEN LOWER(p.hp_sex) = 'm' OR LOWER(p.hp_sex) = 'nam' THEN 'Nam'
                                WHEN LOWER(p.hp_sex) = 'f' OR LOWER(p.hp_sex) = 'nữ' THEN 'Nữ'
                                ELSE 'Khác'
                            END as gender,
                            COALESCE(d.hd_telephone, '') as phone,
                            COALESCE(NULLIF(TRIM(d.hd_dtladdr), ''), NULLIF(TRIM(p.hp_dtladdr), ''), hms_getaddress(COALESCE(d.hd_provid, p.hp_provid, 0), COALESCE(d.hd_distid, p.hp_distid, 0), COALESCE(d.hd_villid, p.hp_villid, 0)), '') as address,
                            COALESCE(d.hd_provid, p.hp_provid, 0)::text as matinh_cu_tru,
                            COALESCE(d.hd_villid, p.hp_villid, 0)::text as maxa_cu_tru,
                            p.hp_ethnic as ethnic,
                            p.hp_occupation::text as occupation,
                            COALESCE(p.hp_workplace, '') as workplace,
                            to_char(d.hd_admitdate, 'YYYY-MM-DD') as ngay_vao,
                            c.hc_cardno as insurance_card,
                            d.hd_result, d.hd_conclusion, d.hd_suggestion, d.hd_treatmethod, d.hd_doctor, d.hd_diagnostic,
                            COALESCE(hms_getusername(d.hd_doctor), 'BS. Nguyễn Văn A') as doctor_name
                        FROM hms_patient p
                        JOIN hms_doc d ON d.hd_patientno = p.hp_patientno
                        LEFT JOIN hms_card c ON (c.hc_patientno = p.hp_patientno AND c.hc_idx = d.hd_cardidx)
                        WHERE p.hp_sin = $1
                        ORDER BY d.hd_docno DESC
                        LIMIT 1
                    `, [cleanId]);
                }

                // 3. Trường hợp 3: Tra cứu theo SĐT (chỉ thực hiện nếu chuỗi bắt đầu bằng 0 hoặc 84 và có độ dài phù hợp)
                if (hisResult.rows.length === 0 && (cleanId.startsWith('0') || cleanId.startsWith('84') || cleanId.startsWith('+84'))) {
                    hisResult = await query(`
                        SELECT 
                            d.hd_docno as his_doc_no,
                            p.hp_patientno as patient_id,
                            TRIM(COALESCE(p.hp_surname, '') || ' ' || COALESCE(p.hp_midname, '') || ' ' || COALESCE(p.hp_firstname, '')) as patient_name,
                            p.hp_sin as cccd,
                            to_char(p.hp_ngaycap, 'YYYY-MM-DD') as cccd_date,
                            COALESCE(p.hp_noicap, '') as cccd_place,
                            to_char(p.hp_birthdate, 'YYYY-MM-DD') as dob,
                            CASE 
                                WHEN LOWER(p.hp_sex) = 'm' OR LOWER(p.hp_sex) = 'nam' THEN 'Nam'
                                WHEN LOWER(p.hp_sex) = 'f' OR LOWER(p.hp_sex) = 'nữ' THEN 'Nữ'
                                ELSE 'Khác'
                            END as gender,
                            COALESCE(d.hd_telephone, '') as phone,
                            COALESCE(NULLIF(TRIM(d.hd_dtladdr), ''), NULLIF(TRIM(p.hp_dtladdr), ''), hms_getaddress(COALESCE(d.hd_provid, p.hp_provid, 0), COALESCE(d.hd_distid, p.hp_distid, 0), COALESCE(d.hd_villid, p.hp_villid, 0)), '') as address,
                            COALESCE(d.hd_provid, p.hp_provid, 0)::text as matinh_cu_tru,
                            COALESCE(d.hd_villid, p.hp_villid, 0)::text as maxa_cu_tru,
                            p.hp_ethnic as ethnic,
                            p.hp_occupation::text as occupation,
                            COALESCE(p.hp_workplace, '') as workplace,
                            to_char(d.hd_admitdate, 'YYYY-MM-DD') as ngay_vao,
                            c.hc_cardno as insurance_card,
                            d.hd_result, d.hd_conclusion, d.hd_suggestion, d.hd_treatmethod, d.hd_doctor, d.hd_diagnostic,
                            COALESCE(hms_getusername(d.hd_doctor), 'BS. Nguyễn Văn A') as doctor_name
                        FROM hms_doc d
                        JOIN hms_patient p ON d.hd_patientno = p.hp_patientno
                        LEFT JOIN hms_card c ON (c.hc_patientno = p.hp_patientno AND c.hc_idx = d.hd_cardidx)
                        WHERE d.hd_telephone = $1
                        ORDER BY d.hd_docno DESC
                        LIMIT 1
                    `, [cleanId]);
                }

                if (hisResult.rows.length > 0) {
                    const hisRow = hisResult.rows[0];
                    const docNoVal = hisRow.his_doc_no ? parseInt(hisRow.his_doc_no, 10) : 0;
                    const patientNoVal = hisRow.patient_id ? parseInt(hisRow.patient_id, 10) : 0;
                    console.log(`✅ [getHisPatient] Tìm thấy đợt khám trực tiếp từ HIS cho BN: ${hisRow.patient_name} (Mã HS: ${hisRow.his_doc_no})`);

                    // 1. Lấy thông tin sinh hiệu & khám lâm sàng chi tiết từ hms_exam
                    let examRow: any = null;
                    if (docNoVal) {
                        try {
                            const examRes = await query(`
                                SELECT 
                                    e.he_pulse, 
                                    e.he_temperature, 
                                    e.he_bloodpressure, 
                                    e.he_bloodpressurex, 
                                    e.he_breathinterval, 
                                    e.he_weight, 
                                    e.he_height, 
                                    e.he_bmi, 
                                    e.he_doctor, 
                                    e.he_medical, 
                                    e.he_examine, 
                                    e.he_parts, 
                                    e.he_prediagnostic, 
                                    e.he_diagnostic, 
                                    e.he_icd10, 
                                    e.he_status,
                                    to_char(e.he_examdate, 'YYYY-MM-DD') as exam_date,
                                    to_char(e.he_examdate, 'HH24:MI') as exam_time,
                                    to_char(e.he_examdate, 'YYYY-MM-DD HH24:MI:SS') as exam_datetime,
                                    hms_getusername(e.he_doctor) as doctor_name
                                FROM hms_exam e 
                                WHERE e.he_docno = $1 
                                ORDER BY (CASE WHEN e.he_status = 'T' THEN 1 ELSE 2 END), e.he_receptidx DESC 
                                LIMIT 1
                            `, [docNoVal]);
                            if (examRes.rows.length > 0) {
                                examRow = examRes.rows[0];
                            }
                        } catch (examErr) {
                            console.error('⚠️ [getHisPatient] Lỗi truy vấn hms_exam:', examErr);
                        }
                    }

                    // 1.1 Lấy dữ liệu kết luận & chi tiết chuyên khoa từ hms_exm_conclusion (nếu có)
                    let conclRow: any = null;
                    if (docNoVal) {
                        try {
                            const conclRes = await query(`
                                SELECT 
                                    hecl_docno, hecl_theluc, hecl_tuanhoan, hecl_hohap, hecl_tieuhoa,
                                    hecl_thantietnieu, hecl_noitiet, hecl_coxuongkhop, hecl_thankinh, hecl_tamthan,
                                    hecl_ngoai, hecl_dalieu, hecl_mat, hecl_tmh, hecl_rhm, hecl_phukhoa,
                                    hecl_phanloai, hecl_conclusion, hecl_remark
                                FROM hms_exm_conclusion
                                WHERE hecl_docno = $1
                                LIMIT 1
                            `, [docNoVal]);
                            if (conclRes.rows.length > 0) {
                                conclRow = conclRes.rows[0];
                            }
                        } catch (conclErr) {
                            console.error('⚠️ [getHisPatient] Lỗi truy vấn hms_exm_conclusion:', conclErr);
                        }
                    }

                    // 2. Lấy tiền sử bệnh tật & dị ứng từ hms_disease_hist
                    let histRow: any = null;
                    if (docNoVal || patientNoVal) {
                        try {
                            const histRes = await query(`
                                SELECT hdh_owner, hdh_family, hdh_drugallergy 
                                FROM hms_disease_hist 
                                WHERE hdh_docno = $1 OR hdh_patientno = $2 
                                ORDER BY (CASE WHEN hdh_docno = $1 THEN 1 ELSE 2 END), hdh_createddate DESC 
                                LIMIT 1
                            `, [docNoVal, patientNoVal]);
                            if (histRes.rows.length > 0) {
                                histRow = histRes.rows[0];
                            }
                        } catch (histErr) {
                            console.error('⚠️ [getHisPatient] Lỗi truy vấn hms_disease_hist:', histErr);
                        }
                    }

                    // 3. Lấy kết quả CLS mới nhất từ HIS cho đợt khám này
                    const liveParaclinical = docNoVal ? await this.fetchStructuredParaclinicalData(docNoVal) : null;
                    const labData: any = {
                        blood_test: {},
                        urine_test: {},
                        paraclinical_items: []
                    };

                    if (liveParaclinical) {
                        if (liveParaclinical.hemoglobin) labData.blood_test.hemoglobin = liveParaclinical.hemoglobin;
                        if (liveParaclinical.glycemia) labData.blood_test.glycemia = liveParaclinical.glycemia;
                        if (liveParaclinical.protein) labData.urine_test.protein = liveParaclinical.protein;
                        if (liveParaclinical.kqXnKhac) labData.kq_xn_khac = liveParaclinical.kqXnKhac;
                        if (Array.isArray(liveParaclinical.paraclinical_items)) {
                            labData.paraclinical_items = liveParaclinical.paraclinical_items.map((item: any) => ({
                                ...item,
                                is_his_value: !!item.value,
                                user_edited: false
                            }));
                        }
                    }

                    // 4. Xác định Mẫu biểu phù hợp dựa trên ngày sinh (Mẫu 1: < 6 tuổi, Mẫu 2: 6-18 tuổi, Mẫu 3: >= 18 tuổi)
                    let resolvedFormType = '3';
                    if (hisRow.dob) {
                        const bDate = new Date(hisRow.dob);
                        if (!isNaN(bDate.getTime())) {
                            const today = new Date();
                            let age = today.getFullYear() - bDate.getFullYear();
                            if (today.getMonth() < bDate.getMonth() || (today.getMonth() === bDate.getMonth() && today.getDate() < bDate.getDate())) {
                                age--;
                            }
                            if (age < 6) resolvedFormType = '1';
                            else if (age < 18) resolvedFormType = '2';
                            else resolvedFormType = '3';
                        }
                    }

                    // Format Huyết áp
                    let bpStr = '';
                    if (examRow?.he_bloodpressure && examRow?.he_bloodpressurex) {
                        bpStr = `${examRow.he_bloodpressure}/${examRow.he_bloodpressurex}`;
                    } else if (examRow?.he_bloodpressure) {
                        bpStr = String(examRow.he_bloodpressure);
                    }

                    const patientAge = calculateAge(hisRow.dob);
                    const targetGroupVal = (patientAge !== null && patientAge >= 60) ? '1' : '3';
                    let resolvedNationality = '000';
                    if (hisRow.nationality) {
                        const natStr = String(hisRow.nationality).trim().toUpperCase();
                        if (natStr === '000' || natStr === 'VN' || natStr === 'VNM' || natStr === 'VIE' || natStr === '190') {
                            resolvedNationality = '000';
                        } else {
                            resolvedNationality = natStr;
                        }
                    }

                    const conclDoctorId = hisRow.hd_doctor || examRow?.he_doctor || '';
                    const conclDoctorName = hisRow.doctor_name || examRow?.doctor_name || 'BS. Nguyễn Văn A';
                    const examDoctorId = examRow?.he_doctor || hisRow.hd_doctor || '';
                    const examDoctorName = examRow?.doctor_name || hisRow.doctor_name || 'BS. Nguyễn Văn A';

                    // Đánh giá Chẩn đoán, Kết luận & Phân loại sức khỏe thông minh (Chuẩn BYT & HIS)
                    const evalResult = evaluateFitnessClass({
                        dob: hisRow.dob,
                        gender: hisRow.gender,
                        bloodPressure: bpStr,
                        systolic: examRow?.he_bloodpressure ? Number(examRow.he_bloodpressure) : null,
                        diastolic: examRow?.he_bloodpressurex ? Number(examRow.he_bloodpressurex) : null,
                        bmi: examRow?.he_bmi ? Number(examRow.he_bmi) : null,
                        height: examRow?.he_height ? Number(examRow.he_height) : null,
                        weight: examRow?.he_weight ? Number(examRow.he_weight) : null,
                        icd10: examRow?.he_icd10 || hisRow.hd_icd,
                        diagnostic: examRow?.he_diagnostic || hisRow.hd_diagnostic || hisRow.hd_conclusion,
                        hisResult: hisRow.hd_result,
                        hisConclusion: hisRow.hd_conclusion,
                        hisExmPhanLoai: conclRow?.hecl_phanloai,
                        hisExmConclusion: conclRow?.hecl_conclusion,
                        hisExmRemark: conclRow?.hecl_remark,
                        hisTreatMethod: hisRow.hd_treatmethod,
                        hisDoctorId: conclDoctorId,
                        hisDoctorName: conclDoctorName,
                        personalHistory: histRow?.hdh_owner,
                        formType: resolvedFormType
                    });

                    const conclusionDataObj = {
                        fitness_class: evalResult.fitnessClass,
                        fitness_class_name: evalResult.fitnessClassName,
                        diagnosis: evalResult.diagnosis,
                        doctor_id: evalResult.doctorId || conclDoctorId,
                        doctor_name: evalResult.doctorName || conclDoctorName,
                        cac_van_de_luu_y: evalResult.cacVanDeLuuY,
                        cac_benh_tat_neu_co: evalResult.cacBenhTatNeuCo,
                        ket_luan_loai_suc_khoe: evalResult.fitnessClass
                    };

                    const cleanCccdDate = sanitizeHisDate(hisRow.cccd_date);
                    const occCode = hisRow.occupation ? String(hisRow.occupation).trim() : '1539';

                    const clinicalDataObj: any = {
                        phone: hisRow.phone || '',
                        address: hisRow.address || '',
                        cccd_date: cleanCccdDate,
                        cccd_place: hisRow.cccd_place || '',
                        matinh_cu_tru: (hisRow.matinh_cu_tru && hisRow.matinh_cu_tru !== '0') ? String(hisRow.matinh_cu_tru) : '',
                        maxa_cu_tru: (hisRow.maxa_cu_tru && hisRow.maxa_cu_tru !== '0') ? String(hisRow.maxa_cu_tru) : '',
                        ethnic: hisRow.ethnic ? String(hisRow.ethnic) : '1',
                        quoc_tich: resolvedNationality,
                        target_group: targetGroupVal,
                        ma_nghe_nghiep: occCode,
                        occupation: occCode,
                        noi_cong_tac_hien_tai: hisRow.workplace || '',
                        noi_cong_tac: hisRow.workplace || '',
                        workplace: hisRow.workplace || '',
                        ngay_vao: examRow?.exam_date || hisRow.ngay_vao || '',
                        gio_kham: examRow?.exam_time || '',
                        insurance_card: hisRow.insurance_card || '',
                        examination: {
                            height: examRow?.he_height ? String(examRow.he_height) : '',
                            weight: examRow?.he_weight ? String(examRow.he_weight) : '',
                            pulse: examRow?.he_pulse ? String(examRow.he_pulse) : '',
                            blood_pressure: bpStr,
                            bp: bpStr,
                            temperature: (examRow?.he_temperature && Number(examRow.he_temperature) > 0) ? String(examRow.he_temperature) : '',
                            nhiet_do: (examRow?.he_temperature && Number(examRow.he_temperature) > 0) ? String(examRow.he_temperature) : '',
                            breathing_rate: (examRow?.he_breathinterval && Number(examRow.he_breathinterval) > 0) ? String(examRow.he_breathinterval) : '',
                            nhip_tho: (examRow?.he_breathinterval && Number(examRow.he_breathinterval) > 0) ? String(examRow.he_breathinterval) : '',
                            bmi: examRow?.he_bmi ? Number(examRow.he_bmi).toFixed(2) : '',
                            physical_summary: conclRow?.hecl_theluc || ''
                        },
                        clinical_exam: {
                            internal: [conclRow?.hecl_tuanhoan, conclRow?.hecl_hohap, conclRow?.hecl_tieuhoa, conclRow?.hecl_thantietnieu].filter(Boolean).join('\n'),
                            eye: conclRow?.hecl_mat || '',
                            ent: conclRow?.hecl_tmh || '',
                            dental: conclRow?.hecl_rhm || '',
                            external: conclRow?.hecl_ngoai || '',
                            dermatology: conclRow?.hecl_dalieu || '',
                            gynecology: conclRow?.hecl_phukhoa || '',
                            neurology: conclRow?.hecl_thankinh || '',
                            psychiatry: conclRow?.hecl_tamthan || '',
                            noi_khoa_tuan_hoan: conclRow?.hecl_tuanhoan || '',
                            noi_khoa_ho_hap: conclRow?.hecl_hohap || '',
                            noi_khoa_tieu_hoa: conclRow?.hecl_tieuhoa || '',
                            noi_khoa_than_tietnieu_pl: conclRow?.hecl_thantietnieu || '',
                            noi_khoa_than_kinh: conclRow?.hecl_thankinh || '',
                            noi_khoa_tam_than: conclRow?.hecl_tamthan || '',
                            nhi_tuan_hoan: conclRow?.hecl_tuanhoan || '',
                            nhi_ho_hap: conclRow?.hecl_hohap || '',
                            nhi_tieu_hoa: conclRow?.hecl_tieuhoa || '',
                            nhi_than_kinh: conclRow?.hecl_thankinh || '',
                            nhi_tam_than: conclRow?.hecl_tamthan || ''
                        },
                        extra: {
                            gio_kham: examRow?.exam_time || '',
                            ngay_kham: examRow?.exam_date || hisRow.ngay_vao || '',
                            ma_nghe_nghiep: occCode,
                            occupation: occCode,
                            quoc_tich: resolvedNationality,
                            target_group: targetGroupVal,
                            noi_cong_tac_hien_tai: hisRow.workplace || '',
                            noi_cong_tac: hisRow.workplace || '',
                            workplace: hisRow.workplace || '',
                            cccd_date: cleanCccdDate,
                            tsgd_mac_benh: histRow?.hdh_family ? '1' : '0',
                            tsgd_ma_benh: histRow?.hdh_family ? String(histRow.hdh_family).trim() : '',
                            ts_mac_benh: histRow?.hdh_owner ? '1' : '0',
                            tsbt_ma_benh: histRow?.hdh_owner ? String(histRow.hdh_owner).trim() : '',
                            tsbt_dang_dieu_tri_benh: (histRow?.hdh_owner || examRow?.he_medical) ? '1' : '0',
                            benh_dang_dieu_tri: (histRow?.hdh_owner || examRow?.he_medical) ? String(histRow?.hdh_owner || examRow?.he_medical).trim() : '',
                            di_ung_thuoc: histRow?.hdh_drugallergy ? String(histRow.hdh_drugallergy).trim() : '',
                            qua_trinh_benh_ly: examRow?.he_medical ? String(examRow.he_medical).trim() : '',
                            cac_benh_tat_neu_co: evalResult.cacBenhTatNeuCo,
                            nhiet_do: conclRow?.hecl_temperature ? String(conclRow.hecl_temperature) : (examRow?.he_temperature ? String(examRow.he_temperature) : ''),
                            nhip_tho: conclRow?.hecl_breathinterval ? String(conclRow.hecl_breathinterval) : (examRow?.he_breathinterval ? String(examRow.he_breathinterval) : ''),
                            bmi: conclRow?.hecl_bmi ? Number(conclRow.hecl_bmi).toFixed(2) : (examRow?.he_bmi ? Number(examRow.he_bmi).toFixed(2) : ''),
                            doctor_id: examDoctorId,
                            doctor_name: examDoctorName,
                            concl_doctor_id: conclDoctorId,
                            concl_doctor_name: conclDoctorName
                        }
                    };

                    const specMetadata = buildSpecialtyMetadata({
                        clinicalData: clinicalDataObj,
                        labData,
                        conclusionData: conclusionDataObj,
                        examDoctorId,
                        examDoctorName,
                        conclDoctorId,
                        conclDoctorName,
                        hasExam: !!examRow,
                        hasConclusion: !!conclRow || !!hisRow.hd_conclusion || !!examRow?.he_diagnostic
                    });
                    clinicalDataObj.specialty_metadata = specMetadata;
                    clinicalDataObj.clinical_exam.specialty_metadata = specMetadata;

                    return res.json({
                        source: 'HIS_DIRECT',
                        id: null,
                        patient_id: hisRow.patient_id,
                        doc_no: String(hisRow.his_doc_no),
                        his_doc_no: String(hisRow.his_doc_no),
                        patient_name: String(hisRow.patient_name || '').toUpperCase(),
                        cccd: hisRow.cccd || '',
                        dob: hisRow.dob || '',
                        gender: hisRow.gender || 'Nam',
                        form_type: resolvedFormType,
                        clinical_data: clinicalDataObj,
                        lab_data: labData,
                        conclusion_data: conclusionDataObj
                    });
                }

                return res.status(404).json({ error: `Không tìm thấy hồ sơ bệnh nhân trên cả hệ thống KSK và HIS với từ khóa: "${identifier}"` });
            }
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi getHisPatient:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Đồng bộ thông tin Lâm sàng, Sinh hiệu, Tiền sử, Chẩn đoán và Kết luận từ KSK về HIS Core
     * Áp dụng khi đợt khám (hms_doc) hoặc phiếu khám (hms_exam) chưa kết thúc (status <> 'T')
     */
    public async pushbackClinicalAndConclusion(
        client: any,
        hisDocNo: number,
        clinicalData: any,
        conclusionData: any,
        currentUserId?: string,
        currentUserName?: string
    ) {
        if (!hisDocNo || isNaN(hisDocNo)) return;

        try {
            // 1. Lấy thông tin đợt khám hiện tại từ hms_doc
            const docRes = await client.query(`
                SELECT hd_docno, hd_patientno, hd_status, hd_enddate, hd_enddept, hd_diagnostic, hd_conclusion
                FROM hms_doc
                WHERE hd_docno = $1
            `, [hisDocNo]);

            if (docRes.rows.length === 0) {
                console.warn(`[pushbackConclusion] Không tìm thấy hms_doc với docNo=${hisDocNo}`);
                return;
            }

            const docRow = docRes.rows[0];
            const patientNo = docRow.hd_patientno;
            const isDocNotEnded = docRow.hd_status !== 'T' || !docRow.hd_enddate;

            // Trích xuất thông tin kết luận
            const fitnessClassRaw = conclusionData?.fitness_class || conclusionData?.fitnessClass || '';
            let fitnessClassNumber = '1';
            if (fitnessClassRaw) {
                const matchNum = String(fitnessClassRaw).match(/\d+/);
                if (matchNum) {
                    fitnessClassNumber = matchNum[0];
                } else {
                    const fLower = String(fitnessClassRaw).toLowerCase();
                    if (fLower.includes('v') || fLower.includes('5')) fitnessClassNumber = '5';
                    else if (fLower.includes('iv') || fLower.includes('4')) fitnessClassNumber = '4';
                    else if (fLower.includes('iii') || fLower.includes('3')) fitnessClassNumber = '3';
                    else if (fLower.includes('ii') || fLower.includes('2')) fitnessClassNumber = '2';
                    else fitnessClassNumber = '1';
                }
            }
            const fitnessClassText = `Loại ${fitnessClassNumber}`;

            const diagnosis = String(conclusionData?.diagnosis || conclusionData?.ket_luan || conclusionData?.ketLuan || '').trim() || (fitnessClassNumber === '1' || fitnessClassNumber === '2' ? 'Đủ sức khỏe làm việc' : 'Khám sức khỏe định kỳ');
            const icd10 = String(conclusionData?.diagnosis_icd10 || conclusionData?.icd10 || '').trim() || 'Z00.0';
            const remarkAdvise = String(conclusionData?.cac_van_de_luu_y || conclusionData?.advise || conclusionData?.cac_benh_tat_neu_co || '').trim();

            const specialtyMetadata = clinicalData?.specialty_metadata || clinicalData?.clinical_exam?.specialty_metadata || {};
            const conclusionDoctorId = specialtyMetadata.conclusion?.doctorId || conclusionData?.doctor_id || clinicalData?.extra?.concl_doctor_id || currentUserId || 'admin';
            const examDoctorId = specialtyMetadata.examination?.doctorId || clinicalData?.extra?.doctor_id || conclusionDoctorId;

            // Lấy deptId của bác sĩ
            let doctorDeptId = 'KKB';
            if (conclusionDoctorId) {
                try {
                    const uRes = await client.query(`SELECT su_deptid FROM sys_user WHERE su_userid = $1`, [conclusionDoctorId]);
                    if (uRes.rows.length > 0 && uRes.rows[0].su_deptid) {
                        doctorDeptId = uRes.rows[0].su_deptid;
                    }
                } catch {}
            }

            // Trích xuất Sinh hiệu
            const examVitals = clinicalData?.examination || {};
            const height = parseFloat(examVitals.height || clinicalData?.chieu_cao) || null;
            const weight = parseFloat(examVitals.weight || clinicalData?.can_nang) || null;
            const bmi = parseFloat(examVitals.bmi || clinicalData?.chi_so_bmi) || (height && weight ? parseFloat((weight / Math.pow(height / 100, 2)).toFixed(2)) : null);
            const pulse = parseFloat(examVitals.pulse || clinicalData?.mach) || null;
            const temperature = parseFloat(examVitals.temperature || clinicalData?.nhiet_do) || null;
            const breathingRate = parseFloat(examVitals.breathing_rate || examVitals.breathinterval || clinicalData?.nhip_tho) || null;

            let bp = String(examVitals.blood_pressure || examVitals.bp || clinicalData?.huyet_ap || '').trim();
            let bpSystolic: number | null = null;
            let bpDiastolic: number | null = null;
            if (bp) {
                const parts = bp.split('/');
                if (parts.length >= 2) {
                    bpSystolic = parseInt(parts[0], 10) || null;
                    bpDiastolic = parseInt(parts[1], 10) || null;
                } else {
                    bpSystolic = parseInt(bp, 10) || null;
                }
            }

            // Trích xuất Khám thể lực & Chuyên khoa
            const ce = clinicalData?.clinical_exam || {};
            const specialtyTexts: string[] = [];
            if (ce.internal) specialtyTexts.push(`Nội khoa: ${ce.internal}`);
            if (ce.external) specialtyTexts.push(`Ngoại khoa: ${ce.external}`);
            if (ce.eye) specialtyTexts.push(`Mắt: ${ce.eye}`);
            if (ce.ent) specialtyTexts.push(`TMH: ${ce.ent}`);
            if (ce.dental) specialtyTexts.push(`RHM: ${ce.dental}`);
            if (ce.dermatology) specialtyTexts.push(`Da liễu: ${ce.dermatology}`);
            if (ce.gynecology) specialtyTexts.push(`Sản phụ khoa: ${ce.gynecology}`);
            if (ce.neurology) specialtyTexts.push(`Thần kinh: ${ce.neurology}`);
            if (ce.psychiatry) specialtyTexts.push(`Tâm thần: ${ce.psychiatry}`);

            const examineGeneral = String(examVitals.physical_summary || clinicalData?.kham_the_luc || 'Thể lực bình thường').trim();
            const partsSummary = specialtyTexts.length > 0 ? specialtyTexts.join('; ') : 'Các chuyên khoa chưa phát hiện bất thường';

            // Trích xuất Tiền sử
            const history = clinicalData?.extra || {};
            const medicalHistory = [
                history.ts_ban_than ? `Bản thân: ${history.ts_ban_than}` : '',
                history.ts_gia_dinh ? `Gia đình: ${history.ts_gia_dinh}` : '',
                history.di_ung_thuoc ? `Dị ứng: ${history.di_ung_thuoc}` : ''
            ].filter(Boolean).join('; ');

            // 2. Cập nhật hms_exam (Nếu phiếu khám chưa kết thúc he_status <> 'T')
            const examCheck = await client.query(`
                SELECT he_docno, he_receptidx, he_status
                FROM hms_exam
                WHERE he_docno = $1
                ORDER BY (CASE WHEN he_status = 'T' THEN 2 ELSE 1 END), he_receptidx DESC
                LIMIT 1
            `, [hisDocNo]);

            if (examCheck.rows.length > 0) {
                const examRow = examCheck.rows[0];
                if (examRow.he_status !== 'T') {
                    console.log(`🚀 [pushbackConclusion] Đồng bộ kết quả vào hms_exam cho docNo=${hisDocNo}, receptidx=${examRow.he_receptidx}`);
                    await client.query(`
                        UPDATE hms_exam SET
                            he_height = COALESCE($1, he_height),
                            he_weight = COALESCE($2, he_weight),
                            he_bmi = COALESCE($3, he_bmi),
                            he_pulse = COALESCE($4, he_pulse),
                            he_bloodpressure = COALESCE($5, he_bloodpressure),
                            he_bloodpressurex = COALESCE($6, he_bloodpressurex),
                            he_temperature = COALESCE($7, he_temperature),
                            he_breathinterval = COALESCE($8, he_breathinterval),
                            he_examine = COALESCE(NULLIF($9, ''), he_examine),
                            he_parts = COALESCE(NULLIF($10, ''), he_parts),
                            he_medical = COALESCE(NULLIF($11, ''), he_medical),
                            he_diagnostic = COALESCE(NULLIF($12, ''), he_diagnostic),
                            he_icd10 = COALESCE(NULLIF($13, ''), he_icd10),
                            he_remark = COALESCE(NULLIF($14, ''), he_remark),
                            he_doctor = COALESCE(NULLIF($15, ''), he_doctor),
                            he_examdate = CURRENT_TIMESTAMP,
                            he_status = 'T',
                            he_updateddate = CURRENT_TIMESTAMP,
                            he_updatedby = $15
                        WHERE he_docno = $16 AND he_receptidx = $17
                    `, [
                        height, weight, bmi, pulse, bpSystolic, bpDiastolic, temperature, breathingRate,
                        examineGeneral, partsSummary, medicalHistory, diagnosis, icd10,
                        remarkAdvise, examDoctorId, hisDocNo, examRow.he_receptidx
                    ]);
                }
            }

            // 3. Cập nhật hms_doc (Nếu đợt khám chưa kết thúc)
            if (isDocNotEnded) {
                console.log(`🚀 [pushbackConclusion] Đồng bộ kết luận và đóng đợt khám hms_doc cho docNo=${hisDocNo}`);
                await client.query(`
                    UPDATE hms_doc SET
                        hd_diagnostic = COALESCE(NULLIF($1, ''), hd_diagnostic),
                        hd_conclusion = COALESCE(NULLIF($2, ''), hd_conclusion),
                        hd_icd = COALESCE(NULLIF($3, ''), hd_icd),
                        hd_doctor = COALESCE(NULLIF($4, ''), hd_doctor),
                        hd_result = COALESCE(NULLIF($5, ''), hd_result, '1'),
                        hd_enddate = COALESCE(hd_enddate, CURRENT_TIMESTAMP),
                        hd_enddept = COALESCE(hd_enddept, $6),
                        hd_status = 'T',
                        hd_updateddate = CURRENT_TIMESTAMP,
                        hd_updatedby = $4
                    WHERE hd_docno = $7
                `, [diagnosis, fitnessClassText, icd10, conclusionDoctorId, fitnessClassNumber, doctorDeptId, hisDocNo]);
            }

            // 4. Cập nhật hms_exm_employee (Nhân viên trong hợp đồng KSK)
            const employeeNote = `${fitnessClassText} - ${diagnosis}`;
            await client.query(`
                UPDATE hms_exm_employee SET
                    hee_status = 'T',
                    hee_note = COALESCE(NULLIF($1, ''), hee_note),
                    hee_updateddate = CURRENT_TIMESTAMP,
                    hee_updatedby = $2
                WHERE hee_docno = $3 OR (hee_patientno = $4 AND hee_patientno > 0)
            `, [employeeNote, conclusionDoctorId, hisDocNo, patientNo]);

            // 5. Cập nhật / UPSERT hms_disease_hist
            if (history.ts_ban_than || history.ts_gia_dinh || history.di_ung_thuoc) {
                const histCheck = await client.query(`
                    SELECT 1 FROM hms_disease_hist WHERE hdh_docno = $1 OR (hdh_patientno = $2 AND hdh_patientno > 0) LIMIT 1
                `, [hisDocNo, patientNo]);

                if (histCheck.rows.length > 0) {
                    await client.query(`
                        UPDATE hms_disease_hist SET
                            hdh_owner = COALESCE(NULLIF($1, ''), hdh_owner),
                            hdh_family = COALESCE(NULLIF($2, ''), hdh_family),
                            hdh_drugallergy = COALESCE(NULLIF($3, ''), hdh_drugallergy),
                            hdh_updateddate = CURRENT_TIMESTAMP,
                            hdh_updatedby = $4
                        WHERE hdh_docno = $5 OR (hdh_patientno = $6 AND hdh_patientno > 0)
                    `, [history.ts_ban_than || '', history.ts_gia_dinh || '', history.di_ung_thuoc || '', conclusionDoctorId, hisDocNo, patientNo]);
                } else if (patientNo) {
                    await client.query(`
                        INSERT INTO hms_disease_hist (
                            hdh_patientno, hdh_docno, hdh_owner, hdh_family, hdh_drugallergy, hdh_createdby, hdh_createddate
                        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
                    `, [patientNo, hisDocNo, history.ts_ban_than || '', history.ts_gia_dinh || '', history.di_ung_thuoc || '', conclusionDoctorId]);
                }
            }

            // 6. Cập nhật / UPSERT hms_exm_conclusion (Lưu chi tiết các chuyên khoa và kết luận KSK trên HIS)
            const conclCheck = await client.query(`SELECT 1 FROM hms_exm_conclusion WHERE hecl_docno = $1`, [hisDocNo]);
            if (conclCheck.rows.length > 0) {
                await client.query(`
                    UPDATE hms_exm_conclusion SET
                        hecl_theluc = COALESCE(NULLIF($1, ''), hecl_theluc),
                        hecl_tuanhoan = COALESCE(NULLIF($2, ''), hecl_tuanhoan),
                        hecl_hohap = COALESCE(NULLIF($3, ''), hecl_hohap),
                        hecl_tieuhoa = COALESCE(NULLIF($4, ''), hecl_tieuhoa),
                        hecl_thantietnieu = COALESCE(NULLIF($5, ''), hecl_thantietnieu),
                        hecl_noitiet = COALESCE(NULLIF($6, ''), hecl_noitiet),
                        hecl_coxuongkhop = COALESCE(NULLIF($7, ''), hecl_coxuongkhop),
                        hecl_thankinh = COALESCE(NULLIF($8, ''), hecl_thankinh),
                        hecl_tamthan = COALESCE(NULLIF($9, ''), hecl_tamthan),
                        hecl_ngoai = COALESCE(NULLIF($10, ''), hecl_ngoai),
                        hecl_dalieu = COALESCE(NULLIF($11, ''), hecl_dalieu),
                        hecl_mat = COALESCE(NULLIF($12, ''), hecl_mat),
                        hecl_tmh = COALESCE(NULLIF($13, ''), hecl_tmh),
                        hecl_rhm = COALESCE(NULLIF($14, ''), hecl_rhm),
                        hecl_phukhoa = COALESCE(NULLIF($15, ''), hecl_phukhoa),
                        hecl_phanloai = COALESCE(NULLIF($16, ''), hecl_phanloai),
                        hecl_conclusion = COALESCE(NULLIF($17, ''), hecl_conclusion),
                        hecl_remark = COALESCE(NULLIF($18, ''), hecl_remark)
                    WHERE hecl_docno = $19
                `, [
                    examineGeneral,
                    ce.circulatory || ce.tuanhoan || ce.noi_khoa_tuan_hoan || '',
                    ce.respiratory || ce.hohap || ce.noi_khoa_ho_hap || '',
                    ce.digestive || ce.tieuhoa || ce.noi_khoa_tieu_hoa || '',
                    ce.urinary || ce.thantietnieu || ce.noi_khoa_than_tietnieu_pl || '',
                    ce.endocrine || ce.noitiet || '',
                    ce.musculoskeletal || ce.coxuongkhop || '',
                    ce.neurology || ce.thankinh || ce.noi_khoa_than_kinh || '',
                    ce.psychiatry || ce.tamthan || ce.noi_khoa_tam_than || '',
                    ce.external || ce.ngoai || '',
                    ce.dermatology || ce.dalieu || '',
                    ce.eye || ce.mat || '',
                    ce.ent || ce.tmh || '',
                    ce.dental || ce.rhm || '',
                    ce.gynecology || ce.phukhoa || '',
                    fitnessClassText,
                    diagnosis,
                    remarkAdvise,
                    hisDocNo
                ]);
            } else {
                await client.query(`
                    INSERT INTO hms_exm_conclusion (
                        hecl_docno, hecl_theluc, hecl_tuanhoan, hecl_hohap, hecl_tieuhoa,
                        hecl_thantietnieu, hecl_noitiet, hecl_coxuongkhop, hecl_thankinh, hecl_tamthan,
                        hecl_ngoai, hecl_dalieu, hecl_mat, hecl_tmh, hecl_rhm, hecl_phukhoa,
                        hecl_phanloai, hecl_conclusion, hecl_remark
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
                        $18, $19
                    )
                `, [
                    hisDocNo,
                    examineGeneral,
                    ce.circulatory || ce.tuanhoan || ce.noi_khoa_tuan_hoan || '',
                    ce.respiratory || ce.hohap || ce.noi_khoa_ho_hap || '',
                    ce.digestive || ce.tieuhoa || ce.noi_khoa_tieu_hoa || '',
                    ce.urinary || ce.thantietnieu || ce.noi_khoa_than_tietnieu_pl || '',
                    ce.endocrine || ce.noitiet || '',
                    ce.musculoskeletal || ce.coxuongkhop || '',
                    ce.neurology || ce.thankinh || ce.noi_khoa_than_kinh || '',
                    ce.psychiatry || ce.tamthan || ce.noi_khoa_tam_than || '',
                    ce.external || ce.ngoai || '',
                    ce.dermatology || ce.dalieu || '',
                    ce.eye || ce.mat || '',
                    ce.ent || ce.tmh || '',
                    ce.dental || ce.rhm || '',
                    ce.gynecology || ce.phukhoa || '',
                    fitnessClassText,
                    diagnosis,
                    remarkAdvise
                ]);
            }

            console.log(`✅ [pushbackConclusion] Hoàn thành đồng bộ Lâm sàng, Sinh hiệu, Tiền sử, Kết luận và Chuyên khoa (hms_exm_conclusion) về HIS cho docNo=${hisDocNo}`);
        } catch (err) {
            console.error(`❌ [pushbackConclusion] Lỗi đồng bộ về HIS cho docNo ${hisDocNo}:`, err);
        }
    }
}

export const hisIntegrationController = new HisIntegrationController();
