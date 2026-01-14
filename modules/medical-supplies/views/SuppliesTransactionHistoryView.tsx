
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    PlusIcon, RefreshIcon, EyeIcon, PrinterIcon, TruckIcon, DownloadIcon, ArrowUpTrayIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { mockSupplyVouchers } from '../data';
import { formatCurrency, formatDate } from '../../../utils/formatters';

const SuppliesTransactionHistoryView: React.FC = () => {
    const { fontSettings } = useTheme();
    const navigate = useNavigate();

    return (
        <div className="h-full flex flex-col gap-4 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                        <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-lg">
                            <TruckIcon className="w-6 h-6"/>
                        </div>
                        Nhập - Xuất vật tư y tế
                    </h1>
                    <p className="text-slate-500 text-sm mt-1 font-medium">Lịch sử luân chuyển vật tư tiêu hao toàn viện.</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => navigate('/medical-supplies/receipt/new')}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 transition active:scale-95"
                    >
                        <PlusIcon className="w-4 h-4"/> Lập phiếu nhập
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className={`w-full text-left border-collapse ${fontSettings.listPrimary}`}>
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 sticky top-0 z-10 text-[10px] font-black uppercase tracking-widest">
                            <tr>
                                <th className="p-4 w-12 text-center">STT</th>
                                <th className="p-4">Số Phiếu</th>
                                <th className="p-4">Ngày thực hiện</th>
                                <th className="p-4">Đối tác / Đơn vị</th>
                                <th className="p-4">Kho hàng</th>
                                <th className="p-4 text-right">Tổng cộng</th>
                                <th className="p-4 text-center">Trạng thái</th>
                                <th className="p-4 text-center">Tác vụ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {mockSupplyVouchers.map((v, idx) => {
                                const isImport = v.voucherNo.startsWith('NK');
                                return (
                                    <tr key={v.id} className="hover:bg-indigo-50/50 dark:hover:bg-slate-700/30 transition-colors group cursor-pointer">
                                        <td className="p-4 text-center text-slate-400 font-mono text-xs">{idx + 1}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1.5 rounded-lg ${isImport ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                                                    {isImport ? <DownloadIcon className="w-3.5 h-3.5"/> : <ArrowUpTrayIcon className="w-3.5 h-3.5"/>}
                                                </div>
                                                <span className="font-bold text-slate-700 dark:text-slate-200">{v.voucherNo}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-600 dark:text-slate-400 text-sm">
                                            {formatDate(v.date)}
                                        </td>
                                        <td className="p-4 font-bold text-slate-800 dark:text-white">
                                            {v.supplier}
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                                            {v.warehouse}
                                        </td>
                                        <td className={`p-4 text-right font-black text-base ${isImport ? 'text-indigo-600' : 'text-slate-700 dark:text-slate-200'}`}>
                                            {v.total.toLocaleString()}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border transition-all ${v.status === 'A' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
                                                {v.status === 'A' ? 'Đã duyệt' : 'Phiếu nháp'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                <button className="p-2 hover:bg-white dark:hover:bg-slate-600 rounded-lg text-blue-600 shadow-sm transition"><EyeIcon className="w-4 h-4"/></button>
                                                <button className="p-2 hover:bg-white dark:hover:bg-slate-600 rounded-lg text-slate-600 shadow-sm transition"><PrinterIcon className="w-4 h-4"/></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SuppliesTransactionHistoryView;
