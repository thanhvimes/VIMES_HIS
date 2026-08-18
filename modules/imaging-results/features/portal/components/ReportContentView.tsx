import React from 'react';
import { CheckCircle2, Sliders, FileText, HeartPulse, Award, ShieldCheck } from 'lucide-react';
import { PortalReport } from '../types';

interface ReportContentViewProps {
  report: PortalReport | null;
}

export const ReportContentView: React.FC<ReportContentViewProps> = ({ report }) => {
  return (
    <div className="rounded-3xl bg-white dark:bg-[#09152a] border border-slate-200 dark:border-[#1b3660] p-6 sm:p-8 shadow-sm dark:shadow-2xl space-y-6 animate-fade-in transition-colors">
      {/* Header of Report */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <span className="text-[10px] font-mono font-extrabold text-sky-600 dark:text-sky-400 uppercase tracking-widest block">
            BỆNH VIỆN ĐA KHOA QUỐC TẾ VIMES — KHOA CHẨN ĐOÁN HÌNH ẢNH
          </span>
          <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
            Phiếu Kết Quả Chẩn Đoán Cắt Lớp Vi Tính
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Bản Chính Thức Ký Số
          </span>
        </div>
      </div>

      {/* Protocol & Technique */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#060e1c] border border-slate-200 dark:border-slate-800 space-y-1.5">
        <h4 className="text-xs font-extrabold text-sky-800 dark:text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" /> 1. Kỹ Thuật Chụp &amp; Quy Trình (Technique):
        </h4>
        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans pl-5">
          {report?.technique ||
            'Chụp CT Scanner 128 dãy lồng ngực từ đỉnh phổi đến hết 2 tuyến thượng thận. Tái tạo đa bình diện MPR và 3D Volume Rendering.'}
        </p>
      </div>

      {/* Findings Detail */}
      <div className="space-y-2">
        <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" /> 2. Mô Tả Chi Tiết Hình Ảnh (Findings):
        </h4>
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#060e1c] border border-slate-200 dark:border-slate-800 text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line font-mono">
          {report?.findings}
        </div>
      </div>

      {/* Clinical Impression */}
      <div className="space-y-2">
        <h4 className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> 3. Kết Luận Chẩn Đoán (Impression):
        </h4>
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-[#060e1c] border-2 border-emerald-400 dark:border-emerald-500/40 text-xs font-bold text-emerald-950 dark:text-emerald-200 leading-relaxed whitespace-pre-line shadow-sm">
          {report?.impression}
        </div>
      </div>

      {/* Recommendations */}
      {report?.recommendation && (
        <div className="space-y-2">
          <h4 className="text-xs font-extrabold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <HeartPulse className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> 4. Khuyên Cáo &amp; Hướng Xử Trí (Recommendations):
          </h4>
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 leading-relaxed whitespace-pre-line">
            {report.recommendation}
          </div>
        </div>
      )}

      {/* Digital Signature Block */}
      {report?.signature && (
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-slate-50 dark:bg-[#060e1c] p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                {report.signature.doctorName}
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 inline" />
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                {report.signature.doctorRole}
              </p>
              <p className="text-[11px] text-sky-700 dark:text-sky-400 font-mono">
                Chứng chỉ hành nghề: {report.signature.licenseNumber}
              </p>
            </div>
          </div>

          <div className="sm:text-right text-xs text-slate-500 dark:text-slate-400 font-mono space-y-1">
            <p className="text-emerald-700 dark:text-emerald-400 font-bold">✓ Chữ Ký Số Y Tế Hợp Lệ</p>
            <p>Thời gian ký: {new Date(report.signature.signedAt).toLocaleString('vi-VN')}</p>
            <p
              className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-xs"
              title={report.signature.signatureHash}
            >
              Hash: {report.signature.signatureHash}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
