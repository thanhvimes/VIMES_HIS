
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    SearchIcon, PlusIcon, RefreshIcon, ClipboardListIcon,
    CheckCircleIcon, ClockIcon, XCircleIcon, UserGroupIcon,
    BuildingOfficeIcon, CalendarIcon, EyeIcon, PrinterIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { mockRequisitions } from '../data';
import { formatCurrency, formatDate } from '../../../utils/formatters';

const RequisitionListView: React.FC = () => {
    const { fontSettings } = useTheme();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const filteredReqs = useMemo(() => {
        return mockRequisitions.filter(r => 
            (statusFilter === 'All' || r.status === statusFilter) &&
            (r.reqNo.includes(searchTerm) || r.requester.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [searchTerm, statusFilter]);

    return (
        <div className="h-full flex flex-col gap-4 animate-fade-in">
            {/* 1. Header & Quick Stats */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                        <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-lg shadow-indigo-500/20">
                            <ClipboardListIcon className="w-6 h-6"/>
                        </div>
                        Dự trù & Lĩnh thuốc
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Quản lý nhu cầu cấp phát thuốc cho các khoa phòng</p>
                </div>
                
                <div className="flex gap-3">
                    <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-xl border border-blue-100 dark:border-blue-800 flex flex-col items-end">
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Tổng dự trù</span>
                        <span className="text-lg font-black text-blue-700 dark:text-blue-300">12 ca</span>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-xl border border-emerald-100 dark:border-emerald-800 flex flex-col items-end">
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Đã duyệt</span>
                        <span className="text-lg font-black text-emerald-700 dark:text-emerald-300">8 phiếu</span>
                    </div>
                </div>
            </div>

            {/* 2. Filter Toolbar (Styled as a Card) */}
            <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-3 items-center">
                <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
                    <input 
                        type="text" 
                        placeholder="Tìm theo mã phiếu, khoa lĩnh, nhân viên..." 
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
                        <option value="Pending">Chờ duyệt</option>
                        <option value="Approved">Đã duyệt</option>
                    </select>
                    <button 
                        onClick={() => navigate('/pharmacy/requisition/new')}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/30 flex items-center gap-2 transition active:scale-95"
                    >
                        <PlusIcon className="w-4 h-4"/> Lập phiếu
                    </button>
                </div>
            </div>

            {/* 3. Main List Style (Modern Table with Card-like Rows) */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className={`w-full text-left border-collapse ${fontSettings.listSecondary}`}>
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 sticky top-0 z-10 text-[10px] font-black uppercase tracking-widest">
                            <tr>
                                <th className="p-4 w-12 text-center">STT</th>
                                <th className="p-4">Số Phiếu</th>
                                <th className="p-4">Thông tin Khoa lĩnh</th>
                                <th className="p-4">Nhân sự thực hiện</th>
                                <th className="p-4 text-right">Tổng cộng</th>
                                <th className="p-4 text-center">Trạng thái</th>
                                <th className="p-4 text-center">Tác vụ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredReqs.map((req, idx) => (
                                <tr key={req.id} className="hover:bg-blue-50/50 dark:hover:bg-slate-700/30 transition-colors group cursor-pointer" onClick={() => navigate(`/pharmacy/requisition/edit/${req.id}`)}>
                                    <td className="p-4 text-center text-slate-400 font-mono text-xs">{idx + 1}</td>
                                    <td className="p-4">
                                        <div className="font-bold text-blue-600 dark:text-blue-400 text-base">{req.reqNo}</div>
                                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 uppercase font-bold">
                                            <CalendarIcon className="w-3 h-3"/> {formatDate(req.date)}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                            <BuildingOfficeIcon className="w-4 h-4 text-indigo-500"/>
                                            {req.fromWarehouse}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5">Nguồn cấp: {req.toWarehouse}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                                                {req.requester.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-700 dark:text-slate-200 text-xs">{req.requester}</div>
                                                <div className="text-[10px] text-slate-400 uppercase tracking-tighter">Bác sĩ chỉ định</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="font-black text-slate-800 dark:text-white text-base">
                                            {formatCurrency(req.totalAmount).replace(' đ','')}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">VNĐ</div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border shadow-sm ${req.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                            {req.status === 'Approved' ? 'Đã duyệt' : 'Chờ duyệt'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                                            <button className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl text-blue-600 shadow-sm border border-transparent hover:border-slate-200 transition"><EyeIcon className="w-4 h-4"/></button>
                                            <button className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl text-slate-600 shadow-sm border border-transparent hover:border-slate-200 transition"><PrinterIcon className="w-4 h-4"/></button>
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

export default RequisitionListView;
