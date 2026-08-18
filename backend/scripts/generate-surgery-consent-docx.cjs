const fs = require('fs');
const path = require('path');
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
  VerticalAlign
} = require('docx');

async function generateDocx() {
  const targetDir = path.resolve(__dirname, '../templates/documents/SURGERY_CONSENT/v1');
  fs.mkdirSync(targetDir, { recursive: true });

  const borderNone = {
    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  };

  const borderThin = {
    top: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
    left: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
    right: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
  };

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Arial",
            size: 22, // 11pt
            color: "000000",
          },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1000,
            bottom: 1000,
            left: 1200,
            right: 1200,
          },
        },
      },
      children: [
        // Header Table
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: borderNone,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 45, type: WidthType.PERCENTAGE },
                  borders: borderNone,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({ text: "{d.hospital.name}", bold: true, size: 20 }),
                      ],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({ text: "{d.hospital.department}", size: 18, bold: true }),
                      ],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({ text: "Số: {d.document.number}", size: 18, italics: true }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 55, type: WidthType.PERCENTAGE },
                  borders: borderNone,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({ text: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", bold: true, size: 20 }),
                      ],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({ text: "Độc lập - Tự do - Hạnh phúc", bold: true, size: 19 }),
                      ],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({ text: "------------------------", size: 16 }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),

        new Paragraph({ text: "", spacing: { before: 100 } }),

        // Title
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 150, after: 100 },
          children: [
            new TextRun({
              text: "GIẤY CAM ĐOAN CHẤP NHẬN PHẪU THUẬT, THỦ THUẬT",
              bold: true,
              size: 26, // 13pt
              color: "003366",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: "VÀ GÂY MÊ HỒI SỨC",
              bold: true,
              size: 24,
              color: "003366",
            }),
          ],
        }),

        // Section 1: Thông tin người bệnh & thân nhân
        new Paragraph({
          spacing: { before: 100, after: 60 },
          children: [
            new TextRun({ text: "I. THÔNG TIN NGƯỜI BỆNH & ĐẠI DIỆN GIA ĐÌNH", bold: true, size: 22 }),
          ],
        }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: borderThin,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 25, type: WidthType.PERCENTAGE },
                  borders: borderThin,
                  children: [new Paragraph({ children: [new TextRun({ text: "Họ và tên người bệnh:", bold: true })] })],
                }),
                new TableCell({
                  width: { size: 45, type: WidthType.PERCENTAGE },
                  borders: borderThin,
                  children: [new Paragraph({ children: [new TextRun({ text: "{d.patient.fullName}", bold: true })] })],
                }),
                new TableCell({
                  width: { size: 15, type: WidthType.PERCENTAGE },
                  borders: borderThin,
                  children: [new Paragraph({ children: [new TextRun({ text: "Mã NB:", bold: true })] })],
                }),
                new TableCell({
                  width: { size: 15, type: WidthType.PERCENTAGE },
                  borders: borderThin,
                  children: [new Paragraph({ children: [new TextRun({ text: "{d.patient.code}" })] })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders: borderThin,
                  children: [new Paragraph({ children: [new TextRun({ text: "Ngày sinh:" })] })],
                }),
                new TableCell({
                  borders: borderThin,
                  children: [new Paragraph({ children: [new TextRun({ text: "{d.patient.dob}" })] })],
                }),
                new TableCell({
                  borders: borderThin,
                  children: [new Paragraph({ children: [new TextRun({ text: "Giới tính:" })] })],
                }),
                new TableCell({
                  borders: borderThin,
                  children: [new Paragraph({ children: [new TextRun({ text: "{d.patient.gender}" })] })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders: borderThin,
                  children: [new Paragraph({ children: [new TextRun({ text: "Mã thẻ BHYT:" })] })],
                }),
                new TableCell({
                  borders: borderThin,
                  children: [new Paragraph({ children: [new TextRun({ text: "{d.patient.insuranceNumber}" })] })],
                }),
                new TableCell({
                  borders: borderThin,
                  children: [new Paragraph({ children: [new TextRun({ text: "SĐT:" })] })],
                }),
                new TableCell({
                  borders: borderThin,
                  children: [new Paragraph({ children: [new TextRun({ text: "{d.patient.phone}" })] })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders: borderThin,
                  children: [new Paragraph({ children: [new TextRun({ text: "Địa chỉ:" })] })],
                }),
                new TableCell({
                  borders: borderThin,
                  columnSpan: 3,
                  children: [new Paragraph({ children: [new TextRun({ text: "{d.patient.address}" })] })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders: borderThin,
                  children: [new Paragraph({ children: [new TextRun({ text: "Người đại diện (nếu có):", bold: true })] })],
                }),
                new TableCell({
                  borders: borderThin,
                  children: [new Paragraph({ children: [new TextRun({ text: "{d.representative.fullName}" })] })],
                }),
                new TableCell({
                  borders: borderThin,
                  children: [new Paragraph({ children: [new TextRun({ text: "Quan hệ:" })] })],
                }),
                new TableCell({
                  borders: borderThin,
                  children: [new Paragraph({ children: [new TextRun({ text: "{d.representative.relation}" })] })],
                }),
              ],
            }),
          ],
        }),

        // Section 2: Chẩn đoán và can thiệp
        new Paragraph({
          spacing: { before: 150, after: 60 },
          children: [
            new TextRun({ text: "II. CHẨN ĐOÁN VÀ PHƯƠNG PHÁP CAN THIỆP", bold: true, size: 22 }),
          ],
        }),
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: "1. Chẩn đoán bệnh: ", bold: true }),
            new TextRun({ text: "{d.surgery.diagnosis}", bold: true }),
          ],
        }),
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: "2. Phương pháp phẫu thuật/thủ thuật dự kiến: ", bold: true }),
            new TextRun({ text: "{d.surgery.procedureName}" }),
          ],
        }),
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: "3. Phương pháp vô cảm (Gây mê/tê): ", bold: true }),
            new TextRun({ text: "{d.surgery.anesthesiaMethod}" }),
          ],
        }),
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: "4. Các rủi ro, tai biến có thể xảy ra: ", bold: true }),
            new TextRun({ text: "{d.surgery.explainedRisks}", italics: true }),
          ],
        }),

        // Section 3: Cam kết
        new Paragraph({
          spacing: { before: 120, after: 60 },
          children: [
            new TextRun({ text: "III. CAM KẾT CỦA NGƯỜI BỆNH HOẶC THÂN NHÂN", bold: true, size: 22 }),
          ],
        }),
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({
              text: "Tôi đã được Bác sĩ giải thích cặn kẽ về tình trạng bệnh, mục đích, lợi ích và các rủi ro, biến chứng tiềm ẩn trong và sau khi phẫu thuật/thủ thuật và gây mê hồi sức. Tôi hoàn toàn tự nguyện đồng ý để Bác sĩ thực hiện phẫu thuật theo chỉ định y khoa.",
            }),
          ],
        }),

        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { before: 100, after: 80 },
          children: [
            new TextRun({
              text: "Ngày {d.document.createdDate}",
              italics: true,
            }),
          ],
        }),

        // Section 4: Signature Table (2 Placeholders)
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: borderNone,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  borders: borderNone,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({ text: "NGƯỜI BỆNH / ĐẠI DIỆN GIA ĐÌNH", bold: true }),
                      ],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({ text: "(Ký số hoặc ký, ghi rõ họ tên)", italics: true, size: 18 }),
                      ],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 120, after: 120 },
                      children: [
                        new TextRun({ text: "[SIG_PATIENT]", size: 18, color: "0052CC" }),
                      ],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({ text: "{d.patient.fullName}", bold: true }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  borders: borderNone,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({ text: "BÁC SĨ GIẢI THÍCH & PHẪU THUẬT", bold: true }),
                      ],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({ text: "(Ký số)", italics: true, size: 18 }),
                      ],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 120, after: 120 },
                      children: [
                        new TextRun({ text: "[SIG_DOCTOR]", size: 18, color: "0052CC" }),
                      ],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({ text: "{d.doctor.fullName}", bold: true }),
                      ],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({ text: "{d.doctor.title}", italics: true, size: 18 }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200 },
          children: [
            new TextRun({
              text: "Tài liệu Y tế Điện tử VIMES HIS — Xác thực Chữ ký số Kép (Bác sĩ & Bệnh nhân)",
              size: 16,
              italics: true,
              color: "777777",
            }),
          ],
        }),
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  const docxFile = path.join(targetDir, 'template.docx');
  fs.writeFileSync(docxFile, buffer);
  console.log('✅ Generated SURGERY_CONSENT template.docx:', buffer.length, 'bytes');

  // Also generate HTML source representation for quick preview
  const htmlContent = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>Giấy cam đoan chấp nhận phẫu thuật, thủ thuật và điều trị</title>
  <style>
    @page { size: A4; margin: 15mm 15mm 15mm 17mm; }
    body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.3; color: #000; }
    table { border-collapse: collapse; width: 100%; }
    .header td { width: 50%; border: 0; text-align: center; vertical-align: top; font-size: 10pt; }
    h1 { text-align: center; font-size: 14pt; margin: 14pt 0 2pt; color: #003366; }
    .subtitle { text-align: center; font-size: 13pt; font-weight: bold; margin: 0 0 10pt; color: #003366; }
    h2 { font-size: 11pt; margin: 10pt 0 5pt; border-bottom: 1px solid #ddd; padding-bottom: 3px; }
    .patient td { border: 1px solid #999; padding: 5px 8px; font-size: 10pt; }
    .patient .label { width: 22%; font-weight: bold; }
    .line { margin: 0 0 6pt; }
    .signature { margin-top: 20pt; }
    .signature td { width: 50%; border: 0; text-align: center; vertical-align: top; font-size: 10.5pt; }
    .sig-box { display: inline-block; border: 2px dashed #0052CC; background: rgba(0,82,204,0.06); padding: 12px 24px; margin: 15px 0; border-radius: 4px; font-weight: bold; color: #0052CC; }
    .footer { margin-top: 18pt; text-align: center; font-size: 8.5pt; font-style: italic; color: #666; }
  </style>
</head>
<body>
  <table class="header">
    <tr>
      <td><b>{d.hospital.name}</b><br><b>{d.hospital.department}</b><br><i>Số: {d.document.number}</i></td>
      <td><b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><br><b>Độc lập - Tự do - Hạnh phúc</b><br>--------------------</td>
    </tr>
  </table>

  <h1>GIẤY CAM ĐOAN CHẤP NHẬN PHẪU THUẬT, THỦ THUẬT</h1>
  <div class="subtitle">VÀ GÂY MÊ HỒI SỨC</div>

  <h2>I. THÔNG TIN NGƯỜI BỆNH & THÂN NHÂN</h2>
  <table class="patient">
    <tr><td class="label">Họ tên người bệnh</td><td><b>{d.patient.fullName}</b></td><td class="label">Mã người bệnh</td><td>{d.patient.code}</td></tr>
    <tr><td class="label">Ngày sinh</td><td>{d.patient.dob}</td><td class="label">Giới tính</td><td>{d.patient.gender}</td></tr>
    <tr><td class="label">Mã BHYT</td><td>{d.patient.insuranceNumber}</td><td class="label">Số điện thoại</td><td>{d.patient.phone}</td></tr>
    <tr><td class="label">Địa chỉ</td><td colspan="3">{d.patient.address}</td></tr>
    <tr><td class="label">Người đại diện</td><td>{d.representative.fullName}</td><td class="label">Quan hệ</td><td>{d.representative.relation}</td></tr>
  </table>

  <h2>II. CHẨN ĐOÁN VÀ PHƯƠNG PHÁP CAN THIỆP</h2>
  <p class="line"><b>1. Chẩn đoán bệnh:</b> <b>{d.surgery.diagnosis}</b></p>
  <p class="line"><b>2. Phương pháp phẫu thuật:</b> {d.surgery.procedureName}</p>
  <p class="line"><b>3. Phương pháp vô cảm:</b> {d.surgery.anesthesiaMethod}</p>
  <p class="line"><b>4. Các nguy cơ, rủi ro đã giải thích:</b> <i>{d.surgery.explainedRisks}</i></p>

  <h2>III. CAM KẾT CỦA NGƯỜI BỆNH / ĐẠI DIỆN GIA ĐÌNH</h2>
  <p class="line">Tôi đã được Bác sĩ giải thích rõ ràng về tình trạng bệnh tật, mục đích, lợi ích và các rủi ro tai biến tiềm ẩn. Tôi hoàn toàn tự nguyện đồng ý để Bác sĩ thực hiện phẫu thuật/thủ thuật.</p>

  <p style="text-align: right; font-style: italic; margin-top: 10px;">Ngày {d.document.createdDate}</p>

  <table class="signature">
    <tr>
      <td><b>NGƯỜI BỆNH / ĐẠI DIỆN</b><br><i>(Ký số hoặc ký tên)</i><br><div class="sig-box">[SIG_PATIENT]</div><br><b>{d.patient.fullName}</b></td>
      <td><b>BÁC SĨ GIẢI THÍCH & PHẪU THUẬT</b><br><i>(Ký số)</i><br><div class="sig-box">[SIG_DOCTOR]</div><br><b>{d.doctor.fullName}</b><br><i>{d.doctor.title}</i></td>
    </tr>
  </table>

  <p class="footer">Tài liệu Y tế Điện tử VIMES HIS — Xác thực Chữ ký số Kép (Bác sĩ & Bệnh nhân)</p>
</body>
</html>`;

  fs.writeFileSync(path.join(targetDir, 'template-source.html'), htmlContent, 'utf8');
  console.log('✅ Generated SURGERY_CONSENT template-source.html');
}

generateDocx().catch(console.error);
