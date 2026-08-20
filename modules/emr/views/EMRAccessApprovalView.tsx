import React, { useState, useEffect } from 'react';
import { EMRAccessRequest, EMRAuditLog, EMRRecord } from '../types';
import { emrService } from '../services/emrService';
import { ACCESS_PURPOSE_LABELS } from '../constants';
import {
  ShieldCheck,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  KeyRound,
  ShieldAlert,
  Calendar,
  Building2,
  FileText,
  Lock,
  Loader2,
  X
} from 'lucide-react';
import { toast } from 'sonner';

export const EMRAccessApprovalView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'requests' | 'audit_logs'>('requests');
  const [requests, setRequests] = useState<EMRAccessRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<EMRAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // New Request Modal State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [availableRecords, setAvailableRecords] = useState<EMRRecord[]>([]);
  const [formData, setFormData] = useState({
    recordId: '',
    fullName: 'TS.BS. Phan Quốc Anh',
    department: 'Viện Nghiên cứu Y Dược',
    organization: 'Đại học Y Dược TP.HCM',
    role: 'Chủ nhiệm Đề tài NCKH',
    purpose: 'scientific_research' as EMRAccessRequest['purpose'],
    purposeDescription: 'Nghiên cứu hồi cứu hiệu quả phác đồ can thiệp tim mạch trong 5 năm.',
    requestedScope: 'full' as EMRAccessRequest['requestedScope'],
    requestedDurationHours: 48,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqs, logs, recs] = await Promise.all([
        emrService.getAccessRequests(),
        emrService.getAuditLogs(),
        emrService.getRecords(),
      ]);
      setRequests(reqs);
      setAuditLogs(logs);
      setAvailableRecords(recs);
      if (recs.length > 0) {
        setFormData(prev => ({ ...prev, recordId: recs[0].id }));
      }
    } catch (err) {
      toast.error('Lỗi khi tải dữ liệu yêu cầu khai thác');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      await emrService.approveAccessRequest(requestId, {
        userId: 'DIR-01',
        fullName: 'PGS.TS. Trần Quốc Hưng',
        title: 'Phó Giám Đốc Bệnh Viện',
      });
      toast.success('Đã phê duyệt và cấp mã truy cập EMR có thời hạn');
      loadData();
    } catch (err) {
      toast.error('Phê duyệt thất bại');
    }
  };

  const handleReject = async (requestId: string) => {
    const reason = prompt('Nhập lý do từ chối yêu cầu khai thác:') || 'Không đủ điều kiện theo quy chế bệnh viện';
    try {
      await emrService.rejectAccessRequest(requestId, reason);
      toast.info('Đã từ chối phiếu yêu cầu khai thác');
      loadData();
    } catch (err) {
      toast.error('Lỗi khi từ chối yêu cầu');
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedRecord = availableRecords.find(r => r.id === formData.recordId);
    if (!selectedRecord) {
      toast.error('Vui lòng chọn hồ sơ bệnh án cần khai thác');
      return;
    }

    try {
      await emrService.createAccessRequest({
        recordId: selectedRecord.id,
        recordNumber: selectedRecord.recordNumber,
        patientName: selectedRecord.patient.fullName,
        patientId: selectedRecord.patient.patientId,
        requestedBy: {
          userId: `US-${Date.now()}`,
          fullName: formData.fullName,
          department: formData.department,
          organization: formData.organization,
          role: formData.role,
        },
        purpose: formData.purpose,
        purposeDescription: formData.purposeDescription,
        requestedScope: formData.requestedScope,
        requestedDurationHours: Number(formData.requestedDurationHours),
      });

      toast.success('Tạo phiếu yêu cầu khai thác HSBA thành công. Đang chờ lãnh đạo duyệt.');
      setIsNewModalOpen(false);
      loadData();
    } catch (err) {
      toast.error('Lỗi khi tạo yêu cầu');
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Quản lý Khai thác Bệnh án & Nhật ký Truy vết (Audit Logs)
            </h1>
            <p className="text-xs text-slate-500">
              Quy trình cấp quyền mượn/khai thác HSBA theo Điều 59 Luật KCB và Thông tư 46/2018/TT-BYT.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo phiếu yêu cầu khai thác</span>
        </button>
      </div>

      {/* Tabs Header */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'requests'
              ? 'bg-sky-500 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Danh sách Phiếu Yêu cầu Khai thác ({requests.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit_logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'audit_logs'
              ? 'bg-sky-500 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Nhật ký Truy vết An ninh (Audit Logs) ({auditLogs.length})
        </button>
      </div>

      {/* Content Tab 1: Access Requests */}
      {activeTab === 'requests' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Mã phiếu / Ngày yêu cầu</th>
                  <th className="p-3">Hồ sơ BA & Bệnh nhân</th>
                  <th className="p-3">Người yêu cầu & Cơ quan</th>
                  <th className="p-3">Mục đích & Phạm vi</th>
                  <th className="p-3">Thời hạn truy cập</th>
                  <th className="p-3 text-center">Trạng thái</th>
                  <th className="p-3 text-right">Phê duyệt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {requests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    {/* Mã phiếu */}
                    <td className="p-3 align-top font-mono">
                      <strong className="text-sky-700 dark:text-sky-400 block font-bold">{req.requestNumber}</strong>
                      <span className="text-[11px] text-slate-400">{req.requestDate}</span>
                    </td>

                    {/* Hồ sơ */}
                    <td className="p-3 align-top">
                      <strong className="text-slate-900 dark:text-slate-100 block">{req.patientName}</strong>
                      <span className="font-mono text-slate-500 text-[11px]">{req.recordNumber} ({req.patientId})</span>
                    </td>

                    {/* Người yêu cầu */}
                    <td className="p-3 align-top">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{req.requestedBy.fullName}</p>
                      <p className="text-[11px] text-slate-500">{req.requestedBy.role} • {req.requestedBy.organization || req.requestedBy.department}</p>
                    </td>

                    {/* Mục đích & Phạm vi */}
                    <td className="p-3 align-top max-w-[240px]">
                      <span className="px-2 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[10px] font-semibold block mb-1">
                        {ACCESS_PURPOSE_LABELS[req.purpose] || req.purpose}
                      </span>
                      <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-snug line-clamp-2">
                        {req.purposeDescription}
                      </p>
                    </td>

                    {/* Thời hạn & Token */}
                    <td className="p-3 align-top font-mono text-[11px]">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">{req.requestedDurationHours} giờ</p>
                      {req.accessExpiry && (
                        <p className="text-emerald-600 dark:text-emerald-400 text-[10px]">Hết hạn: {req.accessExpiry}</p>
                      )}
                      {req.accessToken && (
                        <span className="text-[9px] text-slate-400 block truncate max-w-[120px]" title={req.accessToken}>
                          Key: {req.accessToken}
                        </span>
                      )}
                    </td>

                    {/* Trạng thái */}
                    <td className="p-3 align-top text-center">
                      {req.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Đã duyệt
                        </span>
                      ) : req.status === 'rejected' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                          <XCircle className="w-3 h-3" /> Từ chối
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          <Clock className="w-3 h-3" /> Chờ lãnh đạo duyệt
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3 align-top text-right space-x-1.5">
                      {req.status === 'pending' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleApprove(req.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-bold shadow-2xs"
                          >
                            Duyệt
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(req.id)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-md text-[11px] font-semibold border border-rose-200"
                          >
                            Từ chối
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Hoàn tất</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Content Tab 2: Audit Logs */}
      {activeTab === 'audit_logs' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Thời gian ghi vết</th>
                  <th className="p-3">Người thực hiện & Vai trò</th>
                  <th className="p-3">Địa chỉ IP</th>
                  <th className="p-3">Hồ sơ bệnh án tác động</th>
                  <th className="p-3">Hành động</th>
                  <th className="p-3">Chi tiết nghiệp vụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 text-slate-500 font-sans text-[11px]">{log.timestamp}</td>
                    <td className="p-3 font-sans">
                      <strong className="text-slate-900 dark:text-slate-100 block">{log.userName}</strong>
                      <span className="text-[10px] text-slate-400 font-mono">({log.userRole})</span>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400 text-[11px]">{log.ipAddress}</td>
                    <td className="p-3 font-sans">
                      <span className="font-bold text-sky-700 dark:text-sky-400 font-mono block">{log.recordNumber}</span>
                      <span className="text-[11px] text-slate-500">{log.patientName}</span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 font-sans text-slate-700 dark:text-slate-300 text-xs">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Tạo phiếu yêu cầu khai thác mới */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-sky-600" />
                <span>Lập Phiếu Yêu Cầu Khai Thác Hồ Sơ Bệnh Án</span>
              </h3>
              <button type="button" onClick={() => setIsNewModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Chọn Hồ sơ Bệnh án cần khai thác:
                </label>
                <select
                  value={formData.recordId}
                  onChange={e => setFormData({ ...formData, recordId: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {availableRecords.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.recordNumber} - {r.patient.fullName} ({r.specialty})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Họ tên người yêu cầu:</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Cơ quan / Đơn vị công tác:</label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={e => setFormData({ ...formData, organization: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mục đích khai thác:</label>
                  <select
                    value={formData.purpose}
                    onChange={e => setFormData({ ...formData, purpose: e.target.value as any })}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="scientific_research">Nghiên cứu khoa học & Đề tài</option>
                    <option value="legal_investigation">Phục vụ cơ quan pháp luật</option>
                    <option value="insurance_audit">Giám định Bảo hiểm Y tế</option>
                    <option value="clinical_consultation">Hội chẩn liên viện</option>
                    <option value="student_training">Đào tạo sinh viên y khoa</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Thời hạn xin truy cập (Giờ):</label>
                  <input
                    type="number"
                    min="1"
                    max="720"
                    value={formData.requestedDurationHours}
                    onChange={e => setFormData({ ...formData, requestedDurationHours: Number(e.target.value) })}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nội dung giải trình chi tiết:</label>
                <textarea
                  rows={3}
                  value={formData.purposeDescription}
                  onChange={e => setFormData({ ...formData, purposeDescription: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-sm"
                >
                  Gửi phiếu yêu cầu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
