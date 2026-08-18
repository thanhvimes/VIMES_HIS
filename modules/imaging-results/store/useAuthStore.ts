import { create } from 'zustand';
import { User } from '../types';

export type UserRole = 'RADIOLOGIST' | 'TECHNICIAN' | 'CLINICIAN';
export type ModalitySpecialty = 'ALL' | 'CT' | 'MR' | 'CR' | 'US';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  activeRole: UserRole;
  activeModality: ModalitySpecialty;
  activeRoom: string;
  setAuth: (user: User, token: string) => void;
  setActiveRole: (role: UserRole) => void;
  setActiveModality: (modality: ModalitySpecialty) => void;
  setActiveRoom: (room: string) => void;
  logout: () => void;
}

const getStoredToken = () => localStorage.getItem('pacs_jwt_token');
const getStoredUser = (): User | null => {
  const data = localStorage.getItem('pacs_user_info');
  return data ? JSON.parse(data) : null;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: getStoredUser(),
  token: getStoredToken(),
  isAuthenticated: !!getStoredToken(),
  activeRole: (localStorage.getItem('pacs_active_role') as UserRole) || 'RADIOLOGIST',
  activeModality: (localStorage.getItem('pacs_active_modality') as ModalitySpecialty) || 'ALL',
  activeRoom: localStorage.getItem('pacs_active_room') || 'Phòng CĐHA 01',

  setAuth: (user, token) => {
    localStorage.setItem('pacs_jwt_token', token);
    localStorage.setItem('pacs_user_info', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  setActiveRole: (role) => {
    localStorage.setItem('pacs_active_role', role);
    set({ activeRole: role });
  },

  setActiveModality: (modality) => {
    localStorage.setItem('pacs_active_modality', modality);
    set({ activeModality: modality });
  },

  setActiveRoom: (room) => {
    localStorage.setItem('pacs_active_room', room);
    set({ activeRoom: room });
  },

  logout: () => {
    localStorage.removeItem('pacs_jwt_token');
    localStorage.removeItem('pacs_user_info');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
