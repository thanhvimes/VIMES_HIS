// ==================== STATISTICS SERVICE ====================
// File: backend/src/services/statistics.service.ts

import { query } from '../config/database';

export class StatisticsService {
    /**
     * 1. Thống kê Hoạt động bệnh viện tổng thể (Đồng bộ theo Báo cáo C6 Khám bệnh & PTTT Nội trú)
     */
    static async getHospitalActivity(fromDate: string, toDate: string) {
        // Query Khám bệnh (Khớp Báo cáo C6 - EMrptExamRoomActivitiesReportDialog)
        const examSql = `
            SELECT 
                COUNT(DISTINCT he_docno) FILTER (WHERE he_status <> 'O') AS tong_so,
                COUNT(DISTINCT he_docno) FILTER (WHERE ho_type IN ('I', 'C') AND he_status <> 'O') AS so_bhyt,
                COUNT(DISTINCT he_docno) FILTER (WHERE (ho_type = 'S' OR (ho_type NOT IN ('I', 'C') AND ho_type IS NOT NULL)) AND he_status <> 'O') AS so_dichvu,
                COUNT(DISTINCT he_docno) FILTER (WHERE hd_suggestion IN ('A', 'I') AND hd_status = 'T') AS nhap_vien,
                COUNT(DISTINCT he_docno) FILTER (WHERE hd_suggestion = 'T' AND hd_status = 'T') AS chuyen_vien
            FROM hms_exam
            JOIN hms_doc ON (hd_docno = he_docno)
            JOIN hms_patient ON (hp_patientno = hd_patientno)
            LEFT JOIN hms_object ON (ho_id = hd_object)
            WHERE he_examdate BETWEEN $1::timestamp AND $2::timestamp
              AND hd_admitdept = 'KB'
              AND he_roomid IS NOT NULL
        `;

        // Query Nội trú (Đồng bộ Điểm a, Điểm e, Điểm h, Điểm g của Báo cáo Biến động Nội trú Section IV & TMTinhhinhthudung)
        const inpatientSql = `
            SELECT 
                -- Vào viện: Đồng bộ theo Báo cáo Điều trị nội trú (bệnh nhân thực tế tiếp nhận vào buồng bệnh khoa nội trú)
                (
                    SELECT COUNT(DISTINCT htr_docno) 
                    FROM hms_treatment_record 
                    WHERE htr_admitdate BETWEEN $1::timestamp AND $2::timestamp
                      AND (htr_outpatient <> 'Y' OR htr_outpatient IS NULL)
                      AND htr_idx = 1
                      AND htr_status <> 'A'
                ) AS vao_vien,
                -- Điểm e tại IV: Tổng bệnh nhân ra viện (loại trừ chuyển tuyến T, chuyển khoa M và tử vong 5, 6)
                COUNT(DISTINCT CASE 
                    WHEN htr_status = 'T' AND htr_dischargedate BETWEEN $1::timestamp AND $2::timestamp 
                         AND htr_suggestion NOT IN ('M', 'F', 'T') AND (hcr_result NOT IN ('5', '6') OR hcr_result IS NULL)
                         AND (htr_outpatient <> 'Y' OR htr_outpatient IS NULL)
                    THEN htr_docno 
                END) AS ra_vien,
                -- Điểm h tại IV: Tổng bệnh nhân tử vong tại viện
                COUNT(DISTINCT CASE 
                    WHEN htr_status = 'T' AND htr_dischargedate BETWEEN $1::timestamp AND $2::timestamp 
                         AND hcr_result IN ('5', '6')
                         AND (htr_outpatient <> 'Y' OR htr_outpatient IS NULL)
                    THEN htr_docno 
                END) AS tu_vong,
                -- Điểm a tại IV: Tổng bệnh nhân hiện diện đang nằm điều trị
                COUNT(DISTINCT CASE 
                    WHEN htr_status = 'I' AND htr_admitdate <= $2::timestamp
                         AND (htr_outpatient <> 'Y' OR htr_outpatient IS NULL)
                    THEN htr_docno 
                END) AS dang_dieu_tri,
                -- Điểm g tại IV: Tổng bệnh nhân chuyển tuyến trên từ nội trú (htr_suggestion = 'T', không lấy chuyển khoa 'M')
                COUNT(DISTINCT CASE 
                    WHEN htr_status = 'T' AND htr_dischargedate BETWEEN $1::timestamp AND $2::timestamp 
                         AND htr_suggestion = 'T'
                         AND (htr_outpatient <> 'Y' OR htr_outpatient IS NULL)
                    THEN htr_docno 
                END) AS chuyen_vien_noi_tru
            FROM hms_treatment_record
            LEFT JOIN hms_clinical_record ON (hcr_docno = htr_docno)
            WHERE (htr_admitdate BETWEEN $1::timestamp AND $2::timestamp 
               OR (htr_status = 'T' AND htr_dischargedate BETWEEN $1::timestamp AND $2::timestamp)
               OR htr_status = 'I')
        `;

        // Query Cận lâm sàng tổng hợp (Khớp phân nhóm PACS & LIMS mục 1 nhóm A, loại bỏ B4, B5)
        const clsSql = `
            SELECT 
                CASE 
                    WHEN SUBSTR(f.hfe_group, 1, 2) = 'B1' THEN 'XET_NGHIEM'
                    WHEN f.hfe_group IN ('B2100', 'B2200', 'B2300', 'B2400', 'B2500', 'B2000') THEN 'CDHA'
                    WHEN f.hfe_group IN ('B2600', 'B2700', 'B2800', 'B3000', 'B3100', 'B3200', 'B3300', 'B3400', 'B3900') THEN 'TDCN'
                    ELSE 'CLS_KHAC'
                END AS cls_group,
                COUNT(DISTINCT inv.hfe_docno) AS so_benh_nhan,
                COUNT(1) AS so_chi_dinh
            FROM hms_fee_invoice inv
            JOIN hms_fee f ON (f.hfe_invoiceno = inv.hfe_invoiceno)
            WHERE inv.hfe_date BETWEEN $1::timestamp AND $2::timestamp
              AND SUBSTR(f.hfe_group, 1, 2) IN ('B1', 'B2', 'B3') -- Loại bỏ hoàn toàn B4, B5
              AND inv.hfe_status = 'P'
            GROUP BY 
                CASE 
                    WHEN SUBSTR(f.hfe_group, 1, 2) = 'B1' THEN 'XET_NGHIEM'
                    WHEN f.hfe_group IN ('B2100', 'B2200', 'B2300', 'B2400', 'B2500', 'B2000') THEN 'CDHA'
                    WHEN f.hfe_group IN ('B2600', 'B2700', 'B2800', 'B3000', 'B3100', 'B3200', 'B3300', 'B3400', 'B3900') THEN 'TDCN'
                    ELSE 'CLS_KHAC'
                END
        `;

        // Query Phẫu thuật / Thủ thuật (Khớp Báo cáo TMOperationPatientListReport & TMThongKePTTT)
        const ptttSql = `
            SELECT 
                CASE 
                    WHEN SUBSTR(hfl_groupid, 1, 2) = 'B4' THEN 'PHAU_THUAT' 
                    ELSE 'THU_THUAT' 
                END AS pttt_type,
                COUNT(DISTINCT ho_docno) AS so_benh_nhan,
                COUNT(1) AS tong_so_ca
            FROM hms_operation
            JOIN hms_fee_list ON (hfl_feeid = ho_itemid)
            WHERE (hfl_report <> 'N' OR hfl_report IS NULL)
              AND ho_orderdate BETWEEN $1::timestamp AND $2::timestamp
              AND ho_status <> 'O'
              AND SUBSTR(hfl_groupid, 1, 2) IN ('B4', 'B5')
            GROUP BY 
                CASE 
                    WHEN SUBSTR(hfl_groupid, 1, 2) = 'B4' THEN 'PHAU_THUAT' 
                    ELSE 'THU_THUAT' 
                END
        `;

        const [examRes, inpatientRes, clsRes, ptttRes] = await Promise.all([
            query(examSql, [fromDate, toDate]).catch(() => ({ rows: [] })),
            query(inpatientSql, [fromDate, toDate]).catch(() => ({ rows: [] })),
            query(clsSql, [fromDate, toDate]).catch(() => ({ rows: [] })),
            query(ptttSql, [fromDate, toDate]).catch(() => ({ rows: [] }))
        ]);

        return {
            examination: examRes.rows[0] || { tong_so: 0, so_bhyt: 0, so_dichvu: 0, nhap_vien: 0, chuyen_vien: 0 },
            inpatient: inpatientRes.rows[0] || { vao_vien: 0, ra_vien: 0, tu_vong: 0, dang_dieu_tri: 0, chuyen_vien_noi_tru: 0 },
            paraclinical: clsRes.rows,
            surgery: ptttRes.rows
        };
    }

    /**
     * 2. Thống kê theo Phòng khám (Khớp Báo cáo nhóm 6 mục C module khám bệnh - C6)
     */
    static async getClinicsStatistics(fromDate: string, toDate: string) {
        const sql = `
            WITH exam_agg AS (
                SELECT 
                    he_deptid,
                    he_roomid,
                    COUNT(DISTINCT he_docno) FILTER (WHERE he_status <> 'O') AS tong_luot_kham,
                    COUNT(DISTINCT he_docno) FILTER (WHERE ho_type IN ('I', 'C') AND he_status <> 'O') AS so_bhyt,
                    COUNT(DISTINCT he_docno) FILTER (WHERE (ho_type = 'S' OR (ho_type NOT IN ('I', 'C') AND ho_type IS NOT NULL)) AND he_status <> 'O') AS so_dichvu,
                    COUNT(DISTINCT he_docno) FILTER (WHERE hd_suggestion IN ('A', 'I') AND hd_status = 'T') AS nhap_vien,
                    COUNT(DISTINCT he_docno) FILTER (WHERE hd_suggestion = 'T' AND hd_status = 'T') AS chuyen_vien,
                    COUNT(DISTINCT he_docno) FILTER (WHERE hd_suggestion = 'D' AND hd_status = 'T') AS cho_ve,
                    COUNT(DISTINCT he_docno) FILTER (WHERE he_status = 'P') AS dang_kham
                FROM hms_exam
                JOIN hms_doc ON (hd_docno = he_docno)
                JOIN hms_patient ON (hp_patientno = hd_patientno)
                LEFT JOIN hms_object ON (ho_id = hd_object)
                WHERE he_examdate BETWEEN $1::timestamp AND $2::timestamp
                  AND hd_admitdept = 'KB'
                  AND he_roomid IS NOT NULL
                GROUP BY he_deptid, he_roomid
            )
            SELECT 
                hrl_id AS room_id,
                hrl_name AS room_name,
                hrl_deptid AS dept_id,
                COALESCE(ea.tong_luot_kham, 0) AS tong_luot_kham,
                COALESCE(ea.so_bhyt, 0) AS so_bhyt,
                COALESCE(ea.so_dichvu, 0) AS so_dichvu,
                COALESCE(ea.nhap_vien, 0) AS nhap_vien,
                COALESCE(ea.chuyen_vien, 0) AS chuyen_vien,
                COALESCE(ea.cho_ve, 0) AS cho_ve,
                COALESCE(ea.dang_kham, 0) AS dang_kham
            FROM hms_roomlist
            LEFT JOIN exam_agg ea ON (ea.he_roomid = hrl_id AND (ea.he_deptid = hrl_deptid OR ea.he_deptid IS NULL))
            WHERE (hrl_deptid = 'KB' OR hrl_type IN (0, 1, 2, 8))
              AND hrl_active = 'Y'
            ORDER BY hrl_deptid, hrl_id
        `;
        const res = await query(sql, [fromDate, toDate]);
        return res.rows;
    }

    /**
     * 3. Biến động bệnh nhân Điều trị nội trú (Khớp chuẩn MFC TMTinhhinhthudung - Section IV)
     */
    static async getInpatientStatistics(fromDate: string, toDate: string) {
        const sql = `
            WITH dept_stats AS (
                SELECT 
                    sd.sd_id AS dept_id,
                    sd.sd_name AS dept_name,
                    -- Cũ (Đầu kỳ): htr_admitdate < FromDate AND (htr_status = 'I' OR (htr_status = 'T' AND htr_dischargedate >= FromDate))
                    COALESCE(SUM(CASE 
                        WHEN htr.htr_admitdate < $1::timestamp 
                             AND (htr.htr_status = 'I' OR (htr.htr_status = 'T' AND htr.htr_dischargedate >= $1::timestamp))
                             AND (htr.htr_outpatient <> 'Y' OR htr.htr_outpatient IS NULL)
                        THEN 1 ELSE 0 END), 0) AS dau_ky,
                    -- Vào viện: hcr_admitdept = htr_deptid (hoặc htr_idx = 1) AND htr_status <> 'A'
                    COALESCE(SUM(CASE 
                        WHEN (hcr.hcr_admitdept = htr.htr_deptid OR htr.htr_idx = 1)
                             AND htr.htr_status <> 'A'
                             AND (htr.htr_outpatient <> 'Y' OR htr.htr_outpatient IS NULL)
                             AND htr.htr_admitdate BETWEEN $1::timestamp AND $2::timestamp 
                        THEN 1 ELSE 0 END), 0) AS vao_vien,
                    -- Chuyển khoa đến: htr_idx > 1 AND htr_status <> 'A'
                    COALESCE(SUM(CASE 
                        WHEN htr.htr_idx > 1 
                             AND (hcr.hcr_admitdept <> htr.htr_deptid OR hcr.hcr_admitdept IS NULL)
                             AND htr.htr_status <> 'A'
                             AND (htr.htr_outpatient <> 'Y' OR htr.htr_outpatient IS NULL)
                             AND htr.htr_admitdate BETWEEN $1::timestamp AND $2::timestamp 
                        THEN 1 ELSE 0 END), 0) AS chuyen_den,
                    -- Chuyển khoa đi: htr_status = 'T' AND htr_suggestion = 'M'
                    COALESCE(SUM(CASE 
                        WHEN htr.htr_status = 'T' 
                             AND htr.htr_suggestion = 'M' 
                             AND (htr.htr_outpatient <> 'Y' OR htr.htr_outpatient IS NULL)
                             AND htr.htr_dischargedate BETWEEN $1::timestamp AND $2::timestamp 
                        THEN 1 ELSE 0 END), 0) AS chuyen_di,
                    -- Ra viện: htr_status = 'T' AND htr_suggestion NOT IN ('M', 'F') AND (hcr.hcr_result NOT IN ('5', '6') OR hcr.hcr_result IS NULL)
                    COALESCE(SUM(CASE 
                        WHEN htr.htr_status = 'T' 
                             AND htr.htr_suggestion NOT IN ('M', 'F') 
                             AND (hcr.hcr_result NOT IN ('5', '6') OR hcr.hcr_result IS NULL)
                             AND (htr.htr_outpatient <> 'Y' OR htr.htr_outpatient IS NULL)
                             AND htr.htr_dischargedate BETWEEN $1::timestamp AND $2::timestamp 
                        THEN 1 ELSE 0 END), 0) AS ra_vien,
                    -- Tử vong: htr_status = 'T' AND hcr_result IN ('5', '6')
                    COALESCE(SUM(CASE 
                        WHEN htr.htr_status = 'T' 
                             AND hcr.hcr_result IN ('5', '6')
                             AND (htr.htr_outpatient <> 'Y' OR htr.htr_outpatient IS NULL)
                             AND htr.htr_dischargedate BETWEEN $1::timestamp AND $2::timestamp 
                        THEN 1 ELSE 0 END), 0) AS tu_vong
                FROM sys_dept sd
                LEFT JOIN hms_treatment_record htr ON (htr.htr_deptid = sd.sd_id)
                LEFT JOIN hms_clinical_record hcr ON (hcr.hcr_docno = htr.htr_docno AND hcr.hcr_refidx = htr.htr_idx)
                WHERE sd.sd_type = 'DT' AND (COALESCE(sd.sd_active, 'Y') = 'Y')
                GROUP BY sd.sd_id, sd.sd_name
            )
            SELECT 
                dept_id,
                dept_name,
                dau_ky,
                vao_vien,
                chuyen_den,
                chuyen_di,
                ra_vien,
                tu_vong,
                -- Chặn hoàn toàn số âm theo yêu cầu nghiêm cấm số âm trên báo cáo
                GREATEST(0, (dau_ky + vao_vien + chuyen_den - chuyen_di - ra_vien - tu_vong)) AS hien_dien
            FROM dept_stats
            WHERE (dau_ky > 0 OR vao_vien > 0 OR chuyen_den > 0 OR chuyen_di > 0 OR ra_vien > 0 OR tu_vong > 0)
            ORDER BY vao_vien DESC, dept_id ASC
        `;
        const res = await query(sql, [fromDate, toDate]);
        return res.rows;
    }

    /**
     * 4. Thống kê Cận lâm sàng (Bỏ phẫu thuật B4, thủ thuật B5; Chuẩn hóa Ca BHYT và CT- Scanner)
     */
    static async getParaclinicalStatistics(fromDate: string, toDate: string, deptId?: string) {
        let whereClause = `inv.hfe_date BETWEEN $1::timestamp AND $2::timestamp 
          AND SUBSTR(f.hfe_group, 1, 2) IN ('B1', 'B2', 'B3') 
          AND inv.hfe_status = 'P'`;
        const params: any[] = [fromDate, toDate];

        if (deptId) {
            params.push(deptId);
            whereClause += ` AND f.hfe_deptid = $${params.length}`;
        }

        const sql = `
            SELECT 
                COALESCE(f.hfe_group, 'B0000') AS group_id,
                CASE 
                    WHEN f.hfe_group = 'B2200' OR g.hfg_name ILIKE '%32 dãy%' OR g.hfg_name ILIKE '%city-scan%' THEN 'CT- Scanner'
                    ELSE COALESCE(g.hfg_name, 'Cận lâm sàng')
                END AS group_name,
                COUNT(DISTINCT inv.hfe_docno) AS tong_so_bn,
                COUNT(1) AS tong_so_ca,
                -- Sửa chính xác Ca BHYT: dựa trên đối tượng viện phí BHYT hoặc số tiền thanh toán BHYT > 0
                SUM(CASE WHEN f.hfe_object IN (4, 6, 13, 14) OR ho.ho_type IN ('I', 'C') OR f.hfe_inspaid > 0 OR f.hfe_discount > 0 THEN 1 ELSE 0 END) AS ca_bhyt,
                SUM(CASE WHEN (f.hfe_object NOT IN (4, 6, 13, 14) OR f.hfe_object IS NULL) AND (ho.ho_type NOT IN ('I', 'C') OR ho.ho_type IS NULL) AND f.hfe_inspaid = 0 AND f.hfe_discount = 0 THEN 1 ELSE 0 END) AS ca_dichvu,
                COALESCE(SUM(f.hfe_cost), 0) AS tong_thanh_tien
            FROM hms_fee_invoice inv
            JOIN hms_fee f ON (f.hfe_invoiceno = inv.hfe_invoiceno)
            LEFT JOIN hms_fee_group g ON (g.hfg_id = f.hfe_group)
            LEFT JOIN hms_object ho ON (ho.ho_id = f.hfe_object)
            WHERE ${whereClause}
            GROUP BY f.hfe_group, 2
            ORDER BY f.hfe_group
        `;
        const res = await query(sql, params);
        return res.rows;
    }

    /**
     * 5. Phẫu thuật - Thủ thuật theo Phân loại (Khớp chuẩn MFC TMOperationPatientListReport & TMThongKePTTT)
     */
    static async getSurgeryStatistics(fromDate: string, toDate: string) {
        const sql = `
            SELECT 
                COALESCE(ho_pdeptid, ho_deptid) AS dept_id,
                COALESCE(sd.sd_name, COALESCE(ho_pdeptid, ho_deptid), 'Khác') AS dept_name,
                COUNT(DISTINCT ho_docno) AS tong_benh_nhan,
                COUNT(1) AS tong_so_ca,
                SUM(CASE WHEN hfl_groupid LIKE 'B44%' OR hfl_name ILIKE '%đặc biệt%' THEN 1 ELSE 0 END) AS loai_dac_biet,
                SUM(CASE WHEN (hfl_groupid LIKE 'B41%' OR hfl_groupid = 'B4002' OR hfl_name ILIKE '%loại 1%' OR hfl_name ILIKE '%loại I%') AND hfl_groupid NOT LIKE 'B44%' AND hfl_name NOT ILIKE '%đặc biệt%' THEN 1 ELSE 0 END) AS loai_1,
                SUM(CASE WHEN hfl_groupid LIKE 'B42%' OR hfl_groupid = 'B4003' OR hfl_name ILIKE '%loại 2%' OR hfl_name ILIKE '%loại II%' THEN 1 ELSE 0 END) AS loai_2,
                SUM(CASE WHEN hfl_groupid LIKE 'B43%' OR hfl_groupid = 'B4004' OR hfl_name ILIKE '%loại 3%' OR hfl_name ILIKE '%loại III%' THEN 1 ELSE 0 END) AS loai_3,
                SUM(CASE WHEN SUBSTR(hfl_groupid, 1, 2) = 'B5' OR SUBSTR(hfl_groupid, 1, 2) <> 'B4' THEN 1 ELSE 0 END) AS thu_thuat
            FROM hms_operation
            JOIN hms_fee_list ON (hfl_feeid = ho_itemid)
            LEFT JOIN sys_dept sd ON (sd.sd_id = COALESCE(ho_pdeptid, ho_deptid))
            WHERE (hfl_report <> 'N' OR hfl_report IS NULL)
              AND ho_orderdate BETWEEN $1::timestamp AND $2::timestamp
              AND ho_status <> 'O'
              AND SUBSTR(hfl_groupid, 1, 2) IN ('B4', 'B5')
            GROUP BY COALESCE(ho_pdeptid, ho_deptid), sd.sd_name
            ORDER BY tong_so_ca DESC, dept_id ASC
        `;
        const res = await query(sql, [fromDate, toDate]);
        return res.rows;
    }

    /**
     * 6. Tổng hợp chi phí theo Khoa phòng (Khớp chuẩn MFC HFDetailedlistofpatientcostinpatienttreatment & HFGeneralTreatmentServiceCostReport)
     */
    static async getDepartmentCostStatistics(fromDate: string, toDate: string) {
        const sql = `
            SELECT 
                f.hfe_deptid AS dept_id,
                COALESCE(sd.sd_name, f.hfe_deptid, 'Khác') AS dept_name,
                COUNT(DISTINCT inv.hfe_docno) AS tong_luot_bn,
                COALESCE(SUM(CASE WHEN SUBSTR(f.hfe_group, 1, 1) = 'D' THEN f.hfe_cost ELSE 0 END), 0) AS tien_kham,
                COALESCE(SUM(CASE WHEN SUBSTR(f.hfe_group, 1, 1) = 'C' THEN f.hfe_cost ELSE 0 END), 0) AS tien_giuong,
                COALESCE(SUM(CASE WHEN SUBSTR(f.hfe_group, 1, 2) = 'B1' THEN f.hfe_cost ELSE 0 END), 0) AS tien_xet_nghiem,
                COALESCE(SUM(CASE WHEN SUBSTR(f.hfe_group, 1, 2) = 'B2' THEN f.hfe_cost ELSE 0 END), 0) AS tien_cdha,
                COALESCE(SUM(CASE WHEN SUBSTR(f.hfe_group, 1, 2) = 'B3' THEN f.hfe_cost ELSE 0 END), 0) AS tien_tdcn,
                COALESCE(SUM(CASE WHEN SUBSTR(f.hfe_group, 1, 2) IN ('B4', 'B5') THEN f.hfe_cost ELSE 0 END), 0) AS tien_pttt,
                COALESCE(SUM(CASE WHEN SUBSTR(f.hfe_group, 1, 1) = 'A' AND SUBSTR(f.hfe_group, 1, 2) NOT IN ('A2', 'A4', 'A9') THEN f.hfe_cost ELSE 0 END), 0) AS tien_thuoc,
                COALESCE(SUM(CASE WHEN SUBSTR(f.hfe_group, 1, 2) IN ('A2', 'A4') THEN f.hfe_cost ELSE 0 END), 0) AS tien_mau,
                COALESCE(SUM(CASE WHEN SUBSTR(f.hfe_group, 1, 2) = 'A9' THEN f.hfe_cost ELSE 0 END), 0) AS tien_vtyt,
                COALESCE(SUM(CASE WHEN SUBSTR(f.hfe_group, 1, 1) = 'F' THEN f.hfe_cost ELSE 0 END), 0) AS tien_khac,
                COALESCE(SUM(f.hfe_cost), 0) AS tong_cong_chi_phi,
                COALESCE(SUM(f.hfe_discount), 0) AS bhyt_thanh_toan,
                COALESCE(SUM(f.hfe_cost - f.hfe_discount), 0) AS benh_nhan_tra
            FROM hms_fee_invoice inv
            JOIN hms_fee f ON (f.hfe_invoiceno = inv.hfe_invoiceno)
            LEFT JOIN sys_dept sd ON (sd.sd_id = f.hfe_deptid)
            WHERE inv.hfe_date BETWEEN $1::timestamp AND $2::timestamp
              AND inv.hfe_status = 'P'
            GROUP BY f.hfe_deptid, sd.sd_name
            ORDER BY tong_cong_chi_phi DESC, f.hfe_deptid ASC
        `;
        const res = await query(sql, [fromDate, toDate]);
        return res.rows;
    }

    /**
     * 7. Công suất sử dụng Giường bệnh (Khớp chuẩn QĐ 49/QĐ-BVĐKT Lai Châu 562 giường & Tách cột BN nội/ngoại trú)
     */
    static async getBedOccupancyStatistics() {
        const sql = `
            SELECT 
                sd.sd_id AS dept_id,
                sd.sd_name AS dept_name,
                -- Ưu tiên giường kế hoạch theo Quyết định 49/QĐ-BVĐKT trong sys_dept, fallback hms_bedlist
                COALESCE(NULLIF(sd.sd_planned_bed, 0), b.giuong_ke_hoach, 0) AS giuong_ke_hoach,
                COALESCE(t.bn_noi_tru_bhyt, 0) AS bn_noi_tru_bhyt,
                COALESCE(t.bn_noi_tru_vienphi, 0) AS bn_noi_tru_vienphi,
                COALESCE(t.bn_ngoai_tru, 0) AS bn_ngoai_tru,
                COALESCE(t.bn_dang_nam, 0) AS bn_dang_nam,
                ROUND(
                    CASE 
                        WHEN COALESCE(NULLIF(sd.sd_planned_bed, 0), b.giuong_ke_hoach, 0) > 0 
                        THEN (COALESCE(t.bn_dang_nam, 0)::numeric / COALESCE(NULLIF(sd.sd_planned_bed, 0), b.giuong_ke_hoach, 0)::numeric) * 100 
                        ELSE 0 
                    END, 1
                ) AS ty_le_cong_suat
            FROM sys_dept sd
            LEFT JOIN (
                SELECT 
                    hbl_deptid,
                    COALESCE(SUM(hbl_maxqty), COUNT(hbl_id)) AS giuong_ke_hoach
                FROM hms_bedlist
                WHERE hbl_active = 'Y'
                GROUP BY hbl_deptid
            ) b ON b.hbl_deptid = sd.sd_id
            LEFT JOIN (
                SELECT 
                    htr.htr_deptid,
                    COUNT(DISTINCT CASE WHEN (htr.htr_outpatient <> 'Y' OR htr.htr_outpatient IS NULL) AND ho.ho_type IN ('I', 'C') THEN htr.htr_docno END) AS bn_noi_tru_bhyt,
                    COUNT(DISTINCT CASE WHEN (htr.htr_outpatient <> 'Y' OR htr.htr_outpatient IS NULL) AND (ho.ho_type NOT IN ('I', 'C') OR ho.ho_type IS NULL) THEN htr.htr_docno END) AS bn_noi_tru_vienphi,
                    COUNT(DISTINCT CASE WHEN htr.htr_outpatient = 'Y' THEN htr.htr_docno END) AS bn_ngoai_tru,
                    COUNT(DISTINCT CASE WHEN (htr.htr_outpatient <> 'Y' OR htr.htr_outpatient IS NULL) THEN htr.htr_docno END) AS bn_dang_nam
                FROM hms_treatment_record htr
                JOIN hms_doc hd ON (hd.hd_docno = htr.htr_docno)
                LEFT JOIN hms_object ho ON (ho.ho_id = hd.hd_object)
                WHERE htr.htr_status = 'I'
                GROUP BY htr.htr_deptid
            ) t ON t.htr_deptid = sd.sd_id
            WHERE sd.sd_type = 'DT' 
              AND (COALESCE(NULLIF(sd.sd_planned_bed, 0), b.giuong_ke_hoach, 0) > 0 OR t.bn_dang_nam > 0 OR t.bn_ngoai_tru > 0)
            ORDER BY COALESCE(NULLIF(sd.sd_planned_bed, 0), b.giuong_ke_hoach, 0) DESC, sd.sd_id
        `;
        const res = await query(sql);
        return res.rows;
    }

    /**
     * 8. Dữ liệu Biểu đồ Dashboard (Xu hướng lượt khám theo ngày)
     */
    static async getDashboardCharts(fromDate: string, toDate: string) {
        const sql = `
            SELECT 
                DATE(he_examdate) AS exam_date,
                TO_CHAR(DATE(he_examdate), 'DD/MM') AS label_date,
                COUNT(DISTINCT he_docno) FILTER (WHERE he_status <> 'O') AS tong_kham,
                COUNT(DISTINCT he_docno) FILTER (WHERE ho_type IN ('I', 'C') AND he_status <> 'O') AS bhyt,
                COUNT(DISTINCT he_docno) FILTER (WHERE (ho_type = 'S' OR (ho_type NOT IN ('I', 'C') AND ho_type IS NOT NULL)) AND he_status <> 'O') AS vien_phi
            FROM hms_exam
            JOIN hms_doc ON (hd_docno = he_docno)
            JOIN hms_patient ON (hp_patientno = hd_patientno)
            LEFT JOIN hms_object ON (ho_id = hd_object)
            WHERE he_examdate BETWEEN $1::timestamp AND $2::timestamp
              AND hd_admitdept = 'KB'
              AND he_roomid IS NOT NULL
            GROUP BY DATE(he_examdate)
            ORDER BY DATE(he_examdate)
        `;
        const res = await query(sql, [fromDate, toDate]);
        return res.rows;
    }

    /**
     * 9. Top 10 Bác sĩ có lượt khám nhiều nhất
     */
    static async getTopDoctors(fromDate: string, toDate: string) {
        const sql = `
            SELECT 
                he_doctor AS doctor_id,
                COALESCE(su_name, he_doctor) AS doctor_name,
                COUNT(1) AS total_visits
            FROM hms_exam
            LEFT JOIN sys_user ON (su_userid = he_doctor)
            WHERE he_examdate BETWEEN $1::timestamp AND $2::timestamp
              AND he_status IN ('P', 'T')
              AND he_doctor IS NOT NULL AND LENGTH(TRIM(he_doctor)) > 0
            GROUP BY he_doctor, su_name
            ORDER BY total_visits DESC
            LIMIT 10
        `;
        const res = await query(sql, [fromDate, toDate]);
        return res.rows;
    }

    /**
     * 10. Bản tin Giao ban Sáng Tự Động (24h Executive Morning Flash Report)
     * Dành cho Giám đốc và Ban Giám đốc họp giao ban 07h00 sáng
     */
    static async getExecutiveMorningBriefing(briefingDate?: string) {
        const targetDate = briefingDate || new Date().toISOString().split('T')[0];
        const fromDate = `${targetDate} 00:00:00`;
        const toDate = `${targetDate} 23:59:59`;

        // 1. Khám bệnh & Cấp cứu 24h
        const examSql = `
            SELECT 
                COUNT(DISTINCT he_docno) FILTER (WHERE he_status <> 'O') AS tong_kham,
                COUNT(DISTINCT he_docno) FILTER (WHERE ho_type IN ('I', 'C') AND he_status <> 'O') AS kham_bhyt,
                COUNT(DISTINCT he_docno) FILTER (WHERE (ho_type = 'S' OR (ho_type NOT IN ('I', 'C') AND ho_type IS NOT NULL)) AND he_status <> 'O') AS kham_dichvu,
                COUNT(DISTINCT he_docno) FILTER (WHERE he_emergency = 'Y' OR he_roomid IN (SELECT hrl_id FROM hms_roomlist WHERE hrl_name ILIKE '%cấp cứu%')) AS cap_cuu,
                COUNT(DISTINCT he_docno) FILTER (WHERE hd_suggestion IN ('A', 'I') AND hd_status = 'T') AS chi_dinh_nhap_vien,
                COUNT(DISTINCT he_docno) FILTER (WHERE hd_suggestion = 'T' AND hd_status = 'T') AS chuyen_vien_ngoai_tru
            FROM hms_exam
            JOIN hms_doc ON (hd_docno = he_docno)
            JOIN hms_patient ON (hp_patientno = hd_patientno)
            LEFT JOIN hms_object ON (ho_id = hd_object)
            WHERE he_examdate BETWEEN $1::timestamp AND $2::timestamp
              AND hd_admitdept = 'KB'
        `;

        // 2. Thu dung nội trú & Biến động 24h
        const inpatientSql = `
            SELECT 
                COUNT(DISTINCT CASE 
                    WHEN htr_admitdate BETWEEN $1::timestamp AND $2::timestamp 
                         AND (htr_outpatient <> 'Y' OR htr_outpatient IS NULL)
                         AND htr_idx = 1 AND htr_status <> 'A'
                    THEN htr_docno 
                END) AS vao_vien,
                COUNT(DISTINCT CASE 
                    WHEN htr_status = 'T' AND htr_dischargedate BETWEEN $1::timestamp AND $2::timestamp 
                         AND htr_suggestion NOT IN ('M', 'F', 'T') AND (hcr_result NOT IN ('5', '6') OR hcr_result IS NULL)
                         AND (htr_outpatient <> 'Y' OR htr_outpatient IS NULL)
                    THEN htr_docno 
                END) AS ra_vien,
                COUNT(DISTINCT CASE 
                    WHEN htr_status = 'T' AND htr_dischargedate BETWEEN $1::timestamp AND $2::timestamp 
                         AND htr_suggestion = 'T'
                         AND (htr_outpatient <> 'Y' OR htr_outpatient IS NULL)
                    THEN htr_docno 
                END) AS chuyen_tuyen_noi_tru,
                COUNT(DISTINCT CASE 
                    WHEN htr_status = 'T' AND htr_dischargedate BETWEEN $1::timestamp AND $2::timestamp 
                         AND hcr_result IN ('5', '6')
                         AND (htr_outpatient <> 'Y' OR htr_outpatient IS NULL)
                    THEN htr_docno 
                END) AS tu_vong,
                COUNT(DISTINCT CASE 
                    WHEN htr_status = 'I'
                         AND (htr_outpatient <> 'Y' OR htr_outpatient IS NULL)
                    THEN htr_docno 
                END) AS hien_dien_hien_tai
            FROM hms_treatment_record
            LEFT JOIN hms_clinical_record ON (hcr_docno = htr_docno AND hcr_refidx = htr_idx)
            WHERE (htr_admitdate BETWEEN $1::timestamp AND $2::timestamp 
               OR (htr_status = 'T' AND htr_dischargedate BETWEEN $1::timestamp AND $2::timestamp)
               OR htr_status = 'I')
        `;

        // 3. Giường bệnh theo 562 Giường kế hoạch QĐ 49
        const bedSql = `
            SELECT 
                sd.sd_id AS dept_id,
                sd.sd_name AS dept_name,
                COALESCE(NULLIF(sd.sd_planned_bed, 0), b.giuong_ke_hoach, 0) AS giuong_ke_hoach,
                COALESCE(t.bn_dang_nam, 0) AS bn_dang_nam,
                ROUND(
                    CASE 
                        WHEN COALESCE(NULLIF(sd.sd_planned_bed, 0), b.giuong_ke_hoach, 0) > 0 
                        THEN (COALESCE(t.bn_dang_nam, 0)::numeric / COALESCE(NULLIF(sd.sd_planned_bed, 0), b.giuong_ke_hoach, 0)::numeric) * 100 
                        ELSE 0 
                    END, 1
                ) AS ty_le_cong_suat
            FROM sys_dept sd
            LEFT JOIN (
                SELECT hbl_deptid, COALESCE(SUM(hbl_maxqty), COUNT(hbl_id)) AS giuong_ke_hoach
                FROM hms_bedlist WHERE hbl_active = 'Y' GROUP BY hbl_deptid
            ) b ON b.hbl_deptid = sd.sd_id
            LEFT JOIN (
                SELECT htr_deptid, COUNT(DISTINCT htr_docno) AS bn_dang_nam
                FROM hms_treatment_record
                WHERE htr_status = 'I' AND (htr_outpatient <> 'Y' OR htr_outpatient IS NULL)
                GROUP BY htr_deptid
            ) t ON t.htr_deptid = sd.sd_id
            WHERE sd.sd_type = 'DT' AND (COALESCE(NULLIF(sd.sd_planned_bed, 0), b.giuong_ke_hoach, 0) > 0 OR t.bn_dang_nam > 0)
            ORDER BY ty_le_cong_suat DESC
        `;

        // 4. Phẫu thuật 24h qua
        const surgerySql = `
            SELECT 
                COUNT(1) AS tong_ca_pttt,
                COUNT(1) FILTER (WHERE SUBSTR(hfl_groupid, 1, 2) = 'B4') AS tong_phau_thuat,
                COUNT(1) FILTER (WHERE (COALESCE(htr.htr_emergency, hd.hd_emergency) = 'Y' OR ho.ho_before_optype = '2') AND SUBSTR(hfl_groupid, 1, 2) = 'B4') AS mo_cap_cuu,
                COUNT(1) FILTER (WHERE (COALESCE(htr.htr_emergency, hd.hd_emergency) <> 'Y' OR COALESCE(htr.htr_emergency, hd.hd_emergency) IS NULL) AND (ho.ho_before_optype <> '2' OR ho.ho_before_optype IS NULL) AND SUBSTR(hfl_groupid, 1, 2) = 'B4') AS mo_phien,
                COUNT(1) FILTER (WHERE SUBSTR(hfl_groupid, 1, 2) = 'B5' OR SUBSTR(hfl_groupid, 1, 2) <> 'B4') AS thu_thuat
            FROM hms_operation ho
            JOIN hms_fee_list ON (hfl_feeid = ho.ho_itemid)
            LEFT JOIN hms_doc hd ON (hd.hd_docno = ho.ho_docno)
            LEFT JOIN hms_treatment_record htr ON (htr.htr_docno = ho.ho_docno AND htr.htr_idx = ho.ho_refidx)
            WHERE (hfl_report <> 'N' OR hfl_report IS NULL)
              AND ho.ho_orderdate BETWEEN $1::timestamp AND $2::timestamp
              AND ho.ho_status <> 'O'
              AND SUBSTR(hfl_groupid, 1, 2) IN ('B4', 'B5')
        `;

        // 5. Danh sách ca phẫu thuật chi tiết trong 24h
        const surgeriesListSql = `
            SELECT 
                ho.ho_docno AS docno,
                CONCAT(hp.hp_surname, ' ', hp.hp_midname, ' ', hp.hp_firstname) AS patient_name,
                hfl.hfl_name AS operation_name,
                TO_CHAR(ho.ho_orderdate, 'HH24:MI DD/MM') AS order_time,
                COALESCE(su.su_name, ho.ho_doctor) AS doctor_name,
                COALESCE(sd.sd_name, 'Khoa Ngoại') AS dept_name,
                CASE 
                    WHEN (COALESCE(htr.htr_emergency, hd.hd_emergency) = 'Y' OR ho.ho_before_optype = '2') THEN 'EMERGENCY'
                    ELSE 'SCHEDULED'
                END AS operation_type
            FROM hms_operation ho
            JOIN hms_fee_list hfl ON (hfl.hfl_feeid = ho.ho_itemid)
            LEFT JOIN hms_doc hd ON (hd.hd_docno = ho.ho_docno)
            LEFT JOIN hms_patient hp ON (hp.hp_patientno = hd.hd_patientno)
            LEFT JOIN sys_user su ON (su.su_userid = ho.ho_doctor)
            LEFT JOIN sys_dept sd ON (sd.sd_id = COALESCE(ho.ho_pdeptid, ho.ho_deptid))
            LEFT JOIN hms_treatment_record htr ON (htr.htr_docno = ho.ho_docno AND htr.htr_idx = ho.ho_refidx)
            WHERE (hfl.hfl_report <> 'N' OR hfl.hfl_report IS NULL)
              AND ho.ho_orderdate BETWEEN $1::timestamp AND $2::timestamp
              AND ho.ho_status <> 'O'
              AND SUBSTR(hfl.hfl_groupid, 1, 2) = 'B4'
            ORDER BY ho.ho_orderdate DESC
            LIMIT 20
        `;

        // 6. Danh sách ca tử vong trong 24h (nếu có)
        const deathsListSql = `
            SELECT 
                htr.htr_docno AS docno,
                CONCAT(hp.hp_surname, ' ', hp.hp_midname, ' ', hp.hp_firstname) AS patient_name,
                COALESCE(sd.sd_name, 'Nội trú') AS dept_name,
                TO_CHAR(htr.htr_dischargedate, 'HH24:MI DD/MM') AS death_time,
                COALESCE(hcr.hcr_maindisease, 'Chưa ghi nhận') AS death_cause,
                COALESCE(hcr.hcr_mainicd, '') AS death_icd
            FROM hms_treatment_record htr
            JOIN hms_doc hd ON (hd.hd_docno = htr.htr_docno)
            JOIN hms_patient hp ON (hp.hp_patientno = hd.hd_patientno)
            LEFT JOIN sys_dept sd ON (sd.sd_id = htr.htr_deptid)
            LEFT JOIN hms_clinical_record hcr ON (hcr.hcr_docno = htr.htr_docno AND hcr.hcr_refidx = htr.htr_idx)
            WHERE htr.htr_status = 'T'
              AND htr.htr_dischargedate BETWEEN $1::timestamp AND $2::timestamp
              AND hcr.hcr_result IN ('5', '6')
            ORDER BY htr.htr_dischargedate DESC
            LIMIT 10
        `;

        // 7. Ngày có dữ liệu hoạt động gần nhất
        const latestDateSql = `
            SELECT TO_CHAR(MAX(he_examdate), 'YYYY-MM-DD') AS latest_date 
            FROM hms_exam 
            WHERE he_status <> 'O'
        `;

        const [examRes, inpRes, bedRes, surRes, surListRes, deathListRes, latestRes] = await Promise.all([
            query(examSql, [fromDate, toDate]).catch(() => ({ rows: [] })),
            query(inpatientSql, [fromDate, toDate]).catch(() => ({ rows: [] })),
            query(bedSql).catch(() => ({ rows: [] })),
            query(surgerySql, [fromDate, toDate]).catch(() => ({ rows: [] })),
            query(surgeriesListSql, [fromDate, toDate]).catch(() => ({ rows: [] })),
            query(deathsListSql, [fromDate, toDate]).catch(() => ({ rows: [] })),
            query(latestDateSql).catch(() => ({ rows: [] }))
        ]);

        const overviewExam = examRes.rows[0] || {};
        const overviewInp = inpRes.rows[0] || {};
        const beds = bedRes.rows || [];
        const sur = surRes.rows[0] || {};
        const surgeriesList = surListRes.rows || [];
        const deathsList = deathListRes.rows || [];
        const latestActiveDate = latestRes.rows[0]?.latest_date || targetDate;

        const totalPlannedBeds = beds.reduce((acc: number, b: any) => acc + Number(b.giuong_ke_hoach || 0), 0);
        const totalActivePatients = beds.reduce((acc: number, b: any) => acc + Number(b.bn_dang_nam || 0), 0);
        const totalHospitalOccupancy = totalPlannedBeds > 0 ? Number(((totalActivePatients / totalPlannedBeds) * 100).toFixed(1)) : 0;

        const overloadedDepts = beds.filter((b: any) => Number(b.ty_le_cong_suat || 0) > 100);
        const nearCapacityDepts = beds.filter((b: any) => Number(b.ty_le_cong_suat || 0) >= 90 && Number(b.ty_le_cong_suat || 0) <= 100);
        const optimalDepts = beds.filter((b: any) => Number(b.ty_le_cong_suat || 0) >= 80 && Number(b.ty_le_cong_suat || 0) < 90);
        const availableDepts = beds.filter((b: any) => Number(b.ty_le_cong_suat || 0) < 80);

        return {
            briefing_date: targetDate,
            latest_active_date: latestActiveDate,
            examination: {
                tong_kham: Number(overviewExam.tong_kham || 0),
                kham_bhyt: Number(overviewExam.kham_bhyt || 0),
                kham_dichvu: Number(overviewExam.kham_dichvu || 0),
                cap_cuu: Number(overviewExam.cap_cuu || 0),
                chi_dinh_nhap_vien: Number(overviewExam.chi_dinh_nhap_vien || 0),
                chuyen_vien_ngoai_tru: Number(overviewExam.chuyen_vien_ngoai_tru || 0)
            },
            inpatient: {
                vao_vien: Number(overviewInp.vao_vien || 0),
                ra_vien: Number(overviewInp.ra_vien || 0),
                chuyen_tuyen_noi_tru: Number(overviewInp.chuyen_tuyen_noi_tru || 0),
                tu_vong: Number(overviewInp.tu_vong || 0),
                hien_dien_hien_tai: totalActivePatients
            },
            surgery: {
                tong_ca_pttt: Number(sur.tong_ca_pttt || 0),
                tong_phau_thuat: Number(sur.tong_phau_thuat || 0),
                mo_cap_cuu: Number(sur.mo_cap_cuu || 0),
                mo_phien: Number(sur.mo_phien || 0),
                thu_thuat: Number(sur.thu_thuat || 0)
            },
            bed_status: {
                total_planned_beds: totalPlannedBeds,
                total_patients: totalActivePatients,
                occupancy_rate: totalHospitalOccupancy,
                all_depts: beds,
                overloaded_depts: overloadedDepts,
                near_capacity_depts: nearCapacityDepts,
                optimal_depts: optimalDepts,
                available_depts: availableDepts
            },
            surgeries_list: surgeriesList,
            deaths_list: deathsList
        };
    }



    /**
     * 11. Báo cáo Giám sát Rủi ro Chi phí BHYT & Quản trị Tạm ứng Viện phí
     */
    static async getBhytFinancialRiskStatistics(fromDate: string, toDate: string) {
        // 1. Phân tích cơ cấu chi phí KCB phát sinh trong kỳ & Quỹ BHYT chi trả
        // Không lọc f.hfe_discount > 0 ở cấp độ hóa đơn để:
        // - tong_chi_phi: phản ánh toàn bộ viện phí KCB phát sinh trong kỳ báo cáo
        // - bhyt_chi_tra: đúng 100% số tiền quỹ BHYT chi trả
        // - benh_nhan_cung_chi_tra: đúng 100% số tiền người bệnh phải trả (gồm đồng chi trả BHYT và dịch vụ tự nguyện)
        const bhytStructureSql = `
            SELECT 
                ROUND(COALESCE(SUM(f.hfe_cost), 0)) AS tong_chi_phi,
                ROUND(COALESCE(SUM(f.hfe_discount), 0)) AS bhyt_chi_tra,
                ROUND(COALESCE(SUM(f.hfe_cost - f.hfe_discount), 0)) AS benh_nhan_cung_chi_tra,
                ROUND(COALESCE(SUM(CASE WHEN SUBSTR(f.hfe_group, 1, 1) = 'A' AND SUBSTR(f.hfe_group, 1, 2) NOT IN ('A2', 'A4', 'A9') THEN f.hfe_discount ELSE 0 END), 0)) AS tien_thuoc_bhyt,
                ROUND(COALESCE(SUM(CASE WHEN SUBSTR(f.hfe_group, 1, 2) = 'A9' THEN f.hfe_discount ELSE 0 END), 0)) AS tien_vtyt_bhyt,
                ROUND(COALESCE(SUM(CASE WHEN SUBSTR(f.hfe_group, 1, 1) = 'C' THEN f.hfe_discount ELSE 0 END), 0)) AS tien_giuong_bhyt,
                ROUND(COALESCE(SUM(CASE WHEN SUBSTR(f.hfe_group, 1, 2) = 'B1' THEN f.hfe_discount ELSE 0 END), 0)) AS tien_xet_nghiem_bhyt,
                ROUND(COALESCE(SUM(CASE WHEN SUBSTR(f.hfe_group, 1, 2) IN ('B2', 'B3') THEN f.hfe_discount ELSE 0 END), 0)) AS tien_cdha_tdcn_bhyt,
                ROUND(COALESCE(SUM(CASE WHEN SUBSTR(f.hfe_group, 1, 2) IN ('B4', 'B5') THEN f.hfe_discount ELSE 0 END), 0)) AS tien_pttt_bhyt,
                ROUND(COALESCE(SUM(CASE WHEN SUBSTR(f.hfe_group, 1, 1) = 'D' THEN f.hfe_discount ELSE 0 END), 0)) AS tien_kham_bhyt
            FROM hms_fee_invoice inv
            JOIN hms_fee f ON (f.hfe_invoiceno = inv.hfe_invoiceno)
            WHERE inv.hfe_date BETWEEN $1::timestamp AND $2::timestamp
              AND inv.hfe_status = 'P'
        `;

        // 2. Danh sách bệnh nhân nội trú đang điều trị có chi phí vượt số tiền tạm ứng (cảnh báo thu viện phí)
        // Chuẩn hóa theo đợt điều trị hiện tại (htr_treattime) của bệnh nhân nội trú đang điều trị,
        // chỉ tính chi phí chưa thanh toán (hfe_invoiceno = 0) và tạm ứng chưa quyết toán đợt này.
        const depositDeficitSql = `
            WITH unbilled_costs AS (
                SELECT 
                    f.hfe_docno,
                    f.hfe_treattime,
                    COALESCE(SUM(f.hfe_cost - f.hfe_discount), 0) AS chi_phi_bn_chua_thu
                FROM hms_fee f
                WHERE f.hfe_invoiceno = 0
                  AND f.hfe_status <> 'C'
                GROUP BY f.hfe_docno, f.hfe_treattime
                HAVING COALESCE(SUM(f.hfe_cost - f.hfe_discount), 0) > 0
            ),
            active_inpatients AS (
                SELECT DISTINCT ON (htr.htr_docno)
                    htr.htr_docno,
                    htr.htr_treattime,
                    htr.htr_deptid,
                    htr.htr_admitdate,
                    sd.sd_name AS dept_name,
                    CONCAT(hp.hp_surname, ' ', hp.hp_midname, ' ', hp.hp_firstname) AS patient_name,
                    ho.ho_desc AS object_name,
                    uc.chi_phi_bn_chua_thu
                FROM unbilled_costs uc
                JOIN hms_treatment_record htr ON (htr.htr_docno = uc.hfe_docno AND htr.htr_treattime = uc.hfe_treattime)
                JOIN sys_dept sd ON (sd.sd_id = htr.htr_deptid AND sd.sd_type = 'DT')
                JOIN hms_doc hd ON (hd.hd_docno = htr.htr_docno)
                JOIN hms_patient hp ON (hp.hp_patientno = hd.hd_patientno)
                LEFT JOIN hms_object ho ON (ho.ho_id = hd.hd_object)
                WHERE htr.htr_status = 'I'
                  AND htr.htr_dischargedate IS NULL
                  AND (htr.htr_outpatient <> 'Y' OR htr.htr_outpatient IS NULL)
                ORDER BY htr.htr_docno, htr.htr_idx DESC
            ),
            patient_deposits AS (
                SELECT 
                    d.hfe_docno,
                    d.hfe_treattime,
                    COALESCE(SUM(d.hfe_amount), 0) AS tong_tam_ung
                FROM hms_fee_deposit d
                JOIN active_inpatients ai ON (ai.htr_docno = d.hfe_docno AND ai.htr_treattime = d.hfe_treattime)
                WHERE d.hfe_status IN ('P', 'W')
                GROUP BY d.hfe_docno, d.hfe_treattime
            ),
            patient_settled AS (
                SELECT 
                    inv.hfe_docno,
                    inv.hfe_treattime,
                    COALESCE(SUM(inv.hfe_deposit), 0) AS tam_ung_da_khau_tru
                FROM hms_fee_invoice inv
                JOIN active_inpatients ai ON (ai.htr_docno = inv.hfe_docno AND ai.htr_treattime = inv.hfe_treattime)
                WHERE inv.hfe_status = 'P'
                GROUP BY inv.hfe_docno, inv.hfe_treattime
            )
            SELECT 
                ai.htr_docno AS docno,
                ai.patient_name,
                ai.dept_name,
                ai.object_name,
                ai.htr_admitdate AS admit_date,
                ROUND(ai.chi_phi_bn_chua_thu) AS total_cost,
                ROUND(GREATEST(0, COALESCE(pd.tong_tam_ung, 0) - COALESCE(ps.tam_ung_da_khau_tru, 0))) AS deposit_amount,
                ROUND(ai.chi_phi_bn_chua_thu - GREATEST(0, COALESCE(pd.tong_tam_ung, 0) - COALESCE(ps.tam_ung_da_khau_tru, 0))) AS deficit_amount,
                CASE 
                    WHEN (ai.chi_phi_bn_chua_thu - GREATEST(0, COALESCE(pd.tong_tam_ung, 0) - COALESCE(ps.tam_ung_da_khau_tru, 0))) >= 10000000 THEN 'CRITICAL'
                    WHEN (ai.chi_phi_bn_chua_thu - GREATEST(0, COALESCE(pd.tong_tam_ung, 0) - COALESCE(ps.tam_ung_da_khau_tru, 0))) >= 5000000 THEN 'HIGH'
                    WHEN (ai.chi_phi_bn_chua_thu - GREATEST(0, COALESCE(pd.tong_tam_ung, 0) - COALESCE(ps.tam_ung_da_khau_tru, 0))) > 0 THEN 'WARNING'
                    ELSE 'SAFE'
                END AS risk_level
            FROM active_inpatients ai
            LEFT JOIN patient_deposits pd ON (pd.hfe_docno = ai.htr_docno AND pd.hfe_treattime = ai.htr_treattime)
            LEFT JOIN patient_settled ps ON (ps.hfe_docno = ai.htr_docno AND ps.hfe_treattime = ai.htr_treattime)
            WHERE (ai.chi_phi_bn_chua_thu - GREATEST(0, COALESCE(pd.tong_tam_ung, 0) - COALESCE(ps.tam_ung_da_khau_tru, 0))) > 0
            ORDER BY deficit_amount DESC
            LIMIT 100
        `;

        const [structureRes, deficitRes] = await Promise.all([
            query(bhytStructureSql, [fromDate, toDate]).catch(() => ({ rows: [] })),
            query(depositDeficitSql).catch(() => ({ rows: [] }))
        ]);

        const s = structureRes.rows[0] || {};
        const totalBhyt = Math.round(Number(s.bhyt_chi_tra || 0));
        const totalCost = Math.round(Number(s.tong_chi_phi || 0));
        const patientCost = Math.round(Number(s.benh_nhan_cung_chi_tra || 0));

        return {
            summary: {
                tong_chi_phi: totalCost,
                bhyt_chi_tra: totalBhyt,
                benh_nhan_cung_chi_tra: patientCost,
                ty_le_bhyt: totalCost > 0 ? Number(((totalBhyt / totalCost) * 100).toFixed(1)) : 0
            },
            cost_breakdown: {
                tien_thuoc: Math.round(Number(s.tien_thuoc_bhyt || 0)),
                tien_vtyt: Math.round(Number(s.tien_vtyt_bhyt || 0)),
                tien_giuong: Math.round(Number(s.tien_giuong_bhyt || 0)),
                tien_xet_nghiem: Math.round(Number(s.tien_xet_nghiem_bhyt || 0)),
                tien_cdha_tdcn: Math.round(Number(s.tien_cdha_tdcn_bhyt || 0)),
                tien_pttt: Math.round(Number(s.tien_pttt_bhyt || 0)),
                tien_kham: Math.round(Number(s.tien_kham_bhyt || 0)),
                ty_le_thuoc: totalBhyt > 0 ? Number(((Number(s.tien_thuoc_bhyt || 0) / totalBhyt) * 100).toFixed(1)) : 0,
                ty_le_vtyt: totalBhyt > 0 ? Number(((Number(s.tien_vtyt_bhyt || 0) / totalBhyt) * 100).toFixed(1)) : 0,
                ty_le_giuong: totalBhyt > 0 ? Number(((Number(s.tien_giuong_bhyt || 0) / totalBhyt) * 100).toFixed(1)) : 0,
                ty_le_cls: totalBhyt > 0 ? Number((((Number(s.tien_xet_nghiem_bhyt || 0) + Number(s.tien_cdha_tdcn_bhyt || 0)) / totalBhyt) * 100).toFixed(1)) : 0
            },
            deposit_deficits: deficitRes.rows
        };
    }

    /**
     * 12. Hệ thống Đèn Cảnh Báo Chỉ Huy Khẩn Cấp (Executive Traffic Light Live Alerts)
     */
    static async getExecutiveAlerts() {
        const today = new Date().toISOString().split('T')[0];
        const fromDate = `${today} 00:00:00`;
        const toDate = `${today} 23:59:59`;

        // 1. Quét khoa quá tải
        const overloadSql = `
            SELECT 
                sd.sd_id, 
                sd.sd_name, 
                COALESCE(NULLIF(sd.sd_planned_bed, 0), b.giuong_ke_hoach, 0) AS giuong_ke_hoach,
                COUNT(DISTINCT htr.htr_docno) AS bn_dang_nam
            FROM sys_dept sd
            LEFT JOIN (
                SELECT hbl_deptid, COALESCE(SUM(hbl_maxqty), COUNT(hbl_id)) AS giuong_ke_hoach
                FROM hms_bedlist WHERE hbl_active = 'Y' GROUP BY hbl_deptid
            ) b ON b.hbl_deptid = sd.sd_id
            JOIN hms_treatment_record htr ON (htr.htr_deptid = sd.sd_id AND htr.htr_status = 'I' AND (htr.htr_outpatient <> 'Y' OR htr.htr_outpatient IS NULL))
            WHERE sd.sd_type = 'DT'
            GROUP BY sd.sd_id, sd.sd_name, b.giuong_ke_hoach
            HAVING COUNT(DISTINCT htr.htr_docno) > COALESCE(NULLIF(sd.sd_planned_bed, 0), b.giuong_ke_hoach, 0)
        `;

        // 2. Quét ca tử vong hôm nay
        const deathSql = `
            SELECT COUNT(1) AS so_ca_tu_vong
            FROM hms_treatment_record
            JOIN hms_clinical_record ON (hcr_docno = htr_docno AND hcr_refidx = htr_idx)
            WHERE htr_status = 'T' 
              AND htr_dischargedate BETWEEN $1::timestamp AND $2::timestamp
              AND hcr_result IN ('5', '6')
        `;

        // 3. Quét bệnh nhân âm tạm ứng > 5 triệu (chuẩn hóa theo đợt điều trị hiện tại)
        const depositAlertSql = `
            WITH unbilled_costs AS (
                SELECT 
                    f.hfe_docno,
                    f.hfe_treattime,
                    COALESCE(SUM(f.hfe_cost - f.hfe_discount), 0) AS chi_phi_bn_chua_thu
                FROM hms_fee f
                WHERE f.hfe_invoiceno = 0
                  AND f.hfe_status <> 'C'
                GROUP BY f.hfe_docno, f.hfe_treattime
                HAVING COALESCE(SUM(f.hfe_cost - f.hfe_discount), 0) >= 5000000
            ),
            active_inpatients AS (
                SELECT DISTINCT ON (htr.htr_docno)
                    htr.htr_docno,
                    htr.htr_treattime,
                    uc.chi_phi_bn_chua_thu
                FROM unbilled_costs uc
                JOIN hms_treatment_record htr ON (htr.htr_docno = uc.hfe_docno AND htr.htr_treattime = uc.hfe_treattime)
                JOIN sys_dept sd ON (sd.sd_id = htr.htr_deptid AND sd.sd_type = 'DT')
                WHERE htr.htr_status = 'I'
                  AND htr.htr_dischargedate IS NULL
                  AND (htr.htr_outpatient <> 'Y' OR htr.htr_outpatient IS NULL)
            ),
            patient_deposits AS (
                SELECT 
                    d.hfe_docno,
                    d.hfe_treattime,
                    COALESCE(SUM(d.hfe_amount), 0) AS tong_tam_ung
                FROM hms_fee_deposit d
                JOIN active_inpatients ai ON (ai.htr_docno = d.hfe_docno AND ai.htr_treattime = d.hfe_treattime)
                WHERE d.hfe_status IN ('P', 'W')
                GROUP BY d.hfe_docno, d.hfe_treattime
            ),
            patient_settled AS (
                SELECT 
                    inv.hfe_docno,
                    inv.hfe_treattime,
                    COALESCE(SUM(inv.hfe_deposit), 0) AS tam_ung_da_khau_tru
                FROM hms_fee_invoice inv
                JOIN active_inpatients ai ON (ai.htr_docno = inv.hfe_docno AND ai.htr_treattime = inv.hfe_treattime)
                WHERE inv.hfe_status = 'P'
                GROUP BY inv.hfe_docno, inv.hfe_treattime
            )
            SELECT COUNT(1) AS so_ca_am_tam_ung_lon
            FROM active_inpatients ai
            LEFT JOIN patient_deposits pd ON (pd.hfe_docno = ai.htr_docno AND pd.hfe_treattime = ai.htr_treattime)
            LEFT JOIN patient_settled ps ON (ps.hfe_docno = ai.htr_docno AND ps.hfe_treattime = ai.htr_treattime)
            WHERE (ai.chi_phi_bn_chua_thu - GREATEST(0, COALESCE(pd.tong_tam_ung, 0) - COALESCE(ps.tam_ung_da_khau_tru, 0))) >= 5000000
        `;

        const [overloadRes, deathRes, depositRes] = await Promise.all([
            query(overloadSql).catch(() => ({ rows: [] })),
            query(deathSql, [fromDate, toDate]).catch(() => ({ rows: [] })),
            query(depositAlertSql).catch(() => ({ rows: [] }))
        ]);

        const alerts: any[] = [];
        const overloads = overloadRes.rows;
        const deathCount = Number(deathRes.rows[0]?.so_ca_tu_vong || 0);
        const bigDepositDeficits = Number(depositRes.rows[0]?.so_ca_am_tam_ung_lon || 0);

        if (overloads.length > 0) {
            alerts.push({
                type: 'RED',
                category: 'BED_OVERLOAD',
                title: `${overloads.length} khoa điều trị vượt 100% công suất giường`,
                message: `Phát hiện các khoa: ${overloads.map((o: any) => `${o.sd_name} (${o.bn_dang_nam}/${o.giuong_ke_hoach} giường)`).join(', ')}. Cần điều phối giường bệnh gấp!`,
                action_link: '/hospital-statistics/bed-occupancy'
            });
        }

        if (deathCount > 0) {
            alerts.push({
                type: 'RED',
                category: 'DEATH_INCIDENT',
                title: `Ghi nhận ${deathCount} ca tử vong trong ngày`,
                message: `Cần tiến hành kiểm thảo tử vong và hội chẩn rút kinh nghiệm theo quy chế chuyên môn Bộ Y tế.`,
                action_link: '/hospital-statistics/inpatient'
            });
        }

        if (bigDepositDeficits > 0) {
            alerts.push({
                type: 'YELLOW',
                category: 'FINANCIAL_RISK',
                title: `${bigDepositDeficits} bệnh nhân nội trú âm tạm ứng trên 5.000.000đ`,
                message: `Có nguy cơ thất thoát viện phí hoặc phát sinh công nợ khó đòi khi ra viện.`,
                action_link: '/hospital-statistics/financial-risk'
            });
        }

        if (alerts.length === 0) {
            alerts.push({
                type: 'GREEN',
                category: 'ALL_NORMAL',
                title: 'Toàn viện hoạt động an toàn & ổn định',
                message: 'Không ghi nhận sự cố bất thường, công suất buồng bệnh và dòng tiền trong giới hạn kiểm soát.',
                action_link: '/hospital-statistics/dashboard'
            });
        }

        return {
            overall_status: alerts.some((a: any) => a.type === 'RED') ? 'RED' : alerts.some((a: any) => a.type === 'YELLOW') ? 'YELLOW' : 'GREEN',
            alerts
        };
    }
}
