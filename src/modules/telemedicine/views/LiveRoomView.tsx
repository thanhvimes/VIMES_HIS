
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
    CheckCircleIcon,
    SearchIcon,
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

// Mock participants currently in room
const initialParticipants = [
    { id: 1, name: 'GS. Nguyễn Văn B (Chủ tọa)', role: 'Host', img: 'https://ui-avatars.com/api/?name=Nguyen+Van+B&background=0D8ABC&color=fff' },
    { id: 2, name: 'BS. Trần Văn A (Báo cáo)', role: 'Guest', img: 'https://ui-avatars.com/api/?name=Tran+Van+A&background=6366f1&color=fff' },
];

// Mock available doctors to invite
const availableDoctors = [
    { id: 3, name: 'BS. CĐHA Phạm Văn C', dept: 'Chẩn đoán hình ảnh', status: 'online', img: 'https://ui-avatars.com/api/?name=Pham+Van+C&background=10b981&color=fff' },
    { id: 4, name: 'TS. Lê Thị D', dept: 'Ung bướu', status: 'busy', img: 'https://ui-avatars.com/api/?name=Le+Thi+D&background=f43f5e&color=fff' },
    { id: 'BS. Hoàng Văn E', name: 'BS. Hoàng Văn E', dept: 'Ngoại lồng ngực', status: 'offline', img: 'https://ui-avatars.com/api/?name=Hoang+Van+E&background=64748b&color=fff' },
];

// Mock PACS Series
const mockPacsSeries = [
    { 
        id: 'S01', 
        name: 'CT Ngực - Cửa sổ phổi (Axial)', 
        modality: 'CT', 
        date: '20/11/2023', 
        thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/e/ee/CT_scan_of_the_chest.jpg' 
    },
    { 
        id: 'S02', 
        name: 'MRI Sọ não (T2 FLAIR)', 
        modality: 'MRI', 
        date: '20/11/2023', 
        thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/5/50/Computed_tomography_of_human_brain_-_large.png' 
    }, 
    { 
        id: 'S03', 
        name: 'X-Quang Ngực thẳng (PA)', 
        modality: 'CR', 
        date: '19/11/2023', 
        thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/a/a1/Normal_posteroanterior_%28PA%29_chest_radiograph_%28X-ray%29.jpg' 
    },
];

// Simulated Transcript Data for Fallback
const simulatedTranscript = [
    "GS. B: Chào các bác sĩ, chúng ta bắt đầu hội chẩn ca bệnh Lê Hoàng Cường.",
    "BS. A: Bệnh nhân nam, 45 tuổi, nhập viện vì ho kéo dài và đau ngực phải.",
    "BS. A: Hình ảnh CT ngực cho thấy khối u thùy trên phổi phải kích thước 5x6cm.",
    "GS. B: Khối u có xâm lấn trung thất không?",
    "BS. A: Dạ có thưa thầy, xâm lấn nhẹ vào trung thất, chưa thấy hạch di căn xa.",
    "GS. B: Tiền sử bệnh nhân thế nào?",
    "BS. A: Bệnh nhân hút thuốc lá 20 năm, có COPD nhẹ.",
    "GS. B: Tôi đề nghị làm thêm MRI sọ não để kiểm tra di căn não.",
    "BS. A: Vâng, em sẽ cho chỉ định ngay.",
    "GS. B: Ngoài ra cần sinh thiết kim dưới hướng dẫn CT để xác định mô bệnh học.",
    "BS. A: Dạ rõ. Hướng điều trị dự kiến thế nào ạ?",
    "GS. B: Nếu giải phẫu bệnh là ung thư phổi không tế bào nhỏ, ta sẽ hội chẩn lại để xem xét phẫu thuật hay hóa trị tân bổ trợ.",
];

// --- INVITE MODAL COMPONENT ---
const InviteModal = ({ isOpen, onClose, roomId }: { isOpen: boolean; onClose: () => void; roomId: string }) => {
    const [activeTab, setActiveTab] = useState<'internal' | 'link'>('internal');
    const [searchTerm, setSearchTerm] = useState('');
    const [invitedIds, setInvitedIds] = useState<number[]>([]); // Store IDs as number or string depending on usage
    const { addNotification } = useNotification();

    const inviteLink = `${window.location.origin}/telemedicine/live/${roomId}`;

    if (!isOpen) return null;

    const handleInvite = (doc: any) => {
        setInvitedIds(prev => [...prev, doc.id]);
        addNotification('Đã gửi lời mời', `Đang gọi bác sĩ ${doc.name}...`, 'info', undefined, true);
    };

    const copyLink = () => {
        navigator.clipboard.writeText(inviteLink);
        addNotification('Đã sao chép', 'Link tham gia đã được lưu vào clipboard.', 'success', undefined, true);
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-slate-800 w-full max-w-md rounded-xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-slate-900">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <UserPlusIcon className="w-5 h-5 text-blue-500"/> Mời tham gia hội chẩn
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition"><XIcon className="w-5 h-5"/></button>
                </div>

                <div className="flex border-b border-slate-700">
                    <button 
                        onClick={() => setActiveTab('internal')}
                        className={`flex-1 py-3 text-sm font-bold transition ${activeTab === 'internal' ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-700/50' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        Nội bộ bệnh viện
                    </button>
                    <button 
                        onClick={() => setActiveTab('link')}
                        className={`flex-1 py-3 text-sm font-bold transition ${activeTab === 'link' ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-700/50' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        Chia sẻ liên kết
                    </button>
                </div>

                <div className="p-4 min-h-[300px]">
                    {activeTab === 'internal' ? (
                        <div className="space-y-4">
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-500"/>
                                <input 
                                    type="text" 
                                    placeholder="Tìm bác sĩ..." 
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2 pl-9 text-sm text-white focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar">
                                {availableDoctors.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase())).map(doc => {
                                    const isInvited = invitedIds.includes(doc.id as any);
                                    return (
                                        <div key={doc.id} className="flex items-center justify-between p-2 hover:bg-slate-700 rounded-lg transition">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <img src={doc.img} className="w-10 h-10 rounded-full" alt=""/>
                                                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-800 ${doc.status === 'online' ? 'bg-green-500' : doc.status === 'busy' ? 'bg-red-500' : 'bg-slate-500'}`}></span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">{doc.name}</p>
                                                    <p className="text-xs text-slate-400">{doc.dept}</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => !isInvited && handleInvite(doc)}
                                                disabled={isInvited}
                                                className={`px-3 py-1.5 rounded text-xs font-bold transition ${isInvited ? 'bg-slate-600 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                                            >
                                                {isInvited ? 'Đã mời' : 'Mời'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full space-y-6 py-4">
                            <div className="bg-white p-2 rounded-xl shadow-lg">
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(inviteLink)}`} 
                                    alt="QR Code" 
                                    className="w-40 h-40 object-contain"
                                />
                            </div>
                            <div className="text-center space-y-1">
                                <p className="text-white font-bold">Quét mã để tham gia</p>
                                <p className="text-xs text-slate-400">Hoặc chia sẻ đường dẫn bên dưới</p>
                            </div>
                            <div className="flex w-full gap-2">
                                <input 
                                    type="text" 
                                    value={inviteLink} 
                                    readOnly
                                    className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none truncate"
                                />
                                <button onClick={copyLink} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition">
                                    Copy
                                </button>
                            </div>
                            <div className="text-xs text-slate-500">
                                * Đường dẫn sẽ hết hạn sau khi kết thúc phiên hội chẩn.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const LiveRoomView: React.FC = () => {
    const navigate = useNavigate();
    const { openPdf } = usePdfPreview();
    const { addNotification } = useNotification();
    
    // Media State
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const screenStreamRef = useRef<MediaStream | null>(null);
    const webcamStreamRef = useRef<MediaStream | null>(null); // Store original webcam
    
    // AI Scribe State
    const [isAIActive, setIsAIActive] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false); // New state for analysis loading
    const [recognition, setRecognition] = useState<any>(null);
    const transcriptIndexRef = useRef(0);

    // Layout State
    const [activeTab, setActiveTab] = useState<'records' | 'pacs' | 'chat' | 'minutes'>('minutes');
    const [mainViewMode, setMainViewMode] = useState<'grid' | 'presentation'>('grid');
    const [selectedSeries, setSelectedSeries] = useState(mockPacsSeries[0]);
    const [isExitModalOpen, setIsExitModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    
    const [chatMessage, setChatMessage] = useState('');
    const [participants, setParticipants] = useState(initialParticipants);

    // Room Info
    const roomId = "ROOM-8829-X9";
    const patientInfo = { name: 'Lê Hoàng Cường', id: 'P003', age: 45, gender: 'Nam' };

    // Minutes State
    const [minutesData, setMinutesData] = useState({
        diagnosis: 'TD U phổi phải / COPD',
        discussion: '- Hình ảnh CT cho thấy khối u kích thước 5x6cm thùy trên phổi phải.\n- Xâm lấn trung thất, chưa thấy di căn xa.\n- Bệnh nhân có tiền sử COPD.',
        conclusion: '',
        plan: ''
    });

    // Prevent accidental close
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = ''; 
            return '';
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    // --- Camera Initialization ---
    useEffect(() => {
        const startCamera = async () => {
            try {
                if (!isVideoOff && !isScreenSharing) {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                    webcamStreamRef.current = stream; // Store ref to original webcam
                    setLocalStream(stream);
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = stream;
                    }
                } else if (isVideoOff) {
                    // Stop tracks if video turned off explicitly by user
                    if (webcamStreamRef.current) {
                        webcamStreamRef.current.getTracks().forEach(track => track.stop());
                        webcamStreamRef.current = null;
                    }
                    if (localStream && !isScreenSharing) { // Only clear if not sharing screen
                        setLocalStream(null);
                    }
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
            }
        };

        startCamera();

        return () => {
            if (webcamStreamRef.current) {
                webcamStreamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [isVideoOff]); // Depend on isVideoOff mostly

    // --- Update Local Video Element ---
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
    }, [localStream, isScreenSharing, mainViewMode]); // Removed activeTab to prevent re-renders

    // --- Screen Share Handling ---
    const handleScreenShare = async () => {
        try {
            if (!isScreenSharing) {
                // Start Sharing
                const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                screenStreamRef.current = stream;
                setIsScreenSharing(true);
                
                // Handle stop sharing from browser UI (native "Stop sharing" button)
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
        // Revert to webcam if active
        if (localVideoRef.current && !isVideoOff && webcamStreamRef.current) {
            localVideoRef.current.srcObject = webcamStreamRef.current;
            setLocalStream(webcamStreamRef.current); // Ensure state matches
        }
    };

    // --- AI Scribe Handling ---
    useEffect(() => {
        // Initialize Speech Recognition
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        
        if (SpeechRecognition) {
            const recognitionInstance = new SpeechRecognition();
            recognitionInstance.continuous = true;
            recognitionInstance.interimResults = true;
            recognitionInstance.lang = 'vi-VN';

            // Add error handler to prevent uncaught exceptions in console
            recognitionInstance.onerror = (event: any) => {
                if (event.error === 'no-speech' || event.error === 'aborted') return;
                console.warn("AI Scribe Error:", event.error);
            };
            
            recognitionInstance.onresult = (event: any) => {
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        const text = event.results[i][0].transcript;
                        // Append to minutes (Simple implementation)
                        setMinutesData(prev => ({
                            ...prev,
                            discussion: prev.discussion + '\n- ' + text
                        }));
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
            };
            
            setRecognition(recognitionInstance);
        }
    }, []);

    // Simulation for AI if no speech API or just for demo
    useEffect(() => {
        let interval: any;
        if (isAIActive) {
            // 1. Try to start real recognition
            if (recognition) {
                try {
                    recognition.start();
                } catch (e) { /* Ignore if already started */ }
            }

            // 2. ALSO start simulation for demo purposes (in case mic is silent or API fails)
            interval = setInterval(() => {
                if (transcriptIndexRef.current < simulatedTranscript.length) {
                    const line = simulatedTranscript[transcriptIndexRef.current];
                    setMinutesData(prev => ({
                        ...prev,
                        discussion: prev.discussion + (prev.discussion ? '\n' : '') + line
                    }));
                    transcriptIndexRef.current++;
                    
                }
            }, 3000); // Add a line every 3 seconds
        } else {
            if (recognition) {
                try {
                    recognition.stop();
                } catch (e) { /* Ignore */ }
            }
        }

        return () => clearInterval(interval);
    }, [isAIActive, recognition]);


    const toggleAI = () => {
        setIsAIActive(!isAIActive);
        if (!isAIActive) {
            addNotification('Trợ lý AI đã bật', 'AI đang lắng nghe và ghi chép cuộc hội chẩn...', 'success', undefined, true);
            setActiveTab('minutes'); // Switch to minutes view to see result
        } else {
            addNotification('Trợ lý AI đã tắt', 'Đã dừng ghi chép tự động.', 'info', undefined, true);
        }
    };

    // --- AI Analyze Function ---
    const handleAIAnalyze = () => {
        if (!minutesData.discussion) {
             addNotification('Lỗi', 'Chưa có nội dung thảo luận để phân tích.', 'error');
             return;
        }
        
        setIsAnalyzing(true);
        // Simulate AI processing
        setTimeout(() => {
            setMinutesData(prev => ({
                ...prev,
                diagnosis: prev.diagnosis.includes('(AI)') ? prev.diagnosis : `${prev.diagnosis} (Xác nhận bởi AI)`,
                conclusion: '1. Thống nhất chẩn đoán U phổi phải xâm lấn trung thất.\n2. Cần làm thêm cận lâm sàng: MRI Sọ não để loại trừ di căn, Sinh thiết kim dưới hướng dẫn CT để xác định mô bệnh học.\n3. Hội chẩn lại sau khi có kết quả giải phẫu bệnh.',
                plan: '- Chuyển người bệnh sang khoa Ung bướu điều trị.\n- Hẹn lịch sinh thiết vào ngày mai.\n- Theo dõi sát tình trạng hô hấp và giảm đau cho người bệnh.'
            }));
            setIsAnalyzing(false);
            addNotification('Hoàn tất', 'AI đã tổng hợp biên bản hội chẩn thành công.', 'success');
        }, 2000);
    };


    // --- PiP Handling ---
    const togglePiP = async () => {
        try {
            if (localVideoRef.current && document.pictureInPictureElement !== localVideoRef.current) {
                await localVideoRef.current.requestPictureInPicture();
            } else {
                await document.exitPictureInPicture();
            }
        } catch (err) {
            console.error("Error with PiP:", err);
            addNotification('Lỗi', 'Trình duyệt không hỗ trợ PiP hoặc video chưa sẵn sàng.', 'error', undefined, true);
        }
    };

    const handleExitClick = () => {
        setIsExitModalOpen(true);
    };
    
    const handleBack = () => {
         cleanupMedia();
         navigate('/telemedicine/dashboard');
    };

    const confirmExit = () => {
        cleanupMedia();
        navigate('/telemedicine/dashboard');
    };

    const cleanupMedia = () => {
        if (webcamStreamRef.current) {
             webcamStreamRef.current.getTracks().forEach(track => track.stop());
        }
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        if (screenStreamRef.current) {
             screenStreamRef.current.getTracks().forEach(track => track.stop());
        }
        if (recognition) {
            try { recognition.stop(); } catch(e) {}
        }
    };

    const handleSelectSeries = (series: typeof mockPacsSeries[0]) => {
        setSelectedSeries(series);
        setMainViewMode('presentation');
    };

    const switchToGrid = () => {
        setMainViewMode('grid');
    };

    // --- Report Generation ---
    const generateMinutesPdf = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const margin = 20;
        let y = 20;

        // Header
        doc.setFontSize(14);
        doc.setTextColor(0, 100, 200);
        doc.setFont("helvetica", "bold");
        doc.text("BỆNH VIỆN ĐA KHOA QUỐC TẾ VIMES", margin, y);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.setFont("helvetica", "normal");
        y += 6;
        doc.text("Trung tâm Hội chẩn Từ xa (Telehealth Center)", margin, y);
        
        y += 10;
        doc.setDrawColor(200);
        doc.line(margin, y, pageWidth - margin, y);
        y += 15;

        // Title
        doc.setFontSize(18);
        doc.setTextColor(0);
        doc.setFont("helvetica", "bold");
        doc.text("BIÊN BẢN HỘI CHẨN TỪ XA", pageWidth / 2, y, { align: "center" });
        y += 8;
        doc.setFontSize(12);
        doc.text(`Mã phiên: ${roomId}`, pageWidth / 2, y, { align: "center" });
        y += 15;

        // Patient Info
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("I. THÔNG TIN BỆNH NHÂN", margin, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        doc.text(`Họ tên: ${patientInfo.name} - Tuổi: ${patientInfo.age} - Giới tính: ${patientInfo.gender}`, margin + 5, y);
        y += 6;
        doc.text(`Mã BN: ${patientInfo.id}`, margin + 5, y);
        y += 10;

        // Participants
        doc.setFont("helvetica", "bold");
        doc.text("II. THÀNH PHẦN THAM GIA", margin, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        participants.forEach(p => {
            doc.text(`- ${p.name} (${p.role})`, margin + 5, y);
            y += 5;
        });
        y += 5;

        // Clinical Content
        const printSection = (title: string, content: string) => {
            if (y > 270) { doc.addPage(); y = 20; }
            doc.setFont("helvetica", "bold");
            doc.text(title, margin, y);
            y += 6;
            doc.setFont("helvetica", "normal");
            const lines = doc.splitTextToSize(content, pageWidth - margin * 2 - 10);
            doc.text(lines, margin + 5, y);
            y += lines.length * 5 + 8;
        };

        printSection("III. CHẨN ĐOÁN SƠ BỘ", minutesData.diagnosis);
        printSection("IV. TÓM TẮT THẢO LUẬN", minutesData.discussion);
        printSection("V. KẾT LUẬN CỦA HỘI ĐỒNG", minutesData.conclusion);
        printSection("VI. KẾ HOẠCH ĐIỀU TRỊ", minutesData.plan);

        // Signature
        if (y > 240) { doc.addPage(); y = 20; }
        y += 10;
        const rightColX = pageWidth - 60;
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.text(`Ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`, rightColX, y, { align: 'center' });
        y += 5;
        doc.setFont("helvetica", "bold");
        doc.text("THƯ KÝ HỘI CHẨN", rightColX, y, { align: 'center' });
        y += 25;
        doc.text(participants[1].name.split('.')[1] || "Thư ký", rightColX, y, { align: 'center' });

        return URL.createObjectURL(doc.output('blob'));
    };

    const handlePrintMinutes = () => {
        const pdfUrl = generateMinutesPdf();
        openPdf({
            url: pdfUrl,
            fileName: `BienBan_HoiChan_${roomId}.pdf`,
            isSignable: true
        });
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
                    {isAIActive && (
                         <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-indigo-900/50 border border-indigo-500/30 rounded-full">
                             <div className="flex gap-1 items-end h-3">
                                 <span className="w-0.5 h-1 bg-indigo-400 animate-[bounce_1s_infinite]"></span>
                                 <span className="w-0.5 h-2 bg-indigo-400 animate-[bounce_1.2s_infinite]"></span>
                                 <span className="w-0.5 h-1.5 bg-indigo-400 animate-[bounce_0.8s_infinite]"></span>
                             </div>
                             <span className="text-[10px] text-indigo-300 font-bold uppercase">AI Scribe Listening...</span>
                         </div>
                    )}

                    <button 
                        onClick={() => setIsInviteModalOpen(true)}
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
                
                {/* LEFT: Main Stage */}
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
                            
                            {/* Self View (or Screen Share) */}
                            <div className={`relative bg-slate-800 rounded-xl overflow-hidden border-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] aspect-video ${isScreenSharing ? 'ring-2 ring-green-500' : ''}`}>
                                {(!isVideoOff || isScreenSharing) ? (
                                    <video 
                                        ref={localVideoRef} 
                                        autoPlay 
                                        muted 
                                        className={`w-full h-full object-cover ${isScreenSharing ? '' : 'transform scale-x-[-1]'}`} 
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10 backdrop-blur-sm">
                                        <div className="text-slate-500 flex flex-col items-center">
                                            <VideoCameraIcon className="w-12 h-12 mb-2 opacity-50"/>
                                            <span className="text-xs uppercase tracking-widest font-bold">Video Off</span>
                                        </div>
                                    </div>
                                )}
                                <div className="absolute bottom-2 left-3 text-xs font-bold text-blue-400 bg-black/50 px-2 py-0.5 rounded">
                                    {isScreenSharing ? 'Bạn (Đang chia sẻ màn hình)' : 'Bạn (BS. Minh)'}
                                </div>
                                <div className="absolute bottom-3 right-3 w-3 h-3 bg-green-500 rounded-full ring-2 ring-black animate-pulse"></div>
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
                                <div className="w-40 h-24 bg-black rounded-lg border border-blue-500/50 relative overflow-hidden flex-shrink-0">
                                    {(!isVideoOff || isScreenSharing) && (
                                         <video 
                                            ref={localVideoRef} 
                                            autoPlay 
                                            muted 
                                            className={`w-full h-full object-cover ${isScreenSharing ? '' : 'transform scale-x-[-1]'}`} 
                                        />
                                    )}
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                                        <p className="text-[10px] text-blue-400">{isScreenSharing ? 'Màn hình của bạn' : 'Bạn'}</p>
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
                        
                        {/* Advanced Features */}
                        <button 
                            onClick={handleScreenShare}
                            className={`p-3 rounded-full transition-all ${isScreenSharing ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                            title={isScreenSharing ? "Dừng chia sẻ" : "Chia sẻ màn hình"}
                        >
                            {isScreenSharing ? <StopIcon className="w-5 h-5"/> : <ScreenShareIcon className="w-5 h-5"/>}
                        </button>

                        <div className="w-px h-8 bg-slate-700 mx-1"></div>

                        <button 
                            onClick={toggleAI}
                            className={`p-3 rounded-full transition-all ${isAIActive ? 'bg-indigo-600 hover:bg-indigo-700 text-white ring-2 ring-indigo-400' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                            title={isAIActive ? "Tắt Thư ký AI" : "Bật Thư ký AI"}
                        >
                            <BotIcon className="w-5 h-5"/>
                        </button>

                        <button 
                            onClick={togglePiP}
                            className="p-3 bg-slate-700 hover:bg-slate-600 rounded-full text-white transition-all"
                            title="Ghim Video (Picture-in-Picture)"
                        >
                            <PictureInPictureIcon className="w-5 h-5"/>
                        </button>
                        
                        <div className="w-px h-8 bg-slate-700 mx-1"></div>

                        <button 
                            onClick={() => setIsInviteModalOpen(true)}
                            className="p-3 bg-slate-700 hover:bg-slate-600 rounded-full text-white transition-all"
                            title="Mời thành viên"
                        >
                            <UserPlusIcon className="w-5 h-5"/>
                        </button>

                        <button 
                            onClick={handleExitClick}
                            className="px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all font-bold flex items-center gap-2 shadow-lg hover:shadow-red-900/30"
                        >
                            <PhoneMissedCallIcon className="w-5 h-5"/> <span className="hidden sm:inline">Kết thúc</span>
                        </button>
                    </div>
                </div>

                {/* RIGHT: Sidebar (Tools & Chat) */}
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
                        {activeTab === 'minutes' && (
                            <div className="space-y-4 animate-fade-in h-full flex flex-col">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                        Biên bản hội chẩn
                                        {isAIActive && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" title="AI đang ghi chép"></span>}
                                    </h3>
                                    <div className="flex gap-2">
                                        <button onClick={handleAIAnalyze} className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition" title="AI Tóm tắt & Đề xuất">
                                            {isAnalyzing ? (
                                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <SparklesIcon className="w-3 h-3"/>
                                            )}
                                            {isAnalyzing ? 'Đang xử lý...' : 'AI Phân tích'}
                                        </button>
                                        <button onClick={toggleAI} className={`p-1 rounded ${isAIActive ? 'text-indigo-400 bg-indigo-900/50' : 'text-slate-500 hover:text-white'}`} title="Bật/Tắt AI Scribe">
                                            <BotIcon className="w-4 h-4"/>
                                        </button>
                                        <button onClick={handlePrintMinutes} className="text-blue-400 hover:text-blue-300 p-1" title="In biên bản">
                                            <PrinterIcon className="w-4 h-4"/>
                                        </button>
                                    </div>
                                </div>

                                {isAIActive && (
                                    <div className="bg-indigo-900/20 border border-indigo-500/30 rounded p-3 text-xs text-indigo-300 flex items-center gap-2 mb-2">
                                        <BotIcon className="w-4 h-4 flex-shrink-0"/>
                                        <span>AI đang lắng nghe và tự động ghi chép...</span>
                                    </div>
                                )}

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
                                        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Tóm tắt thảo luận {isAIActive && '(Live Transcript)'}</label>
                                        <textarea 
                                            value={minutesData.discussion}
                                            onChange={e => setMinutesData({...minutesData, discussion: e.target.value})}
                                            className={`w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none resize-none h-48 leading-relaxed ${isAIActive ? 'border-indigo-500/50 shadow-inner' : ''}`}
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
                                <div className="flex gap-2 shrink-0">
                                    <button 
                                        onClick={handlePrintMinutes} 
                                        className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold text-sm shadow-lg flex items-center justify-center gap-2"
                                    >
                                        <DownloadIcon className="w-4 h-4"/> Xuất PDF
                                    </button>
                                    <button className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm shadow-lg flex items-center justify-center gap-2">
                                        <SaveIcon className="w-4 h-4"/> Lưu Biên bản
                                    </button>
                                </div>
                            </div>
                        )}

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
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
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
                                <button className="w-full py-2 border border-slate-600 rounded text-slate-400 hover:text-white hover:border-slate-400 text-xs font-bold transition">
                                    Xem bệnh án chi tiết (EMR)
                                </button>
                            </div>
                        )}

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
            
            {/* INVITE MODAL */}
            <InviteModal 
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                roomId={roomId}
            />
        </div>
    );
};

export default LiveRoomView;
