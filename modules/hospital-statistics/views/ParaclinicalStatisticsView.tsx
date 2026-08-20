// ==================== PARACLINICAL STATISTICS VIEW ====================
// File: modules/hospital-statistics/views/ParaclinicalStatisticsView.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { CommonFilter, PrintReportHeader, PrintReportFooter, exportTableToExcel, formatLocalDate, getStartOfMonthLocalDate } from '../components/CommonFilter';
import { statisticsService } from '../services/statisticsService';
import { ParaclinicalStatisticsItem } from '../types';

type SortField = 'group_name' | 'tong_so_bn' | 'tong_so_ca' | 'ca_bhyt' | 'ca_dichvu' | 'tong_thanh_tien';

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
    const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'B1' | 'B2' | 'B3'>('ALL');

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await statisticsService.getParaclinicalStatistics(fromDate, toDate);
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

    const filteredItems = useMemo(() => {
        let result = items;

        if (hideEmpty) {
            result = result.filter(it => Number(it.tong_so_ca || 0) > 0);
        }

        if (selectedCategory !== 'ALL') {
            result = result.filter(it => it.group_id && it.group_id.startsWith(selectedCategory));
        }

        if (searchTerm.trim()) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(it => 
                (it.group_name && it.group_name.toLowerCase().includes(lower)) ||
                (it.group_id && it.group_id.toLowerCase().includes(lower))
            );
        }

        result = [...result].sort((a, b) => {
            let valA: any = a[sortField];
            let valB: any = b[sortField];
            if (sortField !== 'group_name') {
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

    const totals = useMemo(() => {
        return filteredItems.reduce((acc, curr) => ({
            tong_so_bn: acc.tong_so_bn + Number(curr.tong_so_bn || 0),
            tong_so_ca: acc.tong_so_ca + Number(curr.tong_so_ca || 0),
            ca_bhyt: acc.ca_bhyt + Number(curr.ca_bhyt || 0),
            ca_dichvu: acc.ca_dichvu + Number(curr.ca_dichvu || 0),
            tong_thanh_tien: acc.tong_thanh_tien + Number(curr.tong_thanh_tien || 0)
        }), { tong_so_bn: 0, tong_so_ca: 0, ca_bhyt: 0, ca_dichvu: 0, tong_thanh_tien: 0 });
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
            'Mã Nhóm': it.group_id,
            'Tên Nhóm Cận Lâm Sàng': it.group_name,
            'Số Bệnh Nhân': Number(it.tong_so_bn || 0),
            'Tổng Số Ca': Number(it.tong_so_ca || 0),
            'Ca BHYT': Number(it.ca_bhyt || 0),
            'Ca Dịch Vụ': Number(it.ca_dichvu || 0),
            'Tổng Thành Tiền (VNĐ)': Number(it.tong_thanh_tien || 0)
        }));
        rows.push({
            'STT': 'TỔNG CỘNG',
            'Mã Nhóm': '',
            'Tên Nhóm Cận Lâm Sàng': `${filteredItems.length} nhóm kỹ thuật`,
            'Số Bệnh Nhân': totals.tong_so_bn,
            'Tổng Số Ca': totals.tong_so_ca,
            'Ca BHYT': totals.ca_bhyt,
            'Ca Dịch Vụ': totals.ca_dichvu,
            'Tổng Thành Tiền (VNĐ)': totals.tong_thanh_tien
        });
        exportTableToExcel(rows, 'Thong_Ke_Can_Lam_Sang', 'Cận Lâm Sàng');
    };

    return (
        <div className="space-y-6">
            <div className="print:hidden">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Báo cáo Thống kê Cận Lâm Sàng</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Thống kê lưu lượng chỉ định, số ca thực hiện và doanh thu theo từng nhóm kỹ thuật (Xét nghiệm, CĐHA, TDCN)
                </p>
            </div>

            <PrintReportHeader 
                formCode="Biểu mẫu: 04/BC-CLS"
                title="BÁO CÁO THỐNG KÊ HOẠT ĐỘNG CẬN LÂM SÀNG & THĂM DÒ CHỨC NĂNG"
                subtitle="Tổng hợp số ca thực hiện và doanh thu theo từng nhóm kỹ thuật"
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
                searchPlaceholder="Tìm tên nhóm hoặc mã nhóm CLS..."
                hideEmpty={hideEmpty}
                onHideEmptyChange={setHideEmpty}
                totalCount={items.length}
                filteredCount={filteredItems.length}
            />

            {/* Category Filter Badges */}
            <div className="flex items-center gap-2 print:hidden">
                <button
                    onClick={() => setSelectedCategory('ALL')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                        selectedCategory === 'ALL'
                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                >
                    Tất cả ({items.length})
                </button>
                <button
                    onClick={() => setSelectedCategory('B1')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                        selectedCategory === 'B1'
                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                >
                    Xét Nghiệm (LIS - B1)
                </button>
                <button
                    onClick={() => setSelectedCategory('B2')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                        selectedCategory === 'B2'
                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                >
                    Chẩn Đoán Hình Ảnh (CĐHA - B2)
                </button>
                <button
                    onClick={() => setSelectedCategory('B3')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                        selectedCategory === 'B3'
                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                >
                    Thăm Dò Chức Năng (TDCN - B3)
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-700/80 overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 uppercase text-xs font-bold tracking-wider sticky top-0 z-10 shadow-xs">
                        <tr>
                            <th className="px-4 py-3.5 text-center w-14">STT</th>
                            <th 
                                className="px-4 py-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                                onClick={() => handleSort('group_name')}
                            >
                                <div className="flex items-center gap-1">
                                    <span>Nhóm Cận Lâm Sàng</span>
                                    {sortField === 'group_name' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                                onClick={() => handleSort('tong_so_bn')}
                            >
                                <div className="flex items-center justify-end gap-1 text-slate-600 dark:text-slate-300">
                                    <span>Số Bệnh Nhân</span>
                                    {sortField === 'tong_so_bn' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition min-w-[120px]"
                                onClick={() => handleSort('tong_so_ca')}
                            >
                                <div className="flex items-center justify-end gap-1 text-blue-600 dark:text-blue-400 font-bold">
                                    <span>Tổng Số Ca</span>
                                    {sortField === 'tong_so_ca' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                                onClick={() => handleSort('ca_bhyt')}
                            >
                                <div className="flex items-center justify-end gap-1 text-emerald-600">
                                    <span>Ca BHYT</span>
                                    {sortField === 'ca_bhyt' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                                onClick={() => handleSort('ca_dichvu')}
                            >
                                <div className="flex items-center justify-end gap-1 text-amber-600">
                                    <span>Ca Dịch Vụ</span>
                                    {sortField === 'ca_dichvu' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition min-w-[160px]"
                                onClick={() => handleSort('tong_thanh_tien')}
                            >
                                <div className="flex items-center justify-end gap-1 text-purple-600 dark:text-purple-400 font-black">
                                    <span>Tổng Doanh Thu</span>
                                    {sortField === 'tong_thanh_tien' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredItems.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-slate-400 italic">
                                    Không tìm thấy nhóm cận lâm sàng phù hợp với tiêu chí lọc
                                </td>
                            </tr>
                        ) : (
                            filteredItems.map((it, idx) => {
                                const groupId = it.group_id || '';
                                const badgeColor = groupId.startsWith('B1') 
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' 
                                    : groupId.startsWith('B2') 
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' 
                                    : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300';

                                return (
                                    <tr key={it.group_id} className="hover:bg-purple-50/40 dark:hover:bg-slate-700/40 transition">
                                        <td className="px-4 py-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                                <span>{it.group_name}</span>
                                                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${badgeColor}`}>
                                                    {it.group_id}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                                            {Number(it.tong_so_bn || 0).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-blue-600 dark:text-blue-400">
                                            {Number(it.tong_so_ca || 0).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                                            {Number(it.ca_bhyt || 0).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-amber-600">
                                            {Number(it.ca_dichvu || 0).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-right font-black text-purple-600 dark:text-purple-400 text-sm">
                                            {Number(it.tong_thanh_tien || 0).toLocaleString('vi-VN')} <span className="text-[11px] font-normal text-slate-400">đ</span>
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
                                TỔNG CỘNG ({filteredItems.length} nhóm kỹ thuật)
                            </td>
                            <td className="px-4 py-3.5 text-right text-slate-700 dark:text-slate-200">
                                {totals.tong_so_bn.toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 text-right font-black text-blue-600 dark:text-blue-300 text-sm">
                                {totals.tong_so_ca.toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 text-right text-emerald-600 dark:text-emerald-300">
                                {totals.ca_bhyt.toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 text-right text-amber-600 dark:text-amber-300">
                                {totals.ca_dichvu.toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 text-right font-black text-purple-600 dark:text-purple-300 text-base">
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
