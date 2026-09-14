// ==================== INPATIENT STATISTICS VIEW ====================
// File: modules/hospital-statistics/views/InpatientStatisticsView.tsx
// Standardized to GCV Ninh Binh Medical UI System & Biểu Mẫu 03/BC-NT (Bộ Y Tế)

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CommonFilter, TableEmptyState, PrintReportHeader, PrintReportFooter, exportTableToExcel, formatLocalDate } from '../components/CommonFilter';
import { statisticsService } from '../services/statisticsService';
import { InpatientStatisticsItem } from '../types';
import { 
    ResponsiveContainer, 
    ComposedChart,
    BarChart, 
    Bar, 
    Line,
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
    HeartIcon, 
    UserGroupIcon, 
    BuildingOfficeIcon,
    ArrowPathIcon,
    ChartBarIcon,
    SparklesIcon
} from '../../../components/Icons';

type SortField = 'dept_name' | 'dau_ky' | 'vao_vien' | 'chuyen_den' | 'chuyen_di' | 'ra_vien' | 'tu_vong' | 'hien_dien';
type DeptCategory = 'ALL' | 'HIGH_OCCUPANCY' | 'INTERNAL_ICU' | 'SURGICAL_OBSTETRIC' | 'YHCT_REHAB';

// Helper for Vietnamese unaccented search
const removeVietnameseTones = (str: string): string => {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase();
};

export const InpatientStatisticsView: React.FC = () => {
    const now = new Date();
    const [fromDate, setFromDate] = useState(`${formatLocalDate(now)} 00:00:00`);
    const [toDate, setToDate] = useState(`${formatLocalDate(now)} 23:59:59`);
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<InpatientStatisticsItem[]>([]);

    // Filter & Sort
    const [searchTerm, setSearchTerm] = useState('');
    const [hideEmpty, setHideEmpty] = useState(true);
    const [sortField, setSortField] = useState<SortField>('hien_dien');
    const [sortAsc, setSortAsc] = useState(false);
    const [activeCategory, setActiveCategory] = useState<DeptCategory>('ALL');

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
            const res = await statisticsService.getInpatientStatistics(from, to);
            setItems(res);
        } catch (error) {
            console.error('Error fetching inpatient statistics:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Department Categorization
    const categorizeDept = (name: string): DeptCategory => {
        const clean = removeVietnameseTones(name || '');
        if (clean.includes('yhct') || clean.includes('phcn') || clean.includes('dong y') || clean.includes('phuc hoi')) {
            return 'YHCT_REHAB';
        }
        if (clean.includes('ngoai') || clean.includes('san') || clean.includes('sinh san') || clean.includes('lien chuyen khoa') || clean.includes('tmh') || clean.includes('mat') || clean.includes('rhm')) {
            return 'SURGICAL_OBSTETRIC';
        }
        if (clean.includes('noi') || clean.includes('nhi') || clean.includes('hoi suc') || clean.includes('cap cuu') || clean.includes('truyen nhiem')) {
            return 'INTERNAL_ICU';
        }
        return 'ALL';
    };

    // Filter and sort items with Vietnamese accent-insensitive search
    const filteredItems = useMemo(() => {
        let result = items;

        if (hideEmpty) {
            result = result.filter(it => 
                Number(it.dau_ky || 0) > 0 ||
                Number(it.vao_vien || 0) > 0 ||
                Number(it.chuyen_den || 0) > 0 ||
                Number(it.chuyen_di || 0) > 0 ||
                Number(it.ra_vien || 0) > 0 ||
                Number(it.tu_vong || 0) > 0 ||
                Number(it.hien_dien || 0) > 0
            );
        }

        if (activeCategory !== 'ALL') {
            if (activeCategory === 'HIGH_OCCUPANCY') {
                result = result.filter(it => Number(it.hien_dien || 0) >= 50);
            } else {
                result = result.filter(it => categorizeDept(it.dept_name || '') === activeCategory);
            }
        }

        if (searchTerm.trim()) {
            const cleanQuery = removeVietnameseTones(searchTerm.trim());
            result = result.filter(it => {
                const cleanName = removeVietnameseTones(it.dept_name || '');
                const cleanId = removeVietnameseTones(it.dept_id || '');
                return cleanName.includes(cleanQuery) || cleanId.includes(cleanQuery);
            });
        }

        result = [...result].sort((a, b) => {
            let valA: any = a[sortField];
            let valB: any = b[sortField];
            if (sortField !== 'dept_name') {
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

    // Aggregate totals
    const totals = useMemo(() => {
        return filteredItems.reduce((acc, curr) => ({
            dau_ky: acc.dau_ky + Number(curr.dau_ky || 0),
            vao_vien: acc.vao_vien + Number(curr.vao_vien || 0),
            chuyen_den: acc.chuyen_den + Number(curr.chuyen_den || 0),
            chuyen_di: acc.chuyen_di + Number(curr.chuyen_di || 0),
            ra_vien: acc.ra_vien + Number(curr.ra_vien || 0),
            tu_vong: acc.tu_vong + Number(curr.tu_vong || 0),
            hien_dien: acc.hien_dien + Number(curr.hien_dien || 0)
        }), {
            dau_ky: 0,
            vao_vien: 0,
            chuyen_den: 0,
            chuyen_di: 0,
            ra_vien: 0,
            tu_vong: 0,
            hien_dien: 0
        });
    }, [filteredItems]);

    const maxAdmissions = useMemo(() => {
        return Math.max(...filteredItems.map(it => Number(it.vao_vien || 0)), 1);
    }, [filteredItems]);

    // Ratios & Indicators
    const raVienRatio = totals.vao_vien > 0 ? ((totals.ra_vien / totals.vao_vien) * 100).toFixed(1) : '0.0';
    const tuVongRatio = totals.vao_vien > 0 ? ((totals.tu_vong / totals.vao_vien) * 100).toFixed(2) : '0.00';
    const tongDieuTriTichLuy = totals.dau_ky + totals.vao_vien;

    // Grouped Bar Chart Data (Vào viện vs Ra viện vs Hiện diện)
    const clinicalFlowChartData = useMemo(() => {
        return [...filteredItems]
            .filter(it => Number(it.vao_vien || 0) > 0 || Number(it.hien_dien || 0) > 0)
            .sort((a, b) => Number(b.hien_dien || 0) - Number(a.hien_dien || 0))
            .map(it => {
                const shortName = it.dept_name
                    .replace('Khoa ', '')
                    .replace(' - Truyền Nhiễm', '')
                    .replace(' - Hồi sức cấp cứu', ' - HSCC')
                    .replace(' - Hồi Sức Cấp Cứu', ' - HSCC')
                    .replace('Chăm sóc sức khỏe sinh sản', 'CSSK Sinh Sản')
                    .replace('Liên chuyên khoa(Tai mũi họng- Răng hàm mặt- Mắt)', 'Liên Chuyên Khoa')
                    .replace('Liên chuyên khoa', 'LCK');
                return {
                    name: shortName,
                    fullName: it.dept_name,
                    deptId: it.dept_id,
                    vaoVien: Number(it.vao_vien || 0),
                    raVien: Number(it.ra_vien || 0),
                    hienDien: Number(it.hien_dien || 0),
                    tuVong: Number(it.tu_vong || 0)
                };
            });
    }, [filteredItems]);

    // Donut Chart Data (Cơ cấu Hiện diện Buồng bệnh)
    const occupancyDonutData = useMemo(() => {
        const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#06B6D4', '#64748B'];
        return [...filteredItems]
            .filter(it => Number(it.hien_dien || 0) > 0)
            .sort((a, b) => Number(b.hien_dien || 0) - Number(a.hien_dien || 0))
            .map((it, idx) => {
                const shortName = it.dept_name
                    .replace('Khoa ', '');
                return {
                    name: it.dept_name,
                    shortName: shortName.length > 14 ? `${shortName.substring(0, 12)}...` : shortName,
                    value: Number(it.hien_dien || 0),
                    color: colors[idx % colors.length]
                };
            });
    }, [filteredItems]);

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
            'Mã Khoa': it.dept_id,
            'Tên Khoa Lâm Sàng': it.dept_name,
            'Đầu Kỳ': Number(it.dau_ky || 0),
            'Vào Viện': Number(it.vao_vien || 0),
            'Chuyển Đến': Number(it.chuyen_den || 0),
            'Chuyển Đi': Number(it.chuyen_di || 0),
            'Ra Viện': Number(it.ra_vien || 0),
            'Tỷ Lệ Ra Viện (%)': Number(it.vao_vien || 0) > 0 ? ((Number(it.ra_vien || 0) / Number(it.vao_vien)) * 100).toFixed(1) : '0.0',
            'Tử Vong': Number(it.tu_vong || 0),
            'Hiện Diện Cuối Kỳ': Number(it.hien_dien || 0)
        }));
        rows.push({
            'STT': 'TỔNG CỘNG',
            'Mã Khoa': '',
            'Tên Khoa Lâm Sàng': `${filteredItems.length} khoa lâm sàng`,
            'Đầu Kỳ': totals.dau_ky,
            'Vào Viện': totals.vao_vien,
            'Chuyển Đến': totals.chuyen_den,
            'Chuyển Đi': totals.chuyen_di,
            'Ra Viện': totals.ra_vien,
            'Tỷ Lệ Ra Viện (%)': raVienRatio,
            'Tử Vong': totals.tu_vong,
            'Hiện Diện Cuối Kỳ': totals.hien_dien
        });
        exportTableToExcel(rows, 'Thong_Ke_Noi_Tru', 'Điều Trị Nội Trú');
    };

    // Tooltip for Clinical Flow Chart
    const CustomClinicalFlowTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload;
            return (
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-lg text-xs space-y-1.5">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <HeartIcon className="w-4 h-4 text-emerald-500" />
                        <span>{item.fullName}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 rounded">
                            {item.deptId}
                        </span>
                    </div>
                    <div className="pt-1 border-t border-slate-100 dark:border-slate-800 space-y-1">
                        <p className="flex justify-between gap-4">
                            <span className="text-blue-600 dark:text-blue-400 font-medium">Vào viện mới:</span>
                            <strong className="font-mono">{item.vaoVien.toLocaleString('vi-VN')} người bệnh</strong>
                        </p>
                        <p className="flex justify-between gap-4">
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Ra viện (khỏi, đỡ):</span>
                            <strong className="font-mono">{item.raVien.toLocaleString('vi-VN')} người bệnh</strong>
                        </p>
                        <p className="flex justify-between gap-4">
                            <span className="text-purple-600 dark:text-purple-400 font-medium">Hiện diện buồng bệnh:</span>
                            <strong className="font-mono text-purple-600 dark:text-purple-400">{item.hienDien.toLocaleString('vi-VN')} người bệnh</strong>
                        </p>
                        {item.tuVong > 0 && (
                            <p className="flex justify-between gap-4 text-rose-600 dark:text-rose-400 font-bold">
                                <span>Tử vong:</span>
                                <strong className="font-mono">{item.tuVong} ca</strong>
                            </p>
                        )}
                    </div>
                </div>
            );
        }
        return null;
    };

    // Tooltip for Occupancy Donut
    const CustomOccupancyTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload;
            const pct = totals.hien_dien > 0 ? ((item.value / totals.hien_dien) * 100).toFixed(1) : '0.0';
            return (
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-lg text-xs space-y-1">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="font-bold text-slate-800 dark:text-white">{item.name}</span>
                    </div>
                    <p className="font-mono font-black text-sm" style={{ color: item.color }}>
                        {Number(item.value).toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500">người bệnh hiện diện</span>
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                        Chiếm <strong>{pct}%</strong> tổng buồng bệnh nội trú
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-3 sm:space-y-3.5">
            {/* Header section with fast navigation switcher */}
            <div className="print:hidden flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                            <HeartIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            <span>Báo Cáo Thống Kê Điều Trị Nội Trú</span>
                        </h1>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800 shadow-xs">
                            Biểu Mẫu 03/BC-NT
                        </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Theo dõi biến động người bệnh vào viện, chuyển khoa, ra viện, tử vong và số lượng hiện diện tại các buồng bệnh
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        to="/hospital-statistics/clinics"
                        className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition"
                    >
                        ← Khám Bệnh
                    </Link>
                    <Link
                        to="/hospital-statistics/paraclinical"
                        className="px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition"
                    >
                        Cận Lâm Sàng →
                    </Link>
                </div>
            </div>

            {/* Print Header (Visible only when printing) */}
            <PrintReportHeader 
                formCode="Biểu mẫu: 03/BC-NT"
                title="BÁO CÁO BIẾN ĐỘNG NGƯỜI BỆNH ĐIỀU TRỊ NỘI TRÚ"
                subtitle="Bảng cân đối chuyển động người bệnh theo các khoa lâm sàng"
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
                searchPlaceholder="Tìm tên khoa (gõ không dấu: hoi suc, ngoai, nhi...) hoặc mã khoa..."
                hideEmpty={hideEmpty}
                onHideEmptyChange={setHideEmpty}
                totalCount={items.length}
                filteredCount={filteredItems.length}
            />

            {/* 4 Executive Clinical KPI Cards - GCV Standard his-kpi-card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 print:hidden">
                {/* KPI 1: Nhập Viện Mới */}
                <div className="his-kpi-card border-l-4 border-l-blue-500 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                            <BuildingOfficeIcon className="w-5 h-5" />
                        </div>
                        <span className="px-2 py-0.5 text-[11px] font-bold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800">
                            Nhập Viện Mới
                        </span>
                    </div>
                    <div className="mt-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Người Bệnh Vào Viện</span>
                        <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums tracking-tight block mt-0.5">
                            {totals.vao_vien.toLocaleString('vi-VN')}
                        </span>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 text-xs flex items-center justify-between text-slate-500">
                        <span>Đầu kỳ: <strong className="font-mono text-slate-700 dark:text-slate-200">{totals.dau_ky.toLocaleString('vi-VN')}</strong></span>
                        <span>Tổng tích lũy: <strong className="font-mono text-blue-600 dark:text-blue-400">{tongDieuTriTichLuy.toLocaleString('vi-VN')}</strong></span>
                    </div>
                </div>

                {/* KPI 2: Hiện Diện Buồng Bệnh */}
                <div className="his-kpi-card border-l-4 border-l-purple-500 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                        <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
                            <HeartIcon className="w-5 h-5" />
                        </div>
                        <span className="px-2 py-0.5 text-[11px] font-bold bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full border border-purple-200 dark:border-purple-800">
                            Đang Điều Trị
                        </span>
                    </div>
                    <div className="mt-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Hiện Diện Buồng Bệnh</span>
                        <span className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono tabular-nums tracking-tight block mt-0.5">
                            {totals.hien_dien.toLocaleString('vi-VN')}
                        </span>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 text-xs flex items-center justify-between text-slate-500">
                        <span>Quy mô: <strong className="font-mono text-purple-700 dark:text-purple-300">{filteredItems.length}</strong> khoa</span>
                        <span className="text-slate-400">Cuối chu kỳ</span>
                    </div>
                </div>

                {/* KPI 3: Xuất Viện (Ra Viện Khỏi, Đỡ) */}
                <div className="his-kpi-card border-l-4 border-l-emerald-500 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                            <UserGroupIcon className="w-5 h-5" />
                        </div>
                        <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800">
                            Xuất Viện Thành Công
                        </span>
                    </div>
                    <div className="mt-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Người Bệnh Ra Viện</span>
                        <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums tracking-tight block mt-0.5">
                            {totals.ra_vien.toLocaleString('vi-VN')}
                        </span>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 text-xs flex items-center justify-between text-slate-500">
                        <span>Tỷ lệ ra/vào: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{raVienRatio}%</strong></span>
                        <span className="text-slate-400">Khỏi, đỡ, chuyển viện</span>
                    </div>
                </div>

                {/* KPI 4: An Toàn Điều Trị & Luân Chuyển */}
                <div className="his-kpi-card border-l-4 border-l-indigo-500 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                            <ArrowPathIcon className="w-5 h-5" />
                        </div>
                        <span className="px-2 py-0.5 text-[11px] font-bold bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full border border-indigo-200 dark:border-indigo-800">
                            Luân Chuyển Khoa
                        </span>
                    </div>
                    <div className="mt-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Chuyển Đến / Đi Nội Bộ</span>
                        <div className="flex items-baseline gap-2 mt-0.5">
                            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono tabular-nums tracking-tight">
                                {totals.chuyen_den.toLocaleString('vi-VN')}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">/ {totals.chuyen_di.toLocaleString('vi-VN')} ca</span>
                        </div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 text-xs flex items-center justify-between text-slate-500">
                        <span className={totals.tu_vong > 0 ? 'text-rose-600 font-bold' : ''}>
                            Tử vong: <strong className="font-mono">{totals.tu_vong}</strong> ca ({tuVongRatio}%)
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Cân đối 100%</span>
                    </div>
                </div>
            </div>

            {/* BI Executive Visual Charts (Interactive Recharts Panel) */}
            {/* BI Executive Visual Charts (Interactive Composed + Census Matrix Panel) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-3.5 print:hidden">
                {/* Chart 1: Composed Chart for Clinical Flow & Active Census (7 cols) */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-800 p-4 sm:p-4.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/60">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                <ChartBarIcon className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Lưu Lượng Vào - Ra Viện & Hiện Diện Buồng Bệnh
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Cột: Vào viện (Xanh dương) & Ra viện (Xanh lục) • Đường tím: BN hiện diện tại khoa
                                </p>
                            </div>
                        </div>
                        <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-lg self-start sm:self-auto border border-blue-200/60 dark:border-blue-800/60">
                            Biểu đồ kết hợp (Composed)
                        </span>
                    </div>

                    <div className="h-64 w-full mt-3">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={clinicalFlowChartData} margin={{ top: 15, right: 15, left: -5, bottom: 25 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                                <XAxis 
                                    dataKey="name" 
                                    stroke="#64748B" 
                                    fontSize={11} 
                                    tickLine={false}
                                    interval={0}
                                    tick={(props) => {
                                        const { x, y, payload } = props;
                                        return (
                                            <g transform={`translate(${x},${y})`}>
                                                <text x={0} y={0} dy={12} textAnchor="middle" fill="#64748B" fontSize={10} fontWeight={600}>
                                                    {payload.value.length > 13 ? `${payload.value.substring(0, 11)}...` : payload.value}
                                                </text>
                                            </g>
                                        );
                                    }}
                                />
                                <YAxis 
                                    stroke="#64748B" 
                                    fontSize={11} 
                                    tickLine={false}
                                    allowDecimals={false}
                                    tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                                />
                                <Tooltip content={<CustomClinicalFlowTooltip />} />
                                <Bar dataKey="vaoVien" name="vaoVien" fill="#2563EB" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="raVien" name="raVien" fill="#10B981" radius={[4, 4, 0, 0]} />
                                <Line 
                                    type="monotone" 
                                    dataKey="hienDien" 
                                    name="hienDien" 
                                    stroke="#8B5CF6" 
                                    strokeWidth={3} 
                                    dot={{ r: 4, fill: '#8B5CF6', strokeWidth: 2, stroke: '#FFFFFF' }} 
                                    activeDot={{ r: 6 }} 
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Quick Indicator Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-center text-[11px]">
                        {clinicalFlowChartData.slice(0, 4).map((c, i) => (
                            <div key={i} className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/40 truncate">
                                <span className="text-slate-400 block truncate">
                                    {i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : `#${i + 1} `}
                                    {c.name}
                                </span>
                                <span className="font-bold font-mono text-purple-600 dark:text-purple-400">
                                    {c.hienDien.toLocaleString('vi-VN')} BN hiện diện
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chart 2: Department Inpatient Census Breakdown Matrix (5 cols) */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-4 sm:p-4.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/60">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                                    <HeartIcon className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Cơ Cấu Hiện Diện Buồng Bệnh
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Quy mô & tỷ trọng người bệnh đang nằm viện
                                    </p>
                                </div>
                            </div>
                            <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg border border-purple-200/60">
                                {totals.hien_dien.toLocaleString('vi-VN')} BN
                            </span>
                        </div>

                        {/* Ranked Census List */}
                        <div className="space-y-2 mt-3 max-h-60 overflow-y-auto pr-1">
                            {occupancyDonutData.map((item, idx) => {
                                const pct = totals.hien_dien > 0 ? ((item.value / totals.hien_dien) * 100).toFixed(1) : '0';
                                const isTop = idx < 3;
                                return (
                                    <div key={idx} className="p-2 rounded-xl bg-slate-50/80 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/60 hover:bg-slate-100/70 transition-colors">
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <div className="flex items-center gap-1.5 truncate">
                                                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                                                    idx === 0 ? 'bg-amber-100 text-amber-700 border border-amber-300' :
                                                    idx === 1 ? 'bg-slate-200 text-slate-700 border border-slate-300' :
                                                    idx === 2 ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                                                    'bg-slate-100 text-slate-500'
                                                }`}>
                                                    {idx + 1}
                                                </span>
                                                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                                                <span className={`font-semibold truncate ${isTop ? 'text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                                                    {item.name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 font-mono text-xs shrink-0">
                                                <strong className="text-purple-600 dark:text-purple-400 font-black">
                                                    {item.value.toLocaleString('vi-VN')} BN
                                                </strong>
                                                <span className="text-slate-400 text-[10px]">
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

                    {/* Bottom Summary Insight */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-purple-50/50 dark:bg-purple-950/20 px-3 py-2 rounded-xl border border-purple-100 dark:border-purple-900/40">
                        <span className="text-[11px] font-medium text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                            <SparklesIcon className="w-4 h-4 text-purple-600 shrink-0" />
                            <span>Top 2 khoa: <strong>{occupancyDonutData.slice(0, 2).map(it => it.shortName).join(' & ')}</strong></span>
                        </span>
                        <span className="font-mono text-[11px] font-bold text-purple-700 dark:text-purple-300">
                            {totals.hien_dien > 0 ? (((occupancyDonutData[0]?.value || 0) + (occupancyDonutData[1]?.value || 0)) / totals.hien_dien * 100).toFixed(1) : 0}% BN
                        </span>
                    </div>
                </div>
            </div>

            {/* Quick Department Segment Tabs */}
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
                        <span>Tất cả khoa lâm sàng</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-mono">
                            {items.length}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveCategory('HIGH_OCCUPANCY')}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                            activeCategory === 'HIGH_OCCUPANCY'
                                ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <span>Khoa đông BN (&gt;50 hiện diện)</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 font-mono">
                            {items.filter(it => Number(it.hien_dien || 0) >= 50).length}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveCategory('INTERNAL_ICU')}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                            activeCategory === 'INTERNAL_ICU'
                                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <span>Khối Nội - Nhi - Hồi Sức</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-mono">
                            {items.filter(it => categorizeDept(it.dept_name || '') === 'INTERNAL_ICU').length}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveCategory('SURGICAL_OBSTETRIC')}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                            activeCategory === 'SURGICAL_OBSTETRIC'
                                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <span>Ngoại - Sản - Chuyên Khoa</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 font-mono">
                            {items.filter(it => categorizeDept(it.dept_name || '') === 'SURGICAL_OBSTETRIC').length}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveCategory('YHCT_REHAB')}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                            activeCategory === 'YHCT_REHAB'
                                ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <span>Khối YHCT & PHCN</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 font-mono">
                            {items.filter(it => categorizeDept(it.dept_name || '') === 'YHCT_REHAB').length}
                        </span>
                    </button>
                </div>

                <span className="text-xs text-slate-400 font-medium">
                    Hiển thị: <strong className="text-slate-700 dark:text-slate-200">{filteredItems.length}</strong> / {items.length} khoa lâm sàng
                </span>
            </div>

            {/* Main Table (gcv-ninhbinh his-table standard) */}
            <div className="his-table-wrap">
                <table className="his-table w-full text-left text-xs sm:text-sm whitespace-nowrap">
                    <thead className="sticky top-0 z-10 shadow-xs">
                        <tr>
                            <th className="px-4 py-3.5 text-center w-14 font-mono">STT</th>
                            <th 
                                className="px-5 py-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition select-none"
                                onClick={() => handleSort('dept_name')}
                            >
                                <div className="flex items-center gap-1.5">
                                    <span>Khoa Điều Trị Lâm Sàng</span>
                                    {sortField === 'dept_name' && (
                                        <span className="text-blue-600 font-bold">{sortAsc ? '▲' : '▼'}</span>
                                    )}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition select-none"
                                onClick={() => handleSort('dau_ky')}
                            >
                                <div className="flex items-center justify-end gap-1.5">
                                    <span>Đầu Kỳ</span>
                                    {sortField === 'dau_ky' && (
                                        <span className="font-bold">{sortAsc ? '▲' : '▼'}</span>
                                    )}
                                </div>
                            </th>
                            <th 
                                className="px-5 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition min-w-[150px] select-none"
                                onClick={() => handleSort('vao_vien')}
                            >
                                <div className="flex items-center justify-end gap-1.5 text-blue-600 dark:text-blue-400 font-black">
                                    <span>Vào Viện</span>
                                    {sortField === 'vao_vien' && (
                                        <span className="font-bold">{sortAsc ? '▲' : '▼'}</span>
                                    )}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition select-none"
                                onClick={() => handleSort('chuyen_den')}
                            >
                                <div className="flex items-center justify-end gap-1.5 text-indigo-600 dark:text-indigo-400">
                                    <span>Chuyển Đến</span>
                                    {sortField === 'chuyen_den' && (
                                        <span className="font-bold">{sortAsc ? '▲' : '▼'}</span>
                                    )}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition select-none"
                                onClick={() => handleSort('chuyen_di')}
                            >
                                <div className="flex items-center justify-end gap-1.5 text-amber-600 dark:text-amber-400">
                                    <span>Chuyển Đi</span>
                                    {sortField === 'chuyen_di' && (
                                        <span className="font-bold">{sortAsc ? '▲' : '▼'}</span>
                                    )}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition select-none min-w-[140px]"
                                onClick={() => handleSort('ra_vien')}
                            >
                                <div className="flex items-center justify-end gap-1.5 text-emerald-600 dark:text-emerald-400 font-black">
                                    <span>Ra Viện (%)</span>
                                    {sortField === 'ra_vien' && (
                                        <span className="font-bold">{sortAsc ? '▲' : '▼'}</span>
                                    )}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition select-none"
                                onClick={() => handleSort('tu_vong')}
                            >
                                <div className="flex items-center justify-end gap-1.5 text-rose-600 dark:text-rose-400 font-bold">
                                    <span>Tử Vong</span>
                                    {sortField === 'tu_vong' && (
                                        <span className="font-bold">{sortAsc ? '▲' : '▼'}</span>
                                    )}
                                </div>
                            </th>
                            <th 
                                className="px-5 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition min-w-[140px] select-none"
                                onClick={() => handleSort('hien_dien')}
                            >
                                <div className="flex items-center justify-end gap-1.5 text-purple-600 dark:text-purple-400 font-black">
                                    <span>Hiện Diện (Cuối kỳ)</span>
                                    {sortField === 'hien_dien' && (
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
                                title="Không tìm thấy khoa phòng"
                                message="Không có khoa phòng nào phù hợp với bộ lọc hoặc từ khóa tìm kiếm hiện tại."
                                onResetFilter={() => {
                                    setSearchTerm('');
                                    setHideEmpty(false);
                                    setActiveCategory('ALL');
                                }}
                            />
                        ) : (
                            filteredItems.map((it, idx) => {
                                const admissions = Number(it.vao_vien || 0);
                                const discharges = Number(it.ra_vien || 0);
                                const percent = ((admissions / maxAdmissions) * 100).toFixed(0);
                                const dischargeRate = admissions > 0 ? ((discharges / admissions) * 100).toFixed(1) : '0.0';

                                // Medals for top 3 by inpatient occupancy
                                const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;

                                return (
                                    <tr key={it.dept_id} className="hover:bg-emerald-50/40 dark:hover:bg-slate-800/60 transition-colors">
                                        <td className="px-4 py-3 text-center text-slate-400 font-mono text-xs font-semibold">
                                            {medal ? (
                                                <span className="text-base leading-none" title={`Hạng ${idx + 1} Tải Buồng Bệnh`}>
                                                    {medal}
                                                </span>
                                            ) : (
                                                idx + 1
                                            )}
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                <span>{it.dept_name}</span>
                                                <span className="text-[11px] font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-600">
                                                    {it.dept_id}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-300 font-mono tabular-nums">
                                            {Number(it.dau_ky || 0).toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-5 py-3 text-right font-mono tabular-nums">
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="font-black text-blue-600 dark:text-blue-400 text-sm font-mono tabular-nums">
                                                    {admissions.toLocaleString('vi-VN')}
                                                </span>
                                                {admissions > 0 && (
                                                    <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300"
                                                            style={{ width: `${percent}%` }}
                                                        ></div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">
                                            {Number(it.chuyen_den || 0).toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                                            {Number(it.chuyen_di || 0).toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono tabular-nums">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                    {discharges.toLocaleString('vi-VN')}
                                                </span>
                                                {admissions > 0 && (
                                                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                        {dischargeRate}%
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-rose-600 dark:text-rose-400 font-mono tabular-nums">
                                            {Number(it.tu_vong || 0).toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-5 py-3 text-right font-black text-purple-600 dark:text-purple-400 text-base font-mono tabular-nums">
                                            {Number(it.hien_dien || 0).toLocaleString('vi-VN')}
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
                                TỔNG CỘNG ({filteredItems.length} khoa phòng phát sinh)
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono tabular-nums font-bold text-slate-700 dark:text-slate-200">
                                {totals.dau_ky.toLocaleString('vi-VN')}
                            </td>
                            <td className="px-5 py-3.5 text-right font-mono tabular-nums font-black text-blue-600 dark:text-blue-300 text-sm">
                                {totals.vao_vien.toLocaleString('vi-VN')}
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono tabular-nums font-bold text-indigo-600 dark:text-indigo-300">
                                {totals.chuyen_den.toLocaleString('vi-VN')}
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono tabular-nums font-bold text-amber-600 dark:text-amber-300">
                                {totals.chuyen_di.toLocaleString('vi-VN')}
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono tabular-nums font-black text-emerald-600 dark:text-emerald-300">
                                <div className="flex items-center justify-end gap-1.5">
                                    <span>{totals.ra_vien.toLocaleString('vi-VN')}</span>
                                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                                        {raVienRatio}%
                                    </span>
                                </div>
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono tabular-nums font-black text-rose-600 dark:text-rose-300">
                                {totals.tu_vong.toLocaleString('vi-VN')}
                            </td>
                            <td className="px-5 py-3.5 text-right font-mono tabular-nums font-black text-purple-600 dark:text-purple-300 text-base">
                                {totals.hien_dien.toLocaleString('vi-VN')}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <PrintReportFooter />
        </div>
    );
};
