import React, { useState, useEffect } from 'react';
import { ReceiptTaxIcon } from '../icons';
import { portalService, PortalInvoice } from '../../../services/portalService';
import UnpaidInvoicesTab from '../components/UnpaidInvoicesTab';
import PaymentHistoryTab from '../components/PaymentHistoryTab';

const FinanceView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'unpaid' | 'paid'>('unpaid');
    const [unpaidInvoices, setUnpaidInvoices] = useState<PortalInvoice[]>([]);
    const [paidInvoices, setPaidInvoices] = useState<PortalInvoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        setIsLoading(true);
        try {
            const data = await portalService.getInvoices();

            // Separate invoices by status
            setUnpaidInvoices(data.filter(inv => inv.status === 'unpaid'));
            setPaidInvoices(data.filter(inv => inv.status === 'paid'));
        } catch (error) {
            console.error('Failed to fetch invoices:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full overflow-y-auto custom-scrollbar">
            <div className="p-4 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                    <ReceiptTaxIcon className="w-6 h-6 text-blue-600" />
                    <h2 className="text-xl font-bold text-slate-800">Hóa đơn & Thanh toán</h2>
                </div>

                {/* Tab Buttons */}
                <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('unpaid')}
                        className={`flex-1 py-2 px-4 rounded-md font-semibold text-sm transition-all ${activeTab === 'unpaid'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-slate-600 hover:text-slate-800'
                            }`}
                    >
                        Cần thanh toán
                        {unpaidInvoices.length > 0 && (
                            <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                {unpaidInvoices.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('paid')}
                        className={`flex-1 py-2 px-4 rounded-md font-semibold text-sm transition-all ${activeTab === 'paid'
                                ? 'bg-white text-green-600 shadow-sm'
                                : 'text-slate-600 hover:text-slate-800'
                            }`}
                    >
                        Lịch sử thanh toán
                        {paidInvoices.length > 0 && (
                            <span className="ml-2 bg-slate-300 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                {paidInvoices.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1">
                    {activeTab === 'unpaid' ? (
                        <UnpaidInvoicesTab
                            invoices={unpaidInvoices}
                            isLoading={isLoading}
                            onRefresh={fetchInvoices}
                        />
                    ) : (
                        <PaymentHistoryTab
                            invoices={paidInvoices}
                            isLoading={isLoading}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default FinanceView;
