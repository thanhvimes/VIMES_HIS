
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    SearchIcon, PlusIcon, RefreshIcon, SwitchHorizontalIcon, 
    EyeIcon, PrinterIcon, BuildingOfficeIcon, CalendarIcon,
    ArrowRightIcon, CheckCircleIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { mockTransfers, mockWarehouses } from '../data';
import { formatDate } from '../../../utils/formatters';

const TransferListView: React.FC = () => {
    const { fontSettings } = useTheme();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const filteredTransfers = useMemo(() => {
        return mockTransfers.filter(t => 
            (statusFilter === 'All' || t.status === statusFilter) &&
            (t.transferNo.includes(searchTerm) || t.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [searchTerm, statusFilter]);

    return (
        <div className="h-full flex flex-col gap-4 animate-fade-in">
            {/* Header & Quick Stats */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                        <div className="p-2 bg-blue-600 text-white rounded-lg shadow-lg shadow-blue-500/20">
                            <SwitchHorizontalIcon className="w-6 h-6"/>
                        </div>
                        Điều chuyển nội bộ
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Quản lý luân chuyển thuốc giữa các kho và tủ trực</p>
                </div>
                
                <div className="flex gap-3">
                    <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-xl border border-blue-100 dark:border-blue-800 flex flex-col items-end">
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Đang điều chuyển</span>
                        <span className="text-lg font-black text-blue-700 dark:text-blue-300">5 phiếu</span>
                    </div>
                    <button 
                        onClick={() => navigate('/pharmacy/transfer/new')}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/30 flex items-center gap-2 transition active:scale-95"
                    >
                        <PlusIcon className="w-4 h-4"/> Lập phiếu
                    </button>
                </div>
            </div>

            {/* Filter Card */}
            <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-3 items-center">
                <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
                    <input 
                        type="text" 
                        placeholder="Tìm theo mã phiếu, nội dung điều chuyển..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className={`w-full pl-9 p-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none ${fontSettings.controls}`} 
                    />
                </div>
                <div className="flex gap-2 shrink-0">
                    <select 
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="p-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-sm font-bold outline-none"
                    >
                        <option value="All">Tất cả trạng thái</option>
                        <option value="O">Phiếu nháp</option>
                        <option value="A">Đã hoàn tất</option>
                    </select>
                    <button className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-500 transition hover:bg-slate-200"><RefreshIcon className="w-5 h-5"/></button>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className={`w-full text-left border-collapse ${fontSettings.listSecondary}`}>
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 sticky top-0 z-10 text-[10px] font-black uppercase tracking-widest">
                            <tr>
                                <th className="p-4 w-12 text-center">STT</th>
                                <th className="p-4">Mã Phiếu</th>
                                <th className="p-4">Ngày yêu cầu</th>
                                <th className="p-4">Từ Kho → Đến Kho</th>
                                <th className="p-4">Người giao / Nhận</th>
                                <th className="p-4 text-right">Tổng tiền</th>
                                <th className="p-4 text-center">Trạng thái</th>
                                <th className="p-4 text-center">Tác vụ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredTransfers.map((t, idx) => (
                                <tr key={t.id} className="hover:bg-blue-50/50 dark:hover:bg-slate-700/30 transition-colors group cursor-pointer" onClick={() => navigate(`/pharmacy/transfer/edit/${t.id}`)}>
                                    <td className="p-4 text-center text-slate-400 font-mono text-xs">{idx + 1}</td>
                                    <td className="p-4">
                                        <div className="font-bold text-blue-600 dark:text-blue-400 text-base">{t.transferNo}</div>
                                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                            <CalendarIcon className="w-3 h-3"/> {formatDate(t.date)}
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-600 dark:text-slate-300 text-sm">
                                        {formatDate(t.date)}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-700 dark:text-slate-200">{t.fromWarehouse}</span>
                                            <ArrowRightIcon className="w-3 h-3 text-slate-400"/>
                                            <span className="font-bold text-teal-600 dark:text-teal-400">{t.toWarehouse}</span>
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-1 italic line-clamp-1">{t.description}</div>
                                    </td>
                                    <td className="p-4 text-xs text-slate-600 dark:text-slate-400">
                                        <div>Giao: <span className="font-medium text-slate-800 dark:text-slate-200">{t.deliverer}</span></div>
                                        <div>Nhận: <span className="font-medium text-slate-800 dark:text-slate-200">{t.receiver}</span></div>
                                    </td>
                                    <td className="p-4 text-right font-black text-slate-800 dark:text-white">
                                        {t.totalAmount.toLocaleString()}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border shadow-sm ${t.status === 'A' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                                            {t.status === 'A' ? 'Hoàn tất' : 'Nháp'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl text-blue-600 border border-transparent hover:border-slate-200 transition"><EyeIcon className="w-4 h-4"/></button>
                                            <button className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl text-slate-600 border border-transparent hover:border-slate-200 transition"><PrinterIcon className="w-4 h-4"/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TransferListView;
