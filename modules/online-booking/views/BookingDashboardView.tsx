
import React, { useState, useEffect } from 'react';
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
import { bookingService, BookingStatistics } from '../../../services/bookingService';

const BookingDashboardView: React.FC = () => {
    const [statistics, setStatistics] = useState<BookingStatistics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStatistics = async () => {
            try {
                setLoading(true);
                setError(null);

                // Calculate date range (last 7 days)
                const toDate = new Date();
                const fromDate = new Date();
                fromDate.setDate(fromDate.getDate() - 7);

                const data = await bookingService.getBookingStatistics({
                    fromDate: fromDate.toISOString().split('T')[0],
                    toDate: toDate.toISOString().split('T')[0]
                });

                setStatistics(data);
            } catch (err: any) {
                console.error('Failed to fetch statistics:', err);
                setError(err.message || 'Không thể tải dữ liệu thống kê');
            } finally {
                setLoading(false);
            }
        };

        fetchStatistics();
    }, []);

    // Format trend data for chart (use day names)
    const chartData = statistics?.trends.map((trend, index) => {
        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        const date = new Date(trend.name);
        const dayName = dayNames[date.getDay()];
        return {
            name: dayName,
            value: trend.bookings
        };
    }) || [];

    // Calculate portal traffic percentage
    const portalSource = statistics?.sources.find(s => s.name === 'Web Portal' || s.name === 'Portal');
    const totalSources = statistics?.sources.reduce((sum, s) => sum + s.value, 0) || 1;
    const portalPercentage = portalSource ? Math.round((portalSource.value / totalSources) * 100) : 0;

    // Calculate verification success rate (mock for now - would need real data)
    const verificationSuccessRate = 95;
    const verificationFailRate = 5;

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-500">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <ExclamationCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600 font-semibold mb-2">Lỗi tải dữ liệu</p>
                    <p className="text-slate-500">{error}</p>
                </div>
            </div>
        );
    }

    if (!statistics) {
        return null;
    }

    return (
        <div className="h-full space-y-6 animate-fade-in overflow-y-auto custom-scrollbar pb-10">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Thống kê Đăng ký Online</h1>
                    <p className="text-slate-500 mt-1 font-medium">Giám sát lượt đặt lịch từ các kênh trực tuyến tập trung.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between h-40 hover-lift scale-in">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl shadow-lg transform transition-transform hover:scale-110"><UserGroupIcon className="w-6 h-6" /></div>
                        <span className="text-[10px] font-black text-emerald-600 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full animate-pulse-slow">
                            {statistics.kpis.growth > 0 ? '+' : ''}{statistics.kpis.growth.toFixed(1)}%
                        </span>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tổng đăng ký</p>
                        <h3 className="text-3xl font-black text-slate-800 dark:text-white">{statistics.kpis.total} <span className="text-sm font-normal text-slate-400">ca</span></h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between h-40 hover-lift scale-in" style={{ animationDelay: '0.1s' }}>
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl shadow-lg transform transition-transform hover:scale-110"><ClockIcon className="w-6 h-6" /></div>
                        <div className="pulse-glow rounded-full">
                            <span className="text-[10px] font-black text-orange-600 bg-orange-50 dark:bg-orange-900/30 px-2 py-1 rounded-full">Urgent</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Chờ xác nhận</p>
                        <h3 className="text-3xl font-black text-orange-600">{statistics.kpis.pending} <span className="text-sm font-normal text-slate-400">phiếu</span></h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between h-40 hover-lift scale-in" style={{ animationDelay: '0.2s' }}>
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-2xl shadow-lg transform transition-transform hover:scale-110"><CheckCircleIcon className="w-6 h-6" /></div>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hoàn tất thủ tục</p>
                        <h3 className="text-3xl font-black text-emerald-600">{statistics.kpis.arrived} <span className="text-sm font-normal text-slate-400">BN</span></h3>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 rounded-3xl shadow-lg flex flex-col justify-between h-40 relative overflow-hidden hover-lift scale-in" style={{ animationDelay: '0.3s' }}>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-150 transition-transform"></div>
                    <div className="p-3 bg-white/20 text-white rounded-2xl w-fit transform transition-transform hover:scale-110"><GlobeIcon className="w-6 h-6" /></div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Nguồn Portal</p>
                        <h3 className="text-3xl font-black text-white">{portalPercentage}% <span className="text-sm font-normal opacity-70">Traffic</span></h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col min-h-[400px]">
                    <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2 mb-8">
                        <TrendingUpIcon className="w-5 h-5 text-blue-600" /> Tăng trưởng lượt đăng ký tuần
                    </h3>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
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
                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center font-bold">{verificationSuccessRate}%</div>
                            <div>
                                <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200 leading-tight">Thành công</h4>
                                <p className="text-xs text-slate-400">Số lượng BN xác thực OTP chuẩn</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center font-bold">{verificationFailRate}%</div>
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
