// ==================== SURGERY STATISTICS VIEW ====================
// File: modules/hospital-statistics/views/SurgeryStatisticsView.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { CommonFilter, PrintReportHeader, PrintReportFooter, exportTableToExcel, formatLocalDate, getStartOfMonthLocalDate } from '../components/CommonFilter';
import { statisticsService } from '../services/statisticsService';
import { SurgeryStatisticsItem } from '../types';

type SortField = 'dept_name' | 'tong_benh_nhan' | 'tong_so_ca' | 'loai_dac_biet' | 'loai_1' | 'loai_2' | 'loai_3' | 'thu_thuat';

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

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await statisticsService.getSurgeryStatistics(fromDate, toDate);
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

    const filteredItems = useMemo(() => {
        let result = items;

        if (hideEmpty) {
            result = result.filter(it => Number(it.tong_so_ca || 0) > 0);
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
            tong_benh_nhan: acc.tong_benh_nhan + Number(curr.tong_benh_nhan || 0),
            tong_so_ca: acc.tong_so_ca + Number(curr.tong_so_ca || 0),
            loai_dac_biet: acc.loai_dac_biet + Number(curr.loai_dac_biet || 0),
            loai_1: acc.loai_1 + Number(curr.loai_1 || 0),
            loai_2: acc.loai_2 + Number(curr.loai_2 || 0),
            loai_3: acc.loai_3 + Number(curr.loai_3 || 0),
            thu_thuat: acc.thu_thuat + Number(curr.thu_thuat || 0)
        }), { tong_benh_nhan: 0, tong_so_ca: 0, loai_dac_biet: 0, loai_1: 0, loai_2: 0, loai_3: 0, thu_thuat: 0 });
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
            'Khoa Thực Hiện': it.dept_name,
            'Số Bệnh Nhân': Number(it.tong_benh_nhan || 0),
            'Tổng Số Ca PTTT': Number(it.tong_so_ca || 0),
            'PT Loại Đặc Biệt': Number(it.loai_dac_biet || 0),
            'PT Loại 1': Number(it.loai_1 || 0),
            'PT Loại 2': Number(it.loai_2 || 0),
            'PT Loại 3': Number(it.loai_3 || 0),
            'Thủ Thuật': Number(it.thu_thuat || 0)
        }));
        rows.push({
            'STT': 'TỔNG CỘNG',
            'Mã Khoa': '',
            'Khoa Thực Hiện': `${filteredItems.length} khoa phòng`,
            'Số Bệnh Nhân': totals.tong_benh_nhan,
            'Tổng Số Ca PTTT': totals.tong_so_ca,
            'PT Loại Đặc Biệt': totals.loai_dac_biet,
            'PT Loại 1': totals.loai_1,
            'PT Loại 2': totals.loai_2,
            'PT Loại 3': totals.loai_3,
            'Thủ Thuật': totals.thu_thuat
        });
        exportTableToExcel(rows, 'Thong_Ke_Phau_Thuat_Thu_Thuat', 'PTTT');
    };

    return (
        <div className="space-y-6">
            <div className="print:hidden">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Báo cáo Phẫu thuật - Thủ thuật</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Thống kê phân loại phẫu thuật và thủ thuật theo chuyên khoa và mức độ phức tạp Bộ Y tế
                </p>
            </div>

            <PrintReportHeader 
                formCode="Biểu mẫu: 05/BC-PTTT"
                title="BÁO CÁO THỐNG KÊ HOẠT ĐỘNG PHẪU THUẬT - THỦ THUẬT"
                subtitle="Phân loại phẫu thuật, thủ thuật theo phân cấp kỹ thuật Bộ Y tế"
                fromDate={fromDate}
                toDate={toDate}
            />

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
                                    <span>Khoa Thực Hiện</span>
                                    {sortField === 'dept_name' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                                onClick={() => handleSort('tong_benh_nhan')}
                            >
                                <div className="flex items-center justify-end gap-1 text-slate-600 dark:text-slate-300">
                                    <span>Số BN</span>
                                    {sortField === 'tong_benh_nhan' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition min-w-[120px]"
                                onClick={() => handleSort('tong_so_ca')}
                            >
                                <div className="flex items-center justify-end gap-1 text-blue-600 dark:text-blue-400 font-bold">
                                    <span>Tổng Ca PTTT</span>
                                    {sortField === 'tong_so_ca' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                                onClick={() => handleSort('loai_dac_biet')}
                            >
                                <div className="flex items-center justify-end gap-1 text-rose-600 font-bold">
                                    <span>Loại ĐB</span>
                                    {sortField === 'loai_dac_biet' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                                onClick={() => handleSort('loai_1')}
                            >
                                <div className="flex items-center justify-end gap-1 text-amber-600 font-bold">
                                    <span>Loại 1</span>
                                    {sortField === 'loai_1' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                                onClick={() => handleSort('loai_2')}
                            >
                                <div className="flex items-center justify-end gap-1 text-blue-600 font-semibold">
                                    <span>Loại 2</span>
                                    {sortField === 'loai_2' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                                onClick={() => handleSort('loai_3')}
                            >
                                <div className="flex items-center justify-end gap-1 text-teal-600 font-semibold">
                                    <span>Loại 3</span>
                                    {sortField === 'loai_3' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                                onClick={() => handleSort('thu_thuat')}
                            >
                                <div className="flex items-center justify-end gap-1 text-slate-700 dark:text-slate-300 font-semibold">
                                    <span>Thủ Thuật</span>
                                    {sortField === 'thu_thuat' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredItems.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-4 py-8 text-center text-slate-400 italic">
                                    Không tìm thấy khoa thực hiện PTTT phù hợp với tiêu chí lọc
                                </td>
                            </tr>
                        ) : (
                            filteredItems.map((it, idx) => (
                                <tr key={it.dept_id} className="hover:bg-rose-50/40 dark:hover:bg-slate-700/40 transition">
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
                                        {Number(it.tong_benh_nhan || 0).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-right font-black text-blue-600 dark:text-blue-400 text-base">
                                        {Number(it.tong_so_ca || 0).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {Number(it.loai_dac_biet || 0) > 0 ? (
                                            <span className="px-2 py-0.5 font-bold text-rose-700 bg-rose-100 dark:bg-rose-900/40 dark:text-rose-300 rounded-full text-xs">
                                                {Number(it.loai_dac_biet).toLocaleString()}
                                            </span>
                                        ) : (
                                            <span className="text-slate-300 dark:text-slate-600">-</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {Number(it.loai_1 || 0) > 0 ? (
                                            <span className="px-2 py-0.5 font-bold text-amber-700 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300 rounded-full text-xs">
                                                {Number(it.loai_1).toLocaleString()}
                                            </span>
                                        ) : (
                                            <span className="text-slate-300 dark:text-slate-600">-</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right font-semibold text-blue-600">
                                        {Number(it.loai_2 || 0) > 0 ? Number(it.loai_2).toLocaleString() : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-right font-semibold text-teal-600">
                                        {Number(it.loai_3 || 0) > 0 ? Number(it.loai_3).toLocaleString() : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                                        {Number(it.thu_thuat || 0).toLocaleString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    {/* Sticky Footer Total Row */}
                    <tfoot className="bg-slate-100/90 dark:bg-slate-700/90 font-bold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-600 sticky bottom-0 z-10 shadow-md">
                        <tr>
                            <td colSpan={2} className="px-4 py-3.5 text-center uppercase tracking-wide">
                                TỔNG CỘNG ({filteredItems.length} khoa phòng)
                            </td>
                            <td className="px-4 py-3.5 text-right text-slate-700 dark:text-slate-200">
                                {totals.tong_benh_nhan.toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 text-right font-black text-blue-600 dark:text-blue-300 text-base">
                                {totals.tong_so_ca.toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 text-right text-rose-600 dark:text-rose-300">
                                {totals.loai_dac_biet.toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 text-right text-amber-600 dark:text-amber-300">
                                {totals.loai_1.toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 text-right text-blue-600 dark:text-blue-300">
                                {totals.loai_2.toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 text-right text-teal-600 dark:text-teal-300">
                                {totals.loai_3.toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 text-right text-slate-700 dark:text-slate-200">
                                {totals.thu_thuat.toLocaleString()}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <PrintReportFooter />
        </div>
    );
};
