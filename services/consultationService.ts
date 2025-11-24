
import { ClinicalRecord, ICD10, OperationRecord, Patient } from '../types';
import { mockPatients } from '../modules/reception/data';

// Mock ICD10 Data
export const mockICD10List: ICD10[] = [
    { code: 'E11', name: 'Bệnh đái tháo đường không phụ thuộc insuline' },
    { code: 'I10', name: 'Bệnh tăng huyết áp vô căn (nguyên phát)' },
    { code: 'J00', name: 'Viêm mũi họng cấp tính [Cảm lạnh]' },
    { code: 'J06', name: 'Nhiễm trùng đường hô hấp trên cấp tính ở nhiều vị trí và vị trí không xác định' },
    { code: 'K29', name: 'Viêm dạ dày và tá tràng' },
    { code: 'R51', name: 'Đau đầu' },
];

// Mock Initial Record
const initialRecord: ClinicalRecord = {
    id: 'REC-' + Date.now(),
    patientId: 'P003',
    examDate: new Date().toISOString(),
    doctorName: 'Dr. Minh',
    history: '',
    clinicalExam: '',
    initialDiagnosis: '',
    mainDisease: undefined,
    subDiseases: [],
    conclusion: '',
    treatmentPlan: ''
};

// Mock Operation Data
const mockOperations: OperationRecord[] = [
    {
        id: 'PT001',
        serviceName: 'Phẫu thuật nội soi dạ dày',
        requestDate: '01/11/2023',
        type: 'PT',
        operationType: 'Cắt bỏ khối u dạ dày',
        operationDate: '2023-11-02',
        room: 'Phòng mổ số 3',
        startTime: '08:00',
        endTime: '11:30',
        mainSurgeon: 'BS. Nguyễn Văn A',
        assistantSurgeons: 'BS. Trần Thị B\nBS. Lê Văn C',
        anesthesiologist: 'BS. Phạm Văn D',
        nurses: 'ĐD. Nguyễn Thị E\nĐD. Trần Văn F',
        technicians: 'KTV. Lê Thị G',
        method: 'Phẫu thuật nội soi với gây mê toàn thân',
        steps: '1. Gây mê toàn thân\n2. Đặt nội khí quản\n3. Tiến hành nội soi và cắt bỏ khối u\n4. Kiểm tra và khâu vết mổ',
        instruments: '- Nội soi dạ dày\n- Kéo phẫu thuật\n- Kim khâu\n- Máy hút dịch',
        medications: '- Propofol\n- Fentanyl\n- Rocuronium',
        images: [
            'https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80'
        ]
    },
    {
        id: 'TT002',
        serviceName: 'Thủ thuật đặt stent mạch vành',
        requestDate: '03/11/2023',
        type: 'TT',
        operationType: 'Can thiệp mạch vành',
        operationDate: '2023-11-03',
        room: 'Phòng Can thiệp tim mạch',
        startTime: '14:00',
        endTime: '15:30',
        mainSurgeon: 'BS. Võ Văn Tim',
        assistantSurgeons: '',
        anesthesiologist: '',
        nurses: 'ĐD. Mạch Văn Máu',
        technicians: '',
        method: 'Nong mạch và đặt stent',
        steps: '1. Gây tê tại chỗ\n2. Luồn ống thông\n3. Nong mạch\n4. Đặt stent',
        instruments: 'Stent phủ thuốc',
        medications: 'Heparin, Aspirin',
        images: [
            'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=80'
        ]
    }
];

// Simulate API Latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const consultationService = {
    // Get comprehensive patient profile including demographics and mock clinical summary
    getPatientProfile: async (patientId: string) => {
        await delay(600);
        const basicInfo = mockPatients.find(p => p.id === patientId);
        
        if (!basicInfo) return null;

        // Merge with some mock clinical data for the record view
        return {
            ...basicInfo,
            hasInsurance: basicInfo.patientType === 'Bảo hiểm',
            insuranceNumber: basicInfo.patientType === 'Bảo hiểm' ? 'GD4790215567890' : undefined,
            insuranceRegDate: '01/01/2023',
            insuranceExpDate: '31/12/2023',
            insuranceStatus: 'valid', 
            diagnosis: basicInfo.history && basicInfo.history.length > 0 ? basicInfo.history[0].diagnosis : 'Chưa có chẩn đoán',
            vitalSigns: {
                height: 170,
                weight: 65,
                bmi: 22.5,
                bpSys: 120,
                bpDia: 80,
                heartRate: 75,
                respRate: 18,
                temp: 36.5,
                spO2: 98
            },
            bpHistory: [
                { date: '08:00', systolic: 118, diastolic: 78 },
                { date: '12:00', systolic: 122, diastolic: 82 },
                { date: '16:00', systolic: 120, diastolic: 80 },
            ]
        };
    },

    getClinicalRecord: async (patientId: string): Promise<ClinicalRecord> => {
        await delay(800); // Simulate network delay
        // In a real app, fetch by patientId
        return { ...initialRecord, patientId };
    },

    saveClinicalRecord: async (record: ClinicalRecord): Promise<ClinicalRecord> => {
        await delay(1500); // Simulate saving delay
        console.log("Saved Record to DB:", record);
        return record;
    },

    searchICD10: async (query: string): Promise<ICD10[]> => {
        await delay(300);
        if (!query) return [];
        return mockICD10List.filter(item => 
            item.code.toLowerCase().includes(query.toLowerCase()) || 
            item.name.toLowerCase().includes(query.toLowerCase())
        );
    },

    // --- OPERATION APIs ---
    getOperations: async (patientId: string): Promise<OperationRecord[]> => {
        await delay(600);
        return [...mockOperations]; // Return mock data
    },

    saveOperation: async (op: OperationRecord): Promise<OperationRecord> => {
        await delay(1000);
        return op;
    },

    deleteOperation: async (id: string): Promise<boolean> => {
        await delay(500);
        return true;
    }
};
