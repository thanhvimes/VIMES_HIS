// ==================== HEALTH CHECK SERVICE ====================
// File: services/healthCheckService.ts

import { apiClient } from './apiClient';

export interface HealthCheckDocument {
    id: string;
    patientId: string;
    patientName: string;
    docNo: string;
    formType: string;
    jsonData: any;
    xmlData: string;
    signature: string | null;
    signatureType: 'USB' | 'HSM';
    signatureStatus: 'Unsigned' | 'Signed';
    sendStatus: 'Unsent' | 'Pending' | 'Success' | 'Error';
    sentAt?: string;
    transactionId?: string;
    errorMessage?: string;
    createdAt: string;
}

export const healthCheckService = {
    getDocumentsList: async (filters?: { startDate?: string; endDate?: string; barcodePrinted?: string }): Promise<HealthCheckDocument[]> => {
        try {
            const params = new URLSearchParams();
            if (filters) {
                if (filters.startDate) params.append('startDate', filters.startDate);
                if (filters.endDate) params.append('endDate', filters.endDate);
                if (filters.barcodePrinted) params.append('barcodePrinted', filters.barcodePrinted);
            }
            const queryStr = params.toString() ? `?${params.toString()}` : '';
            return await apiClient.get<HealthCheckDocument[]>(`/health-check-sync/documents${queryStr}`);
        } catch (error) {
            console.error("Failed to fetch health check documents:", error);
            throw error;
        }
    },

    markBarcodePrinted: async (docIds: string[]): Promise<boolean> => {
        try {
            await apiClient.post('/health-check-sync/documents/mark-printed', { docIds });
            return true;
        } catch (error) {
            console.error("Error marking barcode printed:", error);
            throw error;
        }
    },

    signDocuments: async (
        docIds: string[], 
        signatureType: 'USB' | 'HSM', 
        signatures?: Record<string, string>
    ): Promise<boolean> => {
        try {
            await apiClient.post('/health-check-sync/documents/sign', { 
                docIds, 
                signatureType, 
                signatures 
            });
            return true;
        } catch (error) {
            console.error("Error signing health check documents:", error);
            throw error;
        }
    },

    sendDocumentsToPortal: async (docIds: string[]): Promise<string[]> => {
        try {
            return await apiClient.post<string[]>('/health-check-sync/documents/send', { docIds });
        } catch (error) {
            console.error("Error sending health check documents:", error);
            throw error;
        }
    },

    seedFromHis: async (filters?: { startDate?: string; endDate?: string; workplaceId?: string }): Promise<{ success: boolean; count: number; message: string }> => {
        try {
            return await apiClient.post<{ success: boolean; count: number; message: string }>('/health-check-sync/documents/seed-from-his', filters || {});
        } catch (error) {
            console.error("Error seeding documents from HIS:", error);
            throw error;
        }
    },

    createDocument: async (payload: any): Promise<{ success: boolean; id: number }> => {
        try {
            return await apiClient.post<{ success: boolean; id: number }>('/health-check-sync/documents', payload);
        } catch (error) {
            console.error("Error creating health check document:", error);
            throw error;
        }
    },

    updateDocument: async (id: string, payload: any): Promise<{ success: boolean }> => {
        try {
            return await apiClient.put<{ success: boolean }>(`/health-check-sync/documents/${id}`, payload);
        } catch (error) {
            console.error("Error updating health check document:", error);
            throw error;
        }
    },

    deleteDocument: async (id: string): Promise<{ success: boolean }> => {
        try {
            return await apiClient.delete<{ success: boolean }>(`/health-check-sync/documents/${id}`);
        } catch (error) {
            console.error("Error deleting health check document:", error);
            throw error;
        }
    },

    getHisPatient: async (identifier: string): Promise<any> => {
        try {
            return await apiClient.get<any>(`/health-check-sync/his-patient/${identifier}`);
        } catch (error) {
            console.error("Error fetching HIS patient data:", error);
            throw error;
        }
    },

    getContracts: async (): Promise<any[]> => {
        try {
            return await apiClient.get<any[]>('/health-check-sync/contracts');
        } catch (error) {
            console.error("Failed to fetch health check contracts:", error);
            throw error;
        }
    },

    getSettings: async (): Promise<any> => {
        try {
            return await apiClient.get<any>('/health-check-sync/settings');
        } catch (error) {
            console.error("Error fetching health check settings:", error);
            throw error;
        }
    },

    updateSettings: async (payload: any): Promise<{ success: boolean }> => {
        try {
            return await apiClient.put<{ success: boolean }>('/health-check-sync/settings', payload);
        } catch (error) {
            console.error("Error updating health check settings:", error);
            throw error;
        }
    },

    testConnection: async (payload: any): Promise<{ success: boolean; message: string }> => {
        try {
            return await apiClient.post<{ success: boolean; message: string }>('/health-check-sync/settings/test-connection', payload);
        } catch (error) {
            console.error("Error testing health check connection:", error);
            throw error;
        }
    }
};
