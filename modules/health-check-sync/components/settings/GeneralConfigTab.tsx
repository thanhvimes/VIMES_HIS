// File: modules/health-check-sync/components/settings/GeneralConfigTab.tsx

import React from 'react';
import { RefreshIcon } from '../../../../components/Icons';

interface GeneralConfigTabProps {
    // Sync target mode
    syncTargetMode: 'BYT_ONLY' | 'BOTH' | 'SYT_ONLY';
    setSyncTargetMode: (v: 'BYT_ONLY' | 'BOTH' | 'SYT_ONLY') => void;

    // BYT / VNeID config
    vneidUrl: string;
    setVneidUrl: (v: string) => void;
    vneidUsername: string;
    setVneidUsername: (v: string) => void;
    vneidPassword: string;
    setVneidPassword: (v: string) => void;
    showPassword: boolean;
    setShowPassword: (v: boolean) => void;

    // SYT config
    sytUrl: string;
    setSytUrl: (v: string) => void;
    sytUsername: string;
    setSytUsername: (v: string) => void;
    sytPassword: string;
    setSytPassword: (v: string) => void;
    showSytPassword: boolean;
    setShowSytPassword: (v: boolean) => void;
    sytReceiverId: string;
    setSytReceiverId: (v: string) => void;
    isTestingSyt?: boolean;
    onTestSytConnection?: () => void;

    // Shared Keys & Facility identifiers
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

    // Auto sync
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
    syncTargetMode,
    setSyncTargetMode,
    vneidUrl,
    setVneidUrl,
    vneidUsername,
    setVneidUsername,
    vneidPassword,
    setVneidPassword,
    showPassword,
    setShowPassword,
    sytUrl,
    setSytUrl,
    sytUsername,
    setSytUsername,
    sytPassword,
    setSytPassword,
    showSytPassword,
    setShowSytPassword,
    sytReceiverId,
    setSytReceiverId,
    isTestingSyt,
    onTestSytConnection,
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
            {/* ══════════════════════════════════════════════════════════
                1. LỰA CHỌN CHẾ ĐỘ GỬI LIÊN THÔNG (Mục tiêu cổng)
            ══════════════════════════════════════════════════════════ */}
            <div className="bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                            Chế độ gửi liên thông dữ liệu
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Cấu hình gửi dữ liệu KSK tới Cổng Bộ Y tế (VNeID), Cổng Sở Y tế (HSSK Hà Nội), hoặc cả hai cổng cùng lúc.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                    {/* Option 1: BYT Only */}
                    <label
                        className={`relative flex flex-col p-3.5 rounded-lg border-2 cursor-pointer transition-all ${
                            syncTargetMode === 'BYT_ONLY'
                                ? 'border-[#0f766e] bg-teal-50/40 dark:bg-teal-950/20 shadow-sm'
                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-1.5">
                            <div className="text-sm font-bold text-slate-800 dark:text-white">
                                Chỉ Cổng Bộ Y tế
                            </div>
                            <input
                                type="radio"
                                name="syncTargetMode"
                                value="BYT_ONLY"
                                checked={syncTargetMode === 'BYT_ONLY'}
                                onChange={() => setSyncTargetMode('BYT_ONLY')}
                                className="text-teal-600 focus:ring-teal-500"
                            />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            Chỉ gửi lên Cổng tiếp nhận Bộ Y tế (VNeID). Giữ nguyên trạng thái luồng gửi hiện tại của cơ sở.
                        </p>
                        <span className="mt-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                            Mặc định hệ thống
                        </span>
                    </label>

                    {/* Option 2: BOTH */}
                    <label
                        className={`relative flex flex-col p-3.5 rounded-lg border-2 cursor-pointer transition-all ${
                            syncTargetMode === 'BOTH'
                                ? 'border-[#0f766e] bg-teal-50/40 dark:bg-teal-950/20 shadow-sm'
                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-1.5">
                            <div className="text-sm font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                                CẢ HAI CỔNG
                                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                                    ĐỒNG THỜI
                                </span>
                            </div>
                            <input
                                type="radio"
                                name="syncTargetMode"
                                value="BOTH"
                                checked={syncTargetMode === 'BOTH'}
                                onChange={() => setSyncTargetMode('BOTH')}
                                className="text-teal-600 focus:ring-teal-500"
                            />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            Gửi đồng thời cả Cổng Bộ Y tế (VNeID) và Cổng Sở Y tế Hà Nội (CV 7286/SYT). Quản lý độc lập trạng thái từng cổng.
                        </p>
                        <span className="mt-2 text-[10px] font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wider">
                            Áp dụng cho CS KCB tại Hà Nội
                        </span>
                    </label>

                    {/* Option 3: SYT Only */}
                    <label
                        className={`relative flex flex-col p-3.5 rounded-lg border-2 cursor-pointer transition-all ${
                            syncTargetMode === 'SYT_ONLY'
                                ? 'border-[#0f766e] bg-teal-50/40 dark:bg-teal-950/20 shadow-sm'
                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-1.5">
                            <div className="text-sm font-bold text-slate-800 dark:text-white">
                                Chỉ Cổng Sở Y tế
                            </div>
                            <input
                                type="radio"
                                name="syncTargetMode"
                                value="SYT_ONLY"
                                checked={syncTargetMode === 'SYT_ONLY'}
                                onChange={() => setSyncTargetMode('SYT_ONLY')}
                                className="text-teal-600 focus:ring-teal-500"
                            />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            Chỉ liên thông hồ sơ lên Cổng HSSKĐT Sở Y tế Hà Nội (api-hssk.hanoi.gov.vn). Không gửi Cổng Bộ Y tế.
                        </p>
                        <span className="mt-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                            Dành cho KSK phân cấp địa phương
                        </span>
                    </label>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════
                2. CẤU HÌNH CỔNG BỘ Y TẾ (VNeID)
            ══════════════════════════════════════════════════════════ */}
            {syncTargetMode !== 'SYT_ONLY' && (
                <div className="bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                    <div className="border-b border-slate-100 dark:border-slate-700 pb-2">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#0f766e] dark:text-teal-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                            Thông tin Cổng Bộ Y tế (VNeID)
                        </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FieldGroup label="URL Cổng tiếp nhận Bộ Y tế (Sandbox / Production)" colSpan="full">
                            <input
                                type="text"
                                value={vneidUrl}
                                onChange={e => setVneidUrl(e.target.value)}
                                className={inputClass}
                                placeholder="https://api-sandbox.emrhub.vn/api"
                            />
                        </FieldGroup>

                        <FieldGroup label="Tài khoản Cổng VNeID">
                            <input
                                type="text"
                                value={vneidUsername}
                                onChange={e => setVneidUsername(e.target.value)}
                                className={inputClass}
                                placeholder="Nhập tên tài khoản..."
                            />
                        </FieldGroup>

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
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                3. CẤU HÌNH CỔNG SỞ Y TẾ HÀ NỘI (CV 7286/SYT-QLBHYTCNTT)
            ══════════════════════════════════════════════════════════ */}
            {syncTargetMode !== 'BYT_ONLY' && (
                <div className="bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-teal-200 dark:border-teal-900/50 shadow-sm space-y-4">
                    <div className="border-b border-teal-100 dark:border-teal-900/50 pb-2 flex items-center justify-between flex-wrap gap-2">
                        <div>
                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#0f766e] dark:text-teal-400 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                Thông tin Cổng Sở Y tế Hà Nội (HSSKĐT – CV 7286)
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                Hệ thống tự động đóng gói cấu trúc XML QĐ 2062/QĐ-BYT và ký số xác thực RSA-SHA256 gửi tới Cổng HSSK Hà Nội.
                            </p>
                        </div>
                        {onTestSytConnection && (
                            <button
                                type="button"
                                disabled={isTestingSyt}
                                onClick={onTestSytConnection}
                                className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/50 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                                {isTestingSyt ? (
                                    <>
                                        <RefreshIcon className="w-3.5 h-3.5 animate-spin text-teal-600" />
                                        Đang kiểm tra kết nối SYT...
                                    </>
                                ) : (
                                    'Kiểm tra kết nối Cổng Sở Y tế'
                                )}
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FieldGroup label="URL Cổng Sở Y tế Hà Nội" colSpan="full">
                            <input
                                type="text"
                                value={sytUrl}
                                onChange={e => setSytUrl(e.target.value)}
                                className={inputClass}
                                placeholder="https://api-hssk.hanoi.gov.vn"
                            />
                        </FieldGroup>

                        <FieldGroup label="Tài khoản đăng nhập Cổng SYT">
                            <input
                                type="text"
                                value={sytUsername}
                                onChange={e => setSytUsername(e.target.value)}
                                className={inputClass}
                                placeholder="Tài khoản do Sở Y tế / Viettel cấp..."
                            />
                        </FieldGroup>

                        <FieldGroup label="Mật khẩu Cổng SYT">
                            <div className="relative">
                                <input
                                    type={showSytPassword ? 'text' : 'password'}
                                    value={sytPassword}
                                    onChange={e => setSytPassword(e.target.value)}
                                    className={`${inputClass} pr-14`}
                                    placeholder="Nhập mật khẩu SYT..."
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowSytPassword(!showSytPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition cursor-pointer"
                                >
                                    {showSytPassword ? 'Ẩn' : 'Hiện'}
                                </button>
                            </div>
                        </FieldGroup>

                        <FieldGroup label="Mã định danh nhận (Receiver ID)">
                            <input
                                type="text"
                                value={sytReceiverId}
                                onChange={e => setSytReceiverId(e.target.value)}
                                className={inputClass}
                                placeholder="VTS"
                            />
                        </FieldGroup>

                        <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 pt-5">
                            <span>Mã định danh nhận mặc định là <strong className="text-teal-700 dark:text-teal-300">VTS</strong> theo hướng dẫn kỹ thuật CV 7286/SYT.</span>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                4. THÔNG TIN ĐỊNH DANH CƠ SỞ & KHÓA KÝ SỐ (DÙNG CHUNG)
            ══════════════════════════════════════════════════════════ */}
            <div className="bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-700 pb-2">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                        Định danh Cơ sở KCB & Chữ ký số RSA (Dùng chung cho các Cổng)
                    </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Mã CSKCB GLN 20 ký tự */}
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
                    <FieldGroup label="Mã CSKCB Bộ Y tế (5 ký tự – trong XML)">
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {/* Private Key & Public Key */}
                    <FieldGroup label="Private Key của CSKCB (Dùng tạo Checksum RSA-SHA256)" colSpan="full">
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
            </div>

            {/* ══════════════════════════════════════════════════════════
                5. TỰ ĐỘNG ĐỒNG BỘ LIÊN THÔNG
            ══════════════════════════════════════════════════════════ */}
            <div className="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-4">
                <div className="bg-slate-50 dark:bg-slate-700/30 p-3.5 rounded-lg border border-slate-200/50 dark:border-slate-700">
                    <ToggleRow
                        label="Tự động đồng bộ liên thông"
                        desc="Đẩy dữ liệu hồ sơ đã được ký số đầy đủ lên các cổng đã thiết lập một cách tự động."
                        value={autoSyncEnabled}
                        onChange={setAutoSyncEnabled}
                    />
                </div>

                <div className="bg-slate-50 dark:bg-slate-700/30 p-3.5 rounded-lg border border-slate-200/50 dark:border-slate-700">
                    <ToggleRow
                        label="Cho phép liên thông khi chưa ký số"
                        desc="Cho phép gửi hồ sơ lên cổng kể cả khi hồ sơ chưa được ký số (thường dùng trong môi trường Sandbox/Thử nghiệm)."
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
