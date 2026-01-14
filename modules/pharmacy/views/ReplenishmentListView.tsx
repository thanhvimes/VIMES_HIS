import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    SearchIcon, PlusIcon, RefreshIcon, EyeIcon, PrinterIcon, 
    BuildingOfficeIcon, CalendarIcon, ArchiveIcon, ClockIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { mockReplenishments, mockWarehouses } from '../data';
import { formatCurrency, formatDate } from '../../../utils/formatters';

const ReplenishmentListView: React.FC = () => {
    const { fontSettings } = useTheme();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const filtered = useMemo(() => {
        return mockReplenishments.filter(r => 
            (statusFilter === 'All' || r.status === statusFilter) &&
            (r.voucherNo.includes(searchTerm) || r.toCabinet.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [searchTerm, statusFilter]);

    return (
        <div className="h-full flex flex-col gap-4 animate-fade-in">
            {/* Header & Stats */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                        <div className="p-2 bg-pink-600 text-white rounded-lg shadow-lg">
                            <ArchiveIcon className="w-6 h-6"/>
                        </div>
                        Bổ sung tủ trực
                    </h1>
                    <p className="text-slate-500 text-sm mt-1 font-medium italic">Xuất kho cấp bổ sung định kỳ cho các tủ trực khoa lâm sàng</p>
                </div>
                
                <div className="flex gap-3">
                    <button 
                        onClick={() => navigate('/pharmacy/replenishment/new')}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 transition active:scale-95"
                    >
                        <PlusIcon className="w-4 h-4"/> Lập phiếu mới
                    </button>
                </div>
            </div>

            {/* Horizontal Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 items-end">
                    <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Tìm kiếm phiếu</label>
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
                            <input 
                                type="text" 
                                placeholder="Số hóa đơn, tên tủ trực..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className={`w-full pl-9 p-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none`} 
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Từ kho</label>
                        <select className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-sm font-bold">
                            <option>--- Tất cả ---</option>
                            {mockWarehouses.filter(w => w.type !== 'Tủ trực').map(w => <option key={w.id}>{w.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Tủ trực nhận</label>
                        <select className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-sm font-bold">
                            <option>--- Tất cả ---</option>
                            {mockWarehouses.filter(w => w.type === 'Tủ trực').map(w => <option key={w.id}>{w.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Trạng thái</label>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-sm font-bold">
                            <option value="All">Tất cả</option>
                            <option value="O">Chờ cấp (O)</option>
                            <option value="A">Đã cấp (A)</option>
                        </select>
                    </div>
                    <button className="p-2.5 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-500 hover:bg-slate-200 transition"><RefreshIcon className="w-5 h-5"/></button>
                </div>
            </div>

            {/* List Board */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className={`w-full text-left border-collapse ${fontSettings.listPrimary}`}>
                        <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 sticky top-0 z-10 text-[10px] font-black uppercase tracking-widest">
                            <tr>
                                <th className="p-4 w-12 text-center">STT</th>
                                <th className="p-4">Số Hóa Đơn</th>
                                <th className="p-4">Ngày yêu cầu</th>
                                <th className="p-4">Từ Kho → Đến Tủ</th>
                                <th className="p-4 text-right">Tổng cộng</th>
                                <th className="p-4 text-center">Trạng thái</th>
                                <th className="p-4 text-center w-24">Tác vụ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filtered.map((r, idx) => (
                                <tr key={r.id} className="hover:bg-blue-50/50 dark:hover:bg-slate-700/30 transition-colors group cursor-pointer" onClick={() => navigate(`/pharmacy/replenishment/edit/${r.id}`)}>
                                    <td className="p-4 text-center text-slate-400 font-mono text-xs">{idx + 1}</td>
                                    <td className="p-4">
                                        <div className="font-bold text-pink-600 dark:text-pink-400 text-base">{r.voucherNo}</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">{r.issueDate || '--'}</div>
                                    </td>
                                    <td className="p-4 text-slate-600 dark:text-slate-300 font-medium">
                                        <div className="flex items-center gap-1.5">
                                            <CalendarIcon className="w-4 h-4 text-slate-400"/>
                                            {formatDate(r.date)}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <BuildingOfficeIcon className="w-3 h-3"/> {r.fromWarehouse}
                                            </div>
                                            <div className="flex items-center gap-2 font-black text-slate-800 dark:text-white">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> {r.toCabinet}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right font-black text-slate-800 dark:text-white text-base">
                                        {formatCurrency(r.totalAmount).replace(' đ','')}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border transition-all ${r.status === 'A' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
                                            {r.status === 'A' ? 'Đã cấp phát' : 'Chờ lấy hàng'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl text-blue-600 border border-transparent hover:border-slate-200 transition shadow-sm"><EyeIcon className="w-4 h-4"/></button>
                                            <button className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl text-slate-600 border border-transparent hover:border-slate-200 transition shadow-sm"><PrinterIcon className="w-4 h-4"/></button>
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

export default ReplenishmentListView;