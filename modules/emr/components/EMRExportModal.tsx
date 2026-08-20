import React, { useState, useEffect } from 'react';
import { EMRRecord, EMRInteropPayload } from '../types';
import { emrService } from '../services/emrService';
import { 
  X, 
  FileCode, 
  FileText, 
  Share2, 
  Download, 
  Copy, 
  Check, 
  ShieldCheck, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';
import { toast } from 'sonner';

interface EMRExportModalProps {
  record: EMRRecord;
  isOpen: boolean;
  onClose: () => void;
}

export const EMRExportModal: React.FC<EMRExportModalProps> = ({
  record,
  isOpen,
  onClose,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'HL7_CDA' | 'XML_4210' | 'XML_130' | 'SSK_VNEID'>('HL7_CDA');
  const [payload, setPayload] = useState<EMRInteropPayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && record) {
      loadPayload(selectedFormat);
    }
  }, [isOpen, record, selectedFormat]);

  const loadPayload = async (format: 'HL7_CDA' | 'XML_4210' | 'XML_130' | 'SSK_VNEID') => {
    setIsLoading(true);
    try {
      const res = await emrService.generateInteropPayload(record.id, format);
      setPayload(res);
    } catch (err) {
      toast.error('Lỗi khi kết xuất dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleCopy = () => {
    if (payload?.payloadXmlOrJson) {
      navigator.clipboard.writeText(payload.payloadXmlOrJson);
      setCopied(true);
      toast.success('Đã sao chép nội dung vào Clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!payload?.payloadXmlOrJson) return;
    const extension = selectedFormat === 'SSK_VNEID' ? 'json' : 'xml';
    const blob = new Blob([payload.payloadXmlOrJson], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${record.recordNumber}_${selectedFormat}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Đã tải xuống tập tin ${record.recordNumber}_${selectedFormat}.${extension}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-50 dark:bg-sky-950/50 rounded-xl text-sky-600 dark:text-sky-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Xuất Dữ liệu & Liên thông Bệnh án Điện tử
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Số HSBA: {record.recordNumber} • Bệnh nhân: {record.patient.fullName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector Tabs */}
        <div className="flex p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto">
          {[
            { id: 'HL7_CDA', label: 'HL7 CDA (Quốc tế)', desc: 'Tóm tắt điều trị CCD' },
            { id: 'XML_4210', label: 'XML QĐ 4210', desc: 'BHYT XML1-5' },
            { id: 'XML_130', label: 'XML QĐ 130', desc: 'Chuẩn liên thông BYT mới' },
            { id: 'SSK_VNEID', label: 'FHIR Sổ Sức Khỏe', desc: 'Liên thông VNeID' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedFormat(tab.id as any)}
              className={`flex-1 min-w-[140px] p-2 rounded-lg text-left transition-all text-xs ${
                selectedFormat === tab.id
                  ? 'bg-sky-500 text-white font-semibold shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <p className="font-bold truncate">{tab.label}</p>
              <p className={`text-[10px] truncate ${selectedFormat === tab.id ? 'text-sky-100' : 'text-slate-400'}`}>
                {tab.desc}
              </p>
            </button>
          ))}
        </div>

        {/* Code Content Preview */}
        <div className="flex-1 p-4 overflow-hidden flex flex-col min-h-0 bg-slate-950 text-slate-100">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800 text-slate-400 mb-2">
            <span className="flex items-center gap-1.5 font-mono">
              <FileCode className="w-4 h-4 text-sky-400" />
              <span>Nội dung dữ liệu {selectedFormat}</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" /> Chuẩn hợp lệ (Valid)
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-auto rounded-lg bg-slate-900/80 p-3 font-mono text-[11px] leading-relaxed select-text scrollbar-thin text-slate-300">
            {isLoading ? (
              <div className="h-full flex items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin text-sky-500" />
                <span>Đang tạo gói tin...</span>
              </div>
            ) : (
              <pre className="whitespace-pre">{payload?.payloadXmlOrJson}</pre>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Sẵn sàng kết nối với Cổng giám định BHYT & Sổ Sức Khỏe Điện Tử
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Tải tập tin ({selectedFormat})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
