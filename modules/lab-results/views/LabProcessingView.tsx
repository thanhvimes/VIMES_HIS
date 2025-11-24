
import React, { useState, useMemo, useEffect } from 'react';
import { 
    SearchIcon, 
    DesktopComputerIcon, 
    CheckBadgeIcon, 
    PrinterIcon, 
    ExclamationCircleIcon,
    MicroscopeIcon,
    RefreshIcon,
    CheckIcon,
    XIcon,
    ChevronRightIcon,
    BeakerIcon,
    FilterIcon,
    ClockIcon,
    PlayIcon,
    UserGroupIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';

// --- TYPES ---
interface TestResult {
    id: string;
    code: string;
    name: string;
    result: string;
    unit: string;
    refRange: string;
    prevResult?: string;
    flag: 'normal' | 'high' | 'low' | 'critical';
    status: 'pending' | 'analyzed' | 'validated';
}

interface LabTask {
    id: string;
    sid: string; // Sample ID
    patientName: string;
    age: number;
    gender: string;
    location: string; // Khoa phòng gửi
    
    // Task Management Fields
    workflowStatus: 'todo' | 'processing' | 'review' | 'completed';
    priority: 'Normal' | 'Urgent';
    machineId: string; // Máy thực hiện
    assignedTo?: string; // KTV thực hiện
    internalNote?: string; // Ghi chú giao ban/nội bộ
    
    requestDate: string;
    results: TestResult[];
}

// --- MOCK DATA ---
const mockTasks: LabTask[] = [
    { 
        id: 'T01', sid: '2311170001', patientName: 'Nguyễn Văn An', age: 35, gender: 'Nam', location: 'Nội TQ', 
        workflowStatus: 'processing', priority: 'Normal', machineId: 'SYSMEX-XN', assignedTo: 'KTV. Lan',
        requestDate: '17/11 08:30',
        results: [
            { id: 'R01', code: 'RBC', name: 'Hồng cầu (RBC)', result: '', unit: 'T/L', refRange: '3.8 - 5.3', prevResult: '4.50', flag: 'normal', status: 'pending' },
            { id: 'R02', code: 'HGB', name: 'Huyết sắc tố (HGB)', result: '', unit: 'g/L', refRange: '120 - 160', prevResult: '135', flag: 'normal', status: 'pending' },
            { id: 'R03', code: 'WBC', name: 'Bạch cầu (WBC)', result: '', unit: 'G/L', refRange: '4.0 - 10.0', prevResult: '7.2', flag: 'normal', status: 'pending' },
            { id: 'R04', code: 'PLT', name: 'Tiểu cầu (PLT)', result: '', unit: 'G/L', refRange: '150 - 450', prevResult: '210', flag: 'normal', status: 'pending' },
        ]
    },
    { 
        id: 'T02', sid: '2311170005', patientName: 'Trần Văn X', age: 68, gender: 'Nam', location: 'Cấp cứu', 
        workflowStatus: 'review', priority: 'Urgent', machineId: 'COBAS-6000', assignedTo: 'KTV. Hùng',
        internalNote: 'Mẫu huyết thanh hơi đục, đã chạy lại lần 2.',
        requestDate: '17/11 09:00',
        results: [
            { id: 'R05', code: 'GLU', name: 'Glucose Máu', result: '15.2', unit: 'mmol/L', refRange: '3.9 - 6.4', prevResult: '6.1', flag: 'high', status: 'analyzed' },
            { id: 'R06', code: 'URE', name: 'Urea', result: '8.5', unit: 'mmol/L', refRange: '2.5 - 7.5', prevResult: '5.0', flag: 'high', status: 'analyzed' },
            { id: 'R07', code: 'CRE', name: 'Creatinine', result: '120', unit: 'µmol/L', refRange: '62 - 106', prevResult: '90', flag: 'high', status: 'analyzed' },
        ]
    },
    { 
        id: 'T03', sid: '2311170008', patientName: 'Lê Thị M', age: 29, gender: 'Nữ', location: 'Sản', 
        workflowStatus: 'todo', priority: 'Normal', machineId: 'SYSMEX-XN',
        requestDate: '17/11 09:15',
        results: [
            { id: 'R08', code: 'WBC', name: 'Bạch cầu', result: '', unit: 'G/L', refRange: '4.0 - 10.0', flag: 'normal', status: 'pending' },
        ]
    },
    { 
        id: 'T04', sid: '2311170009', patientName: 'Phạm Văn K', age: 50, gender: 'Nam', location: 'Hồi sức (ICU)', 
        workflowStatus: 'todo', priority: 'Urgent', machineId: 'COBAS-6000',
        requestDate: '17/11 09:20',
        results: [
            { id: 'R09', code: 'TROP', name: 'Troponin T', result: '', unit: 'ng/L', refRange: '< 14', flag: 'normal', status: 'pending' },
        ]
    },
];

const machines = [
    { id: 'ALL', name: 'Tất cả máy' },
    { id: 'SYSMEX-XN', name: 'Huyết học (Sysmex)' },
    { id: 'COBAS-6000', name: 'Sinh hóa (Cobas)' },
];

const LabProcessingView: React.FC = () => {
    const { fontSettings } = useTheme();
    const [tasks, setTasks] = useState<LabTask[]>(mockTasks);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Workflow State
    const [activeTab, setActiveTab] = useState<'todo' | 'processing' | 'review' | 'completed'>('todo');
    const [filterPriority, setFilterPriority] = useState<'All' | 'Urgent'>('All');
    const [filterMachine, setFilterMachine] = useState<string>('ALL');
    
    const [isMachineRunning, setIsMachineRunning] = useState(false);

    // --- COMPUTES ---
    const filteredTasks = useMemo(() => {
        return tasks.filter(t => {
            const matchesTab = t.workflowStatus === activeTab;
            const matchesSearch = t.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || t.sid.includes(searchTerm);
            const matchesPriority = filterPriority === 'All' || t.priority === filterPriority;
            const matchesMachine = filterMachine === 'ALL' || t.machineId === filterMachine;
            return matchesTab && matchesSearch && matchesPriority && matchesMachine;
        }).sort((a, b) => {
            // Always show Urgent first
            if (a.priority === 'Urgent' && b.priority !== 'Urgent') return -1;
            if (a.priority !== 'Urgent' && b.priority === 'Urgent') return 1;
            return 0;
        });
    }, [tasks, activeTab, searchTerm, filterPriority, filterMachine]);

    const counts = useMemo(() => {
        return {
            todo: tasks.filter(t => t.workflowStatus === 'todo').length,
            processing: tasks.filter(t => t.workflowStatus === 'processing').length,
            review: tasks.filter(t => t.workflowStatus === 'review').length,
            urgent: tasks.filter(t => t.priority === 'Urgent' && t.workflowStatus !== 'completed').length
        };
    }, [tasks]);

    const selectedTask = useMemo(() => tasks.find(t => t.id === selectedTaskId), [tasks, selectedTaskId]);

    // --- ACTIONS ---

    // Auto select first item when filter changes
    useEffect(() => {
        if (filteredTasks.length > 0) {
            if (!selectedTaskId || !filteredTasks.find(t => t.id === selectedTaskId)) {
                setSelectedTaskId(filteredTasks[0].id);
            }
        } else {
            setSelectedTaskId(null);
        }
    }, [activeTab, filterPriority, filterMachine, searchTerm]);

    const handleRunMachine = () => {
        if (!selectedTask) return;
        
        // Move to Processing if in Todo
        if (selectedTask.workflowStatus === 'todo') {
            setTasks(prev => prev.map(t => t.id === selectedTaskId ? { ...t, workflowStatus: 'processing', assignedTo: 'KTV. CurrentUser' } : t));
            // Keep selected, but tab might change. If user wants to follow sample, switch tab.
            if (window.confirm("Mẫu đã được chuyển sang trạng thái 'Đang xử lý'. Bạn có muốn chuyển sang tab Đang xử lý không?")) {
                setActiveTab('processing');
            }
            return;
        }

        // Simulate Machine Run
        setIsMachineRunning(true);
        setTimeout(() => {
            setTasks(prev => prev.map(t => {
                if (t.id === selectedTaskId) {
                    const newResults = t.results.map(r => {
                        const val = (Math.random() * 10).toFixed(2); // Mock value
                        return { ...r, result: val, status: 'analyzed' as const };
                    });
                    // Move to Review after run
                    return { ...t, results: newResults, workflowStatus: 'review' };
                }
                return t;
            }));
            setIsMachineRunning(false);
            alert("Đã có kết quả từ máy! Mẫu chuyển sang danh sách 'Chờ duyệt'.");
            setActiveTab('review');
        }, 1500);
    };

    const handleValidate = () => {
        if (selectedTask && window.confirm('Xác nhận duyệt và trả kết quả này?')) {
            setTasks(prev => prev.map(t => 
                t.id === selectedTaskId 
                ? { ...t, workflowStatus: 'completed', results: t.results.map(r => ({ ...r, status: 'validated' as const })) } 
                : t
            ));
            setSelectedTaskId(null); // Deselect
        }
    };

    const updateInternalNote = (note: string) => {
        setTasks(prev => prev.map(t => t.id === selectedTaskId ? { ...t, internalNote: note } : t));
    };

    // --- RENDER HELPERS ---
    const getPriorityBadge = (priority: string) => {
        if (priority === 'Urgent') return <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded animate-pulse">CẤP CỨU</span>;
        return null;
    };

    const getTabClass = (tab: typeof activeTab) => {
        const base = "flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex flex-col items-center justify-center relative";
        if (activeTab === tab) {
            const color = tab === 'todo' ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20' :
                          tab === 'processing' ? 'border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-900/20' :
                          tab === 'review' ? 'border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-900/20' :
                          'border-green-500 text-green-600';
            return `${base} ${color}`;
        }
        return `${base} border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800`;
    };

    return (
        <div className="flex h-full bg-slate-100 dark:bg-slate-900 overflow-hidden gap-0 border border-slate-200 dark:border-slate-700 rounded-lg">
            
            {/* --- LEFT SIDEBAR: TASK LIST (30%) --- */}
            <div className="w-96 flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 z-10 shadow-lg">
                
                {/* 1. Global Filters */}
                <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex gap-2">
                    <select 
                        className="flex-1 p-2 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-blue-500 font-bold"
                        value={filterMachine}
                        onChange={e => setFilterMachine(e.target.value)}
                    >
                        {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    <button 
                        onClick={() => setFilterPriority(prev => prev === 'All' ? 'Urgent' : 'All')}
                        className={`px-3 py-2 rounded border text-xs font-bold flex items-center gap-1 transition-colors ${
                            filterPriority === 'Urgent' 
                            ? 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/50 dark:text-red-300' 
                            : 'bg-white text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                        title="Chỉ hiện Cấp cứu"
                    >
                        <ExclamationCircleIcon className="w-4 h-4"/> {counts.urgent > 0 ? counts.urgent : ''}
                    </button>
                </div>

                {/* 2. Workflow Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <button onClick={() => setActiveTab('todo')} className={getTabClass('todo')}>
                        <span>Chờ chạy</span>
                        <span className="text-xs font-normal opacity-70">({counts.todo})</span>
                    </button>
                    <button onClick={() => setActiveTab('processing')} className={getTabClass('processing')}>
                        <span>Đang chạy</span>
                        <span className="text-xs font-normal opacity-70">({counts.processing})</span>
                    </button>
                    <button onClick={() => setActiveTab('review')} className={getTabClass('review')}>
                        <span>Chờ duyệt</span>
                        <span className="text-xs font-normal opacity-70">({counts.review})</span>
                    </button>
                </div>

                {/* 3. Search */}
                <div className="p-2 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
                        <input 
                            type="text" 
                            placeholder="Tìm SID, Tên..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className={`w-full pl-9 p-2 border border-slate-200 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 text-sm ${fontSettings.controls}`}
                        />
                    </div>
                </div>

                {/* 4. List Items */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-100 dark:bg-slate-900/50">
                    {filteredTasks.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm">Không có công việc nào.</div>
                    ) : (
                        filteredTasks.map(task => (
                            <div 
                                key={task.id}
                                onClick={() => setSelectedTaskId(task.id)}
                                className={`p-3 border-b border-slate-200 dark:border-slate-700 cursor-pointer transition-all group relative ${
                                    selectedTaskId === task.id 
                                    ? 'bg-white dark:bg-slate-800 border-l-4 border-l-blue-500 shadow-sm z-10' 
                                    : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 border-l-4 border-l-transparent'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-blue-700 dark:text-blue-400 text-sm">{task.sid}</span>
                                        {getPriorityBadge(task.priority)}
                                    </div>
                                    <span className="text-[10px] text-slate-400">{task.requestDate.split(' ')[1]}</span>
                                </div>
                                <div className="font-bold text-slate-800 dark:text-white text-sm mb-1 truncate">{task.patientName}</div>
                                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                                    <span className="flex items-center gap-1"><UserGroupIcon className="w-3 h-3"/> {task.location}</span>
                                    <span>{task.machineId}</span>
                                </div>
                                {/* Progress Bar Mock */}
                                {task.workflowStatus === 'processing' && (
                                    <div className="mt-2 h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 w-1/2 animate-pulse"></div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* --- CENTER: TASK DETAIL & EXECUTION (70%) --- */}
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 relative">
                {selectedTask ? (
                    <>
                        {/* 1. Task Header */}
                        <div className="px-6 py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-start shrink-0">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-xl font-bold text-slate-800 dark:text-white">
                                        {selectedTask.patientName}
                                    </h1>
                                    <span className="text-sm bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 font-medium">
                                        {selectedTask.gender}, {selectedTask.age}T
                                    </span>
                                    {selectedTask.priority === 'Urgent' && <span className="bg-red-100 text-red-600 border border-red-200 px-2 py-0.5 rounded text-xs font-bold uppercase">Cấp cứu</span>}
                                </div>
                                <div className="text-sm text-slate-500 flex gap-4">
                                    <span className="font-mono">SID: <strong className="text-blue-600">{selectedTask.sid}</strong></span>
                                    <span>Khoa: <strong>{selectedTask.location}</strong></span>
                                    <span>Máy: <strong>{selectedTask.machineId}</strong></span>
                                </div>
                            </div>
                            
                            {/* Quick Actions based on status */}
                            <div className="flex gap-2">
                                {selectedTask.workflowStatus === 'todo' && (
                                    <button 
                                        onClick={handleRunMachine}
                                        disabled={isMachineRunning}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow flex items-center gap-2 disabled:opacity-70"
                                    >
                                        {isMachineRunning ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> : <PlayIcon className="w-4 h-4"/>}
                                        Gửi chạy máy
                                    </button>
                                )}
                                {selectedTask.workflowStatus === 'processing' && (
                                    <button 
                                        onClick={handleRunMachine}
                                        disabled={isMachineRunning}
                                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold shadow flex items-center gap-2 disabled:opacity-70"
                                    >
                                        <RefreshIcon className="w-4 h-4"/> Lấy lại KQ
                                    </button>
                                )}
                                {selectedTask.workflowStatus === 'review' && (
                                    <button 
                                        onClick={handleValidate}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow flex items-center gap-2"
                                    >
                                        <CheckBadgeIcon className="w-4 h-4"/> Duyệt & Trả
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 2. Internal Notes Area */}
                        <div className="px-6 py-3 bg-yellow-50 dark:bg-yellow-900/10 border-b border-yellow-100 dark:border-yellow-800/30 flex items-start gap-2">
                            <div className="mt-1 text-yellow-600"><ExclamationCircleIcon className="w-4 h-4"/></div>
                            <div className="flex-1">
                                <label className="text-[10px] font-bold text-yellow-700 dark:text-yellow-500 uppercase block mb-1">Ghi chú nội bộ (Giao ban)</label>
                                <input 
                                    type="text" 
                                    value={selectedTask.internalNote || ''}
                                    onChange={e => updateInternalNote(e.target.value)}
                                    placeholder="Nhập ghi chú cho ca sau..."
                                    className="w-full bg-transparent border-b border-yellow-300 dark:border-yellow-700 focus:border-yellow-600 outline-none text-sm text-slate-700 dark:text-slate-200"
                                />
                            </div>
                        </div>

                        {/* 3. Result Table */}
                        <div className="flex-1 overflow-auto p-6 bg-slate-50 dark:bg-slate-900/50">
                            <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold sticky top-0 z-10">
                                        <tr>
                                            <th className="p-3 w-10 text-center">#</th>
                                            <th className="p-3">Xét nghiệm</th>
                                            <th className="p-3 w-32 text-center">Kết quả</th>
                                            <th className="p-3 w-20">Đơn vị</th>
                                            <th className="p-3 w-32">CSBT</th>
                                            <th className="p-3 w-24 text-right">KQ Cũ</th>
                                            <th className="p-3 w-16 text-center">Cờ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                                        {selectedTask.results.map((test, idx) => (
                                            <tr key={test.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                                <td className="p-3 text-center text-slate-400">{idx + 1}</td>
                                                <td className="p-3 font-medium text-slate-700 dark:text-slate-200">
                                                    {test.name} <span className="text-slate-400 text-xs font-normal">({test.code})</span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <input 
                                                        type="text" 
                                                        value={test.result}
                                                        readOnly={selectedTask.workflowStatus === 'completed'}
                                                        className={`w-full p-1.5 text-center font-bold border rounded bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition ${
                                                            test.flag === 'high' ? 'text-red-600' : test.flag === 'low' ? 'text-blue-600' : 'text-slate-800'
                                                        } ${selectedTask.workflowStatus === 'completed' ? 'bg-transparent border-transparent' : 'border-slate-300 dark:border-slate-600 dark:bg-slate-800'}`}
                                                    />
                                                </td>
                                                <td className="p-3 text-slate-500">{test.unit}</td>
                                                <td className="p-3 text-slate-500 font-mono text-xs">{test.refRange}</td>
                                                <td className="p-3 text-right font-mono text-slate-400 text-xs">
                                                    {test.prevResult || '-'}
                                                </td>
                                                <td className="p-3 text-center font-bold text-xs">
                                                    {test.flag === 'high' && <span className="text-red-600">H</span>}
                                                    {test.flag === 'low' && <span className="text-blue-600">L</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* 4. Footer Status */}
                        <div className="px-6 py-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs text-slate-500">
                            <div>
                                Người thực hiện: <span className="font-bold text-slate-700 dark:text-slate-300">{selectedTask.assignedTo || '---'}</span>
                            </div>
                            <div className="flex gap-4">
                                <span>TG Nhận: {selectedTask.requestDate}</span>
                                <span>TG Trả: {selectedTask.workflowStatus === 'completed' ? new Date().toLocaleTimeString() : '--:--'}</span>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                            <MicroscopeIcon className="w-12 h-12 opacity-50"/>
                        </div>
                        <p className="text-lg font-medium">Chọn một mẫu từ danh sách để xử lý</p>
                        <p className="text-sm opacity-70 mt-2">Sử dụng bộ lọc bên trái để tìm công việc.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LabProcessingView;
