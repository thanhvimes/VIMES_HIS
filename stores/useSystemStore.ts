import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { NavItemType } from '../types/common';
import { settingsService } from '../services/settingsService';
import { RECEPTION_NAV_ITEMS } from '../modules/reception/constants';
import { ONLINE_BOOKING_NAV_ITEMS } from '../modules/online-booking/constants';
import { CONSULTATION_NAV_ITEMS } from '../modules/consultation/constants';
import { BILLING_NAV_ITEMS } from '../modules/billing/constants';
import { PHARMACY_NAV_ITEMS } from '../modules/pharmacy/constants';
import { MEDICAL_SUPPLIES_NAV_ITEMS } from '../modules/medical-supplies/constants';
import { LAB_RESULTS_NAV_ITEMS } from '../modules/lab-results/constants';
import { IMAGING_RESULTS_NAV_ITEMS } from '../modules/imaging-results/constants';
import { INPATIENT_NAV_ITEMS, DOCTOR_NAV_ITEMS, NURSE_NAV_ITEMS } from '../modules/inpatient-treatment/constants';
import { SURGERY_NAV_ITEMS } from '../modules/surgery/constants';
import { EQUIPMENT_NAV_ITEMS } from '../modules/equipment/constants';
import { RECORD_STORAGE_NAV_ITEMS } from '../modules/record-storage/constants';
import { ADMIN_NAV_ITEMS } from '../modules/admin/constants';
import { MGMT_REPORTING_NAV_ITEMS } from '../modules/management-reporting/constants';
import { INSURANCE_NAV_ITEMS } from '../modules/insurance/constants';
import { HEALTH_CHECK_NAV_ITEMS } from '../modules/health-check-sync/constants';
import { TELEMEDICINE_NAV_ITEMS } from '../modules/telemedicine/constants';
import { CRM_NAV_ITEMS } from '../modules/crm/constants';
import { HR_NAV_ITEMS } from '../modules/hr/constants';
import { QUEUE_NAV_ITEMS } from '../modules/queue-management/constants';
import { DOCUMENTS_NAV_ITEMS } from '../modules/document-engine/constants';
import { EMR_NAV_ITEMS } from '../modules/emr/constants';
import { HOSPITAL_STATISTICS_NAV_ITEMS } from '../modules/hospital-statistics/constants';
import { ICON_MAP } from '../components/icon-map';
import React from 'react';

export interface SlideItem {
    id: string;
    type: 'image' | 'video';
    url: string;
    title: string;
    desc: string;
    active: boolean;
}

export interface NavItemDTO extends Omit<NavItemType, 'icon'> {
    iconName: string;
    isVisible?: boolean;
    adminOnly?: boolean;
}

interface SystemState {
    isSidebarCollapsed: boolean;
    isMobileSidebarOpen: boolean;
    slides: SlideItem[];
    menuConfig: Record<string, NavItemDTO[]>;
    hospitalName: string;
    parentOrg: string;
    systemName: string;
    logoUrl: string;
    brandingLoaded: boolean;
    toggleSidebar: () => void;
    setMobileSidebarOpen: (isOpen: boolean) => void;
    addSlide: (slide: Omit<SlideItem, 'id'>) => void;
    removeSlide: (id: string) => void;
    toggleSlideActive: (id: string) => void;
    updateSlide: (id: string, data: Partial<SlideItem>) => void;
    updateMenuConfig: (moduleId: string, items: NavItemDTO[]) => void;
    resetMenuConfig: (moduleId?: string) => void;
    getModuleNav: (moduleId: string, role?: string) => NavItemType[];
    fetchBrandingSettings: () => Promise<void>;
    updateBrandingSettings: (updates: Array<{ key: string; value: any }>) => Promise<void>;
}

const defaultSlides: SlideItem[] = [
    { id: '1', type: 'image', url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80', title: 'Bệnh viện Đa khoa Quốc tế VIMES', desc: 'Chăm sóc sức khỏe toàn diện chuẩn 5 sao. Đặt lịch ngay để nhận ưu đãi.', active: true },
    { id: '2', type: 'video', url: 'https://cdn.coverr.co/videos/coverr-doctors-walking-in-hospital-corridor-4538/1080p.mp4', title: 'Đội ngũ chuyên gia hàng đầu', desc: 'Hội tụ các giáo sư, bác sĩ đầu ngành. Trang thiết bị hiện đại bậc nhất.', active: true },
];

const defaultMenuConfigRaw: Record<string, NavItemType[]> = {
    reception: RECEPTION_NAV_ITEMS,
    'online-booking': ONLINE_BOOKING_NAV_ITEMS,
    consultation: CONSULTATION_NAV_ITEMS,
    billing: BILLING_NAV_ITEMS,
    pharmacy: PHARMACY_NAV_ITEMS,
    'medical-supplies': MEDICAL_SUPPLIES_NAV_ITEMS,
    'lab-results': LAB_RESULTS_NAV_ITEMS,
    'imaging-results': IMAGING_RESULTS_NAV_ITEMS,
    'inpatient-treatment': INPATIENT_NAV_ITEMS,
    surgery: SURGERY_NAV_ITEMS,
    equipment: EQUIPMENT_NAV_ITEMS,
    'record-storage': RECORD_STORAGE_NAV_ITEMS,
    admin: ADMIN_NAV_ITEMS,
    'management-reporting': MGMT_REPORTING_NAV_ITEMS,
    insurance: INSURANCE_NAV_ITEMS,
    'health-check': HEALTH_CHECK_NAV_ITEMS,
    telemedicine: TELEMEDICINE_NAV_ITEMS,
    crm: CRM_NAV_ITEMS,
    hr: HR_NAV_ITEMS,
    'queue-management': QUEUE_NAV_ITEMS,
    documents: DOCUMENTS_NAV_ITEMS,
    emr: EMR_NAV_ITEMS,
    'hospital-statistics': HOSPITAL_STATISTICS_NAV_ITEMS,
};

const mapConstantToDTO = (item: NavItemType): NavItemDTO => ({
    name: item.name,
    path: item.path,
    group: item.group,
    section: item.section,
    iconName: item.iconName || 'Squares2X2Icon',
    isVisible: true,
    adminOnly: item.adminOnly
});

const mapDTOToNavItem = (dto: NavItemDTO): NavItemType => {
    let IconComponent = ICON_MAP[dto.iconName];
    if (!IconComponent) IconComponent = ICON_MAP['Squares2X2Icon'];
    return {
        ...dto,
        icon: React.createElement(IconComponent, { className: "w-5 h-5" })
    };
};

const initialMenuConfig: Record<string, NavItemDTO[]> = {};
Object.keys(defaultMenuConfigRaw).forEach(key => {
    initialMenuConfig[key] = defaultMenuConfigRaw[key].map(mapConstantToDTO);
});

export const useSystemStore = create<SystemState>()(
    persist(
        (set, get) => ({
            isSidebarCollapsed: false,
            isMobileSidebarOpen: false,
            slides: defaultSlides,
            menuConfig: initialMenuConfig,
            hospitalName: 'BỆNH VIỆN ĐA KHOA TỈNH',
            parentOrg: 'SỞ Y TẾ NINH BÌNH',
            systemName: 'Hệ thống Quản lý Tổng thể Bệnh viện',
            logoUrl: '',
            brandingLoaded: false,
            toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
            setMobileSidebarOpen: (isOpen) => set({ isMobileSidebarOpen: isOpen }),
            addSlide: (slide) => set((state) => ({ slides: [...state.slides, { ...slide, id: Date.now().toString() }] })),
            removeSlide: (id) => set((state) => ({ slides: state.slides.filter(s => s.id !== id) })),
            toggleSlideActive: (id) => set((state) => ({ slides: state.slides.map(s => s.id === id ? { ...s, active: !s.active } : s) })),
            updateSlide: (id, data) => set((state) => ({ slides: state.slides.map(s => s.id === id ? { ...s, ...data } : s) })),
            updateMenuConfig: (moduleId, items) => set((state) => ({ menuConfig: { ...state.menuConfig, [moduleId]: items } })),
            resetMenuConfig: (moduleId) => {
                if (moduleId) {
                    set((state) => ({ menuConfig: { ...state.menuConfig, [moduleId]: defaultMenuConfigRaw[moduleId].map(mapConstantToDTO) } }));
                } else {
                    set({ menuConfig: initialMenuConfig });
                }
            },
            getModuleNav: (moduleId, role = 'admin') => {
                if (moduleId === 'inpatient-treatment') {
                    if (role === 'nurse') return NURSE_NAV_ITEMS;
                    return DOCTOR_NAV_ITEMS;
                }
                const config = get().menuConfig[moduleId];
                const defaultItems = defaultMenuConfigRaw[moduleId] || [];

                if (config) {
                    const defaultPaths = new Set(defaultItems.map(item => item.path));
                    // Keep only valid items that exist in current module schema
                    const validConfig = config.filter(item => defaultPaths.has(item.path));
                    const currentPaths = new Set(validConfig.map(item => item.path));
                    const missingItems = defaultItems
                        .filter(item => !currentPaths.has(item.path))
                        .map(mapConstantToDTO);

                    if (validConfig.length !== config.length || missingItems.length > 0) {
                        const updatedConfig = [...validConfig, ...missingItems];
                        setTimeout(() => {
                            set((state) => ({
                                menuConfig: { ...state.menuConfig, [moduleId]: updatedConfig }
                            }));
                        }, 0);
                        return updatedConfig
                            .filter(item => item.isVisible !== false)
                            .filter(item => !item.adminOnly || role === 'admin')
                            .map(mapDTOToNavItem);
                    }

                    return config
                        .filter(item => item.isVisible !== false)
                        .filter(item => !item.adminOnly || role === 'admin')
                        .map(mapDTOToNavItem);
                }
                return defaultItems;
            },
            fetchBrandingSettings: async () => {
                try {
                    const updates: Partial<SystemState> = { brandingLoaded: true };
                    
                    // Core details retrieved EXCLUSIVELY from SYS_COMPANY (Source of Truth)
                    try {
                        const company = await settingsService.getCompanyInfo();
                        if (company?.hospitalName) updates.hospitalName = company.hospitalName;
                        if (company?.parentOrg) updates.parentOrg = company.parentOrg;
                        if (company?.logoUrl) updates.logoUrl = company.logoUrl;
                    } catch (e) {
                        console.warn('SYS_COMPANY fetch failed:', e);
                    }

                    set(updates);
                } catch (err) {
                    console.error('Fatal error in fetchBrandingSettings:', err);
                }
            },
            updateBrandingSettings: async (updates) => {
                try {
                    await settingsService.updateMultipleSettings(updates);
                    const localUpdates: Partial<SystemState> = {};
                    updates.forEach(u => {
                        if (u.key === 'general_hospital_name') localUpdates.hospitalName = u.value;
                        if (u.key === 'general_parent_org') localUpdates.parentOrg = u.value;
                        if (u.key === 'general_system_name') localUpdates.systemName = u.value;
                        if (u.key === 'general_logo_url') localUpdates.logoUrl = u.value;
                    });
                    set(localUpdates);
                } catch (e) {
                    console.error('Failed to update branding settings:', e);
                    throw e;
                }
            }
        }),
        {
            name: 'clinic-system-storage-v5',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ isSidebarCollapsed: state.isSidebarCollapsed, slides: state.slides, menuConfig: state.menuConfig }),
        }
    )
);
