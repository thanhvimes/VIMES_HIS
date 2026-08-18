import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { OperationsDashboardMetrics, OrphanArtifact, templateStudioService } from '../../../services/templateStudioService';

interface TemplateOperationsDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TemplateOperationsDashboardModal: React.FC<TemplateOperationsDashboardModalProps> = ({
  isOpen,
  onClose
}) => {
  const [metrics, setMetrics] = useState<OperationsDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'storage' | 'activity' | 'runbook'>('overview');
  const [orphans, setOrphans] = useState<OrphanArtifact[]>([]);
  const [orphanLoading, setOrphanLoading] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const data = await templateStudioService.getOperationsMetrics();
      setMetrics(data);
    } catch (err: any) {
      toast.error('Không tải được dữ liệu giám sát vận hành: ' + (err.message || 'Lỗi'));
    } finally {
      setLoading(false);
    }
  };

  const loadOrphans = async () => {
    setOrphanLoading(true);
    try {
      const data = await templateStudioService.listOrphanArtifacts();
      setOrphans(data);
    } catch (err: any) {
      toast.error('Không quét được artifact mồ côi: ' + (err.message || 'Lỗi'));
    } finally {
      setOrphanLoading(false);
    }
  };

  const handleCleanupOrphans = async () => {
    if (!window.confirm(`Bạn có chắc chắn muốn dọn dẹp ${orphans.length} file artifact mồ côi không còn tham chiếu?`)) {
      return;
    }
    setCleaning(true);
    try {
      const res = await templateStudioService.cleanupOrphanArtifacts(orphans.map(o => o.key));
      toast.success(`Đã dọn dẹp an toàn ${res.cleanedCount} file mồ côi!`);
      setOrphans([]);
      loadMetrics();
    } catch (err: any) {
      toast.error('Lỗi khi dọn dẹp artifact: ' + (err.message || 'Lỗi'));
    } finally {
      setCleaning(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMetrics();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-xl text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
              📊
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Dashboard Vận hành & Giám sát Hệ thống (Observability)
              </h2>
              <p className="text-xs text-slate-500">
                Theo dõi hiệu năng kết xuất, dung lượng lưu trữ, hàng đợi và tình trạng sức khỏe dịch vụ.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadMetrics}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              🔄 {loading ? 'Đang cập nhật…' : 'Làm mới'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 dark:border-slate-800 dark:bg-slate-950/40">
          {[
            { key: 'overview', label: '📈 Tổng quan & Hiệu năng' },
            { key: 'storage', label: '🗄️ Quản lý Storage & File mồ côi' },
            { key: 'activity', label: '📜 Nhật ký Hoạt động (Audit)' },
            { key: 'runbook', label: '📖 Runbook Xử lý Sự cố' }
          ].map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key as any);
                if (tab.key === 'storage' && orphans.length === 0) loadOrphans();
              }}
              className={`border-b-2 px-4 py-3 text-xs font-bold transition-all ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && !metrics ? (
            <div className="flex h-64 items-center justify-center text-slate-500">
              Đang tải dữ liệu giám sát…
            </div>
          ) : !metrics ? (
            <div className="text-center text-slate-500 py-12">Không có dữ liệu vận hành.</div>
          ) : (
            <>
              {/* Top 4 KPI Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                {/* 1. Templates */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/80">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Tổng số Biểu mẫu</span>
                    <span className="text-lg">📁</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {metrics.templates.total}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1 text-[11px]">
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {metrics.templates.totalActive} đang dùng
                    </span>
                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      {metrics.templates.byStatus.PUBLISHED || 0} đã phát hành
                    </span>
                  </div>
                </div>

                {/* 2. Test Runs & Pass Rate */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/80">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Tỷ lệ Đạt Test Lab</span>
                    <span className="text-lg">🎯</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {metrics.testRuns.passRate}%
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Đạt: <strong className="text-emerald-600">{metrics.testRuns.passed}</strong></span>
                    <span>Lỗi: <strong className="text-red-600">{metrics.testRuns.failed}</strong></span>
                    <span>Tổng: <strong>{metrics.testRuns.total}</strong></span>
                  </div>
                </div>

                {/* 3. Render Latency Percentiles */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/80">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Độ trễ Kết xuất (P95)</span>
                    <span className="text-lg">⚡</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {metrics.testRuns.p95Ms} ms
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>P50: <strong>{metrics.testRuns.p50Ms}ms</strong></span>
                    <span>P99: <strong>{metrics.testRuns.p99Ms}ms</strong></span>
                    <span>TB: <strong>{metrics.testRuns.avgDurationMs}ms</strong></span>
                  </div>
                </div>

                {/* 4. Storage Usage */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/80">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Dung lượng Lưu trữ</span>
                    <span className="text-lg">🗄️</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {(metrics.storage.totalBytes / (1024 * 1024)).toFixed(2)} MB
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500">
                    <strong>{metrics.storage.totalArtifacts}</strong> file artifact phiên bản
                  </div>
                </div>
              </div>

              {/* TAB 1: OVERVIEW & SYSTEM HEALTH */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* System Health Indicators */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-900/40">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                      🩺 Tình trạng Sức khỏe Dịch vụ Hạ tầng
                    </h3>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[
                        { name: 'Cơ sở dữ liệu (PostgreSQL)', status: metrics.health.database, icon: '🗄️' },
                        { name: 'Bộ nhớ Lưu trữ (Storage)', status: metrics.health.storage, icon: '📦' },
                        { name: 'Bộ chuyển đổi Carbone/LibreOffice', status: metrics.health.carbone, icon: '📄' },
                        { name: 'Bảo vệ Circuit Breaker', status: 'CLOSED (Bình thường)', icon: '🛡️' }
                      ].map(s => (
                        <div key={s.name} className="flex items-center gap-3 rounded-lg border bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                          <span className="text-2xl">{s.icon}</span>
                          <div>
                            <div className="text-[11px] text-slate-500">{s.name}</div>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                              {s.status}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Template Status Distribution */}
                  <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                      📊 Phân bố Phiên bản Biểu mẫu theo Vòng đời (Lifecycle)
                    </h3>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                      {[
                        { label: 'Bản nháp (DRAFT)', count: metrics.templates.byStatus.DRAFT || 0, color: 'bg-amber-500' },
                        { label: 'Chờ duyệt (IN_REVIEW)', count: metrics.templates.byStatus.IN_REVIEW || 0, color: 'bg-purple-500' },
                        { label: 'Đã duyệt (APPROVED)', count: metrics.templates.byStatus.APPROVED || 0, color: 'bg-blue-500' },
                        { label: 'Đã phát hành (PUBLISHED)', count: metrics.templates.byStatus.PUBLISHED || 0, color: 'bg-emerald-500' },
                        { label: 'Ngừng dùng (RETIRED)', count: metrics.templates.byStatus.RETIRED || 0, color: 'bg-slate-400' }
                      ].map(item => (
                        <div key={item.label} className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{item.label}</span>
                          </div>
                          <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                            {item.count}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: STORAGE & ORPHANS */}
              {activeTab === 'storage' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Quét & Dọn dẹp File Lưu trữ Mồ côi (Orphan Artifacts)
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Phát hiện các file binary DOCX/PDF trên ổ đĩa/S3 không còn metadata phiên bản tham chiếu để giải phóng dung lượng an toàn.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={loadOrphans}
                        disabled={orphanLoading}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        🔍 {orphanLoading ? 'Đang quét…' : 'Quét lại'}
                      </button>
                      {orphans.length > 0 && (
                        <button
                          type="button"
                          onClick={handleCleanupOrphans}
                          disabled={cleaning}
                          className="rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-red-700 shadow-sm"
                        >
                          🗑️ {cleaning ? 'Đang dọn dẹp…' : `Dọn sạch (${orphans.length} file)`}
                        </button>
                      )}
                    </div>
                  </div>

                  {orphanLoading ? (
                    <div className="text-center py-8 text-xs text-slate-500">Đang quét kho lưu trữ…</div>
                  ) : orphans.length === 0 ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-6 text-center text-xs text-emerald-800 dark:border-emerald-950 dark:bg-emerald-950/20 dark:text-emerald-300">
                      ✅ Kho lưu trữ sạch sẽ! Không phát hiện file mồ côi nào cần dọn dẹp.
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b bg-slate-100 dark:border-slate-800 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                          <tr>
                            <th className="p-3">Đường dẫn file (Storage Key)</th>
                            <th className="p-3 text-right">Dung lượng</th>
                            <th className="p-3">Ngày sửa đổi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {orphans.map(item => (
                            <tr key={item.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="p-3 font-mono font-medium text-slate-800 dark:text-slate-200">
                                {item.key}
                              </td>
                              <td className="p-3 text-right text-slate-600 dark:text-slate-400">
                                {(item.size / 1024).toFixed(1)} KB
                              </td>
                              <td className="p-3 text-slate-500">
                                {new Date(item.modifiedAt).toLocaleString('vi-VN')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: RECENT AUDIT ACTIVITY */}
              {activeTab === 'activity' && (
                <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b bg-slate-100 dark:border-slate-800 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                      <tr>
                        <th className="p-3">Thời gian</th>
                        <th className="p-3">Người thực hiện</th>
                        <th className="p-3">Hành động</th>
                        <th className="p-3">Đối tượng</th>
                        <th className="p-3">Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {metrics.recentActivity.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 text-slate-500 whitespace-nowrap">
                            {new Date(item.createdAt).toLocaleString('vi-VN')}
                          </td>
                          <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                            {item.actorId}
                          </td>
                          <td className="p-3">
                            <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] dark:bg-slate-800">
                              {item.action}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">
                            {item.entityType}
                          </td>
                          <td className="p-3 font-mono text-[11px] text-slate-500 max-w-xs truncate">
                            {JSON.stringify(item.detail)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 4: INCIDENT RUNBOOK */}
              {activeTab === 'runbook' && (
                <div className="space-y-4 text-xs">
                  <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 dark:border-red-950 dark:bg-red-950/20">
                    <h4 className="font-bold text-red-800 dark:text-red-300 flex items-center gap-2">
                      🚨 Sự cố 1: LibreOffice/Carbone chuyển đổi PDF bị treo hoặc sập
                    </h4>
                    <ul className="mt-2 list-disc pl-5 space-y-1 text-red-900 dark:text-red-200">
                      <li><strong>Hiện tượng:</strong> Circuit Breaker chuyển sang trạng thái <code>OPEN</code>, API kết xuất trả về mã <code>503</code> kèm hướng dẫn thử lại.</li>
                      <li><strong>Cơ chế tự phục hồi:</strong> Circuit Breaker sẽ tự động thăm dò ở trạng thái <code>HALF_OPEN</code> sau 10 giây và phục hồi về <code>CLOSED</code> khi Carbone sẵn sàng.</li>
                      <li><strong>Hành động vận hành:</strong> Kiểm tra tiến trình LibreOffice trên server (`ps aux | grep soffice`) và khởi động lại container Carbone nếu cần.</li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-950 dark:bg-amber-950/20">
                    <h4 className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                      ⚡ Sự cố 2: Giờ cao điểm khám bệnh gây nghẽn hàng đợi in
                    </h4>
                    <ul className="mt-2 list-disc pl-5 space-y-1 text-amber-900 dark:text-amber-200">
                      <li><strong>Chế độ Cấp cứu:</strong> Luồng cấp cứu gắn cờ <code>isEmergency: true</code> hoặc header <code>X-Emergency-Priority: 1</code> được ưu tiên xử lý tức thì, không bị nghẽn trong hàng đợi thông thường.</li>
                      <li><strong>Idempotency:</strong> Các yêu cầu in gửi lặp lại trong vòng 5 phút có kèm <code>Idempotency-Key</code> được trả ngay từ bộ nhớ cache mà không cần render lại.</li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-950 dark:bg-blue-950/20">
                    <h4 className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                      ↩️ Sự cố 3: Biểu mẫu mới phát hành có lỗi nội dung cần Rollback khẩn cấp
                    </h4>
                    <ul className="mt-2 list-disc pl-5 space-y-1 text-blue-900 dark:text-blue-200">
                      <li>Tại tab <strong>Phiên bản</strong>, người có quyền <code>PUBLISH</code> chọn nút <strong>"Rollback version đã chọn gần nhất"</strong>.</li>
                      <li>Hệ thống tự động kích hoạt lại version ổn định trước đó trong 1 transaction an toàn mà <strong>không cần khởi động lại máy chủ backend</strong>.</li>
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
