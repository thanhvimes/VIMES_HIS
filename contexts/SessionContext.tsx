
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrganizationInfo, UserSession } from '../types/common';
import { authService, UserInfo } from '../services/authService';

interface SessionContextType {
    orgInfo: OrganizationInfo;
    setOrgInfo: (info: OrganizationInfo) => void;
    user: UserSession | null;
    userInfo: UserInfo | null; // NEW: Full user info from backend
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    updateDepartment: (deptId: string, deptName: string) => void;
    updateUserInfo: (info: Partial<UserInfo>) => void;
    hasPermission: (permId: string) => boolean; // NEW: CheckPermission equivalent
    setModuleContext: (moduleId: string) => void; // NEW: Set current module context
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const defaultOrgInfo: OrganizationInfo = {
    hospitalCode: '79021',
    hospitalName: 'BỆNH VIỆN ĐA K',
    governingUnitCode: 'SYT_HCM',
    governingUnitName: 'Bộ Y Tế',
    address: 'Cầu Bươu, Tân Triều',
    hotline: '1900886684',
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
            if (!savedUser) return null;
            const parsed = JSON.parse(savedUser);
            if (!parsed?.token) {
                localStorage.removeItem('currentUser');
                localStorage.removeItem('isAuthenticated');
                return null;
            }
            return parsed;
        } catch {
            return null;
        }
    });

    const [userInfo, setUserInfo] = useState<UserInfo | null>(() => {
        try {
            const saved = localStorage.getItem('userInfo');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

    // Auto-load user info on mount if token exists
    useEffect(() => {
        const loadUserInfo = async () => {
            if (authService.isAuthenticated() && (!userInfo || !userInfo.modules)) {
                try {
                    const info = await authService.getCurrentUser();
                    setUserInfo(info);
                    localStorage.setItem('userInfo', JSON.stringify(info));

                    // Also update legacy user format for compatibility
                    const legacyUser: UserSession & { token: string } = {
                        userId: info.userId,
                        username: info.userId,
                        fullName: info.name,
                        title: info.title || '',
                        departmentId: info.deptId,
                        departmentName: info.deptId, // TODO: Get dept name from sys_dept
                        role: (info.userId === 'admin' || info.groupId === 'M') ? 'admin' : 
                              info.groupId === 'D' ? 'doctor' : 
                              info.groupId === 'N' ? 'nurse' : 
                              info.groupId === 'R' ? 'receptionist' :
                              info.groupId === 'A' ? 'accountant' :
                              info.groupId === 'P' ? 'pharmacist' :
                              info.groupId === 'DIR' ? 'director' : 'receptionist',
                        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(info.name)}&background=0ea5e9&color=fff`,
                        token: authService.getToken() || '',
                        permissions: info.permissions || [],
                        modules: info.modules || {}
                    };
                    setUser(legacyUser);
                    localStorage.setItem('currentUser', JSON.stringify(legacyUser));
                } catch (error) {
                    console.error('Failed to load user info:', error);
                }
            }
        };
        loadUserInfo();
    }, []);

    const setOrgInfo = (info: OrganizationInfo) => {
        setOrgInfoState(info);
        localStorage.setItem('orgInfo', JSON.stringify(info));
    };

    const login = async (username: string, password: string) => {
        try {
            const response = await authService.login(username, password);

            if (response.user) {
                // Store full user info
                setUserInfo(response.user);
                localStorage.setItem('userInfo', JSON.stringify(response.user));

                // Create legacy user format for compatibility, including the token
                const legacyUser: UserSession & { token: string } = {
                    userId: response.user.userId,
                    username: response.user.userId,
                    fullName: response.user.name,
                    title: response.user.title || '',
                    departmentId: response.user.deptId,
                    departmentName: response.user.deptId,
                    role: (response.user.userId === 'admin' || response.user.groupId === 'M') ? 'admin' : 
                          response.user.groupId === 'D' ? 'doctor' : 
                          response.user.groupId === 'N' ? 'nurse' : 
                          response.user.groupId === 'R' ? 'receptionist' :
                          response.user.groupId === 'A' ? 'accountant' :
                          response.user.groupId === 'P' ? 'pharmacist' :
                          response.user.groupId === 'DIR' ? 'director' : 'receptionist',
                    avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(response.user.name)}&background=0ea5e9&color=fff`,
                    token: response.token,
                    permissions: response.user.permissions || [],
                    modules: response.user.modules || {}
                };

                setUser(legacyUser);
                localStorage.setItem('currentUser', JSON.stringify(legacyUser));
                localStorage.setItem('isAuthenticated', 'true');
            }
        } catch (error: any) {
            throw error;
        }
    };

    const logout = () => {
        authService.logout();
        setUser(null);
        setUserInfo(null);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userInfo');
        localStorage.removeItem('isAuthenticated');
        navigate('/staff/login');
    };

    const updateDepartment = (deptId: string, deptName: string) => {
        if (user) {
            const updatedUser = { ...user, departmentId: deptId, departmentName: deptName };
            setUser(updatedUser);
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
        if (userInfo) {
            const updatedInfo = { ...userInfo, deptId: deptId };
            setUserInfo(updatedInfo);
            localStorage.setItem('userInfo', JSON.stringify(updatedInfo));
        }
    };

    const updateUserInfo = (info: Partial<UserInfo>) => {
        if (userInfo) {
            const updatedInfo = { ...userInfo, ...info };
            setUserInfo(updatedInfo);
            localStorage.setItem('userInfo', JSON.stringify(updatedInfo));

            // Sync legacy user too
            if (user) {
                const updatedLegacy = {
                    ...user,
                    fullName: updatedInfo.name || user.fullName,
                    title: updatedInfo.title || user.title
                };
                setUser(updatedLegacy);
                localStorage.setItem('currentUser', JSON.stringify(updatedLegacy));
            }
        }
    };

    const hasPermission = (permId: string) => {
        if (!user || !user.permissions) return false;
        if (user.role === 'admin') return true;
        return user.permissions.includes(permId);
    };

    const setModuleContext = (moduleId: string) => {
        if (user) {
            const updatedUser = { ...user, moduleId };
            setUser(updatedUser);
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
    };

    return (
        <SessionContext.Provider value={{
            orgInfo,
            setOrgInfo,
            user,
            userInfo, // NEW: Expose full user info
            isAuthenticated: !!user && authService.isAuthenticated(),
            login,
            logout,
            updateDepartment,
            updateUserInfo,
            hasPermission,
            setModuleContext
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
