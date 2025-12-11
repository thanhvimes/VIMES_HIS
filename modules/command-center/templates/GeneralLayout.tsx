
import React from 'react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
    UserGroupIcon, 
    ClockIcon, 
    ActivityIcon, 
    HospitalIcon, 
    ExclamationCircleIcon 
} from '../../../components/Icons';
import { KPICard, BedHeatmap, ORStatusBoard } from '../components/Widgets';
import { mockBedCapacity, mockPatientFlow, mockORStatus, mockWaitingTimes, mockAlerts } from '../data';
import { useTheme } from '../../../contexts/ThemeContext';

const GeneralLayout: React.FC = () => {
    const { theme } = useTheme();
    
    // Theme colors configuration
    const gridColor = theme === 'dark' ? '#334155' : '#e2e8f0';
    const axisColor = theme === 'dark' ? '#94a3b8' : '#64748b';
    const tooltipBg = theme === 'dark' ? '#1e293b' : '#ffffff';
    const tooltipText = theme === 'dark' ? '#f1f5f9' : '#1e293b';

    return (
        <div className="grid grid-cols-12 gap-4 lg:gap-6 h-full overflow-hidden">
            
            {/* --- COLUMN 1: INFLOW --- */}
            <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 lg:gap-6 h-full overflow-y-auto custom-scrollbar pr-1">
                <KPICard 
                    title="Tổng lượt tiếp đón" 
                    value="342" 
                    subtext="Hôm nay"
                    trend={12.5}
                    icon={<UserGroupIcon/>} 
                    color="text-blue-500"
                />
                <KPICard 
                    title="Đang chờ khám" 
                    value="45" 
                    subtext="Thời gian chờ TB: 25p"
                    trend={-5}
                    icon={<ClockIcon/>} 
                    color="text-yellow-500"
                />
                <KPICard 
                    title="Cấp cứu (24h)" 
                    value="28" 
                    subtext="3 ca nặng đang xử lý"
                    icon={<ActivityIcon/>} 
                    color="text-red-500"
                />

                {/* Chart: Patient Flow */}
                <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex-1 min-h-[300px] flex flex-col shadow-lg dark:shadow-none">
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-4 tracking-wider">Lưu lượng Bệnh nhân</h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={mockPatientFlow}>
                                <defs>
                                    <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                <XAxis dataKey="time" tick={{fill: axisColor, fontSize: 10}} axisLine={false} tickLine={false} interval={1} />
                                <YAxis tick={{fill: axisColor, fontSize: 10}} axisLine={false} tickLine={false} width={25} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: tooltipBg, borderColor: gridColor, fontSize: '12px', borderRadius: '8px', color: tooltipText }}
                                    itemStyle={{ color: tooltipText }}
                                />
                                <Area type="monotone" dataKey="in" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorIn)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* --- COLUMN 2: OPERATIONS --- */}
            <div className="col-span-12 lg:col-span-6 flex flex-col gap-4 lg:gap-6 h-full overflow-y-auto custom-scrollbar px-1">
                {/* Bed Capacity Map */}
                <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-none transition-all">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase flex items-center gap-2">
                            <HospitalIcon className="w-5 h-5 text-indigo-500"/> Công suất Giường bệnh
                        </h3>
                        <span className="text-xs font-bold bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300">Tổng: 180 Giường</span>
                    </div>
                    <BedHeatmap data={mockBedCapacity} />
                </div>

                {/* Operating Rooms */}
                <div className="flex-1 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-none flex flex-col transition-all">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase mb-4 flex items-center gap-2">
                        <ActivityIcon className="w-5 h-5 text-green-600 dark:text-green-500"/> Trạng thái Phòng mổ
                    </h3>
                    <div className="flex-1">
                        <ORStatusBoard data={mockORStatus} />
                    </div>
                </div>

                {/* Waiting Times Heatmap */}
                <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-none transition-all">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase mb-4">Thời gian chờ trung bình (Phút)</h3>
                    <div className="grid grid-cols-5 gap-2">
                        {mockWaitingTimes.map((w, idx) => (
                            <div key={idx} className="flex flex-col items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700/50">
                                <div className={`text-2xl font-black ${w.status === 'warning' ? 'text-yellow-500' : 'text-blue-600 dark:text-blue-500'}`}>{w.wait}</div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 text-center mt-1 font-bold uppercase">{w.area}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- COLUMN 3: FINANCE & ALERTS --- */}
            <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 lg:gap-6 h-full overflow-y-auto custom-scrollbar pl-1">
                {/* Revenue Card */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-indigo-900 dark:to-slate-900 p-6 rounded-xl border border-blue-500/30 dark:border-indigo-500/30 shadow-xl relative overflow-hidden text-white">
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 dark:bg-indigo-500/20 rounded-full blur-3xl"></div>
                    <h3 className="text-blue-100 dark:text-indigo-300 font-bold text-xs uppercase mb-2">Doanh thu tạm tính</h3>
                    <p className="text-4xl font-black text-white tracking-tight">1.2 Tỷ <span className="text-lg text-blue-200 dark:text-indigo-400 font-normal">VNĐ</span></p>
                    <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] text-blue-200 dark:text-slate-400 uppercase">Bảo hiểm</p>
                            <p className="font-bold text-white">850M</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-blue-200 dark:text-slate-400 uppercase">Dịch vụ</p>
                            <p className="font-bold text-white">350M</p>
                        </div>
                    </div>
                </div>

                {/* Alerts Feed */}
                <div className="flex-1 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col min-h-[300px] shadow-lg dark:shadow-none transition-all">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase mb-4 flex items-center gap-2">
                        <ExclamationCircleIcon className="w-5 h-5 text-red-500"/> Cảnh báo & Thông báo
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                        {mockAlerts.map((alert) => (
                            <div key={alert.id} className={`p-3 rounded-lg border-l-4 text-xs shadow-sm ${
                                alert.type === 'critical' ? 'bg-red-50 border-red-500 text-red-800 dark:bg-red-900/20 dark:text-red-200' :
                                alert.type === 'warning' ? 'bg-yellow-50 border-yellow-500 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200' :
                                'bg-blue-50 border-blue-500 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200'
                            }`}>
                                <div className="flex justify-between font-bold mb-1 opacity-80">
                                    <span className="uppercase">{alert.type}</span>
                                    <span>{alert.time}</span>
                                </div>
                                <p className="font-medium">{alert.msg}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GeneralLayout;
