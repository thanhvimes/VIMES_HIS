import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType
} from 'docx';

const borderNone = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};

const borderThin = {
  top: { style: BorderStyle.SINGLE, size: 4, color: 'B0BEC5' },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: 'B0BEC5' },
  left: { style: BorderStyle.SINGLE, size: 4, color: 'B0BEC5' },
  right: { style: BorderStyle.SINGLE, size: 4, color: 'B0BEC5' },
};

export async function generateStarterDocx(params: {
  templateCode: string;
  templateName: string;
  documentType?: string;
  category?: string;
  sampleData?: Record<string, any>;
}): Promise<Buffer> {
  const { templateCode, templateName, category, sampleData = {} } = params;
  const upperCode = templateCode.toUpperCase();
  const upperCat = (category || '').toUpperCase();

  const isConsultation = upperCode.includes('HOI_CHAN') || upperCat.includes('HOI_CHAN') || Boolean(sampleData.chairperson || sampleData.conclusion);
  const isPrescription = upperCode.includes('DON_THUOC') || upperCode.includes('PRESCRIPTION') || Boolean(sampleData.medicines);
  const isExam = upperCode.includes('KHAM') || upperCode.includes('EXAM') || Boolean(sampleData.symptoms || sampleData.vital_signs);
  const isSurgery = upperCode.includes('PHAU_THUAT') || upperCode.includes('SURGERY') || upperCode.includes('CAM_DOAN') || Boolean(sampleData.surgery_name);
  const isDischarge = upperCode.includes('RA_VIEN') || upperCode.includes('DISCHARGE') || Boolean(sampleData.discharge_diagnosis);

  const children: (Paragraph | Table)[] = [];

  // 1. Header Table
  children.push(
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
                  children: [new TextRun({ text: 'SỞ Y TẾ TP. HÀ NỘI', size: 18, color: '455A64' })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: 'BỆNH VIỆN ĐA KHOA VIMES', bold: true, size: 20, color: '1A237E' })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: 'Mã hồ sơ: {d.patient_id}', size: 18, italics: true, color: '546E7A' })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 55, type: WidthType.PERCENTAGE },
              borders: borderNone,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', bold: true, size: 19 })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: 'Độc lập - Tự do - Hạnh phúc', bold: true, size: 19, underline: {} })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: 'Ngày .... tháng .... năm 2026', italics: true, size: 17, color: '78909C' })],
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  // Spacing
  children.push(new Paragraph({ children: [new TextRun({ text: '' })], spacing: { before: 200, after: 100 } }));

  // 2. Title
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 240 },
      children: [
        new TextRun({
          text: templateName.toUpperCase(),
          bold: true,
          size: 32,
          color: '0D47A1',
        }),
      ],
    })
  );

  // 3. Patient Info Section
  children.push(
    new Paragraph({
      spacing: { before: 80, after: 80 },
      children: [
        new TextRun({ text: '1. Họ và tên người bệnh: ', bold: true, size: 22 }),
        new TextRun({ text: '{d.patient_name}', bold: true, size: 22, color: '0D47A1' }),
        new TextRun({ text: '    Mã BN: ', bold: true, size: 22 }),
        new TextRun({ text: '{d.patient_id}', bold: true, size: 22 }),
      ],
    }),
    new Paragraph({
      spacing: { before: 60, after: 60 },
      children: [
        new TextRun({ text: '2. Ngày sinh / Tuổi: ', bold: true, size: 22 }),
        new TextRun({ text: '{d.dob}', size: 22 }),
        new TextRun({ text: '        Giới tính: ', bold: true, size: 22 }),
        new TextRun({ text: '{d.gender}', size: 22 }),
      ],
    }),
    new Paragraph({
      spacing: { before: 60, after: 140 },
      children: [
        new TextRun({ text: '3. Địa chỉ: ', bold: true, size: 22 }),
        new TextRun({ text: '{d.address}', size: 22 }),
      ],
    })
  );

  // 4. Content according to type
  if (isConsultation) {
    children.push(
      new Paragraph({
        spacing: { before: 100, after: 60 },
        children: [
          new TextRun({ text: '4. Địa điểm / Khoa phòng: ', bold: true, size: 22 }),
          new TextRun({ text: '{d.room_name}', size: 22 }),
        ],
      }),
      new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [
          new TextRun({ text: '5. Chủ tọa: ', bold: true, size: 22 }),
          new TextRun({ text: '{d.chairperson}', bold: true, size: 22 }),
          new TextRun({ text: '    Thư ký: ', bold: true, size: 22 }),
          new TextRun({ text: '{d.secretary}', size: 22 }),
        ],
      }),
      new Paragraph({
        spacing: { before: 60, after: 80 },
        children: [
          new TextRun({ text: '6. Thành viên tham gia: ', bold: true, size: 22 }),
          new TextRun({ text: '{d.members}', size: 22 }),
        ],
      }),
      new Paragraph({
        spacing: { before: 100, after: 60 },
        children: [
          new TextRun({ text: '7. Tóm tắt diễn biến bệnh án & lý do hội chẩn:', bold: true, size: 22 }),
        ],
      }),
      new Paragraph({
        spacing: { before: 40, after: 120 },
        children: [
          new TextRun({ text: '{d.summary}', size: 22 }),
        ],
      }),
      new Paragraph({
        spacing: { before: 100, after: 60 },
        children: [
          new TextRun({ text: '8. Kết luận & Hướng xử trí thống nhất:', bold: true, size: 22, color: '1565C0' }),
        ],
      }),
      new Paragraph({
        spacing: { before: 40, after: 200 },
        children: [
          new TextRun({ text: '{d.conclusion}', bold: true, size: 22 }),
        ],
      })
    );
  } else if (isPrescription) {
    children.push(
      new Paragraph({
        spacing: { before: 80, after: 120 },
        children: [
          new TextRun({ text: '4. Chẩn đoán: ', bold: true, size: 22 }),
          new TextRun({ text: '{d.diagnosis}', bold: true, size: 22, color: 'D32F2F' }),
        ],
      }),
      new Paragraph({
        spacing: { before: 100, after: 80 },
        children: [
          new TextRun({ text: '5. Thuốc điều trị:', bold: true, size: 22 }),
        ],
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: borderThin,
        rows: [
          new TableRow({
            children: [
              new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, borders: borderThin, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'STT', bold: true, size: 20 })] })] }),
              new TableCell({ width: { size: 45, type: WidthType.PERCENTAGE }, borders: borderThin, children: [new Paragraph({ children: [new TextRun({ text: 'Tên thuốc, hàm lượng', bold: true, size: 20 })] })] }),
              new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, borders: borderThin, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'SL', bold: true, size: 20 })] })] }),
              new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, borders: borderThin, children: [new Paragraph({ children: [new TextRun({ text: 'Cách dùng', bold: true, size: 20 })] })] }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, borders: borderThin, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '{d.medicines[i].stt}', size: 20 })] })] }),
              new TableCell({ width: { size: 45, type: WidthType.PERCENTAGE }, borders: borderThin, children: [new Paragraph({ children: [new TextRun({ text: '{d.medicines[i].name}', bold: true, size: 20 })] })] }),
              new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, borders: borderThin, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '{d.medicines[i].quantity} {d.medicines[i].unit}', size: 20 })] })] }),
              new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, borders: borderThin, children: [new Paragraph({ children: [new TextRun({ text: '{d.medicines[i].dosage}', italics: true, size: 20 })] })] }),
            ],
          }),
        ],
      })
    );
  } else if (isExam) {
    children.push(
      new Paragraph({
        spacing: { before: 80, after: 60 },
        children: [
          new TextRun({ text: '4. Lý do đến khám / Triệu chứng: ', bold: true, size: 22 }),
          new TextRun({ text: '{d.symptoms}', size: 22 }),
        ],
      }),
      new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [
          new TextRun({ text: '5. Dấu hiệu sinh tồn: ', bold: true, size: 22 }),
          new TextRun({ text: 'Mạch: {d.vital_signs.pulse} l/p  ·  HA: {d.vital_signs.bp} mmHg  ·  Nhiệt độ: {d.vital_signs.temp} °C', size: 22 }),
        ],
      }),
      new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [
          new TextRun({ text: '6. Chẩn đoán: ', bold: true, size: 22 }),
          new TextRun({ text: '{d.diagnosis}', bold: true, size: 22, color: 'D32F2F' }),
        ],
      }),
      new Paragraph({
        spacing: { before: 60, after: 120 },
        children: [
          new TextRun({ text: '7. Kế hoạch điều trị & Hướng xử trí: ', bold: true, size: 22 }),
          new TextRun({ text: '{d.treatment_plan}', size: 22 }),
        ],
      })
    );
  } else if (isSurgery) {
    children.push(
      new Paragraph({
        spacing: { before: 80, after: 60 },
        children: [
          new TextRun({ text: '4. Người cam đoan: ', bold: true, size: 22 }),
          new TextRun({ text: '{d.relative_name}', bold: true, size: 22 }),
        ],
      }),
      new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [
          new TextRun({ text: '5. Phẫu thuật / Thủ thuật dự kiến: ', bold: true, size: 22 }),
          new TextRun({ text: '{d.surgery_name}', bold: true, size: 22, color: '0D47A1' }),
        ],
      }),
      new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [
          new TextRun({ text: '6. Phương pháp vô cảm: ', bold: true, size: 22 }),
          new TextRun({ text: '{d.anesthesia_method}', size: 22 }),
        ],
      }),
      new Paragraph({
        spacing: { before: 60, after: 120 },
        children: [
          new TextRun({ text: '7. Các nguy cơ & rủi ro đã được giải thích: ', bold: true, size: 22 }),
          new TextRun({ text: '{d.risks_explained}', size: 22 }),
        ],
      })
    );
  } else if (isDischarge) {
    children.push(
      new Paragraph({
        spacing: { before: 80, after: 60 },
        children: [
          new TextRun({ text: '4. Khoa điều trị: ', bold: true, size: 22 }),
          new TextRun({ text: '{d.department_name}', size: 22 }),
        ],
      }),
      new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [
          new TextRun({ text: '5. Ngày vào viện: ', bold: true, size: 22 }),
          new TextRun({ text: '{d.admitted_at}', size: 22 }),
          new TextRun({ text: '    Ngày ra viện: ', bold: true, size: 22 }),
          new TextRun({ text: '{d.discharged_at}', size: 22 }),
        ],
      }),
      new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [
          new TextRun({ text: '6. Chẩn đoán vào viện: ', bold: true, size: 22 }),
          new TextRun({ text: '{d.admission_diagnosis}', size: 22 }),
        ],
      }),
      new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [
          new TextRun({ text: '7. Chẩn đoán ra viện: ', bold: true, size: 22 }),
          new TextRun({ text: '{d.discharge_diagnosis}', bold: true, size: 22 }),
        ],
      }),
      new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [
          new TextRun({ text: '8. Tóm tắt quá trình điều trị: ', bold: true, size: 22 }),
          new TextRun({ text: '{d.treatment_summary}', size: 22 }),
        ],
      }),
      new Paragraph({
        spacing: { before: 60, after: 120 },
        children: [
          new TextRun({ text: '9. Lời dặn của Bác sĩ: ', bold: true, size: 22 }),
          new TextRun({ text: '{d.doctor_notes}', size: 22 }),
        ],
      })
    );
  } else {
    // Custom generic fields
    const keys = Object.keys(sampleData).filter(k => !['patient_name', 'patient_id', 'dob', 'gender', 'address'].includes(k));
    if (keys.length > 0) {
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        const val = sampleData[k];
        if (typeof val === 'string' || typeof val === 'number') {
          children.push(
            new Paragraph({
              spacing: { before: 60, after: 60 },
              children: [
                new TextRun({ text: `${i + 4}. ${k}: `, bold: true, size: 22 }),
                new TextRun({ text: `{d.${k}}`, size: 22 }),
              ],
            })
          );
        }
      }
    } else {
      children.push(
        new Paragraph({
          spacing: { before: 100, after: 100 },
          children: [
            new TextRun({ text: 'Nội dung văn bản: ', bold: true, size: 22 }),
            new TextRun({ text: '{d.content}', size: 22 }),
          ],
        })
      );
    }
  }

  // 5. Signature Table
  children.push(
    new Paragraph({ spacing: { before: 300, after: 100 }, children: [new TextRun({ text: '' })] }),
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
                  children: [new TextRun({ text: isSurgery ? 'NGƯỜI BỆNH / ĐẠI DIỆN' : 'NGƯỜI LẬP BIỂU', bold: true, size: 20 })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: '(Ký, ghi rõ họ tên)', italics: true, size: 18, color: '78909C' })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 800 },
                  children: [new TextRun({ text: isSurgery ? '{d.relative_name}' : '{d.patient_name}', bold: true, size: 20 })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: borderNone,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: isConsultation ? 'CHỦ TỌA HỘI CHẨN' : (isSurgery ? 'PHẪU THUẬT VIÊN' : 'BÁC SĨ KHÁM / ĐIỀU TRỊ'), bold: true, size: 20, color: '0D47A1' })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: '(Ký số, đóng dấu)', italics: true, size: 18, color: '78909C' })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 800 },
                  children: [new TextRun({ text: isConsultation ? '{d.chairperson}' : '{d.doctor_name}', bold: true, size: 20, color: '0D47A1' })],
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Arial',
            size: 22,
            color: '212121',
          },
        },
      },
    },
    sections: [
      {
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
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
