import React, { useState, useEffect } from 'react';
import { EMRExtractionCopy, EMRRecord } from '../types';
import { emrService } from '../services/emrService';
import { COPY_PURPOSE_LABELS, COPY_DOC_TYPE_LABELS } from '../constants';
import {
  FileCheck,
  QrCode,
  Printer,
  ShieldCheck,
  Plus,
  Search,
  Download,
  ExternalLink,
  Eye,
  X,
  User,
  Calendar,
  Building2,
  Award,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export const EMRExtractionCopiesView: React.FC = () => {
  const [copies, setCopies] = useState<EMRExtractionCopy[]>([]);
  const [records, setRecords] = useState<EMRRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState('all');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCopyForPreview, setSelectedCopyForPreview] = useState<EMRExtractionCopy | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    recordId: '',
    requesterName: '',
    requesterRelationship: 'Người bệnh trực tiếp',
    requesterIdCard: '',
    requesterPhone: '',
    purpose: 'insurance_claim' as EMRExtractionCopy['purpose'],
    purposeDescription: '',
    documentType: 'discharge_summary' as EMRExtractionCopy['documentType'],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cpList, recList] = await Promise.all([
        emrService.getExtractionCopies(),
        emrService.getRecords(),
      ]);
      setCopies(cpList);
      setRecords(recList);
      if (recList.length > 0 && !formData.recordId) {
        setFormData(prev => ({
          ...prev,
          recordId: recList[0].id,
          requesterName: recList[0].patient.fullName,
          requesterIdCard: recList[0].patient.nationalId || '001089012345',
          requesterPhone: recList[0].patient.phone || '0912 345 678',
        }));
      }
    } catch (err) {
      toast.error('Lỗi khi tải danh sách bản sao trích xuất');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordChange = (recId: string) => {
    const rec = records.find(r => r.id === recId);
    if (rec) {
      setFormData(prev => ({
        ...prev,
        recordId: recId,
        requesterName: rec.patient.fullName,
        requesterIdCard: rec.patient.nationalId || '',
        requesterPhone: rec.patient.phone || '',
      }));
    }
  };

  const handleCreateCopy = async (e: React.FormEvent) => {
    e.preventDefault();
    const rec = records.find(r => r.id === formData.recordId);
    if (!rec) return;

    try {
      const newCopy = await emrService.issueExtractionCopy({
        recordId: rec.id,
        recordNumber: rec.recordNumber,
        patientName: rec.patient.fullName,
        patientId: rec.patient.patientId,
        patientDob: rec.patient.dob,
        requesterName: formData.requesterName,
        requesterRelationship: formData.requesterRelationship,
        requesterIdCard: formData.requesterIdCard,
        requesterPhone: formData.requesterPhone,
        purpose: formData.purpose,
        purposeDescription: formData.purposeDescription,
        documentType: formData.documentType,
        documentName: COPY_DOC_TYPE_LABELS[formData.documentType],
        issuedByName: 'ThS.BS. Đỗ Quang Huy (Phòng KHTH)',
        signedByDirector: {
          signatureId: `SIG-DIR-${Date.now()}`,
          signerId: 'DIR-01',
          signerName: 'PGS.TS. Trần Quốc Hưng',
          signerTitle: 'Phó Giám Đốc Bệnh Viện',
          signerRole: 'director',
          signedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          certificateSerialNumber: '8892-BYT-GDBV-VNPT',
          certificateIssuer: 'Ban Cơ Yếu Chính Phủ / VNPT-CA',
          hashAlgorithm: 'SHA-256',
          isTimestamped: true,
          isValid: true,
        },
      });

      toast.success(`Đã cấp bản sao số ${newCopy.copyNumber} thành công kèm mã QR xác thực!`);
      setIsCreateModalOpen(false);
      loadData();
      setSelectedCopyForPreview(newCopy);
    } catch (err) {
      toast.error('Lỗi khi cấp bản sao');
    }
  };

  const filteredCopies = copies.filter(c => {
    if (docTypeFilter !== 'all' && c.documentType !== docTypeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.copyNumber.toLowerCase().includes(q) ||
        c.patientName.toLowerCase().includes(q) ||
        c.recordNumber.toLowerCase().includes(q) ||
        c.requesterName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4 pb-12">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-xl">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Trích sao & Cấp Bản sao Bệnh án Điện tử (EMR Copy Issuance)
            </h1>
            <p className="text-xs text-slate-500">
              Cấp trích sao tóm tắt BA, giấy chứng nhận phẫu thuật/thương tích có chữ ký số Ban Giám đốc và Mã QR xác thực theo Điều 11 TT46.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Cấp Bản sao Mới</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo Số bản sao, Mã HSBA, Tên người bệnh, Người yêu cầu..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={docTypeFilter}
            onChange={e => setDocTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          >
            <option value="all">Tất cả loại văn bản bản sao</option>
            <option value="discharge_summary">Trích tóm tắt hồ sơ BA</option>
            <option value="surgery_certificate">Giấy chứng nhận PTTT</option>
            <option value="injury_certificate">Giấy chứng nhận thương tích</option>
            <option value="birth_certificate">Giấy chứng sinh</option>
            <option value="death_certificate">Giấy báo tử</option>
          </select>
        </div>
      </div>

      {/* Copies Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Số bản sao & Hồ sơ BA</th>
                <th className="p-3">Loại văn bản cấp</th>
                <th className="p-3">Người nhận & Mục đích</th>
                <th className="p-3">Thời gian cấp & Cán bộ cấp</th>
                <th className="p-3 text-center">Xác thực QR & Ký số</th>
                <th className="p-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
                    <p>Đang tải danh sách bản sao điện tử...</p>
                  </td>
                </tr>
              ) : filteredCopies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Chưa có bản sao nào được cấp.
                  </td>
                </tr>
              ) : (
                filteredCopies.map(cp => (
                  <tr key={cp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3 align-top font-mono">
                      <span className="font-bold text-purple-700 dark:text-purple-400 block">{cp.copyNumber}</span>
                      <strong className="text-slate-900 dark:text-slate-100 font-sans block mt-0.5">{cp.patientName}</strong>
                      <span className="text-[11px] text-sky-700 dark:text-sky-400">HSBA: {cp.recordNumber}</span>
                    </td>

                    <td className="p-3 align-top">
                      <strong className="text-slate-800 dark:text-slate-200 block">{cp.documentName}</strong>
                      <span className="text-[10px] text-slate-500 font-mono">Mã xác thực: {cp.verificationToken}</span>
                    </td>

                    <td className="p-3 align-top">
                      <p className="font-medium text-slate-800 dark:text-slate-200">{cp.requesterName}</p>
                      <p className="text-[11px] text-slate-500">{COPY_PURPOSE_LABELS[cp.purpose]}</p>
                      <span className="text-[10px] text-slate-400 font-mono">CCCD: {cp.requesterIdCard}</span>
                    </td>

                    <td className="p-3 align-top font-mono text-[11px] text-slate-500">
                      <p>Ngày cấp: {cp.issuedAt}</p>
                      <p className="text-slate-700 dark:text-slate-300 font-sans mt-0.5">{cp.issuedByName}</p>
                    </td>

                    <td className="p-3 align-top text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                        <Award className="w-3 h-3" /> Đã ký CA Giám Đốc
                      </span>
                      <span className="block text-[10px] text-purple-600 font-mono mt-0.5">Mã QR Hợp lệ</span>
                    </td>

                    <td className="p-3 align-top text-right space-x-1.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedCopyForPreview(cp)}
                        className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950 hover:bg-purple-100 text-purple-700 dark:text-purple-300 font-semibold rounded-lg text-xs inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem & In Bản sao</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cấp Bản Sao Mới */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Cấp Bản Sao Hồ Sơ Bệnh Án Điện Tử (Kèm Mã QR)
                </h3>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCopy} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Chọn Hồ sơ Bệnh án nguồn <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.recordId}
                  onChange={e => handleRecordChange(e.target.value)}
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
                  Loại văn bản trích sao / Giấy tờ điện tử <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.documentType}
                  onChange={e => setFormData({ ...formData, documentType: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {Object.entries(COPY_DOC_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Người nhận bản sao <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.requesterName}
                    onChange={e => setFormData({ ...formData, requesterName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Mối quan hệ
                  </label>
                  <input
                    type="text"
                    value={formData.requesterRelationship}
                    onChange={e => setFormData({ ...formData, requesterRelationship: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Số CCCD / Hộ chiếu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.requesterIdCard}
                    onChange={e => setFormData({ ...formData, requesterIdCard: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={formData.requesterPhone}
                    onChange={e => setFormData({ ...formData, requesterPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Mục đích sử dụng bản sao
                </label>
                <select
                  value={formData.purpose}
                  onChange={e => setFormData({ ...formData, purpose: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {Object.entries(COPY_PURPOSE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Ghi chú mục đích
                </label>
                <input
                  type="text"
                  value={formData.purposeDescription}
                  onChange={e => setFormData({ ...formData, purposeDescription: e.target.value })}
                  placeholder="Ví dụ: Nộp bảo hiểm Bảo Việt giải quyết quyền lợi viện phí..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
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
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl"
                >
                  Cấp Bản Sao & Ký Số
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xem & In Bản Sao Điện Tử */}
      {selectedCopyForPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Bản Sao Bệnh Án Điện Tử Đã Ký Số (Mã: {selectedCopyForPreview.copyNumber})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold rounded-lg"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>In bản sao</span>
                </button>
                <button onClick={() => setSelectedCopyForPreview(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Canvas */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900">
              <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                <div>
                  <p className="font-bold text-slate-500 uppercase">SỞ Y TẾ TP HÀ NỘI</p>
                  <p className="font-extrabold text-sm text-sky-700 dark:text-sky-400">BỆNH VIỆN ĐA KHOA QUỐC TẾ vClinic</p>
                  <p className="text-[11px] text-slate-500">Phòng Kế hoạch Tổng hợp</p>
                </div>
                <div className="text-right font-mono">
                  <p className="font-bold text-purple-700 dark:text-purple-400">Số bản sao: {selectedCopyForPreview.copyNumber}</p>
                  <p className="text-[10px] text-slate-400">Mã HSBA: {selectedCopyForPreview.recordNumber}</p>
                  <p className="text-[10px] text-slate-400">Ngày cấp: {selectedCopyForPreview.issuedAt}</p>
                </div>
              </div>

              <div className="text-center space-y-1">
                <h2 className="text-base sm:text-lg font-black uppercase text-slate-900 dark:text-slate-50">
                  {selectedCopyForPreview.documentName}
                </h2>
                <p className="text-[11px] text-purple-600 font-bold uppercase tracking-wider">
                  [BẢN SAO SỐ HÓA CÓ GIÁ TRỊ PHÁP LÝ TƯƠNG ĐƯƠNG BẢN GỐC]
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-slate-500">Họ và tên người bệnh:</span> <strong className="uppercase">{selectedCopyForPreview.patientName}</strong></div>
                  <div><span className="text-slate-500">Mã người bệnh:</span> <strong className="font-mono">{selectedCopyForPreview.patientId}</strong></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-slate-500">Người nhận bản sao:</span> <strong>{selectedCopyForPreview.requesterName}</strong></div>
                  <div><span className="text-slate-500">Số CCCD người nhận:</span> <strong className="font-mono">{selectedCopyForPreview.requesterIdCard}</strong></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-slate-500">Mục đích cấp:</span> {COPY_PURPOSE_LABELS[selectedCopyForPreview.purpose]}</div>
                  <div><span className="text-slate-500">Cán bộ cấp phát:</span> {selectedCopyForPreview.issuedByName}</div>
                </div>
              </div>

              {/* QR Code and Digital Seal Box */}
              <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-purple-800 dark:text-purple-300 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>Xác thực Điện tử Công cộng (Public QR Verification)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Quét mã QR để kiểm tra tính toàn vẹn bản sao trên Cổng Tiếp nhận EMR Quốc gia.
                  </p>
                  <p className="text-[10px] font-mono text-slate-400">
                    URL: {selectedCopyForPreview.qrCodeVerificationUrl}
                  </p>
                  <p className="text-[10px] font-mono text-slate-400">
                    Mã Token: {selectedCopyForPreview.verificationToken}
                  </p>
                </div>

                <div className="w-20 h-20 bg-white p-1 rounded-lg border border-purple-300 shadow-sm flex items-center justify-center shrink-0">
                  <QrCode className="w-16 h-16 text-slate-900" />
                </div>
              </div>

              {/* Footer Signatures */}
              <div className="pt-4 grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <p className="font-bold text-slate-700 dark:text-slate-300">NGƯỜI NHẬN BẢN SAO</p>
                  <p className="text-[10px] text-slate-400 italic mb-10">(Ký và ghi rõ họ tên)</p>
                  <p className="font-bold text-slate-900 dark:text-slate-100">{selectedCopyForPreview.requesterName}</p>
                </div>

                <div>
                  <p className="font-bold text-slate-700 dark:text-slate-300">TM. BAN GIÁM ĐỐC BỆNH VIỆN</p>
                  <p className="text-[10px] text-purple-600 font-bold mb-2">ĐÃ KÝ SỐ ĐIỆN TỬ (CA/TSA)</p>
                  <div className="p-2 border border-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-lg inline-block text-left text-[10px] mb-2 font-mono">
                    <p className="text-emerald-800 dark:text-emerald-300 font-bold">✓ KÝ BỞI: {selectedCopyForPreview.signedByDirector.signerName}</p>
                    <p className="text-slate-500">Chức vụ: {selectedCopyForPreview.signedByDirector.signerTitle}</p>
                    <p className="text-slate-500">Thời gian: {selectedCopyForPreview.signedByDirector.signedAt}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
