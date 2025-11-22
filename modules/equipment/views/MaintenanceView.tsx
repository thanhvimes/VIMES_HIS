
import React, { useState } from 'react';
import { mockMaintenanceTasks } from '../data';
import { CheckIcon, ClockIcon, ExclamationCircleIcon, WrenchIcon, CheckBadgeIcon } from '../../../components/Icons';

const MaintenanceView: React.FC = () => {
    const [tasks, setTasks] = useState(mockMaintenanceTasks);

    const getTypeIcon = (type: string) => {
        switch(type) {
            case 'Preventive': return <ClockIcon className="w-5 h-5 text-blue-500"/>;
            case 'Corrective': return <WrenchIcon className="w-5 h-5 text-red-500"/>;
            case 'Calibration': return <CheckBadgeIcon className="w-5 h-5 text-purple-500"/>;
            default: return <WrenchIcon className="w-5 h-5"/>;
        }
    };

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'Completed': return 'border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-900/10';
            case 'In Progress': return 'border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10';
            case 'Scheduled': return 'border-l-4 border-l-slate-300 bg-white dark:bg-slate-800';
            default: return 'bg-white';
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Bảo trì & Sửa chữa</h1>
                    <p className="text-slate-500 text-sm">Quản lý phiếu yêu cầu sửa chữa, lịch bảo dưỡng định kỳ.</p>
                </div>
                <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow flex items-center gap-2">
                    <ExclamationCircleIcon className="w-5 h-5"/> Báo hỏng (Ticket)
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-hidden">
                {/* Column: Scheduled / Pending */}
                <div className="flex flex-col bg-slate-100 dark:bg-slate-900 rounded-xl p-4 overflow-hidden">
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                        <ClockIcon className="w-5 h-5"/> Sắp tới / Chờ xử lý
                        <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">{tasks.filter(t => t.status === 'Scheduled').length}</span>
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                        {tasks.filter(t => t.status === 'Scheduled').map(task => (
                            <div key={task.id} className={`p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 ${getStatusColor(task.status)}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold uppercase text-slate-500">{task.type}</span>
                                    {getTypeIcon(task.type)}
                                </div>
                                <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">{task.equipmentName}</h4>
                                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">{task.description}</p>
                                <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100 dark:border-slate-700">
                                    <span className="text-slate-500">{task.scheduledDate}</span>
                                    <span className="font-medium text-blue-600">{task.assignedTo}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Column: In Progress */}
                <div className="flex flex-col bg-slate-100 dark:bg-slate-900 rounded-xl p-4 overflow-hidden">
                    <h3 className="font-bold text-blue-700 dark:text-blue-400 mb-3 flex items-center gap-2">
                        <WrenchIcon className="w-5 h-5"/> Đang thực hiện
                        <span className="bg-blue-200 text-blue-700 text-xs px-2 py-0.5 rounded-full">{tasks.filter(t => t.status === 'In Progress').length}</span>
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                        {tasks.filter(t => t.status === 'In Progress').map(task => (
                            <div key={task.id} className={`p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 ${getStatusColor(task.status)}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold uppercase text-slate-500">{task.type}</span>
                                    {getTypeIcon(task.type)}
                                </div>
                                <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">{task.equipmentName}</h4>
                                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">{task.description}</p>
                                <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100 dark:border-slate-700">
                                    <span className="text-slate-500">{task.scheduledDate}</span>
                                    <button className="px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition font-bold">
                                        Hoàn thành
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Column: Completed */}
                <div className="flex flex-col bg-slate-100 dark:bg-slate-900 rounded-xl p-4 overflow-hidden">
                    <h3 className="font-bold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
                        <CheckIcon className="w-5 h-5"/> Hoàn thành (Gần đây)
                        <span className="bg-green-200 text-green-700 text-xs px-2 py-0.5 rounded-full">{tasks.filter(t => t.status === 'Completed').length}</span>
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                        {tasks.filter(t => t.status === 'Completed').map(task => (
                            <div key={task.id} className={`p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 ${getStatusColor(task.status)} opacity-80 hover:opacity-100 transition`}>
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold uppercase text-slate-500">{task.type}</span>
                                    {getTypeIcon(task.type)}
                                </div>
                                <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1 line-through text-slate-500">{task.equipmentName}</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mb-2">{task.description}</p>
                                <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100 dark:border-slate-700">
                                    <span className="text-slate-400">Xong: {task.completionDate}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceView;
