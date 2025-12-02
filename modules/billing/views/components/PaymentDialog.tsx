
import React, { useState, useMemo, useEffect } from 'react';
import { 
    XIcon, 
    PrinterIcon, 
    CheckCircleIcon, 
    CurrencyDollarIcon, 
    CreditCardIcon,
    QrcodeIcon,
    CashIcon,
    RefreshIcon,
    ShieldCheckIcon,
    UserCircleIcon, // Added icon
    ClockIcon,      // Added icon
    DocumentTextIcon // Added icon
} from '../../../../components/Icons';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useSession } from '../../../../contexts/SessionContext'; // Added session context
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
    const { user } = useSession(); // Get current user info
    
    // States
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Transfer'>('Cash');
    const [discountAmount, setDiscountAmount] = useState<string>('');
    const [receivedAmount, setReceivedAmount] = useState<string>('');
    const [note, setNote] = useState('');
    
    // Transaction Metadata State
    const [receiptId, setReceiptId] = useState('');
    const [transactionTime, setTransactionTime] = useState(new Date());

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
    
    // Settlement (after deducting advance) - only for info
    const settlementAmount = finalPatientPayable - patient.balance;

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
            
            // Generate Receipt Data
            const now = new Date();
            setTransactionTime(now);
            // Format: PT-YYYYMMDD-Random3Digits
            const dateStr = now.toISOString().slice(0,10).replace(/-/g, '');
            setReceiptId(`PT-${dateStr}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`);
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
            receiptId,
            cashier: user?.fullName,
            timestamp: transactionTime.toISOString(),
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
                <div className="bg-white dark:bg-slate-800 w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700">
                    
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

                    {/* 2. MAIN CONTENT */}
                    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                        
                        {/* LEFT: Summary & Context (40%) */}
                        <div className="w-full lg:w-2/5 bg-slate-50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-700 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                            
                            {/* Invoice Summary */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 pb-2">Chi tiết Hóa đơn</h3>
                                <div className="space-y-3 text-sm bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600 dark:text-slate-400">Tổng chi phí:</span>
                                        <span className="font-bold text-slate-800 dark:text-white">{formatCurrency(summary.totalPrice)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-blue-600 dark:text-blue-400">
                                        <span>BHYT chi trả:</span>
                                        <span className="font-medium">-{formatCurrency(summary.insurancePaid)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-purple-600 dark:text-purple-400">
                                        <span>Miễn giảm:</span>
                                        <span className="font-medium">-{formatCurrency(discountValue)}</span>
                                    </div>
                                    
                                    <div className="border-t border-dashed border-slate-200 dark:border-slate-600 my-2"></div>
                                    
                                    <div className="flex justify-between items-center text-lg">
                                        <span className="font-bold text-slate-800 dark:text-white">Tổng BN phải trả:</span>
                                        <span className="font-black text-red-600 dark:text-red-400">{formatCurrency(finalPatientPayable)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Patient Account Context */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 pb-2">Thông tin Tài chính BN</h3>
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600 dark:text-slate-400">Tổng tạm ứng (Đã đóng):</span>
                                        <span className="font-mono font-bold text-green-600 dark:text-green-400">{formatCurrency(patient.balance)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600 dark:text-slate-400">Tổng miễn giảm (Lịch sử):</span>
                                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{formatCurrency(patient.totalDiscount)}</span>
                                    </div>

                                    {/* Settlement Preview */}
                                    {patient.balance > 0 && (
                                        <div className={`mt-3 p-3 rounded-lg text-center border ${settlementAmount > 0 ? 'bg-red-50 border-red-100 text-red-700 dark:bg-red-900/20 dark:border-red-800' : 'bg-green-50 border-green-100 text-green-700 dark:bg-green-900/20 dark:border-green-800'}`}>
                                            <p className="text-xs uppercase font-bold mb-1">{settlementAmount > 0 ? 'Sau khi trừ tạm ứng còn thiếu' : 'Dư tạm ứng (Có thể hoàn)'}</p>
                                            <p className="text-lg font-black">{formatCurrency(Math.abs(settlementAmount))}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Discount Input */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">NHẬP MIỄN GIẢM THÊM (VNĐ)</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        value={discountAmount}
                                        onChange={e => setDiscountAmount(e.target.value)}
                                        className="w-full p-3 pr-12 bg-purple-50 dark:bg-slate-800 border border-purple-200 dark:border-slate-600 rounded-lg text-right font-bold text-purple-700 dark:text-purple-400 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                        placeholder="0"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400 text-xs font-bold">VND</span>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Action Area (60%) */}
                        <div className="w-full lg:w-3/5 p-8 flex flex-col bg-white dark:bg-slate-900">
                            
                            {/* NEW: Transaction Details Bar */}
                            <div className="mb-6 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex justify-between items-center shadow-inner">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
                                        <DocumentTextIcon className="w-3 h-3"/> Số phiếu thu
                                    </span>
                                    <span className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400">{receiptId}</span>
                                </div>
                                <div className="h-8 w-px bg-slate-300 dark:bg-slate-600"></div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
                                        <UserCircleIcon className="w-3 h-3"/> Người thu
                                    </span>
                                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{user?.fullName || 'Admin'}</span>
                                </div>
                                <div className="h-8 w-px bg-slate-300 dark:bg-slate-600"></div>
                                <div className="flex flex-col text-right">
                                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1 justify-end">
                                        <ClockIcon className="w-3 h-3"/> Thời gian
                                    </span>
                                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{transactionTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                            </div>

                            {/* Amount Hero */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-2xl border border-blue-100 dark:border-blue-800 text-center mb-8 shadow-sm flex-shrink-0">
                                <p className="text-sm font-bold text-blue-600 dark:text-blue-300 uppercase mb-2 tracking-widest">SỐ TIỀN CẦN THU</p>
                                <p className="text-5xl font-black text-blue-700 dark:text-blue-400 tracking-tight">{formatCurrency(finalPatientPayable)} <span className="text-2xl text-blue-500 font-medium">VNĐ</span></p>
                            </div>

                            {/* Payment Method */}
                            <div className="grid grid-cols-2 gap-4 mb-8 flex-shrink-0">
                                <button 
                                    onClick={() => setPaymentMethod('Cash')} 
                                    className={`py-4 px-6 rounded-xl font-bold border-2 transition-all flex flex-col items-center gap-2 ${
                                        paymentMethod === 'Cash' 
                                        ? 'border-green-500 bg-green-50 text-green-700 shadow-md transform scale-105' 
                                        : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <CashIcon className="w-8 h-8"/>
                                    <span>Tiền mặt</span>
                                </button>
                                <button 
                                    onClick={() => setPaymentMethod('Transfer')} 
                                    className={`py-4 px-6 rounded-xl font-bold border-2 transition-all flex flex-col items-center gap-2 ${
                                        paymentMethod === 'Transfer' 
                                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md transform scale-105' 
                                        : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <CreditCardIcon className="w-8 h-8"/>
                                    <span>Chuyển khoản</span>
                                </button>
                            </div>

                            {/* Dynamic Input Area */}
                            <div className="flex-1 mb-6">
                                {paymentMethod === 'Cash' ? (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">KHÁCH ĐƯA</label>
                                            <input 
                                                type="number" 
                                                value={receivedAmount}
                                                onChange={e => setReceivedAmount(e.target.value)}
                                                autoFocus
                                                className="w-full p-5 text-4xl font-black text-right border-2 border-slate-300 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none bg-white text-slate-900 shadow-inner transition-all" 
                                                placeholder="0"
                                            />
                                        </div>
                                        {receivedAmount && (
                                            <div className={`p-5 rounded-xl border-2 flex justify-between items-center transition-colors ${changeAmount < 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                                                <span className="font-bold uppercase tracking-wider">{changeAmount < 0 ? 'CÒN THIẾU' : 'TIỀN THỪA TRẢ LẠI'}</span>
                                                <span className="text-3xl font-black">{formatCurrency(Math.abs(changeAmount))}</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                         <button 
                                            onClick={() => setShowQr(true)}
                                            className="flex flex-col items-center gap-4 p-8 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-2xl transition group"
                                        >
                                            <div className="p-4 bg-white dark:bg-slate-700 rounded-full shadow-md group-hover:scale-110 transition-transform">
                                                <QrcodeIcon className="w-12 h-12 text-blue-600 dark:text-blue-400"/>
                                            </div>
                                            <div className="text-center">
                                                <h4 className="font-bold text-lg text-blue-700 dark:text-blue-400">Tạo mã QR Thanh toán</h4>
                                                <p className="text-sm text-slate-500">Hỗ trợ VietQR, Momo, VNPAY</p>
                                            </div>
                                         </button>
                                    </div>
                                )}
                            </div>
                            
                            {/* Footer Actions */}
                            <div className="grid grid-cols-2 gap-4 mt-auto">
                                 <button className="py-4 text-slate-600 font-bold hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl transition border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2">
                                    <PrinterIcon className="w-6 h-6"/> In Phiếu Thu
                                 </button>
                                 <button 
                                    onClick={handleConfirm}
                                    disabled={paymentMethod === 'Cash' && changeAmount < 0}
                                    className={`py-4 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 text-lg ${
                                        paymentMethod === 'Cash' && changeAmount < 0 
                                        ? 'bg-slate-300 cursor-not-allowed' 
                                        : 'bg-blue-600 hover:bg-blue-700 hover:shadow-xl'
                                    }`}
                                 >
                                    <CheckCircleIcon className="w-6 h-6"/> XÁC NHẬN THU
                                 </button>
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
