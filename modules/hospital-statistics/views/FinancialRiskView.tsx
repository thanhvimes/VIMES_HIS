// ==================== BHYT & FINANCIAL RISK MONITOR VIEW ====================
// File: modules/hospital-statistics/views/FinancialRiskView.tsx
// Giám sát rủi ro cơ cấu chi phí BHYT và quản trị bệnh nhân nội trú âm tạm ứng

import React, { useState, useEffect, useMemo } from 'react';
import { 
    CommonFilter, 
    PrintReportHeader, 
    PrintReportFooter, 
    exportTableToExcel, 
    formatLocalDate, 
    getStartOfMonthLocalDate,
    TableEmptyState 
} from '../components/CommonFilter';
import { statisticsService } from '../services/statisticsService';
import { BhytFinancialRiskData, DepositDeficitItem } from '../types';
import { 
    ResponsiveContainer, 
    PieChart, 
    Pie, 
    Cell, 
    Tooltip, 
    Legend 
} from 'recharts';
import { 
    CurrencyDollarIcon, 
    UserGroupIcon, 
    MagnifyingGlassIcon,
    CheckIcon
} from '../../../components/Icons';

// Local SVG icons to avoid external import dependency
const AlertCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
);

const ArrowUpIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
);

const ArrowDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);

const ClipboardIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
    </svg>
);

// Định nghĩa màu sắc cố định chuẩn hóa cho từng nhóm chi phí BHYT
export const BHYT_COLOR_MAP = {
    thuoc: '#2563EB',      // Blue
    vtyt: '#06B6D4',       // Cyan
    giuong: '#F59E0B',     // Amber
    xet_nghiem: '#8B5CF6', // Purple
    cdha_tdcn: '#EC4899',  // Pink
    pttt: '#10B981',       // Emerald
    kham: '#64748B'        // Slate
};

// Định dạng tiền tệ VNĐ chuẩn: Không có số lẻ thập phân, phân cách hàng nghìn bằng dấu chấm
export const formatCurrencyVND = (value: number | string | undefined | null): string => {
    const num = Math.round(Number(value || 0));
    return `${num.toLocaleString('vi-VN')} đ`;
};

type SortField = 'deficit_amount' | 'total_cost' | 'deposit_amount' | 'admit_date' | 'docno' | 'patient_name';
type SortOrder = 'asc' | 'desc';

export const FinancialRiskView: React.FC = () => {
    const now = new Date();
    const [fromDate, setFromDate] = useState(`${getStartOfMonthLocalDate(now)} 00:00:00`);
    const [toDate, setToDate] = useState(`${formatLocalDate(now)} 23:59:59`);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<BhytFinancialRiskData | null>(null);

    // Filter states for deficit table
    const [searchTerm, setSearchTerm] = useState('');
    const [riskFilter, setRiskFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'WARNING'>('ALL');
    const [sortField, setSortField] = useState<SortField>('deficit_amount');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [copiedDocno, setCopiedDocno] = useState<number | null>(null);

    const fetchData = async (overrideFrom?: string, overrideTo?: string) => {
        const from = overrideFrom || fromDate;
        const to = overrideTo || toDate;
        setLoading(true);
        try {
            const res = await statisticsService.getBhytFinancialRiskStatistics(from, to);
            setData(res);
        } catch (error) {
            console.error('Error fetching financial risk data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const summary = data?.summary;
    const breakdown = data?.cost_breakdown;
    const deficits = data?.deposit_deficits || [];

    // Copy docno helper
    const handleCopyDocno = (docno: number) => {
        navigator.clipboard.writeText(String(docno));
        setCopiedDocno(docno);
        setTimeout(() => setCopiedDocno(null), 1500);
    };

    // Toggle sort order
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    // Filtered & Sorted Deficit list
    const filteredDeficits = useMemo(() => {
        let list = [...deficits];
        if (riskFilter !== 'ALL') {
            list = list.filter(it => it.risk_level === riskFilter);
        }
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase().trim();
            list = list.filter(it => 
                (it.patient_name && it.patient_name.toLowerCase().includes(term)) ||
                (it.docno && String(it.docno).includes(term)) ||
                (it.dept_name && it.dept_name.toLowerCase().includes(term))
            );
        }

        // Sorting
        list.sort((a, b) => {
            let valA: any = a[sortField];
            let valB: any = b[sortField];

            if (sortField === 'deficit_amount' || sortField === 'total_cost' || sortField === 'deposit_amount' || sortField === 'docno') {
                valA = Number(valA || 0);
                valB = Number(valB || 0);
            } else if (sortField === 'admit_date') {
                valA = valA ? new Date(valA).getTime() : 0;
                valB = valB ? new Date(valB).getTime() : 0;
            } else {
                valA = String(valA || '').toLowerCase();
                valB = String(valB || '').toLowerCase();
            }

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return list;
    }, [deficits, riskFilter, searchTerm, sortField, sortOrder]);

    // Pie chart items for BHYT cost structure với màu sắc cố định
    const pieData = useMemo(() => {
        if (!breakdown || !summary) return [];
        const total = summary.bhyt_chi_tra || 1;

        return [
            { 
                name: 'Tiền Thuốc', 
                value: breakdown.tien_thuoc, 
                percent: breakdown.ty_le_thuoc, 
                color: BHYT_COLOR_MAP.thuoc 
            },
            { 
                name: 'Vật Tư Y Tế', 
                value: breakdown.tien_vtyt, 
                percent: breakdown.ty_le_vtyt, 
                color: BHYT_COLOR_MAP.vtyt 
            },
            { 
                name: 'Tiền Giường', 
                value: breakdown.tien_giuong, 
                percent: breakdown.ty_le_giuong, 
                color: BHYT_COLOR_MAP.giuong 
            },
            { 
                name: 'Xét Nghiệm', 
                value: breakdown.tien_xet_nghiem, 
                percent: Number(((breakdown.tien_xet_nghiem / total) * 100).toFixed(1)), 
                color: BHYT_COLOR_MAP.xet_nghiem 
            },
            { 
                name: 'CĐHA - TDCN', 
                value: breakdown.tien_cdha_tdcn, 
                percent: Number(((breakdown.tien_cdha_tdcn / total) * 100).toFixed(1)), 
                color: BHYT_COLOR_MAP.cdha_tdcn 
            },
            { 
                name: 'Phẫu Thuật TT', 
                value: breakdown.tien_pttt, 
                percent: Number(((breakdown.tien_pttt / total) * 100).toFixed(1)), 
                color: BHYT_COLOR_MAP.pttt 
            },
            { 
                name: 'Tiền Khám', 
                value: breakdown.tien_kham, 
                percent: Number(((breakdown.tien_kham / total) * 100).toFixed(1)), 
                color: BHYT_COLOR_MAP.kham 
            }
        ].filter(it => it.value > 0);
    }, [breakdown, summary]);

    const totalDeficitAmount = useMemo(() => {
        return deficits.reduce((acc, it) => acc + Number(it.deficit_amount || 0), 0);
    }, [deficits]);

    const handleExportExcel = () => {
        const rows = filteredDeficits.map(it => ({
            'Mã Bệnh Án': it.docno,
            'Họ Tên Bệnh Nhân': it.patient_name,
            'Khoa Điều Trị': it.dept_name,
            'Đối Tượng': it.object_name,
            'Ngày Vào Viện': it.admit_date ? it.admit_date.split('T')[0] : '',
            'Chi Phí BN Trả': Math.round(Number(it.total_cost || 0)),
            'Đã Tạm Ứng': Math.round(Number(it.deposit_amount || 0)),
            'Số Tiền Thiếu': Math.round(Number(it.deficit_amount || 0)),
            'Mức Độ Rủi Ro': it.risk_level === 'CRITICAL' ? 'BÁO ĐỘNG ĐỎ' : it.risk_level === 'HIGH' ? 'NGUY CƠ CAO' : 'CẢNH BÁO'
        }));
        exportTableToExcel(rows, `Danh_Sach_Am_Tam_Ung_${formatLocalDate(new Date())}`, 'Âm Tạm Ứng');
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="w-full space-y-4">
            {/* PRINT HEADER */}
            <PrintReportHeader 
                title="BÁO CÁO GIÁM SÁT RỦI RO CHI PHÍ BHYT & DÒNG TIỀN TẠM ỨNG"
                subtitle="Tổng hợp chi phí quỹ BHYT và danh sách bệnh nhân nội trú âm tạm ứng viện phí"
                fromDate={fromDate}
                toDate={toDate}
                formCode="BM-RISK-01/TCKT"
                departmentName="PHÒNG TÀI CHÍNH KẾ TOÁN"
            />

            {/* SCREEN CONTROLS */}
            <div className="print:hidden">
                <CommonFilter 
                    fromDate={fromDate}
                    toDate={toDate}
                    onFromDateChange={setFromDate}
                    onToDateChange={setToDate}
                    onRefresh={() => fetchData()}
                    loading={loading}
                    onExportExcel={handleExportExcel}
                    onPrint={handlePrint}
                />
            </div>

            {/* TOP 4 FINANCIAL KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Tổng chi phí phát sinh */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            Tổng Chi Phí KCB (Phát Sinh)
                        </span>
                        <span className="p-1.5 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">
                            <CurrencyDollarIcon className="w-4 h-4" />
                        </span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                        {loading ? '...' : formatCurrencyVND(summary?.tong_chi_phi)}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Tổng giá trị viện phí phát sinh trong kỳ báo cáo
                    </p>
                </div>

                {/* 2. Quỹ BHYT chi trả */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            Quỹ BHYT Chi Trả
                        </span>
                        <span className="px-2 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 rounded-full">
                            {summary?.ty_le_bhyt || 0}%
                        </span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                        {loading ? '...' : formatCurrencyVND(summary?.bhyt_chi_tra)}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Chiếm {summary?.ty_le_bhyt || 0}% trên tổng chi phí KCB
                    </p>
                </div>

                {/* 3. Người bệnh cùng chi trả */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            Người Bệnh Chi Trả
                        </span>
                        <span className="p-1.5 bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-lg">
                            <UserGroupIcon className="w-4 h-4" />
                        </span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                        {loading ? '...' : formatCurrencyVND(summary?.benh_nhan_cung_chi_tra)}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Đồng chi trả BHYT và dịch vụ tự nguyện
                    </p>
                </div>

                {/* 4. Cảnh báo âm tạm ứng nội trú */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide flex items-center gap-1">
                            <AlertCircleIcon className="w-3.5 h-3.5" />
                            Cảnh Báo Âm Tạm Ứng
                        </span>
                        <span className="px-2 py-0.5 text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 rounded-full">
                            {deficits.length} BN
                        </span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
                        {loading ? '...' : formatCurrencyVND(totalDeficitAmount)}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Tổng số tiền chi phí nội trú vượt tạm ứng cần đôn đốc
                    </p>
                </div>
            </div>

            {/* PHẦN 1: PHÂN TÍCH CƠ CẤU CHI PHÍ BHYT (CHỐNG VƯỢT QUỸ) */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 dark:border-slate-700/60 gap-2">
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide flex items-center gap-2">
                            <span>📊</span> Cơ Cấu Quỹ Khám Chữa Bệnh BHYT Chi Trả
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Giám sát tỷ trọng tiền thuốc, VTYT, giường và cận lâm sàng nhằm kiểm soát vượt trần quỹ BHYT
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-500">Ngưỡng cảnh báo:</span>
                        <span className="px-2 py-0.5 text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded">
                            Thuốc &gt; 40%
                        </span>
                        <span className="px-2 py-0.5 text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 rounded">
                            CLS &gt; 25%
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center mt-4">
                    {/* Donut Chart */}
                    <div className="lg:col-span-5 h-64 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={85}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    formatter={(value: any) => [formatCurrencyVND(value), 'Chi Phí']}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Progress Breakdown Bars với màu sắc và tên danh mục khớp 100% */}
                    <div className="lg:col-span-7 space-y-3">
                        {/* 1. Tiền thuốc */}
                        <div>
                            <div className="flex justify-between text-xs font-semibold mb-1">
                                <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BHYT_COLOR_MAP.thuoc }}></span>
                                    1. Tiền Thuốc BHYT: {formatCurrencyVND(breakdown?.tien_thuoc)}
                                </span>
                                <span className={`font-bold ${(breakdown?.ty_le_thuoc || 0) > 40 ? 'text-rose-600' : 'text-slate-800 dark:text-slate-100'}`}>
                                    {breakdown?.ty_le_thuoc || 0}% {(breakdown?.ty_le_thuoc || 0) > 40 ? '⚠️ (Vượt ngưỡng 40%)' : ''}
                                </span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-500 ${(breakdown?.ty_le_thuoc || 0) > 40 ? 'bg-rose-500' : 'bg-blue-600'}`} 
                                    style={{ width: `${Math.min(100, breakdown?.ty_le_thuoc || 0)}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* 2. Tiền VTYT */}
                        <div>
                            <div className="flex justify-between text-xs font-semibold mb-1">
                                <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BHYT_COLOR_MAP.vtyt }}></span>
                                    2. Vật Tư Y Tế (VTYT): {formatCurrencyVND(breakdown?.tien_vtyt)}
                                </span>
                                <span className="text-slate-800 dark:text-slate-100 font-bold">{breakdown?.ty_le_vtyt || 0}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ backgroundColor: BHYT_COLOR_MAP.vtyt, width: `${Math.min(100, breakdown?.ty_le_vtyt || 0)}%` }}></div>
                            </div>
                        </div>

                        {/* 3. Tiền Giường */}
                        <div>
                            <div className="flex justify-between text-xs font-semibold mb-1">
                                <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BHYT_COLOR_MAP.giuong }}></span>
                                    3. Tiền Giường Nội Trú: {formatCurrencyVND(breakdown?.tien_giuong)}
                                </span>
                                <span className="text-slate-800 dark:text-slate-100 font-bold">{breakdown?.ty_le_giuong || 0}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ backgroundColor: BHYT_COLOR_MAP.giuong, width: `${Math.min(100, breakdown?.ty_le_giuong || 0)}%` }}></div>
                            </div>
                        </div>

                        {/* 4. Xét nghiệm */}
                        <div>
                            <div className="flex justify-between text-xs font-semibold mb-1">
                                <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BHYT_COLOR_MAP.xet_nghiem }}></span>
                                    4. Xét Nghiệm: {formatCurrencyVND(breakdown?.tien_xet_nghiem)}
                                </span>
                                <span className="text-slate-800 dark:text-slate-100 font-bold">
                                    {summary?.bhyt_chi_tra ? Number(((Number(breakdown?.tien_xet_nghiem || 0) / summary.bhyt_chi_tra) * 100).toFixed(1)) : 0}%
                                </span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                    className="h-full rounded-full" 
                                    style={{ backgroundColor: BHYT_COLOR_MAP.xet_nghiem, width: `${Math.min(100, summary?.bhyt_chi_tra ? (Number(breakdown?.tien_xet_nghiem || 0) / summary.bhyt_chi_tra) * 100 : 0)}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* 5. CĐHA - TDCN */}
                        <div>
                            <div className="flex justify-between text-xs font-semibold mb-1">
                                <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BHYT_COLOR_MAP.cdha_tdcn }}></span>
                                    5. CĐHA - TDCN: {formatCurrencyVND(breakdown?.tien_cdha_tdcn)}
                                </span>
                                <span className="text-slate-800 dark:text-slate-100 font-bold">
                                    {summary?.bhyt_chi_tra ? Number(((Number(breakdown?.tien_cdha_tdcn || 0) / summary.bhyt_chi_tra) * 100).toFixed(1)) : 0}%
                                </span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                    className="h-full rounded-full" 
                                    style={{ backgroundColor: BHYT_COLOR_MAP.cdha_tdcn, width: `${Math.min(100, summary?.bhyt_chi_tra ? (Number(breakdown?.tien_cdha_tdcn || 0) / summary.bhyt_chi_tra) * 100 : 0)}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* 6. Phẫu thuật - thủ thuật */}
                        <div>
                            <div className="flex justify-between text-xs font-semibold mb-1">
                                <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BHYT_COLOR_MAP.pttt }}></span>
                                    6. Phẫu Thuật - Thủ Thuật: {formatCurrencyVND(breakdown?.tien_pttt)}
                                </span>
                                <span className="text-slate-800 dark:text-slate-100 font-bold">
                                    {summary?.bhyt_chi_tra ? Number(((Number(breakdown?.tien_pttt || 0) / summary.bhyt_chi_tra) * 100).toFixed(1)) : 0}%
                                </span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ backgroundColor: BHYT_COLOR_MAP.pttt, width: `${Math.min(100, summary?.bhyt_chi_tra ? (Number(breakdown?.tien_pttt || 0) / summary.bhyt_chi_tra) * 100 : 0)}%` }}></div>
                            </div>
                        </div>

                        {/* Tóm tắt Cận Lâm Sàng chung (XN + CĐHA) */}
                        <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700/60">
                            <span>🔍 Tổng Cận Lâm Sàng (XN + CĐHA + TDCN): <strong>{formatCurrencyVND((breakdown?.tien_xet_nghiem || 0) + (breakdown?.tien_cdha_tdcn || 0))}</strong></span>
                            <span className={`font-semibold ${(breakdown?.ty_le_cls || 0) > 25 ? 'text-amber-600' : 'text-slate-600 dark:text-slate-300'}`}>
                                Tỷ trọng CLS: {breakdown?.ty_le_cls || 0}% {(breakdown?.ty_le_cls || 0) > 25 ? '⚠️ (Cận ngưỡng 25%)' : ''}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* PHẦN 2: DANH SÁCH BỆNH NHÂN NỘI TRÚ ÂM TẠM ỨNG VIỆN PHÍ */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-4 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-3 border-b border-slate-100 dark:border-slate-700/60 gap-3">
                    <div>
                        <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide flex items-center gap-2">
                            <AlertCircleIcon className="w-4 h-4" />
                            Bệnh Nhân Nội Trú Âm Tiền Tạm Ứng (Cần Thu Thêm)
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Danh sách bệnh nhân đang nằm viện đợt hiện tại có tổng chi phí phát sinh lớn hơn số tiền tạm ứng
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Risk filter tabs */}
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl text-xs">
                            <button
                                type="button"
                                onClick={() => setRiskFilter('ALL')}
                                className={`px-2.5 py-1 rounded-lg font-semibold transition ${riskFilter === 'ALL' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs' : 'text-slate-500'}`}
                            >
                                Tất cả ({deficits.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setRiskFilter('CRITICAL')}
                                className={`px-2.5 py-1 rounded-lg font-semibold transition ${riskFilter === 'CRITICAL' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-600'}`}
                            >
                                &gt;= 10 Triệu ({deficits.filter(d => d.risk_level === 'CRITICAL').length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setRiskFilter('HIGH')}
                                className={`px-2.5 py-1 rounded-lg font-semibold transition ${riskFilter === 'HIGH' ? 'bg-amber-500 text-white shadow-xs' : 'text-amber-600'}`}
                            >
                                5 - 10 Triệu ({deficits.filter(d => d.risk_level === 'HIGH').length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setRiskFilter('WARNING')}
                                className={`px-2.5 py-1 rounded-lg font-semibold transition ${riskFilter === 'WARNING' ? 'bg-yellow-500 text-white shadow-xs' : 'text-yellow-600'}`}
                            >
                                &lt; 5 Triệu ({deficits.filter(d => d.risk_level === 'WARNING').length})
                            </button>
                        </div>

                        {/* Search input */}
                        <div className="relative">
                            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Tìm tên BN, mã BA, khoa..."
                                className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto mt-3">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700 select-none">
                                <th className="py-2.5 px-3 w-10 text-center">STT</th>
                                <th 
                                    className="py-2.5 px-3 cursor-pointer hover:text-blue-600 transition"
                                    onClick={() => handleSort('docno')}
                                >
                                    <div className="flex items-center gap-1">
                                        Mã Bệnh Án
                                        {sortField === 'docno' && (sortOrder === 'asc' ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />)}
                                    </div>
                                </th>
                                <th 
                                    className="py-2.5 px-3 cursor-pointer hover:text-blue-600 transition"
                                    onClick={() => handleSort('patient_name')}
                                >
                                    <div className="flex items-center gap-1">
                                        Họ và Tên Bệnh Nhân
                                        {sortField === 'patient_name' && (sortOrder === 'asc' ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />)}
                                    </div>
                                </th>
                                <th className="py-2.5 px-3">Khoa Điều Trị</th>
                                <th className="py-2.5 px-3">Đối Tượng</th>
                                <th 
                                    className="py-2.5 px-3 cursor-pointer hover:text-blue-600 transition"
                                    onClick={() => handleSort('admit_date')}
                                >
                                    <div className="flex items-center gap-1">
                                        Ngày Vào Viện
                                        {sortField === 'admit_date' && (sortOrder === 'asc' ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />)}
                                    </div>
                                </th>
                                <th 
                                    className="py-2.5 px-3 text-right cursor-pointer hover:text-blue-600 transition"
                                    onClick={() => handleSort('total_cost')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        Chi Phí BN Trả
                                        {sortField === 'total_cost' && (sortOrder === 'asc' ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />)}
                                    </div>
                                </th>
                                <th 
                                    className="py-2.5 px-3 text-right cursor-pointer hover:text-blue-600 transition"
                                    onClick={() => handleSort('deposit_amount')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        Đã Tạm Ứng
                                        {sortField === 'deposit_amount' && (sortOrder === 'asc' ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />)}
                                    </div>
                                </th>
                                <th 
                                    className="py-2.5 px-3 text-right cursor-pointer hover:text-rose-600 transition"
                                    onClick={() => handleSort('deficit_amount')}
                                >
                                    <div className="flex items-center justify-end gap-1 text-rose-600 dark:text-rose-400">
                                        Số Tiền Thiếu (Cần Thu)
                                        {sortField === 'deficit_amount' && (sortOrder === 'asc' ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />)}
                                    </div>
                                </th>
                                <th className="py-2.5 px-3 text-center">Mức Rủi Ro</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={10} className="py-8 text-center text-slate-400">
                                        Đang quét số liệu chi phí và tạm ứng bệnh nhân...
                                    </td>
                                </tr>
                            ) : filteredDeficits.length === 0 ? (
                                <TableEmptyState 
                                    colSpan={10} 
                                    title="Không có bệnh nhân âm tạm ứng theo bộ lọc"
                                    message="Tất cả bệnh nhân đang điều trị đã nộp tạm ứng đầy đủ hoặc nằm ngoài ngưỡng rủi ro đã chọn."
                                />
                            ) : (
                                filteredDeficits.map((it, idx) => {
                                    const isCritical = it.risk_level === 'CRITICAL';
                                    const isHigh = it.risk_level === 'HIGH';
                                    const isCopied = copiedDocno === it.docno;

                                    return (
                                        <tr key={it.docno} className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition ${isCritical ? 'bg-rose-50/30 dark:bg-rose-950/20' : ''}`}>
                                            <td className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</td>
                                            <td className="py-2.5 px-3 font-mono font-semibold text-blue-600 dark:text-blue-400">
                                                <div className="flex items-center gap-1.5">
                                                    <span>{it.docno}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopyDocno(it.docno)}
                                                        title="Sao chép mã bệnh án"
                                                        className="text-slate-400 hover:text-blue-600 p-0.5 rounded transition"
                                                    >
                                                        {isCopied ? <CheckIcon className="w-3.5 h-3.5 text-emerald-600" /> : <ClipboardIcon className="w-3.5 h-3.5" />}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">{it.patient_name}</td>
                                            <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{it.dept_name}</td>
                                            <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">{it.object_name}</td>
                                            <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                                                {it.admit_date ? it.admit_date.split('T')[0] : '-'}
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-medium text-slate-700 dark:text-slate-300">
                                                {formatCurrencyVND(it.total_cost)}
                                            </td>
                                            <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                                                {formatCurrencyVND(it.deposit_amount)}
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-black text-rose-600 dark:text-rose-400">
                                                {formatCurrencyVND(it.deficit_amount)}
                                            </td>
                                            <td className="py-2.5 px-3 text-center">
                                                {isCritical ? (
                                                    <span className="px-2 py-0.5 text-[11px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 rounded-full animate-pulse">
                                                        BÁO ĐỘNG ĐỎ
                                                    </span>
                                                ) : isHigh ? (
                                                    <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 rounded-full">
                                                        NGUY CƠ CAO
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 text-[11px] font-medium bg-yellow-50 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 rounded-full">
                                                        CẢNH BÁO
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PRINT FOOTER */}
            <PrintReportFooter />
        </div>
    );
};
