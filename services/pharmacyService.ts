
import { apiClient } from './apiClient';
import { DrugItem, DrugInteraction, ConsumableUsage } from '../types/finance';

export interface InventoryItem extends DrugItem {
    batchNumber: string;
    expiryDate: string;
    stock: number;
    minStock: number;
    supplier: string;
}

export const pharmacyService = {
    // --- Inventory ---
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

    // --- Interactions ---
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
    
    // --- Consumables ---
    saveConsumableUsage: async (usage: ConsumableUsage[]): Promise<boolean> => {
        await apiClient.post('/pharmacy/consumables/usage', { items: usage });
        return true;
    }
};
