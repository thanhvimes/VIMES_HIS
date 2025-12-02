
import React, { useState, useMemo, useEffect } from 'react';
import { 
    XIcon, 
    PrinterIcon, 
    CheckCircleIcon, 
    CurrencyDollarIcon, 
    UserGroupIcon,
    CalendarIcon,
    CreditCardIcon,
    CalculatorIcon,
    ShieldCheckIcon // Added icon
} from '../../../../components/Icons';
import { useTheme } from '../../../../contexts/ThemeContext';
import { BillingItem } from './BillingItemsTable';
import { PatientBillingInfo } from './BillingPatientInfo';

interface PaymentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    patient: PatientBillingInfo;
    items: BillingItem[];
    onConfirm: (paymentData: any) => void;
}

const PaymentDialog: React.FC<PaymentDialogProps> = ({ isOpen, onClose, patient, items, onConfirm }) => {
    const { fontSettings } = useTheme();
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [receivedAmount, setReceivedAmount] = useState<string>('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
    const [note, setNote] = useState('');

    // Filter items (usually only UNPAID items are shown in checkout, but for demo we show all or specific logic)
    const displayItems = items; 

    // --- CALCULATIONS ---
    const summary = useMemo(() => {
        return displayItems.reduce((acc, item) => ({
            totalPrice: acc.totalPrice + item.totalPrice,
            insurancePaid: acc.insurancePaid + item.insurancePaid,
            patientPaid: acc.patientPaid + item.patientPaid,
        }), { totalPrice: 0, insurancePaid: 0, patientPaid: 0 });
    }, [displayItems]);

    // Initialize received amount with patient pay amount
    useEffect(() => {
        if (isOpen) {
            setReceivedAmount(summary.patientPaid.toString());
        }
    }, [isOpen, summary.patientPaid]);

    // Calculate Change
    const changeAmount = useMemo(() => {
        const received = parseFloat(receivedAmount) || 0;
        return received - summary.patientPaid;
    }, [receivedAmount, summary.patientPaid]);

    // Grouping Data
    const groupedData = useMemo(() => {
        const groups: Record<string, BillingItem[]> = {};
        displayItems.forEach(item => {
            if (!groups[item.category]) groups[item.category] = [];
            groups[item.category].push(item);
        });
        return groups;
    }, [displayItems]);

    const formatCurrency = (val: number) => val.toLocaleString('vi-VN');

    const handleConfirm = () => {
        onConfirm({
            date: invoiceDate,
            method: paymentMethod,
            total: summary.patientPaid,
            received: parseFloat(receivedAmount),
            note
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 md:p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 w-full max-w-7xl h-[95vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700">
                
                {/* 1. HEADER */}
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-700 to-blue-600 text-white flex justify-between items-center shrink-0 shadow-md relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                            <CurrencyDollarIcon className="w-8 h-8 text-yellow-300"/>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold uppercase tracking-wide">Quyết toán Viện phí</h2>
                            <div className="flex items-center gap-4 text-sm text-blue-100 opacity-90 mt-0.5">
                                <span>BN: <span className="font-bold uppercase text-white">{patient.name}</span></span>
                                <span className="w-1 h-1 bg-blue-300 rounded-full"></span>
                                <span>{patient.recordId}</span>
                                <span className="w-1 h-1 bg-blue-300 rounded-full"></span>
                                
                                {/* Insurance Badge */}
                                {patient.patientType === 'BHYT' ? (
                                    <span className="bg-blue-800/50 px-2 py-0.5 rounded text-xs border border-blue-500/50 flex items-center gap-1">
                                        <ShieldCheckIcon className="w-3 h-3"/> BHYT {patient.insuranceRate}%
                                    </span>
                                ) : (
                                    <span className="bg-white/20 px-2 py-0.5 rounded text-xs border border-white/30 font-bold">
                                        Dịch vụ
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden md:block mr-4">
                            <div className="text-xs text-blue-200 uppercase font-bold">Tổng phải thu</div>
                            <div className="text-2xl font-mono font-bold text-white">{formatCurrency(summary.patientPaid)}</div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition text-white/80 hover:text-white">
                            <XIcon className="w-8 h-8"/>
                        </button>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
                    
                    {/* 2. LEFT: DETAILED BILL (The "Receipt") */}
                    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900/50 overflow-hidden border-r border-slate-200 dark:border-slate-700">
                        <div className="p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-md uppercase">Chi tiết</span>
                                Các khoản phí
                            </h3>
                            <div className="text-xs text-slate-500">
                                {displayItems.length} mục
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <table className={`w-full text-left border-collapse ${fontSettings.listSecondary}`}>
                                    <thead className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs uppercase font-bold sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <th className="p-3 border-r dark:border-slate-600 w-12 text-center">STT</th>
                                            <th className="p-3 border-r dark:border-slate-600">Nội dung</th>
                                            <th className="p-3 border-r dark:border-slate-600 w-16 text-center">SL</th>
                                            <th className="p-3 border-r dark:border-slate-600 w-24 text-right">Đơn giá</th>
                                            <th className="p-3 border-r dark:border-slate-600 w-28 text-right">Thành tiền</th>
                                            <th className="p-3 border-r dark:border-slate-600 w-28 text-right text-blue-600 dark:text-blue-400">BHYT</th>
                                            <th className="p-3 w-28 text-right text-red-600 dark:text-red-400">BN Trả</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                                        {Object.entries(groupedData).map(([category, groupItems], groupIdx) => {
                                            // Calculate group totals
                                            const groupTotal = groupItems.reduce((acc, cur) => ({
                                                total: acc.total + cur.totalPrice,
                                                insurance: acc.insurance + cur.insurancePaid,
                                                patient: acc.patient + cur.patientPaid
                                            }), { total: 0, insurance: 0, patient: 0 });

                                            return (
                                                <React.Fragment key={category}>
                                                    {/* Group Row */}
                                                    <tr className="bg-blue-50/80 dark:bg-blue-900/30 font-bold text-slate-800 dark:text-slate-200">
                                                        <td className="p-2 text-center border-r dark:border-slate-700 bg-blue-100/50 dark:bg-blue-800/50">{String.fromCharCode(65 + groupIdx)}</td>
                                                        <td className="p-2 border-r dark:border-slate-700 uppercase text-xs text-blue-800 dark:text-blue-200" colSpan={2}>{category}</td>
                                                        <td className="p-2 border-r dark:border-slate-700"></td>
                                                        <td className="p-2 border-r dark:border-slate-700 text-right text-slate-600 dark:text-slate-400">{formatCurrency(groupTotal.total)}</td>
                                                        <td className="p-2 border-r dark:border-slate-700 text-right text-blue-600 dark:text-blue-400">{formatCurrency(groupTotal.insurance)}</td>
                                                        <td className="p-2 text-right text-red-600 dark:text-red-400">{formatCurrency(groupTotal.patient)}</td>
                                                    </tr>
                                                    {/* Item Rows */}
                                                    {groupItems.map((item, idx) => (
                                                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                                            <td className="p-2 text-center text-slate-400 border-r border-slate-100 dark:border-slate-700 text-xs">{idx + 1}</td>
                                                            <td className="p-2 border-r border-slate-100 dark:border-slate-700 font-medium text-slate-700 dark:text-slate-300">{item.name}</td>
                                                            <td className="p-2 text-center border-r border-slate-100 dark:border-slate-700 font-semibold text-slate-600">{item.quantity}</td>
                                                            <td className="p-2 text-right border-r border-slate-100 dark:border-slate-700 text-slate-500 text-xs font-mono">{formatCurrency(item.unitPrice)}</td>
                                                            <td className="p-2 text-right border-r border-slate-100 dark:border-slate-700 font-mono text-slate-600">{formatCurrency(item.totalPrice)}</td>
                                                            <td className="p-2 text-right border-r border-slate-100 dark:border-slate-700 text-slate-500 text-xs font-mono">{formatCurrency(item.insurancePaid)}</td>
                                                            <td className="p-2 text-right font-bold text-slate-800 dark:text-white font-mono">{formatCurrency(item.patientPaid)}</td>
                                                        </tr>
                                                    ))}
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                    {/* Grand Total Footer inside table */}
                                    <tfoot className="bg-slate-100 dark:bg-slate-800 border-t-2 border-slate-300 dark:border-slate-600 font-bold text-slate-800 dark:text-white shadow-inner">
                                        <tr>
                                            <td colSpan={4} className="p-3 text-right uppercase text-xs text-slate-500">Tổng cộng toàn bộ</td>
                                            <td className="p-3 text-right text-base">{formatCurrency(summary.totalPrice)}</td>
                                            <td className="p-3 text-right text-blue-600 dark:text-blue-400 text-base">{formatCurrency(summary.insurancePaid)}</td>
                                            <td className="p-3 text-right text-red-600 dark:text-red-400 text-lg bg-red-50 dark:bg-red-900/20">{formatCurrency(summary.patientPaid)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* 3. RIGHT: CASHIER / PAYMENT PANEL */}
                    <div className="w-full lg:w-96 bg-white dark:bg-slate-800 flex flex-col shadow-[-4px_0_15px_rgba(0,0,0,0.05)] z-10">
                        
                        <div className="p-6 flex-1 overflow-y-auto">
                            <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 tracking-wider">Thông tin thanh toán</h3>
                            
                            {/* Summary Cards */}
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-700">
                                    <span className="text-sm text-slate-600 dark:text-slate-400">Tổng chi phí</span>
                                    <span className="font-bold text-slate-800 dark:text-white">{formatCurrency(summary.totalPrice)}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800">
                                    <span className="text-sm text-blue-700 dark:text-blue-400">BHYT Chi trả</span>
                                    <span className="font-bold text-blue-700 dark:text-blue-400">{formatCurrency(summary.insurancePaid)}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-700">
                                    <span className="text-sm text-slate-600 dark:text-slate-400">Tạm ứng đã đóng</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(patient.balance > 0 ? patient.balance : 0)}</span>
                                </div>
                                
                                <div className="mt-4 pt-4 border-t-2 border-dashed border-slate-200 dark:border-slate-700">
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="text-base font-bold text-slate-800 dark:text-white uppercase">BN Phải trả</span>
                                        <span className="text-3xl font-black text-red-600 dark:text-red-400 tracking-tight">{formatCurrency(summary.patientPaid)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Inputs */}
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Hình thức</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['Cash', 'Transfer', 'Card'].map(method => (
                                            <button
                                                key={method}
                                                onClick={() => setPaymentMethod(method)}
                                                className={`py-2 px-1 text-sm font-bold rounded-lg border transition-all ${
                                                    paymentMethod === method 
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                                                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50'
                                                }`}
                                            >
                                                {method === 'Cash' ? 'Tiền mặt' : method === 'Transfer' ? 'CK' : 'Thẻ'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Khách đưa</label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            value={receivedAmount}
                                            onChange={e => setReceivedAmount(e.target.value)}
                                            className="w-full p-4 text-right text-2xl font-bold text-slate-800 bg-white border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none dark:bg-slate-800 dark:border-slate-600 dark:text-white transition-all"
                                            placeholder="0"
                                        />
                                        <span className="absolute top-1/2 -translate-y-1/2 left-4 text-slate-400 font-bold">VNĐ</span>
                                    </div>
                                    
                                    {/* Quick Amount Suggestions */}
                                    <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                                        {[summary.patientPaid, 50000, 100000, 200000, 500000].map(amt => (
                                            <button 
                                                key={amt}
                                                onClick={() => setReceivedAmount(amt.toString())}
                                                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-full whitespace-nowrap"
                                            >
                                                {amt === summary.patientPaid ? 'Đủ' : formatCurrency(amt)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className={`p-4 rounded-xl border-2 transition-all ${changeAmount < 0 ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold uppercase">{changeAmount < 0 ? 'Còn thiếu' : 'Tiền thừa trả lại'}</span>
                                        <span className="text-2xl font-black">{formatCurrency(Math.abs(changeAmount))}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Ghi chú</label>
                                    <input 
                                        type="text" 
                                        value={note}
                                        onChange={e => setNote(e.target.value)}
                                        className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm outline-none focus:border-blue-500 transition-colors"
                                        placeholder="Nội dung thu..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                            <button 
                                onClick={handleConfirm}
                                disabled={changeAmount < 0 && paymentMethod === 'Cash'} // Prevent confirm if insufficient cash
                                className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 ${
                                    changeAmount < 0 && paymentMethod === 'Cash' 
                                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-emerald-500/30'
                                }`}
                            >
                                <CheckCircleIcon className="w-6 h-6"/>
                                Hoàn tất Thu tiền
                            </button>
                            <div className="grid grid-cols-2 gap-3 mt-3">
                                <button className="py-2.5 rounded-lg font-bold text-sm text-slate-600 hover:bg-slate-200 border border-slate-300 transition flex items-center justify-center gap-2">
                                    <PrinterIcon className="w-4 h-4"/> In Phiếu thu
                                </button>
                                <button className="py-2.5 rounded-lg font-bold text-sm text-slate-600 hover:bg-slate-200 border border-slate-300 transition flex items-center justify-center gap-2">
                                    <PrinterIcon className="w-4 h-4"/> In Hóa đơn
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default PaymentDialog;
