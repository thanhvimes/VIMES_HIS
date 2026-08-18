import { create } from 'zustand';
import { BRANDING } from '../config/branding';

export interface SlideItem {
    id: string;
    type: 'image' | 'video';
    url: string;
    title: string;
    desc: string;
    active: boolean;
}

interface SystemState {
    hospitalName: string;
    systemName: string;
    logoUrl: string;
    isSidebarCollapsed: boolean;
    isMobileSidebarOpen: boolean;
    slides: SlideItem[];
    toggleSidebar: () => void;
    setMobileSidebarOpen: (isOpen: boolean) => void;
    setHospitalName: (name: string) => void;
    setSystemName: (name: string) => void;
    setLogoUrl: (url: string) => void;
}

export const useSystemStore = create<SystemState>((set) => ({
    hospitalName: BRANDING.hospitalName || 'BỆNH VIỆN ĐA KHOA QUỐC TẾ VIMES',
    systemName: BRANDING.systemName || 'HỆ THỐNG CHẨN ĐOÁN HÌNH ẢNH & PACS VIEWER',
    logoUrl: BRANDING.logoUrl || '',
    isSidebarCollapsed: false,
    isMobileSidebarOpen: false,
    slides: [
        {
            id: 'slide-1',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80',
            title: 'Hệ thống PACS VIMES DICOM 3.0',
            desc: 'Tối ưu hóa tốc độ tải và xử lý hình ảnh y tế chất lượng cao.',
            active: true
        }
    ],

    toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
    setMobileSidebarOpen: (isOpen) => set({ isMobileSidebarOpen: isOpen }),
    setHospitalName: (hospitalName) => set({ hospitalName }),
    setSystemName: (systemName) => set({ systemName }),
    setLogoUrl: (logoUrl) => set({ logoUrl })
}));

export default useSystemStore;
