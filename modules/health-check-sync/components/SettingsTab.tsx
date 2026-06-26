// ==================== SETTINGS TAB COMPONENT ====================
// File: modules/health-check-sync/components/SettingsTab.tsx
//
// Chứa toàn bộ giao diện và logic của tab "Cấu hình thiết lập":
//   - Cấu hình kết nối cổng VNeID (URL, tài khoản, mật khẩu, mã cơ sở)
//   - Cài đặt tự động đồng bộ
//   - Cấu hình in Barcode (khổ tem XN, KSK, nội dung hiển thị trên tem)
//
// Để chỉnh sửa giao diện / logic cấu hình, chỉ cần sửa file này.

import React, { useState, useEffect } from 'react';
import { healthCheckService } from '../../../services/healthCheckService';
import { toast } from 'sonner';
import { RefreshIcon, AdjustmentsHorizontalIcon, CloudUploadIcon, PrinterIcon } from '../../../components/Icons';

// ─── Types & Models ──────────────────────────────────────────────────────────
import { HealthCheckSettings, SettingsData } from '../models/HealthCheckSettings';

const DEFAULT_SETTINGS: SettingsData = {
    vneid_url: 'https://api-vneid.moh.gov.vn/api/v1',
    vneid_username: '',
    vneid_password: '',
    ma_cskcb: '15124',
    ma_gtin_cskcb: '1234567890123',
    auto_sync_enabled: false,
    auto_sync_interval: 15,
    allow_unsigned_sync: false,
    barcode_label_size_xn: '50x30',
    barcode_label_size_ksk: '50x30',
    barcode_show_hospital: true,
    barcode_show_date: true,
    barcode_show_sample_type: true,
};

// ─── Reusable sub-components ─────────────────────────────────────────────────

/** Label + Input field wrapper */
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

/** Section divider with icon and optional badge */
const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; badge?: string }> = ({ icon, title, badge }) => (
    <div className="flex items-center gap-2 mb-1">
        {icon}
        <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">{title}</h3>
        {badge && (
            <span className="text-[10px] font-bold px-2 py-0.5 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 rounded-full">
                {badge}
            </span>
        )}
    </div>
);

/** Toggle switch row with label and description (full-size switch) */
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

/** Compact toggle row for barcode content items (small switch) */
const SmallToggleRow: React.FC<{
    label: string;
    desc: string;
    value: boolean;
    onChange: (v: boolean) => void;
}> = ({ label, desc, value, onChange }) => (
    <div className="flex justify-between items-center">
        <div>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">{desc}</div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-4">
            <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} className="sr-only peer" />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500" />
        </label>
    </div>
);

// ─── Constants ────────────────────────────────────────────────────────────────

/** Options for barcode label sizes (shared for XN and KSK) */
const BARCODE_SIZE_OPTIONS = [
    { value: '50x30', label: 'Tem Nhiệt 50×30 mm (phổ biến nhất)' },
    { value: '40x30', label: 'Tem Nhiệt 40×30 mm' },
    { value: '60x40', label: 'Tem Nhiệt 60×40 mm' },
    { value: 'A4_3x10', label: 'Giấy A4 Decal (3×10 Nhãn/Trang)' },
];

// ─── Main SettingsTab component ───────────────────────────────────────────────

interface SettingsTabProps {
    /** Optional callback when settings are successfully saved */
    onSaved?: () => void;
    defaultTab?: 'VNEID' | 'BARCODE';
    hideTabs?: boolean;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ onSaved, defaultTab = 'VNEID', hideTabs = false }) => {
    const [activeSubTab, setActiveSubTab] = useState<'VNEID' | 'BARCODE'>(defaultTab);

    // Update activeSubTab when defaultTab changes
    useEffect(() => {
        setActiveSubTab(defaultTab);
    }, [defaultTab]);

    // ── VNeID connection ──────────────────────────────────────────────────────
    const [vneidUrl, setVneidUrl] = useState(DEFAULT_SETTINGS.vneid_url);
    const [vneidUsername, setVneidUsername] = useState('');
    const [vneidPassword, setVneidPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // ── Hospital codes ────────────────────────────────────────────────────────
    const [maCskcb, setMaCskcb] = useState(DEFAULT_SETTINGS.ma_cskcb);
    const [maGtinCskcb, setMaGtinCskcb] = useState(DEFAULT_SETTINGS.ma_gtin_cskcb);

    // ── Auto sync ─────────────────────────────────────────────────────────────
    const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
    const [autoSyncInterval, setAutoSyncInterval] = useState(15);
    const [allowUnsignedSync, setAllowUnsignedSync] = useState(false);

    // ── Barcode print ─────────────────────────────────────────────────────────
    const [barcodeLabelSizeXn, setBarcodeLabelSizeXn] = useState('50x30');
    const [barcodeLabelSizeKsk, setBarcodeLabelSizeKsk] = useState('50x30');
    const [barcodeShowHospital, setBarcodeShowHospital] = useState(true);
    const [barcodeShowDate, setBarcodeShowDate] = useState(true);
    const [barcodeShowSampleType, setBarcodeShowSampleType] = useState(true);

    // ── UI status ─────────────────────────────────────────────────────────────
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);

    // ── Load settings from backend on mount ───────────────────────────────────
    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                const settings = await HealthCheckSettings.loadFromServer();
                setVneidUrl(settings.vneid_url);
                setVneidUsername(settings.vneid_username);
                setVneidPassword(settings.vneid_password);
                setMaCskcb(settings.ma_cskcb);
                setMaGtinCskcb(settings.ma_gtin_cskcb);
                setAutoSyncEnabled(settings.auto_sync_enabled);
                setAutoSyncInterval(settings.auto_sync_interval);
                setBarcodeLabelSizeXn(settings.barcode_label_size_xn);
                setBarcodeLabelSizeKsk(settings.barcode_label_size_ksk);
                setBarcodeShowHospital(settings.barcode_show_hospital);
                setBarcodeShowDate(settings.barcode_show_date);
                setBarcodeShowSampleType(settings.barcode_show_sample_type);
                setAllowUnsignedSync(settings.allow_unsigned_sync);
            } catch (error) {
                console.error('Failed to load settings:', error);
                toast.error('Không thể tải cấu hình. Vui lòng thử lại.');
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleSave = async () => {
        const settings = new HealthCheckSettings({
            vneid_url: vneidUrl,
            vneid_username: vneidUsername,
            vneid_password: vneidPassword,
            ma_cskcb: maCskcb,
            ma_gtin_cskcb: maGtinCskcb,
            auto_sync_enabled: autoSyncEnabled,
            auto_sync_interval: autoSyncInterval,
            barcode_label_size_xn: barcodeLabelSizeXn,
            barcode_label_size_ksk: barcodeLabelSizeKsk,
            barcode_show_hospital: barcodeShowHospital,
            barcode_show_date: barcodeShowDate,
            barcode_show_sample_type: barcodeShowSampleType,
            allow_unsigned_sync: allowUnsignedSync,
        });

        const validation = settings.validate();
        if (!validation.isValid) {
            const firstError = Object.values(validation.errors)[0];
            toast.error(firstError || 'Thông tin cấu hình không hợp lệ!');
            return;
        }

        setIsSaving(true);
        try {
            await settings.saveToServer();
            toast.success('Đã lưu cấu hình liên thông thành công!');
            onSaved?.();
        } catch (error: any) {
            toast.error('Lỗi khi lưu cấu hình: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleTestConnection = async () => {
        setIsTesting(true);
        try {
            const res = await healthCheckService.testConnection({
                vneid_url: vneidUrl,
                vneid_username: vneidUsername,
                vneid_password: vneidPassword,
            });
            if (res.success) {
                toast.success(res.message || 'Kết nối thành công!');
            } else {
                toast.error(res.message || 'Kết nối thất bại!');
            }
        } catch (error: any) {
            toast.error('Kết nối thất bại: ' + error.message);
        } finally {
            setIsTesting(false);
        }
    };

    // ── Shared input class ────────────────────────────────────────────────────
    const inputClass =
        'w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none transition';

    // ── Render ────────────────────────────────────────────────────────────────

    if (isLoading) {
        return (
            <div className="py-10 text-center flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                <RefreshIcon className="w-10 h-10 animate-spin text-teal-500 mb-2" />
                Đang tải cấu hình thiết lập...
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Tab header selectors */}
            {!hideTabs && (
                <div className="flex border-b border-slate-200 dark:border-slate-700">
                    <button
                        type="button"
                        onClick={() => setActiveSubTab('VNEID')}
                        className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                            activeSubTab === 'VNEID'
                                ? 'border-[#0f766e] text-[#0f766e]'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        <CloudUploadIcon className="w-4 h-4" />
                        Kết nối cổng VNeID
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSubTab('BARCODE')}
                        className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                            activeSubTab === 'BARCODE'
                                ? 'border-[#0f766e] text-[#0f766e]'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        <PrinterIcon className="w-4 h-4" />
                        Cấu hình in Barcode
                    </button>
                </div>
            )}

            {activeSubTab === 'VNEID' ? (
                /* ══════════════════════════════════════════════════
                    SECTION 1: VNeID Connection
                ══════════════════════════════════════════════════ */
                <section className="space-y-6 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* URL Cổng liên thông */}
                        <FieldGroup label="URL Cổng liên thông (Sandbox / Production)" colSpan="full">
                            <input
                                type="text"
                                value={vneidUrl}
                                onChange={e => setVneidUrl(e.target.value)}
                                className={inputClass}
                                placeholder="https://api-vneid.moh.gov.vn/api/v1"
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
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition"
                                >
                                    {showPassword ? 'Ẩn' : 'Hiện'}
                                </button>
                            </div>
                        </FieldGroup>

                        {/* Mã CSKCB */}
                        <FieldGroup label="Mã cơ sở KCB (MA_CSKCB – 20 ký tự)">
                            <input
                                type="text"
                                maxLength={20}
                                value={maCskcb}
                                onChange={e => setMaCskcb(e.target.value)}
                                className={inputClass}
                                placeholder="15124"
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
                                placeholder="1234567890123"
                            />
                        </FieldGroup>

                        {/* Auto sync toggle */}
                        <div className="md:col-span-2 border-t border-slate-100 dark:border-slate-700 pt-4 space-y-4">
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
                                        className="p-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                    >
                                        <option value={5}>Mỗi 5 phút</option>
                                        <option value={15}>Mỗi 15 phút</option>
                                        <option value={30}>Mỗi 30 phút</option>
                                        <option value={60}>Mỗi 1 giờ</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            ) : (
                /* ══════════════════════════════════════════════════
                    SECTION 2: Barcode Print Configuration
                ══════════════════════════════════════════════════ */
                <section className="space-y-4 animate-in fade-in duration-200">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Cài đặt khổ giấy in mặc định cho máy in nhiệt. Người dùng vẫn có thể thay đổi trực tiếp khi in.
                    </p>

                    {/* Khổ tem XN + KSK */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* XN */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v11.382a1 1 0 00.553.894l2 1a1 1 0 00.894 0l2-1A1 1 0 0015 14.382V3M9 3h6M9 3H7m8 0h2" />
                                </svg>
                                Khổ tem Barcode XN (Xét nghiệm)
                            </label>
                            <select
                                value={barcodeLabelSizeXn}
                                onChange={e => setBarcodeLabelSizeXn(e.target.value)}
                                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none cursor-pointer"
                            >
                                {BARCODE_SIZE_OPTIONS.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                            <p className="text-[11px] text-slate-400">Zebra ZD220/ZD420: 50×30mm · Xprinter XP-420B: 40×30mm</p>
                        </div>

                        {/* KSK */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Khổ tem Barcode KSK (Khám sức khỏe)
                            </label>
                            <select
                                value={barcodeLabelSizeKsk}
                                onChange={e => setBarcodeLabelSizeKsk(e.target.value)}
                                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none cursor-pointer"
                            >
                                {BARCODE_SIZE_OPTIONS.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                            <p className="text-[11px] text-slate-400">TSC TTP-244 Pro: 60×40mm · Brother QL-820: A4</p>
                        </div>
                    </div>

                    {/* Nội dung hiển thị trên tem */}
                    <div className="space-y-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                        <div className="text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                            Nội dung hiển thị trên tem
                        </div>
                        <SmallToggleRow
                            label="Tên cơ sở y tế"
                            desc="In tên phòng khám / bệnh viện ở đầu tem"
                            value={barcodeShowHospital}
                            onChange={setBarcodeShowHospital}
                        />
                        <SmallToggleRow
                            label="Ngày lấy mẫu / Ngày khám"
                            desc="In ngày của phiếu xét nghiệm / hồ sơ"
                            value={barcodeShowDate}
                            onChange={setBarcodeShowDate}
                        />
                        <SmallToggleRow
                            label="Loại mẫu xét nghiệm"
                            desc="In loại mẫu (Máu tĩnh mạch, Nước tiểu...)"
                            value={barcodeShowSampleType}
                            onChange={setBarcodeShowSampleType}
                        />
                    </div>
                </section>
            )}

            {/* ══════════════════════════════════════════════════
                ACTION BUTTONS
            ══════════════════════════════════════════════════ */}
            <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-700 pt-4">
                {activeSubTab === 'VNEID' && (
                    <button
                        type="button"
                        disabled={isTesting || isSaving}
                        onClick={handleTestConnection}
                        className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg font-bold text-sm transition disabled:opacity-50 cursor-pointer"
                    >
                        {isTesting ? 'Đang ping...' : 'Kiểm tra kết nối'}
                    </button>
                )}
                <button
                    type="button"
                    disabled={isTesting || isSaving}
                    onClick={handleSave}
                    className="px-5 py-2 bg-[#0f766e] hover:bg-[#0d645c] text-white rounded-lg font-bold text-sm shadow-md transition disabled:opacity-50 active:scale-95 cursor-pointer"
                >
                    {isSaving ? 'Đang lưu...' : 'Lưu cấu hình'}
                </button>
            </div>
        </div>
    );
};

export default SettingsTab;
