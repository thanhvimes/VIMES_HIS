import React from 'react';
import { CheckCircleIcon, DownloadIcon, ReceiptTextIcon } from '../../../components/Icons';
import { PortalInvoice } from '../../../services/portalService';

interface PaymentHistoryTabProps {
    invoices: PortalInvoice[];
    isLoading: boolean;
}

const PaymentHistoryTab: React.FC<PaymentHistoryTabProps> = ({ invoices, isLoading }) => {
    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center py-12 text-slate-400">
                Đang tải lịch sử thanh toán...
            </div>
        );
    }

    if (invoices.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 opacity-50 py-12">
                <ReceiptTextIcon className="w-16 h-16 mb-4" />
                <p>Chưa có lịch sử thanh toán</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {invoices.map(invoice => (
                <div
                    key={invoice.id}
                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-200"
                >
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                <p className="text-xs text-slate-500 font-mono">{invoice.id}</p>
                            </div>
                            <h4 className="font-bold text-slate-800">{invoice.service || 'Dịch vụ y tế'}</h4>
                            <p className="text-xs text-slate-500 mt-1">Ngày thanh toán: {invoice.date}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-xl font-bold text-green-600">
                                {Number(invoice.amount).toLocaleString()} đ
                            </div>
                            <div className="bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded mt-2">
                                ĐÃ THANH TOÁN
                            </div>
                        </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100">
                        <button className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-semibold">
                            <DownloadIcon className="w-4 h-4" />
                            Tải hóa đơn
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PaymentHistoryTab;
