import React, { useState, useEffect, useCallback } from 'react';
import { 
    detectUsbTokenStatus, 
    getRememberedThumbprint, 
    setRememberedThumbprint,
    clearRememberedThumbprint,
    UsbTokenStatus 
} from '../services/healthCheckAgentXmlSigner';
import { AgentSigningCertificate } from '../services/workstationAgentSigningClient';
import CertificateSelectModal from './CertificateSelectModal';
import { 
    SignatureIcon, 
    RefreshIcon, 
    CheckCircleIcon, 
    AlertCircleIcon 
} from '../../../components/Icons';

interface TokenStatusWidgetProps {
    onCertificateChanged?: (cert: AgentSigningCertificate | null) => void;
    className?: string;
}

export const TokenStatusWidget: React.FC<TokenStatusWidgetProps> = ({ 
    onCertificateChanged,
    className = ''
}) => {
    const [status, setStatus] = useState<UsbTokenStatus>({
        agentRunning: false,
        connected: false,
        certificates: []
    });
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showCertModal, setShowCertModal] = useState<boolean>(false);

    const checkStatus = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await detectUsbTokenStatus();
            setStatus(res);
            if (onCertificateChanged) {
                onCertificateChanged(res.certificate || null);
            }
        } catch (err: any) {
            setStatus({
                agentRunning: false,
                connected: false,
                certificates: [],
                error: err.message
            });
        } finally {
            setIsLoading(false);
        }
    }, [onCertificateChanged]);

    useEffect(() => {
        checkStatus();
        // Periodically refresh token status every 30 seconds
        const interval = setInterval(checkStatus, 30000);
        return () => clearInterval(interval);
    }, [checkStatus]);

    const handleSelectCert = (cert: AgentSigningCertificate, remember: boolean) => {
        if (remember) {
            setRememberedThumbprint(cert.thumbprint);
        } else {
            clearRememberedThumbprint();
        }
        setStatus(prev => ({
            ...prev,
            certificate: cert
        }));
        if (onCertificateChanged) {
            onCertificateChanged(cert);
        }
    };

    const parseSubjectPart = (subject: string, key: string): string => {
        const match = subject.match(new RegExp(`${key}=([^,]+)`, 'i'));
        return match ? match[1].trim() : '';
    };

    const activeCert = status.certificate;
    const doctorName = activeCert ? parseSubjectPart(activeCert.subject, 'CN') : '';
    const issuer = activeCert ? parseSubjectPart(activeCert.issuer, 'CN') || parseSubjectPart(activeCert.issuer, 'O') : '';
    const expiryStr = activeCert ? new Date(activeCert.notAfter).toLocaleDateString('vi-VN') : '';

    return (
        <div className={`inline-flex items-center gap-2 ${className}`}>
            {status.connected && activeCert ? (
                <div 
                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 rounded-xl text-xs shadow-sm transition hover:shadow"
                    title={`USB Token đã kết nối:\n• Người ký: ${activeCert.subject}\n• Tổ chức cấp: ${activeCert.issuer}\n• Hạn dùng: ${expiryStr}\n• Thuật toán: ${activeCert.keyAlgorithm}`}
                >
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                    </span>

                    <SignatureIcon className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                    
                    <span className="font-bold text-emerald-900 dark:text-emerald-200 truncate max-w-[150px] sm:max-w-[200px]">
                        {doctorName || 'USB Token'}
                    </span>

                    {issuer && (
                        <span className="hidden md:inline px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 rounded font-semibold text-[10px]">
                            {issuer.length > 20 ? `${issuer.substring(0, 18)}...` : issuer}
                        </span>
                    )}

                    {status.certificates.length > 1 && (
                        <button
                            type="button"
                            onClick={() => setShowCertModal(true)}
                            className="ml-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 underline cursor-pointer"
                            title="Đổi sang chứng thư khác trên thiết bị"
                        >
                            Đổi
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={checkStatus}
                        disabled={isLoading}
                        className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200/50 dark:hover:bg-emerald-900/50 rounded-lg transition"
                        title="Quét lại USB Token"
                    >
                        <RefreshIcon className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            ) : status.agentRunning ? (
                <div 
                    className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded-xl text-xs shadow-sm"
                    title="Workstation Agent đang chạy nhưng chưa tìm thấy chứng thư trên USB Token. Vui lòng kiểm tra đã cắm thiết bị."
                >
                    <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                    <span className="font-bold text-amber-800 dark:text-amber-300">
                        Chưa cắm USB Token
                    </span>
                    <button
                        type="button"
                        onClick={checkStatus}
                        disabled={isLoading}
                        className="px-2 py-0.5 bg-amber-200 dark:bg-amber-800 hover:bg-amber-300 text-amber-900 dark:text-amber-100 rounded text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                    >
                        <RefreshIcon className={`w-2.5 h-2.5 ${isLoading ? 'animate-spin' : ''}`} />
                        Kiểm tra
                    </button>
                </div>
            ) : (
                <div 
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                    title="Chưa kết nối tới VIMES Workstation Agent (127.0.0.1:18181). Vui lòng bật ứng dụng Agent trên máy tính."
                >
                    <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                        Chưa bật Agent ký số
                    </span>
                    <button
                        type="button"
                        onClick={checkStatus}
                        disabled={isLoading}
                        className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded text-[10px] font-bold transition cursor-pointer"
                    >
                        Thử lại
                    </button>
                </div>
            )}

            {/* Modal chọn chứng thư */}
            <CertificateSelectModal
                isOpen={showCertModal}
                certificates={status.certificates}
                currentThumbprint={status.certificate?.thumbprint}
                onClose={() => setShowCertModal(false)}
                onSelect={handleSelectCert}
            />
        </div>
    );
};

export default TokenStatusWidget;
