// ==================== DOCUMENT LIST COMPONENT ====================
// File: modules/health-check-sync/components/DocumentList.tsx

import React from 'react';
import { 
    CheckCircleIcon, 
    ExclamationCircleIcon, 
    RefreshIcon, 
    SignatureIcon, 
    EyeIcon,
    PencilIcon,
    TrashIcon,
    PrinterIcon,
    DocumentTextIcon,
    PaperAirplaneIcon
} from '../../../components/Icons';
import { formatDateTime } from '../../../utils/formatters';

interface DocumentListProps {
    documents: any[];
    selectedIds: Set<string>;
    onToggleSelect: (id: string) => void;
    onSelectAll: (checked: boolean) => void;
    onEdit: (doc: any) => void;
    onDelete: (id: string) => void;
    onViewXml: (doc: any) => void;
    onPrint: (doc: any) => void;
    onSend?: (doc: any) => void;
    getFormName: (type: string) => string;
    getFormColor: (type: string) => string;
    onSeed?: () => void;
}

const DocumentList: React.FC<DocumentListProps> = ({
    documents,
    selectedIds,
    onToggleSelect,
    onSelectAll,
    onEdit,
    onDelete,
    onViewXml,
    onPrint,
    onSend,
    getFormName,
    getFormColor,
    onSeed
}) => {

    const getStatusBadge = (status: string) => {
        switch(status) {
            case 'Success': 
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/40">
                        <CheckCircleIcon className="w-3.5 h-3.5"/> Thành công
                    </span>
                );
            case 'Error': 
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white shadow-sm">
                        <span className="w-3.5 h-3.5 flex items-center justify-center bg-white text-rose-600 rounded-full text-[9px] font-extrabold">✕</span> 
                        Thất bại
                    </span>
                );
            case 'Pending': 
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border border-teal-200 dark:border-teal-800/40 animate-pulse">
                        <RefreshIcon className="w-3 h-3 animate-spin"/> Đang gửi...
                    </span>
                );
            default: 
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        Chờ gửi
                    </span>
                );
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col min-h-[400px] max-h-[calc(100vh-260px)]">
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
                            <th className="p-4">Người nhập / Ngày tạo</th>
                            <th className="p-4">Trạng thái khám</th>
                            <th className="p-4">Ký số</th>
                            <th className="p-4">Trạng thái liên thông</th>
                            <th className="p-4">Chi tiết giao dịch</th>
                            <th className="p-4 text-right w-44">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {documents.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="p-12 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-2 py-6">
                                        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-full text-slate-400">
                                            <DocumentTextIcon className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <div className="text-slate-700 dark:text-slate-300 font-bold text-sm">
                                            Không tìm thấy dữ liệu khám sức khỏe nào
                                        </div>
                                        <div className="text-slate-400 dark:text-slate-500 text-xs max-w-sm">
                                            Không có hồ sơ nào phù hợp với bộ lọc tìm kiếm hoặc chưa có dữ liệu trong khoảng thời gian đã chọn.
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
                                    <td className="p-4 text-[13px] text-slate-700 dark:text-slate-300 font-medium">
                                        {getFormName(doc.form_type)}
                                    </td>
                                    <td className="p-4 text-xs text-slate-600 dark:text-slate-300">
                                        <div className="font-medium text-slate-800 dark:text-slate-200">{doc.created_by_name || doc.created_by || 'Nhân viên tiếp đón'}</div>
                                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{formatDateTime(doc.created_at)}</div>
                                    </td>
                                    <td className="p-4">
                                        {(() => {
                                            const isDone = doc.conclusion_data?.fitness_class || doc.conclusion_data?.ket_luan_loai_suc_khoe || doc.conclusion_data?.diagnosis;
                                            return isDone ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                                    Đã kết luận
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                                    Đang khám
                                                </span>
                                            );
                                        })()}
                                    </td>
                                    <td className="p-4">
                                        {doc.signature_status === 'Signed' ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                                                Đã ký ({doc.signature_type || 'HSM'})
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                Chưa ký
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {getStatusBadge(doc.send_status)}
                                    </td>
                                    <td className="p-4 max-w-[200px] break-words text-xs leading-tight">
                                        {doc.send_status === 'Error' && (
                                            <div className="text-rose-800 dark:text-rose-400 font-bold uppercase mb-1">
                                                {doc.error_message || 'Lỗi gửi cổng'}
                                            </div>
                                        )}
                                        {doc.response_log ? (
                                            <div 
                                                className="text-[10px] text-slate-500 font-mono line-clamp-2 cursor-pointer hover:text-teal-600 hover:underline"
                                                title="Nhấn để xem chi tiết log"
                                                onClick={() => {
                                                    alert(`CHI TIẾT LOG PHẢN HỒI TỪ CỔNG:\n\n${doc.response_log}`);
                                                }}
                                            >
                                                Log: {doc.response_log}
                                            </div>
                                        ) : doc.transaction_id ? (
                                            <span className="font-mono text-slate-500 text-[11px]">{doc.transaction_id}</span>
                                        ) : (
                                            <span className="text-slate-400">-</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end items-center gap-1.5">
                                            {/* Nút phụ: Xóa */}
                                            <div className="flex items-center mr-2">
                                                <button 
                                                    onClick={() => onDelete(doc.id)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                                                    title="Xóa hồ sơ"
                                                >
                                                    <TrashIcon className="w-4 h-4"/>
                                                </button>
                                            </div>

                                            {/* Khối 4 nút chính theo style ảnh mẫu */}
                                            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white shadow-sm flex-shrink-0">
                                                {/* Khám */}
                                                <button 
                                                    onClick={() => onEdit(doc)}
                                                    className="flex flex-col items-center justify-center w-11 h-11 bg-white hover:bg-slate-50 text-slate-500 transition border-r border-slate-200 focus:outline-none cursor-pointer"
                                                    title="Khám bệnh / Nhập liệu"
                                                >
                                                    <PencilIcon className="w-4 h-4 text-slate-400"/>
                                                    <span className="text-[8px] font-extrabold uppercase mt-0.5 tracking-wider">Khám</span>
                                                </button>

                                                {/* XML */}
                                                <button 
                                                    onClick={() => onViewXml(doc)}
                                                    className="flex flex-col items-center justify-center w-11 h-11 bg-white hover:bg-slate-50 text-slate-500 transition border-r border-slate-200 focus:outline-none cursor-pointer"
                                                    title="Xem XML liên thông"
                                                >
                                                    <DocumentTextIcon className="w-4 h-4 text-slate-400"/>
                                                    <span className="text-[8px] font-extrabold uppercase mt-0.5 tracking-wider">XML</span>
                                                </button>

                                                {/* In */}
                                                <button 
                                                    onClick={() => onPrint(doc)}
                                                    className="flex flex-col items-center justify-center w-11 h-11 bg-white hover:bg-emerald-50/50 text-[#0f766e] transition border-r border-slate-200 focus:outline-none cursor-pointer"
                                                    title="In phiếu KSK / PDF"
                                                >
                                                    <EyeIcon className="w-4 h-4 text-[#0f766e]"/>
                                                    <span className="text-[8px] font-extrabold uppercase mt-0.5 tracking-wider">In</span>
                                                </button>

                                                {/* Gửi */}
                                                <button 
                                                    onClick={() => onSend && onSend(doc)}
                                                    className="flex flex-col items-center justify-center w-11 h-11 bg-[#0f766e] hover:bg-[#0d9488] text-white transition focus:outline-none cursor-pointer"
                                                    title="Gửi liên thông cổng"
                                                >
                                                    <PaperAirplaneIcon className="w-4 h-4 text-white -rotate-45"/>
                                                    <span className="text-[8px] font-extrabold uppercase mt-0.5 tracking-wider">Gửi</span>
                                                </button>
                                            </div>
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

export default DocumentList;
