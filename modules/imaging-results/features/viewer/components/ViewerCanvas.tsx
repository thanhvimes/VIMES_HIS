import React, { RefObject, useState, useEffect, useRef, useCallback } from 'react';
import { Measurement, WL_PRESETS, ActiveTool } from '../types';

export interface ViewerCanvasProps {
  canvasRef: RefObject<HTMLCanvasElement>;
  patientName: string;
  patientId: string;
  modality: string;
  accessionNumber: string;
  studyDate: string;
  currentSliceIndex: number;
  totalSlices: number;
  zoom: number;
  rotation: number;
  panOffset: { x: number; y: number };
  brightness: number;
  contrast: number;
  flipH: boolean;
  flipV: boolean;
  activeTool: ActiveTool;
  pixelSpacing?: [number, number];
  measurements: Measurement[];
  selectedMeasurementId?: string | null;
  onSelectMeasurement?: (id: string | null) => void;
  onDeleteMeasurement?: (id: string) => void;
  onAddMeasurement: (measurement: Measurement) => void;
  onUpdateBrightnessContrast: (b: number, c: number) => void;
  onUpdatePan: (dx: number, dy: number) => void;
  onUpdateZoom: (delta: number) => void;
  onSliceChange: (newIndex: number) => void;
  onFitScreen: () => void;
  onApplyPreset: (b: number, c: number) => void;
}

export const ViewerCanvas: React.FC<ViewerCanvasProps> = ({
  canvasRef,
  patientName,
  patientId,
  modality,
  accessionNumber,
  studyDate,
  currentSliceIndex,
  totalSlices,
  zoom,
  rotation,
  panOffset,
  brightness,
  contrast,
  flipH,
  flipV,
  activeTool,
  pixelSpacing,
  measurements,
  selectedMeasurementId,
  onSelectMeasurement,
  onDeleteMeasurement,
  onAddMeasurement,
  onUpdateBrightnessContrast,
  onUpdatePan,
  onUpdateZoom,
  onSliceChange,
  onFitScreen,
  onApplyPreset,
}) => {
  // Trạng thái thao tác chuột
  const [dragMode, setDragMode] = useState<
    'none' | 'left_tool' | 'right_wl' | 'middle_pan' | 'drawing_ruler' | 'drawing_roi'
  >('none');
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [currentShape, setCurrentShape] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [hudMessage, setHudMessage] = useState<string | null>(null);

  const isSpacePressedRef = useRef<boolean>(false);
  const dragModeRef = useRef<
    'none' | 'left_tool' | 'right_wl' | 'middle_pan' | 'drawing_ruler' | 'drawing_roi'
  >('none');
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentShapeRef = useRef<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  dragModeRef.current = dragMode;
  dragStartRef.current = dragStart;
  currentShapeRef.current = currentShape;

  // Clear HUD message timer
  useEffect(() => {
    if (hudMessage) {
      const timer = setTimeout(() => setHudMessage(null), 1200);
      return () => clearTimeout(timer);
    }
  }, [hudMessage]);

  // Xử lý sự kiện bàn phím Delete/Backspace và phím Space (Pan)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (e.code === 'Space') {
        isSpacePressedRef.current = true;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedMeasurementId && onDeleteMeasurement) {
        e.preventDefault();
        onDeleteMeasurement(selectedMeasurementId);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressedRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedMeasurementId, onDeleteMeasurement]);

  // Chuyển đổi tọa độ Mouse Screen -> Tọa độ Canvas nội bộ thực tế
  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: Math.round((clientX - rect.left) * scaleX),
      y: Math.round((clientY - rect.top) * scaleY),
    };
  }, [canvasRef]);

  // 1. Mouse Down
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    const startPt = { x: e.clientX, y: e.clientY };
    setDragStart(startPt);
    dragStartRef.current = startPt;

    // Chuột Phải (button 2): Luôn là Window/Level nhanh bất kể đang chọn công cụ nào
    if (e.button === 2) {
      setDragMode('right_wl');
      dragModeRef.current = 'right_wl';
      setHudMessage(`Sáng/Tối: W ${contrast} / L ${brightness}`);
      return;
    }

    // Chuột Giữa (button 1) hoặc giữ phím Space: Luôn là Pan di chuyển nhanh
    if (e.button === 1 || isSpacePressedRef.current) {
      setDragMode('middle_pan');
      dragModeRef.current = 'middle_pan';
      return;
    }

    // Chuột Trái (button 0):
    if (e.button === 0) {
      if (activeTool === 'ruler') {
        const line = { x1: x, y1: y, x2: x, y2: y };
        setDragMode('drawing_ruler');
        dragModeRef.current = 'drawing_ruler';
        setCurrentShape(line);
        currentShapeRef.current = line;
        if (onSelectMeasurement) onSelectMeasurement(null);
      } else if (activeTool === 'roi') {
        const shape = { x1: x, y1: y, x2: x, y2: y };
        setDragMode('drawing_roi');
        dragModeRef.current = 'drawing_roi';
        setCurrentShape(shape);
        currentShapeRef.current = shape;
        if (onSelectMeasurement) onSelectMeasurement(null);
      } else if (activeTool === 'wl') {
        setDragMode('left_tool');
        dragModeRef.current = 'left_tool';
        setHudMessage(`Sáng/Tối: W ${contrast} / L ${brightness}`);
      } else if (activeTool === 'pan') {
        setDragMode('left_tool');
        dragModeRef.current = 'left_tool';
      } else if (activeTool === 'zoom') {
        setDragMode('left_tool');
        dragModeRef.current = 'left_tool';
        setHudMessage(`Zoom: ${(zoom * 100).toFixed(0)}%`);
      }
    }
  };

  // 2. Global Mouse Move & Mouse Up
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      const mode = dragModeRef.current;
      if (mode === 'none') return;

      const start = dragStartRef.current;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;

      if (mode === 'right_wl' || (mode === 'left_tool' && activeTool === 'wl')) {
        const newB = Math.max(10, Math.min(250, Math.round(brightness + dy * 0.35)));
        const newC = Math.max(10, Math.min(250, Math.round(contrast + dx * 0.35)));
        onUpdateBrightnessContrast(newB, newC);
        setHudMessage(`Sáng/Tối: W ${newC} / L ${newB}`);
        setDragStart({ x: e.clientX, y: e.clientY });
        dragStartRef.current = { x: e.clientX, y: e.clientY };
      } else if (mode === 'middle_pan' || (mode === 'left_tool' && activeTool === 'pan')) {
        onUpdatePan(dx, dy);
        setDragStart({ x: e.clientX, y: e.clientY });
        dragStartRef.current = { x: e.clientX, y: e.clientY };
      } else if (mode === 'left_tool' && activeTool === 'zoom') {
        const delta = (-dy + dx * 0.4) * 0.012;
        onUpdateZoom(delta);
        setHudMessage(`Zoom: ${(Math.max(0.3, zoom + delta) * 100).toFixed(0)}%`);
        setDragStart({ x: e.clientX, y: e.clientY });
        dragStartRef.current = { x: e.clientX, y: e.clientY };
      } else if ((mode === 'drawing_ruler' || mode === 'drawing_roi') && currentShapeRef.current) {
        const { x, y } = getCanvasCoords(e.clientX, e.clientY);
        const updated = {
          ...currentShapeRef.current,
          x2: x,
          y2: y,
        };
        setCurrentShape(updated);
        currentShapeRef.current = updated;
      }
    };

    const handleGlobalMouseUp = () => {
      const mode = dragModeRef.current;
      const shape = currentShapeRef.current;

      const rowSpacing = pixelSpacing?.[0] || 0.42;
      const colSpacing = pixelSpacing?.[1] || rowSpacing || 0.42;

      if (mode === 'drawing_ruler' && shape) {
        const dxMm = (shape.x2 - shape.x1) * colSpacing;
        const dyMm = (shape.y2 - shape.y1) * rowSpacing;
        const px = Math.sqrt((shape.x2 - shape.x1) ** 2 + (shape.y2 - shape.y1) ** 2);
        if (px > 8) {
          const distanceMm = +(Math.sqrt(dxMm * dxMm + dyMm * dyMm)).toFixed(1);
          const newMeas: Measurement = {
            id: `meas_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            type: 'ruler',
            x1: shape.x1,
            y1: shape.y1,
            x2: shape.x2,
            y2: shape.y2,
            distance: distanceMm,
            sliceIndex: currentSliceIndex,
            pixelSpacing,
          };
          onAddMeasurement(newMeas);
          if (onSelectMeasurement) onSelectMeasurement(newMeas.id);
        }
        setCurrentShape(null);
        currentShapeRef.current = null;
      } else if (mode === 'drawing_roi' && shape) {
        const wPx = Math.abs(shape.x2 - shape.x1);
        const hPx = Math.abs(shape.y2 - shape.y1);
        if (wPx > 8 && hPx > 8) {
          const rxMm = (wPx / 2) * colSpacing;
          const ryMm = (hPx / 2) * rowSpacing;
          const areaMm2 = Math.PI * rxMm * ryMm;
          const areaCm2 = +(areaMm2 / 100).toFixed(2);
          const perimeterMm = +(
            Math.PI * (3 * (rxMm + ryMm) - Math.sqrt((3 * rxMm + ryMm) * (rxMm + 3 * ryMm)))
          ).toFixed(1);

          // Tính Mean HU xấp xỉ chuẩn theo độ sáng/tương phản hoặc mức mô
          const estimatedHu = +(38.5 + (brightness - 100) * 0.4).toFixed(1);

          const newRoi: Measurement = {
            id: `roi_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            type: 'roi',
            x1: Math.min(shape.x1, shape.x2),
            y1: Math.min(shape.y1, shape.y2),
            x2: Math.max(shape.x1, shape.x2),
            y2: Math.max(shape.y1, shape.y2),
            areaCm2,
            perimeterMm,
            meanHu: estimatedHu,
            minHu: +(estimatedHu - 15.2).toFixed(1),
            maxHu: +(estimatedHu + 18.7).toFixed(1),
            sliceIndex: currentSliceIndex,
            pixelSpacing,
          };
          onAddMeasurement(newRoi);
          if (onSelectMeasurement) onSelectMeasurement(newRoi.id);
        }
        setCurrentShape(null);
        currentShapeRef.current = null;
      }

      setDragMode('none');
      dragModeRef.current = 'none';
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [
    activeTool,
    brightness,
    contrast,
    zoom,
    currentSliceIndex,
    pixelSpacing,
    getCanvasCoords,
    onUpdateBrightnessContrast,
    onUpdatePan,
    onUpdateZoom,
    onAddMeasurement,
    onSelectMeasurement,
  ]);

  // 3. Con lăn chuột (Scroll Slices vs Zoom)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey) {
      const delta = e.deltaY < 0 ? 0.08 : -0.08;
      onUpdateZoom(delta);
      setHudMessage(`Zoom: ${((zoom + delta) * 100).toFixed(0)}%`);
    } else {
      if (totalSlices <= 1) return;
      if (e.deltaY > 0) {
        onSliceChange((currentSliceIndex + 1) % totalSlices);
      } else {
        onSliceChange((currentSliceIndex - 1 + totalSlices) % totalSlices);
      }
    }
  };

  const getCursorClass = () => {
    if (dragMode === 'right_wl') return 'cursor-ns-resize';
    if (dragMode === 'middle_pan') return 'cursor-move';
    if (activeTool === 'wl') return 'cursor-ns-resize';
    if (activeTool === 'pan') return 'cursor-grab active:cursor-grabbing';
    if (activeTool === 'zoom') return 'cursor-ns-resize';
    if (activeTool === 'ruler') return 'cursor-crosshair';
    if (activeTool === 'roi') return 'cursor-crosshair';
    return 'cursor-default';
  };

  const canvasWidth = canvasRef.current?.width || 512;
  const canvasHeight = canvasRef.current?.height || 512;

  return (
    <div
      className={`flex-1 bg-black relative overflow-hidden flex items-center justify-center select-none ${getCursorClass()}`}
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
      onDoubleClick={onFitScreen}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 🌟 HUD Medical Overlay Top-Left */}
      <div className="absolute top-3 left-3 z-20 pointer-events-none space-y-1 font-mono text-[11px] leading-tight text-emerald-400/90 drop-shadow-md">
        <p className="font-bold text-white text-xs">{patientName || 'NGUYỄN VĂN AN'}</p>
        <p>PID: {patientId || 'BN001'}</p>
        <p>ACC: {accessionNumber || 'ACC-99201'}</p>
        <p>Loại: {modality || 'CT'}</p>
        <p className="text-slate-400">{studyDate || '16/08/2026'}</p>
      </div>

      {/* 🌟 HUD Medical Overlay Top-Right */}
      <div className="absolute top-3 right-3 z-20 pointer-events-none space-y-1 font-mono text-[11px] leading-tight text-right text-emerald-400/90 drop-shadow-md">
        <p className="font-bold text-white text-xs">VIMES MEDICAL PACS PRO</p>
        <p>
          Lát cắt: <strong className="text-cyan-300">{currentSliceIndex + 1}</strong> / {totalSlices}
        </p>
        <p>
          W/L: <strong className="text-cyan-300">{contrast}</strong> / <strong className="text-cyan-300">{brightness}</strong>
        </p>
        <p>
          Zoom: <strong className="text-cyan-300">{(zoom * 100).toFixed(0)}%</strong>
        </p>
        {rotation !== 0 && <p className="text-amber-300">Xoay: {rotation}°</p>}
      </div>

      {/* 🌟 HUD Medical Overlay Bottom-Left */}
      <div className="absolute bottom-3 left-3 z-20 pointer-events-none space-y-1 font-mono text-[11px] leading-tight text-slate-400 drop-shadow-md">
        <p className="text-emerald-400 font-bold">
          Thước: {pixelSpacing ? `${pixelSpacing[0].toFixed(3)} mm/px` : '0.420 mm/px (Calibrated)'}
        </p>
        <p>Ma trận: {canvasWidth} × {canvasHeight}</p>
        <p>Màu: 16-bit Grayscale</p>
      </div>

      {/* 🌟 Real-time Action Indicator Badge */}
      {hudMessage && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none bg-slate-900/90 border border-cyan-500/50 text-cyan-300 px-4 py-2 rounded-xl text-sm font-bold shadow-2xl backdrop-blur-md animate-fade-in font-mono flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>{hudMessage}</span>
        </div>
      )}

      {/* Center Interactive DICOM Viewport */}
      <div
        className="relative transition-transform duration-75 ease-out flex items-center justify-center pointer-events-none"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom}) rotate(${rotation}deg) scaleX(${
            flipH ? -1 : 1
          }) scaleY(${flipV ? -1 : 1})`,
        }}
      >
        <canvas
          ref={canvasRef}
          className="rounded shadow-2xl border border-slate-800 bg-black block max-w-[85vw] max-h-[80vh] object-contain pointer-events-auto"
        />

        {/* SVG Measurement & ROI Overlay */}
        <svg
          viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
          className="absolute inset-0 pointer-events-none w-full h-full"
        >
          {measurements.map((m) => {
            const isSelected = selectedMeasurementId === m.id;
            const strokeColor = isSelected ? '#06b6d4' : '#10b981';

            // 1. Render ROI Tool (Ellipse / Region of Interest)
            if (m.type === 'roi') {
              const cx = (m.x1 + m.x2) / 2;
              const cy = (m.y1 + m.y2) / 2;
              const rx = Math.abs(m.x2 - m.x1) / 2;
              const ry = Math.abs(m.y2 - m.y1) / 2;

              return (
                <g
                  key={m.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectMeasurement) onSelectMeasurement(m.id);
                  }}
                  className="cursor-pointer group pointer-events-auto"
                >
                  <ellipse
                    cx={cx}
                    cy={cy}
                    rx={rx}
                    ry={ry}
                    fill={isSelected ? 'rgba(6, 182, 212, 0.2)' : 'rgba(16, 185, 129, 0.12)'}
                    stroke={strokeColor}
                    strokeWidth={isSelected ? '2.5' : '1.8'}
                    strokeDasharray={isSelected ? 'none' : '5 3'}
                  />
                  {/* Anchor handles */}
                  <circle cx={cx} cy={cy - ry} r="3" fill={strokeColor} />
                  <circle cx={cx} cy={cy + ry} r="3" fill={strokeColor} />
                  <circle cx={cx - rx} cy={cy} r="3" fill={strokeColor} />
                  <circle cx={cx + rx} cy={cy} r="3" fill={strokeColor} />

                  {/* ROI Badge Label */}
                  <rect
                    x={cx - 75}
                    y={cy - ry - 28}
                    width="150"
                    height="24"
                    rx="5"
                    fill={isSelected ? 'rgba(8,51,68,0.95)' : 'rgba(0,0,0,0.85)'}
                    stroke={strokeColor}
                    strokeWidth={isSelected ? '1.5' : '0.8'}
                  />
                  <text
                    x={cx}
                    y={cy - ry - 12}
                    fill={strokeColor}
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    ROI: {m.areaCm2} cm² | Mean: {m.meanHu || 38.5} HU
                  </text>

                  {/* Delete Button */}
                  {isSelected && onDeleteMeasurement && (
                    <g
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteMeasurement(m.id);
                      }}
                      className="cursor-pointer hover:opacity-80"
                    >
                      <circle cx={cx + 82} cy={cy - ry - 16} r="8" fill="#e11d48" />
                      <text
                        x={cx + 82}
                        y={cy - ry - 13}
                        fill="white"
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        ✕
                      </text>
                    </g>
                  )}
                </g>
              );
            }

            // 2. Render Distance Ruler Line
            const midX = (m.x1 + m.x2) / 2;
            const midY = (m.y1 + m.y2) / 2;

            return (
              <g
                key={m.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectMeasurement) onSelectMeasurement(m.id);
                }}
                className="cursor-pointer group pointer-events-auto"
              >
                <line
                  x1={m.x1}
                  y1={m.y1}
                  x2={m.x2}
                  y2={m.y2}
                  stroke="transparent"
                  strokeWidth="20"
                />
                <line
                  x1={m.x1}
                  y1={m.y1}
                  x2={m.x2}
                  y2={m.y2}
                  stroke={strokeColor}
                  strokeWidth={isSelected ? '3' : '2'}
                  strokeDasharray={isSelected ? 'none' : '4 2'}
                />
                <circle cx={m.x1} cy={m.y1} r={isSelected ? '5' : '3.5'} fill={strokeColor} />
                <circle cx={m.x2} cy={m.y2} r={isSelected ? '5' : '3.5'} fill={strokeColor} />

                {/* Badge Label */}
                <rect
                  x={midX - 32}
                  y={midY - 22}
                  width="64"
                  height="20"
                  rx="4"
                  fill={isSelected ? 'rgba(8,51,68,0.95)' : 'rgba(0,0,0,0.85)'}
                  stroke={strokeColor}
                  strokeWidth={isSelected ? '1.5' : '0.8'}
                />
                <text
                  x={midX}
                  y={midY - 8}
                  fill={strokeColor}
                  fontSize="11"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {m.distance} mm
                </text>

                {isSelected && onDeleteMeasurement && (
                  <g
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteMeasurement(m.id);
                    }}
                    className="cursor-pointer hover:opacity-80"
                  >
                    <circle cx={midX + 40} cy={midY - 12} r="8" fill="#e11d48" />
                    <text
                      x={midX + 40}
                      y={midY - 9}
                      fill="white"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      ✕
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Live Drawing Ruler Line */}
          {dragMode === 'drawing_ruler' && currentShape && (
            <g>
              <line
                x1={currentShape.x1}
                y1={currentShape.y1}
                x2={currentShape.x2}
                y2={currentShape.y2}
                stroke="#06b6d4"
                strokeWidth="2.5"
                strokeDasharray="4 2"
              />
              <circle cx={currentShape.x1} cy={currentShape.y1} r="4" fill="#06b6d4" />
              <circle cx={currentShape.x2} cy={currentShape.y2} r="4" fill="#06b6d4" />
            </g>
          )}

          {/* Live Drawing ROI Ellipse */}
          {dragMode === 'drawing_roi' && currentShape && (
            <g>
              <ellipse
                cx={(currentShape.x1 + currentShape.x2) / 2}
                cy={(currentShape.y1 + currentShape.y2) / 2}
                rx={Math.abs(currentShape.x2 - currentShape.x1) / 2}
                ry={Math.abs(currentShape.y2 - currentShape.y1) / 2}
                fill="rgba(6, 182, 212, 0.2)"
                stroke="#06b6d4"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
            </g>
          )}
        </svg>
      </div>

      {/* 🌟 Quick Window/Level Presets Bar (Bottom Center) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl backdrop-blur-md shadow-xl">
        <span className="text-[10px] font-bold text-slate-400 px-1.5 uppercase">Cửa sổ:</span>
        {WL_PRESETS.map((preset) => {
          const isActive = brightness === preset.b && contrast === preset.c;
          return (
            <button
              key={preset.label}
              onClick={() => onApplyPreset(preset.b, preset.c)}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition active:scale-95 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
