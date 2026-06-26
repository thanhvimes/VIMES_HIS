import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockRequests, mockTemplates, ImagingRequest, ReportTemplate } from '../data';
import CornerstoneViewer from './components/CornerstoneViewer';
import Combobox from '../../../components/ui/Combobox';
import { useTheme } from '../../../contexts/ThemeContext';
import { useSession } from '../../../contexts/SessionContext';
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
    const { user } = useSession();
    const doctorId = user?.userId || 'BS001';

    // Data State
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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDictating, setIsDictating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

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

    // Fetch details & templates
    const loadData = () => {
        if (!requestId) return;

        // Load requests from localStorage
        const localReqs = localStorage.getItem('vclinic_pacs_requests_new');
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
            const localCustomTemplates = localStorage.getItem('vclinic_pacs_custom_templates_new');
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

    // Save report draft or approve & sign
    const handleSave = (isFinal: boolean) => {
        if (!request) return;
        setIsLoading(true);
        try {
            const imageUrlsStr = keyImages.join(',');

            // Update request in localStorage
            const localReqs = localStorage.getItem('vclinic_pacs_requests_new');
            let parsedReqs: ImagingRequest[] = [];
            if (localReqs) {
                try { parsedReqs = JSON.parse(localReqs); } catch (e) {}
            }

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
                    } as ImagingRequest;
                }
                return r;
            });

            localStorage.setItem('vclinic_pacs_requests_new', JSON.stringify(updatedReqs));
            
            // Trigger backend SSE updates if integrated (via fetch API to pacs backend controller if available)
            fetch('/api/imaging/results', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: request.id.replace(/\D/g, '') || '101',
                    itemId: 1001,
                    docNo: 'DOC101',
                    technique,
                    findings,
                    conclusion,
                    imageUrl: imageUrlsStr,
                    isFinal
                })
            }).catch(err => console.warn('Could not post directly to HIS server, fell back to local mode.', err));

            alert(isFinal ? 'Đã duyệt & ký số thành công!' : 'Đã lưu nháp kết quả chẩn đoán.');
            navigate('/pacs-ris/worklist');
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    // Save report custom template
    const handleSaveAsTemplate = () => {
        if (!newTplName || !request) return;
        try {
            const localCustomTemplates = localStorage.getItem('vclinic_pacs_custom_templates_new');
            let customTemplatesList: any[] = [];
            if (localCustomTemplates) {
                try { customTemplatesList = JSON.parse(localCustomTemplates); } catch(e) {}
            }

            const newTpl: ReportTemplate = {
                id: `TPL-CST-${Date.now()}`,
                name: newTplName,
                modality: request.modality,
                content: `KỸ THUẬT: ${technique}\n\nMÔ TẢ HÌNH ẢNH:\n${findings}\n\nKẾT LUẬN: ${conclusion}`
            };

            const updated = [...customTemplatesList, newTpl];
            localStorage.setItem('vclinic_pacs_custom_templates_new', JSON.stringify(updated));
            setIsSaveTplOpen(false);
            setNewTplName('');
            loadData(); // Reload templates list
            alert('Đã lưu mẫu chẩn đoán cá nhân thành công!');
        } catch (e) {
            console.error(e);
        }
    };

    // Simulate AI voice report dictation
    const handleVoiceDictation = () => {
        if (isDictating) {
            setIsDictating(false);
            return;
        }
        setIsDictating(true);
        let currentFindings = findings;
        const speechPhrases = [
            "Hình ảnh phổi sáng đều hai bên.",
            " Không phát hiện bóng tim to.",
            " Góc sườn hoành nhọn tự do."
        ];
        
        let counter = 0;
        const interval = setInterval(() => {
            if (counter < speechPhrases.length) {
                currentFindings += speechPhrases[counter];
                setFindings(currentFindings);
                counter++;
            } else {
                clearInterval(interval);
                setIsDictating(false);
            }
        }, 1200);
    };

    // Send Remote Tele consultation
    const handleSendTeleRequest = () => {
        setIsTeleSent(true);
        setTimeout(() => {
            setIsTeleOpen(false);
            setIsTeleSent(false);
            alert(`Đã gửi yêu cầu hội chẩn ca bệnh ${request?.patientName} tới BS. ${teleDoctor}`);
        }, 1500);
    };

    if (!request) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <DocumentTextIcon className="w-12 h-12 text-slate-300 mb-2"/>
                <p className="font-bold">Vui lòng chọn một ca từ Worklist để đọc kết quả</p>
                <button onClick={() => navigate('/pacs-ris/worklist')} className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer">
                    Trở lại danh sách chờ
                </button>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-130px)] flex flex-col space-y-3 relative overflow-hidden">
            {/* Header section */}
            <div className="flex justify-between items-center bg-surface dark:bg-dark-surface px-4 py-2.5 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-800 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/pacs-ris/worklist')}
                        className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer"
                    >
                        <ChevronLeftIcon className="w-5 h-5"/>
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-base font-black text-slate-800 dark:text-white leading-tight">
                                Trạm đọc Kết quả & Phê duyệt (RIS/PACS)
                            </h1>
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                                {request.id}
                            </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                            Bệnh nhân: <span className="font-bold text-slate-700 dark:text-slate-300">{request.patientName}</span> ({request.gender}, {request.age} tuổi) • Mã BN: {request.patientId}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setIsTeleOpen(true)}
                        className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                        <SparklesIcon className="w-3.5 h-3.5 text-amber-500"/>
                        Hội chẩn từ xa
                    </button>
                    <button 
                        onClick={() => handleSave(false)}
                        disabled={isLoading}
                        className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                        <SaveIcon className="w-3.5 h-3.5 text-slate-400"/>
                        Lưu nháp
                    </button>
                    <button 
                        onClick={() => handleSave(true)}
                        disabled={isLoading}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/20 cursor-pointer"
                    >
                        <CheckBadgeIcon className="w-3.5 h-3.5"/>
                        Duyệt & Ký số
                    </button>
                </div>
            </div>

            {/* Main Workstation 3-pane Layout */}
            <div className="flex-1 flex gap-3 overflow-hidden relative">
                
                {/* 1. Left Sidebar: RIS History & Historical compare */}
                {isSidebarOpen && (
                    <div className="w-56 bg-surface dark:bg-dark-surface rounded-2xl shadow border border-slate-200/50 dark:border-slate-800 p-3.5 flex flex-col space-y-4 overflow-y-auto shrink-0 animate-slide-in-left">
                        <div>
                            <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">Lịch sử ca chụp (RIS History)</h3>
                            <div className="space-y-2">
                                <div className="p-2.5 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/30 transition cursor-pointer text-left">
                                    <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 font-mono">2025-10-12</div>
                                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate mt-0.5">Siêu âm ổ bụng tổng quát</div>
                                    <div className="text-[9px] text-slate-400 mt-1 font-medium">Kết quả: Bình thường</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Toggle sidebar button */}
                <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3 z-30 p-1 bg-surface dark:bg-dark-surface border border-slate-200 dark:border-slate-800 rounded-full shadow hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition"
                >
                    <ChevronLeftIcon className={`w-4 h-4 transform transition-transform ${isSidebarOpen ? '' : 'rotate-180'}`}/>
                </button>

                {/* 2. Center Viewport: CornerstoneViewer */}
                <div className="flex-1 h-full min-w-0">
                    <CornerstoneViewer 
                        imageUrl={request.imageUrl || ''} 
                        patientName={request.patientName} 
                        modality={request.modality}
                        patientId={request.patientId}
                        studyUid={request.studyUid}
                        onKeyImagesChange={setKeyImages}
                    />
                </div>

                {/* 3. Right Sidebar: RIS Diagnosis report Form */}
                <div className="w-96 bg-surface dark:bg-dark-surface rounded-2xl shadow border border-slate-200/50 dark:border-slate-800 p-4 flex flex-col space-y-4 overflow-y-auto shrink-0">
                    {/* Template selection */}
                    <div>
                        <label className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Chọn mẫu kết quả</label>
                        <Combobox
                            options={templates.map(t => ({ value: t.id, label: t.name }))}
                            value={''}
                            onChange={(val) => {
                                const tpl = templates.find(t => t.id === val);
                                if (tpl) applyTemplate(tpl);
                            }}
                            placeholder="Chọn mẫu nhanh..."
                            className="text-xs"
                        />
                    </div>

                    {/* Report Form fields */}
                    <div className="flex-1 flex flex-col space-y-3.5">
                        <div>
                            <label className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Kỹ thuật khảo sát</label>
                            <textarea
                                value={technique}
                                onChange={(e) => setTechnique(e.target.value)}
                                className={`w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800 focus:ring-1 focus:ring-indigo-500 text-xs font-semibold ${fontSettings.controls}`}
                                rows={2}
                                placeholder="Mô tả kỹ thuật..."
                            />
                        </div>

                        <div className="flex-grow flex flex-col">
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Mô tả hình ảnh</label>
                                <div className="flex items-center gap-1">
                                    <button 
                                        onClick={handleVoiceDictation}
                                        className={`p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1 text-[10px] font-bold transition-colors cursor-pointer ${isDictating ? 'text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-900/10' : ''}`}
                                        title="Nhập kết quả bằng giọng nói (AI)"
                                    >
                                        <MicrophoneIcon className={`w-3.5 h-3.5 ${isDictating ? 'animate-bounce' : ''}`}/>
                                        {isDictating ? 'Đang nghe...' : 'Nói'}
                                    </button>
                                </div>
                            </div>
                            <textarea
                                value={findings}
                                onChange={(e) => setFindings(e.target.value)}
                                className={`w-full flex-grow p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800 focus:ring-1 focus:ring-indigo-500 text-xs font-medium leading-relaxed ${fontSettings.controls}`}
                                placeholder="Ghi nhận chi tiết tổn thương chẩn đoán hình ảnh..."
                                style={{ minHeight: '140px' }}
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Kết luận chẩn đoán</label>
                            <textarea
                                value={conclusion}
                                onChange={(e) => setConclusion(e.target.value)}
                                className={`w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800 focus:ring-1 focus:ring-indigo-500 text-xs font-bold ${fontSettings.controls}`}
                                rows={2}
                                placeholder="Chẩn đoán xác định..."
                            />
                        </div>
                    </div>

                    {/* Lower buttons: Save custom templates */}
                    <div className="pt-2 flex justify-between items-center gap-2 border-t border-slate-100 dark:border-slate-800">
                        {isSaveTplOpen ? (
                            <div className="flex items-center gap-1.5 w-full">
                                <input 
                                    type="text" 
                                    placeholder="Tên mẫu mới..." 
                                    value={newTplName}
                                    onChange={(e) => setNewTplName(e.target.value)}
                                    className="p-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg flex-1 focus:ring-1 focus:ring-indigo-500"
                                />
                                <button 
                                    onClick={handleSaveAsTemplate}
                                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black shadow cursor-pointer"
                                >
                                    Lưu
                                </button>
                                <button 
                                    onClick={() => setIsSaveTplOpen(false)}
                                    className="px-2 py-1.5 text-slate-400 hover:text-slate-500 text-[10px] font-bold cursor-pointer"
                                >
                                    Hủy
                                </button>
                            </div>
                        ) : (
                            <button 
                                onClick={() => setIsSaveTplOpen(true)}
                                className="px-3 py-1.5 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-600 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                            >
                                <PlusIcon className="w-3 h-3"/>
                                Tạo mẫu chẩn đoán cá nhân
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Remote consultation PACS Tele modal overlay */}
            {isTeleOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center animate-fade-in">
                    <div className="bg-surface dark:bg-dark-surface p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full mx-4 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                                <SparklesIcon className="w-5 h-5 text-amber-500"/>
                                Gửi yêu cầu Hội chẩn Tuyến trên
                            </h3>
                            <button 
                                onClick={() => setIsTeleOpen(false)}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-500 rounded-lg transition"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Bác sĩ tuyến trên tiếp nhận</label>
                                <select 
                                    value={teleDoctor}
                                    onChange={(e) => setTeleDoctor(e.target.value)}
                                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-850 text-xs font-bold text-slate-700 dark:text-slate-300"
                                >
                                    <option value="">Chọn bác sĩ hội chẩn...</option>
                                    <option value="Trần Quốc Khánh">GS. TS. Trần Quốc Khánh (BV Bạch Mai)</option>
                                    <option value="Nguyễn Văn Hùng">PGS. TS. Nguyễn Văn Hùng (BV Việt Đức)</option>
                                    <option value="Lê Thị Bình">BSCKII. Lê Thị Bình (BV Trung ương Quân đội 108)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Tóm tắt bệnh án lâm sàng & Lý do chỉ định</label>
                                <textarea
                                    value={teleSummary}
                                    onChange={(e) => setTeleSummary(e.target.value)}
                                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-850 text-xs font-medium"
                                    rows={3}
                                    placeholder="Triệu chứng lâm sàng, kết quả xét nghiệm liên quan, chẩn đoán sơ bộ..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Ý kiến tham vấn cần tập trung (nếu có)</label>
                                <textarea
                                    value={teleOpinion}
                                    onChange={(e) => setTeleOpinion(e.target.value)}
                                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-850 text-xs font-medium"
                                    rows={2}
                                    placeholder="Vấn đề khó cần tuyến trên tham vấn..."
                                />
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end gap-2.5">
                            <button 
                                onClick={() => setIsTeleOpen(false)}
                                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 text-slate-600 font-bold text-xs cursor-pointer"
                            >
                                Hủy bỏ
                            </button>
                            <button 
                                onClick={handleSendTeleRequest}
                                disabled={!teleDoctor || isTeleSent}
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none text-slate-900 rounded-xl font-bold text-xs shadow-md shadow-amber-500/10 cursor-pointer"
                            >
                                {isTeleSent ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu Hội chẩn'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReadingView;
