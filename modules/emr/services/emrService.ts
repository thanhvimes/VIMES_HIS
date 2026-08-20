import { 
  EMRRecord, 
  EMRAccessRequest, 
  EMRAuditLog, 
  EMRStatistics, 
  EMRDocumentItem, 
  DigitalSignatureInfo,
  EMRInteropPayload,
  EMRHandoverRecord,
  EMRValidationReport,
  EMRChecklistItem,
  EMRUnlockRequest,
  EMRExtractionCopy,
  EMRConsultationReview,
  EMRQualityAudit
} from '../types';
import { MOH_SPECIALTY_TEMPLATES } from '../constants';

// Mock Database for EMR
let mockRecords: EMRRecord[] = [
  {
    id: 'EMR-2026-001',
    recordNumber: 'BA-2026-00108',
    admissionNumber: 'VV-2026-04921',
    recordType: 'inpatient',
    specialty: 'Nội Tim mạch',
    departmentName: 'Khoa Nội Tim Mạch - Tầng 4',
    roomNumber: 'P.402',
    bedNumber: 'G-08',
    primaryDoctorName: 'BSCKII. Nguyễn Văn An',
    primaryNurseName: 'ĐD. Lê Thị Mai',
    patient: {
      patientId: 'BN-88092',
      nationalId: '001089012345',
      fullName: 'Trần Văn Mạnh',
      dob: '1968-05-14',
      gender: 'male',
      phone: '0912 345 678',
      address: 'Số 45 Đường Giải Phóng, P. Phương Mai, Q. Đống Đa, TP. Hà Nội',
      insuranceCardNumber: 'DN4010123456789',
      insuranceExpiryDate: '2027-12-31',
      bloodType: 'O+',
      allergies: ['Penicillin (Phù mạch, khó thở)', 'Aspirin (Đau dạ dày cấp)'],
      chronicDiseases: ['Tăng huyết áp vô căn (10 năm)', 'Đái tháo đường Type 2'],
      relativeName: 'Trần Thị Thu Hà (Vợ)',
      relativePhone: '0988 776 655',
      relativeRelationship: 'Vợ',
    },
    admissionDate: '2026-08-12 08:30',
    dischargeDate: '2026-08-17 16:30',
    initialDiagnosis: {
      icd10: 'I20.0',
      diseaseName: 'Cơn đau thắt ngực không ổn định / Tăng huyết áp độ 2',
      description: 'Đau tức ngực trái lan lên cằm và cánh tay trái, khó thở khi gắng sức.',
    },
    status: 'closed',
    signatureStatus: 'partially_signed',
    submissionStatus: 'draft_in_dept',
    storageLocation: 'EMR-STORAGE-NODE-01 / Partition 2026 / Nội',
    currentVersion: '1.0',
    isLocked: true,
    createdAt: '2026-08-12 08:35',
    updatedAt: '2026-08-17 16:45',
    vitalSigns: [
      { id: 'vs-1', timestamp: '2026-08-12 09:00', pulse: 92, bloodPressureSystolic: 155, bloodPressureDiastolic: 95, temperature: 37.0, respiratoryRate: 20, spo2: 96, weight: 68, height: 168, bmi: 24.1, recordedByName: 'ĐD. Lê Thị Mai' },
      { id: 'vs-2', timestamp: '2026-08-13 07:30', pulse: 84, bloodPressureSystolic: 140, bloodPressureDiastolic: 85, temperature: 36.8, respiratoryRate: 18, spo2: 97, recordedByName: 'ĐD. Lê Thị Mai' },
      { id: 'vs-3', timestamp: '2026-08-14 07:30', pulse: 78, bloodPressureSystolic: 135, bloodPressureDiastolic: 80, temperature: 36.6, respiratoryRate: 18, spo2: 98, recordedByName: 'ĐD. Nguyễn Hoàng' },
      { id: 'vs-4', timestamp: '2026-08-15 07:30', pulse: 74, bloodPressureSystolic: 130, bloodPressureDiastolic: 80, temperature: 36.5, respiratoryRate: 17, spo2: 98, recordedByName: 'ĐD. Lê Thị Mai' },
      { id: 'vs-5', timestamp: '2026-08-16 07:30', pulse: 72, bloodPressureSystolic: 125, bloodPressureDiastolic: 78, temperature: 36.6, respiratoryRate: 16, spo2: 99, recordedByName: 'ĐD. Lê Thị Mai' },
      { id: 'vs-6', timestamp: '2026-08-17 07:30', pulse: 70, bloodPressureSystolic: 120, bloodPressureDiastolic: 75, temperature: 36.5, respiratoryRate: 16, spo2: 99, recordedByName: 'ĐD. Lê Thị Mai' },
    ],
    timeline: [
      { id: 'tl-1', timestamp: '2026-08-12 08:30', type: 'admission', title: 'Tiếp nhận nhập viện', description: 'Bệnh nhân vào khoa Cấp cứu chuyển lên Khoa Nội Tim Mạch với chẩn đoán Cơn đau thắt ngực không ổn định.', performedByName: 'BSCKII. Nguyễn Văn An', departmentName: 'Khoa Cấp cứu / Nội Tim mạch', priority: 'important' },
      { id: 'tl-2', timestamp: '2026-08-12 09:15', type: 'order', title: 'Chỉ định cận lâm sàng & ECG', description: 'Chỉ định Troponin T hs, Men tim CK-MB, Điện tim 12 chuyển đạo, Siêu âm tim Doppler màu.', performedByName: 'BSCKII. Nguyễn Văn An', departmentName: 'Khoa Nội Tim Mạch' },
      { id: 'tl-3', timestamp: '2026-08-12 10:45', type: 'lab', title: 'Kết quả Men tim Troponin T', description: 'Troponin T hs: 28.5 ng/L (Tăng nhẹ), CK-MB: 18 U/L.', performedByName: 'Khoa Xét nghiệm Hóa sinh', departmentName: 'Khoa Xét Nghiệm' },
      { id: 'tl-4', timestamp: '2026-08-12 11:30', type: 'imaging', title: 'Siêu âm tim Doppler', description: 'Phân suất tống máu EF 56%, Giảm vận động nhẹ vùng thành sau thất trái.', performedByName: 'BS. Phạm Thu Hương', departmentName: 'Khoa CĐHA' },
      { id: 'tl-5', timestamp: '2026-08-14 09:00', type: 'consultation', title: 'Hội chẩn Chuyên khoa Can thiệp Tim mạch', description: 'Thống nhất điều trị nội khoa tích cực, kiểm soát huyết áp và chuẩn bị chụp mạch vành khi ổn định.', performedByName: 'Hội đồng chuyên môn BV', departmentName: 'Khoa Can thiệp Tim mạch', priority: 'important' },
      { id: 'tl-6', timestamp: '2026-08-17 14:00', type: 'sign', title: 'Ký số Tờ điều trị ngày 12-17/08', description: 'BSCKII. Nguyễn Văn An hoàn tất ký số các tờ điều trị lâm sàng.', performedByName: 'BSCKII. Nguyễn Văn An', departmentName: 'Khoa Nội Tim Mạch' },
    ],
    documents: [
      {
        id: 'doc-01',
        recordId: 'EMR-2026-001',
        code: '01/BV-01',
        name: 'Bệnh án Nội khoa',
        category: 'medical_record',
        createdAt: '2026-08-12 09:30',
        createdByName: 'BSCKII. Nguyễn Văn An',
        createdByTitle: 'Bác sĩ điều trị',
        departmentName: 'Khoa Nội Tim Mạch',
        version: 1,
        status: 'signed',
        signature: {
          signatureId: 'SIG-001-9821',
          signerId: 'BS-001',
          signerName: 'BSCKII. Nguyễn Văn An',
          signerTitle: 'Bác sĩ điều trị chính',
          signerRole: 'doctor',
          signedAt: '2026-08-12 11:00:24',
          certificateSerialNumber: '5401-CA89-9921-VNPT',
          certificateIssuer: 'VNPT-CA Cloud HSM Sub-CA',
          hashAlgorithm: 'SHA-256 with RSA 2048',
          isTimestamped: true,
          isValid: true,
        },
        content: {
          chiefComplaint: 'Đau tức ngực trái kéo dài từng cơn kèm hồi hộp khó thở khi vận động mạnh.',
          historyOfPresentIllness: 'Bệnh nhân có tiền sử tăng huyết áp 10 năm. Cách vào viện 3 giờ, xuất hiện cơn đau ngực sau xương ức, đau quặn bóp nghẹt, lan lên vai và hàm trái, mỗi cơn kéo dài 10-15 phút, ngậm nitrat không đỡ hẳn -> Nhập viện cấp cứu.',
          pastMedicalHistory: 'Tăng huyết áp điều trị Amlodipine 5mg không đều. Đái tháo đường type 2 đang uống Metformin 500mg. Dị ứng Penicillin.',
          physicalExam: {
            general: 'Bệnh nhân tỉnh táo, tiếp xúc tốt. Thể trạng trung bình, niêm mạc hồng nhạt.',
            cardiovascular: 'Tim đều, T1 T2 rõ, không nghe tiếng thổi bệnh lý. Mạch 84 lần/phút, HA 150/90 mmHg.',
            respiratory: 'Phổi thông khí tốt, không rale ẩm rale rít.',
            abdomen: 'Bụng mềm, không trướng, gan lách không to.',
          },
          preliminaryDiagnosis: 'Cơn đau thắt ngực không ổn định / Tăng huyết áp độ 2 - ĐTĐ Type 2',
          treatmentPlan: 'Nghỉ ngơi tuyệt đối tại giường, thở oxy ngắt quãng, thuốc giãn mạch vành, thuốc chống kết tập tiểu cầu kép, kiểm soát huyết áp và đường huyết.',
        },
      },
      {
        id: 'doc-02',
        recordId: 'EMR-2026-001',
        code: '09/BV-02',
        name: 'Tờ điều trị (Ngày 12/08 - 14/08/2026)',
        category: 'treatment_sheets',
        createdAt: '2026-08-12 10:00',
        createdByName: 'BSCKII. Nguyễn Văn An',
        createdByTitle: 'Bác sĩ điều trị',
        departmentName: 'Khoa Nội Tim Mạch',
        version: 1,
        status: 'signed',
        signature: {
          signatureId: 'SIG-002-1102',
          signerId: 'BS-001',
          signerName: 'BSCKII. Nguyễn Văn An',
          signerTitle: 'Bác sĩ điều trị',
          signerRole: 'doctor',
          signedAt: '2026-08-14 17:05:12',
          certificateSerialNumber: '5401-CA89-9921-VNPT',
          certificateIssuer: 'VNPT-CA Cloud HSM Sub-CA',
          hashAlgorithm: 'SHA-256',
          isTimestamped: true,
          isValid: true,
        },
        content: {
          progressDays: [
            {
              date: '2026-08-12 09:00',
              clinicalEvolution: 'Bệnh nhân còn đau tức ngực âm ỉ. Huyết áp 155/95 mmHg, Mạch 92 l/p. SpO2 96%.',
              medicalOrders: [
                '1. Clopidogrel 75mg x 04 viên (Uống liều nạp)',
                '2. Enoxaparin 40mg/0.4ml x 01 bơm (Tiêm dưới da)',
                '3. Nitromint xịt dưới lưỡi 1-2 nhát khi đau ngực',
                '4. Atorvastatin 20mg x 01 viên (Uống tối)',
              ],
            },
            {
              date: '2026-08-13 08:30',
              clinicalEvolution: 'Đỡ đau ngực nhiều, không khó thở. Huyết áp 140/85 mmHg, Mạch 84 l/p.',
              medicalOrders: [
                '1. Clopidogrel 75mg x 01 viên (Uống sáng sau ăn)',
                '2. Enoxaparin 40mg/0.4ml x 01 bơm (Tiêm dưới da 20h)',
                '3. Bisoprolol 2.5mg x 01 viên (Uống sáng)',
                '4. Atorvastatin 20mg x 01 viên (Uống 20h)',
              ],
            },
          ],
        },
      },
      {
        id: 'doc-03',
        recordId: 'EMR-2026-001',
        code: '12/BV-02',
        name: 'Phiếu chăm sóc điều dưỡng (Ngày 12 - 16/08)',
        category: 'care_sheets',
        createdAt: '2026-08-12 08:45',
        createdByName: 'ĐD. Lê Thị Mai',
        createdByTitle: 'Điều dưỡng chính',
        departmentName: 'Khoa Nội Tim Mạch',
        version: 1,
        status: 'signed',
        signature: {
          signatureId: 'SIG-003-8832',
          signerId: 'DD-045',
          signerName: 'ĐD. Lê Thị Mai',
          signerTitle: 'Điều dưỡng viên',
          signerRole: 'nurse',
          signedAt: '2026-08-16 18:30:00',
          certificateSerialNumber: '6610-DD-VIETTEL-CA',
          certificateIssuer: 'Viettel-CA',
          hashAlgorithm: 'SHA-256',
          isTimestamped: true,
          isValid: true,
        },
        content: {
          careNotes: [
            '12/08: Đo dấu sinh hiệu, hướng dẫn bệnh nhân nằm nghỉ đầu cao 30 độ, giải thích chế độ ăn giảm muối.',
            '13/08: Tiêm thuốc chống đông đúng giờ, quan sát không có xuất huyết dưới da, vết tiêm khô ráo.',
            '14/08: Hướng dẫn bệnh nhân tập vận động nhẹ tại giường, theo dõi lượng nước tiểu 24h.',
          ],
        },
      },
      {
        id: 'doc-04',
        recordId: 'EMR-2026-001',
        code: 'CLS-LIS-01',
        name: 'Phiếu kết quả Hóa sinh & Huyết học (LIS)',
        category: 'lab_results',
        createdAt: '2026-08-12 10:30',
        createdByName: 'KTV. Đỗ Thu Hà',
        createdByTitle: 'Kỹ thuật viên Xét nghiệm',
        departmentName: 'Khoa Xét Nghiệm',
        version: 1,
        status: 'signed',
        content: {
          results: [
            { name: 'Troponin T hs', value: '28.5', unit: 'ng/L', refRange: '< 14.0', status: 'high' },
            { name: 'CK-MB', value: '18.2', unit: 'U/L', refRange: '< 24.0', status: 'normal' },
            { name: 'Glucose máu', value: '7.8', unit: 'mmol/L', refRange: '3.9 - 6.4', status: 'high' },
            { name: 'HbA1c', value: '7.2', unit: '%', refRange: '4.0 - 6.0', status: 'high' },
            { name: 'Creatinine', value: '88', unit: 'µmol/L', refRange: '53 - 106', status: 'normal' },
            { name: 'Cholesterol toàn phần', value: '5.9', unit: 'mmol/L', refRange: '< 5.2', status: 'high' },
            { name: 'Triglyceride', value: '2.4', unit: 'mmol/L', refRange: '< 1.7', status: 'high' },
          ],
        },
      },
    ],
  },
  {
    id: 'EMR-2026-002',
    recordNumber: 'BA-2026-00109',
    admissionNumber: 'VV-2026-04950',
    recordType: 'inpatient',
    specialty: 'Ngoại Tiêu hóa',
    departmentName: 'Khoa Ngoại Tổng Hợp - Tầng 5',
    roomNumber: 'P.508',
    bedNumber: 'G-02',
    primaryDoctorName: 'BSCKI. Vũ Thành Long',
    primaryNurseName: 'ĐD. Phạm Thị Ánh',
    patient: {
      patientId: 'BN-77123',
      nationalId: '034098007788',
      fullName: 'Hoàng Kim Ngân',
      dob: '1995-11-20',
      gender: 'female',
      phone: '0977 123 888',
      address: 'Xã Tân Triều, Huyện Thanh Trì, TP. Hà Nội',
      insuranceCardNumber: 'GD4010988776655',
      insuranceExpiryDate: '2026-11-30',
      bloodType: 'B+',
      allergies: ['Không có tiền sử dị ứng đã biết'],
      chronicDiseases: ['Không ghi nhận'],
      relativeName: 'Hoàng Văn Hải (Bố)',
      relativePhone: '0913 555 444',
      relativeRelationship: 'Bố đẻ',
    },
    admissionDate: '2026-08-10 14:00',
    dischargeDate: '2026-08-15 10:00',
    initialDiagnosis: {
      icd10: 'K35.8',
      diseaseName: 'Viêm ruột thừa cấp giờ thứ 12',
      description: 'Đau hố chậu phải âm ỉ tăng dần, buồn nôn, phản ứng thành bụng (+).',
    },
    dischargeDiagnosis: {
      icd10: 'K35.8',
      diseaseName: 'Viêm ruột thừa cấp nung mủ đã phẫu thuật nội soi cắt ruột thừa',
      description: 'Hậu phẫu ngày thứ 4 ổn định, vết mổ khô liền sẹo tốt, ăn uống tiêu hóa bình thường.',
    },
    status: 'archived',
    signatureStatus: 'fully_signed',
    submissionStatus: 'accepted_by_emr',
    storageLocation: 'EMR-STORAGE-NODE-01 / Partition 2026 / Ngoại',
    currentVersion: '1.1',
    isLocked: true,
    lockedAt: '2026-08-15 15:00',
    lockedByName: 'BSCKII. Đặng Đình Hùng (Trưởng khoa)',
    createdAt: '2026-08-10 14:15',
    updatedAt: '2026-08-17 10:00',
    vitalSigns: [
      { id: 'vs-201', timestamp: '2026-08-10 14:30', pulse: 98, bloodPressureSystolic: 120, bloodPressureDiastolic: 75, temperature: 38.2, respiratoryRate: 20, spo2: 99, weight: 52, height: 160, recordedByName: 'ĐD. Phạm Thị Ánh' },
      { id: 'vs-202', timestamp: '2026-08-11 08:00', pulse: 82, bloodPressureSystolic: 115, bloodPressureDiastolic: 70, temperature: 37.0, respiratoryRate: 18, spo2: 99, recordedByName: 'ĐD. Phạm Thị Ánh' },
    ],
    timeline: [],
    documents: [
      {
        id: 'doc-201',
        recordId: 'EMR-2026-002',
        code: '02/BV-01',
        name: 'Bệnh án Ngoại khoa',
        category: 'medical_record',
        createdAt: '2026-08-10 14:30',
        createdByName: 'BSCKI. Vũ Thành Long',
        createdByTitle: 'Bác sĩ điều trị',
        departmentName: 'Khoa Ngoại Tổng Hợp',
        version: 2,
        status: 'signed',
        content: {
          chiefComplaint: 'Đau bụng âm ỉ vùng quanh rốn sau chuyển khu trú hố chậu phải.',
          diagnosisBeforeSurgery: 'Viêm ruột thừa cấp giờ thứ 12',
          diagnosisAfterSurgery: 'Viêm ruột thừa cấp thể nung mủ',
          pathologyResult: 'Mô bệnh học: Viêm ruột thừa hoại thư nung mủ, thâm nhiễm bạch cầu đa nhân trung tính toàn bộ các lớp thành ruột thừa (Bổ sung ngày 17/08/2026).',
        },
      },
    ],
  },
];

// Mock Unlock Requests
let mockUnlockRequests: EMRUnlockRequest[] = [
  {
    id: 'UNL-2026-001',
    requestNumber: 'MK-2026-0024',
    recordId: 'EMR-2026-002',
    recordNumber: 'BA-2026-00109',
    patientName: 'Hoàng Kim Ngân',
    departmentName: 'Khoa Ngoại Tổng Hợp',
    requestedBy: {
      userId: 'BS-099',
      fullName: 'BSCKI. Vũ Thành Long',
      title: 'Bác sĩ điều trị chính',
    },
    requestedAt: '2026-08-17 08:30',
    reasonCategory: 'late_pathology_results',
    reasonDescription: 'Bổ sung kết quả Giải phẫu bệnh mô học ruột thừa sau phẫu thuật (vừa nhận từ Khoa GPB sáng 17/08).',
    targetDocumentCodes: ['02/BV-01', '18/BV-02'],
    requestedDurationHours: 4,
    status: 'completed',
    approvedBy: {
      userId: 'DIR-01',
      fullName: 'PGS.TS. Trần Quốc Hưng',
      title: 'Phó Giám Đốc Bệnh Viện',
      approvedAt: '2026-08-17 09:00',
    },
    unlockExpiresAt: '2026-08-17 13:00',
    versionBefore: '1.0',
    versionAfter: '1.1',
    amendmentSummary: 'Bổ sung trường pathologyResult vào Bệnh án Ngoại khoa và Tóm tắt ra viện',
    diffSummary: [
      {
        field: 'pathologyResult (Kết quả GPB)',
        oldValue: 'Chờ kết quả giải phẫu bệnh',
        newValue: 'Mô bệnh học: Viêm ruột thừa hoại thư nung mủ, thâm nhiễm bạch cầu đa nhân trung tính toàn bộ các lớp thành ruột thừa.',
        modifiedAt: '2026-08-17 09:45',
        modifiedBy: 'BSCKI. Vũ Thành Long',
      },
    ],
  },
  {
    id: 'UNL-2026-002',
    requestNumber: 'MK-2026-0025',
    recordId: 'EMR-2026-001',
    recordNumber: 'BA-2026-00108',
    patientName: 'Trần Văn Mạnh',
    departmentName: 'Khoa Nội Tim Mạch',
    requestedBy: {
      userId: 'BS-001',
      fullName: 'BSCKII. Nguyễn Văn An',
      title: 'Bác sĩ điều trị',
    },
    requestedAt: '2026-08-18 08:00',
    reasonCategory: 'late_microbiology_culture',
    reasonDescription: 'Cập nhật kết quả cấy máu và kháng sinh đồ nhạy cảm Ciprofloxacin.',
    targetDocumentCodes: ['01/BV-01'],
    requestedDurationHours: 6,
    status: 'pending',
    versionBefore: '1.0',
  },
];

// Mock Extraction Copies
let mockExtractionCopies: EMRExtractionCopy[] = [
  {
    id: 'CP-2026-001',
    copyNumber: 'BS-2026-0042',
    recordId: 'EMR-2026-002',
    recordNumber: 'BA-2026-00109',
    patientName: 'Hoàng Kim Ngân',
    patientId: 'BN-77123',
    patientDob: '1995-11-20',
    requesterName: 'Hoàng Kim Ngân (Bản thân)',
    requesterRelationship: 'Người bệnh trực tiếp',
    requesterIdCard: '034098007788',
    requesterPhone: '0977 123 888',
    purpose: 'insurance_claim',
    purposeDescription: 'Nộp hồ sơ thanh toán bảo hiểm sức khỏe Bảo Việt',
    documentType: 'discharge_summary',
    documentName: 'Trích tóm tắt hồ sơ bệnh án & Giấy ra viện điện tử',
    issuedAt: '2026-08-17 15:00',
    expiryDate: '2027-08-17',
    issuedByName: 'ThS.BS. Đỗ Quang Huy (Phòng KHTH)',
    signedByDirector: {
      signatureId: 'SIG-GDBV-091',
      signerId: 'DIR-01',
      signerName: 'PGS.TS. Trần Quốc Hưng',
      signerTitle: 'Phó Giám Đốc Bệnh Viện',
      signerRole: 'director',
      signedAt: '2026-08-17 15:10:00',
      certificateSerialNumber: '8892-BYT-GDBV-VNPT',
      certificateIssuer: 'Ban Cơ Yếu Chính Phủ / VNPT-CA',
      hashAlgorithm: 'SHA-256',
      isTimestamped: true,
      isValid: true,
    },
    qrCodeVerificationUrl: 'https://emr.vclinic.vn/verify/BS-2026-0042',
    verificationToken: 'VCLINIC_VERIFY_99812A_2026',
    securityHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    status: 'issued',
    downloadCount: 3,
  },
];

// Mock Consultation & Mortality Reviews
let mockConsultations: EMRConsultationReview[] = [
  {
    id: 'CS-2026-001',
    code: 'HC-2026-0081',
    type: 'clinical_consultation',
    recordId: 'EMR-2026-001',
    recordNumber: 'BA-2026-00108',
    patientName: 'Trần Văn Mạnh',
    patientId: 'BN-88092',
    departmentName: 'Khoa Nội Tim Mạch & Can Thiệp',
    meetingDate: '2026-08-14 09:00',
    location: 'Phòng Hội chẩn Trực tuyến - Nhà B',
    chairman: {
      id: 'HC-01',
      name: 'GS.TS. Phạm Gia Khải',
      title: 'Chuyên gia Cố vấn Tim mạch',
      department: 'Hội đồng Khoa học Kỹ thuật',
      roleInCouncil: 'chairman',
      isSigned: true,
    },
    secretary: {
      id: 'HC-02',
      name: 'BSCKII. Nguyễn Văn An',
      title: 'Bác sĩ điều trị chính',
      department: 'Khoa Nội Tim Mạch',
      roleInCouncil: 'secretary',
      isSigned: true,
    },
    members: [
      {
        id: 'HC-03',
        name: 'TS.BS. Lê Văn Tuấn',
        title: 'Trưởng Khoa Can thiệp Tim mạch',
        department: 'Khoa Tim mạch Can thiệp',
        roleInCouncil: 'member',
        isSigned: true,
      },
      {
        id: 'HC-04',
        name: 'BSCKI. Vũ Đức Hải',
        title: 'Bác sĩ Gây mê Hồi sức',
        department: 'Khoa PT-GMHS',
        roleInCouncil: 'specialist',
        isSigned: true,
      },
    ],
    clinicalSummary: 'Bệnh nhân nam 58 tuổi, đau thắt ngực không ổn định, tăng men tim Troponin T, có tiền sử tăng huyết áp và ĐTĐ type 2.',
    councilDiscussion: [
      'GS. Khải: Đánh giá nguy cơ tim mạch mức độ cao, cần chụp mạch vành qua da để xác định mức độ hẹp nhánh LAD.',
      'TS. Tuấn: Chuẩn bị can thiệp nong và đặt Stent mạch vành nếu hẹp > 70% tổn thương giải phẫu thuận lợi.',
      'BS. Hải: Kiểm soát tốt đường huyết dưới 8.0 mmol/L và huyết áp trước thủ thuật can thiệp.',
    ],
    finalConclusion: 'Thống nhất chỉ định Chụp động mạch vành có cản quang và can thiệp đặt Stent khi có chỉ định.',
    treatmentPlan: 'Điều trị nội khoa tối ưu kép (Aspirin + Ticagrelor), Enoxaparin liều điều trị, chuyển phòng Can thiệp Tim mạch lúc 14h ngày 18/08.',
    status: 'fully_signed',
    signedCount: 4,
    totalMembersCount: 4,
  },
  {
    id: 'CS-2026-002',
    code: 'KTTV-2026-0005',
    type: 'mortality_review',
    recordId: 'EMR-2026-004',
    recordNumber: 'BA-2026-00088',
    patientName: 'Cụ Nguyễn Văn Hùng',
    patientId: 'BN-44019',
    departmentName: 'Khoa Hồi Sức Cấp Cứu (ICU)',
    meetingDate: '2026-08-16 14:00',
    location: 'Hội trường Tầng 7 - Ban Giám Đốc',
    chairman: {
      id: 'KT-01',
      name: 'PGS.TS. Trần Quốc Hưng',
      title: 'Phó Giám Đốc Bệnh Viện',
      department: 'Ban Giám Đốc',
      roleInCouncil: 'chairman',
      isSigned: true,
    },
    secretary: {
      id: 'KT-02',
      name: 'ThS.BS. Đỗ Quang Huy',
      title: 'Phó Phòng KHTH',
      department: 'Phòng KHTH',
      roleInCouncil: 'secretary',
      isSigned: true,
    },
    members: [
      {
        id: 'KT-03',
        name: 'BSCKII. Lê Mạnh Thắng',
        title: 'Trưởng Khoa Hồi Sức Cấp Cứu',
        department: 'Khoa ICU',
        roleInCouncil: 'member',
        isSigned: true,
      },
    ],
    clinicalSummary: 'Bệnh nhân 86 tuổi vào viện vì sốc nhiễm khuẩn từ đường tiêu hóa, suy đa tạng, viêm phổi thở máy.',
    councilDiscussion: [
      'Khoa Cấp cứu tiếp nhận kịp thời, chẩn đoán đúng và hồi sức tích cực theo đúng phác đồ Bộ Y Tế.',
      'Bệnh nhân tuổi cao, nhiều bệnh nền nặng nề, suy tim sung huyết mạn tính, đáp ứng kém vận mạch liều cao.',
    ],
    deathTime: '2026-08-15 22:30',
    mortalityCauseDirect: 'Suy đa cơ quan (Suy tuần hoàn, suy hô hấp không hồi phục)',
    mortalityCauseUnderlying: 'Sốc nhiễm khuẩn từ viêm phúc mạc / Đái tháo đường, Tăng huyết áp tuổi già',
    preventableIssues: 'Không có sai sót chuyên môn hoặc chậm trễ kỹ thuật',
    hospitalLessonsLearned: 'Rút kinh nghiệm về việc tư vấn tiên lượng sớm cho gia đình người bệnh ngay từ khi vào viện.',
    finalConclusion: 'Tử vong do bệnh lý nặng nề, tuổi cao suy kiệt. Quy trình chẩn đoán, điều trị và cấp cứu được thực hiện đúng quy chế.',
    treatmentPlan: 'Hoàn tất thủ tục báo tử, bàn giao thi hài và niêm phong bệnh án lưu trữ vĩnh viễn theo Điều 13 Thông tư 46.',
    status: 'fully_signed',
    signedCount: 3,
    totalMembersCount: 3,
  },
];

// Mock Quality Audits (QA-QC)
let mockQualityAudits: EMRQualityAudit[] = [
  {
    id: 'QA-2026-001',
    recordId: 'EMR-2026-002',
    recordNumber: 'BA-2026-00109',
    patientName: 'Hoàng Kim Ngân',
    departmentName: 'Khoa Ngoại Tổng Hợp',
    specialty: 'Ngoại khoa',
    auditorName: 'ThS.BS. Đỗ Quang Huy',
    auditorTitle: 'Ban Giám định Chất lượng Bệnh án - Phòng KHTH',
    auditedAt: '2026-08-17 11:00',
    totalScore: 94,
    maxScore: 100,
    scorePercentage: 94,
    grade: 'excellent',
    criteria: [
      { id: 'c-1', category: 'I. Hành chính & Tiền sử', name: 'Đầy đủ thông tin định danh, CCCD, Thẻ BHYT, Thân nhân, Dị ứng', maxScore: 20, score: 20, isPassed: true },
      { id: 'c-2', category: 'II. Khám & Chẩn đoán ICD-10', name: 'Mô tả diễn biến bệnh rõ ràng, chẩn đoán trước và sau phẫu thuật chuẩn ICD-10', maxScore: 25, score: 25, isPassed: true },
      { id: 'c-3', category: 'III. Phẫu thuật & Điều trị', name: 'Biên bản phẫu thuật chi tiết, y lệnh kháng sinh hợp lý theo phác đồ', maxScore: 30, score: 27, isPassed: true, notes: 'Ghi chép diễn biến hậu phẫu ngày 3 hơi vắn tắt' },
      { id: 'c-4', category: 'IV. Quy chế Ký số & Thời hạn', name: 'Ký số đầy đủ các chức danh, đóng khóa hồ sơ trong vòng 24h sau xuất viện', maxScore: 25, score: 22, isPassed: true, notes: 'Chữ ký số trưởng khoa sau xuất viện 28h (chậm 4h)' },
    ],
    deficiencies: ['Chậm ký số đóng hồ sơ 4 giờ so với quy chế 24h'],
    recommendations: 'Nhắc nhở trưởng khoa đôn đốc ký duyệt bệnh án đúng hạn quy định Thông tư 46.',
    isFeedbackSentToDept: true,
  },
  {
    id: 'QA-2026-002',
    recordId: 'EMR-2026-003',
    recordNumber: 'BA-2026-00110',
    patientName: 'Bé Nguyễn Minh Khang',
    departmentName: 'Khoa Nhi',
    specialty: 'Nhi khoa',
    auditorName: 'BSCKII. Phạm Thị Hòa',
    auditorTitle: 'Chuyên viên Giám định KHTH',
    auditedAt: '2026-08-18 09:30',
    totalScore: 62,
    maxScore: 100,
    scorePercentage: 62,
    grade: 'poor',
    criteria: [
      { id: 'c-1', category: 'I. Hành chính & Tiền sử', name: 'Đầy đủ thông tin định danh, Thẻ BHYT, Thân nhân', maxScore: 20, score: 18, isPassed: true },
      { id: 'c-2', category: 'II. Khám & Chẩn đoán ICD-10', name: 'Mô tả triệu chứng và chẩn đoán SXH ngày 3', maxScore: 25, score: 20, isPassed: true },
      { id: 'c-3', category: 'III. Phẫu thuật & Điều trị', name: 'Tờ điều trị và Phiếu chăm sóc theo dõi truyền dịch', maxScore: 30, score: 12, isPassed: false, notes: 'Thiếu tờ điều trị và phiếu chăm sóc các ngày 16-18/08' },
      { id: 'c-4', category: 'IV. Quy chế Ký số & Thời hạn', name: 'Chữ ký số các chức danh', maxScore: 25, score: 12, isPassed: false, notes: 'Chưa có chữ ký số bác sĩ điều trị trên tóm tắt ra viện' },
    ],
    deficiencies: [
      'Thiếu hồ sơ lâm sàng các ngày điều trị theo dõi sốt xuất huyết',
      'Chưa hoàn tất ký số của Bác sĩ điều trị',
    ],
    recommendations: 'Yêu cầu Khoa Nhi hoàn thiện đầy đủ biểu mẫu và chữ ký trước khi nộp lại cho Phòng KHTH.',
    isFeedbackSentToDept: true,
  },
];

let mockHandovers: EMRHandoverRecord[] = [
  {
    id: 'HO-2026-001',
    recordId: 'EMR-2026-002',
    recordNumber: 'BA-2026-00109',
    patientId: 'BN-77123',
    patientName: 'Hoàng Kim Ngân',
    specialty: 'Ngoại Tiêu hóa',
    departmentName: 'Khoa Ngoại Tổng Hợp - Tầng 5',
    primaryDoctorName: 'BSCKI. Vũ Thành Long',
    admissionDate: '2026-08-10 14:00',
    dischargeDate: '2026-08-15 10:00',
    submissionStatus: 'accepted_by_emr',
    submittedAt: '2026-08-16 08:30',
    receivedAt: '2026-08-16 09:15',
    handoverReceiptNumber: 'BBGN-2026-0892',
    validationReport: {
      recordId: 'EMR-2026-002',
      recordNumber: 'BA-2026-00109',
      isEligibleForSubmission: true,
      totalItems: 3,
      passedItems: 3,
      completionPercentage: 100,
      missingItemsCount: 0,
      missingSignaturesCount: 0,
      validationTimestamp: '2026-08-16 08:28:10',
      items: [],
    },
  },
];

let mockAccessRequests: EMRAccessRequest[] = [
  {
    id: 'REQ-2026-001',
    requestNumber: 'YC-2026-0048',
    recordId: 'EMR-2026-002',
    recordNumber: 'BA-2026-00109',
    patientName: 'Hoàng Kim Ngân',
    patientId: 'BN-77123',
    requestedBy: {
      userId: 'US-88',
      fullName: 'ThS.BS. Nguyễn Đình Trọng',
      department: 'Bộ môn Ngoại - ĐH Y Hà Nội',
      role: 'Giảng viên / Nghiên cứu sinh',
      organization: 'Đại học Y Hà Nội',
    },
    requestDate: '2026-08-17 09:30',
    purpose: 'scientific_research',
    purposeDescription: 'Nghiên cứu đánh giá kết quả phẫu thuật nội soi ruột thừa một cổng so với ba cổng tại bệnh viện.',
    requestedScope: 'full',
    requestedDurationHours: 48,
    status: 'approved',
    approvedBy: {
      userId: 'DIR-01',
      fullName: 'PGS.TS. Trần Quốc Hưng',
      title: 'Phó Giám Đốc Bệnh Viện',
      approvedAt: '2026-08-17 11:00',
    },
    accessExpiry: '2026-08-19 11:00',
    accessToken: 'EMR_TOKEN_SEC_889210_EXP',
  },
];

let mockAuditLogs: EMRAuditLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-08-18 09:15:20',
    userId: 'KHTH-01',
    userName: 'ThS.BS. Đỗ Quang Huy',
    userRole: 'Phòng KHTH',
    ipAddress: '192.168.1.50',
    recordId: 'EMR-2026-003',
    recordNumber: 'BA-2026-00110',
    patientName: 'Bé Nguyễn Minh Khang',
    action: 'reject_handover',
    details: 'Từ chối tiếp nhận hồ sơ BA-2026-00110 do thiếu Tờ điều trị và Phiếu chăm sóc, trả về Khoa Nhi hoàn thiện',
  },
];

export const emrService = {
  // 1. Quản lý Hồ sơ Bệnh án EMR
  getRecords: async (filters?: {
    search?: string;
    status?: string;
    specialty?: string;
    recordType?: string;
    signatureStatus?: string;
    submissionStatus?: string;
  }): Promise<EMRRecord[]> => {
    let result = [...mockRecords];
    if (!filters) return result;

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(r => 
        r.recordNumber.toLowerCase().includes(q) ||
        r.patient.fullName.toLowerCase().includes(q) ||
        r.patient.patientId.toLowerCase().includes(q) ||
        (r.patient.nationalId && r.patient.nationalId.includes(q)) ||
        (r.initialDiagnosis && r.initialDiagnosis.diseaseName.toLowerCase().includes(q))
      );
    }
    if (filters.status && filters.status !== 'all') {
      result = result.filter(r => r.status === filters.status);
    }
    if (filters.specialty && filters.specialty !== 'all') {
      result = result.filter(r => r.specialty.toLowerCase().includes(filters.specialty!.toLowerCase()));
    }
    if (filters.recordType && filters.recordType !== 'all') {
      result = result.filter(r => r.recordType === filters.recordType);
    }
    if (filters.signatureStatus && filters.signatureStatus !== 'all') {
      result = result.filter(r => r.signatureStatus === filters.signatureStatus);
    }
    if (filters.submissionStatus && filters.submissionStatus !== 'all') {
      result = result.filter(r => r.submissionStatus === filters.submissionStatus);
    }
    return result;
  },

  getRecordById: async (recordId: string): Promise<EMRRecord | undefined> => {
    return mockRecords.find(r => r.id === recordId || r.recordNumber === recordId);
  },

  // 2. Rà soát & Kiểm tra Điều kiện Tiếp nhận Bệnh án
  validateRecordCompliance: async (recordId: string): Promise<EMRValidationReport> => {
    const record = mockRecords.find(r => r.id === recordId);
    if (!record) throw new Error('Hồ sơ bệnh án không tồn tại');

    const items: EMRChecklistItem[] = [];

    // 1. Kiểm tra Bệnh án chính
    const mainDoc = record.documents.find(d => d.category === 'medical_record');
    items.push({
      code: mainDoc?.code || 'BA-CHINH',
      name: mainDoc?.name || `Bệnh án ${record.specialty}`,
      category: 'medical_record',
      isRequired: true,
      isAvailable: !!mainDoc,
      documentId: mainDoc?.id,
      isSigned: mainDoc?.status === 'signed',
      signerName: mainDoc?.signature?.signerName,
      status: !mainDoc ? 'missing_doc' : mainDoc.status !== 'signed' ? 'missing_sig' : 'passed',
      notes: !mainDoc ? 'Chưa lập hồ sơ bệnh án chính' : mainDoc.status !== 'signed' ? 'Bác sĩ điều trị chưa ký số' : 'Hợp lệ',
    });

    // 2. Kiểm tra Tờ điều trị
    const treatDoc = record.documents.find(d => d.category === 'treatment_sheets');
    items.push({
      code: treatDoc?.code || '09/BV-02',
      name: treatDoc?.name || 'Tờ điều trị lâm sàng hàng ngày',
      category: 'treatment_sheets',
      isRequired: record.recordType === 'inpatient',
      isAvailable: !!treatDoc,
      documentId: treatDoc?.id,
      isSigned: treatDoc?.status === 'signed',
      signerName: treatDoc?.signature?.signerName,
      status: !treatDoc ? 'missing_doc' : treatDoc.status !== 'signed' ? 'missing_sig' : 'passed',
      notes: !treatDoc ? 'Chưa lập tờ điều trị' : treatDoc.status !== 'signed' ? 'Chưa hoàn tất ký số các ngày' : 'Hợp lệ',
    });

    // 3. Kiểm tra Phiếu chăm sóc
    const careDoc = record.documents.find(d => d.category === 'care_sheets');
    items.push({
      code: careDoc?.code || '12/BV-02',
      name: careDoc?.name || 'Phiếu theo dõi và chăm sóc điều dưỡng',
      category: 'care_sheets',
      isRequired: record.recordType === 'inpatient',
      isAvailable: !!careDoc,
      documentId: careDoc?.id,
      isSigned: careDoc?.status === 'signed',
      signerName: careDoc?.signature?.signerName,
      status: !careDoc ? 'missing_doc' : careDoc.status !== 'signed' ? 'missing_sig' : 'passed',
      notes: !careDoc ? 'Chưa có phiếu chăm sóc' : careDoc.status !== 'signed' ? 'Điều dưỡng chưa ký số' : 'Hợp lệ',
    });

    // 4. Kiểm tra Tóm tắt bệnh án & Giấy ra viện
    const dischargeDoc = record.documents.find(d => d.category === 'discharge_summary');
    items.push({
      code: dischargeDoc?.code || '18/BV-02',
      name: dischargeDoc?.name || 'Trích tóm tắt hồ sơ bệnh án & Giấy ra viện',
      category: 'discharge_summary',
      isRequired: true,
      isAvailable: !!dischargeDoc,
      documentId: dischargeDoc?.id,
      isSigned: dischargeDoc?.status === 'signed',
      signerName: dischargeDoc?.signature?.signerName,
      status: !dischargeDoc ? 'missing_doc' : dischargeDoc.status !== 'signed' ? 'missing_sig' : 'passed',
      notes: !dischargeDoc ? 'Chưa lập tóm tắt ra viện' : dischargeDoc.status !== 'signed' ? 'Trưởng khoa chưa ký số phê duyệt' : 'Hợp lệ',
    });

    const totalRequired = items.filter(i => i.isRequired).length;
    const passedCount = items.filter(i => i.status === 'passed').length;
    const missingDocs = items.filter(i => i.status === 'missing_doc').length;
    const missingSigs = items.filter(i => i.status === 'missing_sig').length;
    const isEligible = passedCount === totalRequired;

    return {
      recordId: record.id,
      recordNumber: record.recordNumber,
      isEligibleForSubmission: isEligible,
      totalItems: items.length,
      passedItems: passedCount,
      completionPercentage: Math.round((passedCount / Math.max(1, totalRequired)) * 100),
      items: items,
      validationTimestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      missingItemsCount: missingDocs,
      missingSignaturesCount: missingSigs,
    };
  },

  // 3. Khoa điều trị Gửi hồ sơ lên Phòng KHTH
  submitRecordToEMR: async (
    recordId: string,
    submittedBy: { userId: string; fullName: string; title: string }
  ): Promise<EMRHandoverRecord> => {
    const report = await emrService.validateRecordCompliance(recordId);
    if (!report.isEligibleForSubmission) {
      throw new Error(`Hồ sơ chưa đủ điều kiện gửi (còn thiếu ${report.missingItemsCount} văn bản và ${report.missingSignaturesCount} chữ ký).`);
    }

    const recordIndex = mockRecords.findIndex(r => r.id === recordId);
    if (recordIndex === -1) throw new Error('Hồ sơ không tồn tại');

    const record = { ...mockRecords[recordIndex] };
    record.submissionStatus = 'submitted_to_emr';
    mockRecords[recordIndex] = record;

    const existingHOIndex = mockHandovers.findIndex(h => h.recordId === recordId);
    const handoverRecord: EMRHandoverRecord = {
      id: existingHOIndex >= 0 ? mockHandovers[existingHOIndex].id : `HO-${Date.now()}`,
      recordId: record.id,
      recordNumber: record.recordNumber,
      patientId: record.patient.patientId,
      patientName: record.patient.fullName,
      specialty: record.specialty,
      departmentName: record.departmentName,
      primaryDoctorName: record.primaryDoctorName,
      admissionDate: record.admissionDate,
      dischargeDate: record.dischargeDate || new Date().toISOString().substring(0, 10),
      submissionStatus: 'submitted_to_emr',
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      submittedBy: submittedBy,
      validationReport: report,
    };

    if (existingHOIndex >= 0) {
      mockHandovers[existingHOIndex] = handoverRecord;
    } else {
      mockHandovers.unshift(handoverRecord);
    }

    return handoverRecord;
  },

  getHandoverRecords: async (filters?: { status?: string; department?: string; search?: string }): Promise<EMRHandoverRecord[]> => {
    let result = [...mockHandovers];
    if (!filters) return result;
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(h => 
        h.recordNumber.toLowerCase().includes(q) ||
        h.patientName.toLowerCase().includes(q) ||
        h.patientId.toLowerCase().includes(q)
      );
    }
    if (filters.status && filters.status !== 'all') {
      result = result.filter(h => h.submissionStatus === filters.status);
    }
    if (filters.department && filters.department !== 'all') {
      result = result.filter(h => h.departmentName.toLowerCase().includes(filters.department!.toLowerCase()));
    }
    return result;
  },

  acceptHandoverRecord: async (
    handoverId: string,
    receivedBy: { userId: string; fullName: string; title: string }
  ): Promise<EMRHandoverRecord> => {
    const hoIndex = mockHandovers.findIndex(h => h.id === handoverId || h.recordId === handoverId);
    if (hoIndex === -1) throw new Error('Bản ghi giao nhận không tồn tại');

    const ho = { ...mockHandovers[hoIndex] };
    ho.submissionStatus = 'accepted_by_emr';
    ho.receivedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    ho.receivedBy = receivedBy;
    ho.handoverReceiptNumber = `BBGN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    mockHandovers[hoIndex] = ho;

    const recIndex = mockRecords.findIndex(r => r.id === ho.recordId);
    if (recIndex >= 0) {
      mockRecords[recIndex].status = 'archived';
      mockRecords[recIndex].submissionStatus = 'accepted_by_emr';
      mockRecords[recIndex].storageLocation = `EMR-KHO-LƯU-TRỮ-SỐ-2026 / ${ho.departmentName}`;
    }

    return ho;
  },

  rejectReturnRecord: async (
    handoverId: string,
    reason: string,
    rejectedBy: { userId: string; fullName: string; title: string }
  ): Promise<EMRHandoverRecord> => {
    const hoIndex = mockHandovers.findIndex(h => h.id === handoverId || h.recordId === handoverId);
    if (hoIndex === -1) throw new Error('Bản ghi giao nhận không tồn tại');

    const ho = { ...mockHandovers[hoIndex] };
    ho.submissionStatus = 'rejected_by_emr';
    ho.rejectedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    ho.rejectedBy = rejectedBy;
    ho.rejectionReason = reason;
    mockHandovers[hoIndex] = ho;

    const recIndex = mockRecords.findIndex(r => r.id === ho.recordId);
    if (recIndex >= 0) {
      mockRecords[recIndex].submissionStatus = 'rejected_by_emr';
    }

    return ho;
  },

  // 4. Mở khóa & Sửa đổi bổ sung sau lưu trữ (EMR Unlock & Amendments)
  getUnlockRequests: async (): Promise<EMRUnlockRequest[]> => {
    return [...mockUnlockRequests];
  },

  createUnlockRequest: async (
    data: Omit<EMRUnlockRequest, 'id' | 'requestNumber' | 'status' | 'requestedAt' | 'versionBefore'>
  ): Promise<EMRUnlockRequest> => {
    const record = mockRecords.find(r => r.id === data.recordId);
    const newReq: EMRUnlockRequest = {
      ...data,
      id: `UNL-${Date.now()}`,
      requestNumber: `MK-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'pending',
      requestedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      versionBefore: record?.currentVersion || '1.0',
    };
    mockUnlockRequests.unshift(newReq);
    return newReq;
  },

  approveUnlockRequest: async (
    requestId: string,
    approver: { userId: string; fullName: string; title: string }
  ): Promise<EMRUnlockRequest> => {
    const reqIndex = mockUnlockRequests.findIndex(r => r.id === requestId);
    if (reqIndex === -1) throw new Error('Yêu cầu mở khóa không tồn tại');

    const req = { ...mockUnlockRequests[reqIndex] };
    req.status = 'approved';
    req.approvedBy = {
      ...approver,
      approvedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    const exp = new Date();
    exp.setHours(exp.getHours() + (req.requestedDurationHours || 4));
    req.unlockExpiresAt = exp.toISOString().replace('T', ' ').substring(0, 16);

    mockUnlockRequests[reqIndex] = req;

    // Tạm thời mở khóa record
    const recIndex = mockRecords.findIndex(r => r.id === req.recordId);
    if (recIndex >= 0) {
      mockRecords[recIndex].isLocked = false;
    }

    return req;
  },

  completeAmendment: async (
    requestId: string,
    amendmentData: {
      amendmentSummary: string;
      diffSummary: { field: string; oldValue: string; newValue: string }[];
      performedByName: string;
    }
  ): Promise<EMRUnlockRequest> => {
    const reqIndex = mockUnlockRequests.findIndex(r => r.id === requestId);
    if (reqIndex === -1) throw new Error('Yêu cầu mở khóa không tồn tại');

    const req = { ...mockUnlockRequests[reqIndex] };
    const verBeforeNum = parseFloat(req.versionBefore || '1.0');
    const verAfter = (verBeforeNum + 0.1).toFixed(1);

    req.status = 'completed';
    req.versionAfter = verAfter;
    req.amendmentSummary = amendmentData.amendmentSummary;
    req.diffSummary = amendmentData.diffSummary.map(d => ({
      ...d,
      modifiedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      modifiedBy: amendmentData.performedByName,
    }));

    mockUnlockRequests[reqIndex] = req;

    // Khóa lại record và tăng version
    const recIndex = mockRecords.findIndex(r => r.id === req.recordId);
    if (recIndex >= 0) {
      mockRecords[recIndex].isLocked = true;
      mockRecords[recIndex].currentVersion = verAfter;
      mockRecords[recIndex].updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    }

    return req;
  },

  // 5. Trích sao & Cấp bản sao bệnh án điện tử có mã QR
  getExtractionCopies: async (): Promise<EMRExtractionCopy[]> => {
    return [...mockExtractionCopies];
  },

  issueExtractionCopy: async (
    copyData: Omit<EMRExtractionCopy, 'id' | 'copyNumber' | 'issuedAt' | 'qrCodeVerificationUrl' | 'verificationToken' | 'securityHash' | 'status' | 'downloadCount'>
  ): Promise<EMRExtractionCopy> => {
    const copyNum = `BS-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const token = `VCLINIC_VERIFY_${Math.random().toString(36).substring(2, 8).toUpperCase()}_2026`;
    
    const newCopy: EMRExtractionCopy = {
      ...copyData,
      id: `CP-${Date.now()}`,
      copyNumber: copyNum,
      issuedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      qrCodeVerificationUrl: `https://emr.vclinic.vn/verify/${copyNum}?token=${token}`,
      verificationToken: token,
      securityHash: `sha256_${Math.random().toString(36).substring(2, 16)}`,
      status: 'issued',
      downloadCount: 0,
    };

    mockExtractionCopies.unshift(newCopy);
    return newCopy;
  },

  // 6. Hội chẩn & Biên bản Kiểm thảo Tử vong
  getConsultations: async (type?: 'clinical_consultation' | 'mortality_review'): Promise<EMRConsultationReview[]> => {
    if (type) {
      return mockConsultations.filter(c => c.type === type);
    }
    return [...mockConsultations];
  },

  signConsultation: async (
    consultationId: string,
    memberId: string,
    signerName: string
  ): Promise<EMRConsultationReview> => {
    const csIndex = mockConsultations.findIndex(c => c.id === consultationId);
    if (csIndex === -1) throw new Error('Biên bản hội chẩn không tồn tại');

    const cs = { ...mockConsultations[csIndex] };
    if (cs.chairman.id === memberId) {
      cs.chairman.isSigned = true;
    } else if (cs.secretary.id === memberId) {
      cs.secretary.isSigned = true;
    } else {
      const memIndex = cs.members.findIndex(m => m.id === memberId);
      if (memIndex >= 0) {
        cs.members[memIndex].isSigned = true;
      }
    }

    const allSigned = (cs.chairman.isSigned) && (cs.secretary.isSigned) && cs.members.every(m => m.isSigned);
    if (allSigned) {
      cs.status = 'fully_signed';
    }

    const signedCount = (cs.chairman.isSigned ? 1 : 0) + (cs.secretary.isSigned ? 1 : 0) + cs.members.filter(m => m.isSigned).length;
    cs.signedCount = signedCount;

    mockConsultations[csIndex] = cs;
    return cs;
  },

  // 7. Giám định & Đánh giá Chất lượng Bệnh án (EMR QA-QC)
  getQualityAudits: async (): Promise<EMRQualityAudit[]> => {
    return [...mockQualityAudits];
  },

  createQualityAudit: async (
    auditData: Omit<EMRQualityAudit, 'id' | 'auditedAt' | 'totalScore' | 'scorePercentage' | 'grade'>
  ): Promise<EMRQualityAudit> => {
    const totalScore = auditData.criteria.reduce((sum, c) => sum + c.score, 0);
    const maxScore = auditData.maxScore || 100;
    const percentage = Math.round((totalScore / maxScore) * 100);

    let grade: 'excellent' | 'good' | 'average' | 'poor' = 'poor';
    if (percentage >= 90) grade = 'excellent';
    else if (percentage >= 80) grade = 'good';
    else if (percentage >= 65) grade = 'average';

    const newAudit: EMRQualityAudit = {
      ...auditData,
      id: `QA-${Date.now()}`,
      auditedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      totalScore,
      scorePercentage: percentage,
      grade,
    };

    mockQualityAudits.unshift(newAudit);
    return newAudit;
  },

  // 8. Ký số văn bản y khoa
  signDocument: async (
    recordId: string, 
    documentId: string, 
    signer: {
      signerId: string;
      signerName: string;
      signerTitle: string;
      signerRole: 'doctor' | 'nurse' | 'dept_head' | 'director' | 'patient';
      certificateIssuer: string;
    }
  ): Promise<EMRRecord> => {
    const recordIndex = mockRecords.findIndex(r => r.id === recordId);
    if (recordIndex === -1) throw new Error('Hồ sơ bệnh án không tồn tại');

    const record = { ...mockRecords[recordIndex] };
    const docIndex = record.documents.findIndex(d => d.id === documentId);
    if (docIndex === -1) throw new Error('Văn bản không tồn tại trong hồ sơ');

    const signature: DigitalSignatureInfo = {
      signatureId: `SIG-${Date.now()}`,
      signerId: signer.signerId,
      signerName: signer.signerName,
      signerTitle: signer.signerTitle,
      signerRole: signer.signerRole,
      signedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      certificateSerialNumber: `VN-${Math.random().toString(36).substring(2, 10).toUpperCase()}-2026`,
      certificateIssuer: signer.certificateIssuer,
      hashAlgorithm: 'SHA-256 with RSA-2048',
      isTimestamped: true,
      isValid: true,
    };

    record.documents[docIndex] = {
      ...record.documents[docIndex],
      status: 'signed',
      signature: signature,
      signaturesCollected: [...(record.documents[docIndex].signaturesCollected || []), signature],
    };

    const allSigned = record.documents.every(d => d.status === 'signed');
    record.signatureStatus = allSigned ? 'fully_signed' : 'partially_signed';

    mockRecords[recordIndex] = record;
    return record;
  },

  batchSignDocuments: async (
    items: { recordId: string; documentId: string }[],
    signer: {
      signerId: string;
      signerName: string;
      signerTitle: string;
      signerRole: 'doctor' | 'nurse' | 'dept_head' | 'director';
      certificateIssuer: string;
    }
  ): Promise<number> => {
    let signedCount = 0;
    for (const item of items) {
      try {
        await emrService.signDocument(item.recordId, item.documentId, signer);
        signedCount++;
      } catch (err) {
        console.error(err);
      }
    }
    return signedCount;
  },

  // 9. Đóng & Khóa Bệnh án
  closeRecord: async (recordId: string, closedByName: string): Promise<EMRRecord> => {
    const recordIndex = mockRecords.findIndex(r => r.id === recordId);
    if (recordIndex === -1) throw new Error('Hồ sơ bệnh án không tồn tại');

    const record = { ...mockRecords[recordIndex] };
    record.status = 'closed';
    record.isLocked = true;
    record.lockedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
    record.lockedByName = closedByName;
    mockRecords[recordIndex] = record;
    return record;
  },

  // 10. Quản lý Yêu cầu Khai thác & Mượn Hồ sơ Bệnh án
  getAccessRequests: async (): Promise<EMRAccessRequest[]> => {
    return [...mockAccessRequests];
  },

  createAccessRequest: async (requestData: Omit<EMRAccessRequest, 'id' | 'requestNumber' | 'status' | 'requestDate'>): Promise<EMRAccessRequest> => {
    const newRequest: EMRAccessRequest = {
      ...requestData,
      id: `REQ-${Date.now()}`,
      requestNumber: `YC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      requestDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'pending',
    };
    mockAccessRequests.unshift(newRequest);
    return newRequest;
  },

  approveAccessRequest: async (requestId: string, approver: { userId: string; fullName: string; title: string }): Promise<EMRAccessRequest> => {
    const reqIndex = mockAccessRequests.findIndex(r => r.id === requestId);
    if (reqIndex === -1) throw new Error('Phiếu yêu cầu không tồn tại');

    const req = { ...mockAccessRequests[reqIndex] };
    req.status = 'approved';
    req.approvedBy = {
      ...approver,
      approvedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + (req.requestedDurationHours || 24));
    req.accessExpiry = expiry.toISOString().replace('T', ' ').substring(0, 16);
    req.accessToken = `EMR_TOKEN_${Math.random().toString(36).substring(2, 12).toUpperCase()}_EXP`;

    mockAccessRequests[reqIndex] = req;
    return req;
  },

  rejectAccessRequest: async (requestId: string, reason: string): Promise<EMRAccessRequest> => {
    const reqIndex = mockAccessRequests.findIndex(r => r.id === requestId);
    if (reqIndex === -1) throw new Error('Phiếu yêu cầu không tồn tại');

    const req = { ...mockAccessRequests[reqIndex] };
    req.status = 'rejected';
    req.rejectedReason = reason;
    mockAccessRequests[reqIndex] = req;
    return req;
  },

  // 11. Thống kê & Dashboard EMR
  getStatistics: async (): Promise<EMRStatistics> => {
    const total = mockRecords.length;
    const active = mockRecords.filter(r => r.status === 'active').length;
    const closed = mockRecords.filter(r => r.status === 'closed').length;
    const fullySigned = mockRecords.filter(r => r.signatureStatus === 'fully_signed').length;
    const archived = mockRecords.filter(r => r.status === 'archived').length;

    const pendingHO = mockHandovers.filter(h => h.submissionStatus === 'submitted_to_emr').length;
    const rejectedHO = mockHandovers.filter(h => h.submissionStatus === 'rejected_by_emr').length;
    const acceptedHO = mockHandovers.filter(h => h.submissionStatus === 'accepted_by_emr').length;

    const pendingUnlock = mockUnlockRequests.filter(u => u.status === 'pending').length;
    const totalCopies = mockExtractionCopies.length + 85;
    const ongoingConsult = mockConsultations.filter(c => c.status !== 'fully_signed').length;

    return {
      totalRecords: 1250 + total,
      activeInpatients: 184,
      closedAwaitingSign: 29,
      fullySigned: 982,
      archivedRecords: 875,
      paperlessRatePercentage: 94.6,
      overdueSigningCount: 4,
      totalAccessRequests: mockAccessRequests.length + 120,
      pendingAccessRequests: mockAccessRequests.filter(r => r.status === 'pending').length,
      pendingHandoverCount: pendingHO,
      rejectedHandoverCount: rejectedHO,
      acceptedHandoverCount: acceptedHO,
      pendingUnlockRequestsCount: pendingUnlock,
      totalCopiesIssuedCount: totalCopies,
      ongoingConsultationsCount: ongoingConsult,
      averageQualityScore: 88.5,
      specialtyDistribution: [
        { specialty: 'Nội Tim Mạch', count: 320 },
        { specialty: 'Ngoại Tổng Hợp', count: 280 },
        { specialty: 'Nhi Khoa', count: 210 },
        { specialty: 'Sản Phụ Khoa', count: 195 },
        { specialty: 'Hồi Sức Cấp Cứu', count: 145 },
        { specialty: 'Chuyên Khoa Khác', count: 100 },
      ],
      monthlyTrends: [
        { month: 'T3/2026', newRecords: 280, signedRecords: 265 },
        { month: 'T4/2026', newRecords: 310, signedRecords: 298 },
        { month: 'T5/2026', newRecords: 295, signedRecords: 290 },
        { month: 'T6/2026', newRecords: 340, signedRecords: 330 },
        { month: 'T7/2026', newRecords: 360, signedRecords: 350 },
        { month: 'T8/2026', newRecords: 380, signedRecords: 362 },
      ],
    };
  },

  // 12. Audit Logs
  getAuditLogs: async (): Promise<EMRAuditLog[]> => {
    return [...mockAuditLogs];
  },

  // 13. Liên thông & Xuất XML / HL7 CDA
  generateInteropPayload: async (recordId: string, format: 'HL7_CDA' | 'HL7_FHIR' | 'XML_4210' | 'XML_130' | 'SSK_VNEID'): Promise<EMRInteropPayload> => {
    const record = mockRecords.find(r => r.id === recordId) || mockRecords[0];

    let content = '';
    if (format === 'HL7_CDA') {
      content = `<?xml version="1.0" encoding="UTF-8"?>
<ClinicalDocument xmlns="urn:hl7-org:v3" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <realmCode code="VN"/>
  <typeId root="2.16.840.1.113883.1.3" extension="POCD_HD000040"/>
  <id root="2.16.840.1.113883.19.4" extension="${record.recordNumber}"/>
  <title>BỆNH ÁN ĐIỆN TỬ - TÓM TẮT ĐIỀU TRỊ (HL7 CDA R2)</title>
  <effectiveTime value="20260818090000+0700"/>
  <recordTarget>
    <patientRole>
      <id extension="${record.patient.patientId}" root="2.16.840.1.113883.19.5"/>
      <addr><streetAddressLine>${record.patient.address}</streetAddressLine></addr>
      <patient>
        <name><family>${record.patient.fullName}</family></name>
        <administrativeGenderCode code="${record.patient.gender === 'male' ? 'M' : 'F'}"/>
        <birthTime value="${record.patient.dob.replace(/-/g, '')}"/>
      </patient>
    </patientRole>
  </recordTarget>
</ClinicalDocument>`;
    } else {
      content = `<?xml version="1.0" encoding="utf-8"?>
<GIAMDINHHS>
  <MACSKCB>01001</MACSKCB>
  <TENCSKCB>BỆNH VIỆN ĐA KHOA QUỐC TẾ vClinic</TENCSKCB>
  <MA_LK>${record.admissionNumber}</MA_LK>
  <MA_BN>${record.patient.patientId}</MA_BN>
  <HO_TEN>${record.patient.fullName}</HO_TEN>
</GIAMDINHHS>`;
    }

    return {
      recordId: record.id,
      format: format,
      generatedAt: new Date().toISOString(),
      payloadXmlOrJson: content,
      validationStatus: 'valid',
    };
  },
};
