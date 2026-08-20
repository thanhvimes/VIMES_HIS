// ==================== STATISTICS SERVICE ====================
// File: backend/src/services/statistics.service.ts

import { query } from '../config/database';

export class StatisticsService {
    /**
     * 1. Thống kê Hoạt động bệnh viện tổng thể
     */
    static async getHospitalActivity(fromDate: string, toDate: string) {
        // Query Khám bệnh
        const examSql = `
            SELECT 
                COUNT(DISTINCT he_docno) AS tong_so,
                COUNT(DISTINCT CASE WHEN ho_type IN ('I', 'D', 'C') THEN he_docno END) AS so_bhyt,
                COUNT(DISTINCT CASE WHEN ho_type NOT IN ('I', 'D', 'C') OR ho_type IS NULL THEN he_docno END) AS so_dichvu,
                COUNT(DISTINCT CASE WHEN he_status = 'T' AND hd_suggestion = 'I' THEN he_docno END) AS nhap_vien,
                COUNT(DISTINCT CASE WHEN he_status = 'T' AND hd_suggestion = 'T' THEN he_docno END) AS chuyen_vien
            FROM hms_exam
            LEFT JOIN hms_doc ON (hd_docno = he_docno)
            LEFT JOIN hms_object ON (ho_id = hd_object)
            WHERE he_examdate BETWEEN $1::timestamp AND $2::timestamp
              AND he_status IN ('P', 'T')
        `;

        // Query Nội trú
        const inpatientSql = `
            SELECT 
                COUNT(DISTINCT CASE WHEN htr_idx = 1 AND htr_admitdate BETWEEN $1::timestamp AND $2::timestamp THEN htr_docno END) AS vao_vien,
                COUNT(DISTINCT CASE WHEN htr_status = 'T' AND htr_dischargedate BETWEEN $1::timestamp AND $2::timestamp AND htr_suggestion IN ('D', 'T') THEN htr_docno END) AS ra_vien,
                COUNT(DISTINCT CASE WHEN htr_status = 'T' AND htr_dischargedate BETWEEN $1::timestamp AND $2::timestamp AND hcr_result IN ('5', '6') THEN htr_docno END) AS tu_vong,
                COUNT(DISTINCT CASE WHEN htr_status = 'I' THEN htr_docno END) AS dang_dieu_tri
            FROM hms_treatment_record
            LEFT JOIN hms_clinical_record ON (hcr_docno = htr_docno)
            WHERE (htr_admitdate BETWEEN $1::timestamp AND $2::timestamp 
               OR (htr_status = 'T' AND htr_dischargedate BETWEEN $1::timestamp AND $2::timestamp)
               OR htr_status = 'I')
        `;

        // Query Cận lâm sàng tổng hợp
        const clsSql = `
            SELECT 
                CASE 
                    WHEN SUBSTR(f.hfe_group, 1, 2) = 'B1' THEN 'XET_NGHIEM'
                    WHEN SUBSTR(f.hfe_group, 1, 2) = 'B2' THEN 'CDHA'
                    WHEN SUBSTR(f.hfe_group, 1, 2) = 'B3' THEN 'TDCN'
                    ELSE 'CLS_KHAC'
                END AS cls_group,
                COUNT(DISTINCT inv.hfe_docno) AS so_benh_nhan,
                COUNT(1) AS so_chi_dinh
            FROM hms_fee_invoice inv
            JOIN hms_fee f ON (f.hfe_invoiceno = inv.hfe_invoiceno)
            WHERE inv.hfe_date BETWEEN $1::timestamp AND $2::timestamp
              AND SUBSTR(f.hfe_group, 1, 1) = 'B'
              AND inv.hfe_status = 'P'
            GROUP BY 
                CASE 
                    WHEN SUBSTR(f.hfe_group, 1, 2) = 'B1' THEN 'XET_NGHIEM'
                    WHEN SUBSTR(f.hfe_group, 1, 2) = 'B2' THEN 'CDHA'
                    WHEN SUBSTR(f.hfe_group, 1, 2) = 'B3' THEN 'TDCN'
                    ELSE 'CLS_KHAC'
                END
        `;

        // Query Phẫu thuật / Thủ thuật (Đếm số ca nguyên vẹn)
        const ptttSql = `
            SELECT 
                CASE WHEN hfl_groupid LIKE 'B4%' OR hfl_operation_group IN ('DB', 'L1', 'L2', 'L3') THEN 'PHAU_THUAT' ELSE 'THU_THUAT' END AS pttt_type,
                COUNT(DISTINCT ho_docno) AS so_benh_nhan,
                COUNT(1) AS tong_so_ca
            FROM hms_operation
            LEFT JOIN hms_feelist ON (hfl_feeid = ho_itemid)
            WHERE ho_performdate BETWEEN $1::timestamp AND $2::timestamp
              AND ho_status = 'T'
            GROUP BY CASE WHEN hfl_groupid LIKE 'B4%' OR hfl_operation_group IN ('DB', 'L1', 'L2', 'L3') THEN 'PHAU_THUAT' ELSE 'THU_THUAT' END
        `;

        const [examRes, inpatientRes, clsRes, ptttRes] = await Promise.all([
            query(examSql, [fromDate, toDate]).catch(() => ({ rows: [] })),
            query(inpatientSql, [fromDate, toDate]).catch(() => ({ rows: [] })),
            query(clsSql, [fromDate, toDate]).catch(() => ({ rows: [] })),
            query(ptttSql, [fromDate, toDate]).catch(() => ({ rows: [] }))
        ]);

        return {
            examination: examRes.rows[0] || { tong_so: 0, so_bhyt: 0, so_dichvu: 0, nhap_vien: 0, chuyen_vien: 0 },
            inpatient: inpatientRes.rows[0] || { vao_vien: 0, ra_vien: 0, tu_vong: 0, dang_dieu_tri: 0 },
            paraclinical: clsRes.rows,
            surgery: ptttRes.rows
        };
    }

    /**
     * 2. Thống kê theo Phòng khám (Tối ưu hóa CTE subquery)
     */
    static async getClinicsStatistics(fromDate: string, toDate: string) {
        const sql = `
            WITH exam_agg AS (
                SELECT 
                    he_deptid,
                    he_roomid,
                    COUNT(DISTINCT he_docno) AS tong_luot_kham,
                    COUNT(DISTINCT CASE WHEN ho_type IN ('I', 'D', 'C') THEN he_docno END) AS so_bhyt,
                    COUNT(DISTINCT CASE WHEN ho_type NOT IN ('I', 'D', 'C') OR ho_type IS NULL THEN he_docno END) AS so_dichvu,
                    COUNT(DISTINCT CASE WHEN he_status = 'T' AND hd_suggestion = 'I' THEN he_docno END) AS nhap_vien,
                    COUNT(DISTINCT CASE WHEN he_status = 'T' AND hd_suggestion = 'T' THEN he_docno END) AS chuyen_vien,
                    COUNT(DISTINCT CASE WHEN he_status = 'T' AND hd_suggestion = 'D' THEN he_docno END) AS cho_ve,
                    COUNT(DISTINCT CASE WHEN he_status = 'P' THEN he_docno END) AS dang_kham
                FROM hms_exam
                LEFT JOIN hms_doc ON (hd_docno = he_docno)
                LEFT JOIN hms_object ON (ho_id = hd_object)
                WHERE he_examdate BETWEEN $1::timestamp AND $2::timestamp
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
     * 3. Biến động bệnh nhân Điều trị nội trú
     */
    static async getInpatientStatistics(fromDate: string, toDate: string) {
        const sql = `
            SELECT 
                sd_id AS dept_id,
                sd_name AS dept_name,
                COALESCE(SUM(bn_dau_ky), 0) AS dau_ky,
                COALESCE(SUM(bn_vao_vien), 0) AS vao_vien,
                COALESCE(SUM(bn_chuyen_den), 0) AS chuyen_den,
                COALESCE(SUM(bn_chuyen_di), 0) AS chuyen_di,
                COALESCE(SUM(bn_ra_vien), 0) AS ra_vien,
                COALESCE(SUM(bn_tu_vong), 0) AS tu_vong,
                COALESCE(SUM(bn_hien_dien), 0) AS hien_dien
            FROM sys_dept
            LEFT JOIN (
                SELECT htr_deptid, 1 AS bn_dau_ky, 0 AS bn_vao_vien, 0 AS bn_chuyen_den, 0 AS bn_chuyen_di, 0 AS bn_ra_vien, 0 AS bn_tu_vong, 0 AS bn_hien_dien
                FROM hms_treatment_record
                WHERE htr_status = 'I' AND htr_admitdate < $1::timestamp
                
                UNION ALL
                SELECT htr_deptid, 0, 1, 0, 0, 0, 0, 0
                FROM hms_treatment_record
                WHERE htr_idx = 1 AND htr_admitdate BETWEEN $1::timestamp AND $2::timestamp
                
                UNION ALL
                SELECT htr_deptid, 0, 0, 1, 0, 0, 0, 0
                FROM hms_treatment_record
                WHERE htr_idx > 1 AND htr_admitdate BETWEEN $1::timestamp AND $2::timestamp
                
                UNION ALL
                SELECT htr_deptid, 0, 0, 0, 1, 0, 0, 0
                FROM hms_treatment_record
                WHERE htr_status = 'T' AND htr_dischargedate BETWEEN $1::timestamp AND $2::timestamp AND htr_suggestion = 'M'
                
                UNION ALL
                SELECT htr_deptid, 0, 0, 0, 0, 1, 0, 0
                FROM hms_treatment_record
                LEFT JOIN hms_clinical_record ON (hcr_docno = htr_docno)
                WHERE htr_status = 'T' AND htr_dischargedate BETWEEN $1::timestamp AND $2::timestamp 
                  AND htr_suggestion IN ('D', 'T') AND (hcr_result NOT IN ('5', '6') OR hcr_result IS NULL)
                  
                UNION ALL
                SELECT htr_deptid, 0, 0, 0, 0, 0, 1, 0
                FROM hms_treatment_record
                LEFT JOIN hms_clinical_record ON (hcr_docno = htr_docno)
                WHERE htr_status = 'T' AND htr_dischargedate BETWEEN $1::timestamp AND $2::timestamp 
                  AND htr_suggestion IN ('D', 'T') AND hcr_result IN ('5', '6')
                  
                UNION ALL
                SELECT htr_deptid, 0, 0, 0, 0, 0, 0, 1
                FROM hms_treatment_record
                WHERE htr_status = 'I' AND htr_admitdate <= $2::timestamp
            ) tbl ON (tbl.htr_deptid = sd_id)
            WHERE (sd_isactive = 'Y' OR sd_isactive IS NULL)
            GROUP BY sd_id, sd_name
            ORDER BY sd_id
        `;
        const res = await query(sql, [fromDate, toDate]);
        return res.rows;
    }

    /**
     * 4. Thống kê Cận lâm sàng
     */
    static async getParaclinicalStatistics(fromDate: string, toDate: string, deptId?: string) {
        let whereClause = `inv.hfe_date BETWEEN $1::timestamp AND $2::timestamp AND SUBSTR(f.hfe_group, 1, 1) = 'B' AND inv.hfe_status = 'P'`;
        const params: any[] = [fromDate, toDate];

        if (deptId) {
            params.push(deptId);
            whereClause += ` AND f.hfe_deptid = $${params.length}`;
        }

        const sql = `
            SELECT 
                COALESCE(f.hfe_group, 'B0000') AS group_id,
                COALESCE(g.hfg_name, 'Cận lâm sàng') AS group_name,
                COUNT(DISTINCT inv.hfe_docno) AS tong_so_bn,
                COUNT(1) AS tong_so_ca,
                SUM(CASE WHEN f.hfe_type IN ('I', 'D', 'C') THEN 1 ELSE 0 END) AS ca_bhyt,
                SUM(CASE WHEN f.hfe_type NOT IN ('I', 'D', 'C') OR f.hfe_type IS NULL THEN 1 ELSE 0 END) AS ca_dichvu,
                COALESCE(SUM(f.hfe_cost), 0) AS tong_thanh_tien
            FROM hms_fee_invoice inv
            JOIN hms_fee f ON (f.hfe_invoiceno = inv.hfe_invoiceno)
            LEFT JOIN hms_fee_group g ON (g.hfg_id = f.hfe_group)
            WHERE ${whereClause}
            GROUP BY f.hfe_group, g.hfg_name
            ORDER BY f.hfe_group
        `;
        const res = await query(sql, params);
        return res.rows;
    }

    /**
     * 5. Phẫu thuật - Thủ thuật theo Phân loại
     */
    static async getSurgeryStatistics(fromDate: string, toDate: string) {
        const sql = `
            SELECT 
                ho_deptid AS dept_id,
                COALESCE(sd.sd_name, ho_deptid, 'Khoa Khám Bệnh') AS dept_name,
                COUNT(DISTINCT ho_docno) AS tong_benh_nhan,
                COUNT(1) AS tong_so_ca,
                SUM(CASE WHEN hfl_groupid IN ('B4001', 'B4100') OR hfl_operation_group = 'DB' OR hfl_name ILIKE '%đặc biệt%' THEN 1 ELSE 0 END) AS loai_dac_biet,
                SUM(CASE WHEN hfl_groupid IN ('B4002', 'B4200') OR hfl_operation_group = 'L1' OR hfl_name ILIKE '%loại 1%' OR hfl_name ILIKE '%loại I%' THEN 1 ELSE 0 END) AS loai_1,
                SUM(CASE WHEN hfl_groupid IN ('B4003', 'B4300') OR hfl_operation_group = 'L2' OR hfl_name ILIKE '%loại 2%' OR hfl_name ILIKE '%loại II%' THEN 1 ELSE 0 END) AS loai_2,
                SUM(CASE WHEN hfl_groupid IN ('B4004', 'B4400') OR hfl_operation_group = 'L3' OR hfl_name ILIKE '%loại 3%' OR hfl_name ILIKE '%loại III%' THEN 1 ELSE 0 END) AS loai_3,
                SUM(CASE WHEN (hfl_groupid LIKE 'B5%' OR hfl_groupid NOT LIKE 'B4%') AND (hfl_operation_group NOT IN ('DB', 'L1', 'L2', 'L3') OR hfl_operation_group IS NULL) THEN 1 ELSE 0 END) AS thu_thuat
            FROM hms_operation
            LEFT JOIN hms_feelist ON (hfl_feeid = ho_itemid)
            LEFT JOIN sys_dept sd ON (sd.sd_id = ho_deptid)
            WHERE ho_performdate BETWEEN $1::timestamp AND $2::timestamp
              AND ho_status = 'T'
            GROUP BY ho_deptid, sd.sd_name
            ORDER BY ho_deptid
        `;
        const res = await query(sql, [fromDate, toDate]);
        return res.rows;
    }

    /**
     * 6. Tổng hợp chi phí theo Khoa phòng (Tối ưu hóa truy vấn kết hợp hms_fee_invoice & hms_fee)
     */
    static async getDepartmentCostStatistics(fromDate: string, toDate: string) {
        const sql = `
            SELECT 
                f.hfe_deptid AS dept_id,
                COALESCE(sd.sd_name, f.hfe_deptid, 'Khác') AS dept_name,
                COUNT(DISTINCT inv.hfe_docno) AS tong_luot_bn,
                COALESCE(SUM(CASE WHEN f.hfe_group = 'D0000' THEN f.hfe_cost ELSE 0 END), 0) AS tien_kham,
                COALESCE(SUM(CASE WHEN f.hfe_group = 'C0000' THEN f.hfe_cost ELSE 0 END), 0) AS tien_giuong,
                COALESCE(SUM(CASE WHEN SUBSTR(f.hfe_group, 1, 2) = 'B1' THEN f.hfe_cost ELSE 0 END), 0) AS tien_xet_nghiem,
                COALESCE(SUM(CASE WHEN SUBSTR(f.hfe_group, 1, 2) = 'B2' THEN f.hfe_cost ELSE 0 END), 0) AS tien_cdha,
                COALESCE(SUM(CASE WHEN SUBSTR(f.hfe_group, 1, 2) = 'B3' THEN f.hfe_cost ELSE 0 END), 0) AS tien_tdcn,
                COALESCE(SUM(CASE WHEN SUBSTR(f.hfe_group, 1, 2) IN ('B4', 'B5') THEN f.hfe_cost ELSE 0 END), 0) AS tien_pttt,
                COALESCE(SUM(CASE WHEN SUBSTR(f.hfe_group, 1, 1) = 'A' AND SUBSTR(f.hfe_group, 1, 2) NOT IN ('A4', 'A9') THEN f.hfe_cost ELSE 0 END), 0) AS tien_thuoc,
                COALESCE(SUM(CASE WHEN SUBSTR(f.hfe_group, 1, 2) = 'A4' THEN f.hfe_cost ELSE 0 END), 0) AS tien_mau,
                COALESCE(SUM(CASE WHEN SUBSTR(f.hfe_group, 1, 2) = 'A9' THEN f.hfe_cost ELSE 0 END), 0) AS tien_vtyt,
                COALESCE(SUM(CASE WHEN f.hfe_group = 'F0000' THEN f.hfe_cost ELSE 0 END), 0) AS tien_khac,
                COALESCE(SUM(f.hfe_cost), 0) AS tong_cong_chi_phi,
                COALESCE(SUM(f.hfe_discount), 0) AS bhyt_thanh_toan,
                COALESCE(SUM(f.hfe_patpaid), 0) AS benh_nhan_tra
            FROM hms_fee_invoice inv
            JOIN hms_fee f ON (f.hfe_invoiceno = inv.hfe_invoiceno)
            LEFT JOIN sys_dept sd ON (sd.sd_id = f.hfe_deptid)
            WHERE inv.hfe_date BETWEEN $1::timestamp AND $2::timestamp
              AND inv.hfe_status = 'P'
            GROUP BY f.hfe_deptid, sd.sd_name
            ORDER BY f.hfe_deptid
        `;
        const res = await query(sql, [fromDate, toDate]);
        return res.rows;
    }

    /**
     * 7. Công suất sử dụng Giường bệnh
     */
    static async getBedOccupancyStatistics() {
        const sql = `
            SELECT 
                sd.sd_id AS dept_id,
                sd.sd_name AS dept_name,
                COALESCE(b.giuong_ke_hoach, 20) AS giuong_ke_hoach,
                COALESCE(b.giuong_thuc_ke, 20) AS giuong_thuc_ke,
                COALESCE(t.bn_dang_nam, 0) AS bn_dang_nam,
                ROUND(
                    CASE 
                        WHEN COALESCE(b.giuong_ke_hoach, 20) > 0 
                        THEN (COALESCE(t.bn_dang_nam, 0)::numeric / COALESCE(b.giuong_ke_hoach, 20)::numeric) * 100 
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
                GROUP BY htr_deptid
            ) t ON t.htr_deptid = sd.sd_id
            WHERE (sd.sd_isactive = 'Y' OR sd.sd_isactive IS NULL)
            ORDER BY sd.sd_id
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
                COUNT(DISTINCT he_docno) AS tong_kham,
                COUNT(DISTINCT CASE WHEN ho_type IN ('I', 'D', 'C') THEN he_docno END) AS bhyt,
                COUNT(DISTINCT CASE WHEN ho_type NOT IN ('I', 'D', 'C') OR ho_type IS NULL THEN he_docno END) AS vien_phi
            FROM hms_exam
            LEFT JOIN hms_doc ON (hd_docno = he_docno)
            LEFT JOIN hms_object ON (ho_id = hd_object)
            WHERE he_examdate BETWEEN $1::timestamp AND $2::timestamp
              AND he_status IN ('P', 'T')
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
