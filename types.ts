
import React from 'react';

export interface ExaminationRecord {
  id: string; // Unique ID for the examination
  recordNumber: string; // Số HS
  examDate: string; // Ngày khám
  clinic: string; // Phòng khám
  ticketNumber: string; // Số phiếu
  doctor: string; // Bác sĩ
  status: string; // Trạng thái
  diagnosis: string; // Chẩn đoán
  // Details for the form
  patientStatus: string;
  examType: string;
  symptoms: string;
}

export interface Patient {
  id: string; // Mã BN
  recordNumber: string; // Số hồ sơ
  name: string;
  dob: string; // Năm sinh
  age: number;
  gender: 'Nam' | 'Nữ' | 'Khác';
  ethnicity: string; // Dân tộc
  occupation: string; // Nghề nghiệp
  address: string; // Địa chỉ chi tiết
  phone: string;
  identityCard?: string; // Thẻ căn cước
  relativeInfo?: string; // Người thân
  lastVisit: string;
  province?: string;
  ward?: string;
  patientType?: 'Dịch vụ' | 'Bảo hiểm';
  history?: ExaminationRecord[];
}

export interface ExamInfo {
    patientStatus: string;
    examDate: string;
    ticketNumber: string;
    examType: string;
    examRoom: string;
    symptoms: string;
    patientType: 'Dịch vụ' | 'Bảo hiểm';
    insuranceNumber?: string;
}


export enum AppointmentStatus {
  Scheduled = 'Scheduled',
  Waiting = 'Waiting',
  InProgress = 'In Progress',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export interface Appointment {
  id: string;
  patientName: string;
  patientId: string;
  time: string;
  doctor: string;
  reason: string;
  status: AppointmentStatus;
}

export interface ConsultationRecord {
    id: string;
    date: string;
    doctor: string;
    symptoms: string;
    diagnosis: string;
    prescription: Drug[];
    notes: string;
}

export interface Drug {
    id: string;
    name: string;
    dosage: string;
    stock: number;
    expiryDate?: string;
}

export interface Invoice {
    id: string;
    patientName: string;
    date: string;
    amount: number;
    status: 'Paid' | 'Unpaid';
    items: { description: string; cost: number }[];
}

export interface LabResult {
    id: string;
    patientName: string;
    testName: string;
    date: string;
    status: 'Pending' | 'Completed';
    resultUrl?: string;
}

export interface ImagingResult {
    id: string;
    patientName: string;
    testName: string;
    date: string;
    status: 'Pending' | 'Completed';
    imageUrl?: string;
}

export interface AISuggestion {
  summary: string;
  potentialDiagnoses: string[];
  nextSteps: string[];
}

export interface NavItemType {
  name: string;
  path: string;
  icon: React.ReactElement<any>;
}

export type SignaturePlacementBox = {
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export interface Signature {
  dataUrl: string; // The base64 PNG data URL from signature_pad
  placement: SignaturePlacementBox;
  signerName: string;
  signerTitle: string;
  signedAt: Date;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  address: string;
}

export interface Bill {
  id: string;
  customerId: string;
  date: string; // Format: YYYY-MM
  consumption: number; // in kWh
  cost: number; // in VND
  status: 'paid' | 'unpaid';
}

// --- NEW TYPES FOR EXAMINATION MODULE ---

export interface ICD10 {
  code: string;
  name: string;
}

export interface ClinicalRecord {
  id: string;
  patientId: string;
  examDate: string;
  endTime?: string; // Giờ kết thúc
  doctorName: string;
  
  // Tab 1: Clinical Process
  history: string; // Quá trình bệnh lý
  clinicalExam: string; // Khám lâm sàng
  
  // Tab 2: Diagnosis
  initialDiagnosis: string; // Chẩn đoán ban đầu
  mainDisease?: ICD10; // Bệnh chính
  subDiseases?: ICD10[]; // Bệnh kèm theo
  
  // Tab 3: Conclusion
  conclusion: string; // Kết luận
  treatmentPlan: string; // Hướng điều trị/Lời dặn
}

// --- NEW TYPES FOR OPERATION MODULE ---

export interface OperationRecord {
    id: string;
    serviceName: string; // Tên dịch vụ
    requestDate: string;
    type: 'PT' | 'TT'; // Phẫu thuật | Thủ thuật
    
    // Info
    operationType: string; // Loại phẫu thuật (e.g., Cắt bỏ khối u)
    operationDate: string;
    room: string;
    startTime: string;
    endTime: string;

    // Team
    mainSurgeon: string;
    assistantSurgeons: string; // Comma separated or multiline
    anesthesiologist: string;
    nurses: string;
    technicians: string;

    // Details
    method: string; // Phương pháp PT
    steps: string; // Các bước tiến hành
    instruments: string; // Dụng cụ
    medications: string; // Thuốc sử dụng
    
    // Images
    images?: string[]; // Array of base64 strings or URLs
}

// --- NEW TYPES FOR MEDICATION MODULE ---

export interface DrugItem {
  code: string;
  name: string;
  unit: string;
  price: number;
  usageRoute: string; // Đường dùng (Uống, Tiêm...)
  activeIngredient?: string; // Hoạt chất
  stock?: number;
}

export interface PrescriptionItem {
  id: string;
  drug: DrugItem;
  quantity: number;
  morning: string; // Sáng
  noon: string;    // Trưa
  afternoon: string; // Chiều
  night: string;   // Tối
  usageNote: string; // Cách dùng (Sau ăn, trước ăn...)
  totalPrice: number;
}

export interface Prescription {
  id: string;
  date: string; // Date of creation
  doctorName: string;
  diagnosis: string;
  status: 'draft' | 'confirmed' | 'completed';
  warehouse: string; // Kho thuốc
  items: PrescriptionItem[];
  totalAmount: number;
  note?: string;
}

// --- NEW TYPES FOR FEE MODULE ---

export interface FeeItem {
  id: string;
  name: string;
  category: string; // e.g., "KHÁM BỆNH", "XÉT NGHIỆM", "THUỐC"
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  insurancePaid: number; // Amount paid by insurance
  patientPaid: number; // Amount paid by patient
  surcharge: number; // Tiền chênh lệch/Phụ thu
}

// --- SURGERY MODULE TYPES ---

export interface SurgerySchedule {
  id: string;
  patientName: string;
  patientId: string;
  procedureName: string;
  surgeonName: string;
  roomId: string; // ID of the operating room
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  date: string; // YYYY-MM-DD
  status: 'scheduled' | 'in-progress' | 'completed' | 'emergency';
  notes?: string;
}

export interface SurgeryResource {
  id: string;
  name: string;
  type: 'OR' | 'Recovery';
}

export interface SafetyChecklist {
  signIn: Record<string, boolean>; // Before Anesthesia
  timeOut: Record<string, boolean>; // Before Incision
  signOut: Record<string, boolean>; // Before Leaving OR
}

export interface ConsumableUsage {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
}

// --- MEDICAL EQUIPMENT MODULE TYPES ---

export type EquipmentStatus = 'active' | 'maintenance' | 'broken' | 'disposed' | 'inactive';

export interface MedicalEquipment {
  id: string; // Asset ID / Barcode
  name: string;
  model: string;
  serialNumber: string;
  manufacturer: string;
  supplier: string;
  purchaseDate: string;
  warrantyExpiry: string;
  department: string; // Khoa/Phòng sử dụng
  status: EquipmentStatus;
  category: string; // e.g., Imaging, Life Support, Lab
  image?: string;
  maintenanceSchedule?: 'Monthly' | 'Quarterly' | 'Yearly';
  nextMaintenanceDate?: string;
}

export interface MaintenanceTask {
  id: string;
  equipmentId: string;
  equipmentName: string;
  type: 'Preventive' | 'Corrective' | 'Calibration';
  description: string;
  status: 'Scheduled' | 'In Progress' | 'Completed';
  assignedTo: string; // Technician
  scheduledDate: string;
  completionDate?: string;
}
