
import React, { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    labelClassName?: string;
    containerClassName?: string;
}

export const FormInput: React.FC<FormInputProps> = memo(({ label, labelClassName = '', containerClassName = '', ...props }) => {
    const { fontSettings } = useTheme();
    
    return (
        <div className={containerClassName}>
            <label className={`block font-bold text-slate-700 dark:text-slate-300 mb-1.5 ${fontSettings.controls} ${labelClassName}`}>{label}</label>
            <input
                {...props}
                className={`w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary read-only:bg-slate-100 read-only:cursor-not-allowed dark:read-only:bg-slate-600 ${fontSettings.controls} ${props.className || ''}`}
            />
        </div>
    );
});

/**
 * COMPONENT CHUẨN: Nhập ngày tháng VN (dd/mm/yyyy)
 * Tự động chèn dấu /, chặn giá trị phi logic (ngày > 31, tháng > 12)
 */
export const FormDateInput: React.FC<FormInputProps> = memo(({ label, labelClassName = '', containerClassName = '', onChange, ...props }) => {
    const { fontSettings } = useTheme();
    
    const handleInput = (e: React.BaseSyntheticEvent) => {
        const input = e.target as HTMLInputElement;
        let value = input.value.replace(/\D/g, ''); // Chỉ lấy số
        
        if (value.length > 8) value = value.slice(0, 8);

        let day = value.slice(0, 2);
        let month = value.slice(2, 4);
        let year = value.slice(4, 8);

        // Clamping logic
        if (day.length === 1 && parseInt(day) > 3) day = '0' + day;
        else if (day.length === 2) {
            const d = parseInt(day);
            if (d > 31) day = '31';
            if (d === 0) day = '01';
        }

        if (month.length === 1 && parseInt(month) > 1) month = '0' + month;
        else if (month.length === 2) {
            const m = parseInt(month);
            if (m > 12) month = '12';
            if (m === 0) month = '01';
        }

        let formattedValue = day;
        if (day.length === 2 && (month.length > 0 || value.length > 2)) {
            formattedValue += '/' + month;
        } else if (day.length === 2 && value.length === 2 && e.nativeEvent.inputType !== 'deleteContentBackward') {
             formattedValue += '/';
        }

        if (month.length === 2 && (year.length > 0 || value.length > 4)) {
            formattedValue += '/' + year;
        } else if (month.length === 2 && value.length === 4 && e.nativeEvent.inputType !== 'deleteContentBackward') {
             formattedValue += '/';
        }

        // Gửi ngược lại cho onChange tiêu chuẩn
        if (onChange) {
            onChange({
                target: {
                    name: input.name,
                    value: formattedValue
                }
            } as any);
        }
    };

    return (
        <div className={containerClassName}>
            <label className={`block font-bold text-slate-700 dark:text-slate-300 mb-1.5 ${fontSettings.controls} ${labelClassName}`}>{label}</label>
            <input
                {...props}
                type="text"
                placeholder="dd/mm/yyyy"
                onInput={handleInput}
                className={`w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${fontSettings.controls} ${props.className || ''}`}
            />
        </div>
    );
});


interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    labelClassName?: string;
    containerClassName?: string;
    children: React.ReactNode;
}

export const FormSelect: React.FC<FormSelectProps> = memo(({ label, children, labelClassName = '', containerClassName = '', ...props }) => {
    const { fontSettings } = useTheme();

    return (
        <div className={containerClassName}>
            <label className={`block font-bold text-slate-700 dark:text-slate-300 mb-1.5 ${fontSettings.controls} ${labelClassName}`}>{label}</label>
            <select
                {...props}
                className={`w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-slate-100 disabled:cursor-not-allowed dark:disabled:bg-slate-600 ${fontSettings.controls} ${props.className || ''}`}
            >
                {children}
            </select>
        </div>
    );
});
