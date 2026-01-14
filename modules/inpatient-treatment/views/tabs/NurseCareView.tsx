
import React, { useState } from 'react';
import { 
    ActivityIcon, 
    ClockIcon, 
    CheckCircleIcon,
    BeakerIcon,
    ExclamationCircleIcon,
    PencilIcon
} from '../../../../components/Icons';
import { useTheme } from '../../../../contexts/ThemeContext';

// Mock Tasks for Nurse
const mockTasks = [
    { id: 1, time: '08:00', type: 'Medication', content: 'Cefuroxim 1.5g (Tiêm TM)', status: 'pending' },
    { id: 2, time: '08:00', type: 'Medication', content: 'Paracetamol 500mg (Uống)', status: 'completed' },
    { id: 3, time: '09:00', type: 'Procedure', content: 'Thay băng vết mổ', status: 'pending' },
    { id: 4, time: '14:00', type: 'Vitals', content: 'Đo sinh hiệu chiều', status: 'pending' },
];

const NurseCareView: React.FC = () => {
    const { fontSettings } = useTheme();
    const [tasks, setTasks] = useState(mockTasks);

    const toggleTask = (id: number) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status: t.status === 'pending' ? 'completed' : 'pending' } : t));
    };

    return (
        <div className="flex flex-col h-full gap-4">
            
            {/* 1. Nhập Sinh hiệu nhanh */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2 uppercase text-sm">
                    <ActivityIcon className="w-5 h-5 text-red-500"/> Cập nhật Sinh hiệu
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div>
                        <label className="text-xs text-slate-500 block mb-1">Mạch (l/p)</label>
                        <input type="number" className="w-full p-2 border rounded bg-slate-50 text-center font-bold text-blue-600" placeholder="80" />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 block mb-1">Nhiệt độ (°C)</label>
                        <input type="number" className="w-full p-2 border rounded bg-slate-50 text-center font-bold text-red-600" placeholder="37" />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 block mb-1">Huyết áp (mmHg)</label>
                        <input type="text" className="w-full p-2 border rounded bg-slate-50 text-center font-bold text-purple-600" placeholder="120/80" />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 block mb-1">Nhịp thở (l/p)</label>
                        <input type="number" className="w-full p-2 border rounded bg-slate-50 text-center font-bold" placeholder="20" />
                    </div>
                    <div className="flex items-end">
                        <button className="w-full py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 shadow-sm">Lưu</button>
                    </div>
                </div>
            </div>

            {/* 2. Kế hoạch chăm sóc & Thực hiện y lệnh */}
            <div className="flex-1 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2 uppercase text-sm border-b pb-2 border-slate-100 dark:border-slate-700">
                    <ClockIcon className="w-5 h-5 text-orange-500"/> Kế hoạch chăm sóc trong ngày
                </h3>
                
                <div className="flex-1 overflow-y-auto space-y-3">
                    {tasks.map(task => (
                        <div 
                            key={task.id} 
                            onClick={() => toggleTask(task.id)}
                            className={`p-3 rounded-lg border flex items-center gap-4 cursor-pointer transition-all ${
                                task.status === 'completed' 
                                ? 'bg-green-50 border-green-200 opacity-70' 
                                : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-blue-300'
                            }`}
                        >
                            <div className="flex-shrink-0 w-12 text-center font-bold text-slate-500 text-sm">
                                {task.time}
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-slate-800 dark:text-slate-200">{task.content}</div>
                                <div className="text-xs text-slate-500 uppercase">{task.type}</div>
                            </div>
                            <div className="flex-shrink-0">
                                {task.status === 'completed' ? (
                                    <CheckCircleIcon className="w-6 h-6 text-green-600"/>
                                ) : (
                                    <div className="w-6 h-6 rounded-full border-2 border-slate-300"></div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default NurseCareView;
