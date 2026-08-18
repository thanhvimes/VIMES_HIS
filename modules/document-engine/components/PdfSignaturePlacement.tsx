import React, { useCallback, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { screenRectToPdf } from '../utils/pdfSignatureCoordinates';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export interface SignaturePlaceholder {
  id: number;
  code: string;
  pageIndex: number;
  x1Pt: number;
  y1Pt: number;
  x2Pt: number;
  y2Pt: number;
  pageWidthPt: number;
  pageHeightPt: number;
  signerRole: string;
  signerName?: string;
  signedAt?: string;
  status?: string;
}
export interface PdfSignatureRect { pageIndex: number; x1Pt: number; y1Pt: number; x2Pt: number; y2Pt: number; pageWidthPt: number; pageHeightPt: number; pageRotation: 0 | 90 | 180 | 270; }
interface Props { file: string | Uint8Array; pageWidth?: number; placeholders?: SignaturePlaceholder[]; mode?: 'select' | 'placeholder'; onFreestyleSelect?: (rect: PdfSignatureRect) => void; onPlaceholderClick?: (placeholder: SignaturePlaceholder) => void; }

const toScreen = (value: number, scale: number) => value * scale;

export default function PdfSignaturePlacement({ file, pageWidth = 760, placeholders = [], mode = 'select', onFreestyleSelect, onPlaceholderClick }: Props) {
    const [pages, setPages] = useState(0); const [pageSize, setPageSize] = useState({ width: 595, height: 842 }); const [drag, setDrag] = useState<{ x: number; y: number } | null>(null); const [selection, setSelection] = useState<{ x: number; y: number; w: number; h: number } | null>(null); const pageRef = useRef<HTMLDivElement>(null);
    const scale = pageWidth / pageSize.width;
    const begin = useCallback((event: React.PointerEvent) => { if (mode !== 'select' || !pageRef.current) return; const box = pageRef.current.getBoundingClientRect(); setDrag({ x: event.clientX - box.left, y: event.clientY - box.top }); setSelection(null); (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId); }, [mode]);
    const move = useCallback((event: React.PointerEvent) => { if (!drag || !pageRef.current) return; const box = pageRef.current.getBoundingClientRect(); const x = event.clientX - box.left; const y = event.clientY - box.top; setSelection({ x: Math.min(drag.x, x), y: Math.min(drag.y, y), w: Math.abs(x - drag.x), h: Math.abs(y - drag.y) }); }, [drag]);
    const end = useCallback((event: React.PointerEvent) => { if (!drag || !selection) { setDrag(null); return; } const rect = screenRectToPdf({ startX: drag.x, startY: drag.y, endX: drag.x + selection.w, endY: drag.y + selection.h, pageWidthPt: pageSize.width, pageHeightPt: pageSize.height, renderedWidth: pageWidth, renderedHeight: pageSize.height * scale }); if (rect.x2Pt - rect.x1Pt >= 30 && rect.y2Pt - rect.y1Pt >= 20) onFreestyleSelect?.(rect); setDrag(null); }, [drag, selection, pageSize, pageWidth, scale, onFreestyleSelect]);
    return <Document file={file} onLoadSuccess={({ numPages }) => setPages(numPages)} loading={<div className="p-12 text-center text-slate-500">Đang tải tài liệu PDF…</div>}>
        {Array.from({ length: pages }, (_, index) => <div key={index} style={{ position: 'relative', width: pageWidth, marginBottom: 16 }} ref={index === 0 ? pageRef : undefined} onPointerDown={index === 0 ? begin : undefined} onPointerMove={index === 0 ? move : undefined} onPointerUp={index === 0 ? end : undefined}>
            <Page pageNumber={index + 1} width={pageWidth} onLoadSuccess={page => setPageSize({ width: page.originalWidth, height: page.originalHeight })} renderTextLayer={false} renderAnnotationLayer={false} />
            {index === 0 && selection && <div style={{ position: 'absolute', left: selection.x, top: selection.y, width: selection.w, height: selection.h, border: '2px dashed #2563eb', background: 'rgba(37,99,235,.12)', pointerEvents: 'none' }} />}
            {placeholders.filter(item => item.pageIndex === index).map(item => (
              <button
                type="button"
                key={item.id}
                onClick={() => onPlaceholderClick?.(item)}
                title={item.status === 'SIGNED' ? `Đã ký bởi: ${item.signerName || item.signerRole}` : `Nhấp để ký: ${item.code} (${item.signerRole})`}
                style={{
                  position: 'absolute',
                  left: toScreen(item.x1Pt, scale),
                  top: toScreen(item.pageHeightPt - item.y2Pt, scale),
                  width: toScreen(item.x2Pt - item.x1Pt, scale),
                  height: toScreen(item.y2Pt - item.y1Pt, scale),
                  border: item.status === 'SIGNED' ? '2px solid #16a34a' : '2px dashed #d97706',
                  borderRadius: 8,
                  background: item.status === 'SIGNED' ? 'rgba(22, 163, 74, 0.12)' : 'rgba(245, 158, 11, 0.14)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2px 4px',
                  boxShadow: item.status === 'SIGNED' ? '0 2px 8px rgba(22,163,74,0.2)' : '0 2px 8px rgba(217,119,6,0.2)',
                  transition: 'all 0.2s ease',
                  overflow: 'hidden'
                }}
              >
                {item.status === 'SIGNED' ? (
                  <div className="flex flex-col items-center justify-center text-center w-full">
                    <div className="flex items-center gap-1 font-bold text-[11px] text-emerald-800 dark:text-emerald-300">
                      <span>✔</span> <span>ĐÃ KÝ SỐ</span>
                    </div>
                    <div className="text-[10px] font-semibold text-emerald-900 dark:text-emerald-100 truncate max-w-full">
                      {item.signerName || item.signerRole}
                    </div>
                    <div className="text-[9px] text-emerald-700 dark:text-emerald-400 opacity-90">
                      {item.signedAt || new Date().toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center w-full group">
                    <div className="flex items-center gap-1 font-bold text-[11px] text-amber-800 dark:text-amber-300">
                      <span>🖋️</span> <span>{item.code}</span>
                    </div>
                    <div className="text-[9px] font-medium text-amber-900 dark:text-amber-200">
                      Nhấp để ký ({item.signerRole === 'DOCTOR' ? 'Bác sĩ' : 'Người bệnh'})
                    </div>
                  </div>
                )}
              </button>
            ))}
        </div>)}
    </Document>;
}
