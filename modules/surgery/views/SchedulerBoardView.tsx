
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, FilterIcon, SearchIcon, UserGroupIcon } from '../../../components/Icons';
import { SurgerySchedule } from '../../../types';
import SurgeryScheduleModal from './SurgeryScheduleModal';
import { useTheme } from '../../../contexts/ThemeContext';
import { resources, mockSurgeries } from '../data';

// --- CONSTANTS ---
const START_HOUR = 7;
const END_HOUR = 19;
const PIXELS_PER_HOUR = 120; // Increased for better visibility
const TOTAL_HOURS = END_HOUR - START_HOUR;

const SchedulerBoardView: React.FC = () => {
    const { fontSettings } = useTheme();
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [schedules, setSchedules] = useState<SurgerySchedule[]>(mockSurgeries);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [currentTimePosition, setCurrentTimePosition] = useState<number | null>(null);
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRoom, setFilterRoom] = useState('All');

    // --- Update current time indicator ---
    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const hour = now.getHours();
            const min = now.getMinutes();
            if (hour >= START_HOUR && hour < END_HOUR) {
                const timeInHours = (hour - START_HOUR) + (min / 60);
                setCurrentTimePosition(timeInHours * PIXELS_PER_HOUR);
            } else {
                setCurrentTimePosition(null);
            }
        };
        updateTime();
        const interval = setInterval(updateTime, 60000);
        return () => clearInterval(interval);
    }, []);

    // --- Helpers ---
    const getPosition = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        return ((h - START_HOUR) + (m / 60)) * PIXELS_PER_HOUR;
    };

    const getDurationHeight = (start: string, end: string) => {
        const startPos = getPosition(start);
        const endPos = getPosition(end);
        return endPos - startPos;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 border-green-300 text-green-900 dark:bg-green-900/40 dark:border-green-700 dark:text-green-200';
            case 'in-progress': return 'bg-blue-100 border-blue-300 text-blue-900 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-200 ring-2 ring-blue-400 ring-opacity-50 animate-pulse-slow';
            case 'emergency': return 'bg-red-100 border-red-300 text-red-900 dark:bg-red-900/40 dark:border-red-700 dark:text-red-200 ring-2 ring-red-400';
            default: return 'bg-white border-slate-300 text-slate-800 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200';
        }
    };

    const handleDateChange = (days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        setSelectedDate(newDate);
    };

    const handleSurgeryClick = (id: string) => {
        navigate(`/surgery/detail/${id}`);
    };

    const handleAddSurgery = (newSchedule: Omit<SurgerySchedule, 'id' | 'status'>) => {
        const schedule: SurgerySchedule = {
            ...newSchedule,
            id: `S${Date.now()}`,
            status: 'scheduled'
        };
        setSchedules([...schedules, schedule]);
    };

    const filteredResources = useMemo(() => {
        if (filterRoom === 'All') return resources;
        return resources.filter(r => r.id === filterRoom);
    }, [filterRoom]);

    const filteredSchedules = useMemo(() => {
        return schedules.filter(s => {
            const dateMatch = s.date === selectedDate.toISOString().slice(0, 10);
            const searchMatch = s.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                s.surgeonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                s.procedureName.toLowerCase().includes(searchTerm.toLowerCase());
            return dateMatch && searchMatch;
        });
    }, [schedules, selectedDate, searchTerm]);

    return (
        <div className="h-full flex flex-col bg-white dark:bg-slate-900 overflow-hidden rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            
            {/* 1. Header Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <h1 className="text-xl font-bold text-slate-800 dark:text-white whitespace-nowrap">Lịch Phẫu thuật</h1>
                    <div className="flex items-center bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 p-1 shadow-sm">
                        <button onClick={() => handleDateChange(-1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-600 rounded"><ChevronLeftIcon className="w-5 h-5 text-slate-500"/></button>
                        <span className="px-4 font-bold text-slate-700 dark:text-slate-200 min-w-[120px] text-center">
                            {selectedDate.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                        </span>
                        <button onClick={() => handleDateChange(1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-600 rounded"><ChevronRightIcon className="w-5 h-5 text-slate-500"/></button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                     <div className="relative flex-1 min-w-[200px]">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                        <input 
                            type="text" 
                            placeholder="Tìm BN, BS, Tên mổ..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className={`w-full pl-9 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 ${fontSettings.controls}`}
                        />
                    </div>
                    <div className="relative min-w-[150px]">
                        <FilterIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                        <select 
                            value={filterRoom}
                            onChange={e => setFilterRoom(e.target.value)}
                            className={`w-full pl-9 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 ${fontSettings.controls}`}
                        >
                            <option value="All">Tất cả phòng</option>
                            {resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition shadow-md whitespace-nowrap"
                    >
                        <PlusIcon className="w-5 h-5"/> Đặt lịch
                    </button>
                </div>
            </div>

            {/* 2. Scheduler Grid */}
            <div className="flex-1 overflow-auto relative flex">
                
                {/* Resources Column (Y-Axis) */}
                <div className="w-48 flex-shrink-0 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 z-20 sticky left-0 shadow-md">
                    <div className="h-12 border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 sticky top-0 z-30 flex items-center justify-center font-bold text-xs text-slate-500 uppercase tracking-wider">
                        Phòng mổ
                    </div>
                    {filteredResources.map(room => (
                        <div key={room.id} className="h-40 border-b border-slate-200 dark:border-slate-700 p-3 flex flex-col justify-center bg-white dark:bg-slate-800">
                            <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{room.name}</span>
                            <span className="text-xs text-slate-500 mt-1 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded w-fit">{room.type}</span>
                        </div>
                    ))}
                </div>

                {/* Time Grid */}
                <div className="flex-1 relative min-w-[1000px]">
                    {/* Time Header (X-Axis) */}
                    <div className="h-12 border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 sticky top-0 z-10 flex">
                        {Array.from({ length: TOTAL_HOURS }).map((_, i) => (
                            <div key={i} className="flex-1 border-r border-slate-200 dark:border-slate-700 text-xs text-slate-500 font-bold flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                                {START_HOUR + i}:00
                            </div>
                        ))}
                    </div>

                    {/* Grid Body */}
                    <div className="relative bg-slate-50/50 dark:bg-slate-900/50">
                        {/* Background Lines */}
                        <div className="absolute inset-0 flex pointer-events-none">
                            {Array.from({ length: TOTAL_HOURS }).map((_, i) => (
                                <div key={i} className="flex-1 border-r border-slate-200 dark:border-slate-800 border-dashed opacity-50"></div>
                            ))}
                        </div>

                        {/* Current Time Indicator */}
                        {currentTimePosition !== null && (
                            <div 
                                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none shadow-[0_0_4px_rgba(239,68,68,0.6)]"
                                style={{ left: `${(currentTimePosition / (TOTAL_HOURS * PIXELS_PER_HOUR)) * 100}%` }}
                            >
                                <div className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></div>
                            </div>
                        )}

                        {/* Event Rows */}
                        {filteredResources.map(room => (
                            <div key={room.id} className="h-40 border-b border-slate-200 dark:border-slate-700 relative group">
                                {/* Hover line guide */}
                                <div className="absolute inset-0 bg-blue-50/30 dark:bg-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                
                                {filteredSchedules
                                    .filter(s => s.roomId === room.id)
                                    .map(s => {
                                        const left = (getPosition(s.startTime) / (TOTAL_HOURS * PIXELS_PER_HOUR)) * 100;
                                        const width = (getDurationHeight(s.startTime, s.endTime) / (TOTAL_HOURS * PIXELS_PER_HOUR)) * 100;
                                        
                                        return (
                                            <div
                                                key={s.id}
                                                onClick={() => handleSurgeryClick(s.id)}
                                                className={`absolute top-1 bottom-1 rounded-lg border-l-4 p-2 text-xs cursor-pointer shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden flex flex-col justify-center ${getStatusColor(s.status)}`}
                                                style={{ left: `${left}%`, width: `${width}%`, zIndex: 10 }}
                                                title={`${s.startTime}-${s.endTime}: ${s.patientName} - ${s.procedureName} (${s.surgeonName})`}
                                            >
                                                <div className="font-bold text-sm leading-tight whitespace-normal line-clamp-2">{s.patientName}</div>
                                                <div className="font-medium opacity-90 mt-0.5 leading-tight line-clamp-2 break-words whitespace-normal">{s.procedureName}</div>
                                                <div className="flex items-center gap-1 mt-1 opacity-75 truncate">
                                                    <UserGroupIcon className="w-3 h-3 flex-shrink-0"/> 
                                                    <span className="truncate">{s.surgeonName}</span>
                                                </div>
                                                <div className="absolute top-1 right-1 opacity-80 font-mono text-[9px] bg-black/10 px-1 rounded">
                                                    {s.startTime} - {s.endTime}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Add Modal */}
            <SurgeryScheduleModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSave={handleAddSurgery}
                resources={resources}
            />
        </div>
    );
};

export default SchedulerBoardView;
