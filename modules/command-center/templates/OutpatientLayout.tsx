
import React, { useState, useEffect } from 'react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, Legend
} from 'recharts';
import { 
    UserGroupIcon, 
    ClockIcon, 
    CheckCircleIcon, 
    UserPlusIcon,
    ExclamationCircleIcon,
    StethoscopeIcon,
    CurrencyDollarIcon,
    ActivityIcon
} from '../../../components/Icons';
import { KPICard } from '../components/Widgets';
import { useTheme } from '../../../contexts/ThemeContext';
import { commandCenterService, OutpatientFlow, RoomStatus, QueueStatus } from '../../../services/commandCenterService';

// MOCK DATA REMOVED - Using real data from API

interface OutpatientLayoutProps {
    liveData?: {
        totalPatients: number;
        waiting: number;
        completed: number;
        revenue: number;
    }
}

const OutpatientLayout: React.FC<OutpatientLayoutProps> = ({ liveData }) => {
    const { theme } = useTheme();
    
    const [flowData, setFlowData] = useState<OutpatientFlow[]>([]);
    const [roomStatus, setRoomStatus] = useState<RoomStatus[]>([]);
    const [queueData, setQueueData] = useState<QueueStatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const [flow, rooms, queues] = await Promise.all([
                    commandCenterService.getOutpatientFlow(),
                    commandCenterService.getRoomStatus(),
                    commandCenterService.getQueueStatus()
                ]);
                setFlowData(flow);
                setRoomStatus(rooms);
                setQueueData(queues);
            } catch (error) {
                console.error("Failed to fetch outpatient details:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetails();
        const interval = setInterval(fetchDetails, 15000); // Update details every 15s
        return () => clearInterval(interval);
    }, []);

    const isDark = theme === 'dark';
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    const textColor = isDark ? '#94a3b8' : '#64748b';

    if (isLoading && flowData.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-bold text-slate-500 animate-pulse uppercase tracking-widest">Đang tải dữ liệu thật...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-12 gap-4 lg:gap-6 h-full overflow-hidden">
            
            {/* --- TOP ROW: KPI CARDS --- */}
            <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-fit shrink-0">
                <KPICard 
                    title="Lượt tiếp đón" 
                    value={liveData?.totalPatients || 0} 
                    subtext={`${liveData?.normalReception || 0} Thường | ${liveData?.serviceReception || 0} Yêu cầu`}
                    trend={5.2}
                    icon={<UserPlusIcon/>} 
                    color="text-blue-600"
                />
                <KPICard 
                    title="Đang chờ khám" 
                    value={liveData?.waiting || 0} 
                    subtext={`Cao điểm tại: ${liveData?.highestWaitingDept || '--'}`}
                    icon={<UserGroupIcon/>} 
                    color="text-orange-500"
                />
                <KPICard 
                    title="Đã hoàn tất" 
                    value={liveData?.completed || 0} 
                    subtext={`Tỉ lệ hoàn tất: ${liveData?.completionRate || 0}%`}
                    icon={<CheckCircleIcon/>} 
                    color="text-green-600"
                />
                <KPICard 
                    title="Doanh thu Khám (Est)" 
                    value={`${liveData?.revenue || 0} Tr`} 
                    subtext="Tính theo thực thu"
                    icon={<CurrencyDollarIcon/>} 
                    color="text-teal-600"
                />
            </div>

            {/* --- MIDDLE ROW --- */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-6 overflow-hidden">
                
                {/* 1. Patient Flow Chart */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm h-1/2 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 uppercase text-sm flex items-center gap-2">
                            <ActivityIcon className="w-5 h-5 text-indigo-500"/> Biểu đồ lưu lượng bệnh nhân
                        </h3>
                        <div className="flex gap-4 text-[10px] font-black uppercase">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Tiếp đón</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Vào khám</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Kết thúc</span>
                        </div>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={flowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorReception" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorStart" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorFinish" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                <XAxis dataKey="time" tick={{fill: textColor, fontSize: 11}} axisLine={false} tickLine={false} />
                                <YAxis tick={{fill: textColor, fontSize: 11}} axisLine={false} tickLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: gridColor, borderRadius: '8px' }}
                                    itemStyle={{ fontSize: '12px' }}
                                />
                                <Area type="monotone" dataKey="reception" name="Tiếp đón" stroke="#3b82f6" fill="url(#colorReception)" strokeWidth={2} dot={false} />
                                <Area type="monotone" dataKey="start" name="Vào khám" stroke="#f59e0b" fill="url(#colorStart)" strokeWidth={2} dot={false} />
                                <Area type="monotone" dataKey="finish" name="Kết thúc" stroke="#10b981" fill="url(#colorFinish)" strokeWidth={2} dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Room Status Grid */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm h-1/2 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 uppercase text-sm flex items-center gap-2">
                            <StethoscopeIcon className="w-5 h-5 text-teal-500"/> Trạng thái Phòng khám (Real-time)
                        </h3>
                        <div className="flex gap-3 text-[10px] uppercase font-bold text-slate-500">
                             <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Quá tải</span>
                             <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Đang khám</span>
                             <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400"></span> Trống</span>
                             <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300"></span> Đóng</span>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-5 gap-3 flex-1 overflow-y-auto content-start">
                        {roomStatus
                            .sort((a, b) => b.status - a.status) // Sắp xếp cảnh báo (3) lên đầu
                            .map(room => {
                                let colorClass = 'bg-slate-100 dark:bg-slate-800 border-slate-200 text-slate-400'; // Closed
                                if (room.status === 1) colorClass = 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 text-blue-600'; // Available
                                if (room.status === 2) colorClass = 'bg-green-50 dark:bg-green-900/20 border-green-200 text-green-700'; // Occupied
                                if (room.status === 3) colorClass = 'bg-red-50 dark:bg-red-900/20 border-red-200 text-red-700 animate-pulse border-2'; // Full

                                return (
                                    <div key={room.id} className={`p-3 rounded-xl border shadow-sm flex flex-col items-center justify-center text-center transition-all ${colorClass}`}>
                                        <div className="text-sm font-black mb-1">{room.id}</div>
                                        <div className="text-xs font-bold truncate w-full mb-1">{room.doctor}</div>
                                        <div className="flex gap-2 mt-1 font-mono">
                                            <span className="text-[11px] font-black text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200/50">Đ:{room.waiting}</span>
                                            <span className="text-[11px] font-black text-green-700 bg-green-100 px-1.5 py-0.5 rounded border border-green-200/50">X:{room.completed}</span>
                                        </div>
                                        {room.type === 'Service' && <div className="mt-1.5 text-[9px] px-2 py-0.5 bg-yellow-400 text-slate-900 rounded-full uppercase font-black shadow-sm">VIP</div>}
                                    </div>
                                );
                            })}
                    </div>
                </div>

            </div>

            {/* --- RIGHT COLUMN: QUEUE & ALERTS --- */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 h-full overflow-hidden">
                
                {/* 1. Queue Status */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm flex-1 flex flex-col overflow-hidden">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 uppercase text-sm mb-4 flex items-center gap-2">
                        <ClockIcon className="w-5 h-5 text-orange-500"/> Giám sát Hàng đợi & Thời gian chờ
                    </h3>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                        {queueData.map((item, idx) => (
                            <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{item.name}</span>
                                    {item.waiting > 40 && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold animate-pulse">ÙN Ứ</span>}
                                </div>
                                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-2">
                                    <span>Đang chờ: <strong className="text-slate-800 dark:text-white">{item.waiting}</strong></span>
                                    <span>Bác sĩ: <strong>{item.doctorCount}</strong></span>
                                </div>
                                {/* Progress Bar for Wait Time */}
                                <div className="relative pt-1">
                                    <div className="flex mb-1 items-center justify-between">
                                        <span className="text-[10px] font-semibold inline-block text-slate-500">
                                            Thời gian chờ TB: {item.avgWait}p
                                        </span>
                                    </div>
                                    <div className="overflow-hidden h-1.5 text-xs flex rounded bg-slate-200 dark:bg-slate-700">
                                        <div 
                                            style={{ width: `${Math.min((item.avgWait / 60) * 100, 100)}%` }} 
                                            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                                                item.avgWait > 45 ? 'bg-red-500' : item.avgWait > 30 ? 'bg-orange-400' : 'bg-green-500'
                                            }`}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. Critical Alerts */}
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-xl p-4 shadow-sm flex-shrink-0">
                     <h3 className="font-bold text-red-700 dark:text-red-400 uppercase text-sm mb-3 flex items-center gap-2">
                        <ExclamationCircleIcon className="w-5 h-5 animate-pulse"/> Cảnh báo Vận hành
                    </h3>
                    <div className="space-y-2 text-sm max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                        {/* 1. Cảnh báo theo Khoa */}
                        {queueData.filter(q => q.waiting > 40).map((q, i) => (
                            <div key={`dept-${i}`} className="flex gap-2 items-start animate-fade-in">
                                <span className="text-red-500 font-black">•</span>
                                <span className="text-slate-700 dark:text-slate-300 font-medium">
                                    <strong className="text-red-600">{q.name}</strong>: Hàng đợi vượt ngưỡng ({q.waiting} BN). Cần bổ sung nhân sự.
                                </span>
                            </div>
                        ))}
                        
                        {/* 2. Cảnh báo theo Phòng cụ thể */}
                        {roomStatus.filter(r => r.waiting > 15).map((r, i) => (
                            <div key={`room-${i}`} className="flex gap-2 items-start animate-fade-in">
                                <span className="text-amber-500 font-black">•</span>
                                <span className="text-slate-700 dark:text-slate-300">
                                    <strong className="text-amber-600">Phòng {r.name}</strong>: Đang ùn tắc ({r.waiting} BN chờ). Bác sĩ {r.doctor}.
                                </span>
                            </div>
                        ))}

                        {/* 3. Trường hợp không có cảnh báo */}
                        {queueData.filter(q => q.waiting > 40).length === 0 && roomStatus.filter(r => r.waiting > 15).length === 0 && (
                            <div className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-2 italic">
                                <CheckCircleIcon className="w-4 h-4"/> Hệ thống đang vận hành ổn định.
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default OutpatientLayout;
