// File: backend/scripts/generate_ksk_manual_doc.js
const fs = require('fs');
const path = require('path');
const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    ImageRun,
    HeadingLevel,
    AlignmentType,
    BorderStyle,
    WidthType,
    Header,
    Footer,
    PageNumber,
    convertInchesToTwip
} = require('../node_modules/docx');

// Image helper
const IMAGES_DIR = path.join(__dirname, '../../modules/health-check-sync/docs/images');

function readImageSafe(fileName) {
    const fullPath = path.join(IMAGES_DIR, fileName);
    if (fs.existsSync(fullPath)) {
        return fs.readFileSync(fullPath);
    }
    console.warn(`[WARN] Image not found: ${fullPath}`);
    return null;
}

// Styling Constants - Professional Medical Theme
const PRIMARY_COLOR = '1A56DB';    // Hospital Deep Blue
const SECONDARY_COLOR = '0E7490';  // Medical Teal
const DARK_TEXT = '1E293B';        // Slate Navy
const BODY_TEXT = '334155';        // Dark Slate Body
const LIGHT_BG = 'F8FAFC';         // Soft Slate Background
const ACCENT_BG = 'EFF6FF';        // Soft Blue Background
const BORDER_COLOR = 'CBD5E1';     // Subtle Border Gray
const WARNING_BORDER = 'D97706';   // Amber Warning Border
const SUCCESS_BORDER = '10B981';   // Emerald Success Border
const PURPLE_ACCENT = '7C3AED';    // Purple Accent for Steps

const FONT_FAMILY = 'Arial';

// Helper Paragraph Functions
function createTitle(text) {
    return new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 120 },
        children: [
            new TextRun({
                text: text,
                font: FONT_FAMILY,
                size: 40, // 20pt
                bold: true,
                color: PRIMARY_COLOR
            })
        ]
    });
}

function createSubtitle(text) {
    return new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 80, after: 250 },
        children: [
            new TextRun({
                text: text,
                font: FONT_FAMILY,
                size: 26, // 13pt
                bold: true,
                color: SECONDARY_COLOR
            })
        ]
    });
}

function createHeading1(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 380, after: 140 },
        children: [
            new TextRun({
                text: text,
                font: FONT_FAMILY,
                size: 28, // 14pt
                bold: true,
                color: PRIMARY_COLOR
            })
        ]
    });
}

function createHeading2(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 100 },
        children: [
            new TextRun({
                text: text,
                font: FONT_FAMILY,
                size: 24, // 12pt
                bold: true,
                color: SECONDARY_COLOR
            })
        ]
    });
}

function createHeading3(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 160, after: 70 },
        children: [
            new TextRun({
                text: text,
                font: FONT_FAMILY,
                size: 22, // 11pt
                bold: true,
                color: DARK_TEXT
            })
        ]
    });
}

function createParagraph(text, options = {}) {
    return new Paragraph({
        alignment: options.alignment || AlignmentType.JUSTIFIED,
        spacing: { before: options.before || 50, after: options.after || 70, line: 270 },
        children: [
            new TextRun({
                text: text,
                font: FONT_FAMILY,
                size: 21, // 10.5pt
                color: options.color || BODY_TEXT,
                bold: options.bold || false,
                italics: options.italics || false
            })
        ]
    });
}

function createStepGuide(stepNum, stepTitle, stepDesc) {
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        borders: {
                            top: { style: BorderStyle.NONE },
                            bottom: { style: BorderStyle.NONE },
                            right: { style: BorderStyle.NONE },
                            left: { style: BorderStyle.SINGLE, size: 24, color: PRIMARY_COLOR }
                        },
                        shading: { fill: 'F0F7FF' },
                        margins: { top: 100, bottom: 100, left: 160, right: 160 },
                        children: [
                            new Paragraph({
                                spacing: { before: 30, after: 40 },
                                children: [
                                    new TextRun({
                                        text: `BƯỚC ${stepNum}: ${stepTitle.toUpperCase()}`,
                                        font: FONT_FAMILY,
                                        size: 21,
                                        bold: true,
                                        color: PRIMARY_COLOR
                                    })
                                ]
                            }),
                            new Paragraph({
                                spacing: { before: 20, after: 30, line: 260 },
                                children: [
                                    new TextRun({
                                        text: stepDesc,
                                        font: FONT_FAMILY,
                                        size: 20,
                                        color: BODY_TEXT
                                    })
                                ]
                            })
                        ]
                    })
                ]
            })
        ]
    });
}

function createBullet(text, level = 0, boldPrefix = '') {
    const children = [];
    if (boldPrefix) {
        children.push(new TextRun({
            text: boldPrefix,
            font: FONT_FAMILY,
            size: 21,
            bold: true,
            color: DARK_TEXT
        }));
    }
    children.push(new TextRun({
        text: text,
        font: FONT_FAMILY,
        size: 21,
        color: BODY_TEXT
    }));

    return new Paragraph({
        bullet: { level: level },
        spacing: { before: 35, after: 50, line: 260 },
        children: children
    });
}

function createImageBlock(imageData, captionText, width = 560, height = 301) {
    if (!imageData) return [createParagraph(`[Hình ảnh không khả dụng: ${captionText}]`, { italics: true })];

    return [
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 160, after: 60 },
            children: [
                new ImageRun({
                    data: imageData,
                    transformation: { width: width, height: height }
                })
            ]
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 30, after: 180 },
            children: [
                new TextRun({
                    text: captionText,
                    font: FONT_FAMILY,
                    size: 19, // 9.5pt
                    italics: true,
                    bold: true,
                    color: SECONDARY_COLOR
                })
            ]
        })
    ];
}

function createCallout(title, text, type = 'info') {
    const borderColor = type === 'warning' ? WARNING_BORDER : (type === 'success' ? SUCCESS_BORDER : PRIMARY_COLOR);
    const bgColor = type === 'warning' ? 'FFFBEB' : (type === 'success' ? 'ECFDF5' : ACCENT_BG);

    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        borders: {
                            top: { style: BorderStyle.NONE },
                            bottom: { style: BorderStyle.NONE },
                            right: { style: BorderStyle.NONE },
                            left: { style: BorderStyle.SINGLE, size: 28, color: borderColor }
                        },
                        shading: { fill: bgColor },
                        margins: { top: 120, bottom: 120, left: 180, right: 180 },
                        children: [
                            new Paragraph({
                                spacing: { before: 30, after: 50 },
                                children: [
                                    new TextRun({
                                        text: title,
                                        font: FONT_FAMILY,
                                        size: 21,
                                        bold: true,
                                        color: borderColor
                                    })
                                ]
                            }),
                            new Paragraph({
                                spacing: { before: 20, after: 30, line: 260 },
                                children: [
                                    new TextRun({
                                        text: text,
                                        font: FONT_FAMILY,
                                        size: 20,
                                        color: BODY_TEXT
                                    })
                                ]
                            })
                        ]
                    })
                ]
            })
        ]
    });
}

function createStyledTable(headers, rowsData) {
    const headerRow = new TableRow({
        tableHeader: true,
        children: headers.map(h => new TableCell({
            shading: { fill: PRIMARY_COLOR },
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            borders: {
                top: { style: BorderStyle.SINGLE, size: 6, color: BORDER_COLOR },
                bottom: { style: BorderStyle.SINGLE, size: 12, color: PRIMARY_COLOR },
                left: { style: BorderStyle.SINGLE, size: 6, color: BORDER_COLOR },
                right: { style: BorderStyle.SINGLE, size: 6, color: BORDER_COLOR }
            },
            children: [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: h,
                            font: FONT_FAMILY,
                            size: 20,
                            bold: true,
                            color: 'FFFFFF'
                        })
                    ]
                })
            ]
        }))
    });

    const bodyRows = rowsData.map((row, idx) => {
        const rowBg = idx % 2 === 1 ? LIGHT_BG : 'FFFFFF';
        return new TableRow({
            children: row.map((cellText, cIdx) => new TableCell({
                shading: { fill: rowBg },
                margins: { top: 90, bottom: 90, left: 120, right: 120 },
                borders: {
                    top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
                    bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
                    left: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
                    right: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR }
                },
                children: [
                    new Paragraph({
                        alignment: cIdx === 0 ? AlignmentType.CENTER : AlignmentType.LEFT,
                        children: [
                            new TextRun({
                                text: cellText,
                                font: FONT_FAMILY,
                                size: 19,
                                color: BODY_TEXT
                            })
                        ]
                    })
                ]
            }))
        });
    });

    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [headerRow, ...bodyRows]
    });
}

// Main generation function
async function generateManual() {
    console.log('Reading captured images...');
    const imgDanhSach = readImageSafe('01_danh_sach_ho_so.png');
    const imgDongBo = readImageSafe('02_dong_bo_his.png');
    const imgInMaVach = readImageSafe('03_in_ma_vach.png');
    const imgFormNhapLieu = readImageSafe('04_form_nhap_lieu.png');
    const imgBanInMau3 = readImageSafe('05_ban_in_mau3.png');
    const imgQuanLyHopDong = readImageSafe('06_quan_ly_hop_dong.png');
    const imgTaoHopDongModal = readImageSafe('07_tao_hop_dong_modal.png');
    const imgTiepDonDuyetBn = readImageSafe('08_tiep_don_duyet_bn.png');

    const children = [];

    // ==================== TRANG BÌA ====================
    children.push(
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 80 },
            children: [
                new TextRun({
                    text: 'HỆ THỐNG QUẢN LÝ TỔNG THỂ BỆNH VIỆN - VIMES HIS',
                    font: FONT_FAMILY,
                    size: 24,
                    bold: true,
                    color: SECONDARY_COLOR
                })
            ]
        }),
        createTitle('SỔ TAY HƯỚNG DẪN SỬ DỤNG VẬN HÀNH'),
        createSubtitle('PHÂN HỆ KHÁM SỨC KHỎE ĐỊNH KỲ & LIÊN THÔNG DỮ LIỆU VNeID'),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 80, after: 160 },
            children: [
                new TextRun({
                    text: 'Tài liệu hướng dẫn thực hành chi tiết toàn bộ chu trình khám sức khỏe từ Tiếp nhận, Tạo hợp đồng, Import Excel, Khám chuyên khoa đến Liên thông VNeID',
                    font: FONT_FAMILY,
                    size: 21,
                    italics: true,
                    color: DARK_TEXT
                })
            ]
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 40, after: 300 },
            children: [
                new TextRun({
                    text: 'Căn cứ: Thông tư 32/2023/TT-BYT | Quyết định 1551/QĐ-BYT | Quyết định 2062/QĐ-BYT | Thông tư 36/2024/TT-BYT',
                    font: FONT_FAMILY,
                    size: 19,
                    bold: true,
                    color: '64748B'
                })
            ]
        })
    );

    // ==================== MỤC LỤC & SƠ ĐỒ ĐIỀU HƯỚNG ====================
    children.push(
        createHeading1('MỤC LỤC HƯỚNG DẪN NHANH THEO VAI TRÒ NGHIỆP VỤ'),
        createParagraph('Tài liệu được cấu trúc theo đúng trình tự luồng công việc thực tế tại cơ sở y tế. Nhân viên y tế có thể tra cứu nhanh theo vai trò của mình:'),
        createStyledTable(
            ['Phân hệ / Vị trí', 'Nội dung hướng dẫn chính', 'Màn hình tương ứng'],
            [
                ['Bộ phận Kế hoạch / Khám đoàn', 'Tạo hợp đồng, Import danh sách nhân viên từ Excel, gán gói khám', 'Menu: Quản lý hợp đồng (#/health-check?step=contracts)'],
                ['Bộ phận Tiếp đón bệnh nhân', 'Tìm kiếm nhân viên, phân phòng khám, duyệt bệnh nhân, in tem Barcode', 'Menu: Tiếp đón bệnh nhân (#/health-check?step=reception)'],
                ['Bác sĩ Khám lâm sàng', 'Khám thể lực (BMI), khám 7 chuyên khoa, duyệt chuyên khoa', 'Menu: Quản lý hồ sơ -> [Sửa / Khám] (DynamicForm)'],
                ['Khoa Xét nghiệm & CĐHA', 'Đồng bộ kết quả LIS/PACS, in tem ống nghiệm Barcode 50x30mm', 'Menu: In mã hồ sơ (#/health-check?step=print-code)'],
                ['Bác sĩ Kết luận & Lãnh đạo', 'Phân loại sức khỏe I - V, chẩn đoán ICD-10, ký số Cloud HSM / Token', 'Menu: Quản lý hồ sơ -> [Xem XML] & [Ký số]'],
                ['Tổ Công nghệ thông tin', 'Đóng gói XML QĐ 1551, gửi liên thông VNeID, cấu hình hệ thống', 'Menu: Cấu hình VNeID (#/health-check?step=settings)']
            ]
        ),
        new Paragraph({ spacing: { after: 150 } })
    );

    // ==================== CHƯƠNG 1 ====================
    children.push(
        createHeading1('CHƯƠNG 1: TỔNG QUAN HỆ THỐNG VÀ QUY TRÌNH NGHIỆP VỤ'),
        createParagraph('Phân hệ Khám sức khỏe liên thông VNeID trong VIMES HIS là giải pháp toàn diện giúp số hóa 100% hồ sơ khám sức khỏe định kỳ cho cá nhân, cơ quan, doanh nghiệp, trường học và người lái xe theo đúng các quy chuẩn pháp lý hiện hành của Bộ Y tế và Bộ Công an.'),
        
        createHeading2('1.1. Sơ đồ chu trình xử lý khép kín 9 bước'),
        createBullet('Tạo hợp đồng KSK và Import danh sách nhân sự từ file Excel (hoặc quét từ HIS Core).', 0, 'Bước 1: '),
        createBullet('Tiếp đón bệnh nhân tại quầy: Kiểm tra thông tin, phân phòng khám ban đầu, bấm Duyệt tiếp đón.', 0, 'Bước 2: '),
        createBullet('Cấp số hồ sơ (doc_no) và in tem Barcode hồ sơ, tem mã vạch ống nghiệm (LIMS).', 0, 'Bước 3: '),
        createBullet('Khám thể lực: Nhập chiều cao, cân nặng (hệ thống tự động tính chỉ số BMI và gợi ý phân loại), đo mạch, huyết áp.', 0, 'Bước 4: '),
        createBullet('Khám lâm sàng 7 chuyên khoa: Nội khoa, Ngoại khoa, Sản phụ khoa (bệnh nhân nữ), Mắt, TMH, RHM, Da liễu.', 0, 'Bước 5: '),
        createBullet('Cận lâm sàng tự động: Máy xét nghiệm tự động đẩy kết quả qua LIS và PACS, một chạm [Đồng bộ lại từ HIS].', 0, 'Bước 6: '),
        createBullet('Bác sĩ kết luận: Phân loại sức khỏe tổng thể (Loại I - V), kết luận bệnh tật mã ICD-10, tự động cập nhật bảng HIS Core.', 0, 'Bước 7: '),
        createBullet('Ký số điện tử: Ký số chuyên khoa của bác sĩ và Ký số đóng dấu cơ sở y tế (Cloud HSM hoặc USB Token).', 0, 'Bước 8: '),
        createBullet('Liên thông Cổng VNeID & In ấn: Đóng gói chuẩn XML truyền lên Cổng Bộ Y tế và in bản Giấy KSK A4 hoàn chỉnh.', 0, 'Bước 9: '),

        createHeading2('1.2. Danh mục các biểu mẫu khám sức khỏe chuẩn Bộ Y tế'),
        createStyledTable(
            ['Mã biểu mẫu', 'Tên biểu mẫu khám sức khỏe', 'Đối tượng áp dụng', 'Quy định pháp lý'],
            [
                ['Mẫu 01', 'Giấy khám sức khỏe định kỳ trẻ em', 'Trẻ em dưới 06 tuổi', 'Phụ lục XXIV - TT 32/2023/TT-BYT'],
                ['Mẫu 02', 'Giấy khám sức khỏe định kỳ học sinh / thiếu niên', 'Người từ đủ 06 tuổi đến dưới 18 tuổi', 'Phụ lục XXV - TT 32/2023/TT-BYT'],
                ['Mẫu 03', 'Giấy khám sức khỏe định kỳ người lớn', 'Người từ đủ 18 tuổi trở lên', 'Phụ lục XXVI - TT 32/2023/TT-BYT'],
                ['Mẫu Lái xe', 'Giấy khám sức khỏe của người lái xe', 'Thi cấp mới, đổi bằng A1, B1, B2, C, D, E', 'Thông tư số 36/2024/TT-BYT'],
                ['Mẫu Thuyền viên', 'Giấy khám sức khỏe định kỳ cho thuyền viên', 'Thuyền viên làm việc trên tàu biển', 'Quy chuẩn Bộ Giao thông Vận tải']
            ]
        ),
        new Paragraph({ spacing: { after: 150 } })
    );

    // ==================== CHƯƠNG 2 ====================
    children.push(
        createHeading1('CHƯƠNG 2: QUẢN LÝ HỢP ĐỒNG KSK & IMPORT DANH SÁCH NHÂN VIÊN TỪ EXCEL'),
        createParagraph('Chức năng Quản lý hợp đồng (truy cập tại: Menu bên trái -> Khám sức khỏe VNeID -> "Quản lý hợp đồng") cho phép bộ phận Kế hoạch / Khám đoàn thiết lập các đợt khám sức khỏe cho doanh nghiệp, công ty, trường học một cách nhanh chóng và chính xác.'),

        ...createImageBlock(imgQuanLyHopDong, 'Hình 1: Giao diện Quản lý Hợp đồng Khám sức khỏe & Danh sách nhân viên'),

        createHeading2('2.1. Thao tác Tạo mới Hợp đồng Khám sức khỏe'),
        createStepGuide(
            '1',
            'Mở cửa sổ tạo hợp đồng',
            'Tại màn hình Quản lý hợp đồng, nhấn nút [+ Thêm hợp đồng] màu xanh dương ở góc trên bên phải.'
        ),
        new Paragraph({ spacing: { after: 60 } }),
        createStepGuide(
            '2',
            'Điền thông tin hợp đồng',
            'Nhập các thông tin bắt buộc trong hộp thoại:\n' +
            '• Mã hợp đồng: Nhập mã định danh hợp đồng (VD: HD2026-XIMANG, HD-MAYMAC...).\n' +
            '• Tên hợp đồng: Tên đợt khám (VD: Khám sức khỏe định kỳ năm 2026 - Công ty Xi măng Vicem).\n' +
            '• Công ty / Doanh nghiệp: Chọn hoặc nhập tên đơn vị ký kết hợp đồng.\n' +
            '• Ngày ký & Ngày khám: Chọn ngày ký hợp đồng và ngày tổ chức khám thực tế.\n' +
            '• Loại đối tượng: Chọn đối tượng khám (BHYT, Thu phí / Dịch vụ, KSK Doanh nghiệp).\n' +
            '• Biểu mẫu áp dụng: Chọn Mẫu 03 (người lớn) hoặc Mẫu 02 (học sinh) làm mẫu mặc định.'
        ),
        new Paragraph({ spacing: { after: 60 } }),
        createStepGuide(
            '3',
            'Lưu hợp đồng',
            'Kiểm tra lại thông tin và nhấn nút [Lưu hợp đồng]. Hợp đồng mới tạo sẽ xuất hiện ngay trên danh sách với số lượng nhân viên ban đầu là 0.'
        ),
        new Paragraph({ spacing: { after: 100 } }),

        ...createImageBlock(imgTaoHopDongModal, 'Hình 2: Hộp thoại Tạo mới / Hiệu chỉnh Hợp đồng Khám sức khỏe'),

        createHeading2('2.2. Thao tác Import danh sách nhân viên từ file Excel'),
        createParagraph('Để đưa hàng trăm hoặc hàng nghìn nhân viên vào hợp đồng trong vài giây, hệ thống hỗ trợ tính năng Import từ file Excel thông minh:'),
        createStepGuide(
            '1',
            'Tải file mẫu Excel chuẩn',
            'Chọn hợp đồng cần import trên bảng danh sách, nhấn nút [Tải file mẫu Excel]. Hệ thống sẽ tự động xuất ra một file Excel mẫu chuẩn (.xlsx) chứa đầy đủ các cột tiêu đề.'
        ),
        new Paragraph({ spacing: { after: 60 } }),
        createStepGuide(
            '2',
            'Chuẩn bị dữ liệu nhân viên',
            'Điền thông tin nhân sự của cơ quan/doanh nghiệp vào file Excel theo các cột chuẩn:\n' +
            '• Mã nhân viên (bắt buộc, không trùng lặp trong cùng công ty).\n' +
            '• Họ và tên (chữ hoa hoặc chữ thường, hệ thống tự động chuẩn hóa in hoa).\n' +
            '• Ngày sinh (định dạng DD/MM/YYYY hoặc YYYY-MM-DD).\n' +
            '• Giới tính (Nam / Nữ hoặc 1 / 2).\n' +
            '• Số CCCD / CMND (12 chữ số chuẩn căn cước công dân gắn chip).\n' +
            '• Số điện thoại, Địa chỉ cư trú, Phòng ban / Bộ phận, Chức vụ công việc.'
        ),
        new Paragraph({ spacing: { after: 60 } }),
        createStepGuide(
            '3',
            'Nạp file và đối soát dữ liệu',
            'Nhấn nút [Nhập từ Excel] (Import Excel) -> Chọn file Excel vừa chuẩn bị. Hệ thống lập tức quét toàn bộ dòng dữ liệu, kiểm tra tính hợp lệ và hiển thị bảng xem trước (Preview).\n' +
            'Dòng hợp lệ được đánh dấu tick xanh, dòng có lỗi (như trùng CCCD, sai ngày sinh) sẽ được đánh dấu đỏ kèm lý do chi tiết.'
        ),
        new Paragraph({ spacing: { after: 60 } }),
        createStepGuide(
            '4',
            'Xác nhận nạp vào hợp đồng',
            'Nhấn nút [Xác nhận Import]. Toàn bộ nhân viên hợp lệ sẽ được ghi nhận vào cơ sở dữ liệu hợp đồng và sẵn sàng để bộ phận tiếp đón tiến hành đón tiếp.'
        ),
        new Paragraph({ spacing: { after: 100 } }),

        createHeading2('2.3. Thiết lập Gói dịch vụ khám cho hợp đồng'),
        createParagraph('Mỗi hợp đồng có thể có gói dịch vụ khám khác nhau tùy theo thỏa thuận kinh tế giữa bệnh viện và doanh nghiệp:'),
        createBullet('Chọn hợp đồng -> Chuyển sang Tab "Gói dịch vụ khám".', 0),
        createBullet('Tích chọn các dịch vụ kỹ thuật áp dụng: Khám lâm sàng đa khoa, Xét nghiệm công thức máu, Sinh hóa máu (Đường máu, Men gan, Ure, Creatinin), Nước tiểu 10 thông số, X-quang tim phổi thẳng, Siêu âm ổ bụng, Điện tim...', 0),
        createBullet('Nhấn nút [Lưu gói dịch vụ]. Khi bệnh nhân được tiếp đón, hệ thống sẽ tự động gán toàn bộ các chỉ định dịch vụ này vào hồ sơ.', 0),

        createHeading2('2.4. Tính năng Import hàng loạt hồ sơ từ HIS qua Excel (HisBatchImportModal)'),
        createParagraph('Tại màn hình Quản lý hồ sơ, nút [Import từ HIS (Excel)] hỗ trợ nhập danh sách các số hồ sơ khám tiếp nhận sẵn từ HIS Core:'),
        createBullet('Người dùng chỉ cần tải lên file Excel chứa danh sách cột Số hồ sơ (doc_no).', 0),
        createBullet('Hệ thống tự động kết nối sang bảng tiếp đón hms_doc và hms_patient trên HIS Core, truy xuất tự động toàn bộ hồ sơ và đồng bộ vào KSK.', 0),
        createBullet('Có thanh tiến trình (Progress bar) hiển thị trực quan: Số hồ sơ tạo mới, số hồ sơ cập nhật, số hồ sơ bỏ qua.', 0),
        new Paragraph({ spacing: { after: 150 } })
    );

    // ==================== CHƯƠNG 3 ====================
    children.push(
        createHeading1('CHƯƠNG 3: TIẾP ĐÓN BỆNH NHÂN & PHÊ DUYỆT CẤP SỐ HỒ SƠ TẠI QUẦY'),
        createParagraph('Màn hình Tiếp đón bệnh nhân (truy cập tại: Menu bên trái -> Khám sức khỏe VNeID -> "Tiếp đón bệnh nhân") là vị trí làm việc chính của điều dưỡng và nhân viên đón tiếp tại sảnh khám sức khỏe.'),

        ...createImageBlock(imgTiepDonDuyetBn, 'Hình 3: Giao diện Tiếp đón Bệnh nhân Khám sức khỏe & Phê duyệt cấp số hồ sơ'),

        createHeading2('3.1. Quy trình 4 bước Tiếp đón & Duyệt bệnh nhân tại quầy'),
        createStepGuide(
            '1',
            'Tìm kiếm bệnh nhân / nhân viên',
            'Khi người khám đến quầy, nhân viên tiếp đón có thể tìm kiếm theo 3 cách cực kỳ nhanh chóng:\n' +
            '• Cách 1: Dùng máy quét mã vạch quét trực tiếp CCCD gắn chip (hệ thống tự động trích xuất thông tin).\n' +
            '• Cách 2: Nhập số CCCD, Mã nhân viên hoặc Họ tên vào ô "Tìm kiếm bệnh nhân".\n' +
            '• Cách 3: Chọn Hợp đồng công ty tại hộp chọn để hiển thị toàn bộ danh sách nhân viên của đoàn.'
        ),
        new Paragraph({ spacing: { after: 60 } }),
        createStepGuide(
            '2',
            'Kiểm tra & Đối soát thông tin hành chính',
            'Hệ thống hiển thị thông tin chi tiết: Họ và tên, Ngày sinh, Giới tính, Số CCCD, Số điện thoại, Địa chỉ cư trú, Công ty và Tình trạng tiếp đón.\n' +
            'Nếu có thay đổi hoặc sai lệch, nhấn nút [Sửa thông tin] (biểu tượng bút chì) để cập nhật lại thông tin ngay tại chỗ.'
        ),
        new Paragraph({ spacing: { after: 60 } }),
        createStepGuide(
            '3',
            'Phân phòng khám chuyên khoa ban đầu',
            'Tại mục "Phòng khám tiếp nhận", chọn phòng khám ban đầu phù hợp (VD: Phòng khám Thể lực, Phòng khám Nội, Phòng KSK 1...).'
        ),
        new Paragraph({ spacing: { after: 60 } }),
        createStepGuide(
            '4',
            'Phê duyệt tiếp đón & Cấp số hồ sơ',
            'Nhấn nút [Duyệt & Cấp số hồ sơ] (hoặc bấm phím nóng F4 / Ctrl + Enter). Hệ thống tự động:\n' +
            '• Cấp số hồ sơ khám ngoại trú (doc_no) chính thức.\n' +
            '• Sinh mã vạch định danh hồ sơ (Barcode Code 128).\n' +
            '• Chuyển trạng thái nhân viên sang "ĐÃ TIẾP ĐÓN".\n' +
            '• Tự động kích hoạt máy in in Phiếu hướng dẫn khám và tem Barcode hồ sơ dán sổ.'
        ),
        new Paragraph({ spacing: { after: 100 } }),

        createCallout(
            'Phím tắt thao tác nhanh tại Quầy Tiếp đón',
            '• Phím Enter tại ô tìm kiếm: Thực hiện tìm kiếm bệnh nhân.\n' +
            '• Phím F4 hoặc Ctrl + Enter: Xác nhận duyệt tiếp nhận bệnh nhân đang chọn.\n' +
            '• Tùy chọn "Tự động làm mới": Khi bật, hệ thống tự động xóa ô tìm kiếm sau khi duyệt xong để sẵn sàng quét người tiếp theo, tốc độ tiếp đón chỉ 3 - 5 giây / bệnh nhân!',
            'info'
        ),
        new Paragraph({ spacing: { after: 150 } })
    );

    // ==================== CHƯƠNG 4 ====================
    children.push(
        createHeading1('CHƯƠNG 4: QUẢN LÝ DANH SÁCH & ĐIỀU PHỐI HỒ SƠ TOÀN VIỆN'),
        createParagraph('Màn hình "Quản lý hồ sơ" (truy cập tại: Menu bên trái -> Khám sức khỏe VNeID -> "Quản lý hồ sơ") là trung tâm theo dõi tiến độ toàn viện, giúp điều phối luồng bệnh nhân giữa các phòng khám chuyên khoa.'),

        ...createImageBlock(imgDanhSach, 'Hình 4: Giao diện Quản lý Danh sách Hồ sơ Khám sức khỏe & Thanh tác vụ điều phối'),

        createHeading2('4.1. Hệ thống Bộ lọc & Tìm kiếm thông minh'),
        createBullet('Bộ lọc ngày: Mặc định lọc ngày hiện tại, cho phép chọn bất kỳ khoảng thời gian Từ ngày - Đến ngày.', 0),
        createBullet('Bộ lọc biểu mẫu: Lọc riêng Mẫu 01 (trẻ em), Mẫu 02 (học sinh), Mẫu 03 (người lớn), Mẫu Lái xe.', 0),
        createBullet('Bộ lọc Hợp đồng đoàn: Lọc riêng từng cơ quan, công ty.', 0),
        createBullet('Bộ lọc Trạng thái: Chưa duyệt, Đã duyệt chuyên khoa, Đã ký số, Đã gửi VNeID thành công, Gửi lỗi.', 0),

        createHeading2('4.2. Ý nghĩa 5 nút tác vụ trên từng dòng hồ sơ'),
        createStyledTable(
            ['Nút tác vụ', 'Biểu tượng', 'Chức năng nghiệp vụ & Cách sử dụng'],
            [
                ['[IN]', 'Máy in (Xanh lá)', 'Mở trực tiếp bản in PDF Giấy khám sức khỏe A4 hoàn chỉnh với dữ liệu chuyên khoa mới nhất.'],
                ['[Sửa / Khám]', 'Bút chì (Xanh dương)', 'Mở Form nhập liệu DynamicForm để bác sĩ tiến hành khám, cho điểm và phân loại.'],
                ['[Xem XML]', 'Tệp tin (Xám đậm)', 'Hiển thị dữ liệu XML đóng gói chuẩn QĐ 1551/QĐ-BYT để kiểm tra cấu trúc trước khi truyền.'],
                ['[Gửi VNeID]', 'Đám mây (Tím)', 'Gửi trực tiếp hồ sơ đã ký số lên Cổng tiếp nhận dữ liệu Bộ Y tế.'],
                ['[Xóa]', 'Thùng rác (Đỏ)', 'Xóa hồ sơ nháp khỏi danh sách (yêu cầu quyền quản trị).']
            ]
        ),
        new Paragraph({ spacing: { after: 150 } })
    );

    // ==================== CHƯƠNG 5 ====================
    children.push(
        createHeading1('CHƯƠNG 5: NHẬP LIỆU KHÁM LÂM SÀNG CHUYÊN KHOA (DYNAMIC FORM)'),
        createParagraph('Biểu mẫu khám DynamicForm tự động thích ứng linh hoạt theo độ tuổi và loại mẫu khám, đảm bảo ghi nhận đầy đủ từng chuyên khoa theo đúng quy định Thông tư 32/2023/TT-BYT.'),

        ...createImageBlock(imgFormNhapLieu, 'Hình 5: Giao diện Form nhập liệu Khám Lâm sàng Chuyên khoa và Tính toán Thể lực tự động'),

        createHeading2('5.1. Khám Thể lực & Tự động tính chỉ số BMI'),
        createParagraph('Nhân viên y tế chỉ cần nhập Chiều cao (cm) và Cân nặng (kg), hệ thống sẽ lập tức:'),
        createBullet('Tự động tính chỉ số khối cơ thể: BMI = Cân nặng (kg) / [Chiều cao (m)]².', 0),
        createBullet('Tự động gợi ý Phân loại thể lực: Loại I (BMI 18.5 - 22.9), Loại II, Loại III hoặc Thừa cân / Suy dinh dưỡng.', 0),
        createBullet('Đo và ghi nhận: Huyết áp tâm thu / tâm trương (mmHg), Mạch đập (lần/phút), Vòng ngực trung bình (cm).', 0),

        createHeading2('5.2. Khám 7 chuyên khoa lâm sàng bắt buộc'),
        createBullet('1. Nội khoa: Tuần hoàn, Hô hấp, Tiêu hóa, Thận - Tiết niệu, Cơ xương khớp, Thần kinh, Tâm thần.', 0),
        createBullet('2. Ngoại khoa: Khám hệ vận động, cột sống, vết thương cũ, dị tật.', 0),
        createBullet('3. Sản phụ khoa (Dành riêng cho nữ): Khám sản khoa, phụ khoa. Đối với bệnh nhân nam, hệ thống tự động khóa và in chữ "Không khám" theo chuẩn pháp lý Bộ Y tế.', 0),
        createBullet('4. Mắt: Đo thị lực từng mắt (không kính và có kính), kiểm tra sắc giác (bình thường, mù màu đỏ/xanh/toàn bộ), đo thị trường ngang và đứng.', 0),
        createBullet('5. Tai - Mũi - Họng: Đo thính lực tai trái/phải (nói thường, nói thầm, thính lực tần số 500 - 6000 Hz).', 0),
        createBullet('6. Răng - Hàm - Mặt: Đếm răng sâu, mất răng, kiểm tra hàm trên, hàm dưới, viêm nha chu.', 0),
        createBullet('7. Da liễu: Phát hiện các bệnh ngoài da truyền nhiễm hoặc dị ứng tiếp xúc.', 0),

        createCallout(
            'Mẹo tăng tốc độ khám đoàn với tính năng "Điền nhanh kết quả mặc định"',
            'Tại góc trên form khám, bác sĩ có thể nhấn nút "Điền nhanh bình thường". Hệ thống sẽ tự động điền các kết quả lâm sàng bình thường chuẩn hóa cho tất cả các chuyên khoa. Bác sĩ chỉ cần sửa đổi các chuyên khoa có phát hiện bệnh lý bất thường, giúp tiết kiệm đến 80% thời gian khám đoàn số lượng lớn!',
            'info'
        ),
        new Paragraph({ spacing: { after: 150 } })
    );

    // ==================== CHƯƠNG 6 ====================
    children.push(
        createHeading1('CHƯƠNG 6: ĐỒNG BỘ CẬN LÂM SÀNG TỰ ĐỘNG & ĐẨY NGƯỢC HIS CORE'),
        createParagraph('Phân hệ được tích hợp hai chiều với hệ thống LIS (Phòng Xét nghiệm) và PACS (Chẩn đoán hình ảnh):'),
        createBullet('Đồng bộ tự động từ máy xét nghiệm: Khi phòng Lab duyệt kết quả trên HIS, bác sĩ chỉ cần bấm nút [🔄 Đồng bộ kết quả từ HIS], hệ thống tự động nạp Công thức máu, Sinh hóa, Nước tiểu 10 thông số.', 0),
        createBullet('Đồng bộ kết quả CĐHA: Tự động lấy kết quả đọc X-quang tim phổi thẳng, Siêu âm ổ bụng tổng quát, Điện tâm đồ (ECG).', 0),
        createBullet('Đồng bộ ngược về HIS Core (hms_exm_conclusion): Ngay khi bác sĩ lưu hồ sơ, hệ thống tự động cập nhật phân loại sức khỏe, danh sách bệnh tật chính và tên bác sĩ kết luận về bảng Core HIS, đảm bảo dữ liệu toàn viện luôn nhất quán.', 0),
        new Paragraph({ spacing: { after: 150 } })
    );

    // ==================== CHƯƠNG 7 ====================
    children.push(
        createHeading1('CHƯƠNG 7: KẾT LUẬN, PHÂN LOẠI SỨC KHỎE & KÝ SỐ ĐIỆN TỬ'),
        createParagraph('Phân loại sức khỏe tổng thể tuân thủ nghiêm ngặt theo quy định tại Thông tư 32/2023/TT-BYT:'),
        createStyledTable(
            ['Phân loại', 'Đánh giá sức khỏe', 'Tiêu chuẩn phân loại theo Bộ Y tế'],
            [
                ['Loại I', 'Rất khỏe', 'Tất cả các chuyên khoa khám lâm sàng và cận lâm sàng đều xếp Loại I.'],
                ['Loại II', 'Khỏe', 'Có ít nhất một chuyên khoa xếp Loại II, không có chuyên khoa nào xếp Loại III trở xuống.'],
                ['Loại III', 'Trung bình', 'Có ít nhất một chuyên khoa xếp Loại III, không có chuyên khoa nào xếp Loại IV hoặc V.'],
                ['Loại IV', 'Yếu', 'Có ít nhất một chuyên khoa xếp Loại IV, người khám cần được theo dõi và điều trị.'],
                ['Loại V', 'Rất yếu', 'Có chuyên khoa xếp Loại V hoặc mắc các bệnh mạn tính nặng theo danh mục Bộ Y tế.']
            ]
        ),
        new Paragraph({ spacing: { after: 100 } }),
        createHeading2('7.1. Ký số điện tử (Cloud HSM & USB Token)'),
        createBullet('Hỗ trợ Cloud HSM ký số từ xa không cần cắm USB vật lý (VNPT-CA, Viettel-CA, BKAV-CA).', 0),
        createBullet('Hỗ trợ USB Token vật lý thông qua ứng dụng VIMES Signer Agent cắm trực tiếp tại máy tính trạm.', 0),
        createBullet('Sau khi ký số thành công, hồ sơ được khóa chống sửa đổi, đảm bảo tính toàn vẹn và pháp lý điện tử cao nhất.', 0),
        new Paragraph({ spacing: { after: 150 } })
    );

    // ==================== CHƯƠNG 8 ====================
    children.push(
        createHeading1('CHƯƠNG 8: ĐÓNG GÓI XML & LIÊN THÔNG DỮ LIỆU CỔNG BỘ Y TẾ (VNeID)'),
        createParagraph('Phân hệ thực hiện đóng gói dữ liệu Giấy khám sức khỏe điện tử theo đúng cấu trúc XML quy định tại Quyết định 1551/QĐ-BYT và Quyết định 2062/QĐ-BYT:'),
        createBullet('XML1: Thông tin hành chính của cơ sở khám chữa bệnh và người khám.', 0),
        createBullet('XML2: Kết quả chi tiết các dịch vụ Cận lâm sàng (Xét nghiệm, Chẩn đoán hình ảnh).', 0),
        createBullet('XML3: Kết quả khám lâm sàng từng chuyên khoa, phân loại sức khỏe và kết luận bệnh tật.', 0),
        createBullet('Thao tác liên thông: Bấm nút [Gửi VNeID] -> Hệ thống gửi qua kênh bảo mật TLS 1.3 và nhận mã Transaction ID từ Cổng tiếp nhận Bộ Y tế.', 0),
        createBullet('Kết quả liên thông hiển thị ngay trên ứng dụng VNeID của người dân.', 0),
        new Paragraph({ spacing: { after: 150 } })
    );

    // ==================== CHƯƠNG 9 ====================
    children.push(
        createHeading1('CHƯƠNG 9: IN ẤN GIẤY KHÁM SỨC KHỎE & QUẢN LÝ IN MÃ VẠCH (BARCODE)'),
        createParagraph('Hệ thống trang bị bộ giải pháp in ấn chuyên nghiệp, dàn trang tự động 2 mặt A4 sắc nét theo đúng quy chuẩn Bộ Y tế:'),

        ...createImageBlock(imgBanInMau3, 'Hình 6: Bản in Giấy khám sức khỏe định kỳ Mẫu 03 hoàn chỉnh theo Thông tư 32/2023/TT-BYT'),

        createHeading2('9.1. Quản lý In mã vạch (Barcode) hồ sơ & Ống nghiệm phòng Lab'),
        createParagraph('Tại tab "In mã hồ sơ" (#/health-check?step=print-code), nhân viên có thể in tem mã vạch định danh:'),

        ...createImageBlock(imgInMaVach, 'Hình 7: Giao diện Quản lý In Mã vạch Hồ sơ & Tem Barcode Xét nghiệm'),

        createBullet('Tem Barcode hồ sơ: Định dạng Code 128 hoặc QR Code dán sổ khám bệnh.', 0),
        createBullet('Tem Barcode ống nghiệm: Chuẩn kích thước 50x30 mm (hoặc 2 tem/hàng, 3 tem/hàng), hiển thị Họ tên, Năm sinh, Giới tính, Loại mẫu và mã vạch cho máy xét nghiệm tự động.', 0),
        new Paragraph({ spacing: { after: 150 } })
    );

    // ==================== CHƯƠNG 10 ====================
    children.push(
        createHeading1('CHƯƠNG 10: HƯỚNG DẪN XỬ LÝ SỰ CỐ & CÂU HỎI THƯỜNG GẶP (FAQ)'),
        createParagraph('Bảng tra cứu nhanh các tình huống thường gặp trong quá trình vận hành tại bệnh viện:'),

        createStyledTable(
            ['Hiện tượng / Câu hỏi', 'Nguyên nhân', 'Cách xử lý nhanh'],
            [
                [
                    'Không thấy nhân viên hợp đồng tại quầy Tiếp đón?',
                    'Hợp đồng chưa được nạp danh sách nhân viên hoặc chọn sai hợp đồng.',
                    'Vào mục Quản lý hợp đồng, kiểm tra cột "Số nhân viên". Nếu là 0, thực hiện Import Excel danh sách nhân viên.'
                ],
                [
                    'Import Excel báo lỗi "Trùng số CCCD"?',
                    'File Excel có 2 dòng trùng số CCCD hoặc nhân viên đã có hồ sơ trong hợp đồng khác.',
                    'Kiểm tra lại số CCCD trên file Excel hoặc xóa dòng nhân viên trùng lặp trước khi import lại.'
                ],
                [
                    'Mục Sản phụ khoa hiển thị "Chưa khám" khi in Mẫu 03?',
                    'Bác sĩ chưa chọn trạng thái "Đã khám/Đã duyệt" hoặc chưa bấm Lưu hồ sơ.',
                    'Mở form khám, kiểm tra tab Sản phụ khoa, chọn trạng thái "Đã khám", chọn bác sĩ khám và bấm [Lưu hồ sơ].'
                ],
                [
                    'Bệnh nhân nam có hiển thị mục Sản phụ khoa không?',
                    'Quy chuẩn Bộ Y tế yêu cầu thể hiện đủ 7 chuyên khoa.',
                    'Hệ thống tự động nhận diện giới tính Nam và in chữ "Không khám", hoàn toàn đúng chuẩn pháp lý.'
                ],
                [
                    'Cổng VNeID báo lỗi "Mã ICD-10 không hợp lệ"?',
                    'Bác sĩ nhập sai mã chẩn đoán hoặc gõ mã không có trong danh mục Bộ Y tế.',
                    'Mở Tab V (Kết luận), xóa mã cũ và chọn mã bệnh chuẩn từ danh mục gợi ý tự động của hệ thống.'
                ],
                [
                    'Lỗi không kết nối được USB Token ký số?',
                    'Chưa cắm USB Token hoặc phần mềm Signer Agent chưa được bật.',
                    'Cắm lại USB Token, khởi chạy ứng dụng VIMES Signer Agent dưới thanh Taskbar và thực hiện ký lại.'
                ]
            ]
        ),
        new Paragraph({ spacing: { after: 250 } }),

        createCallout(
            'Hỗ trợ kỹ thuật chuyên trách VIMES HIS',
            'Mọi khó khăn, vướng mắc trong quá trình cài đặt, đào tạo và vận hành thực tế tại cơ sở y tế, vui lòng liên hệ Bộ phận Kỹ thuật & Triển khai Hệ thống VIMES HIS để được hỗ trợ từ xa kịp thời qua UltraViewer hoặc Hotline hỗ trợ 24/7.',
            'success'
        ),
        new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 250, after: 80 },
            children: [
                new TextRun({
                    text: 'BAN PHÁT TRIỂN & VẬN HÀNH HỆ THỐNG VIMES HIS',
                    font: FONT_FAMILY,
                    size: 21,
                    bold: true,
                    color: PRIMARY_COLOR
                })
            ]
        })
    );

    // Document Construction
    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: {
                        font: FONT_FAMILY,
                        size: 21,
                        color: BODY_TEXT
                    },
                    paragraph: {
                        spacing: { line: 270 }
                    }
                }
            }
        },
        sections: [{
            properties: {
                page: {
                    margin: {
                        top: convertInchesToTwip(0.8),
                        bottom: convertInchesToTwip(0.8),
                        left: convertInchesToTwip(0.85),
                        right: convertInchesToTwip(0.85)
                    }
                }
            },
            headers: {
                default: new Header({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            spacing: { after: 100 },
                            children: [
                                new TextRun({
                                    text: 'VIMES HIS - Hướng dẫn sử dụng Phân hệ Khám sức khỏe liên thông VNeID (QĐ 1551 & TT 32)',
                                    font: FONT_FAMILY,
                                    size: 18,
                                    italics: true,
                                    color: '64748B'
                                })
                            ]
                        })
                    ]
                })
            },
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            spacing: { before: 100 },
                            children: [
                                new TextRun({
                                    text: 'Trang ',
                                    font: FONT_FAMILY,
                                    size: 18,
                                    color: '64748B'
                                }),
                                new TextRun({
                                    children: [PageNumber.CURRENT],
                                    font: FONT_FAMILY,
                                    size: 18,
                                    color: '64748B'
                                }),
                                new TextRun({
                                    text: ' / ',
                                    font: FONT_FAMILY,
                                    size: 18,
                                    color: '64748B'
                                }),
                                new TextRun({
                                    children: [PageNumber.TOTAL_PAGES],
                                    font: FONT_FAMILY,
                                    size: 18,
                                    color: '64748B'
                                })
                            ]
                        })
                    ]
                })
            },
            children: children
        }]
    });

    console.log('Packing Word document to buffer...');
    const buffer = await Packer.toBuffer(doc);
    
    const outputPath = path.join(__dirname, '../../modules/health-check-sync/docs/Huong_Dan_Su_Dung_Module_Kham_Suc_Khoe_VNeID.docx');
    fs.writeFileSync(outputPath, buffer);
    console.log(`[SUCCESS] Word document created successfully: ${outputPath} (${buffer.length} bytes)`);
}

generateManual().catch(err => {
    console.error('[ERROR] Failed to generate manual:', err);
    process.exit(1);
});
