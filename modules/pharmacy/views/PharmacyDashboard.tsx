
import React from 'react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';
import { 
    ArchiveIcon, BellIcon, CurrencyDollarIcon, CheckCircleIcon, 
    ClockIcon, ExclamationCircleIcon, TrendingUpIcon, TruckIcon,
    ClipboardListIcon, RefreshIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';

const dataRevenue = [
    { name: 'T2', value: 120 }, { name: 'T3', value: 150 }, { name: 'T4', value: 130 },
    { name: 'T5', value: 180 }, { name: 'T6', value: 210 }, { name: 'T7', value: 190 }, { name: 'CN', value: 160 },
];

const StatCard = ({ title, value, sub, icon: Icon, color, trend }: any) => (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between group hover:shadow-xl transition-all duration-300">
        <div className="flex justify-between items-start">
            <div className={`p-3 rounded-2xl ${color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6"/>
            </div>
            {trend && (
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase">+{trend}%</span>
            )}
        </div>
        <div className="mt-4">
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest">{title}</p>
            <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1 tracking-tight">{value}</h3>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">{sub}</p>
        </div>
    </div>
);

const PharmacyDashboard: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className="h-full space-y-6 overflow-y-auto custom-scrollbar pr-1 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Trung tâm Quản lý Dược</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Giám sát tồn kho, cung ứng và an toàn sử dụng thuốc thời gian thực.</p>
                </div>
                <div className="flex gap-2 bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-xs shadow-md">Tổng quan</button>
                    <button className="px-4 py-2 text-slate-500 dark:text-slate-400 font-bold text-xs hover:bg-slate-50">Chi tiết kho</button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Giá trị kho tịnh" value="4.2 Tỷ" sub="Đã trừ khấu hao" icon={CurrencyDollarIcon} color="bg-blue-600" trend="2.4" />
                <StatCard title="Đơn thuốc chờ" value="18 ca" sub="Ưu tiên: 3 ca" icon={ClockIcon} color="bg-orange-500" />
                <StatCard title="Hết hạn (30 ngày)" value="12 mục" sub="Giá trị: 5.2 Tr" icon={ExclamationCircleIcon} color="bg-rose-500" />
                <StatCard title="Nhập kho (Tháng)" value="850 Tr" sub="15 chuyến hàng" icon={TruckIcon} color="bg-emerald-600" trend="15" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Revenue Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                            <TrendingUpIcon className="w-5 h-5 text-blue-600"/> Diễn biến xuất thuốc tuần qua
                        </h3>
                        <select className="bg-slate-100 dark:bg-slate-900 border-none rounded-xl text-[10px] font-black uppercase px-4 py-2 outline-none cursor-pointer">
                            <option>Theo doanh thu</option>
                            <option>Theo lượt cấp</option>
                        </select>
                    </div>
                    <div className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dataRevenue}>
                                <defs>
                                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                    cursor={{stroke: '#3b82f6', strokeWidth: 2}}
                                />
                                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorVal)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right Alerts Column */}
                <div className="flex flex-col gap-6">
                    {/* Inventory Alert */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-sm mb-4 flex items-center gap-2">
                            <BellIcon className="w-5 h-5 text-orange-500"/> Thuốc sắp hết định mức
                        </h3>
                        <div className="space-y-3">
                            {[
                                { name: 'Paracetamol 500mg', stock: 150, min: 500, color: 'bg-rose-500' },
                                { name: 'Augmentin 1g', stock: 12, min: 100, color: 'bg-orange-500' },
                                { name: 'Vitamin C 500mg', stock: 85, min: 200, color: 'bg-amber-500' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                    <div className={`w-2 h-10 rounded-full ${item.color}`}></div>
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-800 dark:text-white text-sm">{item.name}</p>
                                        <div className="flex justify-between mt-1">
                                            <span className="text-[10px] text-slate-500 uppercase font-bold">Tồn: {item.stock}</span>
                                            <span className="text-[10px] text-rose-600 font-black">Thiếu: {item.min - item.stock}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-5 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold text-xs rounded-2xl hover:bg-blue-100 transition">Lập dự trù ngay</button>
                    </div>

                    {/* Operational Summary */}
                    <div className="bg-indigo-600 rounded-[2.5rem] p-6 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                        <h3 className="font-black uppercase tracking-widest text-xs opacity-70 mb-4">Hoạt động trong ngày</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Phiếu nhập kho</span>
                                <span className="text-xl font-black">05</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Phiếu xuất thuốc</span>
                                <span className="text-xl font-black">124</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Lệnh điều chuyển</span>
                                <span className="text-xl font-black">02</span>
                            </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-white/20 flex items-center gap-2 text-xs font-bold">
                            <CheckCircleIcon className="w-4 h-4 text-emerald-300"/> Dữ liệu đồng bộ lúc 10:30
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PharmacyDashboard;
