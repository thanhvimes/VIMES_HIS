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
    PrinterIcon
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
    getFormName: (type: string) => string;
    getFormColor: (type: string) => string;
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
    getFormName,
    getFormColor
}) => {

    const getStatusBadge = (status: string, errorMsg?: string) => {
        switch(status) {
            case 'Success': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700 border border-green-200"><CheckCircleIcon className="w-3 h-3"/> Thành công</span>;
            case 'Error': return (
                <div className="flex flex-col items-start">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-200"><ExclamationCircleIcon className="w-3 h-3"/> Lỗi</span>
                    {errorMsg && <span className="text-[10px] text-red-500 max-w-[150px] truncate" title={errorMsg}>{errorMsg}</span>}
                </div>
            );
            case 'Pending': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 animate-pulse"><RefreshIcon className="w-3 h-3 animate-spin"/> Đang gửi...</span>;
            default: return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">Chưa gửi</span>;
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col min-h-[400px]">
            <div className="overflow-auto flex-1 custom-scrollbar">
                <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="p-4 w-12 text-center">
                                <input 
                                    type="checkbox" 
                                    onChange={(e) => onSelectAll(e.target.checked)} 
                                    checked={documents.length > 0 && selectedIds.size === documents.length}
                                    className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                            </th>
                            <th className="p-4 w-28">Mã đợt khám</th>
                            <th className="p-4">Bệnh nhân / CCCD</th>
                            <th className="p-4">Loại mẫu biểu</th>
                            <th className="p-4 text-center">Ký số</th>
                            <th className="p-4">Trạng thái gửi cổng</th>
                            <th className="p-4">Thời gian tạo</th>
                            <th className="p-4 text-right w-36">Tác vụ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {documents.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="p-12 text-center text-slate-400 italic">
                                    Không tìm thấy dữ liệu khám sức khỏe nào. Hãy ấn nút "Khởi tạo dữ liệu mẫu" để bắt đầu thử nghiệm.
                                </td>
                            </tr>
                        ) : (
                            documents.map((doc) => (
                                <tr 
                                    key={doc.id} 
                                    className={`hover:bg-blue-50 dark:hover:bg-slate-700/30 transition-colors ${selectedIds.has(doc.id.toString()) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                >
                                    <td className="p-4 text-center">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.has(doc.id.toString())} 
                                            onChange={() => onToggleSelect(doc.id.toString())}
                                            className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                    </td>
                                    <td className="p-4 font-mono text-xs text-slate-500 font-bold">{doc.doc_no}</td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-800 dark:text-white">{doc.patient_name}</div>
                                        <div className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                                            <span>Mã BN: {doc.patient_id}</span>
                                            {doc.cccd && (
                                                <>
                                                    <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                                                    <span>CCCD: {doc.cccd}</span>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-full border text-[11px] font-bold ${getFormColor(doc.form_type)}`}>
                                            {getFormName(doc.form_type)}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        {doc.signature_status === 'Signed' ? (
                                            <div className="flex flex-col items-center">
                                                <span className="text-green-600" title="Đã ký số"><SignatureIcon className="w-5 h-5"/></span>
                                                <span className="text-[9px] font-bold text-slate-400 mt-0.5 bg-slate-100 dark:bg-slate-700 px-1 rounded">{doc.signature_type}</span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-300" title="Chưa ký"><SignatureIcon className="w-5 h-5 mx-auto"/></span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {getStatusBadge(doc.send_status, doc.error_message)}
                                        {doc.transaction_id && <div className="text-[9px] text-slate-400 font-mono mt-0.5 truncate max-w-[150px]" title={doc.transaction_id}>{doc.transaction_id}</div>}
                                    </td>
                                    <td className="p-4 text-xs text-slate-500 dark:text-slate-400">
                                        <div>Tạo: {formatDateTime(doc.created_at)}</div>
                                        {doc.sent_at && <div className="text-green-600">Gửi: {formatDateTime(doc.sent_at)}</div>}
                                    </td>
                                    <td className="p-4 text-right flex justify-end gap-1.5 mt-1.5">
                                        <button 
                                            onClick={() => onPrint(doc)}
                                            className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-slate-700 rounded transition"
                                            title="In biểu mẫu KSK"
                                        >
                                            <PrinterIcon className="w-4 h-4"/>
                                        </button>
                                        <button 
                                            onClick={() => onEdit(doc)}
                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded transition"
                                            title="Sửa hồ sơ"
                                        >
                                            <PencilIcon className="w-4 h-4"/>
                                        </button>
                                        <button 
                                            onClick={() => onDelete(doc.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 rounded transition"
                                            title="Xóa hồ sơ"
                                        >
                                            <TrashIcon className="w-4 h-4"/>
                                        </button>
                                        <button 
                                            onClick={() => onViewXml(doc)}
                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded transition"
                                            title="Xem XML liên thông"
                                        >
                                            <EyeIcon className="w-4 h-4"/>
                                        </button>
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
