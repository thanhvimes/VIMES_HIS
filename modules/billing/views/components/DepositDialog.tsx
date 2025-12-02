
import React, { useState, useEffect } from 'react';
import { 
    XIcon, 
    PrinterIcon, 
    CreditCardIcon, 
    UserCircleIcon,
    SaveIcon,
    CheckCircleIcon,
    ShieldCheckIcon // Added icon
} from '../../../../components/Icons';
import { useTheme } from '../../../../contexts/ThemeContext';
import { PatientBillingInfo } from './BillingPatientInfo';

interface DepositDialogProps {
    isOpen: boolean;
    onClose: () => void;
    patient: PatientBillingInfo;
    onConfirm: (data: { amount: number; method: string; note: string; isPrint: boolean }) => void;
}

const QUICK_AMOUNTS = [500000, 1000000, 2000000, 5000000, 10000000];

const DepositDialog: React.FC<DepositDialogProps> = ({ isOpen, onClose, patient, onConfirm }) => {
    const { fontSettings } = useTheme();
    const [amount, setAmount] = useState<string>('');
    const [method, setMethod] = useState('Cash');
    const [note, setNote] = useState('');
    const [isPrint, setIsPrint] = useState(true);

    // Reset form on open
    useEffect(() => {
        if (isOpen) {
            setAmount('');
            setMethod('Cash');
            setNote('');
            setIsPrint(true);
        }
    }, [isOpen]);

    const formatCurrency = (val: number) => val.toLocaleString('vi-VN');

    const handleQuickAmount = (val: number) => {
        setAmount(val.toString());
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if (!numAmount || numAmount <= 0) {
            alert("Vui lòng nhập số tiền hợp lệ");
            return;
        }
        onConfirm({
            amount: numAmount,
            method,
            note,
            isPrint
        });
        onClose();
    };

    if (!isOpen) return null;

    // Tính toán số tiền gợi ý (Ví dụ: tổng nợ trừ đi số dư hiện tại)
    const suggestedAmount = Math.max(0, patient.totalDebt - patient.balance);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700 transform transition-all scale-100">
                
                {/* 1. Header */}
                <div className="px-6 py-4 border-b border-teal-600 bg-teal-600 text-white flex justify-between items-center shrink-0 shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <CreditCardIcon className="w-6 h-6 text-white"/>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold uppercase tracking-wide">Thu Tiền Tạm Ứng</h2>
                            <div className="flex items-center gap-2 text-xs text-teal-100 opacity-90 mt-0.5">
                                <span>Phiếu thu: <span className="font-mono font-bold">TU-{Date.now().toString().slice(-6)}</span></span>
                                <span>•</span>
                                <span>{new Date().toLocaleDateString('vi-VN')}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition text-white/80 hover:text-white">
                        <XIcon className="w-6 h-6"/>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-900/50">
                        
                        {/* Patient Summary Card */}
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 flex items-center justify-center text-xl font-bold border border-teal-100 dark:border-teal-800">
                                    {patient.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-white text-base">{patient.name}</h3>
                                    <p className="text-xs text-slate-500">{patient.recordId} - {patient.dob}</p>
                                    
                                    {/* Insurance Info Added Here */}
                                    {patient.patientType === 'BHYT' && patient.insuranceNumber ? (
                                        <div className="mt-1.5 flex items-center gap-2 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded border border-blue-100 dark:border-blue-800 w-fit">
                                            <ShieldCheckIcon className="w-3.5 h-3.5"/>
                                            <span className="font-mono font-bold">{patient.insuranceNumber}</span>
                                            <span className="border-l border-blue-200 dark:border-blue-700 pl-2 ml-1 font-semibold">Hưởng {patient.insuranceRate}%</span>
                                        </div>
                                    ) : (
                                        <div className="mt-1.5 text-xs text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded w-fit font-bold">
                                            Đối tượng: {patient.patientType}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="text-left md:text-right mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-dashed border-slate-200 dark:border-slate-700">
                                <p className="text-xs text-slate-500 mb-0.5">Số dư hiện tại</p>
                                <p className={`font-bold text-xl ${patient.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                    {formatCurrency(patient.balance)} đ
                                </p>
                            </div>
                        </div>

                        {/* Amount Input Section */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase">Số tiền nộp (VNĐ)</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    autoFocus
                                    className="w-full p-4 pl-4 pr-16 text-3xl font-bold text-right text-teal-700 bg-white border-2 border-teal-200 rounded-xl focus:ring-4 focus:ring-teal-100 focus:border-teal-500 outline-none dark:bg-slate-800 dark:border-slate-600 dark:text-teal-400 transition-all shadow-inner"
                                    placeholder="0"
                                />
                                <span className="absolute top-1/2 -translate-y-1/2 right-6 text-slate-400 font-bold">đ</span>
                            </div>
                            
                            {/* Quick Amount Chips */}
                            <div className="flex flex-wrap gap-2 mt-3">
                                {QUICK_AMOUNTS.map(val => (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => handleQuickAmount(val)}
                                        className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:border-teal-500 hover:text-teal-600 hover:bg-teal-50 transition-all active:scale-95"
                                    >
                                        +{val.toLocaleString()}
                                    </button>
                                ))}
                                {suggestedAmount > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => handleQuickAmount(suggestedAmount)}
                                        className="px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg text-sm font-medium text-orange-700 hover:bg-orange-100 transition-all active:scale-95"
                                    >
                                        Nợ: {formatCurrency(suggestedAmount)}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Payment Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">Hình thức thanh toán</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['Cash', 'Transfer', 'Card'].map(m => (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => setMethod(m)}
                                            className={`py-2.5 px-2 rounded-lg text-sm font-bold border transition-all ${
                                                method === m 
                                                ? 'bg-teal-600 text-white border-teal-600 shadow-md' 
                                                : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            {m === 'Cash' ? 'Tiền mặt' : m === 'Transfer' ? 'Chuyển khoản' : 'Thẻ'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">Nội dung / Ghi chú</label>
                                <input 
                                    type="text" 
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                    placeholder="VD: Tạm ứng mổ..."
                                    className={`w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-teal-500 outline-none ${fontSettings.controls}`}
                                />
                            </div>
                        </div>

                         <div className="flex items-center gap-2 pt-2">
                            <input 
                                type="checkbox" 
                                id="printReceipt"
                                checked={isPrint}
                                onChange={e => setIsPrint(e.target.checked)}
                                className="w-5 h-5 text-teal-600 rounded border-gray-300 focus:ring-teal-500 cursor-pointer"
                            />
                            <label htmlFor="printReceipt" className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer select-none font-medium">
                                In biên lai thu tiền ngay sau khi lưu
                            </label>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-end gap-3">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-6 py-3 rounded-lg font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                        >
                            Hủy bỏ
                        </button>
                        <button 
                            type="submit"
                            className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold shadow-lg flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!amount}
                        >
                            <SaveIcon className="w-5 h-5"/> Lưu & Thu tiền
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DepositDialog;
