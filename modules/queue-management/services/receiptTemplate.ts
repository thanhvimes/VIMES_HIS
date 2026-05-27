import { ReceiptData, AppSettings } from "../types";

/**
 * Generate HTML template for receipt printing (Image Mode)
 * Optimized for 80mm thermal printer (576px width)
 */
export const DEFAULT_RECEIPT_TEMPLATE = `
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700;900&display=swap" rel="stylesheet">
<div style="width: 580px; background: white; padding: 20px 30px; font-family: 'Roboto', Arial, sans-serif; color: #000; line-height: 1.4;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-size: 24px; font-weight: 900; text-transform: uppercase; margin-bottom: 5px;">{{hospitalName}}</div>
        <div style="font-size: 16px;">Đ/C: Hà Nội</div>
        <div style="border-bottom: 2px solid #000; margin: 10px 40px;"></div>
    </div>

    <!-- Title -->
    <div style="text-align: center; margin-bottom: 25px;">
        <div style="font-size: 32px; font-weight: 900; margin-bottom: 5px;">PHIẾU THANH TOÁN</div>
        <div style="font-size: 18px; font-weight: 400; font-style: italic;">(BIÊN LAI ĐIỆN TỬ)</div>
    </div>

    <!-- Info -->
    <div style="font-size: 20px; width: 100%; margin-bottom: 20px;">
        <div style="display: flex; margin-bottom: 8px;">
            <div style="width: 140px; font-weight: 700;">Ngày:</div>
            <div style="flex: 1;">{{time}}</div>
        </div>
        <div style="display: flex; margin-bottom: 8px;">
            <div style="width: 140px; font-weight: 700;">Số HĐ:</div>
            <div style="flex: 1; font-weight: 900;">{{billId}}</div>
        </div>
        <div style="display: flex; margin-bottom: 8px;">
            <div style="width: 140px; font-weight: 700;">Mã GD:</div>
            <div style="flex: 1;">{{transactionId}}</div>
        </div>
        <div style="border-bottom: 1px dashed #000; margin: 10px 0;"></div>
        <div style="display: flex; margin-bottom: 8px;">
            <div style="width: 140px; font-weight: 700;">Bệnh nhân:</div>
            <div style="flex: 1; font-weight: 900; text-transform: uppercase;">{{patientName}}</div>
        </div>
        <div style="display: flex; margin-bottom: 8px;">
            <div style="width: 140px; font-weight: 700;">Mã BN:</div>
            <div style="flex: 1;">{{patientId}}</div>
        </div>
    </div>

    <!-- Items Table -->
    <div style="width: 100%; margin-bottom: 20px;">
        <div style="display: flex; font-weight: 900; font-size: 20px; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 10px;">
            <div style="flex: 1;">Dịch vụ</div>
            <div style="width: 50px; text-align: center;">SL</div>
            <div style="width: 140px; text-align: right;">Thành tiền</div>
        </div>
        
        {{itemsList}}
        
        <div style="border-top: 2px solid #000; margin: 10px 0;"></div>
    </div>

    <!-- Total -->
    <div style="width: 100%; margin-bottom: 30px;">
        <div style="display: flex; justify-content: space-between; font-size: 24px; font-weight: 900; margin-bottom: 10px;">
            <div>TỔNG CỘNG:</div>
            <div>{{totalAmount}} VNĐ</div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 20px;">
            <div>Hình thức:</div>
            <div style="font-weight: 700;">{{paymentMethod}}</div>
        </div>
         <div style="display: flex; justify-content: space-between; font-size: 20px;">
            <div>Thu ngân:</div>
            <div style="font-weight: 700;">{{kioskName}}</div>
        </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px dashed #000;">
        <div style="font-size: 22px; font-weight: 700; margin-bottom: 5px;">CẢM ƠN QUÝ KHÁCH!</div>
        <div style="font-size: 18px; font-style: italic;">Vui lòng giữ lại biên lai để đối chiếu</div>
    </div>
</div>
`;

export const generateReceiptHTMLForCanvas = (data: ReceiptData, settings: AppSettings): string => {
    let html = DEFAULT_RECEIPT_TEMPLATE;

    const itemsHtml = data.items.map(item => `
        <div style="display: flex; font-size: 20px; margin-bottom: 8px;">
            <div style="flex: 1; padding-right: 10px;">${item.name}</div>
            <div style="width: 50px; text-align: center;">${item.quantity}</div>
            <div style="width: 140px; text-align: right;">${Number(item.total).toLocaleString('vi-VN')}</div>
        </div>
    `).join('');

    const replacements: Record<string, string> = {
        '{{hospitalName}}': (settings?.hospitalName || 'BENH VIEN KIOSK').toUpperCase(),
        '{{time}}': data.time || new Date().toLocaleString('vi-VN'),
        '{{billId}}': data.billId,
        '{{transactionId}}': data.transactionId || '---',
        '{{patientName}}': data.patientName.toUpperCase(),
        '{{patientId}}': data.patientId,
        '{{itemsList}}': itemsHtml,
        '{{totalAmount}}': Number(data.totalAmount).toLocaleString('vi-VN'),
        '{{paymentMethod}}': data.paymentMethod || 'QR Code',
        '{{kioskName}}': settings.kioskName || 'KIOSK'
    };

    Object.keys(replacements).forEach(key => {
        html = html.split(key).join(replacements[key]);
    });

    return html;
};
