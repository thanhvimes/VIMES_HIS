// ==================== BED OCCUPANCY VIEW ====================
// File: modules/hospital-statistics/views/BedOccupancyView.tsx

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
    CartesianGrid,
    ReferenceLine
} from 'recharts';
import { CommonFilter, TableEmptyState, PrintReportHeader, PrintReportFooter, exportTableToExcel, formatLocalDate } from '../components/CommonFilter';
import { statisticsService } from '../services/statisticsService';
import { BedOccupancyItem } from '../types';
import { BuildingOfficeIcon, UserGroupIcon, HeartIcon, SparklesIcon } from '../../../components/Icons';

type SortField = 'dept_name' | 'giuong_ke_hoach' | 'giuong_thuc_ke' | 'bn_dang_nam' | 'ty_le_cong_suat' | 'giuong_kha_dung';

// Helper for Vietnamese unaccented search
const removeVietnameseTones = (str: string): string => {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase();
};

export const BedOccupancyView: React.FC = () => {
    const now = new Date();
    const [fromDate, setFromDate] = useState(`${formatLocalDate(now)} 00:00:00`);
    const [toDate, setToDate] = useState(`${formatLocalDate(now)} 23:59:59`);
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<BedOccupancyItem[]>([]);

    // Filter & Sort
    const [searchTerm, setSearchTerm] = useState('');
    const [hideEmpty, setHideEmpty] = useState(true);
    const [sortField, setSortField] = useState<SortField>('ty_le_cong_suat');
    const [sortAsc, setSortAsc] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'OVERLOAD' | 'OPTIMAL' | 'AVAILABLE'>('ALL');

    // Auto-scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
        const main = document.querySelector('main');
        if (main) main.scrollTo(0, 0);
    }, []);

    // Support override parameters from CommonFilter preset buttons
    const fetchData = async (overrideFrom?: string, overrideTo?: string) => {
        setLoading(true);
        try {
            const res = await statisticsService.getBedOccupancyStatistics();
            setItems(res);
        } catch (error) {
            console.error('Error fetching bed occupancy:', error);
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
            result = result.filter(it => 
                Number(it.giuong_ke_hoach || 0) > 0 ||
                Number(it.giuong_thuc_ke || 0) > 0 ||
                Number(it.bn_dang_nam || 0) > 0
            );
        }

        // Category filter
        if (selectedCategory === 'OVERLOAD') {
            result = result.filter(it => Number(it.ty_le_cong_suat || 0) > 100);
        } else if (selectedCategory === 'OPTIMAL') {
            result = result.filter(it => Number(it.ty_le_cong_suat || 0) >= 80 && Number(it.ty_le_cong_suat || 0) <= 100);
        } else if (selectedCategory === 'AVAILABLE') {
            result = result.filter(it => Number(it.ty_le_cong_suat || 0) < 80);
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

            if (sortField === 'giuong_kha_dung') {
                valA = Number(a.giuong_thuc_ke || 0) - Number(a.bn_dang_nam || 0);
                valB = Number(b.giuong_thuc_ke || 0) - Number(b.bn_dang_nam || 0);
            } else if (sortField !== 'dept_name') {
                valA = Number(a[sortField as keyof BedOccupancyItem] || 0);
                valB = Number(b[sortField as keyof BedOccupancyItem] || 0);
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
            giuong_ke_hoach: acc.giuong_ke_hoach + Number(curr.giuong_ke_hoach || 0),
            giuong_thuc_ke: acc.giuong_thuc_ke + Number(curr.giuong_thuc_ke || 0),
            bn_dang_nam: acc.bn_dang_nam + Number(curr.bn_dang_nam || 0)
        }), { giuong_ke_hoach: 0, giuong_thuc_ke: 0, bn_dang_nam: 0 });
    }, [filteredItems]);

    const totalOccupancyRate = totals.giuong_thuc_ke > 0
        ? ((totals.bn_dang_nam / totals.giuong_thuc_ke) * 100).toFixed(1)
        : (totals.giuong_ke_hoach > 0 ? ((totals.bn_dang_nam / totals.giuong_ke_hoach) * 100).toFixed(1) : '0.0');

    const totalAvailableBeds = totals.giuong_thuc_ke - totals.bn_dang_nam;

    // Overloaded departments
    const overloadedDepts = useMemo(() => {
        return items.filter(it => Number(it.ty_le_cong_suat || 0) > 100);
    }, [items]);

    const optimalDepts = useMemo(() => {
        return items.filter(it => Number(it.ty_le_cong_suat || 0) >= 80 && Number(it.ty_le_cong_suat || 0) <= 100);
    }, [items]);

    const availableDepts = useMemo(() => {
        return items.filter(it => Number(it.ty_le_cong_suat || 0) < 80);
    }, [items]);

    // Top departments by occupancy rate for medals
    const topOccupancyDepts = useMemo(() => {
        return [...items]
            .filter(it => Number(it.giuong_thuc_ke || 0) > 0)
            .sort((a, b) => Number(b.ty_le_cong_suat || 0) - Number(a.ty_le_cong_suat || 0));
    }, [items]);
    const top1Id = topOccupancyDepts[0]?.dept_id;
    const top2Id = topOccupancyDepts[1]?.dept_id;
    const top3Id = topOccupancyDepts[2]?.dept_id;

    // Bullet Chart Data: Horizontal Bars with 100% Benchmark Reference Line
    const bulletChartData = useMemo(() => {
        return [...filteredItems]
            .filter(it => Number(it.giuong_thuc_ke || 0) > 0)
            .sort((a, b) => Number(b.ty_le_cong_suat || 0) - Number(a.ty_le_cong_suat || 0))
            .map(it => {
                const tk = Number(it.giuong_thuc_ke || 0);
                const bn = Number(it.bn_dang_nam || 0);
                const kh = Number(it.giuong_ke_hoach || 0);
                const rate = Number(it.ty_le_cong_suat || 0);
                const shortName = it.dept_name.length > 18 
                    ? it.dept_name.slice(0, 18) + '...' 
                    : it.dept_name;
                return {
                    name: shortName,
                    fullName: it.dept_name,
                    deptId: it.dept_id,
                    rate: rate,
                    giuong_thuc_ke: tk,
                    bn_dang_nam: bn,
                    giuong_ke_hoach: kh,
                    diff: tk - bn
                };
            });
    }, [filteredItems]);

    // Gauge Semi-Circle Data (180 degree speedometer)
    const gaugeRate = Number(totalOccupancyRate);
    const gaugeData = useMemo(() => {
        return [
            { name: 'Khả dụng (<80%)', value: 80, color: '#3B82F6' },
            { name: 'Tối ưu (80-100%)', value: 20, color: '#10B981' },
            { name: 'Quá tải (>100%)', value: 50, color: '#F43F5E' }
        ];
    }, []);

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
            const tk = Number(it.giuong_thuc_ke || 0);
            const bn = Number(it.bn_dang_nam || 0);
            const diff = tk - bn;
            return {
                'STT': idx + 1,
                'Mã Khoa': it.dept_id,
                'Khoa Lâm Sàng': it.dept_name,
                'Giường Kế Hoạch': Number(it.giuong_ke_hoach || 0),
                'Giường Thực Kê': tk,
                'BN Đang Nằm': bn,
                'Giường Khả Dụng / Thiếu Hụt': diff >= 0 ? `+${diff} giường` : `${diff} giường (quá tải)`,
                'Công Suất Sử Dụng (%)': `${Number(it.ty_le_cong_suat || 0)}%`,
                'Trạng Thái': Number(it.ty_le_cong_suat || 0) > 100 ? 'Quá tải' : Number(it.ty_le_cong_suat || 0) >= 80 ? 'Tối ưu' : 'Dư giường'
            };
        });
        rows.push({
            'STT': 'TỔNG CỘNG',
            'Mã Khoa': '',
            'Khoa Lâm Sàng': `${filteredItems.length} khoa lâm sàng`,
            'Giường Kế Hoạch': totals.giuong_ke_hoach,
            'Giường Thực Kê': totals.giuong_thuc_ke,
            'BN Đang Nằm': totals.bn_dang_nam,
            'Giường Khả Dụng / Thiếu Hụt': totalAvailableBeds >= 0 ? `+${totalAvailableBeds} giường trống` : `${totalAvailableBeds} giường`,
            'Công Suất Sử Dụng (%)': `${totalOccupancyRate}%`,
            'Trạng Thái': Number(totalOccupancyRate) >= 80 && Number(totalOccupancyRate) <= 100 ? 'Tối ưu toàn viện' : 'Bình thường'
        });
        exportTableToExcel(rows, 'Cong_Suat_Su_Dung_Giuong', 'Công Suất Giường');
    };

    return (
        <div className="space-y-3 sm:space-y-3.5">
            {/* Header section with fast navigation */}
            <div className="print:hidden flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2.5">
                        <BuildingOfficeIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        <span>Báo cáo Công suất Sử dụng Giường bệnh</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Theo dõi tỷ lệ lấp đầy giường bệnh, cảnh báo tình trạng quá tải và cân đối điều phối bệnh nhân nội trú
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        to="/hospital-statistics/department-costs"
                        className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition"
                    >
                        ← Chi Phí Khoa Phòng
                    </Link>
                    <Link
                        to="/hospital-statistics/dashboard"
                        className="px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition"
                    >
                        Bảng Điều Khiển Tổng Thể ↗
                    </Link>
                </div>
            </div>

            {/* Print Header */}
            <PrintReportHeader 
                formCode="Biểu mẫu: 07/BC-CSG"
                title="BÁO CÁO THỐNG KÊ CÔNG SUẤT SỬ DỤNG GIƯỜNG BỆNH"
                subtitle="Thống kê tỷ lệ sử dụng giường kế hoạch, giường thực kê theo khoa điều trị"
                fromDate={fromDate}
                toDate={toDate}
            />

            {/* 4 Executive Clinical KPI Cards (gcv-ninhbinh his-kpi-card standard) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 print:hidden">
                {/* 1. Quy Mô Giường Bệnh */}
                <div className="his-kpi-card border-l-4 border-l-blue-500 p-4.5 rounded-xl bg-white dark:bg-slate-800 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                            Quy Mô Giường Bệnh
                        </span>
                        <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                            <BuildingOfficeIcon className="w-5 h-5" />
                        </span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums mt-1">
                        {totals.giuong_thuc_ke.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-400">giường thực kê</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>Chỉ tiêu KH: <strong className="text-blue-600 font-mono">{totals.giuong_ke_hoach}</strong> giường</span>
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">
                            100% chỉ tiêu
                        </span>
                    </div>
                </div>

                {/* 2. BN Đang Nằm & Giường Trống */}
                <div className="his-kpi-card border-l-4 border-l-purple-500 p-4.5 rounded-xl bg-white dark:bg-slate-800 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                            Bệnh Nhân Đang Điều Trị
                        </span>
                        <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                            <UserGroupIcon className="w-5 h-5" />
                        </span>
                    </div>
                    <div className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono tabular-nums mt-1">
                        {totals.bn_dang_nam.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-400">người bệnh</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>Khả dụng: <strong className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">+{totalAvailableBeds}</strong> giường trống</span>
                        <span className="text-[10px] text-slate-400 font-mono">{filteredItems.length} khoa</span>
                    </div>
                </div>

                {/* 3. Công Suất Khai Thác Toàn Viện */}
                <div className="his-kpi-card border-l-4 border-l-emerald-500 p-4.5 rounded-xl bg-white dark:bg-slate-800 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                            Công Suất Khai Thác
                        </span>
                        <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                            <HeartIcon className="w-5 h-5" />
                        </span>
                    </div>
                    <div className={`text-2xl font-black font-mono tabular-nums mt-1 ${
                        Number(totalOccupancyRate) > 100 
                            ? 'text-rose-600 dark:text-rose-400' 
                            : Number(totalOccupancyRate) >= 80 
                            ? 'text-emerald-600 dark:text-emerald-400' 
                            : 'text-blue-600 dark:text-blue-400'
                    }`}>
                        {totalOccupancyRate}% <span className="text-xs font-normal text-slate-400">công suất TB</span>
                    </div>
                    <div className="mt-2 space-y-1">
                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-300 ${
                                    Number(totalOccupancyRate) > 100 
                                        ? 'bg-rose-500' 
                                        : Number(totalOccupancyRate) >= 80 
                                        ? 'bg-emerald-500' 
                                        : 'bg-blue-500'
                                }`}
                                style={{ width: `${Math.min(Number(totalOccupancyRate), 100)}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            <span>Mức tối ưu BYT (85-95%)</span>
                            <span className="text-emerald-600 font-semibold">Tối ưu toàn viện</span>
                        </div>
                    </div>
                </div>

                {/* 4. Tình Trạng Điều Phối & Quá Tải */}
                <div className="his-kpi-card border-l-4 border-l-amber-500 p-4.5 rounded-xl bg-white dark:bg-slate-800 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                            Cảnh Báo Điều Phối
                        </span>
                        <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                            <SparklesIcon className="w-5 h-5" />
                        </span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums mt-1">
                        {overloadedDepts.length > 0 ? (
                            <span className="text-rose-600 dark:text-rose-400">{overloadedDepts.length} khoa quá tải</span>
                        ) : (
                            <span className="text-emerald-600 dark:text-emerald-400">0 khoa quá tải</span>
                        )}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>{optimalDepts.length} khoa tối ưu (80-100%)</span>
                        <span className="text-indigo-600 font-medium">{availableDepts.length} khoa dư giường</span>
                    </div>
                </div>
            </div>

            {/* Warning banner if overloaded with direct transfer suggestions */}
            {overloadedDepts.length > 0 && (
                <div className="print:hidden p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold text-lg shrink-0">
                            ⚠️
                        </div>
                        <div className="text-xs text-rose-800 dark:text-rose-300">
                            <span className="font-bold text-sm block">Cảnh báo quá tải giường bệnh cục bộ:</span>
                            Phát hiện <strong>{overloadedDepts.map(d => `${d.dept_name} (${d.ty_le_cong_suat}% - quá ${Number(d.bn_dang_nam) - Number(d.giuong_thuc_ke)} BN)`).join(', ')}</strong>.
                        </div>
                    </div>
                    <div className="text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/50 px-3 py-1.5 rounded-xl self-start sm:self-auto border border-rose-300 dark:border-rose-800">
                        Khoa còn dư giường: {availableDepts.map(d => `${d.dept_name} (+${Number(d.giuong_thuc_ke) - Number(d.bn_dang_nam)})`).join(' • ')}
                    </div>
                </div>
            )}

            {/* 2 BI Interactive Visual Charts: Bullet Chart & Gauge Semi-Circle */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-3.5 print:hidden">
                {/* Chart 1: Bullet Chart with 100% Benchmark Line (2 cols) */}
                <div className="lg:col-span-2 his-kpi-card p-4 sm:p-4.5 rounded-xl bg-white dark:bg-slate-800 shadow-xs border border-slate-200/80 dark:border-slate-700">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                                <span>Bullet Chart: Công Suất Giường & Vạch Ngưỡng Định Mức 100%</span>
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Vạch đỏ đứt nét thể hiện định mức 100%. Cột đỏ: Quá tải, Cột vàng: Tối ưu (80-100%), Cột xanh: Còn dư giường
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] self-start sm:self-auto">
                            <span className="inline-flex items-center gap-1 font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200">
                                🔴 &gt;100%
                            </span>
                            <span className="inline-flex items-center gap-1 font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200">
                                🟡 80-100%
                            </span>
                            <span className="inline-flex items-center gap-1 font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200">
                                🟢 &lt;80%
                            </span>
                        </div>
                    </div>

                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                                data={bulletChartData} 
                                layout="vertical" 
                                margin={{ top: 10, right: 35, left: 20, bottom: 10 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" opacity={0.6} />
                                <XAxis 
                                    type="number" 
                                    domain={[0, 150]} 
                                    tick={{ fontSize: 11, fill: '#64748B' }} 
                                    tickFormatter={(v) => `${v}%`} 
                                />
                                <YAxis 
                                    type="category" 
                                    dataKey="name" 
                                    tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} 
                                    width={130} 
                                />
                                <Tooltip 
                                    formatter={(value: any) => [
                                        `${value}% công suất`,
                                        'Công suất sử dụng'
                                    ]}
                                    labelFormatter={(label, payload) => {
                                        if (payload && payload.length > 0) {
                                            const item = payload[0].payload;
                                            const status = item.diff < 0 ? `Thiếu ${Math.abs(item.diff)} giường` : `Dư ${item.diff} giường`;
                                            return `${item.fullName} (${item.deptId}) - ${item.bn_dang_nam} BN / ${item.giuong_thuc_ke} Giường TK (${status})`;
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
                                {/* Red benchmark threshold line at 100% */}
                                <ReferenceLine 
                                    x={100} 
                                    stroke="#EF4444" 
                                    strokeWidth={2} 
                                    strokeDasharray="4 4" 
                                    label={{ value: '100% Định mức', fill: '#EF4444', fontSize: 10, position: 'insideTopRight' }} 
                                />
                                <Bar dataKey="rate" name="Công suất (%)" radius={[0, 4, 4, 0]}>
                                    {bulletChartData.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={entry.rate > 100 ? '#F43F5E' : entry.rate >= 80 ? '#F59E0B' : '#3B82F6'} 
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Quick ranking chips footer */}
                    <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Công suất cao nhất:</span>
                        <div className="flex flex-wrap gap-2">
                            {bulletChartData.slice(0, 4).map((it, i) => (
                                <span key={it.deptId} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] ${
                                    it.rate > 100 
                                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 font-bold border border-rose-200' 
                                        : 'bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300'
                                }`}>
                                    <strong>#{i + 1}</strong> {it.fullName}: <strong>{it.rate}%</strong>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Chart 2: Gauge Semi-Circle 180° Speedometer Meter (1 col) */}
                <div className="his-kpi-card p-5 rounded-2xl bg-white dark:bg-slate-800 shadow-xs border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                <span>Đồng Hồ Đo Công Suất Toàn Viện</span>
                            </h3>
                            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-md">
                                Gauge 180°
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                            Tỷ lệ lấp đầy giường bệnh chuẩn khuyến cáo Bộ Y tế (85 - 95%)
                        </p>

                        <div className="h-48 w-full relative flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={gaugeData}
                                        cx="50%"
                                        cy="80%"
                                        startAngle={180}
                                        endAngle={0}
                                        innerRadius={65}
                                        outerRadius={92}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {gaugeData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        formatter={(val: any, name: any) => [
                                            `${val}% khoảng phân vùng`,
                                            name
                                        ]}
                                        contentStyle={{ 
                                            borderRadius: '0.75rem', 
                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', 
                                            border: '1px solid #E2E8F0',
                                            fontSize: '12px'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>

                            {/* Center Speedometer Metric */}
                            <div className="absolute top-[48%] flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-3xl font-black text-slate-800 dark:text-white font-mono leading-none">
                                    {totalOccupancyRate}%
                                </span>
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 bg-emerald-50 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">
                                    Khung Tối Ưu Vàng
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Speedometer Gauge Zones Explanation */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-sm bg-blue-500"></span>
                                <span className="text-slate-600 dark:text-slate-300">Khả dụng dôi dư (&lt;80%)</span>
                            </div>
                            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">2 khoa</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
                                <span className="text-slate-600 dark:text-slate-300">Mức tối ưu BYT (80-100%)</span>
                            </div>
                            <span className="font-mono font-bold text-emerald-600">3 khoa</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span>
                                <span className="text-slate-600 dark:text-slate-300">Quá tải cục bộ (&gt;100%)</span>
                            </div>
                            <span className="font-mono font-bold text-rose-600">1 khoa</span>
                        </div>
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
                        onClick={() => setSelectedCategory('OVERLOAD')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                            selectedCategory === 'OVERLOAD'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400'
                        }`}
                    >
                        <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
                        <span>Quá Tải (&gt;100%) ({overloadedDepts.length})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedCategory('OPTIMAL')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                            selectedCategory === 'OPTIMAL'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400'
                        }`}
                    >
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        <span>Tối Ưu (80 - 100%) ({optimalDepts.length})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedCategory('AVAILABLE')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                            selectedCategory === 'AVAILABLE'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400'
                        }`}
                    >
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span>Còn Dư Giường (&lt;80%) ({availableDepts.length})</span>
                    </button>
                </div>

                <Link
                    to="/hospital-statistics/dashboard"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition border border-indigo-200/80 dark:border-indigo-800/80 shadow-xs cursor-pointer"
                >
                    <BuildingOfficeIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Xem Bảng Điều Khiển Tổng Thể</span>
                    <span>→</span>
                </Link>
            </div>

            {/* Table (gcv-ninhbinh his-table standard) */}
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
                                    <span>Khoa Điều Trị Lâm Sàng</span>
                                    {sortField === 'dept_name' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:opacity-80 transition select-none"
                                onClick={() => handleSort('giuong_ke_hoach')}
                            >
                                <div className="flex items-center justify-end gap-1.5">
                                    <span>Giường KH</span>
                                    {sortField === 'giuong_ke_hoach' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:opacity-80 transition select-none"
                                onClick={() => handleSort('giuong_thuc_ke')}
                            >
                                <div className="flex items-center justify-end gap-1.5 font-bold text-blue-600 dark:text-blue-400">
                                    <span>Giường Thực Kê</span>
                                    {sortField === 'giuong_thuc_ke' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:opacity-80 transition select-none"
                                onClick={() => handleSort('bn_dang_nam')}
                            >
                                <div className="flex items-center justify-end gap-1.5 font-bold text-purple-600 dark:text-purple-400">
                                    <span>BN Đang Nằm</span>
                                    {sortField === 'bn_dang_nam' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:opacity-80 transition select-none"
                                onClick={() => handleSort('giuong_kha_dung')}
                            >
                                <div className="flex items-center justify-end gap-1.5 font-semibold">
                                    <span>Khả Dụng / Thiếu Hụt</span>
                                    {sortField === 'giuong_kha_dung' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th 
                                className="px-5 py-3.5 min-w-[240px] cursor-pointer hover:opacity-80 transition select-none"
                                onClick={() => handleSort('ty_le_cong_suat')}
                            >
                                <div className="flex items-center gap-1.5 font-black">
                                    <span>Công Suất Sử Dụng Giường (%)</span>
                                    {sortField === 'ty_le_cong_suat' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th className="px-4 py-3.5 text-center w-32">Trạng Thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.length === 0 ? (
                            <TableEmptyState
                                colSpan={8}
                                title="Không tìm thấy khoa lâm sàng"
                                message="Không có khoa lâm sàng nào phù hợp với bộ lọc hoặc từ khóa tìm kiếm hiện tại."
                                onResetFilter={() => {
                                    setSearchTerm('');
                                    setSelectedCategory('ALL');
                                    setHideEmpty(false);
                                }}
                            />
                        ) : (
                            filteredItems.map((it, idx) => {
                                const rate = Number(it.ty_le_cong_suat || 0);
                                const tk = Number(it.giuong_thuc_ke || 0);
                                const bn = Number(it.bn_dang_nam || 0);
                                const diff = tk - bn;

                                let barGradient = 'from-blue-500 to-indigo-600';
                                let textColor = 'text-blue-600 dark:text-blue-400';
                                let statusPill = (
                                    <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                        🟢 Khả dụng
                                    </span>
                                );

                                if (rate > 100) {
                                    barGradient = 'from-rose-500 to-red-600';
                                    textColor = 'text-rose-600 dark:text-rose-400 font-black';
                                    statusPill = (
                                        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-pulse">
                                            🔴 Quá tải
                                        </span>
                                    );
                                } else if (rate >= 80) {
                                    barGradient = 'from-amber-500 to-emerald-600';
                                    textColor = 'text-emerald-600 dark:text-emerald-400 font-bold';
                                    statusPill = (
                                        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                            🟡 Tối ưu
                                        </span>
                                    );
                                }

                                // Medal logic
                                const medal = it.dept_id === top1Id ? '🥇' : it.dept_id === top2Id ? '🥈' : it.dept_id === top3Id ? '🥉' : null;

                                return (
                                    <tr key={it.dept_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition">
                                        <td className="px-4 py-3.5 text-center font-mono text-xs font-semibold">
                                            {medal ? (
                                                <span className="text-base" title={`Hạng ${medal === '🥇' ? 1 : medal === '🥈' ? 2 : 3} công suất giường`}>
                                                    {medal}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">{idx + 1}</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                <span>{it.dept_name}</span>
                                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                                                    {it.dept_id}
                                                </span>
                                                {rate > 100 && (
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-pulse">
                                                        Quá tải
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-right text-slate-600 dark:text-slate-300 font-mono tabular-nums">
                                            {Number(it.giuong_ke_hoach || 0).toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-4 py-3.5 text-right text-blue-600 dark:text-blue-400 font-bold font-mono tabular-nums">
                                            {tk.toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-black text-purple-600 dark:text-purple-400 text-base font-mono tabular-nums">
                                            {bn.toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-mono tabular-nums">
                                            {diff < 0 ? (
                                                <span className="font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded-md text-xs border border-rose-200 dark:border-rose-800">
                                                    {diff} giường
                                                </span>
                                            ) : diff === 0 ? (
                                                <span className="font-bold text-amber-600 dark:text-amber-400 text-xs">
                                                    Hết giường (0)
                                                </span>
                                            ) : (
                                                <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-md text-xs border border-emerald-200 dark:border-emerald-800">
                                                    +{diff} giường
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full bg-gradient-to-r ${barGradient} rounded-full transition-all duration-500`}
                                                        style={{ width: `${Math.min(rate, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <span className={`w-14 text-right font-black text-sm font-mono tabular-nums ${textColor}`}>
                                                    {rate}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-center">
                                            {statusPill}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                    {/* Sticky Footer Total Row */}
                    <tfoot className="bg-slate-100 dark:bg-slate-700 font-bold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-600 sticky bottom-0 z-10 shadow-md">
                        <tr>
                            <td colSpan={2} className="px-5 py-3.5 text-center uppercase tracking-wide text-xs">
                                TỔNG CỘNG ({filteredItems.length} KHOA LÂM SÀNG)
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono tabular-nums text-slate-700 dark:text-slate-200">
                                {totals.giuong_ke_hoach.toLocaleString('vi-VN')}
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono tabular-nums text-blue-600 dark:text-blue-300 font-bold">
                                {totals.giuong_thuc_ke.toLocaleString('vi-VN')}
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono tabular-nums font-black text-purple-600 dark:text-purple-300 text-base">
                                {totals.bn_dang_nam.toLocaleString('vi-VN')}
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono tabular-nums">
                                <span className={`font-bold ${totalAvailableBeds >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                    {totalAvailableBeds >= 0 ? `+${totalAvailableBeds} giường trống` : `${totalAvailableBeds} giường`}
                                </span>
                            </td>
                            <td className="px-5 py-3.5">
                                <span className="font-black text-emerald-600 dark:text-emerald-300 text-sm font-mono tabular-nums">
                                    Công suất TB: {totalOccupancyRate}%
                                </span>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                                <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                                    Number(totalOccupancyRate) >= 80 && Number(totalOccupancyRate) <= 100
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                }`}>
                                    {Number(totalOccupancyRate) >= 80 ? '🟡 Tối ưu' : '🟢 An toàn'}
                                </span>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <PrintReportFooter />
        </div>
    );
};
