// ==================== SURGERY STATISTICS VIEW ====================
// File: modules/hospital-statistics/views/SurgeryStatisticsView.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
    ResponsiveContainer, 
    BarChart, 
    Bar, 
    PieChart, 
    Pie, 
    Cell, 
    XAxis, 
    YAxis, 
    Tooltip, 
    Legend, 
    CartesianGrid 
} from 'recharts';
import { CommonFilter, TableEmptyState, PrintReportHeader, PrintReportFooter, exportTableToExcel, formatLocalDate } from '../components/CommonFilter';
import { statisticsService } from '../services/statisticsService';
import { SurgeryStatisticsItem } from '../types';
import { 
    UserGroupIcon, 
    SparklesIcon, 
    BuildingOfficeIcon 
} from '../../../components/Icons';

type SortField = 'dept_name' | 'tong_benh_nhan' | 'tong_so_ca' | 'loai_dac_biet' | 'loai_1' | 'loai_2' | 'loai_3' | 'thu_thuat' | 'pt_rate';

// Helper for Vietnamese unaccented search
const removeVietnameseTones = (str: string): string => {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase();
};

const ScissorsIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m7.848 8.25 1.536.887m8.412-2.316a3.75 3.75 0 1 1-2.916 6.079L10.5 15l-1.077-.622m7.848-8.25a3.75 3.75 0 0 0-5.304 0l-4.596 4.596m0 0L4.5 12.75a3.75 3.75 0 1 0 5.303 5.304l2.42-2.42m-4.846-4.847 4.846 4.847" />
    </svg>
);

export const SurgeryStatisticsView: React.FC = () => {
    const now = new Date();
    const [fromDate, setFromDate] = useState(`${formatLocalDate(now)} 00:00:00`);
    const [toDate, setToDate] = useState(`${formatLocalDate(now)} 23:59:59`);
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<SurgeryStatisticsItem[]>([]);

    // Filter & Sort
    const [searchTerm, setSearchTerm] = useState('');
    const [hideEmpty, setHideEmpty] = useState(true);
    const [sortField, setSortField] = useState<SortField>('tong_so_ca');
    const [sortAsc, setSortAsc] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'HAS_SURGERY' | 'PROCEDURE_ONLY' | 'HIGH_VOLUME'>('ALL');

    // Auto-scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
        const main = document.querySelector('main');
        if (main) main.scrollTo(0, 0);
    }, []);

    // Support override parameters from CommonFilter preset buttons
    const fetchData = async (overrideFrom?: string, overrideTo?: string) => {
        const from = overrideFrom || fromDate;
        const to = overrideTo || toDate;
        setLoading(true);
        try {
            const res = await statisticsService.getSurgeryStatistics(from, to);
            setItems(res);
        } catch (error) {
            console.error('Error fetching surgery statistics:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Filter and sort items with Vietnamese accent-insensitive search
    const filteredItems = useMemo(() => {
        let result = items;

        if (hideEmpty) {
            result = result.filter(it => Number(it.tong_so_ca || 0) > 0);
        }

        // Category filter
        if (selectedCategory === 'HAS_SURGERY') {
            result = result.filter(it => {
                const pt = Number(it.loai_dac_biet || 0) + Number(it.loai_1 || 0) + Number(it.loai_2 || 0) + Number(it.loai_3 || 0);
                return pt > 0;
            });
        } else if (selectedCategory === 'PROCEDURE_ONLY') {
            result = result.filter(it => {
                const pt = Number(it.loai_dac_biet || 0) + Number(it.loai_1 || 0) + Number(it.loai_2 || 0) + Number(it.loai_3 || 0);
                return pt === 0 && Number(it.thu_thuat || 0) > 0;
            });
        } else if (selectedCategory === 'HIGH_VOLUME') {
            result = result.filter(it => Number(it.tong_so_ca || 0) >= 1000);
        }

        if (searchTerm.trim()) {
            const normalized = removeVietnameseTones(searchTerm.trim());
            result = result.filter(it => 
                (it.dept_name && removeVietnameseTones(it.dept_name).includes(normalized)) ||
                (it.dept_id && it.dept_id.toLowerCase().includes(normalized))
            );
        }

        result = [...result].sort((a, b) => {
            let valA: any;
            let valB: any;

            if (sortField === 'pt_rate') {
                const ptA = Number(a.loai_dac_biet || 0) + Number(a.loai_1 || 0) + Number(a.loai_2 || 0) + Number(a.loai_3 || 0);
                const totalA = Number(a.tong_so_ca || 0);
                valA = totalA > 0 ? (ptA / totalA) : 0;

                const ptB = Number(b.loai_dac_biet || 0) + Number(b.loai_1 || 0) + Number(b.loai_2 || 0) + Number(b.loai_3 || 0);
                const totalB = Number(b.tong_so_ca || 0);
                valB = totalB > 0 ? (ptB / totalB) : 0;
            } else if (sortField !== 'dept_name') {
                valA = Number(a[sortField as keyof SurgeryStatisticsItem] || 0);
                valB = Number(b[sortField as keyof SurgeryStatisticsItem] || 0);
            } else {
                valA = String(a.dept_name || '').toLowerCase();
                valB = String(b.dept_name || '').toLowerCase();
            }

            if (valA < valB) return sortAsc ? -1 : 1;
            if (valA > valB) return sortAsc ? 1 : -1;
            return 0;
        });

        return result;
    }, [items, hideEmpty, selectedCategory, searchTerm, sortField, sortAsc]);

    // Aggregate totals
    const totals = useMemo(() => {
        return filteredItems.reduce((acc, curr) => ({
            tong_benh_nhan: acc.tong_benh_nhan + Number(curr.tong_benh_nhan || 0),
            tong_so_ca: acc.tong_so_ca + Number(curr.tong_so_ca || 0),
            loai_dac_biet: acc.loai_dac_biet + Number(curr.loai_dac_biet || 0),
            loai_1: acc.loai_1 + Number(curr.loai_1 || 0),
            loai_2: acc.loai_2 + Number(curr.loai_2 || 0),
            loai_3: acc.loai_3 + Number(curr.loai_3 || 0),
            thu_thuat: acc.thu_thuat + Number(curr.thu_thuat || 0)
        }), { tong_benh_nhan: 0, tong_so_ca: 0, loai_dac_biet: 0, loai_1: 0, loai_2: 0, loai_3: 0, thu_thuat: 0 });
    }, [filteredItems]);

    // Calculate total surgeries (Special + Type 1 + 2 + 3)
    const tongPhauThuat = totals.loai_dac_biet + totals.loai_1 + totals.loai_2 + totals.loai_3;

    // Category counts for badges
    const countHasSurgery = useMemo(() => {
        return items.filter(it => {
            const pt = Number(it.loai_dac_biet || 0) + Number(it.loai_1 || 0) + Number(it.loai_2 || 0) + Number(it.loai_3 || 0);
            return pt > 0;
        }).length;
    }, [items]);

    const countProcedureOnly = useMemo(() => {
        return items.filter(it => {
            const pt = Number(it.loai_dac_biet || 0) + Number(it.loai_1 || 0) + Number(it.loai_2 || 0) + Number(it.loai_3 || 0);
            return pt === 0 && Number(it.thu_thuat || 0) > 0;
        }).length;
    }, [items]);

    const countHighVolume = useMemo(() => {
        return items.filter(it => Number(it.tong_so_ca || 0) >= 1000).length;
    }, [items]);

    // Top departments for medals
    const topVolumeDepts = useMemo(() => {
        return [...items]
            .filter(it => Number(it.tong_so_ca || 0) > 0)
            .sort((a, b) => Number(b.tong_so_ca || 0) - Number(a.tong_so_ca || 0));
    }, [items]);
    const top1Id = topVolumeDepts[0]?.dept_id;
    const top2Id = topVolumeDepts[1]?.dept_id;
    const top3Id = topVolumeDepts[2]?.dept_id;

    const maxVolume = useMemo(() => {
        return Math.max(...filteredItems.map(it => Number(it.tong_so_ca || 0)), 1);
    }, [filteredItems]);

    // Stacked Bar Chart Data: Surgery vs Procedure by Department
    const barChartData = useMemo(() => {
        return [...filteredItems]
            .filter(it => Number(it.tong_so_ca || 0) > 0)
            .sort((a, b) => Number(b.tong_so_ca || 0) - Number(a.tong_so_ca || 0))
            .map(it => {
                const pt = Number(it.loai_dac_biet || 0) + Number(it.loai_1 || 0) + Number(it.loai_2 || 0) + Number(it.loai_3 || 0);
                const tt = Number(it.thu_thuat || 0);
                const total = Number(it.tong_so_ca || 0);
                const shortName = it.dept_name.length > 18 
                    ? it.dept_name.slice(0, 18) + '...' 
                    : it.dept_name;
                return {
                    name: shortName,
                    fullName: it.dept_name,
                    deptId: it.dept_id,
                    phau_thuat: pt,
                    thu_thuat: tt,
                    total: total,
                    patients: Number(it.tong_benh_nhan || 0),
                    ptRate: total > 0 ? ((pt / total) * 100).toFixed(1) : '0'
                };
            });
    }, [filteredItems]);

    // Donut Chart Data: Surgery Levels Breakdown
    const donutChartData = useMemo(() => {
        return [
            { name: 'Loại 3', value: totals.loai_3, color: '#10B981', code: 'L3' },
            { name: 'Loại 2', value: totals.loai_2, color: '#3B82F6', code: 'L2' },
            { name: 'Loại 1', value: totals.loai_1, color: '#F59E0B', code: 'L1' },
            { name: 'Loại Đặc Biệt', value: totals.loai_dac_biet, color: '#EF4444', code: 'ĐB' }
        ].filter(it => it.value > 0);
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
        const rows = filteredItems.map((it, idx) => {
            const pt = Number(it.loai_dac_biet || 0) + Number(it.loai_1 || 0) + Number(it.loai_2 || 0) + Number(it.loai_3 || 0);
            const total = Number(it.tong_so_ca || 0);
            return {
                'STT': idx + 1,
                'Mã Khoa': it.dept_id,
                'Khoa Thực Hiện': it.dept_name,
                'Số Bệnh Nhân': Number(it.tong_benh_nhan || 0),
                'Tổng Số Ca PTTT': total,
                'Tỷ Lệ Phẫu Thuật (%)': total > 0 ? ((pt / total) * 100).toFixed(1) + '%' : '0%',
                'Tổng Phẫu Thuật': pt,
                'PT Loại Đặc Biệt': Number(it.loai_dac_biet || 0),
                'PT Loại 1': Number(it.loai_1 || 0),
                'PT Loại 2': Number(it.loai_2 || 0),
                'PT Loại 3': Number(it.loai_3 || 0),
                'Thủ Thuật': Number(it.thu_thuat || 0)
            };
        });
        rows.push({
            'STT': 'TỔNG CỘNG',
            'Mã Khoa': '',
            'Khoa Thực Hiện': `${filteredItems.length} khoa phòng`,
            'Số Bệnh Nhân': totals.tong_benh_nhan,
            'Tổng Số Ca PTTT': totals.tong_so_ca,
            'Tỷ Lệ Phẫu Thuật (%)': totals.tong_so_ca > 0 ? ((tongPhauThuat / totals.tong_so_ca) * 100).toFixed(1) + '%' : '0%',
            'Tổng Phẫu Thuật': tongPhauThuat,
            'PT Loại Đặc Biệt': totals.loai_dac_biet,
            'PT Loại 1': totals.loai_1,
            'PT Loại 2': totals.loai_2,
            'PT Loại 3': totals.loai_3,
            'Thủ Thuật': totals.thu_thuat
        });
        exportTableToExcel(rows, 'Thong_Ke_Phau_Thuat_Thu_Thuat', 'Thống Kê PTTT');
    };

    const avgIntensity = totals.tong_benh_nhan > 0 
        ? (totals.tong_so_ca / totals.tong_benh_nhan).toFixed(1) 
        : '0';
    const overallPtRate = totals.tong_so_ca > 0 
        ? ((tongPhauThuat / totals.tong_so_ca) * 100).toFixed(1) 
        : '0';
    const overallTtRate = totals.tong_so_ca > 0 
        ? ((totals.thu_thuat / totals.tong_so_ca) * 100).toFixed(1) 
        : '0';

    return (
        <div className="space-y-3 sm:space-y-3.5">
            {/* Header section with fast navigation switcher */}
            <div className="print:hidden flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2.5">
                        <ScissorsIcon className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                        <span>Báo cáo Thống kê Phẫu thuật - Thủ thuật</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Theo dõi chi tiết số ca phẫu thuật phân loại theo cấp độ (Đặc biệt, Loại 1, 2, 3) và các thủ thuật chuyên môn
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        to="/hospital-statistics/paraclinical"
                        className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition"
                    >
                        ← Cận Lâm Sàng
                    </Link>
                    <Link
                        to="/hospital-statistics/department-costs"
                        className="px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition"
                    >
                        Chi Phí Khoa Phòng →
                    </Link>
                </div>
            </div>

            {/* Print Header */}
            <PrintReportHeader 
                formCode="Biểu mẫu: 05/BC-PTTT"
                title="BÁO CÁO THỐNG KÊ HOẠT ĐỘNG PHẪU THUẬT - THỦ THUẬT"
                subtitle="Phân loại theo mức độ phức tạp và khoa phòng thực hiện"
                fromDate={fromDate}
                toDate={toDate}
            />

            {/* Filter Bar with Auto-refresh on preset */}
            <CommonFilter
                fromDate={fromDate}
                toDate={toDate}
                onFromDateChange={setFromDate}
                onToDateChange={setToDate}
                onRefresh={(f, t) => fetchData(f, t)}
                loading={loading}
                onExportExcel={handleExport}
                onPrint={() => window.print()}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Tìm tên khoa hoặc mã khoa..."
                hideEmpty={hideEmpty}
                onHideEmptyChange={setHideEmpty}
                totalCount={items.length}
                filteredCount={filteredItems.length}
            />

            {/* 4 Executive Clinical KPI Cards (gcv-ninhbinh his-kpi-card standard) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 print:hidden">
                {/* Card 1: Tổng Ca PTTT */}
                <div className="his-kpi-card border-l-4 border-l-blue-500 p-4.5 rounded-xl bg-white dark:bg-slate-800 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                            Tổng Hoạt Động PTTT
                        </span>
                        <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                            <ScissorsIcon className="w-5 h-5" />
                        </span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums mt-1">
                        {totals.tong_so_ca.toLocaleString('vi-VN')}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>{filteredItems.length} khoa phòng</span>
                        <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">
                            Ngoại • Sản • 3CK • YHCT
                        </span>
                    </div>
                </div>

                {/* Card 2: Năng Lực Phẫu Thuật */}
                <div className="his-kpi-card border-l-4 border-l-rose-500 p-4.5 rounded-xl bg-white dark:bg-slate-800 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                            Phẫu Thuật Chuyên Khoa
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 rounded-full font-mono">
                            {overallPtRate}% tổng ca
                        </span>
                    </div>
                    <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono tabular-nums mt-1">
                        {tongPhauThuat.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-400">ca mổ</span>
                    </div>
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between truncate">
                        <span>L1: <b className="text-amber-600 font-mono">{totals.loai_1}</b> • L2: <b className="text-blue-600 font-mono">{totals.loai_2}</b> • L3: <b className="text-emerald-600 font-mono">{totals.loai_3}</b></span>
                        <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 dark:bg-rose-900/30 px-1.5 py-0.5 rounded">
                            {countHasSurgery} khoa mổ
                        </span>
                    </div>
                </div>

                {/* Card 3: Khối Lượng Thủ Thuật */}
                <div className="his-kpi-card border-l-4 border-l-purple-500 p-4.5 rounded-xl bg-white dark:bg-slate-800 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                            Thủ Thuật Lâm Sàng
                        </span>
                        <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                            <SparklesIcon className="w-5 h-5" />
                        </span>
                    </div>
                    <div className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono tabular-nums mt-1">
                        {totals.thu_thuat.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-400">ca</span>
                    </div>
                    <div className="mt-2 space-y-1">
                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div 
                                className="bg-purple-600 h-full rounded-full transition-all duration-300"
                                style={{ width: `${overallTtRate}%` }}
                                title={`Thủ thuật chiếm ${overallTtRate}% tổng PTTT`}
                            ></div>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            <span>Chiếm <strong>{overallTtRate}%</strong> tổng hoạt động</span>
                            <span className="text-purple-600 font-medium">YHCT-PHCN dẫn đầu</span>
                        </div>
                    </div>
                </div>

                {/* Card 4: Lượt Tiếp Nhận & Cường Độ */}
                <div className="his-kpi-card border-l-4 border-l-emerald-500 p-4.5 rounded-xl bg-white dark:bg-slate-800 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                            Người Bệnh & Cường Độ
                        </span>
                        <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                            <UserGroupIcon className="w-5 h-5" />
                        </span>
                    </div>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-1">
                        {totals.tong_benh_nhan.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-400">lượt BN</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>Cường độ TB: <strong className="text-emerald-600 dark:text-emerald-300 font-bold">{avgIntensity}</strong> ca/BN</span>
                        <span className="text-[10px] font-mono text-slate-400">Liệu trình PHCN</span>
                    </div>
                </div>
            </div>

            {/* 2 BI Specialized Surgery Charts (Horizontal Bar + Clinical Complexity Funnel) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-3.5 print:hidden">
                {/* Chart 1: Horizontal Stacked Bar Chart for Surgery vs Procedure by Department (2 cols) */}
                <div className="lg:col-span-2 his-kpi-card p-4 sm:p-4.5 rounded-xl bg-white dark:bg-slate-800 shadow-xs border border-slate-200/80 dark:border-slate-700">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                                <span>Tương Quan Phẫu Thuật vs Thủ Thuật Theo Khoa Phòng</span>
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Biểu đồ thanh ngang: Phẫu thuật chuyên sâu (đỏ hồng) & Thủ thuật lâm sàng (tím) (Đơn vị: Ca)
                            </p>
                        </div>
                        <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/30 px-2.5 py-1 rounded-lg self-start sm:self-auto border border-rose-200/60 dark:border-rose-800/60">
                            Thanh ngang (Horizontal Bar)
                        </span>
                    </div>

                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                                layout="vertical" 
                                data={barChartData} 
                                margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" opacity={0.6} />
                                <XAxis 
                                    type="number"
                                    tick={{ fontSize: 11, fill: '#64748B' }}
                                    tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                                />
                                <YAxis 
                                    type="category"
                                    dataKey="name" 
                                    width={130}
                                    tick={{ fontSize: 11, fill: '#475569' }}
                                />
                                <Tooltip 
                                    formatter={(value: any, name: any) => [
                                        Number(value).toLocaleString('vi-VN') + ' ca',
                                        name === 'phau_thuat' ? 'Phẫu Thuật Chuyên Sâu' : 'Thủ Thuật Lâm Sàng'
                                    ]}
                                    labelFormatter={(label, payload) => {
                                        if (payload && payload.length > 0) {
                                            const item = payload[0].payload;
                                            return `${item.fullName} (${item.deptId}) - Tổng: ${item.total.toLocaleString('vi-VN')} ca (PT: ${item.phau_thuat} ca [${item.ptRate}%] • TT: ${item.thu_thuat} ca)`;
                                        }
                                        return label;
                                    }}
                                    contentStyle={{ 
                                        borderRadius: '0.75rem', 
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', 
                                        border: '1px solid #E2E8F0',
                                        fontSize: '12px'
                                    }}
                                />
                                <Legend 
                                    verticalAlign="top" 
                                    align="right"
                                    wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
                                    formatter={(value) => value === 'phau_thuat' ? 'Phẫu Thuật Chuyên Sâu' : 'Thủ Thuật Lâm Sàng'}
                                />
                                <Bar dataKey="phau_thuat" name="phau_thuat" stackId="a" fill="#F43F5E" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="thu_thuat" name="thu_thuat" stackId="a" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Quick ranking chips footer */}
                    <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Khoa dẫn đầu sản lượng:</span>
                        <div className="flex flex-wrap gap-2">
                            {barChartData.slice(0, 4).map((it, i) => (
                                <span key={it.deptId} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-700/50 text-[11px]">
                                    <strong className="text-rose-600 dark:text-rose-400">#{i + 1}</strong> {it.fullName}: <strong>{it.total.toLocaleString('vi-VN')} ca</strong> <span className="text-purple-600 font-medium">({it.phau_thuat} PT)</span>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Chart 2: Surgical Complexity Funnel Pyramid (1 col) */}
                <div className="his-kpi-card p-5 rounded-2xl bg-white dark:bg-slate-800 shadow-xs border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                                <span>Tháp Phân Cấp Phẫu Thuật</span>
                            </h3>
                            <span className="text-[11px] font-mono text-rose-700 dark:text-rose-300 font-bold bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded-md border border-rose-200/50">
                                4 Cấp Độ BYT
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                            Phân tầng mức độ kỹ thuật và nguy cơ lâm sàng từ đại phẫu tới tiểu phẫu
                        </p>

                        {/* Funnel Pyramid Tiers */}
                        <div className="space-y-2.5">
                            {[
                                { 
                                    code: 'ĐB',
                                    name: 'Loại Đặc Biệt', 
                                    val: totals.loai_dac_biet, 
                                    color: '#EF4444', 
                                    bgLight: 'bg-red-50/90 dark:bg-red-950/30',
                                    border: 'border-red-200 dark:border-red-900/60',
                                    textColor: 'text-red-700 dark:text-red-300',
                                    tag: 'Nguy cơ tối cao',
                                    tagColor: 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-200',
                                    width: 'w-[75%]'
                                },
                                { 
                                    code: 'L1',
                                    name: 'Phẫu Thuật Loại 1', 
                                    val: totals.loai_1, 
                                    color: '#F59E0B', 
                                    bgLight: 'bg-amber-50/90 dark:bg-amber-950/30',
                                    border: 'border-amber-200 dark:border-amber-900/60',
                                    textColor: 'text-amber-700 dark:text-amber-300',
                                    tag: 'Đại phẫu lớn',
                                    tagColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
                                    width: 'w-[85%]'
                                },
                                { 
                                    code: 'L2',
                                    name: 'Phẫu Thuật Loại 2', 
                                    val: totals.loai_2, 
                                    color: '#3B82F6', 
                                    bgLight: 'bg-blue-50/90 dark:bg-blue-950/30',
                                    border: 'border-blue-200 dark:border-blue-900/60',
                                    textColor: 'text-blue-700 dark:text-blue-300',
                                    tag: 'Phẫu thuật vừa',
                                    tagColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-200',
                                    width: 'w-[93%]'
                                },
                                { 
                                    code: 'L3',
                                    name: 'Phẫu Thuật Loại 3', 
                                    val: totals.loai_3, 
                                    color: '#10B981', 
                                    bgLight: 'bg-emerald-50/90 dark:bg-emerald-950/30',
                                    border: 'border-emerald-200 dark:border-emerald-900/60',
                                    textColor: 'text-emerald-700 dark:text-emerald-300',
                                    tag: 'Tiểu phẫu',
                                    tagColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200',
                                    width: 'w-full'
                                }
                            ].map((tier) => {
                                const percent = tongPhauThuat > 0 
                                    ? ((tier.val / tongPhauThuat) * 100).toFixed(1) 
                                    : '0';
                                return (
                                    <div key={tier.code} className="flex justify-center">
                                        <div className={`${tier.width} p-2.5 rounded-xl ${tier.bgLight} border ${tier.border} transition-all duration-300 hover:shadow-xs`}>
                                            <div className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2 truncate">
                                                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tier.color }}></span>
                                                    <span className={`font-bold ${tier.textColor} truncate`}>
                                                        {tier.name}
                                                    </span>
                                                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${tier.tagColor}`}>
                                                        {tier.tag}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 font-mono text-xs shrink-0">
                                                    <strong className={`${tier.textColor} font-black`}>
                                                        {tier.val.toLocaleString('vi-VN')} ca
                                                    </strong>
                                                    <span className="text-slate-400 text-[10px]">
                                                        ({percent}%)
                                                    </span>
                                                </div>
                                            </div>
                                            {/* Tier progress gauge */}
                                            <div className="w-full bg-white/70 dark:bg-slate-700/60 h-1.5 rounded-full overflow-hidden mt-1.5">
                                                <div 
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${percent}%`, backgroundColor: tier.color }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bottom Summary Insight */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-rose-50/50 dark:bg-rose-950/20 px-3 py-2 rounded-xl border border-rose-100 dark:border-rose-900/40">
                        <span className="text-[11px] font-medium text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                            <ScissorsIcon className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>Tổng phẫu thuật: <strong>{tongPhauThuat.toLocaleString('vi-VN')} ca</strong> ({overallPtRate}%)</span>
                        </span>
                        <span className="font-mono text-[11px] font-bold text-rose-700 dark:text-rose-300">
                            {totals.loai_1 + totals.loai_2} ca lớn/vừa
                        </span>
                    </div>
                </div>
            </div>

            {/* Category Filter Badges & Navigation Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/90 dark:bg-slate-900/70 p-1.5 rounded-xl">
                    <button
                        type="button"
                        onClick={() => setSelectedCategory('ALL')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                            selectedCategory === 'ALL'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'
                        }`}
                    >
                        Tất cả ({items.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedCategory('HAS_SURGERY')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                            selectedCategory === 'HAS_SURGERY'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400'
                        }`}
                    >
                        <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                        <span>Khoa Có Phẫu Thuật ({countHasSurgery})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedCategory('PROCEDURE_ONLY')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                            selectedCategory === 'PROCEDURE_ONLY'
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400'
                        }`}
                    >
                        <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                        <span>Khoa Thủ Thuật ({countProcedureOnly})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedCategory('HIGH_VOLUME')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                            selectedCategory === 'HIGH_VOLUME'
                                ? 'bg-teal-600 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400'
                        }`}
                    >
                        <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                        <span>Tải Cao (&gt;1.000 ca) ({countHighVolume})</span>
                    </button>
                </div>

                <Link
                    to="/hospital-statistics/department-costs"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition border border-blue-200/80 dark:border-blue-800/80 shadow-xs cursor-pointer"
                >
                    <BuildingOfficeIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Xem Báo Cáo Tổng Hợp Chi Phí</span>
                    <span>→</span>
                </Link>
            </div>

            {/* Main Table (gcv-ninhbinh his-table standard) */}
            <div className="his-table-wrap">
                <table className="his-table w-full text-left text-xs sm:text-sm whitespace-nowrap">
                    <thead>
                        <tr>
                            <th className="px-4 py-3.5 text-center w-14 font-mono">STT</th>
                            <th 
                                className="px-5 py-3.5 cursor-pointer hover:opacity-80 transition select-none"
                                onClick={() => handleSort('dept_name')}
                            >
                                <div className="flex items-center gap-1.5">
                                    <span>Khoa Phòng Lâm Sàng</span>
                                    {sortField === 'dept_name' && (
                                        <span>{sortAsc ? '▲' : '▼'}</span>
                                    )}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:opacity-80 transition select-none"
                                onClick={() => handleSort('tong_benh_nhan')}
                            >
                                <div className="flex items-center justify-end gap-1.5">
                                    <span>Số BN</span>
                                    {sortField === 'tong_benh_nhan' && (
                                        <span>{sortAsc ? '▲' : '▼'}</span>
                                    )}
                                </div>
                            </th>
                            <th 
                                className="px-5 py-3.5 text-right cursor-pointer hover:opacity-80 transition min-w-[140px] select-none"
                                onClick={() => handleSort('tong_so_ca')}
                            >
                                <div className="flex items-center justify-end gap-1.5 font-bold">
                                    <span>Tổng Ca PTTT</span>
                                    {sortField === 'tong_so_ca' && (
                                        <span>{sortAsc ? '▲' : '▼'}</span>
                                    )}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:opacity-80 transition select-none"
                                onClick={() => handleSort('pt_rate')}
                            >
                                <div className="flex items-center justify-end gap-1.5 font-bold text-rose-600 dark:text-rose-400">
                                    <span>Phẫu Thuật (%)</span>
                                    {sortField === 'pt_rate' && (
                                        <span>{sortAsc ? '▲' : '▼'}</span>
                                    )}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:opacity-80 transition select-none"
                                onClick={() => handleSort('loai_dac_biet')}
                            >
                                <div className="flex items-center justify-end gap-1.5 font-bold text-rose-600 dark:text-rose-400">
                                    <span>Loại ĐB</span>
                                    {sortField === 'loai_dac_biet' && (
                                        <span>{sortAsc ? '▲' : '▼'}</span>
                                    )}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:opacity-80 transition select-none"
                                onClick={() => handleSort('loai_1')}
                            >
                                <div className="flex items-center justify-end gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                                    <span>Loại 1</span>
                                    {sortField === 'loai_1' && (
                                        <span>{sortAsc ? '▲' : '▼'}</span>
                                    )}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:opacity-80 transition select-none"
                                onClick={() => handleSort('loai_2')}
                            >
                                <div className="flex items-center justify-end gap-1.5 font-semibold text-blue-600 dark:text-blue-400">
                                    <span>Loại 2</span>
                                    {sortField === 'loai_2' && (
                                        <span>{sortAsc ? '▲' : '▼'}</span>
                                    )}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:opacity-80 transition select-none"
                                onClick={() => handleSort('loai_3')}
                            >
                                <div className="flex items-center justify-end gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                                    <span>Loại 3</span>
                                    {sortField === 'loai_3' && (
                                        <span>{sortAsc ? '▲' : '▼'}</span>
                                    )}
                                </div>
                            </th>
                            <th 
                                className="px-5 py-3.5 text-right cursor-pointer hover:opacity-80 transition min-w-[120px] select-none"
                                onClick={() => handleSort('thu_thuat')}
                            >
                                <div className="flex items-center justify-end gap-1.5 font-bold text-purple-600 dark:text-purple-400">
                                    <span>Thủ Thuật</span>
                                    {sortField === 'thu_thuat' && (
                                        <span>{sortAsc ? '▲' : '▼'}</span>
                                    )}
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.length === 0 ? (
                            <TableEmptyState
                                colSpan={10}
                                title="Không tìm thấy khoa phòng"
                                message="Không có khoa phòng nào phù hợp với bộ lọc hoặc từ khóa tìm kiếm hiện tại."
                                onResetFilter={() => {
                                    setSearchTerm('');
                                    setSelectedCategory('ALL');
                                    setHideEmpty(false);
                                }}
                            />
                        ) : (
                            filteredItems.map((it, idx) => {
                                const caCount = Number(it.tong_so_ca || 0);
                                const bnCount = Number(it.tong_benh_nhan || 0);
                                const pt = Number(it.loai_dac_biet || 0) + Number(it.loai_1 || 0) + Number(it.loai_2 || 0) + Number(it.loai_3 || 0);
                                const tt = Number(it.thu_thuat || 0);
                                
                                const intensity = bnCount > 0 ? (caCount / bnCount).toFixed(1) : '0';
                                const ptRate = caCount > 0 ? ((pt / caCount) * 100).toFixed(1) : '0';
                                const pctMax = ((caCount / maxVolume) * 100).toFixed(0);

                                // Medal logic
                                const medal = it.dept_id === top1Id ? '🥇' : it.dept_id === top2Id ? '🥈' : it.dept_id === top3Id ? '🥉' : null;

                                return (
                                    <tr key={it.dept_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition">
                                        <td className="px-4 py-3.5 text-center font-mono text-xs font-semibold">
                                            {medal ? (
                                                <span className="text-base" title={`Hạng ${medal === '🥇' ? 1 : medal === '🥈' ? 2 : 3} khối lượng PTTT`}>
                                                    {medal}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">{idx + 1}</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                    <span>{it.dept_name}</span>
                                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                                                        {it.dept_id}
                                                    </span>
                                                    {pt > 0 && (
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                                            Phòng Mổ
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-2">
                                                    <span>Cường độ: <strong className="text-slate-600 dark:text-slate-400">{intensity}</strong> ca/BN</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-medium text-slate-600 dark:text-slate-300 font-mono tabular-nums">
                                            {bnCount.toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-5 py-3.5 text-right font-mono tabular-nums">
                                            <div className="font-black text-blue-600 dark:text-blue-400 text-sm">
                                                {caCount.toLocaleString('vi-VN')}
                                            </div>
                                            {caCount > 0 && (
                                                <div className="w-24 ml-auto h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300"
                                                        style={{ width: `${pctMax}%` }}
                                                    ></div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-mono tabular-nums">
                                            {pt > 0 ? (
                                                <div className="flex flex-col items-end">
                                                    <span className="font-bold text-rose-600 dark:text-rose-400 text-xs">
                                                        {pt.toLocaleString('vi-VN')} ca
                                                    </span>
                                                    <span className="text-[10px] text-rose-500 font-medium">({ptRate}%)</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-300 dark:text-slate-600">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-mono tabular-nums">
                                            {Number(it.loai_dac_biet || 0) > 0 ? (
                                                <span className="px-2 py-0.5 font-bold text-rose-700 bg-rose-100 dark:bg-rose-900/40 dark:text-rose-300 rounded-md text-xs border border-rose-200 dark:border-rose-800">
                                                    {Number(it.loai_dac_biet).toLocaleString('vi-VN')}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300 dark:text-slate-600">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-mono tabular-nums">
                                            {Number(it.loai_1 || 0) > 0 ? (
                                                <span className="px-2 py-0.5 font-bold text-amber-700 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300 rounded-md text-xs border border-amber-200 dark:border-amber-800">
                                                    {Number(it.loai_1).toLocaleString('vi-VN')}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300 dark:text-slate-600">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-mono tabular-nums">
                                            {Number(it.loai_2 || 0) > 0 ? (
                                                <span className="px-2 py-0.5 font-semibold text-blue-700 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300 rounded-md text-xs border border-blue-200 dark:border-blue-800">
                                                    {Number(it.loai_2).toLocaleString('vi-VN')}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300 dark:text-slate-600">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-mono tabular-nums">
                                            {Number(it.loai_3 || 0) > 0 ? (
                                                <span className="px-2 py-0.5 font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-md text-xs border border-emerald-200 dark:border-emerald-800">
                                                    {Number(it.loai_3).toLocaleString('vi-VN')}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300 dark:text-slate-600">-</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5 text-right font-semibold text-purple-700 dark:text-purple-300 font-mono tabular-nums">
                                            {tt > 0 ? tt.toLocaleString('vi-VN') : '-'}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                    {/* Sticky Footer Total Row */}
                    <tfoot className="bg-slate-100 dark:bg-slate-700 font-bold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-600 sticky bottom-0 z-10 shadow-md">
                        <tr>
                            <td colSpan={2} className="px-5 py-3.5 text-center uppercase tracking-wider text-xs">
                                TỔNG CỘNG ({filteredItems.length} khoa phòng)
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono tabular-nums font-bold text-slate-700 dark:text-slate-200">
                                {totals.tong_benh_nhan.toLocaleString('vi-VN')}
                            </td>
                            <td className="px-5 py-3.5 text-right font-mono tabular-nums font-black text-blue-600 dark:text-blue-300 text-sm">
                                {totals.tong_so_ca.toLocaleString('vi-VN')}
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono tabular-nums font-bold text-rose-600 dark:text-rose-300">
                                <div className="flex flex-col items-end">
                                    <span>{tongPhauThuat.toLocaleString('vi-VN')}</span>
                                    <span className="text-[10px] text-rose-500 font-normal">({overallPtRate}%)</span>
                                </div>
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono tabular-nums font-bold text-rose-600 dark:text-rose-300">
                                {totals.loai_dac_biet.toLocaleString('vi-VN')}
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono tabular-nums font-bold text-amber-600 dark:text-amber-300">
                                {totals.loai_1.toLocaleString('vi-VN')}
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono tabular-nums font-bold text-blue-600 dark:text-blue-300">
                                {totals.loai_2.toLocaleString('vi-VN')}
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-300">
                                {totals.loai_3.toLocaleString('vi-VN')}
                            </td>
                            <td className="px-5 py-3.5 text-right font-mono tabular-nums font-black text-purple-600 dark:text-purple-300 text-base">
                                {totals.thu_thuat.toLocaleString('vi-VN')}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <PrintReportFooter />
        </div>
    );
};
