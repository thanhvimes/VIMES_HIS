// ==========================================
// SETTINGS SERVICE (Frontend)
// ==========================================
// API client for settings management

const API_BASE = '/api/v1/settings';

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

export const settingsService = {
    /**
     * Get all settings
     */
    async getAllSettings(): Promise<Setting[]> {
        const response = await fetch(API_BASE);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch settings');
        }

        return data.data;
    },

    /**
     * Get settings by category
     */
    async getSettingsByCategory(category: string): Promise<Setting[]> {
        const response = await fetch(`${API_BASE}/category/${category}`);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch settings');
        }

        return data.data;
    },

    /**
     * Get single setting
     */
    async getSetting(key: string): Promise<Setting> {
        const response = await fetch(`${API_BASE}/${key}`);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch setting');
        }

        return data.data;
    },

    /**
     * Update single setting
     */
    async updateSetting(key: string, value: any): Promise<Setting> {
        const response = await fetch(`${API_BASE}/${key}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ value }),
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to update setting');
        }

        return data.data;
    },

    /**
     * Update multiple settings
     */
    async updateMultipleSettings(settings: Array<{ key: string; value: any }>): Promise<void> {
        const response = await fetch(`${API_BASE}/bulk/update`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ settings }),
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to update settings');
        }
    },

    /**
     * Reset to defaults
     */
    async resetToDefaults(category?: string): Promise<void> {
        const response = await fetch(`${API_BASE}/reset`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ category }),
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to reset settings');
        }
    },

    /**
     * Clear cache
     */
    async clearCache(): Promise<void> {
        const response = await fetch(`${API_BASE}/cache/clear`, {
            method: 'POST',
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to clear cache');
        }
    },
};
