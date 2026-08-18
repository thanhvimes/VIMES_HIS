import React from 'react';
import { X, Stethoscope, Zap } from 'lucide-react';

interface WorkflowSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  simStep: number;
  simLoading: boolean;
  simLog: string[];
  onRunAuto10Cases: () => void;
  onRunStep1: () => void;
  onRunStep2: () => void;
  onRunStep3: () => void;
  onRunStep4: () => void;
  onRunStep5: () => void;
}

export const WorkflowSimulatorModal: React.FC<WorkflowSimulatorModalProps> = ({
  isOpen,
  onClose,
  simStep,
  simLoading,
  simLog,
  onRunAuto10Cases,
  onRunStep1,
  onRunStep2,
  onRunStep3,
  onRunStep4,
  onRunStep5
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-3xl w-full max-w-4xl p-7 shadow-2xl space-y-6 border border-slate-200 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#1a3461] text-white flex items-center justify-center shadow-md border border-[#2a4a7f] shrink-0">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                ⚡ Kịch Bản Quy Trình Khép Kín 6 Bước (End-to-End Smart RIS Simulation)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mô phỏng chính xác luồng dữ liệu thực tế: Bác sĩ chỉ định ➔ Worklist MWL C-FIND ➔ Máy CT/MR C-STORE ➔ KTV ➔ BS Ký Số ➔ Cổng BN
              </p>
            </div>
          </div>

          <button
            onClick={onRunAuto10Cases}
            disabled={simLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0a5d87] hover:bg-[#08527a] text-white text-xs font-black border border-[#0c6e9e] shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Zap className="w-4 h-4" />
            <span>{simLoading ? 'Đang chạy 10 Ca...' : '▶ Tự Động Chạy 10 Ca Chụp Khép Kín'}</span>
          </button>
        </div>

        {/* Step Stepper Grid (Steps 1 to 6) */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {/* STEP 1 */}
          <div
            className={`p-4 rounded-2xl border transition space-y-2 ${
              simStep === 1
                ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/30'
                : simStep > 1
                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/40'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-purple-600 dark:text-purple-400">BƯỚC 1</span>
              {simStep > 1 && (
                <span className="text-[10px] bg-emerald-500 text-white font-bold px-1.5 py-0.5 rounded">OK</span>
              )}
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
              1. HIS Ra Chỉ Định (HL7 Ingestion)
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Tạo y lệnh ca chụp BN VÕ VĂN HOÀNG (CT Lồng Ngực) gửi sang Worklist.
            </p>
            {simStep === 1 && (
              <button
                onClick={onRunStep1}
                disabled={simLoading}
                className="w-full py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow cursor-pointer disabled:opacity-50"
              >
                {simLoading ? 'Đang gửi...' : '▶ Thao tác Bước 1'}
              </button>
            )}
          </div>

          {/* STEP 2 */}
          <div
            className={`p-4 rounded-2xl border transition space-y-2 ${
              simStep === 2
                ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/30'
                : simStep > 2
                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/40'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-purple-600 dark:text-purple-400">BƯỚC 2</span>
              {simStep > 2 && (
                <span className="text-[10px] bg-emerald-500 text-white font-bold px-1.5 py-0.5 rounded">OK</span>
              )}
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
              2. KTV Tiếp Nhận &amp; DICOM C-FIND
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Máy CT gửi C-FIND SCU nạp dữ liệu. Đổi trạng thái: <strong>ĐANG CHỤP</strong>.
            </p>
            {simStep === 2 && (
              <button
                onClick={onRunStep2}
                disabled={simLoading}
                className="w-full py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow cursor-pointer disabled:opacity-50"
              >
                {simLoading ? 'Đang xử lý...' : '▶ Thao tác Bước 2'}
              </button>
            )}
          </div>

          {/* STEP 3 */}
          <div
            className={`p-4 rounded-2xl border transition space-y-2 ${
              simStep === 3
                ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/30'
                : simStep > 3
                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/40'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-purple-600 dark:text-purple-400">BƯỚC 3</span>
              {simStep > 3 && (
                <span className="text-[10px] bg-emerald-500 text-white font-bold px-1.5 py-0.5 rounded">OK</span>
              )}
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
              3. Chụp &amp; Bắn Ảnh C-STORE PACS
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Máy CT bắn 128 phim DICOM về PACS Server. Đổi trạng thái: <strong>ĐÃ CHỤP</strong>.
            </p>
            {simStep === 3 && (
              <button
                onClick={onRunStep3}
                disabled={simLoading}
                className="w-full py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow cursor-pointer disabled:opacity-50"
              >
                {simLoading ? 'Đang bắn ảnh...' : '▶ Thao tác Bước 3'}
              </button>
            )}
          </div>

          {/* STEP 4 */}
          <div
            className={`p-4 rounded-2xl border transition space-y-2 ${
              simStep === 4
                ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/30'
                : simStep > 4
                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/40'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-purple-600 dark:text-purple-400">BƯỚC 4</span>
              {simStep > 4 && (
                <span className="text-[10px] bg-emerald-500 text-white font-bold px-1.5 py-0.5 rounded">OK</span>
              )}
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
              4. KTV Kiểm Tra Chất Lượng Ảnh
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Duyệt chất lượng ảnh phim (Image Quality Approved).
            </p>
            {simStep === 4 && (
              <button
                onClick={onRunStep4}
                className="w-full py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow cursor-pointer"
              >
                ▶ Thao tác Bước 4
              </button>
            )}
          </div>

          {/* STEP 5 */}
          <div
            className={`p-4 rounded-2xl border transition space-y-2 ${
              simStep === 5
                ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/30'
                : simStep > 5
                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/40'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-purple-600 dark:text-purple-400">BƯỚC 5</span>
              {simStep > 5 && (
                <span className="text-[10px] bg-emerald-500 text-white font-bold px-1.5 py-0.5 rounded">OK</span>
              )}
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
              5. BS CĐHA Đọc Phim &amp; Ký Số
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Bác sĩ đọc phim trên Workstation, ký số y tế &amp; đẩy về HIS.
            </p>
            {simStep === 5 && (
              <button
                onClick={onRunStep5}
                className="w-full py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow cursor-pointer"
              >
                ▶ Thao tác Bước 5
              </button>
            )}
          </div>

          {/* STEP 6 */}
          <div
            className={`p-4 rounded-2xl border transition space-y-2 ${
              simStep === 6
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">BƯỚC 6</span>
              {simStep === 6 && (
                <span className="text-[10px] bg-emerald-500 text-white font-bold px-1.5 py-0.5 rounded">HOÀN TẤT</span>
              )}
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
              6. Sinh Mã QR Cổng Bệnh Nhân KTS
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Bệnh nhân quét QR trên Smartphone để xem Phim 3D + Kết quả A4.
            </p>
          </div>
        </div>

        {/* Execution Log Box */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            Nhật Ký Thực Thi Dữ Liệu Thời Gian Thực:
          </span>
          <div className="space-y-1 max-h-40 overflow-y-auto text-xs font-mono text-emerald-400">
            {simLog.length > 0 ? (
              simLog.map((log, idx) => <div key={idx}>{log}</div>)
            ) : (
              <div className="text-slate-500 italic text-[11px]">Nhấn "▶ Thao tác Bước 1" để bắt đầu kịch bản...</div>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500">Đạt chuẩn kết nối HIS/RIS/PACS HL7 Gateway &amp; DICOM 3.0</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            Đóng Cửa Sổ
          </button>
        </div>
      </div>
    </div>
  );
};
