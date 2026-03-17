// ==================== AUTH CONTEXT ====================
// File: contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, UserInfo } from '../services/authService';

interface AuthContextType {
    user: UserInfo | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (userId: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Auto-load user info khi app khởi động (nếu có token)
    useEffect(() => {
        const loadUser = async () => {
            if (authService.isAuthenticated()) {
                try {
                    const userInfo = await authService.getCurrentUser();
                    setUser(userInfo);
                } catch (error) {
                    console.error('Failed to load user:', error);
                    // Token không hợp lệ, xóa đi
                    await authService.logout();
                }
            }
            setIsLoading(false);
        };

        loadUser();
    }, []);

    const login = async (userId: string, password: string) => {
        const response = await authService.login(userId, password);
        if (response.user) {
            setUser(response.user);
        }
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
    };

    const refreshUser = async () => {
        if (authService.isAuthenticated()) {
            const userInfo = await authService.getCurrentUser();
            setUser(userInfo);
        }
    };

    const value: AuthContextType = {
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook để sử dụng AuthContext
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
