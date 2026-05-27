
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockRequests, mockTemplates, ImagingRequest, ReportTemplate } from '../data';
import MockDicomViewer from './components/MockDicomViewer';
import Combobox from '../../../components/ui/Combobox';
import { useTheme } from '../../../contexts/ThemeContext';
import { 
    ChevronLeftIcon, SaveIcon, CheckBadgeIcon, PrinterIcon,
    DocumentTextIcon, MicrophoneIcon, SparklesIcon,
    XIcon, ClipboardListIcon, UserCircleIcon, ClockIcon,
    // FIX: Removed LayoutIcon as it is not exported from Icons and is unused in this file.
    RefreshIcon, ListBulletIcon
} from '../../../components/Icons';

const ReadingView: React.FC = () => {
    const { requestId } = useParams<{ requestId: string }>();
    const navigate = useNavigate();
    const { fontSettings } = useTheme();
    
    // --- Data State ---
    const [request, setRequest] = useState<ImagingRequest | null>(null);
    const [technique, setTechnique] = useState('');
    const [findings, setFindings] = useState('');
    const [conclusion, setConclusion] = useState('');
    
    // UI Logic
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isDictating, setIsDictating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (requestId) {
            const found = mockRequests.find(r => r.id === requestId);
            if (found) {
                setRequest(found);
                // Giả lập load báo cáo cũ nếu có
                if (found.report) {
                    setFindings(found.report);
                } else {
                    // Mặc định nạp mẫu đầu tiên nếu chưa có nội dung
                    const defaultTpl = mockTemplates.find(t => t.modality === found.modality);
                    if (defaultTpl) applyTemplate(defaultTpl);
                }
            }
        }
    }, [requestId]);

    const applyTemplate = (tpl: ReportTemplate) => {
        const content = tpl.content;
        const techMatch = content.match(/KỸ THUẬT:(.*?)(?=MÔ TẢ|KẾT LUẬN|$)/s);
        const descMatch = content.match(/MÔ TẢ.*?:(.*?)(?=KẾT LUẬN|$)/s);
        const concMatch = content.match(/KẾT LUẬN:(.*)/s);

        if (techMatch) setTechnique(techMatch[1].trim());
        if (descMatch) setFindings(descMatch[1].trim());
        else setFindings(content.replace(/KỸ THUẬT:.*?(?=MÔ TẢ)/s, '').trim());
        
        if (concMatch) setConclusion(concMatch[1].trim());
    };

    const handleSave = (isFinal: boolean) => {
        setIsLoading(true);
        // Giả lập API call
        setTimeout(() => {
            setIsLoading(false);
            alert(isFinal ? "Đã duyệt và ký số thành công!" : "Đã lưu bản nháp.");
            if (isFinal) navigate('/imaging-results/worklist');
        }, 1000);
    };

    if (!request) return <div className="h-screen bg-black text-white flex items-center justify-center font-black">PAC STATION BOOTING...</div>;

    return (
        <div className="fixed inset-0 z-[100] bg-black text-slate-300 flex flex-col font-sans overflow-hidden">
            
            {/* 1. Station Header (Slim) */}
            <div className="h-12 bg-slate-900 border-b border-slate-700 flex justify-between items-center px-4 shrink-0 shadow-2xl z-50">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/imaging-results/worklist')} className="p-1.5 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
                        <ChevronLeftIcon className="w-6 h-6"/>
                    </button>
                    <div className="flex items-center gap-3 border-l border-slate-700 pl-4">
                        <div className="w-8 h-8 rounded bg-blue-900/30 text-blue-400 flex items-center justify-center font-black text-xs border border-blue-800/50 uppercase">
                            {request.modality}
                        </div>
                        <div>
                            <h1 className="text-sm font-black text-white uppercase tracking-tight leading-none">
                                {request.patientName}
                                <span className="ml-2 text-[10px] text-slate-500 font-normal">({request.gender}, {request.age}T)</span>
                            </h1>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Acc: {request.id}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="hidden lg:flex items-center gap-4 mr-6">
                        <div className="text-[10px] font-bold text-slate-500 text-right uppercase leading-tight">
                            <p>Bác sĩ chỉ định</p>
                            <p className="text-slate-300">BS. Lâm Sàng A</p>
                        </div>
                        <div className="text-[10px] font-bold text-slate-500 text-right uppercase leading-tight">
                            <p>Ngày chụp</p>
                            <p className="text-slate-300">{request.requestDate}</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={`p-2 rounded-lg transition-colors ${isSidebarOpen ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-slate-400'}`}
                        title="Bật/Tắt trình soạn thảo"
                    >
                        <DocumentTextIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>

            {/* 2. Main Workspace */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* Left: DICOM Viewer (Workstation Area) */}
                <div className="flex-1 bg-black relative flex flex-col overflow-hidden border-r border-slate-800">
                    <MockDicomViewer 
                        imageUrl={request.imageUrl || ''} 
                        patientName={request.patientName}
                        patientId={request.patientId}
                        modality={request.modality}
                        accessionNumber={request.id}
                    />
                </div>

                {/* Right: Reporting Panel (RIS Area) */}
                <div className={`${isSidebarOpen ? 'w-[480px]' : 'w-0'} bg-[#f8fafc] dark:bg-slate-900 border-l border-slate-700 flex flex-col transition-all duration-300 overflow-hidden shadow-2xl shrink-0`}>
                    
                    {/* Panel Toolbar */}
                    <div className="p-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0">
                         <h3 className="font-black text-slate-800 dark:text-white uppercase text-xs flex items-center gap-2">
                            <DocumentTextIcon className="w-5 h-5 text-blue-600"/> Soạn thảo kết quả
                        </h3>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setIsDictating(!isDictating)}
                                className={`p-2 rounded-full transition-all ${isDictating ? 'bg-red-500 text-white animate-pulse shadow-lg' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-blue-600'}`}
                                title="Nhận diện giọng nói (AI Dictation)"
                            >
                                <MicrophoneIcon className="w-5 h-5"/>
                            </button>
                            <button className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-500 hover:text-purple-600 transition-colors" title="Gợi ý AI (Gemini)">
                                <SparklesIcon className="w-5 h-5"/>
                            </button>
                        </div>
                    </div>

                    {/* Template & Editor Area */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                        {/* Mẫu kết quả */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Chọn mẫu báo cáo chuẩn</label>
                            <Combobox<ReportTemplate>
                                placeholder="Gõ tìm mẫu (VD: XQ Ngực...)"
                                options={mockTemplates.filter(t => t.modality === request.modality)}
                                onChange={(_, item) => item && applyTemplate(item)}
                                displayValue={t => t.name}
                                className="w-full"
                            />
                        </div>

                        {/* Editor Fields */}
                        <div className="space-y-4 font-serif">
                            <div>
                                <label className="block text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase mb-1">Kỹ thuật khảo sát</label>
                                <input 
                                    value={technique}
                                    onChange={e => setTechnique(e.target.value)}
                                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                                />
                            </div>
                            
                            <div className="flex-1 flex flex-col min-h-[300px]">
                                <label className="block text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase mb-1">Mô tả hình ảnh</label>
                                <textarea 
                                    value={findings}
                                    onChange={e => setFindings(e.target.value)}
                                    className="flex-1 w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none leading-relaxed shadow-inner"
                                    placeholder="Nhập mô tả tổn thương chi tiết..."
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-red-600 dark:text-red-400 uppercase mb-1">Kết luận chẩn đoán</label>
                                <textarea 
                                    value={conclusion}
                                    onChange={e => setConclusion(e.target.value)}
                                    className="w-full h-24 p-3 bg-red-50/30 dark:bg-red-900/10 border border-red-200 dark:border-red-900 rounded-xl text-base font-black text-red-700 dark:text-red-400 focus:ring-2 focus:ring-red-500 outline-none resize-none"
                                    placeholder="Kết luận..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex gap-3 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                         <button 
                            onClick={() => handleSave(false)}
                            className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-black text-[10px] uppercase hover:bg-slate-200 transition active:scale-95 shadow-sm"
                        >
                            <SaveIcon className="w-4 h-4 inline mr-2"/> Lưu nháp
                        </button>
                        <button 
                            onClick={() => handleSave(true)}
                            disabled={isLoading}
                            className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition transform active:scale-95 disabled:opacity-70"
                        >
                            {isLoading ? <RefreshIcon className="w-4 h-4 animate-spin"/> : <CheckBadgeIcon className="w-4 h-4"/>}
                            Duyệt & Ký số (F10)
                        </button>
                    </div>
                </div>
            </div>

            {/* Float Ticker Footer */}
            <div className="h-6 bg-slate-800 border-t border-slate-700 px-3 flex items-center justify-between text-[10px] text-slate-500 font-mono shrink-0">
                <div className="flex gap-4">
                    <span>HOST: PAC_SERVER_01</span>
                    <span className="text-green-500 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> CONNECTED</span>
                    <span>FPS: 60</span>
                </div>
                <div>CLINICMS PACS v4.2.0</div>
            </div>
        </div>
    );
};

export default ReadingView;
