// ==================== DASHBOARD OVERVIEW ====================
// File: modules/hospital-statistics/views/DashboardOverview.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CommonFilter, PrintReportHeader, PrintReportFooter, exportTableToExcel, formatLocalDate, getStartOfMonthLocalDate, TableEmptyState } from '../components/CommonFilter';
import { statisticsService } from '../services/statisticsService';
import { ChartDayItem, TopDoctorItem, HospitalActivityData, ExecutiveAlertsData } from '../types';
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
    BuildingOfficeIcon,
    SparklesIcon,
    BeakerIcon
} from '../../../components/Icons';

const PIE_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4'];

export const DashboardOverview: React.FC = () => {
    // Default to today for immediate active preset
    const now = new Date();
    const [fromDate, setFromDate] = useState(`${formatLocalDate(now)} 00:00:00`);
    const [toDate, setToDate] = useState(`${formatLocalDate(now)} 23:59:59`);
    const [loading, setLoading] = useState(false);

    const [activity, setActivity] = useState<HospitalActivityData | null>(null);
    const [charts, setCharts] = useState<ChartDayItem[]>([]);
    const [topDoctors, setTopDoctors] = useState<TopDoctorItem[]>([]);
    const [alertsData, setAlertsData] = useState<ExecutiveAlertsData | null>(null);
    const [donutTab, setDonutTab] = useState<'kham' | 'cls' | 'pttt'>('kham');
    const [doctorSearch, setDoctorSearch] = useState('');

    const fetchData = async (overrideFrom?: string, overrideTo?: string) => {
        const from = overrideFrom || fromDate;
        const to = overrideTo || toDate;
        setLoading(true);
        try {
            const [actData, chartData, docData, alerts] = await Promise.all([
                statisticsService.getHospitalActivity(from, to).catch(() => null),
                statisticsService.getDashboardCharts(from, to).catch(() => []),
                statisticsService.getTopDoctors(from, to).catch(() => []),
                statisticsService.getExecutiveAlerts().catch(() => null)
            ]);
            setActivity(actData);
            setCharts(chartData);
            setTopDoctors(docData);
            setAlertsData(alerts);
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

    // Calculate Exact Ratios & Metrics
    const tongKham = Number(activity?.examination?.tong_so || 0);
    const soBhyt = Number(activity?.examination?.so_bhyt || 0);
    const soDv = Number(activity?.examination?.so_dichvu || 0);
    const bhytRatio = tongKham > 0 ? ((soBhyt / tongKham) * 100).toFixed(1) : '0.0';

    const vaoVien = Number(activity?.inpatient?.vao_vien || 0);
    const dangDt = Number(activity?.inpatient?.dang_dieu_tri || 0);
    const raVien = Number(activity?.inpatient?.ra_vien || 0);

    const phauThuatCa = activity?.surgery?.find(s => s.pttt_type === 'PHAU_THUAT');
    const thuThuatCa = activity?.surgery?.find(s => s.pttt_type === 'THU_THUAT');
    const tongPt = Number(phauThuatCa?.tong_so_ca || 0);
    const tongTt = Number(thuThuatCa?.tong_so_ca || 0);

    const chuyenVienNgoaiTru = Number(activity?.examination?.chuyen_vien || 0);
    const chuyenVienNoiTru = Number(activity?.inpatient?.chuyen_vien_noi_tru || 0);
    const tongChuyenVien = chuyenVienNgoaiTru + chuyenVienNoiTru;

    // CLS Aggregate Breakdown
    const xnCa = (activity?.paraclinical || []).filter(c => c.group_type === 'XET_NGHIEM').reduce((acc, c) => acc + Number(c.tong_so_ca || 0), 0);
    const cdhaCa = (activity?.paraclinical || []).filter(c => c.group_type === 'CDHA').reduce((acc, c) => acc + Number(c.tong_so_ca || 0), 0);
    const tdcnCa = (activity?.paraclinical || []).filter(c => c.group_type === 'TDCN').reduce((acc, c) => acc + Number(c.tong_so_ca || 0), 0);
    const clsKhacCa = (activity?.paraclinical || []).filter(c => c.group_type === 'CLS_KHAC').reduce((acc, c) => acc + Number(c.tong_so_ca || 0), 0);
    const tongCls = xnCa + cdhaCa + tdcnCa + clsKhacCa;

    // Mutually Exclusive Pie Data according to selected tab
    const pieData = useMemo(() => {
        if (donutTab === 'kham') {
            return [
                { name: 'Khám BHYT', value: soBhyt, color: '#2563EB' },
                { name: 'Khám Dịch Vụ / Viện Phí', value: soDv, color: '#F59E0B' }
            ].filter(d => d.value > 0);
        } else if (donutTab === 'cls') {
            return [
                { name: 'Xét Nghiệm (LIS)', value: xnCa, color: '#10B981' },
                { name: 'Chẩn Đoán Hình Ảnh (PACS)', value: cdhaCa, color: '#3B82F6' },
                { name: 'Thăm Dò Chức Năng', value: tdcnCa, color: '#8B5CF6' },
                { name: 'CLS Khác', value: clsKhacCa, color: '#EC4899' }
            ].filter(d => d.value > 0);
        } else {
            return [
                { name: 'Phẫu Thuật', value: tongPt, color: '#8B5CF6' },
                { name: 'Thủ Thuật', value: tongTt, color: '#06B6D4' }
            ].filter(d => d.value > 0);
        }
    }, [donutTab, soBhyt, soDv, xnCa, cdhaCa, tdcnCa, clsKhacCa, tongPt, tongTt]);

    const totalDonutValue = useMemo(() => {
        return pieData.reduce((acc, curr) => acc + curr.value, 0);
    }, [pieData]);

    const totalTrendVisits = useMemo(() => {
        return charts.reduce((sum, c) => sum + Number(c.bhyt || 0) + Number(c.vien_phi || 0), 0);
    }, [charts]);

    const filteredDoctors = useMemo(() => {
        if (!doctorSearch.trim()) return topDoctors;
        const q = doctorSearch.toLowerCase();
        return topDoctors.filter(d => 
            d.doctor_name.toLowerCase().includes(q) || 
            d.doctor_id.toLowerCase().includes(q)
        );
    }, [topDoctors, doctorSearch]);

    const maxDoctorVisits = topDoctors.length > 0 ? Number(topDoctors[0].total_visits || 1) : 1;

    return (
        <div className="space-y-3 sm:space-y-3.5">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
                            Bảng Điều Khiển Thống Kê Bệnh Viện
                        </h1>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Live HIS BI
                        </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Trung tâm chỉ huy vận hành và phân tích số liệu lâm sàng theo thời gian thực
                    </p>
                </div>

                {/* Quick Director Navigation Links */}
                <div className="flex items-center gap-2">
                    <Link
                        to="/hospital-statistics/morning-briefing"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-xl border border-blue-200 dark:border-blue-800 transition shadow-xs"
                    >
                        <span>📋</span> Bản Tin Giao Ban Sáng (24h)
                    </Link>
                    <Link
                        to="/hospital-statistics/financial-risk"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-xl border border-purple-200 dark:border-purple-800 transition shadow-xs"
                    >
                        <span>💰</span> Giám Sát Rủi Ro & BHYT
                    </Link>
                </div>
            </div>

            {/* EXECUTIVE TRAFFIC LIGHT LIVE ALERTS BANNER */}
            {alertsData && (
                <div className={`p-4 rounded-2xl border shadow-xs transition-all print:hidden ${
                    alertsData.overall_status === 'RED'
                        ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60'
                        : alertsData.overall_status === 'YELLOW'
                        ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60'
                        : 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60'
                }`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2.5 border-b border-black/5 dark:border-white/10">
                        <div className="flex items-center gap-2.5">
                            <div className={`w-3.5 h-3.5 rounded-full ${
                                alertsData.overall_status === 'RED' ? 'bg-rose-600 animate-ping' : alertsData.overall_status === 'YELLOW' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                            }`} />
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                    <span>Đèn Chỉ Huy Khẩn Cấp Giám Đốc (Traffic Light Alerts)</span>
                                    <span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase ${
                                        alertsData.overall_status === 'RED'
                                            ? 'bg-rose-600 text-white'
                                            : alertsData.overall_status === 'YELLOW'
                                            ? 'bg-amber-500 text-white'
                                            : 'bg-emerald-600 text-white'
                                    }`}>
                                        {alertsData.overall_status === 'RED' ? 'Báo Động Đỏ' : alertsData.overall_status === 'YELLOW' ? 'Cảnh Báo Vàng' : 'An Toàn'}
                                    </span>
                                </h3>
                            </div>
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-400">
                            Tự động quét: Quá tải buồng bệnh (QĐ 49), Ca tử vong, Âm tạm ứng lớn &gt; 5 triệu
                        </div>
                    </div>

                    {/* Alert Items */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-3">
                        {alertsData.alerts.map((alert, idx) => {
                            const isRed = alert.type === 'RED';
                            const isYellow = alert.type === 'YELLOW';
                            return (
                                <div 
                                    key={idx} 
                                    className={`p-3 rounded-xl border text-xs flex flex-col justify-between ${
                                        isRed 
                                            ? 'bg-white/95 dark:bg-slate-900/95 border-rose-300 dark:border-rose-800 shadow-xs' 
                                            : isYellow 
                                            ? 'bg-white/95 dark:bg-slate-900/95 border-amber-300 dark:border-amber-800 shadow-xs' 
                                            : 'bg-white/95 dark:bg-slate-900/95 border-emerald-300 dark:border-emerald-800 shadow-xs'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-start gap-2 font-bold mb-1">
                                            <span className="text-sm">
                                                {isRed ? '🔴' : isYellow ? '🟡' : '🟢'}
                                            </span>
                                            <span className="text-slate-900 dark:text-slate-100">{alert.title}</span>
                                        </div>
                                        <p className="text-slate-600 dark:text-slate-300 pl-6 text-[11px] leading-relaxed">
                                            {alert.message}
                                        </p>
                                    </div>
                                    {alert.action_link && (
                                        <div className="mt-2.5 pl-6">
                                            <Link 
                                                to={alert.action_link}
                                                className={`inline-flex items-center gap-1 font-semibold text-[11px] hover:underline ${
                                                    isRed ? 'text-rose-600 dark:text-rose-400' : isYellow ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                                                }`}
                                            >
                                                Xem chi tiết xử lý →
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

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

            {/* 4 Primary KPI Cards - GCV Executive Medical Standard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
                {/* Card 1: Khám bệnh */}
                <div className="his-kpi-card border-l-4 border-l-blue-500 bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between">
                    <div>
                        <div className="flex items-start justify-between">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-md border border-blue-200/60 dark:border-blue-800/40">
                                Khám Ngoại Trú
                            </span>
                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-800/60 shadow-xs group-hover:scale-105 transition-transform">
                                <UserGroupIcon className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-mono tabular-nums tracking-tight">
                                {tongKham.toLocaleString('vi-VN')}
                            </h3>
                            <span className="text-xs font-semibold text-slate-400">lượt tiếp nhận</span>
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800 flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Khám BHYT</span>
                            <div className="flex items-center justify-between mt-0.5">
                                <strong className="text-emerald-600 dark:text-emerald-400 font-mono tabular-nums font-bold">
                                    {soBhyt.toLocaleString('vi-VN')}
                                </strong>
                                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded font-mono">
                                    {bhytRatio}%
                                </span>
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800 flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Dịch Vụ</span>
                            <div className="flex items-center justify-between mt-0.5">
                                <strong className="text-amber-600 dark:text-amber-400 font-mono tabular-nums font-bold">
                                    {soDv.toLocaleString('vi-VN')}
                                </strong>
                                <span className="text-[10px] font-semibold text-slate-400">
                                    {tongKham > 0 ? ((soDv / tongKham) * 100).toFixed(0) : 0}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 2: Nội trú */}
                <div className="his-kpi-card border-l-4 border-l-emerald-500 bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between">
                    <div>
                        <div className="flex items-start justify-between">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-md border border-emerald-200/60 dark:border-emerald-800/40">
                                Điều Trị Nội Trú
                            </span>
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/60 shadow-xs group-hover:scale-105 transition-transform">
                                <HeartIcon className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-mono tabular-nums tracking-tight">
                                {dangDt.toLocaleString('vi-VN')}
                            </h3>
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">BN đang nằm</span>
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800 flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Vào Viện Mới</span>
                            <div className="flex items-center justify-between mt-0.5">
                                <strong className="text-blue-600 dark:text-blue-400 font-mono tabular-nums font-bold">
                                    {vaoVien.toLocaleString('vi-VN')}
                                </strong>
                                <span className="text-[10px] text-slate-400">BN</span>
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800 flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Ra Viện</span>
                            <div className="flex items-center justify-between mt-0.5">
                                <strong className="text-emerald-600 dark:text-emerald-400 font-mono tabular-nums font-bold">
                                    {raVien.toLocaleString('vi-VN')}
                                </strong>
                                <span className="text-[10px] text-slate-400">khỏi/đỡ</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 3: Phẫu thuật - Thủ thuật */}
                <div className="his-kpi-card border-l-4 border-l-purple-500 bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between">
                    <div>
                        <div className="flex items-start justify-between">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 px-2.5 py-1 rounded-md border border-purple-200/60 dark:border-purple-800/40">
                                Phẫu Thuật - Thủ Thuật
                            </span>
                            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-800/60 shadow-xs group-hover:scale-105 transition-transform">
                                <SparklesIcon className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-mono tabular-nums tracking-tight">
                                {(tongPt + tongTt).toLocaleString('vi-VN')}
                            </h3>
                            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">tổng ca thực hiện</span>
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800 flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Phẫu Thuật</span>
                            <div className="flex items-center justify-between mt-0.5">
                                <strong className="text-purple-600 dark:text-purple-400 font-mono tabular-nums font-bold">
                                    {tongPt.toLocaleString('vi-VN')}
                                </strong>
                                <span className="text-[10px] text-slate-400">ca mổ</span>
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800 flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Thủ Thuật</span>
                            <div className="flex items-center justify-between mt-0.5">
                                <strong className="text-indigo-600 dark:text-indigo-400 font-mono tabular-nums font-bold">
                                    {tongTt.toLocaleString('vi-VN')}
                                </strong>
                                <span className="text-[10px] text-slate-400">ca TT</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 4: Chuyển viện */}
                <div className="his-kpi-card border-l-4 border-l-amber-500 bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between">
                    <div>
                        <div className="flex items-start justify-between">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1 rounded-md border border-amber-200/60 dark:border-amber-800/40">
                                Chuyển Tuyến Viện
                            </span>
                            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-800/60 shadow-xs group-hover:scale-105 transition-transform">
                                <BuildingOfficeIcon className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-mono tabular-nums tracking-tight">
                                {tongChuyenVien.toLocaleString('vi-VN')}
                            </h3>
                            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">ca chuyển tuyến</span>
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800 flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Ngoại Trú</span>
                            <div className="flex items-center justify-between mt-0.5">
                                <strong className="text-amber-600 dark:text-amber-400 font-mono tabular-nums font-bold">
                                    {chuyenVienNgoaiTru.toLocaleString('vi-VN')}
                                </strong>
                                <span className="text-[10px] text-slate-400">PK</span>
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800 flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Nội Trú (Điểm G)</span>
                            <div className="flex items-center justify-between mt-0.5">
                                <strong className="text-indigo-600 dark:text-indigo-400 font-mono tabular-nums font-bold">
                                    {chuyenVienNoiTru.toLocaleString('vi-VN')}
                                </strong>
                                <span className="text-[10px] text-slate-400">Khoa</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Executive Clinical Services Bar - Replaced harsh dark banner with refined light medical theme */}
            <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 dark:from-slate-800/90 dark:via-slate-800 dark:to-slate-800 rounded-2xl p-4 sm:p-5 border border-blue-200/70 dark:border-slate-700/80 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/80 dark:border-blue-800/60 shadow-xs shrink-0">
                        <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.942A4.5 4.5 0 0 1 15.908 17H8.092a4.5 4.5 0 0 1-2.322-.758L4.2 15.3m15.6 0A2.25 2.25 0 0 1 21 17.25v.75A2.25 2.25 0 0 1 18.75 20.25H5.25A2.25 2.25 0 0 1 3 18v-.75a2.25 2.25 0 0 1 1.2-1.95" />
                        </svg>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-slate-900 dark:text-white">
                                Khối Dịch Vụ Kỹ Thuật & Cận Lâm Sàng
                            </h4>
                            <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-900/50 px-2 py-0.5 rounded-full border border-blue-200/50 dark:border-blue-800/50">
                                Kỹ thuật y tế
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Tổng hợp lưu lượng chỉ định Xét nghiệm (LIS), Chẩn đoán hình ảnh (RIS/PACS), Thăm dò chức năng
                        </p>
                    </div>
                </div>

                {/* 4 Synchronized Clinical Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 shrink-0">
                    <div className="bg-white dark:bg-slate-900/70 px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col min-w-[110px]">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Xét Nghiệm (LIS)</span>
                        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-0.5">
                            {xnCa.toLocaleString('vi-VN')}
                        </span>
                    </div>
                    <div className="bg-white dark:bg-slate-900/70 px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col min-w-[110px]">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CĐHA (PACS)</span>
                        <span className="text-lg font-black text-blue-600 dark:text-blue-400 font-mono tabular-nums mt-0.5">
                            {cdhaCa.toLocaleString('vi-VN')}
                        </span>
                    </div>
                    <div className="bg-white dark:bg-slate-900/70 px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col min-w-[110px]">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TDCN</span>
                        <span className="text-lg font-black text-purple-600 dark:text-purple-400 font-mono tabular-nums mt-0.5">
                            {tdcnCa.toLocaleString('vi-VN')}
                        </span>
                    </div>
                    <div className="bg-white dark:bg-slate-900/70 px-3.5 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 shadow-xs flex flex-col min-w-[110px] bg-gradient-to-br from-indigo-50/50 to-white dark:from-slate-900/70 dark:to-indigo-950/20">
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Tổng Chỉ Định</span>
                        <span className="text-lg font-black text-indigo-700 dark:text-indigo-300 font-mono tabular-nums mt-0.5">
                            {tongCls.toLocaleString('vi-VN')}
                        </span>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-4">
                {/* Main Trend Chart - Fixed integer decimal ticks on Y-axis */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                        <div>
                            <h2 className="text-base font-bold text-slate-800 dark:text-white">
                                Biểu Đồ Xu Hướng Lượt Khám Ngoại Trú Theo Ngày
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">Phân tách diễn biến đối tượng BHYT và Dịch vụ / Viện phí</p>
                        </div>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800 font-mono">
                            Tổng: {totalTrendVisits.toLocaleString('vi-VN')} lượt
                        </span>
                    </div>

                    <div className="h-72 w-full">
                        {charts.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm italic">
                                <span>Chưa có phát sinh lượt khám trong khoảng thời gian đã chọn</span>
                                <span className="text-xs text-slate-500 mt-1">Vui lòng chọn khung ngày mở rộng hoặc ấn "Tháng này" / "Năm nay"</span>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={charts} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gradBhyt" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.35}/>
                                            <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0}/>
                                        </linearGradient>
                                        <linearGradient id="gradVienPhi" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.35}/>
                                            <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" />
                                    <XAxis dataKey="label_date" tick={{ fontSize: 11 }} />
                                    {/* Critical Fix: allowDecimals={false} ensures whole patient counts */}
                                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} domain={[0, 'auto']} width={35} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }} 
                                        formatter={(val: any) => [Number(val).toLocaleString('vi-VN'), 'Lượt']}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                    <Area 
                                        type="monotone" 
                                        dataKey="bhyt" 
                                        name="Khám BHYT" 
                                        stroke="#2563EB" 
                                        strokeWidth={2.5} 
                                        fillOpacity={1} 
                                        fill="url(#gradBhyt)" 
                                        dot={{ r: 3.5, strokeWidth: 1.5, fill: '#2563EB' }}
                                        activeDot={{ r: 5.5 }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="vien_phi" 
                                        name="Khám Dịch Vụ / Viện Phí" 
                                        stroke="#F59E0B" 
                                        strokeWidth={2} 
                                        fillOpacity={1} 
                                        fill="url(#gradVienPhi)" 
                                        dot={{ r: 3.5, strokeWidth: 1.5, fill: '#F59E0B' }}
                                        activeDot={{ r: 5.5 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Donut Chart Distribution with Tab Switcher & Center Total Label */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-bold text-slate-800 dark:text-white">Cơ Cấu Hoạt Động</h2>
                            {/* Tab Switcher */}
                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/50 p-0.5 rounded-lg text-xs">
                                <button
                                    type="button"
                                    onClick={() => setDonutTab('kham')}
                                    className={`px-2.5 py-1 rounded-md transition font-medium cursor-pointer ${
                                        donutTab === 'kham' 
                                            ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold shadow-xs' 
                                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                    }`}
                                >
                                    Khám
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDonutTab('cls')}
                                    className={`px-2.5 py-1 rounded-md transition font-medium cursor-pointer ${
                                        donutTab === 'cls' 
                                            ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs' 
                                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                    }`}
                                >
                                    CLS
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDonutTab('pttt')}
                                    className={`px-2.5 py-1 rounded-md transition font-medium cursor-pointer ${
                                        donutTab === 'pttt' 
                                            ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 font-bold shadow-xs' 
                                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                    }`}
                                >
                                    PTTT
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            {donutTab === 'kham' && 'Tỷ trọng đối tượng bệnh nhân khám ngoại trú'}
                            {donutTab === 'cls' && 'Tỷ trọng kỹ thuật cận lâm sàng'}
                            {donutTab === 'pttt' && 'Tỷ trọng phẫu thuật so với thủ thuật'}
                        </p>
                    </div>

                    {/* Donut Container with Centered Total Metric */}
                    <div className="relative h-56 w-full flex items-center justify-center my-1">
                        {pieData.length === 0 ? (
                            <span className="text-slate-400 text-xs italic">Chưa có số liệu phát sinh</span>
                        ) : (
                            <>
                                {/* Centered Core Stat in Donut */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white font-mono tabular-nums">
                                        {totalDonutValue.toLocaleString('vi-VN')}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                                        {donutTab === 'kham' ? 'Lượt Khám' : donutTab === 'cls' ? 'Chỉ Định' : 'Ca PTTT'}
                                    </span>
                                </div>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            innerRadius={58}
                                            outerRadius={80}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} strokeWidth={2} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                                            formatter={(val: any) => [Number(val).toLocaleString('vi-VN'), 'Số lượng']}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </>
                        )}
                    </div>

                    {/* Structured Legend List with Value & Percentages */}
                    <div className="space-y-1.5 text-xs pt-3 border-t border-slate-100 dark:border-slate-700/60">
                        {pieData.map((item, idx) => {
                            const ratio = totalDonutValue > 0 ? ((item.value / totalDonutValue) * 100).toFixed(1) : '0';
                            return (
                                <div key={item.name} className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                                    <span className="flex items-center gap-2 truncate pr-2">
                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color || PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                                        <span className="truncate">{item.name}</span>
                                    </span>
                                    <div className="flex items-center gap-2 shrink-0 font-mono">
                                        <span className="font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                                            {item.value.toLocaleString('vi-VN')}
                                        </span>
                                        <span className="text-[11px] text-slate-400 w-12 text-right">
                                            ({ratio}%)
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Top 10 Doctors Leaderboard */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-700/80 overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <span>Bảng Xếp Hạng Top 10 Bác Sĩ Khám Bệnh Xuất Sắc</span>
                            <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full border border-blue-200/60 dark:border-blue-800/60">
                                {topDoctors.length} Bác sĩ
                            </span>
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">Xếp hạng năng suất khám chữa bệnh ngoại trú theo khoảng thời gian đã lọc</p>
                    </div>

                    {/* Quick Search inside Table */}
                    {topDoctors.length > 5 && (
                        <div className="w-full sm:w-56">
                            <input
                                type="text"
                                value={doctorSearch}
                                onChange={(e) => setDoctorSearch(e.target.value)}
                                placeholder="Tìm tên bác sĩ..."
                                className="w-full text-xs px-3 py-1.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    )}
                </div>

                <div className="his-table-wrap">
                    <table className="his-table w-full text-left text-xs sm:text-sm">
                        <thead className="sticky top-0 z-10 shadow-xs">
                            <tr>
                                <th className="px-5 py-3.5 w-16 text-center font-mono">Hạng</th>
                                <th className="px-5 py-3.5">Bác Sĩ</th>
                                <th className="px-5 py-3.5 w-48 text-right">Lượt Khám</th>
                                <th className="px-5 py-3.5 w-64">Tỷ Trọng Năng Suất</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDoctors.length === 0 ? (
                                <TableEmptyState 
                                    colSpan={4} 
                                    title="Không tìm thấy bác sĩ phù hợp"
                                    message="Vui lòng thử điều chỉnh lại từ khóa tìm kiếm hoặc chọn khoảng thời gian khác"
                                    onResetFilter={doctorSearch ? () => setDoctorSearch('') : undefined}
                                />
                            ) : (
                                filteredDoctors.map((doc, idx) => {
                                    const visits = Number(doc.total_visits || 0);
                                    const percent = ((visits / maxDoctorVisits) * 100).toFixed(0);

                                    return (
                                        <tr key={doc.doctor_id}>
                                            <td className="px-5 py-3.5 text-center">
                                                {idx === 0 ? (
                                                    <span className="inline-flex items-center justify-center w-7 h-7 bg-gradient-to-br from-amber-400 to-amber-500 text-white font-black rounded-lg text-xs shadow-xs">
                                                        1
                                                    </span>
                                                ) : idx === 1 ? (
                                                    <span className="inline-flex items-center justify-center w-7 h-7 bg-gradient-to-br from-slate-300 to-slate-500 text-white font-black rounded-lg text-xs shadow-xs">
                                                        2
                                                    </span>
                                                ) : idx === 2 ? (
                                                    <span className="inline-flex items-center justify-center w-7 h-7 bg-gradient-to-br from-amber-600 to-amber-700 text-white font-black rounded-lg text-xs shadow-xs">
                                                        3
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-xs font-mono">
                                                        {idx + 1}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="font-bold text-slate-900 dark:text-slate-100">
                                                    BS. {doc.doctor_name}
                                                </div>
                                                <div className="text-xs text-slate-400 font-mono mt-0.5">
                                                    Mã NV: {doc.doctor_id}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-black text-blue-700 dark:text-blue-400 font-mono tabular-nums">
                                                {visits.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-400">lượt</span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
                                                            style={{ width: `${percent}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 w-10 text-right font-mono tabular-nums">
                                                        {percent}%
                                                    </span>
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
