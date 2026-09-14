// ==================== DEPARTMENT COST VIEW ====================
// File: modules/hospital-statistics/views/DepartmentCostView.tsx

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
import { DepartmentCostItem } from '../types';
import { 
    CurrencyDollarIcon, 
    UserGroupIcon, 
    BuildingOfficeIcon,
    SparklesIcon
} from '../../../components/Icons';

type SortField = keyof DepartmentCostItem | 'chi_phi_tb';

// Helper for Vietnamese unaccented search
const removeVietnameseTones = (str: string): string => {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase();
};

export const DepartmentCostView: React.FC = () => {
    const now = new Date();
    const [fromDate, setFromDate] = useState(`${formatLocalDate(now)} 00:00:00`);
    const [toDate, setToDate] = useState(`${formatLocalDate(now)} 23:59:59`);
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<DepartmentCostItem[]>([]);

    // Filter & Sort
    const [searchTerm, setSearchTerm] = useState('');
    const [hideEmpty, setHideEmpty] = useState(true);
    const [sortField, setSortField] = useState<SortField>('tong_cong_chi_phi');
    const [sortAsc, setSortAsc] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'OUTPATIENT' | 'INPATIENT' | 'OVER_1B'>('ALL');

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
            const res = await statisticsService.getDepartmentCostStatistics(from, to);
            setItems(res);
        } catch (error) {
            console.error('Error fetching department costs:', error);
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
            result = result.filter(it => Number(it.tong_cong_chi_phi || 0) > 0);
        }

        // Category tabs
        if (selectedCategory === 'OUTPATIENT') {
            result = result.filter(it => it.dept_id === 'KB' || it.dept_name.toLowerCase().includes('khám bệnh'));
        } else if (selectedCategory === 'INPATIENT') {
            result = result.filter(it => it.dept_id !== 'KB' && !it.dept_name.toLowerCase().includes('khám bệnh'));
        } else if (selectedCategory === 'OVER_1B') {
            result = result.filter(it => Number(it.tong_cong_chi_phi || 0) >= 1_000_000_000);
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

            if (sortField === 'chi_phi_tb') {
                const bnA = Number(a.tong_luot_bn || 0);
                const costA = Number(a.tong_cong_chi_phi || 0);
                valA = bnA > 0 ? costA / bnA : 0;

                const bnB = Number(b.tong_luot_bn || 0);
                const costB = Number(b.tong_cong_chi_phi || 0);
                valB = bnB > 0 ? costB / bnB : 0;
            } else if (sortField !== 'dept_name' && sortField !== 'dept_id') {
                valA = Number(a[sortField as keyof DepartmentCostItem] || 0);
                valB = Number(b[sortField as keyof DepartmentCostItem] || 0);
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
            tong_luot_bn: acc.tong_luot_bn + Number(curr.tong_luot_bn || 0),
            tien_kham: acc.tien_kham + Number(curr.tien_kham || 0),
            tien_giuong: acc.tien_giuong + Number(curr.tien_giuong || 0),
            tien_xet_nghiem: acc.tien_xet_nghiem + Number(curr.tien_xet_nghiem || 0),
            tien_cdha: acc.tien_cdha + Number(curr.tien_cdha || 0),
            tien_tdcn: acc.tien_tdcn + Number(curr.tien_tdcn || 0),
            tien_pttt: acc.tien_pttt + Number(curr.tien_pttt || 0),
            tien_thuoc: acc.tien_thuoc + Number(curr.tien_thuoc || 0),
            tien_mau: acc.tien_mau + Number(curr.tien_mau || 0),
            tien_vtyt: acc.tien_vtyt + Number(curr.tien_vtyt || 0),
            tien_khac: acc.tien_khac + Number(curr.tien_khac || 0),
            tong_cong_chi_phi: acc.tong_cong_chi_phi + Number(curr.tong_cong_chi_phi || 0),
            bhyt_thanh_toan: acc.bhyt_thanh_toan + Number(curr.bhyt_thanh_toan || 0),
            benh_nhan_tra: acc.benh_nhan_tra + Number(curr.benh_nhan_tra || 0)
        }), {
            tong_luot_bn: 0, tien_kham: 0, tien_giuong: 0, tien_xet_nghiem: 0, tien_cdha: 0,
            tien_tdcn: 0, tien_pttt: 0, tien_thuoc: 0, tien_mau: 0, tien_vtyt: 0,
            tien_khac: 0, tong_cong_chi_phi: 0, bhyt_thanh_toan: 0, benh_nhan_tra: 0
        });
    }, [filteredItems]);

    // Category counts for tab badges
    const countOutpatient = useMemo(() => {
        return items.filter(it => it.dept_id === 'KB' || it.dept_name.toLowerCase().includes('khám bệnh')).length;
    }, [items]);

    const countInpatient = useMemo(() => {
        return items.filter(it => it.dept_id !== 'KB' && !it.dept_name.toLowerCase().includes('khám bệnh')).length;
    }, [items]);

    const countOver1B = useMemo(() => {
        return items.filter(it => Number(it.tong_cong_chi_phi || 0) >= 1_000_000_000).length;
    }, [items]);

    // Top departments for medals
    const topCostDepts = useMemo(() => {
        return [...items]
            .filter(it => Number(it.tong_cong_chi_phi || 0) > 0)
            .sort((a, b) => Number(b.tong_cong_chi_phi || 0) - Number(a.tong_cong_chi_phi || 0));
    }, [items]);
    const top1Id = topCostDepts[0]?.dept_id;
    const top2Id = topCostDepts[1]?.dept_id;
    const top3Id = topCostDepts[2]?.dept_id;

    const maxCost = useMemo(() => {
        return Math.max(...filteredItems.map(it => Number(it.tong_cong_chi_phi || 0)), 1);
    }, [filteredItems]);

    // Composed Chart Data: BHYT vs Patient Pay & BHYT % by Department
    const barChartData = useMemo(() => {
        return [...filteredItems]
            .filter(it => Number(it.tong_cong_chi_phi || 0) > 0)
            .sort((a, b) => Number(b.tong_cong_chi_phi || 0) - Number(a.tong_cong_chi_phi || 0))
            .slice(0, 7)
            .map(it => {
                const total = Number(it.tong_cong_chi_phi || 0);
                const bhyt = Number(it.bhyt_thanh_toan || 0);
                const bn = Number(it.benh_nhan_tra || 0);
                const shortName = it.dept_name.length > 16 
                    ? it.dept_name.slice(0, 16) + '...' 
                    : it.dept_name;
                const rate = total > 0 ? parseFloat(((bhyt / total) * 100).toFixed(1)) : 0;
                return {
                    name: shortName,
                    fullName: it.dept_name,
                    deptId: it.dept_id,
                    bhyt_tr: Math.round(bhyt / 1_000_000),
                    bn_tr: Math.round(bn / 1_000_000),
                    total_tr: Math.round(total / 1_000_000),
                    bhyt_raw: bhyt,
                    bn_raw: bn,
                    total_raw: total,
                    bhytRate: rate,
                    patients: Number(it.tong_luot_bn || 0)
                };
            });
    }, [filteredItems]);

    // Donut Chart Data: 8 Core Cost Component Breakdown
    const donutChartData = useMemo(() => {
        const raw = [
            { name: 'Tiền Thuốc', value: totals.tien_thuoc, color: '#8B5CF6', code: 'THUOC' },
            { name: 'Xét Nghiệm', value: totals.tien_xet_nghiem, color: '#10B981', code: 'XN' },
            { name: 'Tiền Giường', value: totals.tien_giuong, color: '#3B82F6', code: 'GIUONG' },
            { name: 'Tiền Khám', value: totals.tien_kham, color: '#F59E0B', code: 'KHAM' },
            { name: 'VTYT', value: totals.tien_vtyt, color: '#EC4899', code: 'VTYT' },
            { name: 'Thăm Dò CN', value: totals.tien_tdcn, color: '#6366F1', code: 'TDCN' },
            { name: 'PTTT', value: totals.tien_pttt, color: '#EF4444', code: 'PTTT' },
            { name: 'CĐHA', value: totals.tien_cdha, color: '#06B6D4', code: 'CDHA' }
        ];
        return raw.filter(it => it.value > 0);
    }, [totals]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortAsc(!sortAsc);
        } else {
            setSortField(field);
            setSortAsc(false);
        }
    };

    const fmtMoney = (val?: number | string) => {
        const num = Math.round(Number(val || 0));
        if (num === 0) return '-';
        return num.toLocaleString('vi-VN');
    };

    const handleExport = () => {
        const rows = filteredItems.map((it, idx) => ({
            'STT': idx + 1,
            'Mã Khoa': it.dept_id,
            'Khoa Phòng': it.dept_name,
            'Lượt Bệnh Nhân': Number(it.tong_luot_bn || 0),
            'Chi Phí Bình Quân (VNĐ/lượt)': Number(it.tong_luot_bn || 0) > 0 ? Math.round(Number(it.tong_cong_chi_phi || 0) / Number(it.tong_luot_bn)) : 0,
            'Tiền Khám (VNĐ)': Number(it.tien_kham || 0),
            'Tiền Giường (VNĐ)': Number(it.tien_giuong || 0),
            'Xét Nghiệm (VNĐ)': Number(it.tien_xet_nghiem || 0),
            'CĐHA (VNĐ)': Number(it.tien_cdha || 0),
            'TDCN (VNĐ)': Number(it.tien_tdcn || 0),
            'PTTT (VNĐ)': Number(it.tien_pttt || 0),
            'Tiền Thuốc (VNĐ)': Number(it.tien_thuoc || 0),
            'Tiền Máu (VNĐ)': Number(it.tien_mau || 0),
            'VTYT (VNĐ)': Number(it.tien_vtyt || 0),
            'Khác (VNĐ)': Number(it.tien_khac || 0),
            'Tổng Chi Phí (VNĐ)': Number(it.tong_cong_chi_phi || 0),
            'BHYT Chi Trả (VNĐ)': Number(it.bhyt_thanh_toan || 0),
            'Bệnh Nhân Trả (VNĐ)': Number(it.benh_nhan_tra || 0)
        }));
        rows.push({
            'STT': 'TỔNG CỘNG',
            'Mã Khoa': '',
            'Khoa Phòng': `${filteredItems.length} khoa phòng`,
            'Lượt Bệnh Nhân': totals.tong_luot_bn,
            'Chi Phí Bình Quân (VNĐ/lượt)': totals.tong_luot_bn > 0 ? Math.round(totals.tong_cong_chi_phi / totals.tong_luot_bn) : 0,
            'Tiền Khám (VNĐ)': totals.tien_kham,
            'Tiền Giường (VNĐ)': totals.tien_giuong,
            'Xét Nghiệm (VNĐ)': totals.tien_xet_nghiem,
            'CĐHA (VNĐ)': totals.tien_cdha,
            'TDCN (VNĐ)': totals.tien_tdcn,
            'PTTT (VNĐ)': totals.tien_pttt,
            'Tiền Thuốc (VNĐ)': totals.tien_thuoc,
            'Tiền Máu (VNĐ)': totals.tien_mau,
            'VTYT (VNĐ)': totals.tien_vtyt,
            'Khác (VNĐ)': totals.tien_khac,
            'Tổng Chi Phí (VNĐ)': totals.tong_cong_chi_phi,
            'BHYT Chi Trả (VNĐ)': totals.bhyt_thanh_toan,
            'Bệnh Nhân Trả (VNĐ)': totals.benh_nhan_tra
        });
        exportTableToExcel(rows, 'Tong_Hop_Chi_Phi_Khoa_Phong', 'Tổng Hợp Chi Phí');
    };

    const bhytRate = totals.tong_cong_chi_phi > 0 
        ? ((totals.bhyt_thanh_toan / totals.tong_cong_chi_phi) * 100).toFixed(1) 
        : '0';
    const bnRate = totals.tong_cong_chi_phi > 0 
        ? ((totals.benh_nhan_tra / totals.tong_cong_chi_phi) * 100).toFixed(1) 
        : '0';
    const avgCostPerPatient = totals.tong_luot_bn > 0 
        ? Math.round(totals.tong_cong_chi_phi / totals.tong_luot_bn) 
        : 0;
    const drugExamShare = totals.tong_cong_chi_phi > 0 
        ? (((totals.tien_thuoc + totals.tien_xet_nghiem) / totals.tong_cong_chi_phi) * 100).toFixed(1) 
        : '0';

    return (
        <div className="space-y-3 sm:space-y-3.5">
            {/* Header section with fast navigation */}
            <div className="print:hidden flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2.5">
                        <CurrencyDollarIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        <span>Báo cáo Tổng hợp Chi phí theo Khoa phòng</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Bảng ma trận 13 nhóm chi phí viện phí phát sinh, cơ cấu nguồn thu BHYT và bệnh nhân cùng chi trả
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        to="/hospital-statistics/surgery"
                        className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition"
                    >
                        ← Phẫu Thuật - Thủ Thuật
                    </Link>
                    <Link
                        to="/hospital-statistics/bed-occupancy"
                        className="px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition"
                    >
                        Công Suất Giường →
                    </Link>
                </div>
            </div>

            {/* Print Header */}
            <PrintReportHeader 
                formCode="Biểu mẫu: 06/BC-CPKP"
                title="BÁO CÁO TỔNG HỢP CHI PHÍ KHÁM CHỮA BỆNH THEO KHOA PHÒNG"
                subtitle="Chi tiết 13 mục chi phí viện phí, bảo hiểm y tế chi trả và người bệnh thanh toán"
                fromDate={fromDate}
                toDate={toDate}
            />

            {/* Filter */}
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

            {/* 4 Executive Financial KPI Cards (gcv-ninhbinh his-kpi-card standard) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 print:hidden">
                {/* Card 1: Tổng Doanh Thu Viện Phí */}
                <div className="his-kpi-card border-l-4 border-l-purple-500 p-4.5 rounded-xl bg-white dark:bg-slate-800 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                            Tổng Viện Phí Toàn Viện
                        </span>
                        <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                            <CurrencyDollarIcon className="w-5 h-5" />
                        </span>
                    </div>
                    <div className="text-2xl font-black text-purple-700 dark:text-purple-300 font-mono tabular-nums mt-1">
                        {(totals.tong_cong_chi_phi / 1_000_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} <span className="text-xs font-normal text-slate-400">tỷ đ</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>{filteredItems.length} khoa phòng</span>
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">
                            Cân đối 100%
                        </span>
                    </div>
                </div>

                {/* Card 2: Cơ Cấu Nguồn Thanh Toán */}
                <div className="his-kpi-card border-l-4 border-l-blue-500 p-4.5 rounded-xl bg-white dark:bg-slate-800 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                            Cơ Cấu Thanh Toán
                        </span>
                        <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                            <SparklesIcon className="w-5 h-5" />
                        </span>
                    </div>
                    <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono tabular-nums mt-1">
                        {bhytRate}% <span className="text-xs font-normal text-slate-400">BHYT trả</span>
                    </div>
                    <div className="mt-2 space-y-1">
                        <div className="w-full bg-emerald-200 dark:bg-emerald-900/40 h-2 rounded-full overflow-hidden flex">
                            <div 
                                className="bg-blue-600 h-full" 
                                style={{ width: `${bhytRate}%` }}
                                title={`BHYT: ${fmtMoney(totals.bhyt_thanh_toan)} đ`}
                            ></div>
                            <div 
                                className="bg-emerald-500 h-full" 
                                style={{ width: `${bnRate}%` }}
                                title={`Bệnh nhân: ${fmtMoney(totals.benh_nhan_tra)} đ`}
                            ></div>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            <span className="text-blue-600 font-medium">BHYT: {(totals.bhyt_thanh_toan / 1_000_000_000).toFixed(2)} tỷ</span>
                            <span className="text-emerald-600 font-medium">BN: {(totals.benh_nhan_tra / 1_000_000_000).toFixed(2)} tỷ ({bnRate}%)</span>
                        </div>
                    </div>
                </div>

                {/* Card 3: Chi Phí Thuốc & Kỹ Thuật Chủ Lực */}
                <div className="his-kpi-card border-l-4 border-l-indigo-500 p-4.5 rounded-xl bg-white dark:bg-slate-800 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                            Thuốc & Xét Nghiệm
                        </span>
                        <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                            <BuildingOfficeIcon className="w-5 h-5" />
                        </span>
                    </div>
                    <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono tabular-nums mt-1">
                        {drugExamShare}% <span className="text-xs font-normal text-slate-400">tổng chi phí</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>Thuốc: <strong className="text-purple-600 font-mono">{(totals.tien_thuoc / 1_000_000_000).toFixed(1)} tỷ</strong></span>
                        <span>XN: <strong className="text-emerald-600 font-mono">{(totals.tien_xet_nghiem / 1_000_000_000).toFixed(1)} tỷ</strong></span>
                    </div>
                </div>

                {/* Card 4: Lượt Tiếp Nhận & Chi Phí Bình Quân */}
                <div className="his-kpi-card border-l-4 border-l-emerald-500 p-4.5 rounded-xl bg-white dark:bg-slate-800 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                            Người Bệnh & Suất Chi Phí
                        </span>
                        <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                            <UserGroupIcon className="w-5 h-5" />
                        </span>
                    </div>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-1">
                        {totals.tong_luot_bn.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-400">lượt BN</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>Bình quân: <strong className="text-emerald-600 dark:text-emerald-300 font-bold">{avgCostPerPatient.toLocaleString('vi-VN')}</strong> đ/lượt</span>
                        <span className="text-[10px] font-mono text-slate-400">KCB</span>
                    </div>
                </div>
            </div>

            {/* 2 BI Specialized Financial Charts (Recharts + Matrix) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-3.5 print:hidden">
                {/* Chart 1: Composed Chart (Bar + Line) for Revenue & BHYT % (2 cols) */}
                <div className="lg:col-span-2 his-kpi-card p-4 sm:p-4.5 rounded-xl bg-white dark:bg-slate-800 shadow-xs border border-slate-200/80 dark:border-slate-700">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                                <span>Tương Quan Doanh Thu & Tỷ Lệ Bao Phủ BHYT Theo Khoa</span>
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Cột xếp chồng: BHYT (xanh dương) & BN cùng trả (xanh ngọc) (Tr.đ) • Đường xu hướng cam: Tỷ lệ BHYT (%)
                            </p>
                        </div>
                        <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 px-2.5 py-1 rounded-lg self-start sm:self-auto border border-purple-200/60 dark:border-purple-800/60">
                            Biểu đồ kết hợp (Composed)
                        </span>
                    </div>

                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={barChartData} margin={{ top: 10, right: 25, left: -10, bottom: 25 }}>
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
                                    tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)} tỷ` : `${val} tr`}
                                />
                                <YAxis 
                                    yAxisId="right"
                                    orientation="right"
                                    domain={[0, 100]}
                                    tick={{ fontSize: 11, fill: '#D97706' }}
                                    tickFormatter={(val) => `${val}%`}
                                />
                                <Tooltip 
                                    formatter={(value: any, name: any) => {
                                        if (name === 'bhytRate') return [`${value}%`, 'Tỷ lệ BHYT chi trả'];
                                        if (name === 'bhyt_tr') return [`${Number(value).toLocaleString('vi-VN')} triệu đ`, 'BHYT Chi Trả'];
                                        if (name === 'bn_tr') return [`${Number(value).toLocaleString('vi-VN')} triệu đ`, 'Bệnh Nhân Cùng Trả'];
                                        return [value, name];
                                    }}
                                    labelFormatter={(label, payload) => {
                                        if (payload && payload.length > 0) {
                                            const item = payload[0].payload;
                                            return `${item.fullName} (${item.deptId}) - Tổng: ${item.total_tr.toLocaleString('vi-VN')} tr đ (BHYT: ${item.bhytRate}% • ${item.patients.toLocaleString('vi-VN')} lượt BN)`;
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
                                        if (value === 'bhyt_tr') return 'BHYT Chi Trả (Tr.đ)';
                                        if (value === 'bn_tr') return 'BN Trả (Tr.đ)';
                                        if (value === 'bhytRate') return 'Tỷ lệ BHYT (%)';
                                        return value;
                                    }}
                                />
                                <Bar yAxisId="left" dataKey="bhyt_tr" name="bhyt_tr" stackId="a" fill="#3B82F6" radius={[0, 0, 0, 0]} />
                                <Bar yAxisId="left" dataKey="bn_tr" name="bn_tr" stackId="a" fill="#10B981" radius={[4, 4, 0, 0]} />
                                <Line 
                                    yAxisId="right" 
                                    type="monotone" 
                                    dataKey="bhytRate" 
                                    name="bhytRate" 
                                    stroke="#F59E0B" 
                                    strokeWidth={2.5} 
                                    dot={{ r: 4, fill: '#F59E0B', strokeWidth: 2, stroke: '#FFFFFF' }} 
                                    activeDot={{ r: 6 }} 
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Quick ranking chips footer */}
                    <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Khoa dẫn đầu doanh thu:</span>
                        <div className="flex flex-wrap gap-2">
                            {barChartData.slice(0, 4).map((it, i) => (
                                <span key={it.deptId} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-700/50 text-[11px]">
                                    <strong className="text-purple-600 dark:text-purple-400">#{i + 1}</strong> {it.fullName}: <strong>{(it.total_tr / 1000).toFixed(2)} tỷ</strong> <span className="text-amber-600 font-medium">({it.bhytRate}% BHYT)</span>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Chart 2: Specialized Financial Structure Proportion Breakdown Matrix (1 col) */}
                <div className="his-kpi-card p-5 rounded-2xl bg-white dark:bg-slate-800 shadow-xs border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                <span>Cơ Cấu Chi Phí Toàn Viện</span>
                            </h3>
                            <span className="text-[11px] font-mono text-purple-700 dark:text-purple-300 font-bold bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded-md border border-purple-200/50">
                                8 nhóm viện phí
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                            Phân rã tỷ trọng và quy mô ngân sách 8 nhóm cấu thành tổng viện phí
                        </p>

                        {/* Structural Breakdown List */}
                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                            {[...donutChartData].sort((a, b) => b.value - a.value).map((item, idx) => {
                                const percent = totals.tong_cong_chi_phi > 0 
                                    ? ((item.value / totals.tong_cong_chi_phi) * 100).toFixed(1) 
                                    : '0';
                                const percentNum = parseFloat(percent);
                                const isTop = idx < 3;
                                return (
                                    <div key={item.code} className="p-2 rounded-xl bg-slate-50/80 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/60 hover:bg-slate-100/70 transition-colors">
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
                                                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }}></span>
                                                <span className={`font-semibold truncate ${isTop ? 'text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                                                    {item.name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 font-mono text-[11px] shrink-0">
                                                <span className="text-slate-500 dark:text-slate-400">
                                                    {item.value >= 1_000_000_000 
                                                        ? `${(item.value / 1_000_000_000).toFixed(2)} tỷ` 
                                                        : `${Math.round(item.value / 1_000_000).toLocaleString('vi-VN')} tr`}
                                                </span>
                                                <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                                                    percentNum >= 20 ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 font-black' :
                                                    percentNum >= 10 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                                                    'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                                }`}>
                                                    {percent}%
                                                </span>
                                            </div>
                                        </div>
                                        {/* Visual Progress Bar */}
                                        <div className="w-full bg-slate-200/70 dark:bg-slate-600/40 h-1.5 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full rounded-full transition-all duration-500" 
                                                style={{ width: `${percent}%`, backgroundColor: item.color }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bottom Summary Insight Banner */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-purple-50/50 dark:bg-purple-950/20 px-3 py-2 rounded-xl border border-purple-100 dark:border-purple-900/40">
                        <span className="text-[11px] font-medium text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                            <SparklesIcon className="w-4 h-4 text-purple-600 shrink-0" />
                            <span>Thuốc & XN: <strong>{drugExamShare}%</strong> tổng viện phí</span>
                        </span>
                        <span className="font-mono text-[11px] font-bold text-purple-700 dark:text-purple-300">
                            {(totals.tong_cong_chi_phi / 1_000_000_000).toFixed(2)} tỷ đ
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
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400'
                        }`}
                    >
                        Tất cả ({items.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedCategory('OUTPATIENT')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                            selectedCategory === 'OUTPATIENT'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'
                        }`}
                    >
                        <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                        <span>Khám Bệnh (Ngoại Trú) ({countOutpatient})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedCategory('INPATIENT')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                            selectedCategory === 'INPATIENT'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400'
                        }`}
                    >
                        <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                        <span>Khối Điều Trị Nội Trú ({countInpatient})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedCategory('OVER_1B')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                            selectedCategory === 'OVER_1B'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400'
                        }`}
                    >
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        <span>Doanh Thu &gt; 1 Tỷ ({countOver1B})</span>
                    </button>
                </div>

                <Link
                    to="/hospital-statistics/bed-occupancy"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition border border-blue-200/80 dark:border-blue-800/80 shadow-xs cursor-pointer"
                >
                    <BuildingOfficeIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Xem Báo Cáo Công Suất Giường Bệnh</span>
                    <span>→</span>
                </Link>
            </div>

            {/* Matrix Table (gcv-ninhbinh his-table standard) */}
            <div className="his-table-wrap relative max-h-[640px]">
                <table className="his-table w-full text-left text-xs whitespace-nowrap">
                    <thead>
                        <tr>
                            <th className="px-3 py-3.5 text-center w-12 sticky left-0 bg-[#edf4fa] dark:bg-slate-700 text-[#01579b] z-30 font-mono">STT</th>
                            <th 
                                className="px-3 py-3.5 min-w-[200px] sticky left-12 bg-[#edf4fa] dark:bg-slate-700 text-[#01579b] z-30 border-r border-[#cbd5e1] dark:border-slate-600 cursor-pointer hover:opacity-80 transition select-none"
                                onClick={() => handleSort('dept_name')}
                            >
                                <div className="flex items-center gap-1">
                                    <span>Khoa Phòng Lâm Sàng</span>
                                    {sortField === 'dept_name' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th 
                                className="px-3 py-3.5 text-right cursor-pointer hover:opacity-80 transition select-none"
                                onClick={() => handleSort('tong_luot_bn')}
                            >
                                <div className="flex items-center justify-end gap-1">
                                    <span>Lượt BN</span>
                                    {sortField === 'tong_luot_bn' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th 
                                className="px-3 py-3.5 text-right cursor-pointer hover:opacity-80 transition select-none"
                                onClick={() => handleSort('chi_phi_tb')}
                            >
                                <div className="flex items-center justify-end gap-1 text-purple-700 dark:text-purple-300">
                                    <span>Bình Quân/Lượt</span>
                                    {sortField === 'chi_phi_tb' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th className="px-3 py-3.5 text-right cursor-pointer hover:opacity-80 select-none" onClick={() => handleSort('tien_kham')}>Tiền Khám</th>
                            <th className="px-3 py-3.5 text-right cursor-pointer hover:opacity-80 select-none" onClick={() => handleSort('tien_giuong')}>Tiền Giường</th>
                            <th className="px-3 py-3.5 text-right cursor-pointer hover:opacity-80 select-none" onClick={() => handleSort('tien_xet_nghiem')}>Xét Nghiệm</th>
                            <th className="px-3 py-3.5 text-right cursor-pointer hover:opacity-80 select-none" onClick={() => handleSort('tien_cdha')}>CĐHA</th>
                            <th className="px-3 py-3.5 text-right cursor-pointer hover:opacity-80 select-none" onClick={() => handleSort('tien_tdcn')}>TDCN</th>
                            <th className="px-3 py-3.5 text-right cursor-pointer hover:opacity-80 select-none" onClick={() => handleSort('tien_pttt')}>PTTT</th>
                            <th className="px-3 py-3.5 text-right cursor-pointer hover:opacity-80 select-none" onClick={() => handleSort('tien_thuoc')}>Tiền Thuốc</th>
                            <th className="px-3 py-3.5 text-right cursor-pointer hover:opacity-80 select-none" onClick={() => handleSort('tien_vtyt')}>VTYT</th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:opacity-80 transition min-w-[160px] select-none"
                                onClick={() => handleSort('tong_cong_chi_phi')}
                            >
                                <div className="flex items-center justify-end gap-1 font-black text-purple-700 dark:text-purple-300">
                                    <span>Tổng Chi Phí</span>
                                    {sortField === 'tong_cong_chi_phi' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:opacity-80 transition min-w-[140px] select-none"
                                onClick={() => handleSort('bhyt_thanh_toan')}
                            >
                                <div className="flex items-center justify-end gap-1 font-bold text-blue-600 dark:text-blue-400">
                                    <span>BHYT Trả</span>
                                    {sortField === 'bhyt_thanh_toan' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:opacity-80 transition min-w-[130px] select-none"
                                onClick={() => handleSort('benh_nhan_tra')}
                            >
                                <div className="flex items-center justify-end gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                                    <span>BN Trả</span>
                                    {sortField === 'benh_nhan_tra' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.length === 0 ? (
                            <TableEmptyState
                                colSpan={15}
                                title="Không tìm thấy dữ liệu chi phí"
                                message="Không có khoa phòng nào phát sinh chi phí theo tiêu chí lọc hiện tại."
                                onResetFilter={() => {
                                    setSearchTerm('');
                                    setSelectedCategory('ALL');
                                    setHideEmpty(false);
                                }}
                            />
                        ) : (
                            filteredItems.map((it, idx) => {
                                const cost = Number(it.tong_cong_chi_phi || 0);
                                const bnCount = Number(it.tong_luot_bn || 0);
                                const bhyt = Number(it.bhyt_thanh_toan || 0);
                                const bnPay = Number(it.benh_nhan_tra || 0);
                                
                                const avgCost = bnCount > 0 ? Math.round(cost / bnCount) : 0;
                                const itemBhytRate = cost > 0 ? ((bhyt / cost) * 100).toFixed(1) : '0';
                                const pctMax = ((cost / maxCost) * 100).toFixed(0);

                                // Medal logic
                                const medal = it.dept_id === top1Id ? '🥇' : it.dept_id === top2Id ? '🥈' : it.dept_id === top3Id ? '🥉' : null;

                                return (
                                    <tr key={it.dept_id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition">
                                        <td className="px-3 py-2.5 text-center font-mono text-xs sticky left-0 bg-inherit group-hover:bg-[#f0f7ff] dark:group-hover:bg-slate-700 z-10 font-semibold">
                                            {medal ? (
                                                <span className="text-base" title={`Hạng ${medal === '🥇' ? 1 : medal === '🥈' ? 2 : 3} doanh thu toàn viện`}>
                                                    {medal}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">{idx + 1}</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2.5 font-bold text-slate-800 dark:text-slate-100 sticky left-12 bg-inherit group-hover:bg-[#f0f7ff] dark:group-hover:bg-slate-700 z-10 border-r border-[#cbd5e1] dark:border-slate-700">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span>{it.dept_name}</span>
                                                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-600">
                                                        {it.dept_id}
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-slate-400 dark:text-slate-500 font-normal mt-0.5">
                                                    BQ: <strong className="text-purple-600 dark:text-purple-400 font-mono">{fmtMoney(avgCost)} đ/lượt</strong>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200 font-mono tabular-nums">
                                            {bnCount.toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-3 py-2.5 text-right text-purple-700 dark:text-purple-300 font-mono tabular-nums font-semibold">
                                            {fmtMoney(avgCost)} đ
                                        </td>
                                        <td className="px-3 py-2.5 text-right text-slate-600 dark:text-slate-300 font-mono tabular-nums">{fmtMoney(it.tien_kham)}</td>
                                        <td className="px-3 py-2.5 text-right text-slate-600 dark:text-slate-300 font-mono tabular-nums">{fmtMoney(it.tien_giuong)}</td>
                                        <td className="px-3 py-2.5 text-right text-slate-600 dark:text-slate-300 font-mono tabular-nums">{fmtMoney(it.tien_xet_nghiem)}</td>
                                        <td className="px-3 py-2.5 text-right text-slate-600 dark:text-slate-300 font-mono tabular-nums">{fmtMoney(it.tien_cdha)}</td>
                                        <td className="px-3 py-2.5 text-right text-slate-600 dark:text-slate-300 font-mono tabular-nums">{fmtMoney(it.tien_tdcn)}</td>
                                        <td className="px-3 py-2.5 text-right text-slate-600 dark:text-slate-300 font-mono tabular-nums">{fmtMoney(it.tien_pttt)}</td>
                                        <td className="px-3 py-2.5 text-right text-slate-600 dark:text-slate-300 font-mono tabular-nums font-medium">{fmtMoney(it.tien_thuoc)}</td>
                                        <td className="px-3 py-2.5 text-right text-slate-600 dark:text-slate-300 font-mono tabular-nums">{fmtMoney(it.tien_vtyt)}</td>
                                        <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                                            <div className="font-black text-purple-700 dark:text-purple-300 text-sm">
                                                {fmtMoney(cost)}
                                            </div>
                                            {cost > 0 && (
                                                <div className="w-24 ml-auto h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-300"
                                                        style={{ width: `${pctMax}%` }}
                                                    ></div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                                            <div className="flex flex-col items-end">
                                                <span className="font-bold text-blue-600 dark:text-blue-400">{fmtMoney(bhyt)}</span>
                                                <span className="text-[10px] text-blue-500 font-normal">({itemBhytRate}%)</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                                            {fmtMoney(bnPay)}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                    {/* Sticky Footer Total Row */}
                    <tfoot className="bg-slate-200 dark:bg-slate-700 font-bold text-slate-900 dark:text-white border-t-2 border-slate-400 dark:border-slate-500 sticky bottom-0 z-30 shadow-md">
                        <tr>
                            <td colSpan={2} className="px-3 py-3 text-center uppercase tracking-wider sticky left-0 bg-slate-200 dark:bg-slate-700 z-40 border-r border-slate-300 dark:border-slate-600 text-xs">
                                TỔNG CỘNG ({filteredItems.length} KHOA)
                            </td>
                            <td className="px-3 py-3 text-right font-mono tabular-nums">{totals.tong_luot_bn.toLocaleString('vi-VN')}</td>
                            <td className="px-3 py-3 text-right font-mono tabular-nums text-purple-700 dark:text-purple-300">{fmtMoney(avgCostPerPatient)} đ</td>
                            <td className="px-3 py-3 text-right font-mono tabular-nums">{fmtMoney(totals.tien_kham)}</td>
                            <td className="px-3 py-3 text-right font-mono tabular-nums">{fmtMoney(totals.tien_giuong)}</td>
                            <td className="px-3 py-3 text-right font-mono tabular-nums">{fmtMoney(totals.tien_xet_nghiem)}</td>
                            <td className="px-3 py-3 text-right font-mono tabular-nums">{fmtMoney(totals.tien_cdha)}</td>
                            <td className="px-3 py-3 text-right font-mono tabular-nums">{fmtMoney(totals.tien_tdcn)}</td>
                            <td className="px-3 py-3 text-right font-mono tabular-nums">{fmtMoney(totals.tien_pttt)}</td>
                            <td className="px-3 py-3 text-right font-mono tabular-nums">{fmtMoney(totals.tien_thuoc)}</td>
                            <td className="px-3 py-3 text-right font-mono tabular-nums">{fmtMoney(totals.tien_vtyt)}</td>
                            <td className="px-4 py-3 text-right font-black text-purple-700 dark:text-purple-300 text-sm font-mono tabular-nums">
                                {fmtMoney(totals.tong_cong_chi_phi)}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-blue-700 dark:text-blue-300 text-sm font-mono tabular-nums">
                                <div className="flex flex-col items-end">
                                    <span>{fmtMoney(totals.bhyt_thanh_toan)}</span>
                                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">({bhytRate}%)</span>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-emerald-700 dark:text-emerald-300 text-sm font-mono tabular-nums">
                                {fmtMoney(totals.benh_nhan_tra)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <PrintReportFooter />
        </div>
    );
};
