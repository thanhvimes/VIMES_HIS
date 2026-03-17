// ==================== PORTAL HISTORY CONTROLLER ====================
// File: backend/src/controllers/portal/history.controller.ts

import { Response } from 'express';
import { query } from '../../config/database';
import { AuthRequest } from '../../middleware/authMiddleware';
import axios from 'axios';

export interface VitalSigns {
    pulse?: number;
    temp?: number;
    bp_sys?: number;
    bp_dia?: number;
    breath?: number;
    weight?: number;
    height?: number;
    bmi?: number;
}

class PortalHistoryController {
    /**
     * Get Clinical History (Using selected PID from Profile Selection)
     */
    async getHistoryList(req: AuthRequest, res: Response) {
        try {
            const patientId = (req as any).query.patientId as string;
            const accountId = req.userId;

            if (!patientId) return res.status(400).json({ error: 'Thiếu patientId' });

            // Security check
            const linkCheck = await query('SELECT 1 FROM portal_patient_links WHERE account_id = $1 AND patient_no = $2', [accountId, patientId]);
            if (linkCheck.rows.length === 0) {
                return res.status(403).json({ error: 'Bạn không có quyền xem hồ sơ này' });
            }

            const result = await query(`
                SELECT hd_docno                       AS id,
                  hd_patientno                        AS patientId,
                  TO_CHAR(hd_admitdate, 'DD/MM/YYYY') AS date,
                  (SELECT sd_name FROM sys_dept WHERE sd_id = hd_admitdept
                  )                          AS dept,
                  hms_getusername(hd_doctor) AS doctor,
                  hd_diagnostic              AS diagnosis
                FROM hms_doc
                WHERE hd_patientno::text = $1
                ORDER BY hd_admitdate DESC
            `, [patientId]);

            return res.json(result.rows);
        } catch (error) {
            console.error('❌ Get History List Error:', error);
            return res.status(500).json({ error: 'Lỗi khi tải lịch sử khám' });
        }
    }

    /**
     * Get History Detail
     */
    async getHistoryDetail(req: AuthRequest, res: Response) {
        try {
            const { visitId } = (req as any).params;
            const patientId = (req as any).query.patientId as string;
            const accountId = req.userId;

            if (!patientId) return res.status(400).json({ error: 'Thiếu patientId' });

            // Security check
            const linkCheck = await query('SELECT 1 FROM portal_patient_links WHERE account_id = $1 AND patient_no = $2', [accountId, patientId]);
            if (linkCheck.rows.length === 0) {
                return res.status(403).json({ error: 'Bạn không có quyền xem hồ sơ này' });
            }

            // 1. Get exam details
            const examResult = await query(`
                SELECT 
                    hd_docno as id,
                    TO_CHAR(hd_admitdate, 'DD/MM/YYYY HH24:MI') as date,
                    hms_getusername(hd_doctor) as doctor,
                    (SELECT sd_name FROM sys_dept WHERE sd_id = hd_admitdept) as dept,
                    hd_diagnostic as diagnosis                    
                FROM hms_doc
                WHERE hd_docno = $1 AND hd_patientno::text = $2
            `, [visitId, patientId]);

            if (examResult.rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy chi tiết' });

            const exam = examResult.rows[0];

            // 1.1. Get vital signs
            const vitalResult = await query(`
                SELECT he_pulse as pulse,
                  he_temperature as temp,
                  he_bloodpressure as bp_sys,
                  he_bloodpressurex as bp_dia,
                  he_breathinterval as breath,
                  he_weight as weight,
                  he_height as height,
                  he_bmi as bmi
                FROM hms_exam
                WHERE he_docno = $1
                AND (he_bmi + he_pulse + he_temperature + he_weight) > 0
                LIMIT 1
            `, [visitId]);

            const vitals: VitalSigns = vitalResult.rows[0] || {};

            // 2. Get Prescriptions
            const prescriptionResult = await query(`
                SELECT hpo_orderid as orderid, hpo_orderdate as date,
                hms_getusername(hpo_doctor) as doctor,
                'D' AS ordertype,
                hpol_line,
                hpol_product_id,
                hpol_productname AS name,
                hpol_productuom AS unit,
                hpol_usage AS usage,
                SUM(hpol_qtyorder)                AS quantity,
                SUM(hpol_qtyorder * hpol_unitprice) AS hpol_amount,
                hpol_generic,
                hpol_content
                FROM hms_pharmaorder
                LEFT JOIN hms_pharmaorderline_view ON(hpol_docno = hpo_docno AND hpol_orderid = hpo_orderid)
                WHERE hpo_docno = $1
                AND hpol_producttype NOT IN('A1700', 'A1800', 'A1300', 'A1130', 'A1140')
                GROUP BY hpo_orderid, hpo_orderdate, hpo_doctor, hpol_orderid, hpol_line, hpol_product_id, hpol_productname, hpol_productuom, hpol_generic, hpol_usage, hpol_content
                ORDER BY hpol_orderid, hpol_line
            `, [visitId]);

            // 3. Get Paraclinical
            const paraclinicalResult = await query(`
                SELECT DISTINCT hpc_orderid AS orderid,
                hfg_name AS gname,
                TO_CHAR(hpc_orderdate, 'DD/MM/YYYY HH24:MI') AS orderdate,
                TO_CHAR(hpc_performdate, 'DD/MM/YYYY HH24:MI') AS performdate,
                hpc_order_type AS ordertype,
                hpcl_itemid as itemid
                FROM hmsv_paraclinic
                LEFT JOIN hmsv_paraclinical_line ON(hpc_docno = hpcl_docno AND hpc_orderid = hpcl_orderid)
                LEFT JOIN hms_fee_group ON(hfg_id = hpc_groupid)
                WHERE hpc_docno = $1
                ORDER BY hpc_orderid
            `, [visitId]);

            return res.json({
                ...exam,
                vitals: {
                    bp: `${vitals.bp_sys || '--'} / ${vitals.bp_dia || '--'}`,
                    hr: vitals.pulse || '--',
                    temp: vitals.temp || '--',
                    weight: vitals.weight || '--',
                    height: vitals.height || '--',
                    bmi: vitals.bmi || '--',
                    breath: vitals.breath || '--'
                },
                prescriptions: prescriptionResult.rows,
                paraclinical: paraclinicalResult.rows
            });
        } catch (error) {
            console.error('❌ Get History Detail Error:', error);
            return res.status(500).json({ error: 'Lỗi khi tải chi tiết' });
        }
    }

    /**
     * Download File from HIS proxy
     */
    async downloadHisPdf(req: AuthRequest, res: Response) {
        try {
            const { filename } = (req as any).body;
            if (!filename) {
                return res.status(400).json({ success: false, message: 'Filename is required' });
            }

            const lvHost = process.env.LV_HOST || '10.1.3.214';
            const lvPort = process.env.LV_PORT || '8003';
            const apiUrl = `http://${lvHost}:${lvPort}/api/v1/fs/download`;

            const response = await axios.post(apiUrl, {
                uid: "",
                filename: filename,
                dbname: "vimes_jsc"
            }, {
                responseType: 'arraybuffer'
            });

            const data = response.data as Buffer;
            let pdfBuffer = data;
            const isPdf = data.length > 4 && data.toString('utf8', 0, 4) === '%PDF';

            if (!isPdf) {
                const textData = data.toString('utf8');
                const cleanBase64 = textData.replace(/"/g, '').trim();
                // Basic validation for base64
                if (/^[A-Za-z0-9+/=]+$/.test(cleanBase64)) {
                    pdfBuffer = Buffer.from(cleanBase64, 'base64');
                }
            }

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="${filename}.pdf"`);
            return res.send(pdfBuffer);

        } catch (error: any) {
            console.error('❌ [HIS Download] Error:', error.message);
            return res.status(500).json({ success: false, message: 'Failed to download file from HIS' });
        }
    }

    /**
     * Get Signed PDF Filename from HIS
     */
    async getSignedFile(req: AuthRequest, res: Response) {
        try {
            const { type, patientId, visitId, orderId, serviceCode = '', itemId = '' } = (req as any).body;
            const accountId = req.userId;

            if (!type || !patientId || !orderId) {
                return res.status(400).json({ error: 'Thiếu thông tin (type, patientId, orderId)' });
            }

            // Security Check
            const linkCheck = await query('SELECT 1 FROM portal_patient_links WHERE account_id = $1 AND patient_no = $2', [accountId, patientId]);
            if (linkCheck.rows.length === 0) {
                return res.status(403).json({ error: 'Bạn không có quyền truy cập hồ sơ này' });
            }

            const result = await query(`
                SELECT emr_get_sign_id($1, $2, $3, '', $4) as filename
            `, [String(type), String(visitId || 0), String(orderId || 0), String(itemId || serviceCode)]);

            if (result.rows.length === 0 || !result.rows[0].filename) {
                return res.status(404).json({ error: 'Chưa có file ký số' });
            }

            return res.json({ success: true, filename: result.rows[0].filename });

        } catch (error) {
            console.error('❌ Get Signed File Error:', error);
            return res.status(500).json({ error: 'Lỗi khi lấy thông tin file ký' });
        }
    }
}

export default new PortalHistoryController();
