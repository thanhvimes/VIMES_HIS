import { DrugItem } from './finance';

export interface AISuggestion {
    summary: string;
    potentialDiagnoses: string[];
    nextSteps: string[];
}

export interface VitalSigns {
    pulse?: number;
    temperature?: number;
    bpSystolic?: number;
    bpDiastolic?: number;
    breathingRate?: number;
    weight?: number;
    height?: number;
    bmi?: number;
    spo2?: number;
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
    id: string; // Added id property
    signerName: string;
    signerUsername?: string; // Optional field for tracking logged-in account
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
    yhctCode?: string;
    yhctName?: string;
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
    vitals?: VitalSigns;
    he_type?: number;
    specialtyData?: any;
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
    itemId?: string;
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

export interface PrescriptionTemplate {
    id: string;
    name: string;
    description?: string;
    items: Partial<PrescriptionItem>[];
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

export interface PortalParaclinicalItem {
    id?: string;            // Optional alias for orderid
    orderid: string;
    deptid: string;
    status: string;
    gname: string;          // Group name (e.g., "Xét nghiệm máu", "X-quang")
    groupid: string;
    createdby: string;
    doctor: string;
    orderdate: string;      // DD/MM/YYYY HH24:MI
    performdate?: string;   // DD/MM/YYYY HH24:MI
    practitioner?: string;
    treatidx?: number;
    signed_labo?: string;
    ordertype: string;      // 'T' = Lab, 'P' = Imaging
    stt?: string;           // Sequence Number
    estimatedTime?: string; // HH:mm
}

export interface DetailedHistoryRecord {
    id: string;
    patientId: string;
    patientName?: string;
    visitId?: string;
    date: string;       // Formatted as DD/MM/YYYY
    examDate?: string;
    dept: string;       // Department name
    specialty?: string;
    doctor: string;     // Doctor name
    doctorName?: string;
    diagnosis: string;
    status: string;
    vitals?: {
        bp: string;
        hr: string;
        temp: string;
        weight: string;
    };
    symptoms?: string;
    notes?: string;
    labSummary?: string;
    prescriptionSummary?: string;
    prescriptions?: PortalPrescriptionItem[];
    paraclinical?: PortalParaclinicalItem[];
}

export interface PortalPrescriptionItem {
    name: string;
    unit: string;
    usage: string;
    quantity: number;
    pharma: string;
    doctor?: string;
}
