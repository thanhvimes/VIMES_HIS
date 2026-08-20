// ==================== COMMON FILTER & EXPORT BAR ====================
// File: modules/hospital-statistics/components/CommonFilter.tsx

import React from 'react';
import { ArrowPathIcon, MagnifyingGlassIcon } from '../../../components/Icons';
import * as XLSX from 'xlsx';

export interface CommonFilterProps {
    fromDate: string;
    toDate: string;
    onFromDateChange: (val: string) => void;
    onToDateChange: (val: string) => void;
    onRefresh: () => void;
    loading?: boolean;
    onExportExcel?: () => void;
    onPrint?: () => void;
    searchTerm?: string;
    onSearchChange?: (val: string) => void;
    searchPlaceholder?: string;
    hideEmpty?: boolean;
    onHideEmptyChange?: (val: boolean) => void;
    totalCount?: number;
    filteredCount?: number;
}

export const formatLocalDate = (d: Date = new Date()): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const getStartOfMonthLocalDate = (d: Date = new Date()): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
};

export type DatePreset = 'today' | 'yesterday' | 'last_7_days' | 'this_month' | 'last_month' | 'this_quarter' | 'this_year';

const PRESET_OPTIONS: Array<{ key: DatePreset; label: string }> = [
    { key: 'today', label: 'Hôm nay' },
    { key: 'yesterday', label: 'Hôm qua' },
    { key: 'last_7_days', label: '7 ngày qua' },
    { key: 'this_month', label: 'Tháng này' },
    { key: 'last_month', label: 'Tháng trước' },
    { key: 'this_quarter', label: 'Quý này' },
    { key: 'this_year', label: 'Năm nay' },
];

export const CommonFilter: React.FC<CommonFilterProps> = ({
    fromDate,
    toDate,
    onFromDateChange,
    onToDateChange,
    onRefresh,
    loading = false,
    onExportExcel,
    onPrint,
    searchTerm,
    onSearchChange,
    searchPlaceholder = 'Tìm kiếm nhanh...',
    hideEmpty,
    onHideEmptyChange,
    totalCount,
    filteredCount
}) => {
    const currentPreset = React.useMemo<DatePreset | null>(() => {
        const now = new Date();
        const todayStr = formatLocalDate(now);
        const yesterdayStr = formatLocalDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
        const last7Str = formatLocalDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6));
        const thisMonthStart = getStartOfMonthLocalDate(now);
        const lastMonthStart = formatLocalDate(new Date(now.getFullYear(), now.getMonth() - 1, 1));
        const lastMonthEnd = formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 0));
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const thisQuarterStart = formatLocalDate(new Date(now.getFullYear(), currentQuarter * 3, 1));
        const thisYearStart = `${now.getFullYear()}-01-01`;

        const from = fromDate.substring(0, 10);
        const to = toDate.substring(0, 10);

        if (from === todayStr && to === todayStr) return 'today';
        if (from === yesterdayStr && to === yesterdayStr) return 'yesterday';
        if (from === last7Str && to === todayStr) return 'last_7_days';
        if (from === thisMonthStart && to === todayStr) return 'this_month';
        if (from === lastMonthStart && to === lastMonthEnd) return 'last_month';
        if (from === thisQuarterStart && to === todayStr) return 'this_quarter';
        if (from === thisYearStart && to === todayStr) return 'this_year';
        return null;
    }, [fromDate, toDate]);

    const handlePreset = (preset: DatePreset) => {
        const now = new Date();
        if (preset === 'today') {
            const d = formatLocalDate(now);
            onFromDateChange(`${d} 00:00:00`);
            onToDateChange(`${d} 23:59:59`);
        } else if (preset === 'yesterday') {
            const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
            const d = formatLocalDate(yesterday);
            onFromDateChange(`${d} 00:00:00`);
            onToDateChange(`${d} 23:59:59`);
        } else if (preset === 'last_7_days') {
            const past7 = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
            onFromDateChange(`${formatLocalDate(past7)} 00:00:00`);
            onToDateChange(`${formatLocalDate(now)} 23:59:59`);
        } else if (preset === 'this_month') {
            onFromDateChange(`${getStartOfMonthLocalDate(now)} 00:00:00`);
            onToDateChange(`${formatLocalDate(now)} 23:59:59`);
        } else if (preset === 'last_month') {
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
            onFromDateChange(`${formatLocalDate(startOfLastMonth)} 00:00:00`);
            onToDateChange(`${formatLocalDate(endOfLastMonth)} 23:59:59`);
        } else if (preset === 'this_quarter') {
            const currentQuarter = Math.floor(now.getMonth() / 3);
            const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
            onFromDateChange(`${formatLocalDate(startOfQuarter)} 00:00:00`);
            onToDateChange(`${formatLocalDate(now)} 23:59:59`);
        } else if (preset === 'this_year') {
            onFromDateChange(`${now.getFullYear()}-01-01 00:00:00`);
            onToDateChange(`${formatLocalDate(now)} 23:59:59`);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 p-3.5 sm:p-4 mb-6 transition-all print:hidden space-y-3.5">
            {/* Row 1: Date Range & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {/* Date Inputs */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/70 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 flex-1 sm:flex-none">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Từ</span>
                        <input
                            type="datetime-local"
                            value={fromDate.replace(' ', 'T').substring(0, 16)}
                            onChange={(e) => onFromDateChange(e.target.value.replace('T', ' ') + ':00')}
                            className="text-xs sm:text-sm font-medium bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none w-full sm:w-auto"
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/70 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 flex-1 sm:flex-none">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Đến</span>
                        <input
                            type="datetime-local"
                            value={toDate.replace(' ', 'T').substring(0, 16)}
                            onChange={(e) => onToDateChange(e.target.value.replace('T', ' ') + ':00')}
                            className="text-xs sm:text-sm font-medium bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none w-full sm:w-auto"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-blue-500/20 transition disabled:opacity-50 cursor-pointer active:scale-95 w-full sm:w-auto"
                    >
                        <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Đang tải...' : 'Lấy Báo Cáo'}
                    </button>
                </div>

                {/* Export & Print */}
                <div className="flex items-center justify-end gap-2">
                    {onExportExcel && (
                        <button
                            type="button"
                            onClick={onExportExcel}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-emerald-600/20 transition cursor-pointer active:scale-95"
                            title="Xuất file Excel báo cáo chi tiết"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="hidden sm:inline">Xuất</span> Excel
                        </button>
                    )}
                    {onPrint && (
                        <button
                            type="button"
                            onClick={onPrint}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition cursor-pointer active:scale-95"
                            title="In báo cáo chuẩn khổ A4"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            In Biểu Mẫu
                        </button>
                    )}
                </div>
            </div>

            {/* Row 2: Quick Presets, Search & Hide Empty Toggle */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                {/* Presets with horizontal scroll on mobile */}
                <div className="flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-900/70 p-1.5 rounded-xl overflow-x-auto whitespace-nowrap">
                    {PRESET_OPTIONS.map((item) => {
                        const isActive = currentPreset === item.key;
                        return (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => handlePreset(item.key)}
                                className={`px-3 py-1 text-xs rounded-lg transition-all shrink-0 cursor-pointer font-medium select-none ${
                                    isActive
                                        ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/30 ring-1 ring-blue-600'
                                        : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/80 dark:hover:bg-slate-800'
                                }`}
                            >
                                {item.label}
                            </button>
                        );
                    })}
                </div>

                {/* Optional Search & Hide Empty */}
                <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3">
                    {onSearchChange && (
                        <div className="relative flex-1 sm:flex-none">
                            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm || ''}
                                onChange={(e) => onSearchChange(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="text-xs sm:text-sm pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-56"
                            />
                        </div>
                    )}

                    {onHideEmptyChange && (
                        <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={hideEmpty}
                                onChange={(e) => onHideEmptyChange(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>Ẩn dòng 0 số liệu</span>
                            {totalCount !== undefined && filteredCount !== undefined && (
                                <span className="px-2 py-0.5 text-[11px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full">
                                    {filteredCount}/{totalCount}
                                </span>
                            )}
                        </label>
                    )}
                </div>
            </div>
        </div>
    );
};

import { useSystemStore } from '../../../stores/useSystemStore';

// ==================== MINISTRY OF HEALTH PRINT HEADER & FOOTER ====================

export interface PrintReportHeaderProps {
    title: string;
    subtitle?: string;
    fromDate?: string;
    toDate?: string;
    formCode?: string;
    departmentName?: string;
}

export const PrintReportHeader: React.FC<PrintReportHeaderProps> = ({
    title,
    subtitle,
    fromDate,
    toDate,
    formCode,
    departmentName
}) => {
    const { hospitalName: storeHospitalName, parentOrg: storeParentOrg, fetchBrandingSettings, brandingLoaded } = useSystemStore();

    React.useEffect(() => {
        if (!brandingLoaded) {
            fetchBrandingSettings();
        }
    }, [brandingLoaded, fetchBrandingSettings]);

    const hospitalName = (storeHospitalName && storeHospitalName.trim() && storeHospitalName !== 'VIMES HIS') 
        ? storeHospitalName 
        : 'BỆNH VIỆN ĐA KHOA TỈNH';
    const parentOrg = (storeParentOrg && storeParentOrg.trim() && storeParentOrg !== 'SỞ Y TẾ') 
        ? storeParentOrg 
        : 'SỞ Y TẾ NINH BÌNH';

    return (
        <div className="hidden print:block mb-6 text-black print-header" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
            <div className="flex justify-between items-start text-xs leading-normal">
                {/* Left: Organization */}
                <div className="text-center min-w-[220px]">
                    <p className="font-semibold uppercase tracking-tight text-[11px] text-gray-800">{parentOrg}</p>
                    <p className="font-bold uppercase tracking-wide text-xs text-black mt-0.5">{hospitalName}</p>
                    {departmentName && (
                        <p className="text-[11px] font-medium uppercase text-gray-700 mt-0.5">{departmentName}</p>
                    )}
                    <div className="w-16 h-[0.5px] bg-gray-400 mx-auto mt-1"></div>
                </div>

                {/* Right: National Header */}
                <div className="text-center min-w-[240px]">
                    <p className="font-bold uppercase text-xs text-black">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                    <p className="italic text-[11px] font-medium text-gray-800 mt-0.5">Độc lập - Tự do - Hạnh phúc</p>
                    <div className="w-24 h-[1px] bg-black mx-auto mt-1"></div>
                    {formCode && (
                        <p className="text-[10px] text-right italic font-medium text-gray-600 mt-1.5">{formCode}</p>
                    )}
                </div>
            </div>

            {/* Title */}
            <div className="text-center mt-6 mb-4">
                <h1 className="text-lg font-bold uppercase tracking-wider text-black">{title}</h1>
                {subtitle && <p className="text-xs italic text-gray-700 mt-1">{subtitle}</p>}
                {fromDate && toDate && (
                    <p className="text-xs italic text-gray-800 mt-1">
                        (Thời gian thống kê: Từ {fromDate.split(' ')[0]} đến {toDate.split(' ')[0]})
                    </p>
                )}
            </div>
        </div>
    );
};

export const PrintReportFooter: React.FC = () => {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();

    return (
        <div className="hidden print:block mt-8 pt-4 text-black text-xs break-inside-avoid print-footer" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
            <div className="text-right italic mb-4 text-xs">
                Ngày {day} tháng {month} năm {year}
            </div>
            <div className="grid grid-cols-3 text-center">
                <div>
                    <p className="font-bold uppercase text-[11px]">NGƯỜI LẬP BIỂU</p>
                    <p className="italic text-[10px] text-gray-600 mt-0.5">(Ký, ghi rõ họ tên)</p>
                    <div className="h-20"></div>
                </div>
                <div>
                    <p className="font-bold uppercase text-[11px]">TRƯỞNG PHÒNG KHTH</p>
                    <p className="italic text-[10px] text-gray-600 mt-0.5">(Ký, ghi rõ họ tên)</p>
                    <div className="h-20"></div>
                </div>
                <div>
                    <p className="font-bold uppercase text-[11px]">GIÁM ĐỐC BỆNH VIỆN</p>
                    <p className="italic text-[10px] text-gray-600 mt-0.5">(Ký, đóng dấu)</p>
                    <div className="h-20"></div>
                </div>
            </div>
        </div>
    );
};

export const exportTableToExcel = (data: any[], fileName: string, sheetName = 'Báo Cáo') => {
    if (!data || data.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
};
