// ==================== PRINT BARCODE FORM COMPONENT ====================
// File: modules/health-check-sync/forms/PrintBarcodeForm.tsx

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useSystemStore } from '../../../stores/useSystemStore';
import { HealthCheckSettings } from '../models/HealthCheckSettings';
import { qzPrinterService } from '../../../services/qzPrinterService';
import { toast } from 'sonner';

interface PrintBarcodeFormProps {
    documents: any[];
    onClose: () => void;
}

type LabelSize = '50x30' | '40x30' | 'A4_3x10';

// Code39 Binary Encoding Map (1 = Black bar, 0 = White space)
const CODE39_MAP: Record<string, string> = {
    '0': '101001101101',
    '1': '110100101011',
    '2': '101100101011',
    '3': '110110010101',
    '4': '101001101011',
    '5': '110100110101',
    '6': '101100110101',
    '7': '101001011011',
    '8': '110100101101',
    '9': '101100101101',
    'A': '110101001011',
    'B': '101101001011',
    'C': '110110100101',
    'D': '101011001011',
    'E': '110101100101',
    'F': '101101100101',
    'G': '101010011011',
    'H': '110101001101',
    'I': '101101001101',
    'J': '101011001101',
    'K': '110101010011',
    'L': '101101010011',
    'M': '110110101001',
    'N': '101011010011',
    'O': '110101101001',
    'P': '101101101001',
    'Q': '101010110011',
    'R': '110101011001',
    'S': '101101011001',
    'T': '101011011001',
    'U': '110010101011',
    'V': '100110101011',
    'W': '110011010101',
    'X': '100101101011',
    'Y': '110010110101',
    'Z': '100110110101',
    '-': '100101011011',
    '.': '110010101101',
    ' ': '100110101101',
    '$': '100100100101',
    '/': '100100101001',
    '+': '100101001001',
    '%': '101001001001',
    '*': '100101101101' // Start/Stop
};

// CODE 128 Character Patterns (0 to 106)
const CODE128_PATTERNS = [
    "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
    "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
    "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
    "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
    "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
    "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
    "314111", "221411", "431111", "111224", "111422", "121124", "121422", "141122", "141221", "112214",
    "112412", "122114", "122411", "142112", "142211", "241211", "221114", "213111", "241112", "134111",
    "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
    "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
    "114131", "311141", "411131", "113114", "211412", "211214", "211232", "2331112"
];

// React Component to Render Code128 (Subset B) Barcode as SVG
export const Code128Barcode: React.FC<{ value: string; height?: number }> = ({ value, height = 35 }) => {
    // 1. Calculate weighted checksum (Start B has value 104)
    let checksum = 104;
    const encodedValues: number[] = [104];

    for (let i = 0; i < value.length; i++) {
        const ascii = value.charCodeAt(i);
        const charValue = ascii - 32;
        if (charValue >= 0 && charValue <= 102) {
            encodedValues.push(charValue);
            checksum += charValue * (i + 1);
        }
    }

    const checkValue = checksum % 103;
    encodedValues.push(checkValue);
    encodedValues.push(106); // Stop value

    // 2. Generate binary modules string from widths pattern
    let bitString = '';
    encodedValues.forEach(val => {
        const pattern = CODE128_PATTERNS[val];
        for (let i = 0; i < pattern.length; i++) {
            const width = parseInt(pattern[i], 10);
            const isBar = i % 2 === 0;
            bitString += (isBar ? '1' : '0').repeat(width);
        }
    });

    const scale = 1.0; // Code 128 is highly dense, 1.0px per module is perfect for A4/thermal printing
    const bars: React.ReactNode[] = [];
    let currentX = 0;

    for (let i = 0; i < bitString.length; i++) {
        if (bitString[i] === '1') {
            bars.push(
                <rect 
                    key={i} 
                    x={currentX} 
                    y={0} 
                    width={scale} 
                    height={height} 
                    fill="black" 
                />
            );
        }
        currentX += scale;
    }

    return (
        <svg 
            width={currentX} 
            height={height} 
            viewBox={`0 0 ${currentX} ${height}`}
            className="mx-auto"
            shapeRendering="crispEdges"
        >
            {bars}
        </svg>
    );
};

// React Component to Render Code39 Barcode as SVG
export const Code39Barcode: React.FC<{ value: string; height?: number }> = ({ value, height = 35 }) => {
    const rawVal = `*${value.toUpperCase()}*`;
    let bitString = '';
    
    for (let i = 0; i < rawVal.length; i++) {
        const char = rawVal[i];
        const pattern = CODE39_MAP[char] || CODE39_MAP[' '];
        bitString += pattern + '0'; // Inter-character gap
    }
    
    // Remove the last inter-character gap
    if (bitString.endsWith('0')) {
        bitString = bitString.slice(0, -1);
    }

    const scale = 1.2; // Width of a single narrow element
    const bars: React.ReactNode[] = [];
    let currentX = 0;

    for (let i = 0; i < bitString.length; i++) {
        if (bitString[i] === '1') {
            bars.push(
                <rect 
                    key={i} 
                    x={currentX} 
                    y={0} 
                    width={scale} 
                    height={height} 
                    fill="black" 
                />
            );
        }
        currentX += scale;
    }

    return (
        <svg 
            width={currentX} 
            height={height} 
            viewBox={`0 0 ${currentX} ${height}`}
            className="mx-auto"
        >
            {bars}
        </svg>
    );
};

interface PrintBarcodeFormProps {
    documents: any[];
    onClose: () => void;
    defaultLabelSize?: LabelSize;
    showHospital?: boolean;
    showDate?: boolean;
    showSampleType?: boolean;
}

const PrintBarcodeForm: React.FC<PrintBarcodeFormProps> = ({ 
    documents, 
    onClose,
    defaultLabelSize = '50x30',
    showHospital = true,
    showDate = true,
    showSampleType = true
}) => {
    const { hospitalName } = useSystemStore();
    const [labelSize, setLabelSize] = useState<LabelSize>(defaultLabelSize);

    // Create portal container directly under document.body to avoid parent layout overflow hidden constraints
    const [portalContainer] = React.useState(() => {
        const div = window.document.createElement('div');
        div.className = 'print-barcode-portal-container';
        return div;
    });

    const printViaQzZpl = async (settings: HealthCheckSettings): Promise<boolean> => {
        try {
            const printerName = settings.barcode_printer_name || 'Zebra';
            const template = settings.barcode_zpl_template_ksk;
            if (!template) {
                console.warn("Chưa cấu hình mẫu ZPL cho KSK");
                return false;
            }

            for (const doc of documents) {
                // Replace ZPL template place holders with real values
                const genderStr = doc.gender || 'Nam';
                const ageStr = doc.dob ? `NS: ${new Date(doc.dob).getFullYear()}` : 'N/A';
                const infoStr = `${ageStr} - ${genderStr}`;

                let zpl = template
                    .replace(/{hospital}/g, hospitalName || 'PHÒNG KHÁM vCLINIC')
                    .replace(/{patient}/g, doc.patient_name || '')
                    .replace(/{form_name}/g, getFormNameShort(doc.form_type))
                    .replace(/{info}/g, infoStr)
                    .replace(/{code}/g, doc.doc_no || '');

                await qzPrinterService.printZPL(printerName, zpl);
            }
            toast.success(`Đã in ${documents.length} tem KSK qua QZ Tray thành công!`);
            onClose();
            return true;
        } catch (err: any) {
            console.error("ZPL print error via QZ Tray (KSK):", err);
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
                if (settings.use_qz_tray && settings.barcode_printer_name && settings.barcode_zpl_template_ksk) {
                    const success = await printViaQzZpl(settings);
                    if (success) return; // In thành công, dừng lại không mở cửa sổ in trình duyệt
                }
            } catch (err) {
                console.warn("QZ Tray print fallback to default browser print (KSK):", err);
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
        // Inject @page CSS đúng kích thước trước khi gửi lệnh in
        const styleId = 'vclinic-barcode-ksk-page-style';
        let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = styleId;
            document.head.appendChild(styleEl);
        }

        if (labelSize === 'A4_3x10') {
            styleEl.textContent = `@page { size: A4 portrait; margin: 10mm; }`;
        } else if (labelSize === '50x30') {
            styleEl.textContent = `@page { size: 50mm 30mm; margin: 0mm; }`;
        } else if (labelSize === '40x30') {
            styleEl.textContent = `@page { size: 40mm 30mm; margin: 0mm; }`;
        }

        window.print();

        // Cleanup sau khi in và tự động đóng form quay về danh sách
        setTimeout(() => {
            const el = document.getElementById(styleId);
            if (el) el.remove();
            onClose();
        }, 1000);
    };

    if (!documents || documents.length === 0) return null;

    const getFormNameShort = (type: string) => {
        const names: Record<string, string> = {
            '1': 'KSK Trẻ em 6-18T',
            '2': 'KSK Người lớn >=18T',
            '3': 'KSK Lái xe',
            '4': 'KSK ĐSắt',
            '5': 'KSK Thủy thủ',
            '6': 'KSK Trẻ 0-2T',
            '7': 'KSK Trẻ 2-3T',
            '8': 'KSK Trẻ 4-6T',
            '9': 'KSK Trẻ 7-9T',
            '10': 'KSK Trẻ 10-12T',
            '11': 'KSK Trẻ 13-18T',
            '12': 'KSK Trẻ 19-24T',
            '13': 'KSK Trẻ 2-6T',
            '14': 'KSK Học sinh 3M-6T',
            '15': 'KSK Học sinh Cấp 1',
            '16': 'KSK Học sinh Cấp 2',
            '17': 'KSK Học sinh Cấp 3'
        };
        return names[type] || `KSK Mẫu ${type}`;
    };

    return createPortal(
        <div className="print-wrapper fixed inset-0 bg-slate-100 dark:bg-slate-900 z-50 overflow-auto py-8 px-4 print:p-0 print:bg-white select-text font-sans">
            <style>{`
                @media screen {
                    .barcode-label-container {
                        margin: 0 auto 2rem auto;
                        background: white;
                        color: black;
                        box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
                        border-radius: 4px;
                    }
                    .label-50x30 {
                        width: 50mm;
                        height: 30mm;
                        padding: 1.5mm;
                    }
                    .label-40x30 {
                        width: 40mm;
                        height: 30mm;
                        padding: 1mm;
                    }
                    .label-a4-grid {
                        width: 210mm;
                        min-height: 297mm;
                        padding: 10mm;
                        background: white;
                    }
                }
                @media print {
                    #root {
                        display: none !important;
                    }
                    body {
                        background-color: white !important;
                        background: white !important;
                        color: black !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .print-barcode-portal-container {
                        display: block !important;
                        position: static !important;
                        overflow: visible !important;
                        height: auto !important;
                        width: 100% !important;
                        background: white !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .print-wrapper {
                        position: static !important;
                        overflow: visible !important;
                        height: auto !important;
                        width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        background: white !important;
                    }
                    .barcode-label-container {
                        box-shadow: none !important;
                        background: transparent !important;
                        margin: 0 !important;
                        border: none !important;
                    }
                    .label-50x30 {
                        width: 50mm !important;
                        height: 30mm !important;
                        page-break-after: always !important;
                        display: flex !important;
                        flex-direction: column !important;
                        justify-content: space-between !important;
                    }
                    .label-40x30 {
                        width: 40mm !important;
                        height: 30mm !important;
                        page-break-after: always !important;
                        display: flex !important;
                        flex-direction: column !important;
                        justify-content: space-between !important;
                    }
                    .label-a4-grid {
                        width: 100% !important;
                        min-height: 0 !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
                .label-font {
                    font-family: "Arial", sans-serif;
                    color: black;
                }
                .a4-grid-layout {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 2mm;
                }
                .a4-decal-item {
                    border: 1px dashed #ccc;
                    height: 27mm;
                    padding: 1.5mm;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }
                @media print {
                    .a4-decal-item {
                        border: 1px solid transparent !important;
                    }
                }
            `}</style>

            {/* Control Panel */}
            <div className="mb-6 max-w-xl mx-auto p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex justify-between items-center print:hidden no-print shadow-sm font-sans">
                <div>
                    <span className="text-sm font-bold text-slate-800 dark:text-white block">Quản lý in Tem Mã Vạch KSK</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Đang chuẩn bị in nhãn cho {documents.length} hồ sơ bệnh nhân.</span>
                </div>
                <div className="flex gap-2">
                    <select
                        value={labelSize}
                        onChange={(e) => setLabelSize(e.target.value as LabelSize)}
                        className="p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-xs font-bold font-sans cursor-pointer focus:outline-none"
                    >
                        <option value="50x30">Tem Nhiệt 50x30 mm</option>
                        <option value="40x30">Tem Nhiệt 40x30 mm</option>
                        <option value="A4_3x10">Giấy A4 Decal (3x10 Nhãn)</option>
                    </select>
                    <button onClick={onClose} className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-xs font-bold rounded-lg text-slate-700 dark:text-slate-200 font-sans transition">
                        Đóng
                    </button>
                    <button onClick={handlePrint} className="px-4 py-1.5 bg-[#0f766e] hover:bg-[#0d645c] text-white text-xs font-bold rounded-lg shadow-md hover:shadow-lg transition font-sans">
                        In Tem
                    </button>
                </div>
            </div>

            {/* Print Area */}
            <div className="label-font">
                {labelSize === 'A4_3x10' ? (
                    <div className="barcode-label-container label-a4-grid">
                        <div className="a4-grid-layout">
                            {documents.map((doc, idx) => (
                                <div key={doc.id || idx} className="a4-decal-item flex flex-col justify-between text-black">
                                    {showHospital && (
                                        <div className="text-[8px] font-extrabold uppercase border-b border-slate-300 pb-0.5 tracking-tight truncate">
                                            {hospitalName || 'PHÒNG KHÁM vCLINIC'}
                                        </div>
                                    )}
                                    <div className="my-1 text-center">
                                        <Code128Barcode value={doc.doc_no} height={24} />
                                    </div>
                                    <div className="text-left leading-none space-y-0.5">
                                        <div className="text-[10px] font-black uppercase truncate">{doc.patient_name}</div>
                                        <div className="text-[7.5px] font-semibold text-slate-700 flex justify-between">
                                            <span>
                                                {showDate 
                                                    ? `NS: ${doc.dob ? new Date(doc.dob).getFullYear() : 'N/A'} - ${doc.gender}` 
                                                    : doc.gender
                                                }
                                            </span>
                                            <span className="font-mono text-[7px]">{doc.doc_no}</span>
                                        </div>
                                        {showSampleType && (
                                            <div className="text-[7.5px] font-extrabold text-[#0f766e] border-t border-slate-100 pt-0.5 truncate">
                                                {getFormNameShort(doc.form_type)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        {documents.map((doc, idx) => (
                            <div 
                                key={doc.id || idx} 
                                className={`barcode-label-container ${
                                    labelSize === '50x30' ? 'label-50x30 border border-slate-200' : 'label-40x30 border border-slate-200'
                                } bg-white text-black p-2 flex flex-col justify-between mb-4`}
                            >
                                {showHospital && (
                                    <div className="text-[8.5px] font-extrabold uppercase border-b border-black pb-0.5 tracking-tight text-center truncate">
                                        {hospitalName || 'PHÒNG KHÁM vCLINIC'}
                                    </div>
                                )}
                                <div className="my-1.5 text-center flex-1 flex items-center justify-center">
                                    <Code128Barcode value={doc.doc_no} height={labelSize === '50x30' ? 28 : 22} />
                                </div>
                                <div className="text-left leading-none space-y-0.5">
                                    <div className="text-[10px] font-black uppercase truncate">{doc.patient_name}</div>
                                    <div className="text-[8px] font-bold text-slate-800 flex justify-between">
                                        <span>
                                            {showDate 
                                                ? `NS: ${doc.dob ? new Date(doc.dob).getFullYear() : 'N/A'} - ${doc.gender}` 
                                                : doc.gender
                                            }
                                        </span>
                                        <span className="font-mono text-[7.5px]">{doc.doc_no}</span>
                                    </div>
                                    {showSampleType && (
                                        <div className="text-[8px] font-extrabold text-[#0f766e] border-t border-slate-200 pt-0.5 truncate">
                                            {getFormNameShort(doc.form_type)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>,
        portalContainer
    );
};

export default PrintBarcodeForm;
