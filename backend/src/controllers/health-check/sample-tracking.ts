import { Request, Response } from 'express';
import { query } from '../../config/database';

class SampleTrackingController {
    // 1. GET /api/v1/health-check-sync/samples/slips
    // 1. GET /api/v1/health-check-sync/samples/slips
    async getSampleSlips(req: Request, res: Response) {
        try {
            const { startDate, endDate, deptId } = req.query;
            const todayStr = new Date().toISOString().split('T')[0];
            const params: any[] = [startDate || todayStr, endDate || todayStr];
            let deptFilter = '';

            if (deptId && deptId !== 'All' && deptId !== '') {
                params.push(deptId);
                deptFilter = ` AND htb_deptid = $3 `;
            }

            const sql = `
                SELECT 
                    htb_batch_id AS id,
                    htb_deptid AS department,
                    htb_createddate AS "createdAt",
                    htb_createdby AS "createdBy",
                    htb_status AS status,
                    htb_tuberculosis AS kth,
                    htb_accepteddate AS "acceptedDate",
                    htb_acceptedby AS "acceptedBy"
                FROM hms_testorder_batch
                WHERE 1=1
                  AND DATE(htb_createddate) BETWEEN DATE($1) AND DATE($2)
                  ${deptFilter}
                ORDER BY htb_batch_id DESC
            `;

            const dbRes = await query(sql, params);
            return res.json(dbRes.rows);
        } catch (error: any) {
            console.error('❌ Lỗi getSampleSlips:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // 2. GET /api/v1/health-check-sync/samples/slips/:slipId/patients
    async getSampleSlipPatients(req: Request, res: Response) {
        try {
            const { slipId } = req.params;
            const slipIdVal = parseInt(String(slipId || ''), 10) || 0;

            const sql = `
                ( SELECT distinct hpc_orderid,   hpc_docno,   hpc_sid,   hp_surname   ||' '   ||hp_midname   ||' '   ||hp_firstname AS pname,   hpc_orderdate, hpc_roomid,    hfg_deptid, hfg_name,     limsoe_map_by, TO_CHAR(limsoe_map_date, 'dd/MM/yyyy HH24:MI:ss') as limsoe_map_date, limsoe_sample_by, TO_CHAR(limsoe_sample_date, 'dd/MM/yyyy HH24:MI:ss') as limsoe_sample_date, limsoe_batch_adddate,     case when hpc_orderdate>limsoe_sample_date then true else false end as err0,     case when (COALESCE(limsoe_receive_date,now()) - limsoe_sample_date > INTERVAL '60 MINUTE') then true else false end as err1   
                  FROM hms_testorder,   hms_patient, lims_order_extra, hms_fee_group  
                  WHERE hp_patientno        = hpc_patientno  and limsoe_docno=hpc_docno and limsoe_orderid = hpc_orderid  and limsoe_sample IN('Y','P') and limsoe_map='Y'  and hfg_id = hpc_groupid   and COALESCE(limsoe_batch_id, 0) > 0 and limsoe_batch_id=$1 )  
                UNION ALL 
                ( SELECT distinct hpc_orderid,   hpc_docno,   hpc_sid,   hp_surname   ||' '   ||hp_midname   ||' '   ||hp_firstname AS pname,   hpc_orderdate, hpc_roomid,    hfg_deptid, hfg_name,     limsoe_map_by, TO_CHAR(limsoe_map_date, 'dd/MM/yyyy HH24:MI:ss') as limsoe_map_date, limsoe_sample_by, TO_CHAR(limsoe_sample_date, 'dd/MM/yyyy HH24:MI:ss') as limsoe_sample_date, limsoe_batch_adddate,     case when hpc_orderdate>limsoe_sample_date then true else false end as err0,     case when (COALESCE(limsoe_receive_date,now()) - limsoe_sample_date > INTERVAL '60 MINUTE') then true else false end as err1   
                  FROM hms_pacsorder,   hms_patient, lims_order_extra, hms_fee_group  
                  WHERE hp_patientno        = hpc_patientno  and limsoe_docno=hpc_docno and limsoe_orderid = hpc_orderid  and limsoe_sample IN('Y','P') and limsoe_map='Y'  and hfg_id = hpc_groupid   and COALESCE(limsoe_batch_id, 0) > 0 and limsoe_batch_id=$1 )  
                ORDER BY limsoe_batch_adddate, pname, hpc_sid
            `;

            const dbRes = await query(sql, [slipIdVal]);
            return res.json(dbRes.rows);
        } catch (error: any) {
            console.error('❌ Lỗi getSampleSlipPatients:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // 3. GET /api/v1/health-check-sync/samples/orders/:orderId/items
    async getPatientTestDetails(req: Request, res: Response) {
        try {
            const { orderId } = req.params;
            const orderIdVal = parseInt(String(orderId || ''), 10) || 0;

            const sql = `
                SELECT f.hfl_name AS name, t.hpcl_comment AS comment, t.hpcl_orderlineid, t.hpcl_orderid
                FROM hms_testorderline t
                LEFT JOIN hms_fee_list f ON f.hfl_feeid = t.hpcl_itemid
                WHERE t.hpcl_orderid = $1 AND t.hpcl_hasfee = 'Y'
                ORDER BY t.hpcl_orderlineid
            `;

            const dbRes = await query(sql, [orderIdVal]);
            return res.json(dbRes.rows);
        } catch (error: any) {
            console.error('❌ Lỗi getPatientTestDetails:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // 4. GET /api/v1/health-check-sync/samples/cancelled
    async getCancelledSamples(req: Request, res: Response) {
        try {
            const sql = `
                SELECT DISTINCT
                    limsoe_orderid AS "orderId",
                    limsoe_docno AS "docNo",
                    get_patientname(limsoe_docno) AS "patientName",
                    limsoe_sample_by AS "cancelledBy",
                    TO_CHAR(limsoe_sample_date, 'dd/MM/yyyy HH24:MI:ss') AS "cancelledDate",
                    limsoe_comment AS "reason"
                FROM lims_order_extra
                WHERE limsoe_sample = 'C' OR limsoe_sample = 'N'
                ORDER BY "cancelledDate" DESC
                LIMIT 50
            `;
            const dbRes = await query(sql);
            return res.json(dbRes.rows);
        } catch (error: any) {
            console.error('❌ Lỗi getCancelledSamples:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // 5. POST /api/v1/health-check-sync/samples/receive
    async confirmSampleReceipt(req: Request, res: Response) {
        try {
            const { ids, username } = req.body; // ids: array of limsoe_orderid
            if (!Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({ error: 'Thiếu tham số: ids' });
            }

            const currentUser = username || (req as any).user?.username || 'vuthihang';
            // Update lims_order_extra receive status
            await query(`
                UPDATE lims_order_extra
                SET limsoe_receive = 'Y',
                    limsoe_receive_date = NOW(),
                    limsoe_receive_by = $1
                WHERE limsoe_orderid = ANY($2)
            `, [currentUser, ids]);

            return res.json({ success: true });
        } catch (error: any) {
            console.error('❌ Lỗi confirmSampleReceipt:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // 6. POST /api/v1/health-check-sync/samples/cancel
    async cancelSampleReceipt(req: Request, res: Response) {
        try {
            const { ids, reason, username } = req.body;
            if (!Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({ error: 'Thiếu tham số: ids' });
            }

            const currentUser = username || (req as any).user?.username || 'dtgiang';
            // Cancel receipt in lims_order_extra
            await query(`
                UPDATE lims_order_extra
                SET limsoe_receive = 'N',
                    limsoe_sample = 'C',
                    limsoe_comment = $1,
                    limsoe_receive_date = NOW(),
                    limsoe_receive_by = $2
                WHERE limsoe_orderid = ANY($3)
            `, [reason || 'Mẫu bị đông / Hủy lấy lại', currentUser, ids]);

            return res.json({ success: true });
        } catch (error: any) {
            console.error('❌ Lỗi cancelSampleReceipt:', error);
            return res.status(500).json({ error: error.message });
        }
    }
}

export const sampleTrackingController = new SampleTrackingController();
