
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    HospitalIcon, 
    ExclamationCircleIcon,
    XIcon,
    MoonIcon,
    SunIcon,
    MenuIcon 
} from '../../../components/Icons';
import { mockAlerts } from '../data';
import { useTheme } from '../../../contexts/ThemeContext';
import ConfigPanel from '../components/ConfigPanel';

// Layouts
import GeneralLayout from '../templates/GeneralLayout';
import ClinicalLayout from '../templates/ClinicalLayout';
import FinanceLayout from '../templates/FinanceLayout';
import ResourceLayout from '../templates/ResourceLayout';
// New Layouts
import InternalLayout from '../templates/InternalLayout';
import SurgicalLayout from '../templates/SurgicalLayout';
import OncologyLayout from '../templates/OncologyLayout';
import ParaclinicalLayout from '../templates/ParaclinicalLayout';
import OutpatientLayout from '../templates/OutpatientLayout'; // Import New Layout

const CommandCenterView: React.FC = () => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    
    // UI State
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    
    // Configuration State - Default to General
    const [currentLayout, setCurrentLayout] = useState('general');
    const [currentRange, setCurrentRange] = useState('today');

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Helper to get title based on layout
    const getLayoutTitle = () => {
        switch(currentLayout) {
            case 'clinical': return 'Cấp cứu & Hồi sức tích cực';
            case 'finance': return 'Giám sát Tài chính & Doanh thu';
            case 'resource': return 'Quản trị Tài nguyên & Thiết bị';
            case 'internal': return 'Điều hành Khối Nội';
            case 'surgical': return 'Điều hành Khối Ngoại & PT';
            case 'oncology': return 'Trung tâm Ung bướu & Xạ trị';
            case 'paraclinical': return 'Trung tâm Cận Lâm Sàng (Lab/PACS)';
            case 'outpatient': return 'Hoạt động Khám bệnh & Điều trị Ngoại trú'; // New Title
            default: return 'Trung tâm Điều hành Tổng hợp';
        }
    }

    return (
        <div className="fixed inset-0 z-[100] bg-slate-100 dark:bg-[#0f172a] text-slate-900 dark:text-white flex flex-col font-sans overflow-hidden transition-colors duration-300">
            
            {/* --- TOP BAR --- */}
            <div className="h-16 px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 flex justify-between items-center shadow-sm z-50">
                <div className="flex items-center gap-4">
                    {/* MENU BUTTON */}
                    <button 
                        onClick={() => setIsConfigOpen(true)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-colors group"
                        title="Cài đặt hiển thị"
                    >
                        <MenuIcon className="w-6 h-6 group-hover:text-blue-600"/>
                    </button>

                    <div className="p-2 bg-gradient-to-br from-blue-600 to-teal-500 rounded-lg shadow-lg shadow-blue-500/20 hidden sm:block">
                        <HospitalIcon className="w-6 h-6 text-white"/>
                    </div>
                    <div>
                        <h1 className="text-xl font-black uppercase tracking-wider text-slate-800 dark:text-white leading-none hidden sm:block">
                            {getLayoutTitle()}
                        </h1>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-teal-600 dark:text-teal-400 mt-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            SYSTEM OPERATIONAL • {currentRange.toUpperCase()}
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-6">
                    {/* Alerts Ticker */}
                    <div className="hidden lg:flex items-center gap-3 bg-red-50 dark:bg-red-900/20 px-4 py-1.5 rounded-full border border-red-200 dark:border-red-900/50 shadow-sm">
                        <ExclamationCircleIcon className="w-4 h-4 text-red-600 dark:text-red-500 animate-pulse"/>
                        <span className="text-xs font-bold text-red-700 dark:text-red-200 truncate max-w-[300px]">
                            {mockAlerts[0].msg}
                        </span>
                    </div>

                    <div className="text-right hidden sm:block">
                        <div className="text-2xl font-mono font-bold text-slate-800 dark:text-white leading-none">
                            {currentTime.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">
                            {currentTime.toLocaleDateString('vi-VN', {weekday: 'short', day: '2-digit', month: '2-digit'})}
                        </div>
                    </div>

                    <div className="h-8 w-px bg-slate-300 dark:bg-slate-700 mx-2"></div>

                    <button 
                        onClick={toggleTheme} 
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                        title="Đổi giao diện Sáng/Tối"
                    >
                        {theme === 'dark' ? <SunIcon className="w-6 h-6"/> : <MoonIcon className="w-6 h-6"/>}
                    </button>

                    <button 
                        onClick={() => navigate('/')} 
                        className="p-2 rounded-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"
                        title="Thoát Dashboard"
                    >
                        <XIcon className="w-6 h-6"/>
                    </button>
                </div>
            </div>

            {/* --- MAIN CONTENT AREA (DYNAMIC LAYOUT) --- */}
            <div className="flex-1 p-4 lg:p-6 overflow-hidden relative animate-fade-in">
                {currentLayout === 'general' && <GeneralLayout />}
                {currentLayout === 'clinical' && <ClinicalLayout />}
                {currentLayout === 'finance' && <FinanceLayout />}
                {currentLayout === 'resource' && <ResourceLayout />}
                
                {/* NEW LAYOUTS */}
                {currentLayout === 'internal' && <InternalLayout />}
                {currentLayout === 'surgical' && <SurgicalLayout />}
                {currentLayout === 'oncology' && <OncologyLayout />}
                {currentLayout === 'paraclinical' && <ParaclinicalLayout />}
                {currentLayout === 'outpatient' && <OutpatientLayout />}
            </div>

            {/* --- CONFIG PANEL (SLIDE OUT) --- */}
            <ConfigPanel 
                isOpen={isConfigOpen} 
                onClose={() => setIsConfigOpen(false)}
                currentLayout={currentLayout}
                onChangeLayout={setCurrentLayout}
                currentRange={currentRange}
                onChangeRange={setCurrentRange}
            />
        </div>
    );
};

export default CommandCenterView;
