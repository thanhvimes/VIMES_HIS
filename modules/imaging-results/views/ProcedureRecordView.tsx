
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockRequests, mockTemplates, ImagingRequest, ReportTemplate } from '../data';
import { useTheme } from '../../../contexts/ThemeContext';
import { 
    ChevronLeftIcon, 
    CameraIcon, 
    SaveIcon, 
    PrinterIcon, 
    TrashIcon, 
    CheckIcon,
    XIcon,
    PhotographIcon,
    DocumentTextIcon,
    PencilIcon,
    ListBulletIcon,
    EyeIcon
} from '../../../components/Icons';
import Combobox from '../../../components/shared/Combobox';
import { usePdfPreview } from '../../../contexts/PdfPreviewContext';

// --- Types for Capture State ---
interface CapturedImage {
    id: string;
    url: string;
    timestamp: string;
    note?: string;
    isSelected: boolean;
}

// --- Main Component ---
const ProcedureRecordView: React.FC = () => {
    const { requestId } = useParams<{ requestId: string }>();
    const navigate = useNavigate();
    const { openPdf } = usePdfPreview();
    const [request, setRequest] = useState<ImagingRequest | null>(null);
    const [activeTab, setActiveTab] = useState<'images' | 'report'>('images');

    // --- Image Capture State ---
    const [images, setImages] = useState<CapturedImage[]>([]);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
    const [imageNote, setImageNote] = useState('');

    // --- Report State ---
    const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
    const [reportContent, setReportContent] = useState('');
    const [conclusion, setConclusion] = useState('');

    // --- Initialization ---
    useEffect(() => {
        const found = mockRequests.find(r => r.id === requestId);
        if (found) {
            setRequest(found);
            // If already reported, prepopulate
            if (found.report) {
                // Simple parser for demo purposes
                const parts = found.report.split('KẾT LUẬN:');
                if (parts.length > 1) {
                    setReportContent(parts[0].replace('KỸ THUẬT:', '').replace('MÔ TẢ HÌNH ẢNH:', '').trim());
                    setConclusion(parts[1].trim());
                } else {
                    setReportContent(found.report);
                }
            }
        }
    }, [requestId]);

    // --- CAMERA FUNCTIONS ---
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setIsCameraActive(true);
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Không thể truy cập Camera. Vui lòng kiểm tra kết nối hoặc quyền truy cập.");
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
            setIsCameraActive(false);
        }
    };

    const captureImage = () => {
        if (videoRef.current && isCameraActive) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0);
                const dataUrl = canvas.toDataURL('image/jpeg');
                const newImg: CapturedImage = {
                    id: Date.now().toString(),
                    url: dataUrl,
                    timestamp: new Date().toLocaleTimeString(),
                    isSelected: true
                };
                setImages(prev => [...prev, newImg]);
            }
        } else {
            // Fallback for demo without camera
            simulateCapture();
        }
    };

    const simulateCapture = () => {
        // Generate a random placeholder for demo
        const randomId = Math.floor(Math.random() * 1000);
        const newImg: CapturedImage = {
            id: Date.now().toString(),
            url: `https://picsum.photos/seed/${randomId}/800/600`, // Random image
            timestamp: new Date().toLocaleTimeString(),
            isSelected: true
        };
        setImages(prev => [...prev, newImg]);
    };

    // Cleanup camera on unmount
    useEffect(() => {
        return () => stopCamera();
    }, []);

    // --- IMAGE MANAGEMENT ---
    const toggleSelection = (id: string) => {
        setImages(prev => prev.map(img => img.id === id ? { ...img, isSelected: !img.isSelected } : img));
    };

    const deleteImage = (id: string) => {
        if (window.confirm('Xóa ảnh này?')) {
            setImages(prev => prev.filter(img => img.id !== id));
            if (selectedImageId === id) setSelectedImageId(null);
        }
    };

    const openImageEditor = (img: CapturedImage) => {
        setSelectedImageId(img.id);
        setImageNote(img.note || '');
    };

    const saveImageNote = () => {
        if (selectedImageId) {
            setImages(prev => prev.map(img => img.id === selectedImageId ? { ...img, note: imageNote } : img));
            setSelectedImageId(null);
        }
    };

    // --- REPORT FUNCTIONS ---
    const applyTemplate = (val: string, item?: ReportTemplate) => {
        if (item) {
            setSelectedTemplate(item);
            // Simple heuristic parsing again
            const content = item.content;
            const parts = content.split('KẾT LUẬN:');
            if (parts.length > 1) {
                setReportContent(parts[0].replace('KỸ THUẬT:', '').replace('MÔ TẢ HÌNH ẢNH:', '').trim());
                setConclusion(parts[1].trim());
            } else {
                setReportContent(content);
            }
        }
    };

    const handleSaveReport = () => {
        // Build full report string
        const fullText = `MÔ TẢ:\n${reportContent}\n\nKẾT LUẬN:\n${conclusion}`;
        
        // Build JSON payload (Simulated)
        const payload = {
            requestId: request?.id,
            patient: request?.patientName,
            images: images.filter(i => i.isSelected).map(i => ({ url: i.url, note: i.note })),
            report: fullText
        };
        
        console.log("Saving JSON Payload:", payload);
        alert("Đã lưu kết quả thành công!");
        
        // Update local state
        if (request) {
            setRequest({ ...request, status: 'Reported', report: fullText });
        }
    };

    const handlePrint = () => {
        openPdf({
            url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf', // Demo PDF
            fileName: `Report_${request?.id}.pdf`,
            isSignable: false
        });
    };

    if (!request) return <div className="p-10 text-center text-white">Loading...</div>;

    return (
        <div className="flex flex-col h-screen bg-[#0f0f0f] text-slate-300 overflow-hidden fixed inset-0 z-[100]">
            
            {/* --- 1. Header: Patient Info --- */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] border-b border-[#333] h-14 shrink-0 z-20 shadow-md">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/imaging-results/worklist')} className="p-2 hover:bg-[#333] rounded-full text-slate-400 hover:text-white transition">
                        <ChevronLeftIcon className="w-5 h-5"/>
                    </button>
                    <div className="flex flex-col">
                        <h1 className="text-lg font-bold text-white flex items-center gap-2">
                            <span className="text-blue-400 uppercase">{request.patientName}</span>
                            <span className="text-xs font-normal px-2 py-0.5 bg-[#333] rounded text-slate-300">{request.gender}, {request.age}T</span>
                        </h1>
                        <div className="text-xs text-slate-500 flex gap-3">
                            <span>ID: <span className="font-mono text-slate-400">{request.patientId}</span></span>
                            <span>•</span>
                            <span>Dịch vụ: <span className="text-slate-300">{request.serviceName}</span></span>
                        </div>
                    </div>
                </div>
                
                <div className="flex bg-[#252525] rounded-lg p-1">
                    <button 
                        onClick={() => setActiveTab('images')}
                        className={`px-6 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'images' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        <CameraIcon className="w-4 h-4"/> Hình ảnh
                    </button>
                    <button 
                        onClick={() => setActiveTab('report')}
                        className={`px-6 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'report' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        <DocumentTextIcon className="w-4 h-4"/> Kết quả
                    </button>
                </div>
            </div>

            {/* --- 2. Main Content --- */}
            <div className="flex-1 overflow-hidden relative bg-[#121212]">
                
                {/* TAB 1: IMAGES */}
                {activeTab === 'images' && (
                    <div className="flex h-full">
                        {/* Left: Live View & Controls */}
                        <div className="w-2/3 flex flex-col border-r border-[#333]">
                            <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden group">
                                {isCameraActive ? (
                                    <video ref={videoRef} autoPlay playsInline className="max-w-full max-h-full object-contain"></video>
                                ) : (
                                    <div className="text-center text-slate-600">
                                        <CameraIcon className="w-20 h-20 mx-auto mb-2 opacity-20"/>
                                        <p>Camera đang tắt</p>
                                    </div>
                                )}
                                
                                {/* Timestamp Overlay */}
                                {isCameraActive && (
                                    <div className="absolute top-4 right-4 text-red-500 font-mono font-bold animate-pulse flex items-center gap-2">
                                        <div className="w-3 h-3 bg-red-500 rounded-full"></div> REC
                                    </div>
                                )}
                            </div>
                            
                            {/* Control Bar */}
                            <div className="h-20 bg-[#1a1a1a] border-t border-[#333] flex items-center justify-center gap-6 p-4">
                                <button 
                                    onClick={isCameraActive ? stopCamera : startCamera}
                                    className={`px-6 py-2 rounded-full font-bold border-2 transition-colors ${isCameraActive ? 'border-red-500 text-red-500 hover:bg-red-500/10' : 'border-green-500 text-green-500 hover:bg-green-500/10'}`}
                                >
                                    {isCameraActive ? 'Tắt Camera' : 'Bật Camera'}
                                </button>
                                <button 
                                    onClick={captureImage}
                                    className="w-14 h-14 rounded-full bg-white border-4 border-slate-300 shadow-lg active:scale-95 transition-transform flex items-center justify-center hover:border-blue-400"
                                    title="Chụp ảnh (Space)"
                                >
                                    <div className="w-10 h-10 bg-slate-800 rounded-full"></div>
                                </button>
                                <button 
                                    onClick={simulateCapture}
                                    className="px-6 py-2 rounded-full font-bold border-2 border-slate-600 text-slate-400 hover:text-white hover:border-white hover:bg-white/10"
                                >
                                    Tải ảnh lên
                                </button>
                            </div>
                        </div>

                        {/* Right: Gallery */}
                        <div className="w-1/3 flex flex-col bg-[#151515]">
                            <div className="p-3 border-b border-[#333] bg-[#1a1a1a] flex justify-between items-center">
                                <h3 className="font-bold text-slate-200">Ảnh đã chụp ({images.length})</h3>
                                <span className="text-xs text-slate-500">Đã chọn: {images.filter(i => i.isSelected).length}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-3 content-start custom-scrollbar">
                                {images.map((img) => (
                                    <div key={img.id} className={`relative group rounded overflow-hidden border-2 transition-all ${img.isSelected ? 'border-blue-500' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                                        <img 
                                            src={img.url} 
                                            alt="Capture" 
                                            className="w-full h-32 object-cover cursor-pointer"
                                            onClick={() => openImageEditor(img)}
                                        />
                                        {/* Selection Checkbox */}
                                        <div className="absolute top-2 left-2">
                                            <input 
                                                type="checkbox" 
                                                checked={img.isSelected} 
                                                onChange={() => toggleSelection(img.id)}
                                                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            />
                                        </div>
                                        {/* Actions Overlay */}
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openImageEditor(img)} className="p-1 text-white hover:text-blue-400"><PencilIcon className="w-4 h-4"/></button>
                                            <button onClick={() => deleteImage(img.id)} className="p-1 text-white hover:text-red-400"><TrashIcon className="w-4 h-4"/></button>
                                        </div>
                                        {img.note && (
                                            <div className="absolute top-2 right-2 bg-yellow-500 text-black text-[10px] px-1.5 rounded font-bold shadow">Note</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: REPORT */}
                {activeTab === 'report' && (
                    <div className="flex h-full">
                        {/* Left: Template & Info */}
                        <div className="w-1/3 bg-[#1a1a1a] border-r border-[#333] flex flex-col p-4 overflow-y-auto">
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Chọn mẫu kết quả</label>
                                <Combobox<ReportTemplate>
                                    options={mockTemplates.filter(t => t.modality === request.modality)}
                                    displayValue={item => item.name}
                                    onChange={applyTemplate}
                                    placeholder="Tìm kiếm mẫu..."
                                    className="w-full"
                                />
                            </div>

                            <div className="p-4 bg-[#222] rounded-lg border border-[#333] mb-4">
                                <h3 className="font-bold text-slate-300 mb-2 flex items-center gap-2"><PhotographIcon className="w-4 h-4"/> Ảnh được chọn in ({images.filter(i => i.isSelected).length})</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {images.filter(i => i.isSelected).map(img => (
                                        <img key={img.id} src={img.url} className="w-full h-16 object-cover rounded border border-[#444]" alt="selected"/>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right: Editor */}
                        <div className="w-2/3 bg-[#f8fafc] flex flex-col">
                            <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full bg-white shadow-lg my-4 rounded min-h-[800px] text-black">
                                {/* Header Report */}
                                <div className="text-center border-b-2 border-black pb-4 mb-6">
                                    <h2 className="text-2xl font-bold uppercase text-blue-700">PHIẾU KẾT QUẢ {request.modality === 'Endoscopy' ? 'NỘI SOI' : 'SIÊU ÂM'}</h2>
                                    <p className="font-bold text-lg">{request.serviceName}</p>
                                </div>

                                {/* Body */}
                                <div className="space-y-6 font-serif text-lg">
                                    <div>
                                        <label className="font-bold block mb-2 text-slate-700 uppercase text-sm">Mô tả / Findings:</label>
                                        <textarea 
                                            value={reportContent}
                                            onChange={e => setReportContent(e.target.value)}
                                            className="w-full min-h-[300px] p-0 border-0 focus:ring-0 bg-transparent resize-none leading-relaxed"
                                            placeholder="Nhập mô tả..."
                                        />
                                    </div>
                                    <div>
                                        <label className="font-bold block mb-2 text-slate-700 uppercase text-sm">Kết luận / Conclusion:</label>
                                        <textarea 
                                            value={conclusion}
                                            onChange={e => setConclusion(e.target.value)}
                                            className="w-full h-24 p-0 border-0 focus:ring-0 bg-transparent resize-none font-bold text-blue-900"
                                            placeholder="Nhập kết luận..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Floating Toolbar */}
                            <div className="bg-white border-t border-slate-200 p-4 flex justify-end gap-3">
                                <button onClick={handlePrint} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-bold hover:bg-slate-50 flex items-center gap-2">
                                    <PrinterIcon className="w-5 h-5"/> In phiếu
                                </button>
                                <button onClick={handleSaveReport} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow flex items-center gap-2">
                                    <SaveIcon className="w-5 h-5"/> Lưu kết quả (JSON)
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* --- MODAL: Image Editor --- */}
            {selectedImageId && (
                <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedImageId(null)}>
                    <div className="bg-[#222] rounded-xl max-w-4xl w-full flex overflow-hidden shadow-2xl border border-[#444]" onClick={e => e.stopPropagation()}>
                        <div className="flex-1 bg-black flex items-center justify-center p-4">
                            <img 
                                src={images.find(i => i.id === selectedImageId)?.url} 
                                alt="Editing" 
                                className="max-w-full max-h-[70vh] object-contain"
                            />
                        </div>
                        <div className="w-80 bg-[#1a1a1a] p-4 flex flex-col border-l border-[#333]">
                            <h3 className="font-bold text-white mb-4 text-lg">Chỉnh sửa hình ảnh</h3>
                            
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-slate-400 mb-1">Ghi chú ảnh</label>
                                <textarea 
                                    value={imageNote}
                                    onChange={e => setImageNote(e.target.value)}
                                    className="w-full h-24 bg-[#111] border border-[#333] rounded p-2 text-white text-sm focus:border-blue-500 outline-none"
                                    placeholder="Nhập mô tả cho ảnh này..."
                                />
                            </div>

                            <div className="flex flex-wrap gap-2 mb-6">
                                <button className="px-3 py-1 bg-[#333] hover:bg-[#444] rounded text-xs text-white">Crop</button>
                                <button className="px-3 py-1 bg-[#333] hover:bg-[#444] rounded text-xs text-white">Rotate</button>
                                <button className="px-3 py-1 bg-[#333] hover:bg-[#444] rounded text-xs text-white">Annotate</button>
                            </div>

                            <div className="mt-auto flex gap-2">
                                <button onClick={() => setSelectedImageId(null)} className="flex-1 py-2 bg-[#333] hover:bg-[#444] rounded text-slate-300 font-bold text-sm">Hủy</button>
                                <button onClick={saveImageNote} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-bold text-sm">Lưu</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProcedureRecordView;
