import React from 'react';
import { Sparkles, ExternalLink, Sliders, Layers, ZoomIn } from 'lucide-react';
import { KeyImageItem, PortalReport } from '../types';

interface KeyImagesGalleryProps {
  keyImages: KeyImageItem[];
  activeImageIndex: number;
  setActiveImageIndex: (index: number) => void;
  activeZoom: number;
  setActiveZoom: (zoom: number | ((prev: number) => number)) => void;
  onOpenSecureViewer: () => void;
  report: PortalReport | null;
}

export const KeyImagesGallery: React.FC<KeyImagesGalleryProps> = ({
  keyImages,
  activeImageIndex,
  setActiveImageIndex,
  activeZoom,
  setActiveZoom,
  onOpenSecureViewer,
  report
}) => {
  const activeImg = keyImages[activeImageIndex];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Main Interactive High-Tech Viewer Window */}
      <div className="rounded-3xl bg-white dark:bg-[#070f1d] border border-slate-200 dark:border-[#1b355d] overflow-hidden shadow-md dark:shadow-2xl transition-colors">
        {/* Viewer Control Bar */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-[#0a162b] border-b border-slate-200 dark:border-[#1b355d] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300 font-mono font-bold text-[11px] border border-sky-300 dark:border-sky-500/30">
              {activeImg.badge}
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {activeImg.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSecureViewer}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#0078D4] to-[#008A5E] hover:opacity-90 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 transition cursor-pointer"
              title="Mở trạm đọc ảnh DICOM 3D toàn màn hình ở chế độ bảo mật riêng tư"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Mở Toàn Màn Hình 3D PACS</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Viewer Display Box */}
        <div className="relative aspect-[16/10] sm:aspect-[16/9] bg-black overflow-hidden flex items-center justify-center group select-none">
          <img
            src={activeImg.url}
            alt={activeImg.title}
            style={{ transform: `scale(${activeZoom})` }}
            className="w-full h-full object-cover transition-transform duration-300"
          />

          {/* Medical HUD Overlays */}
          <div className="absolute top-4 left-4 z-10 font-mono text-[11px] text-sky-400 space-y-1 bg-black/60 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 pointer-events-none">
            <div className="font-bold text-white text-xs uppercase">
              {report?.patientName?.toUpperCase()} · {report?.patientId}
            </div>
            <div>Modality: {report?.modality} · 128 Slices</div>
            <div>{activeImg.slices} · Thk: {activeImg.thickness}</div>
            <div>Param: {activeImg.kVp}</div>
          </div>

          <div className="absolute bottom-4 right-4 z-10 font-mono text-[10px] text-slate-400 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 pointer-events-none">
            DICOM Standard Conformance · Lossless 16-bit High Fidelity
          </div>

          {/* Floating Zoom & Window Controls */}
          <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700 text-xs text-white">
            <div className="flex items-center gap-1 px-2">
              <Sliders className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[11px] font-mono">Zoom: {Math.round(activeZoom * 100)}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="2.5"
              step="0.1"
              value={activeZoom}
              onChange={(e) => setActiveZoom(parseFloat(e.target.value))}
              className="w-20 accent-[#0078D4] cursor-pointer"
            />
            <button
              onClick={() => setActiveZoom((z) => (z > 1 ? 1 : 1.5))}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
              title="Phóng to 150%"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Caption & Findings Description */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-[#0a162b] border-t border-slate-200 dark:border-[#1b355d] text-xs">
          <p className="font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">
            <b className="text-sky-700 dark:text-sky-400 uppercase tracking-wide mr-2">Ghi Chú Lát Cắt:</b>
            {activeImg.desc}
          </p>
        </div>
      </div>

      {/* Slices Thumbnail Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {keyImages.map((img, idx) => (
          <div
            key={img.id}
            onClick={() => setActiveImageIndex(idx)}
            className={`p-3 rounded-2xl border cursor-pointer transition flex items-center gap-3 shadow-sm ${
              activeImageIndex === idx
                ? 'bg-sky-50 dark:bg-[#0f2444] border-sky-500 ring-2 ring-sky-500/40'
                : 'bg-white dark:bg-[#09152a] border-slate-200 dark:border-slate-800 hover:border-sky-300 dark:hover:border-slate-700'
            }`}
          >
            <img src={img.url} alt={img.title} className="w-16 h-16 rounded-xl object-cover shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] font-mono font-bold text-sky-700 dark:text-sky-400 block truncate">
                {img.badge}
              </span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                {img.title}
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                {img.slices}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
