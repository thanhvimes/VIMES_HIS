import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../../contexts/SessionContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { mockRequests, mockTemplates, ImagingRequest, ReportTemplate } from '../data';
import CornerstoneViewer from './components/CornerstoneViewer';

// Custom icons
const StarIcon = ({ className, fill = 'none' }: { className?: string, fill?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill={fill} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499c.195-.39.687-.39.882 0l2.4 4.881a.5.5 0 00.453.329l5.385.783c.437.063.61.6.294.908l-3.896 3.799a.5.5 0 00-.144.444l.92 5.36c.075.438-.387.773-.777.567l-4.81-2.53a.5.5 0 00-.47 0l-4.81 2.53c-.39.206-.852-.13-.777-.567l.92-5.36a.5.5 0 00-.144-.444L2.008 11.3c-.315-.308-.142-.845.294-.908l5.385-.783a.5.5 0 00.453-.329l2.4-4.881z" />
    </svg>
);

const FolderIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
);

const WorklistView: React.FC = () => {
    const { fontSettings } = useTheme();
    const navigate = useNavigate();
    const { user } = useSession();
    const doctorId = user?.userId || 'BS001';

    // 1. Data Store States
    const [requests, setRequests] = useState<ImagingRequest[]>([]);
    const [selectedId, setSelectedId] = useState<string>('');
    const [favorites, setFavorites] = useState<string[]>([]);
    const [customTemplates, setCustomTemplates] = useState<ReportTemplate[]>([]);

    // 2. Filter States (matching folders on left sidebar)
    const [activeFolder, setActiveFolder] = useState<'All' | 'X-Ray' | 'CT' | 'MRI' | 'Uploads' | 'Favorites'>('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchDate, setSearchDate] = useState('');
    const [myCasesOnly, setMyCasesOnly] = useState(false);

    // 3. Active Viewport Slices scroll
    const [sliceIndex, setSliceIndex] = useState(15);
    const totalSlices = 120;

    // 4. Report Edit States
    const [technique, setTechnique] = useState('');
    const [findings, setFindings] = useState('');
    const [conclusion, setConclusion] = useState('');

    // 5. Diagnostics Viewer overlays
    const [isViewerOpen, setIsViewerOpen] = useState(false);

    // Load initial data
    const loadData = () => {
        // Load requests
        const localReqs = localStorage.getItem('vclinic_pacs_requests_new');
        let parsedReqs: ImagingRequest[] = [];
        if (localReqs) {
            try { parsedReqs = JSON.parse(localReqs); } catch (e) {}
        }
        if (parsedReqs.length === 0) {
            parsedReqs = mockRequests;
            localStorage.setItem('vclinic_pacs_requests_new', JSON.stringify(parsedReqs));
        }
        setRequests(parsedReqs);

        // Auto select first patient
        if (parsedReqs.length > 0 && !selectedId) {
            setSelectedId(parsedReqs[0].id);
        }

        // Load favorites
        const localFavs = localStorage.getItem('vclinic_pacs_favorites_new');
        if (localFavs) {
            try {
                const favObjs = JSON.parse(localFavs);
                setFavorites(favObjs.map((f: any) => f.orderId));
            } catch (e) {}
        }

        // Load custom templates
        const localTpls = localStorage.getItem('vclinic_pacs_custom_templates_new');
        if (localTpls) {
            try { setCustomTemplates(JSON.parse(localTpls)); } catch (e) {}
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Get current active request
    const activeRequest = useMemo(() => {
        return requests.find(r => r.id === selectedId) || null;
    }, [requests, selectedId]);

    // Load report fields when selected request changes
    useEffect(() => {
        if (!activeRequest) return;
        
        if (activeRequest.report) {
            const techMatch = activeRequest.report.match(/KỸ THUẬT:(.*?)(?=MÔ TẢ|KẾT LUẬN|$)/s);
            const descMatch = activeRequest.report.match(/MÔ TẢ.*?:(.*?)(?=KẾT LUẬN|$)/s);
            const concMatch = activeRequest.report.match(/KẾT LUẬN:(.*)/s);
            setTechnique(techMatch ? techMatch[1].trim() : '');
            setFindings(descMatch ? descMatch[1].trim() : activeRequest.report);
            setConclusion(concMatch ? concMatch[1].trim() : '');
        } else {
            // Apply standard template if empty
            const defaultTpl = mockTemplates.find(t => t.modality === activeRequest.modality);
            if (defaultTpl) {
                applyTemplate(defaultTpl);
            } else {
                setTechnique('');
                setFindings('');
                setConclusion('');
            }
        }
    }, [selectedId, activeRequest]);

    const applyTemplate = (tpl: ReportTemplate) => {
        const content = tpl.content;
        const techMatch = content.match(/KỸ THUẬT:(.*?)(?=MÔ TẢ|KẾT LUẬN|$)/s);
        const descMatch = content.match(/MÔ TẢ.*?:(.*?)(?=KẾT LUẬN|$)/s);
        const concMatch = content.match(/KẾT LUẬN:(.*)/s);

        setTechnique(techMatch ? techMatch[1].trim() : '');
        setFindings(descMatch ? descMatch[1].trim() : content.replace(/KỸ THUẬT:.*?(?=MÔ TẢ)/s, '').trim());
        setConclusion(concMatch ? concMatch[1].trim() : '');
    };

    // Filter queue
    const filteredRequests = useMemo(() => {
        return requests.filter(req => {
            // Folder filters
            if (activeFolder === 'X-Ray' && req.modality !== 'X-Ray') return false;
            if (activeFolder === 'CT' && req.modality !== 'CT') return false;
            if (activeFolder === 'MRI' && req.modality !== 'MRI') return false;
            if (activeFolder === 'Favorites' && !favorites.includes(req.id)) return false;
            if (activeFolder === 'Uploads' && req.id.includes('UPLOAD')) return false; // Mock uploads filter

            // Keyword / search date / my cases
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const match = req.patientName.toLowerCase().includes(term) ||
                              req.id.toLowerCase().includes(term) ||
                              req.patientId.toLowerCase().includes(term);
                if (!match) return false;
            }

            if (searchDate && !req.requestDate.startsWith(searchDate)) return false;

            if (myCasesOnly && req.radiologist && !req.radiologist.includes(doctorId)) return false;

            return true;
        });
    }, [requests, activeFolder, searchTerm, searchDate, myCasesOnly, favorites, doctorId]);

    // Related studies list (mocking same patient history)
    const relatedStudies = useMemo(() => {
        if (!activeRequest) return [];
        return requests.filter(r => r.patientId === activeRequest.patientId && r.id !== activeRequest.id);
    }, [requests, activeRequest]);

    // Toggle Favorites
    const toggleFavorite = (reqId: string) => {
        let updated: string[];
        if (favorites.includes(reqId)) {
            updated = favorites.filter(id => id !== reqId);
        } else {
            updated = [...favorites, reqId];
        }
        setFavorites(updated);
        const favObjs = updated.map(id => ({ orderId: id }));
        localStorage.setItem('vclinic_pacs_favorites_new', JSON.stringify(favObjs));
    };

    // Save report draft or approve & sign
    const handleSaveReport = (isFinal: boolean) => {
        if (!activeRequest) return;
        try {
            const updated = requests.map(r => {
                if (r.id === activeRequest.id) {
                    return {
                        ...r,
                        status: isFinal ? 'Approved' : 'Processing',
                        report: `KỸ THUẬT: ${technique}\n\nMÔ TẢ HÌNH ẢNH:\n${findings}\n\nKẾT LUẬN: ${conclusion}`
                    } as ImagingRequest;
                }
                return r;
            });
            setRequests(updated);
            localStorage.setItem('vclinic_pacs_requests_new', JSON.stringify(updated));
            alert(isFinal ? 'Đã duyệt kết quả chẩn đoán thành công!' : 'Đã lưu nháp kết quả chẩn đoán.');
        } catch (e) {
            console.error(e);
        }
    };

    // Mock Upload DICOM files
    const handleUploadDicom = () => {
        if (!activeRequest) return;
        const filename = prompt('Nhập tên file DICOM mẫu để tải lên: (ví dụ: study_chest_ap.dcm)', 'study_chest_ap.dcm');
        if (!filename) return;

        const newUpload: ImagingRequest = {
            id: `REQ-UPLOAD-${Date.now().toString().slice(-4)}`,
            patientId: activeRequest.patientId,
            patientName: activeRequest.patientName,
            age: activeRequest.age,
            gender: activeRequest.gender,
            serviceName: `Chụp ngoài hệ thống: ${filename}`,
            modality: activeRequest.modality,
            bodyPart: activeRequest.bodyPart,
            requestDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
            priority: 'Normal',
            status: 'Acquired',
            imageUrl: activeRequest.imageUrl,
            studyUid: `1.2.840.113619.2.55.3.${Date.now()}`
        };

        const updated = [newUpload, ...requests];
        setRequests(updated);
        localStorage.setItem('vclinic_pacs_requests_new', JSON.stringify(updated));
        setSelectedId(newUpload.id);
        alert(`Đã tải lên tệp DICOM ${filename} thành công!`);
    };

    const handleMouseWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = Math.sign(e.deltaY);
        setSliceIndex(prev => Math.min(Math.max(1, prev + delta), totalSlices));
    };

    return (
        <div className="h-[calc(100vh-130px)] flex flex-col bg-[#1A1D24] text-slate-200 font-sans text-xs select-none border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            
            {/* Top title bar */}
            <div className="bg-[#111317] border-b border-slate-850 px-4 py-2.5 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center space-x-3">
                    <span className="font-black tracking-widest text-[#5C6BC0] text-sm font-mono">PMRPACS</span>
                    <span className="text-slate-500 font-bold">|</span>
                    <span className="font-extrabold uppercase text-xs tracking-wider text-slate-300">ĐA KHOA QUỐC TẾ NINH BÌNH THĂNG LONG</span>
                    <span className="bg-[#303F9F] px-2 py-0.5 text-[10px] font-black rounded text-white ml-2">ĐA KHOA QUỐC TẾ</span>
                </div>
                <div className="flex items-center space-x-4 font-bold text-slate-400">
                    <div>Hỗ trợ kỹ thuật: <span className="text-red-400 font-mono">0919.175.115</span></div>
                    <div>Đã duyệt: <span className="text-emerald-400 font-mono">{requests.filter(r => r.status === 'Approved').length}</span></div>
                    <div className="w-px h-4 bg-slate-800"></div>
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        KTV. {user?.fullName || 'Admin'}
                    </div>
                </div>
            </div>

            {/* Split view: Left Sidebar vs Main panels */}
            <div className="flex-grow flex overflow-hidden">
                
                {/* 1. LEFT SIDEBAR: Folder Tree & Study Preview */}
                <div className="w-64 border-r border-[#111317] bg-[#15181E] flex flex-col overflow-hidden flex-shrink-0">
                    {/* Folder Tree */}
                    <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
                        <div>
                            <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2 font-mono">Spectra folder</h4>
                            <div className="space-y-1 font-bold">
                                {(
                                    [
                                        { id: 'All', label: 'Tất cả' },
                                        { id: 'X-Ray', label: 'X-Quang' },
                                        { id: 'CT', label: 'CT' },
                                        { id: 'MRI', label: 'MRI' },
                                        { id: 'Uploads', label: 'Uploads' },
                                        { id: 'Favorites', label: 'Favorites' }
                                    ] as const
                                ).map(f => {
                                    const isActive = activeFolder === f.id;
                                    return (
                                        <button 
                                            key={f.id}
                                            onClick={() => setActiveFolder(f.id)}
                                            className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors text-left cursor-pointer ${
                                                isActive ? 'bg-[#303F9F] text-white shadow-md' : 'hover:bg-[#202530] text-slate-400'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <FolderIcon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#5C6BC0]'}`}/>
                                                <span className="text-xs leading-none">{f.label}</span>
                                            </div>
                                            <span className="text-[10px] font-mono opacity-80">
                                                {f.id === 'All' ? requests.length : 
                                                 f.id === 'Favorites' ? favorites.length : 
                                                 requests.filter(r => r.modality === f.id).length}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Study Preview Panel */}
                    <div className="border-t border-[#111317] p-3.5 bg-[#12141A]/50 flex flex-col space-y-2.5">
                        <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider font-mono">Study preview</h4>
                        {activeRequest ? (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                                    <span>Series:</span>
                                    <span className="font-bold text-slate-200">1 - 1.25mm NHU MÔ</span>
                                </div>

                                {/* Slide slider */}
                                <div className="flex items-center space-x-2">
                                    <input 
                                        type="range"
                                        min="1"
                                        max={totalSlices}
                                        value={sliceIndex}
                                        onChange={(e) => setSliceIndex(parseInt(e.target.value))}
                                        className="w-full accent-[#5C6BC0] bg-slate-900 rounded h-1 cursor-col-resize"
                                    />
                                </div>

                                {/* Active Slice Thumbnail with mouse wheel scrolling */}
                                <div 
                                    onWheel={handleMouseWheel}
                                    onClick={() => setIsViewerOpen(true)}
                                    className="aspect-square bg-black border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center relative group cursor-zoom-in"
                                    title="Nhấp để mở Trình xem ảnh y khoa chẩn đoán chi tiết"
                                >
                                    <img 
                                        src={activeRequest.imageUrl} 
                                        alt="Preview" 
                                        className="w-full h-full object-contain filter brightness-105"
                                        style={{ transform: `scale(1.02)` }}
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="bg-indigo-600/90 text-[10px] px-2.5 py-1 rounded-lg font-extrabold text-white">Xem Chi Tiết</span>
                                    </div>
                                    <div className="absolute bottom-2 right-2 bg-black/60 px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-400">
                                        {sliceIndex}/{totalSlices}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center p-6 text-slate-600 italic">Chưa có ca chụp được chọn</div>
                        )}
                    </div>
                </div>

                {/* 2. MAIN CENTER AREA: Three stacked panels */}
                <div className="flex-1 flex flex-col overflow-hidden bg-[#1D212A]">
                    
                    {/* PANEL 1 (TOP): Search Result Patient List */}
                    <div className="h-2/5 border-b border-[#111317] flex flex-col overflow-hidden bg-[#161920]">
                        
                        {/* Queue Filter Bar */}
                        <div className="bg-[#12141A] px-4 py-2 border-b border-[#1A1D24] flex items-center justify-between flex-wrap gap-2.5">
                            <div className="flex items-center space-x-3.5">
                                <span className="font-extrabold text-slate-300">Search Result: <span className="text-[#5C6BC0] font-mono font-black">{filteredRequests.length} ca</span></span>
                                
                                {/* Keyword */}
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        placeholder="Từ khoá tìm kiếm..." 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="bg-[#1B1E26] border border-slate-750 rounded-md px-2.5 py-1 text-[11px] font-bold text-slate-200 w-48 focus:ring-1 focus:ring-[#303F9F] outline-none"
                                    />
                                </div>

                                {/* Date select */}
                                <div>
                                    <input 
                                        type="date"
                                        value={searchDate}
                                        onChange={(e) => setSearchDate(e.target.value)}
                                        className="bg-[#1B1E26] border border-slate-750 rounded-md px-2.5 py-1 text-[11px] font-bold text-slate-200 outline-none"
                                    />
                                </div>

                                {/* My cases filter */}
                                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-slate-400">
                                    <input 
                                        type="checkbox"
                                        checked={myCasesOnly}
                                        onChange={(e) => setMyCasesOnly(e.target.checked)}
                                        className="rounded bg-slate-900 border-slate-750 accent-indigo-600 focus:ring-0"
                                    />
                                    <span>CA CỦA TÔI</span>
                                </label>
                            </div>

                            {/* View selection toggle */}
                            <div className="flex items-center space-x-2">
                                <button 
                                    onClick={() => setIsViewerOpen(true)}
                                    className="bg-[#303F9F] hover:bg-[#3F51B5] text-white px-3 py-1.5 rounded font-black tracking-wide text-[10px] shadow flex items-center gap-1 cursor-pointer"
                                >
                                    2 màn hình
                                </button>
                            </div>
                        </div>

                        {/* Patient Table */}
                        <div className="flex-grow overflow-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse font-bold text-slate-300">
                                <thead className="bg-[#111317] border-b border-slate-800 text-[10px] uppercase font-black tracking-wider text-slate-400 sticky top-0 z-10 leading-snug">
                                    <tr>
                                        <th className="p-2.5 w-12 text-center">STT</th>
                                        <th className="p-2.5 w-10 text-center">★</th>
                                        <th className="p-2.5">Trạng thái</th>
                                        <th className="p-2.5">Tên bệnh nhân</th>
                                        <th className="p-2.5">Mã bệnh nhân</th>
                                        <th className="p-2.5 w-16 text-center">Năm sinh</th>
                                        <th className="p-2.5 w-12 text-center">Tuổi</th>
                                        <th className="p-2.5 w-16 text-center">Giới tính</th>
                                        <th className="p-2.5">Thời gian chụp</th>
                                        <th className="p-2.5 text-center">Modality</th>
                                        <th className="p-2.5 text-center">Bộ phận</th>
                                        <th className="p-2.5">Chỉ định</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1D212A] text-[11px] font-semibold leading-relaxed">
                                    {filteredRequests.map((req, idx) => {
                                        const isSelected = req.id === selectedId;
                                        const isFav = favorites.includes(req.id);
                                        return (
                                            <tr 
                                                key={req.id}
                                                onClick={() => setSelectedId(req.id)}
                                                className={`hover:bg-[#252B38] cursor-pointer transition-colors ${
                                                    isSelected ? 'bg-[#313B4D] text-white' : ''
                                                }`}
                                            >
                                                <td className="p-2 text-center text-slate-500 font-mono">{idx + 1}</td>
                                                <td className="p-2 text-center" onClick={(e) => { e.stopPropagation(); toggleFavorite(req.id); }}>
                                                    <StarIcon className={`w-3.5 h-3.5 cursor-pointer ${isFav ? 'text-amber-500' : 'text-slate-600'}`} fill={isFav ? 'currentColor' : 'none'}/>
                                                </td>
                                                <td className="p-2">
                                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                                                        req.status === 'Approved' ? 'bg-emerald-900/40 text-emerald-300' :
                                                        req.status === 'Processing' ? 'bg-amber-900/40 text-amber-300' : 'bg-cyan-900/40 text-cyan-300'
                                                    }`}>
                                                        {req.status === 'Approved' ? 'Đã duyệt' :
                                                         req.status === 'Processing' ? 'Đang đọc' : 'Đã chụp'}
                                                    </span>
                                                </td>
                                                <td className="p-2 font-black text-slate-200">{req.patientName}</td>
                                                <td className="p-2 font-mono text-slate-400">{req.patientId}</td>
                                                <td className="p-2 text-center font-mono">{2026 - req.age}</td>
                                                <td className="p-2 text-center font-mono">{req.age}Y</td>
                                                <td className="p-2 text-center">{req.gender}</td>
                                                <td className="p-2 font-mono text-slate-400">{req.requestDate}</td>
                                                <td className="p-2 text-center font-mono text-indigo-400">{req.modality}</td>
                                                <td className="p-2 text-center text-slate-400">{req.bodyPart}</td>
                                                <td className="p-2 text-slate-400 max-w-xs truncate">{req.serviceName}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* PANEL 2 (MIDDLE): Related Studies of Selected Patient */}
                    <div className="h-1/5 border-b border-[#111317] flex flex-col overflow-hidden bg-[#161920]">
                        <div className="bg-[#12141A] px-4 py-2 border-b border-[#1A1D24] flex items-center justify-between flex-shrink-0">
                            <span className="font-extrabold text-slate-400">
                                Related studies: {activeRequest ? `${activeRequest.requestDate} ${activeRequest.patientName} ${activeRequest.gender}` : ''}
                            </span>

                            <button 
                                onClick={handleUploadDicom}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1 rounded-md text-[10px] font-black flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
                            >
                                ⬆ UP DICOM
                            </button>
                        </div>
                        <div className="flex-grow overflow-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse text-slate-400 font-bold">
                                <thead className="bg-[#111317]/50 border-b border-slate-800 text-[9px] uppercase font-black tracking-wider sticky top-0 z-10 leading-snug">
                                    <tr>
                                        <th className="p-2 w-12 text-center">STT</th>
                                        <th className="p-2">Trạng thái</th>
                                        <th className="p-2">Tên bệnh nhân</th>
                                        <th className="p-2">Mã bệnh nhân</th>
                                        <th className="p-2 w-16 text-center">Năm sinh</th>
                                        <th className="p-2 w-12 text-center">Tuổi</th>
                                        <th className="p-2 w-16 text-center">Giới tính</th>
                                        <th className="p-2">Thời gian chụp</th>
                                        <th className="p-2 text-center">Modality</th>
                                        <th className="p-2">Chỉ định</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1D212A] text-[10px]">
                                    {relatedStudies.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="p-4 text-center text-slate-600 italic">Không có ca chụp cũ để so sánh</td>
                                        </tr>
                                    ) : (
                                        relatedStudies.map((rel, idx) => (
                                            <tr key={rel.id} className="hover:bg-[#202530] transition-colors">
                                                <td className="p-2 text-center text-slate-650 font-mono">{idx + 1}</td>
                                                <td className="p-2">
                                                    <span className="px-1.5 py-0.5 rounded text-[8px] bg-slate-800 text-slate-400">Đã duyệt</span>
                                                </td>
                                                <td className="p-2 text-slate-300 font-bold">{rel.patientName}</td>
                                                <td className="p-2 font-mono">{rel.patientId}</td>
                                                <td className="p-2 text-center font-mono">{2026 - rel.age}</td>
                                                <td className="p-2 text-center font-mono">{rel.age}Y</td>
                                                <td className="p-2 text-center">{rel.gender}</td>
                                                <td className="p-2 font-mono">{rel.requestDate}</td>
                                                <td className="p-2 text-center font-mono">{rel.modality}</td>
                                                <td className="p-2 text-slate-500 truncate max-w-xs">{rel.serviceName}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* PANEL 3 (BOTTOM): RIS Report Editor */}
                    <div className="h-2/5 flex flex-col overflow-hidden bg-[#161920] relative">
                        <div className="bg-[#12141A] px-4 py-2.5 border-b border-[#1A1D24] flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center space-x-2">
                                <span className="font-extrabold text-slate-300">
                                    {activeRequest ? `${activeRequest.requestDate} ${activeRequest.patientName} ${activeRequest.age}Y Tuổi ${activeRequest.gender}` : 'Chưa có bệnh nhân'}
                                </span>
                                <span className="text-slate-600 font-bold">|</span>
                                <span className="text-slate-400 font-bold text-[10px]">Máy chụp: {activeRequest?.room?.replace('P. ', '').toLowerCase() || 'ct99'}</span>
                            </div>

                            {/* Templates select */}
                            <div className="flex items-center space-x-2">
                                <select 
                                    onChange={(e) => {
                                        const tpl = mockTemplates.find(t => t.id === e.target.value);
                                        if (tpl) applyTemplate(tpl);
                                    }}
                                    className="bg-[#1B1E26] border border-slate-750 rounded px-2.5 py-1 text-[10px] font-bold text-slate-300 outline-none"
                                >
                                    <option value="">--Standard Report--</option>
                                    {mockTemplates.filter(t => t.modality === activeRequest?.modality).map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                                <select 
                                    onChange={(e) => {
                                        const tpl = customTemplates.find(t => t.id === e.target.value);
                                        if (tpl) applyTemplate(tpl);
                                    }}
                                    className="bg-[#1B1E26] border border-slate-750 rounded px-2.5 py-1 text-[10px] font-bold text-slate-300 outline-none"
                                >
                                    <option value="">--Custom Report--</option>
                                    {customTemplates.filter(t => t.modality === activeRequest?.modality).map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                                <button className="bg-slate-800 hover:bg-slate-750 text-slate-300 px-2.5 py-1 rounded text-[10px] font-black border border-slate-700 cursor-pointer">
                                    Update
                                </button>
                                <button onClick={() => setSelectedId(selectedId)} className="bg-slate-800 hover:bg-slate-750 text-slate-300 px-2.5 py-1 rounded text-[10px] font-black border border-slate-700 cursor-pointer">
                                    Refresh
                                </button>
                            </div>
                        </div>

                        {/* Editor Forms inputs split horizontally */}
                        <div className="flex-grow grid grid-cols-3 gap-3 p-3 bg-[#161920] overflow-hidden">
                            {/* 1. Indication (Chỉ định) */}
                            <div className="flex flex-col overflow-hidden">
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Chỉ định</label>
                                <textarea
                                    value={activeRequest ? activeRequest.serviceName : ''}
                                    readOnly
                                    className="w-full flex-grow p-2 bg-[#1B1E26] border border-slate-750 rounded-lg text-xs font-bold text-slate-400 outline-none resize-none leading-relaxed"
                                    placeholder="Nội dung chỉ định CĐHA..."
                                />
                            </div>

                            {/* 2. Findings (Mô tả) */}
                            <div className="flex flex-col overflow-hidden">
                                <label className="block text-[9px] font-black text-[#5C6BC0] uppercase tracking-widest mb-1.5">[Mô tả]</label>
                                <textarea
                                    value={findings}
                                    onChange={(e) => setFindings(e.target.value)}
                                    className="w-full flex-grow p-2 bg-[#1B1E26] border border-slate-750 rounded-lg text-xs font-medium text-slate-200 outline-none resize-none focus:border-indigo-600 leading-relaxed custom-scrollbar"
                                    placeholder="Nhập mô tả hình ảnh..."
                                />
                            </div>

                            {/* 3. Conclusion (Kết luận) */}
                            <div className="flex flex-col overflow-hidden">
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">[Kết luận]</label>
                                <textarea
                                    value={conclusion}
                                    onChange={(e) => setConclusion(e.target.value)}
                                    className="w-full flex-grow p-2 bg-[#1B1E26] border border-slate-750 rounded-lg text-xs font-bold text-slate-200 outline-none resize-none focus:border-indigo-600 leading-relaxed custom-scrollbar"
                                    placeholder="Kết luận chẩn đoán xác định..."
                                />
                            </div>
                        </div>

                        {/* Editor Action buttons bottom bar */}
                        <div className="bg-[#111317] px-4 py-2 border-t border-slate-800 flex items-center justify-between flex-shrink-0 text-[10px] font-bold text-slate-400">
                            <div className="flex items-center space-x-3">
                                <div>BS Đọc: <select className="bg-[#1B1E26] border border-slate-750 text-slate-300 rounded p-1 text-[9px]"><option>--Any doctor--</option><option>BS. Trần Thanh</option></select></div>
                                <div>BS Duyệt: <select className="bg-[#1B1E26] border border-slate-750 text-slate-300 rounded p-1 text-[9px]"><option>--Any doctor--</option><option>BS. Trần Thanh</option></select></div>
                                <button className="bg-indigo-900/30 text-indigo-300 border border-indigo-900/60 hover:bg-indigo-900/50 px-2 py-1 rounded transition cursor-pointer">Assign</button>
                            </div>

                            <div className="flex items-center space-x-2">
                                <button 
                                    onClick={() => setSelectedId(selectedId)}
                                    className="bg-slate-850 hover:bg-slate-750 text-slate-300 border border-slate-700 px-3 py-1.5 rounded transition cursor-pointer uppercase tracking-wider text-[9px]"
                                >
                                    Discard
                                </button>
                                <button 
                                    onClick={() => handleSaveReport(false)}
                                    className="bg-[#303F9F] hover:bg-[#3F51B5] text-white px-4 py-1.5 rounded shadow shadow-indigo-500/10 transition cursor-pointer uppercase tracking-wider text-[9px]"
                                    title="Lưu báo cáo (Alt+2)"
                                >
                                    Save
                                </button>
                                <button 
                                    onClick={() => handleSaveReport(true)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded shadow shadow-emerald-500/10 transition cursor-pointer uppercase tracking-wider text-[9px]"
                                >
                                    Approve
                                </button>
                                <button className="bg-slate-850 hover:bg-slate-750 text-slate-400 border border-slate-700 px-3 py-1.5 rounded transition cursor-pointer uppercase tracking-wider text-[9px] disabled:opacity-40" disabled>
                                    Unapprove
                                </button>
                                <button className="bg-indigo-900/40 text-indigo-300 border border-indigo-900/60 px-3 py-1.5 rounded hover:bg-indigo-900/60 transition cursor-pointer font-black font-mono">
                                    HIS
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Diagnostics Fullscreen Overlay Viewer */}
            {isViewerOpen && activeRequest && (
                <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col animate-fade-in no-print">
                    <div className="bg-[#111317] px-4 py-2 border-b border-slate-900 flex items-center justify-between flex-shrink-0 z-[110]">
                        <div className="flex items-center space-x-2 font-mono">
                            <span className="font-black text-[#5C6BC0] tracking-widest text-sm">PMRPACS VIEWER</span>
                            <span className="text-slate-600">|</span>
                            <span className="text-slate-300 text-xs font-bold uppercase">{activeRequest.patientName} ({activeRequest.gender}, {activeRequest.age}T)</span>
                        </div>
                        <button 
                            onClick={() => setIsViewerOpen(false)}
                            className="bg-red-650 hover:bg-red-700 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-lg border border-red-500/30 transition shadow cursor-pointer uppercase tracking-wide"
                        >
                            Đóng trình xem
                        </button>
                    </div>
                    <div className="flex-1 w-full overflow-hidden">
                        <CornerstoneViewer 
                            imageUrl={activeRequest.imageUrl || ''} 
                            patientName={activeRequest.patientName} 
                            modality={activeRequest.modality}
                            patientId={activeRequest.patientId}
                            studyUid={activeRequest.studyUid}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorklistView;
