// File: modules/health-check-sync/components/settings/GeneralConfigTab.tsx

import React from 'react';
import { AdjustmentsHorizontalIcon } from '../../../../components/Icons';

interface GeneralConfigTabProps {
    vneidUrl: string;
    setVneidUrl: (v: string) => void;
    vneidUsername: string;
    setVneidUsername: (v: string) => void;
    vneidPassword: string;
    setVneidPassword: (v: string) => void;
    showPassword: boolean;
    setShowPassword: (v: boolean) => void;
    vneidPrivateKey: string;
    setVneidPrivateKey: (v: string) => void;
    vneidPublicKey: string;
    setVneidPublicKey: (v: string) => void;
    maCskcb: string;
    setMaCskcb: (v: string) => void;
    maCskcbByt: string;
    setMaCskcbByt: (v: string) => void;
    maGtinCskcb: string;
    setMaGtinCskcb: (v: string) => void;
    autoSyncEnabled: boolean;
    setAutoSyncEnabled: (v: boolean) => void;
    autoSyncInterval: number;
    setAutoSyncInterval: (v: number) => void;
    allowUnsignedSync: boolean;
    setAllowUnsignedSync: (v: boolean) => void;
    inputClass: string;
}

const FieldGroup: React.FC<{
    label: string;
    children: React.ReactNode;
    colSpan?: 'full' | 'half';
}> = ({ label, children, colSpan = 'half' }) => (
    <div className={`space-y-1.5 ${colSpan === 'full' ? 'md:col-span-2' : ''}`}>
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">{label}</label>
        {children}
    </div>
);

const ToggleRow: React.FC<{
    label: string;
    desc: string;
    value: boolean;
    onChange: (v: boolean) => void;
}> = ({ label, desc, value, onChange }) => (
    <div className="flex justify-between items-center">
        <div>
            <div className="text-sm font-bold text-slate-800 dark:text-white">{label}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{desc}</div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-4">
            <input
                type="checkbox"
                checked={value}
                onChange={e => onChange(e.target.checked)}
                className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-[#0f766e]" />
        </label>
    </div>
);

export const GeneralConfigTab: React.FC<GeneralConfigTabProps> = ({
    vneidUrl,
    setVneidUrl,
    vneidUsername,
    setVneidUsername,
    vneidPassword,
    setVneidPassword,
    showPassword,
    setShowPassword,
    vneidPrivateKey,
    setVneidPrivateKey,
    vneidPublicKey,
    setVneidPublicKey,
    maCskcb,
    setMaCskcb,
    maCskcbByt,
    setMaCskcbByt,
    maGtinCskcb,
    setMaGtinCskcb,
    autoSyncEnabled,
    setAutoSyncEnabled,
    autoSyncInterval,
    setAutoSyncInterval,
    allowUnsignedSync,
    setAllowUnsignedSync,
    inputClass
}) => {
    return (
        <section className="space-y-6 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* URL Cổng liên thông */}
                <FieldGroup label="URL Cổng liên thông (Sandbox / Production)" colSpan="full">
                    <input
                        type="text"
                        value={vneidUrl}
                        onChange={e => setVneidUrl(e.target.value)}
                        className={inputClass}
                        placeholder="https://api-sandbox.emrhub.vn/api"
                    />
                </FieldGroup>

                {/* Tài khoản */}
                <FieldGroup label="Tài khoản Cổng VNeID">
                    <input
                        type="text"
                        value={vneidUsername}
                        onChange={e => setVneidUsername(e.target.value)}
                        className={inputClass}
                        placeholder="Nhập tên tài khoản..."
                    />
                </FieldGroup>

                {/* Mật khẩu */}
                <FieldGroup label="Mật khẩu Cổng VNeID">
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={vneidPassword}
                            onChange={e => setVneidPassword(e.target.value)}
                            className={`${inputClass} pr-14`}
                            placeholder="Nhập mật khẩu..."
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition cursor-pointer"
                        >
                            {showPassword ? 'Ẩn' : 'Hiện'}
                        </button>
                    </div>
                </FieldGroup>

                {/* Mã CSKCB GLN 13 ký tự */}
                <FieldGroup label="Mã cơ sở KCB (MA_CSKCB – 20 ký tự)">
                    <input
                        type="text"
                        maxLength={20}
                        value={maCskcb}
                        onChange={e => setMaCskcb(e.target.value)}
                        className={inputClass}
                        placeholder="8934285008135"
                    />
                </FieldGroup>

                {/* Mã CSKCB BYT 5 ký tự */}
                <FieldGroup label="Mã CSKCB Bộ Y tế (5 ký tự – dùng trong XML liên thông)">
                    <input
                        type="text"
                        maxLength={10}
                        value={maCskcbByt}
                        onChange={e => setMaCskcbByt(e.target.value)}
                        className={inputClass}
                        placeholder="89342"
                    />
                </FieldGroup>

                {/* Mã GTIN */}
                <FieldGroup label="Mã GLN Cơ sở (MA_GTIN_CSKCB – 13 ký tự)">
                    <input
                        type="text"
                        maxLength={13}
                        value={maGtinCskcb}
                        onChange={e => setMaGtinCskcb(e.target.value)}
                        className={inputClass}
                        placeholder="8934285008135"
                    />
                </FieldGroup>

                {/* Private Key & Public Key */}
                <FieldGroup label="Private Key của CSKCB (Dùng tạo Checksum Signature)" colSpan="full">
                    <textarea
                        value={vneidPrivateKey}
                        onChange={e => setVneidPrivateKey(e.target.value)}
                        rows={4}
                        className={`${inputClass} font-mono text-xs`}
                        placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                    />
                </FieldGroup>

                <FieldGroup label="Public Key của CSKCB (Dành cho kiểm thử / đối chiếu)" colSpan="full">
                    <textarea
                        value={vneidPublicKey}
                        onChange={e => setVneidPublicKey(e.target.value)}
                        rows={3}
                        className={`${inputClass} font-mono text-xs`}
                        placeholder="-----BEGIN PUBLIC KEY-----&#10;...&#10;-----END PUBLIC KEY-----"
                    />
                </FieldGroup>
            </div>

            {/* Auto sync toggle */}
            <div className="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-4">
                <div className="bg-slate-50 dark:bg-slate-700/30 p-3.5 rounded-lg border border-slate-200/50 dark:border-slate-700">
                    <ToggleRow
                        label="Tự động đồng bộ liên thông"
                        desc="Đẩy dữ liệu hồ sơ đã được ký số đầy đủ lên cổng một cách tự động."
                        value={autoSyncEnabled}
                        onChange={setAutoSyncEnabled}
                    />
                </div>

                <div className="bg-slate-50 dark:bg-slate-700/30 p-3.5 rounded-lg border border-slate-200/50 dark:border-slate-700">
                    <ToggleRow
                        label="Cho phép liên thông khi chưa ký số"
                        desc="Cho phép gửi hồ sơ lên cổng kể cả khi hồ sơ chưa được ký số."
                        value={allowUnsignedSync}
                        onChange={setAllowUnsignedSync}
                    />
                </div>

                {autoSyncEnabled && (
                    <div className="flex items-center gap-3 p-3 bg-teal-50/50 dark:bg-teal-900/10 rounded-lg border border-teal-100 dark:border-teal-900/30">
                        <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                            Tần suất đồng bộ tự động:
                        </span>
                        <select
                            value={autoSyncInterval}
                            onChange={e => setAutoSyncInterval(parseInt(e.target.value))}
                            className="p-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none cursor-pointer"
                        >
                            <option value={5}>Mỗi 5 phút</option>
                            <option value={15}>Mỗi 15 phút</option>
                            <option value={30}>Mỗi 30 phút</option>
                            <option value={60}>Mỗi 1 giờ</option>
                        </select>
                    </div>
                )}
            </div>
        </section>
    );
};
