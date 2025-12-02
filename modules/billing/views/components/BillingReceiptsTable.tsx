
import React, { useState } from 'react';
import { PrinterIcon, SearchIcon, CheckCircleIcon, XIcon, DocumentTextIcon, EyeIcon } from '../../../../components/Icons';
import { useTheme } from '../../../../contexts/ThemeContext';

export interface Receipt {
    id: string;
    receiptNumber: string;
    date: string;
    type: 'Advance' | 'Payment' | 'Refund'; // Tạm ứng | Thanh toán | Hoàn ứng
    description: string;
    amount: number;
    cashier: string;
    paymentMethod: 'Cash' | 'Transfer' | 'Card';
    status: 'active' | 'cancelled';
}

// Mock Data
const mockReceipts: Receipt[] = [
    { id: 'R01', receiptNumber: 'PT-231127-001', date: '27/11/2023 08:45', type: 'Advance', description: 'Tạm ứng nhập viện nội trú', amount: 2000000, cashier: 'Nguyễn Thị Thu', paymentMethod: 'Cash', status: 'active' },
    { id: 'R02', receiptNumber: 'PT-231128-015', date: '28/11/2023 10:30', type: 'Payment', description: 'Thanh toán đợt 1 (Xét nghiệm)', amount: 500000, cashier: 'Lê Văn Tiền', paymentMethod: 'Transfer', status: 'active' },
    { id: 'R03', receiptNumber: 'PC-231129-002', date: '29/11/2023 14:00', type: 'Refund', description: 'Hoàn trả thuốc không sử dụng', amount: 150000, cashier: 'Nguyễn Thị Thu', paymentMethod: 'Cash', status: 'active' },
];

interface BillingReceiptsTableProps {
    onOpenDetail?: (receiptId: string) => void;
}

const BillingReceiptsTable: React.FC<BillingReceiptsTableProps> = ({ onOpenDetail }) => {
    const { fontSettings } = useTheme();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredReceipts = mockReceipts.filter(r => 
        r.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatCurrency = (val: number) => val.toLocaleString('vi-VN');

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'Advance': return <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">Tạm ứng</span>;
            case 'Refund': return <span className="px-2 py-1 rounded text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">Hoàn ứng</span>;
            default: return <span className="px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700 border border-green-200">Thanh toán</span>;
        }
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            
            {/* 1. Toolbar */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white whitespace-nowrap">Lịch sử Giao dịch</h3>
                    <span className="bg-blue-100 text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full">{mockReceipts.length} phiếu</span>
                </div>
                
                <div className="relative w-full sm:w-64">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                    <input 
                        type="text" 
                        placeholder="Tìm mã phiếu, nội dung..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className={`w-full pl-9 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 ${fontSettings.controls}`}
                    />
                </div>
            </div>

            {/* 2. Table Content */}
            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className={`w-full text-left border-collapse ${fontSettings.listSecondary}`}>
                    <thead className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-bold uppercase text-xs sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="p-3 w-12 text-center">#</th>
                            <th className="p-3 w-32">Số Phiếu</th>
                            <th className="p-3 w-32">Ngày thu</th>
                            <th className="p-3 w-28 text-center">Loại</th>
                            <th className="p-3">Nội dung thu</th>
                            <th className="p-3 w-24 text-center">HTTT</th>
                            <th className="p-3 w-32 text-right">Số tiền</th>
                            <th className="p-3 w-32">Người thu</th>
                            <th className="p-3 w-24 text-center">Tác vụ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {filteredReceipts.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="p-10 text-center text-slate-400 italic">Không có lịch sử giao dịch nào.</td>
                            </tr>
                        ) : (
                            filteredReceipts.map((item, idx) => (
                                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                                    <td className="p-3 text-center text-slate-400 text-xs">{idx + 1}</td>
                                    <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{item.receiptNumber}</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-300 text-xs">{item.date}</td>
                                    <td className="p-3 text-center">{getTypeBadge(item.type)}</td>
                                    <td className="p-3 text-slate-700 dark:text-slate-200 font-medium">{item.description}</td>
                                    <td className="p-3 text-center text-xs text-slate-500">{item.paymentMethod}</td>
                                    <td className={`p-3 text-right font-bold ${item.type === 'Refund' ? 'text-red-600' : 'text-emerald-600'}`}>
                                        {item.type === 'Refund' ? '-' : '+'}{formatCurrency(item.amount)}
                                    </td>
                                    <td className="p-3 text-slate-600 dark:text-slate-400 text-xs">{item.cashier}</td>
                                    <td className="p-3 text-center flex justify-center gap-1">
                                        {onOpenDetail && (
                                            <button 
                                                onClick={() => onOpenDetail(item.id)}
                                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition" 
                                                title="Xem chi tiết"
                                            >
                                                <EyeIcon className="w-4 h-4"/>
                                            </button>
                                        )}
                                        <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition" title="In phiếu">
                                            <PrinterIcon className="w-4 h-4"/>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* 3. Footer Summary */}
            <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-600 p-3 flex justify-end gap-6 text-sm">
                <div>Tổng thực thu: <span className="font-bold text-emerald-600 text-base">{formatCurrency(2350000)}</span></div>
                <div>Tổng hoàn trả: <span className="font-bold text-red-600 text-base">{formatCurrency(150000)}</span></div>
            </div>
        </div>
    );
};

export default BillingReceiptsTable;
