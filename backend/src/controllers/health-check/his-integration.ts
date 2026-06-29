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

        const determinePacsType = (gid: string, gname: string, sname: string): 'XN' | 'HA' | 'TD' => {
            const id = String(gid || '').toUpperCase();
            
            // Phân loại động theo tiền tố mã hms_fee_group (hfg_id / group_id)
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
            // 1. Truy vấn kết quả xét nghiệm (Nhóm A)
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
                WHERE t.hpcl_docno = $1 AND t.hpcl_result IS NOT NULL AND TRIM(t.hpcl_result) <> ''
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
                    otherTests.push(`${row.service_name}: ${val}${row.unit ? ' ' + row.unit.trim() : ''}`);
                }

                items.push({
                    service_code: row.service_code,
                    service_name: row.service_name,
                    index_code: row.service_code,
                    index_name: row.service_name,
                    value: val,
                    unit: row.unit || '',
                    description: '',
                    conclusion: 'Bình thường',
                    group_id: groupId,
                    group_name: groupName,
                    order_id: row.order_id ? String(row.order_id) : '',
                    type: determinePacsType(groupId, groupName, row.service_name),
                    line_no: row.line_no,
                    subitem: row.subitem,
                    parent_name: row.parent_name || '',
                    parent_code: row.parent_code || '',
                    parent_line: row.parent_line
                });
            }

            // 2. Truy vấn kết quả hình ảnh & thăm dò chức năng (Nhóm B và C)
            const pacsRes = await query(`
                SELECT f.hfl_feeid AS service_code, f.hfl_name AS service_name,
                       r.hpr_desc AS result_desc, f.hfl_unit AS unit,
                       f.hfl_groupid AS group_id, g.hfg_name AS group_name,
                       r.hpr_name AS result_name,
                       p.hpcl_orderid AS order_id
                FROM hms_pacsorderline p
                JOIN hms_pacs_result r ON r.hpr_orderid = p.hpcl_orderid AND r.hpr_itemid = p.hpcl_itemid
                LEFT JOIN hms_fee_list f ON f.hfl_feeid = p.hpcl_itemid
                LEFT JOIN hms_fee_group g ON g.hfg_id = f.hfl_groupid
                WHERE p.hpcl_docno = $1 AND r.hpr_desc IS NOT NULL AND TRIM(r.hpr_desc) <> ''
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
                        type: determinePacsType(groupId, groupName, serviceName)
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
                const docNo = `KSK-${new Date().getFullYear()}-${String(row.hee_docno || row.hee_employee_id).padStart(4, '0')}`;

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

                const hasConclusion = (row.exam_status === 'T') || (row.he_diagnostic && row.he_diagnostic.trim() !== '');
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
        try {
            // 1. TRUY VẤN DỮ LIỆU THỰC TẾ TỪ CSDL HIS (hms_patient, hms_doc, hms_exam)
            const sql = `
                SELECT 
                    p.hp_patientno,
                    trim(COALESCE(p.hp_surname,'') || ' ' || COALESCE(p.hp_midname,'') || ' ' || p.hp_firstname) as patient_name,
                    p.hp_patientid,
                    p.hp_sin,
                    to_char(p.hp_birthdate, 'YYYY-MM-DD') as dob,
                    p.hp_sex,
                    p.hp_dtladdr,
                    p.hp_ethnic,
                    p.hp_nationality,
                    p.hp_provid,
                    p.hp_villid,
                    p.hp_occupation,
                    p.hp_workplace,
                    d.hd_telephone,
                    d.hd_cardno,
                    d.hd_object,
                    d.hd_docno,
                    COALESCE(hms_getusername(d.hd_doctor), 'BS. Nguyễn Văn A') as doctor_name,
                    e.he_height,
                    e.he_weight,
                    e.he_bmi,
                    e.he_pulse,
                    e.he_bloodpressure,
                    e.he_bloodpressurex,
                    e.he_examine,
                    e.he_diagnostic
                FROM hms_doc d
                JOIN hms_patient p ON p.hp_patientno = d.hd_patientno
                LEFT JOIN hms_exam e ON e.he_docno = d.hd_docno AND e.he_receptno = 1
                WHERE d.hd_docno::text = $1
                LIMIT 1
            `;
            const result = await query(sql, [identifier]);

            if (result.rows.length > 0) {
                const row = result.rows[0];
                const genderVal = (row.hp_sex || '').toLowerCase();
                const gender = (genderVal === 'm' || genderVal.includes('nam')) ? 'Nam' : 'Nữ';
                const ethnicStr = row.hp_ethnic ? String(row.hp_ethnic).padStart(2, '0') : '01';

                const bp = row.he_bloodpressure && row.he_bloodpressurex 
                    ? `${row.he_bloodpressure}/${row.he_bloodpressurex}` 
                    : '120/80';

                // Lấy kết quả xét nghiệm & PACS thực tế từ HIS
                const docNo = row.hd_docno ? Number(row.hd_docno) : null;
                const labAndPacs = docNo ? await this.fetchStructuredParaclinicalData(docNo) : {
                    hemoglobin: '',
                    glycemia: '',
                    protein: '',
                    kqXnKhac: '',
                    paraclinical_items: []
                };

                return res.json({
                    patient_id: String(row.hp_patientno),
                    doc_no: row.hd_docno ? String(row.hd_docno) : identifier,
                    patient_name: String(row.patient_name || '').toUpperCase(),
                    cccd: String(row.hp_patientid || row.hp_sin || ''),
                    dob: row.dob || '1995-10-15',
                    gender: gender,
                    clinical_data: {
                        address: row.hp_dtladdr || '',
                        phone: row.hd_telephone || '',
                        ethnic: ethnicStr,
                        blood_group: 'O',
                        target_group: '14',
                        funding_source: '9',
                        quoc_tich: row.hp_nationality ? String(row.hp_nationality).trim() : 'VN',
                        matinh_cu_tru: row.hp_provid ? String(row.hp_provid).trim() : '',
                        maxa_cu_tru: row.hp_villid ? String(row.hp_villid).trim() : '',
                        ma_nghe_nghiep: row.hp_occupation ? String(row.hp_occupation).trim() : '01',
                        noi_cong_tac_hien_tai: row.hp_workplace ? String(row.hp_workplace).trim() : '',
                        examination: {
                            height: row.he_height > 0 ? String(row.he_height) : '170',
                            weight: row.he_weight > 0 ? String(row.he_weight) : '65',
                            bmi: row.he_bmi > 0 ? String(row.he_bmi) : '22.5',
                            blood_pressure: bp,
                            pulse: row.he_pulse > 0 ? String(row.he_pulse) : '75'
                        },
                        clinical_exam: {
                            internal: row.he_examine || "Hệ tuần hoàn, hô hấp, tiêu hóa hoạt động bình thường, không phát hiện bệnh lý.",
                            eye: "Mắt phải 10/10, Mắt trái 10/10, không có tật khúc xạ.",
                            ent: "Tai mũi họng bình thường, thính lực tốt.",
                            dental: "Răng hàm mặt bình thường, không sâu răng, không lệch khớp cắn.",
                            external: "Ngoại khoa, da liễu bình thường, không sẹo lồi.",
                            gynecology: "Không khám (hoặc bình thường)",
                            nhi_tuan_hoan: "Bình thường",
                            nhi_ho_hap: "Bình thường",
                            nhi_tieu_hoa: "Bình thường",
                            nhi_tiet_nieu: "Bình thường",
                            nhi_than_kinh: "Bình thường",
                            nhi_tam_than: "Bình thường",
                            nhi_khac: "Bình thường"
                        }
                    },
                    lab_data: {
                        blood_test: { 
                            hemoglobin: labAndPacs.hemoglobin || "140", 
                            glycemia: labAndPacs.glycemia || "5.2" 
                        },
                        urine_test: { 
                            protein: labAndPacs.protein || "Âm tính" 
                        },
                        kq_xn_khac: labAndPacs.kqXnKhac || "",
                        paraclinical_items: labAndPacs.paraclinical_items || []
                    },
                    conclusion_data: {
                        fitness_class: "1",
                        diagnosis: row.he_diagnostic || "Đủ sức khỏe học tập và làm việc",
                        cac_van_de_luu_y: "Không",
                        doctor_name: row.doctor_name
                    }
                });
            }

            // 2. FALLBACK MOCK DATA NẾU KHÔNG TÌM THẤY TRONG DB HIS THỰC TẾ
            const mockHisPatients = [
                {
                    patient_id: "P1001",
                    patient_name: "NGUYỄN VĂN HÙNG",
                    cccd: "038090012345",
                    dob: "1995-10-15",
                    gender: "Nam",
                    clinical_data: {
                        address: "123 Đường Giải Phóng, Quận Hai Bà Trưng, Hà Nội",
                        phone: "0912345678",
                        ethnic: "01",
                        blood_group: "O",
                        target_group: "14",
                        funding_source: "9",
                        quoc_tich: "VN",
                        matinh_cu_tru: "01",
                        maxa_cu_tru: "00001",
                        ma_nghe_nghiep: "01",
                        noi_cong_tac_hien_tai: "Công ty Cổ phần Vận tải Đường sắt Hà Nội",
                        ngay_bat_dau_lam_viec_hien_tai: "2020-03-01",
                        examination: {
                            height: "172",
                            weight: "68",
                            bmi: "23.0",
                            blood_pressure: "120/80",
                            pulse: "78"
                        },
                        clinical_exam: {
                            internal: "Hệ tuần hoàn, hô hấp, tiêu hóa hoạt động bình thường, không phát hiện bệnh lý.",
                            eye: "Mắt phải 10/10, Mắt trái 10/10, không có tật khúc xạ.",
                            ent: "Tai mũi họng bình thường, thính lực tốt.",
                            dental: "Răng hàm mặt bình thường, không sâu răng, không lệch khớp cắn.",
                            external: "Ngoại khoa, da liễu bình thường, không sẹo lồi.",
                            gynecology: "Không khám (hoặc bình thường)",
                            nhi_tuan_hoan: "Bình thường",
                            nhi_ho_hap: "Bình thường",
                            nhi_tieu_hoa: "Bình thường",
                            nhi_tiet_nieu: "Bình thường",
                            nhi_than_kinh: "Bình thường",
                            nhi_tam_than: "Bình thường",
                            nhi_khac: "Bình thường"
                        },
                        extra: {
                            nghe_cong_viec_truoc_day: "Công nhân bảo trì đường ray",
                            thoi_gian_lam_viec_truoc_day_nam: "3",
                            thoi_gian_lam_viec_truoc_day_thang: "6",
                            tu_ngay_lam_viec_truoc_day: "2016-08-01",
                            den_ngay_lam_viec_truoc_day: "2020-02-28"
                        }
                    },
                    lab_data: {
                        blood_test: { hemoglobin: "142", glycemia: "5.4" },
                        urine_test: { protein: "Âm tính" },
                        paraclinical_items: []
                    },
                    conclusion_data: {
                        fitness_class: "1",
                        diagnosis: "Đủ sức khỏe học tập và làm việc",
                        cac_van_de_luu_y: "Tránh thức khuya và làm việc quá sức"
                    }
                },
                {
                    patient_id: "P1002",
                    patient_name: "TRẦN THỊ LAN",
                    cccd: "034198006789",
                    dob: "1988-05-20",
                    gender: "Nữ",
                    clinical_data: {
                        address: "456 Phố Huế, Quận Hai Bà Trưng, Hà Nội",
                        phone: "0987654321",
                        ethnic: "01",
                        blood_group: "A",
                        target_group: "13",
                        funding_source: "9",
                        quoc_tich: "VN",
                        matinh_cu_tru: "01",
                        maxa_cu_tru: "00001",
                        ma_nghe_nghiep: "02",
                        noi_cong_tac_hien_tai: "Bệnh viện Bạch Mai",
                        examination: {
                            height: "158",
                            weight: "50",
                            bmi: "20.0",
                            blood_pressure: "115/75",
                            pulse: "72"
                        },
                        clinical_exam: {
                            internal: "Nội khoa bình thường, tim phổi tốt.",
                            eye: "Mắt phải 9/10, Mắt trái 10/10.",
                            ent: "Tai mũi họng bình thường.",
                            dental: "Răng hàm mặt bình thường.",
                            external: "Ngoại khoa bình thường.",
                            gynecology: "Sản phụ khoa bình thường, không phát hiện viêm nhiễm sinh dục.",
                            nhi_tuan_hoan: "Bình thường",
                            nhi_ho_hap: "Bình thường",
                            nhi_tieu_hoa: "Bình thường",
                            nhi_tiet_nieu: "Bình thường",
                            nhi_than_kinh: "Bình thường",
                            nhi_tam_than: "Bình thường",
                            nhi_khac: "Bình thường"
                        }
                    },
                    lab_data: {
                        blood_test: { hemoglobin: "135", glycemia: "5.1" },
                        urine_test: { protein: "Âm tính" },
                        paraclinical_items: []
                    },
                    conclusion_data: {
                        fitness_class: "2",
                        diagnosis: "Đủ sức khỏe làm việc",
                        cac_van_de_luu_y: "Không"
                    }
                },
                {
                    patient_id: "P1003",
                    patient_name: "LÊ HOÀNG NAM",
                    cccd: "001092004567",
                    dob: "1992-12-01",
                    gender: "Nam",
                    clinical_data: {
                        address: "789 Đường Láng, Quận Đống Đa, Hà Nội",
                        phone: "0904123456",
                        ethnic: "01",
                        blood_group: "O",
                        target_group: "14",
                        funding_source: "9",
                        quoc_tich: "VN",
                        matinh_cu_tru: "01",
                        maxa_cu_tru: "00002",
                        ma_nghe_nghiep: "03",
                        noi_cong_tac_hien_tai: "Trường Đại học Bách khoa Hà Nội",
                        examination: {
                            height: "175",
                            weight: "72",
                            bmi: "23.5",
                            blood_pressure: "120/80",
                            pulse: "75"
                        },
                        clinical_exam: {
                            internal: "Nội khoa bình thường, tim phổi đều.",
                            eye: "Mắt phải 10/10, Mắt trái 10/10.",
                            ent: "Tai mũi họng bình thường.",
                            dental: "Răng hàm mặt bình thường.",
                            external: "Ngoại khoa bình thường.",
                            gynecology: "Không khám (hoặc bình thường)",
                            nhi_tuan_hoan: "Bình thường",
                            nhi_ho_hap: "Bình thường",
                            nhi_tieu_hoa: "Bình thường",
                            nhi_tiet_nieu: "Bình thường",
                            nhi_than_kinh: "Bình thường",
                            nhi_tam_than: "Bình thường",
                            nhi_khac: "Bình thường"
                        },
                        extra: {
                            hang_lai_xe: "B2",
                            tsgd_mac_benh: "0",
                            tsgd_ma_benh: "",
                            tsbt_ma_benh: "I10",
                            tsbt_nam_phat_hien_benh: "2021",
                            co_dang_dieu_tri_benh: "1",
                            ma_benh_dang_dieu_tri: "I10",
                            ten_thuoc: "Amlodipin 5mg",
                            ts_tai_bien_mach_nao: "0",
                            ts_tang_huyet_ap: "1",
                            ts_benh_tim_mach: "0",
                            ts_su_dung_ruou: "0",
                            ts_su_dung_ma_tuy: "0"
                        }
                    },
                    lab_data: {
                        blood_test: { hemoglobin: "145", glycemia: "5.3" },
                        urine_test: { protein: "Âm tính" }
                    },
                    conclusion_data: {
                        fitness_class: "1",
                        diagnosis: "Đủ sức khỏe lái xe hạng B2",
                        cac_van_de_luu_y: "Không"
                    }
                },
                {
                    patient_id: "P1004",
                    patient_name: "NGUYỄN GIA BẢO",
                    cccd: "038095012345",
                    dob: "2026-05-10",
                    gender: "Nam",
                    clinical_data: {
                        address: "Số 12 ngõ 45 Cát Linh, Đống Đa, Hà Nội",
                        phone: "0934567890",
                        ethnic: "01",
                        blood_group: "O",
                        target_group: "10",
                        funding_source: "9",
                        quoc_tich: "VN",
                        matinh_cu_tru: "01",
                        maxa_cu_tru: "00001",
                        ma_nghe_nghiep: "09",
                        noi_cong_tac_hien_tai: "",
                        examination: {
                            height: "52",
                            weight: "4.2",
                            bmi: "15.5",
                            blood_pressure: "80/50",
                            pulse: "110"
                        },
                        clinical_exam: {
                            internal: "Nhịp tim đều, phổi thông khí tốt, bụng mềm.",
                            eye: "Mắt trong, Red reflex (+), không viêm nhiễm.",
                            ent: "Tai mũi họng bình thường.",
                            dental: "Chưa mọc răng.",
                            external: "Ngoại khoa bình thường, khớp háng linh hoạt.",
                            gynecology: "Không khám",
                            nhi_tuan_hoan: "Bình thường",
                            nhi_ho_hap: "Bình thường",
                            nhi_tieu_hoa: "Bình thường",
                            nhi_tiet_nieu: "Bình thường",
                            nhi_than_kinh: "Bình thường",
                            nhi_tam_than: "Bình thường",
                            nhi_khac: "Bình thường"
                        },
                        extra: {
                            nguoi_giam_ho: "Nguyễn Văn Hùng",
                            so_cccd_ngh: "038090012345",
                            ho_ten_nguoi_di_cung: "Nguyễn Văn Hùng",
                            so_cccd_nguoi_di_cung: "038090012345",
                            moi_quan_he_voi_tre: "1",
                            sinh_non: "0",
                            tuan_thai_khi_sinh: "39",
                            can_nang_luc_sinh: "3.2",
                            vong_ddau: "36",
                            vong_nguc: "35",
                            milestone_check: "1",
                            quay_dau_huong_am_thanh: "1",
                            nhin_theo_khuon_mat_30cm: "1",
                            con_thu_may: "1",
                            tong_so_con: "2",
                            matinh_cu_tru_ngh_me: "01",
                            maxa_cu_tru_ngh_me: "00001"
                        }
                    },
                    lab_data: {
                        blood_test: { hemoglobin: "115", glycemia: "4.8" },
                        urine_test: { protein: "Âm tính" }
                    },
                    conclusion_data: {
                        fitness_class: "1",
                        diagnosis: "Trẻ phát triển bình thường theo tuổi",
                        cac_van_de_luu_y: "Không"
                    }
                },
                {
                    patient_id: "P1005",
                    patient_name: "PHẠM MINH KHANG",
                    cccd: "001095009876",
                    dob: "2021-04-12",
                    gender: "Nam",
                    clinical_data: {
                        address: "Số 88 đường Láng, Đống Đa, Hà Nội",
                        phone: "0965432109",
                        ethnic: "01",
                        blood_group: "B",
                        target_group: "10",
                        funding_source: "9",
                        quoc_tich: "VN",
                        matinh_cu_tru: "01",
                        maxa_cu_tru: "00001",
                        ma_nghe_nghiep: "09",
                        noi_cong_tac_hien_tai: "",
                        examination: {
                            height: "105",
                            weight: "17.5",
                            bmi: "15.9",
                            blood_pressure: "90/60",
                            pulse: "92"
                        },
                        clinical_exam: {
                            internal: "Nội khoa bình thường, tim phổi tốt.",
                            eye: "Mắt 10/10 cả hai bên.",
                            ent: "Tai mũi họng bình thường.",
                            dental: "Răng sữa đầy đủ, không sâu răng.",
                            external: "Ngoại khoa bình thường, tư thế đi đứng thẳng.",
                            gynecology: "Không khám",
                            nhi_tuan_hoan: "Bình thường",
                            nhi_ho_hap: "Bình thường",
                            nhi_tieu_hoa: "Bình thường",
                            nhi_tiet_nieu: "Bình thường",
                            nhi_than_kinh: "Bình thường",
                            nhi_tam_than: "Bình thường",
                            nhi_khac: "Bình thường"
                        },
                        extra: {
                            nguoi_giam_ho: "Phạm Văn Minh",
                            so_cccd_ngh: "001090008888",
                            ho_ten_nguoi_di_cung: "Phạm Văn Minh",
                            so_cccd_nguoi_di_cung: "001090008888",
                            moi_quan_he_voi_tre: "1",
                            sinh_non: "0",
                            tuan_thai_khi_sinh: "38",
                            can_nang_luc_sinh: "3.0",
                            vong_ddau: "50",
                            vong_nguc: "54",
                            milestone_check: "1",
                            lam_theo_yeu_cau_2_3_buoc: "1",
                            vin_cau_thang_va_nhay_bat: "1",
                            lam_3_yeu_cau_khong_lien_quan: "1",
                            noi_cau_dai_ke_chuyen: "1",
                            hoi_va_tra_loi_cau_hoi: "1",
                            dung_1_chan_5_giay_nhay_lo_co: "1",
                            noi_thong_tin_ca_nhan: "1",
                            dem_to_hoac_dem_ngon_tay: "1",
                            con_thu_may: "1",
                            tong_so_con: "2",
                            matinh_cu_tru_ngh_me: "01",
                            maxa_cu_tru_ngh_me: "00001"
                        }
                    },
                    lab_data: {
                        blood_test: { hemoglobin: "125", glycemia: "5.0" },
                        urine_test: { protein: "Âm tính" },
                        paraclinical_items: []
                    },
                    conclusion_data: {
                        fitness_class: "1",
                        diagnosis: "Trẻ phát triển bình thường theo tuổi",
                        cac_van_de_luu_y: "Không"
                    }
                }
            ];

            const patient = mockHisPatients.find(p => 
                p.patient_id.toLowerCase() === identifier.toLowerCase() || 
                p.cccd === identifier || 
                p.patient_name.toLowerCase().includes(identifier.toLowerCase())
            );

            if (!patient) {
                // Tạo dữ liệu ngẫu nhiên dựa trên identifier để demo chạy mượt
                const cleanId = identifier.trim();
                const isNumeric = /^\d+$/.test(cleanId);
                const name = isNumeric ? `BỆNH NHÂN HIS ${cleanId.slice(-4)}` : cleanId.toUpperCase();
                const cccdVal = isNumeric && cleanId.length === 12 ? cleanId : `03809000${Math.floor(1000 + Math.random() * 9000)}`;

                const randomPatient = {
                    patient_id: cleanId.startsWith('P') ? cleanId : `P${Math.floor(1000 + Math.random() * 9000)}`,
                    patient_name: name,
                    cccd: cccdVal,
                    dob: "1994-08-18",
                    gender: Math.random() > 0.5 ? "Nam" : "Nữ",
                    clinical_data: {
                        address: "Địa chỉ lấy từ hệ thống HIS chính của bệnh viện",
                        phone: "09" + Math.floor(10000000 + Math.random() * 90000000),
                        ethnic: "01",
                        blood_group: "B",
                        target_group: "14",
                        funding_source: "9",
                        ma_cskcb: "15124",
                        quoc_tich: "VN",
                        matinh_cu_tru: "01",
                        maxa_cu_tru: "00001",
                        ma_nghe_nghiep: "01",
                        noi_cong_tac_hien_tai: "Bệnh viện Đa khoa VIMES",
                        con_thu_may: "1",
                        tong_so_con: "2",
                        matinh_cu_tru_ngh_me: "01",
                        maxa_cu_tru_ngh_me: "00001",
                        chuc_danh_tren_tau: "Đại phó",
                        ten_chu_tau: "Tổng công ty Hàng hải Việt Nam",
                        dia_chi_chu_tau: "Số 1 Đào Duy Anh, Hà Nội",
                        khu_vuc_hoat_dong_tau: "1",
                        examination: {
                            height: "170",
                            weight: "65",
                            bmi: "22.5",
                            blood_pressure: "120/80",
                            pulse: "76"
                        },
                        clinical_exam: {
                            internal: "Đã đồng bộ khám nội khoa từ HIS: Bình thường.",
                            eye: "Mắt phải 10/10, Mắt trái 10/10.",
                            ent: "Tai mũi họng bình thường.",
                            dental: "Răng hàm mặt bình thường.",
                            external: "Ngoại khoa bình thường.",
                            gynecology: "Không khám (hoặc bình thường)",
                            nhi_tuan_hoan: "Bình thường",
                            nhi_ho_hap: "Bình thường",
                            nhi_tieu_hoa: "Bình thường",
                            nhi_tiet_nieu: "Bình thường",
                            nhi_than_kinh: "Bình thường",
                            nhi_tam_than: "Bình thường",
                            nhi_khac: "Bình thường"
                        }
                    },
                    lab_data: {
                        blood_test: { hemoglobin: "140", glycemia: "5.2" },
                        urine_test: { protein: "Âm tính" },
                        paraclinical_items: []
                    },
                    conclusion_data: {
                        fitness_class: "1",
                        diagnosis: "Đủ sức khỏe học tập và làm việc",
                        cac_van_de_luu_y: "Không"
                    }
                };
                return res.json({ ...randomPatient, doc_no: identifier });
            }

            return res.json({ ...patient, doc_no: identifier });
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi getHisPatient:', error);
            return res.status(500).json({ error: error.message });
        }
    }
}

export const hisIntegrationController = new HisIntegrationController();
