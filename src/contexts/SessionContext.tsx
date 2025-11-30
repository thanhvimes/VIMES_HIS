
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { OrganizationInfo, UserSession } from '../types/common';

interface SessionContextType {
    orgInfo: OrganizationInfo;
    setOrgInfo: (info: OrganizationInfo) => void; // Allow updating org info
    user: UserSession | null;
    isAuthenticated: boolean;
    login: (mockUserType?: string) => void; // Mock login function
    logout: () => void;
    updateDepartment: (deptId: string, deptName: string) => void; // Chuyển khoa làm việc
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

// Default Mock Data for Organization
const defaultOrgInfo: OrganizationInfo = {
    hospitalCode: '79021',
    hospitalName: 'BỆNH VIỆN K',
    governingUnitCode: 'BỘ Y TẾ',
    governingUnitName: 'Bộ Y tế - Hệ thống quản lý bệnh viện (HIS/EMR)',
    address: '43 Quán Sứ, Hàng Bông, Hoàn Kiếm, Hà Nội',
    hotline: '1900 886684',
    // Sử dụng logo thực tế để demo trực quan
    logoUrl: 'https://upload.wikimedia.org/wikipedia/vi/thumb/e/e5/Logo_b%E1%BB%87nh_vi%E1%BB%87n_K.png/220px-Logo_b%E1%BB%87nh_vi%E1%BB%87n_K.png'
};

// Default Mock Data for User (Admin/Doctor)
const mockDoctorUser: UserSession = {
    userId: 'BS001',
    username: 'minh.dr',
    fullName: 'Trần Văn Minh',
    title: 'Bác sĩ CKII',
    departmentId: 'K01',
    departmentName: 'Khoa Nội Tổng Quát',
    role: 'doctor',
    avatarUrl: 'https://ui-avatars.com/api/?name=Dr+Minh&background=0ea5e9&color=fff'
};

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Initialize from localStorage if available to persist changes across reloads
    const [orgInfo, setOrgInfoState] = useState<OrganizationInfo>(() => {
        try {
            const saved = localStorage.getItem('orgInfo');
            return saved ? JSON.parse(saved) : defaultOrgInfo;
        } catch {
            return defaultOrgInfo;
        }
    });
    
    const [user, setUser] = useState<UserSession | null>(() => {
        try {
            const savedUser = localStorage.getItem('currentUser');
            return savedUser ? JSON.parse(savedUser) : mockDoctorUser;
        } catch {
            return mockDoctorUser;
        }
    });

    const setOrgInfo = (info: OrganizationInfo) => {
        setOrgInfoState(info);
        localStorage.setItem('orgInfo', JSON.stringify(info));
    };

    const login = (mockUserType: string = 'doctor') => {
        const newUser = { ...mockDoctorUser }; 
        setUser(newUser);
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        localStorage.setItem('isAuthenticated', 'true');
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isAuthenticated');
        window.location.href = '/'; 
    };

    const updateDepartment = (deptId: string, deptName: string) => {
        if (user) {
            const updatedUser = { ...user, departmentId: deptId, departmentName: deptName };
            setUser(updatedUser);
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
    };

    return (
        <SessionContext.Provider value={{ 
            orgInfo, 
            setOrgInfo,
            user, 
            isAuthenticated: !!user,
            login, 
            logout,
            updateDepartment 
        }}>
            {children}
        </SessionContext.Provider>
    );
};

export const useSession = () => {
    const context = useContext(SessionContext);
    if (context === undefined) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
};
