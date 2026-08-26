import { Request, Response } from 'express';
import { query, transaction } from '../../config/database';
import { generateXmlPayload } from './xml-generator';
import { formatYmdString } from '../../services/health-check-merge.service';

class HisIntegrationController {
    
    // Helper: Lấy dữ liệu cận lâm sàng cấu trúc từ HIS
    public async fetchStructuredParaclinicalData(docNo: number) {
        const items: any[] = [];
        let hemoglobin = '';
        let glycemia = '';
        let protein = '';
        const otherTests: string[] = [];
        const pacsResults: string[] = [];

        // Tải bản đồ ánh xạ từ bảng health_check_service_mappings
        const mappingMap = new Map<string, 'XN' | 'HA' | 'TD'>();
        try {
            const mappingRes = await query('SELECT service_code, cls_type FROM health_check_service_mappings');
            for (const r of mappingRes.rows) {
                mappingMap.set(String(r.service_code).trim(), r.cls_type as 'XN' | 'HA' | 'TD');
            }
        } catch (mapErr) {
            console.error('⚠️ [fetchStructuredParaclinicalData] Lỗi truy vấn health_check_service_mappings, dùng fallback:', mapErr);
        }

        const determinePacsType = (gid: string, gname: string, sname: string, serviceCode?: string): 'XN' | 'HA' | 'TD' => {
            if (serviceCode) {
                const cleanCode = String(serviceCode).trim();
                if (mappingMap.has(cleanCode)) {
                    return mappingMap.get(cleanCode)!;
                }
            }

            const id = String(gid || '').toUpperCase();
            
            // Phân loại động theo tiền tố mã hms_fee_group (hfg_id / group_id)
            if (id.startsWith('A')) return 'XN';
            if (id.startsWith('B1')) return 'XN';
            if (id.startsWith('B2')) return 'HA';
            if (id.startsWith('B3')) return 'TD';
            
            const nameLower = String(gname || '').toLowerCase();
            const sNameLower = String(sname || '').toLowerCase();
            
            // 1. Kiểm tra theo tên dịch vụ (rất chính xác)
            if (sNameLower.includes('điện tim') || 
                sNameLower.includes('điện não') || 
                sNameLower.includes('nội soi') || 
                sNameLower.includes('đo chức năng') || 
                sNameLower.includes('đo thính lực') || 
                sNameLower.includes('đo thị lực') || 
                sNameLower.includes('thăm dò chức năng') ||
                sNameLower.includes('đo loãng xương')) {
                return 'TD';
            }
            
            if (sNameLower.includes('siêu âm') || 
                sNameLower.includes('x-quang') || 
                sNameLower.includes('x quang') || 
                sNameLower.includes('chụp') || 
                sNameLower.includes('cộng hưởng từ') || 
                sNameLower.includes('cắt lớp') || 
                sNameLower.includes('mri') || 
                sNameLower.includes('ct')) {
                return 'HA';
            }
            
            // 2. Kiểm tra theo tên nhóm
            if (nameLower.includes('hình ảnh') || 
                nameLower.includes('siêu âm') || 
                nameLower.includes('x-quang') || 
                nameLower.includes('x quang') || 
                nameLower.includes('chụp') || 
                nameLower.includes('cắt lớp') || 
                nameLower.includes('mri') || 
                nameLower.includes('ct')) {
                return 'HA';
            }
            if (nameLower.includes('thăm dò') || 
                nameLower.includes('chức năng') || 
                nameLower.includes('nội soi') || 
                nameLower.includes('điện tim') || 
                nameLower.includes('điện não') || 
                nameLower.includes('đo ')) {
                return 'TD';
            }
            
            // 3. Dự phòng theo mã nhóm (Thường C là CDHA, D là TDCN)
            if (id.startsWith('C')) return 'HA';
            if (id.startsWith('D')) return 'TD';
            if (id.startsWith('B')) return 'HA';
            
            return 'HA'; // Mặc định cho PACS
        };

        try {
            // 1. Truy vấn kết quả xét nghiệm (Nhóm A) - Lấy tất cả chỉ định từ HIS chưa bị hủy
            const testRes = await query(`
                SELECT TRIM(f.hfl_feeid) AS service_code, 
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
                WHERE t.hpcl_docno = $1
                  AND COALESCE(t.hpcl_status, 'O') <> 'C'
                  AND COALESCE(o.hpc_status, 'O') <> 'C'
                ORDER BY f.hfl_groupid, 
                         t.hpcl_orderid, 
                         COALESCE(p.hfl_line, f.hfl_line), 
                         COALESCE(NULLIF(UPPER(TRIM(f.hfl_subitem)), 'Y'), TRIM(f.hfl_feeid)), 
                         CASE WHEN UPPER(TRIM(f.hfl_subitem)) = 'Y' THEN 0 ELSE 1 END, 
                         f.hfl_line
            `, [docNo]);

            for (const row of testRes.rows) {
                const nameLower = String(row.service_name || '').toLowerCase();
                const val = String(row.value || '').trim();
                const groupId = row.group_id || 'A01';
                const groupName = row.group_name || 'Xét nghiệm';

                // Trích xuất các chỉ số cốt lõi cho khả năng tương thích ngược
                if (nameLower.includes('hemoglobin') || nameLower.includes('hgb') || nameLower.includes('huyết sắc tố') || nameLower.includes('hst')) {
                    hemoglobin = val;
                } else if (nameLower.includes('glucose') || nameLower.includes('đường huyết') || nameLower.includes('đường máu')) {
                    glycemia = val;
                } else if (nameLower.includes('protein niệu') || nameLower.includes('protein nước tiểu') || (nameLower.includes('protein') && nameLower.includes('nước tiểu'))) {
                    protein = val;
                } else {
                    if (val) {
                        otherTests.push(`${row.service_name}: ${val}${row.unit ? ' ' + row.unit.trim() : ''}`);
                    }
                }

                items.push({
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

            // 1.1 Tự động nạp chỉ số xét nghiệm con nếu chỉ định cha chưa mở rộng các dòng chi tiết
            const parentCodes = testRes.rows
                .map((r: any) => String(r.service_code || '').trim())
                .filter(Boolean);

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
                    const existing = items.find(it => it.service_code === subRow.service_code);
                    if (!existing) {
                        const parentItem = items.find(it => it.service_code === subRow.parent_code);
                        items.push({
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

            // 2. Truy vấn kết quả hình ảnh & thăm dò chức năng (Nhóm B và C) - Lấy tất cả chỉ định từ HIS chưa bị hủy
            const pacsRes = await query(`
                SELECT f.hfl_feeid AS service_code, 
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
                WHERE p.hpcl_docno = $1
                  AND COALESCE(p.hpcl_status, 'O') <> 'C'
                  AND COALESCE(po.hpc_status, 'O') <> 'C'
                ORDER BY f.hfl_groupid, p.hpcl_orderid, p.hpcl_orderlineid, r.hpr_name DESC
            `, [docNo]);

            const pacsMap = new Map<string, any>();
            for (const row of pacsRes.rows) {
                const code = row.service_code || 'PACS';
                const orderId = row.order_id ? String(row.order_id) : '';
                const key = `${orderId}_${code}`;
                if (!pacsMap.has(key)) {
                    const groupId = row.group_id || 'B01';
                    const groupName = row.group_name || 'Chẩn đoán hình ảnh';
                    const serviceName = row.service_name || 'Cận lâm sàng';
                    pacsMap.set(key, {
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

                const item = pacsMap.get(key);
                const resName = String(row.result_name || '').trim().toLowerCase();
                const descVal = String(row.result_desc || '').trim();

                if (resName === 'conclusion' || resName === 'result') {
                    item.conclusion = descVal;
                    item.value = descVal;
                } else if (resName === 'remark') {
                    item.description = descVal;
                } else if (descVal) {
                    // HIS/PACS có thể không chuẩn hóa tên loại kết quả; vẫn giữ mô tả chi tiết.
                    item.description = item.description ? `${item.description}; ${descVal}` : descVal;
                }
            }

            for (const item of pacsMap.values()) {
                if (!item.value && item.description) {
                    item.value = item.description;
                }
                items.push(item);
                
                const desc = item.conclusion || item.description || '';
                if (desc) {
                    pacsResults.push(`${item.service_name}: ${desc}`);
                }
            }

        } catch (e) {
            console.error('Error fetching structured paraclinical data from HIS:', e);
        }

        const extraParts: string[] = [];
        if (otherTests.length > 0) {
            extraParts.push(`Xét nghiệm khác: ${otherTests.join('; ')}`);
        }
        if (pacsResults.length > 0) {
            extraParts.push(`Chẩn đoán hình ảnh: ${pacsResults.join('; ')}`);
        }
        const kqXnKhac = extraParts.join('. ');

        return {
            hemoglobin,
            glycemia,
            protein,
            kqXnKhac,
            paraclinical_items: items
        };
    }

    // 8. Đồng bộ dữ liệu KSK từ HIS — Smart UPSERT (không xóa dữ liệu cũ)
    async seedFromHis(req: Request, res: Response) {
        try {
            const { startDate, endDate, workplaceId } = req.body;

            // workplaceId đại diện cho contract ID được chọn
            const contractId = workplaceId ? parseInt(String(workplaceId), 10) : null;
            if (!contractId) {
                return res.status(400).json({ error: 'Vui lòng chọn Hợp đồng Khám sức khỏe để đồng bộ.' });
            }

            // Lấy mẫu KSK cấu hình trên hợp đồng
            const contractRes = await query('SELECT hec_form_type FROM hms_exm_contract WHERE hec_contract_id = $1', [contractId]);
            const defaultFormType = contractRes.rows[0]?.hec_form_type || '2';

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

            // Lấy danh sách nhân viên từ HIS theo hợp đồng
            const hisSql = `
                SELECT 
                    hee.hee_employee_id,
                    hee.hee_id,
                    trim(hee.hee_surname||' '||hee.hee_midname||' '||hee.hee_firstname) as patient_name,
                    to_char(hee.hee_birthdate,'YYYY-MM-DD') as dob,
                    hee.hee_sex, hee.hee_ethnic, hee.hee_address,
                    hee.hee_patientno, hee.hee_status, hee.hee_docno,
                    hee.hee_phone, hee.hee_cardid, hee.hee_note,
                    hee.hee_cardid_date, hee.hee_cardid_place,
                    hee.hee_guardian_name, hee.hee_guardian_cccd,
                    to_char(d.hd_admitdate,'DD/MM/YYYY') as admitdate,
                    to_char(d.hd_admitdate,'HH24:MI') as admit_time,
                    COALESCE(hms_getusername(d.hd_doctor), 'BS. Nguyễn Văn A') as doctor_name,
                    d.hd_provid, d.hd_distid, d.hd_villid, d.hd_cardno,
                    e.he_height, e.he_weight, e.he_bmi, e.he_pulse,
                    e.he_bloodpressure, e.he_bloodpressurex,
                    e.he_examine, e.he_diagnostic,
                    e.he_status as exam_status
                FROM hms_exm_employee hee
                LEFT JOIN hms_doc d ON d.hd_docno = hee.hee_docno
                LEFT JOIN hms_exam e ON e.he_docno = d.hd_docno AND e.he_receptno = 1
                WHERE hee.hee_contract_id = $1 AND hee.hee_isactive = 'Y' ${sqlFilters}
                ORDER BY hee.hee_employee_id
            `;
            const hisResult = await query(hisSql, queryParams);

            if (hisResult.rows.length === 0) {
                return res.status(404).json({
                    error: 'Không tìm thấy bệnh nhân nào trong hợp đồng KSK này khớp với điều kiện lọc.'
                });
            }

            // =====================================================================
            // SMART UPSERT — Xử lý từng hồ sơ theo trạng thái hiện tại
            // KHÔNG xóa dữ liệu cũ như logic trước đây
            // =====================================================================
            let insertedCount = 0;      // Tạo mới
            let fullUpdateCount = 0;    // Cập nhật đầy đủ (chưa có dữ liệu khám)
            let partialUpdateCount = 0; // Cập nhật hành chính (giữ dữ liệu khám)
            let skippedSignedCount = 0; // Bỏ qua: đã ký số
            let skippedSentCount = 0;   // Bỏ qua: đã gửi VNeID

            // Tải trước tất cả hồ sơ của hợp đồng này để tra cứu nhanh (tránh N+1 query)
            const existingRes = await query(`
                SELECT id, his_employee_id, doc_no, signature_status, send_status
                FROM health_check_masters
                WHERE his_contract_id = $1
                   OR (his_contract_id IS NULL AND doc_no LIKE 'KSK-%')
            `, [contractId]);

            const byHisEmpId = new Map<string, any>();
            const byDocNo = new Map<string, any>();
            for (const rec of existingRes.rows) {
                if (rec.his_employee_id) byHisEmpId.set(String(rec.his_employee_id), rec);
                if (rec.doc_no) byDocNo.set(rec.doc_no, rec);
            }

            for (let i = 0; i < hisResult.rows.length; i++) {
                const row = hisResult.rows[i];
                const hisEmpId = String(row.hee_employee_id);
                const formType = defaultFormType;
                const docNo = String(row.hee_docno || row.hee_employee_id);

                // Tìm hồ sơ hiện tại: ưu tiên theo his_employee_id, fallback theo doc_no
                const existing = byHisEmpId.get(hisEmpId) || byDocNo.get(docNo);

                // ── Kịch bản 1: Đã gửi VNeID thành công → BỎ QUA ──
                if (existing && existing.send_status === 'Success') {
                    skippedSentCount++;
                    continue;
                }

                // ── Kịch bản 2: Đã ký số → BỎ QUA ──
                if (existing && existing.signature_status === 'Signed') {
                    skippedSignedCount++;
                    continue;
                }

                // Chuẩn bị dữ liệu từ HIS
                const docNoVal = row.hee_docno ? Number(row.hee_docno) : null;
                const labAndPacs = docNoVal ? await this.fetchStructuredParaclinicalData(docNoVal) : {
                    hemoglobin: '', glycemia: '', protein: '', kqXnKhac: '', paraclinical_items: []
                };

                const genderVal = (row.hee_sex || '').toLowerCase();
                const gender = (genderVal === 'm' || genderVal.includes('nam') || genderVal === '1') ? 'Nam' : 'Nữ';
                const patientName = (row.patient_name || '').toUpperCase().trim();
                const cccd = row.hee_cardid || '';
                const patientId = String(row.hee_patientno || row.hee_employee_id);

                const bp = row.he_bloodpressure != null && row.he_bloodpressurex != null
                    ? `${row.he_bloodpressure}/${row.he_bloodpressurex}` : '';
                const height = row.he_height > 0 ? Number(row.he_height) : '';
                const weight = row.he_weight > 0 ? Number(row.he_weight) : '';
                const bmi = row.he_bmi > 0 ? Number(row.he_bmi) : '';
                const hasConclusion = (row.exam_status === 'T') || (row.he_diagnostic && row.he_diagnostic.trim() !== '');
                const specialtyMetadata: any = {};
                if (hasConclusion) {
                    const docName = row.doctor_name || 'BS. Nguyễn Văn A';
                    const keys = ['admin', 'history', 'conclusion', 'internal', 'eye', 'ent', 'dental', 'external', 'dermatology', 'gynecology'];
                    keys.forEach(k => {
                        specialtyMetadata[k] = {
                            doctorId: docName,
                            doctorName: docName,
                            status: 'ĐÃ_KHÁM',
                            updatedAt: new Date().toISOString()
                        };
                    });
                }

                const clinicalData: any = {
                    address: row.hee_address || '',
                    phone: row.hee_phone || '',
                    ethnic: row.hee_ethnic ? String(row.hee_ethnic).padStart(2, '0') : '01',
                    matinh_cu_tru: row.hd_provid !== null && row.hd_provid !== undefined ? String(row.hd_provid) : (row.hee_provid !== null && row.hee_provid !== undefined ? String(row.hee_provid) : (row.hee_prov_code || '')),
                    mahuyen_cu_tru: row.hd_distid || '',
                    maxa_cu_tru: row.hd_villid !== null && row.hd_villid !== undefined ? String(row.hd_villid) : (row.hee_villid !== null && row.hee_villid !== undefined ? String(row.hee_villid) : (row.hee_vill_code || '')),
                    cccd_date: row.hee_cardid_date || '',
                    cccd_place: row.hee_cardid_place || '',
                    nguoi_giam_ho: row.hee_guardian_name || '',
                    so_cccd_ngh: row.hee_guardian_cccd || '',
                    blood_group: '', target_group: '14', funding_source: '9',
                    examination: {
                        height: String(height), weight: String(weight), bmi: String(bmi),
                        blood_pressure: bp,
                        pulse: row.he_pulse > 0 ? String(row.he_pulse) : '',
                    },
                    clinical_exam: {
                        specialty_metadata: specialtyMetadata,
                    internal: row.he_examine || '',
                    eye: '',
                    ent: '',
                    dental: '',
                    external: '',
                    gynecology: '',
                    },
                    extra: {
                        gio_kham: row.admit_time || '',
                        ngay_kham_his: row.admitdate || ''
                    }
                };

                const labData: any = {
                    blood_test: {
                        hemoglobin: labAndPacs.hemoglobin || '',
                        glycemia: labAndPacs.glycemia || ''
                    },
                    urine_test: { protein: labAndPacs.protein || '' },
                    kq_xn_khac: labAndPacs.kqXnKhac || '',
                    paraclinical_items: labAndPacs.paraclinical_items || []
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
                    clinicalData.extra = { sinh_non: 0, tuan_thai_khi_sinh: 39, can_nang_luc_sinh: '3.2' };
                } else if (parseInt(formType) >= 14) {
                    clinicalData.extra = { tiem_chung_bcg: 1, tiem_chung_bh_hg_uv: 1, tiem_chung_soi: 1 };
                }

                const conclusionData: any = hasConclusion ? {
                    fitness_class: (i % 3 === 0) ? '2' : '1',
                    diagnosis: row.he_diagnostic || '',
                    cac_van_de_luu_y: 'Không',
                    doctor_name: row.doctor_name,
                    ket_luan_loai_suc_khoe: (formType === '5') ? '1' : undefined
                } : null;

                if (existing) {
                    // ── Kịch bản 3: Hồ sơ tồn tại, chưa ký, chưa gửi ──
                    await transaction(async (client) => {
                        // Kiểm tra xem đã có dữ liệu khám chưa
                        const detailRes = await client.query(`
                            SELECT id, conclusion_data FROM health_check_details WHERE master_id = $1 LIMIT 1
                        `, [existing.id]);
                        const existingDetail = detailRes.rows[0];
                        const hasExistingClinicalData = existingDetail && existingDetail.conclusion_data !== null;

                        // Luôn cập nhật thông tin hành chính cơ bản
                        await client.query(`
                            UPDATE health_check_masters SET
                                patient_name = $1, cccd = $2, dob = $3, gender = $4, patient_id = $5,
                                his_employee_id = $6, his_contract_id = $7, his_doc_no = $8, sync_mode = 'HIS', updated_at = NOW()
                            WHERE id = $9
                        `, [patientName, cccd, formatYmdString(row.dob), gender,
                            patientId, hisEmpId, contractId, row.hee_docno ? String(row.hee_docno) : null, existing.id]);

                        if (hasExistingClinicalData) {
                            // ── 3A: Đã có dữ liệu khám → Chỉ merge phần hành chính vào clinical_data ──
                            const adminPatch = {
                                ...(clinicalData.address ? { address: clinicalData.address } : {}),
                                ...(clinicalData.phone ? { phone: clinicalData.phone } : {}),
                                ethnic: clinicalData.ethnic,
                                matinh_cu_tru: clinicalData.matinh_cu_tru,
                                mahuyen_cu_tru: clinicalData.mahuyen_cu_tru,
                                maxa_cu_tru: clinicalData.maxa_cu_tru,
                                ...(clinicalData.cccd_date ? { cccd_date: clinicalData.cccd_date } : {}),
                                ...(clinicalData.cccd_place ? { cccd_place: clinicalData.cccd_place } : {}),
                                nguoi_giam_ho: clinicalData.nguoi_giam_ho,
                                so_cccd_ngh: clinicalData.so_cccd_ngh,
                            };
                            await client.query(`
                                UPDATE health_check_details
                                SET clinical_data = clinical_data || $1::jsonb, updated_at = NOW()
                                WHERE master_id = $2
                            `, [JSON.stringify(adminPatch), existing.id]);
                            partialUpdateCount++;
                        } else {
                            // ── 3B: Chưa có dữ liệu khám → Cập nhật đầy đủ từ HIS ──
                            const xmlData = generateXmlPayload(
                                formType,
                                { patientName, cccd, dob: row.dob || '1990-01-01', gender, docNo },
                                clinicalData, labData, conclusionData
                            );
                            await client.query(`
                                UPDATE health_check_masters SET form_type = $1, xml_data = $2, updated_at = NOW()
                                WHERE id = $3
                            `, [formType, xmlData, existing.id]);

                            if (existingDetail) {
                                await client.query(`
                                    UPDATE health_check_details
                                    SET clinical_data = $1, lab_data = $2, conclusion_data = $3, updated_at = NOW()
                                    WHERE master_id = $4
                                `, [JSON.stringify(clinicalData), JSON.stringify(labData),
                                    conclusionData ? JSON.stringify(conclusionData) : null, existing.id]);
                            } else {
                                await client.query(`
                                    INSERT INTO health_check_details (master_id, clinical_data, lab_data, conclusion_data)
                                    VALUES ($1, $2, $3, $4)
                                `, [existing.id, JSON.stringify(clinicalData), JSON.stringify(labData),
                                    conclusionData ? JSON.stringify(conclusionData) : null]);
                            }
                            fullUpdateCount++;
                        }
                    });
                } else {
                    // ── Kịch bản 4: Hồ sơ chưa tồn tại → INSERT MỚI ──
                    const xmlData = generateXmlPayload(
                        formType,
                        { patientName, cccd, dob: row.dob || '1990-01-01', gender, docNo },
                        clinicalData, labData, conclusionData
                    );
                    await transaction(async (client) => {
                        const masterRes = await client.query(`
                            INSERT INTO health_check_masters (
                                patient_id, patient_name, cccd, dob, gender,
                                doc_no, form_type, xml_data,
                                signature_status, send_status,
                                his_employee_id, his_contract_id, his_doc_no, sync_mode
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Unsigned', 'Unsent', $9, $10, $11, 'HIS')
                            RETURNING id
                        `, [patientId, patientName, cccd, formatYmdString(row.dob),
                            gender, docNo, formType, xmlData, hisEmpId, contractId, row.hee_docno ? String(row.hee_docno) : null]);
                        const masterId = masterRes.rows[0].id;

                        await client.query(`
                            INSERT INTO health_check_details (master_id, clinical_data, lab_data, conclusion_data)
                            VALUES ($1, $2, $3, $4)
                        `, [masterId, JSON.stringify(clinicalData), JSON.stringify(labData),
                            conclusionData ? JSON.stringify(conclusionData) : null]);
                    });
                    insertedCount++;
                }
            }

            // Cập nhật trạng thái hợp đồng
            const syncedCount = insertedCount + fullUpdateCount + partialUpdateCount;
            await query(`
                UPDATE hms_exm_contract
                SET hec_status = 'P', hec_synced_count = $2
                WHERE hec_contract_id = $1
            `, [contractId, syncedCount]);

            // Thông báo chi tiết kết quả
            const parts: string[] = [];
            if (insertedCount > 0) parts.push(`Tạo mới: ${insertedCount}`);
            if (fullUpdateCount > 0) parts.push(`Cập nhật: ${fullUpdateCount}`);
            if (partialUpdateCount > 0) parts.push(`Cập nhật hành chính: ${partialUpdateCount}`);
            if (skippedSignedCount > 0) parts.push(`Bỏ qua (đã ký): ${skippedSignedCount}`);
            if (skippedSentCount > 0) parts.push(`Bỏ qua (đã gửi VNeID): ${skippedSentCount}`);

            return res.json({
                success: true,
                count: syncedCount,
                inserted: insertedCount,
                updated: fullUpdateCount,
                partial_update: partialUpdateCount,
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

                // Bổ sung sinh hiệu từ HIS nếu hồ sơ KSK chưa có hoặc rỗng
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
                            const ex = examRes.rows[0];
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
                            if (!clinicalData.extra) clinicalData.extra = {};
                            if (!clinicalData.extra.gio_kham && ex.exam_time) clinicalData.extra.gio_kham = ex.exam_time;
                            if (!clinicalData.extra.ngay_kham && ex.exam_date) clinicalData.extra.ngay_kham = ex.exam_date;

                            if (!conclusionData.diagnosis && ex.he_diagnostic) conclusionData.diagnosis = ex.he_diagnostic;
                            if (!conclusionData.doctor_id && ex.he_doctor) conclusionData.doctor_id = ex.he_doctor;
                        }
                    } catch (examErr) {
                        console.error('⚠️ [getHisPatient] Lỗi tra cứu exam cho HEALTH_CHECK_MASTER:', examErr);
                    }
                }

                // Bổ sung thông tin địa chỉ từ hms_doc nếu hồ sơ KSK chưa có
                if ((!clinicalData.address || !clinicalData.matinh_cu_tru) && docNoVal) {
                    try {
                        const addrRes = await query(`
                            SELECT 
                                COALESCE(NULLIF(TRIM(d.hd_dtladdr), ''), NULLIF(TRIM(p.hp_dtladdr), ''), hms_getaddress(COALESCE(d.hd_provid, p.hp_provid, 0), COALESCE(d.hd_distid, p.hp_distid, 0), COALESCE(d.hd_villid, p.hp_villid, 0)), '') as address,
                                COALESCE(d.hd_provid, p.hp_provid, 0)::text as matinh_cu_tru,
                                COALESCE(d.hd_villid, p.hp_villid, 0)::text as maxa_cu_tru
                            FROM hms_doc d
                            JOIN hms_patient p ON d.hd_patientno = p.hp_patientno
                            WHERE d.hd_docno = $1
                            LIMIT 1
                        `, [docNoVal]);
                        if (addrRes.rows.length > 0) {
                            const a = addrRes.rows[0];
                            if (!clinicalData.address && a.address) clinicalData.address = a.address;
                            if (!clinicalData.matinh_cu_tru && a.matinh_cu_tru && a.matinh_cu_tru !== '0') clinicalData.matinh_cu_tru = a.matinh_cu_tru;
                            if (!clinicalData.maxa_cu_tru && a.maxa_cu_tru && a.maxa_cu_tru !== '0') clinicalData.maxa_cu_tru = a.maxa_cu_tru;
                        }
                    } catch (addrErr) {
                        console.error('⚠️ [getHisPatient] Lỗi tra cứu address từ hms_doc:', addrErr);
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
                            to_char(d.hd_admitdate, 'YYYY-MM-DD') as ngay_vao,
                            c.hc_cardno as insurance_card
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
                            to_char(d.hd_admitdate, 'YYYY-MM-DD') as ngay_vao,
                            c.hc_cardno as insurance_card
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
                            to_char(d.hd_admitdate, 'YYYY-MM-DD') as ngay_vao,
                            c.hc_cardno as insurance_card
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
                                    hecl_docno, hecl_theluc, hecl_noi, hecl_tuanhoan, hecl_hohap, hecl_tieuhoa,
                                    hecl_thantietnieu, hecl_noitiet, hecl_coxuongkhop, hecl_thankinh, hecl_tamthan,
                                    hecl_ngoai, hecl_dalieu, hecl_mat, hecl_tmh, hecl_rhm, hecl_phukhoa,
                                    hecl_phanloai, hecl_conclusion, hecl_remark,
                                    hecl_temperature, hecl_pulse, hecl_bloodpressure, hecl_bloodpressurex,
                                    hecl_breathinterval, hecl_weight, hecl_height, hecl_bmi
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
                    if (conclRow?.hecl_bloodpressure && conclRow?.hecl_bloodpressurex) {
                        bpStr = `${conclRow.hecl_bloodpressure}/${conclRow.hecl_bloodpressurex}`;
                    } else if (examRow?.he_bloodpressure && examRow?.he_bloodpressurex) {
                        bpStr = `${examRow.he_bloodpressure}/${examRow.he_bloodpressurex}`;
                    } else if (conclRow?.hecl_bloodpressure) {
                        bpStr = String(conclRow.hecl_bloodpressure);
                    } else if (examRow?.he_bloodpressure) {
                        bpStr = String(examRow.he_bloodpressure);
                    }

                    const internalText = conclRow?.hecl_noi || [conclRow?.hecl_tuanhoan, conclRow?.hecl_hohap, conclRow?.hecl_tieuhoa, conclRow?.hecl_thantietnieu, conclRow?.hecl_noitiet, conclRow?.hecl_coxuongkhop, examRow?.he_examine, examRow?.he_parts].filter(Boolean).map((s: string) => s.trim()).join('\n');

                    // Phân loại sức khỏe từ conclusion table
                    let resolvedFitnessClass = '1';
                    if (conclRow?.hecl_phanloai) {
                        const m = String(conclRow.hecl_phanloai).match(/\d+/);
                        if (m) resolvedFitnessClass = m[0];
                    }

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
                        clinical_data: {
                            phone: hisRow.phone || '',
                            address: hisRow.address || '',
                            cccd_date: hisRow.cccd_date || '',
                            cccd_place: hisRow.cccd_place || '',
                            matinh_cu_tru: (hisRow.matinh_cu_tru && hisRow.matinh_cu_tru !== '0') ? String(hisRow.matinh_cu_tru) : '',
                            maxa_cu_tru: (hisRow.maxa_cu_tru && hisRow.maxa_cu_tru !== '0') ? String(hisRow.maxa_cu_tru) : '',
                            ethnic: hisRow.ethnic || 'Kinh',
                            ngay_vao: examRow?.exam_date || hisRow.ngay_vao || '',
                            gio_kham: examRow?.exam_time || '',
                            insurance_card: hisRow.insurance_card || '',
                            examination: {
                                height: conclRow?.hecl_height ? String(conclRow.hecl_height) : (examRow?.he_height ? String(examRow.he_height) : ''),
                                weight: conclRow?.hecl_weight ? String(conclRow.hecl_weight) : (examRow?.he_weight ? String(examRow.he_weight) : ''),
                                pulse: conclRow?.hecl_pulse ? String(conclRow.hecl_pulse) : (examRow?.he_pulse ? String(examRow.he_pulse) : ''),
                                blood_pressure: bpStr,
                                bp: bpStr,
                                temperature: conclRow?.hecl_temperature ? String(conclRow.hecl_temperature) : (examRow?.he_temperature ? String(examRow.he_temperature) : ''),
                                nhiet_do: conclRow?.hecl_temperature ? String(conclRow.hecl_temperature) : (examRow?.he_temperature ? String(examRow.he_temperature) : ''),
                                breathing_rate: conclRow?.hecl_breathinterval ? String(conclRow.hecl_breathinterval) : (examRow?.he_breathinterval ? String(examRow.he_breathinterval) : ''),
                                nhip_tho: conclRow?.hecl_breathinterval ? String(conclRow.hecl_breathinterval) : (examRow?.he_breathinterval ? String(examRow.he_breathinterval) : ''),
                                bmi: conclRow?.hecl_bmi ? Number(conclRow.hecl_bmi).toFixed(2) : (examRow?.he_bmi ? Number(examRow.he_bmi).toFixed(2) : ''),
                                physical_summary: conclRow?.hecl_theluc || ''
                            },
                            clinical_exam: {
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
                                gio_kham: examRow?.exam_time || '',
                                ngay_kham: examRow?.exam_date || hisRow.ngay_vao || '',
                                tsgd_mac_benh: histRow?.hdh_family ? '1' : '0',
                                tsgd_ma_benh: histRow?.hdh_family ? String(histRow.hdh_family).trim() : '',
                                ts_mac_benh: histRow?.hdh_owner ? '1' : '0',
                                tsbt_ma_benh: histRow?.hdh_owner ? String(histRow.hdh_owner).trim() : '',
                                tsbt_dang_dieu_tri_benh: (histRow?.hdh_owner || examRow?.he_medical) ? '1' : '0',
                                benh_dang_dieu_tri: (histRow?.hdh_owner || examRow?.he_medical) ? String(histRow?.hdh_owner || examRow?.he_medical).trim() : '',
                                di_ung_thuoc: histRow?.hdh_drugallergy ? String(histRow.hdh_drugallergy).trim() : '',
                                qua_trinh_benh_ly: examRow?.he_medical ? String(examRow.he_medical).trim() : '',
                                cac_benh_tat_neu_co: (histRow?.hdh_owner || examRow?.he_diagnostic) ? String(histRow?.hdh_owner || examRow?.he_diagnostic).trim() : '',
                                nhiet_do: conclRow?.hecl_temperature ? String(conclRow.hecl_temperature) : (examRow?.he_temperature ? String(examRow.he_temperature) : ''),
                                nhip_tho: conclRow?.hecl_breathinterval ? String(conclRow.hecl_breathinterval) : (examRow?.he_breathinterval ? String(examRow.he_breathinterval) : ''),
                                bmi: conclRow?.hecl_bmi ? Number(conclRow.hecl_bmi).toFixed(2) : (examRow?.he_bmi ? Number(examRow.he_bmi).toFixed(2) : ''),
                                doctor_name: examRow?.doctor_name || ''
                            }
                        },
                        lab_data: labData,
                        conclusion_data: {
                            fitness_class: resolvedFitnessClass,
                            diagnosis: conclRow?.hecl_conclusion || (examRow?.he_diagnostic ? String(examRow.he_diagnostic).trim() : (examRow?.he_icd10 || '')),
                            doctor_id: examRow?.he_doctor || '',
                            doctor_name: examRow?.doctor_name || '',
                            cac_van_de_luu_y: conclRow?.hecl_remark || (examRow?.he_medical ? String(examRow.he_medical).trim() : ''),
                            cac_benh_tat_neu_co: (histRow?.hdh_owner || examRow?.he_diagnostic) ? String(histRow?.hdh_owner || examRow?.he_diagnostic).trim() : ''
                        }
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

            const specialtyMetadata = clinicalData?.clinical_exam?.specialty_metadata || {};
            const conclusionDoctorId = specialtyMetadata.conclusion?.doctorId || conclusionData?.doctor_id || currentUserId || 'admin';

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
                        remarkAdvise, conclusionDoctorId, hisDocNo, examRow.he_receptidx
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
                        hecl_noi = COALESCE(NULLIF($2, ''), hecl_noi),
                        hecl_tuanhoan = COALESCE(NULLIF($3, ''), hecl_tuanhoan),
                        hecl_hohap = COALESCE(NULLIF($4, ''), hecl_hohap),
                        hecl_tieuhoa = COALESCE(NULLIF($5, ''), hecl_tieuhoa),
                        hecl_thantietnieu = COALESCE(NULLIF($6, ''), hecl_thantietnieu),
                        hecl_noitiet = COALESCE(NULLIF($7, ''), hecl_noitiet),
                        hecl_coxuongkhop = COALESCE(NULLIF($8, ''), hecl_coxuongkhop),
                        hecl_thankinh = COALESCE(NULLIF($9, ''), hecl_thankinh),
                        hecl_tamthan = COALESCE(NULLIF($10, ''), hecl_tamthan),
                        hecl_ngoai = COALESCE(NULLIF($11, ''), hecl_ngoai),
                        hecl_dalieu = COALESCE(NULLIF($12, ''), hecl_dalieu),
                        hecl_mat = COALESCE(NULLIF($13, ''), hecl_mat),
                        hecl_tmh = COALESCE(NULLIF($14, ''), hecl_tmh),
                        hecl_rhm = COALESCE(NULLIF($15, ''), hecl_rhm),
                        hecl_phukhoa = COALESCE(NULLIF($16, ''), hecl_phukhoa),
                        hecl_phanloai = COALESCE(NULLIF($17, ''), hecl_phanloai),
                        hecl_conclusion = COALESCE(NULLIF($18, ''), hecl_conclusion),
                        hecl_remark = COALESCE(NULLIF($19, ''), hecl_remark),
                        hecl_temperature = COALESCE($20, hecl_temperature),
                        hecl_pulse = COALESCE($21, hecl_pulse),
                        hecl_bloodpressure = COALESCE($22, hecl_bloodpressure),
                        hecl_bloodpressurex = COALESCE($23, hecl_bloodpressurex),
                        hecl_breathinterval = COALESCE($24, hecl_breathinterval),
                        hecl_weight = COALESCE($25, hecl_weight),
                        hecl_height = COALESCE($26, hecl_height),
                        hecl_bmi = COALESCE($27, hecl_bmi)
                    WHERE hecl_docno = $28
                `, [
                    examineGeneral,
                    ce.internal || '',
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
                    temperature,
                    pulse,
                    bpSystolic,
                    bpDiastolic,
                    breathingRate,
                    weight,
                    height,
                    bmi,
                    hisDocNo
                ]);
            } else {
                await client.query(`
                    INSERT INTO hms_exm_conclusion (
                        hecl_docno, hecl_theluc, hecl_noi, hecl_tuanhoan, hecl_hohap, hecl_tieuhoa,
                        hecl_thantietnieu, hecl_noitiet, hecl_coxuongkhop, hecl_thankinh, hecl_tamthan,
                        hecl_ngoai, hecl_dalieu, hecl_mat, hecl_tmh, hecl_rhm, hecl_phukhoa,
                        hecl_phanloai, hecl_conclusion, hecl_remark,
                        hecl_temperature, hecl_pulse, hecl_bloodpressure, hecl_bloodpressurex,
                        hecl_breathinterval, hecl_weight, hecl_height, hecl_bmi
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
                        $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28
                    )
                `, [
                    hisDocNo,
                    examineGeneral,
                    ce.internal || '',
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
                    temperature,
                    pulse,
                    bpSystolic,
                    bpDiastolic,
                    breathingRate,
                    weight,
                    height,
                    bmi
                ]);
            }

            console.log(`✅ [pushbackConclusion] Hoàn thành đồng bộ Lâm sàng, Sinh hiệu, Tiền sử, Kết luận và Chuyên khoa (hms_exm_conclusion) về HIS cho docNo=${hisDocNo}`);
        } catch (err) {
            console.error(`❌ [pushbackConclusion] Lỗi đồng bộ về HIS cho docNo ${hisDocNo}:`, err);
        }
    }
}

export const hisIntegrationController = new HisIntegrationController();
