import React, { useState, useEffect } from 'react';
import { EMRConsultationReview, EMRRecord } from '../types';
import { emrService } from '../services/emrService';
import {
  Users,
  ShieldAlert,
  Award,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Eye,
  X,
  FileText,
  Calendar,
  Building2,
  Stethoscope,
  HeartCrack,
  PenTool,
  Printer,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export const EMRConsultationReviewsView: React.FC = () => {
  const [consultations, setConsultations] = useState<EMRConsultationReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'clinical_consultation' | 'mortality_review'>('clinical_consultation');
  const [selectedReview, setSelectedReview] = useState<EMRConsultationReview | null>(null);

  useEffect(() => {
    loadConsultations();
  }, [activeTab]);

  const loadConsultations = async () => {
    setLoading(true);
    try {
      const data = await emrService.getConsultations(activeTab);
      setConsultations(data);
    } catch (err) {
      toast.error('Lỗi khi tải danh sách hội chẩn / kiểm thảo');
    } finally {
      setLoading(false);
    }
  };

  const handleSignAsMember = async (csId: string, memberId: string) => {
    try {
      const updated = await emrService.signConsultation(csId, memberId, 'Bác sĩ Hội đồng');
      toast.success('Ký số xác nhận biên bản hội chẩn thành công!');
      loadConsultations();
      if (selectedReview && selectedReview.id === csId) {
        setSelectedReview(updated);
      }
    } catch (err) {
      toast.error('Lỗi khi ký số biên bản');
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Hội đồng Hội chẩn & Biên bản Kiểm thảo Tử vong (EMR Council & Death Audits)
            </h1>
            <p className="text-xs text-slate-500">
              Quản lý biên bản hội chẩn chuyên môn, ký số tập thể (Multi-sign) và quy trình kiểm thảo tử vong 24h theo Quy chế Bệnh viện.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setActiveTab('clinical_consultation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'clinical_consultation'
                ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Hội chẩn Chuyên môn</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mortality_review')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'mortality_review'
                ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <HeartCrack className="w-4 h-4" />
            <span>Kiểm thảo Tử vong (24h)</span>
          </button>
        </div>
      </div>

      {/* Consultations List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 py-12 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
            <p>Đang tải danh sách biên bản...</p>
          </div>
        ) : consultations.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            Chưa có biên bản {activeTab === 'clinical_consultation' ? 'hội chẩn' : 'kiểm thảo tử vong'} nào.
          </div>
        ) : (
          consultations.map(cs => (
            <div
              key={cs.id}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 hover:border-blue-300 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400">
                    {cs.code}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    cs.status === 'fully_signed'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>
                    {cs.status === 'fully_signed' ? 'Đã ký đủ hội đồng (100%)' : `Đang ký (${cs.signedCount}/${cs.totalMembersCount})`}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase">
                    {cs.patientName} (HSBA: {cs.recordNumber})
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">{cs.departmentName} • {cs.location}</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">Thời gian họp: {cs.meetingDate}</p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1 text-slate-700 dark:text-slate-300">
                  <p><strong>Chủ tọa:</strong> {cs.chairman.name} ({cs.chairman.title})</p>
                  <p><strong>Thư ký:</strong> {cs.secretary.name}</p>
                  <p className="line-clamp-2 text-slate-600 dark:text-slate-400 mt-1">
                    <strong>Kết luận:</strong> {cs.finalConclusion}
                  </p>
                </div>

                {/* Council Members Sign Status */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Tiến độ ký số tập thể:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${
                      cs.chairman.isSigned ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {cs.chairman.isSigned ? '✓' : '•'} CT: {cs.chairman.name}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${
                      cs.secretary.isSigned ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {cs.secretary.isSigned ? '✓' : '•'} TK: {cs.secretary.name}
                    </span>
                    {cs.members.map((m, idx) => (
                      <span key={idx} className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${
                        m.isSigned ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {m.isSigned ? '✓' : '•'} {m.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedReview(cs)}
                  className="px-4 py-2 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem Chi Tiết & Ký Số</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Chi Tiết Biên Bản Hội Chẩn & Ký Số */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {selectedReview.type === 'clinical_consultation' ? 'Biên Bản Hội Chẩn Chuyên Môn' : 'Biên Bản Kiểm Thảo Tử Vong (24h)'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold rounded-lg"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>In biên bản</span>
                </button>
                <button onClick={() => setSelectedReview(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900">
              <div className="text-center space-y-1 border-b border-slate-200 dark:border-slate-800 pb-3">
                <p className="font-bold text-slate-500 uppercase">BỆNH VIỆN ĐA KHOA QUỐC TẾ vClinic</p>
                <h2 className="text-base font-black uppercase text-slate-900 dark:text-slate-50">
                  {selectedReview.type === 'clinical_consultation' ? 'TRÍCH BIÊN BẢN HỘI CHẨN CHUYÊN MÔN' : 'BIÊN BẢN HỘI ĐỒNG KIỂM THẢO TỬ VONG'}
                </h2>
                <p className="text-[11px] font-mono text-blue-600 font-bold">Mã số: {selectedReview.code}</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1.5">
                <p><strong>Người bệnh:</strong> <span className="uppercase font-bold">{selectedReview.patientName}</span> • Mã BN: {selectedReview.patientId} • Số HSBA: {selectedReview.recordNumber}</p>
                <p><strong>Khoa điều trị:</strong> {selectedReview.departmentName} • Thời gian họp: {selectedReview.meetingDate}</p>
                <p><strong>Chủ tọa:</strong> {selectedReview.chairman.name} • <strong>Thư ký:</strong> {selectedReview.secretary.name}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase border-b border-slate-200 dark:border-slate-800 pb-1">
                  1. Tóm tắt Diễn biến Lâm sàng
                </h4>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50/50 p-2.5 rounded-lg">
                  {selectedReview.clinicalSummary}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase border-b border-slate-200 dark:border-slate-800 pb-1">
                  2. Ý kiến Thảo luận của Hội đồng
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-700 dark:text-slate-300">
                  {selectedReview.councilDiscussion.map((disc, idx) => (
                    <li key={idx}>{disc}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase border-b border-slate-200 dark:border-slate-800 pb-1">
                  3. Kết luận & Hướng Điều trị Tiếp theo
                </h4>
                <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl space-y-1 text-blue-950 dark:text-blue-200">
                  <p><strong>Kết luận:</strong> {selectedReview.finalConclusion}</p>
                  <p><strong>Kế hoạch điều trị:</strong> {selectedReview.treatmentPlan}</p>
                </div>
              </div>

              {/* Multi-Signature Sign Off Section */}
              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase border-b border-slate-200 dark:border-slate-800 pb-1">
                  4. Ký số Điện tử Xác nhận của Các Thành viên Hội đồng
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  {/* Chủ tọa */}
                  <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
                    <div>
                      <strong className="block text-slate-800 dark:text-slate-200">{selectedReview.chairman.name}</strong>
                      <span className="text-[10px] text-slate-500">Chủ tọa hội đồng</span>
                    </div>
                    {selectedReview.chairman.isSigned ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-4 h-4" /> Đã ký số CA
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSignAsMember(selectedReview.id, selectedReview.chairman.id)}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold"
                      >
                        Ký số ngay
                      </button>
                    )}
                  </div>

                  {/* Thư ký */}
                  <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
                    <div>
                      <strong className="block text-slate-800 dark:text-slate-200">{selectedReview.secretary.name}</strong>
                      <span className="text-[10px] text-slate-500">Thư ký hội đồng</span>
                    </div>
                    {selectedReview.secretary.isSigned ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-4 h-4" /> Đã ký số CA
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSignAsMember(selectedReview.id, selectedReview.secretary.id)}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold"
                      >
                        Ký số ngay
                      </button>
                    )}
                  </div>

                  {/* Thành viên */}
                  {selectedReview.members.map(m => (
                    <div key={m.id} className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
                      <div>
                        <strong className="block text-slate-800 dark:text-slate-200">{m.name}</strong>
                        <span className="text-[10px] text-slate-500">{m.department}</span>
                      </div>
                      {m.isSigned ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-4 h-4" /> Đã ký số CA
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSignAsMember(selectedReview.id, m.id)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold"
                        >
                          Ký số ngay
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
