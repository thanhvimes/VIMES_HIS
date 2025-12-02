
import React, { useState, useMemo } from 'react';
import { SearchIcon, CheckIcon } from '../../../../components/Icons';
import { useTheme } from '../../../../contexts/ThemeContext';

export interface BillingItem {
    id: string;
    name: string;
    category: string; // Nhóm: Xét nghiệm, CĐHA, Thuốc...
    unit: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    insurancePaid: number;
    patientPaid: number;
    date: string;
    status: 'paid' | 'unpaid' | 'pending';
}

interface BillingItemsTableProps {
    items: BillingItem[];
}

const BillingItemsTable: React.FC<BillingItemsTableProps> = ({ items }) => {
    const { fontSettings } = useTheme();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Grouping and Filtering Logic
    const groupedData = useMemo(() => {
        const filtered = items.filter(item => {
            const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchStatus = statusFilter === 'all' || item.status === statusFilter;
            return matchSearch && matchStatus;
        });

        const groups: Record<string, BillingItem[]> = {};
        filtered.forEach(item => {
            if (!groups[item.category]) groups[item.category] = [];
            groups[item.category].push(item);
        });

        return groups;
    }, [items, searchTerm, statusFilter]);

    const formatCurrency = (val: number) => val.toLocaleString('vi-VN');

    return (
        <div className="h-full flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            
            {/* 1. Toolbar */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row justify-between items-center gap-3">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white whitespace-nowrap">Chi tiết Chi phí KCB</h3>
                
                <div className="flex gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                        <input 
                            type="text" 
                            placeholder="Tìm dịch vụ, thuốc..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className={`w-full pl-9 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 ${fontSettings.controls}`}
                        />
                    </div>
                    <div className="relative">
                         <select 
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className={`pl-3 pr-8 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 ${fontSettings.controls}`}
                        >
                            <option value="all">Tất cả</option>
                            <option value="unpaid">Chưa thanh toán</option>
                            <option value="paid">Đã thanh toán</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* 2. Table Content */}
            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className={`w-full text-left border-collapse ${fontSettings.listSecondary}`}>
                    <thead className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-bold uppercase text-xs sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="p-3 w-12 text-center">#</th>
                            <th className="p-3">Tên dịch vụ / Thuốc</th>
                            <th className="p-3 w-20 text-center">ĐVT</th>
                            <th className="p-3 w-20 text-center">SL</th>
                            <th className="p-3 w-28 text-right">Đơn giá</th>
                            <th className="p-3 w-32 text-right">Thành tiền</th>
                            <th className="p-3 w-32 text-right">BHYT Trả</th>
                            <th className="p-3 w-32 text-right">BN Trả</th>
                            <th className="p-3 w-24 text-center">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {Object.keys(groupedData).length === 0 ? (
                            <tr>
                                <td colSpan={9} className="p-10 text-center text-slate-400 italic">Không có dữ liệu chi phí.</td>
                            </tr>
                        ) : (
                            Object.entries(groupedData).map(([category, groupItems]: [string, BillingItem[]]) => (
                                <React.Fragment key={category}>
                                    {/* Group Header */}
                                    <tr className="bg-blue-50 dark:bg-blue-900/20">
                                        <td colSpan={9} className="p-2 px-4 font-bold text-blue-800 dark:text-blue-300 text-sm border-y border-blue-100 dark:border-blue-800">
                                            {category} <span className="font-normal text-slate-500 ml-2">({groupItems.length} mục)</span>
                                        </td>
                                    </tr>
                                    {/* Items */}
                                    {groupItems.map((item, idx) => (
                                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                                            <td className="p-3 text-center text-slate-400 text-xs">{idx + 1}</td>
                                            <td className="p-3">
                                                <div className="font-medium text-slate-800 dark:text-slate-200">{item.name}</div>
                                                <div className="text-[10px] text-slate-400">{item.date}</div>
                                            </td>
                                            <td className="p-3 text-center text-slate-600 dark:text-slate-400">{item.unit}</td>
                                            <td className="p-3 text-center font-semibold">{item.quantity}</td>
                                            <td className="p-3 text-right text-slate-600 dark:text-slate-400">{formatCurrency(item.unitPrice)}</td>
                                            <td className="p-3 text-right font-bold text-slate-800 dark:text-slate-100">{formatCurrency(item.totalPrice)}</td>
                                            <td className="p-3 text-right text-blue-600 dark:text-blue-400">{formatCurrency(item.insurancePaid)}</td>
                                            <td className="p-3 text-right font-bold text-red-600 dark:text-red-400">{formatCurrency(item.patientPaid)}</td>
                                            <td className="p-3 text-center">
                                                {item.status === 'paid' ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">
                                                        <CheckIcon className="w-3 h-3"/> Đã TT
                                                    </span>
                                                ) : item.status === 'unpaid' ? (
                                                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                                                        Chưa TT
                                                    </span>
                                                ) : (
                                                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">
                                                        Chờ duyệt
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BillingItemsTable;
