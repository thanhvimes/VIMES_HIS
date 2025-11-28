
import { apiClient } from './apiClient';
import { LabAppointment } from '../types/patient';
// Import types for Lab/Imaging Results appropriately
import { ServiceRequest } from '../modules/consultation/views/tabs/LabView'; 

export const labService = {
    // --- Lab Schedules ---
    getAppointments: async (date: string): Promise<LabAppointment[]> => {
        return await apiClient.get<LabAppointment[]>('/lab/appointments', { date });
    },

    // --- Worklists (Chỉ định) ---
    getWorklist: async (type: 'LAB' | 'IMAGING', status?: string, date?: string): Promise<ServiceRequest[]> => {
        return await apiClient.get<ServiceRequest[]>('/lab/worklist', { type, status, date });
    },

    // --- Results ---
    getResultDetail: async (requestId: string): Promise<ServiceRequest> => {
        return await apiClient.get<ServiceRequest>(`/lab/results/${requestId}`);
    },

    updateResult: async (requestId: string, data: any): Promise<boolean> => {
        await apiClient.put(`/lab/results/${requestId}`, data);
        return true;
    },

    approveResult: async (requestId: string): Promise<boolean> => {
        await apiClient.post(`/lab/results/${requestId}/approve`, {});
        return true;
    },
    
    // --- Dictionary (Danh mục) ---
    getTestCatalog: async () => {
        return await apiClient.get('/lab/catalog');
    }
};
