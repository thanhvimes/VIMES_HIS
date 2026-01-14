
import { apiClient } from './apiClient';
import { UserSession, OrganizationInfo } from '../types/common';

interface LoginResponse {
    user: UserSession;
    token: string;
    organization: OrganizationInfo;
}

export const authService = {
    login: async (username: string, password: string): Promise<LoginResponse> => {
        // MOCK logic xử lý đăng nhập
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // 1. Tài khoản Quản trị hệ thống
        if (username === 'admin' && password === 'password') {
            return {
                token: 'fake-admin-token',
                user: {
                    userId: 'AD001',
                    username: 'admin',
                    fullName: 'Quản trị viên Hệ thống',
                    title: 'System Administrator',
                    departmentId: 'IT',
                    departmentName: 'Phòng CNTT',
                    role: 'admin', // QUAN TRỌNG: Quyền admin nhìn thấy 14 module
                    avatarUrl: 'https://ui-avatars.com/api/?name=Admin&background=1e293b&color=fff'
                },
                organization: mockOrg
            };
        }
        
        // 2. Tài khoản Bác sĩ (Demo)
        if ((username === 'demo' || username === 'demo@clinicms.com') && password === 'password') {
            return {
                token: 'fake-doctor-token',
                user: {
                    userId: 'BS001',
                    username: 'demo',
                    fullName: 'BS. Trần Văn Minh',
                    title: 'Bác sĩ CKII',
                    departmentId: 'K01',
                    departmentName: 'Khoa Nội Tổng Quát',
                    role: 'doctor', // QUAN TRỌNG: Quyền doctor nhìn thấy 10 module
                    avatarUrl: 'https://ui-avatars.com/api/?name=Dr+Minh&background=0ea5e9&color=fff'
                },
                organization: mockOrg
            };
        }
        
        throw new Error('Tài khoản hoặc mật khẩu không đúng. Thử lại với admin/password.');
    },

    logout: async () => {
        localStorage.removeItem('currentUser');
    },
    
    getProfile: async (): Promise<UserSession> => {
        return apiClient.get<UserSession>('/auth/me');
    }
};

const mockOrg: OrganizationInfo = {
    hospitalCode: '79021',
    hospitalName: 'Bệnh viện Đa khoa Quốc tế VIMES',
    governingUnitCode: 'SYT_HCM',
    governingUnitName: 'Sở Y tế TP. Hồ Chí Minh',
    address: '123 Đường Sức Khỏe, Quận 1, TP.HCM',
    hotline: '1900 1234',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/vi/thumb/e/e5/Logo_b%E1%BB%87nh_vi%E1%BB%87n_K.png/220px-Logo_b%E1%BB%87nh_vi%E1%BB%87n_K.png'
};
