import api from './api';

export interface UserInfo {
  userId: string;
  name: string;
  groupId: string;
  deptId: string;
  roomId?: number;
  xDept?: string[];
  xRoom?: string;
  phone?: string;
  certificate?: string;
  position?: string;
  title?: string;
  dob?: string | null;
  gender?: string;
  identityCard?: string;
  email?: string;
  address?: string;
  modules?: Record<string, boolean>;
  permissions?: string[];
  isActive?: boolean;
}

export const authService = {
  async login(userId: string, password: string): Promise<{ success: boolean; token: string; user: any }> {
    try {
      const res = await api.post('/auth/login', { userId, password });
      const { token, user } = res.data;
      if (token) {
        localStorage.setItem('pacs_jwt_token', token);
        localStorage.setItem('pacs_user_info', JSON.stringify(user));
        sessionStorage.setItem('currentUser', JSON.stringify({ ...user, token }));
        sessionStorage.setItem('userInfo', JSON.stringify(user));
      }
      return { success: true, token, user };
    } catch (err: any) {
      const serverMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (err.response?.status === 401 ? 'Mật khẩu không chính xác' : null) ||
        (err.response?.status === 403 ? 'Tài khoản đã bị tạm khóa' : null) ||
        err.message ||
        'Tài khoản hoặc mật khẩu không chính xác.';
      throw new Error(serverMessage);
    }
  },

  async getCurrentUser(): Promise<UserInfo> {
    const res = await api.get('/auth/me');
    return res.data.user || res.data.userInfo;
  },

  logout(): void {
    localStorage.removeItem('pacs_jwt_token');
    localStorage.removeItem('pacs_user_info');
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('userInfo');
  },

  getToken(): string | null {
    return localStorage.getItem('pacs_jwt_token') || sessionStorage.getItem('pacs_jwt_token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
};

export default authService;
