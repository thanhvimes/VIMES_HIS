import React, { useState } from 'react';
import { LoaderIcon, CreditCardIcon } from '../../../components/Icons';
import { PortalInvoice } from '../../../services/portalService';
import QRPaymentModal from './QRPaymentModal';

interface UnpaidInvoicesTabProps {
    invoices: PortalInvoice[];
    isLoading: boolean;
    onRefresh: () => void;
}

const UnpaidInvoicesTab: React.FC<UnpaidInvoicesTabProps> = ({ invoices, isLoading, onRefresh }) => {
    const [selectedBill, setSelectedBill] = useState<PortalInvoice | null>(null);
    const [showQRModal, setShowQRModal] = useState(false);

    const handlePayNow = (invoice: PortalInvoice) => {
        setSelectedBill(invoice);
        setShowQRModal(true);
    };

    const handlePaymentSuccess = () => {
        setSelectedBill(null);
        setShowQRModal(false);
        onRefresh(); // Reload invoices to show updated status
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center py-12">
                <LoaderIcon className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (invoices.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 opacity-50 py-12">
                <CreditCardIcon className="w-16 h-16 mb-4" />
                <p>Không có hóa đơn chờ thanh toán</p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-4">
                {invoices.map(invoice => (
                    <div
                        key={invoice.id}
                        className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <p className="text-xs text-slate-500 font-mono">{invoice.id}</p>
                                <h4 className="font-bold text-slate-800 mt-1">{invoice.service || 'Dịch vụ y tế'}</h4>
                                <p className="text-xs text-slate-500 mt-1">{invoice.date}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-red-600">
                                    {Number(invoice.amount).toLocaleString()} đ
                                </div>
                                <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded mt 2">
                                    CHƯA THANH TOÁN
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => handlePayNow(invoice)}
                            className="w-full py-3 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 shadow-md transition-colors flex items-center justify-center gap-2"
                        >
                            <CreditCardIcon className="w-4 h-4" />
                            Thanh toán ngay
                        </button>
                    </div>
                ))}
            </div>

            <QRPaymentModal
                isOpen={showQRModal}
                bill={selectedBill}
                onClose={() => setShowQRModal(false)}
                onSuccess={handlePaymentSuccess}
            />
        </>
    );
};

export default UnpaidInvoicesTab;
