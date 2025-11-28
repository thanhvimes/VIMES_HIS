
import React, { useState, useEffect, useRef } from 'react';
import { 
    MicrophoneIcon, 
    VideoCameraIcon, 
    PhoneMissedCallIcon, 
    MicrophoneOffIcon, 
    ChatBubbleIcon,
    DocumentTextIcon,
    PhotographIcon,
    XIcon,
    PaperAirplaneIcon,
    UserGroupIcon,
    ChevronLeftIcon,
    ClipboardCheckIcon,
    SaveIcon,
    PrinterIcon,
    UserPlusIcon,
    ShareIcon,
    LinkIcon
} from '../../../components/Icons';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import MockDicomViewer from '../../imaging-results/views/components/MockDicomViewer';
import { usePdfPreview } from '../../../contexts/PdfPreviewContext';
import { useNotification } from '../../../contexts/NotificationContext';
import ConfirmationModal from '../../../components/shared/ConfirmationModal';

// Mock participants
const participants = [
    { id: 1, name: 'GS. Nguyễn Văn B (Chủ tọa)', role: 'Host', img: 'https://ui-avatars.com/api/?name=Nguyen+Van+B&background=0D8ABC&color=fff' },
    { id: 2, name: 'BS. Trần Văn A (Báo cáo)', role: 'Guest', img: 'https://ui-avatars.com/api/?name=Tran+Van+A&background=6366f1&color=fff' },
    { id: 3, name: 'BS. CĐHA Phạm Văn C', role: 'Viewer', img: 'https://ui-avatars.com/api/?name=Pham+Van+C&background=10b981&color=fff' },
];

// Mock PACS Series available for this session (Updated with Reliable Sources)
const mockPacsSeries = [
    { 
        id: 'S01', 
        name: 'CT Ngực - Cửa sổ phổi (Axial)', 
        modality: 'CT', 
        date: '20/11/2023', 
        thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/e/ee/CT_scan_of_the_chest.jpg' // Reliable Source
    },
    { 
        id: 'S02', 
        name: 'MRI Sọ não (T2 FLAIR)', 
        modality: 'MRI', 
        date: '20/11/2023', 
        thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/5/50/Computed_tomography_of_human_brain_-_large.png' // Reliable Source
    }, 
    { 
        id: 'S03', 
        name: 'X-Quang Ngực thẳng (PA)', 
        modality: 'CR', 
        date: '19/11/2023', 
        thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/a/a1/Normal_posteroanterior_%28PA%29_chest_radiograph_%28X-ray%29.jpg' // Reliable Source
    },
];

const LiveRoomView: React.FC = () => {
    const navigate = useNavigate();
    const { openPdf } = usePdfPreview();
    const { fontSettings } = useTheme();
    const { addNotification } = useNotification();
    
    // Media State
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    
    // Layout State
    const [activeTab, setActiveTab] = useState<'records' | 'pacs' | 'chat' | 'minutes'>('minutes');
    const [mainViewMode, setMainViewMode] = useState<'grid' | 'presentation'>('grid');
    const [selectedSeries, setSelectedSeries] = useState(mockPacsSeries[0]);
    const [isExitModalOpen, setIsExitModalOpen] = useState(false);
    
    const [chatMessage, setChatMessage] = useState('');

    // Room Info
    const roomId = "ROOM-8829-X9";

    // Minutes State
    const [minutesData, setMinutesData] = useState({
        diagnosis: 'TD U phổi phải / COPD',
        discussion: '- Hình ảnh CT cho thấy khối u kích thước 5x6cm thùy trên phổi phải.\n- Xâm lấn trung thất, chưa thấy di căn xa.\n- Bệnh nhân có tiền sử COPD.',
        conclusion: '1. Sinh thiết kim dưới hướng dẫn CT.\n2. Làm thêm MRI sọ não để loại trừ di căn.\n3. Hội chẩn lại sau khi có giải phẫu bệnh.',
        plan: 'Chuyển Khoa Ung bướu điều trị sau khi có kết quả GPB.'
    });

    // --- Prevent accidental close ---
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = ''; // Legacy support
            return '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    // --- Camera Handling ---
    useEffect(() => {
        let stream: MediaStream | null = null;

        const startCamera = async () => {
            try {
                if (!isVideoOff) {
                    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                    setLocalStream(stream);
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = stream;
                    }
                } else {
                    if (localStream) {
                        localStream.getTracks().forEach(track => track.stop());
                        setLocalStream(null);
                    }
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
            }
        };

        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isVideoOff]);

    // Re-attach stream when view mode changes or ref changes
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [mainViewMode, activeTab, localStream]);


    const handleExitClick = () => {
        setIsExitModalOpen(true);
    };
    
    const handleBack = () => {
         // Just go back without closing session logic explicitly
         if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
         navigate('/telemedicine/dashboard');
    };

    const confirmExit = () => {
        // Stop tracks and officially end
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        navigate('/telemedicine/dashboard');
    };

    const handleSelectSeries = (series: typeof mockPacsSeries[0]) => {
        setSelectedSeries(series);
        setMainViewMode('presentation');
    };

    const switchToGrid = () => {
        setMainViewMode('grid');
    };

    const handlePrintMinutes = () => {
        openPdf({
            url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
            fileName: 'BienBan_HoiChan.pdf',
            isSignable: true
        });
    };

    const copyInviteLink = () => {
        const inviteLink = `${window.location.origin}/telemedicine/live/${roomId}`;
        navigator.clipboard.writeText(inviteLink);
        addNotification('Đã sao chép', `Link tham gia: ${roomId}`, 'success', undefined, true);
    };

    return (
        <div className="fixed inset-0 z-[60] bg-slate-900 text-white flex flex-col font-sans">
            {/* Header */}
            <div className="h-14 bg-slate-800 border-b border-slate-700 flex justify-between items-center px-4 shrink-0 shadow-md z-50">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleBack} 
                        className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
                        title="Rời phòng (Không kết thúc)"
                    >
                        <ChevronLeftIcon className="w-6 h-6"/>
                    </button>
                    
                    <div className="flex items-center gap-2 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/30">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        <span className="font-bold text-red-400 text-xs uppercase tracking-wider">Live</span>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="font-bold text-sm md:text-base truncate">Hội chẩn: BN Lê Hoàng Cường</h1>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            ID: {roomId} <span className="w-1 h-1 bg-slate-500 rounded-full"></span> Ung bướu
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={copyInviteLink}
                        className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded transition shadow-sm"
                    >
                        <UserPlusIcon className="w-4 h-4"/> Mời
                    </button>
                    <div className="w-px h-6 bg-slate-700 mx-1"></div>
                    <div className="text-sm font-mono text-slate-400 bg-black/30 px-2 py-1 rounded hidden sm:block">00:15:23</div>
                    <button 
                        onClick={handleExitClick} 
                        className="p-2 bg-red-600/80 hover:bg-red-600 rounded-full transition text-white shadow-lg"
                        title="Kết thúc phiên"
                    >
                        <PhoneMissedCallIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>

            {/* Main Body */}
            <div className="flex-1 flex overflow-hidden relative">
                
                {/* LEFT: Main Stage (Video Grid OR PACS Viewer) */}
                <div className="flex-1 bg-black relative flex flex-col overflow-hidden">
                    
                    {mainViewMode === 'grid' ? (
                        // MODE 1: VIDEO GRID
                        <div className="flex-1 p-4 grid grid-cols-2 gap-4 overflow-y-auto content-center max-w-6xl mx-auto w-full h-full">
                            {participants.map(p => (
                                <div key={p.id} className="relative bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-lg aspect-video group">
                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-700">
                                        <img src={p.img} alt={p.name} className="w-24 h-24 rounded-full opacity-50 shadow-xl"/>
                                    </div>
                                    <div className="absolute bottom-0 left-0 w-full p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex justify-between items-end">
                                        <div>
                                            <p className="font-bold text-sm text-white text-shadow">{p.name}</p>
                                            <p className="text-xs text-slate-300">{p.role}</p>
                                        </div>
                                        <div className="bg-black/40 p-1.5 rounded-full backdrop-blur-sm">
                                            <MicrophoneIcon className="w-3 h-3 text-green-400"/>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            {/* Self View (Real Camera) */}
                            <div className="relative bg-slate-800 rounded-xl overflow-hidden border-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] aspect-video">
                                {!isVideoOff ? (
                                    <video 
                                        ref={localVideoRef} 
                                        autoPlay 
                                        muted 
                                        className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10 backdrop-blur-sm">
                                        <div className="text-slate-500 flex flex-col items-center">
                                            <VideoCameraIcon className="w-12 h-12 mb-2 opacity-50"/>
                                            <span className="text-xs uppercase tracking-widest font-bold">Video Off</span>
                                        </div>
                                    </div>
                                )}
                                <div className="absolute bottom-2 left-3 text-xs font-bold text-blue-400 bg-black/50 px-2 py-0.5 rounded">Bạn (BS. Minh)</div>
                                <div className="absolute bottom-3 right-3 w-3 h-3 bg-green-500 rounded-full ring-2 ring-black animate-pulse"></div>
                                
                                {isMuted && (
                                    <div className="absolute top-3 right-3 bg-red-600 p-1.5 rounded-full shadow-md">
                                        <MicrophoneOffIcon className="w-4 h-4 text-white"/>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        // MODE 2: PRESENTATION (PACS VIEWER)
                        <div className="flex-1 flex flex-col relative">
                            <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                                <button 
                                    onClick={switchToGrid}
                                    className="bg-black/60 hover:bg-black/80 text-white px-4 py-2 rounded-full backdrop-blur-md border border-white/10 text-xs font-bold flex items-center gap-2 transition-all shadow-lg hover:pr-6"
                                >
                                    <ChevronLeftIcon className="w-4 h-4"/> Quay lại Video
                                </button>
                                <div className="bg-black/60 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 text-xs text-slate-300">
                                    Đang xem: <span className="font-bold text-white">{selectedSeries.name}</span>
                                </div>
                            </div>

                            <div className="flex-1 bg-black">
                                <MockDicomViewer 
                                    imageUrl={selectedSeries.thumbnail} 
                                    patientName="LE HOANG CUONG"
                                    modality={selectedSeries.modality}
                                    patientId="P003"
                                    accessionNumber="ACC-TELE-001"
                                />
                            </div>

                            <div className="h-32 bg-[#1a1a1a] border-t border-slate-800 flex items-center gap-2 px-4 overflow-x-auto z-20 shrink-0">
                                {participants.map(p => (
                                    <div key={p.id} className="w-40 h-24 bg-slate-800 rounded-lg border border-slate-700 relative overflow-hidden flex-shrink-0 shadow-md">
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <img src={p.img} className="w-10 h-10 rounded-full opacity-70" alt=""/>
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                                            <p className="text-[10px] text-white truncate">{p.name}</p>
                                        </div>
                                    </div>
                                ))}
                                {/* Self PIP */}
                                <div className="w-40 h-24 bg-black rounded-lg border border-blue-500/50 relative overflow-hidden flex-shrink-0">
                                    {!isVideoOff && (
                                         <video 
                                            ref={localVideoRef} 
                                            autoPlay 
                                            muted 
                                            className="w-full h-full object-cover transform scale-x-[-1]" 
                                        />
                                    )}
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                                        <p className="text-[10px] text-blue-400">Bạn</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Bottom Control Bar */}
                    <div className="h-16 bg-slate-900/90 backdrop-blur border-t border-slate-700 flex justify-center items-center gap-4 shrink-0 z-30 absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full px-8 shadow-2xl">
                        <button 
                            onClick={() => setIsMuted(!isMuted)}
                            className={`p-3 rounded-full transition-all ${isMuted ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                            title={isMuted ? "Bật mic" : "Tắt mic"}
                        >
                            {isMuted ? <MicrophoneOffIcon className="w-5 h-5"/> : <MicrophoneIcon className="w-5 h-5"/>}
                        </button>
                        <button 
                            onClick={() => setIsVideoOff(!isVideoOff)}
                            className={`p-3 rounded-full transition-all ${isVideoOff ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                            title={isVideoOff ? "Bật camera" : "Tắt camera"}
                        >
                            <VideoCameraIcon className="w-5 h-5"/>
                        </button>
                        
                        <div className="w-px h-8 bg-slate-700 mx-2"></div>

                        <button 
                            onClick={copyInviteLink}
                            className="p-3 bg-slate-700 hover:bg-slate-600 rounded-full text-white transition-all"
                            title="Sao chép link mời"
                        >
                            <LinkIcon className="w-5 h-5"/>
                        </button>

                        <button 
                            onClick={handleExitClick}
                            className="px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all font-bold flex items-center gap-2 shadow-lg hover:shadow-red-900/30"
                        >
                            <PhoneMissedCallIcon className="w-5 h-5"/> <span className="hidden sm:inline">Kết thúc</span>
                        </button>
                    </div>
                </div>

                {/* RIGHT: Sidebar (Tools & Chat) (30%, max 400px) */}
                <div className="w-96 bg-[#111827] border-l border-slate-700 flex flex-col shrink-0">
                    {/* Tabs */}
                    <div className="flex border-b border-slate-700 bg-slate-800/50">
                        <button 
                            onClick={() => setActiveTab('minutes')}
                            className={`flex-1 py-3 text-xs font-bold flex flex-col items-center gap-1 uppercase tracking-wide transition-colors ${activeTab === 'minutes' ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'}`}
                        >
                            <ClipboardCheckIcon className="w-4 h-4"/> Biên bản
                        </button>
                        <button 
                            onClick={() => setActiveTab('pacs')}
                            className={`flex-1 py-3 text-xs font-bold flex flex-col items-center gap-1 uppercase tracking-wide transition-colors ${activeTab === 'pacs' ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'}`}
                        >
                            <PhotographIcon className="w-4 h-4"/> PACS
                        </button>
                        <button 
                            onClick={() => setActiveTab('records')}
                            className={`flex-1 py-3 text-xs font-bold flex flex-col items-center gap-1 uppercase tracking-wide transition-colors ${activeTab === 'records' ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'}`}
                        >
                            <DocumentTextIcon className="w-4 h-4"/> Hồ sơ
                        </button>
                        <button 
                            onClick={() => setActiveTab('chat')}
                            className={`flex-1 py-3 text-xs font-bold flex flex-col items-center gap-1 uppercase tracking-wide transition-colors ${activeTab === 'chat' ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'}`}
                        >
                            <ChatBubbleIcon className="w-4 h-4"/> Chat
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto bg-[#111827] p-4 custom-scrollbar">
                        
                        {/* TAB: MINUTES (Biên bản) */}
                        {activeTab === 'minutes' && (
                            <div className="space-y-4 animate-fade-in h-full flex flex-col">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase">Biên bản hội chẩn</h3>
                                    <button onClick={handlePrintMinutes} className="text-blue-400 hover:text-blue-300 p-1" title="In biên bản">
                                        <PrinterIcon className="w-4 h-4"/>
                                    </button>
                                </div>
                                
                                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                                    <div>
                                        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Chẩn đoán sơ bộ</label>
                                        <textarea 
                                            value={minutesData.diagnosis}
                                            onChange={e => setMinutesData({...minutesData, diagnosis: e.target.value})}
                                            className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none resize-none h-16"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Tóm tắt thảo luận</label>
                                        <textarea 
                                            value={minutesData.discussion}
                                            onChange={e => setMinutesData({...minutesData, discussion: e.target.value})}
                                            className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none resize-none h-32 leading-relaxed"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Kết luận (Chủ tọa)</label>
                                        <textarea 
                                            value={minutesData.conclusion}
                                            onChange={e => setMinutesData({...minutesData, conclusion: e.target.value})}
                                            className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm text-white font-semibold focus:ring-1 focus:ring-blue-500 outline-none resize-none h-24"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Kế hoạch điều trị</label>
                                        <textarea 
                                            value={minutesData.plan}
                                            onChange={e => setMinutesData({...minutesData, plan: e.target.value})}
                                            className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none resize-none h-20"
                                        />
                                    </div>
                                </div>
                                
                                <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm shadow-lg flex items-center justify-center gap-2 shrink-0">
                                    <SaveIcon className="w-4 h-4"/> Lưu Biên bản
                                </button>
                            </div>
                        )}

                        {/* TAB: PACS */}
                        {activeTab === 'pacs' && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase">Danh sách Series</h3>
                                    <button className="text-xs text-blue-400 hover:underline">Tải thêm</button>
                                </div>
                                
                                {mockPacsSeries.map((series) => (
                                    <div 
                                        key={series.id} 
                                        onClick={() => handleSelectSeries(series)}
                                        className={`cursor-pointer group rounded-lg overflow-hidden border transition-all ${
                                            selectedSeries.id === series.id && mainViewMode === 'presentation' 
                                            ? 'border-blue-500 ring-2 ring-blue-500/30 opacity-100' 
                                            : 'border-slate-700 hover:border-slate-500 opacity-80 hover:opacity-100'
                                        }`}
                                    >
                                        <div className="relative aspect-[4/3] bg-black">
                                            <img src={series.thumbnail} className="w-full h-full object-cover" alt="Thumbnail"/>
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 pt-6">
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <span className="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded">{series.modality}</span>
                                                        <p className="text-xs text-white font-bold mt-1 line-clamp-1">{series.name}</p>
                                                    </div>
                                                    {selectedSeries.id === series.id && mainViewMode === 'presentation' && (
                                                        <span className="text-[10px] text-green-400 font-bold uppercase animate-pulse">Đang chiếu</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button className="bg-white text-blue-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                                                    Trình chiếu
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {/* TAB: RECORDS */}
                        {activeTab === 'records' && (
                            <div className="space-y-4 text-sm animate-fade-in">
                                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                                    <h4 className="font-bold text-blue-400 mb-2 text-xs uppercase">Thông tin hành chính</h4>
                                    <div className="space-y-1 text-slate-300">
                                        <p><span className="text-slate-500">Họ tên:</span> <span className="font-bold text-white">Lê Hoàng Cường</span></p>
                                        <p><span className="text-slate-500">Tuổi/Giới:</span> 45T - Nam</p>
                                        <p><span className="text-slate-500">Mã BN:</span> P003</p>
                                        <p><span className="text-slate-500">Đơn vị yêu cầu:</span> BV Đa khoa Tỉnh</p>
                                    </div>
                                </div>
                                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                                    <h4 className="font-bold text-blue-400 mb-2 text-xs uppercase">Lý do hội chẩn</h4>
                                    <p className="text-slate-200 leading-relaxed">Khối u phổi thùy trên kích thước lớn (5x6cm), xâm lấn trung thất, cần hội chẩn hướng phẫu thuật hoặc hóa trị tân bổ trợ.</p>
                                </div>
                                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                                    <h4 className="font-bold text-blue-400 mb-2 text-xs uppercase">Tóm tắt bệnh án</h4>
                                    <ul className="list-disc list-inside text-slate-300 space-y-1">
                                        <li>Tiền sử: Hút thuốc lào 20 năm.</li>
                                        <li>COPD chẩn đoán 2019.</li>
                                        <li>Ho ra máu 2 tuần nay.</li>
                                        <li>Sinh thiết: Ung thư biểu mô tuyến.</li>
                                    </ul>
                                </div>
                                <button className="w-full py-2 border border-slate-600 rounded text-slate-400 hover:text-white hover:border-slate-400 text-xs font-bold transition">
                                    Xem bệnh án chi tiết (EMR)
                                </button>
                            </div>
                        )}

                        {/* TAB: CHAT */}
                        {activeTab === 'chat' && (
                            <div className="flex flex-col h-full animate-fade-in">
                                <div className="flex-1 space-y-4 pb-4">
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold shrink-0">A</div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-400 mb-0.5">BS. Trần Văn A • 14:05</span>
                                            <div className="bg-slate-800 p-3 rounded-r-lg rounded-bl-lg text-sm text-slate-200 border border-slate-700">
                                                Xin chào các thầy, hình ảnh CT ngực có cản quang đã được đẩy lên hệ thống.
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-xs font-bold shrink-0">C</div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-400 mb-0.5">BS. Phạm Văn C • 14:07</span>
                                            <div className="bg-slate-800 p-3 rounded-r-lg rounded-bl-lg text-sm text-slate-200 border border-slate-700">
                                                Tôi thấy có hạch trung thất nhóm 4R kích thước 15mm.
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 flex-row-reverse">
                                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">Me</div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] text-slate-400 mb-0.5">Bạn • 14:10</span>
                                            <div className="bg-indigo-600/20 p-3 rounded-l-lg rounded-br-lg text-sm text-indigo-100 border border-indigo-500/30">
                                                Đã rõ. Tôi sẽ zoom vào vùng rốn phổi phải.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Chat Input */}
                    {activeTab === 'chat' && (
                        <div className="p-4 bg-slate-900 border-t border-slate-700">
                            <div className="relative flex items-center">
                                <input 
                                    type="text" 
                                    value={chatMessage}
                                    onChange={e => setChatMessage(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-full pl-4 pr-12 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Nhập tin nhắn..."
                                    onKeyDown={(e) => e.key === 'Enter' && setChatMessage('')}
                                />
                                <button className="absolute right-1.5 p-1.5 bg-blue-600 hover:bg-blue-500 rounded-full text-white transition-colors">
                                    <PaperAirplaneIcon className="w-4 h-4 transform rotate-90 translate-x-[-1px] translate-y-[1px]"/>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* EXIT CONFIRMATION MODAL */}
            <ConfirmationModal 
                isOpen={isExitModalOpen}
                onClose={() => setIsExitModalOpen(false)}
                onConfirm={confirmExit}
                title="Kết thúc Hội chẩn"
                message="Bạn có chắc chắn muốn kết thúc phiên hội chẩn trực tuyến này không?"
            />
        </div>
    );
};

export default LiveRoomView;
