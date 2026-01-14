
import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  CpuChipIcon, TruckIcon, ArchiveIcon, ExclamationCircleIcon, TrendingUpIcon, ClockIcon 
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';

const dataConsumption = [
    { name: 'T2', value: 45 }, { name: 'T3', value: 52 }, { name: 'T4', value: 48 },
    { name: 'T5', value: 61 }, { name: 'T6', value: 55 }, { name: 'T7', value: 67 }, { name: 'CN', value: 40 },
];

const StatCard = ({ title, value, sub, icon: Icon, color }: any) => (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between group hover:shadow-xl transition-all duration-300">
        <div className="flex justify-between items-start">
            <div className={`p-3 rounded-2xl ${color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6"/>
            </div>
        </div>
        <div className="mt-4">
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest">{title}</p>
            <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1 tracking-tight">{value}</h3>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">{sub}</p>
        </div>
    </div>
);

const SuppliesDashboard: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className="h-full space-y-6 overflow-y-auto custom-scrollbar pr-1 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Quản lý Vật tư Y tế</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Giám sát tiêu hao vật tư, trang thiết bị tiêu hao thời gian thực.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Giá trị tồn kho" value="2.8 Tỷ" sub="Vật tư & Hóa chất" icon={ArchiveIcon} color="bg-indigo-600" />
                <StatCard title="Yêu cầu lĩnh" value="8 phiếu" sub="Đang chờ xử lý" icon={ClockIcon} color="bg-orange-500" />
                <StatCard title="Dưới định mức" value="15 mục" sub="Cần nhập hàng gấp" icon={ExclamationCircleIcon} color="bg-rose-500" />
                <StatCard title="Tiêu hao/Tháng" value="450 Tr" sub="+5% so với tháng trước" icon={TrendingUpIcon} color="bg-emerald-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                    <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2 mb-8">
                        <CpuChipIcon className="w-5 h-5 text-indigo-600"/> Biểu đồ tiêu hao vật tư tuần qua
                    </h3>
                    <div className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dataConsumption}>
                                <defs>
                                    <linearGradient id="colorCons" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                                <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={4} fill="url(#colorCons)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-indigo-600 rounded-[2.5rem] p-6 text-white shadow-xl relative overflow-hidden">
                    <h3 className="font-black uppercase tracking-widest text-xs opacity-70 mb-4">Cung ứng hôm nay</h3>
                    <div className="space-y-6">
                        <div className="flex justify-between items-center border-b border-white/10 pb-4">
                            <span className="text-sm font-medium">Phiếu nhập vật tư</span>
                            <span className="text-2xl font-black">03</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/10 pb-4">
                            <span className="text-sm font-medium">Phiếu cấp cho khoa</span>
                            <span className="text-2xl font-black">42</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/10 pb-4">
                            <span className="text-sm font-medium">Báo hỏng dụng cụ</span>
                            <span className="text-2xl font-black text-orange-300">01</span>
                        </div>
                    </div>
                    <button className="w-full mt-8 py-3 bg-white text-indigo-600 font-bold text-sm rounded-2xl shadow-lg">Chi tiết xuất vật tư</button>
                </div>
            </div>
        </div>
    );
};

export default SuppliesDashboard;
