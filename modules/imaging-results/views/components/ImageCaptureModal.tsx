
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
    XIcon, 
    CameraIcon, 
    CheckIcon, 
    TrashIcon, 
    ArrowUpTrayIcon, 
    ExclamationCircleIcon, 
    RefreshIcon, 
    ScissorsIcon,
    TvIcon
} from '../../../../components/Icons';

interface CapturedImage {
    id: string;
    url: string;
    timestamp: string;
    isSelected: boolean;
}

interface ImageCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (images: CapturedImage[]) => void;
}

const RESOLUTIONS = [
    { label: 'Full HD (1920x1080)', width: 1920, height: 1080 },
    { label: 'HD (1280x720)', width: 1280, height: 720 },
    { label: 'SD (640x480)', width: 640, height: 480 },
];

const ImageCaptureModal: React.FC<ImageCaptureModalProps> = ({ isOpen, onClose, onSave }) => {
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tempImages, setTempImages] = useState<CapturedImage[]>([]);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    
    // Settings
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>(() => localStorage.getItem('camera_device_id') || '');
    const [selectedResolution, setSelectedResolution] = useState<number>(() => parseInt(localStorage.getItem('camera_resolution_idx') || '0', 10));
    
    // Custom Key Binding
    const [captureKey, setCaptureKey] = useState<string>(() => localStorage.getItem('camera_capture_key') || 'Space');
    const [isSettingKey, setIsSettingKey] = useState(false);

    // Crop State
    const [isCropMode, setIsCropMode] = useState(true);
    const [cropRect, setCropRect] = useState({ x: 12.5, y: 5, width: 75, height: 90 }); // Percentages
    
    // Dragging State Refs
    const isDraggingRef = useRef(false);
    const activeHandleRef = useRef<'move' | 'nw' | 'ne' | 'sw' | 'se' | null>(null);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const initialRectRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

    const [isLoadingStream, setIsLoadingStream] = useState(false);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    // Save settings
    useEffect(() => {
        localStorage.setItem('camera_device_id', selectedDeviceId);
        localStorage.setItem('camera_resolution_idx', selectedResolution.toString());
        localStorage.setItem('camera_capture_key', captureKey);
    }, [selectedDeviceId, selectedResolution, captureKey]);

    // 1. Fetch available video devices
    useEffect(() => {
        const getDevices = async () => {
            try {
                // Safety check for mediaDevices support
                if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                     console.warn("Media Devices API not supported in this browser/context");
                     setDevices([]);
                     return;
                }
                const deviceList = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = deviceList.filter(device => device.kind === 'videoinput');
                setDevices(videoDevices);

                if (videoDevices.length > 0) {
                    const currentExists = videoDevices.some(d => d.deviceId === selectedDeviceId);
                    if (!selectedDeviceId || !currentExists) {
                        const backCamera = videoDevices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
                        setSelectedDeviceId(backCamera ? backCamera.deviceId : videoDevices[0].deviceId);
                    }
                }
            } catch (err) {
                console.warn("Error listing devices:", err);
            }
        };

        if (isOpen) {
            getDevices();
            // Safety check before adding event listener
            if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
                navigator.mediaDevices.addEventListener('devicechange', getDevices);
            }
        }

        return () => {
            // Safety check before removing event listener
            if (navigator.mediaDevices && navigator.mediaDevices.removeEventListener) {
                navigator.mediaDevices.removeEventListener('devicechange', getDevices);
            }
        };
    }, [isOpen]);

    // 2. Stop camera on close
    useEffect(() => {
        if (!isOpen) {
            stopCamera();
            setTempImages([]);
            setError(null);
            setIsCameraOn(false);
            setIsSettingKey(false);
        } else {
            setCropRect({ x: 15, y: 5, width: 70, height: 90 }); 
        }
    }, [isOpen]);

    // 3. Assign stream
    useEffect(() => {
        const video = videoRef.current;
        if (isCameraOn && video && streamRef.current && !isLoadingStream) {
            if (video.srcObject !== streamRef.current) {
                video.srcObject = streamRef.current;
                video.play().catch(e => {
                    if (e.name !== 'AbortError' && !e.message.includes('interrupted')) {
                        console.error("Error playing video:", e);
                    }
                });
            }
        }
    }, [isCameraOn, isLoadingStream]);

    // 4. Restart on resolution change
    const isMounted = useRef(false);
    useEffect(() => {
        if (isMounted.current && isCameraOn) {
            startCamera();
        }
        isMounted.current = true;
    }, [selectedResolution]);

    const startCamera = async (deviceIdOverride?: string) => {
        setError(null);
        setIsLoadingStream(true);
        stopCamera();

        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Trình duyệt không hỗ trợ Camera hoặc kết nối không an toàn (HTTPS).");
            }

            const idToUse = deviceIdOverride || selectedDeviceId;
            const resolution = RESOLUTIONS[selectedResolution];

            const constraints: MediaStreamConstraints = {
                video: {
                    deviceId: idToUse ? { exact: idToUse } : undefined,
                    width: { ideal: resolution.width }, 
                    height: { ideal: resolution.height },
                },
                audio: false
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            setIsCameraOn(true);
            setIsLoadingStream(false);

            // Refresh device list in case permissions just got granted
            if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
                const deviceList = await navigator.mediaDevices.enumerateDevices();
                setDevices(deviceList.filter(d => d.kind === 'videoinput'));
            }

        } catch (err: any) {
            console.error("Camera Error:", err);
            setError("Không thể truy cập Camera. Vui lòng kiểm tra quyền truy cập hoặc kết nối HTTPS.");
            setIsCameraOn(false);
            setIsLoadingStream(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newDeviceId = e.target.value;
        setSelectedDeviceId(newDeviceId);
        if (isCameraOn) {
            startCamera(newDeviceId);
        }
    };

    // --- CROP LOGIC (Multi-corner) ---
    const handleCropMouseDown = (e: React.MouseEvent | React.TouchEvent, type: 'move' | 'nw' | 'ne' | 'sw' | 'se') => {
        e.preventDefault();
        e.stopPropagation();
        
        isDraggingRef.current = true;
        activeHandleRef.current = type;
        
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        
        // Snapshot
        dragStartRef.current = { x: clientX, y: clientY };
        initialRectRef.current = { ...cropRect };
    };

    const handleCropMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!isDraggingRef.current || !overlayRef.current) return;
        
        const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
        const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;

        const containerRect = overlayRef.current.getBoundingClientRect();
        if (containerRect.width === 0 || containerRect.height === 0) return;

        const deltaX_px = clientX - dragStartRef.current.x;
        const deltaY_px = clientY - dragStartRef.current.y;

        const deltaX = (deltaX_px / containerRect.width) * 100;
        const deltaY = (deltaY_px / containerRect.height) * 100;

        const s = initialRectRef.current;
        const type = activeHandleRef.current;
        const minSize = 10;

        let next = { ...s };

        if (type === 'move') {
            next.x = Math.min(Math.max(0, s.x + deltaX), 100 - s.width);
            next.y = Math.min(Math.max(0, s.y + deltaY), 100 - s.height);
        } else {
            // Logic for resizing based on corner
            if (type?.includes('e')) { // East
                next.width = Math.max(minSize, Math.min(s.width + deltaX, 100 - s.x));
            }
            if (type?.includes('w')) { // West
                const newWidth = Math.max(minSize, Math.min(s.width - deltaX, s.x + s.width));
                const shiftX = s.width - newWidth;
                next.x = s.x + shiftX;
                next.width = newWidth;
            }
            if (type?.includes('s')) { // South
                next.height = Math.max(minSize, Math.min(s.height + deltaY, 100 - s.y));
            }
            if (type?.includes('n')) { // North
                const newHeight = Math.max(minSize, Math.min(s.height - deltaY, s.y + s.height));
                const shiftY = s.height - newHeight;
                next.y = s.y + shiftY;
                next.height = newHeight;
            }
        }
        
        setCropRect(next);
    }, []);

    const handleCropMouseUp = useCallback(() => {
        isDraggingRef.current = false;
        activeHandleRef.current = null;
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', handleCropMouseMove);
        window.addEventListener('mouseup', handleCropMouseUp);
        window.addEventListener('touchmove', handleCropMouseMove);
        window.addEventListener('touchend', handleCropMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleCropMouseMove);
            window.removeEventListener('mouseup', handleCropMouseUp);
            window.removeEventListener('touchmove', handleCropMouseMove);
            window.removeEventListener('touchend', handleCropMouseUp);
        };
    }, [handleCropMouseMove, handleCropMouseUp]);

    const setRatio43 = () => {
        // 4:3 aspect ratio (~1.33)
        setCropRect({ x: 12.5, y: 5, width: 75, height: 90 });
    };

    const setRatioSquare = () => {
        // 1:1 aspect ratio
        setCropRect({ x: 25, y: 5, width: 50, height: 90 });
    };

    // --- CAPTURE LOGIC ---
    const captureFrame = useCallback(() => {
        if (videoRef.current && isCameraOn) {
            const canvas = document.createElement('canvas');
            const video = videoRef.current;
            
            if (video.videoWidth === 0 || video.videoHeight === 0) return;

            let srcX = 0, srcY = 0, srcW = video.videoWidth, srcH = video.videoHeight;

            if (isCropMode) {
                srcX = (cropRect.x / 100) * video.videoWidth;
                srcY = (cropRect.y / 100) * video.videoHeight;
                srcW = (cropRect.width / 100) * video.videoWidth;
                srcH = (cropRect.height / 100) * video.videoHeight;
            }

            canvas.width = srcW;
            canvas.height = srcH;
            
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
                const newImg: CapturedImage = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    url: dataUrl,
                    timestamp: new Date().toLocaleTimeString(),
                    isSelected: true
                };
                setTempImages(prev => [...prev, newImg]);
                
                const flash = document.getElementById('camera-flash');
                if (flash) {
                    flash.style.opacity = '0.8';
                    setTimeout(() => flash.style.opacity = '0', 150);
                }
            }
        }
    }, [isCameraOn, isCropMode, cropRect]);

    // Keyboard Listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (isSettingKey) {
                e.preventDefault();
                setCaptureKey(e.code); 
                setIsSettingKey(false);
                return;
            }

            if (isCameraOn && e.code === captureKey) {
                e.preventDefault();
                captureFrame();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isCameraOn, captureFrame, isSettingKey, captureKey]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            files.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (reader.result) {
                        const newImg: CapturedImage = {
                            id: Date.now() + Math.random().toString(36).substr(2, 5),
                            url: reader.result as string,
                            timestamp: 'Upload',
                            isSelected: true
                        };
                        setTempImages(prev => [...prev, newImg]);
                    }
                };
                reader.readAsDataURL(file as Blob);
            });
        }
        e.target.value = '';
    };

    const removeTempImage = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.confirm("Bạn có chắc chắn muốn xóa ảnh này?")) {
            setTempImages(prev => prev.filter(img => img.id !== id));
        }
    };

    const handleConfirm = () => {
        onSave(tempImages);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 w-full max-w-7xl h-[95vh] rounded-xl overflow-hidden flex flex-col shadow-2xl animate-fade-in-up">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between px-4 py-3 bg-slate-900 text-white border-b border-slate-700 shrink-0 gap-3">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <CameraIcon className="w-5 h-5 text-teal-400"/> Thu nhận hình ảnh
                        </h2>
                    </div>

                    {/* Settings Toolbar */}
                    <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700 flex-wrap justify-center">
                        {/* Device Selector */}
                        <div className="relative group px-2 border-r border-slate-600">
                            <select 
                                value={selectedDeviceId} 
                                onChange={handleDeviceChange}
                                className="bg-transparent text-white text-xs outline-none cursor-pointer w-32 sm:w-48"
                            >
                                {devices.length === 0 && <option value="">Đang tìm thiết bị...</option>}
                                {devices.map((device, idx) => (
                                    <option key={device.deviceId || idx} value={device.deviceId}>
                                        {device.label || `Camera ${idx + 1}`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Resolution */}
                        <div className="relative group px-2 border-r border-slate-600">
                            <select 
                                value={selectedResolution} 
                                onChange={(e) => setSelectedResolution(Number(e.target.value))}
                                className="bg-transparent text-white text-xs outline-none cursor-pointer w-24"
                            >
                                {RESOLUTIONS.map((res, idx) => (
                                    <option key={idx} value={idx}>{res.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Key Config */}
                        <div className="relative group px-2">
                            <button 
                                onClick={() => setIsSettingKey(true)}
                                className={`text-xs flex items-center gap-1 ${isSettingKey ? 'text-yellow-400 animate-pulse' : 'text-white hover:text-teal-400'}`}
                                title="Click để cài đặt phím chụp"
                            >
                                <span className="opacity-50">Phím chụp:</span> 
                                <span className="font-bold border border-slate-500 px-2 py-0.5 rounded bg-slate-700 min-w-[30px] text-center">
                                    {isSettingKey ? 'Ấn phím...' : captureKey}
                                </span>
                            </button>
                        </div>
                        
                        <div className="px-2 cursor-pointer hover:text-teal-400 transition" onClick={() => startCamera()} title="Khởi động lại Camera">
                             <RefreshIcon className="w-4 h-4"/>
                        </div>
                    </div>

                    <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full transition">
                        <XIcon className="w-6 h-6"/>
                    </button>
                </div>

                {/* Body */}
                <div className="flex flex-col lg:flex-row flex-1 overflow-hidden bg-black">
                    
                    {/* Left: Camera Viewport */}
                    <div className="flex-1 relative flex flex-col items-center justify-center border-r border-slate-800 bg-[#050505] overflow-hidden">
                        {/* Flash Effect Overlay */}
                        <div id="camera-flash" className="absolute inset-0 bg-white opacity-0 pointer-events-none z-50 transition-opacity duration-150"></div>

                        {/* Tool Overlay */}
                        {isCameraOn && (
                            <div className="absolute top-4 left-4 z-30 flex flex-col gap-2">
                                <button 
                                    onClick={() => setIsCropMode(!isCropMode)}
                                    className={`p-2 rounded-lg shadow-md transition-all flex items-center gap-2 text-xs font-bold ${isCropMode ? 'bg-teal-600 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
                                    title="Bật/Tắt khung cắt"
                                >
                                    <ScissorsIcon className="w-4 h-4"/> {isCropMode ? 'Đang cắt' : 'Toàn cảnh'}
                                </button>
                                {isCropMode && (
                                    <>
                                        <button 
                                            onClick={setRatio43}
                                            className="p-2 rounded-lg shadow-md bg-white/10 text-slate-300 hover:bg-white/20 transition-all text-xs font-bold flex items-center gap-2"
                                            title="Tỷ lệ 4:3 (Chữ nhật - Tối ưu in ấn)"
                                        >
                                            <TvIcon className="w-4 h-4"/> Tỷ lệ 4:3
                                        </button>
                                        <button 
                                            onClick={setRatioSquare}
                                            className="p-2 rounded-lg shadow-md bg-white/10 text-slate-300 hover:bg-white/20 transition-all text-xs font-bold flex items-center gap-2"
                                            title="Tỷ lệ 1:1 (Vuông - Tổn thương khu trú)"
                                        >
                                            <span className="w-4 h-4 border-2 border-slate-300 rounded-sm"></span> Tỷ lệ 1:1
                                        </button>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Video & Crop Layer */}
                        <div className="relative w-full h-full flex items-center justify-center overflow-hidden" ref={overlayRef}>
                            {error ? (
                                <div className="text-center p-6 max-w-md">
                                    <ExclamationCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4"/>
                                    <h3 className="text-xl font-bold text-red-500 mb-2">Lỗi Camera</h3>
                                    <p className="text-slate-400 mb-6">{error}</p>
                                    <button onClick={() => startCamera()} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold transition shadow-lg">Thử lại</button>
                                </div>
                            ) : isCameraOn ? (
                                <>
                                    <video 
                                        ref={videoRef} 
                                        autoPlay 
                                        playsInline 
                                        muted
                                        className="max-w-full max-h-full object-contain pointer-events-none" 
                                    />
                                    
                                    {/* CROP BOX OVERLAY */}
                                    {isCropMode && (
                                        <div 
                                            className="absolute border-2 border-teal-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] cursor-move z-20 group"
                                            style={{
                                                left: `${cropRect.x}%`,
                                                top: `${cropRect.y}%`,
                                                width: `${cropRect.width}%`,
                                                height: `${cropRect.height}%`
                                            }}
                                            onMouseDown={(e) => handleCropMouseDown(e, 'move')}
                                            onTouchStart={(e) => handleCropMouseDown(e, 'move')}
                                        >
                                            {/* Composition Grid (Rule of Thirds) */}
                                            <div className="absolute inset-0 pointer-events-none opacity-30">
                                                <div className="absolute left-1/3 top-0 bottom-0 w-px bg-teal-400/50"></div>
                                                <div className="absolute right-1/3 top-0 bottom-0 w-px bg-teal-400/50"></div>
                                                <div className="absolute top-1/3 left-0 right-0 h-px bg-teal-400/50"></div>
                                                <div className="absolute bottom-1/3 left-0 right-0 h-px bg-teal-400/50"></div>
                                            </div>
                                            
                                            {/* Center Crosshair */}
                                            <div className="absolute inset-0 flex items-center justify-center opacity-50 pointer-events-none">
                                                <div className="w-2 h-2 bg-teal-400 rounded-full shadow-sm"></div>
                                            </div>
                                            
                                            {/* Resize Handles (4 Corners) */}
                                            {/* NW - Top Left */}
                                            <div 
                                                className="absolute top-0 left-0 w-6 h-6 -ml-3 -mt-3 cursor-nw-resize z-30 flex items-center justify-center hover:scale-125 transition-transform"
                                                onMouseDown={(e) => handleCropMouseDown(e, 'nw')}
                                                onTouchStart={(e) => handleCropMouseDown(e, 'nw')}
                                            >
                                                <div className="w-3 h-3 bg-teal-500 border-2 border-white rounded-full shadow-sm"></div>
                                            </div>
                                            
                                            {/* NE - Top Right */}
                                            <div 
                                                className="absolute top-0 right-0 w-6 h-6 -mr-3 -mt-3 cursor-ne-resize z-30 flex items-center justify-center hover:scale-125 transition-transform"
                                                onMouseDown={(e) => handleCropMouseDown(e, 'ne')}
                                                onTouchStart={(e) => handleCropMouseDown(e, 'ne')}
                                            >
                                                <div className="w-3 h-3 bg-teal-500 border-2 border-white rounded-full shadow-sm"></div>
                                            </div>

                                            {/* SW - Bottom Left */}
                                            <div 
                                                className="absolute bottom-0 left-0 w-6 h-6 -ml-3 -mb-3 cursor-sw-resize z-30 flex items-center justify-center hover:scale-125 transition-transform"
                                                onMouseDown={(e) => handleCropMouseDown(e, 'sw')}
                                                onTouchStart={(e) => handleCropMouseDown(e, 'sw')}
                                            >
                                                <div className="w-3 h-3 bg-teal-500 border-2 border-white rounded-full shadow-sm"></div>
                                            </div>

                                            {/* SE - Bottom Right */}
                                            <div 
                                                className="absolute bottom-0 right-0 w-6 h-6 -mr-3 -mb-3 cursor-se-resize z-30 flex items-center justify-center hover:scale-125 transition-transform"
                                                onMouseDown={(e) => handleCropMouseDown(e, 'se')}
                                                onTouchStart={(e) => handleCropMouseDown(e, 'se')}
                                            >
                                                <div className="w-3 h-3 bg-teal-500 border-2 border-white rounded-full shadow-sm"></div>
                                            </div>
                                            
                                            {/* Label */}
                                            <div className="absolute -top-7 left-0 bg-teal-600 text-white text-[10px] px-2 py-0.5 rounded font-bold shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                                Vùng lấy ảnh
                                            </div>
                                        </div>
                                    )}

                                    <div className="absolute top-4 right-4 px-2 py-1 bg-red-600 text-white text-xs font-bold rounded animate-pulse shadow-sm z-10 pointer-events-none">REC</div>
                                    <div className="absolute bottom-24 text-white/80 text-sm font-bold z-10 pointer-events-none bg-black/50 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm">
                                        Nhấn [{captureKey}] để chụp
                                    </div>
                                </>
                            ) : (
                                <div className="text-center text-slate-500">
                                    <CameraIcon className="w-24 h-24 mx-auto mb-4 opacity-20"/>
                                    <p className="text-lg mb-6">Camera đang tắt</p>
                                    <button 
                                        onClick={() => startCamera()}
                                        disabled={isLoadingStream}
                                        className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-full font-bold transition shadow-lg flex items-center gap-2 mx-auto disabled:opacity-70"
                                    >
                                        {isLoadingStream ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span> : <CameraIcon className="w-5 h-5"/>}
                                        {isLoadingStream ? "Đang khởi động..." : "Bật Camera"}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Capture Bar */}
                        <div className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex justify-center items-center gap-8 z-40">
                            {isCameraOn && (
                                <>
                                    <button onClick={() => { setIsCameraOn(false); stopCamera(); }} className="px-4 py-2 rounded-full bg-white/10 hover:bg-red-600/80 text-white font-bold text-sm backdrop-blur-sm transition-colors border border-white/20">
                                        Dừng
                                    </button>
                                    <button 
                                        onClick={captureFrame}
                                        className="w-16 h-16 rounded-full border-4 border-white bg-white/20 hover:bg-white/40 backdrop-blur-sm transition active:scale-95 flex items-center justify-center shadow-lg"
                                        title={`Chụp ảnh (${captureKey})`}
                                    >
                                        <div className="w-12 h-12 bg-white rounded-full"></div>
                                    </button>
                                </>
                            )}
                            <div className="relative">
                                <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 rounded-full bg-white/10 hover:bg-blue-600/80 text-white font-bold text-sm backdrop-blur-sm flex items-center gap-2 transition-colors border border-white/20">
                                    <ArrowUpTrayIcon className="w-4 h-4"/> Tải ảnh
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileUpload} />
                            </div>
                        </div>
                    </div>

                    {/* Right: Temp Gallery */}
                    <div className="w-full lg:w-80 bg-[#121212] flex flex-col border-l border-slate-800 max-h-[30vh] lg:max-h-none">
                        <div className="p-3 text-slate-300 text-sm font-bold border-b border-slate-800 flex justify-between items-center bg-[#1a1a1a]">
                            <span>Ảnh mới ({tempImages.length})</span>
                            {tempImages.length > 0 && (
                                <button onClick={() => setTempImages([])} className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-900/20 transition">
                                    Xóa tất cả
                                </button>
                            )}
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                            {tempImages.length === 0 ? (
                                <div className="text-center text-slate-600 mt-20 text-sm flex flex-col items-center">
                                    <CameraIcon className="w-10 h-10 mb-3 opacity-20"/>
                                    <p>Chưa có ảnh nào.</p>
                                </div>
                            ) : (
                                tempImages.map((img, index) => (
                                    <div key={img.id} className="relative group rounded-lg overflow-hidden border border-slate-700 bg-black hover:border-teal-500 transition-colors">
                                        <img src={img.url} className="w-full h-40 object-contain bg-black" alt="captured"/>
                                        <div className="absolute top-1 right-1 z-10">
                                            <button 
                                                onClick={(e) => removeTempImage(e, img.id)}
                                                className="p-1.5 bg-red-600 text-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 pointer-events-auto"
                                                title="Xóa ảnh"
                                            >
                                                <TrashIcon className="w-3 h-3"/>
                                            </button>
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-1.5 flex justify-between">
                                            <span>#{index + 1}</span>
                                            <span className="opacity-70">{img.timestamp}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-4 border-t border-slate-800 bg-[#151515]">
                            <button 
                                onClick={handleConfirm}
                                disabled={tempImages.length === 0}
                                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-700 transition-all active:scale-95"
                            >
                                <CheckIcon className="w-5 h-5"/>
                                <span>Thêm {tempImages.length > 0 ? `${tempImages.length} ảnh` : ''} vào phiếu</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageCaptureModal;
