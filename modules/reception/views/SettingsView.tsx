
import React, { useState, useEffect, useRef } from 'react';
import { 
    CogIcon, 
    PrinterIcon, 
    BuildingOfficeIcon, 
    CheckCircleIcon, 
    AlertCircleIcon,
    RefreshIcon,
    ComputerDesktopIcon,
    XMarkIcon,
    QrCodeIcon,
    ReceiptTextIcon
} from '../../../components/Icons';
import { settingsService, PrinterConfig, RoomSetting } from '../services/settingsService';
import { printerService } from '../../../services/printerService';
import { toast } from 'sonner';

// --- Bổ sung các Icon chuyên sâu ---
const TerminalIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
    </svg>
);

const UsbIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0 1.5 1.5 0 013 0zM8.25 18.75h3.375a2.625 2.625 0 002.625-2.625v-8.25m-11.25 3.375h3.375a2.625 2.625 0 012.625 2.625v8.25m0 0l-3.375-3.375m3.375 3.375l3.375-3.375" />
    </svg>
);

const CodeIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
);

const SettingsView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'device' | 'rooms'>('device');
    const [loading, setLoading] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [showTemplateEditor, setShowTemplateEditor] = useState(false);
    
    // Printer Settings State
    const [printerConfig, setPrinterConfig] = useState<PrinterConfig>({
        enabled: true,
        type: 'DRIVER',
        printerName: '',
        printMode: 'IMAGE',
        encodingMode: 'UTF8',
        language: 'ESC',
        width: '80mm',
        codePage: 30,
        scannerMode: 'QR_DEVICE'
    });

    // Room Settings State
    const [rooms, setRooms] = useState<RoomSetting[]>([]);
    const [searchRoom, setSearchRoom] = useState('');
    const [testLogs, setTestLogs] = useState<string[]>([]);
    const logContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [testLogs]);

    const addLog = (msg: string) => {
        const time = new Date().toLocaleTimeString('vi-VN', { hour12: false });
        setTestLogs(prev => [...prev.slice(-49), `[${time}] ${msg}`]);
    };

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'device') {
                const config = await settingsService.getPrinterConfig();
                setPrinterConfig({ ...printerConfig, ...config });
            } else {
                const data = await settingsService.getRoomsSettings();
                setRooms(data);
            }
        } catch (error) {
            toast.error('Không thể tải dữ liệu cấu hình');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveDevice = async () => {
        setLoading(true);
        try {
            await settingsService.updatePrinterConfig(printerConfig);
            toast.success('Đã lưu cấu hình thiết bị thành công');
        } catch (error) {
            toast.error('Lỗi khi lưu cấu hình');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRoom = async (room: RoomSetting, updates: Partial<RoomSetting>) => {
        try {
            await settingsService.updateRoomSettings(room.id, updates);
            setRooms(prev => prev.map(r => r.id === room.id ? { ...r, ...updates } : r));
            toast.success(`Đã cập nhật phòng ${room.name}`);
        } catch (error) {
            toast.error('Lỗi khi cập nhật phòng khám');
        }
    };

    const handleTestPrint = async () => {
        if (!printerConfig.enabled) {
            toast.warning('Máy in đang bị vô hiệu hóa');
            return;
        }

        setIsTesting(true);
        setTestLogs([]);
        addLog("BẮT ĐẦU QUY TRÌNH IN THỬ...");
        
        try {
            const success = await printerService.printTicket({
                ticketNumber: 'A-101',
                patientName: 'NGUYỄN VĂN MẪU',
                department: 'Phòng Khám Nội 1',
                time: new Date().toLocaleString('vi-VN'),
                hospitalName: 'PHÒNG KHÁM VIMES'
            }, printerConfig, addLog);

            if (success) {
                toast.success('In thử thành công!');
                addLog("QUY TRÌNH HOÀN TẤT THÀNH CÔNG.");
            } else {
                toast.error('In thử thất bại');
                addLog("QUY TRÌNH KẾT THÚC VỚI LỖI.");
            }
        } catch (error: any) {
            addLog(`LỖI NGOẠI LỆ: ${error.message}`);
            toast.error('Lỗi hệ thống khi in');
        } finally {
            setIsTesting(false);
        }
    };

    const filteredRooms = rooms.filter(r => 
        r.name.toLowerCase().includes(searchRoom.toLowerCase()) || 
        r.id.includes(searchRoom)
    );

    return (
        <div className="flex flex-col h-full bg-slate-50/50">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg text-white">
                        <CogIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Cấu hình Hệ thống Tiếp đón</h1>
                        <p className="text-xs text-slate-500">Thiết lập thiết bị ngoại vi và quản lý vận hành phòng khám</p>
                    </div>
                </div>
                
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button 
                        onClick={() => setActiveTab('device')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'device' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <UsbIcon className="w-4 h-4" /> Thiết bị ngoại vi
                    </button>
                    <button 
                        onClick={() => setActiveTab('rooms')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'rooms' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <BuildingOfficeIcon className="w-4 h-4" /> Quản lý Phòng khám
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-6 lg:p-8">
                <div className="max-w-4xl mx-auto space-y-8 pb-10">
                    
                    {activeTab === 'device' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
                            
                            {/* Section: Scanner */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                                    <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                                        <QrCodeIcon className="w-5 h-5" />
                                    </div>
                                    <h2 className="font-bold text-slate-800">Thiết bị nhập liệu (Scanner)</h2>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[
                                        { id: 'QR_DEVICE', label: 'Máy quét QR', desc: 'Có dây/Không dây USB' },
                                        { id: 'CHIP_READER', label: 'Đầu đọc Chip', desc: 'Đọc thẻ CCCD' },
                                        { id: 'CAMERA', label: 'Camera PC', desc: 'Webcam tích hợp' }
                                    ].map(mode => (
                                        <button
                                            key={mode.id}
                                            onClick={() => setPrinterConfig({...printerConfig, scannerMode: mode.id as any})}
                                            className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center text-center gap-2 ${printerConfig.scannerMode === mode.id ? 'border-blue-500 bg-blue-50/50 text-blue-700 shadow-sm' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                                        >
                                            <span className="text-2xl">{mode.id === 'QR_DEVICE' ? '🔌' : mode.id === 'CHIP_READER' ? '💳' : '📷'}</span>
                                            <span className="text-sm font-bold">{mode.label}</span>
                                            <span className="text-[10px] opacity-70">{mode.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Section: Printer */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                            <PrinterIcon className="w-5 h-5" />
                                        </div>
                                        <h2 className="font-bold text-slate-800">Cấu hình Máy in nhiệt</h2>
                                    </div>
                                    <label className="flex items-center cursor-pointer">
                                        <div className="mr-3 text-sm font-medium text-slate-500">Kích hoạt in</div>
                                        <div className="relative">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer" 
                                                checked={printerConfig.enabled}
                                                onChange={e => setPrinterConfig({...printerConfig, enabled: e.target.checked})}
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                        </div>
                                    </label>
                                </div>

                                {printerConfig.enabled && (
                                    <div className="p-8 space-y-8 animate-in fade-in duration-500">
                                        {/* Connection Type */}
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">1. Loại kết nối</label>
                                            <div className="flex gap-2 p-1.5 bg-slate-100 rounded-xl">
                                                {['DRIVER', 'LAN', 'USB', 'FILE'].map((type) => (
                                                    <button
                                                        key={type}
                                                        onClick={() => setPrinterConfig({...printerConfig, type: type as any})}
                                                        className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all ${printerConfig.type === type ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                                    >
                                                        {type === 'DRIVER' ? 'PC Driver' : type === 'LAN' ? 'Mạng LAN' : type === 'USB' ? 'USB' : 'Xuất File'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {/* Left Column: Core Settings */}
                                            <div className="space-y-6">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-slate-700">Tên Máy in / IP Address</label>
                                                    <input 
                                                        type="text" 
                                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-mono text-sm"
                                                        placeholder={printerConfig.type === 'LAN' ? '192.168.1.100' : 'Tên driver chính xác...'}
                                                        value={printerConfig.type === 'LAN' ? printerConfig.ipAddress : printerConfig.printerName}
                                                        onChange={e => printerConfig.type === 'LAN' ? setPrinterConfig({...printerConfig, ipAddress: e.target.value}) : setPrinterConfig({...printerConfig, printerName: e.target.value})}
                                                    />
                                                </div>

                                                <div className="flex gap-4">
                                                    <div className="flex-1 space-y-2">
                                                        <label className="text-sm font-bold text-slate-700">Khổ giấy</label>
                                                        <select 
                                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                                            value={printerConfig.width}
                                                            onChange={e => setPrinterConfig({...printerConfig, width: e.target.value})}
                                                        >
                                                            <option value="80mm">80 mm (K80)</option>
                                                            <option value="58mm">58 mm (K58)</option>
                                                        </select>
                                                    </div>
                                                    <div className="flex-1 space-y-2">
                                                        <label className="text-sm font-bold text-slate-700">Ngôn ngữ</label>
                                                        <select 
                                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                                            value={printerConfig.language}
                                                            onChange={e => setPrinterConfig({...printerConfig, language: e.target.value as any})}
                                                        >
                                                            <option value="ESC">ESC/POS (In nhiệt)</option>
                                                            <option value="TSPL">TSPL (In tem)</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 space-y-3">
                                                    <div className="flex items-center gap-2 font-bold text-sm text-blue-900">
                                                        <span>🖼️ Chế độ xử lý nội dung</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button 
                                                            onClick={() => setPrinterConfig({...printerConfig, printMode: 'IMAGE'})}
                                                            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${printerConfig.printMode === 'IMAGE' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-blue-600 border border-blue-200'}`}
                                                        >
                                                            Dạng Ảnh (Chuẩn nhất)
                                                        </button>
                                                        <button 
                                                            onClick={() => setPrinterConfig({...printerConfig, printMode: 'TEXT'})}
                                                            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${printerConfig.printMode === 'TEXT' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-blue-600 border border-blue-200'}`}
                                                        >
                                                            Dạng Văn bản (Nhanh)
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Column: Advanced & Test */}
                                            <div className="space-y-6">
                                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                                                    <div className="flex items-center gap-2 font-bold text-sm text-slate-800">
                                                        <span>🗜️ Encoding (Tiếng Việt)</span>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {['UTF8', 'CODEPAGE', 'NO_ACCENTS'].map(mode => (
                                                            <button 
                                                                key={mode}
                                                                onClick={() => setPrinterConfig({...printerConfig, encodingMode: mode as any})}
                                                                className={`py-2 px-1 rounded-lg text-[10px] font-bold transition-all border ${printerConfig.encodingMode === mode ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border-slate-200'}`}
                                                            >
                                                                {mode === 'UTF8' ? 'UTF-8' : mode === 'CODEPAGE' ? 'Code Page' : 'Không dấu'}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    {printerConfig.encodingMode === 'CODEPAGE' && (
                                                        <select 
                                                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                                                            value={printerConfig.codePage}
                                                            onChange={e => setPrinterConfig({...printerConfig, codePage: parseInt(e.target.value)})}
                                                        >
                                                            <option value={30}>WPC1258 (Việt Nam)</option>
                                                            <option value={0}>PC437 (Standard)</option>
                                                            <option value={16}>WPC1252 (Latin)</option>
                                                        </select>
                                                    )}
                                                </div>

                                                {/* Log Console */}
                                                <div className="bg-slate-900 rounded-xl p-4 font-mono text-[10px] flex flex-col h-44 shadow-inner">
                                                    <div className="flex items-center gap-2 text-slate-500 mb-2 border-b border-slate-800 pb-2 shrink-0">
                                                        <TerminalIcon className="w-3 h-3" />
                                                        <span className="font-bold">HỆ THỐNG GIAO TIẾP MÁY IN</span>
                                                    </div>
                                                    <div ref={logContainerRef} className="flex-1 overflow-y-auto text-emerald-400 space-y-1 custom-scrollbar">
                                                        {testLogs.length === 0 ? (
                                                            <span className="text-slate-600 italic">Hệ thống sẵn sàng. Nhấn in thử...</span>
                                                        ) : (
                                                            testLogs.map((log, i) => <div key={i} className="leading-relaxed">{log}</div>)
                                                        )}
                                                    </div>
                                                </div>

                                                <button 
                                                    onClick={handleTestPrint}
                                                    disabled={isTesting}
                                                    className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                                                >
                                                    {isTesting ? <RefreshIcon className="w-5 h-5 animate-spin" /> : <PrinterIcon className="w-5 h-5" />}
                                                    IN THỬ & KIỂM TRA
                                                </button>
                                            </div>
                                        </div>

                                        {/* Template Editor */}
                                        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
                                            <button 
                                                onClick={() => setShowTemplateEditor(!showTemplateEditor)}
                                                className="w-full flex items-center justify-between p-4 bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors"
                                            >
                                                <div className="flex items-center gap-2 font-bold text-slate-700">
                                                    <CodeIcon className="w-5 h-5 text-blue-600" />
                                                    {showTemplateEditor ? 'Ẩn Template Editor' : 'Chỉnh sửa Mẫu in (HTML/Lệnh)'}
                                                </div>
                                                <div className="text-slate-400 rotate-0">▼</div>
                                            </button>
                                            
                                            {showTemplateEditor && (
                                                <div className="p-6 space-y-4 animate-in slide-in-from-top-2 duration-300">
                                                    <div className="p-3 bg-amber-50 text-amber-800 text-[10px] rounded-xl border border-amber-100 flex flex-wrap gap-2">
                                                        <span className="font-bold mr-2">Tokens:</span>
                                                        {['{{hospitalName}}', '{{ticketNumber}}', '{{patientName}}', '{{department}}', '{{time}}'].map(t => (
                                                            <code key={t} className="bg-white/50 px-1.5 py-0.5 rounded border border-amber-200/50">{t}</code>
                                                        ))}
                                                    </div>
                                                    <textarea 
                                                        className="w-full h-64 p-4 font-mono text-xs border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 transition-all shadow-inner"
                                                        value={printerConfig.printTemplate || printerService.generateDefaultHTML({ ticketNumber: '101', patientName: '...', department: '...', time: '...' })}
                                                        onChange={e => setPrinterConfig({...printerConfig, printTemplate: e.target.value})}
                                                        placeholder="Mã lệnh in..."
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
                                    <button 
                                        disabled={loading}
                                        onClick={handleSaveDevice}
                                        className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-200"
                                    >
                                        {loading ? <RefreshIcon className="w-5 h-5 animate-spin" /> : <span>💾 LƯU THIẾT LẬP</span>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'rooms' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-4">
                            {/* Search & Stats */}
                            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                                <div className="relative w-full md:max-w-md">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                        <div className="w-5 h-5 flex items-center justify-center">🔍</div>
                                    </div>
                                    <input 
                                        type="text" 
                                        className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-2xl bg-white focus:ring-4 focus:ring-blue-100 outline-none transition-all text-sm shadow-sm"
                                        placeholder="Tìm tên hoặc mã phòng..."
                                        value={searchRoom}
                                        onChange={e => setSearchRoom(e.target.value)}
                                    />
                                </div>
                                <div className="bg-white px-4 py-2 rounded-xl border border-blue-100 shadow-sm flex items-center gap-4">
                                    <div className="text-center">
                                        <p className="text-[10px] text-slate-400 uppercase font-bold">Tổng số</p>
                                        <p className="font-bold text-blue-600">{rooms.length}</p>
                                    </div>
                                    <div className="w-px h-6 bg-slate-100"></div>
                                    <div className="text-center">
                                        <p className="text-[10px] text-slate-400 uppercase font-bold">Đang mở</p>
                                        <p className="font-bold text-emerald-600">{rooms.filter(r => r.receptionEnabled).length}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Phòng khám</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Giới hạn Ngày</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Tiếp đón</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredRooms.map((room) => (
                                            <tr key={room.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-700">{room.name}</div>
                                                    <div className="text-[10px] text-slate-400">{room.deptId}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center">
                                                        <input 
                                                            type="number"
                                                            className="w-20 px-2 py-1 text-center bg-transparent border-b border-slate-200 group-hover:border-blue-400 font-bold text-slate-700 outline-none"
                                                            value={room.maxPerDay || 0}
                                                            onChange={e => handleUpdateRoom(room, { maxPerDay: parseInt(e.target.value) || 0 })}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center">
                                                        <button 
                                                            onClick={() => handleUpdateRoom(room, { receptionEnabled: !room.receptionEnabled })}
                                                            className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${room.receptionEnabled ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                                        >
                                                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${room.receptionEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${room.active === '1' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                                        {room.active === '1' ? 'HOẠT ĐỘNG' : 'TẠM DỪNG'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
