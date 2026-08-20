// Types definition for EMR (Electronic Medical Record) Module
// Compliant with Circular 54/2017/TT-BYT, Circular 46/2018/TT-BYT, QĐ 6858/QĐ-BYT & FPT.eHospital 2.0 EMR

export type EMRRecordType = 'inpatient' | 'outpatient' | 'emergency' | 'day_treatment';

export type EMRStatus = 
  | 'active'        // Đang điều trị
  | 'closed'        // Đã đóng bệnh án (chờ ký số / kiểm tra)
  | 'signed'        // Đã hoàn tất ký số
  | 'archived'      // Đã lưu trữ số hóa vào kho EMR
  | 'cancelled';    // Đã hủy / Hủy bệnh án

export type DigitalSignatureStatus = 'unsigned' | 'partially_signed' | 'fully_signed' | 'rejected';

export type EMRSubmissionStatus = 
  | 'draft_in_dept'       // Đang lưu hành tại khoa điều trị
  | 'submitted_to_emr'    // Đã gửi lên phòng KHTH / Lưu trữ EMR chờ duyệt nhận
  | 'accepted_by_emr'     // KHTH đã duyệt nhận và nhập kho EMR chính thức
  | 'rejected_by_emr';    // KHTH từ chối tiếp nhận, trả về khoa yêu cầu bổ sung

export interface PatientAdministrativeInfo {
  patientId: string; // Mã định danh y tế duy nhất (Single Patient ID)
  nationalId?: string; // Số CCCD / VNeID
  fullName: string;
  dob: string;
  gender: 'male' | 'female' | 'other';
  phone?: string;
  address: string;
  insuranceCardNumber?: string;
  insuranceExpiryDate?: string;
  workplace?: string;
  relativeName?: string;
  relativePhone?: string;
  relativeRelationship?: string;
  bloodType?: string; // A+, B+, O+, AB+, etc.
  allergies?: string[]; // Cảnh báo dị ứng (Thuốc, Thức ăn, v.v.)
  chronicDiseases?: string[]; // Tiền sử bệnh mạn tính
}

export interface DigitalSignatureInfo {
  signatureId: string;
  signerId: string;
  signerName: string;
  signerTitle: string; // Bác sĩ điều trị, Trưởng khoa, Giám đốc bệnh viện, Điều dưỡng
  signerRole: 'doctor' | 'nurse' | 'dept_head' | 'director' | 'patient';
  signedAt: string;
  certificateSerialNumber: string;
  certificateIssuer: string; // VNPT-CA, Viettel-CA, FPT-CA, etc.
  hashAlgorithm: string; // SHA-256
  isTimestamped: boolean; // TSA (Time Stamp Authority)
  isValid: boolean;
  notes?: string;
}

export type EMRDocumentCategory = 
  | 'administrative'      // I. Hồ sơ Hành chính & Vào viện
  | 'medical_record'      // II. Bệnh án chính chuyên khoa
  | 'treatment_sheets'    // III. Tờ điều trị & Diễn biến lâm sàng
  | 'care_sheets'         // IV. Phiếu chăm sóc điều dưỡng
  | 'lab_results'         // V. Kết quả Xét nghiệm (LIS)
  | 'imaging_results'     // VI. Chẩn đoán hình ảnh & Thăm dò chức năng (RIS-PACS)
  | 'surgery_procedure'   // VII. Phẫu thuật - Thủ thuật - Gây mê hồi sức
  | 'consultation'        // VIII. Biên bản hội chẩn & Chuyển viện
  | 'discharge_summary';  // IX. Tóm tắt bệnh án & Giấy ra viện

export interface EMRDocumentItem {
  id: string;
  recordId: string;
  code: string; // Mã mẫu biểu theo BYT (e.g., 01/BV-01, 02/BV-01, PK-01)
  name: string; // Tên mẫu văn bản
  category: EMRDocumentCategory;
  createdAt: string;
  createdByName: string;
  createdByTitle: string;
  departmentName: string;
  version: number;
  status: 'draft' | 'submitted' | 'approved' | 'signed' | 'locked';
  signature?: DigitalSignatureInfo;
  signaturesRequired?: string[]; // Các vai trò cần ký
  signaturesCollected?: DigitalSignatureInfo[]; // Danh sách chữ ký đã thu thập
  content: Record<string, any>; // Dữ liệu chuyên biệt theo từng mẫu biểu
  fileUrl?: string; // Link file PDF đã xuất
  isLocked?: boolean;
}

export interface VitalSignRecord {
  id: string;
  timestamp: string;
  pulse: number; // Mạch (lần/phút)
  bloodPressureSystolic: number; // HA tâm thu (mmHg)
  bloodPressureDiastolic: number; // HA tâm trương (mmHg)
  temperature: number; // Nhiệt độ (°C)
  respiratoryRate: number; // Nhịp thở (lần/phút)
  spo2: number; // SpO2 (%)
  weight?: number; // Cân nặng (kg)
  height?: number; // Chiều cao (cm)
  bmi?: number;
  recordedByName: string;
  notes?: string;
}

export interface ClinicalEvent {
  id: string;
  timestamp: string;
  type: 'admission' | 'diagnosis' | 'order' | 'lab' | 'imaging' | 'procedure' | 'consultation' | 'discharge' | 'sign';
  title: string;
  description: string;
  performedByName: string;
  departmentName: string;
  documentId?: string;
  priority?: 'normal' | 'important' | 'critical';
}

export interface EMRChecklistItem {
  code: string;
  name: string;
  category: EMRDocumentCategory;
  isRequired: boolean;
  isAvailable: boolean;
  documentId?: string;
  isSigned: boolean;
  signerName?: string;
  status: 'passed' | 'missing_doc' | 'missing_sig';
  notes?: string;
}

export interface EMRValidationReport {
  recordId: string;
  recordNumber: string;
  isEligibleForSubmission: boolean; // Đạt điều kiện gửi hồ sơ (100% required items passed)
  totalItems: number;
  passedItems: number;
  completionPercentage: number;
  items: EMRChecklistItem[];
  validationTimestamp: string;
  missingItemsCount: number;
  missingSignaturesCount: number;
}

export interface EMRHandoverRecord {
  id: string;
  recordId: string;
  recordNumber: string;
  patientId: string;
  patientName: string;
  specialty: string;
  departmentName: string;
  primaryDoctorName: string;
  admissionDate: string;
  dischargeDate: string;
  
  submissionStatus: EMRSubmissionStatus;
  submittedAt?: string;
  submittedBy?: {
    userId: string;
    fullName: string;
    title: string;
  };
  
  receivedAt?: string;
  receivedBy?: {
    userId: string;
    fullName: string;
    title: string;
  };
  
  rejectedAt?: string;
  rejectedBy?: {
    userId: string;
    fullName: string;
    title: string;
  };
  rejectionReason?: string;
  
  validationReport: EMRValidationReport;
  handoverReceiptNumber?: string; // Số biên bản bàn giao: BBGN-2026-0892
  notes?: string;
}

export interface EMRRecord {
  id: string;
  recordNumber: string; // Số lưu trữ HSBA (e.g., BA-2026-00892)
  admissionNumber: string; // Mã đợt KCB / Số vào viện
  recordType: EMRRecordType;
  specialty: string; // Chuyên khoa (Nội khoa, Ngoại khoa, Nhi, Sản, TMH, etc.)
  patient: PatientAdministrativeInfo;
  admissionDate: string; // Ngày giờ vào viện
  dischargeDate?: string; // Ngày giờ ra viện
  departmentName: string; // Khoa điều trị hiện tại
  roomNumber?: string;
  bedNumber?: string;
  primaryDoctorName: string; // Bác sĩ điều trị chính
  primaryNurseName?: string; // Điều dưỡng phụ trách
  
  // Chẩn đoán
  initialDiagnosis?: {
    icd10: string;
    diseaseName: string;
    description?: string;
  };
  dischargeDiagnosis?: {
    icd10: string;
    diseaseName: string;
    secondaryIcd10?: string[];
    description?: string;
  };

  status: EMRStatus;
  signatureStatus: DigitalSignatureStatus;
  submissionStatus: EMRSubmissionStatus; // Trạng thái gửi nhận HSBA
  storageLocation?: string; // Vị trí lưu trữ số hóa (Kho EMR Server 01 / Partition 2026)
  
  // Dữ liệu lâm sàng
  documents: EMRDocumentItem[];
  vitalSigns: VitalSignRecord[];
  timeline: ClinicalEvent[];
  
  // Metadata & Versioning
  currentVersion: string; // e.g. "1.0", "1.1"
  isLocked: boolean;
  lockedAt?: string;
  lockedByName?: string;
  createdAt: string;
  updatedAt: string;
}

// 1. Mở khóa & Sửa đổi bổ sung sau lưu trữ (EMR Unlock & Amendments)
export interface EMRUnlockRequest {
  id: string;
  requestNumber: string;
  recordId: string;
  recordNumber: string;
  patientName: string;
  departmentName: string;
  requestedBy: {
    userId: string;
    fullName: string;
    title: string;
  };
  requestedAt: string;
  reasonCategory: 'late_pathology_results' | 'late_microbiology_culture' | 'administrative_correction' | 'supplementary_diagnosis' | 'court_investigation_order';
  reasonDescription: string;
  targetDocumentCodes: string[];
  requestedDurationHours: number; // Cấp quyền mở khóa trong bao nhiêu giờ (ví dụ: 4h, 12h, 24h)
  
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'expired';
  approvedBy?: {
    userId: string;
    fullName: string;
    title: string;
    approvedAt: string;
  };
  rejectedReason?: string;
  unlockExpiresAt?: string;
  
  // Quản lý phiên bản & vết sửa đổi (Diff Tracking)
  versionBefore: string;
  versionAfter?: string;
  amendmentSummary?: string;
  diffSummary?: {
    field: string;
    oldValue: string;
    newValue: string;
    modifiedAt: string;
    modifiedBy: string;
  }[];
}

// 2. Trích sao & Cấp bản sao bệnh án điện tử (EMR Extraction & Copies with QR Verification)
export interface EMRExtractionCopy {
  id: string;
  copyNumber: string; // Số cấp bản sao: BS-2026-0042
  recordId: string;
  recordNumber: string;
  patientName: string;
  patientId: string;
  patientDob: string;
  
  requesterName: string;
  requesterRelationship: string; // Bản thân, Bố/Mẹ, Vợ/Chồng, Luật sư, Đại diện Bảo hiểm
  requesterIdCard: string; // CCCD người yêu cầu
  requesterPhone: string;
  
  purpose: 'insurance_claim' | 'hospital_transfer' | 'social_welfare' | 'court_legal' | 'personal_records';
  purposeDescription: string;
  
  documentType: 'discharge_summary' | 'full_record' | 'surgery_certificate' | 'injury_certificate' | 'birth_certificate' | 'death_certificate';
  documentName: string;
  
  issuedAt: string;
  expiryDate?: string;
  issuedByName: string;
  signedByDirector: DigitalSignatureInfo;
  
  qrCodeVerificationUrl: string;
  verificationToken: string;
  securityHash: string; // SHA-256 hash của văn bản bản sao
  status: 'issued' | 'revoked' | 'expired';
  downloadCount: number;
}

// 3. Hội chẩn & Biên bản Kiểm thảo Tử vong (Consultation & Mortality Review)
export interface EMRConsultationMember {
  id: string;
  name: string;
  title: string;
  department: string;
  roleInCouncil: 'chairman' | 'secretary' | 'member' | 'specialist';
  isSigned: boolean;
  signature?: DigitalSignatureInfo;
}

export interface EMRConsultationReview {
  id: string;
  code: string; // Mã biên bản: HC-2026-0081 hoặc KTTV-2026-0012
  type: 'clinical_consultation' | 'mortality_review';
  recordId: string;
  recordNumber: string;
  patientName: string;
  patientId: string;
  departmentName: string;
  meetingDate: string;
  location: string;
  
  chairman: EMRConsultationMember;
  secretary: EMRConsultationMember;
  members: EMRConsultationMember[];
  
  clinicalSummary: string;
  councilDiscussion: string[];
  finalConclusion: string;
  treatmentPlan: string;
  
  // Riêng cho Kiểm thảo tử vong
  deathTime?: string;
  mortalityCauseDirect?: string;
  mortalityCauseUnderlying?: string;
  preventableIssues?: string;
  hospitalLessonsLearned?: string;
  
  status: 'ongoing' | 'fully_signed' | 'archived';
  signedCount: number;
  totalMembersCount: number;
}

// 4. Giám định & Đánh giá Chất lượng Bệnh án (EMR QA-QC Quality Audit)
export interface EMRQualityCriterion {
  id: string;
  category: string; // I. Hành chính, II. Khám & Chẩn đoán, III. Điều trị, IV. Quy chế ký số
  name: string;
  maxScore: number;
  score: number;
  isPassed: boolean;
  notes?: string;
}

export interface EMRQualityAudit {
  id: string;
  recordId: string;
  recordNumber: string;
  patientName: string;
  departmentName: string;
  specialty: string;
  auditorName: string;
  auditorTitle: string;
  auditedAt: string;
  
  criteria: EMRQualityCriterion[];
  totalScore: number;
  maxScore: number;
  scorePercentage: number;
  
  grade: 'excellent' | 'good' | 'average' | 'poor'; // Xuất sắc (>=90%), Tốt (>=80%), TB (>=65%), Kém (<65%)
  deficiencies: string[];
  recommendations: string;
  isFeedbackSentToDept: boolean;
}

export interface EMRAccessRequest {
  id: string;
  requestNumber: string;
  recordId: string;
  recordNumber: string;
  patientName: string;
  patientId: string;
  
  // Người yêu cầu
  requestedBy: {
    userId: string;
    fullName: string;
    department: string;
    role: string;
    organization?: string;
  };
  requestDate: string;
  
  // Mục đích khai thác
  purpose: 'scientific_research' | 'legal_investigation' | 'insurance_audit' | 'clinical_consultation' | 'student_training' | 'patient_request';
  purposeDescription: string;
  requestedScope: 'full' | 'summary_only' | 'lab_imaging_only' | 'discharge_only';
  requestedDurationHours: number; // Số giờ truy cập được cấp
  
  // Phê duyệt
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  approvedBy?: {
    userId: string;
    fullName: string;
    title: string;
    approvedAt: string;
  };
  rejectedReason?: string;
  
  // Thời hạn cấp quyền
  accessExpiry?: string;
  accessToken?: string;
}

export interface EMRAuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  ipAddress: string;
  recordId: string;
  recordNumber: string;
  patientName: string;
  action: 'view' | 'create' | 'update' | 'sign' | 'close' | 'archive' | 'request_access' | 'approve_access' | 'submit_handover' | 'accept_handover' | 'reject_handover' | 'unlock_amend' | 'issue_copy' | 'consultation_sign' | 'quality_audit' | 'export_xml' | 'export_pdf';
  documentName?: string;
  details: string;
}

export interface EMRStatistics {
  totalRecords: number;
  activeInpatients: number;
  closedAwaitingSign: number;
  fullySigned: number;
  archivedRecords: number;
  paperlessRatePercentage: number;
  overdueSigningCount: number;
  totalAccessRequests: number;
  pendingAccessRequests: number;
  
  // Handover KPIs
  pendingHandoverCount: number;
  rejectedHandoverCount: number;
  acceptedHandoverCount: number;
  
  // New KPIs for Advanced Modules
  pendingUnlockRequestsCount: number;
  totalCopiesIssuedCount: number;
  ongoingConsultationsCount: number;
  averageQualityScore: number;
  
  specialtyDistribution: {
    specialty: string;
    count: number;
  }[];
  monthlyTrends: {
    month: string;
    newRecords: number;
    signedRecords: number;
  }[];
}

export interface EMRInteropPayload {
  recordId: string;
  format: 'HL7_CDA' | 'HL7_FHIR' | 'XML_4210' | 'XML_130' | 'SSK_VNEID';
  generatedAt: string;
  payloadXmlOrJson: string;
  validationStatus: 'valid' | 'invalid' | 'warning';
  validationErrors?: string[];
}
