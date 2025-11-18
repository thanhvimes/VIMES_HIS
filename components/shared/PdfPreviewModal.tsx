import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import SignatureModal from './SignatureModal';
import ConfirmationModal from './ConfirmationModal';
import { Signature } from '../../types';
import { 
  XIcon, 
  ShareIcon, 
  PrintIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  ZoomInIcon, 
  ZoomOutIcon,
  SignatureIcon,
  FitToWidthIcon,
  FitToPageIcon,
  HandIcon,
  InfoIcon,
  TrashIcon
} from '../Icons';

// Configure the PDF.js worker. This is essential for the library to work.
pdfjs.GlobalWorkerOptions.workerSrc = 'https://aistudiocdn.com/pdfjs-dist@^4.4.168/build/pdf.worker.min.mjs';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  fileName: string;
  isSignable?: boolean;
  onSign?: (signatureDataUrl: string, placement: any) => void;
  signatures?: Signature[];
  onDeleteSignature?: (signatureIndex: number) => void;
}

const PREDEFINED_SIGNATURE_BOX = { x: 40, y: 700, width: 150, height: 60 };
const JSPDF_A4_WIDTH = 595.28;
const JSPDF_A4_HEIGHT = 841.89;

const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({ isOpen, onClose, pdfUrl, fileName, isSignable = false, onSign, signatures = [], onDeleteSignature }) => {
  const [isShowing, setIsShowing] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSigningOpen, setIsSigningOpen] = useState(false);
  const [pageDimensions, setPageDimensions] = useState<{width: number; height: number} | null>(null);
  const [isPlacingSignature, setIsPlacingSignature] = useState(false);
  const [signaturePlacementIntent, setSignaturePlacementIntent] = useState<any | null>(null);
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const pageInputRef = useRef<HTMLInputElement>(null);
  const pageWrapperRef = useRef<HTMLDivElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [endPoint, setEndPoint] = useState<{ x: number; y: number } | null>(null);
  
  // Pan Tool State
  const [isPanMode, setIsPanMode] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStartCoords = useRef({ x: 0, y: 0 });
  const panStartScroll = useRef({ left: 0, top: 0 });

  // Signature Management State
  const [viewingSignature, setViewingSignature] = useState<Signature | null>(null);
  const [signatureToDeleteIndex, setSignatureToDeleteIndex] = useState<number | null>(null);

  const hasPredefinedSignature = useMemo(() => {
    return signatures.some(sig => 
      sig.placement.x === PREDEFINED_SIGNATURE_BOX.x &&
      sig.placement.y === PREDEFINED_SIGNATURE_BOX.y &&
      sig.placement.width === PREDEFINED_SIGNATURE_BOX.width &&
      sig.placement.height === PREDEFINED_SIGNATURE_BOX.height
    );
  }, [signatures]);

  useEffect(() => {
    if (isOpen) {
      setIsShowing(true);
      setIsLoading(true);
      setError(null);
      setPageNumber(1);
      setNumPages(null);
      setPageDimensions(null);
      setIsPlacingSignature(false);
      setSignaturePlacementIntent(null);
      setScale(1.0);
      setIsPanMode(false);
    } else {
      setIsShowing(false);
    }
  }, [isOpen, pdfUrl]);

  const onDocumentLoadSuccess = useCallback(({ numPages: nextNumPages }: { numPages: number }) => {
    setNumPages(nextNumPages);
    setIsLoading(false);
  }, []);
  
  const onPageLoadSuccess = useCallback((page: { width: number; height: number }) => {
    // Only set dimensions on the first page load to establish the document's native size
    if (!pageDimensions) {
      setPageDimensions({ width: page.width, height: page.height });
    }
  }, [pageDimensions]);

  const onDocumentLoadError = useCallback((loadError: Error) => {
    console.error('Failed to load PDF:', loadError);
    setError('Failed to load PDF file. It may be corrupted or in an unsupported format.');
    setIsLoading(false);
  }, []);

  const handleClose = useCallback(() => {
    setIsShowing(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  const handleDownloadFallback = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    try {
        const response = await fetch(pdfUrl);
        if (!response.ok) throw new Error('Failed to fetch PDF for sharing.');
        const blob = await response.blob();
        const file = new File([blob], fileName, { type: 'application/pdf' });

        if (navigator.share && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: fileName });
        } else {
            handleDownloadFallback();
        }
    } catch (error) {
        console.error('Error sharing file:', error);
        alert('Sharing is not supported on this browser or an error occurred. The file will be downloaded instead.');
        handleDownloadFallback();
    }
  };
  
  const handlePrint = () => {
    const newWindow = window.open(pdfUrl, '_blank');
    if (newWindow) {
      newWindow.focus();
    } else {
      alert('Please allow pop-ups to print the document.');
    }
  };
  
  const handleSaveSignature = (dataUrl: string) => {
    if (onSign && signaturePlacementIntent) {
      onSign(dataUrl, signaturePlacementIntent);
    }
    setIsSigningOpen(false);
    setSignaturePlacementIntent(null);
  };
  
  const handlePredefinedSignatureClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      // For predefined boxes, we can use the hardcoded point values directly
      setSignaturePlacementIntent({
        pageNumber: 1, // Assume it's on the first page as per typical invoice/report structure
        x: PREDEFINED_SIGNATURE_BOX.x,
        y: PREDEFINED_SIGNATURE_BOX.y,
        width: PREDEFINED_SIGNATURE_BOX.width,
        height: PREDEFINED_SIGNATURE_BOX.height,
      });
      setIsSigningOpen(true);
      setIsPlacingSignature(false);
  };

  const goToPrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages!));
  const zoomIn = () => setScale(prev => parseFloat((prev + 0.2).toFixed(2)));
  const zoomOut = () => setScale(prev => parseFloat(Math.max(prev - 0.2, 0.4).toFixed(2)));
  
  const handleFitToWidth = () => {
    if (viewerContainerRef.current && pageDimensions) {
        const containerWidth = viewerContainerRef.current.clientWidth - 32;
        if (containerWidth > 0) {
            const newScale = containerWidth / pageDimensions.width;
            setScale(parseFloat(newScale.toFixed(2)));
        }
    }
  };

  const handleFitToPage = () => {
    if (viewerContainerRef.current && pageDimensions) {
      const containerWidth = viewerContainerRef.current.clientWidth - 32;
      const containerHeight = viewerContainerRef.current.clientHeight - 32;
      if (containerWidth > 0 && containerHeight > 0) {
        const scaleW = containerWidth / pageDimensions.width;
        const scaleH = containerHeight / pageDimensions.height;
        setScale(parseFloat(Math.min(scaleW, scaleH).toFixed(2)));
      }
    }
  };

  const handlePageJump = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && pageInputRef.current) {
        const newPage = parseInt(pageInputRef.current.value, 10);
        if (newPage >= 1 && newPage <= (numPages ?? 1)) {
            setPageNumber(newPage);
        } else {
            pageInputRef.current.value = pageNumber.toString();
        }
        pageInputRef.current.blur();
    }
  };

  // --- SIGNATURE DRAWING LOGIC ---
  const resetDrawingState = () => {
    setIsDrawing(false);
    setStartPoint(null);
    setEndPoint(null);
  };

  const handleSignatureMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPlacingSignature || isPanMode || !pageWrapperRef.current) return;
    e.preventDefault();
    e.stopPropagation();
  
    const rect = pageWrapperRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
  
    setStartPoint({ x, y });
    setEndPoint({ x, y });
    setIsDrawing(true);
  };
  
  const handleSignatureMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !startPoint || !pageWrapperRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    
    const rect = pageWrapperRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
  
    setEndPoint({ x, y });
  };
  
  const handleSignatureMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !startPoint || !endPoint || !pageDimensions) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDrawing(false);
  
    // 1. Get final box dimensions in screen pixels (scaled)
    const finalStartPoint = {
      x: Math.min(startPoint.x, endPoint.x),
      y: Math.min(startPoint.y, endPoint.y),
    };
    const finalEndPoint = {
      x: Math.max(startPoint.x, endPoint.x),
      y: Math.max(startPoint.y, endPoint.y),
    };
    const boxWidthPx = finalEndPoint.x - finalStartPoint.x;
    const boxHeightPx = finalEndPoint.y - finalStartPoint.y;
  
    if (boxWidthPx < 20 || boxHeightPx < 20) {
      resetDrawingState();
      return;
    }
  
    // 2. Convert from screen pixels to unscaled PDF coordinates (still pixels)
    const unscaledX = finalStartPoint.x / scale;
    const unscaledY = finalStartPoint.y / scale;
    const unscaledWidth = boxWidthPx / scale;
    const unscaledHeight = boxHeightPx / scale;

    // 3. Calculate conversion ratio from react-pdf's pixel dimensions to jsPDF's point dimensions
    const xRatio = JSPDF_A4_WIDTH / pageDimensions.width;
    const yRatio = JSPDF_A4_HEIGHT / pageDimensions.height;

    // 4. Create the final placement object with coordinates in jsPDF points
    const placement = {
      pageNumber,
      x: unscaledX * xRatio,
      y: unscaledY * yRatio,
      width: unscaledWidth * xRatio,
      height: unscaledHeight * yRatio,
    };
    
    setSignaturePlacementIntent(placement);
    setIsSigningOpen(true);
    setIsPlacingSignature(false);
    resetDrawingState();
  };

  // --- PANNING LOGIC ---
  const handlePanMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanMode || !viewerContainerRef.current) return;
    e.preventDefault();
    setIsPanning(true);
    panStartCoords.current = { x: e.clientX, y: e.clientY };
    panStartScroll.current = { 
      left: viewerContainerRef.current.scrollLeft, 
      top: viewerContainerRef.current.scrollTop 
    };
  };

  const handlePanMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning || !viewerContainerRef.current) return;
    e.preventDefault();
    const dx = e.clientX - panStartCoords.current.x;
    const dy = e.clientY - panStartCoords.current.y;
    viewerContainerRef.current.scrollLeft = panStartScroll.current.left - dx;
    viewerContainerRef.current.scrollTop = panStartScroll.current.top - dy;
  };

  const handlePanMouseUp = () => {
    setIsPanning(false);
  };
  
  const getViewerCursor = () => {
    if (isPlacingSignature) return 'cursor-crosshair';
    if (isPanMode) return isPanning ? 'cursor-grabbing' : 'cursor-grab';
    return '';
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black z-50 flex justify-center items-center p-2 sm:p-4 transition-opacity duration-300 ease-out ${isShowing ? 'bg-opacity-80' : 'bg-opacity-0'}`} 
        aria-modal="true" 
        role="dialog"
      >
        <div 
          className={`bg-slate-50 dark:bg-slate-800 rounded-xl shadow-2xl w-full h-full max-w-7xl flex flex-col overflow-hidden transition-all duration-300 ease-out relative ${isShowing ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={handleClose} className="absolute top-2 right-2 z-20 p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors" aria-label="Close preview">
            <XIcon className="w-6 h-6"/>
          </button>
          
          <div className="flex justify-center items-center flex-wrap gap-x-3 gap-y-2 sm:gap-x-4 p-2 bg-white dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 shadow-sm">
            <div className="flex items-center gap-1">
              <button onClick={goToPrevPage} disabled={pageNumber <= 1 || isLoading} className="p-2 rounded-full disabled:text-slate-400 disabled:bg-transparent disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Previous Page"><ChevronLeftIcon className="w-5 h-5"/></button>
              <div className="flex items-center text-sm font-medium text-slate-600 dark:text-slate-300">
                <input 
                  ref={pageInputRef}
                  key={pageNumber}
                  defaultValue={pageNumber}
                  onKeyDown={handlePageJump}
                  type="text"
                  aria-label="Current page number"
                  className="w-10 text-center bg-slate-200 dark:bg-slate-700 rounded-md p-1 focus:ring-1 focus:ring-primary focus:outline-none"
                  disabled={isLoading}
                  onFocus={(e) => e.target.select()}
                />
                <span className="px-1.5">/ {numPages ?? '...'}</span>
              </div>
              <button onClick={goToNextPage} disabled={pageNumber >= (numPages ?? 0) || isLoading} className="p-2 rounded-full disabled:text-slate-400 disabled:bg-transparent disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Next Page"><ChevronRightIcon className="w-5 h-5"/></button>
            </div>
            <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1 hidden sm:block"></div>

            <div className="flex items-center gap-1">
              <button onClick={zoomOut} disabled={scale <= 0.5 || isLoading} className="p-2 rounded-full disabled:text-slate-400 disabled:bg-transparent disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Zoom Out"><ZoomOutIcon className="w-5 h-5"/></button>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300 w-14 text-center">{Math.round(scale * 100)}%</span>
              <button onClick={zoomIn} disabled={scale >= 3.0 || isLoading} className="p-2 rounded-full disabled:text-slate-400 disabled:bg-transparent disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Zoom In"><ZoomInIcon className="w-5 h-5"/></button>
              <button onClick={handleFitToWidth} disabled={isLoading || !pageDimensions} className="p-2 rounded-full disabled:text-slate-400 disabled:bg-transparent disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Fit to Width">
                <FitToWidthIcon />
              </button>
              <button onClick={handleFitToPage} disabled={isLoading || !pageDimensions} className="p-2 rounded-full disabled:text-slate-400 disabled:bg-transparent disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Fit to Page">
                <FitToPageIcon />
              </button>
            </div>
            <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1 hidden sm:block"></div>

            <div className="flex items-center gap-1">
              <button onClick={() => { setIsPanMode(prev => !prev); setIsPlacingSignature(false); }} disabled={isLoading} className={`flex items-center gap-2 p-2 text-sm rounded-md disabled:text-slate-400 disabled:cursor-not-allowed transition-colors ${isPanMode ? 'bg-blue-200 text-blue-700 dark:bg-blue-800 dark:text-blue-200' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`} title={isPanMode ? "Disable Pan Tool" : "Enable Pan Tool"}>
                  <HandIcon />
              </button>
              {isSignable && (
                  <button onClick={() => { setIsPlacingSignature(prev => !prev); setIsPanMode(false); }} disabled={isLoading} className={`flex items-center gap-2 p-2 text-sm rounded-md disabled:text-slate-400 disabled:cursor-not-allowed transition-colors ${isPlacingSignature ? 'bg-blue-200 text-blue-700 dark:bg-blue-800 dark:text-blue-200' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`} title={isPlacingSignature ? "Cancel signature placement" : "Draw signature area"}>
                      <SignatureIcon/>
                  </button>
              )}
              <button onClick={handleShare} disabled={isLoading} className="p-2 rounded-full disabled:text-slate-400 disabled:bg-transparent disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Share"><ShareIcon/></button>
              <button onClick={handlePrint} disabled={isLoading} className="p-2 rounded-full disabled:text-slate-400 disabled:bg-transparent disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Print"><PrintIcon/></button>
            </div>
          </div>

          <div 
            ref={viewerContainerRef} 
            className={`flex-grow relative bg-slate-200 dark:bg-slate-900/70 overflow-auto ${getViewerCursor()}`}
            onMouseDown={isPanMode ? handlePanMouseDown : undefined}
            onMouseMove={isPanMode ? handlePanMouseMove : undefined}
            onMouseUp={isPanMode ? handlePanMouseUp : undefined}
            onMouseLeave={isPanMode ? handlePanMouseUp : undefined}
          >
            {isLoading && (
               <div className="absolute inset-0 flex flex-col justify-center items-center text-slate-800 dark:text-slate-200 z-10">
                   <svg className="animate-spin h-10 w-10 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="font-semibold text-lg">Loading Document</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Please wait while the PDF is being prepared.</p>
              </div>
            )}
             {error && !isLoading && (
              <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-4">
                <p className="font-semibold text-lg text-red-600 dark:text-red-400">Error</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
              </div>
            )}
            <div className={`transition-opacity duration-300 ${isLoading || error ? 'opacity-0' : 'opacity-100'}`}>
              <Document
                  key={pdfUrl}
                  file={pdfUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading="" 
              >
                  <div className="p-4 flex justify-center">
                      <div
                        ref={pageWrapperRef}
                        className="relative shadow-lg"
                        style={pageDimensions ? { width: pageDimensions.width * scale, height: pageDimensions.height * scale } : {}}
                      >
                         <div
                            className="absolute top-0 left-0 w-full h-full z-10" // Interaction layer
                            onMouseDown={handleSignatureMouseDown}
                            onMouseMove={handleSignatureMouseMove}
                            onMouseUp={handleSignatureMouseUp}
                            onMouseLeave={resetDrawingState}
                         >
                            {isDrawing && startPoint && endPoint && (
                              <div
                                className="absolute border-2 border-dashed border-primary bg-primary/20 pointer-events-none z-20"
                                style={{
                                  left: Math.min(startPoint.x, endPoint.x),
                                  top: Math.min(startPoint.y, endPoint.y),
                                  width: Math.abs(endPoint.x - startPoint.x),
                                  height: Math.abs(endPoint.y - startPoint.y),
                                }}
                              />
                            )}
                         </div>
                        <Page 
                            pageNumber={pageNumber} 
                            scale={scale}
                            onLoadSuccess={onPageLoadSuccess}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                        />
                         {isSignable && pageNumber === 1 && !hasPredefinedSignature && (
                          <button
                            onClick={handlePredefinedSignatureClick}
                            style={{
                              position: 'absolute',
                              left: `${PREDEFINED_SIGNATURE_BOX.x * scale}px`,
                              top: `${PREDEFINED_SIGNATURE_BOX.y * scale}px`,
                              width: `${PREDEFINED_SIGNATURE_BOX.width * scale}px`,
                              height: `${PREDEFINED_SIGNATURE_BOX.height * scale}px`,
                              fontSize: `${Math.max(10, 12 * scale)}px`
                            }}
                            className="border-2 border-dashed border-blue-500 rounded-lg flex flex-col items-center justify-center text-blue-500 bg-blue-100 bg-opacity-50 hover:bg-opacity-75 transition-all z-10"
                          >
                            <SignatureIcon className="w-1/3 h-1/3"/>
                            <span className="font-semibold mt-1">Click to Sign Here</span>
                          </button>
                        )}
                        {/* Signature Overlays */}
                        {isSignable && onDeleteSignature && signatures.map((sig, index) => {
                            if (sig.placement.pageNumber !== pageNumber || !pageDimensions) return null;
                            
                            // Convert jsPDF points back to react-pdf pixels for display
                            const displayXRatio = pageDimensions.width / JSPDF_A4_WIDTH;
                            const displayYRatio = pageDimensions.height / JSPDF_A4_HEIGHT;

                            return (
                            <div
                                key={index}
                                className="group absolute border-2 border-transparent hover:border-blue-500 hover:bg-blue-500/10 transition-all duration-200"
                                style={{
                                left: `${sig.placement.x * displayXRatio * scale}px`,
                                top: `${sig.placement.y * displayYRatio * scale}px`,
                                width: `${sig.placement.width * displayXRatio * scale}px`,
                                height: `${sig.placement.height * displayYRatio * scale}px`,
                                zIndex: 20,
                                }}
                            >
                                <div className="absolute top-0 right-0 -mt-2 -mr-2 opacity-0 group-hover:opacity-100 flex gap-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-md shadow-lg transition-opacity duration-200">
                                <button
                                    onClick={() => setViewingSignature(sig)}
                                    className="p-1 text-slate-600 dark:text-slate-300 hover:text-blue-500 dark:hover:text-blue-400"
                                    title="View Signature Info"
                                >
                                    <InfoIcon className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setSignatureToDeleteIndex(index)}
                                    className="p-1 text-slate-600 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400"
                                    title="Delete Signature"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                                </div>
                            </div>
                            );
                        })}
                      </div>
                  </div>
              </Document>
            </div>
          </div>
        </div>
      </div>
      <SignatureModal 
        isOpen={isSigningOpen}
        onClose={() => setIsSigningOpen(false)}
        onSave={handleSaveSignature}
      />
       {/* Signature Info Modal */}
      {viewingSignature && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex justify-center items-center p-4" onClick={() => setViewingSignature(null)}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Signature Information</h3>
            <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <p><strong>Signed by:</strong> {viewingSignature.signerName}</p>
                <p><strong>Title:</strong> {viewingSignature.signerTitle}</p>
                <p><strong>Date Signed:</strong> {viewingSignature.signedAt.toLocaleString('vi-VN')}</p>
            </div>
            <button onClick={() => setViewingSignature(null)} className="mt-6 w-full px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-secondary transition-colors">
                Close
            </button>
            </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={signatureToDeleteIndex !== null}
        onClose={() => setSignatureToDeleteIndex(null)}
        onConfirm={() => {
            if (signatureToDeleteIndex !== null && onDeleteSignature) {
            onDeleteSignature(signatureToDeleteIndex);
            }
            setSignatureToDeleteIndex(null);
        }}
        title="Delete Signature"
        message="Are you sure you want to remove this signature from the document? This action will regenerate the document."
      />
    </>
  );
};

export default PdfPreviewModal;