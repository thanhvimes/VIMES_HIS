
import { apiClient } from './apiClient';
import { ClinicalRecord, ICD10, OperationRecord, Prescription } from '../types/clinical';
import { DetailedHistoryRecord } from '../types/clinical'; // Ensure this type exists in types/clinical.ts
import { Patient } from '../types/patient';

export const consultationService = {
    // --- Patient Clinical Profile ---
    getPatientProfile: async (patientId: string): Promise<any> => {
        // Endpoint tổng hợp thông tin lâm sàng của bệnh nhân (Sinh hiệu, dị ứng, tiền sử...)
        return await apiClient.get<any>(`/clinical/patients/${patientId}/summary`);
    },

    // --- Clinical Records (Phiếu khám) ---
    getClinicalRecord: async (patientId: string): Promise<ClinicalRecord> => {
        // Lấy phiếu khám đang mở (active) hoặc tạo mới tạm thời
        return await apiClient.get<ClinicalRecord>(`/clinical/records/active`, { patientId });
    },

    saveClinicalRecord: async (record: ClinicalRecord): Promise<ClinicalRecord> => {
        if (record.id && !record.id.startsWith('REC-')) {
             return await apiClient.put<ClinicalRecord>(`/clinical/records/${record.id}`, record);
        } else {
             return await apiClient.post<ClinicalRecord>('/clinical/records', record);
        }
    },

    // --- Master Data Lookups ---
    searchICD10: async (query: string): Promise<ICD10[]> => {
        return await apiClient.get<ICD10[]>('/master-data/icd10', { q: query });
    },

    // --- Operations (Phẫu thuật/Thủ thuật) ---
    getOperations: async (patientId: string): Promise<OperationRecord[]> => {
        return await apiClient.get<OperationRecord[]>('/clinical/operations', { patientId });
    },

    saveOperation: async (op: OperationRecord): Promise<OperationRecord> => {
        if (op.id) {
            return await apiClient.put<OperationRecord>(`/clinical/operations/${op.id}`, op);
        }
        return await apiClient.post<OperationRecord>('/clinical/operations', op);
    },

    deleteOperation: async (id: string): Promise<boolean> => {
        await apiClient.delete(`/clinical/operations/${id}`);
        return true;
    },
    
    // --- History ---
    getHistoryList: async (filter: { fromDate?: string, toDate?: string, doctor?: string, keyword?: string }): Promise<DetailedHistoryRecord[]> => {
        return await apiClient.get<DetailedHistoryRecord[]>('/clinical/history', filter);
    },
    
    // --- Prescriptions ---
    savePrescription: async (prescription: Prescription): Promise<Prescription> => {
        return await apiClient.post<Prescription>('/clinical/prescriptions', prescription);
    }
};
