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

// import sub-tabs
import { GeneralConfigTab } from './settings/GeneralConfigTab';
import { SignatureConfigTab } from './settings/SignatureConfigTab';
import { BarcodeConfigTab } from './settings/BarcodeConfigTab';
import { ReceptionSlipTab } from './settings/ReceptionSlipTab';

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
    barcode_zpl_template_xn: '^XA\n^CF0,26\n^FO30,30^FD{hospital}^FS\n^FO30,70^FD{patient}^FS\n^FO30,105^FD{test}^FS\n^FO30,140^FD{sample_type} - {date}^FS\n^BY2,2,40\n^FO30,175^BCN,,N,N\n^FD{code}^FS\n^FO30,225^FD{code}^FS\n^XZ',
    barcode_zpl_template_ksk: '^XA\n^CF0,26\n^FO30,30^FD{hospital}^FS\n^FO30,70^FD{patient}^FS\n^FO30,105^FD{form_name}^FS\n^FO30,140^FD{info}^FS\n^BY2,2,40\n^FO30,175^BCN,,N,N\n^FD{code}^FS\n^FO30,225^FD{code}^FS\n^XZ',
    barcode_printer_name: 'Zebra',
    reception_slip_template: '',
    use_qz_tray: false,
    vneid_private_key: '',
    vneid_public_key: '',
};

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
    defaultTab?: 'VNEID' | 'SIGNATURE' | 'BARCODE' | 'RECEPTION_SLIP';
    hideTabs?: boolean;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ onSaved, defaultTab = 'VNEID', hideTabs = false }) => {
    const [activeSubTab, setActiveSubTab] = useState<'VNEID' | 'SIGNATURE' | 'BARCODE' | 'RECEPTION_SLIP'>(
        defaultTab === 'VNEID' ? 'VNEID' : defaultTab
    );

    // Update activeSubTab when defaultTab changes
    useEffect(() => {
        setActiveSubTab(defaultTab === 'VNEID' ? 'VNEID' : defaultTab);
    }, [defaultTab]);

    // ── VNeID connection ──────────────────────────────────────────────────────
    const [vneidUrl, setVneidUrl] = useState(DEFAULT_SETTINGS.vneid_url);
    const [vneidUsername, setVneidUsername] = useState('');
    const [vneidPassword, setVneidPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [vneidPrivateKey, setVneidPrivateKey] = useState('');
    const [vneidPublicKey, setVneidPublicKey] = useState('');
    const [signatureType, setSignatureType] = useState<'USB' | 'HSM'>('HSM');
    
    // HSM Settings
    const [hsmUrl, setHsmUrl] = useState('http://vimes.xyz:8091');
    const [hsmProvider, setHsmProvider] = useState('VNPT-CA');
    const [hsmUsername, setHsmUsername] = useState('');
    const [hsmPassword, setHsmPassword] = useState('');
    const [hsmClientId, setHsmClientId] = useState('');
    const [hsmClientSecret, setHsmClientSecret] = useState('');
    const [showHsmPassword, setShowHsmPassword] = useState(false);
    const [showHsmSecret, setShowHsmSecret] = useState(false);

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
    const [barcodeZplTemplateXn, setBarcodeZplTemplateXn] = useState('');
    const [barcodeZplTemplateKsk, setBarcodeZplTemplateKsk] = useState('');
    const [barcodePrinterName, setBarcodePrinterName] = useState('Zebra');
    const [useQzTray, setUseQzTray] = useState(false);

    // ── Reception Slip ────────────────────────────────────────────────────────
    const [receptionSlipTemplate, setReceptionSlipTemplate] = useState('');

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
                setBarcodeZplTemplateXn(settings.barcode_zpl_template_xn || '');
                setBarcodeZplTemplateKsk(settings.barcode_zpl_template_ksk || '');
                setBarcodePrinterName(settings.barcode_printer_name || 'Zebra');
                setUseQzTray(settings.use_qz_tray === true);
                setReceptionSlipTemplate(settings.reception_slip_template || '');
                setVneidPrivateKey(settings.vneid_private_key || '');
                setVneidPublicKey(settings.vneid_public_key || '');
                setSignatureType(settings.signature_type || 'HSM');
                setHsmUrl(settings.hsm_url || 'http://vimes.xyz:8091');
                setHsmProvider(settings.hsm_provider || 'VNPT-CA');
                setHsmUsername(settings.hsm_username || '');
                setHsmPassword(settings.hsm_password || '');
                setHsmClientId(settings.hsm_client_id || '');
                setHsmClientSecret(settings.hsm_client_secret || '');
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
            barcode_zpl_template_xn: barcodeZplTemplateXn,
            barcode_zpl_template_ksk: barcodeZplTemplateKsk,
            barcode_printer_name: barcodePrinterName,
            reception_slip_template: receptionSlipTemplate,
            use_qz_tray: useQzTray,
            vneid_private_key: vneidPrivateKey,
            vneid_public_key: vneidPublicKey,
            signature_type: signatureType,
            hsm_url: hsmUrl,
            hsm_provider: hsmProvider,
            hsm_username: hsmUsername,
            hsm_password: hsmPassword,
            hsm_client_id: hsmClientId,
            hsm_client_secret: hsmClientSecret,
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
                ma_cskcb: maCskcb,
            });
            if (res.success) {
                toast.success('Kết nối cổng VNeID thành công!');
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
                    {defaultTab === 'VNEID' && (
                        <>
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
                                Cấu hình chung
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveSubTab('SIGNATURE')}
                                className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                                    activeSubTab === 'SIGNATURE'
                                        ? 'border-[#0f766e] text-[#0f766e]'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                            >
                                <AdjustmentsHorizontalIcon className="w-4 h-4" />
                                Thiết lập chữ ký
                            </button>
                        </>
                    )}
                    {defaultTab === 'BARCODE' && (
                        <>
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
                            <button
                                type="button"
                                onClick={() => setActiveSubTab('RECEPTION_SLIP')}
                                className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                                    activeSubTab === 'RECEPTION_SLIP'
                                        ? 'border-[#0f766e] text-[#0f766e]'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                            >
                                <PrinterIcon className="w-4 h-4" />
                                Mẫu in phiếu tiếp đón
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Tab content renders */}
            {activeSubTab === 'VNEID' ? (
                <GeneralConfigTab
                    vneidUrl={vneidUrl}
                    setVneidUrl={setVneidUrl}
                    vneidUsername={vneidUsername}
                    setVneidUsername={setVneidUsername}
                    vneidPassword={vneidPassword}
                    setVneidPassword={setVneidPassword}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    vneidPrivateKey={vneidPrivateKey}
                    setVneidPrivateKey={setVneidPrivateKey}
                    vneidPublicKey={vneidPublicKey}
                    setVneidPublicKey={setVneidPublicKey}
                    maCskcb={maCskcb}
                    setMaCskcb={setMaCskcb}
                    maGtinCskcb={maGtinCskcb}
                    setMaGtinCskcb={setMaGtinCskcb}
                    autoSyncEnabled={autoSyncEnabled}
                    setAutoSyncEnabled={setAutoSyncEnabled}
                    autoSyncInterval={autoSyncInterval}
                    setAutoSyncInterval={setAutoSyncInterval}
                    allowUnsignedSync={allowUnsignedSync}
                    setAllowUnsignedSync={setAllowUnsignedSync}
                    inputClass={inputClass}
                />
            ) : activeSubTab === 'SIGNATURE' ? (
                <SignatureConfigTab
                    signatureType={signatureType}
                    setSignatureType={setSignatureType}
                    hsmUrl={hsmUrl}
                    setHsmUrl={setHsmUrl}
                    hsmProvider={hsmProvider}
                    setHsmProvider={setHsmProvider}
                    hsmUsername={hsmUsername}
                    setHsmUsername={setHsmUsername}
                    hsmPassword={hsmPassword}
                    setHsmPassword={setHsmPassword}
                    hsmClientId={hsmClientId}
                    setHsmClientId={setHsmClientId}
                    hsmClientSecret={hsmClientSecret}
                    setHsmClientSecret={setHsmClientSecret}
                    showHsmPassword={showHsmPassword}
                    setShowHsmPassword={setShowHsmPassword}
                    showHsmSecret={showHsmSecret}
                    setShowHsmSecret={setShowHsmSecret}
                    inputClass={inputClass}
                />
            ) : activeSubTab === 'BARCODE' ? (
                <BarcodeConfigTab
                    barcodeLabelSizeXn={barcodeLabelSizeXn}
                    setBarcodeLabelSizeXn={setBarcodeLabelSizeXn}
                    barcodeLabelSizeKsk={barcodeLabelSizeKsk}
                    setBarcodeLabelSizeKsk={setBarcodeLabelSizeKsk}
                    barcodeShowHospital={barcodeShowHospital}
                    setBarcodeShowHospital={setBarcodeShowHospital}
                    barcodeShowDate={barcodeShowDate}
                    setBarcodeShowDate={setBarcodeShowDate}
                    barcodeShowSampleType={barcodeShowSampleType}
                    setBarcodeShowSampleType={setBarcodeShowSampleType}
                    barcodeZplTemplateXn={barcodeZplTemplateXn}
                    setBarcodeZplTemplateXn={setBarcodeZplTemplateXn}
                    barcodeZplTemplateKsk={barcodeZplTemplateKsk}
                    setBarcodeZplTemplateKsk={setBarcodeZplTemplateKsk}
                    barcodePrinterName={barcodePrinterName}
                    setBarcodePrinterName={setBarcodePrinterName}
                    useQzTray={useQzTray}
                    setUseQzTray={setUseQzTray}
                    inputClass={inputClass}
                />
            ) : (
                <ReceptionSlipTab
                    receptionSlipTemplate={receptionSlipTemplate}
                    setReceptionSlipTemplate={setReceptionSlipTemplate}
                    inputClass={inputClass}
                />
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
