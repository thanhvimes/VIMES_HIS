
import { Patient } from '../types/patient';
import { mockPatients } from '../modules/reception/data';

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
    getPatientList: async (params?: { page?: number, limit?: number, search?: string }): Promise<Patient[]> => {
        try {
            // Simulated API call
            await new Promise(resolve => setTimeout(resolve, 300));
            
            let data = mockPatients;
            if (params?.search) {
                const lowerSearch = params.search.toLowerCase();
                data = data.filter(p => p.name.toLowerCase().includes(lowerSearch) || p.recordNumber.includes(lowerSearch));
            }
            return data;
        } catch (error) {
            console.warn("API Error (getPatientList), falling back to mock data");
            return mockPatients;
        }
    },

    getPatientByRecordNumber: async (identifier: string): Promise<Patient | null> => {
        try {
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
            return null;
        }
    },

    createPatient: async (patientData: Partial<Patient>): Promise<Patient> => {
        // Mock creation
        return { ...patientData, id: `P${Date.now()}`, recordNumber: `REC${Date.now()}` } as Patient;
    },

    updatePatient: async (id: string, patientData: Partial<Patient>): Promise<Patient> => {
        // Mock update
        return { ...patientData, id } as Patient;
    },

    // --- Appointments ---
    getAppointments: async (date: string, doctorId?: string): Promise<any[]> => {
        return [];
    },

    createAppointment: async (data: any): Promise<any> => {
        return { ...data, id: `A${Date.now()}` };
    },
    
    // --- Queue Management ---
    getQueueStatus: async (counterId: string = 'DEFAULT'): Promise<QueueStatus> => {
        await new Promise(resolve => setTimeout(resolve, 200));
        // Return mock status
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
        // Simulate moving to next
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
        return true;
    }
};
