
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockRequests, mockTemplates, ImagingRequest, ReportTemplate, mockEMRData } from '../data';
import { 
    ChevronLeftIcon, 
    CameraIcon, 
    SaveIcon, 
    PrinterIcon, 
    CheckBadgeIcon,
    SearchIcon,
    ListBulletIcon,
    PhotographIcon,
    SparklesIcon,
    CheckIcon,
    TrashIcon,
    XIcon,
    ScannerIcon,
    FolderIcon,
    UserGroupIcon,
    BeakerIcon,
    ArrowUpTrayIcon,
    ActivityIcon,
    ClockIcon,
    PhoneIcon,
    DocumentTextIcon
} from '../../../components/Icons';
import { usePdfPreview } from '../../../contexts/PdfPreviewContext';
import ImageCaptureModal from './components/ImageCaptureModal';
import { generateImagingReportPdf } from '../utils/reportGenerator';
import DocumentTree, { TreeNode } from '../../../components/shared/DocumentTree';

interface CapturedImage {
    id: string;
    url: string;
    timestamp: string;
    note?: string;
    isSelected: boolean;
}

// Professional Macros for quick insertion
const macroCategories = [
    {
        category: 'Phổ biến',
        items: [
            { label: "Bình thường", text: "Hình ảnh trong giới hạn bình thường." },
            { label: "Tim phổi OK", text: "Bóng tim không to. Nhu mô phổi sáng đều." },
        ]
    },
    {
        category: 'Xương khớp',
        items: [
            { label: "Không gãy", text: "Không thấy hình ảnh gãy xương hay trật khớp." },
            { label: "Thoái hóa", text: "Hình ảnh thoái hóa xương, gai xương vùng..." },
        ]
    },
    {
        category: 'Ổ bụng',
        items: [
            { label: "Dịch âm tính", text: "Không thấy dịch tự do trong ổ bụng." },
            { label: "Sỏi thận (-)", text: "Hai thận không sỏi, không ứ nước." },
        ]
    }
];

// Mock Data for Selection
const mockTechnicians = [
    { id: 'ktv1', name: 'KTV. Nguyễn Văn A' },
    { id: 'ktv2', name: 'KTV. Trần Thị B' },
    { id: 'ktv3', name: 'BS. Phạm Văn Soi' },
];

const mockDevices = [
    { id: 'dev1', name: 'Máy Siêu âm GE Voluson E8' },
    { id: 'dev2', name: 'Hệ thống Nội soi Olympus CV-190' },
    { id: 'dev3', name: 'X-Quang KTS Samsung' },
    { id: 'dev4', name: 'Máy CT GE Revolution' },
];

const ProcedureRecordView: React.FC = () => {
    const { requestId } = useParams<{ requestId: string }>();
    const navigate = useNavigate();
    const { openPdf } = usePdfPreview();
    
    // Data State
    const [request, setRequest] = useState<ImagingRequest | null>(null);
    const [technique, setTechnique] = useState('');
    const [findings, setFindings] = useState('');
    const [conclusion, setConclusion] = useState('');
    
    // Execution Info State
    const [performingDevice, setPerformingDevice] = useState('');
    const [technician, setTechnician] = useState('');
    const [resultTime, setResultTime] = useState(new Date().toISOString().slice(0, 16)); // Format for datetime-local

    // Images State
    const [images, setImages] = useState<CapturedImage[]>([]);
    const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
    const [viewImage, setViewImage] = useState<string | null>(null);

    // Layout State
    const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
    const [activeLeftTab, setActiveLeftTab] = useState<'templates' | 'emr'>('templates');
    const [searchTerm, setSearchTerm] = useState('');
    
    // EMR State
    const [emrData, setEmrData] = useState<TreeNode[]>(mockEMRData);
    const [selectedEMRNode, setSelectedEMRNode] = useState<TreeNode | null>(null);
    const emrFileInputRef = useRef<HTMLInputElement>(null);
    
    // Refs for textareas to support macro insertion at cursor
    const findingsRef = useRef<HTMLTextAreaElement>(null);
    const conclusionRef = useRef<HTMLTextAreaElement>(null);
    const [activeField, setActiveField] = useState<'findings' | 'conclusion'>('findings');

    // --- Initialization ---
    useEffect(() => {
        const found = mockRequests.find(r => r.id === requestId);
        if (found) {
            setRequest(found);
            
            // Populate existing report data
            if (found.report) {
                const parts = found.report.split('KẾT LUẬN:');
                if (parts.length > 1) {
                    const body = parts[0];
                    const techMatch = body.match(/KỸ THUẬT:(.*?)(?=MÔ TẢ|KẾT LUẬN|$)/s);
                    const descMatch = body.match(/MÔ TẢ.*?:(.*?)(?=KẾT LUẬN|$)/s);
                    
                    if (techMatch) setTechnique(techMatch[1].trim());
                    if (descMatch) setFindings(descMatch[1].trim());
                    else setFindings(body.replace('KỸ THUẬT:', '').trim());
                    
                    setConclusion(parts[1].trim());
                } else {
                    setFindings(found.report);
                }
            }

            // Pre-fill execution info if available (mock logic)
            if (found.technician) setTechnician(found.technician);
            
            // Set default device based on modality
            const defaultDev = mockDevices.find(d => d.name.includes(found.modality === 'Ultrasound' ? 'Siêu âm' : found.modality === 'Endoscopy' ? 'Nội soi' : 'X-Quang'));
            if (defaultDev) setPerformingDevice(defaultDev.name);

            // Mock: Load some initial images ONLY if url is valid
            if (found.imageUrl && found.imageUrl.trim() !== '') {
                setImages([{
                    id: 'init-1',
                    url: found.imageUrl,
                    timestamp: 'Initial',
                    isSelected: true
                }]);
            } else {
                setImages([]); // Ensure clean slate if no image
            }
        }
    }, [requestId]);

    // --- Clipboard Paste Listener ---
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    if (blob) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            if (event.target?.result) {
                                const newImg: CapturedImage = {
                                    id: `paste-${Date.now()}`,
                                    url: event.target.result as string,
                                    timestamp: new Date().toLocaleTimeString(),
                                    isSelected: true
                                };
                                setImages(prev => [...prev, newImg]);
                            }
                        };
                        reader.readAsDataURL(blob);
                    }
                }
            }
        };

        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, []);

    // --- Logic ---

    const handleApplyTemplate = (tpl: ReportTemplate) => {
        const content = tpl.content;
        const techMatch = content.match(/KỸ THUẬT:(.*?)(?=MÔ TẢ|KẾT LUẬN|$)/s);
        const findMatch = content.match(/MÔ TẢ.*?:(.*?)(?=KẾT LUẬN|$)/s);
        const concMatch = content.match(/KẾT LUẬN:(.*)/s);

        if (techMatch) setTechnique(techMatch[1].trim());
        if (findMatch) setFindings(findMatch[1].trim());
        else setFindings(content.replace(/KỸ THUẬT:.*?(?=MÔ TẢ)/s, '').trim());
        
        if (concMatch) setConclusion(concMatch[1].trim());
    };

    const insertTextAtCursor = (text: string) => {
        const targetSetter = activeField === 'findings' ? setFindings : setConclusion;
        const targetRef = activeField === 'findings' ? findingsRef : conclusionRef;
        const currentValue = activeField === 'findings' ? findings : conclusion;

        if (targetRef.current) {
            const start = targetRef.current.selectionStart;
            const end = targetRef.current.selectionEnd;
            const newValue = currentValue.substring(0, start) + text + currentValue.substring(end);
            targetSetter(newValue);
            
            setTimeout(() => {
                targetRef.current?.focus();
                targetRef.current?.setSelectionRange(start + text.length, start + text.length);
            }, 0);
        } else {
            targetSetter(prev => prev ? `${prev}\n${text}` : text);
        }
    };

    const handleFormatting = (tagStart: string, tagEnd: string) => {
        const targetSetter = activeField === 'findings' ? setFindings : setConclusion;
        const targetRef = activeField === 'findings' ? findingsRef : conclusionRef;
        const currentValue = activeField === 'findings' ? findings : conclusion;

        if (targetRef.current) {
            const start = targetRef.current.selectionStart;
            const end = targetRef.current.selectionEnd;
            
            // If text is selected, wrap it. If not, insert tags.
            const selectedText = currentValue.substring(start, end);
            const replacement = tagStart + selectedText + tagEnd;
            
            const newValue = currentValue.substring(0, start) + replacement + currentValue.substring(end);
            targetSetter(newValue);

            setTimeout(() => {
                targetRef.current?.focus();
                const newCursorPos = start + tagStart.length + selectedText.length + (selectedText ? tagEnd.length : 0);
                targetRef.current?.setSelectionRange(newCursorPos, newCursorPos);
            }, 0);
        }
    };

    const handleCaptureSave = (newImages: CapturedImage[]) => {
        setImages(prev => [...prev, ...newImages]);
    };

    const toggleImageSelection = (id: string) => {
        setImages(prev => prev.map(img => img.id === id ? { ...img, isSelected: !img.isSelected } : img));
    };

    const deleteImage = (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); 
        e.preventDefault();
        
        if(window.confirm("Bạn có chắc chắn muốn xóa ảnh này không?")) {
            setImages(prev => prev.filter(i => i.id !== id));
        }
    };

    const handleEMRSelect = (node: TreeNode) => {
        setSelectedEMRNode(node);
        if (node.type === 'file') {
            openPdf({
                url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf', // Demo URL
                fileName: `${node.label}.pdf`,
                isSignable: false
            });
        }
    };

    const handleEmrFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const newNode: TreeNode = {
            id: `UPLOAD_${Date.now()}`,
            label: file.name,
            type: 'file',
            date: new Date().toLocaleDateString('vi-VN'),
            status: 'pending'
        };

        const newData = [...emrData];
        if (newData.length > 0 && newData[0].children && newData[0].children.length > 0) {
             const targetFolder = newData[0].children[0]; 
             if(targetFolder.children) {
                 targetFolder.children.unshift(newNode);
             } else {
                 targetFolder.children = [newNode];
             }
        } else {
            newData.push(newNode);
        }
        
        setEmrData(newData);
        alert(`Đã tải lên tài liệu: ${file.name}`);
        e.target.value = '';
    };

    // --- REPORT CONSTRUCTION ---
    const constructReportData = () => {
        if (!request) return null;
        
        const reportJson = {
            request: request,
            execution: {
                device: performingDevice,
                technician: technician,
                date: resultTime
            },
            content: {
                technique,
                findings,
                conclusion
            },
            images: images.filter(img => img.isSelected).map(img => img.url)
        };
        return reportJson;
    };

    const handleSave = (isFinal: boolean) => {
        const reportData = constructReportData();
        if (!reportData) return;

        console.log(">>> SAVING REPORT TO API (JSON PAYLOAD):", JSON.stringify(reportData, null, 2));
        
        const fullReport = `KỸ THUẬT: ${technique}\n\nMÔ TẢ HÌNH ẢNH:\n${findings}\n\nKẾT LUẬN:\n${conclusion}`;
        if (request) {
            setRequest({ ...request, status: isFinal ? 'Approved' : 'Reported', report: fullReport });
        }
        alert(isFinal ? "Đã duyệt và lưu kết quả thành công!" : "Đã lưu nháp vào hệ thống!");
    };

    const handlePrint = () => {
        const reportData = constructReportData();
        if (reportData) {
            const pdfUrl = generateImagingReportPdf(reportData);
            openPdf({
                url: pdfUrl,
                fileName: `Result_${request?.id}.pdf`,
                isSignable: true
            });
        }
    };

    if (!request) return <div className="flex h-screen items-center justify-center text-slate-500">Đang tải dữ liệu...</div>;

    const templates = mockTemplates.filter(t => 
        t.modality === request.modality && 
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isInsurance = request.id.includes('P002') || request.patientType === 'Bảo hiểm';

    return (
        <div className="flex flex-col h-screen bg-slate-100 dark:bg-slate-900 fixed inset-0 z-[50]">
            
            {/* 1. Top Bar: Professional Gradient Header (Similar to Patient Record) */}
            <div className="flex-shrink-0 bg-gradient-to-r from-slate-800 to-slate-700 text-white shadow-md z-20">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/imaging-results/worklist')} className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
                            <ChevronLeftIcon className="w-6 h-6 text-white" />
                        </button>
                        
                        {/* Patient Info Block */}
                        <div className="flex flex-col">
                            <div className="flex items-center gap-3">
                                <h1 className="text-lg font-bold uppercase flex items-center gap-2 text-white tracking-wide">
                                    {request.patientName} 
                                </h1>
                                <span className="text-sm bg-white/20 px-2 py-0.5 rounded font-semibold text-slate-100">
                                    {request.gender} - {request.age}T
                                </span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                                    isInsurance 
                                    ? 'bg-green-600 border-green-400 text-white' 
                                    : 'bg-slate-600 border-slate-400 text-slate-200'
                                }`}>
                                    {isInsurance ? 'Bảo hiểm' : 'Dịch vụ'}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-300 mt-1 opacity-90">
                                <span className="flex items-center gap-1">
                                    <span className="font-bold text-slate-400">ID:</span> {request.patientId}
                                </span>
                                <span className="hidden md:flex items-center gap-1">
                                    <PhoneIcon className="w-3 h-3"/> {request.phone || 'N/A'}
                                </span>
                                <span className="hidden md:flex items-center gap-1">
                                    <span className="font-bold text-slate-400">ĐC:</span> 456 Minh Khai, HN
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                        {/* Status Indicator */}
                        <div className={`hidden sm:flex px-3 py-1 rounded-full text-xs font-bold uppercase border items-center gap-1 ${
                            request.status === 'Approved' 
                            ? 'bg-green-500/20 text-green-400 border-green-500/50' 
                            : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                        }`}>
                            {request.status === 'Approved' ? <CheckIcon className="w-3 h-3"/> : <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>}
                            {request.status === 'Approved' ? 'Đã duyệt' : 'Đang thực hiện'}
                        </div>

                        <div className="h-8 w-px bg-white/20 mx-2 hidden sm:block"></div>

                        <button onClick={handlePrint} className="flex flex-col items-center justify-center px-2 text-slate-300 hover:text-white transition group">
                            <PrinterIcon className="w-5 h-5 mb-0.5 group-hover:scale-110 transition-transform"/>
                            <span className="text-[10px] font-bold">In</span>
                        </button>
                        
                        <button 
                            onClick={() => handleSave(false)}
                            className="flex flex-col items-center justify-center px-2 text-slate-300 hover:text-white transition group"
                        >
                            <SaveIcon className="w-5 h-5 mb-0.5 group-hover:scale-110 transition-transform"/>
                            <span className="text-[10px] font-bold">Lưu nháp</span>
                        </button>

                        <button 
                            onClick={() => handleSave(true)}
                            disabled={request.status === 'Approved'}
                            className={`ml-2 flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm shadow-lg transition-all hover:shadow-xl active:scale-95 text-white ${
                                request.status === 'Approved' ? 'bg-slate-600 cursor-not-allowed opacity-50' : 'bg-blue-600 hover:bg-blue-500 border border-blue-400'
                            }`}
                        >
                            <CheckBadgeIcon className="w-5 h-5"/>
                            Duyệt KQ
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. Main Workspace */}
            <div className="flex flex-1 overflow-hidden">
                
                {/* --- LEFT COLUMN: TABBED SIDEBAR --- */}
                <div className={`${isLeftSidebarOpen ? 'w-80' : 'w-0'} bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300 overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10`}>
                    
                    {/* Tab Header */}
                    <div className="flex border-b border-slate-200 dark:border-slate-700">
                        <button 
                            onClick={() => setActiveLeftTab('templates')}
                            className={`flex-1 py-3 text-xs font-bold uppercase transition-colors flex items-center justify-center gap-2 ${
                                activeLeftTab === 'templates' 
                                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-slate-700' 
                                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                        >
                            <ListBulletIcon className="w-4 h-4"/> Mẫu KQ
                        </button>
                        <button 
                            onClick={() => setActiveLeftTab('emr')}
                            className={`flex-1 py-3 text-xs font-bold uppercase transition-colors flex items-center justify-center gap-2 ${
                                activeLeftTab === 'emr' 
                                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-slate-700' 
                                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                        >
                            <FolderIcon className="w-4 h-4"/> EMR
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                        
                        {/* VIEW: TEMPLATES & CLINICAL & TECHNICAL */}
                        {activeLeftTab === 'templates' && (
                            <>
                                {/* 1. Request Info Block (Moved from Header) */}
                                <div className="p-3 m-3 mb-0 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800/30">
                                    <h4 className="text-xs font-bold text-blue-700 dark:text-blue-500 uppercase mb-2 flex items-center gap-2">
                                        <DocumentTextIcon className="w-3.5 h-3.5"/> Thông tin chỉ định
                                    </h4>
                                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1 leading-tight">
                                        {request.serviceName}
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 border-t border-blue-100 dark:border-blue-800/30 pt-2 mt-2">
                                        <span>Số phiếu: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{request.id}</span></span>
                                    </div>
                                </div>

                                {/* 2. Clinical Context Block (Moved from Info Tab) */}
                                <div className="p-3 m-3 mb-0 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-100 dark:border-yellow-800/30">
                                    <h4 className="text-xs font-bold text-yellow-700 dark:text-yellow-500 uppercase mb-1 flex items-center gap-2">
                                        <ActivityIcon className="w-3.5 h-3.5"/> Lâm sàng
                                    </h4>
                                    <div className="text-sm text-slate-800 dark:text-slate-200 font-medium mb-1">
                                        Theo dõi viêm ruột thừa cấp
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                                        Đau hố chậu phải, sốt nhẹ. Đề nghị siêu âm kỹ.
                                    </p>
                                    <div className="mt-2 pt-2 border-t border-yellow-100 dark:border-yellow-800/30 text-[10px] text-slate-400 text-right">
                                        BS chỉ định: BS. Lâm Sàng A
                                    </div>
                                </div>

                                {/* 3. Execution Info Section (Technical) */}
                                <div className="p-3 pb-0">
                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                                            <ScannerIcon className="w-3.5 h-3.5"/> Thông tin kỹ thuật
                                        </h4>
                                        <div className="space-y-2">
                                            <div>
                                                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Thiết bị</label>
                                                <select 
                                                    value={performingDevice}
                                                    onChange={(e) => setPerformingDevice(e.target.value)}
                                                    className="w-full p-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none"
                                                >
                                                    <option value="">-- Chọn --</option>
                                                    {mockDevices.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                                                </select>
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="flex-1">
                                                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">KTV</label>
                                                    <select 
                                                        value={technician}
                                                        onChange={(e) => setTechnician(e.target.value)}
                                                        className="w-full p-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none"
                                                    >
                                                        <option value="">-- Chọn --</option>
                                                        {mockTechnicians.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                                                    </select>
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Thời gian</label>
                                                    <input 
                                                        type="datetime-local"
                                                        value={resultTime}
                                                        onChange={(e) => setResultTime(e.target.value)}
                                                        className="w-full p-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 4. Templates & Macros */}
                                <div className="flex-1 flex flex-col min-h-0 mt-2">
                                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
                                        <div className="relative">
                                            <SearchIcon className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400"/>
                                            <input 
                                                type="text" 
                                                placeholder="Tìm mẫu kết quả..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-8 p-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800 focus:ring-1 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="p-2 overflow-y-auto">
                                        <div className="mb-4">
                                            <h4 className="px-2 text-xs font-bold text-slate-400 uppercase mb-2 flex items-center justify-between">
                                                Mẫu {request.modality}
                                                <span className="bg-slate-100 dark:bg-slate-700 text-slate-500 px-1.5 rounded-full">{templates.length}</span>
                                            </h4>
                                            <div className="space-y-1">
                                                {templates.map(tpl => (
                                                    <button 
                                                        key={tpl.id}
                                                        onClick={() => handleApplyTemplate(tpl)}
                                                        className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 group transition-colors border border-transparent hover:border-blue-100 dark:hover:border-slate-600"
                                                    >
                                                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 line-clamp-1">{tpl.name}</div>
                                                        <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{tpl.content.replace(/<[^>]+>/g, '').substring(0, 50)}...</div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Macros */}
                                        <div>
                                            <h4 className="px-2 text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                                                <SparklesIcon className="w-3 h-3"/> Câu gõ tắt (Macros)
                                            </h4>
                                            {macroCategories.map((cat, idx) => (
                                                <div key={idx} className="mb-3">
                                                    <div className="px-2 text-[10px] font-bold text-slate-400 mb-1">{cat.category}</div>
                                                    <div className="flex flex-wrap gap-2 px-2">
                                                        {cat.items.map((m, i) => (
                                                            <button 
                                                                key={i}
                                                                onClick={() => insertTextAtCursor(m.text)}
                                                                className="px-2 py-1 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all active:scale-95"
                                                                title={m.text}
                                                            >
                                                                {m.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* VIEW: EMR INFO */}
                        {activeLeftTab === 'emr' && (
                            <div className="h-full flex flex-col">
                                <div className="p-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase">Hồ sơ bệnh án điện tử</h4>
                                        <button 
                                            onClick={() => emrFileInputRef.current?.click()}
                                            className="p-1 hover:bg-blue-100 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 rounded transition" 
                                            title="Tải lên tài liệu"
                                        >
                                            <ArrowUpTrayIcon className="w-4 h-4"/>
                                        </button>
                                    </div>
                                    <input type="file" ref={emrFileInputRef} className="hidden" onChange={handleEmrFileUpload} />
                                    <div className="relative">
                                        <SearchIcon className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400"/>
                                        <input 
                                            type="text" 
                                            placeholder="Tìm hồ sơ..."
                                            className="w-full pl-8 p-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800 focus:ring-1 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    <DocumentTree
                                        data={emrData}
                                        selectedId={selectedEMRNode?.id || null}
                                        onSelect={handleEMRSelect}
                                        defaultExpanded={['EMR_ROOT', 'DOT_DIEU_TRI_01', 'CLS_GROUP']}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Toggle Button */}
                {!isLeftSidebarOpen && (
                    <button 
                        onClick={() => setIsLeftSidebarOpen(true)}
                        className="absolute left-0 top-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-r-lg shadow-md z-30 hover:bg-blue-50 hover:text-blue-600"
                    >
                        <ListBulletIcon className="w-5 h-5"/>
                    </button>
                )}

                {/* --- CENTER COLUMN: PROFESSIONAL EDITOR --- */}
                <div className="flex-1 bg-slate-100 dark:bg-slate-900/50 overflow-y-auto p-4 lg:p-8 flex justify-center relative">
                    <div className="w-full max-w-4xl bg-white dark:bg-slate-800 shadow-xl rounded-xl overflow-hidden flex flex-col h-full min-h-[800px] border border-slate-200 dark:border-slate-700">
                        
                        {/* Editor Toolbar */}
                        <div className="px-6 py-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex gap-2 items-center text-sm sticky top-0 z-10">
                            <span className="text-xs font-bold text-slate-400 uppercase mr-2">Công cụ:</span>
                            <button onClick={() => handleFormatting('<b>', '</b>')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded font-bold w-8" title="In đậm">B</button>
                            <button onClick={() => handleFormatting('<i>', '</i>')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded italic w-8" title="In nghiêng">I</button>
                            <button onClick={() => handleFormatting('<u>', '</u>')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded underline w-8" title="Gạch chân">U</button>
                            <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                            <button onClick={() => handleFormatting('<ul>\n<li>', '</li>\n</ul>')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded flex items-center" title="Danh sách">
                                <ListBulletIcon className="w-4 h-4"/>
                            </button>
                        </div>

                        <div className="flex-1 p-8 md:p-12 flex flex-col gap-6 font-serif">
                            
                            {/* Field: Technique */}
                            <div className="group">
                                <label className="block text-sm font-bold text-blue-800 dark:text-blue-400 uppercase mb-1 tracking-wide">Kỹ thuật khám</label>
                                <input 
                                    value={technique}
                                    onChange={e => setTechnique(e.target.value)}
                                    className="w-full p-2 border-b border-dotted border-slate-300 dark:border-slate-600 bg-transparent focus:border-blue-500 focus:ring-0 outline-none transition-colors text-slate-800 dark:text-slate-200 font-medium"
                                    placeholder="Ghi nhận kỹ thuật..."
                                />
                            </div>

                            {/* Field: Findings */}
                            <div className="flex-1 flex flex-col group relative">
                                <label className="block text-sm font-bold text-blue-800 dark:text-blue-400 uppercase mb-2 tracking-wide flex justify-between">
                                    Mô tả hình ảnh
                                    <span className="text-[10px] font-normal text-slate-400 normal-case italic">Nhấn vào để soạn thảo</span>
                                </label>
                                <textarea 
                                    ref={findingsRef}
                                    value={findings}
                                    onChange={e => setFindings(e.target.value)}
                                    onFocus={() => setActiveField('findings')}
                                    className={`flex-1 w-full p-4 border rounded-lg text-base leading-relaxed resize-none transition-all duration-200 outline-none font-mono
                                        ${activeField === 'findings' 
                                            ? 'border-blue-400 ring-4 ring-blue-50 dark:ring-blue-900/20 bg-white dark:bg-slate-800' 
                                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/20'
                                        } text-slate-800 dark:text-slate-200`}
                                    placeholder="Mô tả chi tiết các tổn thương..."
                                />
                            </div>

                            {/* Field: Conclusion */}
                            <div className="group relative">
                                <label className="block text-sm font-bold text-red-600 dark:text-red-400 uppercase mb-2 tracking-wide">Kết luận</label>
                                <textarea 
                                    ref={conclusionRef}
                                    value={conclusion}
                                    onChange={e => setConclusion(e.target.value)}
                                    onFocus={() => setActiveField('conclusion')}
                                    className={`w-full h-32 p-4 border rounded-lg text-base font-bold resize-none transition-all duration-200 outline-none
                                        ${activeField === 'conclusion'
                                            ? 'border-red-400 ring-4 ring-red-50 dark:ring-red-900/20 bg-white dark:bg-slate-800'
                                            : 'border-slate-200 dark:border-slate-700 bg-red-50/30 dark:bg-red-900/10'
                                        } text-slate-900 dark:text-white`}
                                    placeholder="Kết luận chẩn đoán..."
                                />
                            </div>
                        </div>
                        
                        <div className="p-4 text-center text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700">
                            Thông tin hành chính và bác sĩ đọc kết quả sẽ được tự động chèn khi in.
                        </div>
                    </div>
                </div>

                {/* --- RIGHT COLUMN: IMAGES --- */}
                <div className="w-80 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 flex flex-col shadow-[-4px_0_24px_rgba(0,0,0,0.02)] z-10">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                            <PhotographIcon className="w-5 h-5 text-blue-600"/>
                            Hình ảnh ({images.length})
                        </h3>
                        <button 
                            onClick={() => setIsCaptureModalOpen(true)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-slate-700 rounded transition"
                            title="Mở Camera"
                        >
                            <CameraIcon className="w-5 h-5"/>
                        </button>
                    </div>

                    {/* Gallery */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-100 dark:bg-slate-900/50">
                        {images.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-400 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl m-2">
                                <CameraIcon className="w-10 h-10 mb-2 opacity-50"/>
                                <p className="text-sm font-medium">Chưa có ảnh</p>
                                <p className="text-xs opacity-60 mt-1 text-center px-4">Chụp, Tải lên hoặc Dán (Ctrl+V) ảnh vào đây</p>
                                <button 
                                    onClick={() => setIsCaptureModalOpen(true)}
                                    className="mt-3 text-xs text-blue-600 font-bold hover:underline"
                                >
                                    Chụp ngay
                                </button>
                            </div>
                        ) : (
                            images.map((img, index) => (
                                <div key={img.id} className={`relative group rounded-lg overflow-hidden bg-black border-2 transition-all shadow-sm ${img.isSelected ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                                    <img 
                                        src={img.url} 
                                        className="w-full h-48 object-cover cursor-pointer" 
                                        alt="Capture"
                                        onClick={() => setViewImage(img.url)}
                                    />
                                    
                                    {/* Controls Overlay */}
                                    <div className="absolute top-0 left-0 w-full p-2 flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        <input 
                                            type="checkbox" 
                                            checked={img.isSelected} 
                                            onChange={() => toggleImageSelection(img.id)}
                                            className="w-5 h-5 rounded border-white cursor-pointer shadow-sm accent-blue-600 pointer-events-auto"
                                            title="Chọn in"
                                        />
                                        {/* Delete Button - Correctly implemented with stopPropagation */}
                                        <button 
                                            onClick={(e) => deleteImage(e, img.id)} 
                                            className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-lg pointer-events-auto transition-transform hover:scale-110 z-20"
                                            title="Xóa ảnh"
                                        >
                                            <TrashIcon className="w-3 h-3"/>
                                        </button>
                                    </div>
                                    
                                    <div className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[10px] p-1.5 flex justify-between">
                                        <span className="font-mono">IMG_{index + 1}</span>
                                        <span className="opacity-70">{img.timestamp}</span>
                                    </div>
                                    
                                    {img.isSelected && (
                                        <div className="absolute top-2 right-2 bg-blue-600 text-white p-1 rounded-full shadow-lg z-10 pointer-events-none">
                                            <CheckIcon className="w-3 h-3"/>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Capture Button */}
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                        <button 
                            onClick={() => setIsCaptureModalOpen(true)}
                            className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-teal-200 dark:shadow-none flex items-center justify-center gap-2 transition-transform active:scale-95"
                        >
                            <CameraIcon className="w-5 h-5"/>
                            Chụp / Tải ảnh
                        </button>
                    </div>
                </div>
            </div>

            {/* --- CAPTURE MODAL --- */}
            <ImageCaptureModal 
                isOpen={isCaptureModalOpen}
                onClose={() => setIsCaptureModalOpen(false)}
                onSave={handleCaptureSave}
            />

            {/* --- LIGHTBOX VIEWER --- */}
            {viewImage && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center animate-fade-in" onClick={() => setViewImage(null)}>
                    <button className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition">
                        <XIcon className="w-8 h-8"/>
                    </button>
                    <div className="max-w-[90vw] max-h-[90vh] p-1 bg-gray-800 rounded-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <img src={viewImage} alt="Full View" className="max-w-full max-h-[85vh] object-contain"/>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProcedureRecordView;
