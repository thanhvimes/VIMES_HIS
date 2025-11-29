
import React from 'react';
import { ReceiptTaxIcon } from '../icons';
import { DownloadIcon } from '../../../components/Icons';

const mockInvoices = [
    { id: 'INV-001', date: '15/11/2023', service: 'Khám + Thuốc', amount: 850000, status: 'paid' },
    { id: 'INV-002', date: '20/10/2023', service: 'Nội soi Tai Mũi Họng', amount: 400000, status: 'paid' },
    { id: 'INV-003', date: '15/11/2023', service: 'Phụ thu Ngoài giờ', amount: 150000, status: 'unpaid' },
];

const FinanceView: React.FC = () => {
    return (
        <div className="p-4 h-full flex flex-col">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Hóa đơn & Thanh toán</h2>
            
            <div className="space-y-4">
                {mockInvoices.map(inv => (
                    <div key={inv.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
                        {inv.status === 'paid' ? (
                            <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">ĐÃ THANH TOÁN</div>
                        ) : (
                            <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">CHƯA THANH TOÁN</div>
                        )}
                        
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-xs text-slate-500 font-mono">{inv.id}</p>
                                <h4 className="font-bold text-slate-800">{inv.service}</h4>
                            </div>
                        </div>
                        
                        <div className="flex justify-between items-end mt-4">
                            <div className="text-xs text-slate-500">{inv.date}</div>
                            <div className="text-xl font-bold text-blue-600">{inv.amount.toLocaleString()} đ</div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex gap-3">
                             <button className="flex-1 py-2 rounded-lg bg-slate-50 text-slate-600 text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-100">
                                <DownloadIcon className="w-4 h-4"/> Tải Hóa đơn
                             </button>
                             {inv.status === 'unpaid' && (
                                 <button className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-md">
                                    Thanh toán ngay
                                 </button>
                             )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FinanceView;
