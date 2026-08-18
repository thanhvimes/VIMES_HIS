import React, { useState } from 'react';
import {
  Activity,
  CheckCircle,
  ChevronRight,
  Printer,
  FileText,
  Sparkles,
  Bookmark,
  Check,
  RotateCcw
} from 'lucide-react';
import { ReportData, FindingPreset, NORMAL_FINDING_PRESETS } from '../types';

export interface ReportFindingsPanelProps {
  show: boolean;
  onClose: () => void;
  reportData: ReportData;
  onOpenUltrasoundPrint?: () => void;
  onApplyPreset?: (preset: FindingPreset) => void;
  modality?: string;
}

export const ReportFindingsPanel: React.FC<ReportFindingsPanelProps> = ({
  show,
  onClose,
  reportData,
  onOpenUltrasoundPrint,
  onApplyPreset,
  modality = 'US',
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [appliedNotice, setAppliedNotice] = useState<boolean>(false);

  if (!show) return null;

  // Lọc mẫu chuẩn phù hợp với Modality (Siêu âm, X-quang, CT)
  const filteredPresets = NORMAL_FINDING_PRESETS.filter((p) => {
    if (modality === 'US' || modality === 'Siêu âm') return p.modality === 'US';
    if (modality === 'CT') return p.modality === 'CT';
    if (modality === 'XR' || modality === 'CR' || modality === 'DX') return p.modality === 'XR';
    return true;
  });

  const handleApplyPreset = (preset: FindingPreset) => {
    if (onApplyPreset) {
      onApplyPreset(preset);
      setAppliedNotice(true);
      setTimeout(() => setAppliedNotice(false), 2000);
    }
  };

  return (
    <aside className="w-80 sm:w-96 bg-[#0f172a] border-l border-slate-800 flex flex-col shrink-0 overflow-y-auto custom-scrollbar p-4 space-y-4 animate-fade-in shadow-2xl">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          Kết Quả Chẩn Đoán CĐHA
        </h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 cursor-pointer"
          title="Đóng bảng kết quả"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 🌟 1-Click Fast Normal Template Selector */}
      <div className="p-3 bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Mẫu Mô Tả Chuẩn 1-Click
          </span>
          {appliedNotice && (
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
              <Check className="w-3 h-3" /> Đã áp dụng
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <select
            value={selectedPresetId}
            onChange={(e) => {
              const pId = e.target.value;
              setSelectedPresetId(pId);
              const found = NORMAL_FINDING_PRESETS.find((p) => p.id === pId);
              if (found) handleApplyPreset(found);
            }}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="">-- Chọn Mẫu Mô Tả Chuẩn --</option>
            {filteredPresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.title}
              </option>
            ))}
          </select>

          {/* Quick Apply Button */}
          {filteredPresets.length > 0 && (
            <button
              onClick={() => handleApplyPreset(filteredPresets[0])}
              className="w-full py-1.5 px-2 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white font-bold text-[11px] rounded-lg flex items-center justify-center gap-1.5 border border-indigo-500/40 transition active:scale-95 cursor-pointer"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>⚡ Điền Nhanh: {filteredPresets[0].title.split('(')[0]}</span>
            </button>
          )}
        </div>
      </div>

      {/* Nút In Phiếu Siêu Âm 4 Ảnh Chuẩn Y Tế VIMES HIS */}
      {onOpenUltrasoundPrint && (
        <button
          onClick={onOpenUltrasoundPrint}
          className="w-full py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer border border-blue-400/30"
        >
          <Printer className="w-4 h-4 text-sky-200" />
          <span>In Phiếu Siêu Âm 4 Ảnh (Khổ A4)</span>
        </button>
      )}

      {/* Trạng thái Ký Số */}
      <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <p className="text-xs font-bold text-emerald-300">Báo Cáo Đã Ký Số</p>
            <p className="text-[10px] text-emerald-400/80">Ký duyệt bởi {reportData.readingDoctor}</p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
          CHUẨN 'T'
        </span>
      </div>

      {/* Mô tả (Findings) */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
          1. Mô Tả Tổn Thương (Findings)
        </label>
        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 leading-relaxed font-sans min-h-[90px] whitespace-pre-line text-justify">
          {reportData.findings}
        </div>
      </div>

      {/* Kết luận (Impression) */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-amber-400">
          2. Kết Luận Chẩn Đoán (Impression)
        </label>
        <div className="p-3.5 bg-amber-950/20 border border-amber-500/30 rounded-xl text-xs font-bold text-amber-200 leading-relaxed min-h-[55px]">
          {reportData.impression}
        </div>
      </div>

      {/* Đề nghị */}
      {reportData.recommendation && (
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
            3. Đề Nghị / Hướng Xử Trí
          </label>
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed">
            {reportData.recommendation}
          </div>
        </div>
      )}

      {/* Chữ ký */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <div>
          <p className="text-[10px] text-slate-500 uppercase font-bold">Bác Sĩ Đọc Kết Quả</p>
          <p className="font-bold text-slate-200 mt-0.5">{reportData.readingDoctor}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-500 uppercase font-bold">Thời Gian Ký</p>
          <p className="font-mono text-slate-400 text-[11px] mt-0.5">{reportData.signedAt}</p>
        </div>
      </div>
    </aside>
  );
};
