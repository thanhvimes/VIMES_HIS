import React from 'react';
import { ChevronDown, Calendar, User, Search, X, RefreshCw, Filter } from 'lucide-react';

interface StudyFilterBarProps {
  modality: string;
  setModality: (val: string) => void;
  status: string;
  setStatus: (val: string) => void;
  studyDateFrom: string;
  setStudyDateFrom: (val: string) => void;
  studyDateTo: string;
  setStudyDateTo: (val: string) => void;
  patientId: string;
  setPatientId: (val: string) => void;
  patientName: string;
  setPatientName: (val: string) => void;
  hasActiveFilters: boolean | string;
  loading: boolean;
  onClearFilters: () => void;
  onRefresh: () => void;
  onApplyFilter: (e?: React.FormEvent) => void;
  triggerSearch: () => void;
}

export const StudyFilterBar: React.FC<StudyFilterBarProps> = ({
  modality,
  setModality,
  status,
  setStatus,
  studyDateFrom,
  setStudyDateFrom,
  studyDateTo,
  setStudyDateTo,
  patientId,
  setPatientId,
  patientName,
  setPatientName,
  hasActiveFilters,
  loading,
  onClearFilters,
  onRefresh,
  onApplyFilter,
  triggerSearch
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 shadow-sm">
      <form
        onSubmit={onApplyFilter}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-7 gap-2.5 items-end"
      >
        {/* 1. Máy Chụp (Modality) */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 truncate">
            Máy Chụp
          </label>
          <div className="relative">
            <select
              value={modality}
              onChange={(e) => {
                setModality(e.target.value);
                triggerSearch();
              }}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-700 dark:text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition font-medium"
            >
              <option value="">Tất cả thiết bị</option>
              <option value="CT">CT — Cắt lớp vi tính</option>
              <option value="MR">MRI — Cộng hưởng từ</option>
              <option value="CR">CR — X-Quang KTS</option>
              <option value="DX">DX — X-Quang trực tiếp</option>
              <option value="US">US — Siêu âm</option>
              <option value="PT">PT — PET Scan</option>
              <option value="NM">NM — Y học hạt nhân</option>
            </select>
            <ChevronDown className="absolute right-2 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* 2. Trạng Thái */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 truncate">
            Trạng Thái
          </label>
          <div className="relative">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                triggerSearch();
              }}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-700 dark:text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="SCHEDULED">⏳ Chờ chụp (MWL)</option>
              <option value="IN_PROGRESS">🔵 Đang chụp (MWL)</option>
              <option value="UNREPORTED">📷 Chờ đọc kết quả (PACS)</option>
              <option value="REPORT_DRAFT">📝 Đã lưu nháp kết quả</option>
              <option value="REPORT_SIGNED">✍️ Đã ký số chẩn đoán</option>
            </select>
            <ChevronDown className="absolute right-2 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* 3. Từ Ngày */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 truncate">
            Từ Ngày
          </label>
          <div className="relative">
            <Calendar className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={studyDateFrom}
              onChange={(e) => {
                setStudyDateFrom(e.target.value);
                triggerSearch();
              }}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-2 py-2 text-xs text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition"
            />
          </div>
        </div>

        {/* 4. Đến Ngày */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 truncate">
            Đến Ngày
          </label>
          <div className="relative">
            <Calendar className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={studyDateTo}
              onChange={(e) => {
                setStudyDateTo(e.target.value);
                triggerSearch();
              }}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-2 py-2 text-xs text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition"
            />
          </div>
        </div>

        {/* 5. Mã Bệnh Nhân */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 truncate">
            Mã Bệnh Nhân
          </label>
          <div className="relative">
            <User className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Nhập mã BN..."
              value={patientId}
              onChange={(e) => {
                setPatientId(e.target.value);
                triggerSearch();
              }}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-2 py-2 text-xs text-slate-700 dark:text-slate-200 placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition"
            />
          </div>
        </div>

        {/* 6. Họ Tên Bệnh Nhân */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 truncate">
            Họ Tên Bệnh Nhân
          </label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Nhập họ và tên..."
              value={patientName}
              onChange={(e) => {
                setPatientName(e.target.value);
                triggerSearch();
              }}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-2 py-2 text-xs text-slate-700 dark:text-slate-200 placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition"
            />
          </div>
        </div>

        {/* 7. Action Buttons */}
        <div className="flex items-center gap-1.5 justify-end">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 text-xs font-semibold transition cursor-pointer"
              title="Xóa tất cả bộ lọc"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onRefresh}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition shrink-0 cursor-pointer"
            title="Làm mới dữ liệu từ Server PACS & MWL"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-500' : ''}`} />
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0c6e9e] hover:bg-[#0a5d87] text-white text-xs font-bold border border-[#1080b0] shadow-sm transition-all cursor-pointer"
            title="Áp dụng các điều kiện lọc vừa chọn"
          >
            <Filter className="w-3.5 h-3.5" /> Lọc
          </button>
        </div>
      </form>
    </div>
  );
};
