
import { ClinicalRecord, ICD10 } from '../types';

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

// Simulate API Latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const consultationService = {
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
    }
};
