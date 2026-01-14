import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    SearchIcon, PlusIcon, FilterIcon, CalendarIcon, 
    RefreshIcon, EyeIcon, PrinterIcon, DocumentPlusIcon,
    ChevronDownIcon, BuildingOfficeIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { mockMiscVouchers, mockWarehouses } from '../data';
import { formatCurrency, formatDate } from '../../../utils/formatters';

const MiscVoucherListView: React.FC = () => {
    const { fontSettings } = useTheme();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const filtered = useMemo(() => {
        return mockMiscVouchers.filter(v => 
            (statusFilter === 'All' || v.status === statusFilter) &&
            (v.voucherNo.includes(searchTerm) || v.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [searchTerm, statusFilter]);

    return (
        <div className="h-full flex flex-col gap-4 animate-fade-in">
            {/* Header & Stats */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                        <div className="p-2 bg-slate-600 text-white rounded-lg shadow-lg">
                            <DocumentPlusIcon className="w-6 h-6"/>
                        </div>
                        Nhập - Xuất khác
                    </h1>
                    <p className="text-slate-500 text-sm mt-1 font-medium italic">Điều chỉnh tồn kho, hàng tặng, vay mượn nội bộ...</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => navigate('/pharmacy/misc-voucher/new')}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/30 flex items-center gap-2 transition active:scale-95"
                    >
                        <PlusIcon className="w-4 h-4"/> Lập phiếu mới
                    </button>
                </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 items-end">
                    <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Tìm kiếm nhanh</label>
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
                            <input 
                                type="text" 
                                placeholder="Mã phiếu, lý do điều chỉnh..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className={`w-full pl-9 p-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none`} 
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Kho thực hiện</label>
                        <select className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-sm font-bold">
                            <option>--- Tất cả ---</option>
                            {mockWarehouses.map(w => <option key={w.id}>{w.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Từ ngày</label>
                        <input type="date" className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-sm" defaultValue="2023-01-01" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Trạng thái</label>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-sm font-bold">
                            <option value="All">Tất cả</option>
                            <option value="O">Mới tạo (O)</option>
                            <option value="A">Đã duyệt (A)</option>
                        </select>
                    </div>
                    <button className="p-2.5 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-500 hover:bg-slate-200 transition"><RefreshIcon className="w-5 h-5"/></button>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className={`w-full text-left border-collapse ${fontSettings.listPrimary}`}>
                        <thead className="bg-[#f8fafc] dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 sticky top-0 z-10 text-[10px] font-black uppercase tracking-widest">
                            <tr>
                                <th className="p-4 w-12 text-center">STT</th>
                                <th className="p-4">Mã Phiếu</th>
                                <th className="p-4">Ngày / Loại</th>
                                <th className="p-4">Kho hàng</th>
                                <th className="p-4">Diễn giải / Lý do</th>
                                <th className="p-4 text-right">Giá trị</th>
                                <th className="p-4 text-center">Trạng thái</th>
                                <th className="p-4 text-center w-24">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filtered.map((v, idx) => (
                                <tr key={v.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors group cursor-pointer" onClick={() => navigate(`/pharmacy/misc-voucher/edit/${v.id}`)}>
                                    <td className="p-4 text-center text-slate-400 font-mono text-xs">{idx + 1}</td>
                                    <td className="p-4">
                                        <div className="font-bold text-blue-600 dark:text-blue-400 text-base">{v.voucherNo}</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">{v.issueDate || '--'}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-slate-600 dark:text-slate-300 font-medium">{formatDate(v.date)}</div>
                                        <span className="text-[10px] font-black px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100 uppercase">{v.type}</span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
                                            <BuildingOfficeIcon className="w-4 h-4 text-slate-400"/>
                                            {v.warehouse}
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-500 italic text-sm line-clamp-2 max-w-xs">{v.description}</td>
                                    <td className="p-4 text-right font-black text-slate-800 dark:text-white text-base">
                                        {formatCurrency(v.totalAmount).replace(' đ','')}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border transition-all ${v.status === 'A' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                                            {v.status === 'A' ? 'Hoàn tất' : 'Phiếu nháp'}
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

export default MiscVoucherListView;