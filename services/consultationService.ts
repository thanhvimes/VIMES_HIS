
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

// --- SERVICE IMPLEMENTATION ---

export const consultationService = {
    // --- Patient Clinical Profile ---
    getPatientProfile: async (patientId: string): Promise<any> => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 600));

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
    },

    // --- Clinical Records (Phiếu khám) ---
    getClinicalRecord: async (patientId: string): Promise<ClinicalRecord> => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return { ...mockClinicalRecord, patientId };
    },

    saveClinicalRecord: async (record: ClinicalRecord): Promise<ClinicalRecord> => {
        await new Promise(resolve => setTimeout(resolve, 800));
        console.log("Saved Clinical Record:", record);
        return { ...record, id: record.id || `REC-${Date.now()}` };
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
    getOperations: async (patientId: string): Promise<OperationRecord[]> => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return mockOperations;
    },

    saveOperation: async (op: OperationRecord): Promise<OperationRecord> => {
        await new Promise(resolve => setTimeout(resolve, 800));
        console.log("Saved Operation:", op);
        return { ...op, id: op.id || `OP-${Date.now()}` };
    },

    deleteOperation: async (id: string): Promise<boolean> => {
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log("Deleted Operation:", id);
        return true;
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
    savePrescription: async (prescription: Prescription): Promise<Prescription> => {
        await new Promise(resolve => setTimeout(resolve, 800));
        console.log("Saved Prescription:", prescription);
        return prescription;
    }
};
