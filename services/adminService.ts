
import { apiClient } from './apiClient';
import { UserSession, OrganizationInfo } from '../types/common';

// Interface cho User Account quản trị
export interface UserAccount extends UserSession {
    id: string;
    email: string;
    status: 'active' | 'locked';
    lastLogin?: string;
}

export const adminService = {
    // --- Organization Info (Thông tin Bệnh viện) ---
    getOrganizationInfo: async (): Promise<OrganizationInfo> => {
        // Mock API Call
        return await apiClient.get<OrganizationInfo>('/admin/organization/info');
    },

    updateOrganizationInfo: async (info: OrganizationInfo): Promise<OrganizationInfo> => {
        console.log(">>> [API] Updating Organization Info:", info);
        // Thực tế: return await apiClient.put<OrganizationInfo>('/admin/organization/info', info);
        
        // Mock response delay
        await new Promise(resolve => setTimeout(resolve, 800));
        return info;
    },

    // --- Users ---
    getUsers: async (params?: { search?: string, department?: string }): Promise<UserAccount[]> => {
        return await apiClient.get<UserAccount[]>('/admin/users', params);
    },

    saveUser: async (user: UserAccount): Promise<UserAccount> => {
        if (user.id && !user.id.startsWith('U')) { 
            return await apiClient.put<UserAccount>(`/admin/users/${user.id}`, user);
        }
        return await apiClient.post<UserAccount>('/admin/users', user);
    },

    deleteUser: async (id: string): Promise<boolean> => {
        await apiClient.delete(`/admin/users/${id}`);
        return true;
    },

    resetPassword: async (username: string): Promise<boolean> => {
        await apiClient.post('/admin/users/reset-password', { username });
        return true;
    },

    // --- Signatures ---
    getSignatures: async (): Promise<any[]> => {
        return await apiClient.get<any[]>('/admin/signatures');
    },
    
    saveSignature: async (data: any): Promise<any> => {
         return await apiClient.post<any>('/admin/signatures', data);
    },

    // --- System Settings ---
    getSettings: async () => {
        return await apiClient.get('/admin/settings');
    },
    
    updateSettings: async (settings: any) => {
        return await apiClient.put('/admin/settings', settings);
    }
};
