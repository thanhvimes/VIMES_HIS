const fs = require('fs');
const path = require('path');
const docxPath = path.resolve(__dirname, '../../../backend/node_modules/docx');
const { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  BorderStyle, 
  AlignmentType, 
  ImageRun, 
  ShadingType, 
  PageBreak,
  Header,
  Footer,
  PageNumber
} = require(docxPath);

const baseDocsDir = path.resolve(__dirname, '../docs');
const imagesDir = path.join(baseDocsDir, 'images');
const outputDocxPath = path.join(baseDocsDir, 'TEMPLATE_STUDIO_USER_GUIDE.docx');

function readImage(filename) {
  const filePath = path.join(imagesDir, filename);
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath);
  }
  console.warn('Image not found:', filePath);
  return null;
}

const primaryColor = '0052CC';
const darkColor = '172B4D';
const lightBg = 'F4F5F7';
const borderColor = 'DFE1E6';
const greenColor = '00875A';
const amberColor = 'FF991F';

function makeHeading1(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160 },
    run: { font: 'Arial', size: 30, bold: true, color: primaryColor }
  });
}

function makeHeading2(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 260, after: 120 },
    run: { font: 'Arial', size: 24, bold: true, color: darkColor }
  });
}

function makeHeading3(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 180, after: 80 },
    run: { font: 'Arial', size: 22, bold: true, color: '333333' }
  });
}

function makeParagraph(text, options = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 100, line: 276 },
    alignment: options.alignment || AlignmentType.LEFT,
    children: [
      new TextRun({
        text: text,
        font: 'Arial',
        size: options.size || 22,
        bold: options.bold || false,
        italics: options.italics || false,
        color: options.color || '222222'
      })
    ]
  });
}

function makeBullet(text, boldPrefix = '') {
  const children = [];
  if (boldPrefix) {
    children.push(new TextRun({ text: boldPrefix + ' ', font: 'Arial', size: 22, bold: true, color: darkColor }));
  }
  children.push(new TextRun({ text: text, font: 'Arial', size: 22, color: '333333' }));
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { before: 40, after: 60, line: 260 },
    children: children
  });
}

function makeImageBlock(imageBuffer, caption, width = 580, height = 320) {
  if (!imageBuffer) return new Paragraph({ text: `[Hình ảnh: ${caption}]` });
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 140, after: 60 },
      children: [
        new ImageRun({
          data: imageBuffer,
          transformation: { width: width, height: height }
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 40, after: 160 },
      children: [
        new TextRun({
          text: `Hình: ${caption}`,
          font: 'Arial',
          size: 18,
          italics: true,
          color: '666666'
        })
      ]
    })
  ];
}

function makeTable(headers, rows) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map(h => new TableCell({
      shading: { fill: primaryColor, type: ShadingType.CLEAR },
      margins: { top: 120, bottom: 120, left: 140, right: 140 },
      children: [
        new Paragraph({
          children: [new TextRun({ text: h, font: 'Arial', size: 20, bold: true, color: 'FFFFFF' })]
        })
      ]
    }))
  });

  const dataRows = rows.map((r, rowIndex) => new TableRow({
    children: r.map(c => new TableCell({
      shading: { fill: rowIndex % 2 === 0 ? 'FFFFFF' : lightBg, type: ShadingType.CLEAR },
      margins: { top: 100, bottom: 100, left: 140, right: 140 },
      children: [
        new Paragraph({
          children: [new TextRun({ text: c, font: 'Arial', size: 20, color: '333333' })]
        })
      ]
    }))
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows]
  });
}

async function buildDocx() {
  console.log('Generating TEMPLATE_STUDIO_USER_GUIDE.docx...');

  const imgDashboard = readImage('01_staff_dashboard.png');
  const imgCatalog = readImage('02_field_catalog.png');
  const imgTestLab = readImage('03_test_lab.png');
  const imgVersions = readImage('04_version_history.png');
  const imgAudit = readImage('05_audit_log.png');

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }
          }
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: 'VIMES HIS — HƯỚNG DẪN SỬ DỤNG TEMPLATE STUDIO', font: 'Arial', size: 16, color: '888888' })
                ]
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: 'Trang ', font: 'Arial', size: 18, color: '888888' }),
                  new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 18, color: '888888' }),
                  new TextRun({ text: ' / ', font: 'Arial', size: 18, color: '888888' }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Arial', size: 18, color: '888888' })
                ]
              })
            ]
          })
        },
        children: [
          // Title Cover Block
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 300, after: 100 },
            children: [
              new TextRun({ text: 'HỆ THỐNG QUẢN LÝ TỔNG THỂ BỆNH VIỆN VIMES HIS', font: 'Arial', size: 24, bold: true, color: primaryColor })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 80, after: 200 },
            children: [
              new TextRun({ text: 'TÀI LIỆU HƯỚNG DẪN SỬ DỤNG', font: 'Arial', size: 36, bold: true, color: darkColor })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 300 },
            children: [
              new TextRun({ text: 'PHÂN HỆ THIẾT LẬP MẪU BIỂU (VIMES TEMPLATE STUDIO)', font: 'Arial', size: 26, bold: true, color: primaryColor })
            ]
          }),

          // Metadata block
          makeTable(
            ['Thông tin', 'Chi tiết'],
            [
              ['Tên phân hệ', 'Thiết lập Mẫu biểu (Template Studio / Document Engine)'],
              ['Đối tượng sử dụng', 'Kỹ sư VIMES, Cán bộ IT Bệnh viện, Trưởng khoa KHTH, Quản trị viên'],
              ['Phiên bản tài liệu', '1.0 (Phát hành năm 2026)'],
              ['Công nghệ lõi', 'Microsoft Word (.docx OpenXML), Carbone v5, LibreOffice, BullMQ']
            ]
          ),

          new Paragraph({ children: [new PageBreak()] }),

          // Section 1
          makeHeading1('1. Giới thiệu tổng quan phân hệ'),
          makeParagraph('VIMES Template Studio là phân hệ quản lý và thiết lập biểu mẫu y tế động dành cho Cán bộ kỹ thuật VIMES và Đội ngũ IT Bệnh viện.'),
          makeParagraph('Phân hệ giải quyết triệt để các hạn chế của phương pháp lập trình báo cáo truyền thống bằng cách kết hợp sức mạnh định dạng của Microsoft Word với công nghệ sinh tài liệu tốc độ cao Carbone v5:'),
          makeBullet('Thiết kế trực tiếp trên file Word (.docx) quen thuộc, không cần viết mã HTML/CSS.', '• Thiết kế trực quan:'),
          makeBullet('Gắn thẻ dữ liệu chuẩn như {d.patient.fullName}, {d.items[i].name} để đổ dữ liệu từ bệnh án điện tử.', '• Thẻ dữ liệu Carbone:'),
          makeBullet('Môi trường kiểm thử dữ liệu lâm sàng tức thì (Test Lab) với các kịch bản thực tế.', '• Phòng kiểm thử:'),
          makeBullet('Bản nháp ➔ Chờ duyệt ➔ Đã duyệt ➔ Phát hành ➔ Ngừng sử dụng.', '• Vòng đời phiên bản:'),
          makeBullet('Khôi phục phiên bản trước chỉ trong 1 giây khi có sự cố phát sinh.', '• Khôi phục Rollback:'),

          // Section 2
          makeHeading1('2. Phân quyền và Vai trò người dùng'),
          makeParagraph('Hệ thống áp dụng nguyên tắc phân tách quyền hạn (Separation of Duties - SoD) nghiêm ngặt:'),
          makeTable(
            ['Vai trò', 'Mã quyền hệ thống', 'Nhiệm vụ & Quyền hạn'],
            [
              ['Designer (Thiết kế)', 'DOCUMENT_TEMPLATE_EDIT', 'Tạo bản nháp, tải/upload file Word, chỉnh sửa dữ liệu test, gửi duyệt.'],
              ['Tester (Kiểm thử)', 'DOCUMENT_TEMPLATE_TEST', 'Chạy các kịch bản kiểm thử lâm sàng, xuất file PDF/DOCX thử nghiệm.'],
              ['Reviewer (Thẩm duyệt)', 'DOCUMENT_TEMPLATE_REVIEW', 'Xem xét mẫu biểu, duyệt (APPROVE) hoặc trả lại bản nháp (REJECT).'],
              ['Publisher (Phát hành)', 'DOCUMENT_TEMPLATE_PUBLISH', 'Phát hành phiên bản ra toàn viện (PUBLISH), thực hiện ROLLBACK.'],
              ['Quản trị viên (Admin)', 'DOCUMENT_TEMPLATE_ADMIN / admin', 'Toàn quyền thao tác trên tất cả các mẫu biểu của bệnh viện.']
            ]
          ),

          // Section 3
          makeHeading1('3. Truy cập phân hệ từ Dashboard'),
          makeParagraph('1. Đăng nhập vào hệ thống VIMES HIS bằng tài khoản được cấp quyền (ví dụ: admin / 1).'),
          makeParagraph('2. Trên màn hình Staff Dashboard (#/staff-dashboard), tìm thẻ "Thiết lập Mẫu biểu" tại vị trí số 7 (nhóm Phân hệ nghiệp vụ).'),
          makeParagraph('3. Bấm vào thẻ để chuyển thẳng tới giao diện Template Studio.'),
          ...makeImageBlock(imgDashboard, 'Vị trí phân hệ Thiết lập Mẫu biểu trên Staff Dashboard'),

          // Section 4
          makeHeading1('4. Bố cục giao diện làm việc'),
          makeParagraph('Giao diện Template Studio được tổ chức khoa học thành 2 khu vực chính:'),
          makeBullet('Liệt kê toàn bộ các biểu mẫu y tế (Đơn thuốc, Giấy ra viện, Phiếu xét nghiệm, Khám ngoại trú, Tờ điều trị...).', '1. Danh sách mẫu bên trái:'),
          makeBullet('Chứa tên mẫu, phiên bản, nhãn trạng thái và hàng nút tác vụ nhanh:', '2. Không gian làm việc bên phải:'),
          makeBullet('Tải file Word mẫu mới lên hệ thống sau khi chỉnh sửa trên máy tính.', '   - Nút Upload DOCX:'),
          makeBullet('Tải file Word mẫu hiện tại về máy tính cá nhân để chỉnh sửa.', '   - Nút Tải DOCX:'),
          makeBullet('Xuất file PDF xem trước ngay lập tức trong tab mới trình duyệt.', '   - Nút Test PDF:'),
          makeBullet('Tạo một bản nháp mới từ phiên bản đang hoạt động.', '   - Nút Tạo version mới:'),
          makeBullet('Gửi bản nháp sang trạng thái chờ lãnh đạo phê duyệt.', '   - Nút Gửi duyệt:'),

          new Paragraph({ children: [new PageBreak()] }),

          // Section 5
          makeHeading1('5. Hướng dẫn chi tiết 4 Tab chức năng'),
          
          makeHeading2('5.1. Tab Trường dữ liệu (Field Catalog)'),
          makeParagraph('Tab này cung cấp từ điển toàn bộ các biến dữ liệu lâm sàng mà hệ thống HIS truyền vào mẫu biểu:'),
          ...makeImageBlock(imgCatalog, 'Tab "Trường dữ liệu" liệt kê cấu trúc dữ liệu và thẻ Carbone'),
          makeBullet('Tên biến trong cơ sở dữ liệu (ví dụ: patient.fullName, items.name).', '• Đường dẫn:'),
          makeBullet('Kiểu dữ liệu (string, number, array, object).', '• Kiểu:'),
          makeBullet('Thẻ cú pháp dán vào Word (ví dụ: {d.patient.fullName}, {d.items[i].name}).', '• Tag Carbone:'),
          makeBullet('Bấm để copy nhanh thẻ vào bộ nhớ đệm, sau đó dán thẳng vào file Word.', '• Nút Sao chép:'),

          makeHeading2('5.2. Tab Phòng kiểm thử (Test Lab)'),
          makeParagraph('Nơi kiểm thử mẫu biểu với dữ liệu thực tế trước khi phát hành ra phòng khám:'),
          ...makeImageBlock(imgTestLab, 'Tab "Test Lab" hỗ trợ kiểm thử theo kịch bản và form nhập liệu'),
          makeBullet('Kịch bản chuẩn của ca khám bệnh thông thường.', '• Kịch bản Bình thường:'),
          makeBullet('Kiểm tra tên bệnh nhân hoặc địa chỉ dài xem có bị vỡ khung không.', '• Kịch bản Tên siêu dài:'),
          makeBullet('Kiểm tra đơn thuốc 20-50 loại xem việc tự động ngắt trang có chuẩn không.', '• Kịch bản Nhiều dòng:'),
          makeBullet('Lưu lại bộ dữ liệu test mẫu cho phiên bản nháp.', '• Nút Lưu dữ liệu test:'),

          makeHeading2('5.3. Tab Quản lý phiên bản (Versions)'),
          makeParagraph('Theo dõi toàn bộ vòng đời phát triển và lịch sử các bản phát hành:'),
          ...makeImageBlock(imgVersions, 'Tab "Phiên bản" theo dõi lịch sử và mã băm SHA-256'),
          makeBullet('Mã băm SHA-256 bảo đảm tính toàn vẹn của tệp Word gốc, chống sửa đổi trái phép.', '• Chữ ký SHA-256:'),
          makeBullet('Định danh rõ nhân viên kỹ thuật thực hiện thay đổi và thời gian chính xác.', '• Người tạo & Ngày tạo:'),
          makeBullet('Xóa bỏ bản nháp chưa phát hành nếu không còn sử dụng.', '• Nút Xóa bản nháp:'),

          makeHeading2('5.4. Tab Nhật ký hoạt động (Audit Log)'),
          makeParagraph('Lưu trữ nhật ký kiểm toán phục vụ công tác thanh tra chất lượng bệnh viện:'),
          ...makeImageBlock(imgAudit, 'Tab "Nhật ký" lưu trữ chi tiết mọi thao tác và người thực hiện'),

          new Paragraph({ children: [new PageBreak()] }),

          // Section 6
          makeHeading1('6. Quy trình 6 bước thiết kế và phát hành mẫu biểu'),
          makeParagraph('Để tạo và phát hành một biểu mẫu mới, thực hiện tuần tự 6 bước sau:'),
          makeBullet('Vào mẫu biểu cần sửa, bấm nút màu xanh "Tạo version mới" góc trên bên phải để sinh ra Bản nháp.', 'Bước 1 (Tạo nháp):'),
          makeBullet('Bấm nút "Tải DOCX" về máy tính, mở tab "Trường dữ liệu" và copy các thẻ Carbone cần dùng.', 'Bước 2 (Lấy tệp & Thẻ):'),
          makeBullet('Mở Word, thay Logo bệnh viện, căn chỉnh bảng, dán các thẻ {d.patient.fullName}, {d.items[i].name} và lưu file (Ctrl+S).', 'Bước 3 (Sửa trên Word):'),
          makeBullet('Bấm "Upload DOCX" để tải file lên. Hệ thống tự động quét và báo hộp màu xanh "DOCX hợp lệ".', 'Bước 4 (Tải lên hệ thống):'),
          makeBullet('Chuyển sang tab Test Lab, bấm "Test PDF" để xem trước file in thực tế mở trong tab mới.', 'Bước 5 (Kiểm thử):'),
          makeBullet('Designer bấm "Gửi duyệt" ➔ Trưởng khoa/Reviewer bấm "Duyệt" ➔ Quản trị viên bấm "Phát hành".', 'Bước 6 (Phê duyệt & Phát hành):'),

          // Section 7
          makeHeading1('7. Cơ chế Rollback (Khôi phục khẩn cấp)'),
          makeParagraph('Khi mẫu mới phát hành gặp sự cố ngoài ý muốn trên lâm sàng:'),
          makeParagraph('1. Vào tab "Phiên bản".'),
          makeParagraph('2. Tìm đến phiên bản hoạt động ổn định trước đó (ví dụ: Version 1).'),
          makeParagraph('3. Bấm nút "Rollback" và nhập lý do.'),
          makeParagraph('4. Hệ thống ngay lập tức kích hoạt lại phiên bản cũ làm bản chính thức (PUBLISHED) chỉ trong 1 giây!'),

          // Section 8
          makeHeading1('8. Quy chuẩn thiết kế file Word (.docx) & Lưu ý'),
          makeBullet('Nên dùng font Unicode chuẩn: Times New Roman, Arial, Noto Sans, Liberation Serif để không bị lỗi dấu tiếng Việt.', '• Font chữ chuẩn:'),
          makeBullet('Khi kẻ bảng lặp dòng (danh sách thuốc/xét nghiệm), chỉ tạo 01 dòng mẫu chứa thẻ {d.items[i].*}. Carbone sẽ tự động nhân bản dòng tương ứng với dữ liệu.', '• Bảng lặp dòng:'),
          makeBullet('File Word tuyệt đối không chứa Macro VBA (.docm). Hệ thống sẽ tự động chặn các tệp chứa mã thực thi.', '• Chống mã độc:'),

          // Section 9
          makeHeading1('9. Xử lý sự cố thường gặp (FAQ)'),
          makeParagraph('Q1: Tại sao bấm "Upload DOCX" lại báo lỗi "Thẻ Carbone không hợp lệ"?', { bold: true }),
          makeParagraph('Trả lời: Kiểm tra lại các thẻ trong file Word xem có gõ sai chính tả không (ví dụ: {d.patient.fulname} sai, đúng phải là {d.patient.fullName}). Nên dùng nút Sao chép tại tab Trường dữ liệu.'),
          makeParagraph('Q2: Tại sao bấm nút "Queue PDF" lại báo "Render queue is not enabled"?', { bold: true }),
          makeParagraph('Trả lời: Nút Queue PDF dùng cho chế độ in hàng đợi nền lớn yêu cầu Redis. Trong môi trường làm việc thông thường, bạn chỉ cần dùng nút "Test PDF" để xem trước kết quả trực tiếp.'),
          makeParagraph('Q3: Sau khi bấm "Phát hành", khi nào bác sĩ in được mẫu mới?', { bold: true }),
          makeParagraph('Trả lời: Ngay lập tức. Cơ chế Hot-Reload tự động cập nhật mẫu mới trên toàn viện trong giây tiếp theo.')
        ]
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputDocxPath, buffer);
  console.log(`Successfully created: ${outputDocxPath} (${buffer.length} bytes)`);
}

buildDocx().catch(err => {
  console.error('Error generating docx:', err);
  process.exit(1);
});
