
import React from 'react';

export interface NavItemType {
  name: string;
  path: string;
  icon: React.ReactElement;
}

export interface Patient {
  id: string;
  recordNumber: string;
  name: string;
  dob: string;
  age: number;
  gender: string;
  ethnicity?: string;
  occupation?: string;
  address: string;
  phone?: string;
  identityCard?: string;
  relativeInfo?: string;
  lastVisit?: string;
  patientType?: 'Dịch vụ' | 'Bảo hiểm' | 'Ưu tiên';
  history?: ExaminationRecord[];
}

export interface ExaminationRecord {
  id: string;
  recordNumber: string;
  examDate: string;
  clinic: string;
  ticketNumber: string;
  doctor: string;
  status: string;
  diagnosis: string;
  patientStatus: string;
  examType: string;
  symptoms: string;
}

export interface AISuggestion {
    summary: string;
    potentialDiagnoses: string[];
    nextSteps: string[];
}

export interface ConsultationRecord {
    id: string;
    date: string;
    doctor: string;
    symptoms: string;
    diagnosis: string;
    prescription: any[];
    notes: string;
}

export interface Bill {
    id: string;
    customerId: string;
    date: string;
    consumption: number;
    cost: number;
    status: 'paid' | 'unpaid';
}

export interface Customer {
    id: string;
    name: string;
    email: string;
    address: string;
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
    // Add fields if needed
}

export interface Drug {
    id: string;
    name: string;
    dosage: string;
    stock: number;
}

export interface DrugItem {
    id?: string;
    code: string;
    name: string;
    unit: string;
    price: number;
    usageRoute: string;
    activeIngredient: string;
    stock?: number;
    categoryId?: string;
}

export enum AppointmentStatus {
    Scheduled = 'Scheduled',
    Waiting = 'Waiting',
    InProgress = 'InProgress',
    Completed = 'Completed',
    Cancelled = 'Cancelled'
}

export interface Appointment {
    id: string;
    patientName: string;
    patientId: string;
    time: string;
    doctor: string;
    reason: string;
    status: AppointmentStatus;
    phone?: string;
}

export interface ChatUser {
    id: string;
    name: string;
    status: 'online' | 'offline' | 'busy';
    role: string;
    avatar: string;
}

export interface ChatMessage {
    id: string;
    senderId: string;
    content: string;
    timestamp: string;
    isMe: boolean;
}

export interface ChatChannel {
    id: string;
    name: string;
    isGroup: boolean;
    participants: string[];
    unreadCount: number;
    lastMessage?: ChatMessage;
}

export interface Signature {
    signerName: string;
    signerTitle: string;
    signedAt: Date;
    dataUrl: string;
    placement: {
        pageNumber: number;
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

export interface SignDocument {
    id: string;
    type: string;
    title: string;
    patientName: string;
    patientId: string;
    submittedBy: string;
    submittedDate: string;
    status: 'pending' | 'signed' | 'returned';
    content?: any;
}

export interface ExamInfo {
    patientType: string;
    insuranceNumber?: string;
    examDate: string;
    examRoom: string;
}

export interface ICD10 {
    code: string;
    name: string;
}

export interface ClinicalRecord {
    id: string;
    patientId: string;
    examDate: string;
    doctorName: string;
    history: string;
    clinicalExam: string;
    initialDiagnosis: string;
    mainDisease?: ICD10;
    subDiseases?: ICD10[];
    conclusion: string;
    treatmentPlan: string;
    endTime?: string;
}

export interface OperationRecord {
    id: string;
    serviceName: string;
    requestDate: string;
    type: 'PT' | 'TT';
    operationType: string;
    operationDate: string;
    room: string;
    startTime: string;
    endTime: string;
    mainSurgeon: string;
    assistantSurgeons: string;
    anesthesiologist: string;
    nurses: string;
    technicians: string;
    method: string;
    steps: string;
    instruments: string;
    medications: string;
    images: string[];
}

export interface PrescriptionItem {
    id: string;
    drug: DrugItem;
    quantity: number;
    morning: string;
    noon: string;
    afternoon: string;
    night: string;
    usageNote: string;
    totalPrice: number;
}

export interface Prescription {
    id: string;
    date: string;
    doctorName: string;
    diagnosis: string;
    status: 'draft' | 'confirmed' | 'completed';
    warehouse: string;
    items: PrescriptionItem[];
    totalAmount: number;
}

export interface FeeItem {
    id: string;
    name: string;
    category: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    insurancePaid: number;
    patientPaid: number;
    surcharge: number;
}

export interface SurgerySchedule {
    id: string;
    patientName: string;
    patientId: string;
    procedureName: string;
    surgeonName: string;
    roomId: string;
    date: string;
    startTime: string;
    endTime: string;
    status: 'scheduled' | 'in-progress' | 'completed' | 'emergency';
    notes?: string;
}

export interface SurgeryResource {
    id: string;
    name: string;
    type: string;
}

export interface ConsumableUsage {
    id: string;
    itemId: string;
    itemName: string;
    quantity: number;
    unit: string;
}

export interface MedicalEquipment {
    id: string;
    name: string;
    model: string;
    serialNumber: string;
    manufacturer: string;
    supplier: string;
    purchaseDate: string;
    warrantyExpiry: string;
    department: string;
    status: 'active' | 'maintenance' | 'broken' | 'disposed';
    category: string;
    maintenanceSchedule: string;
    nextMaintenanceDate: string;
    image?: string;
}

export interface MaintenanceTask {
    id: string;
    equipmentId: string;
    equipmentName: string;
    type: 'Preventive' | 'Corrective' | 'Calibration';
    description: string;
    status: 'Scheduled' | 'In Progress' | 'Completed';
    assignedTo: string;
    scheduledDate: string;
    completionDate?: string;
}

export type LisMachineType = 'Hematology' | 'Biochemistry' | 'Immunology' | 'Urine' | 'Microbiology';

export interface LisMachineConfig {
    id: string;
    name: string;
    protocol: 'HL7' | 'ASTM' | 'Serial';
    ip: string;
    port: string;
    mode: 'Bidirectional' | 'Unidirectional';
    status: 'Online' | 'Offline';
    type: LisMachineType;
    autoSendOrder: boolean;
    lastActive?: string;
}

export interface LisLogEntry {
    id: string;
    timestamp: string;
    direction: 'IN' | 'OUT';
    message: string;
    type: 'DATA' | 'ACK' | 'NAK';
    parsedData?: any;
}

export interface LisResultData {
    testCode: string;
    value: string;
    unit: string;
    refRange: string;
    flag: string;
}

export interface LabAppointment {
    id: string;
    patientName: string;
    patientId: string;
    phone: string;
    testTypes: string;
    date: string;
    time: string;
    status: 'Scheduled' | 'Completed' | 'Cancelled';
    notes?: string;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    timestamp: Date;
    isRead: boolean;
    link?: string;
    autoClose?: boolean;
}

export interface DrugInteraction {
    id: string;
    drugCode1: string;
    drugName1: string;
    drugCode2: string;
    drugName2: string;
    severity: 'Mild' | 'Moderate' | 'Severe' | 'Contraindicated';
    description: string;
    management: string;
}
