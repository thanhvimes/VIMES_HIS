import React, { useState } from 'react';
import {
  X,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Sun,
  Contrast,
  RotateCcw,
  Download,
  Printer,
  Move,
  Ruler,
  Maximize2,
  Minimize2,
  FileText,
  ExternalLink,
  Keyboard,
  Trash2,
  Maximize,
  MousePointer,
  Search,
  Camera,
  Target,
  QrCode,
  Columns
} from 'lucide-react';
import { ActiveTool } from '../types';

export interface ViewerToolbarProps {
  patientName: string;
  patientId: string;
  modality: string;
  studyId: string;
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitScreen: () => void;
  onZoom100: () => void;
  onRotate: () => void;
  isInverted: boolean;
  onToggleInvert: () => void;
  onReset: () => void;
  onDeleteSelectedMeasurement?: () => void;
  onClearAllMeasurements?: () => void;
  hasSelectedMeasurement?: boolean;
  totalMeasurementsOnSlice?: number;
  onDownload: () => void;
  onPrint: () => void;
  onOpenCapture?: () => void;
  onOpenQrModal?: () => void;
  isSplitView?: boolean;
  onToggleSplitView?: () => void;
  showReportPanel: boolean;
  onToggleReportPanel: () => void;
  onOpenHotkeys: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onClose?: () => void;
  isPopup?: boolean;
}

export const ViewerToolbar: React.FC<ViewerToolbarProps> = ({
  patientName,
  patientId,
  modality,
  studyId,
  activeTool,
  setActiveTool,
  onZoomIn,
  onZoomOut,
  onFitScreen,
  onZoom100,
  onRotate,
  isInverted,
  onToggleInvert,
  onReset,
  onDeleteSelectedMeasurement,
  onClearAllMeasurements,
  hasSelectedMeasurement = false,
  totalMeasurementsOnSlice = 0,
  onDownload,
  onPrint,
  onOpenCapture,
  onOpenQrModal,
  isSplitView = false,
  onToggleSplitView,
  showReportPanel,
  onToggleReportPanel,
  onOpenHotkeys,
  isFullscreen,
  onToggleFullscreen,
  onClose,
  isPopup = false,
}) => {
  const [showMouseGuide, setShowMouseGuide] = useState<boolean>(false);

  return (
    <header className="h-12 bg-[#0f172a] border-b border-slate-800 px-3 flex items-center justify-between text-xs shrink-0 z-30 shadow-md">
      {/* Left: Back/Close */}
      <div className="flex items-center gap-2">
        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition border border-slate-700 active:scale-95 cursor-pointer shadow-sm"
            title={isPopup ? 'Đóng cửa sổ xem phim' : 'Quay lại danh sách ca chụp'}
          >
            {isPopup ? <X className="w-4 h-4 text-rose-400" /> : <ArrowLeft className="w-4 h-4 text-blue-400" />}
            <span>{isPopup ? 'Đóng' : 'Quay Lại'}</span>
          </button>
        )}
      </div>

      {/* Middle: 5 Core PACS Interactive Tools + Secondary Controls */}
      <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
        {/* 1. Window / Level */}
        <button
          onClick={() => setActiveTool('wl')}
          className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
            activeTool === 'wl'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Sáng/Tối (Window/Level) [W] • Kéo chuột trái để chỉnh Sáng/Tối"
        >
          <Sun className="w-3.5 h-3.5" />
          <span className="hidden lg:inline text-[11px]">Sáng/Tối</span>
        </button>

        {/* 2. Interactive Drag-to-Zoom Tool */}
        <button
          onClick={() => setActiveTool('zoom')}
          className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
            activeTool === 'zoom'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Thu Phóng (Zoom Tool) [Z] • Giữ chuột trái kéo LÊN để phóng to, kéo XUỐNG để thu nhỏ"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden lg:inline text-[11px]">Thu Phóng</span>
        </button>

        {/* 3. Pan Tool */}
        <button
          onClick={() => setActiveTool('pan')}
          className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
            activeTool === 'pan'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Di chuyển ảnh (Pan) [P] • Kéo chuột trái để rê dịch chuyển ảnh"
        >
          <Move className="w-3.5 h-3.5" />
          <span className="hidden lg:inline text-[11px]">Di Chuyển</span>
        </button>

        {/* 4. Ruler Distance Measurement Tool */}
        <button
          onClick={() => setActiveTool('ruler')}
          className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
            activeTool === 'ruler'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Thước đo khoảng cách [M] (Ruler mm) • Kéo chuột trái để đo khoảng cách"
        >
          <Ruler className="w-3.5 h-3.5" />
          <span className="hidden lg:inline text-[11px]">Thước Đo</span>
        </button>

        {/* 5. ROI Area & Hounsfield Density Tool */}
        <button
          onClick={() => setActiveTool('roi')}
          className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
            activeTool === 'roi'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Vùng Tổn Thương (ROI HU / Diện tích cm²) [O] • Kéo chuột trái để vẽ hình elip/khoanh vùng tổn thương"
        >
          <Target className="w-3.5 h-3.5" />
          <span className="hidden lg:inline text-[11px]">Vùng ROI</span>
        </button>

        {/* Measurement Management Actions (Xóa thước đo) */}
        {totalMeasurementsOnSlice > 0 && (
          <>
            <div className="h-4 w-px bg-slate-800 mx-0.5" />
            {hasSelectedMeasurement && onDeleteSelectedMeasurement && (
              <button
                onClick={onDeleteSelectedMeasurement}
                className="px-2 py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white transition flex items-center gap-1 text-[11px] font-bold"
                title="Xóa đường đo/vùng ROI đang chọn [Delete/Backspace]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa chọn</span>
              </button>
            )}
            {onClearAllMeasurements && (
              <button
                onClick={onClearAllMeasurements}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                title={`Xóa tất cả (${totalMeasurementsOnSlice}) phép đo/ROI trên lát cắt này`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </>
        )}

        <div className="h-4 w-px bg-slate-800 mx-0.5" />

        {/* Step-by-Step Zoom buttons */}
        <button
          onClick={onZoomIn}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title="Phóng to 1 bước [+] (hoặc Ctrl + Lăn chuột)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onZoomOut}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title="Thu nhỏ 1 bước [-] (hoặc Ctrl + Lăn chuột)"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        {/* Fit to Screen */}
        <button
          onClick={onFitScreen}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title="Căn vừa màn hình (Fit to Screen) [Double Click ảnh]"
        >
          <Maximize className="w-3.5 h-3.5" />
        </button>

        {/* Rotate */}
        <button
          onClick={onRotate}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title="Xoay ảnh 90 độ"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        {/* Invert */}
        <button
          onClick={onToggleInvert}
          className={`p-1.5 rounded-lg transition ${
            isInverted ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Đảo âm/dương bản [I]"
        >
          <Contrast className="w-3.5 h-3.5" />
        </button>

        {/* Reset */}
        <button
          onClick={onReset}
          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition"
          title="Đặt lại khung nhìn mặc định [R]"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Smart Mouse Guide Popup Trigger */}
        <div className="relative">
          <button
            onClick={() => setShowMouseGuide((v) => !v)}
            className={`p-1.5 rounded-lg transition ${
              showMouseGuide ? 'bg-cyan-600/30 text-cyan-300' : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800'
            }`}
            title="Hướng dẫn thao tác chuột thông minh PACS"
          >
            <MousePointer className="w-3.5 h-3.5" />
          </button>

          {showMouseGuide && (
            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-64 bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl z-50 text-[11px] space-y-1.5 text-slate-300 animate-fade-in pointer-events-auto">
              <p className="font-bold text-cyan-400 border-b border-slate-800 pb-1 flex items-center justify-between">
                <span>🖱️ Thao Tác Chuột PACS Pro</span>
                <button onClick={() => setShowMouseGuide(false)} className="text-slate-400 hover:text-white">✕</button>
              </p>
              <p>• <strong className="text-white">Công Cụ Thu Phóng [Z]</strong>: Giữ chuột trái kéo LÊN để phóng to, kéo XUỐNG để thu nhỏ</p>
              <p>• <strong className="text-white">Công Cụ Vùng ROI [O]</strong>: Kéo chuột trái vẽ vùng elip đo diện tích & mật độ HU</p>
              <p>• <strong className="text-white">Chuột Phải Kéo</strong>: Chỉnh Sáng/Tối (W/L) ở mọi chế độ</p>
              <p>• <strong className="text-white">Chuột Giữa / Space</strong>: Di chuyển ảnh (Pan)</p>
              <p>• <strong className="text-white">Con Lăn Chuột</strong>: Cuộn lát cắt (Slices)</p>
              <p>• <strong className="text-white">Ctrl + Con Lăn</strong>: Thu phóng (Zoom) mượt mà</p>
              <p>• <strong className="text-white">Click Đúp</strong>: Căn vừa màn hình (Fit Screen)</p>
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Nút Ghép Đôi So Sánh (1x2 Split) */}
        {onToggleSplitView && (
          <button
            onClick={onToggleSplitView}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold text-xs transition border cursor-pointer ${
              isSplitView
                ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Chuyển chế độ xem: 1 Khung hình hoặc Ghép Đôi So Sánh (1x2 Split)"
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ghép Đôi</span>
          </button>
        )}

        {/* Nút Bắt Hình Card Capture / Foot Pedal */}
        {onOpenCapture && (
          <button
            onClick={onOpenCapture}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/40 font-bold text-xs transition active:scale-95 cursor-pointer shadow-sm animate-pulse"
            title="Mở nguồn Video Card Capture & Bắt hình trực tiếp (Bàn đạp chân / Phím Space)"
          >
            <Camera className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Bắt Hình</span>
          </button>
        )}

        {/* Nút Mã QR Phim Số Trực Tuyến */}
        {onOpenQrModal && (
          <button
            onClick={onOpenQrModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/40 font-bold text-xs transition active:scale-95 cursor-pointer shadow-sm"
            title="Mở Mã QR Tra Cứu Phim Số Trực Tuyến Trên Điện Thoại"
          >
            <QrCode className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Mã QR</span>
          </button>
        )}

        <button
          onClick={() => {
            window.open(`http://localhost:8080/viewer?StudyInstanceUIDs=${studyId}`, 'OHIF_3D_VIEWER');
          }}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600/20 hover:bg-teal-600/40 text-teal-300 border border-teal-500/40 font-bold text-xs transition active:scale-95 cursor-pointer"
          title="Mở trạm đọc ảnh 3D MPR / Volume Rendering chuyên sâu"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>3D OHIF</span>
        </button>

        <button
          onClick={onDownload}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title="Tải ảnh PNG về máy"
        >
          <Download className="w-4 h-4" />
        </button>

        <button
          onClick={onPrint}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title="In Phiếu Kết Quả Siêu Âm 4 Ảnh [Khổ A4]"
        >
          <Printer className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleReportPanel}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold text-xs transition border ${
            showReportPanel
              ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
          }`}
          title="Bật/Tắt Bảng Kết Quả Chẩn Đoán"
        >
          <FileText className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Kết Quả</span>
        </button>

        <button
          onClick={onOpenHotkeys}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition hidden sm:block"
          title="Xem danh sách phím tắt [?]"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleFullscreen}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title={isFullscreen ? 'Thu nhỏ [Esc]' : 'Toàn màn hình [F]'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {onClose && isPopup && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white transition border border-rose-500/30 ml-1 cursor-pointer active:scale-95"
            title="Đóng cửa sổ Quick Viewer [Esc]"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </header>
  );
};
