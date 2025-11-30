
import React, { useState } from 'react';
import { mockCandidates, Candidate } from '../data';
import { UserAddIcon } from '../icons';
import { PlusIcon, SearchIcon, ClockIcon } from '../../../components/Icons';

const COLUMNS = [
    { id: 'New', title: 'Ứng viên mới', color: 'border-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { id: 'Screening', title: 'Sàng lọc', color: 'border-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { id: 'Interview', title: 'Phỏng vấn', color: 'border-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { id: 'Offer', title: 'Đề nghị (Offer)', color: 'border-teal-500', bg: 'bg-teal-50 dark:bg-teal-900/20' },
    { id: 'Hired', title: 'Đã tuyển', color: 'border-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
];

const RecruitmentView: React.FC = () => {
    const [candidates, setCandidates] = useState<Candidate[]>(mockCandidates);
    const [draggedId, setDraggedId] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedId(id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, status: Candidate['status']) => {
        e.preventDefault();
        if (draggedId) {
            setCandidates(prev => prev.map(c => c.id === draggedId ? { ...c, status } : c));
            setDraggedId(null);
        }
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <UserAddIcon className="w-8 h-8 text-rose-600"/> Quản lý Tuyển dụng
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Theo dõi quy trình tuyển dụng nhân sự mới.</p>
                </div>
                <button className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow flex items-center gap-2">
                    <PlusIcon className="w-5 h-5"/> Thêm ứng viên
                </button>
            </div>

            <div className="flex-1 overflow-x-auto pb-4">
                <div className="flex gap-4 h-full min-w-[1200px]">
                    {COLUMNS.map(col => (
                        <div 
                            key={col.id}
                            className={`flex-1 flex flex-col rounded-xl border-t-4 ${col.color} bg-slate-50 dark:bg-slate-900/50 shadow-sm min-w-[240px]`}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, col.id as any)}
                        >
                            <div className="p-3 font-bold text-slate-700 dark:text-slate-200 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                                <span>{col.title}</span>
                                <span className="bg-white dark:bg-slate-700 text-xs px-2 py-0.5 rounded-full shadow-sm border border-slate-200 dark:border-slate-600">
                                    {candidates.filter(c => c.status === col.id).length}
                                </span>
                            </div>
                            <div className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar">
                                {candidates.filter(c => c.status === col.id).map(cand => (
                                    <div 
                                        key={cand.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, cand.id)}
                                        className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 cursor-move hover:shadow-md transition-all group"
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <img src={cand.avatar} alt="" className="w-8 h-8 rounded-full bg-slate-200"/>
                                            <div>
                                                <h4 className="font-bold text-sm text-slate-800 dark:text-white line-clamp-1">{cand.name}</h4>
                                                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{cand.position}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mt-2 border-t border-slate-100 dark:border-slate-700 pt-2">
                                            <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{cand.experience}</span>
                                            <span className="flex items-center gap-1"><ClockIcon className="w-3 h-3"/> {cand.appliedDate}</span>
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

export default RecruitmentView;
