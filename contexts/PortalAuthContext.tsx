
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { portalService, PortalProfile } from '../services/portalService';

interface PortalAuthContextType {
    isAuthenticated: boolean;
    patient: PortalProfile | null;
    profiles: PortalProfile[];
    login: (phone: string, password: string) => Promise<void>;
    logout: () => void;
    selectProfile: (profile: PortalProfile) => void;
}

const PortalAuthContext = createContext<PortalAuthContextType | undefined>(undefined);

export const PortalAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const [patient, setPatient] = useState<PortalProfile | null>(() => {
        try {
            const saved = localStorage.getItem('portal_patient');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

    const [profiles, setProfiles] = useState<PortalProfile[]>(() => {
        try {
            const saved = localStorage.getItem('portal_profiles');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
        const token = portalService.getToken();
        return !!token && !!patient;
    });

    // Auto-restore session on mount
    useEffect(() => {
        const token = portalService.getToken();
        const savedPatient = portalService.getCurrentPatient();

        if (token && savedPatient) {
            setPatient(savedPatient);
            setIsAuthenticated(true);
        } else {
            setIsAuthenticated(false);
        }
    }, []);

    const login = async (phone: string, password: string) => {
        try {
            console.log('[PortalAuth] Starting login...', { phone });
            const response = await portalService.login(phone, password);
            console.log('[PortalAuth] Login response:', response);

            if (response.success && response.token) {
                const selectedProfile = response.selectedProfile || response.profiles?.[0];
                console.log('[PortalAuth] Selected profile:', selectedProfile);

                if (selectedProfile) {
                    setPatient(selectedProfile);
                    setProfiles(response.profiles || [selectedProfile]);
                    setIsAuthenticated(true);

                    console.log('[PortalAuth] Navigating to /portal/home');
                    // Navigate to portal home after successful login
                    navigate('/portal/home', { replace: true });
                } else {
                    throw new Error('Không tìm thấy hồ sơ bệnh nhân');
                }
            } else {
                throw new Error(response.message || 'Đăng nhập thất bại');
            }
        } catch (error: any) {
            console.error('[PortalAuth] Login error:', error);
            setIsAuthenticated(false);
            throw error;
        }
    };

    const logout = () => {
        portalService.logout();
        setPatient(null);
        setProfiles([]);
        setIsAuthenticated(false);
        navigate('/portal/login', { replace: true });
    };

    const selectProfile = (profile: PortalProfile) => {
        portalService.selectProfile(profile);
        setPatient(profile);
    };

    return (
        <PortalAuthContext.Provider value={{
            isAuthenticated,
            patient,
            profiles,
            login,
            logout,
            selectProfile
        }}>
            {children}
        </PortalAuthContext.Provider>
    );
};

export const usePortalAuth = () => {
    const context = useContext(PortalAuthContext);
    if (context === undefined) {
        throw new Error('usePortalAuth must be used within a PortalAuthProvider');
    }
    return context;
};
