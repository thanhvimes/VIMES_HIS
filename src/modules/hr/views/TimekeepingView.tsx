import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
    VideoCameraIcon, 
    CheckCircleIcon, 
    ExclamationCircleIcon, 
    ClockIcon, 
    RefreshIcon, 
    GlobeIcon,
    UserCircleIcon
} from '../../../components/Icons';
import { useSession } from '../../../contexts/SessionContext';

// --- MOCK HOSPITAL LOCATION (Example Coordinates) ---
// Thay đổi tọa độ này về vị trí thực tế của bạn để test GPS thật
const HOSPITAL_LAT = 21.027763; 
const HOSPITAL_LNG = 105.834160;
const ALLOWED_RADIUS_METERS = 1000; // Cho phép sai số 1km để dễ test

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
};

interface CheckInLog {
    id: string;
    time: string;
    date: string;
    type: 'In' | 'Out';
    status: 'Success' | 'Late';
    location: string;
    image?: string;
}

const TimekeepingView: React.FC = () => {
    const { user } = useSession();
    const [currentTime, setCurrentTime] = useState(new Date());
    
    // Location State
    const [locationStatus, setLocationStatus] = useState<'Checking' | 'Valid' | 'Invalid' | 'Error'>('Checking');
    const [distance, setDistance] = useState<number>(0);
    const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);

    // Camera State
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scanStep, setScanStep] = useState<'finding' | 'verifying' | 'success' | 'failed'>('finding');
    const [cameraError, setCameraError] = useState<string | null>(null);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Data State
    const [history, setHistory] = useState<CheckInLog[]>([
        { id: '1', time: '07:55', date: new Date().toLocaleDateString('vi-VN'), type: 'In', status: 'Success', location: 'GPS (15m)' }
    ]);

    // Clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // 1. Check GPS
    const checkLocation = useCallback(() => {
        setLocationStatus('Checking');
        
        if (!navigator.geolocation) {
            setLocationStatus('Error');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setCoords({ lat: latitude, lng: longitude });
                
                const dist = calculateDistance(latitude, longitude, HOSPITAL_LAT, HOSPITAL_LNG);
                setDistance(dist);

                if (dist <= ALLOWED_RADIUS_METERS) {
                    setLocationStatus('Valid');
                } else {
                    setLocationStatus('Invalid');
                }
            },
            (error) => {
                console.error("GPS Error:", error);
                // Cho phép test trên môi trường không có GPS bằng cách giả lập Valid
                if (process.env.NODE_ENV === 'development') {
                    console.log("Dev mode: Simulating valid location");
                    setDistance(50);
                    setLocationStatus('Valid');
                } else {
                    setLocationStatus('Error');
                }
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, []);

    useEffect(() => {
        checkLocation();
    }, [checkLocation]);

    // 2. Camera Logic
    const startCamera = async () => {
        setIsCameraOpen(true);
        setCameraError(null);
        setScanStep('finding');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            startScanningProcess();
        } catch (err) {
            console.error("Camera Error:", err);
            setCameraError("Không thể truy cập Camera. Hãy kiểm tra quyền hoặc kết nối.");
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setIsCameraOpen(false);
        setIsScanning(false);
        setScanStep('finding');
    };

    const handleCheckIn = () => {
        if (locationStatus === 'Invalid' || locationStatus === 'Error') {
            if(!window.confirm("Cảnh báo: Vị trí GPS không hợp lệ. Bạn vẫn muốn tiếp tục (Ghi nhận vi phạm)?")) {
                return;
            }
        }
        startCamera();
    };

    const startScanningProcess = () => {
        setIsScanning(true);
        setScanStep('finding');

        // 1. Finding Face (2s)
        setTimeout(() => {
            setScanStep('verifying');
            
            // 2. Verifying (2s)
            setTimeout(() => {
                setScanStep('success');
                setIsScanning(false);

                // Create Log
                const newLog: CheckInLog = {
                    id: Date.now().toString(),
                    time: new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}),
                    date: new Date().toLocaleDateString('vi-VN'),
                    type: 'In',
                    status: locationStatus === 'Valid' ? 'Success' : 'Late',
                    location: `GPS (${Math.round(distance)}m)`
                };
                setHistory(prev => [newLog, ...prev]);

                // Play Success Sound
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
                audio.volume = 0.5;
                audio.play().catch(() => {});

                // Close after success
                setTimeout(() => {
                    stopCamera();
                }, 2000);
            }, 2000);
        }, 2000);
    };

    // Simulation for Devs without Camera
    const simulateScan = () => {
        setIsCameraOpen(true);
        setCameraError(null);
        startScanningProcess();
    };

    useEffect(() => {
        return () => stopCamera();
    }, []);

    return (
        <div className="h-full flex flex-col lg:flex-row gap-6 p-2">
            
            {/* LEFT: ACTION PANEL */}
            <div className="flex-1 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-2xl text-white overflow-hidden relative flex flex-col">
                
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-10 blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none"></div>

                {/* Header Info */}
                <div className="p-8 flex justify-between items-start z-10">
                    <div>
                        <p className="text-blue-200 text-sm uppercase tracking-widest font-semibold mb-1">Smart Timekeeping</p>
                        <h1 className="text-4xl font-bold">Xin chào, {user?.fullName}</h1>
                        <p className="text-white/80 mt-2 text-sm flex items-center gap-2">
                            <span className="bg-white/20 px-2 py-0.5 rounded text-xs">{user?.departmentName}</span>
                            {locationStatus === 'Valid' ? (
                                <span className="text-green-300 text-xs font-bold flex items-center gap-1"><CheckCircleIcon className="w-3 h-3"/> GPS OK</span>
                            ) : (
                                <span className="text-red-300 text-xs font-bold flex items-center gap-1"><ExclamationCircleIcon className="w-3 h-3"/> GPS Check</span>
                            )}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-5xl font-mono font-bold tracking-tighter">
                            {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-blue-200 font-medium">
                            {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                    </div>
                </div>

                {/* Center Action Area */}
                <div className="flex-1 flex flex-col items-center justify-center relative z-10 p-4">
                    
                    {isCameraOpen ? (
                        <div className="relative w-full max-w-md aspect-[3/4] bg-black rounded-3xl overflow-hidden shadow-2xl border-8 border-white/10">
                            {cameraError ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-center p-6">
                                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                                        <VideoCameraIcon className="w-10 h-10 text-red-500"/>
                                    </div>
                                    <p className="text-white font-bold mb-2">Lỗi Camera</p>
                                    <p className="text-sm text-slate-400 mb-6">{cameraError}</p>
                                    <button onClick={simulateScan} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-full text-white font-bold text-sm">
                                        Chạy Giả lập (Simulation)
                                    </button>
                                    <button onClick={stopCamera} className="mt-4 text-slate-500 text-xs hover:text-white">Hủy bỏ</button>
                                </div>
                            ) : (
                                <>
                                    {/* Video Feed */}
                                    <video 
                                        ref={videoRef} 
                                        autoPlay 
                                        playsInline 
                                        muted 
                                        className="w-full h-full object-cover transform scale-x-[-1]" 
                                    />
                                    
                                    {/* Scanning Overlay */}
                                    <div className="absolute inset-0 z-20">
                                        {/* Face Frame */}
                                        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-80 border-2 rounded-[40%] transition-all duration-500 overflow-hidden ${
                                            scanStep === 'success' ? 'border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.5)]' : 
                                            scanStep === 'verifying' ? 'border-blue-400 shadow-[0_0_30px_rgba(96,165,250,0.5)]' :
                                            'border-white/50'
                                        }`}>
                                            {/* Scanner Beam */}
                                            {isScanning && (
                                                <div className="absolute top-0 left-0 w-full h-2 bg-blue-400/80 shadow-[0_0_20px_rgba(96,165,250,1)] animate-[scan_2s_ease-in-out_infinite]"></div>
                                            )}
                                        </div>
                                        
                                        {/* Corner Markers */}
                                        <div className="absolute top-8 left-8 w-8 h-8 border-t-4 border-l-4 border-white/30 rounded-tl-xl"></div>
                                        <div className="absolute top-8 right-8 w-8 h-8 border-t-4 border-r-4 border-white/30 rounded-tr-xl"></div>
                                        <div className="absolute bottom-8 left-8 w-8 h-8 border-b-4 border-l-4 border-white/30 rounded-bl-xl"></div>
                                        <div className="absolute bottom-8 right-8 w-8 h-8 border-b-4 border-r-4 border-white/30 rounded-br-xl"></div>
                                    </div>

                                    {/* Status Text */}
                                    <div className="absolute bottom-10 left-0 right-0 text-center z-30">
                                        <div className="inline-block bg-black/60 backdrop-blur-md px-6 py-2 rounded-full border border-white/10">
                                            {scanStep === 'finding' && <span className="text-white animate-pulse">🔍 Đang tìm khuôn mặt...</span>}
                                            {scanStep === 'verifying' && <span className="text-blue-400 font-bold">⚡ Đang xác thực sinh trắc học...</span>}
                                            {scanStep === 'success' && <span className="text-green-400 font-bold flex items-center gap-2"><CheckCircleIcon className="w-5 h-5"/> Chấm công thành công!</span>}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        // Idle State
                        <div className="flex flex-col items-center gap-8">
                            {/* GPS Status Pill */}
                            <div className={`flex items-center gap-3 px-6 py-3 rounded-full backdrop-blur-md border transition-colors ${
                                locationStatus === 'Valid' ? 'bg-green-500/20 border-green-500/50 text-green-100' : 
                                locationStatus === 'Checking' ? 'bg-blue-500/20 border-blue-500/50 text-blue-100' :
                                'bg-red-500/20 border-red-500/50 text-red-100'
                            }`}>
                                <GlobeIcon className={`w-5 h-5 ${locationStatus === 'Checking' ? 'animate-spin' : ''}`}/>
                                <span className="font-bold">
                                    {locationStatus === 'Valid' ? 'Vị trí hợp lệ' : 
                                     locationStatus === 'Checking' ? 'Đang định vị...' : 
                                     'Vị trí không hợp lệ'}
                                </span>
                                {locationStatus === 'Valid' && <span className="text-xs opacity-80 ml-1">({Math.round(distance)}m)</span>}
                                <button onClick={checkLocation} className="ml-2 p-1 hover:bg-white/20 rounded-full transition" title="Làm mới GPS"><RefreshIcon className="w-4 h-4"/></button>
                            </div>

                            {/* Big Action Button */}
                            <button 
                                onClick={handleCheckIn}
                                className="group relative px-12 py-6 bg-white text-blue-700 rounded-3xl shadow-2xl hover:shadow-blue-900/50 transition-all transform hover:scale-105 active:scale-95 flex flex-col items-center"
                            >
                                <div className="p-4 bg-blue-50 rounded-full mb-2 group-hover:bg-blue-100 transition-colors">
                                    <div className="w-12 h-12 rounded-full border-2 border-blue-600 flex items-center justify-center">
                                        <div className="w-1 h-1 bg-blue-600 rounded-full absolute top-4 left-1/2 -translate-x-1/2"></div>
                                        <div className="w-1 h-1 bg-blue-600 rounded-full absolute top-1/2 left-4 -translate-y-1/2"></div>
                                        <UserCircleIcon className="w-10 h-10 text-blue-600"/>
                                    </div>
                                </div>
                                <span className="text-xl font-black tracking-tight">FACE ID CHECK-IN</span>
                                <span className="text-sm font-medium opacity-70">Nhấn để bắt đầu</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: HISTORY & STATS */}
            <div className="w-full lg:w-96 flex flex-col gap-4">
                
                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="text-slate-500 text-xs font-bold uppercase mb-1">Giờ vào (Quy định)</div>
                        <div className="text-2xl font-bold text-slate-800 dark:text-white">08:00</div>
                        <div className="text-xs text-green-600 mt-1 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded w-fit">Ca hành chính</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="text-slate-500 text-xs font-bold uppercase mb-1">Công tháng này</div>
                        <div className="text-2xl font-bold text-slate-800 dark:text-white">22.5</div>
                        <div className="text-xs text-slate-400 mt-1">/ 24 ngày</div>
                    </div>
                </div>

                {/* History List */}
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden h-[400px] lg:h-auto">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                            <ClockIcon className="w-5 h-5 text-blue-600"/> Lịch sử chấm công
                        </h3>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Hôm nay</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                        {history.length === 0 ? (
                             <div className="p-6 text-center text-slate-400 text-sm italic h-full flex flex-col items-center justify-center">
                                <ClockIcon className="w-10 h-10 mb-2 opacity-20"/>
                                Chưa có dữ liệu chấm công hôm nay.
                             </div>
                        ) : (
                            history.map(log => (
                                <div key={log.id} className="flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition border-b border-slate-100 dark:border-slate-700 last:border-0">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${log.type === 'In' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                        {log.type === 'In' ? <VideoCameraIcon className="w-5 h-5"/> : <ClockIcon className="w-5 h-5"/>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="font-bold text-slate-800 dark:text-white text-sm">{log.type === 'In' ? 'Check-In' : 'Check-Out'}</p>
                                            <p className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">{log.time}</p>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs text-slate-500 truncate max-w-[120px]" title={log.location}>{log.location}</p>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${log.status === 'Success' ? 'text-green-600 bg-green-50 border-green-100' : 'text-red-600 bg-red-50 border-red-100'}`}>
                                                {log.status === 'Success' ? 'Hợp lệ' : 'Đi muộn'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
            
            <style>{`
                @keyframes scan {
                    0% { top: 0; opacity: 0.5; }
                    50% { opacity: 1; }
                    100% { top: 100%; opacity: 0.5; }
                }
            `}</style>
        </div>
    );
};

export default TimekeepingView;