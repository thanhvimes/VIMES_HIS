
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ChevronLeftIcon, 
    ClockIcon, 
    UserGroupIcon, 
    ClipboardCheckIcon, 
    CubeIcon, 
    DocumentTextIcon, 
    PlayIcon,
    CheckCircleIcon,
    SyringeIcon,
    KnifeIcon,
    BandageIcon,
    CameraIcon,
    TrashIcon,
    XIcon,
    SaveIcon,
    ActivityIcon
} from '../../../components/Icons';
import { SurgerySchedule } from '../../../types';
import SafetyChecklistModal from './components/SafetyChecklistModal';
import ConsumableInput from './components/ConsumableInput';
import { useTheme } from '../../../contexts/ThemeContext';
import { mockSurgeries } from '../data';
import ImageCaptureModal from '../../imaging-results/views/components/ImageCaptureModal';

type SurgeryStage = 'pre-op' | 'anesthesia' | 'incision' | 'closing' | 'recovery' | 'finished';

interface CapturedImage {
    id: string;
    url: string;
    timestamp: string;
    isSelected: boolean;
}

const SurgeryDetailView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { fontSettings } = useTheme();
    
    // State
    const [surgery, setSurgery] = useState<SurgerySchedule | null>(null);
    const [activeTab, setActiveTab] = useState<'info' | 'checklist' | 'consumables' | 'report'>('info');
    const [stage, setStage] = useState<SurgeryStage>('pre-op');
    const [elapsedTime, setElapsedTime] = useState(0); 
    
    // Report State
    const [reportText, setReportText] = useState('');
    const [images, setImages] = useState<CapturedImage[]>([]);
    const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
    const [viewImage, setViewImage] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            const data = mockSurgeries.find(s => s.id === id) || null;
            setSurgery(data);
            if (data) {
                // Initialize report text from mock notes if available
                setReportText(data.notes || '');
            }
        }
    }, [id]);

    // Timer logic
    useEffect(() => {
        let interval: any;
        if (stage !== 'pre-op' && stage !== 'finished') {
            interval = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [stage]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    const advanceStage = () => {
        const stages: SurgeryStage[] = ['pre-op', 'anesthesia', 'incision', 'closing', 'recovery', 'finished'];
        const currentIndex = stages.indexOf(stage);
        if (currentIndex < stages.length - 1) {
            setStage(stages[currentIndex + 1]);
        }
    };

    const handleCaptureSave = (newImages: any[]) => {
        // Map ImageCaptureModal type to local type
        const mappedImages = newImages.map(img => ({
            id: img.id,
            url: img.url,
            timestamp: img.timestamp,
            isSelected: true
        }));
        setImages(prev => [...prev, ...mappedImages]);
    };

    const handleDeleteImage = (id: string) => {
        if(window.confirm("Xóa ảnh này?")) {
            setImages(prev => prev.filter(i => i.id !== id));
        }
    };

    const getStageColor = (s: SurgeryStage) => {
        const stages: SurgeryStage[] = ['pre-op', 'anesthesia', 'incision', 'closing', 'recovery', 'finished'];
        const currentIdx = stages.indexOf(stage);
        const targetIdx = stages.indexOf(s);
        
        if (targetIdx < currentIdx) return 'bg-green-500 text-white border-green-500';
        if (targetIdx === currentIdx) return 'bg-blue-600 text-white border-blue-600 animate-pulse';
        return 'bg-white dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-600';
    };

    const InfoRow = ({ label, value, highlight = false }: { label: string, value?: string, highlight?: boolean }) => (
        <div className="flex flex-col py-2 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">{label}</span>
            <span className={`text-sm ${highlight ? 'font-bold text-blue-700 dark:text-blue-400' : 'font-medium text-slate-800 dark:text-slate-200'}`}>
                {value || '---'}
            </span>
        </div>
    );

    if (!surgery) return <div className="p-8 text-center text-slate-500">Đang tải dữ liệu...</div>;

    return (
        <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-900 overflow-hidden">
            
            {/* 1. Top Header */}
            <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm z-20">
                <div className="flex flex-col lg:flex-row justify-between items-center px-6 py-3 gap-4">
                    <div className="flex items-center gap-4 w-full lg:w-auto">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition">
                            <ChevronLeftIcon className="w-6 h-6 text-slate-600 dark:text-slate-300"/>
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2 flex-wrap">
                                {surgery.procedureName}
                                <span className="text-sm font-normal bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                                    {surgery.roomId}
                                </span>
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-3 flex-wrap">
                                <span className="font-bold text-slate-700 dark:text-slate-300">{surgery.patientName}</span>
                                <span>ID: <span className="font-mono">{surgery.patientId}</span></span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 w-full lg:w-auto justify-between lg:justify-end">
                        <div className="text-right">
                            <div className="text-xs font-bold text-slate-400 uppercase">Thời gian mổ</div>
                            <div className={`text-3xl font-mono font-bold ${stage === 'finished' ? 'text-green-600' : 'text-red-600'}`}>
                                {formatTime(elapsedTime)}
                            </div>
                        </div>
                        
                        {stage !== 'finished' ? (
                            <button 
                                onClick={advanceStage}
                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg transition transform active:scale-95 whitespace-nowrap"
                            >
                                <PlayIcon className="w-5 h-5"/> 
                                {stage === 'pre-op' ? 'Bắt đầu Gây mê' : 
                                 stage === 'anesthesia' ? 'Bắt đầu Rạch da' :
                                 stage === 'incision' ? 'Bắt đầu Đóng da' :
                                 stage === 'closing' ? 'Chuyển Hồi tỉnh' : 'Kết thúc ca mổ'}
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 px-6 py-3 bg-green-100 text-green-700 border border-green-300 rounded-lg font-bold whitespace-nowrap">
                                <CheckCircleIcon className="w-6 h-6"/> Ca mổ hoàn tất
                            </div>
                        )}
                    </div>
                </div>

                {/* Workflow Bar */}
                <div className="px-6 pb-4 pt-2 overflow-x-auto">
                    <div className="flex items-center justify-between relative min-w-[600px]">
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-700 -z-10"></div>
                        {[
                            { id: 'pre-op', label: 'Chuẩn bị', icon: UserGroupIcon },
                            { id: 'anesthesia', label: 'Gây mê', icon: SyringeIcon },
                            { id: 'incision', label: 'Phẫu thuật', icon: KnifeIcon },
                            { id: 'closing', label: 'Đóng da', icon: BandageIcon },
                            { id: 'recovery', label: 'Hồi tỉnh', icon: ClockIcon },
                            { id: 'finished', label: 'Hoàn tất', icon: CheckCircleIcon }
                        ].map((s) => (
                            <div key={s.id} className="flex flex-col items-center gap-2 bg-white dark:bg-slate-800 px-2 z-10">
                                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${getStageColor(s.id as SurgeryStage)}`}>
                                    {React.createElement(s.icon, { className: "w-5 h-5" })}
                                </div>
                                <span className={`text-xs font-bold uppercase ${stage === s.id ? 'text-blue-600' : 'text-slate-400'}`}>{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 2. Main Content */}
            <div className="flex-1 flex overflow-hidden flex-col lg:flex-row">
                {/* Left Tabs */}
                <div className="w-full lg:w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible shrink-0">
                    <button 
                        onClick={() => setActiveTab('info')}
                        className={`p-4 text-left font-medium text-sm border-b-4 lg:border-b-0 lg:border-l-4 transition-colors flex items-center gap-3 whitespace-nowrap ${activeTab === 'info' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-transparent text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-400'}`}
                    >
                        <UserGroupIcon className="w-5 h-5"/> Thông tin & Ekip
                    </button>
                    <button 
                        onClick={() => setActiveTab('checklist')}
                        className={`p-4 text-left font-medium text-sm border-b-4 lg:border-b-0 lg:border-l-4 transition-colors flex items-center gap-3 whitespace-nowrap ${activeTab === 'checklist' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-transparent text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-400'}`}
                    >
                        <ClipboardCheckIcon className="w-5 h-5"/> Bảng kiểm an toàn
                    </button>
                    <button 
                        onClick={() => setActiveTab('consumables')}
                        className={`p-4 text-left font-medium text-sm border-b-4 lg:border-b-0 lg:border-l-4 transition-colors flex items-center gap-3 whitespace-nowrap ${activeTab === 'consumables' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-transparent text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-400'}`}
                    >
                        <CubeIcon className="w-5 h-5"/> Vật tư & Thuốc
                    </button>
                    <button 
                        onClick={() => setActiveTab('report')}
                        className={`p-4 text-left font-medium text-sm border-b-4 lg:border-b-0 lg:border-l-4 transition-colors flex items-center gap-3 whitespace-nowrap ${activeTab === 'report' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-transparent text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-400'}`}
                    >
                        <DocumentTextIcon className="w-5 h-5"/> Tường trình & Ảnh
                    </button>
                </div>

                {/* Right Content Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900/50">
                    <div className="max-w-6xl mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 min-h-[600px] flex flex-col">
                        
                        {activeTab === 'info' && (
                            <div className="p-8">
                                <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 pb-2">
                                    <ActivityIcon className="w-6 h-6 text-blue-600"/>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Thông tin Hành chính & Chuyên môn</h3>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-100 dark:border-slate-700 space-y-2">
                                        <InfoRow label="Chẩn đoán trước mổ" value="Viêm ruột thừa cấp giờ thứ 6" highlight />
                                        <InfoRow label="Chẩn đoán sau mổ" value="Viêm ruột thừa sung huyết, có giả mạc" />
                                        <InfoRow label="Phương pháp vô cảm" value="Gây mê nội khí quản (General Anesthesia)" />
                                        <InfoRow label="Phương pháp phẫu thuật" value="Phẫu thuật nội soi cắt ruột thừa" />
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-100 dark:border-slate-700 space-y-2">
                                        <InfoRow label="Ngày phẫu thuật" value={surgery.date} />
                                        <InfoRow label="Giờ bắt đầu (Rạch da)" value={surgery.startTime} />
                                        <InfoRow label="Giờ kết thúc (Đóng da)" value={surgery.endTime} />
                                        <InfoRow label="Phân loại" value="Phẫu thuật loại II / Sạch - Nhiễm" />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">
                                    <UserGroupIcon className="w-6 h-6 text-indigo-600"/>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Kíp phẫu thuật</h3>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                                        <h4 className="font-bold text-blue-700 dark:text-blue-400 mb-3 uppercase text-xs">Kíp Bác sĩ</h4>
                                        <InfoRow label="Phẫu thuật viên chính" value={surgery.surgeonName} highlight/>
                                        <InfoRow label="Phụ mổ 1" value="BS. Trần Thị B" />
                                        <InfoRow label="Phụ mổ 2" value="BS. Lê Văn C" />
                                        <InfoRow label="Bác sĩ gây mê" value="BS. Phạm Văn D" />
                                    </div>
                                    <div className="bg-teal-50 dark:bg-teal-900/10 p-4 rounded-lg border border-teal-100 dark:border-teal-800">
                                        <h4 className="font-bold text-teal-700 dark:text-teal-400 mb-3 uppercase text-xs">Kíp Điều dưỡng & KTV</h4>
                                        <InfoRow label="Điều dưỡng dụng cụ (Scrub)" value="ĐD. Nguyễn Thị E" />
                                        <InfoRow label="Điều dưỡng chạy ngoài (Circulating)" value="ĐD. Trần Văn F" />
                                        <InfoRow label="KTV Gây mê" value="KTV. Lê Thị G" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'checklist' && (
                            <div className="p-6 h-full">
                                <SafetyChecklistModal />
                            </div>
                        )}

                        {activeTab === 'consumables' && (
                            <div className="p-6 h-full">
                                <ConsumableInput />
                            </div>
                        )}

                        {activeTab === 'report' && (
                            <div className="flex flex-col h-full">
                                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-t-xl">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                            <DocumentTextIcon className="w-6 h-6 text-blue-600"/> Tường trình Phẫu thuật
                                        </h3>
                                        <p className="text-xs text-slate-500">Mô tả chi tiết diễn biến và hình ảnh minh họa.</p>
                                    </div>
                                    <div className="flex gap-3">
                                         <button 
                                            onClick={() => setIsCaptureModalOpen(true)}
                                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold shadow flex items-center gap-2 transition transform active:scale-95"
                                        >
                                            <CameraIcon className="w-5 h-5"/> Chụp / Tải ảnh
                                        </button>
                                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow flex items-center gap-2 transition transform active:scale-95">
                                            <SaveIcon className="w-5 h-5"/> Lưu Tường trình
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 p-6 flex flex-col lg:flex-row gap-6 overflow-hidden">
                                    {/* Left: Text Editor */}
                                    <div className="flex-1 flex flex-col gap-4 h-full overflow-y-auto pr-2">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">Cách thức phẫu thuật</label>
                                            <textarea 
                                                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 min-h-[80px]" 
                                                placeholder="Mô tả vị trí vào trocar, đường mổ..."
                                                defaultValue="Vào bụng bằng 3 trocar: rốn, hố chậu trái, hạ vị..."
                                            ></textarea>
                                        </div>
                                        <div className="flex-1 flex flex-col">
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">Diễn biến & Xử trí</label>
                                            <textarea 
                                                className="w-full p-4 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 h-full min-h-[300px] focus:ring-2 focus:ring-blue-500 font-mono text-sm leading-relaxed" 
                                                placeholder="Mô tả chi tiết..."
                                                value={reportText}
                                                onChange={(e) => setReportText(e.target.value)}
                                            ></textarea>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">Dẫn lưu & Đóng mô</label>
                                            <input type="text" className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 font-bold" defaultValue="Không đặt dẫn lưu. Khâu da." />
                                        </div>
                                    </div>

                                    {/* Right: Image Gallery */}
                                    <div className="w-full lg:w-80 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col h-full overflow-hidden">
                                        <div className="p-3 border-b border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-600 dark:text-slate-300">
                                            Hình ảnh ({images.length})
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                                            {images.length === 0 ? (
                                                <div className="text-center py-10 text-slate-400 text-xs italic">
                                                    Chưa có hình ảnh.
                                                </div>
                                            ) : (
                                                images.map((img, idx) => (
                                                    <div key={img.id} className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm bg-black">
                                                        <img 
                                                            src={img.url} 
                                                            alt={`Evidence ${idx}`} 
                                                            className="w-full h-32 object-cover opacity-90 hover:opacity-100 cursor-pointer"
                                                            onClick={() => setViewImage(img.url)}
                                                        />
                                                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button 
                                                                onClick={() => handleDeleteImage(img.id)}
                                                                className="p-1 bg-red-600 text-white rounded-full shadow hover:bg-red-700"
                                                            >
                                                                <TrashIcon className="w-3 h-3"/>
                                                            </button>
                                                        </div>
                                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-1 truncate">
                                                            {img.timestamp}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Image Capture Modal */}
            <ImageCaptureModal 
                isOpen={isCaptureModalOpen}
                onClose={() => setIsCaptureModalOpen(false)}
                onSave={handleCaptureSave}
            />

            {/* Lightbox */}
            {viewImage && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center animate-fade-in" onClick={() => setViewImage(null)}>
                    <button className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition">
                        <XIcon className="w-8 h-8"/>
                    </button>
                    <img src={viewImage} alt="Full View" className="max-w-[90vw] max-h-[90vh] object-contain rounded shadow-2xl" onClick={(e) => e.stopPropagation()}/>
                </div>
            )}
        </div>
    );
};

export default SurgeryDetailView;
