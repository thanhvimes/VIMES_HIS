import React from 'react';
import { UploadCloud, X, CheckCircle, RefreshCw } from 'lucide-react';

interface UploadDicomModalProps {
  isOpen: boolean;
  onClose: () => void;
  uploadFiles: File[];
  setUploadFiles: (files: File[]) => void;
  uploading: boolean;
  uploadSuccess: string | null;
  onSubmit: (e: React.FormEvent) => void;
}

export const UploadDicomModal: React.FC<UploadDicomModalProps> = ({
  isOpen,
  onClose,
  uploadFiles,
  setUploadFiles,
  uploading,
  uploadSuccess,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
          <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-blue-500" />
            Tải Phim DICOM Lên Hệ Thống
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {uploadSuccess ? (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 rounded-xl p-8 text-center transition-colors bg-slate-50 dark:bg-[#0a0d13] cursor-pointer relative">
              <input
                type="file"
                multiple
                accept=".dcm,.dicom,image/dicom"
                onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <UploadCloud className="w-10 h-10 text-blue-400 mx-auto mb-2 opacity-70" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Kéo thả các tệp DICOM (.dcm) vào đây
              </p>
              <p className="text-xs text-slate-400 mt-1">hoặc nhấn để chọn tệp từ máy tính</p>
            </div>

            {uploadFiles.length > 0 && (
              <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 max-h-32 overflow-y-auto">
                <p className="font-bold mb-1 text-blue-600 dark:text-blue-400">Đã chọn {uploadFiles.length} tệp:</p>
                <ul className="space-y-0.5">
                  {uploadFiles.map((f, i) => (
                    <li key={i} className="truncate text-slate-500 dark:text-slate-400">
                      • {f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm font-medium cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={uploading || !uploadFiles.length}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white transition text-sm font-semibold flex items-center gap-2 shadow-md shadow-blue-500/25 cursor-pointer"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Đang tải lên...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" /> Tải Lên
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
