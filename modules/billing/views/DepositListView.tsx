
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    SearchIcon, 
    FilterIcon, 
    CalendarIcon, 
    UserCircleIcon, 
    RefreshIcon,
    ReceiptIcon,
    PrinterIcon,
    CheckCircleIcon,
    XIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';

// Mock Data Types
interface DepositReceipt {
    id: string;
    receiptNumber: string;
    patientName: string;
    patientId: string;
    amount: number;
    date: string; // YYYY-MM-DD
    cashier: string;
    status: 'Active' | 'Used' | 'Refunded'; // Đang giữ | Đã thanh toán | Đã hoàn
    note: string;
}

const mockDeposits: DepositReceipt[] = [
    { id: 'D01', receiptNumber: 'TU-231127-001', patientName: 'Nguyễn Văn An', patientId: '21024061', amount: 5000000, date: '2023-11-27', cashier: 'admin', status: 'Active', note: 'Tạm ứng nhập viện' },
    { id: 'D02', receiptNumber: 'TU-231126-015', patientName: 'Trần Thị Bích', patientId: '21024062', amount: 2000000, date: '2023-11-26', cashier: 'ketoan1', status: 'Used', note: 'Tạm ứng mổ' },
    { id: 'D03', receiptNumber: 'TU-231125-099', patientName: 'Lê Hoàng Cường', patientId: '21024067', amount: 1000000, date: '2023-11-25', cashier: 'admin', status: 'Refunded', note: 'Thừa tiền hoàn lại' },
    { id: 'D04', receiptNumber: 'TU-231127-005', patientName: 'Phạm Thị Dung', patientId: '23011618', amount: 3000000, date: '2023-11-27', cashier: 'ketoan2', status: 'Active', note: 'Tạm ứng đợt 2' },
    { id: 'D05', receiptNumber: 'TU-231120-001', patientName: 'Hoàng Văn Em', patientId: '22001122', amount: 500000, date: '2023-11-20', cashier: 'admin', status: 'Used', note: 'Tạm ứng CLS' },
];

const DepositListView: React.FC = () => {
    const { fontSettings } = useTheme();
    const navigate = useNavigate();
    
    // Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [selectedCashier, setSelectedCashier] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');

    // Get Unique Cashiers
    const cashiers = useMemo(() => ['All', ...Array.from(new Set(mockDeposits.map(d => d.cashier)))], []);

    const filteredData = useMemo(() => {
        return mockDeposits.filter(item => {
            const matchesSearch = item.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  item.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  item.patientId.includes(searchTerm);
            
            const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
            const matchesCashier = selectedCashier === 'All' || item.cashier === selectedCashier;
            
            const matchesDate = (!fromDate || item.date >= fromDate) && (!toDate || item.date <= toDate);

            return matchesSearch && matchesStatus && matchesCashier && matchesDate;
        }).sort((a, b) => b.date.localeCompare(a.date));
    }, [searchTerm, filterStatus, selectedCashier, fromDate, toDate]);

    const totalAmount = useMemo(() => filteredData.reduce((sum, item) => sum + item.amount, 0), [filteredData]);

    const getStatusBadge = (status: string) => {
        switch(status) {
            case 'Active': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">Đang giữ</span>;
            case 'Used': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">Đã tất toán</span>;
            case 'Refunded': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">Đã hoàn trả</span>;
            default: return null;
        }
    };

    const handleRowClick = (patientId: string) => {
        navigate(`/billing/record/${patientId}`);
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Header & Filter Bar */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <ReceiptIcon className="w-6 h-6 text-blue-600"/> Danh sách Thu Tạm Ứng
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Quản lý các khoản tiền đặt cọc, tạm ứng của bệnh nhân.</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-500 font-bold uppercase">Tổng tiền (Đang lọc)</p>
                        <p className="text-xl font-black text-blue-600">{totalAmount.toLocaleString('vi-VN')} đ</p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-3 items-end">
                    {/* Search */}
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Tìm kiếm</label>
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                            <input 
                                type="text" 
                                placeholder="Tên BN, Mã HS, Số phiếu..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className={`w-full pl-9 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none ${fontSettings.controls}`}
                            />
                        </div>
                    </div>

                    {/* Date Range */}
                    <div className="w-full lg:w-auto">
                         <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Từ ngày</label>
                         <div className="relative">
                            <CalendarIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                            <input 
                                type="date" 
                                value={fromDate}
                                onChange={e => setFromDate(e.target.value)}
                                className={`pl-8 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 ${fontSettings.controls}`}
                            />
                         </div>
                    </div>
                    <div className="w-full lg:w-auto">
                         <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Đến ngày</label>
                         <div className="relative">
                            <CalendarIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                            <input 
                                type="date" 
                                value={toDate}
                                onChange={e => setToDate(e.target.value)}
                                className={`pl-8 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 ${fontSettings.controls}`}
                            />
                         </div>
                    </div>

                    {/* Cashier Filter */}
                    <div className="w-full lg:w-48">
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Người thu</label>
                        <div className="relative">
                            <UserCircleIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                            <select 
                                value={selectedCashier}
                                onChange={e => setSelectedCashier(e.target.value)}
                                className={`w-full pl-8 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 appearance-none cursor-pointer ${fontSettings.controls}`}
                            >
                                {cashiers.map(c => <option key={c} value={c}>{c === 'All' ? 'Tất cả' : c}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div className="w-full lg:w-40">
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Trạng thái</label>
                        <div className="relative">
                            <FilterIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                            <select 
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value)}
                                className={`w-full pl-8 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 appearance-none cursor-pointer ${fontSettings.controls}`}
                            >
                                <option value="All">Tất cả</option>
                                <option value="Active">Đang giữ</option>
                                <option value="Used">Đã tất toán</option>
                                <option value="Refunded">Đã hoàn</option>
                            </select>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => {setSearchTerm(''); setFromDate(''); setToDate(''); setSelectedCashier('All'); setFilterStatus('All');}}
                        className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 rounded-lg text-slate-500 transition"
                        title="Xóa bộ lọc"
                    >
                        <RefreshIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex-1 overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1">
                    <table className={`w-full text-left border-collapse ${fontSettings.listPrimary}`}>
                        <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase sticky top-0 z-10">
                            <tr>
                                <th className="p-4 w-32">Số Phiếu</th>
                                <th className="p-4 w-32">Ngày thu</th>
                                <th className="p-4">Bệnh nhân</th>
                                <th className="p-4">Nội dung</th>
                                <th className="p-4 text-right w-36">Số tiền</th>
                                <th className="p-4 text-center w-32">Người thu</th>
                                <th className="p-4 text-center w-32">Trạng thái</th>
                                <th className="p-4 text-right w-20"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-12 text-center text-slate-400 italic">
                                        Không tìm thấy phiếu tạm ứng nào.
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map(item => (
                                    <tr 
                                        key={item.id} 
                                        className="hover:bg-blue-50 dark:hover:bg-slate-700/30 transition-colors group cursor-pointer"
                                        onClick={() => handleRowClick(item.patientId)}
                                    >
                                        <td className="p-4 font-mono text-slate-600 dark:text-slate-300 font-bold text-sm">{item.receiptNumber}</td>
                                        <td className="p-4 text-slate-600 dark:text-slate-400 text-sm">
                                            {new Date(item.date).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 dark:text-white">{item.patientName}</div>
                                            <div className="text-xs text-slate-500 font-mono">{item.patientId}</div>
                                        </td>
                                        <td className="p-4 text-slate-600 dark:text-slate-300 text-sm truncate max-w-xs" title={item.note}>{item.note}</td>
                                        <td className="p-4 text-right font-bold text-blue-600 dark:text-blue-400">{item.amount.toLocaleString()}</td>
                                        <td className="p-4 text-center text-slate-600 dark:text-slate-400 text-sm">{item.cashier}</td>
                                        <td className="p-4 text-center">{getStatusBadge(item.status)}</td>
                                        <td className="p-4 text-right">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); alert(`In phiếu ${item.receiptNumber}`); }}
                                                className="p-2 text-slate-400 hover:text-blue-600 bg-transparent hover:bg-blue-100 rounded-full transition"
                                                title="In phiếu"
                                            >
                                                <PrinterIcon className="w-4 h-4"/>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-500 flex justify-between items-center">
                    <span>Hiển thị {filteredData.length} phiếu</span>
                </div>
            </div>
        </div>
    );
};

export default DepositListView;
