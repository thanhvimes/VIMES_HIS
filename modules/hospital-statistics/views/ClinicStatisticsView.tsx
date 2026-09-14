// ==================== CLINIC STATISTICS VIEW ====================
// File: modules/hospital-statistics/views/ClinicStatisticsView.tsx
// Standardized to GCV Ninh Binh Medical UI System & Biểu Mẫu 02/BC-PK (Bộ Y Tế)

import React, { useState, useEffect, useMemo } from 'react';
import { CommonFilter, PrintReportHeader, PrintReportFooter, exportTableToExcel, formatLocalDate, TableEmptyState } from '../components/CommonFilter';
import { statisticsService } from '../services/statisticsService';
import { ClinicStatisticsItem } from '../types';
import { 
    ResponsiveContainer, 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    Tooltip, 
    CartesianGrid, 
    PieChart, 
    Pie, 
    Cell,
    Legend
} from 'recharts';
import { 
    BuildingOfficeIcon, 
    UserGroupIcon, 
    HeartIcon, 
    ArrowPathIcon,
    ChartBarIcon,
    SparklesIcon
} from '../../../components/Icons';

type SortField = 'room_name' | 'tong_luot_kham' | 'so_bhyt' | 'so_dichvu' | 'nhap_vien' | 'chuyen_vien' | 'cho_ve' | 'dang_kham';
type ClinicCategory = 'ALL' | 'HIGH_VOLUME' | 'INTERNAL' | 'SURGICAL_SPECIALTY' | 'HEALTH_CHECK';

// Helper for Vietnamese unaccented search
const removeVietnameseTones = (str: string): string => {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase();
};

export const ClinicStatisticsView: React.FC = () => {
    const now = new Date();
    const [fromDate, setFromDate] = useState(`${formatLocalDate(now)} 00:00:00`);
    const [toDate, setToDate] = useState(`${formatLocalDate(now)} 23:59:59`);
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<ClinicStatisticsItem[]>([]);
    
    // Filters & Sorting
    const [searchTerm, setSearchTerm] = useState('');
    const [hideEmpty, setHideEmpty] = useState(true);
    const [sortField, setSortField] = useState<SortField>('tong_luot_kham');
    const [sortAsc, setSortAsc] = useState(false);
    const [activeCategory, setActiveCategory] = useState<ClinicCategory>('ALL');

    // Auto scroll to top on mount
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const mainEl = document.querySelector('main');
        if (mainEl) {
            mainEl.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, []);

    const fetchData = async (overrideFrom?: string, overrideTo?: string) => {
        const from = overrideFrom || fromDate;
        const to = overrideTo || toDate;
        setLoading(true);
        try {
            const res = await statisticsService.getClinicsStatistics(from, to);
            setItems(res);
        } catch (error) {
            console.error('Error fetching clinic statistics:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Categorization helper
    const categorizeClinic = (name: string): ClinicCategory => {
        const clean = removeVietnameseTones(name || '');
        if (clean.includes('suc khoe') || clean.includes('ksk') || clean.includes('doan')) {
            return 'HEALTH_CHECK';
        }
        if (clean.includes('ngoai') || clean.includes('mat') || clean.includes('rang ham mat') || clean.includes('rhm') || clean.includes('san') || clean.includes('tai mui hong') || clean.includes('tmh') || clean.includes('cap cuu')) {
            return 'SURGICAL_SPECIALTY';
        }
        if (clean.includes('tieu duong') || clean.includes('huyet ap') || clean.includes('ho hap') || clean.includes('copd') || clean.includes('tim mach') || clean.includes('y hoc co truyen') || clean.includes('yhct') || clean.includes('noi')) {
            return 'INTERNAL';
        }
        return 'ALL';
    };

    // Filter and sort items
    const filteredItems = useMemo(() => {
        let result = items;

        if (hideEmpty) {
            result = result.filter(it => Number(it.tong_luot_kham || 0) > 0);
        }

        if (activeCategory !== 'ALL') {
            if (activeCategory === 'HIGH_VOLUME') {
                result = result.filter(it => Number(it.tong_luot_kham || 0) >= 3000);
            } else {
                result = result.filter(it => categorizeClinic(it.room_name || '') === activeCategory);
            }
        }

        if (searchTerm.trim()) {
            const cleanQuery = removeVietnameseTones(searchTerm.trim());
            result = result.filter(it => {
                const cleanName = removeVietnameseTones(it.room_name || '');
                const cleanId = String(it.room_id || '');
                return cleanName.includes(cleanQuery) || cleanId.includes(cleanQuery);
            });
        }

        result = [...result].sort((a, b) => {
            let valA: any = a[sortField];
            let valB: any = b[sortField];
            if (sortField !== 'room_name') {
                valA = Number(valA || 0);
                valB = Number(valB || 0);
            } else {
                valA = String(valA || '').toLowerCase();
                valB = String(valB || '').toLowerCase();
            }
            if (valA < valB) return sortAsc ? -1 : 1;
            if (valA > valB) return sortAsc ? 1 : -1;
            return 0;
        });

        return result;
    }, [items, hideEmpty, activeCategory, searchTerm, sortField, sortAsc]);

    // Calculate totals of filtered set
    const totals = useMemo(() => {
        return filteredItems.reduce((acc, curr) => ({
            tong_luot_kham: acc.tong_luot_kham + Number(curr.tong_luot_kham || 0),
            so_bhyt: acc.so_bhyt + Number(curr.so_bhyt || 0),
            so_dichvu: acc.so_dichvu + Number(curr.so_dichvu || 0),
            nhap_vien: acc.nhap_vien + Number(curr.nhap_vien || 0),
            chuyen_vien: acc.chuyen_vien + Number(curr.chuyen_vien || 0),
            cho_ve: acc.cho_ve + Number(curr.cho_ve || 0),
            dang_kham: acc.dang_kham + Number(curr.dang_kham || 0)
        }), { tong_luot_kham: 0, so_bhyt: 0, so_dichvu: 0, nhap_vien: 0, chuyen_vien: 0, cho_ve: 0, dang_kham: 0 });
    }, [filteredItems]);

    const maxVisits = useMemo(() => {
        return Math.max(...filteredItems.map(it => Number(it.tong_luot_kham || 0)), 1);
    }, [filteredItems]);

    // Ratios
    const bhytRatio = totals.tong_luot_kham > 0 ? ((totals.so_bhyt / totals.tong_luot_kham) * 100).toFixed(1) : '0.0';
    const dvRatio = totals.tong_luot_kham > 0 ? ((totals.so_dichvu / totals.tong_luot_kham) * 100).toFixed(1) : '0.0';
    const nhapVienRatio = totals.tong_luot_kham > 0 ? ((totals.nhap_vien / totals.tong_luot_kham) * 100).toFixed(2) : '0.00';
    const avgPerRoom = filteredItems.length > 0 ? Math.round(totals.tong_luot_kham / filteredItems.length) : 0;

    // Top 7 Clinics Data (Stacked Bar: BHYT vs Dịch Vụ)
    const top7Clinics = useMemo(() => {
        return [...items]
            .filter(it => Number(it.tong_luot_kham || 0) > 0)
            .sort((a, b) => Number(b.tong_luot_kham || 0) - Number(a.tong_luot_kham || 0))
            .slice(0, 7)
            .map(it => {
                const shortName = it.room_name
                    .replace('Phòng Khám ', 'PK ')
                    .replace('Phòng khám ', 'PK ');
                return {
                    name: shortName,
                    fullName: it.room_name,
                    roomId: it.room_id,
                    tong: Number(it.tong_luot_kham || 0),
                    bhyt: Number(it.so_bhyt || 0),
                    dichvu: Number(it.so_dichvu || 0),
                    nhapVien: Number(it.nhap_vien || 0)
                };
            });
    }, [items]);

    // Disposition / Outcome Breakdown Data (Donut)
    const dispositionData = useMemo(() => {
        const list = [];
        if (totals.cho_ve > 0) {
            list.push({ name: 'Ra viện / Kê đơn về', value: totals.cho_ve, color: '#10B981', shortName: 'Ra viện / Về' });
        }
        if (totals.nhap_vien > 0) {
            list.push({ name: 'Chỉ định nhập viện', value: totals.nhap_vien, color: '#6366F1', shortName: 'Nhập viện' });
        }
        if (totals.dang_kham > 0) {
            list.push({ name: 'Đang khám / Xử trí', value: totals.dang_kham, color: '#0EA5E9', shortName: 'Đang khám' });
        }
        if (totals.chuyen_vien > 0) {
            list.push({ name: 'Chuyển viện tuyến trên', value: totals.chuyen_vien, color: '#F43F5E', shortName: 'Chuyển viện' });
        }
        return list;
    }, [totals]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortAsc(!sortAsc);
        } else {
            setSortField(field);
            setSortAsc(false);
        }
    };

    const handleExport = () => {
        const rows = filteredItems.map((it, idx) => ({
            'STT': idx + 1,
            'Mã Phòng': it.room_id,
            'Tên Phòng Khám': it.room_name,
            'Tổng Khám': Number(it.tong_luot_kham || 0),
            'Khám BHYT': Number(it.so_bhyt || 0),
            'Khám Dịch Vụ': Number(it.so_dichvu || 0),
            'Nhập Viện': Number(it.nhap_vien || 0),
            'Tỷ Lệ Vào Viện (%)': Number(it.tong_luot_kham || 0) > 0 ? ((Number(it.nhap_vien || 0) / Number(it.tong_luot_kham)) * 100).toFixed(2) : '0.00',
            'Chuyển Tuyến': Number(it.chuyen_vien || 0),
            'Ra Viện': Number(it.cho_ve || 0),
            'Đang Khám': Number(it.dang_kham || 0)
        }));
        // Add total row
        rows.push({
            'STT': 'TỔNG CỘNG',
            'Mã Phòng': '',
            'Tên Phòng Khám': `${filteredItems.length} phòng khám`,
            'Tổng Khám': totals.tong_luot_kham,
            'Khám BHYT': totals.so_bhyt,
            'Khám Dịch Vụ': totals.so_dichvu,
            'Nhập Viện': totals.nhap_vien,
            'Tỷ Lệ Vào Viện (%)': nhapVienRatio,
            'Chuyển Tuyến': totals.chuyen_vien,
            'Ra Viện': totals.cho_ve,
            'Đang Khám': totals.dang_kham
        });
        exportTableToExcel(rows, 'Thong_Ke_Phong_Kham', 'Phòng Khám');
    };

    // Custom Tooltip for Top Clinics
    const CustomTopClinicsTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload;
            return (
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-lg text-xs space-y-1.5">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <BuildingOfficeIcon className="w-4 h-4 text-blue-500" />
                        <span>{item.fullName}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 rounded">
                            P.{item.roomId}
                        </span>
                    </div>
                    <div className="pt-1 border-t border-slate-100 dark:border-slate-800 space-y-1">
                        <p className="flex justify-between gap-4">
                            <span className="text-slate-500">Tổng tiếp nhận:</span>
                            <strong className="font-mono text-blue-600 dark:text-blue-400">{item.tong.toLocaleString('vi-VN')} lượt</strong>
                        </p>
                        <p className="flex justify-between gap-4">
                            <span className="text-slate-500">Khám BHYT:</span>
                            <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                                {item.bhyt.toLocaleString('vi-VN')} ({item.tong > 0 ? ((item.bhyt / item.tong) * 100).toFixed(1) : 0}%)
                            </strong>
                        </p>
                        <p className="flex justify-between gap-4">
                            <span className="text-slate-500">Khám Dịch vụ:</span>
                            <strong className="font-mono text-amber-600 dark:text-amber-400">
                                {item.dichvu.toLocaleString('vi-VN')} ({item.tong > 0 ? ((item.dichvu / item.tong) * 100).toFixed(1) : 0}%)
                            </strong>
                        </p>
                        <p className="flex justify-between gap-4">
                            <span className="text-slate-500">Chỉ định vào viện:</span>
                            <strong className="font-mono text-indigo-600 dark:text-indigo-400">{item.nhapVien.toLocaleString('vi-VN')} ca</strong>
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    // Custom Tooltip for Disposition Donut
    const CustomDispositionTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload;
            const pct = totals.tong_luot_kham > 0 ? ((item.value / totals.tong_luot_kham) * 100).toFixed(1) : '0.0';
            return (
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-lg text-xs space-y-1">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="font-bold text-slate-800 dark:text-white">{item.name}</span>
                    </div>
                    <p className="font-mono font-black text-sm" style={{ color: item.color }}>
                        {Number(item.value).toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500">người bệnh</span>
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                        Chiếm <strong>{pct}%</strong> tổng lượt khám toàn viện
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-3 sm:space-y-3.5">
            {/* Header Title & Form Code */}
            <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
                            Thống Kê Theo Phòng Khám
                        </h1>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800 shadow-xs">
                            Biểu Mẫu 02/BC-PK
                        </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Theo dõi lưu lượng bệnh nhân và phân loại kết quả xử trí theo từng buồng khám chuyên khoa
                    </p>
                </div>
            </div>

            {/* Print Header (Visible only when printing) */}
            <PrintReportHeader 
                formCode="Biểu mẫu: 02/BC-PK"
                title="BÁO CÁO THỐNG KÊ HOẠT ĐỘNG CÁC PHÒNG KHÁM NGOẠI TRÚ"
                subtitle="Chi tiết lưu lượng và xử trí bệnh nhân từng buồng khám chuyên khoa"
                fromDate={fromDate}
                toDate={toDate}
            />

            {/* Filter Bar with Auto-refresh on preset */}
            <CommonFilter
                fromDate={fromDate}
                toDate={toDate}
                onFromDateChange={setFromDate}
                onToDateChange={setToDate}
                onRefresh={fetchData}
                loading={loading}
                onExportExcel={handleExport}
                onPrint={() => window.print()}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Tìm tên phòng (gõ không dấu: noi, mat...) hoặc mã phòng..."
                hideEmpty={hideEmpty}
                onHideEmptyChange={setHideEmpty}
                totalCount={items.length}
                filteredCount={filteredItems.length}
            />

            {/* 4 Executive Clinical KPI Cards - GCV Standard his-kpi-card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 print:hidden">
                {/* KPI 1: Tổng Tiếp Nhận */}
                <div className="his-kpi-card border-l-4 border-l-blue-500 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                            <UserGroupIcon className="w-5 h-5" />
                        </div>
                        <span className="px-2 py-0.5 text-[11px] font-bold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800">
                            {filteredItems.length} Phòng Hoạt Động
                        </span>
                    </div>
                    <div className="mt-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tổng Lượt Tiếp Nhận</span>
                        <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums tracking-tight block mt-0.5">
                            {totals.tong_luot_kham.toLocaleString('vi-VN')}
                        </span>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 text-xs flex items-center justify-between text-slate-500">
                        <span>Trung bình: <strong className="font-mono text-blue-600 dark:text-blue-400">{avgPerRoom.toLocaleString('vi-VN')}</strong> lượt/phòng</span>
                        <span className="text-slate-400">Quy mô toàn viện</span>
                    </div>
                </div>

                {/* KPI 2: Cơ Cấu BHYT & Dịch Vụ */}
                <div className="his-kpi-card border-l-4 border-l-emerald-500 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                            <HeartIcon className="w-5 h-5" />
                        </div>
                        <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800">
                            Đối Tượng Khám
                        </span>
                    </div>
                    <div className="mt-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">BHYT vs Viện Phí</span>
                        <div className="flex items-baseline gap-2 mt-0.5">
                            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums tracking-tight">
                                {totals.so_bhyt.toLocaleString('vi-VN')}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">/ {totals.so_dichvu.toLocaleString('vi-VN')} VP</span>
                        </div>
                    </div>
                    {/* Dual Micro Bar */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">BHYT: {bhytRatio}%</span>
                            <span className="text-amber-600 dark:text-amber-400 font-bold">Dịch vụ: {dvRatio}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-amber-200 dark:bg-amber-900/40 rounded-full overflow-hidden flex">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${bhytRatio}%` }} />
                        </div>
                    </div>
                </div>

                {/* KPI 3: Chỉ Định Nhập Viện */}
                <div className="his-kpi-card border-l-4 border-l-indigo-500 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                            <BuildingOfficeIcon className="w-5 h-5" />
                        </div>
                        <span className="px-2 py-0.5 text-[11px] font-bold bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full border border-indigo-200 dark:border-indigo-800">
                            Chuyển Vào Nội Trú
                        </span>
                    </div>
                    <div className="mt-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Chỉ Định Nhập Viện</span>
                        <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono tabular-nums tracking-tight block mt-0.5">
                            {totals.nhap_vien.toLocaleString('vi-VN')}
                        </span>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 text-xs flex items-center justify-between text-slate-500">
                        <span>Tỷ lệ vào viện: <strong className="font-mono text-indigo-600 dark:text-indigo-400">{nhapVienRatio}%</strong></span>
                        <span className="text-slate-400">Khám ➔ Nội trú</span>
                    </div>
                </div>

                {/* KPI 4: Xử Trí & Điều Phối */}
                <div className="his-kpi-card border-l-4 border-l-teal-500 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                        <div className="p-2.5 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-xl">
                            <SparklesIcon className="w-5 h-5" />
                        </div>
                        <span className="px-2 py-0.5 text-[11px] font-bold bg-teal-50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 rounded-full border border-teal-200 dark:border-teal-800">
                            Kết Quả Xử Trí
                        </span>
                    </div>
                    <div className="mt-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Ra Viện / Kê Đơn Về</span>
                        <span className="text-2xl font-black text-teal-600 dark:text-teal-400 font-mono tabular-nums tracking-tight block mt-0.5">
                            {totals.cho_ve.toLocaleString('vi-VN')}
                        </span>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 text-xs flex items-center justify-between text-slate-500">
                        <span>Đang khám: <strong className="font-mono text-blue-600 dark:text-blue-400">{totals.dang_kham.toLocaleString('vi-VN')}</strong> BN</span>
                        <span>Chuyển tuyến: <strong className="font-mono text-rose-600 dark:text-rose-400">{totals.chuyen_vien}</strong></span>
                    </div>
                </div>
            </div>

            {/* BI Executive Visual Charts (Interactive Recharts Panel) */}
            {/* BI Executive Visual Charts (Horizontal Bar + Disposition Flow Matrix) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-3.5 print:hidden">
                {/* Chart 1: Top 7 Clinics (Horizontal Stacked Bar) (7 cols) */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-800 p-4 sm:p-4.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/60">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                <ChartBarIcon className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Top 7 Phòng Khám Lưu Lượng Cao Nhất
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Thanh ngang: Khám BHYT (Xanh ngọc) & Khám Dịch vụ (Hổ phách) (Đơn vị: Lượt)
                                </p>
                            </div>
                        </div>
                        <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-lg self-start sm:self-auto border border-blue-200/60 dark:border-blue-800/60">
                            Thanh ngang (Horizontal Bar)
                        </span>
                    </div>

                    <div className="h-64 w-full mt-3">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                                layout="vertical" 
                                data={top7Clinics} 
                                margin={{ top: 10, right: 25, left: 10, bottom: 10 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" opacity={0.6} />
                                <XAxis 
                                    type="number"
                                    stroke="#64748B" 
                                    fontSize={11} 
                                    tickLine={false}
                                    tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                                />
                                <YAxis 
                                    type="category"
                                    dataKey="name" 
                                    stroke="#64748B" 
                                    fontSize={11} 
                                    width={130}
                                    tickLine={false}
                                />
                                <Tooltip content={<CustomTopClinicsTooltip />} />
                                <Bar dataKey="bhyt" name="bhyt" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="dichvu" name="dichvu" stackId="a" fill="#F59E0B" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Quick Ranking Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-center text-[11px]">
                        {top7Clinics.slice(0, 4).map((c, i) => (
                            <div key={i} className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/40 truncate">
                                <span className="text-slate-400 block truncate">
                                    {i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : `#${i + 1} `}
                                    {c.name}
                                </span>
                                <span className="font-bold font-mono text-slate-900 dark:text-slate-100">
                                    {c.tong.toLocaleString('vi-VN')} lượt
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chart 2: Clinical Disposition / Outcome Process Flow Matrix (5 cols) */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-4 sm:p-4.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/60">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                                    <SparklesIcon className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Kết Quả Xử Trí Khám Bệnh
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Phân loại 4 luồng xử trí bệnh nhân ngoại trú
                                    </p>
                                </div>
                            </div>
                            <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg border border-purple-200/60">
                                {totals.tong_luot_kham.toLocaleString('vi-VN')} lượt
                            </span>
                        </div>

                        {/* Disposition Outcome Flow Cards */}
                        <div className="space-y-2 mt-3">
                            {dispositionData.map((item, idx) => {
                                const pct = totals.tong_luot_kham > 0 ? ((item.value / totals.tong_luot_kham) * 100).toFixed(1) : '0';
                                return (
                                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/60 hover:bg-slate-100/70 transition-colors">
                                        <div className="flex items-center justify-between text-xs mb-1.5">
                                            <div className="flex items-center gap-2 truncate">
                                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                                <span className="font-bold text-slate-800 dark:text-slate-100 truncate">
                                                    {item.name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 font-mono text-xs shrink-0">
                                                <strong className="text-slate-900 dark:text-white font-black">
                                                    {item.value.toLocaleString('vi-VN')} lượt
                                                </strong>
                                                <span className="font-bold text-[11px]" style={{ color: item.color }}>
                                                    ({pct}%)
                                                </span>
                                            </div>
                                        </div>
                                        {/* Progress Bar */}
                                        <div className="w-full bg-slate-200/70 dark:bg-slate-600/40 h-1.5 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{ width: `${pct}%`, backgroundColor: item.color }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bottom Summary Insight Banner */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-emerald-50/50 dark:bg-emerald-950/20 px-3 py-2 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                        <span className="text-[11px] font-medium text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                            <SparklesIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Điều trị ngoại trú: <strong>{totals.tong_luot_kham > 0 ? ((totals.cho_ve / totals.tong_luot_kham) * 100).toFixed(1) : 0}%</strong></span>
                        </span>
                        <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                            Vào viện: {nhapVienRatio}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Quick Clinic Segment Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 print:hidden">
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs">
                    <button
                        type="button"
                        onClick={() => setActiveCategory('ALL')}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                            activeCategory === 'ALL'
                                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <span>Tất cả phòng khám</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-mono">
                            {items.length}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveCategory('HIGH_VOLUME')}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                            activeCategory === 'HIGH_VOLUME'
                                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <span>Tải cao (&gt;3.000 lượt)</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 font-mono">
                            {items.filter(it => Number(it.tong_luot_kham || 0) >= 3000).length}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveCategory('INTERNAL')}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                            activeCategory === 'INTERNAL'
                                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <span>Khối Nội khoa mạn tính</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-mono">
                            {items.filter(it => categorizeClinic(it.room_name || '') === 'INTERNAL').length}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveCategory('SURGICAL_SPECIALTY')}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                            activeCategory === 'SURGICAL_SPECIALTY'
                                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <span>Ngoại & Chuyên khoa lẻ</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 font-mono">
                            {items.filter(it => categorizeClinic(it.room_name || '') === 'SURGICAL_SPECIALTY').length}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveCategory('HEALTH_CHECK')}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                            activeCategory === 'HEALTH_CHECK'
                                ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <span>Khám Sức Khỏe & DV</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 font-mono">
                            {items.filter(it => categorizeClinic(it.room_name || '') === 'HEALTH_CHECK').length}
                        </span>
                    </button>
                </div>

                <span className="text-xs text-slate-400 font-medium">
                    Hiển thị: <strong className="text-slate-700 dark:text-slate-200">{filteredItems.length}</strong> / {items.length} phòng khám
                </span>
            </div>

            {/* Main Table - GCV Standard his-table */}
            <div className="his-table-wrap">
                <table className="his-table w-full text-left text-xs sm:text-sm whitespace-nowrap">
                    <thead className="sticky top-0 z-10 shadow-xs">
                        <tr>
                            <th className="px-4 py-3.5 text-center w-14 font-mono">STT</th>
                            <th 
                                className="px-5 py-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition select-none"
                                onClick={() => handleSort('room_name')}
                            >
                                <div className="flex items-center gap-1.5">
                                    <span>Phòng Khám Chuyên Khoa</span>
                                    {sortField === 'room_name' && (
                                        <span className="text-blue-600 font-bold">{sortAsc ? '▲' : '▼'}</span>
                                    )}
                                </div>
                            </th>
                            <th 
                                className="px-5 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition min-w-[150px] select-none"
                                onClick={() => handleSort('tong_luot_kham')}
                            >
                                <div className="flex items-center justify-end gap-1.5 text-blue-600 dark:text-blue-400 font-black">
                                    <span>Tổng Khám</span>
                                    {sortField === 'tong_luot_kham' && (
                                        <span className="font-bold">{sortAsc ? '▲' : '▼'}</span>
                                    )}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition select-none"
                                onClick={() => handleSort('so_bhyt')}
                            >
                                <div className="flex items-center justify-end gap-1.5 text-emerald-600 dark:text-emerald-400">
                                    <span>BHYT</span>
                                    {sortField === 'so_bhyt' && (
                                        <span className="font-bold">{sortAsc ? '▲' : '▼'}</span>
                                    )}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition select-none"
                                onClick={() => handleSort('so_dichvu')}
                            >
                                <div className="flex items-center justify-end gap-1.5 text-amber-600 dark:text-amber-400">
                                    <span>Dịch Vụ</span>
                                    {sortField === 'so_dichvu' && (
                                        <span className="font-bold">{sortAsc ? '▲' : '▼'}</span>
                                    )}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition select-none min-w-[140px]"
                                onClick={() => handleSort('nhap_vien')}
                            >
                                <div className="flex items-center justify-end gap-1.5 text-indigo-600 dark:text-indigo-400">
                                    <span>Nhập Viện (%)</span>
                                    {sortField === 'nhap_vien' && (
                                        <span className="font-bold">{sortAsc ? '▲' : '▼'}</span>
                                    )}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition select-none"
                                onClick={() => handleSort('chuyen_vien')}
                            >
                                <div className="flex items-center justify-end gap-1.5 text-rose-600 dark:text-rose-400">
                                    <span>Chuyển Tuyến</span>
                                    {sortField === 'chuyen_vien' && (
                                        <span className="font-bold">{sortAsc ? '▲' : '▼'}</span>
                                    )}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition select-none"
                                onClick={() => handleSort('cho_ve')}
                            >
                                <div className="flex items-center justify-end gap-1.5 text-slate-700 dark:text-slate-200">
                                    <span>Ra Viện</span>
                                    {sortField === 'cho_ve' && (
                                        <span className="font-bold">{sortAsc ? '▲' : '▼'}</span>
                                    )}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition select-none"
                                onClick={() => handleSort('dang_kham')}
                            >
                                <div className="flex items-center justify-end gap-1.5 text-slate-500">
                                    <span>Đang Khám</span>
                                    {sortField === 'dang_kham' && (
                                        <span className="font-bold">{sortAsc ? '▲' : '▼'}</span>
                                    )}
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.length === 0 ? (
                            <TableEmptyState 
                                colSpan={9} 
                                title="Không tìm thấy phòng khám phù hợp"
                                message="Vui lòng thử điều chỉnh lại từ khóa tìm kiếm hoặc chọn nhóm phân loại khác"
                                onResetFilter={searchTerm ? () => setSearchTerm('') : undefined}
                            />
                        ) : (
                            filteredItems.map((it, idx) => {
                                const visits = Number(it.tong_luot_kham || 0);
                                const percent = ((visits / maxVisits) * 100).toFixed(0);
                                const nhapVienCa = Number(it.nhap_vien || 0);
                                const nhapVienPct = visits > 0 ? ((nhapVienCa / visits) * 100).toFixed(1) : '0.0';

                                // Rank medals for top 3
                                const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;

                                return (
                                    <tr key={it.room_id} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/60 transition-colors">
                                        <td className="px-4 py-3 text-center text-slate-400 font-mono text-xs font-semibold">
                                            {medal ? (
                                                <span className="text-base leading-none" title={`Hạng ${idx + 1}`}>
                                                    {medal}
                                                </span>
                                            ) : (
                                                idx + 1
                                            )}
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                <span>{it.room_name}</span>
                                                <span className="text-[11px] font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-600">
                                                    P.{it.room_id}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="font-black text-blue-600 dark:text-blue-400 text-sm font-mono tabular-nums">
                                                    {visits.toLocaleString('vi-VN')}
                                                </span>
                                                {visits > 0 && (
                                                    <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300"
                                                            style={{ width: `${percent}%` }}
                                                        ></div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                                            {Number(it.so_bhyt || 0).toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                                            {Number(it.so_dichvu || 0).toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono tabular-nums">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                                    {nhapVienCa.toLocaleString('vi-VN')}
                                                </span>
                                                {nhapVienCa > 0 && (
                                                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                                        {nhapVienPct}%
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-rose-600 dark:text-rose-400 font-mono tabular-nums">
                                            {Number(it.chuyen_vien || 0).toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300 font-mono tabular-nums">
                                            {Number(it.cho_ve || 0).toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-slate-500 font-mono tabular-nums">
                                            {Number(it.dang_kham || 0).toLocaleString('vi-VN')}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                    {/* Sticky Footer Total Row */}
                    <tfoot className="bg-[#edf4fa] dark:bg-slate-700 font-bold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-600 sticky bottom-0 z-10 shadow-md">
                        <tr>
                            <td colSpan={2} className="px-5 py-3.5 text-center uppercase tracking-wider text-xs font-bold text-[#01579b] dark:text-blue-300">
                                TỔNG CỘNG ({filteredItems.length} phòng khám phát sinh)
                            </td>
                            <td className="px-5 py-3.5 text-right font-black text-blue-700 dark:text-blue-300 text-sm font-mono tabular-nums">
                                {totals.tong_luot_kham.toLocaleString('vi-VN')}
                            </td>
                            <td className="px-4 py-3.5 text-right font-black text-emerald-700 dark:text-emerald-300 font-mono tabular-nums">
                                {totals.so_bhyt.toLocaleString('vi-VN')}
                            </td>
                            <td className="px-4 py-3.5 text-right font-black text-amber-700 dark:text-amber-300 font-mono tabular-nums">
                                {totals.so_dichvu.toLocaleString('vi-VN')}
                            </td>
                            <td className="px-4 py-3.5 text-right font-black text-indigo-700 dark:text-indigo-300 font-mono tabular-nums">
                                <div className="flex items-center justify-end gap-1.5">
                                    <span>{totals.nhap_vien.toLocaleString('vi-VN')}</span>
                                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                                        {nhapVienRatio}%
                                    </span>
                                </div>
                            </td>
                            <td className="px-4 py-3.5 text-right font-black text-rose-700 dark:text-rose-300 font-mono tabular-nums">
                                {totals.chuyen_vien.toLocaleString('vi-VN')}
                            </td>
                            <td className="px-4 py-3.5 text-right font-bold text-slate-800 dark:text-slate-100 font-mono tabular-nums">
                                {totals.cho_ve.toLocaleString('vi-VN')}
                            </td>
                            <td className="px-4 py-3.5 text-right font-medium text-slate-600 dark:text-slate-300 font-mono tabular-nums">
                                {totals.dang_kham.toLocaleString('vi-VN')}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <PrintReportFooter />
        </div>
    );
};
