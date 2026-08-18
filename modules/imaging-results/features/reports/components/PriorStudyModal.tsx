import React from 'react';
import { History, X, ExternalLink, Calendar, Stethoscope, FileText, CheckCircle2 } from 'lucide-react';
import { PriorStudyReport } from '../types';

interface PriorStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  priorStudies: PriorStudyReport[];
  selectedStudy: PriorStudyReport | null;
  onSelectStudy: (study: PriorStudyReport) => void;
  patientName: string;
}

export const PriorStudyModal: React.FC<PriorStudyModalProps> = ({
  isOpen,
  onClose,
  priorStudies,
  selectedStudy,
  onSelectStudy,
  patientName
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0a162b] border border-slate-200 dark:border-[#1b3762] text-slate-900 dark:text-white w-full max-w-5xl rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-teal-500" />
            <div>
              <h3 className="text-base font-black">Lịch Sử Ca Chụp Cũ &amp; Báo Cáo Chẩn Đoán Trước</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bệnh nhân: <b className="text-slate-800 dark:text-white uppercase font-extrabold">{patientName?.toUpperCase()}</b> ({priorStudies.length} ca chụp trước đây)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body 2-Column */}
        <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0 overflow-hidden">
          {/* Left: Studies List */}
          <div className="w-full md:w-80 shrink-0 overflow-y-auto space-y-2 pr-1 border-r border-slate-200 dark:border-slate-800 custom-scrollbar">
            {priorStudies.map((study) => {
              const isSelected = selectedStudy?.id === study.id;
              return (
                <div
                  key={study.id}
                  onClick={() => onSelectStudy(study)}
                  className={`p-3 rounded-2xl border cursor-pointer transition shadow-xs ${
                    isSelected
                      ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 dark:border-teal-500/60 ring-1 ring-teal-500'
                      : 'bg-slate-50 dark:bg-[#070f1e] border-slate-200 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-mono font-black text-[10px]">
                      {study.modality}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                      {study.studyDate}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2">
                    {study.serviceName}
                  </h4>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                    <span>BS: {study.readingDoctor}</span>
                    {study.icd10 && <span className="font-mono text-amber-600 font-bold">ICD: {study.icd10}</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Selected Study Report Detail */}
          {selectedStudy ? (
            <div className="flex-1 overflow-y-auto space-y-4 p-2 bg-slate-50 dark:bg-[#070f1e] rounded-2xl border border-slate-200 dark:border-slate-800 custom-scrollbar">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <div>
                  <span className="text-xs font-black text-teal-700 dark:text-teal-300 uppercase">
                    {selectedStudy.modality} · {selectedStudy.studyDate}
                  </span>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                    {selectedStudy.serviceName}
                  </h4>
                </div>
                {selectedStudy.studyInstanceUid && (
                  <button
                    onClick={() => window.open(`http://localhost:8080/viewer?StudyInstanceUIDs=${selectedStudy.studyInstanceUid}`, '_blank')}
                    className="px-3 py-1.5 rounded-xl bg-[#0078D4] hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                  >
                    <span>Mở OHIF 3D</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Diagnosis info */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-white dark:bg-[#0a162b] p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Chẩn đoán lâm sàng:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedStudy.clinicalDiagnosis || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Bác sĩ đọc &amp; duyệt:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedStudy.readingDoctor} / {selectedStudy.approvingDoctor}</span>
                </div>
              </div>

              {/* Findings */}
              <div className="space-y-1">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1 uppercase">
                  <FileText className="w-3.5 h-3.5 text-sky-500" /> Mô Tả Tổn Thương:
                </span>
                <div className="p-3 bg-white dark:bg-[#0a162b] rounded-xl border border-slate-200 dark:border-slate-800 text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line font-sans">
                  {selectedStudy.findings}
                </div>
              </div>

              {/* Impression */}
              <div className="space-y-1">
                <span className="text-xs font-black text-teal-800 dark:text-teal-300 flex items-center gap-1 uppercase">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> Kết Luận:
                </span>
                <div className="p-3 bg-teal-50 dark:bg-teal-950/30 rounded-xl border border-teal-200 dark:border-teal-800 text-xs font-bold leading-relaxed text-teal-950 dark:text-teal-200 whitespace-pre-line">
                  {selectedStudy.impression}
                </div>
              </div>

              {/* Recommendation */}
              {selectedStudy.recommendation && (
                <div className="space-y-1">
                  <span className="text-xs font-black text-amber-800 dark:text-amber-300 flex items-center gap-1 uppercase">
                    Lời Khuyên &amp; Đề Nghị:
                  </span>
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/60 text-xs leading-relaxed text-slate-700 dark:text-amber-200/90">
                    {selectedStudy.recommendation}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
              Chọn một ca chụp để xem chi tiết kết quả trước đây.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
