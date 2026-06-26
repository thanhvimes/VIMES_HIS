// ==================== PRINT CODE LIST COMPONENT ====================
// File: modules/health-check-sync/components/PrintCodeList.tsx

import React from 'react';
import { 
    PrinterIcon,
    EyeIcon,
    RefreshIcon
} from '../../../components/Icons';
import { formatDateTime } from '../../../utils/formatters';
import { Code39Barcode } from '../forms/PrintBarcodeForm';

interface PrintCodeListProps {
    documents: any[];
    selectedIds: Set<string>;
    onToggleSelect: (id: string) => void;
    onSelectAll: (checked: boolean) => void;
    onPrint: (doc: any) => void; // For viewing full document
    onPrintBarcode: (docs: any[]) => void; // For barcode label printing
    getFormName: (type: string) => string;
    getFormColor: (type: string) => string;
}

const PrintCodeList: React.FC<PrintCodeListProps> = ({
    documents,
    selectedIds,
    onToggleSelect,
    onSelectAll,
    onPrint,
    onPrintBarcode,
    getFormName,
    getFormColor
}) => {
    const handlePrintSelected = () => {
        const selectedDocs = documents.filter(doc => selectedIds.has(doc.id.toString()));
        if (selectedDocs.length === 0) return;
        onPrintBarcode(selectedDocs);
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col min-h-[400px]">
            {/* Batch Action Bar - chỉ hiện khi có hồ sơ được chọn */}
            {selectedIds.size > 0 && (
                <div className="border-b border-orange-100 dark:border-orange-950/30 px-4 py-3 flex items-center gap-3 flex-wrap bg-orange-50/80 dark:bg-orange-950/20 animate-in fade-in duration-200">
                    <span className="text-xs font-bold text-orange-800 dark:text-orange-300">
                        Đã chọn {selectedIds.size} hồ sơ KSK
                    </span>
                    <button
                        onClick={handlePrintSelected}
                        className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-black shadow-md flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                    >
                        <PrinterIcon className="w-3.5 h-3.5" />
                        In tem KSK hàng loạt ({selectedIds.size})
                    </button>
                </div>
            )}

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
                            <th className="p-4 w-36">Số hồ sơ</th>
                            <th className="p-4">Loại biểu mẫu</th>
                            <th className="p-4 w-36">Ngày tạo</th>
                            <th className="p-4 w-36 text-center">Trạng thái in</th>
                            <th className="p-4 text-center w-52">Mã vạch (Barcode)</th>
                            <th className="p-4 text-right w-40">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {documents.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="p-12 text-center">
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
                                            <span>NS: {doc.dob ? new Date(doc.dob).toLocaleDateString('vi-VN') : 'N/A'}</span>
                                            {doc.cccd && (
                                                <>
                                                    <span className="text-slate-300">|</span>
                                                    <span>CCCD: {doc.cccd}</span>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 font-mono font-bold text-slate-900 dark:text-white text-[13px]">
                                        {doc.doc_no}
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
                                        {doc.barcode_printed === 'Y' ? (
                                            <span className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200/50 dark:border-emerald-900/30">
                                                Đã in code
                                            </span>
                                        ) : (
                                            <span className="px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 font-bold text-xs border border-amber-200/50 dark:border-amber-900/30">
                                                Chưa in code
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="inline-flex flex-col items-center gap-1">
                                            {/* Real Dynamic Code39 Barcode */}
                                            <div className="bg-white p-2 border border-slate-200 rounded flex flex-col items-center shadow-sm select-none">
                                                <Code39Barcode value={doc.doc_no} height={26} />
                                                <span className="text-[8.5px] font-mono font-bold text-slate-600 mt-1">{doc.doc_no}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end items-center gap-2">
                                            {/* In Barcode Action */}
                                            <button 
                                                onClick={() => onPrintBarcode([doc])}
                                                className="px-2.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-xs font-bold transition flex items-center gap-1 active:scale-95 cursor-pointer shadow-sm animate-in fade-in"
                                                title="In nhãn tem mã vạch"
                                            >
                                                <PrinterIcon className="w-3.5 h-3.5 text-orange-600"/>
                                                In Code
                                            </button>
                                            
                                            {/* Xem Hồ Sơ Action */}
                                            <button 
                                                onClick={() => onPrint(doc)}
                                                className="p-1.5 text-slate-400 hover:text-[#0f766e] rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                                                title="Xem chi tiết hồ sơ khám"
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
