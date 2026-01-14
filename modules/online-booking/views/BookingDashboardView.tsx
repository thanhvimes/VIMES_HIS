
import React from 'react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';
import { 
    CalendarIcon, 
    CheckCircleIcon, 
    ClockIcon, 
    TrendingUpIcon, 
    UserGroupIcon,
    // Replaced non-existent GlobeAltIcon with GlobeIcon
    GlobeIcon,
    ExclamationCircleIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';

const data = [
    { name: 'T2', value: 12 }, { name: 'T3', value: 19 }, { name: 'T4', value: 15 },
    { name: 'T5', value: 22 }, { name: 'T6', value: 30 }, { name: 'T7', value: 25 }, { name: 'CN', value: 18 },
];

const BookingDashboardView: React.FC = () => {
    return (
        <div className="h-full space-y-6 animate-fade-in overflow-y-auto custom-scrollbar pb-10">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Thống kê Đăng ký Online</h1>
                    <p className="text-slate-500 mt-1 font-medium">Giám sát lượt đặt lịch từ các kênh trực tuyến tập trung.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between h-40 group hover:shadow-xl transition-all">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg group-hover:scale-110 transition-transform"><UserGroupIcon className="w-6 h-6"/></div>
                        <span className="text-[10px] font-black text-emerald-600 bg-green-50 px-2 py-1 rounded-full">+15%</span>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tổng đăng ký</p>
                        <h3 className="text-3xl font-black text-slate-800 dark:text-white">540 <span className="text-sm font-normal text-slate-400">ca</span></h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between h-40 group hover:shadow-xl transition-all">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-orange-500 text-white rounded-2xl shadow-lg group-hover:scale-110 transition-transform"><ClockIcon className="w-6 h-6"/></div>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Chờ xác nhận</p>
                        <h3 className="text-3xl font-black text-orange-600">12 <span className="text-sm font-normal text-slate-400">phiếu</span></h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between h-40 group hover:shadow-xl transition-all">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg group-hover:scale-110 transition-transform"><CheckCircleIcon className="w-6 h-6"/></div>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hoàn tất thủ tục</p>
                        <h3 className="text-3xl font-black text-emerald-600">425 <span className="text-sm font-normal text-slate-400">BN</span></h3>
                    </div>
                </div>

                <div className="bg-indigo-600 p-6 rounded-3xl shadow-lg flex flex-col justify-between h-40 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-150 transition-transform"></div>
                     {/* Replaced non-existent GlobeAltIcon with GlobeIcon */}
                     <div className="p-3 bg-white/20 text-white rounded-2xl w-fit"><GlobeIcon className="w-6 h-6"/></div>
                     <div className="relative z-10">
                        <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Nguồn Portal</p>
                        <h3 className="text-3xl font-black text-white">82% <span className="text-sm font-normal opacity-70">Traffic</span></h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col min-h-[400px]">
                    <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2 mb-8">
                        <TrendingUpIcon className="w-5 h-5 text-blue-600"/> Tăng trưởng lượt đăng ký tuần
                    </h3>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                             <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} fill="url(#colorVal)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-sm mb-6">Trạng thái xác thực SĐT</h3>
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center font-bold">95%</div>
                            <div>
                                <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200 leading-tight">Thành công</h4>
                                <p className="text-xs text-slate-400">Số lượng BN xác thực OTP chuẩn</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center font-bold">5%</div>
                            <div>
                                <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200 leading-tight">Hủy / Sai số</h4>
                                <p className="text-xs text-slate-400">Bệnh nhân nhập sai hoặc không nghe máy</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-10 p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700">
                         <h4 className="text-[10px] font-black text-slate-400 uppercase mb-3">Lưu ý hôm nay</h4>
                         <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">"Khoa Nhi đang có lượng đặt lịch vượt 150% công suất khung giờ 9h-10h. Đề xuất nhân viên Call-Center điều hướng sang buổi chiều."</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingDashboardView;