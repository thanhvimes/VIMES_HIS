// File: modules/health-check-sync/components/settings/BarcodeConfigTab.tsx

import React from 'react';

interface BarcodeConfigTabProps {
    barcodeLabelSizeXn: string;
    setBarcodeLabelSizeXn: (v: string) => void;
    barcodeLabelSizeKsk: string;
    setBarcodeLabelSizeKsk: (v: string) => void;
    barcodeShowHospital: boolean;
    setBarcodeShowHospital: (v: boolean) => void;
    barcodeShowDate: boolean;
    setBarcodeShowDate: (v: boolean) => void;
    barcodeShowSampleType: boolean;
    setBarcodeShowSampleType: (v: boolean) => void;
    barcodeZplTemplateXn: string;
    setBarcodeZplTemplateXn: (v: string) => void;
    barcodeZplTemplateKsk: string;
    setBarcodeZplTemplateKsk: (v: string) => void;
    barcodePrinterName: string;
    setBarcodePrinterName: (v: string) => void;
    useQzTray: boolean;
    setUseQzTray: (v: boolean) => void;
    inputClass: string;
}

const BARCODE_SIZE_OPTIONS = [
    { value: '50x30', label: 'Tem Nhiệt 50×30 mm (phổ biến nhất)' },
    { value: '40x30', label: 'Tem Nhiệt 40×30 mm' },
    { value: '60x40', label: 'Tem Nhiệt 60×40 mm' },
    { value: 'A4_3x10', label: 'Giấy A4 Decal (3×10 Nhãn/Trang)' },
];

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

export const BarcodeConfigTab: React.FC<BarcodeConfigTabProps> = ({
    barcodeLabelSizeXn,
    setBarcodeLabelSizeXn,
    barcodeLabelSizeKsk,
    setBarcodeLabelSizeKsk,
    barcodeShowHospital,
    setBarcodeShowHospital,
    barcodeShowDate,
    setBarcodeShowDate,
    barcodeShowSampleType,
    setBarcodeShowSampleType,
    barcodeZplTemplateXn,
    setBarcodeZplTemplateXn,
    barcodeZplTemplateKsk,
    setBarcodeZplTemplateKsk,
    barcodePrinterName,
    setBarcodePrinterName,
    useQzTray,
    setUseQzTray,
    inputClass
}) => {
    return (
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

            {/* Máy in thô & Mẫu ZPL */}
            <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                    Cấu hình máy in thô & Mẫu ZPL (In im lặng qua QZ Tray)
                </div>

                <div className="border-b border-slate-250/50 dark:border-slate-700 pb-3">
                    <ToggleRow
                        label="Sử dụng gửi ra máy in (In im lặng qua QZ Tray)"
                        desc="Bật để gửi lệnh in trực tiếp tới máy in thô ZPL/HTML qua ứng dụng QZ Tray (in không hiện hộp thoại trình duyệt)."
                        value={useQzTray}
                        onChange={setUseQzTray}
                    />
                </div>
                
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tên máy in nhãn nhắm tới (Printer Name)</label>
                    <input
                        type="text"
                        value={barcodePrinterName}
                        onChange={e => setBarcodePrinterName(e.target.value)}
                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-sm focus:ring-1 focus:ring-teal-500 focus:outline-none"
                        placeholder="Ví dụ: Zebra, TSC, Xprinter,..."
                    />
                    <p className="text-[10px] text-slate-500">Mã in sẽ tìm kiếm máy in chứa cụm từ này trong hệ thống Windows.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Mẫu thiết kế ZPL - Xét nghiệm (XN)</label>
                        <textarea
                            value={barcodeZplTemplateXn}
                            onChange={e => setBarcodeZplTemplateXn(e.target.value)}
                            rows={8}
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-xs font-mono focus:ring-1 focus:ring-teal-500 focus:outline-none"
                            placeholder="^XA...^XZ"
                        />
                        <p className="text-[10px] text-slate-400">Từ khóa thay thế: {"{hospital}"}, {"{patient}"}, {"{test}"}, {"{sample_type}"}, {"{date}"}, {"{code}"}</p>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Mẫu thiết kế ZPL - Khám sức khỏe (KSK)</label>
                        <textarea
                            value={barcodeZplTemplateKsk}
                            onChange={e => setBarcodeZplTemplateKsk(e.target.value)}
                            rows={8}
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-xs font-mono focus:ring-1 focus:ring-teal-500 focus:outline-none"
                            placeholder="^XA...^XZ"
                        />
                        <p className="text-[10px] text-slate-400">Từ khóa thay thế: {"{hospital}"}, {"{patient}"}, {"{form_name}"}, {"{info}"}, {"{code}"}</p>
                    </div>
                </div>
            </div>

            {/* Nội dung hiển thị trên tem */}
            <div className="space-y-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                    Nội dung hiển thị trên tem (In qua Trình duyệt mặc định)
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
    );
};
