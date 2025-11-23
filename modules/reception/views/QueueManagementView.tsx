
import React, { useState, useEffect } from 'react';
import { 
    TvIcon, 
    MegaphoneIcon, 
    UserGroupIcon, 
    ChevronRightIcon, 
    RefreshIcon,
    CheckCircleIcon,
    XIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';

// --- TYPES ---
interface QueuePatient {
    id: string;
    name: string;
    number: number; // Số thứ tự
    status: 'waiting' | 'called' | 'serving' | 'completed' | 'skipped';
    arrivalTime: string;
}

interface ClinicQueue {
    id: string;
    name: string;
    doctor: string;
    currentNumber: number | null;
    patients: QueuePatient[];
}

// --- MOCK DATA ---
const initialQueues: ClinicQueue[] = [
    {
        id: 'PK01',
        name: 'PK Nội Tổng Quát 01',
        doctor: 'BS. Nguyễn Văn A',
        currentNumber: 105,
        patients: [
            { id: 'P01', name: 'Lê Thị Mơ', number: 105, status: 'serving', arrivalTime: '08:00' },
            { id: 'P02', name: 'Trần Văn B', number: 106, status: 'waiting', arrivalTime: '08:15' },
            { id: 'P03', name: 'Phạm Thị C', number: 107, status: 'waiting', arrivalTime: '08:20' },
            { id: 'P04', name: 'Ngô Văn D', number: 108, status: 'waiting', arrivalTime: '08:30' },
        ]
    },
    {
        id: 'PK02',
        name: 'PK Tai Mũi Họng',
        doctor: 'BS. Lê Văn C',
        currentNumber: 203,
        patients: [
            { id: 'P05', name: 'Hoàng Văn Em', number: 203, status: 'called', arrivalTime: '09:00' },
            { id: 'P06', name: 'Đỗ Thị F', number: 204, status: 'waiting', arrivalTime: '09:10' },
        ]
    },
    {
        id: 'PK03',
        name: 'PK Sản - Phụ Khoa',
        doctor: 'BS. Phạm Văn D',
        currentNumber: null,
        patients: [
            { id: 'P07', name: 'Trần Thị Bích', number: 301, status: 'waiting', arrivalTime: '08:00' },
            { id: 'P08', name: 'Nguyễn Thị H', number: 302, status: 'waiting', arrivalTime: '08:15' },
        ]
    }
];

const QueueManagementView: React.FC = () => {
    const { fontSettings } = useTheme();
    const [queues, setQueues] = useState<ClinicQueue[]>(initialQueues);
    const [isTvMode, setIsTvMode] = useState(false);
    const [flashMessage, setFlashMessage] = useState<string | null>(null);

    // --- ACTIONS ---

    const handleCallNext = (queueId: string) => {
        setQueues(prev => prev.map(q => {
            if (q.id !== queueId) return q;

            // 1. Move current 'serving' or 'called' to 'completed'
            const newPatients = q.patients.map(p => 
                (p.status === 'serving' || p.status === 'called') 
                    ? { ...p, status: 'completed' as const } 
                    : p
            );

            // 2. Find next 'waiting'
            const nextPatientIndex = newPatients.findIndex(p => p.status === 'waiting');
            
            if (nextPatientIndex !== -1) {
                newPatients[nextPatientIndex] = { 
                    ...newPatients[nextPatientIndex], 
                    status: 'called' as const 
                };
                const nextNumber = newPatients[nextPatientIndex].number;
                
                // Trigger Flash Message
                setFlashMessage(`Mời số ${nextNumber} - ${newPatients[nextPatientIndex].name} vào ${q.name}`);
                setTimeout(() => setFlashMessage(null), 5000);

                return { ...q, currentNumber: nextNumber, patients: newPatients };
            }

            return { ...q, patients: newPatients };
        }));
    };

    const handleRecall = (queueId: string) => {
        const queue = queues.find(q => q.id === queueId);
        if (queue && queue.currentNumber) {
            const patient = queue.patients.find(p => p.number === queue.currentNumber);
            if (patient) {
                setFlashMessage(`Mời lại số ${patient.number} - ${patient.name} vào ${queue.name}`);
                setTimeout(() => setFlashMessage(null), 5000);
            }
        }
    };

    const handleSkip = (queueId: string) => {
        setQueues(prev => prev.map(q => {
            if (q.id !== queueId) return q;
            
            // Find currently called patient
            const currentIdx = q.patients.findIndex(p => p.number === q.currentNumber);
            if (currentIdx !== -1) {
                const newPatients = [...q.patients];
                newPatients[currentIdx] = { 
                    ...newPatients[currentIdx], 
                    status: 'skipped' as const 
                };
                return { ...q, patients: newPatients };
            }
            return q;
        }));
    };

    // --- TV MODE RENDER ---
    if (isTvMode) {
        return (
            <div className="fixed inset-0 z-[100] bg-slate-900 text-white flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center px-8 py-4 bg-slate-800 border-b border-slate-700 shadow-lg">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <TvIcon className="w-8 h-8 text-white"/>
                        </div>
                        <h1 className="text-3xl font-bold uppercase tracking-widest">Màn hình Gọi số</h1>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-mono font-bold text-yellow-400">{new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</p>
                        <p className="text-sm text-slate-400">{new Date().toLocaleDateString('vi-VN')}</p>
                    </div>
                    <button onClick={() => setIsTvMode(false)} className="absolute top-4 right-4 opacity-0 hover:opacity-100 p-2 bg-white/10 rounded">
                        <XIcon className="w-6 h-6"/>
                    </button>
                </div>

                {/* Main Display Area */}
                <div className="flex-1 p-8 flex gap-8">
                    {/* Left: Currently Calling (Big Cards) */}
                    <div className="w-2/3 flex flex-col gap-6">
                        <h2 className="text-2xl font-bold uppercase text-blue-400 mb-2 border-b border-blue-500/30 pb-2">Đang mời vào khám</h2>
                        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                            {queues.map(q => {
                                const current = q.patients.find(p => p.status === 'called' || p.status === 'serving');
                                if (!current) return null;
                                return (
                                    <div key={q.id} className={`bg-slate-800 rounded-2xl p-6 border-l-8 shadow-2xl flex justify-between items-center animate-fade-in-up ${current.status === 'called' ? 'border-green-500 bg-slate-800' : 'border-blue-500 bg-slate-800/50'}`}>
                                        <div>
                                            <h3 className="text-3xl font-bold text-white mb-2">{q.name}</h3>
                                            <p className="text-xl text-slate-400">{q.doctor}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-6xl font-black text-yellow-400 font-mono">{current.number}</div>
                                            <div className="text-2xl text-white font-semibold mt-2">{current.name}</div>
                                            {current.status === 'called' && <div className="mt-2 text-green-400 font-bold uppercase animate-pulse">Đang gọi...</div>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: Waiting Lists (Compact) */}
                    <div className="w-1/3 bg-slate-800/50 rounded-2xl p-6 border border-slate-700 flex flex-col">
                        <h2 className="text-xl font-bold uppercase text-slate-400 mb-4 border-b border-slate-600 pb-2">Hàng đợi tiếp theo</h2>
                        <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar">
                            {queues.map(q => {
                                const waiting = q.patients.filter(p => p.status === 'waiting');
                                if (waiting.length === 0) return null;
                                return (
                                    <div key={q.id}>
                                        <h4 className="font-bold text-blue-300 mb-2 text-lg">{q.name}</h4>
                                        <div className="space-y-2">
                                            {waiting.slice(0, 5).map(p => (
                                                <div key={p.id} className="flex justify-between items-center bg-slate-700/50 p-3 rounded-lg">
                                                    <span className="font-mono font-bold text-xl text-white">{p.number}</span>
                                                    <span className="text-slate-300">{p.name}</span>
                                                </div>
                                            ))}
                                            {waiting.length > 5 && <div className="text-center text-slate-500 italic">...và {waiting.length - 5} người khác</div>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Flash Overlay */}
                {flashMessage && (
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-10 py-6 rounded-2xl shadow-2xl z-50 animate-bounce-in">
                        <div className="text-4xl font-bold flex items-center gap-4">
                            <MegaphoneIcon className="w-12 h-12"/>
                            {flashMessage}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // --- CONTROLLER MODE RENDER ---
    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <MegaphoneIcon className="w-8 h-8 text-blue-600"/>
                        Điều phối Hàng đợi
                    </h1>
                    <p className="text-slate-500 text-sm">Quản lý gọi số và phân luồng bệnh nhân.</p>
                </div>
                <button 
                    onClick={() => setIsTvMode(true)}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-lg font-bold shadow-lg flex items-center gap-2 transition transform hover:scale-105"
                >
                    <TvIcon className="w-5 h-5"/> Mở màn hình TV
                </button>
            </div>

            {/* Queue Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 flex-1 overflow-y-auto pb-4">
                {queues.map(queue => {
                    const currentPatient = queue.patients.find(p => p.status === 'called' || p.status === 'serving');
                    const waitingPatients = queue.patients.filter(p => p.status === 'waiting');
                    const nextPatient = waitingPatients[0];

                    return (
                        <div key={queue.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden h-[450px]">
                            {/* Card Header */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                                <h3 className="font-bold text-lg text-slate-800 dark:text-white truncate" title={queue.name}>{queue.name}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                    <UserGroupIcon className="w-4 h-4"/> {queue.doctor}
                                </p>
                            </div>

                            {/* Current Status (Big Area) */}
                            <div className="p-6 text-center border-b border-slate-200 dark:border-slate-700 bg-blue-50/50 dark:bg-blue-900/10 flex-shrink-0">
                                <p className="text-xs font-bold uppercase text-slate-400 mb-1">Đang khám / Đang gọi</p>
                                {currentPatient ? (
                                    <>
                                        <div className="text-5xl font-black text-blue-600 dark:text-blue-400 font-mono mb-2">
                                            {currentPatient.number}
                                        </div>
                                        <div className="text-xl font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                                            {currentPatient.name}
                                        </div>
                                        <div className={`inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                            currentPatient.status === 'called' 
                                            ? 'bg-green-100 text-green-700 animate-pulse' 
                                            : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {currentPatient.status === 'called' ? 'Đang gọi...' : 'Đang khám'}
                                        </div>
                                    </>
                                ) : (
                                    <div className="py-4 text-slate-400">
                                        <div className="text-4xl font-bold opacity-30">--</div>
                                        <p>Chưa có bệnh nhân</p>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="p-3 grid grid-cols-3 gap-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                                <button 
                                    onClick={() => handleCallNext(queue.id)}
                                    disabled={!nextPatient}
                                    className="col-span-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm shadow disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center"
                                >
                                    <ChevronRightIcon className="w-5 h-5"/>
                                    <span>Gọi số tiếp</span>
                                </button>
                                <button 
                                    onClick={() => handleRecall(queue.id)}
                                    disabled={!currentPatient}
                                    className="col-span-1 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold text-sm shadow disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center"
                                >
                                    <RefreshIcon className="w-5 h-5"/>
                                    <span>Gọi lại</span>
                                </button>
                                <button 
                                    onClick={() => handleSkip(queue.id)}
                                    disabled={!currentPatient}
                                    className="col-span-1 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-bold text-sm shadow disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center"
                                >
                                    <XIcon className="w-5 h-5"/>
                                    <span>Vắng mặt</span>
                                </button>
                            </div>

                            {/* Waiting List */}
                            <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900/30 p-3">
                                <div className="flex justify-between items-center mb-2 px-1">
                                    <span className="text-xs font-bold uppercase text-slate-500">Đang chờ ({waitingPatients.length})</span>
                                </div>
                                <div className="space-y-2">
                                    {waitingPatients.length === 0 ? (
                                        <p className="text-center text-sm text-slate-400 italic py-4">Hết hàng đợi.</p>
                                    ) : (
                                        waitingPatients.map(p => (
                                            <div key={p.id} className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700 shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-mono font-bold text-lg text-blue-600 dark:text-blue-400 w-8 text-center">{p.number}</span>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{p.name}</p>
                                                        <p className="text-xs text-slate-400">{p.arrivalTime}</p>
                                                    </div>
                                                </div>
                                                <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-500">Chờ</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default QueueManagementView;
