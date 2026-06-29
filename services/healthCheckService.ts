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

    getContracts: async (filters?: { startDate?: string; endDate?: string }): Promise<any[]> => {
        try {
            const params = new URLSearchParams();
            if (filters) {
                if (filters.startDate) params.append('startDate', filters.startDate);
                if (filters.endDate) params.append('endDate', filters.endDate);
            }
            const queryStr = params.toString() ? `?${params.toString()}` : '';
            return await apiClient.get<any[]>(`/health-check-sync/contracts${queryStr}`);
        } catch (error) {
            console.error("Failed to fetch health check contracts:", error);
            throw error;
        }
    },

    createContract: async (payload: any): Promise<{ success: boolean; id: number }> => {
        try {
            return await apiClient.post<{ success: boolean; id: number }>('/health-check-sync/contracts', payload);
        } catch (error) {
            console.error("Error creating health check contract:", error);
            throw error;
        }
    },

    updateContract: async (id: string | number, payload: any): Promise<{ success: boolean }> => {
        try {
            return await apiClient.put<{ success: boolean }>(`/health-check-sync/contracts/${id}`, payload);
        } catch (error) {
            console.error("Error updating health check contract:", error);
            throw error;
        }
    },

    updateContractStatus: async (id: string | number, status: string): Promise<{ success: boolean }> => {
        try {
            return await apiClient.put<{ success: boolean }>(`/health-check-sync/contracts/${id}/status`, { status });
        } catch (error) {
            console.error("Error updating health check contract status:", error);
            throw error;
        }
    },

    deleteContract: async (id: string | number): Promise<{ success: boolean; message?: string }> => {
        try {
            return await apiClient.delete<{ success: boolean; message?: string }>(`/health-check-sync/contracts/${id}`);
        } catch (error) {
            console.error("Error deleting health check contract:", error);
            throw error;
        }
    },

    getContractEmployees: async (id: string | number): Promise<any[]> => {
        try {
            return await apiClient.get<any[]>(`/health-check-sync/contracts/${id}/employees`);
        } catch (error) {
            console.error("Error fetching health check contract employees:", error);
            throw error;
        }
    },

    importEmployees: async (id: string | number, employees: any[]): Promise<{ success: boolean; count: number }> => {
        try {
            return await apiClient.post<{ success: boolean; count: number }>(`/health-check-sync/contracts/${id}/employees/import`, { employees });
        } catch (error) {
            console.error("Error importing health check contract employees:", error);
            throw error;
        }
    },

    getContractServices: async (id: string | number): Promise<any[]> => {
        try {
            return await apiClient.get<any[]>(`/health-check-sync/contracts/${id}/services`);
        } catch (error) {
            console.error("Error fetching contract services:", error);
            throw error;
        }
    },

    addContractServices: async (id: string | number, services: any[]): Promise<{ success: boolean }> => {
        try {
            return await apiClient.post<{ success: boolean }>(`/health-check-sync/contracts/${id}/services`, { services });
        } catch (error) {
            console.error("Error adding contract services:", error);
            throw error;
        }
    },

    deleteContractService: async (id: string | number, serviceId: number): Promise<{ success: boolean }> => {
        try {
            return await apiClient.delete<{ success: boolean }>(`/health-check-sync/contracts/${id}/services/${serviceId}`);
        } catch (error) {
            console.error("Error deleting contract service:", error);
            throw error;
        }
    },

    getServiceGroups: async (): Promise<any[]> => {
        try {
            return await apiClient.get<any[]>('/health-check-sync/service-groups');
        } catch (error) {
            console.error("Error fetching service groups:", error);
            throw error;
        }
    },

    getServicesByGroup: async (groupId: string): Promise<any[]> => {
        try {
            return await apiClient.get<any[]>(`/health-check-sync/service-groups/${groupId}/services`);
        } catch (error) {
            console.error("Error fetching services by group:", error);
            throw error;
        }
    },

    searchAvailableServices: async (queryStr: string): Promise<any[]> => {
        try {
            return await apiClient.get<any[]>(`/health-check-sync/services/search?queryStr=${encodeURIComponent(queryStr)}`);
        } catch (error) {
            console.error("Error searching services:", error);
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
    },

    searchEmployeeByCard: async (queryStr: string, contractId?: string | number): Promise<any[]> => {
        try {
            const contractParam = contractId ? `&contractId=${contractId}` : '';
            return await apiClient.get<any[]>(`/health-check-sync/reception/search?queryStr=${encodeURIComponent(queryStr)}${contractParam}`);
        } catch (error) {
            console.error("Error searching employee by card:", error);
            throw error;
        }
    },

    receiveContractEmployee: async (employeeId: number, roomId?: number): Promise<{ success: boolean; message: string; docNo: string; patientNo: string; services: any[] }> => {
        try {
            return await apiClient.post<{ success: boolean; message: string; docNo: string; patientNo: string; services: any[] }>('/health-check-sync/reception/receive', { employeeId, roomId });
        } catch (error) {
            console.error("Error receiving contract employee:", error);
            throw error;
        }
    },

    getReceptionRooms: async (): Promise<any[]> => {
        try {
            return await apiClient.get<any[]>('/health-check-sync/reception/rooms');
        } catch (error) {
            console.error("Error fetching reception rooms:", error);
            throw error;
        }
    },

    getExamFees: async (): Promise<any[]> => {
        try {
            return await apiClient.get<any[]>('/health-check-sync/reception/exam-fees');
        } catch (error) {
            console.error("Error fetching exam fees list:", error);
            throw error;
        }
    },

    updateEmployee: async (id: number, payload: any): Promise<{ success: boolean; message: string }> => {
        try {
            return await apiClient.put<{ success: boolean; message: string }>(`/health-check-sync/reception/employee/${id}`, payload);
        } catch (error) {
            console.error("Error updating employee info:", error);
            throw error;
        }
    }
};
