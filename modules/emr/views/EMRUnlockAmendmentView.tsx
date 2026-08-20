import React, { useState, useEffect } from 'react';
import { EMRUnlockRequest, EMRRecord } from '../types';
import { emrService } from '../services/emrService';
import { UNLOCK_REASON_LABELS } from '../constants';
import {
  Key,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileEdit,
  History,
  ShieldCheck,
  Plus,
  X,
  Search,
  Eye,
  GitCommit,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export const EMRUnlockAmendmentView: React.FC = () => {
  const [requests, setRequests] = useState<EMRUnlockRequest[]>([]);
  const [records, setRecords] = useState<EMRRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRequestForDiff, setSelectedRequestForDiff] = useState<EMRUnlockRequest | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    recordId: '',
    reasonCategory: 'late_pathology_results' as EMRUnlockRequest['reasonCategory'],
    reasonDescription: '',
    targetDocumentCodes: ['02/BV-01'],
    requestedDurationHours: 4,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqs, recs] = await Promise.all([
        emrService.getUnlockRequests(),
        emrService.getRecords(),
      ]);
      setRequests(reqs);
      setRecords(recs);
      if (recs.length > 0 && !formData.recordId) {
        setFormData(prev => ({ ...prev, recordId: recs[0].id }));
      }
    } catch (err) {
      toast.error('Lỗi khi tải dữ liệu yêu cầu mở khóa');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetRecord = records.find(r => r.id === formData.recordId);
    if (!targetRecord) return;

    try {
      await emrService.createUnlockRequest({
        recordId: targetRecord.id,
        recordNumber: targetRecord.recordNumber,
        patientName: targetRecord.patient.fullName,
        departmentName: targetRecord.departmentName,
        requestedBy: {
          userId: 'BS-001',
          fullName: 'BSCKII. Nguyễn Văn An',
          title: 'Bác sĩ điều trị',
        },
        reasonCategory: formData.reasonCategory,
        reasonDescription: formData.reasonDescription,
        targetDocumentCodes: formData.targetDocumentCodes,
        requestedDurationHours: formData.requestedDurationHours,
      });

      toast.success('Đã gửi đề xuất mở khóa sửa đổi hồ sơ thành công lên Ban Giám Đốc / KHTH!');
      setIsCreateModalOpen(false);
      loadData();
    } catch (err) {
      toast.error('Lỗi khi tạo đề xuất mở khóa');
    }
  };

  const handleApprove = async (req: EMRUnlockRequest) => {
    try {
      await emrService.approveUnlockRequest(req.id, {
        userId: 'DIR-01',
        fullName: 'PGS.TS. Trần Quốc Hưng',
        title: 'Phó Giám Đốc Bệnh Viện',
      });
      toast.success(`Đã phê duyệt mở khóa hồ sơ ${req.recordNumber} trong vòng ${req.requestedDurationHours} giờ!`);
      loadData();
    } catch (err) {
      toast.error('Lỗi khi phê duyệt mở khóa');
    }
  };

  const filteredRequests = requests.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.recordNumber.toLowerCase().includes(q) ||
        r.patientName.toLowerCase().includes(q) ||
        r.requestNumber.toLowerCase().includes(q) ||
        r.departmentName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const completedCount = requests.filter(r => r.status === 'completed').length;

  return (
    <div className="space-y-4 pb-12">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Quản lý Mở khóa & Sửa đổi Bổ sung HSBA (EMR Amendments)
            </h1>
            <p className="text-xs text-slate-500">
              Quy trình đề xuất, phê duyệt đa cấp và kiểm soát phiên bản (v1.0 → v1.1) theo Điều 9 & 10 Thông tư 46/2018/TT-BYT.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Đề xuất Mở khóa</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">Chờ Ban Giám Đốc Duyệt</span>
            <div className="text-2xl font-black text-amber-700 dark:text-amber-200">{pendingCount}</div>
            <p className="text-[10px] text-amber-600">Đề xuất từ khoa điều trị</p>
          </div>
          <div className="p-3 bg-amber-100 dark:bg-amber-900/60 text-amber-700 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/60 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-sky-800 dark:text-sky-300">Đang Mở khóa (Trong Thời hạn)</span>
            <div className="text-2xl font-black text-sky-700 dark:text-sky-200">{approvedCount}</div>
            <p className="text-[10px] text-sky-600">Bác sĩ đang cập nhật dữ liệu</p>
          </div>
          <div className="p-3 bg-sky-100 dark:bg-sky-900/60 text-sky-700 rounded-xl">
            <FileEdit className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Đã Hoàn tất & Tăng Phiên bản</span>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-200">{completedCount}</div>
            <p className="text-[10px] text-emerald-600">Lưu vết Diff v1.0 → v1.1</p>
          </div>
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 rounded-xl">
            <GitCommit className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo Mã phiếu, Số HSBA, Tên người bệnh, Khoa..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          >
            <option value="all">Tất cả trạng thái đề xuất</option>
            <option value="pending">Chờ phê duyệt</option>
            <option value="approved">Đang mở khóa</option>
            <option value="completed">Đã sửa & Khóa lại</option>
            <option value="rejected">Từ chối</option>
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Mã phiếu & Hồ sơ BA</th>
                <th className="p-3">Khoa & Bác sĩ đề xuất</th>
                <th className="p-3">Lý do & Nội dung sửa đổi</th>
                <th className="p-3 text-center">Thời hạn mở khóa</th>
                <th className="p-3 text-center">Phiên bản</th>
                <th className="p-3 text-center">Trạng thái</th>
                <th className="p-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-600" />
                    <p>Đang tải danh sách đề xuất mở khóa...</p>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Không có yêu cầu mở khóa nào.
                  </td>
                </tr>
              ) : (
                filteredRequests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3 align-top font-mono">
                      <span className="font-bold text-amber-700 dark:text-amber-400 block">{req.requestNumber}</span>
                      <strong className="text-slate-900 dark:text-slate-100 font-sans block mt-0.5">{req.patientName}</strong>
                      <span className="text-[11px] text-sky-700 dark:text-sky-400">{req.recordNumber}</span>
                    </td>

                    <td className="p-3 align-top">
                      <strong className="text-slate-800 dark:text-slate-200 block">{req.departmentName}</strong>
                      <p className="text-[11px] text-slate-500">BS: {req.requestedBy.fullName}</p>
                      <span className="text-[10px] text-slate-400 font-mono">Gửi: {req.requestedAt}</span>
                    </td>

                    <td className="p-3 align-top max-w-xs">
                      <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-semibold text-[10px] block w-fit mb-1">
                        {UNLOCK_REASON_LABELS[req.reasonCategory]}
                      </span>
                      <p className="text-slate-600 dark:text-slate-400 text-[11px] line-clamp-2">
                        {req.reasonDescription}
                      </p>
                    </td>

                    <td className="p-3 align-top text-center font-mono text-[11px]">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{req.requestedDurationHours} giờ</span>
                      {req.unlockExpiresAt && (
                        <p className="text-[10px] text-amber-600 font-medium">Hết hạn: {req.unlockExpiresAt}</p>
                      )}
                    </td>

                    <td className="p-3 align-top text-center font-mono">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                        v{req.versionBefore} {req.versionAfter ? `→ v${req.versionAfter}` : ''}
                      </span>
                    </td>

                    <td className="p-3 align-top text-center">
                      {req.status === 'pending' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          Chờ BGĐ duyệt
                        </span>
                      )}
                      {req.status === 'approved' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                          Đang mở khóa
                        </span>
                      )}
                      {req.status === 'completed' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Đã sửa & Khóa lại
                        </span>
                      )}
                    </td>

                    <td className="p-3 align-top text-right space-x-1.5 whitespace-nowrap">
                      {req.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleApprove(req)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs"
                        >
                          Duyệt mở khóa
                        </button>
                      )}

                      {req.diffSummary && req.diffSummary.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedRequestForDiff(req)}
                          className="px-2.5 py-1.5 bg-purple-50 dark:bg-purple-950 hover:bg-purple-100 text-purple-700 dark:text-purple-300 font-semibold rounded-lg text-xs inline-flex items-center gap-1"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>Xem vết sửa (Diff)</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tạo Đề Xuất Mở Khóa */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Lập Phiếu Đề Xuất Mở Khóa Hồ Sơ Bệnh Án
                </h3>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Chọn Hồ sơ Bệnh án cần mở khóa <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.recordId}
                  onChange={e => setFormData({ ...formData, recordId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                >
                  {records.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.recordNumber} - {r.patient.fullName} ({r.departmentName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nhóm lý do sửa đổi / bổ sung <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.reasonCategory}
                  onChange={e => setFormData({ ...formData, reasonCategory: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {Object.entries(UNLOCK_REASON_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Thời gian cần mở khóa (Giờ)
                </label>
                <select
                  value={formData.requestedDurationHours}
                  onChange={e => setFormData({ ...formData, requestedDurationHours: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value={2}>2 giờ (Sửa thông tin nhanh)</option>
                  <option value={4}>4 giờ (Bổ sung kết quả CLS)</option>
                  <option value={8}>8 giờ (Trong ca trực)</option>
                  <option value={24}>24 giờ (Theo quyết định hội đồng)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Chi tiết lý do & nội dung cần chỉnh sửa <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={formData.reasonDescription}
                  onChange={e => setFormData({ ...formData, reasonDescription: e.target.value })}
                  placeholder="Ví dụ: Khoa GPB vừa trả kết quả mô bệnh học ruột thừa, cần bổ sung vào hồ sơ và tóm tắt xuất viện..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl"
                >
                  Gửi Đề Xuất
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xem Vết Sửa Đổi (Diff Viewer) */}
      {selectedRequestForDiff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Bảng Ghi Vết Chỉnh Sửa & So Sánh Phiên Bản (Version Diff)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Hồ sơ {selectedRequestForDiff.recordNumber} • v{selectedRequestForDiff.versionBefore} → v{selectedRequestForDiff.versionAfter}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedRequestForDiff(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 dark:text-slate-400 italic">
                Căn cứ Điều 10 TT46: Mọi thay đổi trên hồ sơ sau khi ký số đều phải lưu vết thời gian, người sửa, dữ liệu gốc và dữ liệu mới.
              </p>

              {selectedRequestForDiff.diffSummary?.map((diff, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                  <div className="flex justify-between items-center font-semibold text-slate-800 dark:text-slate-200">
                    <span>Trường dữ liệu: <strong className="text-purple-700 dark:text-purple-400">{diff.field}</strong></span>
                    <span className="font-mono text-[10px] text-slate-400">{diff.modifiedAt} ({diff.modifiedBy})</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <div className="p-2.5 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-lg text-rose-900 dark:text-rose-300">
                      <strong className="block text-[10px] uppercase text-rose-600 font-bold mb-1">Dữ liệu gốc (Phiên bản v{selectedRequestForDiff.versionBefore}):</strong>
                      <p>{diff.oldValue}</p>
                    </div>

                    <div className="p-2.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 rounded-lg text-emerald-900 dark:text-emerald-300">
                      <strong className="block text-[10px] uppercase text-emerald-600 font-bold mb-1">Dữ liệu sau khi sửa (Phiên bản v{selectedRequestForDiff.versionAfter}):</strong>
                      <p>{diff.newValue}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRequestForDiff(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
