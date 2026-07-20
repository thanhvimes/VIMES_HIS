import React, { useState, useEffect } from 'react';
import { healthCheckService } from '../../../../services/healthCheckService';

interface SignatureConfigTabProps {
    signatureType: 'USB' | 'HSM';
    setSignatureType: (v: 'USB' | 'HSM') => void;
    hsmUrl: string;
    setHsmUrl: (v: string) => void;
    hsmProvider: string;
    setHsmProvider: (v: string) => void;
    hsmUsername: string;
    setHsmUsername: (v: string) => void;
    hsmPassword: string;
    setHsmPassword: (v: string) => void;
    hsmClientId: string;
    setHsmClientId: (v: string) => void;
    hsmClientSecret: string;
    setHsmClientSecret: (v: string) => void;
    showHsmPassword: boolean;
    setShowHsmPassword: (v: boolean) => void;
    showHsmSecret: boolean;
    setShowHsmSecret: (v: boolean) => void;
    inputClass: string;
}

export const SignatureConfigTab: React.FC<SignatureConfigTabProps> = ({
    signatureType,
    setSignatureType,
    hsmUrl,
    setHsmUrl,
    hsmProvider,
    setHsmProvider,
    hsmUsername,
    setHsmUsername,
    hsmPassword,
    setHsmPassword,
    hsmClientId,
    setHsmClientId,
    hsmClientSecret,
    setHsmClientSecret,
    showHsmPassword,
    setShowHsmPassword,
    showHsmSecret,
    setShowHsmSecret,
    inputClass
}) => {
    const [partners, setPartners] = useState<Array<{ sign_partner: string; sign_url: string }>>([]);

    useEffect(() => {
        const loadPartners = async () => {
            try {
                const res = await healthCheckService.getSigningPartners();
                if (res.success && res.data) {
                    setPartners(res.data);
                }
            } catch (error) {
                console.error("Failed to load signing partners:", error);
            }
        };
        loadPartners();
    }, []);

    return (
        <section className="space-y-6 animate-in fade-in duration-200">
            {/* Loại hình ký số mặc định */}
            <div className="space-y-1.5 bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <label className="text-sm font-extrabold text-slate-800 dark:text-white block uppercase tracking-wider">
                    Loại hình ký số mặc định
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <label
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-150 ${
                            signatureType === 'HSM'
                                ? 'border-teal-500 bg-teal-50/20 dark:bg-teal-900/10'
                                : 'border-slate-200 dark:border-slate-750 hover:border-slate-350 dark:hover:border-slate-650'
                        }`}
                    >
                        <input
                            type="radio"
                            name="signature_type"
                            value="HSM"
                            checked={signatureType === 'HSM'}
                            onChange={() => setSignatureType('HSM')}
                            className="text-teal-600 focus:ring-teal-500 cursor-pointer"
                        />
                        <div>
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">
                                Ký số tập trung HSM (Cloud CA)
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                Ký thông qua máy chủ HSM kết nối từ xa. Thích hợp ký tự động hoặc ký lô nhanh.
                            </span>
                        </div>
                    </label>

                    <label
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-150 ${
                            signatureType === 'USB'
                                ? 'border-teal-500 bg-teal-50/20 dark:bg-teal-900/10'
                                : 'border-slate-200 dark:border-slate-750 hover:border-slate-350 dark:hover:border-slate-650'
                        }`}
                    >
                        <input
                            type="radio"
                            name="signature_type"
                            value="USB"
                            checked={signatureType === 'USB'}
                            onChange={() => setSignatureType('USB')}
                            className="text-teal-600 focus:ring-teal-500 cursor-pointer"
                        />
                        <div>
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">
                                Ký số máy trạm USB Token
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                Ký qua thiết bị USB cắm trực tiếp tại máy trạm (Yêu cầu bật phần mềm ký số máy trạm).
                            </span>
                        </div>
                    </label>
                </div>
            </div>

            {/* HSM configuration inputs */}
            {signatureType === 'HSM' && (
                <div className="p-4 bg-slate-50 dark:bg-slate-700/20 border border-slate-200/50 dark:border-slate-700 rounded-lg space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <h4 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Cấu hình ký số tập trung HSM
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nhà cung cấp HSM</label>
                            <select
                                value={hsmProvider}
                                onChange={e => {
                                    const selected = e.target.value;
                                    setHsmProvider(selected);
                                    const found = partners.find(p => p.sign_partner === selected);
                                    if (found && found.sign_url) {
                                        setHsmUrl(found.sign_url);
                                    }
                                }}
                                className={`${inputClass} cursor-pointer`}
                            >
                                <option value="">-- Chọn nhà cung cấp --</option>
                                {partners.length > 0 ? (
                                    partners.map(p => (
                                        <option key={p.sign_partner} value={p.sign_partner}>
                                            {p.sign_partner}
                                        </option>
                                    ))
                                ) : (
                                    <>
                                        <option value="VNPT-CA">VNPT-CA HSM</option>
                                        <option value="VIETTEL-CA">Viettel-CA Cloud CA</option>
                                        <option value="MISA-ESIGN">MISA eSign HSM</option>
                                        <option value="BKAV-CA">BKAV-CA HSM</option>
                                    </>
                                )}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Đường dẫn dịch vụ HSM (API Endpoint Base URL)</label>
                            <input
                                type="text"
                                value={hsmUrl}
                                onChange={e => setHsmUrl(e.target.value)}
                                className={`${inputClass}`}
                                placeholder="Ví dụ: http://vimes.xyz:8091"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tài khoản kết nối (Username)</label>
                            <input
                                type="text"
                                value={hsmUsername}
                                onChange={e => setHsmUsername(e.target.value)}
                                className={`${inputClass}`}
                                placeholder="Nhập tên đăng nhập hoặc mã tài khoản HSM"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Mật khẩu kết nối</label>
                            <div className="relative">
                                <input
                                    type={showHsmPassword ? 'text' : 'password'}
                                    value={hsmPassword}
                                    onChange={e => setHsmPassword(e.target.value)}
                                    className={`${inputClass} pr-10`}
                                    placeholder="Nhập mật khẩu"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowHsmPassword(!showHsmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                                >
                                    {showHsmPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Client ID</label>
                            <input
                                type="text"
                                value={hsmClientId}
                                onChange={e => setHsmClientId(e.target.value)}
                                className={`${inputClass}`}
                                placeholder="Client ID cấp bởi nhà cung cấp HSM"
                            />
                        </div>
                        <div className="md:col-span-2 space-y-1">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Client Secret</label>
                            <div className="relative">
                                <input
                                    type={showHsmSecret ? 'text' : 'password'}
                                    value={hsmClientSecret}
                                    onChange={e => setHsmClientSecret(e.target.value)}
                                    className={`${inputClass} pr-10`}
                                    placeholder="Client Secret"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowHsmSecret(!showHsmSecret)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                                >
                                    {showHsmSecret ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};
