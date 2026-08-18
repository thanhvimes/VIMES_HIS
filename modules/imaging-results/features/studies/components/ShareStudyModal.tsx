import React from 'react';
import { X, Copy } from 'lucide-react';

interface ShareStudyModalProps {
  shareStudyUid: string | null;
  shareUrl: string | null;
  copied: boolean;
  onClose: () => void;
  onCopyUrl: () => void;
}

export const ShareStudyModal: React.FC<ShareStudyModalProps> = ({
  shareStudyUid,
  shareUrl,
  copied,
  onClose,
  onCopyUrl
}) => {
  if (!shareStudyUid || !shareUrl) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
          <h3 className="text-base font-bold text-slate-800 dark:text-white">Link Chia Sẻ Hình Ảnh</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
          <p className="text-xs text-slate-600 dark:text-slate-300 font-mono flex-1 break-all">{shareUrl}</p>
          <button
            onClick={onCopyUrl}
            className={`p-2 rounded-lg transition cursor-pointer ${
              copied
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200'
            }`}
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[11px] text-slate-400 text-center">
          Link có hiệu lực 7 ngày.{' '}
          {copied && <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Đã sao chép!</span>}
        </p>
      </div>
    </div>
  );
};
