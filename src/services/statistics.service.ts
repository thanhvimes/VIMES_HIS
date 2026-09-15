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
                -- Vào viện: Đồng bộ theo Báo cáo C6 khám bệnh vào viện
                (
                    SELECT COUNT(DISTINCT he_docno) 
                    FROM hms_exam 
                    JOIN hms_doc ON (hd_docno = he_docno)
                    WHERE he_examdate BETWEEN $1::timestamp AND $2::timestamp
                      AND hd_suggestion IN ('A', 'I') AND hd_status = 'T'
                      AND hd_admitdept = 'KB'
                ) AS vao_vien,
                -- Điểm e tại IV: Tổng bệnh nhân ra viện
                COUNT(DISTINCT CASE 
                    WHEN htr_status = 'T' AND htr_dischargedate BETWEEN $1::timestamp AND $2::timestamp 
                         AND htr_suggestion IN ('D', 'T') AND (hcr_result NOT IN ('5', '6') OR hcr_result IS NULL)
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
                -- Điểm g tại IV: Tổng bệnh nhân chuyển tuyến từ nội trú
                COUNT(DISTINCT CASE 
                    WHEN htr_status = 'T' AND htr_dischargedate BETWEEN $1::timestamp AND $2::timestamp 
                         AND htr_suggestion = 'M'
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
                    -- Chuyển khoa đến: htr_idx > 1 AND hcr_admitdept <> htr_deptid AND htr_status <> 'A'
                    COALESCE(SUM(CASE 
                        WHEN htr.htr_idx > 1 
                             AND hcr.hcr_admitdept <> htr.htr_deptid
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
                    -- Ra viện: htr_status = 'T' AND htr_suggestion NOT IN ('M', 'F') AND hcr_result NOT IN ('5', '6')
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
                WHERE sd.sd_type = 'DT' AND (sd.sd_isactive = 'Y' OR sd.sd_isactive IS NULL)
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
                (dau_ky + vao_vien + chuyen_den - chuyen_di - ra_vien - tu_vong) AS hien_dien
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
     * 7. Công suất sử dụng Giường bệnh (Khớp chuẩn MFC BCTINHHINHSDGIUONG & HFGiuongtonghop)
     */
    static async getBedOccupancyStatistics() {
        const sql = `
            SELECT 
                sd.sd_id AS dept_id,
                sd.sd_name AS dept_name,
                COALESCE(NULLIF(sd.sd_planned_bed, 0), b.giuong_ke_hoach, b.giuong_thuc_ke, t.bn_dang_nam, 0) AS giuong_ke_hoach,
                COALESCE(b.giuong_thuc_ke, t.bn_dang_nam, 0) AS giuong_thuc_ke,
                COALESCE(t.bn_dang_nam, 0) AS bn_dang_nam,
                ROUND(
                    CASE 
                        WHEN COALESCE(NULLIF(sd.sd_planned_bed, 0), b.giuong_ke_hoach, b.giuong_thuc_ke, t.bn_dang_nam, 0) > 0 
                        THEN (COALESCE(t.bn_dang_nam, 0)::numeric / COALESCE(NULLIF(sd.sd_planned_bed, 0), b.giuong_ke_hoach, b.giuong_thuc_ke, t.bn_dang_nam, 0)::numeric) * 100 
                        ELSE 0 
                    END, 1
                ) AS ty_le_cong_suat
            FROM sys_dept sd
            LEFT JOIN (
                SELECT 
                    hbl_deptid,
                    COUNT(hbl_id) AS giuong_thuc_ke,
                    COALESCE(SUM(hbl_maxqty), COUNT(hbl_id)) AS giuong_ke_hoach
                FROM hms_bedlist
                WHERE hbl_active = 'Y'
                GROUP BY hbl_deptid
            ) b ON b.hbl_deptid = sd.sd_id
            LEFT JOIN (
                SELECT 
                    htr_deptid,
                    COUNT(DISTINCT htr_docno) AS bn_dang_nam
                FROM hms_treatment_record
                WHERE htr_status = 'I'
                  AND (htr_outpatient <> 'Y' OR htr_outpatient IS NULL)
                GROUP BY htr_deptid
            ) t ON t.htr_deptid = sd.sd_id
            WHERE sd.sd_type = 'DT' AND (b.giuong_thuc_ke > 0 OR t.bn_dang_nam > 0)
            ORDER BY COALESCE(b.giuong_thuc_ke, 0) DESC, sd.sd_id
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
}
