
import React from 'react';
import { 
    UserCircleIcon,
    PhoneIcon,
    HomeIcon,
    ShieldCheckIcon,
    ClockIcon,
    CreditCardIcon
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
    
    patientType: 'BHYT' | 'Dịch vụ' | 'Thu phí' | 'Miễn phí';
    insuranceNumber?: string;
    insuranceRate?: number; 
    insuranceRegDate?: string;
    insuranceExpDate?: string;
    insurancePlace?: string;

    balance: number; // Số dư tạm ứng
    totalDebt: number; // Tổng chi phí
    totalInsurance: number; // Tổng BHYT chi trả
    totalDiscount: number; // Tổng miễn giảm
    
    status: 'open' | 'closed' | 'locked';
}

interface BillingPatientInfoProps {
    patient: PatientBillingInfo;
    onAction?: (action: string) => void;
}

const BillingPatientInfo: React.FC<BillingPatientInfoProps> = ({ patient }) => {
    
    const formatCurrency = (val: number) => val.toLocaleString('vi-VN');

    const calculateAge = (dob: string) => {
        const year = new Date(dob).getFullYear();
        return new Date().getFullYear() - year;
    };

    return (
        <div className="h-full flex flex-col gap-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-y-auto custom-scrollbar">
            
            {/* 1. Header Avatar */}
            <div className="p-6 flex flex-col items-center border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
                    <UserCircleIcon className="w-12 h-12"/>
                </div>
                <h2 className="text-xl font-black text-slate-800 dark:text-white text-center uppercase leading-tight">
                    {patient.name}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">
                        {patient.recordId}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${patient.patientType === 'BHYT' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                        {patient.patientType}
                    </span>
                </div>
            </div>

            {/* 2. Demographics */}
            <div className="px-5 py-2 space-y-4">
                <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                        <UserCircleIcon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0"/>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold">Thông tin chung</p>
                            <p className="text-slate-700 dark:text-slate-300 font-medium">
                                {calculateAge(patient.dob)} tuổi - {patient.gender} - {new Date(patient.dob).toLocaleDateString('vi-VN')}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                        <PhoneIcon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0"/>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold">Liên hệ</p>
                            <p className="text-slate-700 dark:text-slate-300 font-medium">{patient.phone}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <HomeIcon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0"/>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold">Địa chỉ</p>
                            <p className="text-slate-700 dark:text-slate-300 font-medium leading-snug">{patient.address}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <ClockIcon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0"/>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold">Vào viện / Khoa</p>
                            <p className="text-slate-700 dark:text-slate-300 font-medium">
                                {patient.admissionDate.split(' ')[0]} <br/>
                                <span className="text-blue-600 dark:text-blue-400">{patient.department}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* 3. Insurance Card Info */}
                {patient.patientType === 'BHYT' && (
                    <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-900/30">
                        <h3 className="text-xs font-bold text-orange-700 dark:text-orange-400 uppercase mb-2 flex items-center gap-1">
                            <ShieldCheckIcon className="w-4 h-4"/> Thông tin BHYT
                        </h3>
                        <div className="space-y-2 text-xs">
                             <div className="flex justify-between">
                                <span className="text-slate-500">Số thẻ:</span>
                                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{patient.insuranceNumber}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Mức hưởng:</span>
                                <span className="font-bold text-white bg-orange-500 px-1.5 py-0.5 rounded">{patient.insuranceRate}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Hạn dùng:</span>
                                <span className="font-medium text-slate-700 dark:text-slate-300">{patient.insuranceExpDate}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 block mb-0.5">Nơi ĐKKCB:</span>
                                <span className="font-medium text-slate-700 dark:text-slate-300 line-clamp-2">{patient.insurancePlace}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 4. Advance Balance (Sticky Bottom of Info) */}
            <div className="mt-auto p-5 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-slate-500 uppercase flex items-center gap-1">
                        <CreditCardIcon className="w-4 h-4"/> Số dư tạm ứng
                    </span>
                </div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(patient.balance)} <span className="text-sm text-slate-400 font-medium">đ</span>
                </div>
            </div>
        </div>
    );
};

export default BillingPatientInfo;
