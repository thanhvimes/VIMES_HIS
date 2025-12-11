
import React from 'react';
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

// --- MOCK DATA ---

// 1. Lưu lượng theo giờ (Phân tách Thường/Yêu cầu)
const flowData = [
    { time: '07:00', normal: 10, service: 5 },
    { time: '08:00', normal: 45, service: 15 },
    { time: '09:00', normal: 80, service: 25 },
    { time: '10:00', normal: 65, service: 20 },
    { time: '11:00', normal: 40, service: 10 },
    { time: '13:00', normal: 30, service: 8 },
    { time: '14:00', normal: 55, service: 18 },
    { time: '15:00', normal: 40, service: 12 },
    { time: '16:00', normal: 20, service: 5 },
];

// 2. Tình trạng hàng đợi theo chuyên khoa
const queueData = [
    { name: 'Nội Tổng quát', waiting: 45, processing: 10, doctorCount: 5, avgWait: 25 },
    { name: 'Nội Tim mạch', waiting: 32, processing: 8, doctorCount: 4, avgWait: 35 },
    { name: 'Ngoại Khoa', waiting: 15, processing: 5, doctorCount: 3, avgWait: 15 },
    { name: 'Nhi Khoa', waiting: 50, processing: 12, doctorCount: 6, avgWait: 40 }, // High load
    { name: 'Sản Phụ khoa', waiting: 20, processing: 6, doctorCount: 4, avgWait: 20 },
    { name: 'Tai Mũi Họng', waiting: 18, processing: 4, doctorCount: 2, avgWait: 18 },
    { name: 'Răng Hàm Mặt', waiting: 10, processing: 3, doctorCount: 2, avgWait: 10 },
];

// 3. Trạng thái phòng khám (Grid View)
// Status: 0=Closed, 1=Available, 2=Occupied, 3=Full/Overloaded
const roomStatus = [
    { id: 'P101', type: 'Normal', status: 2, doctor: 'BS. A' }, { id: 'P102', type: 'Normal', status: 3, doctor: 'BS. B' },
    { id: 'P103', type: 'Normal', status: 2, doctor: 'BS. C' }, { id: 'P104', type: 'Normal', status: 2, doctor: 'BS. D' },
    { id: 'P105', type: 'Normal', status: 1, doctor: 'BS. E' }, { id: 'P106', type: 'Normal', status: 0, doctor: '-' },
    { id: 'VIP1', type: 'Service', status: 2, doctor: 'GS. F' }, { id: 'VIP2', type: 'Service', status: 2, doctor: 'TS. G' },
    { id: 'VIP3', type: 'Service', status: 1, doctor: 'BS. H' }, { id: 'VIP4', type: 'Service', status: 0, doctor: '-' },
];

const OutpatientLayout: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    const textColor = isDark ? '#94a3b8' : '#64748b';

    return (
        <div className="grid grid-cols-12 gap-4 lg:gap-6 h-full overflow-hidden">
            
            {/* --- TOP ROW: KPI CARDS --- */}
            <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-fit shrink-0">
                <KPICard 
                    title="Lượt tiếp đón" 
                    value="518" 
                    subtext="380 Thường | 138 Yêu cầu"
                    trend={5.2}
                    icon={<UserPlusIcon/>} 
                    color="text-blue-600"
                />
                <KPICard 
                    title="Đang chờ khám" 
                    value="190" 
                    subtext="Cao điểm tại Khoa Nhi"
                    icon={<UserGroupIcon/>} 
                    color="text-orange-500"
                />
                <KPICard 
                    title="Đã hoàn tất" 
                    value="210" 
                    subtext="Tỷ lệ kê đơn: 85%"
                    icon={<CheckCircleIcon/>} 
                    color="text-green-600"
                />
                <KPICard 
                    title="Doanh thu Khám (Est)" 
                    value="185 Tr" 
                    subtext="TB: 350k/lượt"
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
                        <div className="flex gap-4 text-xs font-bold">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Khám thường</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Khám yêu cầu</span>
                        </div>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={flowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorNormal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorService" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                <XAxis dataKey="time" tick={{fill: textColor, fontSize: 11}} axisLine={false} tickLine={false} />
                                <YAxis tick={{fill: textColor, fontSize: 11}} axisLine={false} tickLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: gridColor, borderRadius: '8px' }}
                                    itemStyle={{ fontSize: '12px' }}
                                />
                                <Area type="monotone" dataKey="normal" name="Khám thường" stackId="1" stroke="#3b82f6" fill="url(#colorNormal)" />
                                <Area type="monotone" dataKey="service" name="Khám yêu cầu" stackId="1" stroke="#a855f7" fill="url(#colorService)" />
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
                        {roomStatus.map(room => {
                            let colorClass = 'bg-slate-100 dark:bg-slate-800 border-slate-200 text-slate-400'; // Closed
                            if (room.status === 1) colorClass = 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 text-blue-600'; // Available
                            if (room.status === 2) colorClass = 'bg-green-50 dark:bg-green-900/20 border-green-200 text-green-700'; // Occupied
                            if (room.status === 3) colorClass = 'bg-red-50 dark:bg-red-900/20 border-red-200 text-red-700 animate-pulse'; // Full

                            return (
                                <div key={room.id} className={`p-2 rounded-lg border flex flex-col items-center justify-center text-center transition-all ${colorClass}`}>
                                    <div className="text-xs font-bold mb-1">{room.id}</div>
                                    <div className="text-[10px] font-medium truncate w-full">{room.doctor}</div>
                                    {room.type === 'Service' && <div className="mt-1 text-[8px] px-1 bg-yellow-100 text-yellow-800 rounded uppercase font-bold">VIP</div>}
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
                    <div className="space-y-2 text-sm">
                        <div className="flex gap-2 items-start">
                            <span className="text-red-500">•</span>
                            <span className="text-slate-700 dark:text-slate-300">Khoa Nhi: Hàng đợi vượt ngưỡng (50 BN). Đề xuất bổ sung bác sĩ.</span>
                        </div>
                        <div className="flex gap-2 items-start">
                             <span className="text-red-500">•</span>
                            <span className="text-slate-700 dark:text-slate-300">Phòng 102: Bác sĩ báo tạm ngưng 15p.</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default OutpatientLayout;
