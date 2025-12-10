
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BillsManager } from './Invoices';
import { Bill, Customer } from '../../../types';
import { 
    SearchIcon, 
    FilterIcon, 
    CalendarIcon, 
    UserCircleIcon, 
    RefreshIcon,
    ListBulletIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { formatDate } from '../../../utils/dateFormatter';

interface InvoiceListViewProps {
  bills: Bill[];
  customers: Customer[];
  addBill: (bill: Omit<Bill, 'id' | 'status'>) => void;
  deleteBill: (id: string) => void;
  updateBillStatus: (id: string, status: 'paid' | 'unpaid') => void;
}

const InvoiceListView: React.FC<InvoiceListViewProps> = ({ bills, customers }) => {
  const { fontSettings } = useTheme();
  const navigate = useNavigate();
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [cashierFilter, setCashierFilter] = useState('All');

  const cashiers = ['All', 'admin', 'ketoan1', 'ketoan2'];

  const filteredBills = useMemo(() => {
      return bills.filter(bill => {
          const customer = customers.find(c => c.id === bill.customerId);
          const nameMatch = customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) || bill.id.toLowerCase().includes(searchTerm.toLowerCase());
          const statusMatch = statusFilter === 'all' || bill.status === statusFilter;
          const dateMatch = (!fromDate || bill.date >= fromDate) && (!toDate || bill.date <= toDate);
          const mockCashier = 'admin'; 
          const cashierMatch = cashierFilter === 'All' || mockCashier === cashierFilter;

          return nameMatch && statusMatch && dateMatch && cashierMatch;
      });
  }, [bills, customers, searchTerm, statusFilter, fromDate, toDate, cashierFilter]);

  const totalRevenue = filteredBills.reduce((sum, b) => sum + (b.status === 'paid' ? b.cost : 0), 0);

  const handleRowClick = (patientId: string) => {
      navigate(`/billing/record/${patientId}`);
  };

  return (
    <div className="h-full flex flex-col space-y-4">
        
        {/* Header & Filter Toolbar */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <ListBulletIcon className="w-6 h-6 text-blue-600"/> Danh sách Hóa đơn
                    </h1>
                    <p className="text-sm text-slate-500">Quản lý hóa đơn viện phí và trạng thái thanh toán.</p>
                </div>
                <div className="text-right hidden md:block">
                     <div className="text-xs text-slate-500 uppercase font-bold">Tổng thực thu (Đang lọc)</div>
                     <div className="text-xl font-black text-green-600">{totalRevenue.toLocaleString()} đ</div>
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
                            placeholder="Mã HĐ, Tên BN..." 
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

                {/* Filters */}
                <div className="w-full lg:w-48">
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Người thu</label>
                    <div className="relative">
                        <UserCircleIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                        <select 
                            value={cashierFilter}
                            onChange={e => setCashierFilter(e.target.value)}
                            className={`w-full pl-8 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 appearance-none cursor-pointer ${fontSettings.controls}`}
                        >
                            {cashiers.map(c => <option key={c} value={c}>{c === 'All' ? 'Tất cả' : c}</option>)}
                        </select>
                    </div>
                </div>

                <div className="w-full lg:w-40">
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Trạng thái</label>
                    <div className="relative">
                        <FilterIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                        <select 
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value as any)}
                            className={`w-full pl-8 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 appearance-none cursor-pointer ${fontSettings.controls}`}
                        >
                            <option value="all">Tất cả</option>
                            <option value="paid">Đã thanh toán</option>
                            <option value="unpaid">Chưa thanh toán</option>
                        </select>
                    </div>
                </div>
                
                <button 
                    onClick={() => {setSearchTerm(''); setFromDate(''); setToDate(''); setCashierFilter('All'); setStatusFilter('all');}}
                    className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 rounded-lg text-slate-500 transition"
                    title="Xóa bộ lọc"
                >
                    <RefreshIcon className="w-5 h-5"/>
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-hidden">
             <BillsManager 
                bills={filteredBills} 
                customers={customers} 
                onRowClick={handleRowClick}
            />
        </div>
    </div>
  );
};

export default InvoiceListView;
