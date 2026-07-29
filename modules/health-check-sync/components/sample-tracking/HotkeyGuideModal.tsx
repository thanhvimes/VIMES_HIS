import React from 'react';

interface HotkeyGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SHORTCUTS = [
    { key: 'Enter (tại Barcode input)', desc: 'Quét nhanh mã vạch mẫu & tự động nhảy tới bệnh nhân' },
    { key: 'F2', desc: 'Mở cửa sổ Nhận mẫu theo Khay (Rack Receiving)' },
    { key: 'F4  hoặc  Ctrl + Enter', desc: 'Xác nhận Nhận các mẫu/bệnh nhân đang chọn' },
    { key: 'F8  hoặc  Alt + R', desc: 'Từ chối mẫu xét nghiệm (Sample Rejection)' },
    { key: 'F5', desc: 'Tải lại danh sách dữ liệu phiếu' },
    { key: 'Esc', desc: 'Quay lại Danh sách phiếu (hoặc đóng cửa sổ hiện tại)' },
    { key: 'Shift + ?', desc: 'Bật / Tắt bảng phím tắt này' },
];

export const HotkeyGuideModal: React.FC<HotkeyGuideModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden scale-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-indigo-600 px-4 py-3 flex items-center justify-between text-white">
                    <h3 className="font-bold text-sm uppercase flex items-center gap-2">
                        <span>⌨️</span> PHÍM TẮT THAO TÁC NHANH (LIMS HOTKEYS)
                    </h3>
                    <button onClick={onClose} className="text-indigo-100 hover:text-white transition active:scale-95 text-lg cursor-pointer">
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 text-xs text-slate-700 dark:text-slate-300">
                    <p className="mb-4 text-slate-500">
                        Hệ thống hỗ trợ thao tác hoàn toàn bằng bàn phím để giúp KTV phòng Lab xử lý mẫu công suất cao không cần dùng chuột.
                    </p>

                    <div className="space-y-2">
                        {SHORTCUTS.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                                <span className="text-slate-600 dark:text-slate-300 font-medium">{item.desc}</span>
                                <kbd className="px-2.5 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md font-mono font-bold text-indigo-600 dark:text-indigo-400 text-[11px] shadow-2xs whitespace-nowrap">
                                    {item.key}
                                </kbd>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition active:scale-95 cursor-pointer shadow-sm"
                    >
                        Đã hiểu (Esc)
                    </button>
                </div>
            </div>
        </div>
    );
};
