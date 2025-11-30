
import React, { useState } from 'react';
import { mockPayroll } from '../data';
import { SearchIcon, FilterIcon, CheckIcon, PrinterIcon } from '../../../components/Icons';
import { CashIcon } from '../icons';

const PayrollView: React.FC = () => {
    const [payroll, setPayroll] = useState(mockPayroll);
    const [searchTerm, setSearchTerm] = useState('');

    const formatCurrency = (val: number) => val.toLocaleString('vi-VN') + ' đ';

    const getStatusBadge = (status: string) => {
        switch(status) {
            case 'Paid': return <span className="px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200">Đã thanh toán</span>;
            case 'Approved': return <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200">Đã duyệt</span>;
            default: return <span className="px-2 py-1 rounded text-xs font-bold bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 border border-gray-200">Nháp</span>;
        }
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <CashIcon className="w-8 h-8 text-rose-600"/> Quản lý Lương & Phúc lợi
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Kỳ lương: Tháng 11/2023</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-bold flex items-center gap-2 shadow-sm">
                        <PrinterIcon className="w-4 h-4"/> Xuất Excel
                    </button>
                    <button className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow flex items-center gap-2">
                        <CheckIcon className="w-4 h-4"/> Chốt lương
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
                        <input 
                            type="text" 
                            placeholder="Tìm nhân viên..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-9 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-rose-500 outline-none text-sm"
                        />
                    </div>
                </div>
                
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 uppercase font-bold text-xs sticky top-0 z-10">
                            <tr>
                                <th className="p-4">Nhân viên</th>
                                <th className="p-4 text-right">Lương cơ bản</th>
                                <th className="p-4 text-right">Phụ cấp</th>
                                <th className="p-4 text-right">Làm thêm</th>
                                <th className="p-4 text-right">Khấu trừ</th>
                                <th className="p-4 text-right">Thực lĩnh</th>
                                <th className="p-4 text-center">Trạng thái</th>
                                <th className="p-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {payroll.filter(p => p.staffName.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-slate-800 dark:text-white">{p.staffName}</div>
                                        <div className="text-xs text-slate-500">{p.staffId} - {p.role}</div>
                                    </td>
                                    <td className="p-4 text-right font-mono">{formatCurrency(p.basicSalary)}</td>
                                    <td className="p-4 text-right font-mono text-green-600">{formatCurrency(p.allowance)}</td>
                                    <td className="p-4 text-right font-mono text-blue-600">{formatCurrency(p.overtimePay)}</td>
                                    <td className="p-4 text-right font-mono text-red-500">-{formatCurrency(p.deduction)}</td>
                                    <td className="p-4 text-right font-bold text-rose-600 dark:text-rose-400 text-base">{formatCurrency(p.netSalary)}</td>
                                    <td className="p-4 text-center">{getStatusBadge(p.status)}</td>
                                    <td className="p-4 text-right">
                                        <button className="text-blue-600 hover:underline font-medium text-xs">Chi tiết</button>
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

export default PayrollView;