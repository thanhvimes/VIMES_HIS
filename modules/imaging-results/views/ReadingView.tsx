import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockRequests, mockTemplates, ImagingRequest, ReportTemplate } from '../data';
import MockDicomViewer from './components/MockDicomViewer';
import Combobox from '../../../components/ui/Combobox';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import {
    ChevronLeftIcon, SaveIcon, CheckBadgeIcon,
    DocumentTextIcon, MicrophoneIcon, SparklesIcon,
    RefreshIcon, PlusIcon
} from '../../../components/Icons';

const EyeIcon = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const ReadingView: React.FC = () => {
    const { requestId } = useParams<{ requestId: string }>();
    const navigate = useNavigate();
    const { fontSettings } = useTheme();
    const { user } = useAuth();
    const doctorId = user?.userId || 'BS001';

    // --- Data State ---
    const [request, setRequest] = useState<ImagingRequest | null>(null);
    const [technique, setTechnique] = useState('');
    const [findings, setFindings] = useState('');
    const [conclusion, setConclusion] = useState('');
    const [keyImages, setKeyImages] = useState<string[]>([]);

    // Templates State
    const [templates, setTemplates] = useState<ReportTemplate[]>([]);
    const [isSaveTplOpen, setIsSaveTplOpen] = useState(false);
    const [newTplName, setNewTplName] = useState('');

    // Remote Consultation (PACS Tele) State
    const [isTeleOpen, setIsTeleOpen] = useState(false);
    const [teleDoctor, setTeleDoctor] = useState('');
    const [teleSummary, setTeleSummary] = useState('');
    const [teleOpinion, setTeleOpinion] = useState('');
    const [isTeleSent, setIsTeleSent] = useState(false);

    // UI Logic
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isDictating, setIsDictating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch details & templates
    const loadData = () => {
        if (!requestId) return;

        // Load requests from localStorage
        const localReqs = localStorage.getItem('vclinic_pacs_requests');
        let parsedReqs: ImagingRequest[] = [];
        if (localReqs) {
            try { parsedReqs = JSON.parse(localReqs); } catch (e) {}
        }
        
        const found = parsedReqs.find(r => r.id === requestId) || mockRequests.find(r => r.id === requestId);
        if (found) {
            setRequest(found);
            if (found.report) {
                // Parse existing report
                const techMatch = found.report.match(/KỸ THUẬT:(.*?)(?=MÔ TẢ|KẾT LUẬN|$)/s);
                const descMatch = found.report.match(/MÔ TẢ.*?:(.*?)(?=KẾT LUẬN|$)/s);
                const concMatch = found.report.match(/KẾT LUẬN:(.*)/s);
                if (techMatch) setTechnique(techMatch[1].trim());
                if (descMatch) setFindings(descMatch[1].trim());
                if (concMatch) setConclusion(concMatch[1].trim());
            } else {
                // Apply first matching template
                const defaultTpl = mockTemplates.find(t => t.modality === found.modality);
                if (defaultTpl) applyTemplate(defaultTpl);
            }

            // Load Templates (Standard + Custom) from localStorage
            const localCustomTemplates = localStorage.getItem('vclinic_pacs_custom_templates');
            let customTemplatesList: any[] = [];
            if (localCustomTemplates) {
                try { customTemplatesList = JSON.parse(localCustomTemplates); } catch(e) {}
            }

            const standardMapped = mockTemplates
                .filter(t => t.modality === found.modality)
                .map(t => ({ ...t, name: `[Chung] ${t.name}` }));

            const customMapped = customTemplatesList
                .filter(t => t.modality === found.modality)
                .map(t => ({
                    id: t.id,
                    name: `[Cá nhân] ${t.name}`,
                    modality: t.modality,
                    content: t.content
                }));

            setTemplates([...standardMapped, ...customMapped]);
        }
    };

    useEffect(() => {
        loadData();
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

    // Save report draft or approve & sign
    const handleSave = (isFinal: boolean) => {
        if (!request) return;
        setIsLoading(true);
        try {
            // Serialize Key images URLs
            const imageUrlsStr = keyImages.join(',');

            // Update request in localStorage
            const localReqs = localStorage.getItem('vclinic_pacs_requests');
            let parsedReqs: ImagingRequest[] = [];
            if (localReqs) {
                try { parsedReqs = JSON.parse(localReqs); } catch (e) {}
            }

            // If empty, initialize from mockRequests
            if (parsedReqs.length === 0) {
                parsedReqs = mockRequests;
            }

            const updatedReqs = parsedReqs.map(r => {
                if (r.id === request.id) {
                    return {
                        ...r,
                        status: isFinal ? 'Approved' : 'Processing',
                        imageUrl: imageUrlsStr || r.imageUrl || '',
                        report: `KỸ THUẬT: ${technique}\n\nMÔ TẢ HÌNH ẢNH:\n${findings}\n\nKẾT LUẬN: ${conclusion}`
                    };
                }
                return r;
            });

            localStorage.setItem('vclinic_pacs_requests', JSON.stringify(updatedReqs));

            alert(isFinal ? "Đã duyệt và ký số kết quả thành công!" : "Đã lưu bản nháp.");
            if (isFinal) {
                navigate('/imaging-results/worklist');
            }
        } catch (error) {
            console.error("Error saving result:", error);
            alert("Không thể lưu kết quả.");
        } finally {
            setIsLoading(false);
        }
    };

    // Save Custom template to localStorage
    const handleSaveCustomTemplate = () => {
        if (!request || !newTplName || !findings) {
            alert('Vui lòng điền tên mẫu và mô tả hình ảnh.');
            return;
        }
        try {
            const fullContent = `KỸ THUẬT: ${technique}\n\nMÔ TẢ HÌNH ẢNH:\n${findings}\n\nKẾT LUẬN: ${conclusion}`;
            
            const localCustomTemplates = localStorage.getItem('vclinic_pacs_custom_templates');
            let customTemplatesList: any[] = [];
            if (localCustomTemplates) {
                try { customTemplatesList = JSON.parse(localCustomTemplates); } catch(e) {}
            }
            
            const newTpl = {
                id: `custom-${Date.now()}`,
                name: newTplName,
                modality: request.modality,
                content: fullContent
            };
            
            const updatedTpls = [...customTemplatesList, newTpl];
            localStorage.setItem('vclinic_pacs_custom_templates', JSON.stringify(updatedTpls));
            
            alert('Đã lưu mẫu báo cáo cá nhân thành công!');
            setIsSaveTplOpen(false);
            setNewTplName('');
            
            // Reload templates list
            const standardMapped = mockTemplates
                .filter(t => t.modality === request.modality)
                .map(t => ({ ...t, name: `[Chung] ${t.name}` }));

            const customMapped = updatedTpls
                .filter(t => t.modality === request.modality)
                .map(t => ({
                    id: t.id,
                    name: `[Cá nhân] ${t.name}`,
                    modality: t.modality,
                    content: t.content
                }));

            setTemplates([...standardMapped, ...customMapped]);
        } catch (error) {
            console.error("Error saving template:", error);
            alert("Không thể lưu mẫu.");
        }
    };

    // Send remote consultation
    const handleSendTeleRequest = () => {
        if (!teleDoctor) {
            alert('Vui lòng chọn bác sĩ tuyến trên để hội chẩn.');
            return;
        }
        setIsTeleSent(true);
        alert(`Đã gửi yêu cầu hội chẩn ca bệnh thành công đến ${teleDoctor}!`);
        // Simulate remote doctor feedback after 3 seconds
        setTimeout(() => {
            setTeleOpinion(`[Ý kiến BS. Tuyến Trên]: Phù hợp với chẩn đoán viêm/tổn thương khu trú. Kiến nghị theo dõi thêm chụp MRI nếu lâm sàng không thuyên giảm.`);
        }, 3000);
    };

    if (!request) return <div className="h-screen bg-black text-white flex items-center justify-center font-black">NATIVE PACS BOOTING...</div>;

    return (
        <div className="fixed inset-0 z-[100] bg-black text-slate-300 flex flex-col font-sans overflow-hidden">

            {/* Header */}
            <div className="h-12 bg-slate-900 border-b border-slate-700 flex justify-between items-center px-4 shrink-0 shadow-2xl z-50">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/imaging-results/worklist')} className="p-1.5 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-3 border-l border-slate-700 pl-4">
                        <div className="w-8 h-8 rounded bg-purple-900/30 text-purple-400 flex items-center justify-center font-black text-xs border border-purple-800/50 uppercase">
                            {request.modality}
                        </div>
                        <div>
                            <h1 className="text-sm font-black text-white uppercase tracking-tight leading-none">
                                {request.patientName}
                                <span className="ml-2 text-[10px] text-slate-500 font-normal">({request.gender}, {request.age}T)</span>
                            </h1>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Mã BN: {request.patientId} • ACC: {request.id}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden lg:flex items-center gap-4 mr-6">
                        <div className="text-[10px] font-bold text-slate-500 text-right uppercase leading-tight">
                            <p>Chỉ định khảo sát</p>
                            <p className="text-slate-300">{request.serviceName}</p>
                        </div>
                        <div className="text-[10px] font-bold text-slate-500 text-right uppercase leading-tight">
                            <p>Ngày chỉ định</p>
                            <p className="text-slate-300">{request.requestDate}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={`p-2 rounded-lg transition-colors ${isSidebarOpen ? 'bg-purple-600 text-white' : 'hover:bg-slate-700 text-slate-400'}`}
                        title="Bật/Tắt trình soạn thảo RIS"
                    >
                        <DocumentTextIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Main Workspace */}
            <div className="flex-1 flex overflow-hidden">

                {/* Left: DICOM Viewer */}
                <div className="flex-1 bg-black relative flex flex-col overflow-hidden border-r border-slate-800">
                    <MockDicomViewer
                        imageUrl={request.imageUrl || 'https://prod-images-static.radiopaedia.org/images/31521/0a8d37d7996342775b761094577303_jumbo.jpeg'}
                        patientName={request.patientName}
                        patientId={request.patientId}
                        modality={request.modality}
                        accessionNumber={request.id}
                        onKeyImagesChange={setKeyImages}
                    />
                </div>

                {/* Right: Reporting Panel */}
                <div className={`${isSidebarOpen ? 'w-[480px]' : 'w-0'} bg-[#f8fafc] dark:bg-slate-900 border-l border-slate-700 flex flex-col transition-all duration-300 overflow-hidden shadow-2xl shrink-0`}>

                    {/* Panel Toolbar */}
                    <div className="p-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0">
                        <h3 className="font-black text-slate-800 dark:text-white uppercase text-xs flex items-center gap-2">
                            <DocumentTextIcon className="w-5 h-5 text-purple-600" /> Soạn kết quả chẩn đoán
                        </h3>
                        <div className="flex gap-1.5">
                            <button
                                onClick={() => setIsDictating(!isDictating)}
                                className={`p-2 rounded-full transition-all ${isDictating ? 'bg-red-500 text-white animate-pulse shadow-lg' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-red-600'}`}
                                title="Nhận diện giọng nói (AI Dictation)"
                            >
                                <MicrophoneIcon className="w-5 h-5" />
                            </button>
                            <button className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-500 hover:text-purple-600 transition-colors" title="Gợi ý AI (Gemini)">
                                <SparklesIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Editor & Templates Panel */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                        {/* Templates Selector */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Chọn mẫu báo cáo chẩn đoán</label>
                                <button
                                    onClick={() => setIsSaveTplOpen(true)}
                                    className="text-[10px] text-purple-600 hover:underline font-bold flex items-center gap-0.5"
                                >
                                    <PlusIcon className="w-3.5 h-3.5" /> Lưu mẫu hiện tại
                                </button>
                            </div>
                            <Combobox<ReportTemplate>
                                placeholder="Gõ tìm mẫu chuẩn hoặc mẫu cá nhân..."
                                options={templates}
                                onChange={(_, item) => item && applyTemplate(item)}
                                displayValue={t => t.name}
                                className="w-full"
                            />
                        </div>

                        {/* Inline Save Template Dialog */}
                        {isSaveTplOpen && (
                            <div className="p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 rounded-xl space-y-3 animate-fade-in">
                                <h4 className="text-xs font-black text-purple-800 dark:text-purple-400 uppercase">Lưu làm mẫu báo cáo cá nhân</h4>
                                <input
                                    type="text"
                                    placeholder="Nhập tên mẫu chẩn đoán..."
                                    value={newTplName}
                                    onChange={e => setNewTplName(e.target.value)}
                                    className="w-full p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                                <div className="flex gap-2 justify-end">
                                    <button onClick={() => setIsSaveTplOpen(false)} className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold">Hủy</button>
                                    <button onClick={handleSaveCustomTemplate} className="px-3 py-1 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700">Lưu mẫu</button>
                                </div>
                            </div>
                        )}

                        {/* Editor Fields */}
                        <div className="space-y-4 font-serif">
                            <div>
                                <label className="block text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase mb-1 font-sans">Kỹ thuật khảo sát</label>
                                <input
                                    value={technique}
                                    onChange={e => setTechnique(e.target.value)}
                                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none font-bold"
                                />
                            </div>

                            <div className="flex-1 flex flex-col min-h-[200px]">
                                <label className="block text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase mb-1 font-sans">Mô tả hình ảnh</label>
                                <textarea
                                    value={findings}
                                    onChange={e => setFindings(e.target.value)}
                                    className="flex-1 w-full h-48 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none resize-none leading-relaxed shadow-inner"
                                    placeholder="Nhập mô tả chi tiết hình ảnh phim chụp..."
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-red-600 dark:text-red-400 uppercase mb-1 font-sans">Kết luận chẩn đoán (Ghi vào EMR HIS)</label>
                                <textarea
                                    value={conclusion}
                                    onChange={e => setConclusion(e.target.value)}
                                    className="w-full h-20 p-3 bg-red-50/30 dark:bg-red-900/10 border border-red-200 dark:border-red-900 rounded-xl text-base font-black text-red-700 dark:text-red-400 focus:ring-2 focus:ring-red-500 outline-none resize-none"
                                    placeholder="Kết luận..."
                                />
                            </div>
                        </div>

                        {/* Remote Consultation Panel (PACS Tele) */}
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                            <button
                                onClick={() => setIsTeleOpen(!isTeleOpen)}
                                className="w-full flex justify-between items-center text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:text-purple-600 transition"
                            >
                                <span>✦ Hội chẩn từ xa (PACS Tele)</span>
                                <span>{isTeleOpen ? '▲' : '▼'}</span>
                            </button>

                            {isTeleOpen && (
                                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3 animate-fade-in text-xs font-sans">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Chọn bác sĩ hội chẩn tuyến trên</label>
                                        <select
                                            value={teleDoctor}
                                            onChange={e => setTeleDoctor(e.target.value)}
                                            className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-lg outline-none cursor-pointer"
                                        >
                                            <option value="">-- Chọn bác sĩ tư vấn --</option>
                                            <option value="BS. CKII Nguyễn Văn Tuyến (Bệnh viện Bạch Mai)">BS. CKII Nguyễn Văn Tuyến (BV Bạch Mai)</option>
                                            <option value="PGS. TS Trần Hồng Quang (Bệnh viện Hữu Nghị)">PGS. TS Trần Hồng Quang (BV Hữu Nghị)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Tóm tắt lâm sàng & Ghi chú</label>
                                        <textarea
                                            value={teleSummary}
                                            onChange={e => setTeleSummary(e.target.value)}
                                            className="w-full h-16 p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-lg outline-none resize-none"
                                            placeholder="Nhập triệu chứng, chẩn đoán sơ bộ..."
                                        />
                                    </div>
                                    <button
                                        onClick={handleSendTeleRequest}
                                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-center transition active:scale-95"
                                    >
                                        Gửi yêu cầu hội chẩn
                                    </button>

                                    {/* Remote response recommendation */}
                                    {isTeleSent && (
                                        <div className="p-2.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg mt-2">
                                            <h5 className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
                                                Trạng thái: {teleOpinion ? 'Đã nhận phản hồi' : 'Đang đợi ý kiến...'}
                                            </h5>
                                            {teleOpinion && (
                                                <p className="text-xs mt-1 text-slate-600 dark:text-slate-300 italic font-medium leading-relaxed">
                                                    {teleOpinion}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex gap-3 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                        <button
                            onClick={() => handleSave(false)}
                            className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-black text-[10px] uppercase hover:bg-slate-200 transition active:scale-95 shadow-sm"
                        >
                            <SaveIcon className="w-4 h-4 inline mr-2" /> Lưu nháp
                        </button>
                        <button
                            onClick={() => handleSave(true)}
                            disabled={isLoading}
                            className="flex-[2] py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 transition transform active:scale-95 disabled:opacity-70"
                        >
                            {isLoading ? <RefreshIcon className="w-4 h-4 animate-spin" /> : <CheckBadgeIcon className="w-4 h-4" />}
                            Duyệt & Ký số (F10)
                        </button>
                    </div>
                </div>
            </div>

            {/* Float Ticker Footer */}
            <div className="h-6 bg-slate-800 border-t border-slate-700 px-3 flex items-center justify-between text-[10px] text-slate-500 font-mono shrink-0">
                <div className="flex gap-4">
                    <span>HOST: NATIVE_PACS_SERVER_01</span>
                    <span className="text-green-500 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> CONNECTED</span>
                    <span>FPS: 60</span>
                </div>
                <div>vClinic Native PACS v1.0.0</div>
            </div>
        </div>
    );
};

export default ReadingView;
