import React, { useRef, useCallback, useState } from 'react';
import { ExtendedFormData } from '../utils/registrationUtils';
import { fillKioskTemplate } from '../../../services/ticketTemplate';
import { ThermalPrinterService } from '../../../services/thermalPrinterService';

interface ExamTicketPrintProps {
    formData: ExtendedFormData;
    roomName?: string;
    deptName?: string;
    hospitalName?: string;
    autoPrint?: boolean; // New prop for auto-printing
}

// ─── Nội dung phiếu (Render mẫu Kiosk) ─────────────────────────────────────
const TicketContent = React.forwardRef<HTMLDivElement, ExamTicketPrintProps>(({
    formData, roomName, deptName, hospitalName
}, ref) => {
    // Chuẩn bị data cho template Kiosk
    const kioskData = {
        ...formData,
        roomName: roomName || (formData.regRoom ? `Phòng ${formData.regRoom}` : 'Phòng khám'),
        department: deptName || 'Phòng khám'
    };
    
    const settings = { hospitalName };
    const html = fillKioskTemplate(kioskData, settings);

    return (
        <div 
            ref={ref} 
            className="kiosk-ticket-container"
            style={{ 
                backgroundColor: '#fff',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                overflow: 'hidden'
            }}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
});

// ─── Component bọc ngoài: Quản lý in ─────────────────────────────────────────
const ExamTicketPrint: React.FC<ExamTicketPrintProps & {
    onClose: () => void;
    visible: boolean;
}> = ({ onClose, visible, ...props }) => {
    const printRef = useRef<HTMLDivElement>(null);
    const hiddenPrintRef = useRef<HTMLDivElement>(null);
    const [useThermal, setUseThermal] = useState(() => {
        const saved = localStorage.getItem('vclinic_use_thermal');
        return saved === null ? true : saved === 'true';
    });

    const hasPrintedRef = useRef(false);

    const handlePrint = useCallback(async (isAuto = false) => {
        if (isAuto && hasPrintedRef.current) return;
        
        const content = isAuto ? hiddenPrintRef.current : printRef.current;
        if (!content) return;

        if (isAuto) {
            hasPrintedRef.current = true;
        }

        let printHTML = content.innerHTML;

        if (useThermal) {
            try {
                const dataUrl = await ThermalPrinterService.getImageDataURL(content);
                printHTML = `<div style="text-align: center;"><img src="${dataUrl}" style="width: 100%; height: auto;" /></div>`;
            } catch (err) {
                console.error('Lỗi render ảnh in nhiệt:', err);
            }
        }

        const oldIframe = document.getElementById('print-iframe');
        if (oldIframe) oldIframe.remove();

        const iframe = document.createElement('iframe');
        iframe.id = 'print-iframe';
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (!doc) return;

        doc.open();
        doc.write(`
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <style>
        @page { size: 80mm auto; margin: 0; }
        body { margin: 0; padding: ${useThermal ? '0' : '4mm'}; font-family: "Times New Roman", serif; }
        * { box-sizing: border-box; }
    </style>
</head>
<body>
    ${printHTML}
</body>
</html>`);
        doc.close();

        setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            if (props.autoPrint || isAuto) {
                setTimeout(onClose, 500);
            }
        }, 300);
    }, [onClose, props.autoPrint, useThermal]);

    React.useEffect(() => {
        if (visible && props.autoPrint) {
            handlePrint(true);
        } else if (!visible) {
            hasPrintedRef.current = false;
        }
    }, [visible, props.autoPrint, handlePrint]);

    const toggleThermal = (val: boolean) => {
        setUseThermal(val);
        localStorage.setItem('vclinic_use_thermal', String(val));
    };

    // Luôn render hidden container để có thể in bất cứ lúc nào (kể cả khi không hiện modal)
    const hiddenContainer = (
        <div style={{ position: 'fixed', left: '-9999px', top: '-9999px', zIndex: -1 }}>
            <TicketContent ref={hiddenPrintRef} {...props} />
        </div>
    );

    // Nếu là in tự động và đang visible, không trả về UI Modal UI để tránh hiện cửa sổ choáng màn hình
    // Tuy nhiên React vẫn cần render TicketContent để handlePrint lấy được DOM
    if (props.autoPrint && visible) {
        return hiddenContainer;
    }

    if (!visible) return hiddenContainer;

    return (
        <>
            {hiddenContainer}
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] w-full max-w-sm overflow-hidden"
                    style={{ fontFamily: 'inherit' }}>
                    
                    <div className="flex items-center justify-between px-5 py-3 border-b bg-slate-50/50">
                        <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
                            🖨️ Xem trước & Cài đặt In
                        </h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-red-500 text-xl">✕</button>
                    </div>

                    <div className="overflow-y-auto flex-1 flex flex-col items-center bg-slate-100 py-6 custom-scrollbar">
                        <div className="bg-white shadow-xl border mb-6" style={{ width: '310px' }}>
                            <TicketContent ref={printRef} {...props} />
                        </div>

                        <div className="w-full px-6">
                            <label className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:border-blue-300 transition-all">
                                <input 
                                    type="checkbox" 
                                    checked={useThermal} 
                                    onChange={e => toggleThermal(e.target.checked)}
                                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="flex flex-col">
                                    <span className="text-[13px] font-bold text-slate-700">Chế độ máy in nhiệt</span>
                                    <span className="text-[11px] text-slate-500 leading-tight text-balance">Sử dụng render ảnh (tránh lỗi font tiếng Việt)</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="flex gap-3 px-5 py-4 border-t bg-slate-50/30">
                        <button
                            onClick={() => handlePrint(false)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-blue-200 active:scale-95"
                        >
                            🖨️ Thực hiện In {useThermal ? '(Ảnh)' : ''}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 transition-all"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ExamTicketPrint;
