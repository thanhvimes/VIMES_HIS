import React, { useState } from 'react';
import { AgentSigningCertificate } from '../services/workstationAgentSigningClient';
import { 
    XIcon, 
    CheckCircleIcon, 
    SignatureIcon 
} from '../../../components/Icons';

interface CertificateSelectModalProps {
    isOpen: boolean;
    certificates: AgentSigningCertificate[];
    onClose: () => void;
    onSelect: (cert: AgentSigningCertificate, remember: boolean) => void;
    currentThumbprint?: string;
}

export const CertificateSelectModal: React.FC<CertificateSelectModalProps> = ({
    isOpen,
    certificates,
    onClose,
    onSelect,
    currentThumbprint
}) => {
    const [selectedThumbprint, setSelectedThumbprint] = useState<string>(
        currentThumbprint || certificates[0]?.thumbprint || ''
    );
    const [remember, setRemember] = useState<boolean>(true);

    if (!isOpen) return null;

    const handleConfirm = () => {
        const found = certificates.find(c => c.thumbprint.toUpperCase() === selectedThumbprint.toUpperCase());
        if (found) {
            onSelect(found, remember);
        }
        onClose();
    };

    const parseSubjectPart = (subject: string, key: string): string => {
        const match = subject.match(new RegExp(`${key}=([^,]+)`, 'i'));
        return match ? match[1].trim() : '';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-slate-800 dark:to-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-600 text-white rounded-xl shadow-md">
                            <SignatureIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-800 dark:text-white">
                                Chọn Chứng Thư Ký Số (USB Token)
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Phát hiện {certificates.length} chứng thư số trên thiết bị
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Content list */}
                <div className="p-6 overflow-y-auto space-y-3 flex-1">
                    {certificates.map((cert) => {
                        const isSelected = cert.thumbprint.toUpperCase() === selectedThumbprint.toUpperCase();
                        const cn = parseSubjectPart(cert.subject, 'CN') || cert.subject;
                        const org = parseSubjectPart(cert.subject, 'O') || parseSubjectPart(cert.subject, 'OU');
                        const issuerCn = parseSubjectPart(cert.issuer, 'CN') || cert.issuer;
                        const expiryDate = new Date(cert.notAfter).toLocaleDateString('vi-VN');

                        return (
                            <div
                                key={cert.thumbprint}
                                onClick={() => setSelectedThumbprint(cert.thumbprint)}
                                className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative flex flex-col gap-2 ${
                                    isSelected
                                        ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/20 shadow-sm ring-2 ring-teal-500/20'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-teal-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition ${
                                            isSelected ? 'border-teal-600 bg-teal-600' : 'border-slate-400'
                                        }`}>
                                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                        </div>
                                        <span className="font-bold text-sm text-slate-800 dark:text-white">
                                            {cn}
                                        </span>
                                    </div>
                                    {cert.isValidNow ? (
                                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                                            Hợp lệ
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300">
                                            Hết hạn
                                        </span>
                                    )}
                                </div>

                                {org && (
                                    <p className="text-xs text-slate-600 dark:text-slate-300 pl-6">
                                        🏢 <span className="font-medium">{org}</span>
                                    </p>
                                )}

                                <div className="text-[11px] text-slate-500 dark:text-slate-400 pl-6 flex flex-wrap gap-x-4 gap-y-1">
                                    <span>🔐 <strong>CA:</strong> {issuerCn}</span>
                                    <span>📅 <strong>Hạn dùng:</strong> {expiryDate}</span>
                                    <span>⚙️ <strong>Loại:</strong> {cert.keyAlgorithm}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={remember}
                            onChange={(e) => setRemember(e.target.checked)}
                            className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                        />
                        <span>Ghi nhớ chứng thư này cho các lần ký sau</span>
                    </label>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={!selectedThumbprint}
                            className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-lg shadow-md transition active:scale-95 flex items-center gap-1.5"
                        >
                            <CheckCircleIcon className="w-4 h-4" />
                            Chọn chứng thư ký
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CertificateSelectModal;
