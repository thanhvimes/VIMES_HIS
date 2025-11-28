
import { apiClient } from './apiClient';
import { UserSession, OrganizationInfo } from '../types/common';

interface LoginResponse {
    user: UserSession;
    token: string;
    organization: OrganizationInfo;
}

export const authService = {
    login: async (username: string, password: string): Promise<LoginResponse> => {
        // Thực tế: Gọi API login
        // return apiClient.post<LoginResponse>('/auth/login', { username, password });
        
        // MOCK để test UI (Xóa phần này khi có Backend thực)
        await new Promise(resolve => setTimeout(resolve, 800));
        if (username === 'demo' || username === 'admin') {
            return {
                token: 'fake-jwt-token',
                user: {
                    userId: 'BS001',
                    username: username,
                    fullName: 'Trần Văn Minh',
                    title: 'Bác sĩ CKII',
                    departmentId: 'K01',
                    departmentName: 'Khoa Nội Tổng Quát',
                    role: 'doctor',
                    avatarUrl: 'https://ui-avatars.com/api/?name=Dr+Minh&background=0ea5e9&color=fff'
                },
                organization: {
                    hospitalCode: '79021',
                    hospitalName: 'Bệnh viện Đa khoa Quốc tế VIMES',
                    governingUnitCode: 'SYT_HCM',
                    governingUnitName: 'Sở Y tế TP. Hồ Chí Minh',
                    address: '123 Đường Sức Khỏe, Quận 1, TP.HCM',
                    hotline: '1900 1234',
                }
            };
        }
        throw new Error('Tài khoản hoặc mật khẩu không đúng.');
    },

    logout: async () => {
        try {
            // Gọi API logout để hủy token phía server (nếu cần)
            // await apiClient.post('/auth/logout', {}); 
        } catch (e) {
            console.error(e);
        } finally {
            localStorage.removeItem('currentUser');
        }
    },
    
    getProfile: async (): Promise<UserSession> => {
        return apiClient.get<UserSession>('/auth/me');
    }
};
