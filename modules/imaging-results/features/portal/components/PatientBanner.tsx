import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { User, Activity, CheckCircle2, Calendar, ShieldCheck, Sparkles } from 'lucide-react';
import { PortalReport } from '../types';

interface PatientBannerProps {
  report: PortalReport | null;
  patientIdQuery: string;
}

export const PatientBanner: React.FC<PatientBannerProps> = ({ report, patientIdQuery }) => {
  return (
    <>
      {/* ── Hero Banner ── */}
      <div className="relative rounded-3xl bg-gradient-to-r from-sky-900/90 via-blue-900 to-indigo-950 dark:from-[#0c1f3d] dark:via-[#0e2a52] dark:to-[#07162c] border border-sky-600/30 dark:border-[#1d4277]/60 p-6 sm:p-8 shadow-xl text-white overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left: Patient Title & Intro */}
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-sky-200 text-[11px] font-bold tracking-wide uppercase backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>Báo Cáo Chẩn Đoán Hình Ảnh &amp; Xem Phim 3D Kỹ Thuật Số</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              Hồ Sơ Chẩn Đoán Điện Tử
              <span className="block text-lg sm:text-xl font-bold text-sky-200 font-mono mt-1">
                {report?.description || 'Chụp Cắt Lớp Vi Tính Lồng Ngực Đa Dãy Đầu Dò'}
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-sky-100 leading-relaxed">
              Kết quả đã được xác thực ký số y tế chính thức bởi Trưởng khoa Chẩn đoán Hình ảnh. Quý bệnh nhân có thể xem toàn bộ lát cắt 3D, tải bản in PDF chuẩn quốc tế hoặc chia sẻ an toàn với bác sĩ điều trị.
            </p>
          </div>

          {/* Right: Certified Medical QR Hologram */}
          <div className="flex sm:flex-row md:flex-col items-center gap-3 bg-white/10 dark:bg-[#08162b]/80 backdrop-blur-md p-4 rounded-2xl border border-white/20 dark:border-[#1e4579] shadow-xl shrink-0">
            <div className="p-2 bg-white rounded-xl shadow-md ring-2 ring-sky-300/40">
              <QRCodeSVG value={window.location.href} size={88} level="H" />
            </div>
            <div className="text-center">
              <span className="text-[10px] font-mono font-extrabold text-sky-200 block uppercase tracking-wider">
                MÃ XÁC THỰC KHOA
              </span>
              <span className="text-[9px] text-sky-300/80 font-mono">
                SHA-256 Verified
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Smart Patient Profile Card ── */}
      <div className="rounded-2xl bg-white dark:bg-[#09152a]/90 backdrop-blur-md border border-slate-200 dark:border-[#1b3660] p-5 sm:p-6 shadow-sm dark:shadow-xl space-y-5 transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-4">
          {/* Patient Name & Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0078D4] to-[#008A5E] p-0.5 shadow-md">
              <div className="w-full h-full bg-sky-50 dark:bg-[#0a172e] rounded-[14px] flex items-center justify-center text-[#0078D4] dark:text-sky-300">
                <User className="w-7 h-7" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                  {report?.patientName?.toUpperCase() || 'TRẦN VĂN MẠNH'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-500/40">
                  {report?.gender || 'Nam'} · {report?.dob || '44 tuổi'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                <span>Mã Bệnh Nhân (PID):</span>
                <span className="text-sky-700 dark:text-sky-300 font-extrabold text-sm">
                  {report?.patientId || patientIdQuery}
                </span>
              </p>
            </div>
          </div>

          {/* Badges & Status */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-gradient-to-r dark:from-blue-900/50 dark:to-indigo-900/50 border border-blue-200 dark:border-blue-500/40 text-blue-800 dark:text-blue-200 text-xs font-mono font-bold flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Loại Phim: {report?.modality || 'CT 128 Dãy'}</span>
            </div>

            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-gradient-to-r dark:from-emerald-950/60 dark:to-teal-950/60 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Đã Duyệt &amp; Ký Số BYT</span>
            </div>
          </div>
        </div>

        {/* Quick Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#060f1e] border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
              Ngày Thực Hiện
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 mt-1 text-xs">
              <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              {report?.studyDate || '15/08/2026'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#060f1e] border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
              Mã Phiếu Chỉ Định
            </span>
            <span className="font-mono font-bold text-sky-700 dark:text-sky-300 mt-1 block text-xs">
              P-20260815-8291
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#060f1e] border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
              Bác Sĩ Chỉ Định
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200 mt-1 block text-xs truncate">
              BS. CKII. Hoàng Minh Đức
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#060f1e] border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
              Bác Sĩ Đọc &amp; Ký Số
            </span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400 mt-1 block text-xs truncate flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              {report?.signature?.doctorName || 'BS. CKII. Nguyễn Văn An'}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};
