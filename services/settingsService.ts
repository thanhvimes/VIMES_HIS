// ==========================================
// SETTINGS SERVICE (Frontend)
// ==========================================
// API client for settings management

import { apiClient } from './apiClient';

export interface Setting {
    key: string;
    value: any;
    type: 'string' | 'number' | 'boolean' | 'json';
    category: string;
    description?: string;
    isSystem?: boolean;
    updatedBy?: string;
    updatedAt?: string;
}

export interface CompanyInfo {
    id: string;
    hospitalName: string;
    parentOrg: string;
    address: string;
    phone: string;
    email: string;
    website: string;
}

export const settingsService = {
    /**
     * Get all settings
     */
    async getAllSettings(): Promise<Setting[]> {
        const data = await apiClient.get<{ success: boolean; data: Setting[] }>('/settings');
        return data.data;
    },

    /**
     * Get settings by category
     */
    async getSettingsByCategory(category: string): Promise<Setting[]> {
        const data = await apiClient.get<{ success: boolean; data: Setting[] }>(`/settings/category/${category}`);
        return data.data;
    },

    /**
     * Get hospital info directly from SYS_COMPANY table
     */
    async getCompanyInfo(): Promise<CompanyInfo> {
        const data = await apiClient.get<{ success: boolean; data: CompanyInfo }>('/settings/company-info');
        return data.data;
    },

    /**
     * Get single setting
     */
    async getSetting(key: string): Promise<Setting> {
        const data = await apiClient.get<{ success: boolean; data: Setting }>(`/settings/${key}`);
        return data.data;
    },

    /**
     * Update single setting
     */
    async updateSetting(key: string, value: any): Promise<Setting> {
        const data = await apiClient.put<{ success: boolean; data: Setting }>(`/settings/${key}`, { value });
        return data.data;
    },

    /**
     * Update multiple settings
     */
    async updateMultipleSettings(settings: Array<{ key: string; value: any }>): Promise<void> {
        await apiClient.put<any>('/settings/bulk/update', { settings });
    },

    /**
     * Reset to defaults
     */
    async resetToDefaults(category?: string): Promise<void> {
        await apiClient.post<any>('/settings/reset', { category });
    },

    /**
     * Clear cache
     */
    async clearCache(): Promise<void> {
        await apiClient.post<any>('/settings/cache/clear', {});
    },
};
