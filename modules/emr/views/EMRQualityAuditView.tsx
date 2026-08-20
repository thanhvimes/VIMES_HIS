import React, { useState, useEffect } from 'react';
import { EMRQualityAudit, EMRRecord } from '../types';
import { emrService } from '../services/emrService';
import { QUALITY_GRADE_LABELS } from '../constants';
import {
  Star,
  Award,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Search,
  Plus,
  BarChart3,
  X,
  TrendingUp,
  Building2,
  Calendar,
  Eye,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export const EMRQualityAuditView: React.FC = () => {
  const [audits, setAudits] = useState<EMRQualityAudit[]>([]);
  const [records, setRecords] = useState<EMRRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAuditForDetail, setSelectedAuditForDetail] = useState<EMRQualityAudit | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    recordId: '',
    auditorName: 'ThS.BS. Đỗ Quang Huy',
    auditorTitle: 'Chuyên viên Giám định KHTH',
    c1Score: 20,
    c2Score: 25,
    c3Score: 28,
    c4Score: 22,
    deficiencies: '',
    recommendations: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [qaList, recList] = await Promise.all([
        emrService.getQualityAudits(),
        emrService.getRecords(),
      ]);
      setAudits(qaList);
      setRecords(recList);
      if (recList.length > 0 && !formData.recordId) {
        setFormData(prev => ({ ...prev, recordId: recList[0].id }));
      }
    } catch (err) {
      toast.error('Lỗi khi tải dữ liệu giám định bệnh án');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rec = records.find(r => r.id === formData.recordId);
    if (!rec) return;

    try {
      const newAudit = await emrService.createQualityAudit({
        recordId: rec.id,
        recordNumber: rec.recordNumber,
        patientName: rec.patient.fullName,
        departmentName: rec.departmentName,
        specialty: rec.specialty,
        auditorName: formData.auditorName,
        auditorTitle: formData.auditorTitle,
        maxScore: 100,
        criteria: [
          { id: 'c-1', category: 'I. Hành chính & Tiền sử', name: 'Đầy đủ thông tin định danh, CCCD, BHYT, Thân nhân, Dị ứng', maxScore: 20, score: formData.c1Score, isPassed: formData.c1Score >= 16 },
          { id: 'c-2', category: 'II. Khám & Chẩn đoán ICD-10', name: 'Mô tả diễn biến bệnh, chẩn đoán trước/sau điều trị chuẩn ICD-10', maxScore: 25, score: formData.c2Score, isPassed: formData.c2Score >= 20 },
          { id: 'c-3', category: 'III. Phẫu thuật & Điều trị', name: 'Tờ điều trị, phiếu chăm sóc, y lệnh thuốc/kháng sinh hợp lý', maxScore: 30, score: formData.c3Score, isPassed: formData.c3Score >= 24 },
          { id: 'c-4', category: 'IV. Quy chế Ký số & Thời hạn', name: 'Ký số đầy đủ chức danh, đóng khóa hồ sơ đúng hạn 24h', maxScore: 25, score: formData.c4Score, isPassed: formData.c4Score >= 20 },
        ],
        deficiencies: formData.deficiencies ? [formData.deficiencies] : [],
        recommendations: formData.recommendations || 'Tiếp tục duy trì chất lượng ghi chép hồ sơ bệnh án.',
        isFeedbackSentToDept: true,
      });

      toast.success(`Đã chấm điểm thành công cho hồ sơ ${rec.recordNumber}: ${newAudit.totalScore}/100 (${newAudit.scorePercentage}%)!`);
      setIsCreateModalOpen(false);
      loadData();
    } catch (err) {
      toast.error('Lỗi khi chấm điểm bệnh án');
    }
  };

  const filteredAudits = audits.filter(a => {
    if (gradeFilter !== 'all' && a.grade !== gradeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        a.recordNumber.toLowerCase().includes(q) ||
        a.patientName.toLowerCase().includes(q) ||
        a.departmentName.toLowerCase().includes(q) ||
        a.auditorName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const excellentCount = audits.filter(a => a.grade === 'excellent').length;
  const goodCount = audits.filter(a => a.grade === 'good').length;
  const poorCount = audits.filter(a => a.grade === 'poor').length;
  const avgScore = audits.length > 0 ? Math.round(audits.reduce((acc, a) => acc + a.scorePercentage, 0) / audits.length) : 0;

  return (
    <div className="space-y-4 pb-12">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Star className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Giám định & Đánh giá Chất lượng Bệnh án (EMR QA-QC)
            </h1>
            <p className="text-xs text-slate-500">
              Chấm điểm chất lượng hồ sơ theo Bộ tiêu chí QĐ 6858/QĐ-BYT và Thông tư 54/2017/TT-BYT.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Chấm Điểm Hồ Sơ Mới</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Điểm Trung bình Toàn viện</span>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-200">{avgScore}%</div>
            <p className="text-[10px] text-emerald-600">Đạt chuẩn Mức 6 - TT54</p>
          </div>
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">Hồ sơ Xuất sắc (&gt;= 90%)</span>
            <div className="text-2xl font-black text-blue-700 dark:text-blue-200">{excellentCount}</div>
            <p className="text-[10px] text-blue-600">Chuẩn hóa 100% tiêu chí</p>
          </div>
          <div className="p-3 bg-blue-100 dark:bg-blue-900/60 text-blue-700 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">Hồ sơ Loại Tốt (80 - 89%)</span>
            <div className="text-2xl font-black text-amber-700 dark:text-amber-200">{goodCount}</div>
            <p className="text-[10px] text-amber-600">Sai sót nhỏ không trọng yếu</p>
          </div>
          <div className="p-3 bg-amber-100 dark:bg-amber-900/60 text-amber-700 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-rose-800 dark:text-rose-300">Hồ sơ Sai sót (&lt; 65%)</span>
            <div className="text-2xl font-black text-rose-700 dark:text-rose-200">{poorCount}</div>
            <p className="text-[10px] text-rose-600">Thiếu chữ ký hoặc biểu mẫu</p>
          </div>
          <div className="p-3 bg-rose-100 dark:bg-rose-900/60 text-rose-700 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
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
            placeholder="Tìm theo Mã HSBA, Tên người bệnh, Khoa phòng, Cán bộ chấm..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={gradeFilter}
            onChange={e => setGradeFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          >
            <option value="all">Tất cả xếp loại chất lượng</option>
            <option value="excellent">Xuất sắc (&gt;= 90%)</option>
            <option value="good">Tốt (80% - 89%)</option>
            <option value="average">Trung bình (65% - 79%)</option>
            <option value="poor">Kém / Sai sót (&lt; 65%)</option>
          </select>
        </div>
      </div>

      {/* Audits Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Hồ sơ BA & Bệnh nhân</th>
                <th className="p-3">Khoa phòng điều trị</th>
                <th className="p-3">Cán bộ giám định & Ngày</th>
                <th className="p-3 text-center">Điểm số</th>
                <th className="p-3 text-center">Xếp loại</th>
                <th className="p-3">Sai sót & Khuyến nghị</th>
                <th className="p-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                    <p>Đang tải dữ liệu chấm điểm chất lượng...</p>
                  </td>
                </tr>
              ) : filteredAudits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Không có phiếu chấm điểm nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredAudits.map(audit => {
                  const gradeInfo = QUALITY_GRADE_LABELS[audit.grade] || QUALITY_GRADE_LABELS.average;

                  return (
                    <tr key={audit.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3 align-top">
                        <strong className="text-slate-900 dark:text-slate-100 uppercase block">{audit.patientName}</strong>
                        <span className="font-mono text-sky-700 dark:text-sky-400 font-bold block mt-0.5">{audit.recordNumber}</span>
                      </td>

                      <td className="p-3 align-top">
                        <strong className="text-slate-800 dark:text-slate-200 block">{audit.departmentName}</strong>
                        <span className="text-[11px] text-slate-500">{audit.specialty}</span>
                      </td>

                      <td className="p-3 align-top">
                        <p className="font-medium text-slate-800 dark:text-slate-200">{audit.auditorName}</p>
                        <span className="text-[10px] text-slate-400 font-mono">Ngày chấm: {audit.auditedAt}</span>
                      </td>

                      <td className="p-3 align-top text-center font-mono">
                        <span className="text-sm font-black text-slate-900 dark:text-slate-100">{audit.totalScore}/100</span>
                        <div className="w-16 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              audit.scorePercentage >= 85 ? 'bg-emerald-500' : audit.scorePercentage >= 65 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${audit.scorePercentage}%` }}
                          />
                        </div>
                      </td>

                      <td className="p-3 align-top text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${gradeInfo.badgeBg}`}>
                          {gradeInfo.label}
                        </span>
                      </td>

                      <td className="p-3 align-top max-w-xs text-[11px]">
                        {audit.deficiencies.length > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400 block font-medium">⚠️ {audit.deficiencies[0]}</span>
                        ) : (
                          <span className="text-emerald-600 block font-medium">✓ Đạt chuẩn tất cả tiêu chí</span>
                        )}
                        <p className="text-slate-500 text-[10px] truncate mt-0.5">{audit.recommendations}</p>
                      </td>

                      <td className="p-3 align-top text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedAuditForDetail(audit)}
                          className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-semibold rounded-lg text-xs inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Chi tiết phiếu</span>
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

      {/* Modal Chấm Điểm Mới */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Lập Phiếu Giám Định & Chấm Điểm Hồ Sơ Bệnh Án
                </h3>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAudit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Chọn Hồ sơ Bệnh án giám định <span className="text-rose-500">*</span>
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

              {/* Chấm 4 tiêu chí */}
              <div className="space-y-2.5 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold uppercase text-[11px] text-slate-700 dark:text-slate-300">
                  Chấm Điểm Theo 4 Nhóm Tiêu Chí (Tổng 100đ):
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">
                      1. Hành chính & Tiền sử (Tối đa 20đ):
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={formData.c1Score}
                      onChange={e => setFormData({ ...formData, c1Score: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">
                      2. Khám & Chẩn đoán ICD-10 (Tối đa 25đ):
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={25}
                      value={formData.c2Score}
                      onChange={e => setFormData({ ...formData, c2Score: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">
                      3. Điều trị & Kháng sinh (Tối đa 30đ):
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={formData.c3Score}
                      onChange={e => setFormData({ ...formData, c3Score: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">
                      4. Ký số CA & Hạn 24h (Tối đa 25đ):
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={25}
                      value={formData.c4Score}
                      onChange={e => setFormData({ ...formData, c4Score: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2 text-right font-black text-sm text-emerald-700 dark:text-emerald-400">
                  Tổng điểm: {formData.c1Score + formData.c2Score + formData.c3Score + formData.c4Score} / 100
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Ghi nhận sai sót / vi phạm (nếu có)
                </label>
                <input
                  type="text"
                  value={formData.deficiencies}
                  onChange={e => setFormData({ ...formData, deficiencies: e.target.value })}
                  placeholder="Ví dụ: Chậm ký số đóng bệnh án 6 giờ so với quy định..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Khuyến nghị & Yêu cầu cải tiến
                </label>
                <textarea
                  rows={2}
                  value={formData.recommendations}
                  onChange={e => setFormData({ ...formData, recommendations: e.target.value })}
                  placeholder="Ví dụ: Nhắc nhở khoa lâm sàng hoàn thiện chữ ký đúng hạn quy định Thông tư 46..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
                >
                  Lưu & Xếp Loại Bệnh Án
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chi Tiết Phiếu Chấm Điểm */}
      {selectedAuditForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Chi Tiết Phiếu Giám Định Chất Lượng Bệnh Án
                </h3>
              </div>
              <button onClick={() => setSelectedAuditForDetail(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-800 dark:text-slate-100">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                <p><strong>Người bệnh:</strong> {selectedAuditForDetail.patientName} • Số HSBA: <strong className="font-mono text-sky-700">{selectedAuditForDetail.recordNumber}</strong></p>
                <p><strong>Khoa điều trị:</strong> {selectedAuditForDetail.departmentName} ({selectedAuditForDetail.specialty})</p>
                <p><strong>Cán bộ giám định:</strong> {selectedAuditForDetail.auditorName} • Ngày: {selectedAuditForDetail.auditedAt}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold uppercase text-[11px] text-slate-600 dark:text-slate-400">
                  Bảng Điểm Từng Tiêu Chí:
                </h4>
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 font-semibold">
                      <tr>
                        <th className="p-2">Nhóm tiêu chí</th>
                        <th className="p-2 text-center">Điểm đạt</th>
                        <th className="p-2 text-center">Đánh giá</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {selectedAuditForDetail.criteria.map(c => (
                        <tr key={c.id}>
                          <td className="p-2 font-medium">{c.name}</td>
                          <td className="p-2 text-center font-bold font-mono">{c.score}/{c.maxScore}</td>
                          <td className="p-2 text-center">
                            {c.isPassed ? (
                              <span className="text-emerald-600 font-semibold">✓ Đạt</span>
                            ) : (
                              <span className="text-rose-600 font-semibold">✗ Chưa đạt</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Tổng điểm & Xếp loại:</span>
                  <strong className="block text-emerald-800 dark:text-emerald-300 font-black text-sm">
                    {selectedAuditForDetail.totalScore}/100 ({selectedAuditForDetail.scorePercentage}%)
                  </strong>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  QUALITY_GRADE_LABELS[selectedAuditForDetail.grade]?.badgeBg
                }`}>
                  {QUALITY_GRADE_LABELS[selectedAuditForDetail.grade]?.label}
                </span>
              </div>

              {selectedAuditForDetail.deficiencies.length > 0 && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-800 dark:text-rose-300">
                  <strong>Ghi nhận sai sót:</strong>
                  <ul className="list-disc pl-4 mt-1">
                    {selectedAuditForDetail.deficiencies.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedAuditForDetail(null)}
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
