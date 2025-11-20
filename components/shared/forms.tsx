
import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    labelClassName?: string;
    containerClassName?: string;
}

export const FormInput: React.FC<FormInputProps> = ({ label, labelClassName = '', containerClassName = '', ...props }) => (
    <div className={containerClassName}>
        <label className={`block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 ${labelClassName}`}>{label}</label>
        <input
            {...props}
            className={`w-full text-base p-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary read-only:bg-slate-100 read-only:cursor-not-allowed dark:read-only:bg-slate-600 ${props.className || ''}`}
        />
    </div>
);


interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    labelClassName?: string;
    containerClassName?: string;
    children: React.ReactNode;
}

export const FormSelect: React.FC<FormSelectProps> = ({ label, children, labelClassName = '', containerClassName = '', ...props }) => (
    <div className={containerClassName}>
        <label className={`block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 ${labelClassName}`}>{label}</label>
        <select
            {...props}
            className={`w-full text-base p-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-slate-100 disabled:cursor-not-allowed dark:disabled:bg-slate-600 ${props.className || ''}`}
        >
            {children}
        </select>
    </div>
);
