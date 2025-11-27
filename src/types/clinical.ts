import { DrugItem } from './finance';

export interface AISuggestion {
    summary: string;
    potentialDiagnoses: string[];
    nextSteps: string[];
}

export interface ServiceCategory {
    id: string;
    name: string;
    type: 'XN' | 'CDHA' | 'TDCN'; // Xét nghiệm | Chẩn đoán hình ảnh | Thăm dò chức năng
}

export interface ServiceItem {
    id: string;
    code: string;
    name: string;
    categoryId: string;
    price: number;
    unit: string;
}

export interface ServiceTemplate {
    id: string;
    name: string;
    description: string;
    serviceIds: string[]; // IDs of ServiceItems included in this template
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