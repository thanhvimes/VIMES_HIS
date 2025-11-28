
import { apiClient } from './apiClient';
import { Patient, Appointment } from '../types/patient';
import { mockPatients } from '../modules/reception/data'; // Fallback mock

export const receptionService = {
    // --- Patients ---
    getPatientList: async (params?: { page?: number, limit?: number, search?: string }): Promise<Patient[]> => {
        try {
            return await apiClient.get<Patient[]>('/patients', params);
        } catch (error) {
            console.warn("API Error (getPatientList), falling back to mock data");
            let data = mockPatients;
            if (params?.search) {
                const lowerSearch = params.search.toLowerCase();
                data = data.filter(p => p.name.toLowerCase().includes(lowerSearch) || p.recordNumber.includes(lowerSearch));
            }
            return data;
        }
    },

    getPatientByRecordNumber: async (identifier: string): Promise<Patient | null> => {
        try {
            return await apiClient.get<Patient>(`/patients/lookup/${identifier}`);
        } catch (error) {
            console.warn(`API Error (getPatientByRecordNumber) for ${identifier}, falling back to mock data`);
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
        try {
            return await apiClient.post<Patient>('/patients', patientData);
        } catch {
            return { ...patientData, id: `P${Date.now()}`, recordNumber: `REC${Date.now()}` } as Patient;
        }
    },

    updatePatient: async (id: string, patientData: Partial<Patient>): Promise<Patient> => {
        try {
            return await apiClient.put<Patient>(`/patients/${id}`, patientData);
        } catch {
            return { ...patientData, id } as Patient;
        }
    },

    // --- Appointments ---
    getAppointments: async (date: string, doctorId?: string): Promise<Appointment[]> => {
        try {
            return await apiClient.get<Appointment[]>('/appointments', { date, doctorId });
        } catch {
            return [];
        }
    },

    createAppointment: async (data: Partial<Appointment>): Promise<Appointment> => {
        try {
            return await apiClient.post<Appointment>('/appointments', data);
        } catch {
            return { ...data, id: `A${Date.now()}` } as Appointment;
        }
    },
    
    // --- Queue ---
    getQueues: async () => {
        try {
            return await apiClient.get('/queues/status');
        } catch {
            return [];
        }
    },
    
    callNextPatient: async (queueId: string) => {
        try {
            return await apiClient.post(`/queues/${queueId}/next`, {});
        } catch {
            return { success: true };
        }
    }
};
