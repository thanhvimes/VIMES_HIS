
import React from 'react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
    CurrencyDollarIcon, 
    CreditCardIcon, 
    DocumentTextIcon, 
    TrendingUpIcon 
} from '../../../components/Icons';
import { KPICard } from '../components/Widgets';
import { useTheme } from '../../../contexts/ThemeContext';

// Mock Financial Data
const revenueTrend = [
    { time: '8:00', total: 120, insurance: 80, service: 40 },
    { time: '9:00', total: 250, insurance: 150, service: 100 },
    { time: '10:00', total: 400, insurance: 220, service: 180 },
    { time: '11:00', total: 550, insurance: 300, service: 250 },
    { time: '12:00', total: 600, insurance: 320, service: 280 },
    { time: '13:00', total: 720, insurance: 380, service: 340 },
    { time: '14:00', total: 850, insurance: 450, service: 400 },
    { time: '15:00', total: 1200, insurance: 850, service: 350 }, // Triệu VNĐ
];

const revenueByDept = [
    { name: 'CĐHA', value: 350 },
    { name: 'Xét nghiệm', value: 280 },
    { name: 'Dược', value: 450 },
    { name: 'Khám bệnh', value: 120 },
    { name: 'Nội trú', value: 500 },
];

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'];

const FinanceLayout: React.FC = () => {
    const { theme } = useTheme();
    
    // Theme configs
    const gridColor = theme === 'dark' ? '#334155' : '#e2e8f0';
    const axisColor = theme === 'dark' ? '#94a3b8' : '#64748b';
    const tooltipStyle = { 
        backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', 
        borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
        color: theme === 'dark' ? '#fff' : '#000'
    };

    return (
        <div className="grid grid-cols-12 gap-4 lg:gap-6 h-full overflow-hidden">
            
            {/* --- TOP ROW: FINANCIAL KPIs --- */}
            <div className="col-span-12 grid grid-cols-1 md:grid-cols-4 gap-4 flex-shrink-0">
                <KPICard 
                    title="Tổng Doanh thu (Real-time)" 
                    value="1.2 Tỷ" 
                    subtext="Đạt 85% mục tiêu ngày"
                    trend={8.4}
                    icon={<CurrencyDollarIcon/>} 
                    color="text-emerald-500"
                />
                <KPICard 
                    title="Chờ thanh toán" 
                    value="145 Tr" 
                    subtext="32 hóa đơn đang chờ"
                    icon={<ClockIcon/>} 
                    color="text-yellow-500"
                />
                <KPICard 
                    title="BHYT Ước tính" 
                    value="850 Tr" 
                    subtext="Chưa xuất XML"
                    icon={<DocumentTextIcon/>} 
                    color="text-blue-500"
                />
                <KPICard 
                    title="Thực thu (Tiền mặt)" 
                    value="350 Tr" 
                    subtext="Tại quầy thu ngân"
                    icon={<CreditCardIcon/>} 
                    color="text-purple-500"
                />
            </div>

            {/* --- MIDDLE ROW: CHARTS --- */}
            <div className="col-span-12 lg:col-span-8 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <TrendingUpIcon className="w-5 h-5 text-emerald-500"/> Diễn biến Doanh thu trong ngày
                    </h3>
                    <div className="flex gap-2 text-xs">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> BHYT</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Dịch vụ</span>
                    </div>
                </div>
                <div className="flex-1 w-full min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueTrend}>
                            <defs>
                                <linearGradient id="colorIns" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorSvc" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                            <XAxis dataKey="time" tick={{fill: axisColor, fontSize: 12}} axisLine={false} tickLine={false} />
                            <YAxis tick={{fill: axisColor, fontSize: 12}} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}Tr`} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Area type="monotone" dataKey="insurance" stackId="1" stroke="#10b981" fill="url(#colorIns)" name="Bảo hiểm" />
                            <Area type="monotone" dataKey="service" stackId="1" stroke="#3b82f6" fill="url(#colorSvc)" name="Dịch vụ" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* --- RIGHT COLUMN: DEPT BREAKDOWN --- */}
            <div className="col-span-12 lg:col-span-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 flex flex-col">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-2">Tỷ trọng Doanh thu</h3>
                <div className="flex-1 min-h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={revenueByDept}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {revenueByDept.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={tooltipStyle} />
                            <Legend wrapperStyle={{fontSize: '12px'}}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                
                {/* Top Performers List */}
                <div className="mt-4 border-t border-slate-100 dark:border-slate-700 pt-4">
                     <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Top Khoa/Phòng (Doanh thu)</h4>
                     <div className="space-y-3">
                         {/* FIX: Create a shallow copy using [...] before sorting to avoid mutating the read-only array */}
                         {[...revenueByDept].sort((a,b) => b.value - a.value).slice(0, 3).map((dept, idx) => (
                             <div key={idx} className="flex justify-between items-center text-sm">
                                 <div className="flex items-center gap-2">
                                     <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-xs">{idx+1}</span>
                                     <span className="text-slate-700 dark:text-slate-200">{dept.name}</span>
                                 </div>
                                 <span className="font-bold text-slate-800 dark:text-white">{dept.value} Tr</span>
                             </div>
                         ))}
                     </div>
                </div>
            </div>
        </div>
    );
};

// Icon Helper for this file
const ClockIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export default FinanceLayout;
