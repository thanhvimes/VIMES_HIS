import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Layout, Image as ImageIcon, Check, SlidersHorizontal } from 'lucide-react';
import { HospitalLogo, BRANDING, useCompanyInfo } from '../../../config/branding';
import { getMediaUrl } from '../../../services/api';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  studyInstanceUid: string;
  patientId: string;
  patientName: string;
  modality: string;
  studyDate: string;
  findings: string;
  impression: string;
  recommendation: string;
  readingDoctor: string;
  keyImages?: Array<{ url: string; title?: string; orderIndex?: number }>;
}

type PrintLayoutType = 'auto' | '2_images' | '4_images' | '6_images' | 'text_only';

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  studyInstanceUid,
  patientId,
  patientName,
  modality,
  studyDate,
  findings,
  impression,
  recommendation,
  readingDoctor,
  keyImages = []
}) => {
  const [layoutMode, setLayoutMode] = useState<PrintLayoutType>('auto');
  const company = useCompanyInfo();

  if (!isOpen) return null;

  // Determine effective image count based on layoutMode and available keyImages
  let effectiveImages = [...keyImages];
  if (layoutMode === 'text_only') {
    effectiveImages = [];
  } else if (layoutMode === '2_images') {
    effectiveImages = effectiveImages.slice(0, 2);
  } else if (layoutMode === '4_images') {
    effectiveImages = effectiveImages.slice(0, 4);
  } else if (layoutMode === '6_images') {
    effectiveImages = effectiveImages.slice(0, 6);
  } else if (layoutMode === 'auto') {
    // If ultrasound / endoscopy with images, auto show up to 4
    if (modality === 'US' || modality === 'ES' || modality === 'Nội soi' || modality === 'Siêu âm') {
      effectiveImages = effectiveImages.slice(0, effectiveImages.length >= 4 ? 4 : 2);
    }
  }

  const hasImages = effectiveImages.length > 0;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white text-slate-900 w-full max-w-4xl rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 max-h-[92vh] flex flex-col">
        
        {/* Top Controls (Hidden in Print) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 no-print">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-sky-600" />
            <span className="text-xs font-bold text-slate-700">Mẫu Bố Cục In:</span>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setLayoutMode('auto')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  layoutMode === 'auto'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tự Động ({effectiveImages.length} ảnh)
              </button>

              <button
                onClick={() => setLayoutMode('2_images')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  layoutMode === '2_images'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2 Ảnh
              </button>

              <button
                onClick={() => setLayoutMode('4_images')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  layoutMode === '4_images'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                4 Ảnh (Lưới 2x2)
              </button>

              <button
                onClick={() => setLayoutMode('6_images')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  layoutMode === '6_images'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                6 Ảnh
              </button>

              <button
                onClick={() => setLayoutMode('text_only')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  layoutMode === 'text_only'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Chỉ Chữ (0 ảnh)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md flex items-center gap-2 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>In Phiếu Ngay</span>
            </button>

            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>

        {/* ── A4 PAPER CONTAINER ── */}
        <div className="flex-1 overflow-y-auto bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-inner space-y-4 print-container">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <HospitalLogo className="w-12 h-12" />
              <div>
                <h3 className="text-sm font-black uppercase text-slate-900 tracking-wide">
                  {company.name || BRANDING.hospitalName}
                </h3>
                <p className="text-[11px] text-slate-600 font-bold">
                  KHOA CHẨN ĐOÁN HÌNH ẢNH — PHÒNG ĐỌC KẾT QUẢ KTS
                </p>
                <p className="text-[10px] text-slate-500">
                  Địa chỉ: 120 Hoàng Hoa Thám, P.7, Q.Bình Thạnh, TP.HCM · Hotline: 1900 8888
                </p>
              </div>
            </div>

            <div className="text-right text-xs shrink-0">
              <QRCodeSVG value={`${window.location.origin}/portal/view?studyUid=${studyInstanceUid}`} size={60} />
              <span className="text-[8px] font-mono text-slate-500 font-bold block mt-0.5">MÃ XÁC THỰC</span>
            </div>
          </div>

          {/* Title */}
          <div className="text-center pt-1">
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">
              {modality === 'US' || modality === 'Siêu âm'
                ? 'PHIẾU KẾT QUẢ SIÊU ÂM'
                : modality === 'ES' || modality === 'Nội soi'
                ? 'PHIẾU KẾT QUẢ NỘI SOI CHẨN ĐOÁN'
                : 'PHIẾU KẾT QUẢ CHẨN ĐOÁN HÌNH ẢNH'}
            </h2>
          </div>

          {/* Patient Details Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 block text-[10px]">HỌ VÀ TÊN:</span>
              <b className="uppercase font-black text-slate-900 text-sm">{patientName?.toUpperCase()}</b>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">MÃ BN (PID):</span>
              <b className="font-mono text-sky-800 font-bold">{patientId}</b>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">LOẠI KỸ THUẬT:</span>
              <b className="font-bold text-slate-800">{modality}</b>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">NGÀY THỰC HIỆN:</span>
              <b className="font-bold text-slate-800">{studyDate}</b>
            </div>
          </div>

          {/* ── ATTACHED IMAGES SECTION (For Ultrasound / Endoscopy) ── */}
          {hasImages && (
            <div className="space-y-2 pt-1">
              <h4 className="text-xs font-black text-slate-800 uppercase flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
                <span>HÌNH ẢNH TỔN THƯƠNG GHI NHẬN ({effectiveImages.length} ẢNH):</span>
              </h4>

              <div
                className={`grid gap-2.5 ${
                  effectiveImages.length === 2
                    ? 'grid-cols-2'
                    : effectiveImages.length === 3
                    ? 'grid-cols-3'
                    : effectiveImages.length <= 4
                    ? 'grid-cols-2 sm:grid-cols-2'
                    : 'grid-cols-3'
                }`}
              >
                {effectiveImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="border border-slate-300 rounded-xl overflow-hidden bg-black/5 flex flex-col"
                  >
                    <img
                      src={getMediaUrl(img.url)}
                      alt={`Ảnh ${idx + 1}`}
                      className="w-full h-36 sm:h-40 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=400';
                      }}
                    />
                    <div className="p-1 bg-slate-100 text-[10px] font-bold text-slate-700 text-center truncate border-t border-slate-200">
                      Ảnh {idx + 1}: {img.title || `Vị trí thăm khám ${idx + 1}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── FINDINGS & IMPRESSION ── */}
          <div className="space-y-3 text-xs pt-1">
            <div>
              <h4 className="font-black text-slate-800 uppercase">1. MÔ TẢ HÌNH ẢNH (FINDINGS):</h4>
              <div className="mt-1 p-3 bg-slate-50/50 rounded-xl border border-slate-200 whitespace-pre-line text-slate-700 leading-relaxed font-sans">
                {findings || 'Chưa ghi nhận bất thường.'}
              </div>
            </div>

            <div>
              <h4 className="font-black text-teal-900 uppercase">2. KẾT LUẬN (IMPRESSION):</h4>
              <div className="mt-1 p-3 rounded-xl bg-teal-50/60 border border-teal-300 font-bold text-teal-900 whitespace-pre-line leading-relaxed">
                {impression || 'Hình ảnh hiện tại trong giới hạn bình thường.'}
              </div>
            </div>

            {recommendation && (
              <div>
                <h4 className="font-black text-slate-800 uppercase">3. LỜI KHUYÊN &amp; ĐỀ NGHỊ (RECOMMENDATIONS):</h4>
                <p className="mt-1 text-slate-700 pl-1">{recommendation}</p>
              </div>
            )}
          </div>

          {/* ── FOOTER & SIGNATURE ── */}
          <div className="pt-4 border-t border-slate-300 flex justify-between items-end text-xs">
            <div className="text-[10px] text-slate-500 space-y-0.5">
              <p>• Phiếu kết quả có giá trị pháp lý theo Thông tư 46/2018/TT-BYT</p>
              <p>• Quét mã QR để xem hình ảnh màu &amp; video clip gốc trực tuyến.</p>
            </div>

            <div className="text-center">
              <p className="text-[11px] text-slate-600 italic">Ngày {new Date().toLocaleDateString('vi-VN')}</p>
              <p className="font-bold text-slate-800 mt-1">BÁC SĨ CHẨN ĐOÁN</p>
              <p className="font-black text-teal-700 mt-6 text-sm">{readingDoctor || 'BS. Chẩn Đoán'}</p>
              <span className="text-[10px] text-emerald-600 font-bold block">✓ ĐÃ KÝ SỐ ĐIỆN TỬ</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
