
import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '../../../components/Icons';
import { SurgerySchedule, SurgeryResource } from '../../../types';
import SurgeryDetailModal from './SurgeryDetailModal';

// --- MOCK DATA ---
const resources: SurgeryResource[] = [
    { id: 'OR1', name: 'Phòng Mổ 1 (Chấn thương)', type: 'OR' },
    { id: 'OR2', name: 'Phòng Mổ 2 (Tiêu hóa)', type: 'OR' },
    { id: 'OR3', name: 'Phòng Mổ 3 (Tổng hợp)', type: 'OR' },
    { id: 'OR4', name: 'Phòng Tiểu Phẫu', type: 'OR' },
];

const initialSchedules: SurgerySchedule[] = [
    {
        id: 'S001',
        patientName: 'Lê Hoàng Cường',
        patientId: 'P003',
        procedureName: 'Phẫu thuật nội soi cắt ruột thừa',
        surgeonName: 'BS. Nguyễn Văn A',
        roomId: 'OR2',
        date: new Date().toISOString().slice(0, 10),
        startTime: '08:00',
        endTime: '10:00',
        status: 'completed'
    },
    {
        id: 'S002',
        patientName: 'Trần Thị Bích',
        patientId: 'P002',
        procedureName: 'Mổ lấy thai lần 2',
        surgeonName: 'BS. Phạm Văn D',
        roomId: 'OR3',
        date: new Date().toISOString().slice(0, 10),
        startTime: '09:00',
        endTime: '11:30',
        status: 'in-progress'
    },
    {
        id: 'S003',
        patientName: 'Hoàng Văn Em',
        patientId: 'P005',
        procedureName: 'Kết hợp xương đùi',
        surgeonName: 'BS. Lê Văn C',
        roomId: 'OR1',
        date: new Date().toISOString().slice(0, 10),
        startTime: '13:00',
        endTime: '16:00',
        status: 'scheduled'
    },
    {
        id: 'S004',
        patientName: 'Nguyễn Văn X',
        patientId: 'P099',
        procedureName: 'Cấp cứu: Vỡ lách',
        surgeonName: 'BS. Trực',
        roomId: 'OR2',
        date: new Date().toISOString().slice(0, 10),
        startTime: '11:00',
        endTime: '13:00',
        status: 'emergency'
    }
];

// --- CONSTANTS ---
const START_HOUR = 7;
const END_HOUR = 19;
const PIXELS_PER_HOUR = 100;
const TOTAL_HOURS = END_HOUR - START_HOUR;

const SchedulerBoardView: React.FC = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [schedules, setSchedules] = useState<SurgerySchedule[]>(initialSchedules);
    const [selectedSurgeryId, setSelectedSurgeryId] = useState<string | null>(null);
    const [currentTimePosition, setCurrentTimePosition] = useState<number | null>(null);

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
            case 'completed': return 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/40 dark:border-green-700 dark:text-green-300';
            case 'in-progress': return 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-300 animate-pulse-slow';
            case 'emergency': return 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900/40 dark:border-red-700 dark:text-red-300';
            default: return 'bg-slate-100 border-slate-300 text-slate-800 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300';
        }
    };

    const handleDateChange = (days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        setSelectedDate(newDate);
    };

    const handleSurgeryClick = (id: string) => {
        setSelectedSurgeryId(id);
    };

    const selectedSurgery = schedules.find(s => s.id === selectedSurgeryId);

    return (
        <div className="h-full flex flex-col bg-white dark:bg-slate-900 overflow-hidden rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            
            {/* 1. Header Toolbar */}
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-slate-800 dark:text-white">Lịch Phẫu thuật</h1>
                    <div className="flex items-center bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 p-1 shadow-sm">
                        <button onClick={() => handleDateChange(-1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-600 rounded"><ChevronLeftIcon className="w-5 h-5 text-slate-500"/></button>
                        <span className="px-4 font-bold text-slate-700 dark:text-slate-200 min-w-[120px] text-center">
                            {selectedDate.toLocaleDateString('vi-VN')}
                        </span>
                        <button onClick={() => handleDateChange(1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-600 rounded"><ChevronRightIcon className="w-5 h-5 text-slate-500"/></button>
                    </div>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition shadow-md">
                    <PlusIcon className="w-5 h-5"/> Đặt lịch mổ
                </button>
            </div>

            {/* 2. Scheduler Grid */}
            <div className="flex-1 overflow-auto relative flex">
                
                {/* Resources Column (Y-Axis) */}
                <div className="w-48 flex-shrink-0 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 z-10 sticky left-0">
                    <div className="h-10 border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 sticky top-0 z-20 flex items-center justify-center font-bold text-xs text-slate-500 uppercase">
                        Phòng mổ
                    </div>
                    {resources.map(room => (
                        <div key={room.id} className="h-32 border-b border-slate-200 dark:border-slate-700 p-3 flex flex-col justify-center">
                            <span className="font-bold text-slate-700 dark:text-slate-200">{room.name}</span>
                            <span className="text-xs text-slate-500">{room.type}</span>
                        </div>
                    ))}
                </div>

                {/* Time Grid */}
                <div className="flex-1 relative min-w-[800px]">
                    {/* Time Header (X-Axis) */}
                    <div className="h-10 border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 sticky top-0 z-10 flex">
                        {Array.from({ length: TOTAL_HOURS }).map((_, i) => (
                            <div key={i} className="flex-1 border-r border-slate-200 dark:border-slate-700 text-xs text-slate-500 font-medium flex items-center justify-center">
                                {START_HOUR + i}:00
                            </div>
                        ))}
                    </div>

                    {/* Grid Body */}
                    <div className="relative">
                        {/* Background Lines */}
                        <div className="absolute inset-0 flex pointer-events-none">
                            {Array.from({ length: TOTAL_HOURS }).map((_, i) => (
                                <div key={i} className="flex-1 border-r border-slate-100 dark:border-slate-800"></div>
                            ))}
                        </div>

                        {/* Current Time Indicator */}
                        {currentTimePosition !== null && (
                            <div 
                                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                                style={{ left: `${(currentTimePosition / (TOTAL_HOURS * PIXELS_PER_HOUR)) * 100}%` }}
                            >
                                <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rounded-full"></div>
                            </div>
                        )}

                        {/* Event Rows */}
                        {resources.map(room => (
                            <div key={room.id} className="h-32 border-b border-slate-200 dark:border-slate-700 relative">
                                {schedules
                                    .filter(s => s.roomId === room.id && s.date === selectedDate.toISOString().slice(0, 10))
                                    .map(s => {
                                        const left = (getPosition(s.startTime) / (TOTAL_HOURS * PIXELS_PER_HOUR)) * 100;
                                        const width = (getDurationHeight(s.startTime, s.endTime) / (TOTAL_HOURS * PIXELS_PER_HOUR)) * 100;
                                        
                                        return (
                                            <div
                                                key={s.id}
                                                onClick={() => handleSurgeryClick(s.id)}
                                                className={`absolute top-2 bottom-2 rounded-lg border-l-4 p-2 text-xs cursor-pointer shadow-sm hover:shadow-md transition-all opacity-90 hover:opacity-100 overflow-hidden ${getStatusColor(s.status)}`}
                                                style={{ left: `${left}%`, width: `${width}%` }}
                                            >
                                                <div className="font-bold truncate">{s.patientName}</div>
                                                <div className="truncate opacity-90">{s.procedureName}</div>
                                                <div className="text-[10px] mt-1 opacity-75 truncate">{s.surgeonName}</div>
                                            </div>
                                        );
                                    })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedSurgeryId && selectedSurgery && (
                <SurgeryDetailModal 
                    isOpen={!!selectedSurgeryId}
                    onClose={() => setSelectedSurgeryId(null)}
                    schedule={selectedSurgery}
                />
            )}
        </div>
    );
};

export default SchedulerBoardView;
