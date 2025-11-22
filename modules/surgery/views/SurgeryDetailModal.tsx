
import React, { useState } from 'react';
import { XIcon, ClipboardCheckIcon, CubeIcon, UserGroupIcon } from '../../../components/Icons';
import { SurgerySchedule } from '../../../types';
import SafetyChecklistModal from './components/SafetyChecklistModal';
import ConsumableInput from './components/ConsumableInput';

interface SurgeryDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    schedule: SurgerySchedule;
}

const SurgeryDetailModal: React.FC<SurgeryDetailModalProps> = ({ isOpen, onClose, schedule }) => {
    const [activeTab, setActiveTab] = useState<'info' | 'checklist' | 'consumables'>('info');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-4xl h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Chi tiết ca mổ</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {schedule.patientName} ({schedule.patientId}) - {schedule.procedureName}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition">
                        <XIcon className="w-6 h-6"/>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-700">
                    <button 
                        onClick={() => setActiveTab('info')}
                        className={`flex-1 py-3 font-bold text-sm flex items-center justify-center gap-2 transition ${activeTab === 'info' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-slate-800' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                        <UserGroupIcon className="w-4 h-4"/> Thông tin chung
                    </button>
                    <button 
                        onClick={() => setActiveTab('checklist')}
                        className={`flex-1 py-3 font-bold text-sm flex items-center justify-center gap-2 transition ${activeTab === 'checklist' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-slate-800' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                        <ClipboardCheckIcon className="w-4 h-4"/> Bảng kiểm an toàn
                    </button>
                    <button 
                        onClick={() => setActiveTab('consumables')}
                        className={`flex-1 py-3 font-bold text-sm flex items-center justify-center gap-2 transition ${activeTab === 'consumables' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-slate-800' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                        <CubeIcon className="w-4 h-4"/> Vật tư tiêu hao
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6 bg-white dark:bg-slate-900">
                    {activeTab === 'info' && (
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bác sĩ phẫu thuật</label>
                                    <p className="text-base font-medium text-slate-800 dark:text-slate-200 p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">{schedule.surgeonName}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phòng mổ</label>
                                    <p className="text-base font-medium text-slate-800 dark:text-slate-200 p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">{schedule.roomId}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Thời gian dự kiến</label>
                                    <p className="text-base font-medium text-slate-800 dark:text-slate-200 p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">{schedule.startTime} - {schedule.endTime}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ghi chú</label>
                                    <textarea 
                                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200" 
                                        rows={5}
                                        defaultValue={schedule.notes || "Chuẩn bị máu dự trù..."}
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'checklist' && (
                        <SafetyChecklistModal />
                    )}

                    {activeTab === 'consumables' && (
                        <ConsumableInput />
                    )}
                </div>
            </div>
        </div>
    );
};

export default SurgeryDetailModal;
