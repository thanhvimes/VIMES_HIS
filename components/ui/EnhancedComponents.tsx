
// ==================== LOADING SPINNER COMPONENT ====================
import React from 'react';

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg', color?: string }> = ({
    size = 'md',
    color = 'teal'
}) => {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16'
    };

    const colorClasses = {
        teal: 'border-teal-600',
        blue: 'border-blue-600',
        orange: 'border-orange-600',
        green: 'border-green-600'
    };

    return (
        <div className="flex items-center justify-center">
            <div className="relative">
                <div className={`${sizeClasses[size]} border-4 border-${color}-200 dark:border-${color}-900 rounded-full`}></div>
                <div className={`absolute top-0 ${sizeClasses[size]} border-4 ${colorClasses[color as keyof typeof colorClasses]} border-t-transparent rounded-full animate-spin`}></div>
            </div>
        </div>
    );
};

// ==================== SKELETON LOADER COMPONENT ====================
export const SkeletonCard: React.FC = () => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 animate-pulse">
        <div className="flex justify-between items-start mb-4">
            <div className="h-12 w-12 bg-slate-200 dark:bg-slate-700 rounded-2xl shimmer"></div>
            <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-full shimmer"></div>
        </div>
        <div className="space-y-2">
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2 shimmer"></div>
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4 shimmer"></div>
        </div>
    </div>
);

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
    <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex gap-4 animate-pulse">
                <div className="h-12 w-12 bg-slate-200 dark:bg-slate-700 rounded-lg shimmer"></div>
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 shimmer"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2 shimmer"></div>
                </div>
            </div>
        ))}
    </div>
);

// ==================== ENHANCED BUTTON COMPONENT ====================
export const Button: React.FC<{
    children: React.ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    disabled?: boolean;
    className?: string;
}> = ({
    children,
    onClick,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    className = ''
}) => {
        const baseClasses = 'font-bold rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ripple';

        const variantClasses = {
            primary: 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg hover:shadow-xl',
            secondary: 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white',
            danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl',
            success: 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
        };

        const sizeClasses = {
            sm: 'px-3 py-1.5 text-sm',
            md: 'px-5 py-2.5 text-base',
            lg: 'px-6 py-3 text-lg'
        };

        return (
            <button
                onClick={onClick}
                disabled={disabled || loading}
                className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
            >
                {loading ? (
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Đang xử lý...</span>
                    </div>
                ) : children}
            </button>
        );
    };

// ==================== ENHANCED INPUT COMPONENT ====================
export const Input: React.FC<{
    label?: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    placeholder?: string;
    error?: string;
    icon?: React.ReactNode;
    className?: string;
}> = ({ label, name, value, onChange, type = 'text', placeholder, error, icon, className = '' }) => {
    return (
        <div className="space-y-1.5">
            {label && (
                <label htmlFor={name} className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    {label}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {icon}
                    </div>
                )}
                <input
                    id={name}
                    name={name}
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={`
            w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-3 
            bg-white dark:bg-slate-900 
            border-2 ${error ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'}
            rounded-xl 
            font-medium
            focus:border-teal-500 focus:ring-4 focus:ring-teal-100 dark:focus:ring-teal-900
            transition-all duration-200
            outline-none
            ${className}
          `}
                />
            </div>
            {error && (
                <p className="text-xs text-red-600 dark:text-red-400 font-medium animate-slide-in-left">
                    {error}
                </p>
            )}
        </div>
    );
};
