import React from 'react';
import { SparklesIcon, RefreshIcon } from '../../../../../components/Icons';

interface ContractSyncClsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExecute: () => void;
    isSyncing: boolean;
    syncMode: 'missing_only' | 'all_new';
    setSyncMode: (mode: 'missing_only' | 'all_new') => void;
    contractName?: string;
}

export const ContractSyncClsModal: React.FC<ContractSyncClsModalProps> = ({
    isOpen,
    onClose,
    onExecute,
    isSyncing,
    syncMode,
    setSyncMode,
    contractName
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 overflow-hidden animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-800/80 overflow-hidden flex flex-col animate-zoom-in">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full flex items-center justify-center bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
                            <SparklesIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h5 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                Đồng bộ Kết quả Cận Lâm Sàng
                            </h5>
                            <p className="text-[11px] text-slate-500">
                                {contractName ? `Hợp đồng: ${contractName}` : 'Tự động quét và ghép kết quả XN/CĐHA từ HIS'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSyncing}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold p-1 cursor-pointer disabled:opacity-50"
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 flex flex-col gap-4 text-xs">
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        Hệ thống sẽ duyệt qua danh sách nhân viên trong hợp đồng đã tiếp đón vào HIS để tìm kiếm và cập nhật kết quả Xét nghiệm (LIS) và Chẩn đoán hình ảnh (PACS) mới nhất.
                    </p>

                    <div className="flex flex-col gap-2.5">
                        <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                            syncMode === 'missing_only' 
                                ? 'bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-700 ring-1 ring-indigo-500/30' 
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                        }`}>
                            <input
                                type="radio"
                                name="syncClsMode"
                                value="missing_only"
                                checked={syncMode === 'missing_only'}
                                onChange={() => setSyncMode('missing_only')}
                                className="mt-0.5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-800 dark:text-white">
                                    Chỉ đồng bộ cho hồ sơ chưa có kết quả (Khuyến nghị)
                                </span>
                                <span className="text-[11px] text-slate-400 mt-0.5">
                                    Chỉ bổ sung kết quả cho các chỉ định đang trống. Giữ nguyên toàn bộ các kết quả đã có.
                                </span>
                            </div>
                        </label>

                        <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                            syncMode === 'all_new' 
                                ? 'bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-700 ring-1 ring-indigo-500/30' 
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                        }`}>
                            <input
                                type="radio"
                                name="syncClsMode"
                                value="all_new"
                                checked={syncMode === 'all_new'}
                                onChange={() => setSyncMode('all_new')}
                                className="mt-0.5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-800 dark:text-white">
                                    Cập nhật lại toàn bộ kết quả CLS mới nhất từ HIS
                                </span>
                                <span className="text-[11px] text-slate-400 mt-0.5">
                                    Rà soát và làm mới toàn bộ kết quả xét nghiệm và hình ảnh từ HIS (vẫn bảo toàn các kết quả bác sĩ đã chỉnh sửa tay).
                                </span>
                            </div>
                        </label>
                    </div>

                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-700 dark:text-amber-300">
                        <strong>Lưu ý:</strong> Các hồ sơ đã ký số hoặc đã gửi liên thông VNeID thành công sẽ tự động được bảo vệ và không bị thay đổi.
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="px-6 py-4 bg-slate-50/30 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSyncing}
                        className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 rounded-xl text-xs font-extrabold uppercase tracking-wider transition cursor-pointer"
                    >
                        Đóng
                    </button>
                    <button
                        type="button"
                        onClick={onExecute}
                        disabled={isSyncing}
                        className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition shadow-md shadow-indigo-500/20 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                        {isSyncing ? <RefreshIcon className="w-4 h-4 animate-spin" /> : <SparklesIcon className="w-4 h-4" />}
                        {isSyncing ? 'Đang đồng bộ...' : 'Bắt đầu đồng bộ'}
                    </button>
                </div>
            </div>
        </div>
    );
};
