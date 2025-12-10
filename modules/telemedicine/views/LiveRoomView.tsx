
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
    ChevronLeftIcon,
    ClipboardCheckIcon,
    SaveIcon,
    PrinterIcon,
    UserPlusIcon,
    ScreenShareIcon,
    PictureInPictureIcon,
    StopIcon,
    BotIcon,
    SparklesIcon,
    DownloadIcon
} from '../../../components/Icons';
import { useNavigate } from 'react-router-dom';
import MockDicomViewer from '../../imaging-results/views/components/MockDicomViewer';
import { usePdfPreview } from '../../../contexts/PdfPreviewContext';
import { useNotification } from '../../../contexts/NotificationContext';
import ConfirmationModal from '../../../components/shared/ConfirmationModal';
import jsPDF from 'jspdf';

// Mock participants
const initialParticipants = [
    { id: 1, name: 'GS. Nguyễn Văn B (Chủ tọa)', role: 'Host', img: 'https://ui-avatars.com/api/?name=Nguyen+Van+B&background=0D8ABC&color=fff' },
    { id: 2, name: 'BS. Trần Văn A (Báo cáo)', role: 'Guest', img: 'https://ui-avatars.com/api/?name=Tran+Van+A&background=6366f1&color=fff' },
];

const LiveRoomView: React.FC = () => {
    const navigate = useNavigate();
    const { addNotification } = useNotification();
    
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const screenStreamRef = useRef<MediaStream | null>(null);
    const webcamStreamRef = useRef<MediaStream | null>(null);
    
    const [isAIActive, setIsAIActive] = useState(false);
    const [isExitModalOpen, setIsExitModalOpen] = useState(false);
    const [mainViewMode, setMainViewMode] = useState<'grid' | 'presentation'>('grid');
    const [activeTab, setActiveTab] = useState<'records' | 'pacs' | 'chat' | 'minutes'>('minutes');

    // Camera Init
    useEffect(() => {
        const startCamera = async () => {
            try {
                if (!isVideoOff && !isScreenSharing) {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                    webcamStreamRef.current = stream; 
                    setLocalStream(stream);
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = stream;
                    }
                } else if (isVideoOff) {
                    if (webcamStreamRef.current) {
                        webcamStreamRef.current.getTracks().forEach(track => track.stop());
                        webcamStreamRef.current = null;
                    }
                    if (localStream && !isScreenSharing) { 
                        setLocalStream(null);
                    }
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
            }
        };
        startCamera();
        return () => {
            if (webcamStreamRef.current) webcamStreamRef.current.getTracks().forEach(track => track.stop());
        };
    }, [isVideoOff]); 

    useEffect(() => {
        if (localVideoRef.current) {
             if (isScreenSharing && screenStreamRef.current) {
                 localVideoRef.current.srcObject = screenStreamRef.current;
             } else if (localStream) {
                 localVideoRef.current.srcObject = localStream;
             } else {
                 localVideoRef.current.srcObject = null;
             }
        }
    }, [localStream, isScreenSharing]); 

    // --- Screen Share Fix ---
    const handleScreenShare = async () => {
        if (!navigator.mediaDevices || !(navigator.mediaDevices as any).getDisplayMedia) {
             addNotification('Lỗi', 'Trình duyệt không hỗ trợ chia sẻ màn hình.', 'error', undefined, true);
             return;
        }

        try {
            if (!isScreenSharing) {
                const stream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
                screenStreamRef.current = stream;
                setIsScreenSharing(true);
                
                stream.getVideoTracks()[0].onended = () => {
                    stopScreenShare();
                };

                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
            } else {
                stopScreenShare();
            }
        } catch (err) {
            console.error("Error sharing screen:", err);
        }
    };

    const stopScreenShare = () => {
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
            screenStreamRef.current = null;
        }
        setIsScreenSharing(false);
        if (localVideoRef.current && !isVideoOff && webcamStreamRef.current) {
            localVideoRef.current.srcObject = webcamStreamRef.current;
            setLocalStream(webcamStreamRef.current); 
        }
    };

    const handleExitClick = () => setIsExitModalOpen(true);
    const confirmExit = () => {
        if (webcamStreamRef.current) webcamStreamRef.current.getTracks().forEach(t => t.stop());
        if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach(t => t.stop());
        navigate('/telemedicine/dashboard');
    };

    return (
        <div className="fixed inset-0 z-[60] bg-slate-900 text-white flex flex-col font-sans">
            <div className="h-14 bg-slate-800 border-b border-slate-700 flex justify-between items-center px-4 shrink-0 shadow-md z-50">
                <div className="flex items-center gap-4">
                    <button onClick={confirmExit} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
                        <ChevronLeftIcon className="w-6 h-6"/>
                    </button>
                    <div className="flex items-center gap-2 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/30">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        <span className="font-bold text-red-400 text-xs uppercase tracking-wider">Live</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleExitClick} className="p-2 bg-red-600/80 hover:bg-red-600 rounded-full transition text-white shadow-lg">
                        <PhoneMissedCallIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative">
                <div className="flex-1 bg-black relative flex flex-col overflow-hidden">
                    <div className="flex-1 p-4 grid grid-cols-2 gap-4 overflow-y-auto content-center max-w-6xl mx-auto w-full h-full">
                         {initialParticipants.map(p => (
                            <div key={p.id} className="relative bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-lg aspect-video">
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-700">
                                    <img src={p.img} className="w-24 h-24 rounded-full opacity-50 shadow-xl"/>
                                </div>
                                <div className="absolute bottom-0 left-0 w-full p-3 bg-gradient-to-t from-black/90 to-transparent">
                                    <p className="font-bold text-sm text-white">{p.name}</p>
                                </div>
                            </div>
                        ))}
                        <div className={`relative bg-slate-800 rounded-xl overflow-hidden border-2 border-blue-500 shadow-lg aspect-video ${isScreenSharing ? 'ring-2 ring-green-500' : ''}`}>
                            {(!isVideoOff || isScreenSharing) ? (
                                <video ref={localVideoRef} autoPlay muted className={`w-full h-full object-cover ${isScreenSharing ? '' : 'transform scale-x-[-1]'}`} />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                                    <span className="text-xs uppercase font-bold text-slate-500">Video Off</span>
                                </div>
                            )}
                            <div className="absolute bottom-2 left-3 text-xs font-bold text-blue-400 bg-black/50 px-2 py-0.5 rounded">
                                {isScreenSharing ? 'Bạn (Chia sẻ)' : 'Bạn'}
                            </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="h-16 bg-slate-900/90 backdrop-blur border-t border-slate-700 flex justify-center items-center gap-4 shrink-0 z-30 absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full px-8 shadow-2xl">
                        <button onClick={() => setIsMuted(!isMuted)} className={`p-3 rounded-full transition-all ${isMuted ? 'bg-red-600' : 'bg-slate-700'}`}>
                            {isMuted ? <MicrophoneOffIcon className="w-5 h-5"/> : <MicrophoneIcon className="w-5 h-5"/>}
                        </button>
                        <button onClick={() => setIsVideoOff(!isVideoOff)} className={`p-3 rounded-full transition-all ${isVideoOff ? 'bg-red-600' : 'bg-slate-700'}`}>
                            <VideoCameraIcon className="w-5 h-5"/>
                        </button>
                        <button onClick={handleScreenShare} className={`p-3 rounded-full transition-all ${isScreenSharing ? 'bg-green-600' : 'bg-slate-700'}`}>
                            {isScreenSharing ? <StopIcon className="w-5 h-5"/> : <ScreenShareIcon className="w-5 h-5"/>}
                        </button>
                        <button onClick={handleExitClick} className="px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-2">
                            <PhoneMissedCallIcon className="w-5 h-5"/> Kết thúc
                        </button>
                    </div>
                </div>
            </div>

            <ConfirmationModal 
                isOpen={isExitModalOpen}
                onClose={() => setIsExitModalOpen(false)}
                onConfirm={confirmExit}
                title="Kết thúc Hội chẩn"
                message="Bạn có chắc chắn muốn kết thúc phiên hội chẩn này không?"
            />
        </div>
    );
};

export default LiveRoomView;
