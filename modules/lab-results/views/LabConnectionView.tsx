
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    ServerStackIcon, 
    RefreshIcon, 
    PlayIcon, 
    StopIcon, 
    CodeBracketIcon, 
    CommandLineIcon, 
    CheckIcon, 
    XIcon, 
    CogIcon, 
    TrashIcon, 
    PlusIcon, 
    ArrowUpTrayIcon 
} from '../../../components/Icons';
import { LisMachineConfig, LisLogEntry, LisResultData } from '../../../types';
import { lisService } from '../../../services/lisService';
import Combobox from '../../../components/shared/Combobox';

// --- MOCK DATA FOR MACHINES ---
const initialMachines: LisMachineConfig[] = [
    { id: 'M01', name: 'Sysmex XN-1000 (Huyết học)', protocol: 'HL7', ip: '192.168.1.101', port: '5001', mode: 'Bidirectional', status: 'Online', autoSendOrder: true, lastActive: 'Just now' },
    { id: 'M02', name: 'Cobas 6000 (Sinh hóa)', protocol: 'ASTM', ip: '192.168.1.102', port: '5002', mode: 'Bidirectional', status: 'Online', autoSendOrder: false, lastActive: '1 min ago' },
    { id: 'M03', name: 'UriSys 2400 (Nước tiểu)', protocol: 'Serial', ip: 'COM1', port: '9600', mode: 'Unidirectional', status: 'Offline', autoSendOrder: false, lastActive: '2 hours ago' },
];

// --- MODAL COMPONENT: MACHINE CONFIG ---
const MachineConfigModal = ({ 
    isOpen, 
    onClose, 
    onSave, 
    initialData 
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    onSave: (data: LisMachineConfig) => void; 
    initialData?: LisMachineConfig 
}) => {
    const [formData, setFormData] = useState<Partial<LisMachineConfig>>({
        protocol: 'HL7',
        mode: 'Bidirectional',
        status: 'Offline',
        autoSendOrder: false
    });

    useEffect(() => {
        if (isOpen) {
            setFormData(initialData || {
                id: `M${Date.now()}`,
                protocol: 'HL7',
                mode: 'Bidirectional',
                status: 'Offline',
                autoSendOrder: false
            });
        }
    }, [isOpen, initialData]);

    const handleChange = (field: keyof LisMachineConfig, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-xl shadow-2xl animate-fade-in-up overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Cấu hình Máy Xét nghiệm</h3>
                    <button onClick={onClose}><XIcon className="w-6 h-6 text-slate-500"/></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Tên hiển thị</label>
                        <input 
                            type="text" 
                            className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600" 
                            value={formData.name || ''} 
                            onChange={e => handleChange('name', e.target.value)}
                            placeholder="VD: Sysmex XN-1000"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Giao thức</label>
                            <select 
                                className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600"
                                value={formData.protocol}
                                onChange={e => handleChange('protocol', e.target.value)}
                            >
                                <option value="HL7">HL7 (TCP/IP)</option>
                                <option value="ASTM">ASTM (TCP/IP)</option>
                                <option value="Serial">ASTM (Serial/RS232)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Chế độ</label>
                            <select 
                                className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600"
                                value={formData.mode}
                                onChange={e => handleChange('mode', e.target.value)}
                            >
                                <option value="Bidirectional">2 Chiều (Gửi/Nhận)</option>
                                <option value="Unidirectional">1 Chiều (Chỉ nhận)</option>
                            </select>
                        </div>
                    </div>
                    
                    {/* Dynamic Fields based on Protocol */}
                    {formData.protocol === 'Serial' ? (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">COM Port</label>
                                <input 
                                    type="text" 
                                    className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600" 
                                    value={formData.ip || 'COM1'} // Reuse IP field for COM port name
                                    onChange={e => handleChange('ip', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Baud Rate</label>
                                <input 
                                    type="number" 
                                    className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600" 
                                    value={formData.port || '9600'} // Reuse Port field for Baud Rate
                                    onChange={e => handleChange('port', e.target.value)}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Địa chỉ IP</label>
                                <input 
                                    type="text" 
                                    className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600" 
                                    value={formData.ip || ''} 
                                    onChange={e => handleChange('ip', e.target.value)}
                                    placeholder="192.168.1.10"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Port</label>
                                <input 
                                    type="text" 
                                    className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600" 
                                    value={formData.port || ''} 
                                    onChange={e => handleChange('port', e.target.value)}
                                    placeholder="5000"
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                        <input 
                            type="checkbox" 
                            id="autoSend"
                            checked={formData.autoSendOrder}
                            onChange={e => handleChange('autoSendOrder', e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="autoSend" className="text-sm text-slate-700 dark:text-slate-300 select-none">Tự động đẩy chỉ định xuống máy khi bác sĩ lưu</label>
                    </div>
                </div>
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded">Hủy</button>
                    <button 
                        onClick={() => {
                            if(formData.name && formData.ip) {
                                onSave(formData as LisMachineConfig);
                            } else {
                                alert("Vui lòng điền đầy đủ thông tin");
                            }
                        }} 
                        className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 shadow"
                    >
                        Lưu cấu hình
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- MAIN VIEW ---
const LabConnectionView: React.FC = () => {
    const [machines, setMachines] = useState<LisMachineConfig[]>(initialMachines);
    const [selectedMachineId, setSelectedMachineId] = useState<string>(initialMachines[0].id);
    const [logs, setLogs] = useState<LisLogEntry[]>([]);
    const [isLogging, setIsLogging] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [latestParsedResult, setLatestParsedResult] = useState<LisResultData[]>([]);
    const logEndRef = useRef<HTMLDivElement>(null);

    const selectedMachine = useMemo(() => machines.find(m => m.id === selectedMachineId), [machines, selectedMachineId]);

    // --- SIMULATION ENGINE ---
    useEffect(() => {
        // Interval to simulate incoming data for the SELECTED machine only (for demo purposes)
        // In reality, we'd have a background worker for ALL machines.
        const interval = setInterval(() => {
            if (!isLogging || !selectedMachine || selectedMachine.status !== 'Online') return;

            // Random chance to receive data (simulate inbound traffic)
            if (Math.random() > 0.7) {
                const simResult = lisService.simulateIncomingData(selectedMachine.protocol);
                
                setLogs(prev => [...prev.slice(-99), simResult.log]); // Keep last 100 logs
                
                if (simResult.parsed && simResult.parsed.length > 0) {
                    setLatestParsedResult(simResult.parsed);
                }
            }
        }, 3000); // Every 3 seconds

        return () => clearInterval(interval);
    }, [isLogging, selectedMachine]);

    // Auto-scroll terminal
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    // --- ACTIONS ---

    const toggleMachineStatus = (id: string) => {
        setMachines(prev => prev.map(m => {
            if (m.id === id) {
                const newStatus = m.status === 'Online' ? 'Offline' : 'Online';
                // Add log
                setLogs(logs => [...logs, {
                    id: Date.now().toString(),
                    timestamp: new Date().toLocaleTimeString(),
                    direction: 'IN',
                    message: `[SYSTEM] Connection state changed to ${newStatus}`,
                    type: 'ACK'
                }]);
                return { ...m, status: newStatus, lastActive: 'Just now' };
            }
            return m;
        }));
    };

    const handleSaveMachine = (newConfig: LisMachineConfig) => {
        // Check if editing or adding
        const existingIdx = machines.findIndex(m => m.id === newConfig.id);
        if (existingIdx >= 0) {
            setMachines(prev => {
                const updated = [...prev];
                updated[existingIdx] = newConfig;
                return updated;
            });
        } else {
            setMachines(prev => [...prev, newConfig]);
        }
        setIsModalOpen(false);
    };

    const handleDeleteMachine = (id: string) => {
        if(window.confirm("Xóa cấu hình máy này?")) {
            setMachines(prev => prev.filter(m => m.id !== id));
            if (selectedMachineId === id && machines.length > 1) {
                setSelectedMachineId(machines[0].id);
            }
        }
    };

    const handleSendOrder = () => {
        if (!selectedMachine || selectedMachine.status !== 'Online') {
            alert("Máy đang Offline hoặc chưa chọn máy.");
            return;
        }
        
        const sampleId = `SID${Date.now().toString().slice(-4)}`;
        const orderMsg = selectedMachine.protocol === 'HL7' 
            ? lisService.generateHL7Order(sampleId, 'TEST PATIENT', ['WBC', 'RBC', 'HGB'])
            : lisService.generateASTMOrder(sampleId, 'TEST PATIENT', ['WBC', 'RBC']);

        const newLog: LisLogEntry = {
            id: Date.now().toString(),
            timestamp: new Date().toLocaleTimeString(),
            direction: 'OUT',
            message: orderMsg,
            type: 'DATA'
        };
        setLogs(prev => [...prev, newLog]);

        // Simulate Machine ACK
        setTimeout(() => {
            const ackLogs = lisService.simulateMachineResponse(selectedMachine.protocol, orderMsg);
            setLogs(prev => [...prev, ...ackLogs]);
        }, 500);
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <ServerStackIcon className="w-8 h-8 text-blue-600"/> Quản lý Kết nối LIS (Middleware)
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Giám sát trạng thái kết nối, log dữ liệu và mapping.</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm text-slate-700 dark:text-slate-200">
                        <CogIcon className="w-4 h-4"/> Cấu hình chung
                    </button>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow flex items-center gap-2 transition"
                    >
                        <PlusIcon className="w-4 h-4"/> Thêm máy
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
                
                {/* LEFT: MACHINE LIST */}
                <div className="w-full lg:w-1/3 flex flex-col gap-4 overflow-y-auto pr-2">
                    {machines.map(m => (
                        <div 
                            key={m.id}
                            onClick={() => { setSelectedMachineId(m.id); setLogs([]); setLatestParsedResult([]); }}
                            className={`bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border-2 cursor-pointer transition-all group relative overflow-hidden ${
                                selectedMachineId === m.id 
                                ? 'border-blue-500 ring-2 ring-blue-500/20' 
                                : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                        >
                            {/* Status Indicator Stripe */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${m.status === 'Online' ? 'bg-green-500' : m.status === 'Offline' ? 'bg-slate-400' : 'bg-red-500'}`}></div>

                            <div className="flex justify-between items-start mb-2 pl-2">
                                <h3 className="font-bold text-slate-800 dark:text-white text-lg">{m.name}</h3>
                                <div className={`px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm border ${
                                    m.status === 'Online' 
                                    ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400' 
                                    : m.status === 'Offline' 
                                    ? 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-400' 
                                    : 'bg-red-50 text-red-700 border-red-200'
                                }`}>
                                    <span className={`w-2 h-2 rounded-full ${m.status === 'Online' ? 'bg-green-500 animate-pulse' : m.status === 'Offline' ? 'bg-slate-500' : 'bg-red-500'}`}></span>
                                    {m.status}
                                </div>
                            </div>
                            
                            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 font-mono pl-2">
                                <div className="flex justify-between">
                                    <span>IP/Port:</span>
                                    <span className="text-slate-700 dark:text-slate-300 font-bold">{m.ip}:{m.port}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Protocol:</span>
                                    <span className="text-slate-700 dark:text-slate-300 font-bold bg-slate-100 dark:bg-slate-700 px-1 rounded">{m.protocol}</span>
                                </div>
                                <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-700 pt-2 mt-2">
                                    <span className="italic">Last active:</span>
                                    <span>{m.lastActive}</span>
                                </div>
                            </div>
                            
                            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2 pl-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteMachine(m.id); }}
                                    className="p-1.5 rounded hover:bg-red-100 text-slate-400 hover:text-red-600 transition"
                                    title="Delete"
                                >
                                    <TrashIcon className="w-4 h-4"/>
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); toggleMachineStatus(m.id); }}
                                    className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1 px-3 font-bold text-xs transition ${m.status === 'Online' ? 'text-red-500 border border-red-200' : 'text-green-600 border border-green-200'}`}
                                >
                                    {m.status === 'Online' ? <><StopIcon className="w-4 h-4"/> Stop</> : <><PlayIcon className="w-4 h-4"/> Start</>}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* RIGHT: DETAILS & LOGS */}
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                    
                    {/* Toolbar */}
                    <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-4 text-sm">
                            <button className="font-bold text-blue-600 border-b-2 border-blue-600 pb-2 -mb-2.5 dark:text-blue-400 dark:border-blue-400">
                                <CommandLineIcon className="w-4 h-4 inline mr-1"/> Live Logs
                            </button>
                            <button className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 pb-2 -mb-2.5">
                                <CodeBracketIcon className="w-4 h-4 inline mr-1"/> Mapping Codes
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            {selectedMachine?.mode === 'Bidirectional' && (
                                <button 
                                    onClick={handleSendOrder}
                                    disabled={selectedMachine.status !== 'Online'}
                                    className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded shadow flex items-center gap-1 mr-2 disabled:opacity-50"
                                >
                                    <ArrowUpTrayIcon className="w-3 h-3"/> Test Send Order
                                </button>
                            )}
                            
                            <span className="text-xs text-slate-500 dark:text-slate-400">Auto-scroll</span>
                            <button onClick={() => setIsLogging(!isLogging)} className={`p-1 rounded text-xs font-bold px-2 ${isLogging ? 'text-green-600 bg-green-100' : 'text-slate-500 bg-slate-200'}`}>
                                {isLogging ? 'ON' : 'PAUSED'}
                            </button>
                            <button onClick={() => setLogs([])} className="text-xs text-slate-500 hover:text-red-500 ml-2 p-1 hover:bg-slate-200 rounded">
                                <TrashIcon className="w-4 h-4"/>
                            </button>
                        </div>
                    </div>

                    {/* Terminal View */}
                    <div className="flex-1 bg-[#1e1e1e] font-mono text-xs p-4 overflow-y-auto shadow-inner custom-scrollbar">
                        {selectedMachine?.status === 'Offline' && (
                            <div className="text-red-500 font-bold mb-2">[System]: Connection closed. Machine is Offline.</div>
                        )}
                        {logs.length === 0 && selectedMachine?.status === 'Online' && (
                            <div className="text-gray-500 italic text-center mt-10">Waiting for data...</div>
                        )}
                        {logs.map((log) => (
                            <div key={log.id} className="mb-2 break-all hover:bg-[#2a2a2a] p-1 rounded transition-colors border-l-2 border-transparent hover:border-gray-500">
                                <span className="text-gray-500 select-none">[{log.timestamp}]</span>{' '}
                                <span className={`font-bold ${log.direction === 'IN' ? 'text-cyan-400' : 'text-orange-400'}`}>
                                    {log.direction === 'IN' ? '<< RCV' : '>> SND'}
                                </span>
                                <span className="text-gray-600 mx-1">|</span>
                                <span className={`font-bold ${log.type === 'ACK' ? 'text-green-600' : log.type === 'NAK' ? 'text-red-500' : 'text-blue-300'}`}>
                                    [{log.type}]
                                </span>:{' '}
                                <span className="text-gray-300 whitespace-pre-wrap">{log.message.replace(/\r/g, '<CR>').replace(/\n/g, '<LF>\n')}</span>
                            </div>
                        ))}
                        <div ref={logEndRef} />
                    </div>

                    {/* Parsed Result Preview (Bottom Pane) */}
                    <div className="h-40 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-0 flex flex-col">
                        <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Parsed Data (Latest)</h4>
                            {latestParsedResult.length > 0 && <span className="text-xs text-green-600 font-bold flex items-center gap-1"><CheckIcon className="w-3 h-3"/> Successfully Parsed</span>}
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-2">
                            {latestParsedResult.length > 0 ? (
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                                            <th className="p-2">Test Code</th>
                                            <th className="p-2">Result</th>
                                            <th className="p-2">Unit</th>
                                            <th className="p-2">Ref. Range</th>
                                            <th className="p-2 text-center">Flag</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {latestParsedResult.map((res, idx) => (
                                            <tr key={idx} className="hover:bg-white dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800/50">
                                                <td className="p-2 font-bold text-slate-700 dark:text-slate-300">{res.testCode}</td>
                                                <td className="p-2 font-bold text-blue-600 dark:text-blue-400 text-sm">{res.value}</td>
                                                <td className="p-2 text-slate-500">{res.unit}</td>
                                                <td className="p-2 text-slate-500">{res.refRange}</td>
                                                <td className="p-2 text-center">
                                                    {res.flag !== 'N' && res.flag ? <span className="text-red-500 font-bold">{res.flag}</span> : <span className="text-green-500 font-bold">OK</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 italic text-xs">
                                    <CodeBracketIcon className="w-6 h-6 mb-1 opacity-50"/>
                                    Waiting for valid result message...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* CONFIG MODAL */}
            <MachineConfigModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={handleSaveMachine}
            />
        </div>
    );
};

export default LabConnectionView;
