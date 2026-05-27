import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import SignatureModal from './SignatureModal';
import SendSignModal from './SendSignModal';
import ConfirmationModal from './ConfirmationModal';
import { Signature } from '../../types';
import { SignaturePlacement } from '../../types/pdf';
import {
  XIcon,
  PrinterIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ZoomInIcon,
  ZoomOutIcon,
  SignatureIcon,
  HandIcon,
  InfoIcon,
  TrashIcon,
  DownloadIcon,
  ImageIcon,
  SearchIcon,
  MenuIcon,
  CheckCircleIcon,
  PaperAirplaneIcon,
  UserPlusIcon,
  BuildingOfficeIcon
} from '../Icons';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  fileName: string;
  isSignable?: boolean;
  onSign?: (signatureDataUrl: string, placement: SignaturePlacement) => void;
  signatures?: Signature[];
  onDeleteSignature?: (signatureIndex: number) => void;
  onSubmit?: () => void; // New prop for "Trình ký"
}

const PREDEFINED_SIGNATURE_BOX: SignaturePlacement = {
  pageNumber: 1,
  x: 40,
  y: 700,
  width: 150,
  height: 60
};

// --- DESKTOP STYLE PDF EDITOR ---

const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen, onClose, pdfUrl, fileName, isSignable = false, onSign, signatures = [], onDeleteSignature, onSubmit
}) => {
  const [isShowing, setIsShowing] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Layout State
  const [isSidebarOpen, setIsSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'thumbnails' | 'signatures' | 'info'>('thumbnails');

  // Listen to window resize to adjust sidebar on orientation change
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    // Only run once on mount or explicitly if needed, but for now init state is enough. 
    // Automatic resizing might be annoying if user explicitly closed it.
    // Let's just stick to initial state.
  }, []);

  // Signature State
  const [isSigningOpen, setIsSigningOpen] = useState(false);
  const [isSendSignOpen, setIsSendSignOpen] = useState(false);
  const [isPlacingSignature, setIsPlacingSignature] = useState(false);
  const [signaturePlacementIntent, setSignaturePlacementIntent] = useState<SignaturePlacement | null>(null);
  const [viewingSignature, setViewingSignature] = useState<Signature | null>(null);
  const [signatureToDeleteIndex, setSignatureToDeleteIndex] = useState<number | null>(null);
  const [extractedSignatures, setExtractedSignatures] = useState<Signature[]>([]); // New state for PDF-embedded signatures

  // Drawing State (for custom placement)
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [endPoint, setEndPoint] = useState<{ x: number; y: number } | null>(null);

  // Pan State
  const [isPanMode, setIsPanMode] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStartCoords = useRef({ x: 0, y: 0 });
  const panStartScroll = useRef({ left: 0, top: 0 });

  // Refs
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const pageWrapperRef = useRef<HTMLDivElement>(null);
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number } | null>(null);

  // File Type Detection
  const isImage = useMemo(() => {
    return /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileName) || (pdfUrl && !pdfUrl.endsWith('.pdf') && !pdfUrl.startsWith('blob:') && !pdfUrl.includes('response-content-type=application%2Fpdf'));
  }, [fileName, pdfUrl]);

  // --- INITIALIZATION ---
  useEffect(() => {
    if (isOpen) {
      setIsShowing(true);
      setIsLoading(true);
      setError(null);
      setPageNumber(1);
      setNumPages(null);
      setPageDimensions(null);
      setIsPlacingSignature(false);
      setScale(1.0);
      setIsPanMode(false);
    } else {
      setIsShowing(false);
    }
  }, [isOpen, pdfUrl]);

  // Extract signatures from PDF annotations
  const extractSignatures = async (pdfClickHandler: any) => {
    if (!pdfClickHandler) return;

    try {
      const loadedSignatures: Signature[] = [];
      const numPages = pdfClickHandler.numPages;

      for (let i = 1; i <= numPages; i++) {
        const page = await pdfClickHandler.getPage(i);
        const annotations = await page.getAnnotations();

        // Filter for Signature Widgets
        const sigs = annotations.filter((anno: any) =>
          anno.subtype === 'Widget' &&
          anno.fieldType === 'Sig'
        );

        for (const sig of sigs) {
          console.log('Found Signature Annotation:', sig);

          // Try to get signer name with multiple fallback options
          // PDF.js annotation object properties can vary.
          // Common properties: fieldName (T), alternativeText (TU), contents, title
          let name = sig.alternativeText || sig.contents || sig.title || sig.fieldName || sig.T || sig.TU || '';

          // Refine name if it looks like a raw code (e.g., "bsky", "Signature1")
          if (name === 'bsky' || name.toLowerCase().includes('signature')) {
            if (sig.alternativeText) name = sig.alternativeText;
            else if (sig.contents) name = sig.contents;
            else if (sig.TU) name = sig.TU;
            else name = 'Chữ ký số'; // Fallback
          }

          if (!name) name = 'Được ký số';

          loadedSignatures.push({
            id: sig.id || Math.random().toString(),
            signerName: name,
            signerTitle: 'Chữ ký số có sẵn',
            signedAt: new Date(), // Cannot easily get date from basic annotation view
            dataUrl: '', // No external image for existing 
            placement: {
              pageNumber: i,
              x: sig.rect[0],
              y: sig.rect[1],
              width: sig.rect[2] - sig.rect[0],
              height: sig.rect[3] - sig.rect[1]
            },
            _debugInfo: `N:${sig.fieldName}|A:${sig.alternativeText}|T:${sig.T}|TU:${sig.TU}|C:${sig.contents}`
          } as any);
        }
      }

      if (loadedSignatures.length > 0) {
        // For now, if we find existing signatures, we can log them or alert the user.
        // We can't easily merge with the parent's `signatures` prop state without a callback.
        // BUT, for the Sidebar view, we can introduce a local state that merges props + extracted.
        console.log("Extracted signatures:", loadedSignatures);
        setExtractedSignatures(loadedSignatures);
      }
    } catch (err) {
      console.error("Error extracting signatures:", err);
    }
  };

  const onDocumentLoadSuccess = useCallback(async (pdf: any) => {
    setNumPages(pdf.numPages);
    setIsLoading(false);
    await extractSignatures(pdf);
  }, []);

  const onPageLoadSuccess = useCallback((page: { width: number; height: number, originalWidth?: number, originalHeight?: number }) => {
    const originalWidth = page.originalWidth || (page.width / scale);
    const originalHeight = page.originalHeight || (page.height / scale);
    setPageDimensions({ width: originalWidth, height: originalHeight });

    // Auto fit width if first load
    if (pageNumber === 1 && scale === 1.0 && viewerContainerRef.current) {
      const containerWidth = viewerContainerRef.current.clientWidth - 48; // Padding
      if (originalWidth > containerWidth) {
        setScale(parseFloat((containerWidth / originalWidth).toFixed(2)));
      }
    }
  }, [scale, pageNumber]);

  // --- ACTIONS ---
  const handleClose = useCallback(() => {
    setIsShowing(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (isImage) {
      const win = window.open('');
      if (win) {
        win.document.write(`<img src="${pdfUrl}" onload="window.print();window.close()" />`);
        win.document.close();
      }
    } else {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = pdfUrl;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        }, 500);
      };
    }
  };

  const handleShare = async () => {
    try {
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: isImage ? 'image/jpeg' : 'application/pdf' });
      if (navigator.share) await navigator.share({ files: [file], title: fileName });
    } catch (e) {
      console.error(e);
    }
  };

  // --- NAVIGATION & ZOOM ---
  const goToPrevPage = () => setPageNumber(p => Math.max(p - 1, 1));
  const goToNextPage = () => setPageNumber(p => Math.min(p + 1, numPages || 1));
  const zoomIn = () => setScale(s => parseFloat((s + 0.1).toFixed(2)));
  const zoomOut = () => setScale(s => parseFloat(Math.max(s - 0.1, 0.2).toFixed(2)));

  // --- SIGNATURE PLACEMENT LOGIC ---
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Pan Mode
    if (isPanMode && viewerContainerRef.current) {
      setIsPanning(true);
      panStartCoords.current = { x: e.clientX, y: e.clientY };
      panStartScroll.current = { left: viewerContainerRef.current.scrollLeft, top: viewerContainerRef.current.scrollTop };
      return;
    }

    // Signature Drawing Mode
    if (isPlacingSignature && pageWrapperRef.current && !isImage) {
      const rect = pageWrapperRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setStartPoint({ x, y });
      setEndPoint({ x, y });
      setIsDrawing(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Pan Mode
    if (isPanning && viewerContainerRef.current) {
      const dx = e.clientX - panStartCoords.current.x;
      const dy = e.clientY - panStartCoords.current.y;
      viewerContainerRef.current.scrollLeft = panStartScroll.current.left - dx;
      viewerContainerRef.current.scrollTop = panStartScroll.current.top - dy;
      return;
    }

    // Signature Drawing Mode
    if (isDrawing && startPoint && pageWrapperRef.current) {
      const rect = pageWrapperRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setEndPoint({ x, y });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);

    if (isDrawing && startPoint && endPoint) {
      setIsDrawing(false);
      const finalStart = { x: Math.min(startPoint.x, endPoint.x), y: Math.min(startPoint.y, endPoint.y) };
      const finalEnd = { x: Math.max(startPoint.x, endPoint.x), y: Math.max(startPoint.y, endPoint.y) };

      if (finalEnd.x - finalStart.x > 20 && finalEnd.y - finalStart.y > 20) {
        setSignaturePlacementIntent({
          pageNumber,
          x: finalStart.x / scale,
          y: finalStart.y / scale,
          width: (finalEnd.x - finalStart.x) / scale,
          height: (finalEnd.y - finalStart.y) / scale,
        });
        setIsSigningOpen(true);
        setIsPlacingSignature(false);
      }
      setStartPoint(null);
      setEndPoint(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-slate-100 z-[2000] flex flex-col transition-opacity duration-200 ${isShowing ? 'opacity-100' : 'opacity-0'}`}>

      {/* --- 1. TOP TOOLBAR --- */}
      <div className="h-14 bg-white border-b border-slate-300 flex items-center justify-between px-2 md:px-4 shadow-sm shrink-0 z-30">
        {/* Left: Sidebar Toggle & File Info */}
        <div className="flex items-center gap-2 md:gap-3 w-auto md:w-1/4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2 rounded hover:bg-slate-100 ${isSidebarOpen ? 'bg-slate-100 text-slate-800' : 'text-slate-500'}`}
          >
            <MenuIcon className="w-5 h-5" />
          </button>
          <div className="flex flex-col overflow-hidden max-w-[120px] md:max-w-none">
            <span className="text-sm font-bold text-slate-800 truncate" title={fileName}>{fileName}</span>
            <span className="text-[10px] text-slate-500 hidden md:block">{isImage ? 'IMAGE' : 'PDF DOCUMENT'}</span>
          </div>
        </div>

        {/* Center: Tools & Navigation */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Page Nav */}
          {!isImage && (
            <div className="flex items-center bg-slate-100 rounded-md border border-slate-200 mx-1 md:mx-2 h-8 md:h-9">
              <button onClick={goToPrevPage} disabled={pageNumber <= 1} className="w-8 md:w-9 h-full flex items-center justify-center hover:bg-white rounded-l-md text-slate-600 disabled:opacity-30">
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <div className="px-2 md:px-3 text-xs md:text-sm font-semibold text-slate-700 min-w-[3rem] md:min-w-[3.5rem] text-center border-x border-slate-200 bg-white h-full flex items-center justify-center">
                {pageNumber} <span className="text-slate-400 mx-1">/</span> {numPages || '-'}
              </div>
              <button onClick={goToNextPage} disabled={pageNumber >= (numPages ?? 1)} className="w-8 md:w-9 h-full flex items-center justify-center hover:bg-white rounded-r-md text-slate-600 disabled:opacity-30">
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="hidden sm:block w-px h-6 bg-slate-300 mx-1 md:mx-2"></div>

          {/* Zoom Controls - Hidden on very small screens */}
          <div className="hidden sm:flex items-center">
            <button onClick={zoomOut} className="p-1.5 md:p-2 hover:bg-slate-100 rounded-full text-slate-600">
              <ZoomOutIcon className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <span className="text-xs md:text-sm font-bold text-slate-700 w-10 md:w-12 text-center">{Math.round(scale * 100)}%</span>
            <button onClick={zoomIn} className="p-1.5 md:p-2 hover:bg-slate-100 rounded-full text-slate-600">
              <ZoomInIcon className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>

          <div className="hidden md:block w-px h-6 bg-slate-300 mx-2"></div>

          {/* Tools */}
          <button
            onClick={() => setIsPanMode(!isPanMode)}
            className={`hidden md:block p-2 rounded hover:bg-slate-100 ${isPanMode ? 'bg-slate-200 text-teal-600 shadow-inner' : 'text-slate-600'}`}
            title="Pan Tool"
          >
            <HandIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 md:gap-3 justify-end flex-1 md:flex-none md:w-1/4">
          {/* Signature Tools Group */}
          {!isImage && (
            <div className="flex items-center gap-1 md:gap-2 mr-1 md:mr-2">
              <button
                onClick={() => { if (isSignable) { setIsPlacingSignature(!isPlacingSignature); setIsPanMode(false); } }}
                disabled={!isSignable}
                className={`flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 rounded-full border transition-all ${isPlacingSignature ? 'bg-teal-50 border-teal-200 text-teal-700 shadow-sm' : 'border-transparent hover:bg-slate-100 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed'}`}
                title={isSignable ? "Ký số" : "Tài liệu không cho phép ký"}
              >
                <SignatureIcon className="w-4 h-4" />
                <span className="text-xs md:text-sm font-semibold hidden sm:inline">Ký số</span>
              </button>

              <button
                onClick={() => setIsSendSignOpen(true)}
                disabled={!isSignable}
                className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1.5 rounded-full bg-teal-600 text-white font-semibold shadow-md hover:bg-teal-700 disabled:bg-slate-300 disabled:shadow-none transition-all ml-1 md:ml-2 disabled:cursor-not-allowed"
                title={!isSignable ? "Tài liệu không cho phép trình ký" : "Trình ký"}
              >
                <PaperAirplaneIcon className="w-4 h-4" />
                <span className="text-xs md:text-sm hidden sm:inline">Trình ký</span>
              </button>
            </div>
          )}

          <div className="flex items-center gap-0.5 md:gap-1 border-l border-slate-300 pl-1 md:pl-3">
            <button onClick={handleDownload} className="p-1.5 md:p-2 hover:bg-slate-100 rounded text-slate-600 hidden sm:block" title="Download">
              <DownloadIcon className="w-5 h-5" />
            </button>
            <button onClick={handlePrint} className="p-1.5 md:p-2 hover:bg-slate-100 rounded text-slate-600 hidden sm:block" title="Print">
              <PrinterIcon className="w-5 h-5" />
            </button>
            <button onClick={handleClose} className="p-1.5 md:p-2 hover:bg-red-50 hover:text-red-500 rounded text-slate-600 ml-1 md:ml-2" title="Close">
              <XIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* --- 2. MAIN BODY --- */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Backdrop for Mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-30 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* LEFT SIDEBAR */}
        <div
          className={`bg-white border-r border-slate-300 flex flex-col transition-all duration-300 ease-in-out absolute md:relative z-40 h-full shadow-2xl md:shadow-none ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full opacity-0 overflow-hidden'}`}
        >
          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveSidebarTab('thumbnails')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide ${activeSidebarTab === 'thumbnails' ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Trang
            </button>
            <button
              onClick={() => setActiveSidebarTab('signatures')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide ${activeSidebarTab === 'signatures' ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Chữ ký ({signatures.length})
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {activeSidebarTab === 'thumbnails' && (
              <div className="space-y-4">
                {!isImage ? Array.from(new Array(numPages), (el, index) => (
                  <div
                    key={`thumb_${index + 1}`}
                    className={`cursor-pointer group relative ${pageNumber === index + 1 ? 'ring-2 ring-teal-500 rounded' : ''}`}
                    onClick={() => setPageNumber(index + 1)}
                  >
                    <div className="w-full aspect-[1/1.4] bg-slate-100 border border-slate-200 rounded shadow-sm flex items-center justify-center overflow-hidden">
                      <Document file={pdfUrl} loading={null} className="opacity-80 group-hover:opacity-100 transition-opacity">
                        <Page pageNumber={index + 1} width={100} renderTextLayer={false} renderAnnotationLayer={false} loading={null} />
                      </Document>
                    </div>
                    <span className="text-xs text-slate-500 mt-1 block text-center font-medium group-hover:text-teal-600">Trang {index + 1}</span>
                  </div>
                )) : (
                  <div className="p-4 text-center text-sm text-slate-500">No thumbnails for Image</div>
                )}
              </div>
            )}

            {activeSidebarTab === 'signatures' && (
              <div className="space-y-3">
                {/* Combine both signatures lists */}
                {[...extractedSignatures, ...signatures].length === 0 ? (
                  <div className="text-center py-8 text-slate-400 italic text-sm">Chưa có chữ ký nào</div>
                ) : (
                  [...extractedSignatures, ...signatures].map((sig, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-3 hover:border-teal-400 cursor-pointer transition-all" onClick={() => { setPageNumber(sig.placement.pageNumber); setViewingSignature(sig); }}>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircleIcon className="w-4 h-4 text-green-500" />
                        <span className="font-bold text-sm text-slate-700 truncate">{sig.signerName}</span>
                      </div>
                      <div className="text-xs text-slate-500 space-y-1 pl-6 border-l-2 border-slate-200 ml-2">
                        <p>{sig.signerTitle || 'Authenticated User'}</p>
                        <p className="font-mono">{sig.signedAt.toLocaleString('vi-VN')}</p>
                        {/* DEBUG: Show raw props to find where the name is */}
                        <div className="text-[10px] text-gray-400 bg-gray-100 p-1 rounded mt-1 overflow-x-auto">
                          ID: {sig.id.substring(0, 10)}...<br />
                          DEBUG: {(sig as any)._debugInfo}
                        </div>
                      </div>
                      <div className="mt-2 flex justify-end">
                        <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-600">Trang {sig.placement.pageNumber}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* VIEWER CONTENT */}
        <div
          ref={viewerContainerRef}
          className={`flex-1 relative overflow-auto bg-slate-100 flex justify-center custom-scrollbar ${isPanMode ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : (isPlacingSignature ? 'cursor-crosshair' : 'cursor-default')}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        >
          <div className="py-8 min-h-full flex flex-col justify-center">
            {isLoading && (
              <div className="flex items-center justify-center gap-3 text-slate-500">
                <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                Looking for document...
              </div>
            )}

            {error && (
              <div className="text-red-500 text-center p-10 bg-white rounded-lg shadow-sm border border-red-100 m-10">
                <XIcon className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>{error}</p>
              </div>
            )}

            <div
              ref={pageWrapperRef}
              className="relative shadow-xl transition-transform duration-100 ease-linear bg-white m-auto"
              style={{
                width: pageDimensions ? pageDimensions.width * scale : 'auto',
                height: pageDimensions ? pageDimensions.height * scale : 'auto',
              }}
            >
              {isImage ? (
                <img
                  src={pdfUrl}
                  className="w-full h-full object-contain pointer-events-none"
                  onLoad={(e) => {
                    setPageDimensions({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight });
                    setIsLoading(false);
                  }}
                />
              ) : (
                <Document file={pdfUrl} loading={null} onLoadSuccess={onDocumentLoadSuccess} onLoadError={(e) => { setError(e.message); setIsLoading(false); }}>
                  <Page
                    pageNumber={pageNumber}
                    scale={scale}
                    onLoadSuccess={onPageLoadSuccess}
                    renderTextLayer={false}
                    renderAnnotationLayer={true}
                    className="shadow-sm"
                    loading={null}
                  />
                </Document>
              )}

              {/* Overlays */}
              {isDrawing && startPoint && endPoint && (
                <div
                  className="absolute border-2 border-dashed border-teal-600 bg-teal-500/10"
                  style={{
                    left: Math.min(startPoint.x, endPoint.x),
                    top: Math.min(startPoint.y, endPoint.y),
                    width: Math.abs(endPoint.x - startPoint.x),
                    height: Math.abs(endPoint.y - startPoint.y),
                  }}
                />
              )}

              {onDeleteSignature && signatures.map((sig, idx) => {
                if (sig.placement.pageNumber !== pageNumber && !isImage) return null;
                return (
                  <div
                    key={idx}
                    className="group absolute border border-transparent hover:border-teal-500 hover:bg-teal-50/10 z-10 cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); setViewingSignature(sig); }}
                    style={{
                      left: `${sig.placement.x * scale}px`,
                      top: `${sig.placement.y * scale}px`,
                      width: `${sig.placement.width * scale}px`,
                      height: `${sig.placement.height * scale}px`,
                    }}
                  >
                    <img src={sig.dataUrl} className="w-full h-full object-contain" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      <SignatureModal
        isOpen={isSigningOpen}
        onClose={() => setIsSigningOpen(false)}
        onSave={(dataUrl) => {
          if (onSign && signaturePlacementIntent) onSign(dataUrl, signaturePlacementIntent);
          setIsSigningOpen(false);
          setSignaturePlacementIntent(null);
        }}
      />
      <SendSignModal
        isOpen={isSendSignOpen}
        onClose={() => setIsSendSignOpen(false)}
        onSend={(data) => {
          console.log('Sending for signature:', data);
          if (onSubmit) onSubmit();
          setIsSendSignOpen(false);
        }}
      />

      {/* Signature Verification Popover */}
      {viewingSignature && (
        <div className="fixed inset-0 bg-black/50 z-[2100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setViewingSignature(null)}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                Xác thực Chữ ký số
              </h3>
              <button onClick={() => setViewingSignature(null)} className="text-slate-400 hover:text-slate-600"><XIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                  <BuildingOfficeIcon className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 uppercase font-bold tracking-wider mb-1">Được ký bởi</p>
                  <p className="text-xl font-bold text-slate-900">{viewingSignature.signerName}</p>
                  <p className="text-slate-600 italic">{viewingSignature.signerTitle}</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded border border-slate-200 p-4 space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Thời gian ký:</span>
                  <span className="font-mono font-medium text-slate-700">{viewingSignature.signedAt.toLocaleString('vi-VN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Trạng thái:</span>
                  <span className="text-green-600 font-bold flex items-center gap-1"><CheckCircleIcon className="w-3 h-3" /> Hợp lệ</span>
                </div>
              </div>

              {onDeleteSignature && (
                <button
                  onClick={() => { setSignatureToDeleteIndex(signatures.indexOf(viewingSignature)); setViewingSignature(null); }}
                  className="w-full py-2.5 border border-red-200 text-red-600 hover:bg-red-50 font-bold rounded flex items-center justify-center gap-2 transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                  Hủy bỏ chữ ký này
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={signatureToDeleteIndex !== null}
        onClose={() => setSignatureToDeleteIndex(null)}
        onConfirm={() => {
          if (signatureToDeleteIndex !== null && onDeleteSignature) onDeleteSignature(signatureToDeleteIndex);
          setSignatureToDeleteIndex(null);
        }}
        title="Xác nhận hủy chữ ký"
        message="Bạn có chắc chắn muốn xóa chữ ký số này khỏi tài liệu? Hành động này không thể hoàn tác."
      />
    </div>
  );
};

export default PdfPreviewModal;
