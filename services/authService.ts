
import { apiClient } from './apiClient';

// ==================== TYPES ====================

export interface UserInfo {
    userId: string;
    name: string;
    groupId: string;
    deptId: string;
    roomId: number;
    xDept: string[];
    xRoom: string;
    phone?: string;
    certificate?: string;
    position?: string;
    title?: string;
    dob?: string;
    gender?: string;
    identityCard?: string;
    email?: string;
    address?: string;
    modules: ModulePermissions;
    permissions: string[]; // NEW: Detailed permissions from sys_userperm
    isActive: boolean;
    signUserid?: string;
    signPasswd?: string;
    signPartner?: string;
}

export interface ModulePermissions {
    [key: string]: boolean;
    rm: boolean; em: boolean; tm: boolean; us: boolean;
    pa: boolean; es: boolean; hf: boolean; pm: boolean;
    op: boolean; cr: boolean; sys: boolean; lab: boolean;
    mm: boolean; sm: boolean; ar: boolean; ma: boolean;
    bb: boolean; pr: boolean; fam: boolean; sip: boolean;
    st: boolean; srm: boolean; mra: boolean; cm: boolean;
    emr: boolean; hm: boolean; tra: boolean; in: boolean;
    nm: boolean; tmv: boolean; dsm: boolean; its: boolean;
    fa: boolean; hr: boolean; ap: boolean; erp_ar: boolean;
    gl: boolean; po: boolean; so: boolean; si: boolean;
    bil: boolean;
    hcc: boolean; rol: boolean; qms: boolean; ksk: boolean;
}

export interface LoginResponse {
    success: boolean;
    token?: string;
    user?: UserInfo;
    message?: string;
}

// ==================== SERVICE ====================

const API_BASE_URL = '/api/v1/auth';

// Helper to get session with sessionStorage priority (Tab-isolated)
const getStoredUserSession = (): string | null => {
    const session = sessionStorage.getItem('currentUser');
    if (session) return session;
    const local = localStorage.getItem('currentUser');
    if (local) {
        // Cache to this tab's sessionStorage
        sessionStorage.setItem('currentUser', local);
        return local;
    }
    return null;
};

const setStoredUserSession = (sessionStr: string) => {
    sessionStorage.setItem('currentUser', sessionStr);
    localStorage.setItem('currentUser', sessionStr);
};

const removeStoredUserSession = () => {
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('userInfo');
    sessionStorage.removeItem('isAuthenticated');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('isAuthenticated');
};

export const authService = {
    // Đăng nhập
    login: async (userId: string, password: string): Promise<LoginResponse> => {
        const res = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, password })
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Đăng nhập thất bại');
        }

        const data = await res.json();

        // Lưu token và user info vào sessionStorage (ưu tiên cho từng tab) và localStorage
        if (data.token && data.user) {
            setStoredUserSession(JSON.stringify({
                token: data.token,
                ...data.user
            }));
        }

        return data;
    },

    // Lấy thông tin user hiện tại
    getCurrentUser: async (): Promise<UserInfo> => {
        const userSession = getStoredUserSession();

        if (!userSession) {
            throw new Error('Chưa đăng nhập');
        }

        const parsed = JSON.parse(userSession);
        const token = parsed.token;

        if (!token) {
            throw new Error('Chưa đăng nhập');
        }

        const res = await fetch(`${API_BASE_URL}/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!res.ok) {
            if (res.status === 401) {
                // Token hết hạn hoặc không hợp lệ
                removeStoredUserSession();
                throw new Error('Phiên đăng nhập đã hết hạn');
            }
            throw new Error('Không thể lấy thông tin user');
        }

        const data = await res.json();
        return data.user;
    },

    // Đăng xuất
    logout: async (): Promise<void> => {
        const userSession = getStoredUserSession();

        if (userSession) {
            try {
                const parsed = JSON.parse(userSession);
                const token = parsed.token;

                if (token) {
                    await fetch(`${API_BASE_URL}/logout`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                }
            } catch (error) {
                console.error('Logout error:', error);
            }
        }

        // Xóa token khỏi sessionStorage và localStorage
        removeStoredUserSession();
    },

    // Kiểm tra đã đăng nhập chưa
    isAuthenticated: (): boolean => {
        const userSession = getStoredUserSession();
        if (!userSession) return false;

        try {
            const parsed = JSON.parse(userSession);
            return !!parsed.token;
        } catch {
            return false;
        }
    },

    // Lấy token
    getToken: (): string | null => {
        const userSession = getStoredUserSession();
        if (!userSession) return null;

        try {
            const parsed = JSON.parse(userSession);
            return parsed.token || null;
        } catch {
            return null;
        }
    },

    // Cập nhật profile
    updateProfile: async (data: Partial<UserInfo>): Promise<LoginResponse> => {
        const token = authService.getToken();
        if (!token) throw new Error('Chưa đăng nhập');

        const res = await fetch(`${API_BASE_URL}/update-profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Cập nhật thất bại');
        }

        return await res.json();
    }
};
