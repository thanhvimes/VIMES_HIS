// ==================== PRINT CODE LIST COMPONENT ====================
// File: modules/health-check-sync/components/PrintCodeList.tsx

import React from 'react';
import { 
    PrinterIcon,
    EyeIcon,
    RefreshIcon
} from '../../../components/Icons';
import { formatDateTime } from '../../../utils/formatters';

interface PrintCodeListProps {
    documents: any[];
    selectedIds: Set<string>;
    onToggleSelect: (id: string) => void;
    onSelectAll: (checked: boolean) => void;
    onPrint: (doc: any) => void;
    getFormName: (type: string) => string;
    getFormColor: (type: string) => string;
}

const PrintCodeList: React.FC<PrintCodeListProps> = ({
    documents,
    selectedIds,
    onToggleSelect,
    onSelectAll,
    onPrint,
    getFormName,
    getFormColor
}) => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col min-h-[400px]">
            <div className="overflow-auto flex-1 custom-scrollbar">
                <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-[#fff1f2] dark:bg-rose-950/20 text-[#9f1239] dark:text-rose-300 font-extrabold text-[11px] uppercase tracking-wider sticky top-0 z-10 border-b border-rose-100 dark:border-rose-950/40">
                        <tr>
                            <th className="p-4 w-12 text-center">
                                <input 
                                    type="checkbox" 
                                    onChange={(e) => onSelectAll(e.target.checked)} 
                                    checked={documents.length > 0 && selectedIds.size === documents.length}
                                    className="rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                                />
                            </th>
                            <th className="p-4">Hồ sơ / Bệnh nhân</th>
                            <th className="p-4">Loại biểu mẫu</th>
                            <th className="p-4">Ngày tạo</th>
                            <th className="p-4 text-center w-48">Mã vạch (Barcode)</th>
                            <th className="p-4 text-right w-40">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {documents.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-12 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-3 py-6">
                                        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-full text-slate-400">
                                            <RefreshIcon className="w-8 h-8 animate-pulse text-teal-500" />
                                        </div>
                                        <div className="text-slate-700 dark:text-slate-300 font-bold text-sm">
                                            Không có hồ sơ nào khả dụng để in mã code
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            documents.map((doc) => (
                                <tr 
                                    key={doc.id} 
                                    className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${selectedIds.has(doc.id.toString()) ? 'bg-teal-50/20 dark:bg-teal-950/10' : ''}`}
                                >
                                    <td className="p-4 text-center">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.has(doc.id.toString())} 
                                            onChange={() => onToggleSelect(doc.id.toString())}
                                            className="rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                                        />
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-900 dark:text-white text-[13px]">{doc.patient_name}</div>
                                        <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-mono mt-0.5">
                                            <span className="font-bold text-slate-700 dark:text-slate-300">BA: {doc.doc_no}</span>
                                            <span className="text-slate-300">|</span>
                                            <span>NS: {doc.dob ? new Date(doc.dob).toLocaleDateString('vi-VN') : 'N/A'}</span>
                                            {doc.cccd && (
                                                <>
                                                    <span className="text-slate-300">|</span>
                                                    <span>CCCD: {doc.cccd}</span>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-3 py-1 rounded-full bg-[#0f766e] text-white text-[10px] font-extrabold uppercase tracking-wide">
                                            {getFormName(doc.form_type)}
                                        </span>
                                    </td>
                                    <td className="p-4 text-xs text-slate-600 dark:text-slate-300 font-mono">
                                        {formatDateTime(doc.created_at)}
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="inline-flex flex-col items-center gap-1">
                                            {/* Beautiful CSS Mockup Barcode */}
                                            <div className="bg-white p-1.5 border border-slate-200 rounded flex flex-col items-center shadow-sm select-none">
                                                <div className="flex gap-[1px] h-7 items-center px-1">
                                                    <div className="w-[1px] bg-slate-900 h-full"></div>
                                                    <div className="w-[2px] bg-slate-900 h-full"></div>
                                                    <div className="w-[1px] bg-slate-900 h-full"></div>
                                                    <div className="w-[3px] bg-slate-900 h-full"></div>
                                                    <div className="w-[1.5px] bg-slate-900 h-full"></div>
                                                    <div className="w-[2px] bg-slate-900 h-full"></div>
                                                    <div className="w-[1px] bg-slate-900 h-full"></div>
                                                    <div className="w-[1.5px] bg-slate-900 h-full"></div>
                                                    <div className="w-[3px] bg-slate-900 h-full"></div>
                                                    <div className="w-[1px] bg-slate-900 h-full"></div>
                                                    <div className="w-[2.5px] bg-slate-900 h-full"></div>
                                                </div>
                                                <span className="text-[9px] font-mono font-bold text-slate-600 mt-1">{doc.doc_no}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end items-center gap-2">
                                            {/* In Barcode Action */}
                                            <button 
                                                onClick={() => onPrint(doc)}
                                                className="px-2.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-xs font-bold transition flex items-center gap-1 active:scale-95 cursor-pointer shadow-sm"
                                                title="In nhanh mã vạch"
                                            >
                                                <PrinterIcon className="w-3.5 h-3.5 text-orange-600"/>
                                                In Code
                                            </button>
                                            
                                            {/* Xem Hồ Sơ Action */}
                                            <button 
                                                onClick={() => onPrint(doc)}
                                                className="p-1.5 text-slate-400 hover:text-[#0f766e] rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                                                title="Xem chi tiết"
                                            >
                                                <EyeIcon className="w-4 h-4"/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            
            <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-500 flex justify-between items-center">
                <span>Hiển thị {documents.length} kết quả</span>
            </div>
        </div>
    );
};

export default PrintCodeList;
