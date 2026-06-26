
export interface PatientData {
  name: string;
  identityNumber: string; // Số CMND/CCCD/Hộ chiếu
  identityDate: string; // Ngày cấp CMND/CCCD/Hộ chiếu
  dob: string;  // Định dạng: DD/MM/YYYY
  address: string;  // Địa chỉ thường trú
  gender?: string; // Giới tính

  // Thông tin mở rộng từ HIS
  patientId?: string;        // Mã bệnh nhân (Mã duy nhất trên HIS)
  medicalRecordCode?: string; // Mã hồ sơ / Mã bệnh án
  insuranceNumber?: string;   // Số thẻ BHYT
  phone?: string;
  provinceCode?: string;
  districtCode?: string;
  wardCode?: string;
  lastVisitDate?: string;     // Ngày khám gần nhất
}

export enum ServiceType {
  TECHNICAL = 'Dịch vụ Kỹ thuật',
  MEDICINE = 'Thuốc & Dược phẩm'
}

export interface ServiceItem {
  id: string;
  name: string;
  unit: string;
  price: number;
  type: ServiceType;
  description?: string;
}

export interface BillItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Bill {
  id: string;
  patientId: string;
  patientName: string;
  totalAmount: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  createdAt: string;
  department?: string;
  items: BillItem[];
}

export interface LabResult {
  id?: string;
  name: string;
  value: string;
  unit: string;
  reference_range: string;
  is_abnormal: boolean;
  category?: string;
}

export interface ImagingResult {
  name: string;
  conclusion: string;
  description: string;
  imageUrl?: string;
}

export interface Vitals {
  pulse: number;
  temperature: number;
  bloodPressure: string;
  respiratoryRate: number;
  weight: number;
  height: number;
  bmi: number;
  spo2: number;
}

export interface PrescriptionItem {
  drug_name: string;
  dosage: string;
  quantity: string;
  instruction: string;
  unit: string;
}

export interface MedicalImage {
  id: string;
  type: string;
  url: string;
  thumbnail: string;
  description: string;
  uploadDate: string;
}

export interface MedicalRecord {
  id: string;
  patientName: string;
  gender: 'Nam' | 'Nữ';
  dob: string;
  age: number;
  address?: string;
  insuranceCard?: string;
  identityNumber?: string;

  visitDate: string;
  doctorName: string;
  department: string;

  reason: string;
  diagnosis: string;
  icd10?: string;

  vitals: Vitals;
  labResults: LabResult[];
  imagingResults: ImagingResult[];
  prescription: PrescriptionItem[];
  images?: MedicalImage[];
}

export interface FeedbackData {
  rating: number;
  categories: string[];
  comment: string;
}

export interface PrinterConfig {
  enabled: boolean;
  type: 'USB' | 'LAN' | 'BLUETOOTH' | 'DRIVER' | 'FILE';
  printerName: string;
  printerId?: string;
  ipAddress?: string;
  port?: number;
  language?: 'ESC' | 'TSPL';
  printTemplate?: string;
  removeAccents?: boolean;
  codePage?: number; // ESC/POS Code Page number (e.g., 0, 16, 27, 30, etc.)
  encodingMode?: 'UTF8' | 'CODEPAGE' | 'NO_ACCENTS'; // Encoding strategy for Vietnamese text
  printMode?: 'TEXT' | 'IMAGE'; // Print mode: TEXT (encoding-based) or IMAGE (bitmap-based)
  webProxyUrl?: string; // Optional: URL of a local print proxy for web-only environments
}

export type KioskType = 'RECEPTION' | 'REGISTRATION' | 'EXECUTION' | 'SAMPLING' | 'PAYMENT' | 'DRUG' | 'SURGERY';

export type RegistrationMode = 'FULL' | 'SCAN_ONLY' | 'QUICK_BUTTONS';
export type ScanInputMode = 'CCCD' | 'RECORD_CODE' | 'AUTO';

export interface EnabledModules {
  register: boolean;
  payment: boolean;
  history: boolean;
  catalog: boolean;
  feedback: boolean;
  intro: boolean;
}

export interface AdSlide {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  color?: string;
}

export interface AdConfig {
  slides: AdSlide[];
  newsTicker: string[];
  screensaverDelaySeconds: number;
}

export interface AppSettings {
  hospitalName: string;
  hospitalLogo: string;
  hotline: string;
  scannerMode: 'CAMERA' | 'QR_DEVICE' | 'CHIP_READER';
  scanInputMode: ScanInputMode;
  kioskType: KioskType;
  kioskId: string;
  departmentCode: string;

  useArea: boolean;
  areaId?: number;
  areaCode?: string;
  areaName?: string;
  selectedRooms: string[];
  kioskName: string;
  ipAddress: string;
  serverUrl?: string;
  adminPassword?: string;
  counterId?: number;
  counterName?: string;

  enableDepartmentSelection: boolean;
  enableMultiSpecialtySelection: boolean; // NEW: Allow selecting multiple specialties
  registrationMode: RegistrationMode;
  enabledModules: EnabledModules;
  printerConfig: PrinterConfig;
  callingTemplate?: string; // NEW: Template for calling message (e.g., "Mời bệnh nhân {name} số {number} đến quầy {counter}")
  adConfig: AdConfig;
  displayTemplateId?: string;
  customTheme?: {
    bg: string;
    headerBg: string;
    text: string;
    accent: string;
  };

  bankConfig: {
    bankBin: string;
    accountNo: string;
    accountName: string;
    paymentApiUrl?: string;
  };
}

export type ViewState = 'HOME' | 'REGISTER' | 'PAYMENT' | 'HISTORY' | 'CATALOG' | 'FEEDBACK' | 'INTRO' | 'ADMIN' | 'DISPLAY' | 'PORTAL' | 'CENTRAL_DISPLAY' | 'WORK_AREA' | 'KIOSK' | 'OPERATOR' | 'SETTINGS_ADMIN' | 'SURGERY_DISPLAY';

export interface ReceiptData {
  billId: string;
  patientName: string;
  patientId: string;
  dob?: string;
  gender?: string;
  address?: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  totalAmount: number;
  paymentMethod: string;
  time: string;
  transactionId?: string;
}

export interface TicketData {
  ticketNumber: string;
  patientName: string;
  patientId?: string;
  identityNumber?: string;
  identityDate?: string;
  insuranceCard?: string;
  phone?: string;
  dob?: string;
  gender?: string;
  address?: string;
  department: string;
  specialtyCode: string; // Kept for backward compatibility
  specialtyCodes?: string[]; // NEW: Array of specialty codes for multi-selection
  kioskDeptCode: string;
  provinceCode?: string;
  wardCode?: string;
  serviceName?: string;
  hospitalCode?: string;
  time: string;
  type: KioskType;
  isPriority?: boolean;
  isQuickNumber?: boolean;
  areaName?: string;
  roomname?: string;
  docNo?: string;
  orders?: { name: string; category?: string }[];
}

export interface Province {
  code: string;
  name: string;
}

export interface Ward {
  code: string;
  name: string;
  type: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
}

export interface Specialty {
  id: string;
  name: string;
  deptid: string[];
}

export interface Area {
  id?: string | number;
  area_id?: number;
  code: string;
  name: string;
  area_name?: string;
  dept_id?: string;
}

export interface Room {
  id?: string | number;
  code: string;
  name: string;
  counter_id?: string | number;
  counter_name?: string;
}
