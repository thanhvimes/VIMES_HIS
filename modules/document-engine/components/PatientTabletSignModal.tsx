import React, { useRef, useState, useEffect } from 'react';
import { X, RotateCcw, CheckCircle2, Smartphone, AlertCircle } from 'lucide-react';

interface PatientTabletSignModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentName: string;
  patientName: string;
  patientId: string;
  onSignedSuccess: (signature: any) => void;
}

export const PatientTabletSignModal: React.FC<PatientTabletSignModalProps> = ({
  isOpen,
  onClose,
  documentId,
  documentName,
  patientName,
  patientId,
  onSignedSuccess,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signerRole, setSignerRole] = useState('NGƯỜI BỆNH (KÝ CẢM ỨNG)');
  const [guardianName, setGuardianName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        initCanvas();
      }, 100);
    }
  }, [isOpen]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set display resolution
    canvas.width = canvas.parentElement?.clientWidth || 500;
    canvas.height = 220;

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    initCanvas();
  };

  const handleSubmit = async () => {
    if (!hasDrawn) {
      alert('Vui lòng ký tên trên màn hình cảm ứng trước khi xác nhận.');
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    const signatureImageBase64 = canvas.toDataURL('image/png');
    const finalSignerName = signerRole.includes('ĐẠI DIỆN') && guardianName.trim()
      ? `${guardianName.trim()} (Đại diện cho ${patientName})`
      : patientName;

    setSubmitting(true);
    try {
      const response = await fetch('/api/v1/emr/documents/patient-touch-sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          patientName: finalSignerName,
          signerRole,
          signatureImageBase64,
        }),
      });
      const data = await response.json();
      if (data.success) {
        onSignedSuccess(data.data.signature);
        onClose();
      } else {
        alert(data.error || 'Có lỗi xảy ra khi lưu chữ ký cảm ứng.');
      }
    } catch (err: any) {
      alert('Lỗi kết nối máy chủ khi lưu chữ ký: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-[#0d1829] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-teal-600 to-emerald-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight">Ký Cảm Ứng Bệnh Nhân / Người Nhà (Tablet Sign)</h3>
              <p className="text-[11px] text-teal-100">Ký xác nhận cam kết y tế & chấp thuận phẫu thuật/thủ thuật</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Patient summary badge */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Bệnh nhân:</span>
              <p className="font-extrabold text-slate-900 dark:text-white text-sm">{patientName}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Mã tài liệu:</span>
              <p className="font-mono font-bold text-teal-600 dark:text-teal-400">{patientId}</p>
            </div>
          </div>

          {/* Signer selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Người ký cam đoan:
              </label>
              <select
                value={signerRole}
                onChange={(e) => setSignerRole(e.target.value)}
                className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              >
                <option value="NGƯỜI BỆNH (KÝ CẢM ỨNG)">Chính bệnh nhân ký</option>
                <option value="NGƯỜI ĐẠI DIỆN HỢP PHÁP">Người nhà / Đại diện ký thay</option>
                <option value="NGƯỜI GIÁM HỘ">Người giám hộ (Trẻ em &lt; 18T)</option>
              </select>
            </div>
            {signerRole !== 'NGƯỜI BỆNH (KÝ CẢM ỨNG)' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Họ tên người đại diện ký thay:
                </label>
                <input
                  type="text"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  placeholder="Ví dụ: Trần Thị Hồng (Vợ)"
                  className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                />
              </div>
            )}
          </div>

          {/* Touch Canvas */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Ký tên vào khung bên dưới bằng ngón tay hoặc bút cảm ứng:
              </span>
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center gap-1 text-slate-500 hover:text-rose-600 font-bold transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Ký lại
              </button>
            </div>

            <div className="w-full rounded-xl border-2 border-dashed border-teal-500/40 dark:border-teal-500/30 overflow-hidden bg-slate-50 dark:bg-slate-900 relative touch-none shadow-inner">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full cursor-crosshair block"
              />
              {!hasDrawn && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs italic font-medium">
                  ✍️ Chạm hoặc vẽ chữ ký tại đây...
                </div>
              )}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>Chữ ký cảm ứng sẽ được nhúng trực tiếp vào file PDF trước khi Bác sĩ ký số niêm phong.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !hasDrawn}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-black shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{submitting ? 'Đang lưu chữ ký...' : 'Xác Nhận & Nhúng Chữ Ký'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
