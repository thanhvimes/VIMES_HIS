import React from 'react';
import { CloudUploadIcon, RefreshIcon } from '../../../../../components/Icons';

interface ContractImportHisDocsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    contractName?: string;
    importHisDocsText: string;
    setImportHisDocsText: (val: string) => void;
    importHisAutoSync: boolean;
    setImportHisAutoSync: (val: boolean) => void;
    isImportingHisDocs: boolean;
}

export const ContractImportHisDocsModal: React.FC<ContractImportHisDocsModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    contractName,
    importHisDocsText,
    setImportHisDocsText,
    importHisAutoSync,
    setImportHisAutoSync,
    isImportingHisDocs,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-800/80 overflow-hidden transform scale-100 transition-all duration-300 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
                        <CloudUploadIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h5 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                            Nhập hồ sơ từ HIS vào gói khám
                        </h5>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Gói khám: <strong className="text-slate-700 dark:text-slate-300">{contractName}</strong>
                        </p>
                    </div>
                </div>

                {/* Form Body */}
                <form onSubmit={onSubmit}>
                    <div className="p-6 flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                Danh sách số hồ sơ HIS *
                            </label>
                            <textarea
                                required
                                rows={6}
                                value={importHisDocsText}
                                onChange={(e) => setImportHisDocsText(e.target.value)}
                                placeholder="Nhập hoặc dán các số hồ sơ HIS (phân tách bởi dấu phẩy, dấu cách hoặc xuống dòng).&#10;Ví dụ:&#10;26036157, 26065238, 26062077"
                                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-sm resize-none"
                            />
                            <span className="text-[11px] text-slate-400">
                                Hệ thống sẽ tự động tra cứu họ tên, ngày sinh, CCCD, phân loại đối tượng KSK và kết quả khám từ HIS.
                            </span>
                        </div>

                        <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700">
                            <input
                                type="checkbox"
                                id="autoSyncKsk"
                                checked={importHisAutoSync}
                                onChange={(e) => setImportHisAutoSync(e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                            />
                            <label htmlFor="autoSyncKsk" className="text-xs font-bold text-slate-700 dark:text-slate-300 select-none cursor-pointer">
                                Tự động đồng bộ và sinh hồ sơ KSK VNeID ngay sau khi nhập
                            </label>
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="px-6 py-4 bg-slate-50/30 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 rounded-xl text-xs font-extrabold uppercase tracking-wider transition cursor-pointer"
                        >
                            Đóng
                        </button>
                        <button
                            type="submit"
                            disabled={isImportingHisDocs}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition shadow-md shadow-blue-500/10 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                        >
                            {isImportingHisDocs ? <RefreshIcon className="w-4 h-4 animate-spin" /> : <CloudUploadIcon className="w-4 h-4" />}
                            Thực hiện nhập
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
