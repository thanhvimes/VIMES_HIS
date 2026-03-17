
import { apiClient } from './apiClient';
import { ClinicalRecord, ICD10, OperationRecord, Prescription, DetailedHistoryRecord } from '../types/clinical';
import { Patient } from '../types/patient';
import { mockPatients } from '../modules/reception/data'; 

// --- MOCK DATA ---

const mockClinicalRecord: ClinicalRecord = {
    id: 'REC-MOCK-001',
    patientId: 'P003',
    examDate: new Date().toISOString().slice(0, 16),
    doctorName: 'BS. Nguyễn Văn A',
    history: 'Bệnh nhân khai đau đầu âm ỉ vùng chẩm 3 ngày nay. Không nôn, không sốt.',
    clinicalExam: 'Huyết áp 130/80 mmHg, Mạch 80 l/p. Tim đều, phổi trong. Cổ mềm, không dấu thần kinh khu trú.',
    initialDiagnosis: 'Đau đầu căng cơ / Theo dõi Tăng huyết áp',
    conclusion: 'Đau đầu do căng thẳng',
    treatmentPlan: 'Nghỉ ngơi, thư giãn. Kê đơn giảm đau và an thần nhẹ.',
    endTime: new Date().toISOString().slice(0, 16)
};

const mockOperations: OperationRecord[] = [
    {
        id: 'OP-001',
        serviceName: 'Phẫu thuật nội soi cắt ruột thừa',
        requestDate: '2023-11-15',
        type: 'PT',
        operationType: 'Phẫu thuật cấp cứu',
        operationDate: '2023-11-15',
        room: 'Phòng mổ 02',
        startTime: '08:00',
        endTime: '10:00',
        mainSurgeon: 'BS. Nguyễn Văn A',
        assistantSurgeons: 'BS. Trần Thị B',
        anesthesiologist: 'BS. Phạm Văn D',
        nurses: 'ĐD. Nguyễn Thị E',
        technicians: 'KTV. Lê Thị G',
        method: 'Gây mê nội khí quản',
        steps: '- Rạch da...\n- Đặt trocar...\n- Bộc lộ ruột thừa viêm...\n- Kẹp cắt ruột thừa...\n- Lau rửa ổ bụng...\n- Đóng các lỗ trocar.',
        instruments: 'Bộ dụng cụ nội soi tiêu hóa',
        medications: 'Cefuroxime 1.5g, Metronidazole 500mg',
        images: ['https://prod-images-static.radiopaedia.org/images/51665203/233d35423207068736406926750671_jumbo.jpeg']
    }
];

const generateMockHistory = (): DetailedHistoryRecord[] => [
    {
        id: 'HIST_001',
        patientId: 'P003',
        patientName: 'Lê Hoàng Cường',
        visitId: 'V23111501',
        date: '15/11/2023',
        examDate: '15/11/2023',
        dept: 'Nội khoa',
        specialty: 'Nội khoa',
        doctor: 'BS. Nguyễn Văn A',
        doctorName: 'BS. Nguyễn Văn A',
        status: 'Đã khám',
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
        date: '10/10/2023',
        examDate: '10/10/2023',
        dept: 'Nội tiết',
        specialty: 'Nội tiết',
        doctor: 'BS. Trần Thị B',
        doctorName: 'BS. Trần Thị B',
        status: 'Đã khám',
        diagnosis: 'Đái tháo đường type 2',
        vitals: { bp: '130/85', hr: '82', temp: '37.0', weight: '66' },
        symptoms: 'Mệt mỏi, khát nước',
        notes: 'Kiểm soát chế độ ăn',
        labSummary: 'Glucose, HbA1c',
        prescriptionSummary: 'Metformin'
    }
];

// --- SERVICE IMPLEMENTATION ---

export const consultationService = {
    // --- Patient Clinical Profile ---
    async getPatientProfile(patientId: string, docNo?: string): Promise<any> {
        const response = await apiClient.get<any>(`/consultation/patient-profile/${patientId}${docNo ? `?docNo=${docNo}` : ''}`);
        return response.data;
    },

    // --- Clinical Records (Phiếu khám) ---
    getClinicalRecord: async (patientId: string): Promise<ClinicalRecord> => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return { ...mockClinicalRecord, patientId };
    },

    getClinicalRecordByDocNo: async (docNo: number): Promise<ClinicalRecord> => {
        return apiClient.get(`/consultation/records/${docNo}`);
    },

    saveClinicalRecord: async (payload: any): Promise<any> => {
        return apiClient.post('/consultation/records', payload);
    },

    checkInsuranceRules: async (docNo: number, receptIdx: number): Promise<any> => {
        return apiClient.get(`/consultation/check-insurance?docNo=${docNo}&receptIdx=${receptIdx}`);
    },

    callPatient: async (payload: { docNo: number, deptId: string, roomId: number, receptIdx: number }): Promise<any> => {
        return apiClient.post('/consultation/call-patient', payload);
    },

    getDiseasePrehistory: async (patientId: string): Promise<any> => {
        return apiClient.get(`/consultation/prehistory/${patientId}`);
    },

    saveDiseasePrehistory: async (patientId: string, data: { owner: string, family: string, drugallergy: string }): Promise<any> => {
        return apiClient.post(`/consultation/prehistory/${patientId}`, data);
    },

    printExamination: async (docNo: number): Promise<Blob> => {
        return apiClient.get(`/consultation/print/${docNo}`, undefined, { responseType: 'blob' });
    },

    // --- Master Data Lookups ---
    searchICD10: async (query: string): Promise<ICD10[]> => {
        // Local mock search
        const mockICD = [
            { code: 'A09', name: 'Tiêu chảy và viêm dạ dày ruột' },
            { code: 'J00', name: 'Viêm mũi họng cấp tính' },
            { code: 'E11', name: 'Bệnh đái tháo đường không phụ thuộc insuline' },
            { code: 'I10', name: 'Bệnh tăng huyết áp vô căn (nguyên phát)' },
            { code: 'R51', name: 'Đau đầu' }
        ];
        return mockICD.filter(i => 
            i.name.toLowerCase().includes(query.toLowerCase()) || 
            i.code.toLowerCase().includes(query.toLowerCase())
        );
    },

    // --- Operations (Phẫu thuật/Thủ thuật) ---
    getOperationCatalog: async (query?: string, groupId?: string): Promise<any> => {
        return apiClient.get(`/consultation/operations/catalog?q=${query || ''}${groupId ? `&groupId=${groupId}` : ''}`);
    },

    getOperations: async (docNo: number): Promise<any> => {
        return apiClient.get(`/consultation/operations/history/${docNo}`);
    },

    saveOperation: async (payload: any): Promise<any> => {
        return apiClient.post('/consultation/operations', payload);
    },

    deleteOperation: async (id: string): Promise<any> => {
        return apiClient.delete(`/consultation/operations/${id}`);
    },

    printOperation: async (id: string): Promise<Blob> => {
        return apiClient.get(`/consultation/operations/print/${id}`, undefined, { responseType: 'blob' });
    },
    
    // --- History ---
    getHistoryList: async (filter: { fromDate?: string, toDate?: string, doctor?: string, keyword?: string }): Promise<DetailedHistoryRecord[]> => {
        await new Promise(resolve => setTimeout(resolve, 600));
        return generateMockHistory().filter(h => 
            (!filter.keyword || h.patientName.toLowerCase().includes(filter.keyword.toLowerCase()) || h.patientId.includes(filter.keyword)) &&
            (!filter.doctor || h.doctorName === filter.doctor)
        );
    },
    
    // --- Prescriptions ---
    searchDrugs: async (query: string): Promise<any> => {
        return apiClient.get(`/consultation/drugs/search?q=${query}`);
    },

    savePrescription: async (payload: { docNo: number, items: any[] }): Promise<any> => {
        return apiClient.post('/consultation/prescriptions', payload);
    },

    getPrescriptionHistory: async (docNo: number): Promise<any> => {
        return apiClient.get(`/consultation/prescriptions/history/${docNo}`);
    },

    // --- CLS (Paraclinical Services) ---
    getServiceCatalog: async (groupId?: string): Promise<any> => {
        return apiClient.get(`/consultation/services/catalog${groupId ? `?groupId=${groupId}` : ''}`);
    },

    saveServiceOrder: async (payload: { docNo: number, items: any[], groupId: string }): Promise<any> => {
        return apiClient.post('/consultation/services/order', payload);
    },

    getServiceHistory: async (docNo: number): Promise<any> => {
        return apiClient.get(`/consultation/services/history/${docNo}`);
    },

    getFees: async (docNo: number): Promise<any> => {
        return apiClient.get(`/consultation/fees/history/${docNo}`);
    },

    printFees: async (docNo: number): Promise<Blob> => {
        return apiClient.get(`/consultation/fees/print/${docNo}`, undefined, { responseType: 'blob' });
    },

    getExamQueue: async (params: { 
        status: string; 
        deptId?: string; 
        timePeriod?: string; 
        fromDate?: string; 
        toDate?: string; 
        roomId?: number;
        isOutpatient?: boolean;
        isChronic?: boolean;
    }): Promise<any> => {
        return apiClient.get('/consultation/queue', params);
    },

    getRooms: async (deptId?: string): Promise<any> => {
        return apiClient.get('/consultation/rooms', { deptId });
    }
};
