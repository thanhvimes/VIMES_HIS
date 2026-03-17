
import React, { useState } from 'react';
import { XIcon, SaveIcon, UserGroupIcon, ClockIcon, ScissorsIcon, ActivityIcon } from '../../../components/Icons';
import { FormDateInput } from '../../../components/shared/forms';
import { SurgerySchedule, SurgeryResource } from '../../../types';

interface SurgeryScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (schedule: Omit<SurgerySchedule, 'id' | 'status'>) => void;
    resources: SurgeryResource[];
}

const SurgeryScheduleModal: React.FC<SurgeryScheduleModalProps> = ({ isOpen, onClose, onSave, resources }) => {
    const [formData, setFormData] = useState({
        patientName: '',
        patientId: '',
        procedureName: '',
        surgeonName: '',
        roomId: resources[0]?.id || '',
        date: new Date().toISOString().slice(0, 10),
        startTime: '08:00',
        endTime: '10:00',
        type: 'PT' // Default to Phẫu thuật
    });

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            patientName: formData.patientName,
            patientId: formData.patientId || `P${Math.floor(Math.random() * 1000)}`,
            procedureName: formData.procedureName,
            surgeonName: formData.surgeonName,
            roomId: formData.roomId,
            date: formData.date,
            startTime: formData.startTime,
            endTime: formData.endTime,
            notes: formData.type === 'PT' ? 'Phẫu thuật' : 'Thủ thuật'
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg">
                            <ScissorsIcon className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Đặt lịch Phẫu thuật</h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">

                    {/* Type Selector */}
                    <div className="flex gap-4 mb-4">
                        <label className={`flex-1 cursor-pointer border p-3 rounded-lg flex items-center gap-3 transition-all ${formData.type === 'PT' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500 ring-1 ring-blue-500' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                            <input type="radio" name="type" value="PT" checked={formData.type === 'PT'} onChange={handleChange} className="hidden" />
                            <div className={`p-2 rounded-full ${formData.type === 'PT' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                <ScissorsIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="block font-bold text-slate-800 dark:text-white">Phẫu thuật (PT)</span>
                                <span className="text-xs text-slate-500">Các ca mổ tại phòng OR</span>
                            </div>
                        </label>
                        <label className={`flex-1 cursor-pointer border p-3 rounded-lg flex items-center gap-3 transition-all ${formData.type === 'TT' ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 dark:border-teal-500 ring-1 ring-teal-500' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                            <input type="radio" name="type" value="TT" checked={formData.type === 'TT'} onChange={handleChange} className="hidden" />
                            <div className={`p-2 rounded-full ${formData.type === 'TT' ? 'bg-teal-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                <ActivityIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="block font-bold text-slate-800 dark:text-white">Thủ thuật (TT)</span>
                                <span className="text-xs text-slate-500">Tiểu phẫu, can thiệp nhẹ</span>
                            </div>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Tên phẫu thuật / Thủ thuật</label>
                            <input
                                type="text"
                                name="procedureName"
                                value={formData.procedureName}
                                onChange={handleChange}
                                required
                                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500"
                                placeholder="Nhập tên dịch vụ..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Bệnh nhân</label>
                            <input
                                type="text"
                                name="patientName"
                                value={formData.patientName}
                                onChange={handleChange}
                                required
                                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500"
                                placeholder="Họ tên bệnh nhân"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Mã BN (Nếu có)</label>
                            <input
                                type="text"
                                name="patientId"
                                value={formData.patientId}
                                onChange={handleChange}
                                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500"
                                placeholder="P..."
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Bác sĩ phẫu thuật</label>
                            <div className="relative">
                                <UserGroupIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    name="surgeonName"
                                    value={formData.surgeonName}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500"
                                    placeholder="Chọn hoặc nhập tên bác sĩ..."
                                />
                            </div>
                        </div>

                        <div className="col-span-2 border-t border-slate-100 dark:border-slate-700 my-2"></div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Phòng thực hiện</label>
                            <select
                                name="roomId"
                                value={formData.roomId}
                                onChange={handleChange}
                                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500"
                            >
                                {resources.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </div>
                        <FormDateInput
                            label="Ngày thực hiện"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            className="bg-white dark:bg-slate-700"
                            labelClassName="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1"
                        />
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Bắt đầu</label>
                            <input
                                type="time"
                                name="startTime"
                                value={formData.startTime}
                                onChange={handleChange}
                                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Kết thúc (Dự kiến)</label>
                            <input
                                type="time"
                                name="endTime"
                                value={formData.endTime}
                                onChange={handleChange}
                                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-lg font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg flex items-center gap-2 transition-transform active:scale-95"
                    >
                        <SaveIcon className="w-5 h-5" />
                        Lưu lịch mổ
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SurgeryScheduleModal;
