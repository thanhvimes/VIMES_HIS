import React from 'react';
import { 
  Squares2X2Icon,
  ClipboardListIcon,
  ShieldCheckIcon,
  ArchiveIcon,
  ShareIcon,
  CogIcon,
  ClipboardDocumentCheckIcon,
  KeyIcon,
  DocumentTextIcon,
  UserGroupIcon,
  StarIcon
} from '../../components/Icons';
import { NavItemType } from '../../types';
import { EMRDocumentCategory } from './types';

export const EMR_NAV_ITEMS: NavItemType[] = [
  // 1. Dashboard trung tâm
  { 
    name: 'Tổng quan EMR', 
    path: '/emr/dashboard', 
    icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }), 
    iconName: 'Squares2X2Icon' 
  },

  // 2. Nhóm 1: Quản lý Lâm sàng & Điều trị
  { 
    name: 'Hồ sơ Bệnh án', 
    path: '/emr/records', 
    section: 'Quản lý Lâm sàng',
    icon: React.createElement(ClipboardListIcon, { className: "w-5 h-5" }), 
    iconName: 'ClipboardListIcon' 
  },
  { 
    name: 'Hội chẩn & Kiểm thảo TV', 
    path: '/emr/consultations', 
    section: 'Quản lý Lâm sàng',
    icon: React.createElement(UserGroupIcon, { className: "w-5 h-5" }), 
    iconName: 'UserGroupIcon' 
  },
  { 
    name: 'Ký số Y khoa', 
    path: '/emr/signatures', 
    section: 'Quản lý Lâm sàng',
    icon: React.createElement(ShieldCheckIcon, { className: "w-5 h-5" }), 
    iconName: 'ShieldCheckIcon' 
  },

  // 3. Nhóm 2: Tiếp nhận & Lưu trữ Bệnh án
  { 
    name: 'Tiếp nhận & Giao nhận HS', 
    path: '/emr/handover', 
    section: 'Tiếp nhận & Lưu trữ',
    icon: React.createElement(ClipboardDocumentCheckIcon, { className: "w-5 h-5" }), 
    iconName: 'ClipboardDocumentCheckIcon' 
  },
  { 
    name: 'Mở khóa & Sửa đổi HS', 
    path: '/emr/unlock-requests', 
    section: 'Tiếp nhận & Lưu trữ',
    icon: React.createElement(KeyIcon, { className: "w-5 h-5" }), 
    iconName: 'KeyIcon' 
  },

  // 4. Nhóm 3: Khai thác & Liên thông Dữ liệu
  { 
    name: 'Trích sao & Cấp bản sao QR', 
    path: '/emr/copies', 
    section: 'Khai thác & Liên thông',
    icon: React.createElement(DocumentTextIcon, { className: "w-5 h-5" }), 
    iconName: 'DocumentTextIcon' 
  },
  { 
    name: 'Khai thác & Mượn HS', 
    path: '/emr/access-requests', 
    section: 'Khai thác & Liên thông',
    icon: React.createElement(ArchiveIcon, { className: "w-5 h-5" }), 
    iconName: 'ArchiveIcon' 
  },
  { 
    name: 'Liên thông HL7 & XML', 
    path: '/emr/interop', 
    section: 'Khai thác & Liên thông',
    icon: React.createElement(ShareIcon, { className: "w-5 h-5" }), 
    iconName: 'ShareIcon' 
  },

  // 5. Nhóm 4: Giám sát & Quản trị Hệ thống
  { 
    name: 'Giám định Chất lượng BA', 
    path: '/emr/quality-audit', 
    section: 'Giám định & Quản trị',
    icon: React.createElement(StarIcon, { className: "w-5 h-5" }), 
    iconName: 'StarIcon' 
  },
  { 
    name: 'Danh mục & Cấu hình', 
    path: '/emr/settings', 
    section: 'Giám định & Quản trị',
    icon: React.createElement(CogIcon, { className: "w-5 h-5" }), 
    iconName: 'CogIcon' 
  },
];

export const EMR_STATUS_LABELS: Record<string, { label: string; color: string; badgeBg: string; textBg: string }> = {
  active: {
    label: 'Đang điều trị',
    color: 'emerald',
    badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    textBg: 'text-emerald-600 dark:text-emerald-400',
  },
  closed: {
    label: 'Chờ ký số & Duyệt',
    color: 'amber',
    badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    textBg: 'text-amber-600 dark:text-amber-400',
  },
  signed: {
    label: 'Đã hoàn tất ký số',
    color: 'blue',
    badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    textBg: 'text-blue-600 dark:text-blue-400',
  },
  archived: {
    label: 'Đã lưu trữ số hóa',
    color: 'purple',
    badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    textBg: 'text-purple-600 dark:text-purple-400',
  },
  cancelled: {
    label: 'Đã hủy',
    color: 'rose',
    badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    textBg: 'text-rose-600 dark:text-rose-400',
  },
};

export const HANDOVER_STATUS_LABELS: Record<string, { label: string; badgeBg: string; textBg: string; iconName: string }> = {
  draft_in_dept: {
    label: 'Đang hoàn thiện tại khoa',
    badgeBg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    textBg: 'text-slate-600 dark:text-slate-400',
    iconName: 'Clock',
  },
  submitted_to_emr: {
    label: 'Chờ KHTH tiếp nhận & Duyệt',
    badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    textBg: 'text-amber-600 dark:text-amber-400',
    iconName: 'Inbox',
  },
  accepted_by_emr: {
    label: 'Đã duyệt nhận vào Kho EMR',
    badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    textBg: 'text-emerald-600 dark:text-emerald-400',
    iconName: 'CheckCircle2',
  },
  rejected_by_emr: {
    label: 'Trả về yêu cầu bổ sung',
    badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800',
    textBg: 'text-rose-600 dark:text-rose-400',
    iconName: 'XCircle',
  },
};

export const SIGNATURE_STATUS_LABELS: Record<string, { label: string; badgeBg: string }> = {
  unsigned: {
    label: 'Chưa ký số',
    badgeBg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
  },
  partially_signed: {
    label: 'Đang ký (Thiếu chữ ký)',
    badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800',
  },
  fully_signed: {
    label: 'Ký số đầy đủ (Hợp lệ)',
    badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
  },
  rejected: {
    label: 'Từ chối ký / Lỗi chứng thư',
    badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800',
  },
};

export const UNLOCK_REASON_LABELS: Record<string, string> = {
  late_pathology_results: 'Bổ sung kết quả Giải phẫu bệnh (trả sau xuất viện)',
  late_microbiology_culture: 'Bổ sung kết quả Nuôi cấy vi sinh & Kháng sinh đồ',
  administrative_correction: 'Đính chính sai sót thông tin hành chính / Thẻ BHYT',
  supplementary_diagnosis: 'Bổ sung chẩn đoán bệnh kèm theo / Phân loại ICD-10',
  court_investigation_order: 'Theo yêu cầu của Cơ quan Cảnh sát điều tra / Tòa án',
};

export const COPY_PURPOSE_LABELS: Record<string, string> = {
  insurance_claim: 'Thanh toán Bảo hiểm Thương mại / Nhân thọ',
  hospital_transfer: 'Chuyển tuyến điều trị / Xin ý kiến chuyên môn',
  social_welfare: 'Hưởng chế độ BHXH / Nghỉ ốm đau thai sản',
  court_legal: 'Phục vụ Giám định pháp y / Hồ sơ tố tụng',
  personal_records: 'Lưu trữ hồ sơ sức khỏe cá nhân',
};

export const COPY_DOC_TYPE_LABELS: Record<string, string> = {
  discharge_summary: 'Trích tóm tắt hồ sơ bệnh án (Bản sao số hóa)',
  full_record: 'Toàn bộ hồ sơ bệnh án đã niêm phong',
  surgery_certificate: 'Giấy chứng nhận Phẫu thuật / Thủ thuật',
  injury_certificate: 'Giấy chứng nhận Thương tích',
  birth_certificate: 'Giấy chứng sinh điện tử',
  death_certificate: 'Giấy báo tử điện tử',
};

export const QUALITY_GRADE_LABELS: Record<string, { label: string; badgeBg: string }> = {
  excellent: {
    label: 'Xuất sắc (>= 90%)',
    badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300',
  },
  good: {
    label: 'Tốt (80% - 89%)',
    badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300',
  },
  average: {
    label: 'Trung bình (65% - 79%)',
    badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300',
  },
  poor: {
    label: 'Kém / Sai sót (< 65%)',
    badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300',
  },
};

export const EMR_DOCUMENT_CATEGORIES = [
  { id: 'administrative', name: 'I. Hồ sơ Hành chính & Vào viện', icon: 'FolderUser' },
  { id: 'medical_record', name: 'II. Bệnh án chính chuyên khoa', icon: 'FileHeart' },
  { id: 'treatment_sheets', name: 'III. Tờ điều trị & Diễn biến', icon: 'Stethoscope' },
  { id: 'care_sheets', name: 'IV. Phiếu chăm sóc điều dưỡng', icon: 'Activity' },
  { id: 'lab_results', name: 'V. Kết quả Xét nghiệm (LIS)', icon: 'FlaskConical' },
  { id: 'imaging_results', name: 'VI. Chẩn đoán hình ảnh & PACS', icon: 'Scan' },
  { id: 'surgery_procedure', name: 'VII. Phẫu thuật - Thủ thuật', icon: 'Scissors' },
  { id: 'consultation', name: 'VIII. Biên bản hội chẩn', icon: 'Users' },
  { id: 'discharge_summary', name: 'IX. Tóm tắt xuất viện & Giấy tờ ra viện', icon: 'FileCheck' },
];

export const MOH_SPECIALTY_TEMPLATES = [
  { code: 'BA-NOI', name: 'Bệnh án Nội khoa', mohCode: '01/BV-01', category: 'medical_record', isRequired: true },
  { code: 'BA-NGOAI', name: 'Bệnh án Ngoại khoa', mohCode: '02/BV-01', category: 'medical_record', isRequired: true },
  { code: 'BA-SAN', name: 'Bệnh án Phụ sản', mohCode: '03/BV-01', category: 'medical_record', isRequired: true },
  { code: 'BA-NHI', name: 'Bệnh án Nhi khoa', mohCode: '04/BV-01', category: 'medical_record', isRequired: true },
  { code: 'BA-TMH', name: 'Bệnh án Tai Mũi Họng', mohCode: '06/BV-01', category: 'medical_record', isRequired: true },
  { code: 'BA-RHM', name: 'Bệnh án Răng Hàm Mặt', mohCode: '07/BV-01', category: 'medical_record', isRequired: true },
  { code: 'BA-MAT', name: 'Bệnh án Mắt', mohCode: '08/BV-01', category: 'medical_record', isRequired: true },
  { code: 'BA-YHCT', name: 'Bệnh án Y học Cổ truyền', mohCode: '10/BV-01', category: 'medical_record', isRequired: true },
  { code: 'BA-UB', name: 'Bệnh án Ung bướu', mohCode: '11/BV-01', category: 'medical_record', isRequired: true },
  { code: 'TO-DIEU-TRI', name: 'Tờ điều trị lâm sàng hàng ngày', mohCode: '09/BV-02', category: 'treatment_sheets', isRequired: true },
  { code: 'PHIEU-CHAM-SOC', name: 'Phiếu theo dõi và chăm sóc điều dưỡng', mohCode: '12/BV-02', category: 'care_sheets', isRequired: true },
  { code: 'PHIEU-PHAU-THUAT', name: 'Phiếu phẫu thuật - thủ thuật', mohCode: '14/BV-02', category: 'surgery_procedure', isRequired: false },
  { code: 'BIEN-BAN-HOI-CHAN', name: 'Biên bản hội chẩn chuyên môn', mohCode: '15/BV-02', category: 'consultation', isRequired: false },
  { code: 'TOM-TAT-BENH-AN', name: 'Trích tóm tắt hồ sơ bệnh án', mohCode: '18/BV-02', category: 'discharge_summary', isRequired: true },
  { code: 'GIAY-RA-VIEN', name: 'Giấy ra viện điện tử', mohCode: '19/BV-02', category: 'discharge_summary', isRequired: true },
];

export const ACCESS_PURPOSE_LABELS: Record<string, string> = {
  scientific_research: 'Nghiên cứu khoa học & Đề tài y học',
  legal_investigation: 'Phục vụ cơ quan pháp luật & Điều tra',
  insurance_audit: 'Giám định Bảo hiểm Y tế & Bảo hiểm tư nhân',
  clinical_consultation: 'Hội chẩn liên viện / Chuyên môn',
  student_training: 'Đào tạo học viên, sinh viên thực tập',
  patient_request: 'Người bệnh / Thân nhân yêu cầu sao chép',
};
