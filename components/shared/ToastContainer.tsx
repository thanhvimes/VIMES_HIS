
import React from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { CheckCircleIcon, ExclamationCircleIcon, InfoIcon, XIcon } from '../Icons';

const ToastContainer: React.FC = () => {
    const { notifications, removeNotification } = useNotification();
    
    // Only show autoClose notifications in the toast container
    const toasts = notifications.filter(n => n.autoClose);

    if (toasts.length === 0) return null;

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
            case 'error': return <ExclamationCircleIcon className="w-6 h-6 text-red-500" />;
            case 'warning': return <ExclamationCircleIcon className="w-6 h-6 text-orange-500" />;
            default: return <InfoIcon className="w-6 h-6 text-blue-500" />;
        }
    };

    const getBorderColor = (type: string) => {
        switch (type) {
            case 'success': return 'border-l-4 border-l-green-500';
            case 'error': return 'border-l-4 border-l-red-500';
            case 'warning': return 'border-l-4 border-l-orange-500';
            default: return 'border-l-4 border-l-blue-500';
        }
    };

    return (
        <div className="fixed top-20 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
            {toasts.map(toast => (
                <div 
                    key={toast.id}
                    className={`pointer-events-auto w-80 bg-white dark:bg-slate-800 shadow-xl rounded-lg p-4 flex items-start gap-3 animate-fade-in-up border border-slate-200 dark:border-slate-700 ${getBorderColor(toast.type)}`}
                >
                    <div className="flex-shrink-0 mt-0.5">
                        {getIcon(toast.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white">{toast.title}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-snug">{toast.message}</p>
                    </div>
                    <button 
                        onClick={() => removeNotification(toast.id)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    >
                        <XIcon className="w-4 h-4"/>
                    </button>
                </div>
            ))}
        </div>
    );
};

export default ToastContainer;
