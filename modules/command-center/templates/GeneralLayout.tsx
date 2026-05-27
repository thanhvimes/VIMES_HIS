
import React from 'react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { 
    UserGroupIcon, 
    ClockIcon, 
    ActivityIcon, 
    HospitalIcon, 
    ExclamationCircleIcon,
    ShieldCheckIcon,
    DatabaseIcon
} from '../../../components/Icons';
import { KPICard, BedHeatmap, ORStatusBoard, RealtimeLogFeed, ResourceGrid } from '../components/Widgets';
import { 
    mockBedCapacity, 
    mockPatientFlow, 
    mockORStatus, 
    mockWaitingTimes, 
    mockAlerts, 
    mockRealtimeLogs, 
    mockResources 
} from '../data';
import { useTheme } from '../../../contexts/ThemeContext';

import { BedCapacity, ORStatus, WaitTime } from '../../../services/commandCenterService';

interface GeneralLayoutProps {
    liveData?: {
        totalPatients: number;
        waiting: number;
        emergency: number;
        revenue: number;
        bedCapacity: BedCapacity[];
        orStatus: ORStatus[];
        waitTimes: WaitTime[];
    }
}

const GeneralLayout: React.FC<GeneralLayoutProps> = ({ liveData }) => {
    const { theme } = useTheme();
    
    const gridColor = theme === 'dark' ? 'rgba(148, 163, 184, 0.1)' : 'rgba(100, 116, 139, 0.1)';
    const axisColor = theme === 'dark' ? '#64748b' : '#94a3b8';
    const tooltipBg = theme === 'dark' ? '#0f172a' : '#ffffff';

    const bedData = (liveData?.bedCapacity || []).map(b => ({
        id: b.dept_code,
        name: b.dept_name,
        occupied: Number(b.occupied_beds),
        total: Number(b.total_beds),
        percent: Number(b.occupancy_rate),
        color: 'bg-indigo-500'
    }));

    const totalBeds = bedData.reduce((acc, curr) => acc + curr.total, 0);
    const occupiedBeds = bedData.reduce((acc, curr) => acc + curr.occupied, 0);
    const avgOccupancy = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    const orData = (liveData?.orStatus || []).map(or => ({
        id: or.or_id,
        name: or.or_name,
        status: or.status === 'IN_USE' ? 'In Use' : or.status === 'CLEANING' ? 'Cleaning' : 'Available',
        procedure: or.current_procedure || '--',
        surgeon: or.surgeon_name || '--',
        time: '01:30' // Tạm thời để mốc thời gian tĩnh
    }));

    // Quy trình chuẩn để hiển thị đầy đủ các bước trên biểu đồ
    const standardStages = [
        { key: 'Tiếp đón', label: 'Tiếp đón' },
        { key: 'Khám Nội', label: 'Khám chuyên khoa' },
        { key: 'Xét nghiệm', label: 'Xét nghiệm' },
        { key: 'Chẩn đoán hình ảnh', label: 'CĐ Hình ảnh' },
        { key: 'Dược BHYT', label: 'Phát thuốc/BHYT' }
    ];

    const waitData = standardStages.map(stage => {
        const realData = (liveData?.waitTimes || []).find(w => w.stage === stage.key);
        const value = realData ? Number(realData.avg_minutes) : 0;
        return {
            area: stage.label,
            wait: value,
            status: value > 45 ? 'critical' : value > 25 ? 'warning' : 'normal'
        };
    });

    return (
        <div className="grid grid-cols-12 gap-6 h-full overflow-hidden p-1">
            
            {/* --- LEFT COLUMN: METRICS & FLOW (3/12) --- */}
            <div className="col-span-12 lg:col-span-3 flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar pr-2 pb-4">
                <KPICard 
                    title="Tổng Tiếp Đón" 
                    value={liveData?.totalPatients || 0} 
                    subtext="Lượt đăng ký hôm nay"
                    trend={12.5}
                    icon={<UserGroupIcon/>} 
                    color="text-blue-500"
                />
                <KPICard 
                    title="Đang Chờ Khám" 
                    value={liveData?.waiting || 0} 
                    subtext="BN đang đợi tại các khoa"
                    trend={-5}
                    icon={<ClockIcon/>} 
                    color="text-amber-500"
                />
                <KPICard 
                    title="Ca Cấp Cứu" 
                    value={liveData?.emergency || 0} 
                    subtext="Duy trì mức độ ưu tiên"
                    icon={<ActivityIcon/>} 
                    color="text-rose-500"
                />

                {/* Patient Flow Chart */}
                <div className="bg-white dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700/50 p-5 flex flex-col min-h-[320px] shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Lưu lượng BN (24h)</h3>
                        <div className="flex gap-2">
                            <span className="flex items-center gap-1 text-[10px] font-bold text-blue-500">● Vào</span>
                            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">● Ra</span>
                        </div>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={mockPatientFlow}>
                                <defs>
                                    <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                <XAxis dataKey="time" tick={{fill: axisColor, fontSize: 9, fontWeight: 700}} axisLine={false} tickLine={false} />
                                <YAxis tick={{fill: axisColor, fontSize: 9, fontWeight: 700}} axisLine={false} tickLine={false} width={20} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: tooltipBg, borderColor: 'rgba(148, 163, 184, 0.2)', fontSize: '11px', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Area type="monotone" dataKey="in" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorIn)" />
                                <Area type="monotone" dataKey="out" stroke="#94a3b8" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* --- MIDDLE COLUMN: CORE OPERATIONS (6/12) --- */}
            <div className="col-span-12 lg:col-span-6 flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar px-2 pb-4">
                {/* Bed Capacity Section */}
                <div className="bg-white dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase flex items-center gap-2">
                            <HospitalIcon className="w-5 h-5 text-indigo-500"/> Công suất Giường bệnh
                        </h3>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <div className="text-[10px] text-slate-400 font-bold uppercase">Tổng khả dụng</div>
                                <div className="text-sm font-black dark:text-white">{totalBeds} Giường</div>
                            </div>
                            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
                            <div className="text-right">
                                <div className="text-[10px] text-rose-500 font-bold uppercase">Đang sử dụng</div>
                                <div className="text-sm font-black text-rose-500">{occupiedBeds} ({avgOccupancy}%)</div>
                            </div>
                        </div>
                    </div>
                    <BedHeatmap data={bedData} />
                </div>

                <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
                    {/* Operating Rooms */}
                    <div className="col-span-7 bg-white dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 shadow-sm flex flex-col h-[480px]">
                        <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase mb-6 flex items-center gap-2">
                            <ActivityIcon className="w-4 h-4 text-emerald-500"/> Trạng thái Phòng mổ
                        </h3>
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                            <ORStatusBoard data={orData} />
                        </div>
                    </div>

                    {/* Waiting Times Visualization */}
                    <div className="col-span-5 bg-white dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 shadow-sm flex flex-col h-[480px]">
                        <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase mb-6">Thời gian chờ TB (Phút)</h3>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={waitData} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                                    <XAxis type="number" hide />
                                    <YAxis 
                                        dataKey="area" 
                                        type="category" 
                                        tick={{fill: axisColor, fontSize: 10, fontWeight: 800}} 
                                        width={100} 
                                        axisLine={false} 
                                        tickLine={false} 
                                    />
                                    <Tooltip 
                                        cursor={{fill: 'rgba(148, 163, 184, 0.1)'}} 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '11px' }} 
                                    />
                                    <Bar dataKey="wait" radius={[0, 6, 6, 0]} barSize={28}>
                                        {waitData.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={entry.status === 'critical' ? '#ef4444' : entry.status === 'warning' ? '#f59e0b' : '#3b82f6'} 
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                            <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                                <span>Tiêu chuẩn: &lt; 20p</span>
                                <span className="text-rose-500">Quá tải: &gt; 45p</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- RIGHT COLUMN: RESOURCES & LOGS (3/12) --- */}
            <div className="col-span-12 lg:col-span-3 flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar pl-2">
                {/* Resources Status */}
                <div className="bg-indigo-600 dark:bg-indigo-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-4 flex items-center gap-2">
                        <DatabaseIcon className="w-4 h-4"/> Nguồn lực & Thiết bị
                    </h3>
                    <ResourceGrid resources={mockResources} />
                </div>

                {/* Real-time System Logs */}
                <div className="bg-white dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 flex-1 flex flex-col shadow-sm min-h-[350px]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase flex items-center gap-2">
                            <ShieldCheckIcon className="w-4 h-4 text-blue-500"/> Nhật ký vận hành
                        </h3>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] font-black text-slate-400">LIVE</span>
                        </span>
                    </div>
                    <div className="flex-1">
                        <RealtimeLogFeed logs={mockRealtimeLogs} />
                    </div>
                </div>

                {/* Quick Alerts Summary */}
                <div className="bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/30 p-4">
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-3">
                        <ExclamationCircleIcon className="w-4 h-4 animate-bounce"/>
                        <span className="text-[11px] font-black uppercase">Cảnh báo hệ thống</span>
                    </div>
                    <p className="text-xs text-rose-800 dark:text-rose-300 font-bold leading-relaxed">
                        {mockAlerts[0].msg}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GeneralLayout;
