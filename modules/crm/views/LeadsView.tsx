
import React, { useState } from 'react';
import { mockLeads, Lead } from '../data';
import { SearchIcon, PlusIcon, PhoneIcon, UserGroupIcon, ClockIcon } from '../../../components/Icons';

const COLUMN_CONFIG = [
    { id: 'new', title: 'Mới đăng ký', color: 'border-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { id: 'contacted', title: 'Đã liên hệ', color: 'border-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { id: 'booked', title: 'Đã đặt lịch', color: 'border-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { id: 'converted', title: 'Đã khám (Thành công)', color: 'border-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
    { id: 'lost', title: 'Thất bại / Hủy', color: 'border-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' },
];

const LeadsView: React.FC = () => {
    const [leads, setLeads] = useState<Lead[]>(mockLeads);
    const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedLeadId(id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, status: Lead['status']) => {
        e.preventDefault();
        if (draggedLeadId) {
            setLeads(prev => prev.map(l => l.id === draggedLeadId ? { ...l, status } : l));
            setDraggedLeadId(null);
        }
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <UserGroupIcon className="w-8 h-8 text-indigo-600"/> Quản lý Tiềm năng (Leads)
                </h1>
                <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow flex items-center gap-2">
                    <PlusIcon className="w-5 h-5"/> Thêm Lead
                </button>
            </div>

            <div className="flex-1 overflow-x-auto pb-4">
                <div className="flex gap-4 h-full min-w-[1200px]">
                    {COLUMN_CONFIG.map(col => (
                        <div 
                            key={col.id}
                            className={`flex-1 flex flex-col rounded-xl border-t-4 ${col.color} bg-slate-50 dark:bg-slate-900/50 shadow-sm min-w-[280px]`}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, col.id as any)}
                        >
                            <div className="p-3 font-bold text-slate-700 dark:text-slate-200 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                                <span>{col.title}</span>
                                <span className="bg-white dark:bg-slate-700 text-xs px-2 py-0.5 rounded-full shadow-sm">
                                    {leads.filter(l => l.status === col.id).length}
                                </span>
                            </div>
                            <div className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar">
                                {leads.filter(l => l.status === col.id).map(lead => (
                                    <div 
                                        key={lead.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, lead.id)}
                                        className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow border border-slate-200 dark:border-slate-700 cursor-move hover:shadow-md transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-slate-800 dark:text-white">{lead.name}</h4>
                                            <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 rounded text-slate-500">{lead.source}</span>
                                        </div>
                                        <div className="text-sm text-indigo-600 dark:text-indigo-400 font-medium mb-1">{lead.interest}</div>
                                        <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                                            <PhoneIcon className="w-3 h-3"/> {lead.phone}
                                        </div>
                                        <div className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded border border-slate-100 dark:border-slate-800">
                                            "{lead.notes}"
                                        </div>
                                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-[10px] text-slate-400">
                                            <span className="flex items-center gap-1"><ClockIcon className="w-3 h-3"/> {lead.lastAction}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LeadsView;
