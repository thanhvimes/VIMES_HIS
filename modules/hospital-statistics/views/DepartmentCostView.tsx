// ==================== DEPARTMENT COST VIEW ====================
// File: modules/hospital-statistics/views/DepartmentCostView.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { CommonFilter, PrintReportHeader, PrintReportFooter, exportTableToExcel, formatLocalDate, getStartOfMonthLocalDate } from '../components/CommonFilter';
import { statisticsService } from '../services/statisticsService';
import { DepartmentCostItem } from '../types';

type SortField = keyof DepartmentCostItem;

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

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await statisticsService.getDepartmentCostStatistics(fromDate, toDate);
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

    const filteredItems = useMemo(() => {
        let result = items;

        if (hideEmpty) {
            result = result.filter(it => Number(it.tong_cong_chi_phi || 0) > 0);
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
            if (sortField !== 'dept_name' && sortField !== 'dept_id') {
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

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortAsc(!sortAsc);
        } else {
            setSortField(field);
            setSortAsc(false);
        }
    };

    const fmtMoney = (val?: number | string) => {
        const num = Number(val || 0);
        if (num === 0) return '-';
        return num.toLocaleString('vi-VN');
    };

    const handleExport = () => {
        const rows = filteredItems.map((it, idx) => ({
            'STT': idx + 1,
            'Mã Khoa': it.dept_id,
            'Khoa Phòng': it.dept_name,
            'Lượt BN': Number(it.tong_luot_bn || 0),
            'Tiền Khám': Number(it.tien_kham || 0),
            'Tiền Giường': Number(it.tien_giuong || 0),
            'Xét Nghiệm': Number(it.tien_xet_nghiem || 0),
            'CĐHA': Number(it.tien_cdha || 0),
            'TDCN': Number(it.tien_tdcn || 0),
            'PTTT': Number(it.tien_pttt || 0),
            'Tiền Thuốc': Number(it.tien_thuoc || 0),
            'Tiền Máu': Number(it.tien_mau || 0),
            'VTYT': Number(it.tien_vtyt || 0),
            'Chi Phí Khác': Number(it.tien_khac || 0),
            'Tổng Chi Phí': Number(it.tong_cong_chi_phi || 0),
            'BHYT Chi Trả': Number(it.bhyt_thanh_toan || 0),
            'Bệnh Nhân Trả': Number(it.benh_nhan_tra || 0)
        }));
        rows.push({
            'STT': 'TỔNG CỘNG',
            'Mã Khoa': '',
            'Khoa Phòng': `${filteredItems.length} khoa phòng`,
            'Lượt BN': totals.tong_luot_bn,
            'Tiền Khám': totals.tien_kham,
            'Tiền Giường': totals.tien_giuong,
            'Xét Nghiệm': totals.tien_xet_nghiem,
            'CĐHA': totals.tien_cdha,
            'TDCN': totals.tien_tdcn,
            'PTTT': totals.tien_pttt,
            'Tiền Thuốc': totals.tien_thuoc,
            'Tiền Máu': totals.tien_mau,
            'VTYT': totals.tien_vtyt,
            'Chi Phí Khác': totals.tien_khac,
            'Tổng Chi Phí': totals.tong_cong_chi_phi,
            'BHYT Chi Trả': totals.bhyt_thanh_toan,
            'Bệnh Nhân Trả': totals.benh_nhan_tra
        });
        exportTableToExcel(rows, 'Tong_Hop_Chi_Phi_Khoa_Phong', 'Tổng Hợp Chi Phí');
    };

    return (
        <div className="space-y-6">
            <div className="print:hidden">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Báo cáo Tổng hợp Chi phí theo Khoa phòng</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Bảng ma trận tài chính viện phí và phân bổ nguồn thu chi tiết theo từng bộ phận chuyên môn
                </p>
            </div>

            <PrintReportHeader 
                formCode="Biểu mẫu: 06/BC-CP"
                title="BÁO CÁO TỔNG HỢP CHI PHÍ KHÁM CHỮA BỆNH THEO KHOA PHÒNG"
                subtitle="Bảng phân tích cơ cấu viện phí, bảo hiểm y tế và bệnh nhân cùng chi trả"
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

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-700/80 overflow-x-auto relative max-h-[640px]">
                <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 uppercase font-bold tracking-wider sticky top-0 z-20 shadow-xs">
                        <tr>
                            <th className="px-3 py-3 text-center w-12 sticky left-0 bg-slate-100 dark:bg-slate-700 z-30">STT</th>
                            <th 
                                className="px-3 py-3 min-w-[180px] sticky left-12 bg-slate-100 dark:bg-slate-700 z-30 border-r border-slate-200 dark:border-slate-600 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition"
                                onClick={() => handleSort('dept_name')}
                            >
                                <div className="flex items-center gap-1">
                                    <span>Khoa Phòng</span>
                                    {sortField === 'dept_name' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th 
                                className="px-3 py-3 text-right cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition"
                                onClick={() => handleSort('tong_luot_bn')}
                            >
                                <div className="flex items-center justify-end gap-1">
                                    <span>Lượt BN</span>
                                    {sortField === 'tong_luot_bn' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th className="px-3 py-3 text-right cursor-pointer hover:bg-slate-200" onClick={() => handleSort('tien_kham')}>Tiền Khám</th>
                            <th className="px-3 py-3 text-right cursor-pointer hover:bg-slate-200" onClick={() => handleSort('tien_giuong')}>Tiền Giường</th>
                            <th className="px-3 py-3 text-right cursor-pointer hover:bg-slate-200" onClick={() => handleSort('tien_xet_nghiem')}>Xét Nghiệm</th>
                            <th className="px-3 py-3 text-right cursor-pointer hover:bg-slate-200" onClick={() => handleSort('tien_cdha')}>CĐHA</th>
                            <th className="px-3 py-3 text-right cursor-pointer hover:bg-slate-200" onClick={() => handleSort('tien_tdcn')}>TDCN</th>
                            <th className="px-3 py-3 text-right cursor-pointer hover:bg-slate-200" onClick={() => handleSort('tien_pttt')}>PTTT</th>
                            <th className="px-3 py-3 text-right cursor-pointer hover:bg-slate-200" onClick={() => handleSort('tien_thuoc')}>Tiền Thuốc</th>
                            <th className="px-3 py-3 text-right cursor-pointer hover:bg-slate-200" onClick={() => handleSort('tien_mau')}>Tiền Máu</th>
                            <th className="px-3 py-3 text-right cursor-pointer hover:bg-slate-200" onClick={() => handleSort('tien_vtyt')}>VTYT</th>
                            <th className="px-3 py-3 text-right cursor-pointer hover:bg-slate-200" onClick={() => handleSort('tien_khac')}>Khác</th>
                            <th 
                                className="px-3 py-3 text-right cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition min-w-[140px]"
                                onClick={() => handleSort('tong_cong_chi_phi')}
                            >
                                <div className="flex items-center justify-end gap-1 text-purple-600 dark:text-purple-400 font-black">
                                    <span>Tổng Chi Phí</span>
                                    {sortField === 'tong_cong_chi_phi' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th 
                                className="px-3 py-3 text-right cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition min-w-[130px]"
                                onClick={() => handleSort('bhyt_thanh_toan')}
                            >
                                <div className="flex items-center justify-end gap-1 text-blue-600 font-bold">
                                    <span>BHYT Trả</span>
                                    {sortField === 'bhyt_thanh_toan' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                            <th 
                                className="px-3 py-3 text-right cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition min-w-[130px]"
                                onClick={() => handleSort('benh_nhan_tra')}
                            >
                                <div className="flex items-center justify-end gap-1 text-emerald-600 font-bold">
                                    <span>BN Trả</span>
                                    {sortField === 'benh_nhan_tra' && (<span>{sortAsc ? '▲' : '▼'}</span>)}
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredItems.length === 0 ? (
                            <tr>
                                <td colSpan={16} className="px-3 py-8 text-center text-slate-400 italic">
                                    Không tìm thấy khoa phòng có phát sinh chi phí
                                </td>
                            </tr>
                        ) : (
                            filteredItems.map((it, idx) => (
                                <tr key={it.dept_id} className="hover:bg-purple-50/30 dark:hover:bg-slate-700/40 transition group">
                                    <td className="px-3 py-2.5 text-center text-slate-400 font-medium sticky left-0 bg-white dark:bg-slate-800 group-hover:bg-purple-50/30 dark:group-hover:bg-slate-700 z-10">
                                        {idx + 1}
                                    </td>
                                    <td className="px-3 py-2.5 font-bold text-slate-800 dark:text-slate-100 sticky left-12 bg-white dark:bg-slate-800 group-hover:bg-purple-50/30 dark:group-hover:bg-slate-700 z-10 border-r border-slate-200 dark:border-slate-700">
                                        {it.dept_name}
                                    </td>
                                    <td className="px-3 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200">
                                        {Number(it.tong_luot_bn || 0).toLocaleString()}
                                    </td>
                                    <td className="px-3 py-2.5 text-right text-slate-600 dark:text-slate-300">{fmtMoney(it.tien_kham)}</td>
                                    <td className="px-3 py-2.5 text-right text-slate-600 dark:text-slate-300">{fmtMoney(it.tien_giuong)}</td>
                                    <td className="px-3 py-2.5 text-right text-slate-600 dark:text-slate-300">{fmtMoney(it.tien_xet_nghiem)}</td>
                                    <td className="px-3 py-2.5 text-right text-slate-600 dark:text-slate-300">{fmtMoney(it.tien_cdha)}</td>
                                    <td className="px-3 py-2.5 text-right text-slate-600 dark:text-slate-300">{fmtMoney(it.tien_tdcn)}</td>
                                    <td className="px-3 py-2.5 text-right text-slate-600 dark:text-slate-300">{fmtMoney(it.tien_pttt)}</td>
                                    <td className="px-3 py-2.5 text-right text-slate-600 dark:text-slate-300">{fmtMoney(it.tien_thuoc)}</td>
                                    <td className="px-3 py-2.5 text-right text-slate-600 dark:text-slate-300">{fmtMoney(it.tien_mau)}</td>
                                    <td className="px-3 py-2.5 text-right text-slate-600 dark:text-slate-300">{fmtMoney(it.tien_vtyt)}</td>
                                    <td className="px-3 py-2.5 text-right text-slate-600 dark:text-slate-300">{fmtMoney(it.tien_khac)}</td>
                                    <td className="px-3 py-2.5 text-right font-black text-purple-600 dark:text-purple-400 bg-purple-50/20 dark:bg-purple-900/10">
                                        {fmtMoney(it.tong_cong_chi_phi)}
                                    </td>
                                    <td className="px-3 py-2.5 text-right font-semibold text-blue-600 dark:text-blue-400">
                                        {fmtMoney(it.bhyt_thanh_toan)}
                                    </td>
                                    <td className="px-3 py-2.5 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                                        {fmtMoney(it.benh_nhan_tra)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    {/* Sticky Footer Total Row */}
                    <tfoot className="bg-slate-200 dark:bg-slate-700 font-bold text-slate-900 dark:text-white border-t-2 border-slate-400 dark:border-slate-500 sticky bottom-0 z-30 shadow-md">
                        <tr>
                            <td colSpan={2} className="px-3 py-3 text-center uppercase tracking-wider sticky left-0 bg-slate-200 dark:bg-slate-700 z-40 border-r border-slate-300 dark:border-slate-600">
                                TỔNG CỘNG ({filteredItems.length} KHOA)
                            </td>
                            <td className="px-3 py-3 text-right">{totals.tong_luot_bn.toLocaleString()}</td>
                            <td className="px-3 py-3 text-right">{fmtMoney(totals.tien_kham)}</td>
                            <td className="px-3 py-3 text-right">{fmtMoney(totals.tien_giuong)}</td>
                            <td className="px-3 py-3 text-right">{fmtMoney(totals.tien_xet_nghiem)}</td>
                            <td className="px-3 py-3 text-right">{fmtMoney(totals.tien_cdha)}</td>
                            <td className="px-3 py-3 text-right">{fmtMoney(totals.tien_tdcn)}</td>
                            <td className="px-3 py-3 text-right">{fmtMoney(totals.tien_pttt)}</td>
                            <td className="px-3 py-3 text-right">{fmtMoney(totals.tien_thuoc)}</td>
                            <td className="px-3 py-3 text-right">{fmtMoney(totals.tien_mau)}</td>
                            <td className="px-3 py-3 text-right">{fmtMoney(totals.tien_vtyt)}</td>
                            <td className="px-3 py-3 text-right">{fmtMoney(totals.tien_khac)}</td>
                            <td className="px-3 py-3 text-right font-black text-purple-700 dark:text-purple-300 text-sm">
                                {fmtMoney(totals.tong_cong_chi_phi)}
                            </td>
                            <td className="px-3 py-3 text-right font-bold text-blue-700 dark:text-blue-300 text-sm">
                                {fmtMoney(totals.bhyt_thanh_toan)}
                            </td>
                            <td className="px-3 py-3 text-right font-bold text-emerald-700 dark:text-emerald-300 text-sm">
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
