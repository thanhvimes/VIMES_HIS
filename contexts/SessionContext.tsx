
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrganizationInfo, UserSession } from '../types/common';
import { authService } from '../services/authService';

interface SessionContextType {
    orgInfo: OrganizationInfo;
    setOrgInfo: (info: OrganizationInfo) => void;
    user: UserSession | null;
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<void>; 
    logout: () => void;
    updateDepartment: (deptId: string, deptName: string) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const defaultOrgInfo: OrganizationInfo = {
    hospitalCode: '79021',
    hospitalName: 'BỆNH VIỆN K',
    governingUnitCode: 'BỘ Y TẾ',
    governingUnitName: 'Bộ Y tế - Hệ thống quản lý bệnh viện (HIS/EMR)',
    address: '43 Quán Sứ, Hàng Bông, Hoàn Kiếm, Hà Nội',
    hotline: '1900 886684',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/vi/thumb/e/e5/Logo_b%E1%BB%87nh_vi%E1%BB%87n_K.png/220px-Logo_b%E1%BB%87nh_vi%E1%BB%87n_K.png'
};

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const navigate = useNavigate();
    
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
            return savedUser ? JSON.parse(savedUser) : null;
        } catch {
            return null;
        }
    });

    const setOrgInfo = (info: OrganizationInfo) => {
        setOrgInfoState(info);
        localStorage.setItem('orgInfo', JSON.stringify(info));
    };

    const login = async (username: string, password: string) => {
        try {
            const response = await authService.login(username, password);
            setUser(response.user);
            setOrgInfo(response.organization);
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            localStorage.setItem('isAuthenticated', 'true');
        } catch (error: any) {
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isAuthenticated');
        navigate('/staff/login');
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
