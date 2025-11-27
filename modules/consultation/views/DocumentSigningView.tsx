
import React, { useState, useMemo } from 'react';
import { 
    SearchIcon, 
    FilterIcon, 
    CheckBadgeIcon, 
    XIcon, 
    InkPenIcon, 
    ClockIcon,
    UserGroupIcon,
    DocumentTextIcon,
    BanIcon,
    ShareIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { SignDocument } from '../../../types';

// --- MOCK DATA ---
const mockSignDocuments: SignDocument[] = [
    {
        id: 'DOC-001',
        type: 'Biên bản hội chẩn',
        title: 'Hội chẩn thông qua mổ - Ung thư vú (T)',
        patientName: 'Nguyễn Thị Hà',
        patientId: '250110098',
        submittedBy: 'BSNT. Nguyễn Đình Lợi',
        submittedDate: '2023-11-26 11:02',
        status: 'pending',
        content: {
            diagnosis: 'Ung thư vú phải pT1N1M0',
            summary: 'Bệnh nhân nữ 44 tuổi. TS chưa ghi nhận bệnh lý gì. Chẩn đoán: Ung thư vú phải pT1N1M0 - GPB/HMMD: Carcinoma xâm nhập độ II, 2/14 hạch (+), ER 60%, PR 90%, Her2 (+++) 100%, Ki67: 70%. Đã điều trị: 1. MRM vú phải. 2. Hóa chất bổ trợ 4AC-4T.',
            conclusion: 'Ung thư vú phải pT1N1M0. Hướng điều trị tiếp: Hội chẩn khoa Xạ cơ sở 2: xét xạ trị bổ trợ. Điều trị nội tiết bổ trợ sau xạ.',
            chairman: 'PGS.TS Đỗ Anh Tú',
            members: 'Các bác sĩ trong khoa'
        }
    },
    {
        id: 'DOC-002',
        type: 'Giấy ra viện',
        title: 'Giấy ra viện - Trần Thị Viện',
        patientName: 'Trần Thị Viện',
        patientId: '230912345',
        submittedBy: 'BS. Lê Văn C',
        submittedDate: '2023-11-27 07:49',
        status: 'pending',
        content: {
            diagnosis: 'Viêm phổi thùy',
            summary: 'Bệnh nhân ổn định, phổi thông khí tốt, hết sốt 3 ngày.',
            conclusion: 'Cho xuất viện, uống thuốc theo đơn.',
            chairman: 'TS.BS Phạm Văn Trưởng',
            members: ''
        }
    },
    {
        id: 'DOC-003',
        type: 'Phiếu chuyển tuyến',
        title: 'Chuyển viện lên tuyến trên',
        patientName: 'Hoàng Văn Em',
        patientId: '231056789',
        submittedBy: 'BS. Trần Thị B',
        submittedDate: '2023-11-25 14:30',
        status: 'signed'
    }
];

// --- DOCUMENT RENDERER COMPONENT ---
const DocumentRenderer = ({ doc }: { doc: SignDocument }) => {
    if (doc.type === 'Biên bản hội chẩn') {
        return (
            <div className="bg-white text-black p-8 md:p-12 shadow-sm min-h-[800px] font-serif relative">
                {/* Watermark/Background texture could go here */}
                
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div className="text-center text-xs">
                        <p className="font-bold uppercase">Bộ Y Tế</p>
                        <p className="font-bold uppercase">Bệnh viện K (Cơ sở 2)</p>
                        <p>Khoa Nội cơ sở 2</p>
                    </div>
                    <div className="text-center">
                        <p className="font-bold text-sm uppercase">Cộng hòa xã hội chủ nghĩa Việt Nam</p>
                        <p className="font-bold text-sm underline decoration-dotted mb-1">Độc lập - Tự do - Hạnh phúc</p>
                        <div className="text-right text-xs mt-2">
                            <p>MS: 27/BV-02</p>
                            <p>Số vào viện: {doc.patientId}</p>
                        </div>
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-xl font-bold uppercase">TRÍCH BIÊN BẢN HỘI CHẨN</h1>
                </div>

                {/* Content */}
                <div className="space-y-4 text-sm leading-relaxed">
                    <div className="flex justify-between">
                        <span>- Họ và tên người bệnh: <span className="font-bold uppercase">{doc.patientName}</span></span>
                        <span>Tuổi: 44 &nbsp;&nbsp; Giới tính: Nữ</span>
                    </div>
                    <div className="flex justify-between">
                         <span>- Tại số giường: 06</span>
                         <span>Buồng: </span>
                         <span>Khoa: Khoa Nội cơ sở 2</span>
                    </div>
                    
                    <div>
                        <p>- <span className="font-bold">Chẩn đoán:</span> {doc.content?.diagnosis}</p>
                    </div>
                    
                    <div>
                        <p>- <span className="font-bold">Hội chẩn lúc:</span> {new Date().toLocaleTimeString()} ngày {new Date().toLocaleDateString()}</p>
                    </div>

                    <div className="flex justify-between">
                        <p>- <span className="font-bold">Chủ tọa:</span> {doc.content?.chairman}</p>
                        <p><span className="font-bold">Thư ký:</span> {doc.submittedBy}</p>
                    </div>

                    <div>
                        <p>- <span className="font-bold">Thành viên tham gia:</span> {doc.content?.members}</p>
                    </div>

                    <div>
                        <p className="font-bold underline mb-1">Tóm tắt quá trình diễn biến bệnh, quá trình điều trị và chăm sóc người bệnh:</p>
                        <p className="whitespace-pre-wrap text-justify">{doc.content?.summary}</p>
                    </div>

                     <div>
                        <p className="font-bold underline mb-1">Kết luận (sau khi đã khám lại và thảo luận):</p>
                        <p className="whitespace-pre-wrap font-semibold">{doc.content?.diagnosis}</p>
                    </div>

                    <div>
                        <p className="font-bold underline mb-1">Hướng điều trị tiếp:</p>
                        <p className="whitespace-pre-wrap">{doc.content?.conclusion}</p>
                    </div>
                </div>

                {/* Footer / Signatures */}
                <div className="mt-12 flex justify-between px-8">
                    <div className="text-center">
                        <p className="font-bold">Thư ký</p>
                        {doc.status === 'signed' ? (
                            <div className="mt-2 border-2 border-green-600 text-green-600 px-3 py-1 rounded rotate-[-5deg] font-bold uppercase opacity-80 text-xs">
                                Đã ký bởi<br/>{doc.submittedBy}
                            </div>
                        ) : (
                            <div className="h-16"></div>
                        )}
                         <p className="mt-2 font-medium">{doc.submittedBy}</p>
                    </div>
                    <div className="text-center">
                         <p className="font-bold">Chủ tọa</p>
                         <div className="h-16"></div> {/* Placeholder for physical signature or digital placeholder */}
                         <p className="mt-2 font-medium">{doc.content?.chairman}</p>
                    </div>
                </div>
            </div>
        );
    }

    // Fallback for generic documents
    return (
        <div className="bg-white text-black p-10 shadow-sm min-h-[600px] flex items-center justify-center text-gray-400">
            <div className="text-center">
                <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 opacity-20"/>
                <p>Xem trước tài liệu: {doc.title}</p>
            </div>
        </div>
    );
};

const DocumentSigningView: React.FC = () => {
    const { fontSettings } = useTheme();
    const [documents, setDocuments] = useState<SignDocument[]>(mockSignDocuments);
    const [selectedDocId, setSelectedDocId] = useState<string | null>(mockSignDocuments[0]?.id || null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('All');
    const [dateRange, setDateRange] = useState({ from: new Date().toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) });
    const [searchTerm, setSearchTerm] = useState('');
    const [isSigning, setIsSigning] = useState(false);

    const selectedDoc = useMemo(() => documents.find(d => d.id === selectedDocId), [documents, selectedDocId]);

    const documentTypes = useMemo(() => {
        const types = new Set(documents.map(d => d.type));
        return ['All', ...Array.from(types)];
    }, [documents]);

    const filteredDocuments = useMemo(() => {
        return documents.filter(doc => {
            const matchesSearch = doc.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || doc.title.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' ? true : doc.status === statusFilter;
            const matchesType = typeFilter === 'All' ? true : doc.type === typeFilter;
            // For simplicity, ignoring date range logic in mock
            return matchesSearch && matchesStatus && matchesType;
        });
    }, [documents, searchTerm, statusFilter, typeFilter]);

    const handleSign = () => {
        if (!selectedDoc) return;
        setIsSigning(true);
        setTimeout(() => {
            setDocuments(prev => prev.map(d => d.id === selectedDocId ? { ...d, status: 'signed' } : d));
            setIsSigning(false);
            alert("Đã ký duyệt thành công!");
        }, 1000);
    };

    const handleReturn = () => {
        if (!selectedDoc) return;
        const reason = prompt("Nhập lý do trả lại:");
        if (reason) {
            setDocuments(prev => prev.map(d => d.id === selectedDocId ? { ...d, status: 'returned' } : d));
            alert("Đã trả lại hồ sơ.");
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] min-h-[600px] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            
            {/* Top Bar: Filters */}
            <div className="flex flex-col md:flex-row gap-4 p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shrink-0">
                <div className="flex items-center gap-3 flex-1 flex-wrap">
                    <div className="relative flex-1 max-w-md min-w-[200px]">
                        <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
                        <input 
                            type="text" 
                            placeholder="Tìm tên bệnh nhân..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className={`w-full pl-9 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 text-sm ${fontSettings.controls}`}
                        />
                    </div>
                    
                    <div className="relative min-w-[180px]">
                        <FilterIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
                        <select 
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className={`w-full pl-9 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 text-sm outline-none cursor-pointer ${fontSettings.controls}`}
                        >
                            <option value="All">Tất cả loại giấy tờ</option>
                            {documentTypes.filter(t => t !== 'All').map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500 whitespace-nowrap">Từ:</span>
                        <input type="date" value={dateRange.from} onChange={e => setDateRange(prev => ({...prev, from: e.target.value}))} className={`p-2 border rounded-lg bg-white dark:bg-slate-700 text-sm ${fontSettings.controls}`} />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500 whitespace-nowrap">Đến:</span>
                        <input type="date" value={dateRange.to} onChange={e => setDateRange(prev => ({...prev, to: e.target.value}))} className={`p-2 border rounded-lg bg-white dark:bg-slate-700 text-sm ${fontSettings.controls}`} />
                    </div>
                </div>
                
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg self-start">
                     <button onClick={() => setStatusFilter('all')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${statusFilter === 'all' ? 'bg-white dark:bg-slate-600 shadow text-blue-600' : 'text-slate-500'}`}>Tất cả</button>
                     <button onClick={() => setStatusFilter('pending')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${statusFilter === 'pending' ? 'bg-white dark:bg-slate-600 shadow text-orange-500' : 'text-slate-500'}`}>Chưa ký</button>
                     <button onClick={() => setStatusFilter('signed')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${statusFilter === 'signed' ? 'bg-white dark:bg-slate-600 shadow text-green-600' : 'text-slate-500'}`}>Đã ký</button>
                     <button onClick={() => setStatusFilter('returned')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${statusFilter === 'returned' ? 'bg-white dark:bg-slate-600 shadow text-red-600' : 'text-slate-500'}`}>Hủy trả</button>
                </div>
            </div>

            {/* Main Split Layout */}
            <div className="flex flex-1 overflow-hidden">
                
                {/* LEFT: Document List (30%) */}
                <div className="w-full md:w-96 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden shrink-0">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 uppercase flex justify-between">
                        <span>Danh sách văn bản ({filteredDocuments.length})</span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto">
                        {filteredDocuments.map(doc => (
                            <div 
                                key={doc.id} 
                                onClick={() => setSelectedDocId(doc.id)}
                                className={`p-4 border-b border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                                    selectedDocId === doc.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold text-slate-800 dark:text-white text-sm line-clamp-2">{doc.title}</h4>
                                    {doc.status === 'pending' && <span className="w-2 h-2 bg-orange-500 rounded-full shrink-0 mt-1.5"></span>}
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">{doc.patientName}</div>
                                    <div className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500 border border-slate-200 dark:border-slate-600 truncate max-w-[100px]">{doc.type}</div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                                    <UserGroupIcon className="w-3 h-3"/> 
                                    <span className="truncate">{doc.submittedBy}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] text-slate-400">
                                    <div className="flex items-center gap-1"><ClockIcon className="w-3 h-3"/> {doc.submittedDate}</div>
                                    {doc.status === 'signed' && <CheckBadgeIcon className="w-4 h-4 text-green-500"/>}
                                    {doc.status === 'returned' && <BanIcon className="w-4 h-4 text-red-500"/>}
                                </div>
                            </div>
                        ))}
                        {filteredDocuments.length === 0 && <div className="p-8 text-center text-slate-400 text-sm">Không có tài liệu nào.</div>}
                    </div>
                </div>

                {/* RIGHT: Preview & Actions (70%) */}
                <div className="flex-1 bg-slate-200 dark:bg-slate-900 flex flex-col overflow-hidden relative">
                    {selectedDoc ? (
                        <>
                            {/* Scrollable Document Area */}
                            <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center">
                                <div className="w-full max-w-[210mm] shadow-2xl transition-transform duration-200">
                                    <DocumentRenderer doc={selectedDoc} />
                                </div>
                            </div>

                            {/* Fixed Action Footer */}
                            <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex justify-between items-center z-20">
                                <div className="text-sm text-slate-500 hidden md:block">
                                    Đang xem: <span className="font-bold text-slate-800 dark:text-slate-200">{selectedDoc.title}</span>
                                </div>
                                
                                <div className="flex gap-3 w-full md:w-auto justify-end">
                                    <button className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition flex items-center gap-2">
                                        <ShareIcon className="w-4 h-4"/> Chuyển tiếp
                                    </button>
                                    
                                    {selectedDoc.status === 'pending' && (
                                        <>
                                            <button 
                                                onClick={handleReturn}
                                                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg font-bold text-sm transition flex items-center gap-2"
                                            >
                                                <BanIcon className="w-4 h-4"/> Trả lại
                                            </button>
                                            <button 
                                                onClick={handleSign}
                                                disabled={isSigning}
                                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm shadow-lg flex items-center gap-2 transition transform active:scale-95 disabled:opacity-70"
                                            >
                                                {isSigning ? (
                                                    <>Processing...</>
                                                ) : (
                                                    <><InkPenIcon className="w-4 h-4"/> Ký & Phát hành</>
                                                )}
                                            </button>
                                        </>
                                    )}
                                    {selectedDoc.status === 'signed' && (
                                        <div className="flex items-center gap-2 text-green-600 font-bold bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                                            <CheckBadgeIcon className="w-5 h-5"/> Đã ký duyệt
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-400 flex-col">
                            <DocumentTextIcon className="w-20 h-20 mb-4 opacity-20"/>
                            <p className="text-lg font-medium">Chọn tài liệu để xem nội dung</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DocumentSigningView;
