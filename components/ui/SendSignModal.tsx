import React, { useState, useEffect } from 'react';
import { XIcon, CheckCircleIcon, PaperAirplaneIcon, BuildingOfficeIcon } from '../Icons';

interface SendSignModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (data: any) => void;
}

const SendSignModal: React.FC<SendSignModalProps> = ({ isOpen, onClose, onSend }) => {
    const [isShowing, setIsShowing] = useState(false);
    const [department, setDepartment] = useState('Nội 2');
    const [role, setRole] = useState('Trưởng/phó khoa');
    const [name, setName] = useState('Đỗ Thị Lan Hương');
    const [note, setNote] = useState('');

    useEffect(() => {
        setIsShowing(isOpen);
    }, [isOpen]);

    const handleClose = () => {
        setIsShowing(false);
        setTimeout(onClose, 300);
    };

    const handleSend = () => {
        onSend({ department, role, name, note });
        handleClose();
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 bg-black/50 z-[2200] flex items-center justify-center p-4 transition-opacity duration-300 ${isShowing ? 'opacity-100' : 'opacity-0'}`}>
            <div
                className={`bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden transform transition-all duration-300 ${isShowing ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-blue-50/50 border-b border-blue-100 px-4 py-3 flex justify-between items-center">
                    <h3 className="font-bold text-blue-800 flex items-center gap-2">
                        <PaperAirplaneIcon className="w-5 h-5" />
                        Gửi ký tiếp
                    </h3>
                    <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 p-1">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 space-y-4">
                    {/* Form Fields */}
                    <div className="grid grid-cols-[100px_1fr] gap-y-3 gap-x-4 items-center">
                        <label className="text-sm font-semibold text-slate-700">Khoa</label>
                        <select
                            className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                        >
                            <option value="Nội 2">Khoa Nội Lồng ngực (Nội 2)</option>
                            <option value="Nội 1">Khoa Nội Tổng hợp (Nội 1)</option>
                            <option value="Ngoại">Khoa Ngoại</option>
                        </select>

                        <label className="text-sm font-semibold text-slate-700">Send To</label>
                        <select
                            className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >
                            <option value="Trưởng/phó khoa">Trưởng/phó khoa</option>
                            <option value="Bác sĩ điều trị">Bác sĩ điều trị</option>
                            <option value="Thư ký khoa">Thư ký khoa</option>
                        </select>

                        <label className="text-sm font-semibold text-slate-700">Tên</label>
                        <select
                            className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        >
                            <option value="Đỗ Thị Lan Hương">Đỗ Thị Lan Hương</option>
                            <option value="Nguyễn Văn A">Nguyễn Văn A</option>
                            <option value="Trần Thị B">Trần Thị B</option>
                        </select>

                        <label className="text-sm font-semibold text-slate-700 self-start pt-1.5">Ghi chú</label>
                        <textarea
                            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none h-16 resize-none"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>

                    {/* History Table */}
                    <div className="border border-slate-200 rounded overflow-hidden">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="px-3 py-2 border-r border-slate-200 w-24">Ngày gửi</th>
                                    <th className="px-3 py-2 border-r border-slate-200">Người gửi</th>
                                    <th className="px-3 py-2 border-r border-slate-200">Tới khoa</th>
                                    <th className="px-3 py-2 border-r border-slate-200">Tới chức</th>
                                    <th className="px-3 py-2">Tới user</th>
                                </tr>
                            </thead>
                            <tbody className="bg-slate-50/50">
                                {/* Empty row to match design height */}
                                {[1, 2, 3, 4].map(i => (
                                    <tr key={i} className="border-b border-slate-100 last:border-0 h-8">
                                        <td className="border-r border-slate-100"></td>
                                        <td className="border-r border-slate-100"></td>
                                        <td className="border-r border-slate-100"></td>
                                        <td className="border-r border-slate-100"></td>
                                        <td></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex justify-end gap-2">
                    <button
                        onClick={handleSend}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded shadow-sm transition-colors flex items-center gap-1"
                    >
                        <CheckCircleIcon className="w-4 h-4" />
                        Chấp nhận
                    </button>
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded shadow-sm transition-colors flex items-center gap-1"
                    >
                        <XIcon className="w-4 h-4" />
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SendSignModal;
