import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { AuditLog } from '../../types';
import {
  ShieldCheck,
  RefreshCw,
  Lock,
  Search,
  Filter,
  User,
  Clock,
  Activity,
  CheckCircle2,
  FileText,
  Eye,
  LogIn,
  AlertTriangle,
  Download,
  RotateCcw,
  Edit3,
  Calendar,
  FileSpreadsheet
} from 'lucide-react';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/audit-logs');
      setLogs(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Bạn không có quyền truy cập nhật ký bảo mật hệ thống.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        !searchTerm ||
        (log.username && log.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.userId && log.userId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.patientName && log.patientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.patientId && log.patientId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.ipAddress && log.ipAddress.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.reason && log.reason.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.orderId && log.orderId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.resourceId && log.resourceId.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesAction =
        actionFilter === 'ALL' ||
        (log.action && log.action.toUpperCase() === actionFilter.toUpperCase());

      return matchesSearch && matchesAction;
    });
  }, [logs, searchTerm, actionFilter]);

  const formatTimestamp = (ts: string) => {
    try {
      const d = new Date(ts);
      const hours = d.getHours().toString().padStart(2, '0');
      const mins = d.getMinutes().toString().padStart(2, '0');
      const secs = d.getSeconds().toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();
      return `${hours}:${mins}:${secs} - ${day}/${month}/${year}`;
    } catch {
      return ts;
    }
  };

  const renderRoleBadge = (role: string) => {
    const r = (role || '').toUpperCase();
    if (r.includes('SUPER_ADMIN') || r === 'ADMIN') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
          SUPER_ADMIN
        </span>
      );
    }
    if (r.includes('RADIO') || r.includes('BÁC SĨ') || r.includes('DOCTOR')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
          BÁC SĨ CĐHA
        </span>
      );
    }
    if (r.includes('TECH') || r.includes('KỸ THUẬT')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
          KỸ THUẬT VIÊN
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
        {role || 'USER'}
      </span>
    );
  };

  const renderActionBadge = (action: string) => {
    const act = (action || '').toUpperCase();
    if (act.includes('REVOKE')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 shadow-xs">
          <RotateCcw className="w-3 h-3 text-rose-600 dark:text-rose-400 animate-spin-once" /> HỦY KÝ SỐ
        </span>
      );
    }
    if (act.includes('SIGN')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> KÝ BÁO CÁO
        </span>
      );
    }
    if (act.includes('DRAFT')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
          <Edit3 className="w-3 h-3 text-amber-600 dark:text-amber-400" /> LƯU NHÁP
        </span>
      );
    }
    if (act.includes('VIEW') || act.includes('READ')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-cyan-100 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
          <Eye className="w-3 h-3 text-cyan-600 dark:text-cyan-400" /> XEM CA CHỤP
        </span>
      );
    }
    if (act.includes('LOGIN')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
          <LogIn className="w-3 h-3" /> ĐĂNG NHẬP
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
        <Activity className="w-3 h-3" /> {action}
      </span>
    );
  };

  const handleExportCsv = () => {
    if (filteredLogs.length === 0) {
      alert('Không có dữ liệu nhật ký để xuất file.');
      return;
    }
    const headers = ['Thời gian', 'Tài khoản', 'Vai trò', 'Hành động', 'Bệnh nhân', 'Mã ca chụp', 'Loại máy', 'Chi tiết', 'Lý do hủy/sửa', 'Địa chỉ IP'];
    const rows = filteredLogs.map((l) => [
      `"${formatTimestamp(l.timestamp)}"`,
      `"${l.username || l.userId || ''}"`,
      `"${l.role || ''}"`,
      `"${l.action || ''}"`,
      `"${l.patientName ? `${l.patientName} (${l.patientId || ''})` : l.patientId || ''}"`,
      `"${l.orderId || l.resourceId || ''}"`,
      `"${l.modality || ''}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
      `"${(l.reason || '').replace(/"/g, '""')}"`,
      `"${l.ipAddress || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `VIMES_PACS_Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6 pb-12">
      {/* ── Top Header Banner (ViMES Medical Standard) ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#090d16] via-[#17424c] to-[#090d16] border border-teal-500/30 p-6 shadow-xl text-white">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#008A5E] to-[#2A9D8F] flex items-center justify-center shadow-lg shadow-teal-900/40 border border-teal-300/30 flex-shrink-0 p-3">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Nhật Ký Thao Tác & Kiểm Toán PACS / RIS
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-400/30">
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                  Audit Trail BYT & HIPAA
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Theo dõi minh bạch: Bác sĩ trả kết quả, Bác sĩ hủy ký số, lý do hủy ký, lưu nháp và mở xem phim DICOM
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 border border-emerald-400/30 text-xs font-bold text-white transition active:scale-95 shadow-sm cursor-pointer"
              title="Xuất file Excel / CSV nhật ký kiểm toán"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Xuất Báo Cáo
            </button>
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white transition active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Tải lại dữ liệu nhật ký"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Làm Mới
            </button>
          </div>
        </div>
      </div>

      {/* ── Filter & Search Toolbar ── */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên bác sĩ, bệnh nhân, mã ca, lý do, IP..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold flex-shrink-0">
            <Filter className="w-3.5 h-3.5" /> Lọc Sự Kiện:
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50 cursor-pointer"
          >
            <option value="ALL">Tất cả sự kiện ({logs.length})</option>
            <option value="SIGN_REPORT">🟢 Bác Sĩ Ký Báo Cáo / Trả KQ</option>
            <option value="REVOKE_SIGNATURE">🔴 Bác Sĩ Hủy Ký Số & Mở Khóa</option>
            <option value="SAVE_DRAFT">🟡 Bác Sĩ Lưu Nháp Kết Quả</option>
            <option value="VIEW_STUDY">🔵 Mở Xem Ảnh DICOM 3D</option>
            <option value="LOGIN">⚪ Đăng Nhập Hệ Thống</option>
          </select>
        </div>
      </div>

      {/* ── Main Log Table ── */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 text-center text-slate-400 dark:text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-teal-600 dark:text-teal-400 mb-3" />
            <p className="text-sm font-semibold">Đang truy xuất nhật ký bảo mật từ CSDL PostgreSQL...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-rose-500 dark:text-rose-400 font-medium">
            <Lock className="w-10 h-10 mx-auto mb-2 opacity-60" />
            <p className="text-base font-bold">{error}</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-16 text-center text-slate-400 dark:text-slate-500 space-y-2">
            <AlertTriangle className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-bold">Không tìm thấy bản ghi nhật ký phù hợp</p>
            <p className="text-xs">Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc hành động.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/80 text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 sticky top-0">
                <tr>
                  <th className="py-3 px-4 font-bold">Thời Gian</th>
                  <th className="py-3 px-4 font-bold">Bác Sĩ / Người Thực Hiện</th>
                  <th className="py-3 px-4 font-bold">Hành Động</th>
                  <th className="py-3 px-4 font-bold">Bệnh Nhân / Ca Chụp</th>
                  <th className="py-3 px-4 font-bold">Địa Chỉ IP</th>
                  <th className="py-3 px-4 font-bold">Chi Tiết &amp; Lý Do Xử Lý</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {filteredLogs.map((log, index) => (
                  <tr
                    key={log.id || index}
                    className={`transition hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                      log.action?.toUpperCase().includes('REVOKE')
                        ? 'bg-rose-50/40 dark:bg-rose-950/20'
                        : ''
                    }`}
                  >
                    {/* Timestamp */}
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono whitespace-nowrap align-top">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{formatTimestamp(log.timestamp)}</span>
                      </div>
                    </td>

                    {/* Username & Role */}
                    <td className="py-3 px-4 align-top">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                          <User className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                          <span>{log.username || log.userId}</span>
                        </div>
                        <div>{renderRoleBadge(log.role)}</div>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 whitespace-nowrap align-top">
                      {renderActionBadge(log.action)}
                    </td>

                    {/* Patient & Modality */}
                    <td className="py-3 px-4 align-top">
                      {log.patientName || log.patientId || log.orderId ? (
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-800 dark:text-slate-100 uppercase">
                            {log.patientName || 'BỆNH NHÂN'}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            {log.modality && (
                              <span className="px-1.5 py-0.2 rounded bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 font-bold">
                                {log.modality}
                              </span>
                            )}
                            <span>{log.patientId || log.orderId || log.resourceId}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">{log.resourceId || '—'}</span>
                      )}
                    </td>

                    {/* IP Address */}
                    <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap align-top">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300">
                        {log.ipAddress || '127.0.0.1'}
                      </span>
                    </td>

                    {/* Details & Reason */}
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-200 font-sans font-medium max-w-lg align-top">
                      <div className="space-y-1.5">
                        <p className="leading-relaxed">{log.details}</p>
                        {log.reason && (
                          <div className="p-2 rounded-lg bg-rose-100/70 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 text-[11px] leading-relaxed">
                            <span className="font-bold">⚠️ Lý do hủy/đính chính:</span> {log.reason}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Summary */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>Hiển thị <b>{filteredLogs.length}</b> / {logs.length} bản ghi kiểm toán</span>
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> Ghi log theo chuẩn y tế HIPAA &amp; Thông tư Bộ Y Tế
          </span>
        </div>
      </div>
    </div>
  );
};

export default AuditLogPage;
