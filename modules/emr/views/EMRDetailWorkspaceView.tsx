import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EMRRecord, EMRDocumentItem } from '../types';
import { emrService } from '../services/emrService';
import { EMRDocumentTree } from '../components/EMRDocumentTree';
import { EMRDocumentRenderer } from '../components/EMRDocumentRenderer';
import { EMRVitalSignsWidget } from '../components/EMRVitalSignsWidget';
import { EMRTimelineView } from '../components/EMRTimelineView';
import { EMRExportModal } from '../components/EMRExportModal';
import { EMRSignatureBadge } from '../components/EMRSignatureBadge';
import { EMRComplianceCheckerModal } from '../components/EMRComplianceCheckerModal';
import { EMR_STATUS_LABELS, HANDOVER_STATUS_LABELS } from '../constants';
import {
  ArrowLeft,
  Share2,
  Lock,
  PenTool,
  Activity,
  Clock,
  User,
  ShieldAlert,
  AlertTriangle,
  FileCheck,
  CheckCircle2,
  Award,
  Layers,
  Heart,
  ChevronRight,
  ShieldCheck,
  Printer,
  Send,
  Inbox
} from 'lucide-react';
import { toast } from 'sonner';

export const EMRDetailWorkspaceView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [record, setRecord] = useState<EMRRecord | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<EMRDocumentItem | null>(null);
  const [activeRightTab, setActiveRightTab] = useState<'vitals' | 'timeline' | 'info' | 'signatures'>('vitals');
  const [loading, setLoading] = useState(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isComplianceModalOpen, setIsComplianceModalOpen] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  useEffect(() => {
    if (id) {
      loadRecord(id);
    }
  }, [id]);

  const loadRecord = async (recordId: string) => {
    setLoading(true);
    try {
      const data = await emrService.getRecordById(recordId);
      if (data) {
        setRecord(data);
        if (data.documents && data.documents.length > 0) {
          setSelectedDoc(data.documents[0]);
        }
      } else {
        toast.error('Không tìm thấy hồ sơ bệnh án');
        navigate('/emr/records');
      }
    } catch (err) {
      toast.error('Lỗi khi tải hồ sơ bệnh án');
    } finally {
      setLoading(false);
    }
  };

  const handleSignDocument = async () => {
    if (!record || !selectedDoc) return;
    setIsSigning(true);
    try {
      const updated = await emrService.signDocument(record.id, selectedDoc.id, {
        signerId: 'BS-001',
        signerName: 'BSCKII. Nguyễn Văn An',
        signerTitle: 'Bác sĩ điều trị chính',
        signerRole: 'doctor',
        certificateIssuer: 'VNPT-CA Cloud HSM Sub-CA',
      });
      setRecord(updated);
      const updatedDoc = updated.documents.find(d => d.id === selectedDoc.id);
      if (updatedDoc) setSelectedDoc(updatedDoc);
      toast.success(`Đã ký số thành công văn bản: ${selectedDoc.name}`);
    } catch (err) {
      toast.error('Ký số không thành công');
    } finally {
      setIsSigning(false);
    }
  };

  const handleCloseRecord = async () => {
    if (!record) return;
    if (confirm('Bạn có chắc chắn muốn đóng bệnh án này? Sau khi đóng, hồ sơ sẽ chuyển sang trạng thái chỉ đọc để thực hiện quy trình ký số và lưu trữ.')) {
      try {
        const updated = await emrService.closeRecord(record.id, 'BSCKII. Nguyễn Văn An (Bác sĩ điều trị)');
        setRecord(updated);
        toast.success('Đã đóng và khóa hồ sơ bệnh án thành công');
      } catch (err) {
        toast.error('Lỗi khi đóng hồ sơ bệnh án');
      }
    }
  };

  if (loading || !record) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto"></div>
          <p className="text-xs text-slate-500">Đang tải không gian làm việc EMR...</p>
        </div>
      </div>
    );
  }

  const statusInfo = EMR_STATUS_LABELS[record.status] || EMR_STATUS_LABELS.active;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] -m-4 sm:-m-6 lg:-m-8 bg-slate-100/60 dark:bg-slate-950 overflow-hidden">
      {/* 1. Patient EMR Banner Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-3 sm:px-6 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs">
        {/* Left: Patient Essential Card */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/emr/records')}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Quay lại danh sách"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0">
              {record.patient.fullName.charAt(0)}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-50 uppercase tracking-tight">
                  {record.patient.fullName}
                </h2>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-mono">
                  {record.patient.patientId}
                </span>
                <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold border ${statusInfo.badgeBg}`}>
                  {statusInfo.label}
                </span>
                {record.submissionStatus && (
                  <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold border ${
                    HANDOVER_STATUS_LABELS[record.submissionStatus]?.badgeBg || ''
                  }`}>
                    {HANDOVER_STATUS_LABELS[record.submissionStatus]?.label}
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                <span>{record.patient.dob.substring(0, 4)} ({record.patient.gender === 'male' ? 'Nam' : 'Nữ'})</span>
                <span>•</span>
                <span>Số HSBA: <strong className="font-mono text-slate-800 dark:text-slate-200">{record.recordNumber}</strong></span>
                <span>•</span>
                <span>{record.departmentName} {record.roomNumber ? `(${record.roomNumber} - ${record.bedNumber})` : ''}</span>
                <span>•</span>
                <span>BS: <strong className="text-slate-700 dark:text-slate-300">{record.primaryDoctorName}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {record.patient.allergies && record.patient.allergies.length > 0 && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-900 rounded-lg text-xs font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Dị ứng: {record.patient.allergies[0]}</span>
            </div>
          )}

          {!record.isLocked && (
            <button
              type="button"
              onClick={handleCloseRecord}
              className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-semibold transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Đóng bệnh án</span>
            </button>
          )}

          {/* Rà soát & Gửi Kho EMR */}
          <button
            type="button"
            onClick={() => setIsComplianceModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Rà soát & Gửi Kho EMR</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Liên thông XML/HL7</span>
          </button>
        </div>
      </div>

      {/* 2. Three-Column Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Column 1: Document Tree (Width: 260px) */}
        <div className="w-64 sm:w-72 shrink-0 h-full overflow-hidden flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <EMRDocumentTree
            documents={record.documents}
            selectedDocumentId={selectedDoc?.id}
            onSelectDocument={doc => setSelectedDoc(doc)}
            recordNumber={record.recordNumber}
            admissionDate={record.admissionDate}
          />
        </div>

        {/* Column 2: Document Interactive Viewer / Editor (Flex-1) */}
        <div className="flex-1 h-full overflow-hidden flex flex-col min-w-0">
          {selectedDoc ? (
            <EMRDocumentRenderer
              document={selectedDoc}
              patient={record.patient}
              recordNumber={record.recordNumber}
              onSignDocument={handleSignDocument}
              onExportPdf={() => setIsExportModalOpen(true)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
              Chọn một tài liệu trong cây hồ sơ bên trái để xem.
            </div>
          )}
        </div>

        {/* Column 3: Clinical Insights & Vital Signs Sidebar (Width: 320px) */}
        <div className="w-80 shrink-0 h-full overflow-hidden flex flex-col border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          {/* Right Tabs Header */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-1.5 gap-1 shrink-0">
            {[
              { id: 'vitals', label: 'Sinh hiệu', icon: Heart },
              { id: 'timeline', label: 'Diễn biến', icon: Clock },
              { id: 'info', label: 'Hành chính', icon: User },
              { id: 'signatures', label: 'Ký số', icon: ShieldCheck },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeRightTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveRightTab(tab.id as any)}
                  className={`flex-1 py-1.5 px-2 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-4 scrollbar-thin">
            {activeRightTab === 'vitals' && (
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-rose-500" />
                  <span>Theo dõi Chỉ số Sinh hiệu</span>
                </h4>
                <EMRVitalSignsWidget vitalSigns={record.vitalSigns} />
              </div>
            )}

            {activeRightTab === 'timeline' && (
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-sky-500" />
                  <span>Dòng thời gian Điều trị (Timeline)</span>
                </h4>
                <EMRTimelineView
                  events={record.timeline}
                  onSelectEventDoc={docId => {
                    const doc = record.documents.find(d => d.id === docId);
                    if (doc) setSelectedDoc(doc);
                  }}
                />
              </div>
            )}

            {activeRightTab === 'info' && (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2 border border-slate-100 dark:border-slate-800">
                  <h5 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-blue-500" /> Thông tin Hành chính
                  </h5>
                  <div className="space-y-1.5 text-[11px]">
                    <p><span className="text-slate-500">Mã BN:</span> <strong className="font-mono">{record.patient.patientId}</strong></p>
                    <p><span className="text-slate-500">Số CCCD / VNeID:</span> <strong className="font-mono">{record.patient.nationalId || '---'}</strong></p>
                    <p><span className="text-slate-500">Ngày sinh:</span> {record.patient.dob}</p>
                    <p><span className="text-slate-500">Điện thoại:</span> {record.patient.phone || '---'}</p>
                    <p><span className="text-slate-500">Địa chỉ:</span> {record.patient.address}</p>
                    <p><span className="text-slate-500">Nhóm máu:</span> <strong className="text-rose-600">{record.patient.bloodType || '---'}</strong></p>
                  </div>
                </div>

                <div className="p-3 bg-rose-50/60 dark:bg-rose-950/30 rounded-xl space-y-2 border border-rose-200 dark:border-rose-900/60">
                  <h5 className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" /> Cảnh báo Tiền sử & Dị ứng
                  </h5>
                  <div className="space-y-1 text-[11px] text-rose-700 dark:text-rose-300">
                    <p>• Dị ứng: {record.patient.allergies?.join(', ') || 'Không ghi nhận'}</p>
                    <p>• Bệnh mạn tính: {record.patient.chronicDiseases?.join(', ') || 'Không ghi nhận'}</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2 border border-slate-100 dark:border-slate-800">
                  <h5 className="font-bold text-slate-900 dark:text-slate-100">Người nhà / Thân nhân</h5>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">{record.patient.relativeName} ({record.patient.relativeRelationship})</p>
                  <p className="text-[11px] text-slate-500 font-mono">SĐT: {record.patient.relativePhone || '---'}</p>
                </div>
              </div>
            )}

            {activeRightTab === 'signatures' && (
              <div className="space-y-3 text-xs">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>Trạng thái Ký số Hồ sơ</span>
                </h4>

                <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 dark:text-emerald-200">Tiến độ ký số</span>
                    <span className="font-bold text-emerald-700">
                      {record.documents.filter(d => d.status === 'signed').length} / {record.documents.length} văn bản
                    </span>
                  </div>
                  <div className="w-full bg-emerald-200 dark:bg-emerald-900/80 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all"
                      style={{
                        width: `${(record.documents.filter(d => d.status === 'signed').length / Math.max(1, record.documents.length)) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  {record.documents.map(doc => (
                    <div
                      key={doc.id}
                      className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{doc.name}</span>
                        {doc.status === 'signed' ? (
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Đã ký
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-600 font-medium">Chờ ký</span>
                        )}
                      </div>
                      {doc.signature && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          <p>Ký bởi: {doc.signature.signerName}</p>
                          <p>Thời gian: {doc.signature.signedAt}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {isExportModalOpen && (
        <EMRExportModal
          record={record}
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}

      {/* Compliance Checker & Handover Modal */}
      {isComplianceModalOpen && (
        <EMRComplianceCheckerModal
          record={record}
          isOpen={isComplianceModalOpen}
          onClose={() => setIsComplianceModalOpen(false)}
          onSubmittedSuccess={() => loadRecord(record.id)}
        />
      )}
    </div>
  );
};
