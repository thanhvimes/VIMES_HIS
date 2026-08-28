import { Request, Response } from 'express';
import { query, transaction } from '../../config/database';
import { generateXmlPayload } from './xml-generator';
import { hisIntegrationController } from './his-integration';
import { mergeClinicalData, mergeLabData, mergeConclusionData, formatYmdString } from '../../services/health-check-merge.service';

export interface SyncDocResult {
    docNo: number | string;
    patientName?: string;
    patientId?: number | string;
    cccd?: string;
    dob?: string;
    formType?: string;
    action: 'created' | 'updated' | 'skipped' | 'failed';
    success: boolean;
    message?: string;
}

class BatchSyncController {

    // Helper: Đồng bộ 1 hồ sơ từ HIS sang KSK VNeID
    public async syncSingleDocFromHis(
        docNoVal: number,
        currentUserId: string = 'admin',
        currentUserName: string = 'Administrator',
        overwrite: boolean = true
    ): Promise<SyncDocResult> {
        try {
            // 1. Lấy thông tin hành chính từ HIS (hms_doc JOIN hms_patient)
            const hisResult = await query(`
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
                    c.hc_cardno as insurance_card
                FROM hms_doc d
                JOIN hms_patient p ON d.hd_patientno = p.hp_patientno
                LEFT JOIN hms_card c ON (c.hc_patientno = p.hp_patientno AND c.hc_idx = d.hd_cardidx)
                WHERE d.hd_docno = $1
                ORDER BY d.hd_docno DESC
                LIMIT 1
            `, [docNoVal]);

            if (hisResult.rows.length === 0) {
                return {
                    docNo: docNoVal,
                    action: 'failed',
                    success: false,
                    message: `Không tìm thấy số hồ sơ ${docNoVal} trên hệ thống HIS (hms_doc/hms_patient)`
                };
            }

            const hisRow = hisResult.rows[0];
            const patientNoVal = hisRow.patient_id ? parseInt(hisRow.patient_id, 10) : 0;
            const patientName = String(hisRow.patient_name || '').toUpperCase().trim();
            const year = new Date().getFullYear();
            const kskDocNo = `KSK-${year}-${docNoVal}`;

            // 2. Lấy thông tin sinh hiệu & khám lâm sàng chi tiết từ hms_exam
            let examRow: any = null;
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
                console.error(`⚠️ [batchSyncHis] Lỗi truy vấn hms_exam cho ${docNoVal}:`, examErr);
            }

            // 3. Lấy dữ liệu kết luận & chi tiết chuyên khoa từ hms_exm_conclusion
            let conclRow: any = null;
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
                console.error(`⚠️ [batchSyncHis] Lỗi truy vấn hms_exm_conclusion cho ${docNoVal}:`, conclErr);
            }

            // 4. Lấy tiền sử bệnh tật & dị ứng từ hms_disease_hist
            let histRow: any = null;
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
                console.error(`⚠️ [batchSyncHis] Lỗi truy vấn hms_disease_hist cho ${docNoVal}:`, histErr);
            }

            // 5. Lấy kết quả CLS mới nhất từ HIS cho đợt khám này
            const liveParaclinical = await hisIntegrationController.fetchStructuredParaclinicalData(docNoVal);
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

            // 6. Tự động xác định loại biểu mẫu theo tuổi (Mẫu 1: < 6 tuổi, Mẫu 2: 6-18 tuổi, Mẫu 3: >= 18 tuổi)
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

            // 7. Format Huyết áp & Dữ liệu thể lực
            let bpStr = '';
            if (examRow?.he_bloodpressure && examRow?.he_bloodpressurex) {
                bpStr = `${examRow.he_bloodpressure}/${examRow.he_bloodpressurex}`;
            } else if (examRow?.he_bloodpressure) {
                bpStr = String(examRow.he_bloodpressure);
            }

            const internalText = [conclRow?.hecl_tuanhoan, conclRow?.hecl_hohap, conclRow?.hecl_tieuhoa, conclRow?.hecl_thantietnieu, conclRow?.hecl_noitiet, conclRow?.hecl_coxuongkhop, examRow?.he_examine, examRow?.he_parts].filter(Boolean).map((s: string) => s.trim()).join('\n');

            let resolvedFitnessClass = '1';
            if (conclRow?.hecl_phanloai) {
                const m = String(conclRow.hecl_phanloai).match(/\d+/);
                if (m) resolvedFitnessClass = m[0];
            }

            // 8. Đóng gói Clinical Data
            const clinicalData: any = {
                phone: hisRow.phone || '',
                address: hisRow.address || '',
                cccd_date: hisRow.cccd_date || '',
                cccd_place: hisRow.cccd_place || '',
                matinh_cu_tru: (hisRow.matinh_cu_tru && hisRow.matinh_cu_tru !== '0') ? String(hisRow.matinh_cu_tru) : '',
                maxa_cu_tru: (hisRow.maxa_cu_tru && hisRow.maxa_cu_tru !== '0') ? String(hisRow.maxa_cu_tru) : '',
                ethnic: hisRow.ethnic || 'Kinh',
                ma_nghe_nghiep: hisRow.occupation ? String(hisRow.occupation).trim() : '',
                occupation: hisRow.occupation ? String(hisRow.occupation).trim() : '',
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
                    temperature: examRow?.he_temperature ? String(examRow.he_temperature) : '',
                    nhiet_do: examRow?.he_temperature ? String(examRow.he_temperature) : '',
                    breathing_rate: examRow?.he_breathinterval ? String(examRow.he_breathinterval) : '',
                    nhip_tho: examRow?.he_breathinterval ? String(examRow.he_breathinterval) : '',
                    bmi: examRow?.he_bmi ? Number(examRow.he_bmi).toFixed(2) : '',
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
                    ma_nghe_nghiep: hisRow.occupation ? String(hisRow.occupation).trim() : '',
                    occupation: hisRow.occupation ? String(hisRow.occupation).trim() : '',
                    noi_cong_tac_hien_tai: hisRow.workplace || '',
                    noi_cong_tac: hisRow.workplace || '',
                    workplace: hisRow.workplace || '',
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
            };

            // 9. Đóng gói Conclusion Data
            const conclusionData: any = {
                fitness_class: resolvedFitnessClass,
                diagnosis: conclRow?.hecl_conclusion || (examRow?.he_diagnostic ? String(examRow.he_diagnostic).trim() : (examRow?.he_icd10 || '')),
                doctor_id: examRow?.he_doctor || '',
                doctor_name: examRow?.doctor_name || '',
                cac_van_de_luu_y: conclRow?.hecl_remark || (examRow?.he_medical ? String(examRow.he_medical).trim() : ''),
                cac_benh_tat_neu_co: (histRow?.hdh_owner || examRow?.he_diagnostic) ? String(histRow?.hdh_owner || examRow?.he_diagnostic).trim() : ''
            };

            // 10. Sinh XML Payload chuẩn 1551/2062
            const xmlData = generateXmlPayload(
                resolvedFormType,
                { patientName, cccd: hisRow.cccd, dob: hisRow.dob, gender: hisRow.gender, docNo: kskDocNo },
                clinicalData,
                labData,
                conclusionData
            );

            // 11. Ghi vào CSDL (UPSERT Transaction)
            const syncAction = await transaction(async (client) => {
                const existingRes = await client.query(
                    `SELECT id, signature_status, send_status 
                     FROM health_check_masters 
                     WHERE his_doc_no = $1 OR doc_no = $2 OR doc_no = $3 
                     FOR UPDATE`,
                    [docNoVal, String(docNoVal), kskDocNo]
                );

                if (existingRes.rows.length > 0) {
                    const existing = existingRes.rows[0];
                    if (existing.signature_status === 'Signed' || existing.send_status === 'Success') {
                        return { action: 'skipped', message: 'Hồ sơ đã ký số hoặc đã gửi liên thông, giữ nguyên.' };
                    }

                    if (!overwrite) {
                        return { action: 'skipped', message: 'Hồ sơ đã tồn tại và tùy chọn không ghi đè.' };
                    }

                    const masterId = existing.id;

                    // Deep merge nếu có dữ liệu cũ
                    const detailRes = await client.query(
                        'SELECT clinical_data, lab_data, conclusion_data FROM health_check_details WHERE master_id = $1 FOR UPDATE',
                        [masterId]
                    );

                    let finalClinical = clinicalData;
                    let finalLab = labData;
                    let finalConclusion = conclusionData;

                    if (detailRes.rows.length > 0) {
                        const existingDetail = detailRes.rows[0];
                        const oldClinical = typeof existingDetail.clinical_data === 'string'
                            ? JSON.parse(existingDetail.clinical_data) : (existingDetail.clinical_data || {});
                        const oldLab = typeof existingDetail.lab_data === 'string'
                            ? JSON.parse(existingDetail.lab_data) : (existingDetail.lab_data || {});
                        const oldConclusion = typeof existingDetail.conclusion_data === 'string'
                            ? JSON.parse(existingDetail.conclusion_data) : (existingDetail.conclusion_data || {});

                        finalClinical = mergeClinicalData(oldClinical, clinicalData);
                        finalLab = mergeLabData(oldLab, labData);
                        finalConclusion = mergeConclusionData(oldConclusion, conclusionData);
                    }

                    const updatedXml = generateXmlPayload(
                        resolvedFormType,
                        { patientName, cccd: hisRow.cccd, dob: hisRow.dob, gender: hisRow.gender, docNo: kskDocNo },
                        finalClinical,
                        finalLab,
                        finalConclusion
                    );

                    await client.query(`
                        UPDATE health_check_masters
                        SET 
                            patient_id = $1,
                            patient_name = $2,
                            cccd = $3,
                            dob = $4,
                            gender = $5,
                            form_type = $6,
                            his_doc_no = $7,
                            xml_data = $8,
                            updated_at = NOW(),
                            created_by = COALESCE(created_by, $9),
                            created_by_name = COALESCE(created_by_name, $10)
                        WHERE id = $11
                    `, [
                        patientNoVal || null,
                        patientName,
                        hisRow.cccd || '',
                        formatYmdString(hisRow.dob),
                        hisRow.gender || 'Nam',
                        resolvedFormType,
                        docNoVal,
                        updatedXml,
                        currentUserId,
                        currentUserName,
                        masterId
                    ]);

                    await client.query(`
                        UPDATE health_check_details
                        SET 
                            clinical_data = $1,
                            lab_data = $2,
                            conclusion_data = $3,
                            updated_at = NOW()
                        WHERE master_id = $4
                    `, [
                        JSON.stringify(finalClinical),
                        JSON.stringify(finalLab),
                        JSON.stringify(finalConclusion),
                        masterId
                    ]);

                    return { action: 'updated', message: 'Cập nhật thành công từ HIS' };
                } else {
                    // Tạo mới
                    const insertMasterSql = `
                        INSERT INTO health_check_masters (
                            doc_no, patient_id, patient_name, cccd, dob, gender,
                            form_type, his_doc_no, xml_data, signature_status,
                            send_status, created_by, created_by_name, created_at, updated_at
                        ) VALUES (
                            $1, $2, $3, $4, $5, $6, $7, $8, $9, 'Unsigned', 'Unsent', $10, $11, NOW(), NOW()
                        ) RETURNING id
                    `;
                    const masterRes = await client.query(insertMasterSql, [
                        kskDocNo,
                        patientNoVal || null,
                        patientName,
                        hisRow.cccd || '',
                        formatYmdString(hisRow.dob),
                        hisRow.gender || 'Nam',
                        resolvedFormType,
                        docNoVal,
                        xmlData,
                        currentUserId,
                        currentUserName
                    ]);

                    const newMasterId = masterRes.rows[0].id;

                    await client.query(`
                        INSERT INTO health_check_details (
                            master_id, clinical_data, lab_data, conclusion_data, created_at, updated_at
                        ) VALUES ($1, $2, $3, $4, NOW(), NOW())
                    `, [
                        newMasterId,
                        JSON.stringify(clinicalData),
                        JSON.stringify(labData),
                        JSON.stringify(conclusionData)
                    ]);

                    return { action: 'created', message: 'Tạo mới thành công từ HIS' };
                }
            });

            return {
                docNo: docNoVal,
                patientName,
                patientId: patientNoVal,
                cccd: hisRow.cccd,
                dob: hisRow.dob,
                formType: resolvedFormType,
                action: syncAction.action as any,
                success: true,
                message: syncAction.message
            };
        } catch (err: any) {
            console.error(`❌ [syncSingleDocFromHis] Lỗi đồng bộ hồ sơ ${docNoVal}:`, err);
            return {
                docNo: docNoVal,
                action: 'failed',
                success: false,
                message: err.message || 'Lỗi không xác định khi đồng bộ từ HIS'
            };
        }
    }

    // API: Đồng bộ hàng loạt từ HIS qua danh sách số hồ sơ
    async batchSyncHis(req: Request, res: Response) {
        try {
            const { docNos, overwrite = true } = req.body;
            const currentUserId = (req as any).user?.username || (req as any).userId || 'admin';
            let currentUserName = (req as any).user?.fullName || (req as any).user?.name || 'Administrator';

            if (!Array.isArray(docNos) || docNos.length === 0) {
                return res.status(400).json({ error: 'Danh sách số hồ sơ (docNos) trống hoặc không hợp lệ.' });
            }

            // Chuẩn hóa danh sách số hồ sơ (lọc trùng, chuyển thành số nguyên)
            const cleanDocNos: number[] = [];
            const seen = new Set<number>();

            for (const item of docNos) {
                const str = String(item || '').trim();
                const num = parseInt(str, 10);
                if (!isNaN(num) && num > 0 && !seen.has(num)) {
                    seen.add(num);
                    cleanDocNos.push(num);
                }
            }

            if (cleanDocNos.length === 0) {
                return res.status(400).json({ error: 'Không tìm thấy số hồ sơ hợp lệ nào để đồng bộ.' });
            }

            console.log(`🚀 [batchSyncHis] Bắt đầu đồng bộ ${cleanDocNos.length} hồ sơ từ HIS (User: ${currentUserId})...`);

            const results: SyncDocResult[] = [];
            let successCount = 0;
            let updatedCount = 0;
            let createdCount = 0;
            let skippedCount = 0;
            let failedCount = 0;

            for (const docNo of cleanDocNos) {
                const resItem = await this.syncSingleDocFromHis(
                    docNo,
                    currentUserId,
                    currentUserName,
                    overwrite
                );

                results.push(resItem);
                if (resItem.success) {
                    successCount++;
                    if (resItem.action === 'created') createdCount++;
                    else if (resItem.action === 'updated') updatedCount++;
                    else if (resItem.action === 'skipped') skippedCount++;
                } else {
                    failedCount++;
                }
            }

            console.log(`✅ [batchSyncHis] Hoàn tất đồng bộ: Tổng ${cleanDocNos.length}, Tạo mới ${createdCount}, Cập nhật ${updatedCount}, Bỏ qua ${skippedCount}, Thất bại ${failedCount}`);

            return res.json({
                success: true,
                total: cleanDocNos.length,
                successCount,
                createdCount,
                updatedCount,
                skippedCount,
                failedCount,
                results
            });
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi batchSyncHis:', error);
            return res.status(500).json({ error: error.message });
        }
    }
}

export const batchSyncController = new BatchSyncController();
