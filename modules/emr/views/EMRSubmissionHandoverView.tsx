import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EMRHandoverRecord, EMRRecord } from '../types';
import { emrService } from '../services/emrService';
import { HANDOVER_STATUS_LABELS } from '../constants';
import { EMRComplianceCheckerModal } from '../components/EMRComplianceCheckerModal';
import { EMRHandoverReceiptModal } from '../components/EMRHandoverReceiptModal';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Building2,
  FileCheck,
  ShieldAlert,
  ArrowRight,
  Printer,
  ChevronRight,
  AlertTriangle,
  RotateCcw,
  CheckSquare,
  Square,
  Award,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

export const EMRSubmissionHandoverView: React.FC = () => {
  const navigate = useNavigate();
  const [handovers, setHandovers] = useState<EMRHandoverRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Modals state
  const [selectedRecordForAudit, setSelectedRecordForAudit] = useState<EMRRecord | null>(null);
  const [selectedHandoverReceipt, setSelectedHandoverReceipt] = useState<EMRHandoverRecord | null>(null);

  useEffect(() => {
    loadHandovers();
  }, [statusFilter, departmentFilter, search]);

  const loadHandovers = async () => {
    setLoading(true);
    try {
      const data = await emrService.getHandoverRecords({
        status: statusFilter,
        department: departmentFilter,
        search: search,
      });
      setHandovers(data);
    } catch (err) {
      toast.error('Lỗi khi tải danh sách giao nhận bệnh án');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (ho: EMRHandoverRecord) => {
    try {
      await emrService.acceptHandoverRecord(ho.id, {
        userId: 'KHTH-01',
        fullName: 'ThS.BS. Đỗ Quang Huy',
        title: 'Phó Phòng Kế hoạch Tổng hợp',
      });
      toast.success(`Đã duyệt tiếp nhận hồ sơ ${ho.recordNumber} vào Kho EMR chính thức!`);
      loadHandovers();
    } catch (err) {
      toast.error('Lỗi khi duyệt tiếp nhận hồ sơ');
    }
  };

  const handleReject = async (ho: EMRHandoverRecord) => {
    const reason = prompt(`Nhập lý do trả về hồ sơ ${ho.recordNumber} cho ${ho.departmentName}:`);
    if (!reason) return;

    try {
      await emrService.rejectReturnRecord(ho.id, reason, {
        userId: 'KHTH-01',
        fullName: 'ThS.BS. Đỗ Quang Huy',
        title: 'Phó Phòng Kế hoạch Tổng hợp',
      });
      toast.info(`Đã trả hồ sơ ${ho.recordNumber} về ${ho.departmentName} để bổ sung.`);
      loadHandovers();
    } catch (err) {
      toast.error('Lỗi khi trả hồ sơ');
    }
  };

  const handleOpenAuditModal = async (recordId: string) => {
    const rec = await emrService.getRecordById(recordId);
    if (rec) {
      setSelectedRecordForAudit(rec);
    }
  };

  // Stats calculation
  const pendingCount = handovers.filter(h => h.submissionStatus === 'submitted_to_emr').length;
  const acceptedCount = handovers.filter(h => h.submissionStatus === 'accepted_by_emr').length;
  const rejectedCount = handovers.filter(h => h.submissionStatus === 'rejected_by_emr').length;

  return (
    <div className="space-y-4 pb-12">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
            <Inbox className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Quản lý Giao nhận & Tiếp nhận Hồ sơ Bệnh án (EMR Handover)
            </h1>
            <p className="text-xs text-slate-500">
              Rà soát tính đầy đủ của mẫu biểu và chữ ký số trước khi phê duyệt nhận hồ sơ vào Kho lưu trữ EMR.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/emr/records')}
          className="flex items-center gap-1.5 px-4 py-2 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 text-sky-700 dark:text-sky-300 rounded-xl text-xs font-semibold border border-sky-200 dark:border-sky-800 transition-colors"
        >
          <FileText className="w-4 h-4" />
          <span>Danh sách Hồ sơ Toàn viện</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">Chờ KHTH Tiếp nhận & Duyệt</span>
            <div className="text-2xl font-black text-amber-700 dark:text-amber-200">{pendingCount}</div>
            <p className="text-[10px] text-amber-600">Đã nộp từ các khoa điều trị</p>
          </div>
          <div className="p-3 bg-amber-100 dark:bg-amber-900/60 text-amber-700 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Đã Duyệt nhận vào Kho EMR</span>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-200">{acceptedCount}</div>
            <p className="text-[10px] text-emerald-600">Lưu trữ vĩnh viễn (Archived)</p>
          </div>
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-rose-800 dark:text-rose-300">Trả về Yêu cầu Bổ sung</span>
            <div className="text-2xl font-black text-rose-700 dark:text-rose-200">{rejectedCount}</div>
            <p className="text-[10px] text-rose-600">Thiếu chữ ký hoặc biểu mẫu</p>
          </div>
          <div className="p-3 bg-rose-100 dark:bg-rose-900/60 text-rose-700 rounded-xl">
            <RotateCcw className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo Mã HSBA, Mã BN, Tên người bệnh, Bác sĩ..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          >
            <option value="all">Tất cả trạng thái bàn giao</option>
            <option value="submitted_to_emr">Chờ KHTH tiếp nhận</option>
            <option value="accepted_by_emr">Đã duyệt nhận vào Kho EMR</option>
            <option value="rejected_by_emr">Trả về yêu cầu bổ sung</option>
          </select>
        </div>

        <div>
          <select
            value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          >
            <option value="all">Tất cả khoa điều trị</option>
            <option value="Ngoại">Khoa Ngoại Tổng Hợp</option>
            <option value="Nội">Khoa Nội Tim Mạch</option>
            <option value="Nhi">Khoa Nhi</option>
          </select>
        </div>
      </div>

      {/* Handover Records Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Hồ sơ BA & Bệnh nhân</th>
                <th className="p-3">Khoa điều trị bàn giao</th>
                <th className="p-3">Thời gian xuất viện & Gửi</th>
                <th className="p-3 text-center">Rà soát Checklist (Đủ ĐK)</th>
                <th className="p-3 text-center">Trạng thái tiếp nhận</th>
                <th className="p-3 text-right">Thao tác Tiếp nhận / Trả về</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    <div className="animate-spin inline-block w-6 h-6 border-b-2 border-amber-600 rounded-full mb-2"></div>
                    <p>Đang tải danh sách giao nhận bệnh án...</p>
                  </td>
                </tr>
              ) : handovers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Không tìm thấy hồ sơ nào trong danh sách giao nhận.
                  </td>
                </tr>
              ) : (
                handovers.map(ho => {
                  const statusInfo = HANDOVER_STATUS_LABELS[ho.submissionStatus] || HANDOVER_STATUS_LABELS.draft_in_dept;
                  const isPassed = ho.validationReport?.isEligibleForSubmission;

                  return (
                    <tr key={ho.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      {/* Số HSBA & BN */}
                      <td className="p-3 align-top">
                        <strong className="text-slate-900 dark:text-slate-100 uppercase font-bold block">
                          {ho.patientName}
                        </strong>
                        <span className="font-mono text-sky-700 dark:text-sky-400 font-bold block mt-0.5">
                          {ho.recordNumber}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">Mã BN: {ho.patientId}</span>
                      </td>

                      {/* Khoa phòng */}
                      <td className="p-3 align-top">
                        <strong className="text-slate-800 dark:text-slate-200 block">{ho.departmentName}</strong>
                        <p className="text-[11px] text-slate-500">BS: {ho.primaryDoctorName}</p>
                        {ho.submittedBy && (
                          <p className="text-[10px] text-slate-400 mt-0.5">Người gửi: {ho.submittedBy.fullName}</p>
                        )}
                      </td>

                      {/* Thời gian */}
                      <td className="p-3 align-top font-mono text-[11px] text-slate-500">
                        <p>Ra viện: {ho.dischargeDate}</p>
                        {ho.submittedAt && <p className="text-sky-700 dark:text-sky-400 font-semibold">Gửi lúc: {ho.submittedAt}</p>}
                        {ho.receivedAt && <p className="text-emerald-600 font-semibold">Nhận lúc: {ho.receivedAt}</p>}
                      </td>

                      {/* Checklist Compliance */}
                      <td className="p-3 align-top text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenAuditModal(ho.recordId)}
                          className="inline-block p-1.5 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Nhấn để xem chi tiết bảng rà soát"
                        >
                          <div className="flex items-center justify-center gap-1.5 mb-1">
                            {isPassed ? (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold rounded text-[10px] flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Đạt 100%
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold rounded text-[10px] flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Thiếu {ho.validationReport?.missingItemsCount || 0} mục
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-sky-600 hover:underline block text-center">
                            Xem chi tiết checklist →
                          </span>
                        </button>
                      </td>

                      {/* Trạng thái tiếp nhận */}
                      <td className="p-3 align-top text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusInfo.badgeBg}`}>
                          {statusInfo.label}
                        </span>

                        {ho.rejectionReason && (
                          <div className="mt-1 p-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded text-[10px] text-rose-700 dark:text-rose-300 text-left max-w-[200px]">
                            <strong>Lý do trả:</strong> {ho.rejectionReason}
                          </div>
                        )}

                        {ho.handoverReceiptNumber && (
                          <button
                            type="button"
                            onClick={() => setSelectedHandoverReceipt(ho)}
                            className="mt-1 text-[10px] text-emerald-600 hover:underline font-mono block"
                          >
                            Số BB: {ho.handoverReceiptNumber}
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3 align-top text-right space-x-1.5 whitespace-nowrap">
                        {ho.submissionStatus === 'submitted_to_emr' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleAccept(ho)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-2xs transition-all"
                            >
                              Duyệt nhận vào kho
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(ho)}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg text-xs border border-rose-200 transition-all"
                            >
                              Trả về khoa
                            </button>
                          </>
                        )}

                        {ho.submissionStatus === 'accepted_by_emr' && (
                          <button
                            type="button"
                            onClick={() => setSelectedHandoverReceipt(ho)}
                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold rounded-lg text-xs inline-flex items-center gap-1"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>In biên bản</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => navigate(`/emr/records/${ho.recordId}`)}
                          className="px-2.5 py-1.5 bg-sky-50 dark:bg-sky-950 hover:bg-sky-100 text-sky-700 dark:text-sky-300 font-semibold rounded-lg text-xs inline-flex items-center gap-0.5"
                        >
                          <span>Mở EMR</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compliance Audit Modal */}
      {selectedRecordForAudit && (
        <EMRComplianceCheckerModal
          record={selectedRecordForAudit}
          isOpen={!!selectedRecordForAudit}
          onClose={() => setSelectedRecordForAudit(null)}
          onSubmittedSuccess={() => loadHandovers()}
        />
      )}

      {/* Handover Receipt Modal */}
      {selectedHandoverReceipt && (
        <EMRHandoverReceiptModal
          handover={selectedHandoverReceipt}
          isOpen={!!selectedHandoverReceipt}
          onClose={() => setSelectedHandoverReceipt(null)}
        />
      )}
    </div>
  );
};
