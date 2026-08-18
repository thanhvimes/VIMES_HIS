import React from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

interface DigitalSignatureCertProps {
  studyUid: string;
}

export const DigitalSignatureCert: React.FC<DigitalSignatureCertProps> = ({ studyUid }) => {
  return (
    <div className="rounded-3xl bg-white dark:bg-[#09152a] border border-slate-200 dark:border-[#1b3660] p-6 sm:p-8 shadow-sm dark:shadow-2xl space-y-6 animate-fade-in transition-colors">
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            Chứng Thư Pháp Lý &amp; Toàn Vẹn Bệnh Án
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tiêu chuẩn Ký số Bệnh án Điện tử Thông tư 46/2018/TT-BYT &amp; Nghị định 13/2023/NĐ-CP
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#060e1c] border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold block">
            Tổ chức chứng thực (CA Provider)
          </span>
          <p className="text-slate-900 dark:text-white font-bold text-sm">VNPT-CA / Viettel-CA Medical Root</p>
          <p className="text-slate-500 dark:text-slate-400 text-[11px]">
            Thuật toán mã hóa: RSA 2048-bit / SHA-256 with PAdES-B-LTA
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#060e1c] border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold block">
            Mã định danh ca chụp (Study UID)
          </span>
          <p className="text-sky-700 dark:text-sky-300 font-bold text-xs break-all">{studyUid}</p>
          <p className="text-emerald-700 dark:text-emerald-400 text-[11px]">
            Trạng thái: Toàn vẹn không bị sửa đổi (Untampered)
          </p>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-500/30 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">
            Báo cáo chẩn đoán này có đầy đủ giá trị pháp lý tương đương văn bản giấy.
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
            Bệnh nhân có thể sử dụng kết quả này trực tiếp để thanh toán Bảo hiểm Y tế, Bảo hiểm nhân thọ tư nhân hoặc chuyển tuyến bệnh viện.
          </p>
        </div>
      </div>
    </div>
  );
};
