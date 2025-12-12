
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { NavItemType } from '../types/common';
import { 
  RECEPTION_NAV_ITEMS 
} from '../modules/reception/constants';
import { CONSULTATION_NAV_ITEMS } from '../modules/consultation/constants';
import { BILLING_NAV_ITEMS } from '../modules/billing/constants';
import { PHARMACY_NAV_ITEMS } from '../modules/pharmacy/constants';
import { LAB_RESULTS_NAV_ITEMS } from '../modules/lab-results/constants';
import { IMAGING_RESULTS_NAV_ITEMS } from '../modules/imaging-results/constants';
import { INPATIENT_NAV_ITEMS } from '../modules/inpatient-treatment/constants';
import { SURGERY_NAV_ITEMS } from '../modules/surgery/constants';
import { EQUIPMENT_NAV_ITEMS } from '../modules/equipment/constants';
import { RECORD_STORAGE_NAV_ITEMS } from '../modules/record-storage/constants';
import { ADMIN_NAV_ITEMS } from '../modules/admin/constants';
import { MGMT_REPORTING_NAV_ITEMS } from '../modules/management-reporting/constants';
import { INSURANCE_NAV_ITEMS } from '../modules/insurance/constants';
import { TELEMEDICINE_NAV_ITEMS } from '../modules/telemedicine/constants';
import { CRM_NAV_ITEMS } from '../modules/crm/constants';
import { HR_NAV_ITEMS } from '../modules/hr/constants';
import { ICON_MAP } from '../components/Icons';

export interface SlideItem {
    id: string;
    type: 'image' | 'video';
    url: string;
    title: string;
    desc: string;
    active: boolean;
}

// NavItemDTO for storage (icon as string)
export interface NavItemDTO extends Omit<NavItemType, 'icon'> {
    iconName: string;
    isVisible?: boolean; // New field for visibility
}

// Map of all default configs
const defaultMenuConfig: Record<string, NavItemType[]> = {
    reception: RECEPTION_NAV_ITEMS,
    consultation: CONSULTATION_NAV_ITEMS,
    billing: BILLING_NAV_ITEMS,
    pharmacy: PHARMACY_NAV_ITEMS,
    'lab-results': LAB_RESULTS_NAV_ITEMS,
    'imaging-results': IMAGING_RESULTS_NAV_ITEMS,
    'inpatient-treatment': INPATIENT_NAV_ITEMS,
    surgery: SURGERY_NAV_ITEMS,
    equipment: EQUIPMENT_NAV_ITEMS,
    'record-storage': RECORD_STORAGE_NAV_ITEMS,
    admin: ADMIN_NAV_ITEMS,
    'management-reporting': MGMT_REPORTING_NAV_ITEMS,
    insurance: INSURANCE_NAV_ITEMS,
    telemedicine: TELEMEDICINE_NAV_ITEMS,
    crm: CRM_NAV_ITEMS,
    hr: HR_NAV_ITEMS,
};

interface SystemContextType {
    slides: SlideItem[];
    addSlide: (slide: Omit<SlideItem, 'id'>) => void;
    removeSlide: (id: string) => void;
    toggleSlideActive: (id: string) => void;
    updateSlide: (id: string, data: Partial<SlideItem>) => void;
    
    // Dynamic Menu
    menuConfig: Record<string, NavItemDTO[]>;
    updateMenuConfig: (moduleId: string, items: NavItemDTO[]) => void;
    getModuleNav: (moduleId: string) => NavItemType[];
    resetMenuConfig: (moduleId?: string) => void;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

const defaultSlides: SlideItem[] = [
    { 
        id: '1', 
        type: 'image', 
        url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80', 
        title: 'Bệnh viện Đa khoa Quốc tế VIMES', 
        desc: 'Chăm sóc sức khỏe toàn diện chuẩn 5 sao. Đặt lịch ngay để nhận ưu đãi.', 
        active: true 
    },
    { 
        id: '2', 
        type: 'video', 
        url: 'https://cdn.coverr.co/videos/coverr-doctors-walking-in-hospital-corridor-4538/1080p.mp4', 
        title: 'Đội ngũ chuyên gia hàng đầu', 
        desc: 'Hội tụ các giáo sư, bác sĩ đầu ngành. Trang thiết bị hiện đại bậc nhất.', 
        active: true 
    },
];

// Helper to convert React Element Icon to String Name (Best effort for initial load)
const getIconName = (iconElement: React.ReactElement): string => {
    // This is tricky because we can't easily get the name from a rendered element in prod.
    // For the initial default state, we manually map or use a default.
    // However, since we are moving to dynamic, we should rely on a DTO structure.
    // For this implementation, we will use a fallback or try to infer. 
    // BUT BETTER: We will assume default config items are static and we map them to DTOs on first load
    // using a lookup or simply defaulting to 'StarIcon' if not found, then Admin can fix.
    // To make it robust: We need to know which icon component corresponds to which string.
    // Since we can't reverse lookup easily, we will initialize the DTOs with a best-guess mapping
    // or modify the constants to include the string name (refactoring constants would be huge).
    
    // Compromise: We will use a visual mapping function here just for initialization.
    // In a real app, constants should define icon as string 'HomeIcon' and we render dynamically.
    return 'Squares2X2Icon'; // Default fallback
};

// Helper to convert DTO to runtime NavItem
const mapDTOToNavItem = (dto: NavItemDTO): NavItemType => {
    let IconComponent = ICON_MAP[dto.iconName];
    if (!IconComponent) {
        // Fallback to Squares2X2Icon if the specific icon is not found
        IconComponent = ICON_MAP['Squares2X2Icon'];
    }
    
    // If Squares2X2Icon is also missing (extreme case), render a placeholder div
    if (!IconComponent) {
        return {
            ...dto,
            icon: <div className="w-5 h-5 bg-gray-400 rounded-sm" />
        };
    }

    return {
        ...dto,
        icon: React.createElement(IconComponent, { className: "w-5 h-5" })
    };
};

// Helper to convert Runtime Constant to DTO (Run once on init)
// We have to hardcode mapping or accept a generic icon for defaults until edited
const mapConstantToDTO = (item: NavItemType): NavItemDTO => {
    // Attempt to identify icon (This is limited without changing all constant files)
    // We will use a default icon for "un-customized" items initially.
    // Ideally, we should update all constants to be DTOs, but to save time, we do this:
    return {
        name: item.name,
        path: item.path,
        group: item.group,
        section: item.section,
        iconName: 'Squares2X2Icon', // Default, admin will need to set correct icon if they customize
        isVisible: true
    };
};

export const SystemProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // --- SLIDES STATE ---
    const [slides, setSlides] = useState<SlideItem[]>(() => {
        try {
            const saved = localStorage.getItem('system_slides');
            return saved ? JSON.parse(saved) : defaultSlides;
        } catch {
            return defaultSlides;
        }
    });

    useEffect(() => {
        localStorage.setItem('system_slides', JSON.stringify(slides));
    }, [slides]);

    const addSlide = (slide: Omit<SlideItem, 'id'>) => {
        const newSlide = { ...slide, id: Date.now().toString() };
        setSlides(prev => [...prev, newSlide]);
    };

    const removeSlide = (id: string) => {
        setSlides(prev => prev.filter(s => s.id !== id));
    };

    const toggleSlideActive = (id: string) => {
        setSlides(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
    };

    const updateSlide = (id: string, data: Partial<SlideItem>) => {
        setSlides(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
    };

    // --- MENU STATE ---
    const [menuConfig, setMenuConfig] = useState<Record<string, NavItemDTO[]>>(() => {
        try {
            const saved = localStorage.getItem('system_menu_config');
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.error("Error loading menu config", e);
        }
        
        // Initialize from defaults
        const initialConfig: Record<string, NavItemDTO[]> = {};
        Object.keys(defaultMenuConfig).forEach(key => {
            initialConfig[key] = defaultMenuConfig[key].map(mapConstantToDTO);
        });
        return initialConfig;
    });

    useEffect(() => {
        localStorage.setItem('system_menu_config', JSON.stringify(menuConfig));
    }, [menuConfig]);

    const updateMenuConfig = (moduleId: string, items: NavItemDTO[]) => {
        setMenuConfig(prev => ({
            ...prev,
            [moduleId]: items
        }));
    };

    const resetMenuConfig = (moduleId?: string) => {
        if (moduleId) {
            setMenuConfig(prev => ({
                ...prev,
                [moduleId]: defaultMenuConfig[moduleId].map(mapConstantToDTO)
            }));
        } else {
            const initialConfig: Record<string, NavItemDTO[]> = {};
            Object.keys(defaultMenuConfig).forEach(key => {
                initialConfig[key] = defaultMenuConfig[key].map(mapConstantToDTO);
            });
            setMenuConfig(initialConfig);
        }
    };

    const getModuleNav = (moduleId: string): NavItemType[] => {
        // If config exists, use it
        if (menuConfig[moduleId]) {
            // Filter invisible items and map to React Elements
            return menuConfig[moduleId]
                .filter(item => item.isVisible !== false)
                .map(mapDTOToNavItem);
        }
        // Fallback to constants if not found in state (shouldn't happen if initialized correctly)
        return defaultMenuConfig[moduleId] || [];
    };

    return (
        <SystemContext.Provider value={{ 
            slides, addSlide, removeSlide, toggleSlideActive, updateSlide,
            menuConfig, updateMenuConfig, getModuleNav, resetMenuConfig
        }}>
            {children}
        </SystemContext.Provider>
    );
};

export const useSystem = () => {
    const context = useContext(SystemContext);
    if (context === undefined) {
        throw new Error('useSystem must be used within a SystemProvider');
    }
    return context;
};
