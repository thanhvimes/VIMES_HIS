// File: modules/health-check-sync/components/settings/BarcodeConfigTab.tsx

import React, { useState } from 'react';
import PrintBarcodeXnForm from '../../forms/PrintBarcodeXnForm';
import PrintBarcodeForm, { Code128Barcode } from '../../forms/PrintBarcodeForm';

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

// MOCK DATA ĐỂ IN THỬ TEM
const mockXnTestPayload = [
    {
        patient: {
            id: 'test-patient-1',
            patientName: 'Test22222',
            dob: '1980-01-01',
            age: '46',
            gender: 'Nam',
            docNo: '26265991',
            deptCode: 'KB',
            labOrders: [],
            contractId: 'demo-contract',
        },
        orders: [
            {
                id: 'order-test-1',
                orderNo: '13312658',
                testName: 'Tổng phân tích máu (CBC)',
                sampleType: 'Máu tĩnh mạch',
                sampleTypeShort: 'SH',
                sampleDate: '2026-06-20T15:33:00',
                status: 'pending' as const,
                barcodePrinted: false,
            }
        ]
    }
];

const mockKskTestDoc = [
    {
        id: 'test-ksk-doc-1',
        doc_no: '26265991',
        patient_name: 'Test22222',
        yob: 1980,
        gender: 'Nam',
        company_name: 'BỆNH VIỆN ĐK TỈNH NINH BÌNH',
        barcode_printed: 'N',
    }
];

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
    const [showTestPrintXn, setShowTestPrintXn] = useState(false);
    const [showTestPrintKsk, setShowTestPrintKsk] = useState(false);

    return (
        <section className="space-y-4 animate-in fade-in duration-200">
            {/* Header intro & action buttons */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Cài đặt khổ giấy in mặc định và xem trước mẫu tem trực tiếp trước khi lưu.
                </p>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setShowTestPrintXn(true)}
                        className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        In thử mẫu tem XN
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowTestPrintKsk(true)}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        In thử mẫu tem KSK
                    </button>
                </div>
            </div>

            {/* LIVE PREVIEW & TEST PRINT SECTION */}
            <div className="bg-gradient-to-br from-slate-50 to-orange-50/30 dark:from-slate-800/40 dark:to-orange-950/20 rounded-xl p-4 border border-orange-200/80 dark:border-orange-900/40 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-orange-200/60 dark:border-orange-900/30 pb-2">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse inline-block"></span>
                        <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                            Xem trước mẫu tem trực tiếp (Live Preview & Test Print)
                        </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Bấm nút <strong className="text-orange-600 dark:text-orange-400">"In thử"</strong> để gửi lệnh in ra máy in thực tế
                    </span>
                </div>

                {/* Live Sticker Mockup Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* Tem XN Live Preview */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 shadow-sm flex flex-col items-center">
                        <div className="w-full flex items-center justify-between mb-2">
                            <span className="text-xs font-extrabold text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                Mẫu Tem Xét Nghiệm (XN)
                            </span>
                            <button
                                type="button"
                                onClick={() => setShowTestPrintXn(true)}
                                className="px-2.5 py-1 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 text-[11px] font-bold rounded-md transition flex items-center gap-1 cursor-pointer"
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                In thử tem XN
                            </button>
                        </div>
                        
                        {/* Real scale sticker preview box */}
                        <div 
                            className="border border-slate-400 bg-white text-black p-2.5 flex flex-col justify-between shadow-md rounded-md my-1"
                            style={{
                                width: barcodeLabelSizeXn === '60x40' ? '210px' : barcodeLabelSizeXn === '40x30' ? '155px' : '185px',
                                height: barcodeLabelSizeXn === '60x40' ? '140px' : barcodeLabelSizeXn === '40x30' ? '102px' : '112px',
                                boxSizing: 'border-box',
                                fontFamily: '"Arial", sans-serif',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', lineHeight: 1.1 }}>
                                <span style={{ fontSize: '13px', fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Test22222</span>
                                <span style={{ fontSize: '13.5px', fontWeight: 900 }}>46</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10.5px', fontWeight: 800, marginTop: '1px' }}>
                                <span style={{ fontFamily: 'monospace' }}>26265991</span>
                                <span style={{ fontWeight: 900 }}>M</span>
                                <span style={{ fontWeight: 900 }}>KB</span>
                            </div>
                            <div style={{ textAlign: 'center', margin: '2px 0' }}>
                                <Code128Barcode value="13312658" height={22} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', lineHeight: 1 }}>
                                <div style={{ width: '20px' }} />
                                <div style={{ fontSize: '10.5px', fontWeight: 800, fontFamily: 'monospace' }}>13312658</div>
                                <div style={{ fontSize: '16px', fontWeight: 900, textAlign: 'right', minWidth: '20px', lineHeight: 0.9 }}>SH</div>
                            </div>
                            <div style={{ fontSize: '8px', fontWeight: 700, fontFamily: 'monospace', marginTop: '1px' }}>
                                20/06/2026 15:33
                            </div>
                        </div>
                    </div>

                    {/* Tem KSK Live Preview */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 shadow-sm flex flex-col items-center">
                        <div className="w-full flex items-center justify-between mb-2">
                            <span className="text-xs font-extrabold text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                                Mẫu Tem Khám Sức Khỏe (KSK)
                            </span>
                            <button
                                type="button"
                                onClick={() => setShowTestPrintKsk(true)}
                                className="px-2.5 py-1 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 text-[11px] font-bold rounded-md transition flex items-center gap-1 cursor-pointer"
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                In thử tem KSK
                            </button>
                        </div>

                        <div 
                            className="border border-slate-400 bg-white text-black p-2.5 flex flex-col justify-between shadow-md rounded-md my-1"
                            style={{
                                width: barcodeLabelSizeKsk === '60x40' ? '210px' : barcodeLabelSizeKsk === '40x30' ? '155px' : '185px',
                                height: barcodeLabelSizeKsk === '60x40' ? '140px' : barcodeLabelSizeKsk === '40x30' ? '102px' : '112px',
                                boxSizing: 'border-box',
                                fontFamily: '"Arial", sans-serif',
                            }}
                        >
                            {barcodeShowHospital && (
                                <div style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', borderBottom: '0.5px solid black', paddingBottom: '1px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    BỆNH VIỆN ĐK TỈNH NINH BÌNH
                                </div>
                            )}
                            <div style={{ textAlign: 'center', margin: '2px 0' }}>
                                <Code128Barcode value="26265991" height={24} />
                            </div>
                            <div style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                Test22222
                            </div>
                            <div style={{ fontSize: '9px', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                                <span>Năm sinh: 1980</span>
                                <span>Nam</span>
                            </div>
                            {barcodeShowDate && (
                                <div style={{ fontSize: '8px', fontWeight: 700, color: '#c2410c', borderTop: '0.5px solid #e2e8f0', paddingTop: '1px', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>KSK Lao Động</span>
                                    <span>20/06/2026</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Khổ tem XN + KSK */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* XN */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v11.382a1 1 0 00.553.894l2 1a1 1 0 00.894 0l2-1A1 1 0 0015 14.382V3M9 3h6M9 3H7m8 0h2" />
                            </svg>
                            Khổ tem Barcode XN (Xét nghiệm)
                        </label>
                        <button
                            type="button"
                            onClick={() => setShowTestPrintXn(true)}
                            className="text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                            In thử XN 🖨
                        </button>
                    </div>
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
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Khổ tem Barcode KSK (Khám sức khỏe)
                        </label>
                        <button
                            type="button"
                            onClick={() => setShowTestPrintKsk(true)}
                            className="text-[11px] font-bold text-teal-600 hover:text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                            In thử KSK 🖨
                        </button>
                    </div>
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
                <div className="text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-widest flex items-center justify-between">
                    <span>Cấu hình máy in thô & Mẫu ZPL (In im lặng qua QZ Tray)</span>
                    <span className="text-[10px] text-slate-400 normal-case font-normal">Sử dụng máy in nhãn chuyên dụng Zebra/TSC</span>
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
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Mẫu thiết kế ZPL - Xét nghiệm (XN)</label>
                            <button
                                type="button"
                                onClick={() => setShowTestPrintXn(true)}
                                className="text-[10px] font-bold text-orange-600 hover:underline"
                            >
                                In thử ZPL XN 🖨
                            </button>
                        </div>
                        <textarea
                            value={barcodeZplTemplateXn}
                            onChange={e => setBarcodeZplTemplateXn(e.target.value)}
                            rows={8}
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-xs font-mono focus:ring-1 focus:ring-teal-500 focus:outline-none"
                            placeholder="^XA...^XZ"
                        />
                        <p className="text-[10px] text-slate-400">Từ khóa: {"{patient}"}, {"{age}"}, {"{doc_no}"}, {"{gender}"}, {"{dept}"}, {"{code}"}, {"{sample_type_short}"}, {"{date}"}</p>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Mẫu thiết kế ZPL - Khám sức khỏe (KSK)</label>
                            <button
                                type="button"
                                onClick={() => setShowTestPrintKsk(true)}
                                className="text-[10px] font-bold text-teal-600 hover:underline"
                            >
                                In thử ZPL KSK 🖨
                            </button>
                        </div>
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

            {/* TEST PRINT MODALS */}
            {showTestPrintXn && (
                <PrintBarcodeXnForm
                    payload={mockXnTestPayload}
                    defaultLabelSize={barcodeLabelSizeXn as any}
                    showHospital={barcodeShowHospital}
                    showDate={barcodeShowDate}
                    showSampleType={barcodeShowSampleType}
                    onClose={() => setShowTestPrintXn(false)}
                />
            )}

            {showTestPrintKsk && (
                <PrintBarcodeForm
                    documents={mockKskTestDoc}
                    defaultLabelSize={barcodeLabelSizeKsk as any}
                    showHospital={barcodeShowHospital}
                    showDate={barcodeShowDate}
                    showSampleType={barcodeShowSampleType}
                    onClose={() => setShowTestPrintKsk(false)}
                />
            )}
        </section>
    );
};

