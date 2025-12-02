
import React, { useState, useEffect, useMemo } from 'react';
import { 
    XIcon, 
    TagIcon, 
    UserGroupIcon, 
    SaveIcon, 
    DocumentTextIcon,
    CalculatorIcon,
    ShieldCheckIcon // Added icon
} from '../../../../components/Icons';
import { useTheme } from '../../../../contexts/ThemeContext';
import { PatientBillingInfo } from './BillingPatientInfo';

interface DiscountDialogProps {
    isOpen: boolean;
    onClose: () => void;
    patient: PatientBillingInfo;
    onConfirm: (data: { amount: number; reason: string; authorizer: string; isPrint: boolean }) => void;
}

const QUICK_AMOUNTS = [
    { label: '50.000', value: 50000 },
    { label: '100.000', value: 100000 },
    { label: '200.000', value: 200000 },
    { label: '500.000', value: 500000 },
];

const QUICK_PERCENTS = [
    { label: '10%', value: 10 },
    { label: '20%', value: 20 },
    { label: '30%', value: 30 },
    { label: '50%', value: 50 },
    { label: '100%', value: 100 },
];

const DiscountDialog: React.FC<DiscountDialogProps> = ({ isOpen, onClose, patient, onConfirm }) => {
    const { fontSettings } = useTheme();
    
    // Mode: 'amount' (VNĐ) or 'percent' (%)
    const [mode, setMode] = useState<'amount' | 'percent'>('amount');
    
    const [inputValue, setInputValue] = useState<string>(''); // Stores raw input for both modes
    const [reason, setReason] = useState('');
    const [authorizer, setAuthorizer] = useState(''); 
    const [isPrint, setIsPrint] = useState(true);
    const [receiptId, setReceiptId] = useState('');

    // Reset form on open
    useEffect(() => {
        if (isOpen) {
            setMode('amount');
            setInputValue('');
            setReason('Miễn giảm viện phí');
            setAuthorizer('Giám đốc Bệnh viện'); 
            setIsPrint(true);
            setReceiptId(`MG-${Date.now().toString().slice(-6)}`);
        }
    }, [isOpen]);

    const formatCurrency = (val: number) => val.toLocaleString('vi-VN');
    const maxDiscount = patient.totalDebt;

    // Calculate final money amount based on mode
    const calculatedAmount = useMemo(() => {
        const val = parseFloat(inputValue);
        if (isNaN(val) || val < 0) return 0;

        if (mode === 'amount') {
            return Math.min(val, maxDiscount);
        } else {
            // Percentage Mode
            const percent = Math.min(val, 100);
            return Math.round(maxDiscount * (percent / 100));
        }
    }, [inputValue, mode, maxDiscount]);

    const handleQuickSelect = (val: number) => {
        setInputValue(val.toString());
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (calculatedAmount <= 0) {
            alert("Vui lòng nhập giá trị hợp lệ > 0");
            return;
        }
        
        // Create detailed reason if percentage used
        let finalReason = reason;
        if (mode === 'percent') {
            finalReason = `${reason} (${inputValue}%)`;
        }

        onConfirm({
            amount: calculatedAmount,
            reason: finalReason,
            authorizer,
            isPrint
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700 transform transition-all scale-100">
                
                {/* 1. Header */}
                <div className="px-6 py-4 border-b border-purple-600 bg-purple-600 text-white flex justify-between items-center shrink-0 shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <TagIcon className="w-6 h-6 text-white"/>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold uppercase tracking-wide">Phiếu Miễn Giảm</h2>
                            <div className="flex items-center gap-2 text-xs text-purple-100 opacity-90 mt-0.5">
                                <span>Số phiếu: <span className="font-mono font-bold">{receiptId}</span></span>
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
                        
                        {/* Patient Context */}
                        <div className="flex flex-col gap-2 p-3 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800 rounded-lg text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600 dark:text-slate-400">Bệnh nhân: <strong className="text-slate-800 dark:text-white uppercase">{patient.name}</strong></span>
                                <span className="text-slate-600 dark:text-slate-400">Nợ hiện tại: <strong className="text-red-600">{formatCurrency(patient.totalDebt)} đ</strong></span>
                            </div>
                            {/* Insurance Info */}
                            <div className="flex items-center justify-between pt-2 border-t border-purple-200 dark:border-purple-800/50">
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-500 text-xs">Đối tượng:</span>
                                    {patient.patientType === 'BHYT' ? (
                                        <span className="flex items-center gap-1 text-blue-600 font-bold text-xs">
                                            <ShieldCheckIcon className="w-3 h-3"/> BHYT {patient.insuranceRate}%
                                        </span>
                                    ) : (
                                        <span className="text-xs font-bold text-slate-700">{patient.patientType}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Amount Input Section */}
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase">Giá trị miễn giảm</label>
                                
                                {/* Mode Switcher */}
                                <div className="flex bg-slate-200 dark:bg-slate-700 rounded-lg p-0.5 border border-slate-300 dark:border-slate-600">
                                    <button
                                        type="button"
                                        onClick={() => { setMode('amount'); setInputValue(''); }}
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${mode === 'amount' ? 'bg-white dark:bg-slate-600 text-purple-600 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                                    >
                                        VNĐ
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setMode('percent'); setInputValue(''); }}
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${mode === 'percent' ? 'bg-white dark:bg-slate-600 text-purple-600 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                                    >
                                        %
                                    </button>
                                </div>
                            </div>

                            <div className="relative">
                                <input 
                                    type="number" 
                                    value={inputValue}
                                    onChange={e => setInputValue(e.target.value)}
                                    autoFocus
                                    max={mode === 'percent' ? 100 : maxDiscount}
                                    className="w-full p-4 pl-4 pr-16 text-3xl font-bold text-right text-purple-700 bg-white border-2 border-purple-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none dark:bg-slate-800 dark:border-slate-600 dark:text-purple-400 transition-all shadow-inner"
                                    placeholder="0"
                                />
                                <span className="absolute top-1/2 -translate-y-1/2 right-6 text-slate-400 font-bold text-xl">
                                    {mode === 'amount' ? 'đ' : '%'}
                                </span>
                            </div>
                            
                            {/* Helper for Percentage Mode */}
                            {mode === 'percent' && inputValue && (
                                <div className="mt-2 text-right animate-fade-in">
                                    <span className="text-sm text-slate-500 dark:text-slate-400 mr-2">Tương đương:</span>
                                    <span className="text-lg font-bold text-slate-800 dark:text-white">{formatCurrency(calculatedAmount)} đ</span>
                                </div>
                            )}

                            {/* Quick Amount/Percent Chips */}
                            <div className="flex flex-wrap gap-2 mt-3">
                                {mode === 'amount' ? (
                                    <>
                                        {QUICK_AMOUNTS.map(item => (
                                            <button
                                                key={item.value}
                                                type="button"
                                                onClick={() => handleQuickSelect(item.value)}
                                                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:border-purple-500 hover:text-purple-600 hover:bg-purple-50 transition-all active:scale-95"
                                            >
                                                {item.label}
                                            </button>
                                        ))}
                                        {maxDiscount > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => handleQuickSelect(maxDiscount)}
                                                className="px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg text-sm font-medium text-purple-700 hover:bg-purple-100 transition-all active:scale-95"
                                            >
                                                Toàn bộ: {formatCurrency(maxDiscount)}
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    QUICK_PERCENTS.map(item => (
                                        <button
                                            key={item.value}
                                            type="button"
                                            onClick={() => handleQuickSelect(item.value)}
                                            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:border-purple-500 hover:text-purple-600 hover:bg-purple-50 transition-all active:scale-95"
                                        >
                                            {item.label}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">Lý do / Diễn giải</label>
                                <textarea 
                                    rows={2}
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                    className={`w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500 outline-none ${fontSettings.controls}`}
                                    placeholder="Nhập lý do miễn giảm..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">Người duyệt (Signer)</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={authorizer}
                                        onChange={e => setAuthorizer(e.target.value)}
                                        className={`w-full pl-9 p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500 outline-none ${fontSettings.controls}`}
                                        placeholder="Tên người duyệt..."
                                    />
                                    <UserGroupIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
                                </div>
                            </div>
                        </div>

                         <div className="flex items-center gap-2 pt-2">
                            <input 
                                type="checkbox" 
                                id="printReceipt"
                                checked={isPrint}
                                onChange={e => setIsPrint(e.target.checked)}
                                className="w-5 h-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500 cursor-pointer"
                            />
                            <label htmlFor="printReceipt" className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer select-none font-medium flex items-center gap-2">
                                <DocumentTextIcon className="w-4 h-4 text-slate-500"/>
                                In phiếu ngay sau khi lưu
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
                            className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-lg flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={calculatedAmount <= 0}
                        >
                            <SaveIcon className="w-5 h-5"/> Lưu Phiếu
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DiscountDialog;
