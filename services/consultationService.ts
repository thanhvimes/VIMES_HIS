
import { apiClient } from './apiClient';
import { ClinicalRecord, ICD10, OperationRecord, Prescription, DetailedHistoryRecord } from '../types/clinical';
import { Patient } from '../types/patient';
import { mockPatients } from '../modules/reception/data'; // Use existing mock data

// Mock Data Helpers
const mockClinicalRecord: ClinicalRecord = {
    id: 'REC-MOCK-001',
    patientId: 'P003',
    examDate: new Date().toISOString().slice(0, 16),
    doctorName: 'BS. Nguyễn Văn A',
    history: 'Bệnh nhân khai đau đầu 3 ngày nay.',
    clinicalExam: 'Huyết áp 130/80, Mạch 80.',
    initialDiagnosis: 'Đau đầu chưa rõ nguyên nhân',
    conclusion: 'Theo dõi thêm',
    treatmentPlan: 'Nghỉ ngơi, uống thuốc theo đơn',
    endTime: new Date().toISOString().slice(0, 16)
};

const generateMockHistory = (): DetailedHistoryRecord[] => [
    {
        id: 'HIST_001',
        patientId: 'P003',
        patientName: 'Lê Hoàng Cường',
        visitId: 'V23111501',
        examDate: '15/11/2023',
        doctorName: 'BS. Nguyễn Văn A',
        specialty: 'Nội khoa',
        diagnosis: 'Viêm phế quản cấp',
        vitals: { bp: '120/80', hr: '80', temp: '37.5', weight: '65' },
        symptoms: 'Ho, sốt nhẹ',
        notes: 'Tái khám sau 5 ngày',
        labSummary: 'CTM, CRP',
        prescriptionSummary: 'Augmentin, Panadol'
    },
    {
        id: 'HIST_002',
        patientId: 'P003',
        patientName: 'Lê Hoàng Cường',
        visitId: 'V23101005',
        examDate: '10/10/2023',
        doctorName: 'BS. Trần Thị B',
        specialty: 'Nội tiết',
        diagnosis: 'Đái tháo đường type 2',
        vitals: { bp: '130/85', hr: '82', temp: '37.0', weight: '66' },
        symptoms: 'Mệt mỏi, khát nước',
        notes: 'Kiểm soát chế độ ăn',
        labSummary: 'Glucose, HbA1c',
        prescriptionSummary: 'Metformin'
    }
];

export const consultationService = {
    // --- Patient Clinical Profile ---
    getPatientProfile: async (patientId: string): Promise<any> => {
        try {
            return await apiClient.get<any>(`/clinical/patients/${patientId}/summary`);
        } catch (error) {
            console.warn(`API Error (getPatientProfile), using mock data for ${patientId}`);
            const patient = mockPatients.find(p => p.id === patientId) || mockPatients[0];
            return {
                ...patient,
                hasInsurance: patient.patientType === 'Bảo hiểm',
                insuranceNumber: 'GD4790215567890',
                diagnosis: '[J18] Viêm phổi, tác nhân không xác định',
                vitalSigns: {
                    height: 170,
                    weight: 68,
                    bmi: 23.5,
                    bpSys: 120,
                    bpDia: 80,
                    heartRate: 80,
                    respRate: 20,
                    temp: 37,
                    spO2: 98
                },
                bpHistory: [
                    { date: '10/11', systolic: 120, diastolic: 80 },
                    { date: '12/11', systolic: 125, diastolic: 82 },
                    { date: '15/11', systolic: 118, diastolic: 78 },
                ]
            };
        }
    },

    // --- Clinical Records (Phiếu khám) ---
    getClinicalRecord: async (patientId: string): Promise<ClinicalRecord> => {
        try {
            return await apiClient.get<ClinicalRecord>(`/clinical/records/active`, { patientId });
        } catch (error) {
             console.warn("API Error (getClinicalRecord), using mock data");
             return { ...mockClinicalRecord, patientId };
        }
    },

    saveClinicalRecord: async (record: ClinicalRecord): Promise<ClinicalRecord> => {
        try {
            if (record.id && !record.id.startsWith('REC-')) {
                 return await apiClient.put<ClinicalRecord>(`/clinical/records/${record.id}`, record);
            } else {
                 return await apiClient.post<ClinicalRecord>('/clinical/records', record);
            }
        } catch (error) {
            console.warn("API Error (saveClinicalRecord), simulating success");
            return { ...record, id: record.id || `REC-${Date.now()}` };
        }
    },

    // --- Master Data Lookups ---
    searchICD10: async (query: string): Promise<ICD10[]> => {
        try {
            return await apiClient.get<ICD10[]>('/master-data/icd10', { q: query });
        } catch {
            return [
                { code: 'A09', name: 'Tiêu chảy và viêm dạ dày ruột' },
                { code: 'J00', name: 'Viêm mũi họng cấp tính' },
                { code: 'E11', name: 'Bệnh đái tháo đường không phụ thuộc insuline' }
            ].filter(i => i.name.toLowerCase().includes(query.toLowerCase()) || i.code.toLowerCase().includes(query.toLowerCase()));
        }
    },

    // --- Operations (Phẫu thuật/Thủ thuật) ---
    getOperations: async (patientId: string): Promise<OperationRecord[]> => {
        try {
            return await apiClient.get<OperationRecord[]>('/clinical/operations', { patientId });
        } catch {
             return [];
        }
    },

    saveOperation: async (op: OperationRecord): Promise<OperationRecord> => {
        try {
            if (op.id) {
                return await apiClient.put<OperationRecord>(`/clinical/operations/${op.id}`, op);
            }
            return await apiClient.post<OperationRecord>('/clinical/operations', op);
        } catch {
            return { ...op, id: op.id || `OP-${Date.now()}` };
        }
    },

    deleteOperation: async (id: string): Promise<boolean> => {
        try {
            await apiClient.delete(`/clinical/operations/${id}`);
            return true;
        } catch {
            return true;
        }
    },
    
    // --- History ---
    getHistoryList: async (filter: { fromDate?: string, toDate?: string, doctor?: string, keyword?: string }): Promise<DetailedHistoryRecord[]> => {
        try {
            return await apiClient.get<DetailedHistoryRecord[]>('/clinical/history', filter);
        } catch (error) {
            console.warn("API Error (getHistoryList), using mock data");
            return generateMockHistory().filter(h => 
                (!filter.keyword || h.patientName.toLowerCase().includes(filter.keyword.toLowerCase()) || h.patientId.includes(filter.keyword)) &&
                (!filter.doctor || h.doctorName === filter.doctor)
            );
        }
    },
    
    // --- Prescriptions ---
    savePrescription: async (prescription: Prescription): Promise<Prescription> => {
        try {
            return await apiClient.post<Prescription>('/clinical/prescriptions', prescription);
        } catch {
            return prescription;
        }
    }
};
