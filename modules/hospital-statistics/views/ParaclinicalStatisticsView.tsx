// ==================== PARACLINICAL STATISTICS VIEW ====================
// File: modules/hospital-statistics/views/ParaclinicalStatisticsView.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
    ResponsiveContainer, 
    ComposedChart,
    BarChart, 
    Bar, 
    Line,
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
import { ParaclinicalStatisticsItem } from '../types';
import { 
    BeakerIcon, 
    SparklesIcon, 
    CurrencyDollarIcon, 
    UserGroupIcon 
} from '../../../components/Icons';

type SortField = 'group_name' | 'tong_so_bn' | 'tong_so_ca' | 'ca_bhyt' | 'ca_dichvu' | 'don_gia_tb' | 'tong_thanh_tien';

// Helper for Vietnamese unaccented search
const removeVietnameseTones = (str: string): string => {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase();
};

export const ParaclinicalStatisticsView: React.FC = () => {
    const now = new Date();
    const [fromDate, setFromDate] = useState(`${formatLocalDate(now)} 00:00:00`);
    const [toDate, setToDate] = useState(`${formatLocalDate(now)} 23:59:59`);
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<ParaclinicalStatisticsItem[]>([]);

    // Filter & Sort
    const [searchTerm, setSearchTerm] = useState('');
    const [hideEmpty, setHideEmpty] = useState(true);
    const [sortField, setSortField] = useState<SortField>('tong_thanh_tien');
    const [sortAsc, setSortAsc] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'B1' | 'B2' | 'B3' | 'HIGH_REV'>('ALL');

    // Auto-scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
        const main = document.querySelector('main');
        if (main) main.scrollTo(0, 0);
    }, []);

    const fetchData = async (overrideFrom?: string, overrideTo?: string) => {
        const from = overrideFrom || fromDate;
        const to = overrideTo || toDate;
        setLoading(true);
        try {
            const res = await statisticsService.getParaclinicalStatistics(from, to);
            setItems(res);
        } catch (error) {
            console.error('Error fetching paraclinical statistics:', error);
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

        if (selectedCategory === 'HIGH_REV') {
            result = result.filter(it => Number(it.tong_thanh_tien || 0) >= 500_000_000);
        } else if (selectedCategory !== 'ALL') {
            result = result.filter(it => it.group_id && it.group_id.startsWith(selectedCategory));
        }

        if (searchTerm.trim()) {
            const cleanQuery = removeVietnameseTones(searchTerm.trim());
            result = result.filter(it => {
                const cleanName = removeVietnameseTones(it.group_name || '');
                const cleanId = removeVietnameseTones(it.group_id || '');
                return cleanName.includes(cleanQuery) || cleanId.includes(cleanQuery);
            });
        }

        result = [...result].sort((a, b) => {
            let valA: any = a[sortField as keyof ParaclinicalStatisticsItem];
            let valB: any = b[sortField as keyof ParaclinicalStatisticsItem];
            
            if (sortField === 'don_gia_tb') {
                const caA = Number(a.tong_so_ca || 0);
                const caB = Number(b.tong_so_ca || 0);
                valA = caA > 0 ? Number(a.tong_thanh_tien || 0) / caA : 0;
                valB = caB > 0 ? Number(b.tong_thanh_tien || 0) / caB : 0;
            } else if (sortField !== 'group_name') {
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
    }, [items, hideEmpty, selectedCategory, searchTerm, sortField, sortAsc]);

    // Aggregate category counts
    const countB1 = useMemo(() => items.filter(it => it.group_id?.startsWith('B1')).length, [items]);
    const countB2 = useMemo(() => items.filter(it => it.group_id?.startsWith('B2')).length, [items]);
    const countB3 = useMemo(() => items.filter(it => it.group_id?.startsWith('B3')).length, [items]);
    const countHighRev = useMemo(() => items.filter(it => Number(it.tong_thanh_tien || 0) >= 500_000_000).length, [items]);

    const totals = useMemo(() => {
        return filteredItems.reduce((acc, curr) => ({
            tong_so_bn: acc.tong_so_bn + Number(curr.tong_so_bn || 0),
            tong_so_ca: acc.tong_so_ca + Number(curr.tong_so_ca || 0),
            ca_bhyt: acc.ca_bhyt + Number(curr.ca_bhyt || 0),
            ca_dichvu: acc.ca_dichvu + Number(curr.ca_dichvu || 0),
            tong_thanh_tien: acc.tong_thanh_tien + Number(curr.tong_thanh_tien || 0)
        }), { tong_so_bn: 0, tong_so_ca: 0, ca_bhyt: 0, ca_dichvu: 0, tong_thanh_tien: 0 });
    }, [filteredItems]);

    const maxRevenue = useMemo(() => {
        return Math.max(...filteredItems.map(it => Number(it.tong_thanh_tien || 0)), 1);
    }, [filteredItems]);

    // Top volume groups for medal awards
    const topVolumeGroups = useMemo(() => {
        return [...items]
            .filter(it => Number(it.tong_so_ca || 0) > 0)
            .sort((a, b) => Number(b.tong_so_ca || 0) - Number(a.tong_so_ca || 0));
    }, [items]);
    const top1Id = topVolumeGroups[0]?.group_id;
    const top2Id = topVolumeGroups[1]?.group_id;
    const top3Id = topVolumeGroups[2]?.group_id;

    // Stacked Bar Chart Data (Top 7 groups by volume with BHYT vs Viện phí & Average Unit Price)
    const barChartData = useMemo(() => {
        return [...filteredItems]
            .filter(it => Number(it.tong_so_ca || 0) > 0)
            .sort((a, b) => Number(b.tong_so_ca || 0) - Number(a.tong_so_ca || 0))
            .slice(0, 7)
            .map(it => {
                const total = Number(it.tong_so_ca || 0);
                const bhyt = Number(it.ca_bhyt || 0);
                const dv = Number(it.ca_dichvu || 0);
                const revenue = Number(it.tong_thanh_tien || 0);
                const avgPrice = total > 0 ? Math.round(revenue / total) : 0;
                const shortName = it.group_name.length > 16 
                    ? it.group_name.slice(0, 16) + '...' 
                    : it.group_name;
                return {
                    name: shortName,
                    fullName: it.group_name,
                    groupId: it.group_id,
                    ca_bhyt: bhyt,
                    ca_dichvu: dv,
                    total: total,
                    revenue: revenue,
                    avgPrice: avgPrice,
                    avgPriceK: Math.round(avgPrice / 1000),
                    bhytRate: total > 0 ? ((bhyt / total) * 100).toFixed(1) : '0'
                };
            });
    }, [filteredItems]);

    // Donut Chart Data: Revenue by Clinical Block (LIS, CĐHA, TDCN)
    const donutChartData = useMemo(() => {
        let lisRevenue = 0;
        let pacsRevenue = 0;
        let tdcnRevenue = 0;
        let otherRevenue = 0;

        for (const it of filteredItems) {
            const rev = Number(it.tong_thanh_tien || 0);
            const id = it.group_id || '';
            if (id.startsWith('B1')) {
                lisRevenue += rev;
            } else if (id.startsWith('B2')) {
                pacsRevenue += rev;
            } else if (id.startsWith('B3')) {
                tdcnRevenue += rev;
            } else {
                otherRevenue += rev;
            }
        }

        const data = [
            { name: 'Xét Nghiệm (LIS)', value: lisRevenue, color: '#10B981', code: 'B1' },
            { name: 'Thăm Dò Chức Năng (TDCN)', value: tdcnRevenue, color: '#8B5CF6', code: 'B3' },
            { name: 'Chẩn Đoán Hình Ảnh (CĐHA)', value: pacsRevenue, color: '#3B82F6', code: 'B2' }
        ].filter(it => it.value > 0);

        if (otherRevenue > 0) {
            data.push({ name: 'Khối Khác', value: otherRevenue, color: '#F59E0B', code: 'Khác' });
        }

        return data;
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
        const rows = filteredItems.map((it, idx) => {
            const ca = Number(it.tong_so_ca || 0);
            const tien = Number(it.tong_thanh_tien || 0);
            const donGia = ca > 0 ? Math.round(tien / ca) : 0;
            return {
                'STT': idx + 1,
                'Mã Nhóm': it.group_id,
                'Tên Nhóm Cận Lâm Sàng': it.group_name,
                'Số Bệnh Nhân': Number(it.tong_so_bn || 0),
                'Tổng Số Ca': ca,
                'Ca BHYT': Number(it.ca_bhyt || 0),
                'Ca Dịch Vụ': Number(it.ca_dichvu || 0),
                'Đơn Giá TB (VNĐ/ca)': donGia,
                'Tổng Doanh Thu (VNĐ)': tien
            };
        });
        const totalCa = totals.tong_so_ca;
        const totalTien = totals.tong_thanh_tien;
        rows.push({
            'STT': 'TỔNG CỘNG',
            'Mã Nhóm': '',
            'Tên Nhóm Cận Lâm Sàng': `${filteredItems.length} nhóm kỹ thuật`,
            'Số Bệnh Nhân': totals.tong_so_bn,
            'Tổng Số Ca': totalCa,
            'Ca BHYT': totals.ca_bhyt,
            'Ca Dịch Vụ': totals.ca_dichvu,
            'Đơn Giá TB (VNĐ/ca)': totalCa > 0 ? Math.round(totalTien / totalCa) : 0,
            'Tổng Doanh Thu (VNĐ)': totalTien
        });
        exportTableToExcel(rows, 'Thong_Ke_Can_Lam_Sang', 'Cận Lâm Sàng');
    };

    // Intensity ratio
    const intensity = totals.tong_so_bn > 0 
        ? (totals.tong_so_ca / totals.tong_so_bn).toFixed(2) 
        : '0';
    const bhytPercent = totals.tong_so_ca > 0 
        ? ((totals.ca_bhyt / totals.tong_so_ca) * 100).toFixed(1) 
        : '0';
    const dichvuPercent = totals.tong_so_ca > 0 
        ? ((totals.ca_dichvu / totals.tong_so_ca) * 100).toFixed(1) 
        : '0';
    const avgPrice = totals.tong_so_ca > 0 
        ? Math.round(totals.tong_thanh_tien / totals.tong_so_ca) 
        : 0;

    return (
        <div className="space-y-3 sm:space-y-3.5">
            {/* Header section with fast navigation switcher */}
            <div className="print:hidden flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2.5">
                        <BeakerIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        <span>Báo cáo Thống kê Hoạt động Cận lâm sàng</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Tổng hợp lượt thực hiện Xét nghiệm (LIS), Chẩn đoán hình ảnh (PACS) và Thăm dò chức năng (TDCN)
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        to="/hospital-statistics/inpatient"
                        className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition"
                    >
                        ← Điều Trị Nội Trú
                    </Link>
                    <Link
                        to="/hospital-statistics/surgery"
                        className="px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition"
                    >
                        Phẫu Thuật - Thủ Thuật →
                    </Link>
                </div>
            </div>

            {/* Print Header */}
            <PrintReportHeader 
                formCode="Biểu mẫu: 04/BC-CLS"
                title="BÁO CÁO THỐNG KÊ HOẠT ĐỘNG CẬN LÂM SÀNG"
                subtitle="Phân nhóm LIS, PACS, TDCN và cơ cấu thu viện phí theo nguồn đối tượng"
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
                searchPlaceholder="Tìm tên nhóm (gõ không dấu: sinh hoa, xquang, sieu am...) hoặc mã nhóm..."
                hideEmpty={hideEmpty}
                onHideEmptyChange={setHideEmpty}
                totalCount={items.length}
                filteredCount={filteredItems.length}
            />

            {/* 4 Executive Clinical & Financial KPI Cards (gcv-ninhbinh his-kpi-card standard) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 print:hidden">
                {/* Card 1: Tổng Sản Lượng CLS */}
                <div className="his-kpi-card border-l-4 border-l-blue-500 p-4.5 rounded-xl bg-white dark:bg-slate-800 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                            Tổng Sản Lượng CLS
                        </span>
                        <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                            <BeakerIcon className="w-5 h-5" />
                        </span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums mt-1">
                        {totals.tong_so_ca.toLocaleString('vi-VN')}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>{filteredItems.length} nhóm kỹ thuật</span>
                        <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">
                            LIS • PACS • TDCN
                        </span>
                    </div>
                </div>

                {/* Card 2: Lượt Bệnh Nhân & Cường Độ Chỉ Định */}
                <div className="his-kpi-card border-l-4 border-l-indigo-500 p-4.5 rounded-xl bg-white dark:bg-slate-800 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                            Lượt Tiếp Nhận & Cường Độ
                        </span>
                        <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                            <UserGroupIcon className="w-5 h-5" />
                        </span>
                    </div>
                    <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono tabular-nums mt-1">
                        {totals.tong_so_bn.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-400">lượt BN</span>
                    </div>
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                        <span>Cường độ: <strong className="text-indigo-600 dark:text-indigo-300 font-bold">{intensity}</strong> ca/BN</span>
                        <div className="w-20 bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                            <div 
                                className="bg-indigo-600 h-full rounded-full" 
                                style={{ width: `${Math.min((Number(intensity) / 4) * 100, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Card 3: Cơ Cấu Đối Tượng Thanh Toán */}
                <div className="his-kpi-card border-l-4 border-l-emerald-500 p-4.5 rounded-xl bg-white dark:bg-slate-800 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                            Cơ Cấu Đối Tượng
                        </span>
                        <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                            <SparklesIcon className="w-5 h-5" />
                        </span>
                    </div>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-1">
                        {bhytPercent}% <span className="text-xs font-normal text-slate-400">BHYT</span>
                    </div>
                    <div className="mt-2 space-y-1">
                        <div className="w-full bg-amber-200 dark:bg-amber-900/40 h-2 rounded-full overflow-hidden flex">
                            <div 
                                className="bg-emerald-500 h-full" 
                                style={{ width: `${bhytPercent}%` }}
                                title={`BHYT: ${totals.ca_bhyt.toLocaleString('vi-VN')} ca`}
                            ></div>
                            <div 
                                className="bg-amber-500 h-full" 
                                style={{ width: `${dichvuPercent}%` }}
                                title={`Viện phí: ${totals.ca_dichvu.toLocaleString('vi-VN')} ca`}
                            ></div>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="text-emerald-600 font-medium">BHYT: {totals.ca_bhyt.toLocaleString('vi-VN')}</span>
                            <span className="text-amber-600 font-medium">VP: {totals.ca_dichvu.toLocaleString('vi-VN')} ({dichvuPercent}%)</span>
                        </div>
                    </div>
                </div>

                {/* Card 4: Tổng Doanh Thu Viện Phí & Giá Trị TB */}
                <div className="his-kpi-card border-l-4 border-l-purple-500 p-4.5 rounded-xl bg-white dark:bg-slate-800 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                            Tổng Doanh Thu CLS
                        </span>
                        <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                            <CurrencyDollarIcon className="w-5 h-5" />
                        </span>
                    </div>
                    <div className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono tabular-nums mt-1">
                        {(totals.tong_thanh_tien / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} <span className="text-xs font-normal text-slate-400">tr đ</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>Đơn giá TB: <strong className="text-purple-600 dark:text-purple-300 font-bold">{avgPrice.toLocaleString('vi-VN')}</strong> đ/ca</span>
                        <span className="font-mono text-[10px] text-slate-400">{totals.tong_thanh_tien.toLocaleString('vi-VN')} đ</span>
                    </div>
                </div>
            </div>

            {/* 2 BI Specialized Paraclinical Charts (Composed Volume-Price + 180° Block Meter) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-3.5 print:hidden">
                {/* Chart 1: Composed Chart for Volume & Unit Price by Technical Group (2 cols) */}
                <div className="lg:col-span-2 his-kpi-card p-4 sm:p-4.5 rounded-xl bg-white dark:bg-slate-800 shadow-xs border border-slate-200/80 dark:border-slate-700">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                                <span>Sản Lượng CLS & Đơn Giá Bình Quân Theo Nhóm Kỹ Thuật</span>
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Cột: Ca BHYT (xanh lục) & Ca Viện phí (hổ phách) • Đường xu hướng tím: Đơn giá bình quân (nghìn đ/ca)
                            </p>
                        </div>
                        <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-lg self-start sm:self-auto border border-blue-200/60 dark:border-blue-800/60">
                            Biểu đồ kết hợp (Composed)
                        </span>
                    </div>

                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={barChartData} margin={{ top: 10, right: 30, left: -10, bottom: 25 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                                <XAxis 
                                    dataKey="name" 
                                    tick={{ fontSize: 11, fill: '#64748B' }}
                                    interval={0}
                                    angle={-15}
                                    textAnchor="end"
                                />
                                <YAxis 
                                    yAxisId="left"
                                    tick={{ fontSize: 11, fill: '#64748B' }}
                                    tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                                />
                                <YAxis 
                                    yAxisId="right"
                                    orientation="right"
                                    tick={{ fontSize: 11, fill: '#6366F1' }}
                                    tickFormatter={(val) => `${val}k`}
                                />
                                <Tooltip 
                                    formatter={(value: any, name: any) => {
                                        if (name === 'avgPriceK') return [`${(Number(value) * 1000).toLocaleString('vi-VN')} đ/ca`, 'Đơn Giá Bình Quân'];
                                        if (name === 'ca_bhyt') return [`${Number(value).toLocaleString('vi-VN')} ca`, 'Ca BHYT'];
                                        if (name === 'ca_dichvu') return [`${Number(value).toLocaleString('vi-VN')} ca`, 'Ca Viện Phí'];
                                        return [value, name];
                                    }}
                                    labelFormatter={(label, payload) => {
                                        if (payload && payload.length > 0) {
                                            const item = payload[0].payload;
                                            return `${item.fullName} (${item.groupId}) - Tổng: ${item.total.toLocaleString('vi-VN')} ca (Doanh thu: ${(item.revenue / 1_000_000).toFixed(1)} tr • Đơn giá TB: ${item.avgPrice.toLocaleString('vi-VN')} đ/ca)`;
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
                                    formatter={(value) => {
                                        if (value === 'ca_bhyt') return 'Ca BHYT';
                                        if (value === 'ca_dichvu') return 'Ca Viện Phí';
                                        if (value === 'avgPriceK') return 'Đơn Giá TB (k đ)';
                                        return value;
                                    }}
                                />
                                <Bar yAxisId="left" dataKey="ca_bhyt" name="ca_bhyt" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
                                <Bar yAxisId="left" dataKey="ca_dichvu" name="ca_dichvu" stackId="a" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                                <Line 
                                    yAxisId="right" 
                                    type="monotone" 
                                    dataKey="avgPriceK" 
                                    name="avgPriceK" 
                                    stroke="#6366F1" 
                                    strokeWidth={2.5} 
                                    dot={{ r: 4, fill: '#6366F1', strokeWidth: 2, stroke: '#FFFFFF' }} 
                                    activeDot={{ r: 6 }} 
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Quick ranking chips footer */}
                    <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Nhóm dẫn đầu viện:</span>
                        <div className="flex flex-wrap gap-2">
                            {barChartData.slice(0, 4).map((it, i) => (
                                <span key={it.groupId} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-700/50 text-[11px]">
                                    <strong className="text-blue-600 dark:text-blue-400">#{i + 1}</strong> {it.fullName}: <strong>{it.total.toLocaleString('vi-VN')} ca</strong> <span className="text-indigo-600 font-medium">({it.avgPriceK}k đ/ca)</span>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Chart 2: 180° Semi-circle Dial Gauge for Clinical Blocks (1 col) */}
                <div className="his-kpi-card p-5 rounded-2xl bg-white dark:bg-slate-800 shadow-xs border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                                <span>Cơ Cấu Doanh Thu 3 Khối CLS</span>
                            </h3>
                            <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400 font-bold bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded-md border border-purple-200/50">
                                180° Dial Meter
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                            Tỷ trọng nguồn thu giữa LIS (Xét nghiệm), PACS (CĐHA) và TDCN
                        </p>

                        <div className="h-44 w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={donutChartData}
                                        cx="50%"
                                        cy="82%"
                                        startAngle={180}
                                        endAngle={0}
                                        innerRadius={65}
                                        outerRadius={92}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {donutChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        formatter={(val: any) => [
                                            Number(val).toLocaleString('vi-VN') + ' đ (' + (totals.tong_thanh_tien > 0 ? ((Number(val) / totals.tong_thanh_tien) * 100).toFixed(1) : 0) + '%)',
                                            'Doanh thu'
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

                            {/* Center Metric Label inside semi-circle */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pt-8 pointer-events-none">
                                <span className="text-xl font-black text-slate-800 dark:text-white font-mono leading-tight">
                                    {(totals.tong_thanh_tien / 1_000_000_000).toFixed(2)} tỷ
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                                    Doanh thu CLS
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 3 Executive Block Cards */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                        {donutChartData.map((item) => {
                            const percent = totals.tong_thanh_tien > 0 
                                ? ((item.value / totals.tong_thanh_tien) * 100).toFixed(1) 
                                : '0';
                            return (
                                <div key={item.code} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50/70 dark:bg-slate-700/30">
                                    <div className="flex items-center gap-1.5 truncate">
                                        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }}></span>
                                        <span className="text-slate-700 dark:text-slate-200 font-medium truncate">{item.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 font-mono shrink-0">
                                        <span className="text-slate-500 text-[11px]">{(item.value / 1_000_000).toFixed(0)} tr</span>
                                        <strong className="text-slate-800 dark:text-slate-100 font-bold">{percent}%</strong>
                                    </div>
                                </div>
                            );
                        })}
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
                        onClick={() => setSelectedCategory('B1')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                            selectedCategory === 'B1'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400'
                        }`}
                    >
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span>Xét Nghiệm (LIS) ({countB1})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedCategory('B2')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                            selectedCategory === 'B2'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'
                        }`}
                    >
                        <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                        <span>CĐHA (PACS) ({countB2})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedCategory('B3')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                            selectedCategory === 'B3'
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400'
                        }`}
                    >
                        <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                        <span>Thăm Dò Chức Năng (TDCN) ({countB3})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedCategory('HIGH_REV')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                            selectedCategory === 'HIGH_REV'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400'
                        }`}
                    >
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        <span>Doanh Thu Cao (&gt;500tr) ({countHighRev})</span>
                    </button>
                </div>

                <Link
                    to="/hospital-statistics/surgery"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition border border-purple-200/80 dark:border-purple-800/80 shadow-xs cursor-pointer"
                >
                    <SparklesIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Xem Báo Cáo Phẫu Thuật - Thủ Thuật</span>
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
                                onClick={() => handleSort('group_name')}
                            >
                                <div className="flex items-center gap-1.5">
                                    <span>Nhóm Kỹ Thuật Cận Lâm Sàng</span>
                                    {sortField === 'group_name' && (
                                        <span>{sortAsc ? '▲' : '▼'}</span>
                                    )}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:opacity-80 transition select-none"
                                onClick={() => handleSort('tong_so_bn')}
                            >
                                <div className="flex items-center justify-end gap-1.5">
                                    <span>Số Bệnh Nhân</span>
                                    {sortField === 'tong_so_bn' && (
                                        <span>{sortAsc ? '▲' : '▼'}</span>
                                    )}
                                </div>
                            </th>
                            <th 
                                className="px-5 py-3.5 text-right cursor-pointer hover:opacity-80 transition min-w-[130px] select-none"
                                onClick={() => handleSort('tong_so_ca')}
                            >
                                <div className="flex items-center justify-end gap-1.5 font-bold">
                                    <span>Tổng Số Ca</span>
                                    {sortField === 'tong_so_ca' && (
                                        <span>{sortAsc ? '▲' : '▼'}</span>
                                    )}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:opacity-80 transition select-none"
                                onClick={() => handleSort('ca_bhyt')}
                            >
                                <div className="flex items-center justify-end gap-1.5">
                                    <span>Ca BHYT</span>
                                    {sortField === 'ca_bhyt' && (
                                        <span>{sortAsc ? '▲' : '▼'}</span>
                                    )}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:opacity-80 transition select-none"
                                onClick={() => handleSort('ca_dichvu')}
                            >
                                <div className="flex items-center justify-end gap-1.5">
                                    <span>Ca Dịch Vụ</span>
                                    {sortField === 'ca_dichvu' && (
                                        <span>{sortAsc ? '▲' : '▼'}</span>
                                    )}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:opacity-80 transition select-none"
                                onClick={() => handleSort('don_gia_tb')}
                            >
                                <div className="flex items-center justify-end gap-1.5">
                                    <span>Đơn Giá TB</span>
                                    {sortField === 'don_gia_tb' && (
                                        <span>{sortAsc ? '▲' : '▼'}</span>
                                    )}
                                </div>
                            </th>
                            <th 
                                className="px-5 py-3.5 text-right cursor-pointer hover:opacity-80 transition min-w-[190px] select-none"
                                onClick={() => handleSort('tong_thanh_tien')}
                            >
                                <div className="flex items-center justify-end gap-1.5 font-bold">
                                    <span>Tổng Doanh Thu Viện Phí</span>
                                    {sortField === 'tong_thanh_tien' && (
                                        <span>{sortAsc ? '▲' : '▼'}</span>
                                    )}
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.length === 0 ? (
                            <TableEmptyState
                                colSpan={8}
                                title="Không tìm thấy nhóm cận lâm sàng"
                                message="Không có nhóm cận lâm sàng nào phù hợp với bộ lọc hoặc từ khóa tìm kiếm hiện tại."
                                onResetFilter={() => {
                                    setSearchTerm('');
                                    setSelectedCategory('ALL');
                                    setHideEmpty(false);
                                }}
                            />
                        ) : (
                            filteredItems.map((it, idx) => {
                                const groupId = it.group_id || '';
                                const badgeColor = groupId.startsWith('B1') 
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200' 
                                    : groupId.startsWith('B2') 
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200' 
                                    : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200';

                                const totalCa = Number(it.tong_so_ca || 0);
                                const totalBn = Number(it.tong_so_bn || 0);
                                const caBhyt = Number(it.ca_bhyt || 0);
                                const caDv = Number(it.ca_dichvu || 0);
                                const revenue = Number(it.tong_thanh_tien || 0);
                                const revenuePercent = ((revenue / maxRevenue) * 100).toFixed(0);
                                
                                const donGia = totalCa > 0 ? Math.round(revenue / totalCa) : 0;
                                const groupIntensity = totalBn > 0 ? (totalCa / totalBn).toFixed(1) : '0';
                                const itemBhytRate = totalCa > 0 ? ((caBhyt / totalCa) * 100).toFixed(1) : '0';

                                // Medal logic
                                const medal = groupId === top1Id ? '🥇' : groupId === top2Id ? '🥈' : groupId === top3Id ? '🥉' : null;

                                return (
                                    <tr key={it.group_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition">
                                        <td className="px-4 py-3.5 text-center font-mono text-xs font-semibold">
                                            {medal ? (
                                                <span className="text-base" title={`Hạng ${medal === '🥇' ? 1 : medal === '🥈' ? 2 : 3} sản lượng CLS`}>
                                                    {medal}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">{idx + 1}</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                    <span>{it.group_name}</span>
                                                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold border ${badgeColor}`}>
                                                        {it.group_id}
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-2">
                                                    <span>Tần suất: <strong className="text-slate-600 dark:text-slate-400">{groupIntensity}</strong> ca/BN</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-medium text-slate-600 dark:text-slate-300 font-mono tabular-nums">
                                            {totalBn.toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-5 py-3.5 text-right font-black text-blue-600 dark:text-blue-400 font-mono tabular-nums text-sm">
                                            {totalCa.toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                                            <div className="flex flex-col items-end">
                                                <span>{caBhyt.toLocaleString('vi-VN')}</span>
                                                <span className="text-[10px] text-emerald-500 font-normal">({itemBhytRate}%)</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-bold text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                                            {caDv.toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                                            <span className="font-semibold">{donGia.toLocaleString('vi-VN')}</span> <span className="text-[10px] text-slate-400">đ</span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right font-mono tabular-nums">
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="font-black text-purple-600 dark:text-purple-400 text-sm font-mono tabular-nums">
                                                    {revenue.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-400">đ</span>
                                                </span>
                                                {revenue > 0 && (
                                                    <div className="w-28 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-300"
                                                            style={{ width: `${revenuePercent}%` }}
                                                        ></div>
                                                    </div>
                                                )}
                                            </div>
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
                                TỔNG CỘNG ({filteredItems.length} nhóm kỹ thuật)
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono tabular-nums font-bold text-slate-700 dark:text-slate-200">
                                {totals.tong_so_bn.toLocaleString('vi-VN')}
                            </td>
                            <td className="px-5 py-3.5 text-right font-mono tabular-nums font-black text-blue-600 dark:text-blue-300 text-sm">
                                {totals.tong_so_ca.toLocaleString('vi-VN')}
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono tabular-nums font-black text-emerald-600 dark:text-emerald-300">
                                <div className="flex flex-col items-end">
                                    <span>{totals.ca_bhyt.toLocaleString('vi-VN')}</span>
                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">({bhytPercent}%)</span>
                                </div>
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono tabular-nums font-black text-amber-600 dark:text-amber-300">
                                {totals.ca_dichvu.toLocaleString('vi-VN')}
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono tabular-nums font-bold text-slate-700 dark:text-slate-200">
                                {avgPrice.toLocaleString('vi-VN')} đ
                            </td>
                            <td className="px-5 py-3.5 text-right font-mono tabular-nums font-black text-purple-600 dark:text-purple-300 text-base">
                                {totals.tong_thanh_tien.toLocaleString('vi-VN')} đ
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <PrintReportFooter />
        </div>
    );
};
