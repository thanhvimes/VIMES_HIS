
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HospitalIcon, ExclamationCircleIcon, XIcon, MoonIcon, SunIcon, MenuIcon, MaximizeIcon, MinimizeIcon, DownloadIcon } from '../../../components/Icons';
import { HospitalLogo } from '../../../config/branding';
import { useSystemStore } from '../../../stores/useSystemStore';
import { mockAlerts, mockRealtimeLogs } from '../data';
import { useTheme } from '../../../contexts/ThemeContext';
import ConfigPanel from '../components/ConfigPanel';
import { commandCenterService, OutpatientKPI, OutpatientFlow, RoomStatus, QueueStatus } from '../../../services/commandCenterService';

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
import ExecutiveStatusLayout from '../templates/ExecutiveStatusLayout'; // Dashboard chuẩn giám đốc

const CommandCenterView: React.FC = () => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const logoUrl = useSystemStore(state => state.logoUrl);
    
    // UI State
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [simulationData, setSimulationData] = useState({
        totalPatients: 0,
        waiting: 0,
        completed: 0,
        revenue: 0,
        emergency: 0,
        normalReception: 0,
        serviceReception: 0,
        highestWaitingDept: '--',
        completionRate: 0,
        bedCapacity: [] as any[],
        orStatus: [] as any[],
        waitTimes: [] as any[],
        campuses: {
            k1: { outpatients: 0 },
            k2: { outpatients: 0 },
            k3: { outpatients: 0 }
        }
    });
    
    // Configuration State - Default to Executive
    const [currentLayout, setCurrentLayout] = useState('executive');
    const [currentRange, setCurrentRange] = useState('today');

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        
        const fetchData = async () => {
            try {
                // Luôn lấy KPI cơ bản và KPI từng cơ sở để phục vụ Báo cáo điều hành
                const [kpi, kpiK1BHYT, kpiK1YC, kpiK2, kpiK3BHYT, kpiK3YC] = await Promise.all([
                    commandCenterService.getOutpatientKPI(),
                    commandCenterService.getOutpatientKPI({ deptCode: 'KBQS' }),
                    commandCenterService.getOutpatientKPI({ deptCode: 'KBTN' }),
                    commandCenterService.getOutpatientKPI({ deptCode: 'KBK2' }),
                    commandCenterService.getOutpatientKPI({ deptCode: 'KB' }),
                    commandCenterService.getOutpatientKPI({ deptCode: 'KBYC' })
                ]);
                
                // Tính toán số lượng của từng cơ sở
                const totalK1 = Number(kpiK1BHYT?.totalReception || 0) + Number(kpiK1YC?.totalReception || 0);
                const totalK2 = Number(kpiK2?.totalReception || 0);
                const totalK3 = Number(kpiK3BHYT?.totalReception || 0) + Number(kpiK3YC?.totalReception || 0);

                // Nếu là màn hình Tổng hợp hoặc Ngoại trú thì lấy thêm dữ liệu chi tiết
                let beds = [] as any[];
                let ors = [] as any[];
                let waits = [] as any[];

                if (currentLayout === 'general') {
                    [beds, ors, waits] = await Promise.all([
                        commandCenterService.getBedCapacity(),
                        commandCenterService.getORStatus(),
                        commandCenterService.getAvgWaitTimes()
                    ]);
                }

                // Kiểm tra an toàn cho kpi
                const safeKpi = kpi || { 
                    totalReception: 0, waitingCount: 0, completedCount: 0, 
                    revenueEst: 0, normalReception: 0, serviceReception: 0,
                    highestWaitingDept: '--', completionRate: 0 
                };
                
                setSimulationData(prev => ({
                    ...prev,
                    totalPatients: Number(safeKpi.totalReception || 0),
                    waiting: Number(safeKpi.waitingCount || 0),
                    completed: Number(safeKpi.completedCount || 0),
                    revenue: Math.round(Number(safeKpi.revenueEst || 0)),
                    normalReception: Number(safeKpi.normalReception || 0),
                    serviceReception: Number(safeKpi.serviceReception || 0),
                    highestWaitingDept: safeKpi.highestWaitingDept || '--',
                    completionRate: Number(safeKpi.completionRate || 0),
                    emergency: Math.floor(Number(safeKpi.totalReception || 0) * 0.05),
                    bedCapacity: Array.isArray(beds) ? beds : [],
                    orStatus: Array.isArray(ors) ? ors : [],
                    waitTimes: Array.isArray(waits) ? waits : [],
                    campuses: {
                        k1: { outpatients: totalK1 },
                        k2: { outpatients: totalK2 },
                        k3: { outpatients: totalK3 }
                    }
                }));
            } catch (error) {
                console.error("Failed to fetch Command Center data:", error);
            }
        };

        fetchData();
        const apiTimer = setInterval(fetchData, 10000); // Fetch every 10s

        return () => {
            clearInterval(timer);
            clearInterval(apiTimer);
        };
    }, [currentLayout]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    // Helper to get title based on layout
    const getLayoutTitle = () => {
        switch(currentLayout) {
            case 'executive': return 'Tình hình hoạt động';
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
            <div className="h-20 px-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border-b border-slate-200/50 dark:border-slate-800/50 flex justify-between items-center shadow-2xl z-50 transition-all duration-500">
                <div className="flex items-center gap-6">
                    {/* MENU BUTTON */}
                    <button 
                        onClick={() => setIsConfigOpen(true)}
                        className="group relative p-3 bg-slate-100 dark:bg-slate-800/50 hover:bg-blue-600 dark:hover:bg-blue-600 rounded-2xl text-slate-600 dark:text-slate-300 transition-all duration-300 shadow-sm"
                        title="Cài đặt hiển thị"
                    >
                        <MenuIcon className="w-6 h-6 group-hover:text-white transition-colors"/>
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 transform group-hover:rotate-12 transition-transform duration-500 flex items-center justify-center overflow-hidden">
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo" className="w-9 h-9 object-contain" />
                            ) : (
                                <HospitalLogo className="w-9 h-9"/>
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-800 dark:text-white leading-none">
                                {getLayoutTitle()}
                            </h1>
                            <div className="flex items-center gap-2 text-[10px] font-black text-blue-500 dark:text-blue-400 mt-2 uppercase tracking-widest">
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                System Live • {currentRange.replace('today', 'Hôm nay').replace('week', 'Tuần này').toUpperCase()}
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* News Ticker */}
                <div className="hidden xl:flex flex-1 max-w-xl mx-12 h-10 bg-slate-100/50 dark:bg-slate-800/30 rounded-full border border-slate-200/50 dark:border-slate-700/30 px-4 items-center overflow-hidden">
                    <div className="flex items-center gap-2 whitespace-nowrap animate-marquee">
                        {mockAlerts.map((alert, i) => (
                            <div key={i} className="flex items-center gap-2 text-[11px] font-bold text-slate-600 dark:text-slate-400 mr-12">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase ${
                                    alert.type === 'critical' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'
                                }`}>{alert.department}</span>
                                {alert.msg}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block border-r border-slate-200 dark:border-slate-700 pr-6 mr-2">
                        <div className="text-3xl font-mono font-black text-slate-800 dark:text-white leading-none tracking-tighter">
                            {currentTime.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                        </div>
                        <div className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-widest">
                            {currentTime.toLocaleDateString('vi-VN', {weekday: 'long', day: '2-digit', month: '2-digit'})}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={toggleFullscreen}
                            className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-all shadow-sm"
                            title="Toàn màn hình"
                        >
                            {isFullscreen ? <MinimizeIcon className="w-5 h-5"/> : <MaximizeIcon className="w-5 h-5"/>}
                        </button>

                        <button 
                            onClick={toggleTheme} 
                            className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-all shadow-sm"
                            title="Đổi giao diện Sáng/Tối"
                        >
                            {theme === 'dark' ? <SunIcon className="w-5 h-5"/> : <MoonIcon className="w-5 h-5"/>}
                        </button>

                        <button 
                            onClick={() => navigate('/')} 
                            className="p-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white hover:scale-105 transition-all shadow-xl font-bold text-xs flex items-center gap-2"
                        >
                            <XIcon className="w-4 h-4"/>
                            <span>THOÁT</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* --- MAIN CONTENT AREA (DYNAMIC LAYOUT) --- */}
            <div className="flex-1 p-4 lg:p-6 overflow-hidden relative animate-fade-in">
                {currentLayout === 'executive' && <ExecutiveStatusLayout liveData={simulationData} />}
                {currentLayout === 'general' && <GeneralLayout liveData={simulationData} />}
                {currentLayout === 'clinical' && <ClinicalLayout />}
                {currentLayout === 'finance' && <FinanceLayout liveData={simulationData} />}
                {currentLayout === 'resource' && <ResourceLayout />}
                
                {/* NEW LAYOUTS */}
                {currentLayout === 'internal' && <InternalLayout />}
                {currentLayout === 'surgical' && <SurgicalLayout />}
                {currentLayout === 'oncology' && <OncologyLayout />}
                {currentLayout === 'paraclinical' && <ParaclinicalLayout />}
                {currentLayout === 'outpatient' && <OutpatientLayout liveData={simulationData} />}
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
