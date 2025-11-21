
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockRequests, mockTemplates, ImagingRequest, ReportTemplate } from '../data';
import MockDicomViewer from './components/MockDicomViewer';
import Combobox from '../../../components/shared/Combobox';
import { useTheme } from '../../../contexts/ThemeContext';
import { 
    ChevronLeftIcon, 
    SaveIcon, 
    CheckBadgeIcon, 
    PrinterIcon,
    DocumentTextIcon,
    UserGroupIcon,
    MicrophoneIcon,
    SparklesIcon,
    CheckIcon,
    ChevronRightIcon,
    ListBulletIcon,
    ShareIcon,
    ClockIcon,
    SearchIcon
} from '../../../components/Icons';

// Macro chips data
const commonMacros = [
    { label: "Bình thường", text: "Hình ảnh trong giới hạn bình thường." },
    { label: "Phổi sáng", text: "Nhu mô phổi sáng đều, không thấy đám mờ khu trú." },
    { label: "Tim không to", text: "Bóng tim không to, chỉ số tim/lồng ngực < 0.5." },
    { label: "Xương OK", text: "Khung xương thành ngực và phần mềm không thấy bất thường." },
    { label: "Không gãy", text: "Không thấy hình ảnh gãy xương hay trật khớp trên phim." },
];

const ReadingView: React.FC = () => {
    const { requestId } = useParams<{ requestId: string }>();
    const navigate = useNavigate();
    
    // --- State ---
    const [request, setRequest] = useState<ImagingRequest | null>(null);
    const [technique, setTechnique] = useState('');
    const [findings, setFindings] = useState('');
    const [conclusion, setConclusion] = useState('');
    
    // Layout State
    const [leftSidebarTab, setLeftSidebarTab] = useState<'worklist' | 'history'>('worklist');
    const [isLeftOpen, setIsLeftOpen] = useState(true);
    const [isRightOpen, setIsRightOpen] = useState(true);
    const [isDictating, setIsDictating] = useState(false);
    
    // Mock History Data
    const [patientHistory, setPatientHistory] = useState<ImagingRequest[]>([]);

    useEffect(() => {
        const found = mockRequests.find(r => r.id === requestId);
        if (found) {
            setRequest(found);
            // Parse existing report if any
            if (found.report) {
                // Simple heuristic parsing
                const parts = found.report.split('\n\n');
                if (parts.length > 0 && found.report.includes('KỸ THUẬT:')) {
                     const techMatch = found.report.match(/KỸ THUẬT:(.*?)(?=MÔ TẢ|KẾT LUẬN|$)/s);
                     const findMatch = found.report.match(/MÔ TẢ.*?:(.*?)(?=KẾT LUẬN|$)/s);
                     const concMatch = found.report.match(/KẾT LUẬN:(.*)/s);
                     
                     if (techMatch) setTechnique(techMatch[1].trim());
                     if (findMatch) setFindings(findMatch[1].trim());
                     if (concMatch) setConclusion(concMatch[1].trim());
                } else {
                    setFindings(found.report);
                }
            }
            
            setPatientHistory(mockRequests.filter(r => r.patientId === found.patientId && r.id !== found.id));
        } else if (mockRequests.length > 0 && !requestId) {
            const firstReady = mockRequests.find(r => r.status === 'Acquired') || mockRequests[0];
            navigate(`/imaging-results/reading/${firstReady.id}`);
        }
    }, [requestId, navigate]);

    // --- Handlers ---

    const handleTemplateChange = (val: string, item?: ReportTemplate) => {
        if (item) {
            const content = item.content;
            const techMatch = content.match(/KỸ THUẬT:(.*?)(?=MÔ TẢ|KẾT LUẬN|$)/s);
            const findMatch = content.match(/MÔ TẢ.*?:(.*?)(?=KẾT LUẬN|$)/s);
            const concMatch = content.match(/KẾT LUẬN:(.*)/s);

            if (techMatch) setTechnique(techMatch[1].trim());
            if (findMatch) setFindings(findMatch[1].trim());
            else setFindings(content);
            if (concMatch) setConclusion(concMatch[1].trim());
        }
    };

    const handleMacroClick = (text: string) => {
        setFindings(prev => prev ? `${prev}\n- ${text}` : `- ${text}`);
    };

    const toggleDictation = () => {
        setIsDictating(!isDictating);
        // Mock stopping automatically
        if (!isDictating) {
            setTimeout(() => setIsDictating(false), 3000);
        }
    };

    const handleSave = () => {
        if (request) {
            const fullReport = `KỸ THUẬT: ${technique}\n\nMÔ TẢ HÌNH ẢNH:\n${findings}\n\nKẾT LUẬN:\n${conclusion}`;
            // In real app, call API
            setRequest({ ...request, status: 'Reported', report: fullReport });
        }
    };

    const handleApprove = () => {
        if (request) {
            if(window.confirm('Xác nhận duyệt kết quả này?')) {
                const fullReport = `KỸ THUẬT: ${technique}\n\nMÔ TẢ HÌNH ẢNH:\n${findings}\n\nKẾT LUẬN:\n${conclusion}`;
                setRequest({ ...request, status: 'Approved', report: fullReport });
            }
        }
    };

    const filteredTemplates = request ? mockTemplates.filter(t => t.modality === request.modality) : [];

    if (!request) return <div className="h-screen bg-black text-white flex items-center justify-center">Loading PACS...</div>;

    return (
        <div className="flex flex-col h-screen bg-[#0f0f0f] text-slate-300 overflow-hidden fixed inset-0 z-[100]">
            
            {/* --- 1. Header --- */}
            <div className="flex items-center justify-between px-4 py-1.5 bg-[#141414] border-b border-[#333] h-12 shrink-0 z-20">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/imaging-results/worklist')} className="p-1.5 hover:bg-[#333] rounded text-slate-400 hover:text-white transition flex items-center gap-1 text-sm font-bold">
                        <ChevronLeftIcon className="w-5 h-5"/> Back
                    </button>
                    <div className="h-6 w-px bg-[#333]"></div>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-blue-900/30 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-800">
                            {request.modality}
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-sm font-bold text-white flex items-center gap-2">
                                {request.patientName} 
                                <span className="text-[10px] font-normal text-slate-400">{request.gender}, {request.age}Y</span>
                            </h1>
                            <p className="text-[10px] text-slate-500 font-mono">{request.id}</p>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsLeftOpen(!isLeftOpen)}
                        className={`p-1.5 rounded ${isLeftOpen ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-[#333]'}`}
                        title="Toggle Worklist"
                    >
                        <ListBulletIcon className="w-5 h-5"/>
                    </button>
                    <button 
                        onClick={() => setIsRightOpen(!isRightOpen)}
                        className={`p-1.5 rounded ${isRightOpen ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-[#333]'}`}
                        title="Toggle Report"
                    >
                        <DocumentTextIcon className="w-5 h-5"/>
                    </button>
                    <div className="h-6 w-px bg-[#333] mx-1"></div>
                    <div className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase border ${request.status === 'Approved' ? 'bg-green-900/20 text-green-500 border-green-900' : 'bg-yellow-900/20 text-yellow-500 border-yellow-900'}`}>
                        {request.status === 'Approved' ? 'Verified' : 'Reading'}
                    </div>
                </div>
            </div>

            {/* --- 2. Main Workspace --- */}
            <div className="flex-1 flex overflow-hidden relative">
                
                {/* Left Sidebar: Worklist & History */}
                <div className={`
                    ${isLeftOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full'} 
                    transition-all duration-300 ease-in-out flex flex-col border-r border-[#333] bg-[#111] shrink-0 overflow-hidden
                `}>
                    <div className="flex border-b border-[#333]">
                        <button 
                            onClick={() => setLeftSidebarTab('worklist')}
                            className={`flex-1 py-3 text-xs font-bold uppercase transition-colors ${leftSidebarTab === 'worklist' ? 'bg-[#1a1a1a] text-blue-400 border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <UserGroupIcon className="w-4 h-4 mx-auto mb-1"/> Worklist
                        </button>
                        <button 
                            onClick={() => setLeftSidebarTab('history')}
                            className={`flex-1 py-3 text-xs font-bold uppercase transition-colors ${leftSidebarTab === 'history' ? 'bg-[#1a1a1a] text-blue-400 border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <ClockIcon className="w-4 h-4 mx-auto mb-1"/> History
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
                        {leftSidebarTab === 'worklist' ? (
                            <div>
                                <div className="p-2 bg-[#1a1a1a] border-b border-[#333] sticky top-0 z-10">
                                    <div className="relative">
                                        <SearchIcon className="absolute left-2 top-2 w-3 h-3 text-slate-500"/>
                                        <input type="text" placeholder="Filter..." className="w-full bg-[#0f0f0f] border border-[#333] rounded py-1 pl-7 text-xs text-slate-300 focus:border-blue-500 outline-none"/>
                                    </div>
                                </div>
                                {mockRequests.map(r => (
                                    <div key={r.id} onClick={() => navigate(`/imaging-results/reading/${r.id}`)} className={`p-3 cursor-pointer border-b border-[#222] hover:bg-[#1f1f1f] transition-colors ${r.id === request.id ? 'bg-[#1f1f1f] border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}>
                                        <div className="flex justify-between text-sm font-bold text-slate-200 mb-1">
                                            <span className="truncate">{r.patientName}</span>
                                            {r.priority === 'Urgent' && <span className="text-red-500 text-[10px] border border-red-900 bg-red-900/20 px-1 rounded">URG</span>}
                                        </div>
                                        <div className="text-xs text-slate-500 flex justify-between items-center">
                                            <span>{r.modality}</span>
                                            <span className={`${r.status === 'Approved' ? 'text-green-600' : 'text-blue-500'}`}>{r.status}</span>
                                        </div>
                                        <div className="text-[10px] text-slate-600 mt-1 truncate">{r.serviceName}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-2 space-y-2">
                                {patientHistory.length > 0 ? patientHistory.map(h => (
                                    <div key={h.id} className="p-3 rounded bg-[#1a1a1a] hover:bg-[#222] cursor-pointer border border-[#333] transition-colors group">
                                        <div className="flex justify-between items-start">
                                            <div className="text-xs font-bold text-slate-300">{h.serviceName}</div>
                                            <ShareIcon className="w-3 h-3 text-slate-600 group-hover:text-blue-500"/>
                                        </div>
                                        <div className="text-[10px] text-slate-500 mt-2 flex justify-between">
                                            <span>{h.requestDate.split(' ')[0]}</span>
                                            <span className="text-green-600 flex items-center gap-1"><CheckIcon className="w-3 h-3"/> {h.status}</span>
                                        </div>
                                    </div>
                                )) : <div className="text-center text-xs text-slate-600 p-4 italic">No prior exams found.</div>}
                            </div>
                        )}
                    </div>
                </div>

                {/* Center: Image Viewer */}
                <div className="flex-1 bg-black relative flex flex-col overflow-hidden">
                    {request.imageUrl ? (
                        <MockDicomViewer 
                            imageUrl={request.imageUrl} 
                            patientName={request.patientName}
                            modality={request.modality}
                            patientId={request.patientId}
                            accessionNumber={request.id}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-600">
                            <div className="text-center">
                                <p className="text-2xl font-bold mb-2 opacity-30">NO IMAGE</p>
                                <p className="text-sm opacity-20">Waiting for acquisition...</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Reporting Panel */}
                <div className={`
                    ${isRightOpen ? 'w-[420px] translate-x-0' : 'w-0 translate-x-full'} 
                    transition-all duration-300 ease-in-out bg-[#f8fafc] text-slate-800 flex flex-col border-l border-[#333] shrink-0 shadow-2xl
                `}>
                    {/* Reporting Header */}
                    <div className="px-4 py-3 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm shrink-0">
                        <h2 className="font-bold text-slate-700 flex items-center gap-2">
                            <DocumentTextIcon className="w-5 h-5 text-blue-600"/> 
                            Report Editor
                        </h2>
                        <div className="flex gap-2">
                            <button 
                                onClick={toggleDictation}
                                className={`p-2 rounded-full transition-all ${isDictating ? 'bg-red-100 text-red-600 animate-pulse ring-2 ring-red-200' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`} 
                                title="Voice Dictation"
                            >
                                <MicrophoneIcon className="w-5 h-5"/>
                            </button>
                            <button className="p-2 text-slate-400 hover:text-purple-600 rounded-full hover:bg-purple-50" title="AI Suggestion">
                                <SparklesIcon className="w-5 h-5"/>
                            </button>
                        </div>
                    </div>

                    {/* Template Selector */}
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 shrink-0">
                        <Combobox<ReportTemplate>
                            options={filteredTemplates}
                            displayValue={item => item.name}
                            onChange={handleTemplateChange}
                            placeholder="Apply Template..."
                            className="w-full text-sm"
                        />
                        {/* Quick Macros */}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {commonMacros.map((m, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => handleMacroClick(m.text)}
                                    className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-medium text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Report Fields */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-white">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">Kỹ thuật</label>
                            <input 
                                type="text"
                                value={technique}
                                onChange={e => setTechnique(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
                                placeholder="..."
                            />
                        </div>
                        <div className="flex-1 flex flex-col">
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">Mô tả hình ảnh</label>
                            <textarea 
                                value={findings}
                                onChange={e => setFindings(e.target.value)}
                                className="w-full min-h-[250px] p-3 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none resize-y leading-relaxed"
                                placeholder="Mô tả chi tiết..."
                            ></textarea>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">Kết luận</label>
                            <textarea 
                                value={conclusion}
                                onChange={e => setConclusion(e.target.value)}
                                className="w-full h-24 p-3 bg-blue-50 border border-blue-200 rounded text-sm font-bold text-blue-900 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all outline-none resize-none"
                                placeholder="Kết luận chẩn đoán..."
                            ></textarea>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center gap-3 shrink-0">
                        <button onClick={handleSave} className="flex-1 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition shadow-sm">
                            <SaveIcon className="w-4 h-4"/> Save Draft
                        </button>
                        <button 
                            onClick={handleApprove} 
                            disabled={request.status === 'Approved'}
                            className={`flex-1 py-2.5 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95 ${request.status === 'Approved' ? 'bg-green-600 cursor-not-allowed opacity-80' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {request.status === 'Approved' ? (
                                <><CheckBadgeIcon className="w-4 h-4"/> Verified</>
                            ) : (
                                <><CheckBadgeIcon className="w-4 h-4"/> Sign Report</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReadingView;
