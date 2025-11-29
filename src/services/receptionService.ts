
import { Patient } from '../types/patient';
import { mockPatients } from '../modules/reception/data';
import { apiClient } from './apiClient';

// API Response Interface Mapping
export interface ApiPatientResponse {
    ticketNumber: string;
    recordNumber: string;
    name: string;
    age: string; 
    sex: string;
    priority: string;
    examinationDate: string;
    endDate: string | null;
    status: string;
    diagnostic: string;
    suggestion: string | null;
}

export interface QueueStatus {
    id: string;
    name: string;
    currentNumber: number;
    currentPatientName: string;
    nextNumber: number;
    nextPatientName: string;
    waitingCount: number;
}

export const receptionService = {
    // --- Patient Management ---
    getPatientList: async (): Promise<Patient[]> => {
        try {
            // Uncomment below to use real API
            /*
            const data = await apiClient.get<ApiPatientResponse[]>('/patients');
            return data.map((item) => ({
                id: item.recordNumber,
                recordNumber: item.recordNumber,
                name: item.name,
                dob: '',
                age: parseInt(item.age) || 0,
                gender: item.sex as 'Nam' | 'Nữ' | 'Khác',
                ethnicity: 'Kinh', 
                occupation: '',
                address: '',
                phone: '', 
                lastVisit: item.examinationDate ? new Date(item.examinationDate).toLocaleDateString('vi-VN') : '',
                patientType: item.priority === 'Dịch vụ' ? 'Dịch vụ' : 'Bảo hiểm',
                history: []
            }));
            */
            
            // Fallback to mock data
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(mockPatients);
                }, 500); 
            });

        } catch (error) {
            console.warn("API Error, using mock data.", error);
            return mockPatients;
        }
    },

    getPatientByRecordNumber: async (identifier: string): Promise<Patient | null> => {
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 300));
            
            const searchKey = identifier.toString().trim();
            const found = mockPatients.find(p => 
                p.id === searchKey || 
                p.recordNumber === searchKey || 
                p.identityCard === searchKey ||
                (p.phone && p.phone.includes(searchKey))
            );

            return found || null;
        } catch (error) {
            console.error("Error fetching patient:", error);
            return null;
        }
    },

    createPatient: async (patientData: Partial<Patient>): Promise<Patient> => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        console.log("API Call: Create Patient", patientData);
        
        const newPatient = { 
            ...patientData, 
            id: `BN${Date.now()}`, 
            recordNumber: `REC${Date.now().toString().slice(-6)}` 
        } as Patient;

        // In a real app, you'd add this to the list or refetch
        // mockPatients.push(newPatient); 
        
        return newPatient;
    },

    updatePatient: async (id: string, patientData: Partial<Patient>): Promise<Patient> => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 600));
        console.log(`API Call: Update Patient ${id}`, patientData);
        return { ...patientData, id } as Patient;
    },

    // --- Queue Management ---
    getQueueStatus: async (counterId: string = 'DEFAULT'): Promise<QueueStatus> => {
        // In real app, fetch from `/queue/status/${counterId}`
        await new Promise(resolve => setTimeout(resolve, 200));
        return {
            id: counterId,
            name: 'Quầy Tiếp nhận 01',
            currentNumber: 105,
            currentPatientName: 'Nguyễn Thị Mơ',
            nextNumber: 106,
            nextPatientName: 'Trần Văn B',
            waitingCount: 12
        };
    },
    
    callNextPatient: async (counterId: string): Promise<QueueStatus> => {
        // In real app, POST to `/queue/next`
        await new Promise(resolve => setTimeout(resolve, 400));
        // Mock shifting queue
        return {
            id: counterId,
            name: 'Quầy Tiếp nhận 01',
            currentNumber: 106,
            currentPatientName: 'Trần Văn B',
            nextNumber: 107,
            nextPatientName: 'Lê Thị C',
            waitingCount: 11
        };
    },

    recallPatient: async (counterId: string, currentNumber: number): Promise<boolean> => {
        // In real app, POST to `/queue/recall`
        await new Promise(resolve => setTimeout(resolve, 200));
        console.log(`Recalling number ${currentNumber} at ${counterId}`);
        return true;
    }
};
