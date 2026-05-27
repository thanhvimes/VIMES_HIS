
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    SearchIcon, PlusIcon, FilterIcon, CalendarIcon,
    PrinterIcon, EyeIcon, RefreshIcon, TruckIcon,
    DownloadIcon, ArrowUpTrayIcon, CurrencyDollarIcon,
    DocumentTextIcon, ChevronDownIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { FormDateInput } from '../../../components/ui/forms';
import { mockVouchers, mockWarehouses } from '../data';
import { formatCurrency, formatDate } from '../../../utils/formatters';

const TransactionHistoryView: React.FC = () => {
    const { fontSettings } = useTheme();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [fromDate, setFromDate] = useState('2023-11-18');
    const [toDate, setToDate] = useState('2023-12-18');
    const [typeFilter, setTypeFilter] = useState<'All' | 'Import' | 'Export'>('All');

    const filteredVouchers = useMemo(() => {
        return mockVouchers.filter(v => {
            const matchesSearch = v.invoiceNo.includes(searchTerm) ||
                v.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                v.voucherNo.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesType = typeFilter === 'All' || (typeFilter === 'Import' && v.voucherNo.startsWith('PN')) || (typeFilter === 'Export' && v.voucherNo.startsWith('PX'));

            return matchesSearch && matchesType;
        });
    }, [searchTerm, typeFilter]);

    // Thống kê nhanh
    const summary = useMemo(() => {
        return filteredVouchers.reduce((acc, curr) => {
            acc.total += curr.total;
            if (curr.voucherNo.startsWith('PN')) acc.importCount++;
            else acc.exportCount++;
            return acc;
        }, { total: 0, importCount: 0, exportCount: 0 });
    }, [filteredVouchers]);

    return (
        <div className="h-full flex flex-col gap-5 animate-fade-in">

            {/* 1. SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border-l-4 border-blue-500 flex justify-between items-center transition-transform hover:scale-[1.02]">
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tổng giá trị giao dịch</p>
                        <p className="text-xl font-black text-slate-800 dark:text-white mt-1">{formatCurrency(summary.total)}</p>
                    </div>
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600"><CurrencyDollarIcon className="w-6 h-6" /></div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border-l-4 border-emerald-500 flex justify-between items-center transition-transform hover:scale-[1.02]">
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Phiếu nhập kho</p>
                        <p className="text-xl font-black text-emerald-600 mt-1">{summary.importCount} <span className="text-xs font-normal text-slate-400">phiếu</span></p>
                    </div>
                    {/* // Fixed missing ArrowDownTrayIcon export by using DownloadIcon */}
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600"><DownloadIcon className="w-6 h-6" /></div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border-l-4 border-orange-500 flex justify-between items-center transition-transform hover:scale-[1.02]">
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Phiếu xuất kho</p>
                        <p className="text-xl font-black text-orange-600 mt-1">{summary.exportCount} <span className="text-xs font-normal text-slate-400">phiếu</span></p>
                    </div>
                    <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg text-orange-600"><ArrowUpTrayIcon className="w-6 h-6" /></div>
                </div>
            </div>

            {/* 2. FILTER & TOOLBAR */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-4">
                <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        {/* Loại phiếu tab */}
                        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                            {['All', 'Import', 'Export'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setTypeFilter(t as any)}
                                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${typeFilter === t ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500'}`}
                                >
                                    {t === 'All' ? 'Tất cả' : t === 'Import' ? 'Nhập kho' : 'Xuất kho'}
                                </button>
                            ))}
                        </div>

                        <div className="relative flex-1 min-w-[250px]">
                            <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm số phiếu, HĐ, nhà cung cấp..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className={`w-full pl-9 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 text-sm ${fontSettings.controls}`}
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 w-full lg:w-auto shrink-0">
                        <button
                            onClick={() => navigate('/pharmacy/receipt/new')}
                            className="flex-1 lg:flex-none px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition active:scale-95"
                        >
                            <PlusIcon className="w-5 h-5" /> Lập phiếu mới
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 items-center pt-2 border-t border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Kho hàng:</label>
                        <select className="p-1.5 border-none bg-transparent font-bold text-sm text-slate-700 dark:text-slate-200 outline-none cursor-pointer">
                            <option>Tất cả kho</option>
                            {mockWarehouses.map(w => <option key={w.id}>{w.name}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Từ ngày:</label>
                        <FormDateInput value={fromDate} onChange={e => setFromDate(e.target.value)} className="bg-transparent border-none text-sm font-bold text-slate-700 dark:text-slate-200 outline-none w-28" />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Đến ngày:</label>
                        <FormDateInput value={toDate} onChange={e => setToDate(e.target.value)} className="bg-transparent border-none text-sm font-bold text-slate-700 dark:text-slate-200 outline-none w-28" />
                    </div>
                </div>
            </div>

            {/* 3. DATA TABLE */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className={`w-full text-left border-collapse ${fontSettings.listPrimary}`}>
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 sticky top-0 z-10 uppercase text-[10px] font-black tracking-widest">
                            <tr>
                                <th className="p-4 w-12 text-center">STT</th>
                                <th className="p-4">Mã Phiếu</th>
                                <th className="p-4">Số Hóa Đơn</th>
                                <th className="p-4">Đối tác / Kho</th>
                                <th className="p-4 text-center">Ngày thực hiện</th>
                                <th className="p-4 text-right">Giá trị (VNĐ)</th>
                                <th className="p-4 text-center">Trạng thái</th>
                                <th className="p-4 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {filteredVouchers.length === 0 ? (
                                <tr><td colSpan={8} className="p-20 text-center text-slate-400 italic">Không có giao dịch nào phù hợp với bộ lọc.</td></tr>
                            ) : (
                                filteredVouchers.map((v, idx) => {
                                    const isImport = v.voucherNo.startsWith('PN');
                                    return (
                                        <tr key={v.id} className="hover:bg-blue-50/50 dark:hover:bg-slate-700/30 transition-colors group cursor-pointer" onClick={() => navigate(`/pharmacy/receipt/edit/${v.id}`)}>
                                            <td className="p-4 text-center text-slate-400 font-mono text-xs">{idx + 1}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    {/* // Fixed missing ArrowDownTrayIcon export by using DownloadIcon for imports */}
                                                    <div className={`p-1.5 rounded-lg ${isImport ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                                                        {isImport ? <DownloadIcon className="w-3.5 h-3.5" /> : <ArrowUpTrayIcon className="w-3.5 h-3.5" />}
                                                    </div>
                                                    <span className="font-bold text-slate-700 dark:text-slate-200">{v.voucherNo}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 font-mono text-slate-500 text-sm">{v.invoiceNo || '---'}</td>
                                            <td className="p-4">
                                                <div className="font-bold text-slate-800 dark:text-white line-clamp-1">{v.supplier}</div>
                                                <div className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">{v.warehouse}</div>
                                            </td>
                                            <td className="p-4 text-center text-slate-600 dark:text-slate-400">
                                                <div className="text-sm font-medium">{formatDate(v.date)}</div>
                                                <div className="text-[10px] opacity-60">10:30 AM</div>
                                            </td>
                                            <td className={`p-4 text-right font-black text-base ${isImport ? 'text-blue-600' : 'text-slate-700 dark:text-slate-200'}`}>
                                                {formatCurrency(v.total).replace(' đ', '')}
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border transition-all ${v.status === 'A' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
                                                    {v.status === 'A' ? 'Đã duyệt' : 'Phiếu nháp'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                    <button className="p-2 hover:bg-white dark:hover:bg-slate-600 rounded-lg text-blue-600 shadow-sm transition"><EyeIcon className="w-4 h-4" /></button>
                                                    <button className="p-2 hover:bg-white dark:hover:bg-slate-600 rounded-lg text-slate-600 shadow-sm transition"><PrinterIcon className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 4. FOOTER SUMMARY */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0">
                    <div className="text-xs font-bold text-slate-500">
                        HIỂN THỊ <span className="text-slate-800 dark:text-white">{filteredVouchers.length}</span> GIAO DỊCH TRÊN TRANG
                    </div>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Tổng nhập:</span>
                            <span className="text-sm font-black text-emerald-600">{formatCurrency(summary.total)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransactionHistoryView;
