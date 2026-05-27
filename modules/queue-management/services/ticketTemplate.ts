import { TicketData, AppSettings } from "../types";

/**
 * Generate HTML template for ticket printing
 * Optimized for 80mm thermal printer (576px width at 72 DPI)
 * Uses Google Fonts for Vietnamese character support
 */
export const generateTicketHTML = (data: TicketData, settings: AppSettings): string => {
    const hospitalName = settings.hospitalName.toUpperCase();
    const patientName = data.patientName.toUpperCase();
    const department = data.department;
    const ticketNumber = data.ticketNumber;
    const time = data.time;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Roboto', 'Arial', sans-serif;
            background: white;
        }
        .ticket {
            width: 576px;
            background: white;
            padding: 20px;
            color: #000;
        }
        .center {
            text-align: center;
        }
        .left {
            text-align: left;
        }
        .bold {
            font-weight: 700;
        }
        .hospital-name {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 5px;
        }
        .divider {
            margin: 10px 0;
            font-size: 14px;
        }
        .title {
            font-size: 18px;
            font-weight: 700;
            margin: 10px 0;
        }
        .ticket-number {
            font-size: 48px;
            font-weight: 700;
            margin: 15px 0;
            letter-spacing: 2px;
        }
        .info-row {
            margin: 8px 0;
            font-size: 16px;
            line-height: 1.5;
        }
        .label {
            font-weight: 700;
        }
        .footer {
            margin-top: 15px;
            font-size: 14px;
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="ticket">
        <!-- Header -->
        <div class="center hospital-name">${hospitalName}</div>
        <div class="center divider">================================</div>
        
        <!-- Title -->
        <div class="center title">PHIẾU ĐĂNG KÝ KHÁM</div>
        
        <!-- Ticket Number -->
        <div class="center ticket-number">${ticketNumber}</div>
        <div class="center divider">================================</div>
        
        <!-- Patient Info -->
        <div class="left info-row">
            <span class="label">BỆNH NHÂN:</span> ${patientName}
        </div>
        <div class="left info-row">
            <span class="label">PHÒNG KHÁM:</span> ${department}
        </div>
        <div class="left info-row">
            <span class="label">THỜI GIAN:</span> ${time}
        </div>
        
        <!-- Footer -->
        <div class="center divider">================================</div>
        <div class="center footer">
            Vui lòng đợi tới lượt.<br>
            Cảm ơn quý khách!
        </div>
    </div>
</body>
</html>
    `.trim();
};

/**
 * Encode string for Libre Barcode 128 (Google Fonts)
 * Implements Code 128 Subset B encoding
 */
export const encodeCode128 = (input: string): string => {
    if (!input) return "";

    // Code 128B start character is ASCII 204
    let checksum = 104;
    let encoded = String.fromCharCode(204);

    for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        const code = char - 32;
        checksum += code * (i + 1);
        encoded += input[i];
    }

    // Checksum character
    const checkDigit = checksum % 103;
    const checkChar = checkDigit < 95 ? String.fromCharCode(checkDigit + 32) : String.fromCharCode(checkDigit + 100);

    // Stop character is ASCII 206
    encoded += checkChar + String.fromCharCode(206);
    return encoded;
};

/**
 * Helper to fill a template with data
 */
export const fillTemplate = (template: string, data: TicketData, settings: AppSettings): string => {
    let html = template;
    const now = new Date();
    const HH = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const DD = String(now.getDate()).padStart(2, '0');
    const MM = String(now.getMonth() + 1).padStart(2, '0');
    const YYYY = now.getFullYear();
    const timeStr = `${HH}:${mm}, Ngày ${DD} tháng ${MM} năm ${YYYY}`;

    let ticketTitle = "PHIẾU SỐ THỨ TỰ";
    let roomLabel = "Phòng/Quầy:";
    
    if (data.isQuickNumber) {
        ticketTitle = data.isPriority ? "SỐ ƯU TIÊN" : "SỐ THỨ TỰ";
        roomLabel = "Phòng/Quầy:";
    } else if (data.type === 'EXECUTION') {
        ticketTitle = "SỐ THỨ TỰ CẬN LÂM SÀNG";
        roomLabel = "Phòng thực hiện:";
    } else if (data.type === 'PAYMENT') {
        ticketTitle = "SỐ THỨ TỰ THANH TOÁN";
        roomLabel = "Quầy thu ngân:";
    } else if (data.type === 'DRUG') {
        ticketTitle = "SỐ THỨ TỰ NHẬN THUỐC";
        roomLabel = "Quầy phát thuốc:";
    } else {
        ticketTitle = "SỐ THỨ TỰ KHÁM BỆNH";
        roomLabel = "Phòng khám:";
    }

    const replacements: Record<string, string> = {
        '{{ticketTitle}}': ticketTitle,
        '{{roomLabel}}': roomLabel,
        '{{hospitalName}}': (settings?.hospitalName || 'BENH VIEN').toUpperCase(),
        '{{patientName}}': (data?.patientName || 'CHƯA CÓ TÊN').toUpperCase(),
        '{{department}}': data?.roomname || data?.department || 'CHƯA PHÂN PHÒNG',
        '{{ticketNumber}}': data?.ticketNumber || '00',
        '{{patientId}}': data?.patientId || data?.identityNumber || '000000000',
        '{{identityNumber}}': data?.identityNumber || '',
        '{{dob}}': data?.dob || '',
        '{{gender}}': data?.gender || 'NAM',
        '{{address}}': data?.address || '',
        '{{time}}': timeStr,
        '{{barcode}}': encodeCode128(data?.docNo || '000'),
        '{{barcodeRaw}}': data?.docNo || '000',
        '{{ipAddress}}': settings?.ipAddress || '127.0.0.1',
        '{{kioskName}}': settings?.kioskName || 'KIOSK',
        '{{areaName}}': data?.areaName || (settings?.useArea ? settings.areaName : '') || '',
        '{{specialtyCode}}': data?.specialtyCode || '...',
        '{{specialtyCodes}}': (data?.specialtyCodes || []).join(', ') || '...',
        '{{docNo}}': data?.docNo || '...',
        
        // Render danh sách chỉ định nếu có (Cho mẫu EXECUTION)
        '{{ordersList}}': data?.orders?.length ? `
            <div style="margin-top: 15px; border-top: 2px solid #000; padding-top: 10px;">
                <div style="font-weight: 700; font-size: 20px; margin-bottom: 5px;">Danh sách chỉ định:</div>
                <div style="font-size: 18px; line-height: 1.4;">
                    ${data.orders.map((o, idx) => `
                        <div style="display: flex; margin-bottom: 4px;">
                            <div style="width: 25px;">${idx + 1}.</div>
                            <div style="flex: 1; font-weight: 700;">${o.name}</div>
                        </div>
                    `).join('')}
                </div>
            </div>` : ''
    };

    Object.keys(replacements).forEach(key => {
        html = html.split(key).join(replacements[key]);
    });

    // Xử lý ẩn các thẻ chứa placeholder rỗng (Vùng có data-hide-empty="true")
    if (!replacements['{{areaName}}']) {
        html = html.replace(/<div[^>]*data-hide-empty="true"[^>]*>.*?<\/div>/gs, '');
    }

    return html;
};

// ==========================================
// MẪU 1: ĐĂNG KÝ KHÁM BỆNH BAN ĐẦU
// ==========================================
export const TEMPLATE_REGISTRATION = `
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700;900&family=Libre+Barcode+128&display=swap" rel="stylesheet">
<div style="width: 580px; background: white; padding: 20px 30px; font-family: 'Roboto', Arial, sans-serif; color: #000; line-height: 1.4;">
    <div style="text-align: center; margin-bottom: 2px;">
        <div style="font-size: 26px; font-weight: 700; color: #000;">SỐ THỨ TỰ KHÁM BỆNH</div>
        <div style="font-size: 20px; font-weight: 400;">{{time}}</div>
    </div>
    <div style="text-align: center; margin-bottom: 15px;">
        <div style="font-family: 'Libre Barcode 128'; font-size: 85px; line-height: 1.8; margin:-120px 0 30px;">{{barcode}}</div>
    </div>
    <div style="font-size: 22px; width: 100%;">
        <div style="display: flex; margin-bottom: 12px;">
            <div style="width: 140px;">Mã số BN:</div>
            <div style="flex: 1; font-weight: 700; font-size: 24px;">{{docNo}}</div>
        </div>
        <div style="margin-bottom: 5px; border-top: 1px dashed #000; padding-top: 10px;">
            Tên BN: <span style="font-weight: 900; font-size: 26px;">{{patientName}}</span>
        </div>
        <div style="display: flex; margin-bottom: 10px;">
            <div style="margin-right: 30px;">Giới tính: <span style="font-weight: 700;">{{gender}}</span></div>
            <div>Sinh năm: <span style="font-weight: 700;">{{dob}}</span></div>
        </div>
        <div style="margin-bottom: 5px;">
            <div style="margin-bottom: 2px;">Vui lòng đến Phòng Khám:</div>
            <div style="font-size: 32px; font-weight: 900; line-height: 1; text-transform: uppercase;">{{department}}</div>
        </div>
    </div>
    <div style="margin-top: 5px;">
        <div style="font-size: 24px;">Số thứ tự của bạn:</div>
        <div style="text-align: center;">
            <div style="font-size: 90px; font-weight: 900; line-height: 0.8; margin: 10px 0;">{{ticketNumber}}</div>
        </div>
    </div>
    <div style="text-align: center; margin-top: 15px; border-top: 1px dashed #000; padding-top: 15px;">
        <div style="font-size: 20px; font-weight: 400;">Bệnh nhân vui lòng theo dõi màn hình chờ gọi số.</div>
    </div>
</div>
`;

// ==========================================
// MẪU 2: CẬN LÂM SÀNG (CÓ MỤC DANH SÁCH DỊCH VỤ)
// ==========================================
export const TEMPLATE_EXECUTION = `
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700;900&family=Libre+Barcode+128&display=swap" rel="stylesheet">
<div style="width: 580px; background: white; padding: 20px 30px; font-family: 'Roboto', Arial, sans-serif; color: #000; line-height: 1.4;">
    <div style="text-align: center; margin-bottom: 2px;">
        <div style="font-size: 26px; font-weight: 700; color: #000;">PHIẾU GỌI CẬN LÂM SÀNG</div>
        <div style="font-size: 20px; font-weight: 400;">{{time}}</div>
    </div>
    
    <div style="font-size: 22px; width: 100%; margin-top: 20px;">
        <div style="display: flex; margin-bottom: 12px;">
            <div style="width: 140px;">Mã số BN:</div>
            <div style="flex: 1; font-weight: 700; font-size: 24px;">{{docNo}}</div>
        </div>
        <div style="margin-bottom: 5px; border-top: 1px dashed #000; padding-top: 10px;">
            Tên BN: <span style="font-weight: 900; font-size: 26px;">{{patientName}}</span>
        </div>
        <div style="display: flex; margin-bottom: 10px;">
            <div style="margin-right: 30px;">Tuổi/NS: <span style="font-weight: 700;">{{dob}}</span></div>
        </div>
        
        <!-- HIỂN THỊ DANH SÁCH CHỈ ĐỊNH (XÉT NGHIỆM/CHỤP CHIẾU) -->
        {{ordersList}}

        <div style="margin-top: 15px; background: #f0f0f0; padding: 10px; border-radius: 10px;">
            <div style="margin-bottom: 2px;">Phòng thực hiện:</div>
            <div style="font-size: 32px; font-weight: 900; line-height: 1; text-transform: uppercase;">{{department}}</div>
        </div>
    </div>
    
    <div style="margin-top: 15px;">
        <div style="font-size: 24px; text-align: center; padding-top: 10px;">SỐ THỨ TỰ THỰC HIỆN</div>
        <div style="text-align: center;">
            <div style="font-size: 100px; font-weight: 900; line-height: 0.8; margin: 10px 0;">{{ticketNumber}}</div>
        </div>
    </div>
    
    <div style="text-align: center; margin-top: 15px; border-top: 1px dashed #000; padding-top: 15px;">
        <div style="font-size: 20px; font-weight: 400;">Vui lòng đến đúng phòng ghi trên phiếu để nộp nội bệnh án.</div>
    </div>
</div>
`;

// ==========================================
// MẪU 3: LĨNH THUỐC
// ==========================================
export const TEMPLATE_DRUG = `
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700;900&family=Libre+Barcode+128&display=swap" rel="stylesheet">
<div style="width: 580px; background: white; padding: 20px 30px; font-family: 'Roboto', Arial, sans-serif; color: #000; line-height: 1.4;">
    <div style="text-align: center; margin-bottom: 2px;">
        <div style="font-size: 26px; font-weight: 700; color: #000;">SỐ THỨ TỰ LĨNH THUỐC</div>
        <div style="font-size: 20px; font-weight: 400;">BHYT / Dịch vụ</div>
    </div>
    
    <div style="margin-top: 20px; font-size: 22px;">
        <div style="margin-bottom: 5px;">
            Bệnh nhân: <span style="font-weight: 900; font-size: 26px;">{{patientName}}</span>
        </div>
        <div style="display: flex; margin-bottom: 20px;">
            <div style="width: 140px;">Mã Quản lý:</div>
            <div style="flex: 1; font-weight: 700;">{{docNo}}</div>
        </div>
        
        <div style="margin-bottom: 5px;">
            <div style="margin-bottom: 2px;">Quầy nhận:</div>
            <div style="font-size: 32px; font-weight: 900; line-height: 1; text-transform: uppercase;">{{department}}</div>
        </div>
    </div>

    <!-- Ticket Number -->
    <div style="margin-top: 30px; text-align: center; border: 4px solid #000; padding: 20px;">
        <div style="font-size: 24px;">LƯỢT GỌI SỐ</div>
        <div style="font-size: 110px; font-weight: 900; line-height: 0.8; margin: 10px 0;">{{ticketNumber}}</div>
    </div>

    <div style="text-align: center; margin-top: 25px;">
        <div style="font-size: 20px; font-weight: 400;">Thời gian in: {{time}}</div>
        <div style="font-size: 20px; font-style: italic;">Quý khách vui lòng chuẩn bị CMND/CCCD hoặc Thẻ BHYT khi giao dịch.</div>
    </div>
</div>
`;

// ==========================================
// MẪU 4: LẤY SỐ TRỰC TIẾP (Quick Number)
// Mẫu đơn giản, số lớn, có badge Ưu tiên
// ==========================================
export const TEMPLATE_QUICK_NUMBER = `
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700;900&display=swap" rel="stylesheet">
<div style="width: 580px; background: white; padding: 20px 30px; font-family: 'Roboto', Arial, sans-serif; color: #000; line-height: 1.2;">
    <!-- HEADER -->
    <div style="text-align: center; margin-bottom: 5px;">
        <div style="font-size: 24px; font-weight: 900; color: #000; text-transform: uppercase; margin-bottom: 2px;">{{hospitalName}}</div>
        <div style="font-size: 18px; font-weight: 400; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 10px;">{{time}}</div>
    </div>

    <!-- Tên Khu Vực (Nếu có) -->
    <div data-hide-empty="true" style="text-align: center; margin-bottom: 5px;">
        <div style="font-size: 22px; font-weight: 700; background: #000; color: #fff; padding: 5px 0; border-radius: 5px;">{{areaName}}</div>
    </div>

    <!-- TIÊU ĐỀ PHIẾU -->
    <div style="text-align: center; margin: 10px 0;">
        <div style="font-size: 32px; font-weight: 900; letter-spacing: 1px;">{{ticketTitle}}</div>
    </div>

    <!-- SỐ THỨ TỰ (BIG) -->
    <div style="text-align: center; margin: 5px 0;">
        <div style="font-size: 160px; font-weight: 900; line-height: 1; letter-spacing: 5px;">{{ticketNumber}}</div>
    </div>

    <!-- QUẦY TIẾP ĐÓN -->
    <div style="text-align: center; margin: 5px 0; padding: 15px; border: 3px solid #000; border-radius: 12px;">
        <div style="font-size: 20px; font-weight: 400; margin-bottom: 2px;">Vui lòng đến Quầy:</div>
        <div style="font-size: 38px; font-weight: 900; text-transform: uppercase;">{{department}}</div>
    </div>

    <!-- THÔNG TIN BN (NẾU CÓ) -->
    <div style="font-size: 22px; margin-top: 15px; border-top: 1px dashed #000; padding-top: 10px;">
        <div style="display: flex; margin-bottom: 4px;">
            <div style="width: 140px;">Bệnh nhân:</div>
            <div style="flex: 1; font-weight: 700;">{{patientName}}</div>
        </div>
        <div style="display: flex; margin-bottom: 4px;">
            <div style="width: 140px;">CCCD/ID:</div>
            <div style="flex: 1; font-weight: 700;">{{identityNumber}}</div>
        </div>
    </div>

    <!-- FOOTER -->
    <div style="text-align: center; margin-top: 20px; border-top: 2px solid #000; padding-top: 15px;">
        <div style="font-size: 22px; font-weight: 700;">XIN VUI LÒNG ĐỢI GỌI SỐ</div>
        <div style="font-size: 18px; margin-top: 5px; color: #333;">Cảm ơn quý khách đã tin tưởng!</div>
        <div style="font-size: 16px; margin-top: 10px; font-style: italic;">Kiosk: {{kioskName}}</div>
    </div>
</div>
`;

// Tương thích lùi với hệ thống gọi DEFAULT_IMAGE_TEMPLATE
export const DEFAULT_IMAGE_TEMPLATE = TEMPLATE_REGISTRATION;

export const generateTicketHTMLForCanvas = (data: TicketData, settings: AppSettings): string => {
    // Nếu Settings có ghi đè bằng Text Custom từ Cấu Hình thì ưu tiên
    let template = settings.printerConfig.printTemplate; 
    
    // Nếu Settings không có hoặc rỗng thì tự động routing theo Kiosk Type:
    if (!template || template.trim() === '') {
        if (data.isQuickNumber) {
            template = TEMPLATE_QUICK_NUMBER;
        } else if (data.type === 'EXECUTION') {
            template = TEMPLATE_EXECUTION;
        } else if (data.type === 'DRUG') {
            template = TEMPLATE_DRUG;
        } else {
            template = TEMPLATE_REGISTRATION;
        }
    }
    
    return fillTemplate(template, data, settings);
};
