
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

// TOGGLE THIS TO FALSE WHEN BACKEND IS READY
const USE_MOCK_API = true;

export const receptionService = {
    // --- Patient Management ---
    getPatientList: async (): Promise<Patient[]> => {
        // 1. Mock Mode (Default for Frontend Demo)
        if (USE_MOCK_API) {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 800));
            return mockPatients;
        }

        // 2. Real API Mode
        try {
            console.log("Calling API: /reception/patients");
            // Gọi API thật từ Backend
            const data = await apiClient.get<any>('/reception/patients');
            
            // Map dữ liệu từ Backend (có thể khác cấu trúc) sang cấu trúc Frontend
            const patientsList = Array.isArray(data) ? data : (data.data || []);
            
            if (patientsList.length === 0) {
                return mockPatients;
            }

            // Map data
            return patientsList.map((item: any) => ({
                id: item.id || item.recordNumber,
                recordNumber: item.recordNumber || item.docno,
                name: item.name || item.patientName,
                dob: item.dob || '01/01/1990',
                age: item.age || 0,
                gender: item.gender || 'Khác',
                ethnicity: 'Kinh', 
                occupation: '',
                address: item.address || '',
                phone: item.phone || '', 
                lastVisit: '',
                patientType: 'Dịch vụ',
                history: [],
                examinationStatus: 'waiting', 
                assignedDoctor: 'BS. Chỉ định'
            }));

        } catch (error) {
            console.error("Lỗi gọi API patients, sử dụng dữ liệu mẫu:", error);
            return mockPatients;
        }
    },

    getPatientByRecordNumber: async (identifier: string): Promise<Patient | null> => {
        if (USE_MOCK_API) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const searchKey = identifier.toString().trim();
            const found = mockPatients.find(p => 
                p.id === searchKey || 
                p.recordNumber === searchKey || 
                p.identityCard === searchKey ||
                (p.phone && p.phone.includes(searchKey))
            );
            return found || null;
        }

        try {
            const data = await apiClient.get<any>(`/reception/patients/${identifier}`);
            return data;
        } catch (error) {
            console.error("Error fetching patient:", error);
            // Fallback to mock search on error
            const searchKey = identifier.toString().trim();
            const found = mockPatients.find(p => 
                p.id === searchKey || 
                p.recordNumber === searchKey || 
                p.identityCard === searchKey ||
                (p.phone && p.phone.includes(searchKey))
            );
            return found || null;
        }
    },

    createPatient: async (patientData: Partial<Patient>): Promise<Patient> => {
        if (USE_MOCK_API) {
            await new Promise(resolve => setTimeout(resolve, 600));
            return { 
                ...patientData, 
                id: `BN${Date.now()}`, 
                recordNumber: `REC${Date.now().toString().slice(-6)}`,
                examinationStatus: 'waiting',
                assignedDoctor: 'BS. Chỉ Định'
            } as Patient;
        }

        try {
            const result = await apiClient.post<Patient>('/reception/patients', patientData);
            return result;
        } catch (e) {
            console.error("API Error creating patient", e);
            throw e;
        }
    },

    updatePatient: async (id: string, patientData: Partial<Patient>): Promise<Patient> => {
         if (USE_MOCK_API) {
             await new Promise(resolve => setTimeout(resolve, 500));
             return { ...patientData, id } as Patient;
         }

         try {
            await apiClient.put<Patient>(`/reception/patients/${id}`, patientData);
            return { ...patientData, id } as Patient;
        } catch (e) {
             return { ...patientData, id } as Patient;
        }
    },

    // --- Queue Management ---
    getQueueStatus: async (counterId: string = 'DEFAULT'): Promise<QueueStatus> => {
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
        await new Promise(resolve => setTimeout(resolve, 400));
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
        await new Promise(resolve => setTimeout(resolve, 200));
        console.log(`Recalling number ${currentNumber} at ${counterId}`);
        return true;
    }
};
