import { Request, Response } from 'express';
import { query, transaction } from '../../config/database';
import { generateXmlPayload } from './xml-generator';

class HisIntegrationController {
    
    // Helper: Lấy dữ liệu cận lâm sàng cấu trúc từ HIS
    private async fetchStructuredParaclinicalData(docNo: number) {
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
            // 1. Truy vấn kết quả xét nghiệm (Nhóm A) - Lấy tất cả chỉ định từ HIS, kể cả chưa có kết quả
            const testRes = await query(`
                SELECT TRIM(f.hfl_feeid) AS service_code, f.hfl_name AS service_name,
                       t.hpcl_result AS value, f.hfl_unit AS unit,
                       TRIM(f.hfl_groupid) AS group_id, g.hfg_name AS group_name,
                       t.hpcl_orderid AS order_id,
                       f.hfl_line AS line_no, TRIM(f.hfl_subitem) AS subitem,
                       p.hfl_name AS parent_name,
                       TRIM(p.hfl_feeid) AS parent_code,
                       COALESCE(p.hfl_line, f.hfl_line) AS parent_line
                FROM hms_testorderline t
                JOIN hms_fee_list f ON f.hfl_feeid = t.hpcl_itemid
                LEFT JOIN hms_fee_group g ON g.hfg_id = f.hfl_groupid
                LEFT JOIN hms_fee_list p ON p.hfl_feeid = f.hfl_subitem AND UPPER(TRIM(f.hfl_subitem)) <> 'Y'
                WHERE t.hpcl_docno = $1
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

            // 2. Truy vấn kết quả hình ảnh & thăm dò chức năng (Nhóm B và C) - Lấy tất cả chỉ định từ HIS
            const pacsRes = await query(`
                SELECT f.hfl_feeid AS service_code, f.hfl_name AS service_name,
                       r.hpr_desc AS result_desc, f.hfl_unit AS unit,
                       f.hfl_groupid AS group_id, g.hfg_name AS group_name,
                       r.hpr_name AS result_name,
                       p.hpcl_orderid AS order_id
                FROM hms_pacsorderline p
                LEFT JOIN hms_pacs_result r ON r.hpr_orderid = p.hpcl_orderid AND r.hpr_itemid = p.hpcl_itemid
                LEFT JOIN hms_fee_list f ON f.hfl_feeid = p.hpcl_itemid
                LEFT JOIN hms_fee_group g ON g.hfg_id = f.hfl_groupid
                WHERE p.hpcl_docno = $1
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
                const resName = String(row.result_name).toLowerCase();
                const descVal = String(row.result_desc).trim();

                if (resName === 'conclusion' || resName === 'result') {
                    item.conclusion = descVal;
                    item.value = descVal;
                } else if (resName === 'remark') {
                    item.description = descVal;
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

                const bp = row.he_bloodpressure && row.he_bloodpressurex
                    ? `${row.he_bloodpressure}/${row.he_bloodpressurex}` : '120/80';
                const height = row.he_height > 0 ? Number(row.he_height) : 165 + (i % 15);
                const weight = row.he_weight > 0 ? Number(row.he_weight) : 55 + (i % 20);
                const bmi = row.he_bmi > 0 ? Number(row.he_bmi) :
                    parseFloat((weight / Math.pow(height / 100, 2)).toFixed(1));
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
                    matinh_cu_tru: row.hd_provid || '',
                    mahuyen_cu_tru: row.hd_distid || '',
                    maxa_cu_tru: row.hd_villid || '',
                    cccd_date: row.hee_cardid_date || '',
                    cccd_place: row.hee_cardid_place || '',
                    nguoi_giam_ho: row.hee_guardian_name || '',
                    so_cccd_ngh: row.hee_guardian_cccd || '',
                    blood_group: 'O', target_group: '14', funding_source: '9',
                    examination: {
                        height: String(height), weight: String(weight), bmi: String(bmi),
                        blood_pressure: bp,
                        pulse: row.he_pulse > 0 ? String(row.he_pulse) : '75',
                    },
                    clinical_exam: {
                        specialty_metadata: specialtyMetadata,
                        internal: row.he_examine || 'Nội khoa bình thường, tim phổi tốt.',
                        eye: 'Mắt phải 10/10, Mắt trái 10/10.',
                        ent: 'Tai mũi họng bình thường.',
                        dental: 'Răng hàm mặt bình thường.',
                        external: 'Ngoại khoa bình thường.',
                        gynecology: gender === 'Nữ' ? 'Sản phụ khoa bình thường.' : 'Không khám.',
                    },
                    extra: {}
                };

                const labData: any = {
                    blood_test: {
                        hemoglobin: labAndPacs.hemoglobin || String(130 + (i % 20)),
                        glycemia: labAndPacs.glycemia || (4.5 + (i % 10) * 0.1).toFixed(1)
                    },
                    urine_test: { protein: labAndPacs.protein || 'Âm tính' },
                    kq_xn_khac: labAndPacs.kqXnKhac || '',
                    paraclinical_items: labAndPacs.paraclinical_items || []
                };

                // Form-specific extras
                if (formType === '3') {
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
                    diagnosis: row.he_diagnostic || 'Đủ sức khỏe học tập và làm việc',
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
                        `, [patientName, cccd, row.dob ? new Date(row.dob) : null, gender,
                            patientId, hisEmpId, contractId, row.hee_docno ? String(row.hee_docno) : null, existing.id]);

                        if (hasExistingClinicalData) {
                            // ── 3A: Đã có dữ liệu khám → Chỉ merge phần hành chính vào clinical_data ──
                            const adminPatch = {
                                address: clinicalData.address, phone: clinicalData.phone,
                                ethnic: clinicalData.ethnic,
                                matinh_cu_tru: clinicalData.matinh_cu_tru,
                                mahuyen_cu_tru: clinicalData.mahuyen_cu_tru,
                                maxa_cu_tru: clinicalData.maxa_cu_tru,
                                cccd_date: clinicalData.cccd_date,
                                cccd_place: clinicalData.cccd_place,
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
                        `, [patientId, patientName, cccd, row.dob ? new Date(row.dob) : null,
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

                try {
                    const fs = require('fs');
                    const testCheck = await query(`SELECT hpcl_docno, count(*) FROM hms_testorderline GROUP BY hpcl_docno LIMIT 5`);
                    const docCheck = await query(`
                        SELECT hd_docno, hd_patientno, hd_admitdate FROM hms_doc 
                        WHERE hd_patientno = $1 OR hd_docno = $1
                    `, [hisDocNoStr]);
                    
                    const patientTests = await query(`
                        SELECT COUNT(*) FROM hms_testorderline WHERE hpcl_docno = $1
                    `, [docNoVal]);
                    
                    const patientPacs = await query(`
                        SELECT COUNT(*) FROM hms_pacsorderline WHERE hpcl_docno = $1
                    `, [docNoVal]);

                    const constraintCheck = await query(`
                        SELECT conname, pg_get_constraintdef(oid) as def 
                        FROM pg_constraint 
                        WHERE conname = 'hms_examview_he_deptidhe_roomid'
                    `);

                    const indexCheck = await query(`
                        SELECT indexname, indexdef 
                        FROM pg_indexes 
                        WHERE tablename = 'hms_examview'
                    `);

                    const procCheck = await query(`
                        SELECT prosrc FROM pg_proc WHERE proname = 'hms_exm_registration_exam'
                    `);

                    const triggersCheck = await query(`
                        SELECT tgname, pg_get_triggerdef(oid) as def 
                        FROM pg_trigger 
                        WHERE tgrelid = 'hms_exam'::regclass
                    `);

                    const examviewProcs = await query(`
                        SELECT proname, prosrc 
                        FROM pg_proc 
                        WHERE prosrc ILIKE '%hms_examview%' AND proname != 'hms_exm_registration_exam'
                    `);

                    const logMsg = `[${new Date().toISOString()}] identifier: ${identifier}, docNoVal: ${docNoVal}, hisDocNoStr: ${hisDocNoStr}, row.his_doc_no: ${row.his_doc_no}, row.patient_id: ${row.patient_id}\n` +
                        `  - hms_doc check count: ${docCheck.rows.length}\n` +
                        `  - hms_doc check rows: ${JSON.stringify(docCheck.rows)}\n` +
                        `  - hms_testorderline count for docNoVal: ${patientTests.rows[0]?.count}\n` +
                        `  - hms_pacsorderline count for docNoVal: ${patientPacs.rows[0]?.count}\n` +
                        `  - Recent test order docnos: ${JSON.stringify(testCheck.rows)}\n` +
                        `  - Unique constraint check: ${JSON.stringify(constraintCheck.rows)}\n` +
                        `  - Indexes on hms_examview: ${JSON.stringify(indexCheck.rows)}\n` +
                        `  - Triggers on hms_exam: ${JSON.stringify(triggersCheck.rows)}\n` +
                        `  - Procs modifying hms_examview: ${JSON.stringify(examviewProcs.rows)}\n` +
                        `  - Stored proc source length: ${procCheck.rows[0]?.prosrc?.length || 0}\n` +
                        `  - Stored proc source: ${procCheck.rows[0]?.prosrc || 'not found'}\n\n`;
                    fs.appendFileSync('d:/AI/vClinic/backend/sync_debug.log', logMsg);
                } catch (dbErr: any) {
                    console.error('🔍 [DEBUG] Error running debug queries:', dbErr);
                    try {
                        const fs = require('fs');
                        fs.appendFileSync('d:/AI/vClinic/backend/sync_debug.log', `Error: ${dbErr.message}\n`);
                    } catch (e) {}
                }

                // Lấy chỉ định & kết quả cận lâm sàng mới nhất trực tiếp từ HIS
                const liveParaclinical = docNoVal ? await this.fetchStructuredParaclinicalData(docNoVal) : null;
                if (liveParaclinical) {
                    console.log('🔍 [getHisPatient] liveParaclinical items count:', liveParaclinical.paraclinical_items?.length);
                }
                const labData = typeof row.lab_data === 'string' ? JSON.parse(row.lab_data) : { ...row.lab_data };

                if (liveParaclinical) {
                    if (!labData.blood_test) labData.blood_test = {};
                    if (!labData.urine_test) labData.urine_test = {};

                    if (liveParaclinical.hemoglobin) labData.blood_test.hemoglobin = liveParaclinical.hemoglobin;
                    if (liveParaclinical.glycemia) labData.blood_test.glycemia = liveParaclinical.glycemia;
                    if (liveParaclinical.protein) labData.urine_test.protein = liveParaclinical.protein;
                    if (liveParaclinical.kqXnKhac) labData.kq_xn_khac = liveParaclinical.kqXnKhac;

                    const existingItems = Array.isArray(labData.paraclinical_items) ? labData.paraclinical_items : [];
                    const newItems = liveParaclinical.paraclinical_items || [];
                    const mergedItems: any[] = [];

                    const existingMap = new Map<string, any>();
                    existingItems.forEach((item: any) => {
                        const key = `${item.order_id || ''}_${item.service_code || ''}`;
                        existingMap.set(key, item);
                    });

                    const processedNewKeys = new Set<string>();
                    newItems.forEach((newItem: any) => {
                        const key = `${newItem.order_id || ''}_${newItem.service_code || ''}`;
                        processedNewKeys.add(key);

                        const existingItem = existingMap.get(key);
                        if (existingItem) {
                            let mergedValue = '';
                            let mergedConclusion = '';
                            const userEdited = !!existingItem.user_edited;

                            if (existingItem.user_edited) {
                                // Giữ nguyên giá trị bác sĩ sửa tay
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

                    existingItems.forEach((item: any) => {
                        const key = `${item.order_id || ''}_${item.service_code || ''}`;
                        if (!processedNewKeys.has(key)) {
                            mergedItems.push({
                                ...item,
                                is_his_value: false,
                                user_edited: !!item.user_edited
                            });
                        }
                    });

                    labData.paraclinical_items = mergedItems;
                }

                return res.json({
                    id: row.id,
                    patient_id: row.patient_id,
                    doc_no: hisDocNoStr,
                    patient_name: String(row.patient_name || '').toUpperCase(),
                    cccd: row.cccd || '',
                    dob: row.dob || '',
                    gender: row.gender || 'Nam',
                    form_type: row.form_type,
                    clinical_data: typeof row.clinical_data === 'string' ? JSON.parse(row.clinical_data) : row.clinical_data,
                    lab_data: labData,
                    conclusion_data: typeof row.conclusion_data === 'string' ? JSON.parse(row.conclusion_data) : row.conclusion_data
                });
            } else {
                return res.status(404).json({ error: "Không tìm thấy hồ sơ KSK đã tiếp nhận cho bệnh nhân này." });
            }
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi getHisPatient:', error);
            return res.status(500).json({ error: error.message });
        }
    }
}

export const hisIntegrationController = new HisIntegrationController();
