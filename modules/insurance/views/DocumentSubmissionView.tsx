
import React, { useState, useEffect, useMemo } from 'react';
import { 
    PaperAirplaneIcon, 
    SearchIcon, 
    FilterIcon, 
    CheckCircleIcon, 
    ExclamationCircleIcon, 
    RefreshIcon, 
    DocumentTextIcon, 
    SignatureIcon, 
    EyeIcon,
    CloudUploadIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { insuranceService, InsuranceDocument, DocumentType } from '../../../services/insuranceService';
import { formatDateTime } from '../../../utils/formatters';

const DocumentSubmissionView: React.FC = () => {
    const { fontSettings } = useTheme();
    const [documents, setDocuments] = useState<InsuranceDocument[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Unsent' | 'Success' | 'Error'>('All');
    const [signatureFilter, setSignatureFilter] = useState<'All' | 'Signed' | 'Unsigned'>('All');
    const [typeFilter, setTypeFilter] = useState<string>('All');
    
    // Selection
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const data = await insuranceService.getDocumentsList();
            setDocuments(data);
        } catch (error) {
            console.error("Failed to load documents", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(new Set(filteredDocuments.map(d => d.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSendDocuments = async () => {
        if (selectedIds.size === 0) {
            alert("Vui lòng chọn ít nhất một hồ sơ để gửi.");
            return;
        }

        // Check for unsigned documents
        const unsignedDocs = documents.filter(d => selectedIds.has(d.id) && d.signatureStatus === 'Unsigned');
        if (unsignedDocs.length > 0) {
            if (!confirm(`Có ${unsignedDocs.length} hồ sơ chưa được ký số. Bạn có chắc chắn muốn gửi không? (Thường sẽ bị từ chối)`)) {
                return;
            }
        }

        setIsSending(true);
        try {
            const idsToSend = Array.from(selectedIds) as string[];
            
            // Mock sending process
            // Update UI to 'Sending' state temporarily
            setDocuments(prev => prev.map(d => selectedIds.has(d.id) ? { ...d, sendStatus: 'Sending' } : d));

            const failedIds = await insuranceService.sendDocumentsToPortal(idsToSend);
            const now = new Date().toLocaleString('vi-VN');
            const newTransactionId = `TRX-${Date.now()}`;

            setDocuments(prev => prev.map(d => {
                if (selectedIds.has(d.id)) {
                    if (failedIds.includes(d.id)) {
                        return { ...d, sendStatus: 'Error', errorMessage: 'Lỗi kết nối cổng hoặc dữ liệu không hợp lệ.' };
                    }
                    return { 
                        ...d, 
                        sendStatus: 'Success', 
                        sentTime: now, 
                        transactionId: newTransactionId,
                        errorMessage: undefined
                    };
                }
                return d;
            }));

            if (failedIds.length > 0) {
                alert(`Đã gửi hoàn tất. Có ${failedIds.length} hồ sơ bị lỗi.`);
            } else {
                alert(`Đã gửi thành công ${idsToSend.length} hồ sơ lên cổng.`);
            }
            
            setSelectedIds(new Set()); // Clear selection

        } catch (error) {
            console.error("Error sending documents", error);
            alert("Có lỗi xảy ra trong quá trình gửi.");
        } finally {
            setIsSending(false);
        }
    };

    const handleSignDocuments = async () => {
        if (selectedIds.size === 0) return alert("Vui lòng chọn hồ sơ để ký.");
        
        const idsToSign = Array.from(selectedIds) as string[];
        const confirmSign = confirm(`Bạn đang thực hiện ký số cho ${idsToSign.length} hồ sơ. Tiếp tục?`);
        
        if (confirmSign) {
            setIsLoading(true);
            await insuranceService.signDocuments(idsToSign);
            setDocuments(prev => prev.map(d => selectedIds.has(d.id) ? { ...d, signatureStatus: 'Signed' } : d));
            setIsLoading(false);
            alert("Đã ký số thành công.");
        }
    };

    const filteredDocuments = useMemo(() => {
        return documents.filter(doc => {
            const matchesSearch = doc.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  doc.recordNumber.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = statusFilter === 'All' || doc.sendStatus === statusFilter;
            const matchesSignature = signatureFilter === 'All' || doc.signatureStatus === signatureFilter;
            const matchesType = typeFilter === 'All' || doc.docTypeCode === typeFilter;

            return matchesSearch && matchesStatus && matchesSignature && matchesType;
        });
    }, [documents, searchTerm, statusFilter, signatureFilter, typeFilter]);

    const getStatusBadge = (status: string, errorMsg?: string) => {
        switch(status) {
            case 'Success': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700 border border-green-200"><CheckCircleIcon className="w-3 h-3"/> Thành công</span>;
            case 'Error': return (
                <div className="flex flex-col items-start">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-200"><ExclamationCircleIcon className="w-3 h-3"/> Lỗi</span>
                    {errorMsg && <span className="text-[10px] text-red-500 max-w-[150px] truncate" title={errorMsg}>{errorMsg}</span>}
                </div>
            );
            case 'Sending': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 animate-pulse"><RefreshIcon className="w-3 h-3 animate-spin"/> Đang gửi...</span>;
            default: return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">Chưa gửi</span>;
        }
    };

    const getDocTypeColor = (type: string) => {
        switch(type) {
            case 'GiayChuyenVien': return 'text-purple-600 bg-purple-50 border-purple-200';
            case 'GiayRaVien': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'GiayNghiBHXH': return 'text-orange-600 bg-orange-50 border-orange-200';
            default: return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <PaperAirplaneIcon className="w-8 h-8 text-blue-600 -rotate-45 mt-1"/> Gửi Giấy tờ lên Cổng BHYT
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Quản lý và gửi các giấy tờ (Chuyển tuyến, Ra viện, Nghỉ BHXH...) lên cổng giám định.</p>
                </div>
                
                <div className="flex gap-2 w-full md:w-auto">
                    <button 
                        onClick={handleSignDocuments}
                        disabled={selectedIds.size === 0 || isLoading || isSending}
                        className="flex-1 md:flex-none px-4 py-2 bg-white border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition"
                    >
                        <SignatureIcon className="w-5 h-5 text-blue-600"/> Ký số (Batch)
                    </button>
                    <button 
                        onClick={handleSendDocuments}
                        disabled={selectedIds.size === 0 || isLoading || isSending}
                        className="flex-1 md:flex-none px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md flex items-center justify-center gap-2 disabled:opacity-50 transition-transform active:scale-95"
                    >
                        {isSending ? <RefreshIcon className="w-5 h-5 animate-spin"/> : <CloudUploadIcon className="w-5 h-5"/>}
                        {isSending ? 'Đang gửi...' : 'Gửi Cổng'}
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-3 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
                    <input 
                        type="text" 
                        placeholder="Tìm tên, mã hồ sơ..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className={`w-full pl-9 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 ${fontSettings.controls}`}
                    />
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    <select 
                        value={typeFilter}
                        onChange={e => setTypeFilter(e.target.value)}
                        className={`p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[150px] ${fontSettings.controls}`}
                    >
                        <option value="All">Tất cả loại phiếu</option>
                        <option value="GiayChuyenVien">Giấy chuyển tuyến</option>
                        <option value="GiayRaVien">Giấy ra viện</option>
                        <option value="GiayNghiBHXH">Giấy nghỉ BHXH</option>
                        <option value="GiayChungSinh">Giấy chứng sinh</option>
                    </select>

                    <select 
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value as any)}
                        className={`p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 cursor-pointer ${fontSettings.controls}`}
                    >
                        <option value="All">Tất cả trạng thái</option>
                        <option value="Unsent">Chưa gửi</option>
                        <option value="Success">Gửi thành công</option>
                        <option value="Error">Gửi lỗi</option>
                    </select>

                    <select 
                        value={signatureFilter}
                        onChange={e => setSignatureFilter(e.target.value as any)}
                        className={`p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 cursor-pointer ${fontSettings.controls}`}
                    >
                        <option value="All">Tất cả ký số</option>
                        <option value="Signed">Đã ký</option>
                        <option value="Unsigned">Chưa ký</option>
                    </select>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="flex gap-4 px-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                    Đã chọn: <strong className="text-blue-600 dark:text-blue-400">{selectedIds.size}</strong> hồ sơ
                </span>
                <div className="w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                    Sẵn sàng gửi: <strong className="text-green-600 dark:text-green-400">{filteredDocuments.filter(d => d.sendStatus === 'Unsent' && d.signatureStatus === 'Signed').length}</strong>
                </span>
                 <div className="w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
                 <span className="text-xs text-slate-500 dark:text-slate-400">
                    Chưa ký: <strong className="text-orange-600 dark:text-orange-400">{filteredDocuments.filter(d => d.signatureStatus === 'Unsigned').length}</strong>
                </span>
            </div>

            {/* Table */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1 custom-scrollbar">
                    <table className={`w-full text-left border-collapse ${fontSettings.listPrimary}`}>
                        <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-4 w-12 text-center">
                                    <input 
                                        type="checkbox" 
                                        onChange={handleSelectAll} 
                                        checked={filteredDocuments.length > 0 && selectedIds.size === filteredDocuments.length}
                                        className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                </th>
                                <th className="p-4 w-24">Mã Key</th>
                                <th className="p-4">Bệnh nhân / Hồ sơ</th>
                                <th className="p-4">Loại phiếu</th>
                                <th className="p-4 text-center">Ký số</th>
                                <th className="p-4">Trạng thái gửi</th>
                                <th className="p-4">Thời gian</th>
                                <th className="p-4 text-right w-20">XML</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredDocuments.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-12 text-center text-slate-400 italic">
                                        Không tìm thấy giấy tờ nào phù hợp.
                                    </td>
                                </tr>
                            ) : (
                                filteredDocuments.map((doc) => (
                                    <tr 
                                        key={doc.id} 
                                        className={`hover:bg-blue-50 dark:hover:bg-slate-700/30 transition-colors ${selectedIds.has(doc.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                    >
                                        <td className="p-4 text-center">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedIds.has(doc.id)} 
                                                onChange={() => handleToggleSelect(doc.id)}
                                                className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            />
                                        </td>
                                        <td className="p-4 font-mono text-xs text-slate-500">{doc.id}</td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 dark:text-white">{doc.patientName}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1">
                                                <span>{doc.yearOfBirth} - {doc.gender}</span>
                                                <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                                                <span className="font-mono text-blue-600 dark:text-blue-400">HS: {doc.recordNumber}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded border text-xs font-bold ${getDocTypeColor(doc.docTypeCode)}`}>
                                                {doc.docTypeName}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            {doc.signatureStatus === 'Signed' ? (
                                                <span className="text-green-600" title="Đã ký số"><SignatureIcon className="w-5 h-5 mx-auto"/></span>
                                            ) : (
                                                <span className="text-slate-300" title="Chưa ký"><SignatureIcon className="w-5 h-5 mx-auto"/></span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {getStatusBadge(doc.sendStatus, doc.errorMessage)}
                                            {doc.transactionId && <div className="text-[10px] text-slate-400 font-mono mt-0.5">{doc.transactionId}</div>}
                                        </td>
                                        <td className="p-4 text-xs text-slate-600 dark:text-slate-400">
                                            <div>Tạo: {formatDateTime(doc.createdTime)}</div>
                                            {doc.sentTime && <div className="text-green-600">Gửi: {formatDateTime(doc.sentTime)}</div>}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button 
                                                onClick={() => alert(`Xem XML của ${doc.id}:\n${doc.xmlData}`)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded transition"
                                                title="Xem nội dung XML"
                                            >
                                                <EyeIcon className="w-5 h-5"/>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination (Simple) */}
                <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-500 flex justify-between items-center">
                    <span>Hiển thị {filteredDocuments.length} kết quả</span>
                </div>
            </div>
        </div>
    );
};

export default DocumentSubmissionView;
