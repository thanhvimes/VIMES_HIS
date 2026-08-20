// ==================== BED OCCUPANCY VIEW ====================
// File: modules/hospital-statistics/views/BedOccupancyView.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { CommonFilter, PrintReportHeader, PrintReportFooter, exportTableToExcel, formatLocalDate, getStartOfMonthLocalDate } from '../components/CommonFilter';
import { statisticsService } from '../services/statisticsService';
import { BedOccupancyItem } from '../types';
import { BuildingOfficeIcon, UserGroupIcon, HeartIcon } from '../../../components/Icons';

type SortField = 'dept_name' | 'giuong_ke_hoach' | 'giuong_thuc_ke' | 'bn_dang_nam' | 'ty_le_cong_suat';

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

    const fetchData = async () => {
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

    const filteredItems = useMemo(() => {
        let result = items;

        if (hideEmpty) {
            result = result.filter(it => 
                Number(it.giuong_ke_hoach || 0) > 0 ||
                Number(it.giuong_thuc_ke || 0) > 0 ||
                Number(it.bn_dang_nam || 0) > 0
            );
        }

        if (searchTerm.trim()) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(it => 
                (it.dept_name && it.dept_name.toLowerCase().includes(lower)) ||
                (it.dept_id && it.dept_id.toLowerCase().includes(lower))
            );
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
    }, [items, hideEmpty, searchTerm, sortField, sortAsc]);

    const totals = useMemo(() => {
        return filteredItems.reduce((acc, curr) => ({
            giuong_ke_hoach: acc.giuong_ke_hoach + Number(curr.giuong_ke_hoach || 0),
            giuong_thuc_ke: acc.giuong_thuc_ke + Number(curr.giuong_thuc_ke || 0),
            bn_dang_nam: acc.bn_dang_nam + Number(curr.bn_dang_nam || 0)
        }), { giuong_ke_hoach: 0, giuong_thuc_ke: 0, bn_dang_nam: 0 });
    }, [filteredItems]);

    const totalOccupancyRate = totals.giuong_ke_hoach > 0
        ? ((totals.bn_dang_nam / totals.giuong_ke_hoach) * 100).toFixed(1)
        : '0.0';

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
            'Khoa Lâm Sàng': it.dept_name,
            'Giường Kế Hoạch': Number(it.giuong_ke_hoach || 0),
            'Giường Thực Kê': Number(it.giuong_thuc_ke || 0),
            'BN Đang Nằm': Number(it.bn_dang_nam || 0),
            'Công Suất Sử Dụng (%)': `${Number(it.ty_le_cong_suat || 0)}%`
        }));
        rows.push({
            'STT': 'TỔNG CỘNG',
            'Mã Khoa': '',
            'Khoa Lâm Sàng': `${filteredItems.length} khoa lâm sàng`,
            'Giường Kế Hoạch': totals.giuong_ke_hoach,
            'Giường Thực Kê': totals.giuong_thuc_ke,
            'BN Đang Nằm': totals.bn_dang_nam,
            'Công Suất Sử Dụng (%)': `${totalOccupancyRate}%`
        });
        exportTableToExcel(rows, 'Cong_Suat_Su_Dung_Giuong', 'Công Suất Giường');
    };

    return (
        <div className="space-y-6">
            <div className="print:hidden">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Báo cáo Công suất Sử dụng Giường bệnh</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Theo dõi tỷ lệ lấp đầy giường bệnh, cảnh báo tình trạng quá tải và cân đối điều phối bệnh nhân nội trú
                </p>
            </div>

            <PrintReportHeader 
                formCode="Biểu mẫu: 07/BC-CSG"
                title="BÁO CÁO THỐNG KÊ CÔNG SUẤT SỬ DỤNG GIƯỜNG BỆNH"
                subtitle="Thống kê tỷ lệ sử dụng giường kế hoạch, giường thực kê theo khoa điều trị"
                fromDate={fromDate}
                toDate={toDate}
            />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 print:hidden">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Giường Kế Hoạch</p>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                            {totals.giuong_ke_hoach.toLocaleString()}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">Chỉ tiêu phân bổ BV</p>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl">
                        <BuildingOfficeIcon className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Giường Thực Kê</p>
                        <h3 className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                            {totals.giuong_thuc_ke.toLocaleString()}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">Giường kê thực tế</p>
                    </div>
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                        <HeartIcon className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">BN Đang Nằm</p>
                        <h3 className="text-3xl font-black text-purple-600 dark:text-purple-400 mt-1">
                            {totals.bn_dang_nam.toLocaleString()}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">Bệnh nhân nội trú</p>
                    </div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl">
                        <UserGroupIcon className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Công Suất Trung Bình</p>
                        <h3 className={`text-3xl font-black mt-1 ${
                            Number(totalOccupancyRate) > 100 
                                ? 'text-rose-600 dark:text-rose-400' 
                                : Number(totalOccupancyRate) >= 80 
                                ? 'text-emerald-600 dark:text-emerald-400' 
                                : 'text-blue-600 dark:text-blue-400'
                        }`}>
                            {totalOccupancyRate}%
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                            {Number(totalOccupancyRate) > 100 ? '⚠️ Quá tải giường' : '✅ Trong ngưỡng an toàn'}
                        </p>
                    </div>
                    <div className={`p-3 rounded-2xl ${
                        Number(totalOccupancyRate) > 100 
                            ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600' 
                            : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600'
                    }`}>
                        <span className="text-xl font-bold">%</span>
                    </div>
                </div>
            </div>

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
                searchPlaceholder="Tìm tên khoa hoặc mã khoa..."
                hideEmpty={hideEmpty}
                onHideEmptyChange={setHideEmpty}
                totalCount={items.length}
                filteredCount={filteredItems.length}
            />

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-700/80 overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 uppercase text-xs font-bold tracking-wider sticky top-0 z-10 shadow-xs">
                        <tr>
                            <th className="px-4 py-3.5 text-center w-14">STT</th>
                            <th 
                                className="px-4 py-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                                onClick={() => handleSort('dept_name')}
                            >
                                <div className="flex items-center gap-1">
                                    <span>Khoa Điều Trị</span>
                                    {sortField === 'dept_name' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                                onClick={() => handleSort('giuong_ke_hoach')}
                            >
                                <div className="flex items-center justify-end gap-1 text-slate-600 dark:text-slate-300">
                                    <span>Giường KH</span>
                                    {sortField === 'giuong_ke_hoach' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                                onClick={() => handleSort('giuong_thuc_ke')}
                            >
                                <div className="flex items-center justify-end gap-1 text-indigo-600">
                                    <span>Giường Thực Kê</span>
                                    {sortField === 'giuong_thuc_ke' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                                onClick={() => handleSort('bn_dang_nam')}
                            >
                                <div className="flex items-center justify-end gap-1 text-purple-600 dark:text-purple-400 font-bold">
                                    <span>BN Đang Nằm</span>
                                    {sortField === 'bn_dang_nam' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 min-w-[220px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                                onClick={() => handleSort('ty_le_cong_suat')}
                            >
                                <div className="flex items-center gap-1">
                                    <span>Tỷ Lệ Công Suất Giường (%)</span>
                                    {sortField === 'ty_le_cong_suat' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredItems.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-slate-400 italic">
                                    Không tìm thấy khoa lâm sàng phù hợp với tiêu chí lọc
                                </td>
                            </tr>
                        ) : (
                            filteredItems.map((it, idx) => {
                                const rate = Number(it.ty_le_cong_suat || 0);
                                let barGradient = 'from-blue-500 to-indigo-600';
                                let textColor = 'text-blue-600 dark:text-blue-400';
                                let statusBadge = '🟢 Bình thường';

                                if (rate > 100) {
                                    barGradient = 'from-rose-500 to-red-600';
                                    textColor = 'text-rose-600 dark:text-rose-400 font-bold';
                                    statusBadge = '🔴 Quá tải';
                                } else if (rate >= 80) {
                                    barGradient = 'from-emerald-500 to-teal-600';
                                    textColor = 'text-emerald-600 dark:text-emerald-400 font-semibold';
                                    statusBadge = '🟡 Tối ưu';
                                }

                                return (
                                    <tr key={it.dept_id} className="hover:bg-indigo-50/40 dark:hover:bg-slate-700/40 transition">
                                        <td className="px-4 py-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                                <span>{it.dept_name}</span>
                                                <span className="text-[11px] font-mono px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded">
                                                    {it.dept_id}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300 font-medium">
                                            {Number(it.giuong_ke_hoach || 0).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-right text-indigo-600 font-semibold">
                                            {Number(it.giuong_thuc_ke || 0).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-right font-black text-purple-600 dark:text-purple-400 text-base">
                                            {Number(it.bn_dang_nam || 0).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full bg-gradient-to-r ${barGradient} rounded-full transition-all duration-500`}
                                                        style={{ width: `${Math.min(rate, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <span className={`w-16 text-right font-bold text-xs ${textColor}`}>
                                                    {rate}%
                                                </span>
                                                <span className="text-[10px] hidden sm:inline text-slate-400">
                                                    {statusBadge}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                    {/* Sticky Footer Total Row */}
                    <tfoot className="bg-slate-100/90 dark:bg-slate-700/90 font-bold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-600 sticky bottom-0 z-10 shadow-md">
                        <tr>
                            <td colSpan={2} className="px-4 py-3.5 text-center uppercase tracking-wide">
                                TỔNG CỘNG ({filteredItems.length} khoa)
                            </td>
                            <td className="px-4 py-3.5 text-right text-slate-700 dark:text-slate-200">
                                {totals.giuong_ke_hoach.toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 text-right text-indigo-600 dark:text-indigo-300">
                                {totals.giuong_thuc_ke.toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 text-right font-black text-purple-600 dark:text-purple-300 text-base">
                                {totals.bn_dang_nam.toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5">
                                <span className="font-black text-emerald-600 dark:text-emerald-300 text-base">
                                    Công suất trung bình: {totalOccupancyRate}%
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
