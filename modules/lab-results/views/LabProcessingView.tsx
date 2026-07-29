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
import { WarningTriangleIcon, ArrowTrendingUpIcon } from '../icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { LAB_COLORS } from '../constants';

// --- TYPES ---
interface TestResult {
    id: string;
    code: string;
    name: string;
    result: string;
    unit: string;
    refRange: string;
    prevResult?: string;
    flag: 'normal' | 'high' | 'low' | 'critical' | 'delta';
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
            { id: 'R07', code: 'CRE', name: 'Creatinine', result: '320', unit: 'µmol/L', refRange: '62 - 106', prevResult: '90', flag: 'critical', status: 'analyzed' },
        ]
    },
    { 
        id: 'T03', sid: '2311170008', patientName: 'Lê Thị M', age: 29, gender: 'Nữ', location: 'Sản', 
        workflowStatus: 'todo', priority: 'Normal', machineId: 'SYSMEX-XN',
        requestDate: '17/11 09:15',
        results: [
            { id: 'R08', code: 'WBC', name: 'Bạch cầu', result: '', unit: 'G/L', refRange: '4.0 - 10.0', prevResult: '5.2', flag: 'normal', status: 'pending' },
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
    const { addNotification } = useNotification();
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
            completed: tasks.filter(t => t.workflowStatus === 'completed').length,
            urgent: tasks.filter(t => t.priority === 'Urgent' && t.workflowStatus !== 'completed').length
        };
    }, [tasks]);

    const selectedTask = useMemo(() => tasks.find(t => t.id === selectedTaskId), [tasks, selectedTaskId]);

    // --- ACTIONS ---
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
        
        if (selectedTask.workflowStatus === 'todo') {
            setTasks(prev => prev.map(t => t.id === selectedTaskId ? { ...t, workflowStatus: 'processing', assignedTo: 'KTV. Hệ thống' } : t));
            addNotification("Đã gửi mẫu vào máy", `Mẫu ${selectedTask.sid} đang chạy.`, "info", undefined, true);
            setActiveTab('processing');
            return;
        }

        // Simulate Machine Run & Auto-Validation
        setIsMachineRunning(true);
        setTimeout(() => {
            setTasks(prev => {
                let isAllNormal = true;
                const newTasks = prev.map(t => {
                    if (t.id === selectedTaskId) {
                        const newResults = t.results.map(r => {
                            // Simulate result generation
                            const base = parseFloat(r.prevResult || '5.0');
                            const variance = (Math.random() - 0.5) * 2; 
                            let val = (base + variance).toFixed(1);
                            
                            // Randomly assign flags for simulation
                            let simulatedFlag: TestResult['flag'] = 'normal';
                            if (Math.random() > 0.8) {
                                simulatedFlag = 'high';
                                isAllNormal = false;
                            } else if (Math.random() > 0.95) {
                                simulatedFlag = 'critical';
                                isAllNormal = false;
                            } else if (Math.random() > 0.7 && r.prevResult) {
                                const diff = Math.abs(parseFloat(val) - parseFloat(r.prevResult));
                                if (diff > 1.5) {
                                    simulatedFlag = 'delta';
                                    isAllNormal = false;
                                }
                            }

                            return { ...r, result: val, status: 'analyzed' as const, flag: simulatedFlag };
                        });
                        
                        // AUTO-VALIDATION LOGIC
                        if (isAllNormal) {
                            return { 
                                ...t, 
                                results: newResults.map(r => ({ ...r, status: 'validated' })), 
                                workflowStatus: 'completed',
                                internalNote: 'Đã tự động duyệt (Auto-validated)'
                            };
                        } else {
                            return { ...t, results: newResults, workflowStatus: 'review' };
                        }
                    }
                    return t;
                });

                if (isAllNormal) {
                    addNotification("Auto-Validation", `Kết quả của ${selectedTask.patientName} hoàn toàn bình thường và đã được duyệt tự động.`, "success");
                    setActiveTab('completed');
                } else {
                    addNotification("Có kết quả máy", `Phát hiện chỉ số bất thường. Vui lòng duyệt thủ công.`, "warning");
                    setActiveTab('review');
                }
                
                return newTasks;
            });
            setIsMachineRunning(false);
        }, 1500);
    };

    const handleValidate = () => {
        if (selectedTask && window.confirm('Xác nhận duyệt và trả kết quả này?')) {
            setTasks(prev => prev.map(t => 
                t.id === selectedTaskId 
                ? { ...t, workflowStatus: 'completed', results: t.results.map(r => ({ ...r, status: 'validated' as const })) } 
                : t
            ));
            
            addNotification("Đã trả kết quả", `Đã duyệt thủ công cho BN ${selectedTask.patientName}.`, "success", undefined, true);
            setActiveTab('completed');
        }
    };

    const updateInternalNote = (note: string) => {
        setTasks(prev => prev.map(t => t.id === selectedTaskId ? { ...t, internalNote: note } : t));
    };

    // --- RENDER HELPERS ---
    const getPriorityBadge = (priority: string) => {
        if (priority === 'Urgent') return <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded animate-pulse shadow-sm">CẤP CỨU</span>;
        return null;
    };

    const getTabStyle = (tab: typeof activeTab) => {
        const base = "flex-1 py-3 text-sm font-bold border-b-[3px] transition-all flex flex-col items-center justify-center";
        if (activeTab === tab) {
            return `${base} bg-white dark:bg-slate-800 text-[${LAB_COLORS.primary}] border-[${LAB_COLORS.primary}] shadow-[inset_0_-2px_0_0_rgba(249,115,22,0.1)]`;
        }
        return `${base} border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50`;
    };

    const getFlagBadge = (flag: TestResult['flag']) => {
        switch (flag) {
            case 'high': return <span className="px-2 py-0.5 bg-orange-100 text-orange-700 font-bold rounded-sm border border-orange-200">H</span>;
            case 'low': return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 font-bold rounded-sm border border-blue-200">L</span>;
            case 'critical': return <span className="px-2 py-0.5 bg-red-600 text-white font-bold rounded-sm flex items-center gap-1 animate-pulse"><WarningTriangleIcon className="w-3 h-3"/> CRIT</span>;
            case 'delta': return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 font-bold rounded-sm border border-yellow-300 flex items-center gap-1"><ArrowTrendingUpIcon className="w-3 h-3"/> DELTA</span>;
            default: return <span className="text-slate-300">-</span>;
        }
    };

    return (
        <div className="flex h-full bg-slate-100 dark:bg-slate-900 overflow-hidden gap-0 border border-slate-200 dark:border-slate-700 rounded-lg font-sans">
            
            {/* --- LEFT SIDEBAR: TASK LIST (30%) --- */}
            <div className="w-[400px] flex flex-col bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 z-10 shadow-lg">
                
                {/* 1. Global Filters */}
                <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex gap-2">
                    <select 
                        className="flex-1 p-2 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-1 focus:outline-none font-bold"
                        style={{ focusRingColor: LAB_COLORS.primary }}
                        value={filterMachine}
                        onChange={e => setFilterMachine(e.target.value)}
                    >
                        {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    <button 
                        onClick={() => setFilterPriority(prev => prev === 'All' ? 'Urgent' : 'All')}
                        className={`px-3 py-2 rounded border text-xs font-bold flex items-center gap-1 transition-colors ${
                            filterPriority === 'Urgent' 
                            ? 'bg-red-100 text-red-700 border-red-300 shadow-inner' 
                            : 'bg-slate-100 text-slate-600 border-slate-300'
                        }`}
                        title="Chỉ hiện Cấp cứu"
                    >
                        <ExclamationCircleIcon className="w-4 h-4"/> {counts.urgent > 0 ? counts.urgent : ''}
                    </button>
                </div>

                {/* 2. Workflow Tabs (Using LabCollector inspired coloring) */}
                <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900">
                    <button onClick={() => setActiveTab('todo')} className={getTabStyle('todo')}>
                        <span style={{ color: activeTab === 'todo' ? LAB_COLORS.primary : '' }}>Chờ chạy</span>
                        <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 rounded-full mt-1">{counts.todo}</span>
                    </button>
                    <button onClick={() => setActiveTab('processing')} className={getTabStyle('processing')}>
                        <span style={{ color: activeTab === 'processing' ? LAB_COLORS.secondary : '' }}>Đang chạy</span>
                        <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 rounded-full mt-1">{counts.processing}</span>
                    </button>
                    <button onClick={() => setActiveTab('review')} className={getTabStyle('review')}>
                        <span style={{ color: activeTab === 'review' ? LAB_COLORS.primaryHover : '' }}>Chờ duyệt</span>
                        <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 rounded-full mt-1">{counts.review}</span>
                    </button>
                    <button onClick={() => setActiveTab('completed')} className={getTabStyle('completed')}>
                        <span style={{ color: activeTab === 'completed' ? LAB_COLORS.completed : '' }}>Hoàn tất</span>
                        <span className="text-[10px] bg-green-100 text-green-600 px-1.5 rounded-full mt-1">{counts.completed}</span>
                    </button>
                </div>

                {/* 3. Search */}
                <div className="p-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
                        <input 
                            type="text" 
                            placeholder="Tìm SID, Tên bệnh nhân..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-9 p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 focus:outline-none text-sm shadow-inner"
                            style={{ focusRing: `2px solid ${LAB_COLORS.primaryLight}` }}
                        />
                    </div>
                </div>

                {/* 4. List Items (High Density) */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-900/50">
                    {filteredTasks.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm">Không có công việc nào trong mục này.</div>
                    ) : (
                        filteredTasks.map(task => (
                            <div 
                                key={task.id}
                                onClick={() => setSelectedTaskId(task.id)}
                                className={`p-3 border-b border-slate-200 dark:border-slate-700 cursor-pointer transition-all group relative ${
                                    selectedTaskId === task.id 
                                    ? 'bg-white dark:bg-slate-800 shadow-md z-10' 
                                    : 'hover:bg-white dark:hover:bg-slate-700'
                                }`}
                                style={{
                                    borderLeft: selectedTaskId === task.id ? `4px solid ${LAB_COLORS.primary}` : '4px solid transparent'
                                }}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-extrabold text-[13px]" style={{ color: LAB_COLORS.secondary }}>{task.sid}</span>
                                        {getPriorityBadge(task.priority)}
                                    </div>
                                    <span className="text-[10px] text-slate-400 flex items-center gap-1"><ClockIcon className="w-3 h-3"/> {task.requestDate.split(' ')[1]}</span>
                                </div>
                                <div className="font-bold text-slate-800 dark:text-white text-[13px] mb-1 truncate">{task.patientName}</div>
                                <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                                    <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 px-1.5 rounded"><UserGroupIcon className="w-3 h-3"/> {task.location}</span>
                                    <span className="bg-slate-100 dark:bg-slate-700 px-1.5 rounded">{task.machineId}</span>
                                </div>
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
                                    <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
                                        {selectedTask.patientName}
                                    </h1>
                                    <span className="text-xs bg-slate-100 border border-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 font-medium shadow-sm">
                                        {selectedTask.gender}, {selectedTask.age}T
                                    </span>
                                </div>
                                <div className="text-sm text-slate-500 flex gap-4 mt-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded border border-slate-100 dark:border-slate-700">
                                    <span className="font-mono flex items-center gap-1"><BeakerIcon className="w-4 h-4"/> SID: <strong style={{ color: LAB_COLORS.secondary }}>{selectedTask.sid}</strong></span>
                                    <span className="flex items-center gap-1"><UserGroupIcon className="w-4 h-4"/> Khoa: <strong>{selectedTask.location}</strong></span>
                                    <span className="flex items-center gap-1"><DesktopComputerIcon className="w-4 h-4"/> Máy: <strong>{selectedTask.machineId}</strong></span>
                                </div>
                            </div>
                            
                            {/* Quick Actions based on status */}
                            <div className="flex gap-2">
                                {selectedTask.workflowStatus === 'todo' && (
                                    <button 
                                        onClick={handleRunMachine}
                                        disabled={isMachineRunning}
                                        className="px-4 py-2 text-white rounded-md font-bold shadow-md flex items-center gap-2 transition-all hover:-translate-y-0.5"
                                        style={{ backgroundColor: LAB_COLORS.primary, opacity: isMachineRunning ? 0.7 : 1 }}
                                    >
                                        {isMachineRunning ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> : <PlayIcon className="w-4 h-4"/>}
                                        Gửi lệnh máy (Query)
                                    </button>
                                )}
                                {selectedTask.workflowStatus === 'processing' && (
                                    <button 
                                        onClick={handleRunMachine}
                                        disabled={isMachineRunning}
                                        className="px-4 py-2 text-white rounded-md font-bold shadow-md flex items-center gap-2 transition-all hover:-translate-y-0.5"
                                        style={{ backgroundColor: LAB_COLORS.secondary, opacity: isMachineRunning ? 0.7 : 1 }}
                                    >
                                        <RefreshIcon className="w-4 h-4"/> Nạp kết quả
                                    </button>
                                )}
                                {selectedTask.workflowStatus === 'review' && (
                                    <button 
                                        onClick={handleValidate}
                                        className="px-4 py-2 text-white rounded-md font-bold shadow-md flex items-center gap-2 transition-all hover:-translate-y-0.5"
                                        style={{ backgroundColor: LAB_COLORS.completed }}
                                    >
                                        <CheckBadgeIcon className="w-5 h-5"/> Duyệt & Trả KQ
                                    </button>
                                )}
                                {selectedTask.workflowStatus === 'completed' && (
                                    <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-md font-bold shadow-sm flex items-center gap-2">
                                        <PrinterIcon className="w-4 h-4"/> In Phiếu
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 2. Internal Notes Area */}
                        <div className="px-6 py-2 bg-yellow-50 dark:bg-yellow-900/10 border-b border-yellow-200 dark:border-yellow-800/30 flex items-center gap-3">
                            <div className="text-yellow-600"><ExclamationCircleIcon className="w-5 h-5"/></div>
                            <div className="flex-1 flex items-center gap-2">
                                <label className="text-xs font-bold text-yellow-800 dark:text-yellow-500 uppercase whitespace-nowrap">Ghi chú Nội bộ:</label>
                                <input 
                                    type="text" 
                                    value={selectedTask.internalNote || ''}
                                    onChange={e => updateInternalNote(e.target.value)}
                                    placeholder="Thêm ghi chú giao ban, bất thường mẫu..."
                                    className="w-full bg-transparent border-b border-yellow-300 dark:border-yellow-700 focus:border-yellow-600 outline-none text-sm text-slate-800 dark:text-slate-200 font-medium placeholder-yellow-600/50"
                                />
                            </div>
                        </div>

                        {/* 3. Result Table - High Density Clinical Grid */}
                        <div className="flex-1 overflow-auto p-4 bg-slate-50 dark:bg-slate-900/50">
                            <div className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-100/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 text-[11px] uppercase font-extrabold sticky top-0 z-10 border-b border-slate-300 dark:border-slate-600">
                                        <tr>
                                            <th className="p-2 w-10 text-center border-r border-slate-200 dark:border-slate-600">#</th>
                                            <th className="p-2 border-r border-slate-200 dark:border-slate-600">Xét nghiệm</th>
                                            <th className="p-2 w-32 text-center border-r border-slate-200 dark:border-slate-600">Kết quả</th>
                                            <th className="p-2 w-24 text-center border-r border-slate-200 dark:border-slate-600">Cờ (Flag)</th>
                                            <th className="p-2 w-24 border-r border-slate-200 dark:border-slate-600">Đơn vị</th>
                                            <th className="p-2 w-32 border-r border-slate-200 dark:border-slate-600">CSBT (Ref)</th>
                                            <th className="p-2 w-24 text-right">Lịch sử (Prev)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-[13px]">
                                        {selectedTask.results.map((test, idx) => {
                                            const isReadOnly = selectedTask.workflowStatus === 'completed';
                                            const isCritical = test.flag === 'critical';
                                            return (
                                                <tr key={test.id} className={`transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-blue-50/50 dark:bg-transparent ${isCritical ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                                                    <td className="p-2 text-center text-slate-400 border-r border-slate-100 dark:border-slate-700">{idx + 1}</td>
                                                    <td className="p-2 font-medium text-slate-800 dark:text-slate-200 border-r border-slate-100 dark:border-slate-700">
                                                        {test.name} <span className="text-slate-400 text-xs font-normal ml-1">[{test.code}]</span>
                                                    </td>
                                                    
                                                    {/* Result Column */}
                                                    <td className="p-1 border-r border-slate-100 dark:border-slate-700">
                                                        <div className="flex justify-center">
                                                            <span className={`w-full text-center font-bold px-2 py-1 rounded ${
                                                                test.flag === 'high' ? 'text-orange-700' : 
                                                                test.flag === 'low' ? 'text-blue-700' : 
                                                                isCritical ? 'text-red-700 bg-red-100' : 
                                                                test.flag === 'delta' ? 'text-yellow-700' :
                                                                'text-slate-800 dark:text-white'
                                                            }`}>
                                                                {test.result || '--'}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Flag Column */}
                                                    <td className="p-1 text-center border-r border-slate-100 dark:border-slate-700">
                                                        {getFlagBadge(test.flag)}
                                                    </td>

                                                    {/* Unit */}
                                                    <td className="p-2 text-slate-500 text-xs border-r border-slate-100 dark:border-slate-700">
                                                         {test.unit}
                                                    </td>

                                                    {/* Ref Range */}
                                                    <td className="p-2 text-slate-500 font-mono text-xs border-r border-slate-100 dark:border-slate-700">
                                                        {test.refRange}
                                                    </td>

                                                    {/* Prev Result */}
                                                    <td className="p-2 text-right font-mono text-slate-400 text-xs bg-slate-50/30">
                                                        {test.prevResult || '-'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* 4. Footer Status */}
                        <div className="px-6 py-2 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs text-slate-500">
                            <div className="flex gap-4">
                                <span>Trạng thái: <strong className="uppercase" style={{ color: LAB_COLORS.primary }}>{selectedTask.workflowStatus}</strong></span>
                                <span>Người thực hiện: <strong className="text-slate-700 dark:text-slate-300">{selectedTask.assignedTo || 'Hệ thống'}</strong></span>
                            </div>
                            <div className="flex gap-4 font-mono">
                                <span>Nhận: {selectedTask.requestDate}</span>
                                <span>Trả: {selectedTask.workflowStatus === 'completed' ? new Date().toLocaleTimeString() : '--:--:--'}</span>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-50 dark:bg-slate-900/50">
                        <div className="w-32 h-32 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                            <MicroscopeIcon className="w-16 h-16 opacity-30" style={{ color: LAB_COLORS.secondary }}/>
                        </div>
                        <p className="text-xl font-bold text-slate-500">Khu vực Xử lý Kết quả LIS</p>
                        <p className="text-sm opacity-70 mt-2 max-w-md text-center">Chọn một ống mẫu từ danh sách bên trái để tiến hành nạp kết quả từ máy xét nghiệm, kiểm tra Delta Check và thực hiện duyệt (Validation).</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LabProcessingView;
