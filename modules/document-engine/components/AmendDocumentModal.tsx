import React, { useState } from 'react';
import { X, AlertTriangle, FileEdit, CheckCircle2 } from 'lucide-react';

interface AmendDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: any;
  onAmendSuccess: (amendedDoc: any) => void;
}

export const AmendDocumentModal: React.FC<AmendDocumentModalProps> = ({
  isOpen,
  onClose,
  document,
  onAmendSuccess,
}) => {
  const [reason, setReason] = useState('');
  const [editedSnapshot, setEditedSnapshot] = useState(
    JSON.stringify(document?.snapshotData || {}, null, 2)
  );
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !document) return null;

  const handleAmend = async () => {
    if (!reason.trim()) {
      alert('Bắt buộc phải nhập lý do đính chính văn bản y tế.');
      return;
    }

    let parsedSnapshot = {};
    try {
      parsedSnapshot = JSON.parse(editedSnapshot);
    } catch {
      alert('Dữ liệu đính chính JSON không đúng định dạng.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/v1/emr/documents/amend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalDocumentId: document.id,
          newDataSnapshot: parsedSnapshot,
          reason: reason.trim(),
          actorId: 'bs_an',
          actorName: 'BS. CKII. Nguyễn Văn An',
        }),
      });
      const data = await response.json();
      if (data.success) {
        alert('Đã tạo bản đính chính thành công. Bản cũ v1 đã được đánh dấu ĐÃ THAY THẾ.');
        onAmendSuccess(data.data.amendedDocument);
        onClose();
      } else {
        alert(data.error || 'Có lỗi xảy ra khi đính chính văn bản.');
      }
    } catch (err: any) {
      alert('Lỗi kết nối máy chủ: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-[#0c182c] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/40 flex items-center justify-between text-amber-900 dark:text-amber-300">
          <div className="flex items-center gap-2.5 font-extrabold text-sm">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-700 dark:text-amber-300">
              <FileEdit className="w-4 h-4" />
            </div>
            <span>Lập Bản Đính Chính Văn Bản Y Tế (Addendum Workflow)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/50 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto custom-scrollbar flex-1">
          <div className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 flex gap-3 text-rose-800 dark:text-rose-300 leading-relaxed">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <div>
              <p className="font-bold">Quy định Pháp lý theo Thông tư 46/2018/TT-BYT:</p>
              <p className="text-[11px] mt-0.5">
                Văn bản y tế đã ký số tuyệt đối không được xóa đè. Hệ thống sẽ giữ nguyên <b>Bản gốc (v1)</b> kèm dấu mờ "ĐÃ THAY THẾ" và tạo <b>Bản đính chính (v2)</b> để Bác sĩ ký số lại. Toàn bộ lịch sử sẽ được lưu trữ song song.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 text-[11px]">
            <div>
              <span className="text-slate-400">Văn bản gốc:</span>
              <p className="font-bold text-slate-800 dark:text-slate-100">{document.documentName}</p>
            </div>
            <div>
              <span className="text-slate-400">Bệnh nhân:</span>
              <p className="font-bold text-slate-800 dark:text-slate-100 uppercase">{document.patientName} ({document.patientId})</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Lý do đính chính / thay đổi <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: Bổ sung chỉ định liều dùng thuốc huyết áp theo kết luận hội chẩn chuyên khoa..."
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Dữ liệu nội dung đính chính (JSON Snapshot):
            </label>
            <textarea
              rows={8}
              value={editedSnapshot}
              onChange={(e) => setEditedSnapshot(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-900 text-emerald-300 font-mono text-[11px] border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleAmend}
            disabled={submitting || !reason.trim()}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-bold shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{submitting ? 'Đang khởi tạo bản v2...' : 'Khởi Tạo Bản Đính Chính (v2)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
