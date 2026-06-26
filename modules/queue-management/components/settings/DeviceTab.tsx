import React, { useState, useRef, useEffect } from 'react';
import { ScanBarcode, Camera, Printer as PrinterIcon, Loader2, CheckCircle, AlertCircle, CreditCard, Eye, Usb, RefreshCw, ShieldCheck, Receipt, StickyNote, Terminal, Type, Hash, Zap } from 'lucide-react';
import { AppSettings, PrinterConfig, ScanInputMode } from '../../types';
import { printTicket } from '../../services/printerService';
import { Capacitor } from '@capacitor/core';

interface DeviceTabProps {
    settings: AppSettings;
    onUpdate: (settings: AppSettings) => void;
}

const DeviceTab: React.FC<DeviceTabProps> = ({ settings, onUpdate }) => {
    const [isTestingPrinter, setIsTestingPrinter] = useState(false);
    const [printerStatus, setPrinterStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // Test Logs
    const [testLogs, setTestLogs] = useState<string[]>([]);
    const logContainerRef = useRef<HTMLDivElement>(null);

    // USB Printer State
    const [usbPrinters, setUsbPrinters] = useState<any[]>([]);
    const [isScanningUsb, setIsScanningUsb] = useState(false);

    // Auto-scroll logs
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [testLogs]);

    const addLog = (msg: string) => {
        const time = new Date().toLocaleTimeString('vi-VN', { hour12: false });
        setTestLogs(prev => [...prev, `[${time}] ${msg}`]);
    };

    const updatePrinterConfig = (updates: Partial<PrinterConfig>) => {
        onUpdate({
            ...settings,
            printerConfig: { ...settings.printerConfig, ...updates }
        });
        setPrinterStatus('idle');
    };

    const handleTestPrinter = async () => {
        if (!settings.printerConfig.enabled) return;

        setIsTestingPrinter(true);
        setPrinterStatus('idle');
        setTestLogs([]);
        addLog("BẮT ĐẦU QUY TRÌNH IN THỬ...");

        try {
            await printTicket({
                ticketNumber: '1001',
                patientName: 'NGUYỄN VĂN A',
                department: 'Khám Nội Tổng Quát',
                specialtyCode: '14',
                kioskDeptCode: settings.departmentCode,
                patientId: '123456',
                identityNumber: '001088000000',
                time: new Date().toLocaleString('vi-VN'),
                type: settings.kioskType,
                isPriority: true
            }, settings, addLog);

            setPrinterStatus('success');
            addLog("QUY TRÌNH HOÀN TẤT.");
        } catch (error: any) {
            console.error("Test print failed:", error);
            setPrinterStatus('error');
            addLog(`LỖI NGOẠI LỆ: ${error.message}`);
        } finally {
            setIsTestingPrinter(false);
        }
    };



    // Import Printer dynamically or assume it's available globally via Capacitor if registered?
    // Better to use the dynamic import or the one I added in existing button.
    // I'll add a helper to get plugin.

    const scanUsbPrinters = async () => {
        setIsScanningUsb(true);
        setUsbPrinters([]);

        try {
            const printerPlugin = (window as any).Printer || (await import('../../../../plugins/PrinterPlugin')).default;
            if (!printerPlugin) throw new Error("Printer Plugin not found");

            const result = await printerPlugin.getUsbPrinters();
            // result.printers is the array
            setUsbPrinters(result.printers || []);
            if (!result.printers || result.printers.length === 0) alert("Không tìm thấy máy in USB.");

        } catch (err: any) {
            console.error(err);
            // Fallback or alert
            alert('Lỗi quét USB: ' + (err.message || JSON.stringify(err)));
        } finally {
            setIsScanningUsb(false);
        }
    };

    const requestUsbPermission = async (printer: any) => {
        try {
            const printerPlugin = (window as any).Printer || (await import('../../../../plugins/PrinterPlugin')).default;
            // printer object from my plugin has address and deviceId
            const res = await printerPlugin.requestPermissions({
                address: printer.address,
                deviceId: printer.deviceId
            });

            if (res.granted) {
                alert(`Đã cấp quyền thành công!`);
                // Save printerId as the Address (preferred) or ID?
                // The connect logic resolved ID to Address. 
                // Let's save DEVICE ID if it's an integer for UI consistency or Address string.
                // My resolve logic handles both. 
                // Let's use ID for display but address is safer.
                // Use printer.deviceId if available.
                updatePrinterConfig({ printerId: printer.deviceId ? String(printer.deviceId) : printer.address, printerName: printer.name } as any);
            } else {
                alert('Vui lòng chấp nhận yêu cầu cấp quyền trên màn hình.');
            }
        } catch (err: any) {
            alert('Cấp quyền thất bại: ' + (err.message || JSON.stringify(err)));
        }
    };

    const currentPrinterId = settings.printerConfig.printerId;

    return (
        <div className="animate-fade-in space-y-6 max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                <div className="flex items-start gap-3 mb-2">
                    <div className="bg-amber-100 p-2 rounded-lg text-amber-600"><ScanBarcode size={24} /></div>
                    <div>
                        <h5 className="font-bold text-gray-800 text-xl">Thiết bị nhập liệu (Scanner)</h5>
                        <p className="text-sm text-gray-500">Chọn phương thức nhập liệu từ thẻ BHYT/CCCD.</p>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <button
                        onClick={() => onUpdate({ ...settings, scannerMode: 'QR_DEVICE' })}
                        className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${settings.scannerMode === 'QR_DEVICE' ? 'border-primary bg-cyan-50 text-primary' : 'border-gray-100 text-gray-400'}`}
                    >
                        <ScanBarcode size={32} /> <span className="font-bold">Máy quét QR</span>
                    </button>
                    <button
                        onClick={() => onUpdate({ ...settings, scannerMode: 'CHIP_READER' })}
                        className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${settings.scannerMode === 'CHIP_READER' ? 'border-primary bg-cyan-50 text-primary' : 'border-gray-100 text-gray-400'}`}
                    >
                        <CreditCard size={32} /> <span className="font-bold">Đầu đọc Chip</span>
                    </button>
                    <button
                        onClick={() => onUpdate({ ...settings, scannerMode: 'CAMERA' })}
                        className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${settings.scannerMode === 'CAMERA' ? 'border-primary bg-cyan-50 text-primary' : 'border-gray-100 text-gray-400'}`}
                    >
                        <Camera size={32} /> <span className="font-bold">Camera</span>
                    </button>
                </div>
            </div>

            {/* SECTION: CHẾ ĐỘ DỮU LIỆU ĐẦU VÀO KHI QUÉT */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-5">
                <div className="flex items-start gap-3">
                    <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600 shrink-0">
                        <CreditCard size={24} />
                    </div>
                    <div>
                        <h5 className="font-bold text-gray-800 text-xl">Loại dữ liệu đầu vào khi quét</h5>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Xác định loại mã đầu đọc sẽ nhận — quyết định luồng xử lý sau khi quét.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    {/* THẾ CCCD */}
                    <button
                        onClick={() => onUpdate({ ...settings, scanInputMode: 'CCCD' })}
                        className={`relative p-6 rounded-2xl border-2 flex flex-col items-start gap-3 text-left transition-all ${
                            settings.scanInputMode === 'CCCD'
                                ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200 shadow-md'
                                : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50'
                        }`}
                    >
                        {settings.scanInputMode === 'CCCD' && (
                            <span className="absolute top-3 right-3 bg-indigo-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Đang dùng
                            </span>
                        )}
                        <div className={`p-3 rounded-xl ${
                            settings.scanInputMode === 'CCCD' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'
                        }`}>
                            <CreditCard size={28} />
                        </div>
                        <div>
                            <p className="font-black text-gray-800 text-base">Quét thẻ CCCD</p>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                Thẻ CCCD gắn chip, QR mước 2.<br/>
                                <span className="font-semibold text-indigo-600">🏥 Sảnh tiếp đón, khu khám bệnh</span>
                            </p>
                        </div>
                    </button>

                    {/* MÃ HỒ SƠ */}
                    <button
                        onClick={() => onUpdate({ ...settings, scanInputMode: 'RECORD_CODE' })}
                        className={`relative p-6 rounded-2xl border-2 flex flex-col items-start gap-3 text-left transition-all ${
                            settings.scanInputMode === 'RECORD_CODE'
                                ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200 shadow-md'
                                : 'border-gray-100 hover:border-emerald-200 hover:bg-gray-50'
                        }`}
                    >
                        {settings.scanInputMode === 'RECORD_CODE' && (
                            <span className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Đang dùng
                            </span>
                        )}
                        <div className={`p-3 rounded-xl ${
                            settings.scanInputMode === 'RECORD_CODE' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
                        }`}>
                            <Hash size={28} />
                        </div>
                        <div>
                            <p className="font-black text-gray-800 text-base">Quét mã Hồ sơ</p>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                Barcode / mã in trên phiếu chỉ định.<br/>
                                <span className="font-semibold text-emerald-600">🧪 XN, CNHA, Nhà thuốc</span>
                            </p>
                        </div>
                    </button>

                    {/* TỰ ĐỘNG */}
                    <button
                        onClick={() => onUpdate({ ...settings, scanInputMode: 'AUTO' })}
                        className={`relative p-6 rounded-2xl border-2 flex flex-col items-start gap-3 text-left transition-all ${
                            settings.scanInputMode === 'AUTO'
                                ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200 shadow-md'
                                : 'border-gray-100 hover:border-amber-200 hover:bg-gray-50'
                        }`}
                    >
                        {settings.scanInputMode === 'AUTO' && (
                            <span className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Đang dùng
                            </span>
                        )}
                        <div className={`p-3 rounded-xl ${
                            settings.scanInputMode === 'AUTO' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'
                        }`}>
                            <Zap size={28} />
                        </div>
                        <div>
                            <p className="font-black text-gray-800 text-base">Tự động</p>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                Nhận cả CCCD lẫn mã hồ sơ.<br/>
                                <span className="font-semibold text-amber-600">⚡ Dự phòng — kém chính xác hơn</span>
                            </p>
                        </div>
                    </button>

                </div>

                {/* Mô tả chi tiết chế độ đang chọn */}
                {settings.scanInputMode === 'CCCD' && (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-800 flex items-start gap-3 animate-fade-in">
                        <CreditCard size={18} className="shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold mb-1">ℹ️ Chế độ Quét CCCD đang hoạt động</p>
                            <p className="text-indigo-600">Hệ thống chỉ xử lý dữ liệu từ thẻ CCCD chip (12 số, ngăn cách '|') hoặc QR BHYT. Nếu quét barcode mã hồ sơ sẽ bị từ chối hoàn toàn.</p>
                        </div>
                    </div>
                )}
                {settings.scanInputMode === 'RECORD_CODE' && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-sm text-emerald-800 flex items-start gap-3 animate-fade-in">
                        <Hash size={18} className="shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold mb-1">ℹ️ Chế độ Quét Mã Hồ sơ đang hoạt động</p>
                            <p className="text-emerald-600">Hệ thống chỉ xử lý chuỗi barcode 4-30 ký tự (chữ-số, gạch ngang). Dùng tại khu xét nghiệm, CNHA, Nhà thuốc. Nếu quét CCCD chip sẽ bị bỏ qua.</p>
                        </div>
                    </div>
                )}
                {settings.scanInputMode === 'AUTO' && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-800 flex items-start gap-3 animate-fade-in">
                        <Zap size={18} className="shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold mb-1">⚠️ Chế độ Tự động đang hoạt động</p>
                            <p className="text-amber-700">Thử nhận dạng CCCD trước, nếu không khớp sẽ thử mã hồ sơ. Chỉ dùng khi khu vực cần đồng thời cả hai loại — có thể chậm hơn.</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600"><PrinterIcon size={24} /></div>
                    <div><h5 className="font-bold text-gray-800 text-xl">Cấu hình Máy in</h5></div>
                    <div className="ml-auto">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={settings.printerConfig.enabled} onChange={e => updatePrinterConfig({ enabled: e.target.checked })} />
                            <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-emerald-500"></div>
                        </label>
                    </div>
                </div>

                {settings.printerConfig.enabled && (
                    <div className="space-y-6 animate-fade-in">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">1. Loại kết nối</label>
                            <div className="flex gap-4 p-1.5 bg-gray-100 rounded-xl overflow-x-auto">
                                {['DRIVER', 'LAN', 'USB', 'FILE'].map(mode => (
                                    <button
                                        key={mode}
                                        onClick={() => updatePrinterConfig({ type: mode as any })}
                                        className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all ${settings.printerConfig.type === mode ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500'}`}
                                    >
                                        {mode === 'DRIVER' ? 'Driver (PC)' : mode === 'USB' ? 'USB (Android)' : mode === 'FILE' ? 'Xuất File' : 'Mạng LAN'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {settings.printerConfig.type !== 'DRIVER' && (
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">2. Ngôn ngữ in & Template</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={() => updatePrinterConfig({ language: 'ESC' })} className={`p-3 rounded-xl border flex items-center gap-3 ${settings.printerConfig.language === 'ESC' ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-gray-200'}`}>
                                        <Receipt size={20} /> <span className="font-bold">ESC/POS (Hóa đơn)</span>
                                    </button>
                                    <button onClick={() => updatePrinterConfig({ language: 'TSPL' })} className={`p-3 rounded-xl border flex items-center gap-3 ${settings.printerConfig.language === 'TSPL' ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-gray-200'}`}>
                                        <StickyNote size={20} /> <span className="font-bold">TSPL (Tem nhãn)</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <label className="text-sm font-bold text-gray-700">Tên hiển thị</label>
                                <input type="text" className="w-full p-3 border border-gray-200 rounded-xl outline-none" value={settings.printerConfig.printerName} onChange={e => updatePrinterConfig({ printerName: e.target.value })} />
                            </div>

                            {settings.printerConfig.type !== 'DRIVER' && (
                                <>
                                    <div className="col-span-2 bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="bg-purple-100 p-2 rounded text-purple-700"><Type size={18} /></div>
                                            <div>
                                                <p className="font-bold text-sm text-gray-800">🌐 Chế độ Encoding (Tiếng Việt)</p>
                                                <p className="text-xs text-gray-500">Chọn cách xử lý ký tự có dấu khi in</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <button
                                                onClick={() => updatePrinterConfig({ encodingMode: 'UTF8' })}
                                                className={`p-3 rounded-xl border-2 transition-all ${(settings.printerConfig.encodingMode || 'UTF8') === 'UTF8'
                                                    ? 'border-purple-500 bg-white shadow-md'
                                                    : 'border-purple-200 bg-white/50'
                                                    }`}
                                            >
                                                <div className="text-2xl mb-1">🌐</div>
                                                <div className="font-bold text-xs text-gray-800">UTF-8</div>
                                                <div className="text-[10px] text-gray-500">Hiện đại</div>
                                            </button>
                                            <button
                                                onClick={() => updatePrinterConfig({ encodingMode: 'CODEPAGE' })}
                                                className={`p-3 rounded-xl border-2 transition-all ${settings.printerConfig.encodingMode === 'CODEPAGE'
                                                    ? 'border-purple-500 bg-white shadow-md'
                                                    : 'border-purple-200 bg-white/50'
                                                    }`}
                                            >
                                                <div className="text-2xl mb-1">📄</div>
                                                <div className="font-bold text-xs text-gray-800">Code Page</div>
                                                <div className="text-[10px] text-gray-500">Truyền thống</div>
                                            </button>
                                            <button
                                                onClick={() => updatePrinterConfig({ encodingMode: 'NO_ACCENTS' })}
                                                className={`p-3 rounded-xl border-2 transition-all ${settings.printerConfig.encodingMode === 'NO_ACCENTS'
                                                    ? 'border-purple-500 bg-white shadow-md'
                                                    : 'border-purple-200 bg-white/50'
                                                    }`}
                                            >
                                                <div className="text-2xl mb-1">✏️</div>
                                                <div className="font-bold text-xs text-gray-800">Không dấu</div>
                                                <div className="text-[10px] text-gray-500">An toàn</div>
                                            </button>
                                        </div>
                                        <div className="mt-3 p-2 bg-white/70 rounded-lg">
                                            <p className="text-xs text-purple-700">
                                                {(settings.printerConfig.encodingMode || 'UTF8') === 'UTF8' && '💡 Khuyến nghị cho máy in hiện đại (Xprinter, Sunmi). Hỗ trợ đầy đủ ký tự Việt.'}
                                                {settings.printerConfig.encodingMode === 'CODEPAGE' && '💡 Sử dụng bảng mã WPC1258. Thử nếu UTF-8 không hoạt động.'}
                                                {settings.printerConfig.encodingMode === 'NO_ACCENTS' && '💡 Loại bỏ dấu (ă→a, ê→e). Đảm bảo in được trên mọi máy.'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="col-span-2 bg-gradient-to-br from-cyan-50 to-blue-50 p-4 rounded-xl border border-cyan-100">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="bg-cyan-100 p-2 rounded text-cyan-700"><StickyNote size={18} /></div>
                                            <div>
                                                <p className="font-bold text-sm text-gray-800">🖼️ Chế độ xử lý Nội dung</p>
                                                <p className="text-xs text-gray-500">Chọn cách thức gửi dữ liệu tới máy in</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => updatePrinterConfig({ printMode: 'TEXT' })}
                                                className={`p-3 rounded-xl border-2 transition-all ${(settings.printerConfig.printMode || 'TEXT') === 'TEXT'
                                                    ? 'border-cyan-500 bg-white shadow-md'
                                                    : 'border-cyan-200 bg-white/50'
                                                    }`}
                                            >
                                                <div className="text-2xl mb-1">🔤</div>
                                                <div className="font-bold text-xs text-gray-800">Chế độ Văn bản</div>
                                                <div className="text-[10px] text-gray-500">Nhanh, font mặc định</div>
                                            </button>
                                            <button
                                                onClick={() => updatePrinterConfig({ printMode: 'IMAGE' })}
                                                className={`p-3 rounded-xl border-2 transition-all ${settings.printerConfig.printMode === 'IMAGE'
                                                    ? 'border-cyan-500 bg-white shadow-md'
                                                    : 'border-cyan-200 bg-white/50'
                                                    }`}
                                            >
                                                <div className="text-2xl mb-1">🖼️</div>
                                                <div className="font-bold text-xs text-gray-800">Chế độ Hình ảnh</div>
                                                <div className="text-[10px] text-gray-500">Chuẩn Tiếng Việt, chậm hơn</div>
                                            </button>
                                        </div>
                                        <div className="mt-3 p-2 bg-white/70 rounded-lg">
                                            <p className="text-xs text-cyan-700">
                                                {(settings.printerConfig.printMode || 'TEXT') === 'TEXT' && '💡 Thích hợp khi máy in đã được nạp sẵn font Tiếng Việt hoặc dùng Code Page.'}
                                                {settings.printerConfig.printMode === 'IMAGE' && '💡 GIẢI PHÁP TỐT NHẤT: Renders toàn bộ phiếu thành ảnh. Đảm bảo hiển thị Tiếng Việt 100%.'}
                                            </p>
                                        </div>
                                    </div>

                                    {settings.printerConfig.encodingMode === 'CODEPAGE' && (
                                        <div className="col-span-2 bg-blue-50 p-4 rounded-xl border border-blue-100">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="bg-blue-100 p-2 rounded text-blue-700"><Type size={18} /></div>
                                                <div>
                                                    <p className="font-bold text-sm text-gray-800">Code Page (Bảng mã tiếng Việt)</p>
                                                    <p className="text-xs text-gray-500">Chọn Code Page phù hợp với máy in của bạn</p>
                                                </div>
                                            </div>
                                            <select
                                                value={settings.printerConfig.codePage || 30}
                                                onChange={e => updatePrinterConfig({ codePage: parseInt(e.target.value) })}
                                                className="w-full p-3 border border-blue-200 rounded-xl outline-none bg-white font-mono text-sm"
                                            >
                                                <option value={0}>CP0 - PC437 (USA, Standard Europe)</option>
                                                <option value={1}>CP1 - Katakana</option>
                                                <option value={2}>CP2 - PC850 (Multilingual)</option>
                                                <option value={3}>CP3 - PC860 (Portuguese)</option>
                                                <option value={16}>CP16 - WPC1252 (Latin I)</option>
                                                <option value={17}>CP17 - PC866 (Cyrillic #2)</option>
                                                <option value={18}>CP18 - PC852 (Latin 2)</option>
                                                <option value={19}>CP19 - PC858 (Euro)</option>
                                                <option value={26}>CP26 - PC858 (Thai #42)</option>
                                                <option value={27}>CP27 - PC3001 (Thai #11)</option>
                                                <option value={28}>CP28 - PC3011 (Thai #18)</option>
                                                <option value={29}>CP29 - PC3012 (Thai #13)</option>
                                                <option value={30}>CP30 - WPC1258 (Vietnamese) ⭐</option>
                                                <option value={255}>CP255 - UTF-8 (nếu máy in hỗ trợ)</option>
                                            </select>
                                            <p className="text-xs text-blue-600 mt-2">💡 Thử CP30 trước. Nếu sai, thử CP16, CP0, hoặc CP255</p>
                                        </div>
                                    )}
                                </>
                            )}

                            {settings.printerConfig.type === 'LAN' && (
                                <div className="col-span-2 grid grid-cols-2 gap-4 bg-blue-50/30 p-4 rounded-xl border border-blue-100/50">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Địa chỉ IP
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full p-3 border border-gray-200 rounded-xl outline-none font-mono text-blue-700 bg-white"
                                            value={settings.printerConfig.ipAddress || ''}
                                            onChange={e => updatePrinterConfig({ ipAddress: e.target.value })}
                                            placeholder="192.168.1.xxx"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Cổng (Port)
                                        </label>
                                        <input
                                            type="number"
                                            className="w-full p-3 border border-gray-200 rounded-xl outline-none font-mono text-blue-700 bg-white"
                                            value={settings.printerConfig.port || 9100}
                                            onChange={e => updatePrinterConfig({ port: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <p className="col-span-2 text-[10px] text-blue-500 italic">💡 Ví dụ: 192.168.1.100. Cổng mặc định thường là 9100.</p>
                                </div>
                            )}

                            {!Capacitor.isNativePlatform() && (
                                <div className="col-span-2 bg-amber-50 p-4 rounded-xl border border-amber-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="bg-amber-100 p-2 rounded text-amber-700"><RefreshCw size={18} /></div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-800">🌐 Chạy trên Trình duyệt (Web Mode)</p>
                                            <p className="text-xs text-gray-500">Plugin máy in native không khả dụng trên web.</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Web Print Proxy URL (Tùy chọn)</label>
                                        <input
                                            type="text"
                                            className="w-full p-3 border border-amber-200 rounded-xl outline-none bg-white font-mono text-sm"
                                            value={settings.printerConfig.webProxyUrl || ''}
                                            onChange={e => updatePrinterConfig({ webProxyUrl: e.target.value })}
                                            placeholder="http://localhost:9100/print"
                                        />
                                        <p className="text-[10px] text-amber-600">💡 Sử dụng khi cần in từ trình duyệt qua một service trung gian cục bộ.</p>
                                    </div>
                                </div>
                            )}

                            {settings.printerConfig.type === 'USB' && (
                                <div className="col-span-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-bold text-blue-800">USB Printers (Android)</p>
                                        <button onClick={scanUsbPrinters} disabled={isScanningUsb} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg text-sm font-bold border border-blue-200">
                                            <RefreshCw size={14} className={isScanningUsb ? "animate-spin" : ""} /> Quét
                                        </button>
                                    </div>
                                    {usbPrinters.map((p, idx) => {
                                        const id = p.id || p.deviceId;
                                        return (
                                            <div key={idx} className="bg-white p-2 rounded border flex justify-between items-center">
                                                <span className="text-sm font-bold">{p.name || `Printer #${id}`}</span>
                                                <div className="flex gap-2">
                                                    <button onClick={() => requestUsbPermission(p)} className="p-1.5 bg-yellow-100 text-yellow-700 rounded"><ShieldCheck size={16} /></button>
                                                    <button onClick={() => updatePrinterConfig({ printerId: id } as any)} className={`p-1.5 rounded ${currentPrinterId == id ? 'bg-green-500 text-white' : 'bg-gray-100'}`}><CheckCircle size={16} /></button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}


                        </div>

                        <div className="bg-gray-900 rounded-xl p-4 font-mono text-xs overflow-hidden">
                            <div className="flex items-center gap-2 text-gray-400 mb-2 border-b border-gray-700 pb-2">
                                <Terminal size={14} />
                                <span className="font-bold">Printer Output Log</span>
                            </div>
                            <div
                                ref={logContainerRef}
                                className="h-32 overflow-y-auto text-green-400 space-y-1 custom-scrollbar"
                            >
                                {testLogs.length === 0 ? (
                                    <span className="text-gray-600 italic">Nhấn "In thử" để xem log...</span>
                                ) : (
                                    testLogs.map((log, i) => <div key={i}>{log}</div>)
                                )}
                            </div>
                        </div>

                        <div className="pt-2 flex gap-3">
                            <button
                                onClick={async () => {
                                    setPrinterStatus('idle');
                                    addLog("Đang kiểm tra kết nối...");
                                    try {
                                        // Manual connect check
                                        const printerPkg = (window as any).Printer || (await import('../../../../plugins/PrinterPlugin')).default;
                                        const addr = settings.printerConfig.printerId || "";
                                        const type = settings.printerConfig.type === 'USB' ? 3 :
                                            settings.printerConfig.type === 'LAN' ? 2 : 3;
                                        await printerPkg.connect({ type, address: addr });
                                        addLog("KẾT NỐI THÀNH CÔNG!");
                                        setPrinterStatus('success');
                                    } catch (e: any) {
                                        addLog("KẾT NỐI THẤT BẠI: " + e.message);
                                        setPrinterStatus('error');
                                    }
                                }}
                                className="px-6 py-4 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                            >
                                <Usb size={20} />
                                <span>Kiểm tra Kết nối</span>
                            </button>

                            <button
                                onClick={handleTestPrinter}
                                disabled={isTestingPrinter}
                                className="flex-1 px-6 py-4 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-900 transition-all flex items-center justify-center gap-3 shadow-lg"
                            >
                                {isTestingPrinter ? <Loader2 className="animate-spin" size={20} /> : <Eye size={20} />}
                                <span>In thử & Kiểm tra</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeviceTab;


