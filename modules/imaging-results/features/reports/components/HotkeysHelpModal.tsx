import React from 'react';
import { HelpCircle, X } from 'lucide-react';

interface HotkeysHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HotkeysHelpModal: React.FC<HotkeysHelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0a162b] border border-slate-200 dark:border-[#1b3762] text-slate-900 dark:text-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h3 className="text-base font-black flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-sky-500" />
            <span>Bảng Phím Tắt Thao Tác Nhanh (Radiology Hotkeys)</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#060e1d] flex items-center justify-between">
            <span className="font-medium text-slate-700 dark:text-slate-300">Đọc giọng nói AI</span>
            <kbd className="px-2 py-0.5 rounded bg-sky-600 text-white font-mono font-bold">F2</kbd>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#060e1d] flex items-center justify-between">
            <span className="font-medium text-slate-700 dark:text-slate-300">Chụp / Nạp ảnh từ máy</span>
            <kbd className="px-2 py-0.5 rounded bg-amber-600 text-white font-mono font-bold">F3</kbd>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#060e1d] flex items-center justify-between">
            <span className="font-medium text-slate-700 dark:text-slate-300">Mẫu Chuẩn Bình Thường</span>
            <kbd className="px-2 py-0.5 rounded bg-teal-600 text-white font-mono font-bold">F4</kbd>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#060e1d] flex items-center justify-between">
            <span className="font-medium text-slate-700 dark:text-slate-300">Ẩn/Hiện Mini PACS</span>
            <kbd className="px-2 py-0.5 rounded bg-indigo-600 text-white font-mono font-bold">F6</kbd>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#060e1d] flex items-center justify-between">
            <span className="font-medium text-slate-700 dark:text-slate-300">Ca bệnh trước</span>
            <kbd className="px-2 py-0.5 rounded bg-slate-700 text-white font-mono font-bold">F7</kbd>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#060e1d] flex items-center justify-between">
            <span className="font-medium text-slate-700 dark:text-slate-300">Ca bệnh tiếp theo</span>
            <kbd className="px-2 py-0.5 rounded bg-slate-700 text-white font-mono font-bold">F8</kbd>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#060e1d] flex items-center justify-between">
            <span className="font-bold text-emerald-700 dark:text-emerald-300">Duyệt &amp; Ký</span>
            <kbd className="px-2 py-0.5 rounded bg-emerald-600 text-white font-mono font-bold">F9</kbd>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#060e1d] flex items-center justify-between">
            <span className="font-medium text-slate-700 dark:text-slate-300">Lưu nháp</span>
            <kbd className="px-2 py-0.5 rounded bg-slate-700 text-white font-mono font-bold">Ctrl + S</kbd>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#060e1d] flex items-center justify-between">
            <span className="font-medium text-slate-700 dark:text-slate-300">In phiếu kết quả</span>
            <kbd className="px-2 py-0.5 rounded bg-slate-700 text-white font-mono font-bold">Ctrl + P</kbd>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-sky-50 dark:bg-[#091830] border border-sky-200 dark:border-sky-500/30 text-xs text-sky-900 dark:text-sky-200 space-y-1">
          <span className="font-bold block">💡 Gõ tắt Macro trong ô văn bản:</span>
          <p className="font-mono text-[11px]">
            <b className="text-sky-700 dark:text-sky-300">.bt</b> (Bình thường) · <b className="text-sky-700 dark:text-sky-300">.soi</b> (Sỏi thận/mật) · <b className="text-sky-700 dark:text-sky-300">.ruotthua</b> (Viêm ruột thừa) · <b className="text-sky-700 dark:text-sky-300">.khongdich</b> (Không có dịch)
          </p>
        </div>

        <div className="text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#0078D4] text-white text-xs font-bold shadow-md cursor-pointer hover:bg-sky-600 transition"
          >
            Đã Hiểu
          </button>
        </div>
      </div>
    </div>
  );
};
