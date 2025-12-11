
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
            console.log("Calling API: /reception/patients");
            // Gọi API thật từ Backend
            const data = await apiClient.get<any>('/reception/patients');
            
            // Map dữ liệu từ Backend (có thể khác cấu trúc) sang cấu trúc Frontend
            // Dựa trên controller backend bạn cung cấp, backend trả về JSON mảng trực tiếp hoặc { data: [] }
            const patientsList = Array.isArray(data) ? data : (data.data || []);
            
            // Nếu Backend trả về rỗng (do chưa có data), fallback về mock để demo không bị trắng trang
            if (patientsList.length === 0) {
                console.warn("API returned empty list, using mock data for demo.");
                return mockPatients;
            }

            // Map data (Tùy chỉnh mapping này nếu cấu trúc trả về từ DB khác)
            return patientsList.map((item: any) => ({
                id: item.id || item.recordNumber,
                recordNumber: item.recordNumber || item.docno, // Fallback if naming differs
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
        try {
            // Simulate API call for detail (Can switch to real API later)
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
        try {
            // Gọi API thật
            const result = await apiClient.post<Patient>('/reception/patients', patientData);
            return result;
        } catch (e) {
            console.error("API Error creating patient", e);
            // Fallback mock
            const newPatient = { 
                ...patientData, 
                id: `BN${Date.now()}`, 
                recordNumber: `REC${Date.now().toString().slice(-6)}`,
                examinationStatus: 'waiting',
                assignedDoctor: 'BS. Chỉ Định'
            } as Patient;
            return newPatient;
        }
    },

    updatePatient: async (id: string, patientData: Partial<Patient>): Promise<Patient> => {
         try {
            await apiClient.put<Patient>(`/reception/patients/${id}`, patientData);
            return { ...patientData, id } as Patient;
        } catch (e) {
             return { ...patientData, id } as Patient;
        }
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
