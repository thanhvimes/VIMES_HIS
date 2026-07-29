import React, { useState, useEffect, useRef } from 'react';

interface BatchReceivingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onReceiveBatch: (rackId: string) => void;
}

export const BatchReceivingModal: React.FC<BatchReceivingModalProps> = ({ isOpen, onClose, onReceiveBatch }) => {
    const [rackId, setRackId] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus input when modal opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setRackId('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    const handleSubmit = () => {
        if (!rackId.trim()) return;
        onReceiveBatch(rackId.trim());
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden scale-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-blue-600 px-4 py-3 flex items-center justify-between text-white">
                    <h3 className="font-bold text-sm uppercase flex items-center gap-2">
                        <span>📦</span> NHẬN MẪU THEO LÔ (RACK)
                    </h3>
                    <button onClick={onClose} className="text-blue-100 hover:text-white transition active:scale-95 text-lg">
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 text-sm text-slate-700 dark:text-slate-300">
                    <p className="mb-4 text-xs text-slate-500">
                        Quét mã vạch của Khay (Rack / Carrier) để tự động nhận tất cả các ống mẫu đang có mặt trên Khay đó.
                    </p>

                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Mã Khay (Rack ID)</label>
                        <div className="relative">
                            <input 
                                ref={inputRef}
                                type="text"
                                value={rackId}
                                onChange={(e) => setRackId(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="⚡ Quét mã vạch khay..."
                                className="w-full pl-9 pr-3 py-3 bg-slate-50 dark:bg-slate-800 border border-blue-300 dark:border-blue-600 rounded-lg text-slate-900 dark:text-white font-mono font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">📷</span>
                        </div>
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
                        disabled={!rackId.trim()}
                        className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition active:scale-95 flex items-center gap-2"
                    >
                        <span>✓</span> Xác nhận Nhận lô
                    </button>
                </div>
            </div>
        </div>
    );
};
