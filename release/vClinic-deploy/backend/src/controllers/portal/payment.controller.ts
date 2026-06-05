// ==================== PORTAL PAYMENT CONTROLLER ====================
// File: backend/src/controllers/portal/payment.controller.ts

import { Response } from 'express';
import { query } from '../../config/database';
import { AuthRequest } from '../../middleware/authMiddleware';
import axios from 'axios';

export interface QRPayload {
    orderid: number;
    docno: string | number;
    description: string;
    billNumber: number;
    amount: number;
    deptid: string;
    userid: string;
    type: string;
    insinvoice: number;
    transactionAmount: number;
}

class PortalPaymentController {
    /**
     * Get Invoices (Billing)
     */
    async getInvoices(req: AuthRequest, res: Response) {
        try {
            const patientId = (req as any).query.patientId as string;
            const accountId = req.userId;

            if (!patientId) return res.status(400).json({ error: 'Thiếu patientId' });

            const linkCheck = await query('SELECT 1 FROM portal_patient_links WHERE account_id = $1 AND patient_no = $2', [accountId, patientId]);
            if (linkCheck.rows.length === 0) {
                return res.status(403).json({ error: 'Bạn không có quyền xem hồ sơ này' });
            }

            const result = await query(`
                SELECT 
                    hfe_invoiceno as "id",
                to_char(hfe_date, 'DD/MM/YYYY') as "date",
                hfe_desc as "service",
                hfe_amount as "amount",
                CASE WHEN hfe_status = 'P' THEN 'paid' ELSE 'unpaid' END as "status"
                FROM hms_fee_invoice
                WHERE hfe_patientno::text = $1
                ORDER BY hfe_date DESC
            `, [patientId]);

            return res.json(result.rows);
        } catch (error) {
            console.error('❌ Get Invoices Error:', error);
            return res.status(500).json({ error: 'Lỗi khi tải hóa đơn' });
        }
    }

    /**
     * Get Upcoming Appointments
     */
    async getUpcomingAppointments(req: AuthRequest, res: Response) {
        try {
            const patientId = (req as any).query.patientId as string;
            const accountId = req.userId;

            if (!patientId) return res.status(400).json({ error: 'Thiếu patientId' });

            const linkCheck = await query('SELECT 1 FROM portal_patient_links WHERE account_id = $1 AND patient_no = $2', [accountId, patientId]);
            if (linkCheck.rows.length === 0) {
                return res.status(403).json({ error: 'Bạn không có quyền xem hồ sơ này' });
            }

            const result = await query(`
                SELECT 
                    qms_idx as "id",
                to_char(qms_appointment_date, 'DD/MM/YYYY') as "date",
                qms_appointment_time as "time",
                qms_patientname as "name",
                qms_status as "status",
                (SELECT sd_name FROM sys_dept WHERE sd_id = qms_deptid) as "deptName",
            (SELECT hrl_roomname FROM hms_roomlist WHERE hrl_id = qms_roomid AND hrl_deptid = qms_deptid) as "roomName"
                FROM qms_patient
                WHERE qms_contact = (SELECT phone FROM portal_accounts WHERE id = $1)
                  AND qms_appointment_date >= CURRENT_DATE
                  AND qms_status != 'C'
                ORDER BY qms_appointment_date ASC, qms_appointment_time ASC
            `, [accountId]);

            return res.json(result.rows);
        } catch (error) {
            console.error('❌ Get Appointments Error:', error);
            return res.status(500).json({ error: 'Lỗi khi tải lịch hẹn' });
        }
    }

    /**
     * Generate QR Payment for Bill
     */
    async generatePaymentQR(req: AuthRequest, res: Response) {
        try {
            const { billId, amount } = (req as any).body;
            const accountId = req.userId;

            if (!billId || !amount || amount <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Bill ID và số tiền hợp lệ là bắt buộc'
                });
            }

            // Security check
            const billCheck = await query(`
                SELECT hfe_patientno, hfe_amount
                FROM hms_fee_invoice
                WHERE hfe_invoiceno = $1 AND hfe_status != 'P'
            `, [billId]);

            if (billCheck.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Hóa đơn không tồn tại hoặc đã thanh toán' });
            }

            const billPatientNo = billCheck.rows[0].hfe_patientno;

            const linkCheck = await query(
                'SELECT 1 FROM portal_patient_links WHERE account_id = $1 AND patient_no = $2',
                [accountId, billPatientNo]
            );

            if (linkCheck.rows.length === 0) {
                return res.status(403).json({ success: false, message: 'Bạn không có quyền thanh toán hóa đơn này' });
            }

            // Get patient info
            const patientInfo = await query(`
                SELECT
                    TRIM(COALESCE(hp_surname, '') || ' ' || COALESCE(hp_midname, '') || ' ' || COALESCE(hp_firstname, '')) as name
                FROM hms_patient
                WHERE hp_patientno::text = $1
            `, [billPatientNo]);

            const patientName = patientInfo.rows[0]?.name || 'BenhNhan';

            const sanitizeName = (str: string) => {
                return str.normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/đ/g, 'd')
                    .replace(/Đ/g, 'D')
                    .replace(/[^a-zA-Z0-9\s]/g, '')
                    .trim();
            };

            const hospitalQRUrl = process.env.HOSPITAL_QR_API_URL || 'http://10.1.3.37:8088/api/v1/vcb/genqrpayload';

            const qrPayload: QRPayload = {
                orderid: 0,
                docno: billId,
                description: sanitizeName(patientName) + ' ' + billId,
                billNumber: 0,
                amount: 0,
                deptid: 'KB',
                userid: 'portal',
                type: 'A',
                insinvoice: 0,
                transactionAmount: Math.round(Number(amount))
            };

            const hospitalResponse = await axios.post(hospitalQRUrl, qrPayload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            });

            const qrData = hospitalResponse.data as any;
            if (qrData.status !== '000' || !qrData.payload) {
                throw new Error(`QR generation failed: ${qrData.status}`);
            }

            const existingTransaction = await query(`
                SELECT transaction_id, qr_content
                FROM portal_payment_transactions
                WHERE bill_id = $1 AND status = 'PENDING'
                ORDER BY created_at DESC
                LIMIT 1
            `, [qrData.key]);

            if (existingTransaction.rows.length > 0) {
                return res.json({
                    success: true,
                    transactionId: existingTransaction.rows[0].transaction_id,
                    qrPayload: existingTransaction.rows[0].qr_content,
                    qrKey: qrData.key
                });
            }

            const transaction = await query(`
                INSERT INTO portal_payment_transactions (
                    bill_id, docno, account_id, patient_no, patient_name, amount, payment_method, status, qr_content, metadata
                )
                VALUES ($1, $2, $3, $4, $5, $6, 'VIETQR', 'PENDING', $7, $8)
                RETURNING transaction_id, created_at
            `, [
                qrData.key,
                billId,
                accountId,
                billPatientNo,
                patientName,
                amount,
                qrData.payload,
                JSON.stringify({ qr_key: qrData.key, hospital_status: qrData.status })
            ]);

            return res.json({
                success: true,
                transactionId: transaction.rows[0].transaction_id,
                qrPayload: qrData.payload,
                qrKey: qrData.key,
                createdAt: transaction.rows[0].created_at
            });

        } catch (error: any) {
            console.error('❌ Generate Payment QR Error:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi tạo QR thanh toán: ' + error.message
            });
        }
    }

    /**
     * Check Payment Status
     */
    async checkPaymentStatus(req: AuthRequest, res: Response) {
        try {
            const { billId } = (req as any).params;
            const qrKey = (req as any).query.qrKey as string;

            const checkId = qrKey || billId;

            const bankCheck = await query(`
                SELECT hfb_status, hfb_amount
                FROM hms_fee_invoice_bank
                WHERE hfb_key = $1 AND hfb_status = 'P'
                LIMIT 1
            `, [checkId]);

            if (bankCheck.rows.length > 0) {
                await query(`
                    UPDATE portal_payment_transactions
                    SET status = 'PAID', paid_at = CURRENT_TIMESTAMP
                    WHERE bill_id = $1 AND status = 'PENDING'
                `, [checkId]);

                return res.json({
                    isPaid: true,
                    paymentDate: new Date(),
                    amount: bankCheck.rows[0].hfb_amount
                });
            }

            return res.json({ isPaid: false });

        } catch (error) {
            console.error('❌ Check Payment Status Error:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi kiểm tra trạng thái thanh toán'
            });
        }
    }

    /**
     * Complete Payment Transaction
     */
    async completePayment(req: AuthRequest, res: Response) {
        try {
            const { transactionId, bankTransactionId } = (req as any).body;
            const accountId = req.userId;

            const result = await query(`
                UPDATE portal_payment_transactions
                SET status = 'PAID',
                    paid_at = CURRENT_TIMESTAMP,
                    bank_transaction_id = $1
                WHERE transaction_id = $2
                    AND account_id = $3
                    AND status = 'PENDING'
                RETURNING bill_id, docno, amount, patient_name
            `, [bankTransactionId, transactionId, accountId]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Transaction không tìm thấy hoặc đã hoàn tất'
                });
            }

            return res.json({
                success: true,
                billId: result.rows[0].bill_id,
                docno: result.rows[0].docno,
                amount: result.rows[0].amount,
                patientName: result.rows[0].patient_name
            });

        } catch (error: any) {
            console.error('❌ Complete Payment Error:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi hoàn tất giao dịch: ' + error.message
            });
        }
    }
}

export default new PortalPaymentController();
