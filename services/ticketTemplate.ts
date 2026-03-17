
/**
 * Encode string for Libre Barcode 128 (Google Fonts)
 * Implements Code 128 Subset B encoding
 */
export const encodeCode128 = (input: string): string => {
    if (!input) return "";
    let checksum = 104;
    let encoded = String.fromCharCode(204);
    for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        const code = char - 32;
        checksum += code * (i + 1);
        encoded += input[i];
    }
    const checkDigit = checksum % 103;
    const checkChar = checkDigit < 95 ? String.fromCharCode(checkDigit + 32) : String.fromCharCode(checkDigit + 100);
    encoded += checkChar + String.fromCharCode(206);
    return encoded;
};

export const KIOSK_TICKET_TEMPLATE = `
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700;900&family=Libre+Barcode+128&display=swap" rel="stylesheet">
<div style="width: 580px; background: white; padding: 20px 30px; font-family: 'Roboto', Arial, sans-serif; color: #000; line-height: 1.4;">
    <!-- Title Section -->
    <div style="text-align: center; margin-bottom: 2px;">
        <div style="font-size: 26px; font-weight: 700; color: #000;">SỐ THỨ TỰ PHÒNG KHÁM</div>
        <div style="font-size: 20px; font-weight: 400;">{{time}}</div>
    </div>
    
    <!-- Barcode Section -->
    <div style="text-align: center; margin-bottom: 15px;">
        <div style="font-family: 'Libre Barcode 128'; font-size: 85px; line-height: 1.8; margin:-110px 0 30px;">{{barcode}}</div>
    </div>

    <!-- Administrative Info -->
    <div style="font-size: 22px; width: 100%;">
        <div style="display: flex; margin-bottom: 5px;">
            <div style="width: 140px;">Bệnh viện:</div>
            <div style="flex: 1; font-weight: 700;">{{hospitalName}}</div>
        </div>
        <div style="display: flex; margin-bottom: 5px;">
            <div style="width: 140px;">Mã số BN:</div>
            <div style="flex: 1; font-weight: 700; font-size: 24px;">{{docNo}}</div>
        </div>
        
        <div style="margin-bottom: 5px; border-top: 1px dashed #000; padding-top: 10px;">
            Tên BN: <span style="font-weight: 900; font-size: 26px;">{{patientName}}</span>
        </div>
        
        <div style="margin-bottom: 5px;">
            Địa chỉ: <span style="font-weight: 400;">{{address}}</span>
        </div>
        
        <div style="display: flex; margin-bottom: 10px;">
            <div style="margin-right: 30px;">
                Giới tính: <span style="font-weight: 700;">{{gender}}</span>
            </div>
            <div>
                Ngày sinh: <span style="font-weight: 700;">{{dob}}</span>
            </div>
        </div>

        <div style="margin-bottom: 5px;">
            <div style="margin-bottom: 2px;">Phòng khám:</div>
            <div style="font-size: 32px; font-weight: 900; line-height: 1; text-transform: uppercase;">{{department}}</div>
        </div>
    </div>

    <!-- Ticket Number -->
    <div style="margin-top: 5px;">
        <div style="font-size: 24px;">Số thứ tự:</div>
        <div style="text-align: center;">
            <div style="font-size: 80px; font-weight: 900; line-height: 0.5; margin: 0;">{{ticketNumber}}</div>
        </div>
    </div>
    <br><br><br>
    <!-- Footer Message -->
    <div style="text-align: center; margin-top: 15px; border-top: 1px dashed #444; padding-top: 15px;">
        <div style="font-size: 20px; font-weight: 400;">Bệnh nhân vui lòng giữ phiếu qua tái khám</div>
        <div style="margin-top: 8px; border-top: 2px dotted #000; width: 100%;"></div>
    </div>
</div>
`;

export const fillKioskTemplate = (data: any, settings: any): string => {
    let html = KIOSK_TICKET_TEMPLATE;
    const now = new Date();
    const timeStr = now.toLocaleString('vi-VN');

    const replacements: Record<string, string> = {
        '{{hospitalName}}': (settings?.hospitalName || 'BỆNH VIỆN VIMES').toUpperCase(),
        '{{patientName}}': (data?.name || data?.patientName || 'CHƯA CÓ TÊN').toUpperCase(),
        '{{department}}': data?.roomName || data?.department || 'PHÒNG KHÁM CHUNG',
        '{{ticketNumber}}': data?.receptNo || data?.ticketNumber || '00',
        '{{dob}}': data?.dob || '',
        '{{gender}}': data?.gender || 'NAM',
        '{{address}}': data?.address || '',
        '{{time}}': timeStr,
        '{{barcode}}': encodeCode128(data?.recordNumber || data?.docNo || '000'),
        '{{docNo}}': data?.recordNumber || data?.docNo || '...',
        '{{patientId}}': data?.id || data?.patientId || '...'
    };

    Object.keys(replacements).forEach(key => {
        html = html.split(key).join(replacements[key]);
    });

    return html;
};
