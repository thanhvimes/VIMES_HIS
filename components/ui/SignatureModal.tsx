import React, { useRef, useEffect, useState, useCallback } from 'react';
import SignaturePad from 'signature_pad';
import { XIcon, CheckCircleIcon } from '../Icons';
import { useSession } from '../../contexts/SessionContext';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dataUrl: string, signerName: string, signerTitle: string) => void;
}

const PEN_COLORS = [
  { label: 'Xanh đậm', value: '#1e3a8a' },
  { label: 'Đen', value: '#0f172a' },
  { label: 'Xanh lam', value: '#2563eb' },
  { label: 'Đỏ', value: '#dc2626' },
  { label: 'Tím', value: '#7c3aed' },
];

const SIGNATURE_FONTS = [
  { name: 'Dancing Script', family: '"Dancing Script", cursive' },
  { name: 'Alex Brush', family: '"Alex Brush", cursive' },
  { name: 'Great Vibes', family: '"Great Vibes", cursive' },
  { name: 'Pacifico', family: '"Pacifico", cursive' },
  { name: 'Playball', family: '"Playball", cursive' },
];

const SignatureModal: React.FC<SignatureModalProps> = ({ isOpen, onClose, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const [isShowing, setIsShowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'draw' | 'type'>('draw');
  const [typedText, setTypedText] = useState('');
  const [penColor, setPenColor] = useState('#1e3a8a');
  const [penWidth, setPenWidth] = useState(2.8);
  const [selectedFont, setSelectedFont] = useState(SIGNATURE_FONTS[0].family);
  const [isEmpty, setIsEmpty] = useState(true);
  const [hasError, setHasError] = useState(false);

  const { user } = useSession();
  const signerName = user?.fullName || user?.username || 'Người dùng';
  const signerTitle = (user as any)?.title || 'Nhân viên y tế';
  const signerUsername = user?.username || 'user';

  // Load Google Fonts for typed signatures
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Alex+Brush&family=Dancing+Script:wght@400;700&family=Great+Vibes&family=Pacifico&family=Playball&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsShowing(true);
      setHasError(false);
      setIsEmpty(true);
      setTypedText(signerName); // Prefill with logged-in user name
    } else {
      setIsShowing(false);
    }
  }, [isOpen, signerName]);

  const initPad = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(ratio, ratio);

    if (signaturePadRef.current) {
      signaturePadRef.current.off();
    }
    signaturePadRef.current = new SignaturePad(canvas, {
      backgroundColor: 'rgba(0,0,0,0)',
      penColor: penColor,
      minWidth: penWidth * 0.6,
      maxWidth: penWidth * 1.4,
    });
    signaturePadRef.current.addEventListener('endStroke', () => {
      setIsEmpty(signaturePadRef.current?.isEmpty() ?? true);
    });
    setIsEmpty(true);
  }, [penColor, penWidth]);

  useEffect(() => {
    if (isShowing && activeTab === 'draw') {
      const timer = setTimeout(() => {
        initPad();
      }, 320);
      return () => {
        clearTimeout(timer);
        signaturePadRef.current?.off();
        signaturePadRef.current = null;
      };
    }
  }, [isShowing, activeTab, initPad]);

  // Update pen settings live
  useEffect(() => {
    if (signaturePadRef.current) {
      signaturePadRef.current.penColor = penColor;
      signaturePadRef.current.minWidth = penWidth * 0.6;
      signaturePadRef.current.maxWidth = penWidth * 1.4;
    }
  }, [penColor, penWidth]);

  const handleClear = () => {
    signaturePadRef.current?.clear();
    setIsEmpty(true);
    setHasError(false);
  };

  const handleSave = () => {
    if (activeTab === 'draw') {
      if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
        setHasError(true);
        return;
      }
      const dataUrl = signaturePadRef.current.toDataURL('image/png');
      onSave(dataUrl, signerName, signerTitle);
    } else {
      if (!typedText.trim()) {
        setHasError(true);
        return;
      }
      // Render typed signature to canvas
      const offscreen = document.createElement('canvas');
      offscreen.width = 600;
      offscreen.height = 200;
      const ctx = offscreen.getContext('2d')!;
      ctx.clearRect(0, 0, offscreen.width, offscreen.height);
      ctx.font = `italic 72px ${selectedFont}`;
      ctx.fillStyle = penColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(typedText, offscreen.width / 2, offscreen.height / 2);
      onSave(offscreen.toDataURL('image/png'), signerName, signerTitle);
    }
  };

  const handleClose = () => {
    setIsShowing(false);
    setTimeout(onClose, 300);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-[3000] flex items-center justify-center p-4 transition-all duration-300 ${isShowing ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/0 pointer-events-none'}`}
      onClick={handleClose}
    >
      <style>{`
        .signature-grid-bg {
          background-size: 14px 14px;
          background-image: radial-gradient(circle, rgba(148, 163, 184, 0.2) 1px, transparent 1px);
        }
        .dark .signature-grid-bg {
          background-image: radial-gradient(circle, rgba(71, 85, 105, 0.3) 1px, transparent 1px);
        }
      `}</style>
      <div
        className={`bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col border border-slate-200 dark:border-slate-700/60 transition-all duration-300 ${isShowing ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-900/40 flex items-center justify-center">
              <svg className="w-5 h-5 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-sm leading-tight">Ký tên điện tử</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 inline-block"></span>
                <span className="font-semibold text-slate-750 dark:text-slate-350">{signerName}</span>
                <span className="text-slate-400 dark:text-slate-550">({signerUsername})</span>
                {signerTitle && <span className="text-slate-455 dark:text-slate-500">· {signerTitle}</span>}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex mx-5 mt-4 gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg">
          {(['draw', 'type'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setHasError(false); }}
              className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              {tab === 'draw' ? '✏️ Vẽ chữ ký' : '🔡 Nhập tên'}
            </button>
          ))}
        </div>

        {/* Canvas / Type area */}
        <div className="px-5 pt-4 pb-2">
          {activeTab === 'draw' ? (
            <div className={`relative rounded-xl border-2 transition-colors ${hasError ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-750'} bg-white dark:bg-slate-950 overflow-hidden signature-grid-bg`}>
              {/* Ruled line */}
              <div className="absolute bottom-[30%] left-6 right-6 h-px border-t border-dashed border-slate-300 dark:border-slate-800 pointer-events-none" />
              <canvas
                ref={canvasRef}
                className="w-full h-44 cursor-crosshair touch-none relative z-10"
              />
              {isEmpty && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-0">
                  <svg className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M6.5 21H3v-3.5l11.5-11.5 3.5 3.5L6.5 21z" />
                  </svg>
                  <p className="text-xs text-slate-350 dark:text-slate-600 font-medium">Vẽ chữ ký của bạn tại đây</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className={`rounded-xl border-2 transition-colors ${hasError ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-750'} bg-white dark:bg-slate-950 overflow-hidden`}>
                <input
                  type="text"
                  value={typedText}
                  onChange={(e) => { setTypedText(e.target.value); setHasError(false); }}
                  placeholder={signerName}
                  className="w-full h-32 px-6 bg-transparent text-center outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700"
                  style={{
                    fontFamily: selectedFont,
                    fontSize: '44px',
                    color: penColor,
                    letterSpacing: '0.5px',
                  }}
                />
              </div>

              {/* Font picker */}
              <div className="flex flex-col gap-1.5 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-100 dark:border-slate-805/50">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Kiểu chữ nghệ thuật</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SIGNATURE_FONTS.map((font) => (
                    <button
                      key={font.family}
                      onClick={() => setSelectedFont(font.family)}
                      className={`px-2 py-1.5 rounded-lg border text-sm text-center truncate transition-all active:scale-95 ${
                        selectedFont === font.family
                          ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 font-semibold shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                      style={{ fontFamily: font.family }}
                    >
                      {typedText || signerName || 'Chữ ký'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {hasError && (
            <p className="text-xs text-red-500 mt-1.5 text-center">
              {activeTab === 'draw' ? 'Vui lòng vẽ chữ ký trước khi xác nhận.' : 'Vui lòng nhập tên để tạo chữ ký.'}
            </p>
          )}

          {/* Pen settings */}
          <div className="flex items-center justify-between mt-3.5 px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Nét bút</span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-700/60">
                {[
                  { label: 'Mảnh', width: 1.6 },
                  { label: 'Vừa', width: 2.8 },
                  { label: 'Đậm', width: 4.5 },
                ].map((w) => (
                  <button
                    key={w.width}
                    onClick={() => setPenWidth(w.width)}
                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                      penWidth === w.width
                        ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
                        : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Màu mực</span>
              <div className="flex gap-1.5">
                {PEN_COLORS.map((c) => (
                  <button
                    key={c.value}
                    title={c.label}
                    onClick={() => setPenColor(c.value)}
                    className={`w-5 h-5 rounded-full border transition-all hover:scale-110 active:scale-95 ${
                      penColor === c.value ? 'border-teal-500 scale-110 shadow-sm ring-1 ring-teal-500/20' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 pt-3 pb-5 mt-2 border-t border-slate-50 dark:border-slate-805/40">
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors font-semibold"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Xóa
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold shadow-lg shadow-teal-900/20 transition-all active:scale-95"
          >
            <CheckCircleIcon className="w-4 h-4" />
            Xác nhận chữ ký
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignatureModal;