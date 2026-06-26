
import React from 'react';
import { LocationItem } from '../../../services/bookingService';
import { FormInput, FormDateInput, FormSelect } from '../../../components/ui/forms';

interface PatientInfoFormProps {
    data: any;
    errors: Record<string, string>;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    provinces: LocationItem[];
    wards: LocationItem[];
}

const PatientInfoForm: React.FC<PatientInfoFormProps> = ({ data, errors, onChange, provinces, wards }) => {
    // Standardize heights and aesthetics to be uniform and premium
    const inputBaseClass = "!h-12 py-1.5 bg-slate-50 dark:bg-slate-900/50 font-bold text-slate-900 dark:text-white placeholder-slate-400 text-sm shadow-sm rounded-xl leading-normal";
    const labelClass = "text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider";

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const normalizedValue = value.normalize('NFC');

        // 1. Update the name in parent state with NFC normalized value only (NO toUpperCase here)
        // Visual uppercase is handled by CSS text-transform:uppercase on the input element
        onChange({
            ...e,
            target: {
                ...e.target,
                name: 'name',
                value: normalizedValue
            }
        });

        // 2. Guess gender based on common Vietnamese middle names (check both cases)
        const lowerValue = normalizedValue.toLowerCase();
        const words = lowerValue.trim().split(/\s+/);
        let guessedGender = '';
        if (words.includes('thị')) {
            guessedGender = 'F'; // Nữ
        } else if (words.includes('văn')) {
            guessedGender = 'M'; // Nam
        }

        if (guessedGender && guessedGender !== data.gender) {
            onChange({
                target: {
                    name: 'gender',
                    value: guessedGender
                }
            } as any);
        }
    };

    return (
        <div className="space-y-4">
            {/* Row 1: Name & Gender */}
            <div className="grid grid-cols-12 gap-3">
                <div className="col-span-8">
                    <FormInput
                        label="Họ và tên bệnh nhân *"
                        name="name"
                        value={data.name}
                        onChange={handleNameChange}
                        className={inputBaseClass}
                        labelClassName={labelClass}
                        placeholder="Nguyễn Văn A"
                        style={{ textTransform: 'uppercase' }}
                    />
                </div>
                <div className="col-span-4">
                    <FormSelect
                        label="Giới tính"
                        name="gender"
                        value={data.gender}
                        onChange={onChange}
                        className={inputBaseClass}
                        labelClassName={labelClass}
                    >
                        <option value="M">Nam</option>
                        <option value="F">Nữ</option>
                    </FormSelect>
                </div>
            </div>

            {/* Row 2: DOB & Phone */}
            <div className="grid grid-cols-2 gap-3">
                <FormDateInput
                    label="Ngày sinh (dd/mm/yyyy) *"
                    name="dob"
                    value={data.dob}
                    onChange={onChange}
                    className={`${inputBaseClass} ${errors.dob ? 'border-red-500 ring-2 ring-red-100' : ''}`}
                    labelClassName={labelClass}
                />
                <FormInput
                    label="Số điện thoại *"
                    name="phone"
                    type="tel"
                    value={data.phone}
                    onChange={onChange}
                    maxLength={10}
                    className={inputBaseClass}
                    labelClassName={labelClass}
                    placeholder="09xxxxxxxx"
                />
            </div>

            {/* Row 3: Identity Card & Issue Date */}
            <div className="grid grid-cols-12 gap-3">
                <div className="col-span-7">
                    <FormInput
                        label="Số CCCD (12 số) *"
                        name="identityCard"
                        value={data.identityCard}
                        onChange={onChange}
                        maxLength={12}
                        className={`${inputBaseClass} font-mono`}
                        labelClassName={labelClass}
                        placeholder="0010xxxxxxxx"
                    />
                </div>
                <div className="col-span-5">
                    <FormDateInput
                        label="Ngày cấp"
                        name="identityIssueDate"
                        value={data.identityIssueDate}
                        onChange={onChange}
                        className={inputBaseClass}
                        labelClassName={labelClass}
                    />
                </div>
            </div>

            {/* Address Section */}
            <div className="pt-3 border-t border-dashed border-slate-200 dark:border-slate-700">
                <label className="block text-[11px] font-black text-teal-600 uppercase mb-2 ml-1">Địa chỉ thường trú *</label>
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <FormSelect
                        label=""
                        name="provinceId"
                        value={data.provinceId}
                        onChange={onChange}
                        className={`${inputBaseClass} text-sm`}
                        containerClassName="flex-1"
                    >
                        <option value="">-- Tỉnh/TP --</option>
                        {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </FormSelect>
                    <FormSelect
                        label=""
                        name="wardId"
                        value={data.wardId}
                        disabled={!data.provinceId}
                        onChange={onChange}
                        className={`${inputBaseClass} text-sm`}
                        containerClassName="flex-1"
                    >
                        <option value="">-- Phường/Xã --</option>
                        {wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </FormSelect>
                </div>
                <FormInput
                    label=""
                    name="addressDetail"
                    value={data.addressDetail}
                    onChange={onChange}
                    className={inputBaseClass}
                    placeholder="Số nhà, tên đường..."
                />
            </div>
        </div>
    );
};

export default PatientInfoForm;
