import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  QrCode,
  Copy,
  Check,
  Download,
  Printer,
  Smartphone,
  ShieldCheck,
  Share2,
  ExternalLink
} from 'lucide-react';

export interface PatientQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  studyId: string;
  patientName: string;
  patientId: string;
  modality: string;
  studyDate: string;
}

export const PatientQrModal: React.FC<PatientQrModalProps> = ({
  isOpen,
  onClose,
  studyId,
  patientName,
  patientId,
  modality,
  studyDate,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  // Xây dựng link tra cứu trực tiếp theo Host hiện tại của Bệnh viện
  const portalUrl = `${window.location.protocol}//${window.location.host}/portal/study/${encodeURIComponent(studyId)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadQr = () => {
    const svgElement = document.getElementById('patient-qr-code-svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `QR_PACS_${patientId}_${modality}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-[#0f172a] border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white">Mã QR Tra Cứu Phim Số Trực Tuyến</h2>
              <p className="text-[11px] text-slate-400">Quét mã bằng Camera điện thoại hoặc Zalo để xem phim</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          {/* Patient Header Badge */}
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
            <div>
              <p className="font-extrabold text-white text-sm">{patientName}</p>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Mã BN: <strong className="text-blue-400">{patientId}</strong> • Loại: <strong className="text-emerald-400">{modality}</strong>
              </p>
            </div>
            <span className="text-[11px] font-mono px-2 py-1 rounded bg-slate-800 text-slate-300">
              {studyDate}
            </span>
          </div>

          {/* QR Code Frame */}
          <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-inner border-4 border-blue-500/20 max-w-[260px] mx-auto">
            <QRCodeSVG
              id="patient-qr-code-svg"
              value={portalUrl}
              size={200}
              level="H"
              includeMargin={false}
            />
            <p className="mt-3 text-[10px] font-bold text-slate-800 uppercase tracking-wider text-center">
              VIMES SMART MEDICAL PACS
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-slate-300 font-medium">Xem phim động trên iOS / Android</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="text-slate-300 font-medium">Bảo mật mã hóa theo TT 54/BYT</span>
            </div>
          </div>

          {/* Direct Link Input */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-400">
              Liên Kết Trực Tiếp Cho Bệnh Nhân / Bác Sĩ Tuyến Trên
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={portalUrl}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã Chép' : 'Sao Chép'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <button
            onClick={() => window.open(portalUrl, '_blank')}
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-bold transition cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Mở Cổng Trực Tuyến</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadQr}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer border border-slate-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải Ảnh QR</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
