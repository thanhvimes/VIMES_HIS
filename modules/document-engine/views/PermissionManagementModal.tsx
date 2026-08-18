import React, { useState, useEffect } from 'react';
import { TemplateUserPermission, templateStudioService } from '../../../services/templateStudioService';

interface PermissionManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PermissionManagementModal: React.FC<PermissionManagementModalProps> = ({
  isOpen,
  onClose
}) => {
  const [permissions, setPermissions] = useState<TemplateUserPermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New permission form state
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [roleCode, setRoleCode] = useState('DOCUMENT_TEMPLATE_REVIEW');
  const [facilityId, setFacilityId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPermissions();
    }
  }, [isOpen]);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await templateStudioService.listUserPermissions();
      setPermissions(list);
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Lỗi khi tải danh sách phân quyền');
    } finally {
      setLoading(false);
    }
  };

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) {
      setError('Vui lòng nhập Mã người dùng / Username');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      await templateStudioService.grantUserPermission({
        userId: userId.trim(),
        userName: userName.trim() || undefined,
        roleCode,
        facilityId: facilityId.trim() || undefined,
        departmentId: departmentId.trim() || undefined
      });
      setUserId('');
      setUserName('');
      setFacilityId('');
      setDepartmentId('');
      await loadPermissions();
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Lỗi khi gán quyền');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn thu hồi quyền này?')) return;
    try {
      setSubmitting(true);
      setError(null);
      await templateStudioService.revokeUserPermission(id);
      await loadPermissions();
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Lỗi khi thu hồi quyền');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-lg">
              🛡️
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Quản trị Phân quyền RBAC & Phạm vi
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Phân quyền vai trò và giới hạn phạm vi áp dụng theo Cơ sở & Khoa phòng
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">✕</button>
            </div>
          )}

          {/* Add Permission Card */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              ➕ Gán quyền Mới cho Nhân sự
            </h4>
            <form onSubmit={handleGrant} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Mã User / Username *
                </label>
                <input
                  type="text"
                  required
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="VD: bs_nam"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Họ và tên nhân sự
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="VD: BS. Nguyễn Văn Nam"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Vai trò (Role Code) *
                </label>
                <select
                  value={roleCode}
                  onChange={(e) => setRoleCode(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                >
                  <option value="DOCUMENT_TEMPLATE_VIEW">👁️ VIEW — Xem biểu mẫu</option>
                  <option value="DOCUMENT_TEMPLATE_EDIT">✏️ EDIT — Thiết kế & Upload</option>
                  <option value="DOCUMENT_TEMPLATE_TEST">🧪 TEST — Chạy Test Lab</option>
                  <option value="DOCUMENT_TEMPLATE_REVIEW">🔍 REVIEW — Thẩm định & Duyệt</option>
                  <option value="DOCUMENT_TEMPLATE_PUBLISH">🚀 PUBLISH — Phát hành hệ thống</option>
                  <option value="DOCUMENT_TEMPLATE_ADMIN">👑 ADMIN — Toàn quyền Quản trị</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Mã Cơ sở KCB (Facility ID)
                </label>
                <input
                  type="text"
                  value={facilityId}
                  onChange={(e) => setFacilityId(e.target.value)}
                  placeholder="Để trống = Áp dụng Toàn viện"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Mã Khoa / Phòng (Department ID)
                </label>
                <input
                  type="text"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  placeholder="Để trống = Tất cả khoa phòng"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 transition"
                >
                  {submitting ? 'Đang lưu...' : '➕ Thêm Quyền'}
                </button>
              </div>
            </form>
          </div>

          {/* Permissions Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              📋 Danh sách Phân quyền Hiện hành ({permissions.length})
            </h4>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                  <tr>
                    <th className="p-3">User ID</th>
                    <th className="p-3">Họ và tên</th>
                    <th className="p-3">Vai trò (Role)</th>
                    <th className="p-3">Phạm vi Cơ sở / Khoa</th>
                    <th className="p-3">Người cấp</th>
                    <th className="p-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">
                        Đang tải danh sách phân quyền...
                      </td>
                    </tr>
                  ) : permissions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">
                        Chưa có phân quyền bổ sung nào. Mặc định áp dụng theo tài khoản hệ thống.
                      </td>
                    </tr>
                  ) : (
                    permissions.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                        <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                          {p.userId}
                        </td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">
                          {p.userName || '—'}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.roleCode === 'DOCUMENT_TEMPLATE_ADMIN' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' :
                            p.roleCode === 'DOCUMENT_TEMPLATE_REVIEW' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
                            p.roleCode === 'DOCUMENT_TEMPLATE_PUBLISH' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
                            'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                          }`}>
                            {p.roleCode}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">
                          {p.facilityId || p.departmentId ? (
                            <span className="space-x-1">
                              {p.facilityId && <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px]">CS: {p.facilityId}</span>}
                              {p.departmentId && <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px]">Khoa: {p.departmentId}</span>}
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">🌐 Toàn viện</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-500 dark:text-slate-400">
                          {p.grantedBy}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleRevoke(p.id)}
                            disabled={submitting}
                            className="px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 font-semibold transition"
                          >
                            Thu hồi
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
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
