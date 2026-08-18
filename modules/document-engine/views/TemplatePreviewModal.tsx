import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { templateStudioService, StudioTestCase, StudioVersion } from '../../../services/templateStudioService';
import { 
  XIcon, 
  PrinterIcon, 
  DownloadIcon, 
  ArrowPathIcon, 
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '../../../components/Icons';

export interface TemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  version: StudioVersion;
  templateCode: string;
  templateName: string;
  testCases?: StudioTestCase[];
  initialSampleData?: Record<string, any>;
}

export const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  isOpen,
  onClose,
  version,
  templateCode,
  templateName,
  testCases = [],
  initialSampleData
}) => {
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<number | undefined>(testCases[0]?.id);
  const [currentData, setCurrentData] = useState<Record<string, any>>(initialSampleData || version.sampleData || {});
  const [zoomLevel, setZoomLevel] = useState(100);
  const [renderTimeMs, setRenderTimeMs] = useState<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const fetchPreview = async (customData?: Record<string, any>) => {
    if (!version?.id) return;
    setLoading(true);
    const start = performance.now();
    try {
      const dataToSend = customData || currentData;
      const blob = await templateStudioService.preview(version.id, 'pdf', dataToSend);
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setRenderTimeMs(Math.round(performance.now() - start));
    } catch (err: any) {
      console.error('Preview render error:', err);
      toast.error(err.message || 'Không thể render bản xem trước PDF từ Carbone engine');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && version?.id) {
      fetchPreview();
    } else {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  }, [isOpen, version?.id]);

  const handleSelectTestCase = (caseId: number) => {
    setSelectedTestCaseId(caseId);
    const foundCase = testCases.find(c => c.id === caseId);
    if (foundCase?.inputData) {
      setCurrentData(foundCase.inputData);
      fetchPreview(foundCase.inputData);
    }
  };

  const handleDownloadDocx = async () => {
    try {
      const blob = await templateStudioService.preview(version.id, 'docx', currentData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `preview_${templateCode}_v${version.version}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Đã tải xuống file Word render thử');
    } catch (err: any) {
      toast.error(err.message || 'Tải file DOCX thất bại');
    }
  };

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
    } else {
      window.print();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-6 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl h-[92vh] max-h-[95vh] flex flex-col overflow-hidden animate-zoom-in">
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl">
              <DocumentTextIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800 dark:text-white uppercase tracking-tight">
                  📄 Test Preview PDF: {templateName}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-mono">
                  v{version.version} · {version.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Mã: <b>{templateCode}</b> · Carbone Engine {renderTimeMs ? `(Thời gian render: ${renderTimeMs}ms)` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {testCases.length > 0 && (
              <div className="flex items-center gap-1.5 mr-2">
                <span className="text-xs text-slate-500 font-semibold">Kịch bản test:</span>
                <select
                  value={selectedTestCaseId}
                  onChange={e => handleSelectTestCase(Number(e.target.value))}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs"
                >
                  {testCases.map(tc => (
                    <option key={tc.id} value={tc.id}>{tc.name} ({tc.testType})</option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => fetchPreview()}
              disabled={loading}
              title="Render lại"
              className="p-2 text-slate-600 hover:text-blue-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF VIEWPORT */}
        <div className="flex-1 bg-slate-200 dark:bg-slate-950 p-4 relative overflow-hidden flex items-center justify-center min-h-0">
          {loading ? (
            <div className="text-center space-y-3">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Đang nạp dữ liệu kiểm thử và kết xuất PDF vector…
              </p>
            </div>
          ) : pdfUrl ? (
            <iframe
              ref={iframeRef}
              src={pdfUrl}
              title="PDF Test Preview"
              className="w-full h-full bg-white rounded-xl shadow-lg border border-slate-300 dark:border-slate-800"
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
            />
          ) : (
            <div className="text-center text-sm text-slate-500 space-y-2">
              <ExclamationCircleIcon className="w-8 h-8 text-amber-500 mx-auto" />
              <p>Chưa có bản xem trước. Hãy kiểm tra lại file Word .docx đã upload có hợp lệ không.</p>
            </div>
          )}
        </div>

        {/* BOTTOM CONTROLS */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="font-semibold text-slate-700 dark:text-slate-300">🔍 Thu phóng:</span>
            <button 
              onClick={() => setZoomLevel(z => Math.max(z - 10, 50))} 
              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded font-bold hover:bg-slate-200"
            >
              -
            </button>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{zoomLevel}%</span>
            <button 
              onClick={() => setZoomLevel(z => Math.min(z + 10, 150))} 
              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded font-bold hover:bg-slate-200"
            >
              +
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadDocx}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all border border-slate-300 dark:border-slate-700"
            >
              <DownloadIcon className="w-4 h-4" /> Tải file Word đã điền data
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20"
            >
              <PrinterIcon className="w-4 h-4" /> In Thử Nghiệm
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
            >
              Đóng
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default TemplatePreviewModal;
