import React from 'react';
import { X, Keyboard } from 'lucide-react';

export interface HotkeysModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HotkeysModal: React.FC<HotkeysModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-blue-400" />
            Danh Sách Phím Tắt Nhanh Cho Bác Sĩ
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-slate-300">Công Cụ Sáng/Tối (W/L)</span>
            <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-amber-400">W</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-slate-300">Công Cụ Thu Phóng (Zoom)</span>
            <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-blue-400">Z</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-slate-300">Công Cụ Di Chuyển (Pan)</span>
            <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400">P / Space</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-slate-300">Thước Đo Khoảng Cách</span>
            <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-purple-400">M</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-slate-300">Vùng ROI (Diện Tích/HU)</span>
            <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-pink-400">O</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-slate-300">Đặt Lại Khung Nhìn (Reset)</span>
            <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-rose-400">R</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-slate-300">Xóa Đo Đạc Đang Chọn</span>
            <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-rose-400">Delete</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-slate-300">Đảo Âm/Dương Bản</span>
            <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400">I</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-slate-300">Chuyển Lát Cắt</span>
            <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-blue-400">↑ / ↓ / Cuộn</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-slate-300">Toàn Màn Hình</span>
            <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-teal-400">F / Esc</span>
          </div>
        </div>

        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            Đã Hiểu
          </button>
        </div>
      </div>
    </div>
  );
};
