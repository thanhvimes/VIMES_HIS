import React, { useState, useRef, useEffect } from 'react';
import { SignaturePlaceholder } from './PdfSignaturePlacement';

export interface SignerProfile {
  name: string;
  role: string;
  department: string;
  title: string;
  certificateSubject: string;
  certificateSerial: string;
  issuer: string;
  validUntil: string;
}

const signerProfiles: Record<string, SignerProfile> = {
  DOCTOR: {
    name: 'BS. CKII NGUYỄN VĂN AN',
    role: 'Bác sĩ phẫu thuật chính',
    department: 'Khoa Phẫu thuật - Gây mê hồi sức',
    title: 'Phẫu thuật viên chính / Trưởng kíp mổ',
    certificateSubject: 'CN=BS. CKII NGUYỄN VĂN AN, OU=Khoa PT-GMHS, O=BỆNH VIỆN ĐA KHOA VIMES, C=VN',
    certificateSerial: '54:02:AE:89:1B:33:F9:04:88',
    issuer: 'VNPT-CA Global Qualified Root CA',
    validUntil: '31/12/2028'
  },
  PATIENT: {
    name: 'HOÀNG MINH TRÍ',
    role: 'Người bệnh / Đại diện gia đình',
    department: 'Ngoại tổng quát',
    title: 'Người bệnh (Đại diện: NGUYỄN THỊ MAI - Vợ)',
    certificateSubject: 'CN=HOÀNG MINH TRÍ, O=Personal Citizen ID: 001088019988, C=VN',
    certificateSerial: '77:31:BC:44:09:88:12:FA:11',
    issuer: 'Viettel-CA Citizen Identity Sign',
    validUntil: '20/10/2030'
  }
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  placeholder: SignaturePlaceholder | null;
  documentId: string;
  documentTitle?: string;
  documentHash: string;
  onConfirmSign: (data: {
    placeholderId: number;
    signerRole: string;
    signerName: string;
    signMethod: 'USB_TOKEN' | 'SMART_CA' | 'ELECTRONIC_DRAW' | 'SERVER_HSM';
    certificateSerial: string;
    signatureImage?: string;
    pinOrOtp: string;
  }) => Promise<void>;
}

export const SignatureActionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  placeholder,
  documentId,
  documentTitle = 'Giấy cam đoan chấp nhận phẫu thuật, thủ thuật và điều trị (SURGERY_CONSENT)',
  documentHash,
  onConfirmSign
}) => {
  const [signMethod, setSignMethod] = useState<'USB_TOKEN' | 'SMART_CA' | 'ELECTRONIC_DRAW' | 'SERVER_HSM'>('USB_TOKEN');
  const [pin, setPin] = useState('123456');
  const [otp, setOtp] = useState('889966');
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState('');
  
  // Canvas for drawing signature
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const role = placeholder?.signerRole || 'DOCTOR';
  const profile = signerProfiles[role] || signerProfiles.DOCTOR;

  useEffect(() => {
    if (isOpen) {
      setError('');
      setIsSigning(false);
      setHasDrawn(false);
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          ctx.strokeStyle = '#1e3a8a';
        }
      }
    }
  }, [isOpen, placeholder]);

  if (!isOpen || !placeholder) return null;

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDraw = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawn(false);
    }
  };

  const handleSign = async () => {
    if (signMethod === 'USB_TOKEN' && !pin) {
      setError('Vui lòng nhập mã PIN USB Token');
      return;
    }
    if (signMethod === 'SMART_CA' && !otp) {
      setError('Vui lòng nhập mã OTP xác thực SmartCA');
      return;
    }

    setIsSigning(true);
    setError('');

    try {
      let signatureImage = '';
      if (signMethod === 'ELECTRONIC_DRAW' && canvasRef.current && hasDrawn) {
        signatureImage = canvasRef.current.toDataURL('image/png');
      }

      await onConfirmSign({
        placeholderId: placeholder.id,
        signerRole: role,
        signerName: profile.name,
        signMethod,
        certificateSerial: profile.certificateSerial,
        signatureImage,
        pinOrOtp: signMethod === 'USB_TOKEN' ? pin : otp
      });

      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Ký số thất bại. Vui lòng thử lại.');
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <span className="text-xl">🖋️</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Xác thực & Ký số Văn bản Y tế
              </h2>
              <p className="text-xs text-slate-500">
                Vị trí ô ký: <span className="font-semibold text-blue-600 dark:text-blue-400">{placeholder.code}</span> ({role === 'DOCTOR' ? 'Bác sĩ phẫu thuật' : 'Bệnh nhân / Thân nhân'})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSigning}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              <strong>Lỗi:</strong> {error}
            </div>
          )}

          {/* Signer & Document Summary Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-800/40">
            <div>
              <span className="text-slate-500">Người ký xác thực:</span>
              <div className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-0.5">{profile.name}</div>
              <div className="text-slate-600 dark:text-slate-400">{profile.title}</div>
              <div className="text-slate-500 text-[11px] mt-1">Đơn vị: {profile.department}</div>
            </div>
            <div className="border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-700 md:pl-3 pt-2 md:pt-0">
              <span className="text-slate-500">Văn bản ký số:</span>
              <div className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 mt-0.5">{documentTitle}</div>
              <div className="font-mono text-[10px] text-slate-500 truncate mt-1">Mã: {documentId}</div>
              <div className="font-mono text-[10px] text-slate-500 truncate">SHA-256: {documentHash ? `${documentHash.slice(0, 20)}...` : 'Tự động băm khi ký'}</div>
            </div>
          </div>

          {/* Signature Method Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Chọn phương thức Ký số:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setSignMethod('USB_TOKEN')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  signMethod === 'USB_TOKEN'
                    ? 'border-blue-600 bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 font-bold shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="text-xl mb-1">🔑</span>
                <span className="text-xs">USB Token PKI</span>
              </button>

              <button
                type="button"
                onClick={() => setSignMethod('SMART_CA')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  signMethod === 'SMART_CA'
                    ? 'border-blue-600 bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 font-bold shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="text-xl mb-1">☁️</span>
                <span className="text-xs">SmartCA Cloud</span>
              </button>

              <button
                type="button"
                onClick={() => setSignMethod('ELECTRONIC_DRAW')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  signMethod === 'ELECTRONIC_DRAW'
                    ? 'border-blue-600 bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 font-bold shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="text-xl mb-1">✍️</span>
                <span className="text-xs">Ký vẽ trực tiếp</span>
              </button>

              <button
                type="button"
                onClick={() => setSignMethod('SERVER_HSM')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  signMethod === 'SERVER_HSM'
                    ? 'border-blue-600 bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 font-bold shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="text-xl mb-1">⚡</span>
                <span className="text-xs">HSM Server-side</span>
              </button>
            </div>
          </div>

          {/* Details based on method */}
          {signMethod === 'USB_TOKEN' && (
            <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/40 p-4 dark:border-blue-900/50 dark:bg-blue-950/20 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Chứng thư số tìm thấy trên Token:</span>
                <span className="rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 font-semibold text-[10px]">🟢 Đã nhận diện</span>
              </div>
              <div className="font-mono bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
                <div><strong>Subject:</strong> {profile.certificateSubject}</div>
                <div><strong>Issuer:</strong> {profile.issuer}</div>
                <div><strong>Serial:</strong> {profile.certificateSerial}</div>
                <div><strong>Thời hạn:</strong> đến {profile.validUntil}</div>
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Mã PIN USB Token:</label>
                <input
                  type="password"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  placeholder="Nhập mã PIN Token..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {signMethod === 'SMART_CA' && (
            <div className="space-y-3 rounded-xl border border-purple-100 bg-purple-50/40 p-4 dark:border-purple-900/50 dark:bg-purple-950/20 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Ký số từ xa (Remote Signing VNPT/Viettel SmartCA):</span>
                <span className="rounded bg-purple-100 text-purple-800 px-2 py-0.5 font-semibold text-[10px]">📱 App SmartCA</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                Thông báo ký số đã được gửi tới thiết bị di động đã đăng ký của <strong>{profile.name}</strong>. Vui lòng xác nhận trên App hoặc nhập mã xác thực OTP.
              </p>
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Mã OTP xác nhận ký số:</label>
                <input
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  placeholder="Nhập mã OTP 6 chữ số..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tracking-widest text-center bg-white dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          )}

          {signMethod === 'ELECTRONIC_DRAW' && (
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Vẽ chữ ký trực tiếp bằng chuột hoặc bút cảm ứng:</span>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="text-xs text-rose-600 hover:underline font-semibold"
                >
                  Xóa vẽ lại
                </button>
              </div>
              <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white dark:bg-slate-900 dark:border-slate-700 flex items-center justify-center p-1">
                <canvas
                  ref={canvasRef}
                  width={520}
                  height={130}
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={stopDraw}
                  onMouseLeave={stopDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={stopDraw}
                  className="w-full h-[130px] cursor-crosshair touch-none"
                />
              </div>
              <p className="text-[11px] text-slate-500 text-center">
                {hasDrawn ? '✅ Đã ghi nhận mẫu chữ ký' : 'Dùng chuột hoặc màn hình cảm ứng để ký vào khung trên.'}
              </p>
            </div>
          )}

          {signMethod === 'SERVER_HSM' && (
            <div className="space-y-2 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Chữ ký số Tổ chức & HSM Tập trung:</span>
                <span className="rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 font-semibold text-[10px]">🔒 HSM Level 3</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                Chữ ký số sẽ được ký tự động qua HSM chuyên dụng của Bệnh viện Đa khoa VIMES, kèm chứng thư số tổ chức và Dấu thời gian chuẩn quốc tế RFC 3161 (TSA).
              </p>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/60">
          <button
            type="button"
            onClick={onClose}
            disabled={isSigning}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Hủy bỏ
          </button>
          
          <button
            type="button"
            onClick={handleSign}
            disabled={isSigning}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 disabled:opacity-50"
          >
            {isSigning ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                <span>Đang xử lý ký số...</span>
              </>
            ) : (
              <>
                <span>🚀 Xác nhận Ký số</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
