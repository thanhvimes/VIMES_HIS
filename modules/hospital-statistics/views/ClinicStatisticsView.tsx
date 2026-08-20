// ==================== CLINIC STATISTICS VIEW ====================
// File: modules/hospital-statistics/views/ClinicStatisticsView.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { CommonFilter, PrintReportHeader, PrintReportFooter, exportTableToExcel, formatLocalDate, getStartOfMonthLocalDate } from '../components/CommonFilter';
import { statisticsService } from '../services/statisticsService';
import { ClinicStatisticsItem } from '../types';

type SortField = 'room_name' | 'tong_luot_kham' | 'so_bhyt' | 'so_dichvu' | 'nhap_vien' | 'chuyen_vien' | 'cho_ve' | 'dang_kham';

export const ClinicStatisticsView: React.FC = () => {
    const now = new Date();
    const [fromDate, setFromDate] = useState(`${formatLocalDate(now)} 00:00:00`);
    const [toDate, setToDate] = useState(`${formatLocalDate(now)} 23:59:59`);
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<ClinicStatisticsItem[]>([]);
    
    // Filters & Sorting
    const [searchTerm, setSearchTerm] = useState('');
    const [hideEmpty, setHideEmpty] = useState(true);
    const [sortField, setSortField] = useState<SortField>('tong_luot_kham');
    const [sortAsc, setSortAsc] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await statisticsService.getClinicsStatistics(fromDate, toDate);
            setItems(res);
        } catch (error) {
            console.error('Error fetching clinic statistics:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Filter and sort items
    const filteredItems = useMemo(() => {
        let result = items;

        if (hideEmpty) {
            result = result.filter(it => Number(it.tong_luot_kham || 0) > 0);
        }

        if (searchTerm.trim()) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(it => 
                (it.room_name && it.room_name.toLowerCase().includes(lower)) ||
                String(it.room_id).includes(lower)
            );
        }

        result = [...result].sort((a, b) => {
            let valA: any = a[sortField];
            let valB: any = b[sortField];
            if (sortField !== 'room_name') {
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

    // Calculate totals of filtered set
    const totals = useMemo(() => {
        return filteredItems.reduce((acc, curr) => ({
            tong_luot_kham: acc.tong_luot_kham + Number(curr.tong_luot_kham || 0),
            so_bhyt: acc.so_bhyt + Number(curr.so_bhyt || 0),
            so_dichvu: acc.so_dichvu + Number(curr.so_dichvu || 0),
            nhap_vien: acc.nhap_vien + Number(curr.nhap_vien || 0),
            chuyen_vien: acc.chuyen_vien + Number(curr.chuyen_vien || 0),
            cho_ve: acc.cho_ve + Number(curr.cho_ve || 0),
            dang_kham: acc.dang_kham + Number(curr.dang_kham || 0)
        }), { tong_luot_kham: 0, so_bhyt: 0, so_dichvu: 0, nhap_vien: 0, chuyen_vien: 0, cho_ve: 0, dang_kham: 0 });
    }, [filteredItems]);

    const maxVisits = useMemo(() => {
        return Math.max(...filteredItems.map(it => Number(it.tong_luot_kham || 0)), 1);
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
            'Mã Phòng': it.room_id,
            'Tên Phòng Khám': it.room_name,
            'Tổng Khám': Number(it.tong_luot_kham || 0),
            'Khám BHYT': Number(it.so_bhyt || 0),
            'Khám Dịch Vụ': Number(it.so_dichvu || 0),
            'Nhập Viện': Number(it.nhap_vien || 0),
            'Chuyển Tuyến': Number(it.chuyen_vien || 0),
            'Cho Về': Number(it.cho_ve || 0),
            'Đang Khám': Number(it.dang_kham || 0)
        }));
        // Add total row
        rows.push({
            'STT': 'TỔNG CỘNG',
            'Mã Phòng': '',
            'Tên Phòng Khám': `${filteredItems.length} phòng khám`,
            'Tổng Khám': totals.tong_luot_kham,
            'Khám BHYT': totals.so_bhyt,
            'Khám Dịch Vụ': totals.so_dichvu,
            'Nhập Viện': totals.nhap_vien,
            'Chuyển Tuyến': totals.chuyen_vien,
            'Cho Về': totals.cho_ve,
            'Đang Khám': totals.dang_kham
        });
        exportTableToExcel(rows, 'Thong_Ke_Phong_Kham', 'Phòng Khám');
    };

    return (
        <div className="space-y-6">
            <div className="print:hidden">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Thống kê theo Phòng Khám</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Theo dõi lưu lượng và phân loại kết quả khám bệnh theo từng buồng khám chuyên khoa
                </p>
            </div>

            <PrintReportHeader 
                formCode="Biểu mẫu: 02/BC-PK"
                title="BÁO CÁO THỐNG KÊ HOẠT ĐỘNG CÁC PHÒNG KHÁM NGOẠI TRÚ"
                subtitle="Chi tiết lưu lượng và xử trí bệnh nhân từng buồng khám chuyên khoa"
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
                searchPlaceholder="Tìm tên phòng hoặc mã phòng..."
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
                                onClick={() => handleSort('room_name')}
                            >
                                <div className="flex items-center gap-1">
                                    <span>Phòng Khám</span>
                                    {sortField === 'room_name' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition min-w-[140px]"
                                onClick={() => handleSort('tong_luot_kham')}
                            >
                                <div className="flex items-center justify-end gap-1 text-blue-600 dark:text-blue-400">
                                    <span>Tổng Khám</span>
                                    {sortField === 'tong_luot_kham' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                                onClick={() => handleSort('so_bhyt')}
                            >
                                <div className="flex items-center justify-end gap-1 text-emerald-600">
                                    <span>BHYT</span>
                                    {sortField === 'so_bhyt' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                                onClick={() => handleSort('so_dichvu')}
                            >
                                <div className="flex items-center justify-end gap-1 text-amber-600">
                                    <span>Dịch Vụ</span>
                                    {sortField === 'so_dichvu' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                                onClick={() => handleSort('nhap_vien')}
                            >
                                <div className="flex items-center justify-end gap-1 text-indigo-600">
                                    <span>Nhập Viện</span>
                                    {sortField === 'nhap_vien' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                                onClick={() => handleSort('chuyen_vien')}
                            >
                                <div className="flex items-center justify-end gap-1 text-rose-600">
                                    <span>Chuyển Tuyến</span>
                                    {sortField === 'chuyen_vien' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                                onClick={() => handleSort('cho_ve')}
                            >
                                <div className="flex items-center justify-end gap-1 text-slate-600 dark:text-slate-300">
                                    <span>Cho Về</span>
                                    {sortField === 'cho_ve' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                                onClick={() => handleSort('dang_kham')}
                            >
                                <div className="flex items-center justify-end gap-1 text-slate-500">
                                    <span>Đang Khám</span>
                                    {sortField === 'dang_kham' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredItems.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-4 py-8 text-center text-slate-400 italic">
                                    Không tìm thấy phòng khám phù hợp với tiêu chí lọc
                                </td>
                            </tr>
                        ) : (
                            filteredItems.map((it, idx) => {
                                const visits = Number(it.tong_luot_kham || 0);
                                const percent = ((visits / maxVisits) * 100).toFixed(0);

                                return (
                                    <tr key={it.room_id} className="hover:bg-blue-50/40 dark:hover:bg-slate-700/40 transition">
                                        <td className="px-4 py-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                                <span>{it.room_name}</span>
                                                <span className="text-[11px] font-mono px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded">
                                                    P.{it.room_id}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="font-bold text-blue-600 dark:text-blue-400">
                                                    {visits.toLocaleString()}
                                                </span>
                                                {visits > 0 && (
                                                    <div className="w-20 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-blue-500 rounded-full"
                                                            style={{ width: `${percent}%` }}
                                                        ></div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                                            {Number(it.so_bhyt || 0).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-amber-600">
                                            {Number(it.so_dichvu || 0).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-indigo-600">
                                            {Number(it.nhap_vien || 0).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-rose-600">
                                            {Number(it.chuyen_vien || 0).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                                            {Number(it.cho_ve || 0).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-slate-500">
                                            {Number(it.dang_kham || 0).toLocaleString()}
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
                                TỔNG CỘNG ({filteredItems.length} phòng khám)
                            </td>
                            <td className="px-4 py-3.5 text-right font-black text-blue-600 dark:text-blue-300 text-sm">
                                {totals.tong_luot_kham.toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 text-right text-emerald-600 dark:text-emerald-300">
                                {totals.so_bhyt.toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 text-right text-amber-600 dark:text-amber-300">
                                {totals.so_dichvu.toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 text-right text-indigo-600 dark:text-indigo-300">
                                {totals.nhap_vien.toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 text-right text-rose-600 dark:text-rose-300">
                                {totals.chuyen_vien.toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 text-right text-slate-700 dark:text-slate-200">
                                {totals.cho_ve.toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 text-right text-slate-600 dark:text-slate-300">
                                {totals.dang_kham.toLocaleString()}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <PrintReportFooter />
        </div>
    );
};
