
import React from 'react';
import { LocationItem } from '../../../services/bookingService';
import { FormInput, FormDateInput } from '../../../components/shared/forms';

interface PatientInfoFormProps {
    data: any;
    errors: Record<string, string>;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    provinces: LocationItem[];
    wards: LocationItem[];
}

const PatientInfoForm: React.FC<PatientInfoFormProps> = ({ data, errors, onChange, provinces, wards }) => {
    const inputBaseClass = "font-bold text-slate-900 dark:text-white placeholder-slate-400 text-base shadow-sm rounded-xl uppercase";
    const labelClass = "text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider";

    return (
        <div className="space-y-4">
            {/* Hàng 1: Họ tên & Giới tính */}
            <div className="grid grid-cols-12 gap-3">
                <div className="col-span-8">
                    <FormInput 
                        label="Họ và tên bệnh nhân *" 
                        name="name" 
                        value={data.name} 
                        onChange={onChange}
                        className={inputBaseClass}
                        labelClassName={labelClass}
                        placeholder="NGUYỄN VĂN A"
                    />
                </div>
                <div className="col-span-4">
                    <label className={`block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-sm ${labelClass}`}>Giới tính</label>
                    <select name="gender" value={data.gender} onChange={onChange} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold">
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                    </select>
                </div>
            </div>
            
            {/* Hàng 2: Ngày sinh & Số điện thoại */}
            <div className="grid grid-cols-2 gap-3">
                <FormDateInput 
                    label="Ngày sinh (dd/mm/yyyy) *" 
                    name="dob" 
                    value={data.dob} 
                    onChange={onChange}
                    className={`rounded-xl font-bold ${errors.dob ? 'border-red-500 ring-2 ring-red-100' : ''}`}
                    labelClassName={labelClass}
                />
                <FormInput 
                    label="Số điện thoại *" 
                    name="phone" 
                    type="tel"
                    value={data.phone} 
                    onChange={onChange}
                    className="rounded-xl font-bold"
                    labelClassName={labelClass}
                    placeholder="09xxxxxxxx"
                />
            </div>

            {/* Hàng 3: Số CCCD & Ngày cấp */}
            <div className="grid grid-cols-12 gap-3">
                <div className="col-span-7">
                    <FormInput 
                        label="Số CCCD (12 số) *" 
                        name="identityCard" 
                        value={data.identityCard} 
                        onChange={onChange}
                        maxLength={12}
                        className="rounded-xl font-bold font-mono"
                        labelClassName={labelClass}
                        placeholder="0010xxxxxxxx"
                    />
                </div>
                <div className="col-span-5">
                    <FormDateInput 
                        label="Ngày cấp *" 
                        name="identityIssueDate" 
                        value={data.identityIssueDate} 
                        onChange={onChange}
                        className="rounded-xl font-bold"
                        labelClassName={labelClass}
                    />
                </div>
            </div>

            {/* Địa chỉ */}
            <div className="pt-3 border-t border-dashed border-slate-200 dark:border-slate-700">
                <label className="block text-[11px] font-black text-teal-600 uppercase mb-2 ml-1">Địa chỉ thường trú *</label>
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <select 
                        name="provinceId" 
                        value={data.provinceId} 
                        onChange={onChange} 
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-sm"
                    >
                        <option value="">-- Tỉnh/TP --</option>
                        {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <select 
                        name="wardId" 
                        value={data.wardId} 
                        disabled={!data.provinceId} 
                        onChange={onChange} 
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-sm"
                    >
                        <option value="">-- Phường/Xã --</option>
                        {wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                </div>
                <FormInput 
                    label="" 
                    name="addressDetail" 
                    value={data.addressDetail} 
                    onChange={onChange}
                    className="rounded-xl font-bold"
                    placeholder="Số nhà, tên đường..."
                />
            </div>
        </div>
    );
};

export default PatientInfoForm;
