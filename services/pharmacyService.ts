
import { apiClient } from './apiClient';
import { DrugItem, DrugInteraction, ConsumableUsage, MiscPharmacyVoucher, PharmacyReplenishment, PharmacyReturn } from '../types/finance';

export interface InventoryItem extends DrugItem {
    batchNumber: string;
    expiryDate: string;
    stock: number;
    minStock: number;
    supplier: string;
}

export const pharmacyService = {
    // --- Inventory (Tồn kho) ---
    getInventory: async (params?: { search?: string, status?: string }): Promise<InventoryItem[]> => {
        return await apiClient.get<InventoryItem[]>('/pharmacy/inventory', params);
    },

    importStock: async (data: any): Promise<boolean> => {
        await apiClient.post('/pharmacy/import', data);
        return true;
    },
    
    exportStock: async (data: any): Promise<boolean> => {
        await apiClient.post('/pharmacy/export', data);
        return true;
    },

    // --- Misc Vouchers (Nhập xuất khác) ---
    getMiscVoucher: async (id: string): Promise<MiscPharmacyVoucher> => {
        return await apiClient.get<MiscPharmacyVoucher>(`/pharmacy/misc-vouchers/${id}`);
    },
    
    saveMiscVoucher: async (data: Partial<MiscPharmacyVoucher>): Promise<MiscPharmacyVoucher> => {
        // Nếu có ID và không phải ID tạm thời (NEW-...) thì là Update
        if (data.id && !data.id.toString().startsWith('NEW-')) {
            return await apiClient.put<MiscPharmacyVoucher>(`/pharmacy/misc-vouchers/${data.id}`, data);
        }
        // Ngược lại là Create
        return await apiClient.post<MiscPharmacyVoucher>('/pharmacy/misc-vouchers', data);
    },
    
    deleteMiscVoucher: async (id: string): Promise<boolean> => {
        await apiClient.delete(`/pharmacy/misc-vouchers/${id}`);
        return true;
    },

    // --- Replenishments (Bổ sung tủ trực) ---
    getReplenishment: async (id: string): Promise<PharmacyReplenishment> => {
        return await apiClient.get<PharmacyReplenishment>(`/pharmacy/replenishments/${id}`);
    },
    
    saveReplenishment: async (data: Partial<PharmacyReplenishment>): Promise<PharmacyReplenishment> => {
        if (data.id && !data.id.toString().startsWith('NEW-')) {
            return await apiClient.put<PharmacyReplenishment>(`/pharmacy/replenishments/${data.id}`, data);
        }
        return await apiClient.post<PharmacyReplenishment>('/pharmacy/replenishments', data);
    },
    
    deleteReplenishment: async (id: string): Promise<boolean> => {
        await apiClient.delete(`/pharmacy/replenishments/${id}`);
        return true;
    },

    // --- Returns (Phiếu hoàn trả) ---
    getReturn: async (id: string): Promise<PharmacyReturn> => {
        return await apiClient.get<PharmacyReturn>(`/pharmacy/returns/${id}`);
    },
    
    saveReturn: async (data: Partial<PharmacyReturn>): Promise<PharmacyReturn> => {
        if (data.id && !data.id.toString().startsWith('NEW-')) {
            return await apiClient.put<PharmacyReturn>(`/pharmacy/returns/${data.id}`, data);
        }
        return await apiClient.post<PharmacyReturn>('/pharmacy/returns', data);
    },
    
    deleteReturn: async (id: string): Promise<boolean> => {
        await apiClient.delete(`/pharmacy/returns/${id}`);
        return true;
    },

    // --- Cảnh báo an toàn & Tiêu hao ---
    getDrugInteractions: async (): Promise<DrugInteraction[]> => {
        return await apiClient.get<DrugInteraction[]>('/pharmacy/interactions');
    },

    saveInteraction: async (data: DrugInteraction): Promise<DrugInteraction> => {
        if (data.id && !data.id.startsWith('INT-')) {
             return await apiClient.put<DrugInteraction>(`/pharmacy/interactions/${data.id}`, data);
        }
        return await apiClient.post<DrugInteraction>('/pharmacy/interactions', data);
    },
    
    deleteInteraction: async (id: string): Promise<boolean> => {
        await apiClient.delete(`/pharmacy/interactions/${id}`);
        return true;
    },
    
    saveConsumableUsage: async (usage: ConsumableUsage[]): Promise<boolean> => {
        await apiClient.post('/pharmacy/consumables/usage', { items: usage });
        return true;
    }
};
