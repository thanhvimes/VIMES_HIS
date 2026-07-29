import React, { useState } from 'react';

interface SampleRejectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onReject: (reason: string, notes: string) => void;
    patientName: string;
    sampleId: string | number;
}

const REJECTION_REASONS = [
    { code: 'HEMOLYSIS', label: 'Mẫu vỡ hồng cầu / Tan máu (Hemolysis)' },
    { code: 'CLOTTED', label: 'Mẫu đông máu (Clotted)' },
    { code: 'INSUFFICIENT', label: 'Thiếu thể tích (Insufficient Volume)' },
    { code: 'BROKEN', label: 'Vỡ ống / Rò rỉ (Broken/Leaked tube)' },
    { code: 'WRONG_TUBE', label: 'Sai ống đựng / Sai chất chống đông' },
    { code: 'UNLABELED', label: 'Không có nhãn mã vạch (Unlabeled)' },
    { code: 'OTHER', label: 'Lý do khác...' }
];

export const SampleRejectionModal: React.FC<SampleRejectionModalProps> = ({ isOpen, onClose, onReject, patientName, sampleId }) => {
    const [selectedReason, setSelectedReason] = useState<string>('');
    const [notes, setNotes] = useState<string>('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!selectedReason) return;
        onReject(selectedReason, notes);
        // Reset state
        setSelectedReason('');
        setNotes('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden scale-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-rose-600 px-4 py-3 flex items-center justify-between text-white">
                    <h3 className="font-bold text-sm uppercase flex items-center gap-2">
                        <span>⚠️</span> TỪ CHỐI MẪU XÉT NGHIỆM
                    </h3>
                    <button onClick={onClose} className="text-rose-100 hover:text-white transition active:scale-95 text-lg">
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 text-sm text-slate-700 dark:text-slate-300 space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex gap-2">
                            <span className="text-slate-500">Mã vạch:</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{sampleId}</span>
                        </div>
                        <div className="flex gap-2 mt-1">
                            <span className="text-slate-500">Bệnh nhân:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{patientName}</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Lý do từ chối (Mã chuẩn)</label>
                        <select 
                            value={selectedReason}
                            onChange={(e) => setSelectedReason(e.target.value)}
                            className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                        >
                            <option value="">-- Chọn lý do từ chối mẫu --</option>
                            {REJECTION_REASONS.map(reason => (
                                <option key={reason.code} value={reason.code}>{reason.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Ghi chú thêm (Tùy chọn)</label>
                        <textarea 
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            placeholder="Nhập ghi chú hoặc yêu cầu lấy lại mẫu..."
                            className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 custom-scrollbar"
                        ></textarea>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                    >
                        Hủy
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={!selectedReason}
                        className="px-4 py-2 text-sm font-bold text-white bg-rose-600 rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition active:scale-95"
                    >
                        ✕ Xác nhận Từ chối
                    </button>
                </div>
            </div>
        </div>
    );
};
