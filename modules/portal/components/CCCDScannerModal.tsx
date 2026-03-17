import React, { useRef, useEffect, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { XIcon } from '../../../components/Icons';

interface CCCDData {
    cccd: string;
    name: string;
    dob: string;       // YYYY-MM-DD
    gender: string;
    address: string;
    issueDate: string;  // YYYY-MM-DD
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onScanSuccess: (data: CCCDData) => void;
}

const CCCDScannerModal: React.FC<Props> = ({ isOpen, onClose, onScanSuccess }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationRef = useRef<number>(0);
    const [status, setStatus] = useState<'starting' | 'scanning' | 'success' | 'error'>('starting');
    const [errorMessage, setErrorMessage] = useState('');

    // Format DDMMYYYY -> YYYY-MM-DD
    const formatDate = (raw: string): string => {
        if (!raw || raw.length !== 8) return '';
        return `${raw.slice(4, 8)}-${raw.slice(2, 4)}-${raw.slice(0, 2)}`;
    };

    // Parse CCCD QR: ID|OldID|Name|DOB|Gender|Address|IssueDate
    const parseCCCDData = useCallback((content: string): CCCDData | null => {
        const parts = content.split('|');
        if (parts.length < 6) return null;

        const id = parts[0].replace(/\D/g, '');
        if (id.length !== 12) return null;

        return {
            cccd: id,
            name: parts[2]?.trim().toUpperCase() || '',
            dob: formatDate(parts[3]?.trim() || ''),
            gender: (parts[4]?.trim() === 'Nam' || parts[4]?.trim() === '1') ? 'Nam' : 'Nữ',
            address: parts[5]?.trim() || '',
            issueDate: formatDate(parts[6]?.trim() || '')
        };
    }, []);

    const startCamera = useCallback(async () => {
        try {
            setStatus('starting');
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
                setStatus('scanning');
            }
        } catch (err) {
            console.error('Camera error:', err);
            setStatus('error');
            setErrorMessage('Không thể mở camera. Vui lòng cấp quyền camera trong cài đặt.');
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = 0;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    // Scan loop
    const scanFrame = useCallback(() => {
        if (!videoRef.current || !canvasRef.current || status !== 'scanning') return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (video.readyState !== video.HAVE_ENOUGH_DATA) {
            animationRef.current = requestAnimationFrame(scanFrame);
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert'
        });

        if (qrCode && qrCode.data) {
            let content = qrCode.data;

            // Try hex decode if no pipe separator
            if (!content.includes('|')) {
                try {
                    const clean = content.replace(/\s/g, '');
                    const bytes = new Uint8Array(clean.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
                    const decoded = new TextDecoder('utf-8').decode(bytes);
                    if (decoded.includes('|')) content = decoded;
                } catch (_) { /* not hex */ }
            }

            const parsed = parseCCCDData(content);
            if (parsed) {
                setStatus('success');
                stopCamera();
                // Small delay for visual feedback
                setTimeout(() => {
                    onScanSuccess(parsed);
                    onClose();
                }, 800);
                return;
            }
        }

        animationRef.current = requestAnimationFrame(scanFrame);
    }, [status, parseCCCDData, onScanSuccess, onClose, stopCamera]);

    useEffect(() => {
        if (isOpen) {
            startCamera();
        }
        return () => stopCamera();
    }, [isOpen, startCamera, stopCamera]);

    useEffect(() => {
        if (status === 'scanning') {
            animationRef.current = requestAnimationFrame(scanFrame);
        }
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [status, scanFrame]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-black text-slate-800 text-lg">📷 Quét mã QR trên CCCD</h3>
                    <button onClick={() => { stopCamera(); onClose(); }} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <XIcon className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Camera View */}
                <div className="relative bg-gray-900 aspect-[4/3]">
                    <video ref={videoRef} className="w-full h-full object-cover" muted playsInline autoPlay />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Scanning Overlay */}
                    {status === 'scanning' && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-64 h-44 relative">
                                <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-teal-400 rounded-tl-xl" />
                                <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-teal-400 rounded-tr-xl" />
                                <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-teal-400 rounded-bl-xl" />
                                <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-teal-400 rounded-br-xl" />
                                {/* Scan line animation */}
                                <div className="absolute inset-x-2 h-0.5 bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-bounce opacity-80" />
                            </div>
                        </div>
                    )}

                    {/* Starting */}
                    {status === 'starting' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90">
                            <div className="w-12 h-12 border-4 border-teal-400 border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-white font-bold">Đang mở camera...</p>
                        </div>
                    )}

                    {/* Success */}
                    {status === 'success' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-600/90">
                            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4 animate-bounce">
                                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="text-white font-black text-xl">QUÉT THÀNH CÔNG!</p>
                            <p className="text-emerald-100 font-medium mt-1">Đang điền thông tin...</p>
                        </div>
                    )}

                    {/* Error */}
                    {status === 'error' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/95 p-6 text-center">
                            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <p className="text-white font-bold mb-2">{errorMessage}</p>
                            <button onClick={startCamera} className="px-6 py-2 bg-teal-600 text-white rounded-full font-bold mt-2 hover:bg-teal-500 transition-colors">
                                Thử lại
                            </button>
                        </div>
                    )}
                </div>

                {/* Instructions */}
                <div className="p-4 bg-slate-50 text-center">
                    <p className="text-sm text-slate-600 font-medium">
                        Đưa mặt sau thẻ CCCD (có mã QR) vào khung hình
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CCCDScannerModal;
