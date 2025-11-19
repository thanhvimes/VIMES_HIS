
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
