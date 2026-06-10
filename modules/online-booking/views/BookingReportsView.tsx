
import React, { useState, useMemo, useEffect } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import {
    ChartBarIcon,
    RefreshIcon,
    DocumentArrowDownIcon,
    PrinterIcon,
    GlobeIcon,
    UserGroupIcon,
    CheckCircleIcon,
    XCircleIcon,
    TrendingUpIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { bookingService, BookingStatistics } from '../../../services/bookingService';
import { FormDateInput } from '../../../components/ui/forms';

const BookingReportsView: React.FC = () => {
    const { fontSettings, theme } = useTheme();
    const isDark = theme === 'dark';

    // States
    const [dateRange, setDateRange] = useState({
        from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
    });
    const [stats, setStats] = useState<BookingStatistics | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const loadStats = async () => {
        setIsLoading(true);
        try {
            // Updated to match bookingService method name and parameter structure
            const data = await bookingService.getBookingStatistics({
                fromDate: dateRange.from,
                toDate: dateRange.to
            });
            setStats(data);
        } catch (error) {
            console.error("Lỗi tải thống kê:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, [dateRange.from, dateRange.to]);

    const KPICard = ({ title, value, subtext, icon: Icon, color, trend }: any) => (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between group hover:shadow-lg transition-all duration-300">
            <div className="flex justify-between items-start">
                <div className={`p-3 rounded-2xl ${color} text-white shadow-lg`}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend !== undefined && (
                    <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${trend >= 0 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-rose-600 bg-rose-50 dark:bg-rose-900/20'}`}>
                        {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                    </span>
                )}
            </div>
            <div className="mt-4">
                <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest">{title}</p>
                <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1">{value}</h3>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">{subtext}</p>
            </div>
        </div>
    );

    if (!stats && isLoading) {
        return <div className="h-full flex items-center justify-center text-slate-500 italic">Đang tổng hợp số liệu...</div>;
    }

    // Helper to format date from YYYY-MM-DD to DD-MM-YYYY for display
    const formatDateDisplay = (dateStr: string) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        return `${d}-${m}-${y}`;
    };

    return (
        <div className="h-full flex flex-col gap-6 animate-fade-in pb-10">
            {/* Header & Global Filters */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg">
                        <ChartBarIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Báo cáo Đăng ký Online</h1>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Phân tích hiệu quả kênh đặt lịch</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase ml-1">Khoảng ngày (DD-MM-YYYY)</span>
                        <div className="flex items-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-1">
                            <FormDateInput
                                value={dateRange.from}
                                onChange={e => setDateRange({ ...dateRange, from: e.target.value })}
                                containerClassName="flex-grow"
                                className="bg-transparent text-xs font-bold p-1.5 outline-none date-input-picker w-24 text-center !border-none !focus:ring-0"
                            />
                            <span className="text-slate-400 mx-1">-</span>
                            <FormDateInput
                                value={dateRange.to}
                                onChange={e => setDateRange({ ...dateRange, to: e.target.value })}
                                containerClassName="flex-grow"
                                className="bg-transparent text-xs font-bold p-1.5 outline-none date-input-picker w-24 text-center !border-none !focus:ring-0"
                            />
                        </div>
                    </div>
                    <button
                        onClick={loadStats}
                        disabled={isLoading}
                        className="p-2.5 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-600 hover:bg-white transition shadow-sm self-end mb-1"
                    >
                        <RefreshIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow-lg flex items-center gap-2 transition active:scale-95 self-end mb-1">
                        <DocumentArrowDownIcon className="w-4 h-4" /> Xuất Báo Cáo
                    </button>
                </div>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="Tổng lượt đăng ký" value={stats?.kpis.total.toLocaleString()} subtext="Trong kỳ báo cáo" icon={UserGroupIcon} color="bg-blue-600" trend={stats?.kpis.growth} />
                <KPICard title="Lượt Chờ Duyệt" value={stats?.kpis.pending?.toLocaleString() || '0'} subtext="Cần xử lý ngay" icon={RefreshIcon} color="bg-amber-500" />
                <KPICard title="Tỷ lệ Duyệt" value={`${((stats?.kpis.approved || 0) / (stats?.kpis.total || 1) * 100).toFixed(1)}%`} subtext={`${stats?.kpis.approved} ca đã duyệt`} icon={CheckCircleIcon} color="bg-emerald-600" />
                <KPICard title="Lượt Hủy" value={stats?.kpis.rejected.toLocaleString()} subtext={`Tỷ lệ ${((stats?.kpis.rejected || 0) / (stats?.kpis.total || 1) * 100).toFixed(1)}%`} icon={XCircleIcon} color="bg-rose-500" />
            </div>

            {/* Charts Section 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col min-h-[400px]">
                    <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-sm mb-8 flex items-center gap-2">
                        <TrendingUpIcon className="w-5 h-5 text-blue-600" /> Biểu đồ xu hướng đăng ký (Lần khám/Ngày)
                    </h3>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats?.trends}>
                                <defs>
                                    <linearGradient id="colorB" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorA" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', backgroundColor: isDark ? '#1e293b' : '#fff' }}
                                />
                                <Area type="monotone" dataKey="bookings" name="Đăng ký" stroke="#3b82f6" strokeWidth={3} fill="url(#colorB)" />
                                <Area type="monotone" dataKey="arrived" name="Đã đến" stroke="#10b981" strokeWidth={3} fill="url(#colorA)" />
                                <Legend verticalAlign="top" align="right" iconType="circle" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                    <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-sm mb-8 flex items-center gap-2">
                        <GlobeIcon className="w-5 h-5 text-teal-600" /> Cơ cấu nguồn đăng ký
                    </h3>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats?.sources}
                                    cx="50%"
                                    cy="45%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats?.sources?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Nhận xét:</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 italic">Dữ liệu phân tích dựa trên lịch hẹn đăng ký thành công qua các kênh.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col lg:col-span-1">
                    <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-sm mb-8">Lượt khám theo Chuyên khoa</h3>
                    <div className="flex-1 h-64 overflow-auto">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats?.specialities} layout="vertical" margin={{ left: -20, right: 30 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} width={100} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="value" fill="#0d9488" radius={[0, 4, 4, 0]} barSize={15} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                        <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-sm">Bảng tổng hợp chi tiết theo ngày</h3>
                        <button className="text-blue-600 font-bold text-xs flex items-center gap-1 hover:underline"><PrinterIcon className="w-3.5 h-3.5" /> In bảng kê</button>
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className={`w-full text-left border-collapse ${fontSettings.listSecondary}`}>
                            <thead className="bg-white dark:bg-slate-800 text-slate-400 text-[9px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-700 sticky top-0 z-10">
                                <tr>
                                    <th className="p-4">Ngày (DD-MM-YYYY)</th>
                                    <th className="p-4 text-center">Lượt ĐK</th>
                                    <th className="p-4 text-center">Đã Đến</th>
                                    <th className="p-4 text-center">Tỷ lệ C.Đổi</th>
                                    <th className="p-4 text-right">Doanh thu dự kiến</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                                {stats?.trends?.map((row, i) => (
                                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="p-4 font-bold text-slate-700 dark:text-slate-300">{row.name}</td>
                                        <td className="p-4 text-center font-bold text-blue-600">{row.bookings}</td>
                                        <td className="p-4 text-center text-emerald-600 font-bold">{row.arrived}</td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-12 bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                                    <div className="bg-indigo-500 h-full" style={{ width: `${row.bookings > 0 ? Math.round((row.arrived / row.bookings) * 100) : 0}%` }}></div>
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-500">{row.bookings > 0 ? Math.round((row.arrived / row.bookings) * 100) : 0}%</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right font-black text-slate-800 dark:text-white">{(row.arrived * 350000).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingReportsView;
