
import { apiClient } from './apiClient';
import { Patient, Appointment } from '../types/patient';
import { mockPatients } from '../modules/reception/data'; // Fallback mock

export const receptionService = {
    // --- Patients ---
    getPatientList: async (params?: { page?: number, limit?: number, search?: string }): Promise<Patient[]> => {
        try {
            // Gọi API thực
            return await apiClient.get<Patient[]>('/patients', params);
        } catch (error) {
            console.warn("API Error, falling back to mock data", error);
            return mockPatients;
        }
    },

    getPatientByRecordNumber: async (identifier: string): Promise<Patient | null> => {
        try {
            return await apiClient.get<Patient>(`/patients/lookup/${identifier}`);
        } catch (error) {
            // Fallback logic
            const found = mockPatients.find(p => 
                p.id === identifier || 
                p.recordNumber === identifier || 
                p.identityCard === identifier
            );
            return found || null;
        }
    },

    createPatient: async (patientData: Partial<Patient>): Promise<Patient> => {
        return await apiClient.post<Patient>('/patients', patientData);
    },

    updatePatient: async (id: string, patientData: Partial<Patient>): Promise<Patient> => {
        return await apiClient.put<Patient>(`/patients/${id}`, patientData);
    },

    // --- Appointments ---
    getAppointments: async (date: string, doctorId?: string): Promise<Appointment[]> => {
        return await apiClient.get<Appointment[]>('/appointments', { date, doctorId });
    },

    createAppointment: async (data: Partial<Appointment>): Promise<Appointment> => {
        return await apiClient.post<Appointment>('/appointments', data);
    },
    
    // --- Queue ---
    getQueues: async () => {
        return await apiClient.get('/queues/status');
    },
    
    callNextPatient: async (queueId: string) => {
        return await apiClient.post(`/queues/${queueId}/next`, {});
    }
};
