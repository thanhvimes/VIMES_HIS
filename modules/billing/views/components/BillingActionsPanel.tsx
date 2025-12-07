
import React from 'react';
import { 
    PrinterIcon, 
    CurrencyDollarIcon, 
    PlusIcon, 
    CheckCircleIcon, 
    CreditCardIcon,
    DocumentTextIcon,
    TagIcon,
    CalculatorIcon
} from '../../../../components/Icons';
import { PatientBillingInfo } from './BillingPatientInfo';

interface BillingActionsPanelProps {
    patient: PatientBillingInfo;
    onAction: (action: string) => void;
}

const BillingActionsPanel: React.FC<BillingActionsPanelProps> = ({ patient, onAction }) => {
    const formatCurrency = (val: number) => val.toLocaleString('vi-VN');
    
    const totalCost = patient.totalDebt;
    const insurancePay = patient.totalInsurance;
    const discount = patient.totalDiscount;
    
    // Số tiền bệnh nhân phải trả (Sau BH và Miễn giảm)
    const patientPayable = totalCost - insurancePay - discount;
    
    // Số tiền còn lại phải thanh toán (Sau khi trừ tạm ứng)
    const finalPayment = patientPayable - patient.balance;
    
    const isDebt = finalPayment > 0;
    const isRefund = finalPayment < 0;

    return (
        <div className="h-full flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            
            {/* 1. Header */}
            <div className="bg-slate-50 dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm uppercase flex items-center gap-2">
                    <CurrencyDollarIcon className="w-5 h-5 text-blue-600"/> Tổng hợp thanh toán
                </h3>
            </div>
            
            {/* 2. Calculation Details */}
            <div className="p-5 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
                
                {/* Cost Breakdown */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Tổng chi phí</span>
                        <span className="font-bold text-slate-900 dark:text-white text-base">{formatCurrency(totalCost)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                             <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> BHYT chi trả
                        </span>
                        <span className="font-medium text-blue-600 dark:text-blue-400">-{formatCurrency(insurancePay)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                             <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> Miễn giảm
                        </span>
                        <span className="font-medium text-purple-600 dark:text-purple-400">-{formatCurrency(discount)}</span>
                    </div>
                </div>

                <div className="border-t border-dashed border-slate-300 dark:border-slate-600"></div>
                
                {/* Patient Liability */}
                <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">BN Phải trả</span>
                    <span className="font-bold text-slate-900 dark:text-white text-lg">{formatCurrency(patientPayable)}</span>
                </div>

                {/* Advance Payment */}
                <div className="bg-slate-100 dark:bg-slate-700/50 p-3 rounded-lg flex justify-between items-center text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Đã tạm ứng</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatCurrency(patient.balance)}</span>
                </div>

                {/* Final Result Card */}
                <div className={`p-5 rounded-xl text-center border-2 transition-all ${
                    isDebt 
                        ? 'bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-900/50' 
                        : isRefund 
                            ? 'bg-green-50 border-green-100 dark:bg-green-900/10 dark:border-green-900/50'
                            : 'bg-gray-50 border-gray-100 dark:bg-slate-800 dark:border-slate-600'
                }`}>
                    <p className={`text-xs uppercase font-bold mb-1 tracking-wider ${
                        isDebt ? 'text-red-600' : isRefund ? 'text-green-600' : 'text-slate-500'
                    }`}>
                        {isDebt ? 'SỐ TIỀN CẦN THU' : isRefund ? 'TIỀN THỪA TRẢ LẠI' : 'ĐÃ THANH TOÁN ĐỦ'}
                    </p>
                    <p className={`text-3xl font-black tracking-tight ${
                        isDebt ? 'text-red-600 dark:text-red-400' : isRefund ? 'text-green-600 dark:text-green-400' : 'text-slate-400'
                    }`}>
                        {formatCurrency(Math.abs(finalPayment))}
                    </p>
                </div>

            </div>

            {/* 3. Primary Actions (Sticky Bottom) */}
            <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 space-y-3">
                <button 
                    onClick={() => onAction('payment')}
                    disabled={!isDebt && !isRefund && finalPayment === 0}
                    className={`w-full py-3.5 rounded-lg font-bold shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 uppercase tracking-wide text-sm ${
                        !isDebt && !isRefund && finalPayment === 0 
                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed shadow-none'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                >
                    <CheckCircleIcon className="w-5 h-5"/> 
                    {isRefund ? 'Hoàn ứng / Trả lại' : 'Thu tiền & Xuất HĐ'}
                </button>
                
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => onAction('deposit')}
                        className="py-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                    >
                        <CreditCardIcon className="w-4 h-4"/> Thu tạm ứng
                    </button>
                    <button 
                        onClick={() => onAction('add_service')}
                        className="py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                    >
                        <PlusIcon className="w-4 h-4"/> Thêm chỉ định
                    </button>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                     <button 
                        onClick={() => onAction('discount')}
                        className="py-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg font-semibold text-[10px] flex flex-col items-center justify-center gap-1 transition"
                    >
                        <TagIcon className="w-4 h-4"/> Miễn giảm
                    </button>
                    <button 
                        onClick={() => onAction('print')}
                        className="py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg font-semibold text-[10px] flex flex-col items-center justify-center gap-1 transition"
                    >
                        <PrinterIcon className="w-4 h-4"/> In bảng kê
                    </button>
                    <button 
                        onClick={() => onAction('print_receipt')}
                        className="py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg font-semibold text-[10px] flex flex-col items-center justify-center gap-1 transition"
                    >
                        <DocumentTextIcon className="w-4 h-4"/> In biên lai
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BillingActionsPanel;
