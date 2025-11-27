
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { OrganizationInfo, UserSession } from '../types/common';

interface SessionContextType {
    orgInfo: OrganizationInfo;
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
    hospitalName: 'Bệnh viện Đa khoa Quốc tế VIMES',
    governingUnitCode: 'SYT_HCM',
    governingUnitName: 'Sở Y tế TP. Hồ Chí Minh',
    address: '123 Đường Sức Khỏe, Quận 1, TP.HCM',
    hotline: '1900 1234',
    logoUrl: 'https://ui-avatars.com/api/?name=Vimes&background=0ea5e9&color=fff&size=128'
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
    const [orgInfo] = useState<OrganizationInfo>(defaultOrgInfo);
    
    // Initialize user from localStorage if available (simple persistence)
    const [user, setUser] = useState<UserSession | null>(() => {
        try {
            const savedUser = localStorage.getItem('currentUser');
            return savedUser ? JSON.parse(savedUser) : mockDoctorUser;
        } catch {
            return mockDoctorUser;
        }
    });

    const login = (mockUserType: string = 'doctor') => {
        // In real app, this would take credentials and call API
        const newUser = { ...mockDoctorUser }; 
        setUser(newUser);
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        localStorage.setItem('isAuthenticated', 'true');
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isAuthenticated');
        window.location.href = '/'; // Redirect to login
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
