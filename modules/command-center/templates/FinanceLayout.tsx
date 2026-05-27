
import React from 'react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
    CurrencyDollarIcon, 
    CreditCardIcon, 
    DocumentTextIcon, 
    TrendingUpIcon,
    ClockIcon
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
    { time: '15:00', total: 1200, insurance: 850, service: 350 },
];

const revenueByDept = [
    { name: 'CĐHA', value: 350 },
    { name: 'Xét nghiệm', value: 280 },
    { name: 'Dược', value: 450 },
    { name: 'Khám bệnh', value: 120 },
    { name: 'Nội trú', value: 500 },
];

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];

interface FinanceLayoutProps {
    liveData?: {
        revenue: number;
    }
}

const FinanceLayout: React.FC<FinanceLayoutProps> = ({ liveData }) => {
    const { theme } = useTheme();
    
    const gridColor = theme === 'dark' ? 'rgba(148, 163, 184, 0.1)' : 'rgba(100, 116, 139, 0.1)';
    const axisColor = theme === 'dark' ? '#64748b' : '#94a3b8';
    const tooltipBg = theme === 'dark' ? '#0f172a' : '#ffffff';

    return (
        <div className="grid grid-cols-12 gap-6 h-full overflow-hidden">
            
            {/* --- TOP ROW: FINANCIAL KPIs --- */}
            <div className="col-span-12 grid grid-cols-1 md:grid-cols-4 gap-6">
                <KPICard 
                    title="Doanh thu ngày" 
                    value={`${liveData?.revenue || "1.2"} Tỷ`} 
                    subtext="Đạt 85% mục tiêu"
                    trend={12.4}
                    icon={<CurrencyDollarIcon/>} 
                    color="text-emerald-500"
                />
                <KPICard 
                    title="Chờ thanh toán" 
                    value="145 Tr" 
                    subtext="32 BN đang xử lý"
                    icon={<ClockIcon/>} 
                    color="text-amber-500"
                />
                <KPICard 
                    title="BHYT Ước tính" 
                    value="850 Tr" 
                    subtext="Khoảng 70% tổng thu"
                    icon={<DocumentTextIcon/>} 
                    color="text-blue-500"
                />
                <KPICard 
                    title="Thực thu quầy" 
                    value="350 Tr" 
                    subtext="Tiền mặt & Chuyển khoản"
                    icon={<CreditCardIcon/>} 
                    color="text-indigo-500"
                />
            </div>

            {/* --- MIDDLE ROW: CHARTS --- */}
            <div className="col-span-12 lg:col-span-8 bg-white dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 flex flex-col shadow-sm">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase flex items-center gap-2">
                        <TrendingUpIcon className="w-5 h-5 text-emerald-500"/> Diễn biến Doanh thu (Real-time)
                    </h3>
                    <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest">
                        <span className="flex items-center gap-1.5 text-emerald-500">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Bảo hiểm
                        </span>
                        <span className="flex items-center gap-1.5 text-blue-500">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span> Dịch vụ
                        </span>
                    </div>
                </div>
                <div className="flex-1 w-full min-h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueTrend}>
                            <defs>
                                <linearGradient id="colorIns" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorSvc" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                            <XAxis dataKey="time" tick={{fill: axisColor, fontSize: 10, fontWeight: 700}} axisLine={false} tickLine={false} />
                            <YAxis tick={{fill: axisColor, fontSize: 10, fontWeight: 700}} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}M`} width={35} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: tooltipBg, borderColor: 'rgba(148, 163, 184, 0.2)', fontSize: '11px', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                            />
                            <Area type="monotone" dataKey="insurance" stackId="1" stroke="#10b981" strokeWidth={3} fill="url(#colorIns)" name="Bảo hiểm" />
                            <Area type="monotone" dataKey="service" stackId="1" stroke="#3b82f6" strokeWidth={3} fill="url(#colorSvc)" name="Dịch vụ" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* --- RIGHT COLUMN: DEPT BREAKDOWN --- */}
            <div className="col-span-12 lg:col-span-4 bg-white dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 flex flex-col shadow-sm">
                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase mb-6">Cơ cấu doanh thu theo Khoa</h3>
                <div className="flex-1 min-h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={revenueByDept}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={90}
                                paddingAngle={8}
                                dataKey="value"
                            >
                                {revenueByDept.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ backgroundColor: tooltipBg, borderColor: 'rgba(148, 163, 184, 0.2)', fontSize: '11px', borderRadius: '12px' }}
                            />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                
                {/* Ranking Table */}
                <div className="mt-8 space-y-4">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Xếp hạng doanh thu</h4>
                     <div className="space-y-3">
                         {[...revenueByDept].sort((a,b) => b.value - a.value).map((dept, idx) => (
                             <div key={idx} className="flex justify-between items-center group p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                                 <div className="flex items-center gap-3">
                                     <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] ${
                                         idx === 0 ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                     }`}>
                                         {idx+1}
                                     </div>
                                     <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{dept.name}</span>
                                 </div>
                                 <span className="text-xs font-black text-slate-900 dark:text-white">{dept.value} Tr</span>
                             </div>
                         ))}
                     </div>
                </div>
            </div>
        </div>
    );
};

export default FinanceLayout;
