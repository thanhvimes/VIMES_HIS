
import React from 'react';
import { 
    XIcon, 
    SparklesIcon, 
    CheckIcon, 
    ExclamationCircleIcon,
    ActivityIcon,
    BeakerIcon,
    DocumentTextIcon
} from '../../../../../components/Icons';
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
            <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up border border-slate-200 dark:border-slate-700 max-h-[90vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <SparklesIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400"/>
                        Trợ lý AI - Phân tích Lâm sàng
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition">
                        <XIcon className="w-6 h-6"/>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 min-h-[300px]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full py-12 space-y-6">
                            <div className="relative">
                                <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                                <SparklesIcon className="w-8 h-8 text-indigo-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse"/>
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-lg font-semibold text-indigo-700 dark:text-indigo-400 animate-pulse">Đang phân tích dữ liệu...</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Hệ thống đang tổng hợp triệu chứng và so sánh với cơ sở dữ liệu y khoa.</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                                <ExclamationCircleIcon className="w-8 h-8 text-red-500"/>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Không thể phân tích</h3>
                            <p className="text-slate-600 dark:text-slate-400 max-w-md">{error}</p>
                            <button onClick={onClose} className="mt-6 px-6 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors">
                                Đóng cửa sổ
                            </button>
                        </div>
                    ) : data ? (
                        <div className="space-y-8">
                            {/* Summary Section */}
                            <div className="bg-indigo-50/50 dark:bg-slate-700/30 p-5 rounded-xl border border-indigo-100 dark:border-slate-600">
                                <h3 className="text-sm font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <DocumentTextIcon className="w-5 h-5"/> Tóm tắt ca bệnh
                                </h3>
                                <p className="text-slate-800 dark:text-slate-200 leading-relaxed text-base">
                                    {data.summary}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Potential Diagnoses */}
                                <div className="flex flex-col h-full">
                                    <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2 px-1">
                                        <ActivityIcon className="w-5 h-5"/> Chẩn đoán tiềm năng
                                    </h3>
                                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm flex-1">
                                        <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                                            {data.potentialDiagnoses.map((diag, idx) => (
                                                <li key={idx} className="p-4 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors flex items-start gap-3">
                                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xs font-bold border border-rose-200">
                                                        {idx + 1}
                                                    </span>
                                                    <span className="text-slate-700 dark:text-slate-200 font-medium text-sm mt-0.5">{diag}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* Next Steps */}
                                <div className="flex flex-col h-full">
                                    <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2 px-1">
                                        <BeakerIcon className="w-5 h-5"/> Đề xuất xử trí
                                    </h3>
                                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm flex-1">
                                        <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                                            {data.nextSteps.map((step, idx) => (
                                                <li key={idx} className="p-4 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors flex items-start gap-3">
                                                    <div className="flex-shrink-0 mt-0.5">
                                                        <CheckIcon className="w-5 h-5 text-blue-500"/>
                                                    </div>
                                                    <span className="text-slate-700 dark:text-slate-200 text-sm">{step}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30">
                                <p className="text-xs text-amber-700 dark:text-amber-400 text-center flex items-center justify-center gap-2">
                                    <ExclamationCircleIcon className="w-4 h-4"/>
                                    Lưu ý: Kết quả phân tích từ AI chỉ mang tính chất tham khảo hỗ trợ ra quyết định. Bác sĩ cần kiểm tra lại dựa trên chuyên môn.
                                </p>
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-700 dark:hover:text-white transition shadow-sm"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIAnalysisModal;
