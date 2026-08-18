import React, { useState, useEffect } from 'react';
import { StudioVersion, StudioTemplate, templateStudioService, TemplateComment } from '../../../services/templateStudioService';

interface VersionReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: StudioTemplate;
  version: StudioVersion;
  currentUserId?: string;
  onSuccess: () => void;
}

export const VersionReviewModal: React.FC<VersionReviewModalProps> = ({
  isOpen,
  onClose,
  template,
  version,
  currentUserId = 'current_user',
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'checklist' | 'comments' | 'action'>('checklist');
  const [checklist, setChecklist] = useState({
    formatApproved: false,
    dataApproved: false,
    printApproved: false,
    securityApproved: false,
    notes: ''
  });
  const [comments, setComments] = useState<TemplateComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentCategory, setCommentCategory] = useState<'GENERAL' | 'DEFECT' | 'SUGGESTION' | 'APPROVAL_NOTE'>('GENERAL');
  const [rejectNote, setRejectNote] = useState('');
  const [confirmWarnings, setConfirmWarnings] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCreator = currentUserId === version.createdBy;
  const warnings = version.validationResult?.warnings || [];

  useEffect(() => {
    if (isOpen && version.id) {
      if (version.reviewChecklist) {
        setChecklist({
          formatApproved: Boolean((version.reviewChecklist as any).formatApproved),
          dataApproved: Boolean((version.reviewChecklist as any).dataApproved),
          printApproved: Boolean((version.reviewChecklist as any).printApproved),
          securityApproved: Boolean((version.reviewChecklist as any).securityApproved),
          notes: String((version.reviewChecklist as any).notes || '')
        });
      }
      loadComments();
    }
  }, [isOpen, version.id]);

  const loadComments = async () => {
    try {
      const data = await templateStudioService.getComments(version.id);
      setComments(data);
    } catch (_) {
      // ignore
    }
  };

  const handleSaveChecklist = async () => {
    try {
      setSubmitting(true);
      setError(null);
      await templateStudioService.updateReviewChecklist(version.id, checklist);
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Lỗi khi lưu checklist');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      setSubmitting(true);
      setError(null);
      await templateStudioService.addComment(version.id, {
        content: newComment.trim(),
        category: commentCategory,
        authorName: currentUserId
      });
      setNewComment('');
      await loadComments();
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Lỗi khi gửi bình luận');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    try {
      setSubmitting(true);
      setError(null);
      await templateStudioService.updateReviewChecklist(version.id, checklist);
      await templateStudioService.transition(version.id, 'approve', {
        confirmWarnings: warnings.length > 0 ? confirmWarnings : undefined
      });
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Lỗi khi phê duyệt');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectNote.trim()) {
      setError('Vui lòng nhập lý do / nhận xét khi trả lại mẫu biểu');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      await templateStudioService.transition(version.id, 'reject', {
        note: rejectNote.trim()
      });
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Lỗi khi trả lại');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
              📋
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Thẩm định & Phê duyệt Phiên bản
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

        {/* Warning if Creator self-review */}
        {isCreator && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <span>
              <strong>Nguyên tắc Phân tách Trách nhiệm (Segregation of Duties):</strong> Bạn là người tạo phiên bản này ({version.createdBy}). Hệ thống sẽ ngăn bạn tự phê duyệt chính mẫu của mình.
            </span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('checklist')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
              activeTab === 'checklist'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            ✅ 1. Checklist Thẩm định
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'comments'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            💬 2. Trao đổi & Bình luận
            {comments.length > 0 && (
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                {comments.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('action')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
              activeTab === 'action'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            ⚡ 3. Quyết định Duyệt / Trả lại
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">✕</button>
            </div>
          )}

          {activeTab === 'checklist' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Vui lòng kiểm tra kỹ các tiêu chí chất lượng trước khi phê duyệt mẫu biểu:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={checklist.formatApproved}
                    onChange={(e) => setChecklist({ ...checklist, formatApproved: e.target.checked })}
                    className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">📝 1. Thể thức & Bố cục</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Font chữ chuẩn Unicode, lề giấy đúng quy định, Header cơ sở KCB và Footer đánh số trang.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={checklist.dataApproved}
                    onChange={(e) => setChecklist({ ...checklist, dataApproved: e.target.checked })}
                    className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">🎯 2. Tính chính xác Dữ liệu</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Thẻ Carbone khớp Hợp đồng Dữ liệu (Schema), bảng lặp có STT, định dạng tiền và ngày chuẩn.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={checklist.printApproved}
                    onChange={(e) => setChecklist({ ...checklist, printApproved: e.target.checked })}
                    className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">🖨️ 3. Khả năng In ấn</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Không ngắt trang tùy tiện, số trang dự kiến phù hợp (A4/A5), bảng biểu không tràn mép.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={checklist.securityApproved}
                    onChange={(e) => setChecklist({ ...checklist, securityApproved: e.target.checked })}
                    className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">🔒 4. Bảo mật & Chữ ký</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Vùng ký điện tử / ký tay chuẩn BYT, không hiển thị dữ liệu nhạy cảm ngoài thẩm quyền.
                    </div>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ghi chú thẩm định của Reviewer:
                </label>
                <textarea
                  rows={3}
                  value={checklist.notes}
                  onChange={(e) => setChecklist({ ...checklist, notes: e.target.value })}
                  placeholder="Nhập ghi chú chi tiết về kết quả thẩm định..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveChecklist}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition"
                >
                  💾 Lưu kết quả Thẩm định
                </button>
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4">
              {/* Comment List */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {comments.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    Chưa có bình luận nào trên phiên bản này.
                  </div>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          👤 {c.authorName || c.authorId}
                          <span className={`px-1.5 py-0.2 text-[10px] font-bold rounded ${
                            c.category === 'DEFECT' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' :
                            c.category === 'SUGGESTION' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' :
                            c.category === 'APPROVAL_NOTE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                            'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          }`}>
                            {c.category}
                          </span>
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(c.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{c.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Input */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex gap-2">
                  <select
                    value={commentCategory}
                    onChange={(e: any) => setCommentCategory(e.target.value)}
                    className="text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                  >
                    <option value="GENERAL">💬 Thảo luận chung</option>
                    <option value="DEFECT">🐞 Báo lỗi / Sai sót</option>
                    <option value="SUGGESTION">💡 Góp ý cải tiến</option>
                    <option value="APPROVAL_NOTE">📝 Ghi chú thẩm định</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    placeholder="Nhập nội dung trao đổi hoặc phản hồi..."
                    className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={submitting || !newComment.trim()}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition"
                  >
                    Gửi
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'action' && (
            <div className="space-y-4">
              {warnings.length > 0 && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs space-y-2">
                  <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    ⚠️ Phiên bản có {warnings.length} cảnh báo xác thực DOCX:
                  </div>
                  <ul className="list-disc list-inside text-amber-800 dark:text-amber-200 space-y-0.5">
                    {warnings.map((w, idx) => (
                      <li key={idx}>
                        <span className="font-semibold">[{w.code}]</span> {w.message}
                      </li>
                    ))}
                  </ul>
                  <label className="flex items-center gap-2 pt-1 font-semibold text-amber-900 dark:text-amber-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmWarnings}
                      onChange={(e) => setConfirmWarnings(e.target.checked)}
                      className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
                    />
                    Tôi đã kiểm tra và xác nhận chấp nhận các cảnh báo trên
                  </label>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Approve Card */}
                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                      ✅ Phê duyệt Phiên bản
                    </h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                      Chuyển trạng thái sang <span className="font-bold">APPROVED</span>. Sẵn sàng phát hành hoặc lập lịch release vào hệ thống.
                    </p>
                  </div>
                  <button
                    onClick={handleApprove}
                    disabled={submitting || isCreator || (warnings.length > 0 && !confirmWarnings)}
                    className="mt-4 w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    {submitting ? 'Đang xử lý...' : '✓ Xác nhận Phê duyệt (Approve)'}
                  </button>
                </div>

                {/* Reject Card */}
                <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                      ↩️ Trả lại Yêu cầu Sửa đổi
                    </h4>
                    <p className="text-xs text-rose-700 dark:text-rose-400 mt-1">
                      Chuyển trạng thái về <span className="font-bold">DRAFT</span> để Designer chỉnh sửa theo nhận xét.
                    </p>
                    <textarea
                      rows={2}
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      placeholder="Nhập lý do hoặc hướng dẫn chỉnh sửa..."
                      className="mt-2 w-full text-xs p-2 rounded-lg border border-rose-200 dark:border-rose-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
                    />
                  </div>
                  <button
                    onClick={handleReject}
                    disabled={submitting || !rejectNote.trim()}
                    className="mt-4 w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    {submitting ? 'Đang xử lý...' : '↩ Trả lại Bản nháp (Reject)'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 text-xs">
          <span className="text-slate-400">
            Người tạo: <strong className="text-slate-600 dark:text-slate-300">{version.createdBy}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
