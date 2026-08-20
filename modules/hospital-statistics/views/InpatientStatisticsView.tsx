// ==================== INPATIENT STATISTICS VIEW ====================
// File: modules/hospital-statistics/views/InpatientStatisticsView.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { CommonFilter, PrintReportHeader, PrintReportFooter, exportTableToExcel, formatLocalDate, getStartOfMonthLocalDate } from '../components/CommonFilter';
import { statisticsService } from '../services/statisticsService';
import { InpatientStatisticsItem } from '../types';

type SortField = 'dept_name' | 'dau_ky' | 'vao_vien' | 'chuyen_den' | 'chuyen_di' | 'ra_vien' | 'tu_vong' | 'hien_dien';

export const InpatientStatisticsView: React.FC = () => {
    const now = new Date();
    const [fromDate, setFromDate] = useState(`${formatLocalDate(now)} 00:00:00`);
    const [toDate, setToDate] = useState(`${formatLocalDate(now)} 23:59:59`);
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<InpatientStatisticsItem[]>([]);

    // Filter & Sort
    const [searchTerm, setSearchTerm] = useState('');
    const [hideEmpty, setHideEmpty] = useState(true);
    const [sortField, setSortField] = useState<SortField>('vao_vien');
    const [sortAsc, setSortAsc] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await statisticsService.getInpatientStatistics(fromDate, toDate);
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

    const filteredItems = useMemo(() => {
        let result = items;

        if (hideEmpty) {
            result = result.filter(it => 
                Number(it.dau_ky || 0) > 0 ||
                Number(it.vao_vien || 0) > 0 ||
                Number(it.chuyen_den || 0) > 0 ||
                Number(it.chuyen_di || 0) > 0 ||
                Number(it.ra_vien || 0) > 0 ||
                Number(it.hien_dien || 0) > 0
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
            dau_ky: acc.dau_ky + Number(curr.dau_ky || 0),
            vao_vien: acc.vao_vien + Number(curr.vao_vien || 0),
            chuyen_den: acc.chuyen_den + Number(curr.chuyen_den || 0),
            chuyen_di: acc.chuyen_di + Number(curr.chuyen_di || 0),
            ra_vien: acc.ra_vien + Number(curr.ra_vien || 0),
            tu_vong: acc.tu_vong + Number(curr.tu_vong || 0),
            hien_dien: acc.hien_dien + Number(curr.hien_dien || 0)
        }), { dau_ky: 0, vao_vien: 0, chuyen_den: 0, chuyen_di: 0, ra_vien: 0, tu_vong: 0, hien_dien: 0 });
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
            'Khoa Điều Trị': it.dept_name,
            'Đầu Kỳ': Number(it.dau_ky || 0),
            'Vào Viện': Number(it.vao_vien || 0),
            'Chuyển Đến': Number(it.chuyen_den || 0),
            'Chuyển Đi': Number(it.chuyen_di || 0),
            'Ra Viện': Number(it.ra_vien || 0),
            'Tử Vong': Number(it.tu_vong || 0),
            'Hiện Diện (Cuối kỳ)': Number(it.hien_dien || 0)
        }));
        rows.push({
            'STT': 'TỔNG CỘNG',
            'Mã Khoa': '',
            'Khoa Điều Trị': `${filteredItems.length} khoa phòng`,
            'Đầu Kỳ': totals.dau_ky,
            'Vào Viện': totals.vao_vien,
            'Chuyển Đến': totals.chuyen_den,
            'Chuyển Đi': totals.chuyen_di,
            'Ra Viện': totals.ra_vien,
            'Tử Vong': totals.tu_vong,
            'Hiện Diện (Cuối kỳ)': totals.hien_dien
        });
        exportTableToExcel(rows, 'Thong_Ke_Dieu_Tri_Noi_Tru', 'Điều Trị Nội Trú');
    };

    return (
        <div className="space-y-6">
            <div className="print:hidden">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Báo cáo Biến động Điều trị Nội trú</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Cân đối chuyển động và lưu lượng người bệnh nội trú theo từng khoa lâm sàng
                </p>
            </div>

            <PrintReportHeader 
                formCode="Biểu mẫu: 03/BC-NT"
                title="BÁO CÁO BIẾN ĐỘNG NGƯỜI BỆNH ĐIỀU TRỊ NỘI TRÚ"
                subtitle="Bảng cân đối chuyển động người bệnh theo các khoa lâm sàng"
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
                                    <span>Khoa Điều Trị</span>
                                    {sortField === 'dept_name' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                                onClick={() => handleSort('dau_ky')}
                            >
                                <div className="flex items-center justify-end gap-1 text-slate-600 dark:text-slate-300">
                                    <span>Đầu Kỳ</span>
                                    {sortField === 'dau_ky' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                                onClick={() => handleSort('vao_vien')}
                            >
                                <div className="flex items-center justify-end gap-1 text-blue-600 dark:text-blue-400 font-bold">
                                    <span>Vào Viện</span>
                                    {sortField === 'vao_vien' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                                onClick={() => handleSort('chuyen_den')}
                            >
                                <div className="flex items-center justify-end gap-1 text-indigo-600">
                                    <span>Chuyển Đến</span>
                                    {sortField === 'chuyen_den' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                                onClick={() => handleSort('chuyen_di')}
                            >
                                <div className="flex items-center justify-end gap-1 text-amber-600">
                                    <span>Chuyển Đi</span>
                                    {sortField === 'chuyen_di' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                                onClick={() => handleSort('ra_vien')}
                            >
                                <div className="flex items-center justify-end gap-1 text-emerald-600">
                                    <span>Ra Viện</span>
                                    {sortField === 'ra_vien' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                                onClick={() => handleSort('tu_vong')}
                            >
                                <div className="flex items-center justify-end gap-1 text-rose-600 font-bold">
                                    <span>Tử Vong</span>
                                    {sortField === 'tu_vong' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                                onClick={() => handleSort('hien_dien')}
                            >
                                <div className="flex items-center justify-end gap-1 text-purple-600 dark:text-purple-400 font-black">
                                    <span>Hiện Diện</span>
                                    {sortField === 'hien_dien' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredItems.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-4 py-8 text-center text-slate-400 italic">
                                    Không tìm thấy khoa phòng phù hợp với tiêu chí lọc
                                </td>
                            </tr>
                        ) : (
                            filteredItems.map((it, idx) => (
                                <tr key={it.dept_id} className="hover:bg-emerald-50/40 dark:hover:bg-slate-700/40 transition">
                                    <td className="px-4 py-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                                    <td className="px-4 py-3">
                                        <div className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                            <span>{it.dept_name}</span>
                                            <span className="text-[11px] font-mono px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded">
                                                {it.dept_id}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right text-slate-500 font-medium">
                                        {Number(it.dau_ky || 0).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-blue-600 dark:text-blue-400">
                                        {Number(it.vao_vien || 0).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium text-indigo-600">
                                        {Number(it.chuyen_den || 0).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium text-amber-600">
                                        {Number(it.chuyen_di || 0).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                                        {Number(it.ra_vien || 0).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-rose-600">
                                        {Number(it.tu_vong || 0).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-right font-black text-purple-600 dark:text-purple-400 text-base">
                                        {Number(it.hien_dien || 0).toLocaleString()}
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
                            <td className="px-4 py-3.5 text-right text-slate-600 dark:text-slate-300">
                                {totals.dau_ky.toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 text-right font-black text-blue-600 dark:text-blue-300 text-sm">
                                {totals.vao_vien.toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 text-right text-indigo-600 dark:text-indigo-300">
                                {totals.chuyen_den.toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 text-right text-amber-600 dark:text-amber-300">
                                {totals.chuyen_di.toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 text-right text-emerald-600 dark:text-emerald-300">
                                {totals.ra_vien.toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 text-right text-rose-600 dark:text-rose-300">
                                {totals.tu_vong.toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 text-right font-black text-purple-600 dark:text-purple-300 text-base">
                                {totals.hien_dien.toLocaleString()}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <PrintReportFooter />
        </div>
    );
};
