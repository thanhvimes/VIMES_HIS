import React, { useEffect, useRef } from 'react';
import { Layers, Play, Pause, FastForward } from 'lucide-react';
import { RealInstance } from '../types';

export interface SliceThumbnailListProps {
  instances: RealInstance[];
  currentSliceIndex: number;
  onSelectSlice: (index: number) => void;
  isCinePlaying?: boolean;
  onToggleCine?: () => void;
  cineFps?: number;
  onChangeCineFps?: (fps: number) => void;
}

export const SliceThumbnailList: React.FC<SliceThumbnailListProps> = ({
  instances,
  currentSliceIndex,
  onSelectSlice,
  isCinePlaying = false,
  onToggleCine,
  cineFps = 10,
  onChangeCineFps,
}) => {
  const activeThumbnailRef = useRef<HTMLDivElement | null>(null);

  // Preload all instance images into memory cache
  useEffect(() => {
    if (!instances || instances.length === 0) return;
    instances.forEach((inst) => {
      const img = new Image();
      img.src = inst.imageUrl;
    });
  }, [instances]);

  // Auto-scroll active thumbnail into view
  useEffect(() => {
    if (activeThumbnailRef.current) {
      activeThumbnailRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [currentSliceIndex]);

  const totalSlices = instances.length || 1;

  return (
    <aside className="w-24 sm:w-32 bg-[#0b101b] border-r border-slate-800/80 flex flex-col shrink-0 overflow-hidden select-none">
      {/* 1. Header & Cine Player Widget */}
      <div className="p-2 border-b border-slate-800/80 bg-slate-900/60 flex flex-col gap-1.5 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Layers className="w-3 h-3 text-blue-400" />
            Lát Cắt ({instances.length})
          </span>
          <span className="font-mono text-[10px] font-bold text-emerald-400">
            #{currentSliceIndex + 1}/{totalSlices}
          </span>
        </div>

        {/* Cine Loop Controls */}
        {totalSlices > 1 && onToggleCine && (
          <div className="flex items-center justify-between bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={onToggleCine}
              className={`px-2 py-1 rounded font-bold text-[10px] flex items-center gap-1 transition ${
                isCinePlaying
                  ? 'bg-rose-600 text-white shadow-sm animate-pulse'
                  : 'bg-blue-600/30 text-blue-300 hover:bg-blue-600 hover:text-white'
              }`}
              title={isCinePlaying ? 'Dừng phát (Pause) [Space]' : 'Tự động chạy chuỗi ảnh (Cine Loop) [Space]'}
            >
              {isCinePlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span>{isCinePlaying ? 'Dừng' : 'Play'}</span>
            </button>

            {/* FPS Selector */}
            {onChangeCineFps && (
              <div className="flex items-center gap-1">
                {[10, 20].map((f) => (
                  <button
                    key={f}
                    onClick={() => onChangeCineFps(f)}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition ${
                      cineFps === f
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {f}f
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Slice Slider Scrubber */}
        {totalSlices > 1 && (
          <input
            type="range"
            min={0}
            max={totalSlices - 1}
            value={currentSliceIndex}
            onChange={(e) => onSelectSlice(parseInt(e.target.value, 10))}
            className="w-full accent-blue-500 h-1 bg-slate-800 rounded cursor-pointer"
            title={`Kéo trượt nhanh lát cắt (#${currentSliceIndex + 1})`}
          />
        )}
      </div>

      {/* 2. Thumbnail List */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar">
        {instances.map((inst, idx) => {
          const isSelected = currentSliceIndex === idx;
          return (
            <div
              key={inst.instanceId || idx}
              ref={isSelected ? activeThumbnailRef : null}
              onClick={() => onSelectSlice(idx)}
              className={`p-1 rounded-xl cursor-pointer border transition-all flex flex-col items-center text-center group relative overflow-hidden ${
                isSelected
                  ? 'bg-blue-600/30 border-blue-500 shadow-sm shadow-blue-500/20 text-white'
                  : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="w-full aspect-square rounded-lg bg-black flex items-center justify-center overflow-hidden mb-1 border border-slate-800/80">
                <img
                  src={inst.imageUrl}
                  alt={`Slice #${inst.instanceNumber || idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <span className="text-[10px] font-mono font-bold block truncate w-full">
                #{inst.instanceNumber || idx + 1}
              </span>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
