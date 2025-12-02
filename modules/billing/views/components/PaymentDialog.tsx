
import React, { useState, useMemo, useEffect } from 'react';
import { 
    XIcon, 
    PrinterIcon, 
    CheckCircleIcon, 
    CurrencyDollarIcon, 
    CreditCardIcon,
    QrcodeIcon,
    CashIcon,
    RefreshIcon
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

// --- QR CODE MODAL COMPONENT ---
const QrCodeModal = ({ 
    isOpen, 
    onClose, 
    amount, 
    content, 
    onSuccess 
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    amount: number; 
    content: string;
    onSuccess: () => void;
}) => {
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            // Simulate loading delay for QR generation
            const timer = setTimeout(() => setLoading(false), 800);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Using VietQR API format for realistic QR code
    // Template: compact2. Bank ID: MBBank (970422). Account: DEMO_ACC
    const qrUrl = `https://img.vietqr.io/image/MB-123456789-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(content)}&accountName=BV_DA_KHOA_VIMES`;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col items-center relative">
                <button onClick={onClose} className="absolute top-3 right-3 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition z-10">
                    <XIcon className="w-5 h-5"/>
                </button>

                <div className="w-full bg-blue-600 p-4 text-center relative">
                    <h3 className="text-white font-bold text-lg uppercase">Quét mã thanh toán</h3>
                    <p className="text-blue-100 text-xs">Sử dụng App Ngân hàng hoặc Ví điện tử</p>
                </div>

                <div className="p-6 flex flex-col items-center w-full bg-white">
                    <div className="relative w-64 h-64 bg-white rounded-xl border-2 border-slate-100 shadow-sm flex items-center justify-center mb-4 overflow-hidden">
                        {loading ? (
                            <div className="flex flex-col items-center gap-2">
                                <RefreshIcon className="w-8 h-8 text-blue-600 animate-spin"/>
                                <span className="text-xs text-slate-500">Đang tạo mã QR...</span>
                            </div>
                        ) : (
                            <img src={qrUrl} alt="VietQR" className="w-full h-full object-contain" />
                        )}
                    </div>

                    <div className="w-full bg-slate-50 p-3 rounded-lg text-center mb-4 border border-slate-200">
                        <p className="text-slate-500 text-xs uppercase font-bold mb-1">Số tiền cần thanh toán</p>
                        <p className="text-2xl font-black text-blue-600">{amount.toLocaleString('vi-VN')} đ</p>
                        <p className="text-[10px] text-slate-400 mt-1 break-all font-mono">{content}</p>
                    </div>

                    <button 
                        onClick={onSuccess}
                        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
                    >
                        <CheckCircleIcon className="w-5 h-5"/> Xác nhận đã nhận tiền
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- MAIN PAYMENT DIALOG ---
const PaymentDialog: React.FC<PaymentDialogProps> = ({ isOpen, onClose, patient, items, onConfirm }) => {
    const { fontSettings } = useTheme();
    
    // States
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Transfer'>('Cash');
    const [discountAmount, setDiscountAmount] = useState<string>('');
    const [receivedAmount, setReceivedAmount] = useState<string>('');
    const [note, setNote] = useState('');
    
    // QR Modal State
    const [showQr, setShowQr] = useState(false);

    // Calculations
    const summary = useMemo(() => {
        return items.reduce((acc, item) => ({
            totalPrice: acc.totalPrice + item.totalPrice,
            insurancePaid: acc.insurancePaid + item.insurancePaid,
            patientPaid: acc.patientPaid + item.patientPaid,
        }), { totalPrice: 0, insurancePaid: 0, patientPaid: 0 });
    }, [items]);

    const discountValue = parseFloat(discountAmount) || 0;
    const finalPatientPayable = Math.max(0, summary.patientPaid - discountValue);

    // Calculate Change (Only relevant for Cash)
    const changeAmount = useMemo(() => {
        if (paymentMethod === 'Transfer') return 0;
        const received = parseFloat(receivedAmount) || 0;
        return received - finalPatientPayable;
    }, [receivedAmount, finalPatientPayable, paymentMethod]);

    const formatCurrency = (val: number) => val.toLocaleString('vi-VN');

    // Initialize / Reset
    useEffect(() => {
        if (isOpen) {
            setPaymentMethod('Cash');
            setDiscountAmount('');
            setReceivedAmount('');
            setNote('');
            setShowQr(false);
        }
    }, [isOpen]);

    // Auto-fill received amount for Transfer (Exact amount expected)
    useEffect(() => {
        if (paymentMethod === 'Transfer') {
            setReceivedAmount(finalPatientPayable.toString());
        } else {
            setReceivedAmount('');
        }
    }, [paymentMethod, finalPatientPayable]);

    const handleConfirm = () => {
        onConfirm({
            method: paymentMethod,
            total: finalPatientPayable,
            received: parseFloat(receivedAmount) || finalPatientPayable,
            discount: discountValue,
            note
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-white dark:bg-slate-800 w-full max-w-7xl h-[95vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700">
                    
                    {/* 1. HEADER */}
                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg">
                                <CurrencyDollarIcon className="w-6 h-6"/>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-wide">Quyết toán Viện phí</h2>
                                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    <span className="font-bold text-slate-700 dark:text-slate-300">{patient.name}</span>
                                    <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                                    <span className="font-mono">{patient.recordId}</span>
                                    <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                                    <span className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 rounded-full text-xs font-bold">
                                        {items.length} mục
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition text-slate-500">
                            <XIcon className="w-8 h-8"/>
                        </button>
                    </div>

                    {/* 2. MAIN CONTENT: Vertical Layout */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-slate-100 dark:bg-black/20">
                        
                        {/* A. TOP: ITEMS LIST (Flexible Height) */}
                        <div className="flex-1 overflow-auto p-4">
                            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <table className={`w-full text-left border-collapse ${fontSettings.listSecondary}`}>
                                    <thead className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-xs uppercase font-bold sticky top-0 z-10">
                                        <tr>
                                            <th className="p-3 w-12 text-center border-r border-slate-200 dark:border-slate-600">#</th>
                                            <th className="p-3 border-r border-slate-200 dark:border-slate-600">Nội dung / Dịch vụ</th>
                                            <th className="p-3 w-20 text-center border-r border-slate-200 dark:border-slate-600">ĐVT</th>
                                            <th className="p-3 w-20 text-center border-r border-slate-200 dark:border-slate-600">SL</th>
                                            <th className="p-3 w-32 text-right border-r border-slate-200 dark:border-slate-600">Đơn giá</th>
                                            <th className="p-3 w-36 text-right border-r border-slate-200 dark:border-slate-600">Thành tiền</th>
                                            <th className="p-3 w-32 text-right border-r border-slate-200 dark:border-slate-600 text-blue-600 dark:text-blue-400">BHYT Trả</th>
                                            <th className="p-3 w-36 text-right text-red-600 dark:text-red-400">BN Phải trả</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-700">
                                        {items.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                                <td className="p-3 text-center text-slate-400 text-xs border-r border-slate-100 dark:border-slate-700">{idx + 1}</td>
                                                <td className="p-3 font-medium text-slate-800 dark:text-slate-200 border-r border-slate-100 dark:border-slate-700">{item.name}</td>
                                                <td className="p-3 text-center text-slate-500 border-r border-slate-100 dark:border-slate-700">{item.unit}</td>
                                                <td className="p-3 text-center font-bold text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-700">{item.quantity}</td>
                                                <td className="p-3 text-right text-slate-500 border-r border-slate-100 dark:border-slate-700">{formatCurrency(item.unitPrice)}</td>
                                                <td className="p-3 text-right font-bold text-slate-800 dark:text-white border-r border-slate-100 dark:border-slate-700">{formatCurrency(item.totalPrice)}</td>
                                                <td className="p-3 text-right text-blue-600 dark:text-blue-400 font-medium border-r border-slate-100 dark:border-slate-700">{formatCurrency(item.insurancePaid)}</td>
                                                <td className="p-3 text-right font-bold text-red-600 dark:text-red-400">{formatCurrency(item.patientPaid)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* B. BOTTOM: PAYMENT CONTROLS (Fixed Height) */}
                        <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] p-6 shrink-0 z-20">
                            
                            <div className="flex flex-col lg:flex-row gap-8">
                                
                                {/* 1. Financial Summary & Discount */}
                                <div className="flex-1 space-y-4 border-r border-slate-100 dark:border-slate-700 pr-6">
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                        <div className="flex justify-between text-slate-500 dark:text-slate-400">
                                            <span>Tổng chi phí:</span>
                                            <span className="font-medium text-slate-800 dark:text-slate-200">{formatCurrency(summary.totalPrice)}</span>
                                        </div>
                                        <div className="flex justify-between text-blue-600 dark:text-blue-400">
                                            <span>BHYT chi trả:</span>
                                            <span className="font-medium">-{formatCurrency(summary.insurancePaid)}</span>
                                        </div>
                                        <div className="col-span-2 border-t border-dashed border-slate-200 dark:border-slate-700 my-1"></div>
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-slate-700 dark:text-slate-300">Tổng BN phải trả:</span>
                                            <span className="font-bold text-lg text-slate-800 dark:text-white">{formatCurrency(summary.patientPaid)}</span>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Miễn giảm (VNĐ)</label>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                value={discountAmount}
                                                onChange={e => setDiscountAmount(e.target.value)}
                                                className="w-full p-2.5 pr-12 bg-purple-50 dark:bg-slate-900 border border-purple-100 dark:border-purple-900/50 rounded-lg text-right font-bold text-purple-700 dark:text-purple-400 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                                placeholder="0"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400 text-xs font-bold">VND</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Payment Method & Amount */}
                                <div className="flex-[1.2] space-y-4 border-r border-slate-100 dark:border-slate-700 pr-6">
                                    {/* Total Hero */}
                                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-200 dark:border-slate-600">
                                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase">Thực thu cuối cùng</span>
                                        <span className="text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tight">{formatCurrency(finalPatientPayable)} <span className="text-sm text-slate-500 font-medium">đ</span></span>
                                    </div>

                                    {/* Method Switcher */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={() => setPaymentMethod('Cash')}
                                            className={`py-3 px-4 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition-all ${
                                                paymentMethod === 'Cash' 
                                                ? 'border-green-500 bg-green-50 text-green-700 ring-1 ring-green-500 dark:bg-green-900/30 dark:text-green-400 dark:border-green-500' 
                                                : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            <CashIcon className="w-5 h-5"/> Tiền mặt
                                        </button>
                                        <button 
                                            onClick={() => setPaymentMethod('Transfer')}
                                            className={`py-3 px-4 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition-all ${
                                                paymentMethod === 'Transfer' 
                                                ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-500' 
                                                : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            <CreditCardIcon className="w-5 h-5"/> Chuyển khoản
                                        </button>
                                    </div>
                                </div>

                                {/* 3. Dynamic Action Area */}
                                <div className="flex-[1.2] flex flex-col justify-between gap-4">
                                    {paymentMethod === 'Cash' ? (
                                        <div className="space-y-4 animate-fade-in">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Khách đưa</label>
                                                <input 
                                                    type="number" 
                                                    value={receivedAmount}
                                                    onChange={e => setReceivedAmount(e.target.value)}
                                                    autoFocus
                                                    className="w-full p-3 text-xl font-bold text-right border-2 border-slate-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none dark:bg-slate-900 dark:border-slate-600 dark:text-white transition-all"
                                                    placeholder="0"
                                                />
                                            </div>
                                            {receivedAmount && (
                                                <div className={`p-3 rounded-xl border flex justify-between items-center ${changeAmount < 0 ? 'bg-red-50 border-red-200 text-red-600' : 'bg-green-50 border-green-200 text-green-700'}`}>
                                                    <span className="text-xs font-bold uppercase">{changeAmount < 0 ? 'Còn thiếu' : 'Tiền thừa trả lại'}</span>
                                                    <span className="text-2xl font-black">{formatCurrency(Math.abs(changeAmount))}</span>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col justify-center animate-fade-in">
                                            <button 
                                                onClick={() => setShowQr(true)}
                                                className="w-full py-4 border-2 border-dashed border-blue-300 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-700 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/20 hover:border-blue-400 transition group"
                                            >
                                                <div className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                                                    <QrcodeIcon className="w-6 h-6 text-blue-600 dark:text-blue-400"/>
                                                </div>
                                                <span className="font-bold text-blue-700 dark:text-blue-400">Tạo mã QR Thanh toán</span>
                                            </button>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-3 mt-auto">
                                        <button className="py-3 text-slate-600 font-bold hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl transition border border-slate-200 dark:border-slate-600 flex items-center justify-center gap-2">
                                            <PrinterIcon className="w-5 h-5"/> In Phiếu
                                        </button>
                                        <button 
                                            onClick={handleConfirm}
                                            disabled={paymentMethod === 'Cash' && changeAmount < 0}
                                            className={`py-3 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all transform active:scale-95 ${
                                                paymentMethod === 'Cash' && changeAmount < 0 
                                                ? 'bg-slate-300 cursor-not-allowed' 
                                                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
                                            }`}
                                        >
                                            <CheckCircleIcon className="w-5 h-5"/> Xác nhận Thu
                                        </button>
                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* QR CODE MODAL LAYER */}
            <QrCodeModal 
                isOpen={showQr} 
                onClose={() => setShowQr(false)} 
                amount={finalPatientPayable}
                content={`${patient.recordId} - ${patient.name}`}
                onSuccess={() => { setShowQr(false); handleConfirm(); }}
            />
        </>
    );
};

export default PaymentDialog;
