import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Sun,
  Moon,
  Zap,
  Image as ImageIcon,
  Save,
  ShieldCheck,
  Printer,
  QrCode,
  HeartPulse,
  Building2,
  Stethoscope,
  Calendar,
  History,
  SlidersHorizontal,
  AlertTriangle,
  Camera,
  RotateCcw
} from 'lucide-react';
import { formatDisplayDate } from '../data/equipmentData';

interface ReportHeaderBarProps {
  onClose: () => void;
  onPrevStudy?: () => void;
  onNextStudy?: () => void;
  currentIndex?: number;
  totalStudies?: number;
  modality: string;
  patientName: string;
  patientId: string;
  healthInsuranceCard?: string;
  genderDisplay: string;
  computedAge?: string | null;
  birthDate?: string;
  description?: string;
  // Hotkey & theme
  onOpenHotkeyModal: () => void;
  theme: string;
  toggleTheme: () => void;
  onApplyNormalTemplate: () => void;
  isMiniPacsOpen: boolean;
  onToggleMiniPacs: () => void;
  // Save & Sign & Revoke
  isSigned: boolean;
  saving: boolean;
  signing: boolean;
  onSaveDraft: () => void;
  onSignReport: (autoAdvance: boolean) => void;
  onRevokeSignature?: () => void;
  onOpenPrintModal: () => void;
  onOpenShareModal: () => void;
  onOpenMediaCapture: () => void;
  mediaCount: number;
  keyImagesCount: number;
  // Sub-bar props
  icd10?: string;
  clinicalDiagnosis?: string;
  orderingDept?: string;
  referringPhysician?: string;
  performDate?: string;
  admitDate?: string;
  studyDate?: string;
  priorStudiesCount: number;
  onOpenPriorModal: () => void;
  activeSidebarTab: string;
  onOpenExecutionTab: () => void;
  autoSaveStatus: string;
  isCriticalAlert: boolean;
  onToggleCriticalAlert: () => void;
}

export const ReportHeaderBar: React.FC<ReportHeaderBarProps> = ({
  onClose,
  onPrevStudy,
  onNextStudy,
  currentIndex = 1,
  totalStudies = 1,
  modality,
  patientName,
  patientId,
  healthInsuranceCard,
  genderDisplay,
  computedAge,
  birthDate,
  description,
  onOpenHotkeyModal,
  theme,
  toggleTheme,
  onApplyNormalTemplate,
  isMiniPacsOpen,
  onToggleMiniPacs,
  isSigned,
  saving,
  signing,
  onSaveDraft,
  onSignReport,
  onRevokeSignature,
  onOpenPrintModal,
  onOpenShareModal,
  onOpenMediaCapture,
  mediaCount = 0,
  keyImagesCount = 0,
  icd10,
  clinicalDiagnosis,
  orderingDept,
  referringPhysician,
  performDate,
  admitDate,
  studyDate,
  priorStudiesCount,
  onOpenPriorModal,
  activeSidebarTab,
  onOpenExecutionTab,
  autoSaveStatus,
  isCriticalAlert,
  onToggleCriticalAlert
}) => {
  return (
    <>
      {/* ── TOP MASTER WORKFLOW BAR ── */}
      <header className="min-h-[52px] px-2 sm:px-3 bg-white dark:bg-[#09152b] border-b border-slate-200 dark:border-[#1b355e] flex items-center justify-between gap-2 shrink-0 shadow-sm z-30 transition-colors">
        {/* Left: Back + Patient Badge & Queue Navigation */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <button
            onClick={onClose}
            className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition flex items-center gap-1 border border-slate-300 dark:border-slate-700 shadow-sm shrink-0 cursor-pointer"
            title="Trở lại danh sách (Esc)"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Thoát</span>
            <span className="text-[10px] text-slate-400 font-mono">Esc</span>
          </button>

          {/* Prev/Next Patient Navigation Buttons */}
          <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-[#060e1d] p-0.5 rounded-lg border border-slate-200 dark:border-[#1a3458] shrink-0">
            <button
              onClick={onPrevStudy}
              disabled={!onPrevStudy}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 text-sky-600 dark:text-sky-400 transition cursor-pointer"
              title="Ca bệnh trước đó (F7)"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] sm:text-[11px] font-mono font-bold px-1 text-slate-700 dark:text-slate-300 whitespace-nowrap">
              {currentIndex}/{totalStudies}
            </span>
            <button
              onClick={onNextStudy}
              disabled={!onNextStudy}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 text-sky-600 dark:text-sky-400 transition cursor-pointer"
              title="Ca bệnh tiếp theo (F8)"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Patient Quick Info Card */}
          <div className="flex items-center gap-2 pl-1.5 border-l border-slate-200 dark:border-slate-700/60 min-w-0">
            <span className="px-2 py-1 rounded-lg bg-sky-50 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 font-mono font-extrabold text-xs border border-sky-200 dark:border-sky-500/40 shrink-0 tracking-wide">
              {modality}
            </span>
            <div className="min-w-0 py-0.5">
              {/* Row 1: Patient Name + ID + BHYT */}
              <div className="flex items-center gap-2 leading-tight">
                <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight truncate max-w-[180px] sm:max-w-sm uppercase">
                  {patientName?.toUpperCase()}
                </span>
                <span className="text-[11px] font-mono font-bold text-teal-700 dark:text-teal-300 shrink-0 bg-teal-50 dark:bg-teal-900/40 px-1.5 py-0.5 rounded border border-teal-200 dark:border-teal-700/50">
                  {patientId}
                </span>
                {healthInsuranceCard && (
                  <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60 hidden xl:inline">
                    BHYT: {healthInsuranceCard}
                  </span>
                )}
              </div>
              {/* Row 2: Gender / Age / DOB / Procedure Description */}
              <div className="flex items-center gap-1.5 mt-0.5 text-[11px]">
                <span
                  className={`font-bold ${
                    genderDisplay === 'Nữ'
                      ? 'text-pink-600 dark:text-pink-400'
                      : 'text-blue-600 dark:text-blue-400'
                  }`}
                >
                  {genderDisplay}
                </span>
                {computedAge && (
                  <>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{computedAge} tuổi</span>
                  </>
                )}
                {birthDate && (
                  <span className="text-slate-400 dark:text-slate-500 font-mono text-[10px] hidden sm:inline">
                    (SN: {formatDisplayDate(birthDate)})
                  </span>
                )}
                {description && (
                  <>
                    <span className="text-slate-300 dark:text-slate-600 hidden lg:inline">·</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[200px] hidden lg:block font-medium">
                      {description}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: High-Speed Action Hotkeys */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Hotkey Help Button F1 */}
          <button
            onClick={onOpenHotkeyModal}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 transition cursor-pointer"
            title="Bảng phím tắt thao tác nhanh (F1)"
          >
            <HelpCircle className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          </button>

          {/* Theme Switcher Sun/Moon Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-amber-300 border border-slate-300 dark:border-slate-600 transition cursor-pointer"
            title={theme === 'dark' ? 'Chuyển sang Giao diện Sáng (Light Mode)' : 'Chuyển sang Giao diện Tối (Dark Mode)'}
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
          </button>

          {/* 1-Click Normal Template F4 */}
          <button
            onClick={onApplyNormalTemplate}
            className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-900/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-700/60 text-teal-800 dark:text-teal-200 text-xs font-extrabold shadow-sm transition active:scale-95 cursor-pointer"
            title="Nạp nhanh mẫu Chuẩn Bình Thường (F4)"
          >
            <Zap className="w-3 h-3 text-amber-500 dark:text-amber-300" />
            <span>[F4] Bình Thường</span>
          </button>

          {/* Media Capture / Image Upload (F3) */}
          <button
            onClick={onOpenMediaCapture}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-300 dark:border-amber-700 transition active:scale-95 cursor-pointer"
            title="Chụp trực tiếp từ máy Siêu âm/Nội soi hoặc nạp ảnh từ thư mục (F3)"
          >
            <Camera className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline">Ảnh ({mediaCount})</span>
            {keyImagesCount > 0 && (
              <span className="px-1.5 py-0.2 rounded bg-emerald-600 text-white text-[10px] font-mono font-bold">
                {keyImagesCount} in
              </span>
            )}
          </button>

          {/* Toggle Mini PACS Viewport F6 */}
          <button
            onClick={onToggleMiniPacs}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
              isMiniPacsOpen
                ? 'bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-500/50'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Bật/Tắt Trình Xem Ảnh DICOM mini (F6)"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">{isMiniPacsOpen ? 'Ẩn PACS' : 'Hiện PACS'}</span>
          </button>

          {/* Save Draft Ctrl+S */}
          {!isSigned && (
            <button
              onClick={onSaveDraft}
              disabled={saving}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-300 dark:border-slate-600 transition active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Lưu nháp báo cáo (Ctrl+S)"
            >
              <Save className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span>Nháp</span>
            </button>
          )}

          {/* SIGN & NEXT PATIENT (F9) */}
          {isSigned ? (
            <div className="flex items-center gap-1">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600/90 text-white text-xs font-black shadow-md border border-emerald-400/50 shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-100" />
                <span>ĐÃ KÝ</span>
              </span>
              {onRevokeSignature && (
                <button
                  onClick={onRevokeSignature}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-300 dark:border-rose-700/60 shadow-xs transition active:scale-95 cursor-pointer"
                  title="Hủy chữ ký số & Mở khóa kết quả để chỉnh sửa lại khi có sự cố"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span className="hidden sm:inline">Hủy Ký</span>
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => onSignReport(true)}
              disabled={signing}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md border border-emerald-400/50 transition active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
              title="Ký số duyệt báo cáo & Tự động mở ca bệnh tiếp theo (F9)"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-100" />
              <span>Duyệt & Ký (F9)</span>
            </button>
          )}

          {/* Print Report (Ctrl+P) */}
          <button
            onClick={onOpenPrintModal}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold border border-indigo-400/40 shadow-sm transition active:scale-95 cursor-pointer"
            title="In phiếu kết quả chính thức (Ctrl+P)"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">In</span>
          </button>

          {/* Share QR */}
          <button
            onClick={onOpenShareModal}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-purple-600 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30 transition cursor-pointer"
            title="Tạo mã QR Cổng Bệnh nhân"
          >
            <QrCode className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ── UNIFIED CLINICAL CONTEXT & DOCTORS SUB-BAR ── */}
      <div className="h-9 px-2 sm:px-3 bg-slate-50 dark:bg-[#060e1c] border-b border-slate-200 dark:border-[#142642] flex items-center justify-between gap-3 text-xs shrink-0 transition-colors">
        {/* Left: Clinical Details */}
        <div className="flex-1 flex items-center gap-2 sm:gap-2.5 min-w-0 overflow-hidden text-[11px]">
          {/* ICD10 Badge */}
          {icd10 && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 font-black font-mono text-[10px] shrink-0 uppercase shadow-xs">
              ICD: {icd10}
            </span>
          )}

          {/* Clinical Diagnosis */}
          {clinicalDiagnosis && (
            <div className="flex items-center gap-1 min-w-0 flex-1 max-w-sm lg:max-w-md xl:max-w-lg 2xl:max-w-2xl">
              <HeartPulse className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 shrink-0" />
              <span className="text-slate-400 font-medium shrink-0">Chẩn đoán:</span>
              <span className="font-bold text-slate-800 dark:text-slate-100 truncate" title={clinicalDiagnosis}>
                {clinicalDiagnosis}
              </span>
            </div>
          )}

          {/* Separator */}
          {(icd10 || clinicalDiagnosis) && (orderingDept || referringPhysician || performDate) && (
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline shrink-0">│</span>
          )}

          {/* Ordering Department */}
          {orderingDept && (
            <span className="flex items-center gap-1 shrink-0 text-slate-600 dark:text-slate-400 hidden md:flex">
              <Building2 className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
              <span>Khoa:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{orderingDept}</span>
            </span>
          )}

          {/* Referring Doctor */}
          {referringPhysician && referringPhysician !== 'N/A' && (
            <span className="flex items-center gap-1 shrink-0 text-slate-600 dark:text-slate-400 hidden lg:flex">
              <Stethoscope className="w-3 h-3 text-sky-500 dark:text-sky-400" />
              <span>BS Chỉ định:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{referringPhysician}</span>
            </span>
          )}

          {/* Perform Date */}
          {(performDate || admitDate || studyDate) && (
            <span className="flex items-center gap-1 shrink-0 text-slate-600 dark:text-slate-400 hidden sm:flex">
              <Calendar className="w-3 h-3 text-teal-600 dark:text-teal-400" />
              <span>Ngày chụp:</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {performDate
                  ? formatDisplayDate(performDate)
                  : admitDate
                  ? formatDisplayDate(admitDate)
                  : studyDate}
              </span>
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Prior Studies Button */}
          <button
            onClick={onOpenPriorModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-700/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 transition shadow-xs active:scale-95 cursor-pointer"
            title="Bấm để xem danh sách và chi tiết các phiếu kết quả cũ của bệnh nhân"
          >
            <History className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Ca Cũ</span>
            <span className="px-1.5 py-0.2 rounded-full bg-teal-200 dark:bg-teal-800 text-teal-900 dark:text-teal-100 text-[10px] font-black">
              {priorStudiesCount}
            </span>
          </button>

          {/* Execution Details Tab Button */}
          <button
            onClick={onOpenExecutionTab}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition shadow-xs active:scale-95 cursor-pointer ${
              activeSidebarTab === 'execution'
                ? 'bg-sky-600 text-white border-sky-500 shadow-sm'
                : 'bg-white dark:bg-[#0b172a] text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Quản Lý Thực Hiện (Bác sĩ đọc/duyệt, Thời gian, Máy chụp, KTV)"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Thực Hiện</span>
          </button>

          {/* AutoSave Pulse Status */}
          <div className="hidden 2xl:flex items-center gap-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            <span>{autoSaveStatus ? (autoSaveStatus.length > 25 ? 'Đã lưu HIS' : autoSaveStatus) : 'Tự động lưu'}</span>
          </div>

          {/* Critical Red Flag Toggle */}
          <button
            onClick={onToggleCriticalAlert}
            className={`px-2 py-0.5 rounded text-[11px] font-extrabold flex items-center gap-1 transition border shadow-xs cursor-pointer ${
              isCriticalAlert
                ? 'bg-rose-600 text-white border-rose-400 shadow-md animate-bounce'
                : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title="Bật cảnh báo tổn thương nguy kịch để hệ thống bắn báo động sang khoa Cấp cứu / Lâm sàng"
          >
            <AlertTriangle className="w-3 h-3 text-amber-500 dark:text-amber-300" />
            <span className="hidden sm:inline">{isCriticalAlert ? '⚠️ NGUY KỊCH' : 'Nguy kịch'}</span>
          </button>
        </div>
      </div>
    </>
  );
};
