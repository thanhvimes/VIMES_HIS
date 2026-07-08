import { Request, Response } from 'express';
import { pool } from '../../config/database';
import axios from 'axios';
import path from 'path';
import fs from 'fs';

const safeQuery = async (queryText: string, params: any[] = [], mockReturn: any[] = []): Promise<any[]> => {
  try {
    const result = await pool.query(queryText, params);
    return result.rows;
  } catch (err: any) {
    console.warn(`[DB Error] ${err.message}. Query: "${queryText}". Params: ${JSON.stringify(params)}`);
    if (process.env.NODE_ENV === 'production') {
      throw err;
    }
    return mockReturn;
  }
};

function removeVietnameseTones(str: string): string {
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, "");
  str = str.replace(/\u02C6|\u0306|\u031B/g, "");
  str = str.replace(/ + /g, " ");
  return str.trim();
}

export class QmsPaymentController {
  // 33. SIMPLE STATUS CHECK
  static async getPaymentStatus(req: Request, res: Response) {
    const { billId } = req.params;
    try {
      const bankCheck = await safeQuery(`
          SELECT hfb_status, hfb_amount 
          FROM hms_fee_invoice_bank 
          WHERE hfb_key = $1
          AND hfb_status = 'P' 
          LIMIT 1`,
        [billId]
      );
      if (bankCheck.length > 0) {
        await safeQuery(`
            UPDATE kiosk_payment_transactions
            SET status = 'PAID', paid_at = CURRENT_TIMESTAMP
            WHERE bill_id = $1 AND status = 'PENDING'`,
          [billId]
        );
        res.json({ isPaid: true, amount: bankCheck[0].hfb_amount });
      } else {
        const localCheck = await safeQuery(`
            SELECT status, paid_at FROM kiosk_payment_transactions
            WHERE bill_id = $1 ORDER BY created_at DESC LIMIT 1`,
          [billId]
        );
        if (localCheck.length > 0 && localCheck[0].status === 'PAID') {
          res.json({ isPaid: true, paymentDate: localCheck[0].paid_at });
        } else {
          res.json({ isPaid: false });
        }
      }
    } catch (err: any) {
      res.status(500).json({ paid: false, error: err.message });
    }
  }

  // 34. GENERATE PAYMENT QR
  static async generatePaymentQR(req: Request, res: Response) {
    const { billId, patientId, patientName, amount, orderid, description, deptid, userid, qrApiUrl } = req.body;
    try {
      if (!billId || !amount || amount <= 0) {
        return res.status(400).json({ success: false, message: "Bill ID và số tiền hợp lệ là bắt buộc" });
      }
      const hospitalQRUrl = qrApiUrl || process.env.HOSPITAL_QR_API_URL || 'http://10.1.3.37:8088/api/v1/vcb/genqrpayload';
      const qrPayload = {
        orderid: orderid || 0,
        docno: billId,
        description: removeVietnameseTones(patientName) + " " + billId,
        billNumber: 0,
        amount: 0,
        deptid: deptid || "KB",
        userid: userid || "kiosk",
        type: "A",
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

      const getTransaction = await safeQuery(`
          SELECT * FROM kiosk_payment_transactions WHERE bill_id = $1 AND status = 'PENDING'`, [qrData.key]);

      if (getTransaction.length > 0) {
        return res.json({
          success: true,
          transactionId: getTransaction[0].transaction_id,
          qrPayload: qrData.payload,
          qrKey: qrData.key,
          createdAt: getTransaction[0].created_at
        });
      }

      const transaction = await safeQuery(`
          INSERT INTO kiosk_payment_transactions (
              bill_id, docno, patient_id, patient_name, amount, payment_method, status, qr_content, metadata
          )
          VALUES ($1, $2, $3, $4, $5, 'VIETQR', 'PENDING', $6, $7)
          RETURNING transaction_id, created_at`,
        [qrData.key, billId, patientId || null, patientName || null, amount, qrData.payload, JSON.stringify({ qr_key: qrData.key, hospital_status: qrData.status, orderid: orderid })]
      );

      res.json({
        success: true,
        transactionId: transaction[0].transaction_id,
        qrPayload: qrData.payload,
        qrKey: qrData.key,
        createdAt: transaction[0].created_at
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: "Lỗi tạo QR thanh toán: " + err.message });
    }
  }

  // 35. COMPLETE PAYMENT
  static async completePayment(req: Request, res: Response) {
    const { transactionId } = req.params;
    const { bankTransactionId, metadata } = req.body;
    try {
      const result = await safeQuery(`
          UPDATE kiosk_payment_transactions
          SET status = 'PAID', paid_at = CURRENT_TIMESTAMP, bank_transaction_id = $1, metadata = $2
          WHERE transaction_id = $3 AND status = 'PENDING'
          RETURNING bill_id, amount, patient_name`,
        [bankTransactionId, JSON.stringify(metadata || {}), transactionId]
      );
      if (result.length === 0) {
        return res.status(404).json({ success: false, message: "Transaction không tìm thấy hoặc đã hoàn tất" });
      }
      res.json({
        success: true,
        billId: result[0].bill_id,
        amount: result[0].amount,
        patientName: result[0].patient_name
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: "Lỗi hoàn tất giao dịch: " + err.message });
    }
  }

  // 36. PRINT RECEIPT
  static async printReceipt(req: Request, res: Response) {
    const { billId, patientName, patientId, amount, items, paymentDate, paymentMethod } = req.body;
    try {
      const ESC = '\x1b';
      const GS = '\x1d';
      const INIT = ESC + '@';
      const CENTER = ESC + 'a' + '\x01';
      const LEFT = ESC + 'a' + '\x00';
      const BOLD_ON = ESC + 'E' + '\x01';
      const BOLD_OFF = ESC + 'E' + '\x00';
      const CUT = GS + 'V' + '\x41' + '\x00';

      let printerData = INIT;
      printerData += CENTER + BOLD_ON + "BENH VIEN KIOSK\n" + BOLD_OFF;
      printerData += "D/C: Ha Noi\n";
      printerData += "--------------------------------\n\n";
      printerData += BOLD_ON + "HOA DON THANH TOAN\n" + BOLD_OFF;
      printerData += "RECEIPT\n\n";
      printerData += LEFT;
      printerData += `Ngay: ${paymentDate || new Date().toLocaleString()}\n`;
      printerData += `So HD: ${billId}\n`;
      printerData += `Benh nhan: ${removeVietnameseTones(patientName || '')}\n`;
      printerData += `Ma BN: ${patientId}\n`;
      printerData += "--------------------------------\n";

      if (items && items.length > 0) {
        printerData += BOLD_ON + "Dich vu                         Thanh tien\n" + BOLD_OFF;
        items.forEach((item: any) => {
          const name = removeVietnameseTones(item.name).substring(0, 30);
          const price = (item.total || 0).toLocaleString('vi-VN');
          printerData += `${name}\n`;
          printerData += `SL: ${item.quantity}                      ${price}\n`;
        });
        printerData += "--------------------------------\n";
      }

      printerData += BOLD_ON + `TONG CONG: ${(amount || 0).toLocaleString('vi-VN')} VND\n` + BOLD_OFF;
      printerData += `Hinh thuc: ${paymentMethod || 'QR Code'}\n`;
      printerData += "--------------------------------\n\n";
      printerData += CENTER + "Cam on Quy khach!\n";
      printerData += "Please keep this receipt\n";
      printerData += "\n\n\n" + CUT;

      if (process.platform === 'win32') {
        const tempFile = path.join(__dirname, `../../receipt_${Date.now()}.bin`);
        fs.writeFileSync(tempFile, printerData, 'binary');
        const printerName = process.env.PRINTER_NAME || "XP-80C";

        const { execFile } = require('child_process');
        execFile('cmd.exe', ['/c', 'copy', '/b', tempFile, `\\\\localhost\\${printerName}`], (err: any) => {
          if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
          if (err) {
            return res.status(500).json({ success: false, error: err.message });
          }
          res.json({ success: true, message: "Printed successfully" });
        });
      } else {
        res.json({ success: true, message: "Simulated printing (Non-Windows OS)" });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // 51. GET PATIENT BILLS (from HIS)
  static async getPatientBills(req: Request, res: Response) {
    const { searchId } = req.params;
    console.log(`[Payment] Fetching bills for: ${searchId}`);
    try {
      const bills = await safeQuery(`
          SELECT hd_docno AS "id",
          trim(hp_surname ||' '|| hp_midname ||' '|| hp_firstname) AS "patientName",
          hp_patientno     AS "patientId",
          (SELECT COALESCE(SUM(hfe_cost), 0) FROM hms_fee WHERE hfe_docno = hd_docno AND hfe_status <> 'P') AS "totalAmount", 
          'PENDING'                           AS "status",
          TO_CHAR(hd_admitdate, 'DD/MM/YYYY') AS "createdAt",
          hd_admitdept                        AS "department"
          FROM hms_doc
          JOIN hms_patient ON (hd_patientno = hp_patientno)
          WHERE hp_sin = $1
          ORDER BY hd_admitdate DESC LIMIT 1`, [searchId]);

      const billsWithItems = await Promise.all(bills.map(async (bill) => {
        const items = await safeQuery(`
            SELECT 
                hfe_itemid::text as id,
                COALESCE(hfl_name, 'Dịch vụ y tế') as name,
                COALESCE(hfe_quantity, 1) as quantity,
                COALESCE(hfe_unitprice, 0) as price,
                COALESCE(hfe_cost, 0) as total,
                COALESCE(hfg_name, 'Khác') as category
            FROM hms_fee
            LEFT JOIN hms_fee_list ON (hfl_feeid = hfe_itemid)
            LEFT JOIN hms_fee_group ON (hfg_id = hfl_groupid)
            WHERE hfe_docno = $1
            AND hfe_status <> 'P'
            ORDER BY hfg_name, hfl_idx`, [bill.id]);

        return {
          ...bill,
          items: items.length > 0 ? items : [
            {
              id: '1',
              name: 'Phí khám bệnh / Công khám',
              quantity: 1,
              price: bill.totalAmount,
              total: bill.totalAmount,
              category: 'Khám bệnh'
            }
          ]
        };
      }));

      console.log(`[Payment] Found ${billsWithItems.length} bills for ${searchId}`);
      res.json(billsWithItems);
    } catch (err: any) {
      console.error(`[Payment] Error fetching bills:`, err.message);
      res.status(500).json({ message: "Error fetching bills" });
    }
  }
}
