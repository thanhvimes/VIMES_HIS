// ==================== PRINT BARCODE XN FORM ====================
// File: modules/health-check-sync/forms/PrintBarcodeXnForm.tsx
// Form in tem barcode nhiệt cho phiếu Xét Nghiệm (XN)
// Hỗ trợ: CSS @page (in qua hộp thoại trình duyệt) với đúng khổ giấy nhiệt

import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSystemStore } from '../../../stores/useSystemStore';
import { Code128Barcode } from './PrintBarcodeForm';
import { PatientWithOrders, LabOrder, calculateAge, getGenderShort, getSampleTypeShort, formatDateTime } from '../components/PrintBarcodeXnModal';
import { HealthCheckSettings } from '../models/HealthCheckSettings';
import { qzPrinterService } from '../../../services/qzPrinterService';
import { toast } from 'sonner';

// ========== TYPES ==========

type LabelSize = '50x30' | '40x30' | '60x40' | 'A4_3x10';

export interface PrintXnPayload {
    patient: PatientWithOrders;
    orders: LabOrder[];
}

interface PrintBarcodeXnFormProps {
    payload: PrintXnPayload[];
    onClose: () => void;
    defaultLabelSize?: LabelSize;   // Từ Cấu hình hệ thống
    showHospital?: boolean;         // Hiện tên cơ sở
    showDate?: boolean;             // Hiện ngày
    showSampleType?: boolean;       // Hiện loại mẫu
}

// ========== LABEL SIZE CONFIG ==========
const LABEL_CONFIG: Record<LabelSize, { w: number; h: number; label: string; barcodeH: number }> = {
    '50x30': { w: 50, h: 30, label: 'Tem Nhiệt 50×30 mm', barcodeH: 26 },
    '40x30': { w: 40, h: 30, label: 'Tem Nhiệt 40×30 mm', barcodeH: 20 },
    '60x40': { w: 60, h: 40, label: 'Tem Nhiệt 60×40 mm', barcodeH: 34 },
    'A4_3x10': { w: 210, h: 297, label: 'Giấy A4 Decal (3×10 Nhãn)', barcodeH: 20 },
};

// ========== COMPONENT ==========

const PrintBarcodeXnForm: React.FC<PrintBarcodeXnFormProps> = ({
    payload,
    onClose,
    defaultLabelSize = '50x30',
    showHospital = true,
    showDate = true,
    showSampleType = true,
}) => {
    const { hospitalName } = useSystemStore();
    // Dùng defaultLabelSize từ settings làm giá trị mặc định, user vẫn có thể đổi trực tiếp
    const [labelSize, setLabelSize] = useState<LabelSize>(defaultLabelSize);
    const [showGuide, setShowGuide] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    // Portal container
    const [portalContainer] = React.useState(() => {
        const div = window.document.createElement('div');
        div.className = 'print-barcode-xn-portal-container';
        return div;
    });

    const totalLabels = payload.reduce((sum, p) => sum + p.orders.length, 0);
    const allLabels = payload.flatMap(p =>
        p.orders.map(order => ({ patient: p.patient, order }))
    );

    const printViaQzZpl = async (settings: HealthCheckSettings): Promise<boolean> => {
        try {
            const printerName = settings.barcode_printer_name || 'Zebra';
            const template = settings.barcode_zpl_template_xn;
            if (!template) {
                console.warn("Chưa cấu hình mẫu ZPL cho Xét nghiệm");
                return false;
            }

            for (const item of allLabels) {
                // Replace ZPL template placeholders with real values
                let zpl = template
                    .replace(/{hospital}/g, hospitalName || 'PHÒNG KHÁM vCLINIC')
                    .replace(/{patient}/g, item.patient.patientName)
                    .replace(/{age}/g, String(item.patient.age || calculateAge(item.patient.dob) || ''))
                    .replace(/{doc_no}/g, item.patient.docNo)
                    .replace(/{gender}/g, getGenderShort(item.patient.gender))
                    .replace(/{dept}/g, item.patient.deptCode || 'KB')
                    .replace(/{test}/g, item.order.testName)
                    .replace(/{sample_type}/g, item.order.sampleType)
                    .replace(/{sample_type_short}/g, item.order.sampleTypeShort || getSampleTypeShort(item.order.testName, item.order.sampleType))
                    .replace(/{date}/g, formatDateTime(item.order.sampleDate))
                    .replace(/{code}/g, item.order.orderNo);

                await qzPrinterService.printZPL(printerName, zpl);
            }
            toast.success(`Đã in ${totalLabels} tem qua QZ Tray thành công!`);
            onClose();
            return true;
        } catch (err: any) {
            console.error("ZPL print error via QZ Tray:", err);
            toast.error("Không thể in qua QZ Tray: " + err.message + ". Đang chuyển sang chế độ in trình duyệt...");
            return false;
        }
    };

    React.useEffect(() => {
        window.document.body.appendChild(portalContainer);
        
        const runPrint = async () => {
            try {
                const settings = await HealthCheckSettings.loadFromServer();
                // Nếu được thiết lập sử dụng QZ Tray và tên máy in, mẫu ZPL thô, thực hiện in trực tiếp qua QZ Tray
                if (settings.use_qz_tray && settings.barcode_printer_name && settings.barcode_zpl_template_xn) {
                    const success = await printViaQzZpl(settings);
                    if (success) return; // In thành công, dừng lại không mở cửa sổ in trình duyệt
                }
            } catch (err) {
                console.warn("QZ Tray print fallback to default browser print:", err);
            }
            
            // Fallback: Tự động in trình duyệt như cũ
            setTimeout(() => {
                handlePrint();
            }, 300);
        };

        runPrint();

        return () => {
            if (window.document.body.contains(portalContainer)) {
                window.document.body.removeChild(portalContainer);
            }
        };
    }, [portalContainer]);

    const handlePrint = () => {
        const cfg = LABEL_CONFIG[labelSize];
        const styleId = 'vclinic-barcode-xn-page-style';
        let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = styleId;
            document.head.appendChild(styleEl);
        }

        if (labelSize === 'A4_3x10') {
            styleEl.textContent = `@page { size: A4 portrait; margin: 10mm; }`;
        } else {
            styleEl.textContent = `@page { size: ${cfg.w}mm ${cfg.h}mm; margin: 0mm; }`;
        }

        window.print();

        // Cleanup và tự động đóng form quay lại modal danh sách
        setTimeout(() => {
            const el = document.getElementById(styleId);
            if (el) el.remove();
            onClose();
        }, 1000);
    };

    if (!payload || payload.length === 0) return null;

    const cfg = LABEL_CONFIG[labelSize];

    return createPortal(
        <div className="print-xn-wrapper fixed inset-0 bg-slate-100 dark:bg-slate-900 z-50 overflow-auto py-6 px-4 print:p-0 print:bg-white select-text font-sans">
            <style>{`
                @media screen {
                    .xn-label-preview {
                        background: white; color: black;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.12);
                        border-radius: 6px; border: 1px solid #e2e8f0;
                        margin: 0 auto 1.5rem auto; overflow: hidden;
                    }
                    .xn-label-50x30 { width: 50mm; height: 30mm; }
                    .xn-label-40x30 { width: 40mm; height: 30mm; }
                    .xn-label-60x40 { width: 60mm; height: 40mm; }
                    .xn-label-a4-grid { width: 210mm; min-height: 297mm; padding: 10mm; background: white; }
                    .xn-a4-grid-layout { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2mm; }
                    .xn-a4-decal-item { border: 1px dashed #cbd5e1; height: 27mm; padding: 1.5mm; display: flex; flex-direction: column; justify-content: space-between; }
                }
                @media print {
                    #root { display: none !important; }
                    body { background: white !important; margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .print-barcode-xn-portal-container { display: block !important; position: static !important; overflow: visible !important; }
                    .print-xn-wrapper { position: static !important; overflow: visible !important; padding: 0 !important; margin: 0 !important; background: white !important; }
                    .no-print { display: none !important; }
                    .xn-label-preview { box-shadow: none !important; border: none !important; border-radius: 0 !important; margin: 0 !important; break-after: page; page-break-after: always; overflow: visible !important; }
                    .xn-label-preview:last-child { break-after: avoid !important; page-break-after: avoid !important; }
                    .xn-label-50x30 { width: 50mm !important; height: 30mm !important; }
                    .xn-label-40x30 { width: 40mm !important; height: 30mm !important; }
                    .xn-label-60x40 { width: 60mm !important; height: 40mm !important; }
                    .xn-label-a4-grid { width: 100% !important; min-height: 0 !important; padding: 0 !important; }
                    .xn-a4-decal-item { border: 1px solid transparent !important; }
                }
                .xn-label-font { font-family: "Arial", "Helvetica Neue", sans-serif; color: black; }
            `}</style>

            {/* ===== CONTROL PANEL ===== */}
            <div className="no-print mb-5 max-w-3xl mx-auto space-y-3">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm flex items-center justify-between gap-4 flex-wrap">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
                            <span className="text-sm font-black text-slate-800 dark:text-white">In Barcode Phiếu Xét Nghiệm</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 ml-4">
                            Chuẩn bị in <strong className="text-orange-600">{totalLabels} tem</strong> cho{' '}
                            <strong>{payload.length} bệnh nhân</strong>
                            {' · '}
                            <span className="text-slate-400">Cấu hình mặc định từ Cài đặt hệ thống</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <select
                            value={labelSize}
                            onChange={e => setLabelSize(e.target.value as LabelSize)}
                            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer"
                        >
                            {Object.entries(LABEL_CONFIG).map(([key, val]) => (
                                <option key={key} value={key}>{val.label}</option>
                            ))}
                        </select>

                        <button
                            onClick={() => setShowGuide(!showGuide)}
                            className={`px-3 py-2 border rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                                showGuide
                                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
                                    : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Hướng dẫn in
                        </button>

                        <button
                            onClick={onClose}
                            className="px-3 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-xs font-bold transition"
                        >
                            Đóng
                        </button>

                        <button
                            onClick={handlePrint}
                            className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-black rounded-lg shadow-md hover:shadow-lg transition active:scale-95 flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            In {totalLabels} tem ({cfg.w}×{cfg.h}mm)
                        </button>
                    </div>
                </div>

                {/* Hướng dẫn in */}
                {showGuide && (
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-xl p-4 text-xs text-slate-700 dark:text-slate-300 space-y-3 animate-in fade-in duration-200">
                        <div className="font-extrabold text-blue-800 dark:text-blue-300 flex items-center gap-2 text-sm">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Hướng dẫn in đúng khổ máy in nhiệt
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                    <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">1</span>
                                    Trước khi in — Cấu hình driver máy in
                                </div>
                                <ul className="ml-7 space-y-1 text-slate-600 dark:text-slate-400 list-disc list-outside">
                                    <li>Vào <strong>Control Panel → Devices and Printers</strong></li>
                                    <li>Chuột phải vào máy in nhiệt → <strong>Printing Preferences</strong></li>
                                    <li>Tạo <strong>Custom Paper Size</strong>: Rộng = <strong>{labelSize !== 'A4_3x10' ? cfg.w : 210}mm</strong>, Cao = <strong>{labelSize !== 'A4_3x10' ? cfg.h : 297}mm</strong></li>
                                    <li>Đặt làm mặc định → Save</li>
                                </ul>
                            </div>
                            <div className="space-y-2">
                                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                    <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">2</span>
                                    Khi hộp thoại in xuất hiện
                                </div>
                                <ul className="ml-7 space-y-1 text-slate-600 dark:text-slate-400 list-disc list-outside">
                                    <li>Chọn đúng <strong>máy in nhiệt</strong> trong danh sách</li>
                                    <li>Paper size: chọn <strong>custom size vừa tạo</strong></li>
                                    <li>Margins: đặt <strong>None / 0</strong></li>
                                    <li>Scale: <strong>100%</strong></li>
                                    <li>Bỏ chọn <strong>"Headers and footers"</strong></li>
                                </ul>
                            </div>
                        </div>
                        <div className="border-t border-blue-200 dark:border-blue-800/40 pt-2 text-[11px] text-slate-500">
                            💡 <strong>Khổ giấy mặc định</strong> được thiết lập trong <strong>Cấu hình hệ thống → Cấu hình in Barcode</strong>. Có thể thay đổi trực tiếp ở dropdown trên.
                        </div>
                    </div>
                )}

                {/* Label size info */}
                <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <svg className="w-3.5 h-3.5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                    <span>
                        Preview tem <strong>{cfg.w}×{cfg.h}mm</strong>
                        {' · '}CSS <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">@page &#123;size:{cfg.w}mm {cfg.h}mm; margin:0&#125;</code> sẽ được inject khi in
                    </span>
                </div>
            </div>

            {/* ===== PRINT AREA ===== */}
            <div className="xn-label-font" ref={printRef}>
                {labelSize === 'A4_3x10' ? (
                    /* A4 Grid Layout */
                    <div className="xn-label-preview xn-label-a4-grid">
                        <div className="xn-a4-grid-layout">
                            {allLabels.map(({ patient, order }, idx) => {
                                const ageVal = patient.age || calculateAge(patient.dob);
                                const genderShort = getGenderShort(patient.gender);
                                const deptCode = patient.deptCode || 'KB';
                                const sampleTypeShort = order.sampleTypeShort || getSampleTypeShort(order.testName, order.sampleType);
                                const dateTimeStr = formatDateTime(order.sampleDate);

                                return (
                                    <div key={`${order.id}-${idx}`} className="xn-a4-decal-item text-black" style={{ padding: '1.5mm 2mm', display: 'flex', flexDirection: 'column', justify: 'space-between', fontFamily: '"Arial", "Helvetica Neue", sans-serif' }}>
                                        {/* Row 1: Patient Name & Age */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', lineHeight: 1.1 }}>
                                            <span style={{ fontSize: '11px', fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>
                                                {patient.patientName || 'Test22222'}
                                            </span>
                                            <span style={{ fontSize: '12px', fontWeight: 900, flexShrink: 0 }}>
                                                {ageVal}
                                            </span>
                                        </div>

                                        {/* Row 2: Doc No, Gender, Dept */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9.5px', fontWeight: 800, marginTop: '0.3mm', lineHeight: 1.1 }}>
                                            <span style={{ fontFamily: 'monospace, Arial, sans-serif' }}>
                                                {patient.docNo || '26265991'}
                                            </span>
                                            <span style={{ fontWeight: 900 }}>{genderShort}</span>
                                            <span style={{ fontWeight: 900 }}>{deptCode}</span>
                                        </div>

                                        {/* Row 3: Barcode SVG */}
                                        <div style={{ textAlign: 'center', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0.3mm 0' }}>
                                            <Code128Barcode value={order.orderNo || '13312658'} height={18} />
                                        </div>

                                        {/* Row 4: Barcode Value (centered) & Test Short Code (right bold) */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', lineHeight: 1, marginTop: '-0.3mm' }}>
                                            <div style={{ width: '20px' }} />
                                            <div style={{ fontSize: '9px', fontWeight: 800, fontFamily: 'monospace, Arial, sans-serif', letterSpacing: '0.03em', textAlign: 'center' }}>
                                                {order.orderNo || '13312658'}
                                            </div>
                                            <div style={{ fontSize: '14px', fontWeight: 900, textAlign: 'right', minWidth: '20px', lineHeight: 0.9 }}>
                                                {sampleTypeShort}
                                            </div>
                                        </div>

                                        {/* Row 5: Date & Time */}
                                        <div style={{ fontSize: '7.5px', fontWeight: 700, fontFamily: 'monospace, Arial, sans-serif', marginTop: '0.2mm', lineHeight: 1 }}>
                                            {dateTimeStr}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    /* Thermal Label Layout (50x30 / 40x30 / 60x40) */
                    <div className="flex flex-col items-center">
                        {allLabels.map(({ patient, order }, idx) => {
                            const ageVal = patient.age || calculateAge(patient.dob);
                            const genderShort = getGenderShort(patient.gender);
                            const deptCode = patient.deptCode || 'KB';
                            const sampleTypeShort = order.sampleTypeShort || getSampleTypeShort(order.testName, order.sampleType);
                            const dateTimeStr = formatDateTime(order.sampleDate);

                            return (
                                <div
                                    key={`${order.id}-${idx}`}
                                    className={`xn-label-preview xn-label-${labelSize}`}
                                    style={{
                                        width: `${cfg.w}mm`,
                                        height: `${cfg.h}mm`,
                                        boxSizing: 'border-box',
                                        padding: labelSize === '60x40' ? '2.5mm 3mm 2mm 3mm' : labelSize === '40x30' ? '1.2mm 1.5mm 0.8mm 1.5mm' : '1.2mm 2.2mm 0.8mm 2.2mm',
                                        backgroundColor: '#ffffff',
                                        color: '#000000',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        fontFamily: '"Arial", "Helvetica Neue", sans-serif',
                                        lineHeight: 1,
                                    }}
                                >
                                    {/* Row 1: Patient Name (Left) & Age (Right) */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', width: '100%', lineHeight: 1.1 }}>
                                        <span style={{ fontSize: labelSize === '60x40' ? '17px' : labelSize === '40x30' ? '12px' : '14px', fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '78%', color: '#000000', letterSpacing: '-0.01em' }}>
                                            {patient.patientName || 'Test22222'}
                                        </span>
                                        <span style={{ fontSize: labelSize === '60x40' ? '17px' : labelSize === '40x30' ? '13px' : '15px', fontWeight: 900, flexShrink: 0, color: '#000000' }}>
                                            {ageVal}
                                        </span>
                                    </div>

                                    {/* Row 2: Doc No / PID (Left), Gender (Center), Dept/Object (Right) */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', fontSize: labelSize === '60x40' ? '13.5px' : labelSize === '40x30' ? '10px' : '11.5px', fontWeight: 800, marginTop: '0.2mm', lineHeight: 1.1, color: '#000000' }}>
                                        <span style={{ fontFamily: 'monospace, Arial, sans-serif', letterSpacing: '0.03em' }}>
                                            {patient.docNo || '26265991'}
                                        </span>
                                        <span style={{ fontWeight: 900 }}>
                                            {genderShort}
                                        </span>
                                        <span style={{ fontWeight: 900 }}>
                                            {deptCode}
                                        </span>
                                    </div>

                                    {/* Row 3: Barcode SVG (Center) with high-contrast sharp bars */}
                                    <div style={{ textAlign: 'center', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0.4mm 0 0 0', width: '100%' }}>
                                        <Code128Barcode value={order.orderNo || '13312658'} height={labelSize === '60x40' ? 32 : labelSize === '40x30' ? 18 : 22} />
                                    </div>

                                    {/* Row 4: Barcode Value / SID (Centered under Barcode) & Test Short Code (Right Extra Large Bold) */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', marginTop: '-0.3mm', lineHeight: 1 }}>
                                        <div style={{ width: '30px' }} />

                                        <div style={{ fontSize: labelSize === '60x40' ? '13.5px' : labelSize === '40x30' ? '10px' : '11.5px', fontWeight: 900, fontFamily: 'monospace, Arial, sans-serif', letterSpacing: '0.05em', textAlign: 'center', color: '#000000' }}>
                                            {order.orderNo || '13312658'}
                                        </div>

                                        <div style={{ fontSize: labelSize === '60x40' ? '22px' : labelSize === '40x30' ? '15px' : '18px', fontWeight: 900, textAlign: 'right', minWidth: '30px', color: '#000000', lineHeight: 0.85 }}>
                                            {sampleTypeShort}
                                        </div>
                                    </div>

                                    {/* Row 5: Sampling Date & Time (Bottom Left) */}
                                    <div style={{ fontSize: labelSize === '60x40' ? '10px' : labelSize === '40x30' ? '8px' : '9px', fontWeight: 700, fontFamily: 'monospace, Arial, sans-serif', marginTop: '0.2mm', lineHeight: 1, color: '#000000' }}>
                                        {dateTimeStr}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>,
        portalContainer
    );
};

export default PrintBarcodeXnForm;
