import React, { useState, useEffect } from 'react';
import { TemplateInbox, TemplateInboxItem, templateStudioService } from '../../../services/templateStudioService';

interface TemplateInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateId: number, versionId?: number) => void;
}

export const TemplateInboxModal: React.FC<TemplateInboxModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate
}) => {
  const [inbox, setInbox] = useState<TemplateInbox | null>(null);
  const [activeTab, setActiveTab] = useState<'myDrafts' | 'pendingReview' | 'pendingPublish' | 'rejected' | 'overdue'>('myDrafts');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadInbox();
    }
  }, [isOpen]);

  const loadInbox = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await templateStudioService.getInbox();
      setInbox(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Lỗi khi tải Inbox công việc');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentItems = inbox ? inbox[activeTab] || [] : [];
  const filteredItems = currentItems.filter(item =>
    item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.assignedReviewer && item.assignedReviewer.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-lg">
              📥
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Hộp thư Công việc Template Studio
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Theo dõi tiến độ, nhiệm vụ được phân công và hạn xử lý SLA
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadInbox}
              disabled={loading}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition text-sm"
              title="Làm mới"
            >
              🔄
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-700 px-6 pt-3 gap-2 bg-slate-50/30 dark:bg-slate-900/30">
          <button
            onClick={() => setActiveTab('myDrafts')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-xl transition flex items-center gap-1.5 ${
              activeTab === 'myDrafts'
                ? 'bg-white dark:bg-slate-800 border-t-2 border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            ✏️ Bản nháp của tôi
            {inbox?.stats.totalDrafts ? (
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                {inbox.stats.totalDrafts}
              </span>
            ) : null}
          </button>

          <button
            onClick={() => setActiveTab('pendingReview')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-xl transition flex items-center gap-1.5 ${
              activeTab === 'pendingReview'
                ? 'bg-white dark:bg-slate-800 border-t-2 border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            🔍 Chờ tôi duyệt (Review)
            {inbox?.stats.totalPendingReview ? (
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold">
                {inbox.stats.totalPendingReview}
              </span>
            ) : null}
          </button>

          <button
            onClick={() => setActiveTab('pendingPublish')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-xl transition flex items-center gap-1.5 ${
              activeTab === 'pendingPublish'
                ? 'bg-white dark:bg-slate-800 border-t-2 border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            🚀 Chờ phát hành (Publish)
            {inbox?.stats.totalPendingPublish ? (
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold">
                {inbox.stats.totalPendingPublish}
              </span>
            ) : null}
          </button>

          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-xl transition flex items-center gap-1.5 ${
              activeTab === 'rejected'
                ? 'bg-white dark:bg-slate-800 border-t-2 border-rose-600 text-rose-600 dark:border-rose-400 dark:text-rose-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            ↩️ Bị trả lại
            {inbox?.stats.totalRejected ? (
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 font-bold">
                {inbox.stats.totalRejected}
              </span>
            ) : null}
          </button>

          <button
            onClick={() => setActiveTab('overdue')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-xl transition flex items-center gap-1.5 ${
              activeTab === 'overdue'
                ? 'bg-white dark:bg-slate-800 border-t-2 border-red-600 text-red-600 dark:border-red-400 dark:text-red-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            ⏰ Quá hạn SLA
            {inbox?.stats.totalOverdue ? (
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-red-500 text-white font-bold animate-pulse">
                {inbox.stats.totalOverdue}
              </span>
            ) : null}
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã biểu mẫu, tên mẫu, người phụ trách..."
            className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        {/* List Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-xs">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-xs text-slate-400">
              Đang tải danh sách công việc...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400 space-y-1">
              <div className="text-2xl">🎉</div>
              <div>Không có công việc nào trong mục này.</div>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={`${item.templateId}-${item.versionId}`}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                      {item.code}
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {item.name}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                      v{item.version}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      item.status === 'DRAFT' ? 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' :
                      item.status === 'IN_REVIEW' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
                      item.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
                      'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
                    }`}>
                      {item.status}
                    </span>
                    {item.isOverdue && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500 text-white animate-pulse">
                        ⚠️ Quá hạn SLA
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                    <span>Loại: <strong>{item.documentType}</strong></span>
                    {item.assignedDesigner && <span>Designer: <strong>{item.assignedDesigner}</strong></span>}
                    {item.assignedReviewer && <span>Reviewer: <strong>{item.assignedReviewer}</strong></span>}
                    {item.dueDate && (
                      <span className={item.isOverdue ? 'text-red-500 font-bold' : ''}>
                        Hạn: <strong>{new Date(item.dueDate).toLocaleString('vi-VN')}</strong>
                      </span>
                    )}
                  </div>

                  {item.changeNote && (
                    <div className="text-xs text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg mt-1 border border-slate-100 dark:border-slate-800">
                      "{item.changeNote}"
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => {
                      onSelectTemplate(item.templateId, item.versionId);
                      onClose();
                    }}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition"
                  >
                    Mở xử lý ➜
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-700 flex justify-end bg-slate-50/50 dark:bg-slate-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
