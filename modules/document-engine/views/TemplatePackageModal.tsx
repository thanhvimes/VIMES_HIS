import React, { useState } from 'react';
import { toast } from 'sonner';
import { StudioTemplate, StudioVersion, templateStudioService } from '../../../services/templateStudioService';

interface TemplatePackageModalProps {
  open: boolean;
  mode: 'import' | 'export';
  template?: StudioTemplate;
  version?: StudioVersion;
  onClose: () => void;
  onSuccess: () => void;
}

export const TemplatePackageModal: React.FC<TemplatePackageModalProps> = ({
  open,
  mode,
  template,
  version,
  onClose,
  onSuccess
}) => {
  const [busy, setBusy] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File>();
  const [isDragOver, setIsDragOver] = useState(false);
  const [preview, setPreview] = useState<{
    valid: boolean;
    manifest?: any;
    metadata?: any;
    conflict: boolean;
    existingTemplateId?: number;
    testCasesCount: number;
    hasDocx: boolean;
    errors: string[];
  }>();

  if (!open) return null;

  const handleExport = async () => {
    if (!version) {
      toast.error('Vui lòng chọn phiên bản mẫu biểu cần xuất package');
      return;
    }
    setBusy(true);
    try {
      const blob = await templateStudioService.exportPackage(version.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template?.code || 'template'}-v${version.version}-package.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Đã xuất package thành công!');
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Xuất package thất bại');
    } finally {
      setBusy(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setBusy(true);
    try {
      const result = await templateStudioService.previewPackage(file);
      setPreview(result);
      if (!result.valid) {
        toast.error(`Package không hợp lệ: ${result.errors.join(', ')}`);
      } else {
        toast.success('Đã đọc và xác thực chữ ký manifest của package thành công');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không đọc được file package');
      setPreview(undefined);
    } finally {
      setBusy(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleImportConfirm = async () => {
    if (!selectedFile || !preview?.valid) {
      toast.error('Vui lòng chọn file package hợp lệ trước');
      return;
    }
    setBusy(true);
    try {
      const result = await templateStudioService.importPackage(selectedFile);
      toast.success(`Đã import thành công mẫu biểu ${result.templateCode} (Phiên bản nháp v${result.versionNumber})!`);
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Import package thất bại');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{mode === 'export' ? '📦' : '📥'}</span>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              {mode === 'export' ? 'Xuất Gói Biểu Mẫu (Template Package)' : 'Import Gói Biểu Mẫu (Template Package)'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4 text-xs text-slate-600 dark:text-slate-300">
          
          {mode === 'export' ? (
            <div className="space-y-4">
              <p>Gói package ZIP sẽ chứa đầy đủ tài sản của mẫu biểu để chuyển giao sang môi trường khác:</p>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 space-y-2 dark:border-slate-800 dark:bg-slate-950/50">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mã mẫu biểu:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{template?.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tên mẫu biểu:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{template?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Phiên bản xuất:</span>
                  <span className="font-mono font-bold text-blue-600">v{version?.version} ({version?.status})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">File DOCX artifact:</span>
                  <span>{version?.artifactKey ? '✅ Đã đính kèm' : '⚠️ Chưa có file Word'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tiêu chuẩn gói:</span>
                  <span className="font-mono text-emerald-600">VIMES_TEMPLATE_PACKAGE_V1</span>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={onClose} className="rounded border px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={busy}
                  className="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {busy ? 'Đang đóng gói…' : 'Tải Package (.zip)'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p>Chọn hoặc kéo thả file <code>.zip</code> package mẫu biểu vào khung bên dưới để nạp vào hệ thống:</p>
              
              {/* Drag & Drop Area */}
              <div
                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                    : 'border-slate-300 bg-slate-50/60 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900/40'
                }`}
              >
                <span className="text-3xl">📦</span>
                <span className="mt-2 font-medium text-slate-700 dark:text-slate-200">
                  {selectedFile ? selectedFile.name : 'Kéo thả file Package ZIP vào đây'}
                </span>
                <span className="mt-1 text-slate-400">hoặc</span>
                <label className="mt-2 cursor-pointer rounded-lg bg-blue-600 px-3.5 py-1.5 font-semibold text-white shadow-sm hover:bg-blue-700">
                  Chọn file từ máy
                  <input
                    type="file"
                    accept=".zip,application/zip"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />
                </label>
              </div>

              {/* Preview Result */}
              {preview && (
                <div className={`rounded-lg border p-3.5 space-y-2 ${
                  preview.valid
                    ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/30'
                    : 'border-red-200 bg-red-50/40 dark:border-red-900 dark:bg-red-950/30'
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span>{preview.valid ? '✅ Package Hợp Lệ' : '❌ Lỗi Package'}</span>
                    <span className="font-mono text-xs">{preview.metadata?.template?.code}</span>
                  </div>
                  {preview.valid ? (
                    <>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Tên mẫu biểu:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{preview.metadata?.template?.name}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Số lượng Test Cases:</span>
                        <span>{preview.testCasesCount} trường hợp</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">File DOCX Word:</span>
                        <span>{preview.hasDocx ? 'Có đính kèm' : 'Không có'}</span>
                      </div>
                      {preview.conflict ? (
                        <div className="mt-2 rounded bg-amber-100 p-2 text-xs text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
                          ⚠️ <strong>Lưu ý xung đột:</strong> Mẫu biểu mã <code>{preview.metadata?.template?.code}</code> đã tồn tại. Hệ thống sẽ tự động tạo một <strong>phiên bản nháp mới (Draft Version)</strong> mà không làm ảnh hưởng phiên bản đang chạy.
                        </div>
                      ) : (
                        <div className="mt-2 rounded bg-emerald-100 p-2 text-xs text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300">
                          ✨ Mẫu biểu mới hoàn toàn, sẽ được tạo mới và lưu ở trạng thái <strong>DRAFT</strong>.
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-xs text-red-600 dark:text-red-400">
                      {preview.errors.map((err, i) => <div key={i}>• {err}</div>)}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={onClose} className="rounded border px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleImportConfirm}
                  disabled={busy || !preview?.valid}
                  className="rounded bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {busy ? 'Đang nạp…' : 'Xác nhận Import'}
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
