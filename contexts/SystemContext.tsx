
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
        url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80', 
        title: 'Bệnh viện Đa khoa Quốc tế VIMES', 
        desc: 'Chăm sóc sức khỏe toàn diện chuẩn 5 sao', 
        active: true 
    },
    { 
        id: '2', 
        type: 'video', 
        url: 'https://cdn.coverr.co/videos/coverr-doctors-walking-in-hospital-corridor-4538/1080p.mp4', 
        title: 'Đội ngũ chuyên gia hàng đầu', 
        desc: 'Hội tụ các giáo sư, bác sĩ đầu ngành', 
        active: true 
    },
    { 
        id: '3', 
        type: 'image', 
        url: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=600&q=80', 
        title: 'Hệ thống trang thiết bị hiện đại', 
        desc: 'Công nghệ chẩn đoán hình ảnh tiên tiến nhất', 
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
