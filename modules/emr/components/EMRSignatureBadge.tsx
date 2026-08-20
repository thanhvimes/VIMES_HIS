import React, { useState } from 'react';
import { DigitalSignatureInfo } from '../types';
import { CheckCircle2, ShieldCheck, Clock, Award, KeyRound, ChevronDown, ChevronUp } from 'lucide-react';

interface EMRSignatureBadgeProps {
  signature?: DigitalSignatureInfo;
  signaturesCollected?: DigitalSignatureInfo[];
}

export const EMRSignatureBadge: React.FC<EMRSignatureBadgeProps> = ({
  signature,
  signaturesCollected,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const sigs = signaturesCollected && signaturesCollected.length > 0 
    ? signaturesCollected 
    : signature ? [signature] : [];

  if (sigs.length === 0) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
        <Clock className="w-3.5 h-3.5 text-slate-400" />
        <span>Chưa ký số điện tử</span>
      </div>
    );
  }

  return (
    <div className="inline-block">
      <button
        type="button"
        onClick={() => setShowDetails(!showDetails)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs"
      >
        <div className="flex items-center gap-1">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Đã ký số ({sigs.length} chữ ký hợp lệ)</span>
        </div>
        {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {showDetails && (
        <div className="mt-2 p-3 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/80 rounded-xl shadow-lg text-xs space-y-3 min-w-[320px] animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-600" /> Chứng thư số Y tế
            </span>
            <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono">
              SHA-256 TSA
            </span>
          </div>

          <div className="space-y-2.5">
            {sigs.map((sig, idx) => (
              <div key={sig.signatureId || idx} className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-1.5 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100">{sig.signerName}</span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Hợp lệ
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">{sig.signerTitle} ({sig.signerRole})</p>
                <div className="text-[10px] text-slate-400 font-mono space-y-0.5 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                  <p>Thời gian ký: <span className="text-slate-700 dark:text-slate-300">{sig.signedAt}</span></p>
                  <p>Nhà cấp CA: <span className="text-slate-700 dark:text-slate-300">{sig.certificateIssuer}</span></p>
                  <p className="truncate">Số seri chứng thư: <span className="text-slate-700 dark:text-slate-300">{sig.certificateSerialNumber}</span></p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-[10px] text-slate-400 text-center italic">
            Xác thực toàn vẹn theo chuẩn chữ ký số Bộ Y Tế & Ban Cơ yếu Chính phủ
          </div>
        </div>
      )}
    </div>
  );
};
