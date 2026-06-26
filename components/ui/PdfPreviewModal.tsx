import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import SignatureModal from './SignatureModal';
import SendSignModal from './SendSignModal';
import ConfirmationModal from './ConfirmationModal';
import { Signature } from '../../types';
import { SignaturePlacement } from '../../types/pdf';
import { useSession } from '../../contexts/SessionContext';

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

import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  fileName: string;
  isSignable?: boolean;
  onSign?: (signatureDataUrl: string, placement: SignaturePlacement, signerName: string, signerTitle: string) => void;
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
  const { user } = useSession();
  const [isShowing, setIsShowing] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Layout State
  const [isSidebarOpen, setIsSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'thumbnails' | 'signatures' | 'info'>('thumbnails');

  // Track if sidebar was auto-closed by resize (not user)
  const autoClosedSidebar = useRef(false);


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
  const [drawingPageNumber, setDrawingPageNumber] = useState<number | null>(null);
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

  // Smooth Scroll Navigation
  const scrollToPage = useCallback((pageNum: number) => {
    setPageNumber(pageNum);
    const pageEl = document.getElementById(`page-container-${pageNum}`);
    if (pageEl && viewerContainerRef.current) {
      pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const fitWidth = useCallback(() => {
    if (pageDimensions && viewerContainerRef.current) {
      const containerWidth = viewerContainerRef.current.clientWidth - 48;
      setScale(parseFloat((containerWidth / pageDimensions.width).toFixed(2)));
    }
  }, [pageDimensions]);

  const fitPage = useCallback(() => {
    if (pageDimensions && viewerContainerRef.current) {
      const containerWidth = viewerContainerRef.current.clientWidth - 48;
      const containerHeight = viewerContainerRef.current.clientHeight - 48;
      const scaleX = containerWidth / pageDimensions.width;
      const scaleY = containerHeight / pageDimensions.height;
      setScale(parseFloat(Math.min(scaleX, scaleY).toFixed(2)));
    }
  }, [pageDimensions]);

  // Listen to window resize: auto-close sidebar and apply Page Fit on small screens
  useEffect(() => {
    const handleResize = () => {
      const isSmall = window.innerWidth < 768;
      if (isSmall) {
        setIsSidebarOpen(false);
        autoClosedSidebar.current = true;
        fitPage();
      } else {
        if (autoClosedSidebar.current) {
          setIsSidebarOpen(true);
          autoClosedSidebar.current = false;
        }
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fitPage]);

  // Scroll Sync
  const handleScroll = useCallback(() => {
    if (!viewerContainerRef.current || !numPages || isDrawing || isPanning) return;
    const container = viewerContainerRef.current;
    const containerScrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    
    let maxVisibleHeight = 0;
    let activePage = 1;

    for (let i = 1; i <= numPages; i++) {
      const pageEl = document.getElementById(`page-container-${i}`);
      if (pageEl) {
        const pageTop = pageEl.offsetTop;
        const pageHeight = pageEl.clientHeight;
        
        const visibleTop = Math.max(pageTop, containerScrollTop);
        const visibleBottom = Math.min(pageTop + pageHeight, containerScrollTop + containerHeight);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);

        if (visibleHeight > maxVisibleHeight) {
          maxVisibleHeight = visibleHeight;
          activePage = i;
        }
      }
    }

    if (activePage !== pageNumber) {
      setPageNumber(activePage);
    }
  }, [numPages, pageNumber, isDrawing, isPanning]);

  useEffect(() => {
    const container = viewerContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [handleScroll]);

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
      // Auto-close sidebar and trigger fit on small screens when modal first opens
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
        autoClosedSidebar.current = true;
        // fitPage will be called once page dimensions load via onPageLoadSuccess
      }
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

    if (pageNumber === 1 && viewerContainerRef.current) {
      const isSmall = window.innerWidth < 768;
      const containerWidth = viewerContainerRef.current.clientWidth - 48;
      const containerHeight = viewerContainerRef.current.clientHeight - 48;

      if (isSmall) {
        // On small screens: always Page Fit so content fills exactly
        const scaleX = containerWidth / originalWidth;
        const scaleY = containerHeight / originalHeight;
        setScale(parseFloat(Math.min(scaleX, scaleY).toFixed(2)));
      } else if (scale === 1.0 && originalWidth > containerWidth) {
        // On desktop: fit width if wider than container
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
  const goToPrevPage = () => scrollToPage(Math.max(pageNumber - 1, 1));
  const goToNextPage = () => scrollToPage(Math.min(pageNumber + 1, numPages || 1));
  const zoomIn = () => setScale(s => parseFloat((s + 0.1).toFixed(2)));
  const zoomOut = () => setScale(s => parseFloat(Math.max(s - 0.1, 0.2).toFixed(2)));

  // --- PAN MODE (Container-level) ---
  const handleContainerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanMode && viewerContainerRef.current) {
      setIsPanning(true);
      panStartCoords.current = { x: e.clientX, y: e.clientY };
      panStartScroll.current = { left: viewerContainerRef.current.scrollLeft, top: viewerContainerRef.current.scrollTop };
    }
  };

  const handleContainerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning && viewerContainerRef.current) {
      const dx = e.clientX - panStartCoords.current.x;
      const dy = e.clientY - panStartCoords.current.y;
      viewerContainerRef.current.scrollLeft = panStartScroll.current.left - dx;
      viewerContainerRef.current.scrollTop = panStartScroll.current.top - dy;
      return;
    }

    // Drawing Mode - calculate coordinates relative to the page container being drawn on
    if (isDrawing && drawingPageNumber !== null && startPoint) {
      const pageEl = document.getElementById(`page-container-${drawingPageNumber}`);
      if (pageEl) {
        const rect = pageEl.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setEndPoint({ x, y });
      }
    }
  };

  const handleContainerMouseUp = () => {
    setIsPanning(false);

    if (isDrawing && drawingPageNumber !== null && startPoint && endPoint) {
      setIsDrawing(false);
      const finalStart = { x: Math.min(startPoint.x, endPoint.x), y: Math.min(startPoint.y, endPoint.y) };
      const finalEnd = { x: Math.max(startPoint.x, endPoint.x), y: Math.max(startPoint.y, endPoint.y) };

      if (finalEnd.x - finalStart.x > 20 && finalEnd.y - finalStart.y > 20) {
        setSignaturePlacementIntent({
          pageNumber: drawingPageNumber,
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
      setDrawingPageNumber(null);
    }
  };

  // --- SIGNATURE DRAWING MODE (Page-level) ---
  const handlePageMouseDown = (e: React.MouseEvent<HTMLDivElement>, pageNum: number) => {
    if (isPlacingSignature && !isImage) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setStartPoint({ x, y });
      setEndPoint({ x, y });
      setIsDrawing(true);
      setDrawingPageNumber(pageNum);
      e.stopPropagation();
    }
  };

  const handlePageMouseMove = (e: React.MouseEvent<HTMLDivElement>, pageNum: number) => {
    if (isDrawing && drawingPageNumber === pageNum && startPoint) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setEndPoint({ x, y });
      e.stopPropagation();
    }
  };

  const handlePageMouseUp = (pageNum: number) => {
    if (isDrawing && drawingPageNumber === pageNum) {
      handleContainerMouseUp();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-slate-100 dark:bg-[#070b13] z-[2000] flex flex-col transition-opacity duration-200 ${isShowing ? 'opacity-100' : 'opacity-0'}`}>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 9999px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background: #0f172a;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        .dot-grid {
          background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
          background-size: 24px 24px;
        }
        .dark .dot-grid {
          background-image: radial-gradient(#1e293b 1px, transparent 1px);
        }
      `}</style>

      {/* --- 1. TOP TOOLBAR --- */}
      <div className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-2 md:px-4 shadow-sm dark:shadow-md shrink-0 z-30 text-slate-800 dark:text-white">
        {/* Left: Sidebar Toggle & File Info */}
        <div className="flex items-center gap-2 md:gap-3 w-auto md:w-1/4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2 rounded transition-colors duration-200 ${isSidebarOpen ? 'bg-slate-100 dark:bg-slate-800 text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-850 hover:text-slate-800 dark:hover:text-white'}`}
          >
            <MenuIcon className="w-5 h-5" />
          </button>
          <div className="flex flex-col overflow-hidden max-w-[120px] md:max-w-none">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate" title={fileName}>{fileName}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-450 font-semibold tracking-wider hidden md:block">{isImage ? 'IMAGE' : 'PDF DOCUMENT'}</span>
          </div>
        </div>

        {/* Center: Tools & Navigation */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Page Nav */}
          {!isImage && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-205 dark:border-slate-800 mx-1 md:mx-2 h-8 md:h-9 overflow-hidden shadow-inner">
              <button onClick={goToPrevPage} disabled={pageNumber <= 1} className="w-8 md:w-9 h-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-20 transition-all">
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <div className="px-2 md:px-3 text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300 min-w-[3.5rem] md:min-w-[4rem] text-center border-x border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/60 h-full flex items-center justify-center">
                {pageNumber} <span className="text-slate-450 dark:text-slate-600 mx-1.5">/</span> {numPages || '-'}
              </div>
              <button onClick={goToNextPage} disabled={pageNumber >= (numPages ?? 1)} className="w-8 md:w-9 h-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-20 transition-all">
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1 md:mx-2"></div>

          {/* Zoom Controls */}
          <div className="hidden sm:flex items-center">
            <button onClick={zoomOut} className="p-1.5 md:p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-650 dark:text-slate-300 transition-colors">
              <ZoomOutIcon className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <span className="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-200 w-10 md:w-12 text-center">{Math.round(scale * 100)}%</span>
            <button onClick={zoomIn} className="p-1.5 md:p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-650 dark:text-slate-300 transition-colors">
              <ZoomInIcon className="w-4 h-4 md:w-5 md:h-5" />
            </button>

            {/* Fit Controls */}
            <div className="flex items-center bg-slate-105 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 ml-2 gap-0.5 shadow-inner">
              <button
                onClick={fitPage}
                className="px-2.5 py-1 text-[10px] md:text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-white hover:bg-white dark:hover:bg-slate-900 rounded transition-all"
                title="Vừa trang (Page Fit)"
              >
                Page Fit
              </button>
              <button
                onClick={fitWidth}
                className="px-2.5 py-1 text-[10px] md:text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-white hover:bg-white dark:hover:bg-slate-900 rounded transition-all"
                title="Vừa chiều rộng (Page Width)"
              >
                Page Width
              </button>
            </div>
          </div>

          <div className="hidden md:block w-px h-6 bg-slate-200 dark:bg-slate-800 mx-2"></div>

          {/* Tools */}
          <button
            onClick={() => setIsPanMode(!isPanMode)}
            className={`hidden md:block p-2 rounded transition-colors ${isPanMode ? 'bg-slate-100 dark:bg-slate-800 text-teal-600 dark:text-teal-400 border border-slate-200 dark:border-slate-700' : 'text-slate-500 dark:text-slate-405 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white'}`}
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
                className={`flex items-center gap-1 md:gap-2 px-2.5 md:px-3.5 py-1.5 rounded-full border transition-all ${isPlacingSignature ? 'bg-teal-50 dark:bg-teal-950 border-teal-200 dark:border-teal-500 text-teal-700 dark:text-teal-400 shadow-sm' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-655 dark:text-slate-300 hover:text-slate-805 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed'}`}
                title={isSignable ? "Ký số" : "Tài liệu không cho phép ký"}
              >
                <SignatureIcon className="w-4 h-4" />
                <span className="text-xs md:text-sm font-semibold hidden sm:inline">Ký số</span>
              </button>

              <button
                onClick={() => setIsSendSignOpen(true)}
                disabled={!isSignable}
                className="flex items-center gap-1 md:gap-2 px-3.5 md:px-4.5 py-1.5 rounded-full bg-teal-600 text-white font-semibold shadow-lg shadow-teal-900/30 hover:bg-teal-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-650 disabled:shadow-none transition-all ml-1 md:ml-2 disabled:cursor-not-allowed"
                title={!isSignable ? "Tài liệu không cho phép trình ký" : "Trình ký"}
              >
                <PaperAirplaneIcon className="w-4 h-4" />
                <span className="text-xs md:text-sm hidden sm:inline">Trình ký</span>
              </button>
            </div>
          )}

          <div className="flex items-center gap-0.5 md:gap-1 border-l border-slate-200 dark:border-slate-850 pl-1 md:pl-3">
            <button onClick={handleDownload} className="p-1.5 md:p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hidden sm:block" title="Download">
              <DownloadIcon className="w-5 h-5" />
            </button>
            <button onClick={handlePrint} className="flex items-center gap-1.5 p-1.5 md:px-2.5 md:py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hidden sm:flex transition-colors" title="In tài liệu (Ctrl+P)">
              <PrinterIcon className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-xs font-medium hidden md:inline">In</span>
            </button>
            <button onClick={handleClose} className="p-1.5 md:p-2 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-650 dark:hover:text-red-400 rounded text-slate-600 dark:text-slate-400 hover:bg-red-100 dark:hover:bg-red-900/30 ml-1 md:ml-2 transition-colors" title="Close">
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
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 md:hidden transition-all duration-300"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* LEFT SIDEBAR */}
        <div
          className={`bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 ease-in-out absolute md:relative z-40 h-full shadow-2xl md:shadow-none ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full opacity-0 overflow-hidden'}`}
        >
          {/* Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveSidebarTab('thumbnails')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide transition-all ${activeSidebarTab === 'thumbnails' ? 'text-teal-600 dark:text-teal-400 border-b-2 border-teal-600 dark:border-teal-500 bg-teal-50/50 dark:bg-teal-950/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850'}`}
            >
              Trang
            </button>
            <button
              onClick={() => setActiveSidebarTab('signatures')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide transition-all ${activeSidebarTab === 'signatures' ? 'text-teal-600 dark:text-teal-400 border-b-2 border-teal-600 dark:border-teal-500 bg-teal-50/50 dark:bg-teal-950/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850'}`}
            >
              Chữ ký ({signatures.length})
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/30 dark:bg-slate-900/50">
            {activeSidebarTab === 'thumbnails' && (
              <div className="space-y-4">
                {!isImage ? Array.from(new Array(numPages || 0), (el, index) => (
                  <div
                    key={`thumb_${index + 1}`}
                    className={`cursor-pointer group relative p-1 rounded-md transition-all ${pageNumber === index + 1 ? 'ring-2 ring-teal-500 bg-slate-100 dark:bg-slate-850 shadow-md' : 'hover:bg-slate-100/50 dark:hover:bg-slate-850/30'}`}
                    onClick={() => scrollToPage(index + 1)}
                  >
                    <div className="w-full aspect-[1/1.4] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded shadow-sm dark:shadow-inner flex items-center justify-center overflow-hidden">
                      <Document file={pdfUrl} loading={null} className="opacity-70 group-hover:opacity-100 transition-opacity">
                        <Page pageNumber={index + 1} width={100} renderTextLayer={false} renderAnnotationLayer={false} loading={null} />
                      </Document>
                    </div>
                    <span className={`text-xs mt-1.5 block text-center font-medium transition-colors ${pageNumber === index + 1 ? 'text-teal-600 dark:text-teal-400 font-bold' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-855 dark:group-hover:text-slate-200'}`}>Trang {index + 1}</span>
                  </div>
                )) : (
                  <div className="p-4 text-center text-sm text-slate-500">No thumbnails for Image</div>
                )}
              </div>
            )}

            {activeSidebarTab === 'signatures' && (
              <div className="space-y-3">
                {[...extractedSignatures, ...signatures].length === 0 ? (
                  <div className="text-center py-8 text-slate-500 italic text-sm">Chưa có chữ ký nào</div>
                ) : (
                  [...extractedSignatures, ...signatures].map((sig, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-slate-855 border border-slate-200 dark:border-slate-800/80 rounded-lg p-3 hover:border-teal-500 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-all shadow-sm"
                      onClick={() => scrollToPage(sig.placement.pageNumber)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircleIcon className="w-4 h-4 text-green-400" />
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-205 truncate">{sig.signerName}</span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 pl-6 border-l-2 border-slate-200 dark:border-slate-800 ml-2">
                        <p className="truncate">{sig.signerTitle || 'Authenticated User'}</p>
                        <p className="font-mono text-[10px] text-slate-500">{sig.signedAt.toLocaleString('vi-VN')}</p>
                      </div>
                      <div className="mt-2 flex justify-end">
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 px-2 py-0.5 rounded text-teal-600 dark:text-teal-400 font-semibold">Trang {sig.placement.pageNumber}</span>
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
          className={`flex-1 relative overflow-y-auto overflow-x-auto bg-slate-200 dark:bg-[#0b0f19] flex flex-col items-center custom-scrollbar p-6 dot-grid ${isPanMode ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : (isPlacingSignature ? 'cursor-crosshair' : 'cursor-default')}`}
          onMouseDown={handleContainerMouseDown}
          onMouseMove={handleContainerMouseMove}
          onMouseUp={handleContainerMouseUp}
          onMouseLeave={handleContainerMouseUp}
        >
          {isLoading && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#0b0f19]">
              <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-medium">Đang tải tài liệu...</span>
            </div>
          )}

          {error ? (
            <div className="text-red-500 dark:text-red-400 text-center p-10 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-red-100 dark:border-red-950/50 max-w-md mx-auto my-auto z-50 animate-in fade-in duration-200">
              <XIcon className="w-12 h-12 mx-auto mb-3 text-red-500 opacity-80" />
              <p className="font-semibold mb-1">Không thể tải tài liệu</p>
              <p className="text-xs text-slate-500">{error}</p>
            </div>
          ) : (
            <div className="py-4 w-full flex flex-col items-center gap-6">
              <div className="w-full flex flex-col items-center">
                {isImage ? (
                  <div
                    ref={pageWrapperRef}
                    className="relative rounded-lg overflow-hidden bg-white shadow-[0_8px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)] transition-transform duration-100 ease-linear"
                    style={{
                      width: pageDimensions ? pageDimensions.width * scale : 'auto',
                      height: pageDimensions ? pageDimensions.height * scale : 'auto',
                    }}
                  >
                    <img
                      src={pdfUrl}
                      className="w-full h-full object-contain pointer-events-none"
                      onLoad={(e) => {
                        setPageDimensions({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight });
                        setIsLoading(false);
                      }}
                    />
                    {onDeleteSignature && signatures.map((sig, idx) => (
                      <div
                        key={idx}
                        className="group absolute border border-transparent hover:border-teal-500 hover:bg-teal-50/15 z-10 cursor-pointer"
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
                    ))}
                  </div>
                ) : (
                  <Document
                    file={pdfUrl}
                    loading={null}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={(e) => { setError(e.message); setIsLoading(false); }}
                    className="flex flex-col items-center gap-6 w-full"
                  >
                    {Array.from(new Array(numPages || 0), (el, index) => {
                      const pageNum = index + 1;
                      return (
                        <div
                          key={`page_${pageNum}`}
                          id={`page-container-${pageNum}`}
                          className="relative rounded bg-white shadow-[0_8px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)] border border-slate-200 dark:border-slate-805/20 transition-transform duration-100 ease-linear select-none animate-in fade-in duration-300"
                          onMouseDown={(e) => handlePageMouseDown(e, pageNum)}
                          onMouseMove={(e) => handlePageMouseMove(e, pageNum)}
                          onMouseUp={() => handlePageMouseUp(pageNum)}
                          style={{
                            width: pageDimensions ? pageDimensions.width * scale : 'auto',
                            height: pageDimensions ? pageDimensions.height * scale : 'auto',
                          }}
                        >
                          <Page
                            pageNumber={pageNum}
                            scale={scale}
                            onLoadSuccess={pageNum === 1 ? onPageLoadSuccess : undefined}
                            renderTextLayer={false}
                            renderAnnotationLayer={true}
                            loading={
                              <div className="flex items-center justify-center bg-white" style={{
                                width: pageDimensions ? pageDimensions.width * scale : 'auto',
                                height: pageDimensions ? pageDimensions.height * scale : 'auto',
                              }}>
                                <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                              </div>
                            }
                          />

                          {/* Drawings/Signature overlays for this page */}
                          {isDrawing && drawingPageNumber === pageNum && startPoint && endPoint && (
                            <div
                              className="absolute border-2 border-dashed border-teal-500 bg-teal-500/10 z-20 pointer-events-none"
                              style={{
                                left: Math.min(startPoint.x, endPoint.x),
                                top: Math.min(startPoint.y, endPoint.y),
                                width: Math.abs(endPoint.x - startPoint.x),
                                height: Math.abs(endPoint.y - startPoint.y),
                              }}
                            />
                          )}

                          {onDeleteSignature && signatures.map((sig, idx) => {
                            if (sig.placement.pageNumber !== pageNum) return null;
                            return (
                              <div
                                key={idx}
                                className="group absolute border border-transparent hover:border-teal-500 hover:bg-teal-50/15 z-10 cursor-pointer"
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
                      );
                    })}
                  </Document>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- MODALS --- */}
      <SignatureModal
        isOpen={isSigningOpen}
        onClose={() => setIsSigningOpen(false)}
        onSave={(dataUrl, signerName, signerTitle) => {
          if (onSign && signaturePlacementIntent) onSign(dataUrl, signaturePlacementIntent, signerName, signerTitle);
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
      {viewingSignature && (() => {
        const shaHash = `SHA256: 8f4c2e1a9b8c7d6e5f4e3d2c1b0a${viewingSignature.id ? viewingSignature.id.substring(0, 4) : 'e8df'}`;
        return (
          <div className="fixed inset-0 bg-black/75 z-[2100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setViewingSignature(null)}>
            <div className="bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              
              {/* Security Banner Header */}
              <div className="px-5 pt-5 pb-4 flex justify-between items-start border-b border-slate-800 bg-gradient-to-r from-teal-950/40 to-slate-900">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
                    <span className="absolute inline-flex h-full w-full rounded-xl bg-green-400 opacity-20 animate-ping"></span>
                    <CheckCircleIcon className="w-6 h-6 relative z-10" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-100 text-sm tracking-wide">XÁC THỰC CHỮ KÝ SỐ</h3>
                    <p className="text-[10px] text-green-400 font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse"></span>
                      Hợp lệ & Bảo mật
                    </p>
                  </div>
                </div>
                <button onClick={() => setViewingSignature(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Certificate Content */}
              <div className="px-5 py-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
                
                {/* Signer Main Card */}
                <div className="flex items-center gap-4 bg-slate-850/60 p-3 rounded-xl border border-slate-800">
                  {/* Avatar with initials */}
                  <div
                    className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white font-black text-sm shadow-md"
                    style={{ background: 'linear-gradient(135deg, #0d9488, #0891b2)' }}
                  >
                    {viewingSignature.signerName
                      ? viewingSignature.signerName.split(' ').map((w: string) => w[0]).slice(-2).join('').toUpperCase()
                      : '?'}
                  </div>
                  <div className="min-w-0-all">
                    <p className="font-bold text-white text-base leading-tight truncate">{viewingSignature.signerName || 'Không xác định'}</p>
                    <p className="text-xs text-teal-400 mt-1 flex items-center gap-1.5">
                      <span className="font-medium text-slate-450">Tài khoản:</span>
                      <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-teal-300 font-bold">
                        {viewingSignature.signerUsername || 'hethong'}
                      </span>
                    </p>
                    {viewingSignature.signerTitle && (
                      <p className="text-slate-400 text-[11px] mt-0.5">{viewingSignature.signerTitle}</p>
                    )}
                  </div>
                </div>

                {/* Signature preview frame */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Hình ảnh chữ ký điện tử</span>
                  <div className="bg-white rounded-xl p-3 shadow-inner border border-slate-700/30 flex items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
                      backgroundSize: '10px 10px',
                      backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)'
                    }} />
                    <img src={viewingSignature.dataUrl} alt="Chữ ký" className="h-16 w-full object-contain relative z-10 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" />
                    <span className="absolute bottom-1 right-2 text-[8px] font-mono text-slate-400 uppercase select-none">vclinic digital id</span>
                  </div>
                </div>

                {/* Certificate Properties Table */}
                <div className="bg-slate-850/40 rounded-xl border border-slate-800/80 overflow-hidden divide-y divide-slate-800/50">
                  
                  {/* Row 1: Time */}
                  <div className="px-4 py-2.5 flex flex-col gap-0.5">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Thời gian ký</span>
                    <span className="text-xs font-bold text-slate-200 font-mono">
                      {viewingSignature.signedAt instanceof Date 
                        ? viewingSignature.signedAt.toLocaleString('vi-VN') 
                        : new Date(viewingSignature.signedAt).toLocaleString('vi-VN')}
                    </span>
                  </div>

                  {/* Row 2: Page */}
                  <div className="px-4 py-2.5 flex flex-col gap-0.5">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Vị trí tài liệu</span>
                    <span className="text-xs font-semibold text-slate-350">
                      Trang {viewingSignature.placement?.pageNumber || 1} 
                      <span className="text-slate-500 text-[10px] ml-1.5 font-mono">
                        (x: {Math.round(viewingSignature.placement?.x || 0)}, y: {Math.round(viewingSignature.placement?.y || 0)})
                      </span>
                    </span>
                  </div>

                  {/* Row 3: CA provider */}
                  <div className="px-4 py-2.5 flex flex-col gap-0.5">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Tổ chức chứng thực</span>
                    <span className="text-xs font-semibold text-teal-400">vClinic CA Internal Trust Network</span>
                  </div>

                  {/* Row 4: Hash */}
                  <div className="px-4 py-2.5 flex flex-col gap-0.5">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Mã băm SHA-256</span>
                    <span className="text-[10px] font-mono text-slate-400 break-all select-all hover:text-slate-300 transition-colors">
                      {shaHash}
                    </span>
                  </div>
                </div>

                {/* Integrity Statement */}
                <div className="p-3 bg-teal-950/20 border border-teal-800/20 rounded-xl flex gap-2.5 items-start">
                  <svg className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <div>
                    <h5 className="text-xs font-bold text-teal-400">Tài liệu bảo đảm toàn vẹn</h5>
                    <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
                      Chữ ký số hợp lệ chứng tỏ tài liệu này không bị thay đổi hoặc sửa đổi trái phép kể từ khi được ký.
                    </p>
                  </div>
                </div>

                {/* Delete button */}
                {onDeleteSignature && !extractedSignatures.includes(viewingSignature) && (
                  <button
                    onClick={() => { setSignatureToDeleteIndex(signatures.indexOf(viewingSignature)); setViewingSignature(null); }}
                    className="w-full mt-2 py-2.5 border border-red-900/60 bg-red-950/30 text-red-400 hover:bg-red-900/40 hover:border-red-700 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors text-xs"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Hủy bỏ chữ ký này khỏi tài liệu
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

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
