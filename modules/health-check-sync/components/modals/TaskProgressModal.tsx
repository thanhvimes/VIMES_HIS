import React, { useState } from 'react';
import { 
    CheckCircleIcon, 
    AlertCircleIcon, 
    RefreshIcon, 
    ChevronDownIcon 
} from '../../../../components/Icons';

export interface TaskProgressItem {
    id: string;
    title: string;
    status: 'pending' | 'processing' | 'success' | 'failed';
    message?: string;
}

export interface TaskProgressModalProps {
    isOpen: boolean;
    title: string;
    description?: string;
    currentStep?: string;
    current: number;
    total: number;
    successCount: number;
    failedCount: number;
    isFinished: boolean;
    items?: TaskProgressItem[];
    onClose: () => void;
    onCancel?: () => void;
}

export const TaskProgressModal: React.FC<TaskProgressModalProps> = ({
    isOpen,
    title,
    description,
    currentStep,
    current,
    total,
    successCount,
    failedCount,
    isFinished,
    items = [],
    onClose,
    onCancel,
}) => {
    const [showDetails, setShowDetails] = useState(false);

    if (!isOpen) return null;

    const safeTotal = total > 0 ? total : 1;
    const progressPercent = Math.min(100, Math.round((current / safeTotal) * 100));
    const failedItems = items.filter(it => it.status === 'failed');

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-800/80 overflow-hidden transform scale-100 transition-all duration-300 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            isFinished 
                                ? (failedCount > 0 ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400' : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400')
                                : 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400'
                        }`}>
                            {isFinished ? (
                                failedCount > 0 ? <AlertCircleIcon className="w-5 h-5" /> : <CheckCircleIcon className="w-5 h-5" />
                            ) : (
                                <RefreshIcon className="w-5 h-5 animate-spin" />
                            )}
                        </div>
                        <div>
                            <h5 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                {title}
                            </h5>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {description || (isFinished ? 'Đã hoàn tất tiến trình' : 'Đang xử lý dữ liệu...')}
                            </p>
                        </div>
                    </div>
                    {isFinished && (
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold p-1 cursor-pointer"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Body Content */}
                <div className="p-6 flex flex-col gap-5 overflow-y-auto custom-scrollbar flex-1">
                    {/* Progress Bar & Percentage */}
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                                Tiến độ thực hiện
                            </span>
                            <span className="font-extrabold font-mono text-indigo-600 dark:text-indigo-400 text-sm">
                                {progressPercent}% ({current}/{total})
                            </span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 shadow-inner">
                            <div 
                                className={`h-full rounded-full transition-all duration-300 ${
                                    isFinished && failedCount > 0
                                        ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                                        : 'bg-gradient-to-r from-indigo-500 via-teal-500 to-emerald-500'
                                }`}
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>

                    {/* Counters Badge Group */}
                    <div className="grid grid-cols-3 gap-2.5">
                        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60 flex flex-col items-center justify-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng số</span>
                            <span className="text-base font-black font-mono text-slate-800 dark:text-white mt-0.5">{total}</span>
                        </div>
                        <div className="bg-emerald-50/60 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30 flex flex-col items-center justify-center">
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Thành công</span>
                            <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">{successCount}</span>
                        </div>
                        <div className={`p-3 rounded-xl border flex flex-col items-center justify-center ${
                            failedCount > 0
                                ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
                                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-700/60'
                        }`}>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${failedCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                                Lỗi / Bỏ qua
                            </span>
                            <span className={`text-base font-black font-mono mt-0.5 ${failedCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                                {failedCount}
                            </span>
                        </div>
                    </div>

                    {/* Current Step Description */}
                    {!isFinished && currentStep && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2.5">
                            <RefreshIcon className="w-3.5 h-3.5 text-indigo-500 animate-spin flex-shrink-0" />
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">
                                {currentStep}
                            </span>
                        </div>
                    )}

                    {/* Error / Warning Details Accordion */}
                    {failedItems.length > 0 && (
                        <div className="flex flex-col gap-2 border border-rose-200 dark:border-rose-900/40 rounded-xl overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setShowDetails(!showDetails)}
                                className="w-full px-4 py-2.5 bg-rose-50/60 dark:bg-rose-950/30 flex items-center justify-between text-xs font-bold text-rose-700 dark:text-rose-300 cursor-pointer"
                            >
                                <span className="flex items-center gap-1.5">
                                    <AlertCircleIcon className="w-4 h-4 text-rose-500" />
                                    Chi tiết các mục phát sinh lỗi ({failedItems.length})
                                </span>
                                <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`} />
                            </button>

                            {showDetails && (
                                <div className="max-h-48 overflow-y-auto custom-scrollbar divide-y divide-rose-100 dark:divide-rose-900/30 p-2 bg-white dark:bg-slate-900 text-xs">
                                    {failedItems.map((item, idx) => (
                                        <div key={item.id || idx} className="p-2 flex flex-col gap-0.5">
                                            <span className="font-bold text-slate-800 dark:text-slate-200">
                                                {item.title}
                                            </span>
                                            {item.message && (
                                                <span className="text-[11px] text-rose-600 dark:text-rose-400">
                                                    {item.message}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-end gap-3">
                    {!isFinished && onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                            Hủy bỏ tiến trình
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={!isFinished}
                        className={`px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
                            isFinished
                                ? 'bg-gradient-to-r from-[#0f766e] to-teal-600 hover:from-[#0d645c] hover:to-teal-700 text-white shadow-md shadow-teal-500/20 active:scale-95'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60'
                        }`}
                    >
                        {isFinished ? 'Đã hiểu & Đóng' : 'Đang thực hiện...'}
                    </button>
                </div>
            </div>
        </div>
    );
};
