import React, { useState } from 'react';
import {
  Film,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Camera,
  ChevronLeft,
  ChevronRight,
  Check,
  Star,
  Maximize2
} from 'lucide-react';
import { StudyMediaItem } from './MediaCaptureModal';
import api, { getMediaUrl } from '../../../services/api';

interface MiniPacsViewportProps {
  isOpen: boolean;
  studyInstanceUid: string;
  patientName: string;
  modality: string;
  studyMedia?: StudyMediaItem[];
  onOpenMediaCapture?: () => void;
}

export const MiniPacsViewport: React.FC<MiniPacsViewportProps> = ({
  isOpen,
  studyInstanceUid,
  patientName,
  modality,
  studyMedia = [],
  onOpenMediaCapture
}) => {
  const [activeSlice, setActiveSlice] = useState(42);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!isOpen) return null;

  const hasMedia = studyMedia.length > 0;
  const currentMedia = hasMedia
    ? studyMedia[Math.min(activeMediaIndex, Math.max(0, studyMedia.length - 1))]
    : null;

  // Toggle key image directly from viewport
  const handleToggleKeyImageDirect = async (item: StudyMediaItem) => {
    try {
      const currentKeyIds = studyMedia.filter((m) => m.is_key_image).map((m) => m.id);
      let newKeyIds: string[];

      if (item.is_key_image) {
        newKeyIds = currentKeyIds.filter((id) => id !== item.id);
      } else {
        if (currentKeyIds.length >= 6) {
          alert('Đã chọn tối đa 6 ảnh in. Vui lòng bỏ chọn bớt một ảnh trước!');
          return;
        }
        newKeyIds = [...currentKeyIds, item.id];
      }

      await api.put(`/studies/${studyInstanceUid}/media/key-images`, {
        keyImageIds: newKeyIds
      });

      // Update in-place
      item.is_key_image = !item.is_key_image;
    } catch (err) {
      console.error('Error toggling key image directly:', err);
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  return (
    <div className="w-72 sm:w-80 xl:w-96 bg-[#060c18] border-r border-[#152342] flex flex-col shrink-0 overflow-hidden select-none shadow-2xl">
      
      {/* ── TOP HEADER BAR ── */}
      <div className="px-3 py-2 bg-[#091428] border-b border-[#182a4d] flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-2 font-black text-sky-400 text-xs">
          <Film className="w-4 h-4 text-sky-400" />
          <span>{hasMedia ? `Ảnh Khám (${studyMedia.length})` : 'Mini PACS'}</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-sky-500/20 text-sky-300 border border-sky-400/30">
            {modality}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenMediaCapture && (
            <button
              onClick={onOpenMediaCapture}
              className="px-2 py-1 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-[10px] font-black flex items-center gap-1 transition active:scale-95 cursor-pointer shadow-sm"
              title="Chụp trực tiếp từ máy hoặc nạp ảnh (F3)"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Ảnh (F3)</span>
            </button>
          )}

          <button
            onClick={() =>
              window.open(
                `http://localhost:8080/viewer?StudyInstanceUIDs=${studyInstanceUid}`,
                'OHIF_VIEWER_TAB'
              )
            }
            className="px-2 py-1 rounded-lg bg-[#0078D4] hover:bg-sky-500 text-white text-[10px] font-black flex items-center gap-1 transition cursor-pointer shadow-sm"
            title="Mở toàn màn hình trên trạm đọc 3D chuyên sâu"
          >
            <span>3D PACS</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ── MAIN IMAGE VIEWPORT AREA ── */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden min-h-0">
        
        {/* Render Image or Slice */}
        {hasMedia && currentMedia ? (
          <img
            src={getMediaUrl(currentMedia.url)}
            alt={currentMedia.original_name}
            style={{
              transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s ease-out'
            }}
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800';
            }}
          />
        ) : (
          <img
            src="https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=85"
            alt="Mini DICOM Preview"
            style={{
              transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s ease-out'
            }}
            className="w-full h-full object-cover"
          />
        )}

        {/* Floating Top-Left Medical HUD Overlay */}
        <div className="absolute top-2.5 left-2.5 font-mono text-[10px] text-sky-300 space-y-0.5 pointer-events-none bg-slate-950/80 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/10 shadow-lg">
          <div className="font-black text-white truncate max-w-[170px] uppercase tracking-wide">
            {patientName?.toUpperCase()}
          </div>
          <div className="text-slate-400">
            {modality} · {hasMedia ? `Ảnh ${activeMediaIndex + 1}/${studyMedia.length}` : `Slice ${activeSlice}/128`}
          </div>
          {hasMedia && currentMedia?.is_key_image && (
            <div className="text-emerald-400 font-bold flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Đã chọn in (Ảnh {currentMedia.order_index})</span>
            </div>
          )}
        </div>

        {/* Floating Top-Right Mini Tool Palette */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 bg-slate-950/80 backdrop-blur-md p-1 rounded-xl border border-white/10 shadow-lg z-10">
          {hasMedia && currentMedia && (
            <button
              onClick={() => handleToggleKeyImageDirect(currentMedia)}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                currentMedia.is_key_image
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={currentMedia.is_key_image ? 'Đang chọn in (Bấm để bỏ)' : 'Chọn in ảnh này'}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
            </button>
          )}

          <button
            onClick={handleRotate}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Xoay 90°"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setZoomLevel((z) => (z >= 2 ? 1 : z + 0.5))}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Phóng to"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {zoomLevel > 1 && (
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1.5 rounded-lg text-amber-400 hover:text-white hover:bg-slate-800 transition cursor-pointer text-[9px] font-mono font-bold"
              title="Về kích thước gốc 100%"
            >
              1x
            </button>
          )}
        </div>

        {/* Floating Bottom Navigator Bar */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 text-xs text-white z-10 shadow-xl">
          {hasMedia ? (
            <>
              <button
                onClick={() => setActiveMediaIndex((prev) => Math.max(0, prev - 1))}
                disabled={activeMediaIndex === 0}
                className="p-1 rounded-lg bg-slate-800/80 disabled:opacity-30 hover:bg-sky-600 text-white transition cursor-pointer"
                title="Ảnh trước"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="font-mono text-xs font-bold text-slate-200">
                {activeMediaIndex + 1} / {studyMedia.length}
              </span>

              <button
                onClick={() =>
                  setActiveMediaIndex((prev) => Math.min(studyMedia.length - 1, prev + 1))
                }
                disabled={activeMediaIndex === studyMedia.length - 1}
                className="p-1 rounded-lg bg-slate-800/80 disabled:opacity-30 hover:bg-sky-600 text-white transition cursor-pointer"
                title="Ảnh tiếp theo"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <span className="text-slate-400 font-bold shrink-0 text-[10px]">Lát: {activeSlice}</span>
              <input
                type="range"
                min="1"
                max="128"
                value={activeSlice}
                onChange={(e) => setActiveSlice(Number(e.target.value))}
                className="flex-1 h-1 bg-slate-700 rounded-lg accent-sky-400 cursor-pointer min-w-0"
              />
            </>
          )}
        </div>
      </div>

      {/* ── BOTTOM THUMBNAIL STRIP ── */}
      {hasMedia && (
        <div className="h-20 bg-[#040813] border-t border-[#152342] p-2 flex items-center gap-2 overflow-x-auto custom-scrollbar shrink-0">
          {studyMedia.map((m, idx) => (
            <div
              key={m.id}
              onClick={() => setActiveMediaIndex(idx)}
              className={`relative h-full aspect-video rounded-xl overflow-hidden border-2 cursor-pointer shrink-0 transition-all duration-200 group bg-black ${
                activeMediaIndex === idx
                  ? 'border-sky-400 ring-2 ring-sky-400/50 scale-95 shadow-md shadow-sky-500/20'
                  : 'border-[#18284d] opacity-60 hover:opacity-100 hover:border-slate-500'
              }`}
            >
              <img
                src={getMediaUrl(m.url)}
                alt={m.original_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=400';
                }}
              />

              {/* Print Key Order Badge */}
              {m.is_key_image ? (
                <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-emerald-600 text-white text-[9px] font-black font-mono shadow">
                  {m.order_index}
                </span>
              ) : (
                <span className="absolute bottom-1 right-1 px-1 rounded bg-black/70 text-slate-400 text-[8px] font-mono">
                  {idx + 1}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
