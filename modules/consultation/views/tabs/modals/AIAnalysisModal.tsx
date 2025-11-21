import React from 'react';
import { XIcon, SparklesIcon, CheckIcon, ExclamationCircleIcon } from '../../../../../components/Icons';
import { AISuggestion } from '../../../../../types';

interface AIAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    isLoading: boolean;
    data: AISuggestion | null;
    error: string | null;
}

const AIAnalysisModal: React.FC<AIAnalysisModalProps> = ({ isOpen, onClose, isLoading, data, error }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up border border-slate-200 dark:border-slate-700">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <SparklesIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400"/>
                        Trợ lý AI - Gợi ý Chẩn đoán
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition">
                        <XIcon className="w-6 h-6"/>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[70vh] min-h-[300px]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full py-12 space-y-4">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                                <SparklesIcon className="w-6 h-6 text-indigo-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse"/>
                            </div>
                            <p className="text-indigo-600 dark:text-indigo-400 font-medium animate-pulse">Đang phân tích dữ liệu lâm sàng...</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">AI đang tổng hợp triệu chứng và đưa ra gợi ý.</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                            <ExclamationCircleIcon className="w-12 h-12 text-red-500 mb-3"/>
                            <p className="text-slate-800 dark:text-slate-200 font-medium">{error}</p>
                            <button onClick={onClose} className="mt-4 px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg">Đóng</button>
                        </div>
                    ) : data ? (
                        <div className="space-y-6">
                            {/* Summary Section */}
                            <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
                                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Tóm tắt ca bệnh</h3>
                                <p className="text-slate-800 dark:text-slate-200 leading-relaxed text-sm">
                                    {data.summary}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Potential Diagnoses */}
                                <div>
                                    <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <CheckIcon className="w-4 h-4"/> Chẩn đoán tiềm năng
                                    </h3>
                                    <ul className="space-y-2">
                                        {data.potentialDiagnoses.map((diag, idx) => (
                                            <li key={idx} className="flex items-start gap-2 p-2 rounded bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 text-sm text-slate-800 dark:text-slate-200">
                                                <span className="font-bold text-indigo-500">{idx + 1}.</span>
                                                <span>{diag}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Next Steps */}
                                <div>
                                    <h3 className="text-sm font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <CheckIcon className="w-4 h-4"/> Đề xuất cận lâm sàng
                                    </h3>
                                    <ul className="space-y-2">
                                        {data.nextSteps.map((step, idx) => (
                                            <li key={idx} className="flex items-start gap-2 p-2 rounded bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-900/30 text-sm text-slate-800 dark:text-slate-200">
                                                <span className="text-teal-500">•</span>
                                                <span>{step}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            
                            <div className="text-xs text-slate-400 dark:text-slate-500 italic text-center mt-4">
                                * Các gợi ý trên chỉ mang tính chất tham khảo. Bác sĩ vui lòng kiểm tra lại theo quy trình chuyên môn.
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-5 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 transition"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIAnalysisModal;
