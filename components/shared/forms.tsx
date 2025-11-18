import React from 'react';

export const FormInput: React.FC<{ label: string; value?: string; className?: string; readOnly?: boolean; labelClassName?: string }> = 
    ({ label, value, className = '', readOnly = false, labelClassName = '' }) => (
    <div className={className}>
        <label className={`block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 ${labelClassName}`}>{label}</label>
        <input 
            type="text" 
            defaultValue={value} 
            readOnly={readOnly}
            className="w-full text-sm p-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500 rounded-md focus:ring-1 focus:ring-primary focus:border-primary" 
        />
    </div>
);

export const FormSelect: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className='' }) => (
    <div className={className}>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">{label}</label>
        <select className="w-full text-sm p-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500 rounded-md focus:ring-1 focus:ring-primary focus:border-primary">
            {children}
        </select>
    </div>
);
