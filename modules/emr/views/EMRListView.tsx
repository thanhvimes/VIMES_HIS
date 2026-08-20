import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EMRRecord } from '../types';
import { emrService } from '../services/emrService';
import { EMR_STATUS_LABELS, SIGNATURE_STATUS_LABELS, HANDOVER_STATUS_LABELS } from '../constants';
import { EMRExportModal } from '../components/EMRExportModal';
import { EMRComplianceCheckerModal } from '../components/EMRComplianceCheckerModal';
import {
  Search,
  Filter,
  FileText,
  User,
  ShieldCheck,
  Calendar,
  Building2,
  Lock,
  Unlock,
  Share2,
  ExternalLink,
  ChevronRight,
  Download,
  AlertCircle,
  Clock,
  Send
} from 'lucide-react';
import { toast } from 'sonner';

export const EMRListView: React.FC = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<EMRRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [recordTypeFilter, setRecordTypeFilter] = useState('all');
  const [signatureStatusFilter, setSignatureStatusFilter] = useState('all');
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState('all');

  // Modals State
  const [exportRecord, setExportRecord] = useState<EMRRecord | null>(null);
  const [complianceRecord, setComplianceRecord] = useState<EMRRecord | null>(null);

  useEffect(() => {
    loadRecords();
  }, [search, statusFilter, specialtyFilter, recordTypeFilter, signatureStatusFilter, submissionStatusFilter]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await emrService.getRecords({
        search,
        status: statusFilter,
        specialty: specialtyFilter,
        recordType: recordTypeFilter,
        signatureStatus: signatureStatusFilter,
        submissionStatus: submissionStatusFilter,
      });
      setRecords(data);
    } catch (err) {
      toast.error('Lỗi khi tải danh sách bệnh án');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Quản lý Hồ sơ Bệnh án Điện tử (EMR)
          </h1>
          <p className="text-xs text-slate-500">
            Tra cứu, kiểm tra tình trạng ký số, mở không gian làm việc EMR và lưu trữ hồ sơ theo Luật KCB.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/emr/signatures')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Ký số hàng loạt</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo Mã HSBA, Mã BN, Họ tên, CCCD, Chẩn đoán..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">Tất cả trạng thái hồ sơ</option>
              <option value="active">Đang điều trị</option>
              <option value="closed">Chờ ký số / Phê duyệt</option>
              <option value="signed">Đã ký số hoàn tất</option>
              <option value="archived">Đã lưu trữ số hóa</option>
            </select>
          </div>

          {/* Submission / Handover Filter */}
          <div>
            <select
              value={submissionStatusFilter}
              onChange={e => setSubmissionStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">Tất cả TT Giao nhận</option>
              <option value="draft_in_dept">Đang lập tại khoa</option>
              <option value="submitted_to_emr">Chờ KHTH duyệt nhận</option>
              <option value="accepted_by_emr">Đã duyệt vào Kho EMR</option>
              <option value="rejected_by_emr">Bị trả về bổ sung</option>
            </select>
          </div>

          {/* Specialty Filter */}
          <div>
            <select
              value={specialtyFilter}
              onChange={e => setSpecialtyFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">Tất cả chuyên khoa</option>
              <option value="Nội">Khối Nội khoa</option>
              <option value="Ngoại">Khối Ngoại khoa</option>
              <option value="Nhi">Khoa Nhi</option>
              <option value="Sản">Khoa Sản Phụ khoa</option>
            </select>
          </div>

          {/* Signature Status Filter */}
          <div>
            <select
              value={signatureStatusFilter}
              onChange={e => setSignatureStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">Tất cả tình trạng ký số</option>
              <option value="fully_signed">Đã ký số đầy đủ</option>
              <option value="partially_signed">Đang ký (Thiếu chữ ký)</option>
              <option value="unsigned">Chưa ký số</option>
            </select>
          </div>
        </div>
      </div>

      {/* Record List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Tìm thấy {records.length} hồ sơ bệnh án
          </span>
          <span className="text-[11px] text-slate-500">
            Định dạng theo chuẩn Thông tư 46/2018/TT-BYT
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Mã HSBA / Loại</th>
                <th className="p-3">Bệnh nhân & Định danh</th>
                <th className="p-3">Khoa phòng & Bác sĩ</th>
                <th className="p-3">Chẩn đoán chính (ICD-10)</th>
                <th className="p-3">Thời gian điều trị</th>
                <th className="p-3 text-center">Trạng thái BA</th>
                <th className="p-3 text-center">Ký số (CA/HSM)</th>
                <th className="p-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    <div className="animate-spin inline-block w-6 h-6 border-b-2 border-sky-600 rounded-full mb-2"></div>
                    <p>Đang tải dữ liệu hồ sơ bệnh án...</p>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Không tìm thấy hồ sơ bệnh án phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                records.map(record => {
                  const statusInfo = EMR_STATUS_LABELS[record.status] || EMR_STATUS_LABELS.active;
                  const sigInfo = SIGNATURE_STATUS_LABELS[record.signatureStatus] || SIGNATURE_STATUS_LABELS.unsigned;

                  return (
                    <tr
                      key={record.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Số HSBA */}
                      <td className="p-3 align-top">
                        <span className="font-bold font-mono text-sky-700 dark:text-sky-400 block">
                          {record.recordNumber}
                        </span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-[10px] uppercase font-semibold">
                            {record.recordType === 'inpatient' ? 'Nội trú' : 'Ngoại trú'}
                          </span>
                          {record.isLocked && (
                            <span title="Đã khóa hồ sơ (Read-only)">
                              <Lock className="w-3 h-3 text-amber-500" />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Thông tin bệnh nhân */}
                      <td className="p-3 align-top">
                        <strong className="text-slate-900 dark:text-slate-100 uppercase block font-bold">
                          {record.patient.fullName}
                        </strong>
                        <div className="text-[11px] text-slate-500 space-y-0.5 mt-0.5">
                          <p>Mã BN: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{record.patient.patientId}</span> • {record.patient.dob.substring(0, 4)} ({record.patient.gender === 'male' ? 'Nam' : 'Nữ'})</p>
                          {record.patient.insuranceCardNumber && (
                            <p className="text-sky-700 dark:text-sky-400 font-mono text-[10px]">BHYT: {record.patient.insuranceCardNumber}</p>
                          )}
                        </div>
                      </td>

                      {/* Khoa phòng & Bác sĩ */}
                      <td className="p-3 align-top">
                        <span className="font-medium text-slate-800 dark:text-slate-200 block">
                          {record.departmentName}
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          BS: <span className="font-medium text-slate-700 dark:text-slate-300">{record.primaryDoctorName}</span>
                        </p>
                        {record.roomNumber && (
                          <p className="text-[10px] text-slate-400">{record.roomNumber} - {record.bedNumber}</p>
                        )}
                      </td>

                      {/* Chẩn đoán */}
                      <td className="p-3 align-top max-w-[200px]">
                        {record.initialDiagnosis ? (
                          <div>
                            <span className="font-mono font-bold text-sky-700 dark:text-sky-400 text-[11px] block">
                              [{record.initialDiagnosis.icd10}]
                            </span>
                            <p className="text-slate-700 dark:text-slate-300 truncate" title={record.initialDiagnosis.diseaseName}>
                              {record.initialDiagnosis.diseaseName}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Chưa chẩn đoán</span>
                        )}
                      </td>

                      {/* Thời gian */}
                      <td className="p-3 align-top text-[11px] text-slate-500 font-mono">
                        <p>Vào: {record.admissionDate}</p>
                        {record.dischargeDate && <p>Ra: {record.dischargeDate}</p>}
                      </td>

                      {/* Trạng thái BA */}
                      <td className="p-3 align-top text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusInfo.badgeBg}`}>
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Tình trạng ký số */}
                      <td className="p-3 align-top text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold border ${sigInfo.badgeBg}`}>
                          {sigInfo.label}
                        </span>
                      </td>

                      {/* Thao tác */}
                      <td className="p-3 align-top text-right space-x-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setComplianceRecord(record)}
                          title="Rà soát điều kiện tiếp nhận & Gửi Lưu trữ EMR"
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg transition-colors inline-block"
                        >
                          <Send className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setExportRecord(record)}
                          title="Xuất XML liên thông / HL7 CDA"
                          className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 rounded-lg transition-colors inline-block"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => navigate(`/emr/records/${record.id}`)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 text-sky-700 dark:text-sky-300 font-semibold rounded-lg transition-colors"
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

      {/* Export Modal */}
      {exportRecord && (
        <EMRExportModal
          record={exportRecord}
          isOpen={!!exportRecord}
          onClose={() => setExportRecord(null)}
        />
      )}

      {/* Compliance Checker Modal */}
      {complianceRecord && (
        <EMRComplianceCheckerModal
          record={complianceRecord}
          isOpen={!!complianceRecord}
          onClose={() => setComplianceRecord(null)}
          onSubmittedSuccess={() => loadRecords()}
        />
      )}
    </div>
  );
};
