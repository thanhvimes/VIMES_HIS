import React, { useState, useEffect } from 'react';
import { EMRRecord, EMRValidationReport } from '../types';
import { emrService } from '../services/emrService';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  PenTool,
  Send,
  Loader2,
  X,
  Award,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface EMRComplianceCheckerModalProps {
  record: EMRRecord;
  isOpen: boolean;
  onClose: () => void;
  onSubmittedSuccess?: () => void;
}

export const EMRComplianceCheckerModal: React.FC<EMRComplianceCheckerModalProps> = ({
  record,
  isOpen,
  onClose,
  onSubmittedSuccess,
}) => {
  const [report, setReport] = useState<EMRValidationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && record) {
      runComplianceCheck();
    }
  }, [isOpen, record]);

  const runComplianceCheck = async () => {
    setLoading(true);
    try {
      const res = await emrService.validateRecordCompliance(record.id);
      setReport(res);
    } catch (err) {
      toast.error('Lỗi khi rà soát điều kiện hồ sơ bệnh án');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitToEMR = async () => {
    if (!report?.isEligibleForSubmission) {
      toast.error('Hồ sơ chưa đủ điều kiện gửi. Vui lòng bổ sung đầy đủ văn bản và chữ ký số.');
      return;
    }

    setIsSubmitting(true);
    try {
      await emrService.submitRecordToEMR(record.id, {
        userId: 'BS-001',
        fullName: 'BSCKII. Nguyễn Văn An',
        title: 'Bác sĩ điều trị chính',
      });
      toast.success('Đã gửi hồ sơ bệnh án thành công lên Phòng KHTH / Bộ phận tiếp nhận EMR!');
      if (onSubmittedSuccess) onSubmittedSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi gửi hồ sơ');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              report?.isEligibleForSubmission
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                : 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Rà soát Điều kiện Tiếp nhận Bệnh án Điện tử
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Số HSBA: {record.recordNumber} • Bệnh nhân: {record.patient.fullName} ({record.departmentName})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {loading ? (
            <div className="py-12 text-center space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-sky-600 mx-auto" />
              <p className="text-xs text-slate-500">Đang quét toàn diện các mẫu biểu và chứng thư chữ ký số...</p>
            </div>
          ) : report ? (
            <>
              {/* Compliance Summary Card */}
              <div className={`p-4 rounded-xl border ${
                report.isEligibleForSubmission
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200'
                  : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {report.isEligibleForSubmission ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    )}
                    <span className="font-bold text-sm">
                      {report.isEligibleForSubmission 
                        ? 'HỒ SƠ ĐỦ ĐIỀU KIỆN GỬI LƯU TRỮ EMR' 
                        : 'HỒ SƠ CHƯA ĐỦ ĐIỀU KIỆN GỬI'}
                    </span>
                  </div>

                  <span className="text-sm font-black font-mono">
                    {report.completionPercentage}% Đạt
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      report.isEligibleForSubmission ? 'bg-emerald-600' : 'bg-amber-500'
                    }`}
                    style={{ width: `${report.completionPercentage}%` }}
                  />
                </div>

                <p className="text-xs mt-2 opacity-90">
                  {report.isEligibleForSubmission
                    ? 'Tất cả biểu mẫu bắt buộc và chữ ký số của Bác sĩ / Trưởng khoa đã được xác thực hợp lệ theo Thông tư 46/2018/TT-BYT.'
                    : `Hồ sơ còn thiếu ${report.missingItemsCount} văn bản bắt buộc và ${report.missingSignaturesCount} chữ ký số. Vui lòng hoàn tất trước khi bàn giao cho Phòng KHTH.`}
                </p>
              </div>

              {/* Detailed Checklist Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Bảng Rà soát Danh mục Biểu mẫu & Chữ ký số (Checklist)
                </h4>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100/70 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-2.5">Mã & Tên văn bản</th>
                        <th className="p-2.5 text-center">Bắt buộc</th>
                        <th className="p-2.5 text-center">Tình trạng văn bản</th>
                        <th className="p-2.5 text-center">Chữ ký số (CA)</th>
                        <th className="p-2.5">Đánh giá</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {report.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-2.5">
                            <strong className="text-slate-800 dark:text-slate-200 block">{item.name}</strong>
                            <span className="font-mono text-[10px] text-slate-400">Mã biểu: {item.code}</span>
                          </td>

                          <td className="p-2.5 text-center">
                            {item.isRequired ? (
                              <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold rounded text-[10px]">
                                Bắt buộc
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">Tùy chọn</span>
                            )}
                          </td>

                          <td className="p-2.5 text-center">
                            {item.isAvailable ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Đã lập
                              </span>
                            ) : (
                              <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center justify-center gap-1">
                                <XCircle className="w-3.5 h-3.5" /> Chưa có
                              </span>
                            )}
                          </td>

                          <td className="p-2.5 text-center">
                            {item.isSigned ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-center gap-1" title={item.signerName}>
                                <Award className="w-3.5 h-3.5" /> Đã ký
                              </span>
                            ) : (
                              <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center justify-center gap-1">
                                <PenTool className="w-3.5 h-3.5" /> Chưa ký
                              </span>
                            )}
                          </td>

                          <td className="p-2.5">
                            {item.status === 'passed' ? (
                              <span className="text-emerald-600 font-medium">✓ Đạt yêu cầu</span>
                            ) : (
                              <span className="text-rose-600 font-medium">⚠️ {item.notes}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            {report?.isEligibleForSubmission ? 'Sẵn sàng bàn giao cho Phòng KHTH' : 'Cần bổ sung các mục chưa đạt trước khi gửi'}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Đóng
            </button>

            <button
              type="button"
              disabled={!report?.isEligibleForSubmission || isSubmitting}
              onClick={handleSubmitToEMR}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-sm transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang gửi hồ sơ...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Gửi Hồ Sơ Lên Phòng KHTH</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
