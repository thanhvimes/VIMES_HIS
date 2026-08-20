// ==================== DASHBOARD OVERVIEW ====================
// File: modules/hospital-statistics/views/DashboardOverview.tsx

import React, { useState, useEffect } from 'react';
import { CommonFilter, PrintReportHeader, PrintReportFooter, exportTableToExcel, formatLocalDate, getStartOfMonthLocalDate } from '../components/CommonFilter';
import { statisticsService } from '../services/statisticsService';
import { ChartDayItem, TopDoctorItem, HospitalActivityData } from '../types';
import { 
    ResponsiveContainer, 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    Tooltip, 
    Legend, 
    CartesianGrid,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { 
    UserGroupIcon, 
    HeartIcon, 
    CurrencyDollarIcon, 
    BuildingOfficeIcon,
    SparklesIcon,
    ShieldCheckIcon
} from '../../../components/Icons';

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

export const DashboardOverview: React.FC = () => {
    // Default to today for immediate active preset
    const now = new Date();
    const [fromDate, setFromDate] = useState(`${formatLocalDate(now)} 00:00:00`);
    const [toDate, setToDate] = useState(`${formatLocalDate(now)} 23:59:59`);
    const [loading, setLoading] = useState(false);

    const [activity, setActivity] = useState<HospitalActivityData | null>(null);
    const [charts, setCharts] = useState<ChartDayItem[]>([]);
    const [topDoctors, setTopDoctors] = useState<TopDoctorItem[]>([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [actData, chartData, docData] = await Promise.all([
                statisticsService.getHospitalActivity(fromDate, toDate).catch(() => null),
                statisticsService.getDashboardCharts(fromDate, toDate).catch(() => []),
                statisticsService.getTopDoctors(fromDate, toDate).catch(() => [])
            ]);
            setActivity(actData);
            setCharts(chartData);
            setTopDoctors(docData);
        } catch (error) {
            console.error('Error fetching dashboard statistics:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleExport = () => {
        const rows = topDoctors.map((doc, idx) => ({
            'Hạng': idx + 1,
            'Mã Bác Sĩ': doc.doctor_id,
            'Họ và Tên Bác Sĩ': doc.doctor_name,
            'Tổng Số Lượt Khám': doc.total_visits
        }));
        exportTableToExcel(rows, 'Top_Bac_Si_Kham_Benh', 'Top Bác Sĩ');
    };

    // Calculate Ratios
    const tongKham = Number(activity?.examination?.tong_so || 0);
    const soBhyt = Number(activity?.examination?.so_bhyt || 0);
    const soDv = Number(activity?.examination?.so_dichvu || 0);
    const bhytRatio = tongKham > 0 ? ((soBhyt / tongKham) * 100).toFixed(1) : '0.0';

    const vaoVien = Number(activity?.inpatient?.vao_vien || 0);
    const dangDt = Number(activity?.inpatient?.dang_dieu_tri || 0);

    const phauThuatCa = activity?.surgery?.find(s => s.pttt_type === 'PHAU_THUAT');
    const thuThuatCa = activity?.surgery?.find(s => s.pttt_type === 'THU_THUAT');
    const tongPt = Number(phauThuatCa?.tong_so_ca || 0);
    const tongTt = Number(thuThuatCa?.tong_so_ca || 0);

    const maxDoctorVisits = topDoctors.length > 0 ? Number(topDoctors[0].total_visits || 1) : 1;

    // Distribution Data for Pie Chart
    const pieData = [
        { name: 'Khám BHYT', value: soBhyt },
        { name: 'Khám Viện Phí / DV', value: soDv },
        { name: 'BN Vào Nội Trú', value: vaoVien },
        { name: 'Phẫu thuật', value: tongPt },
        { name: 'Thủ thuật', value: Math.min(tongTt, 5000) } // Cap for visually balanced slice
    ].filter(item => item.value > 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <span>Bảng điều khiển Thống kê Bệnh viện</span>
                        <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full">
                            Live BI
                        </span>
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Báo cáo trực quan & chỉ số vận hành bệnh viện toàn diện theo thời gian thực
                    </p>
                </div>
            </div>

            {/* Print Header */}
            <PrintReportHeader 
                formCode="Biểu mẫu: 00/BC-BI"
                title="BÁO CÁO TỔNG HỢP CÁC CHỈ SỐ VẬN HÀNH BỆNH VIỆN"
                subtitle="Trung tâm Chỉ huy & Báo cáo Thống kê BI"
                fromDate={fromDate}
                toDate={toDate}
            />

            {/* Filter */}
            <CommonFilter
                fromDate={fromDate}
                toDate={toDate}
                onFromDateChange={setFromDate}
                onToDateChange={setToDate}
                onRefresh={fetchData}
                loading={loading}
                onExportExcel={handleExport}
                onPrint={() => window.print()}
            />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Card 1: Khám bệnh */}
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 via-white to-blue-50/50 dark:from-blue-950/40 dark:via-slate-800 dark:to-slate-800 rounded-2xl p-5 border border-blue-100 dark:border-blue-900/40 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Tổng Lượt Khám</p>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                                {tongKham.toLocaleString()}
                            </h3>
                        </div>
                        <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/30">
                            <UserGroupIcon className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                        <span className="text-slate-500">BHYT: <strong className="text-emerald-600">{soBhyt.toLocaleString()}</strong> ({bhytRatio}%)</span>
                        <span className="text-slate-500">DV: <strong className="text-amber-600">{soDv.toLocaleString()}</strong></span>
                    </div>
                </div>

                {/* Card 2: Nội trú */}
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500/10 via-white to-emerald-50/50 dark:from-emerald-950/40 dark:via-slate-800 dark:to-slate-800 rounded-2xl p-5 border border-emerald-100 dark:border-emerald-900/40 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Vào Viện Nội Trú</p>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                                {vaoVien.toLocaleString()}
                            </h3>
                        </div>
                        <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-500/30">
                            <HeartIcon className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Đang điều trị: <strong className="text-indigo-600">{dangDt.toLocaleString()}</strong> BN</span>
                        <span className="text-slate-500">Ra viện: <strong className="text-emerald-600">{Number(activity?.inpatient?.ra_vien || 0).toLocaleString()}</strong></span>
                    </div>
                </div>

                {/* Card 3: Phẫu thuật - Thủ thuật */}
                <div className="relative overflow-hidden bg-gradient-to-br from-purple-500/10 via-white to-purple-50/50 dark:from-purple-950/40 dark:via-slate-800 dark:to-slate-800 rounded-2xl p-5 border border-purple-100 dark:border-purple-900/40 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Phẫu thuật - Thủ thuật</p>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                                {(tongPt + tongTt).toLocaleString()}
                            </h3>
                        </div>
                        <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-lg shadow-purple-500/30">
                            <SparklesIcon className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Phẫu thuật: <strong className="text-purple-600">{tongPt.toLocaleString()}</strong> ca</span>
                        <span className="text-slate-500">Thủ thuật: <strong className="text-slate-700 dark:text-slate-300">{tongTt.toLocaleString()}</strong></span>
                    </div>
                </div>

                {/* Card 4: Chuyển viện & Quản trị */}
                <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-white to-amber-50/50 dark:from-amber-950/40 dark:via-slate-800 dark:to-slate-800 rounded-2xl p-5 border border-amber-100 dark:border-amber-900/40 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Chuyển Tuyến / Viện</p>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                                {Number(activity?.examination?.chuyen_vien || 0).toLocaleString()}
                            </h3>
                        </div>
                        <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-500/30">
                            <BuildingOfficeIcon className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Tử vong: <strong className="text-rose-600">{Number(activity?.inpatient?.tu_vong || 0).toLocaleString()}</strong> ca</span>
                        <span className="text-slate-500">Tỷ lệ chuyển: <strong className="text-amber-600">{tongKham > 0 ? ((Number(activity?.examination?.chuyen_vien || 0) / tongKham) * 100).toFixed(1) : 0}%</strong></span>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Trend Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-base font-bold text-slate-800 dark:text-white">Xu hướng Lượt khám Ngoại trú theo Ngày</h2>
                            <p className="text-xs text-slate-500 mt-0.5">Biểu đồ chuỗi thời gian phân tách BHYT và Viện phí</p>
                        </div>
                    </div>

                    <div className="h-72 w-full">
                        {charts.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                                Không có phát sinh dữ liệu lượt khám trong khoảng thời gian đã chọn
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={charts} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gradBhyt" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0}/>
                                        </linearGradient>
                                        <linearGradient id="gradVienPhi" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" />
                                    <XAxis dataKey="label_date" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }} 
                                    />
                                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                    <Area type="monotone" dataKey="bhyt" name="Khám BHYT" stroke="#3B82F6" strokeWidth={2.5} fillOpacity={1} fill="url(#gradBhyt)" />
                                    <Area type="monotone" dataKey="vien_phi" name="Khám Dịch vụ / Viện phí" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#gradVienPhi)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Donut Chart Distribution */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
                    <div>
                        <h2 className="text-base font-bold text-slate-800 dark:text-white">Cơ cấu Lượt khám & Điều trị</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Tỷ trọng các khối chuyên môn</p>
                    </div>

                    <div className="h-56 w-full flex items-center justify-center my-2">
                        {pieData.length === 0 ? (
                            <span className="text-slate-400 text-xs italic">Chưa có số liệu</span>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                                        formatter={(val: any) => [Number(val).toLocaleString(), 'Lượt']}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    <div className="space-y-1.5 text-xs">
                        {pieData.map((item, idx) => (
                            <div key={item.name} className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                                    {item.name}
                                </span>
                                <span className="font-semibold text-slate-800 dark:text-slate-100">{item.value.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top 10 Doctors Leaderboard */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-700/80 overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <span>Bảng Vinh Danh Top 10 Bác Sĩ Khám Nhiều Nhất</span>
                            <span className="text-xs font-normal text-slate-500">({topDoctors.length} bác sĩ)</span>
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">Xếp hạng năng suất khám chữa bệnh ngoại trú theo khoảng thời gian</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 uppercase text-[11px] font-bold tracking-wider">
                            <tr>
                                <th className="px-5 py-3 w-16 text-center">Hạng</th>
                                <th className="px-5 py-3">Bác Sĩ</th>
                                <th className="px-5 py-3 w-48 text-right">Lượt Khám</th>
                                <th className="px-5 py-3 w-64">Tỷ Trọng Năng Suất</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {topDoctors.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-5 py-8 text-center text-slate-400 italic">
                                        Không có dữ liệu bác sĩ trong khoảng thời gian đã chọn
                                    </td>
                                </tr>
                            ) : (
                                topDoctors.map((doc, idx) => {
                                    const visits = Number(doc.total_visits || 0);
                                    const percent = ((visits / maxDoctorVisits) * 100).toFixed(0);

                                    return (
                                        <tr key={doc.doctor_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition">
                                            <td className="px-5 py-3.5 text-center">
                                                {idx === 0 ? (
                                                    <span className="inline-flex items-center justify-center w-7 h-7 bg-amber-100 text-amber-700 font-bold rounded-full text-xs shadow-xs">🥇</span>
                                                ) : idx === 1 ? (
                                                    <span className="inline-flex items-center justify-center w-7 h-7 bg-slate-200 text-slate-700 font-bold rounded-full text-xs shadow-xs">🥈</span>
                                                ) : idx === 2 ? (
                                                    <span className="inline-flex items-center justify-center w-7 h-7 bg-amber-700/20 text-amber-800 font-bold rounded-full text-xs shadow-xs">🥉</span>
                                                ) : (
                                                    <span className="font-semibold text-slate-400">{idx + 1}</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className="font-bold text-slate-800 dark:text-slate-100">{doc.doctor_name}</span>
                                                <span className="text-xs text-slate-400 block sm:inline sm:ml-2">({doc.doctor_id})</span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-black text-blue-600 dark:text-blue-400">
                                                {visits.toLocaleString()} <span className="text-xs font-normal text-slate-400">lượt</span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                                                            style={{ width: `${percent}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs font-medium text-slate-500 w-9 text-right">{percent}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Print Footer */}
            <PrintReportFooter />
        </div>
    );
};
