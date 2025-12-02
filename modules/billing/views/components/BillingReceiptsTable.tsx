
import React, { useState, useMemo } from 'react';
import { 
    PrinterIcon, 
    SearchIcon, 
    FilterIcon, 
    EyeIcon, 
    CalendarIcon,
    ArrowUpTrayIcon, // For Refund/Out
    DownloadIcon, // For Income/In
    CreditCardIcon,
    CashIcon,
    CheckCircleIcon,
    XIcon
} from '../../../../components/Icons';
import { useTheme } from '../../../../contexts/ThemeContext';

export interface Receipt {
    id: string;
    receiptNumber: string;
    date: string; // ISO string YYYY-MM-DD
    time: string;
    type: 'Advance' | 'Payment' | 'Refund' | 'FinalSettlement'; 
    description: string;
    amount: number;
    cashier: string;
    paymentMethod: 'Cash' | 'Transfer' | 'Card';
    status: 'active' | 'cancelled';
}

// Mock Data with more variety
const mockReceipts: Receipt[] = [
    { id: 'R05', receiptNumber: 'PC-231129-002', date: '2023-11-29', time: '14:00', type: 'Refund', description: 'Hoàn trả thuốc', amount: 150000, cashier: 'Nguyễn Thị Thu', paymentMethod: 'Cash', status: 'active' },
    { id: 'R04', receiptNumber: 'PT-231128-015', date: '2023-11-28', time: '10:30', type: 'Payment', description: 'Thanh toán đợt 1', amount: 500000, cashier: 'Lê Văn Tiền', paymentMethod: 'Transfer', status: 'active' },
    { id: 'R03', receiptNumber: 'PT-231127-001', date: '2023-11-27', time: '08:45', type: 'Advance', description: 'Tạm ứng nhập viện', amount: 2000000, cashier: 'Nguyễn Thị Thu', paymentMethod: 'Cash', status: 'active' },
    { id: 'R02', receiptNumber: 'PT-231126-099', date: '2023-11-26', time: '09:15', type: 'Payment', description: 'Mua thuốc ngoài', amount: 350000, cashier: 'Trần Văn B', paymentMethod: 'Card', status: 'active' },
    { id: 'R01', receiptNumber: 'PT-231125-012', date: '2023-11-25', time: '16:20', type: 'Advance', description: 'Tạm ứng mổ', amount: 5000000, cashier: 'Nguyễn Thị Thu', paymentMethod: 'Transfer', status: 'cancelled' },
];

interface BillingReceiptsTableProps {
    onOpenDetail?: (receiptId: string) => void;
}

const BillingReceiptsTable: React.FC<BillingReceiptsTableProps> = ({ onOpenDetail }) => {
    const { fontSettings } = useTheme();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('All');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    // --- Filter Logic ---
    const filteredReceipts = useMemo(() => {
        return mockReceipts.filter(r => {
            const matchSearch = r.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                r.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchType = filterType === 'All' || r.type === filterType;
            const matchDate = (!fromDate || r.date >= fromDate) && (!toDate || r.date <= toDate);
            
            return matchSearch && matchType && matchDate;
        });
    }, [searchTerm, filterType, fromDate, toDate]);

    // --- Stats Calculation ---
    const stats = useMemo(() => {
        return filteredReceipts.reduce((acc, curr) => {
            if (curr.status === 'cancelled') return acc;
            if (curr.type === 'Refund') {
                acc.refund += curr.amount;
            } else {
                acc.income += curr.amount;
            }
            return acc;
        }, { income: 0, refund: 0 });
    }, [filteredReceipts]);

    const formatCurrency = (val: number) => val.toLocaleString('vi-VN');

    // --- UI Helpers ---
    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'Advance': 
                return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">Tạm ứng</span>;
            case 'Refund': 
                return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">Hoàn ứng</span>;
            case 'FinalSettlement':
                 return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">Quyết toán</span>;
            default: 
                return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-green-50 text-green-700 border border-green-200">Thanh toán</span>;
        }
    };

    const getMethodIcon = (method: string) => {
        switch (method) {
            case 'Card': return <span title="Thẻ" className="text-purple-600"><CreditCardIcon className="w-4 h-4"/></span>;
            case 'Transfer': return <span title="Chuyển khoản" className="text-blue-600"><ArrowUpTrayIcon className="w-4 h-4 rotate-45"/></span>;
            default: return <span title="Tiền mặt" className="text-green-600"><CashIcon className="w-4 h-4"/></span>;
        }
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            
            {/* 1. Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-shrink-0">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-center">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">Tổng thu</p>
                        <p className="text-2xl font-black text-green-600 dark:text-green-400">+{formatCurrency(stats.income)}</p>
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full">
                        <DownloadIcon className="w-5 h-5"/>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-center">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">Tổng chi (Hoàn)</p>
                        <p className="text-2xl font-black text-orange-500">-{formatCurrency(stats.refund)}</p>
                    </div>
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-full">
                        <ArrowUpTrayIcon className="w-5 h-5"/>
                    </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 shadow-sm flex justify-between items-center">
                    <div>
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-1">Thực thu</p>
                        <p className="text-2xl font-black text-blue-700 dark:text-blue-300">{formatCurrency(stats.income - stats.refund)}</p>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-800 text-blue-600 rounded-full shadow-sm">
                        <CheckCircleIcon className="w-5 h-5"/>
                    </div>
                </div>
            </div>

            {/* 2. Main Table Container */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex-1 flex flex-col overflow-hidden">
                
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex flex-col lg:flex-row gap-3 items-center justify-between">
                    <div className="flex items-center gap-2 w-full lg:w-auto">
                        <div className="relative flex-1 lg:w-64">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                            <input 
                                type="text" 
                                placeholder="Tìm mã phiếu, nội dung..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className={`w-full pl-9 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 ${fontSettings.controls}`}
                            />
                        </div>
                        <div className="relative">
                             <select 
                                value={filterType}
                                onChange={e => setFilterType(e.target.value)}
                                className={`pl-3 pr-8 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 cursor-pointer ${fontSettings.controls}`}
                            >
                                <option value="All">Tất cả loại</option>
                                <option value="Payment">Thanh toán</option>
                                <option value="Advance">Tạm ứng</option>
                                <option value="Refund">Hoàn ứng</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 w-full lg:w-auto">
                        <span className="text-xs font-bold text-slate-500 uppercase hidden sm:block">Ngày:</span>
                        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-1">
                            <input 
                                type="date" 
                                value={fromDate}
                                onChange={e => setFromDate(e.target.value)}
                                className="text-xs bg-transparent outline-none text-slate-600 dark:text-slate-300"
                            />
                            <span className="text-slate-400">-</span>
                            <input 
                                type="date" 
                                value={toDate}
                                onChange={e => setToDate(e.target.value)}
                                className="text-xs bg-transparent outline-none text-slate-600 dark:text-slate-300"
                            />
                        </div>
                        <button className="p-2 text-slate-500 hover:text-blue-600 bg-slate-100 dark:bg-slate-700 rounded-lg transition">
                            <FilterIcon className="w-4 h-4"/>
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className={`w-full text-left border-collapse ${fontSettings.listSecondary}`}>
                        <thead className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-bold uppercase text-xs sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-4 w-36">Số Phiếu</th>
                                <th className="p-4 w-36">Thời gian</th>
                                <th className="p-4 w-28 text-center">Loại</th>
                                <th className="p-4">Nội dung</th>
                                <th className="p-4 w-20 text-center" title="Phương thức thanh toán">PTTT</th>
                                <th className="p-4 w-32 text-right">Số tiền</th>
                                <th className="p-4 w-32">Người thu</th>
                                <th className="p-4 w-24 text-center">Tác vụ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {filteredReceipts.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-12 text-center text-slate-400 italic flex flex-col items-center justify-center w-full">
                                        <SearchIcon className="w-8 h-8 mb-2 opacity-20"/>
                                        Không tìm thấy phiếu thu nào.
                                    </td>
                                </tr>
                            ) : (
                                filteredReceipts.map((item) => (
                                    <tr key={item.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group ${item.status === 'cancelled' ? 'opacity-60 bg-slate-50 dark:bg-slate-900' : ''}`}>
                                        <td className="p-4">
                                            <div className={`font-mono font-bold text-sm ${item.status === 'cancelled' ? 'line-through text-slate-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                                {item.receiptNumber}
                                            </div>
                                            {item.status === 'cancelled' && <span className="text-[10px] text-red-500 font-bold">ĐÃ HỦY</span>}
                                        </td>
                                        <td className="p-4">
                                            <div className="text-slate-700 dark:text-slate-200 font-medium text-xs">
                                                {new Date(item.date).toLocaleDateString('vi-VN')}
                                            </div>
                                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                                <span className="w-1 h-1 rounded-full bg-slate-400"></span> {item.time}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">{getTypeBadge(item.type)}</td>
                                        <td className="p-4 text-slate-700 dark:text-slate-200 font-medium text-sm truncate max-w-xs" title={item.description}>
                                            {item.description}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center">{getMethodIcon(item.paymentMethod)}</div>
                                        </td>
                                        <td className={`p-4 text-right font-bold text-base ${
                                            item.status === 'cancelled' ? 'text-slate-400 line-through' : 
                                            item.type === 'Refund' ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-white'
                                        }`}>
                                            {item.type === 'Refund' ? '-' : '+'}{formatCurrency(item.amount)}
                                        </td>
                                        <td className="p-4 text-slate-600 dark:text-slate-400 text-xs">{item.cashier}</td>
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                {onOpenDetail && (
                                                    <button 
                                                        onClick={() => onOpenDetail(item.id)}
                                                        className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition" 
                                                        title="Xem chi tiết"
                                                    >
                                                        <EyeIcon className="w-4 h-4"/>
                                                    </button>
                                                )}
                                                <button className="p-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition" title="In phiếu">
                                                    <PrinterIcon className="w-4 h-4"/>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BillingReceiptsTable;
