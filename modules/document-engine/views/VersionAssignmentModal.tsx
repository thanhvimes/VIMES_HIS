import React, { useState, useEffect } from 'react';
import { StudioVersion, StudioTemplate, templateStudioService } from '../../../services/templateStudioService';

interface VersionAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: StudioTemplate;
  version: StudioVersion;
  onSuccess: () => void;
}

export const VersionAssignmentModal: React.FC<VersionAssignmentModalProps> = ({
  isOpen,
  onClose,
  template,
  version,
  onSuccess
}) => {
  const [assignedDesigner, setAssignedDesigner] = useState('');
  const [assignedTester, setAssignedTester] = useState('');
  const [assignedReviewer, setAssignedReviewer] = useState('');
  const [assignedPublisher, setAssignedPublisher] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [effectiveTo, setEffectiveTo] = useState('');
  const [scheduledPublishAt, setScheduledPublishAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && version) {
      setAssignedDesigner(version.assignedDesigner || version.createdBy || '');
      setAssignedTester(version.assignedTester || '');
      setAssignedReviewer(version.assignedReviewer || '');
      setAssignedPublisher(version.assignedPublisher || '');
      setDueDate(version.dueDate ? version.dueDate.substring(0, 16) : '');
      setEffectiveFrom(version.effectiveFrom ? version.effectiveFrom.substring(0, 16) : '');
      setEffectiveTo(version.effectiveTo ? version.effectiveTo.substring(0, 16) : '');
      setScheduledPublishAt(version.scheduledPublishAt ? version.scheduledPublishAt.substring(0, 16) : '');
    }
  }, [isOpen, version]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await templateStudioService.updateAssignments(version.id, {
        assignedDesigner: assignedDesigner.trim() || undefined,
        assignedTester: assignedTester.trim() || undefined,
        assignedReviewer: assignedReviewer.trim() || undefined,
        assignedPublisher: assignedPublisher.trim() || undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom).toISOString() : undefined,
        effectiveTo: effectiveTo ? new Date(effectiveTo).toISOString() : undefined,
        scheduledPublishAt: scheduledPublishAt ? new Date(scheduledPublishAt).toISOString() : undefined
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Lỗi khi cập nhật phân công');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
              👥
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Phân công & Lập lịch Hiệu lực
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                  v{version.version}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {template.code} — {template.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-center justify-between">
              <span>{error}</span>
              <button type="button" onClick={() => setError(null)} className="text-red-500 hover:text-red-700">✕</button>
            </div>
          )}

          {/* Role Assignments */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              1. Phân công Nhân sự phụ trách
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  🎨 Designer (Người thiết kế Word)
                </label>
                <input
                  type="text"
                  value={assignedDesigner}
                  onChange={(e) => setAssignedDesigner(e.target.value)}
                  placeholder="VD: designer_01 hoặc tên nhân viên"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  🧪 Tester (Người chạy Test Lab)
                </label>
                <input
                  type="text"
                  value={assignedTester}
                  onChange={(e) => setAssignedTester(e.target.value)}
                  placeholder="VD: tester_qa"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  🔍 Reviewer (Người thẩm định & duyệt)
                </label>
                <input
                  type="text"
                  value={assignedReviewer}
                  onChange={(e) => setAssignedReviewer(e.target.value)}
                  placeholder="VD: bs_truongkhoa hoặc reviewer_01"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  🚀 Publisher (Người phát hành)
                </label>
                <input
                  type="text"
                  value={assignedPublisher}
                  onChange={(e) => setAssignedPublisher(e.target.value)}
                  placeholder="VD: admin_khtonghop"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Timeline & Due Date */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              2. Tiến độ (SLA) & Lập lịch Phát hành
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ⏰ Hạn hoàn thành SLA (Due date)
                </label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  📅 Lập lịch Tự động Phát hành
                </label>
                <input
                  type="datetime-local"
                  value={scheduledPublishAt}
                  onChange={(e) => setScheduledPublishAt(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Validity Period */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              3. Khoảng thời gian Hiệu lực (Validity Period)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  🟢 Ngày bắt đầu có hiệu lực
                </label>
                <input
                  type="datetime-local"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  🔴 Ngày hết hiệu lực (Tùy chọn)
                </label>
                <input
                  type="datetime-local"
                  value={effectiveTo}
                  onChange={(e) => setEffectiveTo(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition"
            >
              {submitting ? 'Đang lưu...' : '💾 Lưu Phân công & Lập lịch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
