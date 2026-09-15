import { Request, Response } from 'express';
import { query, transaction } from '../../config/database';
import { hisIntegrationController } from './his-integration';

export class OrderController {
    /**
     * Kê dịch vụ Cận lâm sàng từ HIS Core (tương tự HMSParaclinicalDialog.cpp trong C++)
     * sau đó tự động đồng bộ sang bảng health_check_documents
     */
    async createHisParaclinicOrder(req: Request, res: Response) {
        const { docNo, patientNo: reqPatientNo, patientId, doctorId, doctorName, deptId, roomId, items } = req.body;

        if (!docNo) {
            return res.status(400).json({ error: 'Thiếu số hồ sơ khám (docNo)' });
        }

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Danh sách dịch vụ chỉ định rỗng' });
        }

        const numericDocNo = Number(docNo);
        const effectiveDept = String(deptId || 'KKB').trim();
        const effectiveRoom = Number(roomId || 1);
        const effectiveDoctor = String(doctorId || 'ADMINISTRATOR').trim();
        const effectiveCreatedBy = (req as any).user?.username || effectiveDoctor;

        try {
            // 1. Tìm patientNo từ hms_doc nếu chưa có
            let patientNo = reqPatientNo ? Number(reqPatientNo) : 0;
            if (!patientNo) {
                const docRes = await query('SELECT hd_patientno FROM hms_doc WHERE hd_docno = $1', [numericDocNo]);
                if (docRes.rows.length > 0) {
                    patientNo = Number(docRes.rows[0].hd_patientno || 0);
                }
            }

            // 2. Tra cứu nhóm dịch vụ (hfl_groupid) cho từng item
            const feeCodes = items.map((it: any) => String(it.service_code || it.item_id || it.code || '').trim()).filter(Boolean);
            const feeRes = await query(`
                SELECT TRIM(hfl_feeid) as fee_id, TRIM(hfl_groupid) as group_id, hfl_name as name, hfl_unit as unit, COALESCE(hfl_servprice, 0) as price
                FROM hms_fee_list 
                WHERE TRIM(hfl_feeid) = ANY($1)
            `, [feeCodes]);

            const feeMap = new Map<string, any>();
            for (const r of feeRes.rows) {
                feeMap.set(r.fee_id, r);
            }

            // 3. Phân nhóm các dịch vụ theo group_id
            const groupedItems = new Map<string, any[]>();
            for (const item of items) {
                const code = String(item.service_code || item.item_id || item.code || '').trim();
                const feeInfo = feeMap.get(code);
                const groupId = String(feeInfo?.group_id || item.group_id || 'B1100').trim();
                
                if (!groupedItems.has(groupId)) {
                    groupedItems.set(groupId, []);
                }
                groupedItems.get(groupId)!.push({
                    code,
                    name: item.service_name || feeInfo?.name || code,
                    unit: item.unit || feeInfo?.unit || '',
                    qty: Number(item.qty || 1),
                    note: String(item.note || '').trim(),
                    groupId
                });
            }

            const createdOrderIds: number[] = [];
            const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

            // 4. Kê từng nhóm dịch vụ vào HIS Core (Test hoặc PACS)
            await transaction(async (client) => {
                for (const [groupId, groupItemList] of groupedItems.entries()) {
                    let orderId = 0;
                    const isTestGroup = groupId.startsWith('B1') || groupId.startsWith('A');

                    // Gọi Stored Procedure hms_paraclinic_add với type cast chuẩn PostgreSQL
                    const spAddRes = await client.query(`
                        SELECT hms_paraclinic_add(
                            $1::varchar, 
                            $2::varchar, 
                            $3::integer, 
                            $4::integer, 
                            $5::integer, 
                            $6::integer, 
                            $7::integer, 
                            $8::varchar, 
                            $9::varchar, 
                            $10::varchar, 
                            $11::varchar, 
                            $12::varchar, 
                            $13::integer
                        ) AS order_id
                    `, [
                        effectiveCreatedBy,
                        effectiveDept,
                        0, // refidx
                        effectiveRoom,
                        0, // bedid
                        patientNo,
                        numericDocNo,
                        nowStr, // orderdate string
                        effectiveDoctor,
                        groupId,
                        'O',
                        'RM',
                        0 // treatidx
                    ]);

                    if (spAddRes.rows.length > 0 && Number(spAddRes.rows[0].order_id) > 0) {
                        orderId = Number(spAddRes.rows[0].order_id);
                    }

                    if (orderId > 0) {
                        createdOrderIds.push(orderId);

                        // Thêm từng dòng chi tiết dịch vụ qua hms_paraclinic_addline
                        for (const it of groupItemList) {
                            await client.query(`
                                SELECT hms_paraclinic_addline(
                                    $1::integer, 
                                    $2::integer, 
                                    $3::varchar, 
                                    $4::varchar, 
                                    $5::varchar, 
                                    $6::numeric, 
                                    $7::varchar
                                ) AS result
                            `, [
                                numericDocNo,
                                orderId,
                                it.code,
                                groupId,
                                'RM',
                                it.qty,
                                it.note || ''
                            ]);
                        }

                        // Cập nhật trạng thái phiếu sang 'S' (Submitted - Chính thức chuyển thực hiện)
                        if (isTestGroup) {
                            await client.query(`UPDATE hms_testorder SET hpc_status = 'S', hpc_orderdate = NOW() WHERE hpc_orderid = $1`, [orderId]);
                        } else {
                            await client.query(`UPDATE hms_pacsorder SET hpc_status = 'S', hpc_orderdate = NOW() WHERE hpc_orderid = $1`, [orderId]);
                        }
                    }
                }
            });

            // 5. Tự động đồng bộ toàn bộ Cận lâm sàng từ HIS sang Hồ sơ Khám sức khỏe
            const freshLabData = await hisIntegrationController.fetchStructuredParaclinicalData(numericDocNo);

            // Cập nhật vào bảng health_check_details
            await query(`
                UPDATE health_check_details d
                SET lab_data = $1, updated_at = NOW()
                FROM health_check_masters m
                WHERE d.master_id = m.id
                  AND (m.his_doc_no = $2 OR m.doc_no = $3 OR m.patient_id = $4)
            `, [
                JSON.stringify(freshLabData),
                String(numericDocNo),
                String(docNo),
                patientId || String(patientNo)
            ]);

            // Cập nhật vào bảng health_check_documents (nếu có để tương thích)
            try {
                await query(`
                    UPDATE health_check_documents 
                    SET json_data = jsonb_set(
                        COALESCE(json_data, '{}'::jsonb), 
                        '{lab_data}', 
                        $1::jsonb
                    ),
                    updated_at = NOW()
                    WHERE doc_no = $2 OR patient_id = $3
                `, [
                    JSON.stringify(freshLabData),
                    String(numericDocNo),
                    patientId || String(patientNo)
                ]);
            } catch (ignoreErr) {}

            return res.json({
                success: true,
                message: 'Đã kê chỉ định dịch vụ Cận lâm sàng vào HIS và đồng bộ sang KSK thành công',
                orderIds: createdOrderIds,
                labData: freshLabData
            });

        } catch (error: any) {
            console.error('❌ Lỗi createHisParaclinicOrder:', error);
            return res.status(500).json({ error: error.message || 'Lỗi xử lý chỉ định CLS trên HIS' });
        }
    }

    /**
     * Hủy dịch vụ Cận lâm sàng đã chỉ định trên HIS
     */
    async cancelHisParaclinicItem(req: Request, res: Response) {
        const { docNo, orderId, serviceCode } = req.body;

        if (!docNo || !serviceCode) {
            return res.status(400).json({ error: 'Thiếu docNo hoặc serviceCode' });
        }

        const numericDocNo = Number(docNo);
        const code = String(serviceCode).trim();

        try {
            await transaction(async (client) => {
                if (orderId) {
                    await client.query(`
                        DELETE FROM hms_testorderline 
                        WHERE hpcl_docno = $1 AND hpcl_orderid = $2 AND TRIM(hpcl_itemid) = $3
                    `, [numericDocNo, Number(orderId), code]);

                    await client.query(`
                        DELETE FROM hms_pacsorderline 
                        WHERE hpcl_docno = $1 AND hpcl_orderid = $2 AND TRIM(hpcl_itemid) = $3
                    `, [numericDocNo, Number(orderId), code]);
                } else {
                    await client.query(`
                        DELETE FROM hms_testorderline 
                        WHERE hpcl_docno = $1 AND TRIM(hpcl_itemid) = $2
                    `, [numericDocNo, code]);

                    await client.query(`
                        DELETE FROM hms_pacsorderline 
                        WHERE hpcl_docno = $1 AND TRIM(hpcl_itemid) = $2
                    `, [numericDocNo, code]);
                }
            });

            // Đồng bộ lại kết quả vào health_check_details
            const freshLabData = await hisIntegrationController.fetchStructuredParaclinicalData(numericDocNo);

            await query(`
                UPDATE health_check_details d
                SET lab_data = $1, updated_at = NOW()
                FROM health_check_masters m
                WHERE d.master_id = m.id
                  AND (m.his_doc_no = $2 OR m.doc_no = $2)
            `, [
                JSON.stringify(freshLabData),
                String(numericDocNo)
            ]);

            try {
                await query(`
                    UPDATE health_check_documents 
                    SET json_data = jsonb_set(
                        COALESCE(json_data, '{}'::jsonb), 
                        '{lab_data}', 
                        $1::jsonb
                    ),
                    updated_at = NOW()
                    WHERE doc_no = $2
                `, [
                    JSON.stringify(freshLabData),
                    String(numericDocNo)
                ]);
            } catch (ignoreErr) {}

            return res.json({
                success: true,
                message: 'Đã hủy dịch vụ chỉ định trên HIS thành công',
                labData: freshLabData
            });

        } catch (error: any) {
            console.error('❌ Lỗi cancelHisParaclinicItem:', error);
            return res.status(500).json({ error: error.message || 'Lỗi hủy chỉ định CLS trên HIS' });
        }
    }
}

export const orderController = new OrderController();
