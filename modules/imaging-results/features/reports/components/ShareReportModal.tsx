import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy } from 'lucide-react';

interface ShareReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  studyInstanceUid: string;
  patientId: string;
  patientName: string;
}

export const ShareReportModal: React.FC<ShareReportModalProps> = ({
  isOpen,
  onClose,
  studyInstanceUid,
  patientId,
  patientName
}) => {
  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}/portal/view?studyUid=${studyInstanceUid}&patientId=${patientId}`;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0a162b] border border-slate-200 dark:border-[#1b3762] text-slate-900 dark:text-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 text-center">
        <h3 className="text-base font-black">Mã QR Cổng Tra Cứu Bệnh Nhân</h3>
        <p className="text-xs text-slate-600 dark:text-slate-300">
          Quét mã QR dưới đây bằng điện thoại để mở cổng xem kết quả và phim 3D cho bệnh nhân <b className="text-slate-900 dark:text-white uppercase font-extrabold">{patientName?.toUpperCase()}</b>.
        </p>
        
        <div className="p-4 bg-white rounded-2xl w-48 h-48 mx-auto flex items-center justify-center shadow-lg border border-slate-200">
          <QRCodeSVG value={shareUrl} size={160} />
        </div>

        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(shareUrl);
              alert('Đã sao chép link tra cứu!');
            }}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition"
          >
            <Copy className="w-4 h-4" />
            <span>Sao Chép Link</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 text-xs font-bold cursor-pointer transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
