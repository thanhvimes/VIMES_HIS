
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface SlideItem {
    id: string;
    type: 'image' | 'video';
    url: string;
    title: string;
    desc: string;
    active: boolean;
}

interface SystemContextType {
    slides: SlideItem[];
    addSlide: (slide: Omit<SlideItem, 'id'>) => void;
    removeSlide: (id: string) => void;
    toggleSlideActive: (id: string) => void;
    updateSlide: (id: string, data: Partial<SlideItem>) => void;
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
    { 
        id: '3', 
        type: 'image', 
        url: 'https://images.unsplash.com/photo-1584036561566-b43f5f318c62?auto=format&fit=crop&w=1200&q=80', 
        title: 'Quảng cáo: Sữa dinh dưỡng SureMeal', 
        desc: 'Dinh dưỡng vàng cho người cao tuổi. Hỗ trợ phục hồi sức khỏe nhanh chóng.', 
        active: true 
    },
];

export const SystemProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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

    return (
        <SystemContext.Provider value={{ slides, addSlide, removeSlide, toggleSlideActive, updateSlide }}>
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
