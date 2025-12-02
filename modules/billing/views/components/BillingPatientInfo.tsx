
import React from 'react';
import { 
    PrinterIcon, 
    CurrencyDollarIcon, 
    PlusIcon, 
    CheckCircleIcon, 
    CreditCardIcon,
    DocumentTextIcon,
    TagIcon
} from '../../../../components/Icons';

export interface PatientBillingInfo {
    id: string;
    recordId: string;
    name: string;
    dob: string;
    gender: string;
    address: string;
    phone: string;
    admissionDate: string;
    department: string;
    
    // New fields
    patientType: 'BHYT' | 'Dịch vụ' | 'Thu phí' | 'Miễn phí';
    insuranceNumber?: string;
    insuranceRate?: number; 
    insuranceRegDate?: string;
    insuranceExpDate?: string;
    insurancePlace?: string; // Nơi đăng ký KCB ban đầu

    balance: number; // Số dư tạm ứng
    totalDebt: number; // Tổng chi phí (chưa trừ BHYT, chưa trừ tạm ứng)
    totalInsurance: number; // Tổng BHYT chi trả
    totalDiscount: number; // Tổng miễn giảm
    
    status: 'open' | 'closed' | 'locked';
}

interface BillingPatientInfoProps {
    patient: PatientBillingInfo;
    onAction: (action: string) => void;
}

const BillingPatientInfo: React.FC<BillingPatientInfoProps> = ({ patient, onAction }) => {
    const formatCurrency = (val: number) => val.toLocaleString('vi-VN');
    
    // Tính toán: 
    // 1. Tổng chi phí (Total Cost) = patient.totalDebt (giả sử API trả về tổng chưa trừ gì)
    //    HOẶC nếu totalDebt là phần BN phải trả sau BH, ta cần cộng lại.
    //    Ở đây giả định: totalDebt là TỔNG CHI PHÍ DỊCH VỤ.
    
    const totalCost = patient.totalDebt;
    const insurancePay = patient.totalInsurance;
    const discount = patient.totalDiscount;
    
    // Số tiền bệnh nhân phải trả (Sau BH và Miễn giảm)
    const patientPayable = totalCost - insurancePay - discount;
    
    // Số tiền còn lại phải thanh toán (Sau khi trừ tạm ứng)
    const finalPayment = patientPayable - patient.balance;
    
    const isDebt = finalPayment > 0;

    return (
        <div className="h-full flex flex-col gap-4">
            
            {/* 1. FINANCIAL SUMMARY CARD */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-900 p-3 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm uppercase flex items-center gap-2">
                        <CurrencyDollarIcon className="w-5 h-5 text-emerald-600"/> Tóm tắt Tài chính
                    </h3>
                </div>
                
                <div className="p-4 space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400">Tổng chi phí</span>
                        <span className="font-bold text-slate-800 dark:text-white">{formatCurrency(totalCost)}</span>
                    </div>
                    <div className="flex justify-between items-center text-blue-600 dark:text-blue-400">
                        <span>BHYT chi trả</span>
                        <span className="font-bold">-{formatCurrency(insurancePay)}</span>
                    </div>
                    <div className="flex justify-between items-center text-purple-600 dark:text-purple-400">
                        <span>Miễn giảm</span>
                        <span className="font-bold">-{formatCurrency(discount)}</span>
                    </div>
                    
                    <div className="border-t border-dashed border-slate-200 dark:border-slate-700 my-2"></div>
                    
                    <div className="flex justify-between items-center">
                        <span className="text-slate-700 dark:text-slate-300 font-bold">BN Phải trả</span>
                        <span className="font-bold text-red-600 dark:text-red-400 text-base">{formatCurrency(patientPayable)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                        <span>Đã tạm ứng</span>
                        <span className="font-bold">{formatCurrency(patient.balance)}</span>
                    </div>

                    <div className={`mt-3 p-3 rounded-lg border flex justify-between items-center ${isDebt ? 'bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-900' : 'bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-900'}`}>
                        <span className={`text-xs uppercase font-bold ${isDebt ? 'text-red-600' : 'text-green-600'}`}>
                            {isDebt ? 'Cần thanh toán' : 'Dư tiền (Hoàn lại)'}
                        </span>
                        <span className={`text-xl font-black ${isDebt ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            {formatCurrency(Math.abs(finalPayment))}
                        </span>
                    </div>
                </div>
            </div>

            {/* 2. ACTIONS PANEL */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex-1 flex flex-col p-4">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm uppercase mb-3">Thao tác thu ngân</h3>
                
                <div className="space-y-3">
                    <button 
                        onClick={() => onAction('payment')}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95"
                    >
                        <CheckCircleIcon className="w-5 h-5"/> Quyết toán / Thu tiền
                    </button>
                    
                    <button 
                        onClick={() => onAction('deposit')}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-95"
                    >
                        <CreditCardIcon className="w-5 h-5"/> Thu tạm ứng
                    </button>
                    
                    <div className="grid grid-cols-2 gap-2 pt-2">
                        <button 
                            onClick={() => onAction('discount')}
                            className="py-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg font-semibold text-xs flex flex-col items-center justify-center gap-1 transition"
                        >
                            <TagIcon className="w-4 h-4"/> Miễn giảm
                        </button>
                        <button 
                            onClick={() => onAction('add_service')}
                            className="py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-semibold text-xs flex flex-col items-center justify-center gap-1 transition"
                        >
                            <PlusIcon className="w-4 h-4"/> Thêm phí
                        </button>
                        <button 
                            onClick={() => onAction('print')}
                            className="py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-semibold text-xs flex flex-col items-center justify-center gap-1 transition"
                        >
                            <PrinterIcon className="w-4 h-4"/> In Bảng kê
                        </button>
                         <button 
                            onClick={() => onAction('print_receipt')}
                            className="py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-semibold text-xs flex flex-col items-center justify-center gap-1 transition"
                        >
                            <DocumentTextIcon className="w-4 h-4"/> In Biên lai
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BillingPatientInfo;
