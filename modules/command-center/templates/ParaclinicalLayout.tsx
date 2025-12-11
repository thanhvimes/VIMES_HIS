
import React from 'react';
import { 
    BeakerIcon, 
    PhotographIcon, 
    ActivityIcon, 
    ClockIcon, 
    ExclamationCircleIcon,
    CheckBadgeIcon,
    ServerStackIcon
} from '../../../components/Icons';
import { KPICard } from '../components/Widgets';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
import { useTheme } from '../../../contexts/ThemeContext';

// --- MOCK DATA ---

// 1. Volume by Department
const volumeData = [
    { name: 'Xét nghiệm (LIS)', requests: 450, color: '#3b82f6' }, // Blue
    { name: 'Chẩn đoán HA (PACS)', requests: 120, color: '#8b5cf6' }, // Purple
    { name: 'Thăm dò CN', requests: 45, color: '#f59e0b' }, // Amber
];

// 2. Turnaround Time (TAT) Performance
// TAT chuẩn: XN < 90p, XQ < 30p, MRI < 120p
const tatPerformance = [
    { name: 'Huyết học', avgTat: 45, target: 60, status: 'ok' },
    { name: 'Sinh hóa', avgTat: 85, target: 90, status: 'warning' },
    { name: 'Miễn dịch', avgTat: 110, target: 120, status: 'ok' },
    { name: 'X-Quang', avgTat: 20, target: 30, status: 'ok' },
    { name: 'CT-Scanner', avgTat: 55, target: 45, status: 'danger' }, // Vượt ngưỡng
    { name: 'MRI', avgTat: 100, target: 120, status: 'ok' },
    { name: 'Nội soi', avgTat: 40, target: 40, status: 'warning' },
];

// 3. Machine Status (Director View - High Value Assets)
const criticalMachines = [
    { name: 'MRI 1.5T GE', dept: 'CĐHA', status: 'Running', load: '95%' },
    { name: 'CT 128 Slice', dept: 'CĐHA', status: 'Running', load: '82%' },
    { name: 'Cobas 8000', dept: 'Xét nghiệm', status: 'Running', load: '98%' },
    { name: 'Sysmex XN-1000', dept: 'Xét nghiệm', status: 'Maintenance', load: '0%' }, // Down
    { name: 'Nội soi Olympus', dept: 'TDCN', status: 'Running', load: '60%' },
];

// 4. Critical Results (Panic Values)
const panicValues = [
    { id: 'R01', patient: 'Nguyễn Văn A', test: 'Kali máu', value: '6.5 mmol/L', time: '10:05', dept: 'Sinh hóa' },
    { id: 'R02', patient: 'Lê Thị B', test: 'Troponin T', value: 'High', time: '09:45', dept: 'Miễn dịch' },
];

const ParaclinicalLayout: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const textColor = isDark ? '#e2e8f0' : '#1e293b';
    const gridColor = isDark ? '#334155' : '#e2e8f0';

    return (
        <div className="grid grid-cols-12 gap-4 lg:gap-6 h-full overflow-hidden">
            
            {/* --- TOP ROW: STRATEGIC KPIs (4 cols) --- */}
            <div className="col-span-12 grid grid-cols-1 md:grid-cols-4 gap-4 h-fit shrink-0">
                <KPICard 
                    title="Tổng chỉ định" 
                    value="615" 
                    subtext="Trong ngày hôm nay"
                    trend={8.2}
                    icon={<div className="font-bold text-lg">CLS</div>} 
                    color="text-blue-600"
                />
                <KPICard 
                    title="TAT Trung bình" 
                    value="42p" 
                    subtext="Thời gian trả kết quả"
                    trend={-2.5} // Negative trend in TAT is Good (faster)
                    icon={<ClockIcon/>} 
                    color="text-green-600"
                />
                <KPICard 
                    title="Kết quả Báo động" 
                    value="2" 
                    subtext="Panic Values cần xử lý"
                    icon={<ExclamationCircleIcon/>} 
                    color="text-red-600"
                />
                <KPICard 
                    title="Công suất Thiết bị" 
                    value="85%" 
                    subtext="Tải trung bình toàn viện"
                    icon={<ServerStackIcon/>} 
                    color="text-purple-600"
                />
            </div>

            {/* --- MIDDLE ROW: VOLUME & TAT ANALYSIS --- */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-6 overflow-hidden">
                
                {/* 1. Volume Distribution */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm h-1/2 flex flex-col">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-2 uppercase text-sm flex items-center gap-2">
                        <CheckBadgeIcon className="w-5 h-5 text-indigo-500"/> Tỷ trọng Chỉ định theo Khoa
                    </h3>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={volumeData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={gridColor}/>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={120} tick={{fill: textColor, fontSize: 12, fontWeight: 500}} axisLine={false} tickLine={false}/>
                                <Tooltip 
                                    cursor={{fill: 'transparent'}}
                                    contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: gridColor, borderRadius: '8px' }}
                                />
                                <Bar dataKey="requests" name="Số lượng" radius={[0, 4, 4, 0]} barSize={24} label={{ position: 'right', fill: textColor, fontSize: 12 }}>
                                    {volumeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. TAT Analysis */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm h-1/2 flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 uppercase text-sm flex items-center gap-2">
                            <ClockIcon className="w-5 h-5 text-orange-500"/> Giám sát TAT (Thời gian trả KQ)
                        </h3>
                        <div className="flex gap-4 text-xs font-medium">
                            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Đạt</div>
                            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Chậm</div>
                        </div>
                    </div>
                    <div className="flex-1 min-h-0">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={tatPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor}/>
                                <XAxis dataKey="name" tick={{fill: textColor, fontSize: 11}} axisLine={false} tickLine={false} interval={0}/>
                                <YAxis tick={{fill: textColor, fontSize: 11}} axisLine={false} tickLine={false}/>
                                <Tooltip 
                                    cursor={{fill: 'transparent'}}
                                    contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: gridColor, borderRadius: '8px' }}
                                />
                                <ReferenceLine y={0} stroke="#000" />
                                <Bar dataKey="avgTat" name="Thực tế (phút)" radius={[4, 4, 0, 0]} barSize={20}>
                                    {tatPerformance.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.status === 'danger' ? '#ef4444' : entry.status === 'warning' ? '#f59e0b' : '#22c55e'} />
                                    ))}
                                </Bar>
                                {/* Target Line Visualization could be added here, but simple bars color coded is clearer for dashboard */}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

            {/* --- RIGHT COLUMN: STATUS & ALERTS --- */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 h-full overflow-hidden">
                
                {/* 1. Critical Results (Panic Values) */}
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-xl p-4 shadow-sm flex-shrink-0">
                    <h3 className="font-bold text-red-700 dark:text-red-400 uppercase text-sm mb-3 flex items-center gap-2">
                        <ExclamationCircleIcon className="w-5 h-5 animate-pulse"/> Báo động đỏ (Panic Values)
                    </h3>
                    <div className="space-y-2">
                        {panicValues.map(p => (
                            <div key={p.id} className="bg-white dark:bg-slate-800 p-3 rounded-lg border-l-4 border-red-500 shadow-sm flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-slate-800 dark:text-white text-sm">{p.patient}</div>
                                    <div className="text-xs text-slate-500">{p.test}: <span className="font-bold text-red-600">{p.value}</span></div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-bold text-slate-400">{p.time}</div>
                                    <div className="text-[10px] uppercase text-slate-500">{p.dept}</div>
                                </div>
                            </div>
                        ))}
                        {panicValues.length === 0 && <div className="text-center text-sm text-slate-500 italic">Không có kết quả báo động.</div>}
                    </div>
                </div>

                {/* 2. Machine Status Monitor */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex-1 shadow-sm overflow-hidden flex flex-col">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 uppercase text-sm mb-4 flex items-center gap-2">
                        <ServerStackIcon className="w-5 h-5 text-blue-500"/> Trạng thái Thiết bị Chính
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                        {criticalMachines.map((m, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700">
                                <div>
                                    <div className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                                        {m.status === 'Running' ? <div className="w-2 h-2 rounded-full bg-green-500"></div> : <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>}
                                        {m.name}
                                    </div>
                                    <div className="text-xs text-slate-500">{m.dept}</div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-sm font-bold ${m.status === 'Running' ? 'text-green-600' : 'text-red-600'}`}>
                                        {m.status === 'Running' ? m.load : 'OFF'}
                                    </div>
                                    <div className="text-[10px] text-slate-400 uppercase">Tải</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ParaclinicalLayout;
