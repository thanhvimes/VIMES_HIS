import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { OrganizationInfo, UserSession } from '../types';
import { authService, UserInfo } from '../services/authService';
import { useAuthStore } from '../store/useAuthStore';

interface SessionContextType {
    orgInfo: OrganizationInfo;
    setOrgInfo: (info: OrganizationInfo) => void;
    user: UserSession | null;
    userInfo: UserInfo | null;
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    updateDepartment: (deptId: string, deptName: string) => void;
    updateUserInfo: (info: Partial<UserInfo>) => void;
    hasPermission: (permId: string) => boolean;
    setModuleContext: (moduleId: string) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const defaultOrgInfo: OrganizationInfo = {
    hospitalCode: '79021',
    hospitalName: 'BỆNH VIỆN ĐA KHOA QUỐC TẾ VIMES',
    governingUnitCode: 'SYT_HN',
    governingUnitName: 'Bộ Y Tế',
    address: 'Hà Nội, Việt Nam',
    hotline: '1900886684',
    logoUrl: ''
};

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { setAuth: setZustandAuth, logout: zustandLogout } = useAuthStore();

    const [orgInfo, setOrgInfoState] = useState<OrganizationInfo>(() => {
        try {
            const saved = sessionStorage.getItem('orgInfo') || localStorage.getItem('orgInfo');
            return saved ? JSON.parse(saved) : defaultOrgInfo;
        } catch {
            return defaultOrgInfo;
        }
    });

    const [user, setUser] = useState<UserSession | null>(() => {
        try {
            const savedUser = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
            if (!savedUser) return null;
            const parsed = JSON.parse(savedUser);
            if (!parsed?.token) return null;
            return parsed;
        } catch {
            return null;
        }
    });

    const [userInfo, setUserInfo] = useState<UserInfo | null>(() => {
        try {
            const saved = sessionStorage.getItem('userInfo') || localStorage.getItem('userInfo');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

    const login = async (userId: string, password: string) => {
        const { token, user: userData } = await authService.login(userId, password);
        
        const mappedUser: UserSession & { token: string } = {
            userId: userData.userId || userData.id,
            username: userData.username || userData.userId,
            fullName: userData.fullName || userData.name,
            title: userData.title || '',
            departmentId: userData.deptId || userData.department,
            departmentName: userData.deptId || userData.department,
            role: userData.role || 'doctor',
            avatarUrl: userData.avatarUrl,
            permissions: userData.permissions || [],
            modules: userData.modules || {},
            token: token
        };

        setUser(mappedUser);
        setUserInfo(userData);
        setZustandAuth(userData, token);

        sessionStorage.setItem('currentUser', JSON.stringify(mappedUser));
        sessionStorage.setItem('userInfo', JSON.stringify(userData));
        localStorage.setItem('currentUser', JSON.stringify(mappedUser));
        localStorage.setItem('userInfo', JSON.stringify(userData));
    };

    const logout = () => {
        authService.logout();
        zustandLogout();
        setUser(null);
        setUserInfo(null);
    };

    const updateDepartment = (deptId: string, deptName: string) => {
        if (user) {
            const updated = { ...user, departmentId: deptId, departmentName: deptName };
            setUser(updated);
            sessionStorage.setItem('currentUser', JSON.stringify(updated));
        }
    };

    const updateUserInfo = (info: Partial<UserInfo>) => {
        if (userInfo) {
            const updated = { ...userInfo, ...info };
            setUserInfo(updated);
            sessionStorage.setItem('userInfo', JSON.stringify(updated));
        }
    };

    const hasPermission = (permId: string): boolean => {
        if (!user) return false;
        if (user.role === 'admin' || user.userId === 'admin') return true;
        if (user.permissions && user.permissions.includes(permId)) return true;
        return false;
    };

    const setModuleContext = (moduleId: string) => {
        if (user) {
            const updated = { ...user, moduleId };
            setUser(updated);
        }
    };

    return (
        <SessionContext.Provider
            value={{
                orgInfo,
                setOrgInfo: setOrgInfoState,
                user,
                userInfo,
                isAuthenticated: !!user,
                login,
                logout,
                updateDepartment,
                updateUserInfo,
                hasPermission,
                setModuleContext
            }}
        >
            {children}
        </SessionContext.Provider>
    );
};

export const useSession = (): SessionContextType => {
    const context = useContext(SessionContext);
    if (!context) {
        let savedUser = null;
        try {
            const raw = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
            if (raw) savedUser = JSON.parse(raw);
        } catch {}
        return {
            orgInfo: defaultOrgInfo,
            setOrgInfo: () => {},
            user: savedUser,
            userInfo: null,
            isAuthenticated: !!savedUser,
            login: async () => {},
            logout: () => {},
            updateDepartment: () => {},
            updateUserInfo: () => {},
            hasPermission: () => true,
            setModuleContext: () => {}
        };
    }
    return context;
};
