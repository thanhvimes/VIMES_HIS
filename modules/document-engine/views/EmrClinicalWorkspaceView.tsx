import React, { useState, useEffect, useMemo } from 'react';
import {
  FolderTree,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Printer,
  Smartphone,
  FileEdit,
  Lock,
  RotateCcw,
  Sparkles,
  QrCode,
  AlertTriangle,
  FolderArchive,
  RefreshCw,
  Building2,
  User,
  Calendar,
  Layers,
  Award,
  ChevronRight
} from 'lucide-react';
import { PatientTabletSignModal } from '../components/PatientTabletSignModal';
import { AmendDocumentModal } from '../components/AmendDocumentModal';

export const EmrClinicalWorkspaceView: React.FC = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [formTypeCatalog, setFormTypeCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [activeGroupFilter, setActiveGroupFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [signingBatch, setSigningBatch] = useState(false);
  const [closingBundle, setClosingBundle] = useState(false);

  // Modals
  const [isTabletModalOpen, setIsTabletModalOpen] = useState(false);
  const [isAmendModalOpen, setIsAmendModalOpen] = useState(false);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const [docRes, catalogRes] = await Promise.all([
        fetch('/api/v1/emr/documents'),
        fetch('/api/v1/emr/catalogs/form-types')
      ]);
      const docData = await docRes.json();
      const catalogData = await catalogRes.json();

      if (docData.success) {
        setDocuments(docData.data || []);
        if (docData.data && docData.data.length > 0 && !selectedDoc) {
          setSelectedDoc(docData.data[0]);
        }
      }
      if (catalogData.success) {
        setFormTypeCatalog(catalogData.data || []);
      }
    } catch (err) {
      console.error('Error fetching EMR documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchesGroup = activeGroupFilter === 'ALL' || doc.documentGroup === activeGroupFilter || doc.formTypeCode === activeGroupFilter;
      const matchesSearch =
        !searchTerm ||
        doc.documentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.formTypeCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.patientId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.docNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.templateCode?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesGroup && matchesSearch;
    });
  }, [documents, activeGroupFilter, searchTerm]);

  const unsignedDocsCount = useMemo(() => {
    return documents.filter((d) => d.status === 'READY_TO_SIGN' || d.status === 'PARTIALLY_SIGNED' || d.status === 'DRAFT').length;
  }, [documents]);

  const handleSelectDoc = (doc: any) => {
    setSelectedDoc(doc);
  };

  const handleToggleSelectDocId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllUnsigned = () => {
    const unsignedIds = filteredDocs
      .filter((d) => d.status !== 'SIGNED' && d.status !== 'LOCKED' && d.status !== 'REVOKED')
      .map((d) => d.id);
    setSelectedDocIds(unsignedIds);
  };

  const handleBatchSign = async () => {
    if (selectedDocIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 tờ tài liệu cần ký số.');
      return;
    }

    setSigningBatch(true);
    try {
      const res = await fetch('/api/v1/emr/documents/batch-sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentIds: selectedDocIds,
          signerId: 'bs_an',
          signerName: 'BS. CKII. Nguyễn Văn An',
          signerRole: 'BÁC SĨ ĐIỀU TRỊ CHÍNH',
          signatureMethod: 'SMART_CA',
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Ký số thành công ${data.data.totalSigned} văn bản y tế chỉ với 1 lần xác thực SmartCA.`);
        setSelectedDocIds([]);
        fetchDocuments();
      } else {
        alert(data.error || 'Lỗi khi ký số hàng loạt.');
      }
    } catch (err: any) {
      alert('Lỗi kết nối: ' + err.message);
    } finally {
      setSigningBatch(false);
    }
  };

  const handleCloseMedicalRecord = async () => {
    if (!selectedDoc) return;
    if (!window.confirm(`Xác nhận ĐÓNG HỒ SƠ BỆNH ÁN & KHÓA BẤT BIẾN (WORM) cho đợt điều trị ${selectedDoc.docNo} của bệnh nhân ${selectedDoc.patientName}?`)) {
      return;
    }

    setClosingBundle(true);
    try {
      const res = await fetch('/api/v1/emr/bundles/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docNo: selectedDoc.docNo,
          patientId: selectedDoc.patientId,
          patientName: selectedDoc.patientName,
          bundleType: 'NOI_TRU',
          closedBy: 'KHTH_TRUONGKHOA',
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Đã đóng hồ sơ bệnh án thành công! Toàn bộ ${data.data.totalPages} trang đã được đánh số trang liên tục và khóa lưu trữ 10-20 năm theo Luật KCB.`);
        fetchDocuments();
      } else {
        alert(data.error || 'Lỗi khi đóng bệnh án.');
      }
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setClosingBundle(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'SIGNED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" /> ĐÃ KÝ SỐ
          </span>
        );
      case 'LOCKED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
            <Lock className="w-3 h-3" /> ĐÃ KHÓA BỆNH ÁN
          </span>
        );
      case 'PARTIALLY_SIGNED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
            <Clock className="w-3 h-3" /> ĐÃ KÝ 1 PHẦN
          </span>
        );
      case 'AMENDED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <RotateCcw className="w-3 h-3" /> ĐÃ THAY THẾ
          </span>
        );
      case 'READY_TO_SIGN':
      case 'DRAFT':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60">
            <Clock className="w-3 h-3 text-amber-500" /> CHỜ KÝ SỐ
          </span>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-100 dark:bg-[#070e1c] text-slate-800 dark:text-slate-100 select-none overflow-hidden font-sans">
      {/* ── Top Header Banner ── */}
      <header className="px-5 py-3.5 bg-white dark:bg-[#0b162c] border-b border-slate-200 dark:border-[#193258] flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                Bàn Làm Việc Bệnh Án Điện Tử (EMR Workspace)
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Thông tư 46/2018/TT-BYT
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Quản lý danh mục biểu mẫu, ký số Bác sĩ / Ký Tablet người bệnh, đánh số trang liên tục và khóa WORM
            </p>
          </div>
        </div>

        {/* Quick Batch Actions */}
        <div className="flex items-center gap-2">
          {unsignedDocsCount > 0 && (
            <button
              onClick={handleSelectAllUnsigned}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition cursor-pointer"
            >
              Chọn ({unsignedDocsCount}) tờ chờ ký
            </button>
          )}

          {selectedDocIds.length > 0 && (
            <button
              onClick={handleBatchSign}
              disabled={signingBatch}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer animate-pulse"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{signingBatch ? 'Đang ký hàng loạt...' : `Ký Toàn Bộ (${selectedDocIds.length}) Tờ [SmartCA]`}</span>
            </button>
          )}

          <button
            onClick={fetchDocuments}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition cursor-pointer"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* ── Main Layout: 2 Columns ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: EMR Document Tree (380px) */}
        <div className="w-96 border-r border-slate-200 dark:border-[#193258] bg-white dark:bg-[#0a1428] flex flex-col shrink-0">
          {/* Search & Filter Toolbar */}
          <div className="p-3 border-b border-slate-200 dark:border-[#193258] space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tên tờ, mã BN, mã đợt..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            {/* Document Group Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-1 text-[11px]">
              {[
                { key: 'ALL', label: 'Tất cả' },
                { key: 'CLINICAL', label: 'Lâm sàng' },
                { key: 'DIEU_TRI', label: 'Điều trị' },
                { key: 'PHAU_THUAT', label: 'Phẫu thuật' },
                { key: 'XET_NGHIEM', label: 'Xét nghiệm' },
                { key: 'CDHA', label: 'CĐHA' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveGroupFilter(tab.key)}
                  className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition cursor-pointer ${
                    activeGroupFilter === tab.key
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tree Document List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1.5">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">Đang tải hồ sơ bệnh án...</div>
            ) : filteredDocs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">Không tìm thấy tài liệu phù hợp</div>
            ) : (
              filteredDocs.map((doc) => {
                const isSelected = selectedDoc?.id === doc.id;
                const isChecked = selectedDocIds.includes(doc.id);
                return (
                  <div
                    key={doc.id}
                    onClick={() => handleSelectDoc(doc)}
                    className={`p-3 rounded-xl border transition cursor-pointer relative group ${
                      isSelected
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800/70 shadow-sm'
                        : 'bg-slate-50/70 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onClick={(e) => handleToggleSelectDocId(doc.id, e)}
                        onChange={() => {}}
                        className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            {doc.clinicalDate ? new Date(doc.clinicalDate).toLocaleDateString('vi-VN') : ''}
                          </span>
                          {renderStatusBadge(doc.status)}
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug truncate">
                          {doc.documentName}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                          {doc.formTypeCode && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              {doc.formTypeCode}
                            </span>
                          )}
                          <span className="font-semibold text-slate-700 dark:text-slate-300 uppercase truncate">
                            {doc.patientName}
                          </span>
                          <span>·</span>
                          <span className="font-mono text-teal-600 dark:text-teal-400">{doc.patientId}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Left Footer: Medical Record Closure Action */}
          {selectedDoc && (
            <div className="p-3 border-t border-slate-200 dark:border-[#193258] bg-slate-50 dark:bg-slate-900/60">
              <button
                onClick={handleCloseMedicalRecord}
                disabled={closingBundle}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-700 to-blue-700 hover:from-indigo-600 hover:to-blue-600 text-white text-xs font-bold shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <FolderArchive className="w-3.5 h-3.5" />
                <span>{closingBundle ? 'Đang đóng bệnh án...' : 'Đóng Bệnh Án & Khóa WORM'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Active Document Viewer & Inspector (Flex 1) */}
        <div className="flex-1 flex flex-col bg-slate-50 dark:bg-[#070e1c] overflow-y-auto custom-scrollbar p-5 space-y-5">
          {selectedDoc ? (
            <>
              {/* Document Master Info Header */}
              <div className="p-5 bg-white dark:bg-[#0d1829] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-black text-slate-900 dark:text-white">
                      {selectedDoc.documentName}
                    </h2>
                    {renderStatusBadge(selectedDoc.status)}
                    {selectedDoc.formTypeCode && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        Mã EMR: {selectedDoc.formTypeCode}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                      Phiên bản v{selectedDoc.versionNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                      <User className="w-3.5 h-3.5 text-indigo-500" /> {selectedDoc.patientName} ({selectedDoc.patientId})
                    </span>
                    <span>·</span>
                    <span className="font-mono">Mã đợt khám: <b>{selectedDoc.docNo}</b></span>
                    <span>·</span>
                    <span>Ngày lâm sàng: <b>{selectedDoc.clinicalDate}</b></span>
                  </div>
                </div>

                {/* Right Document Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Tablet Sign Button for Patient/Guardian */}
                  <button
                    onClick={() => setIsTabletModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-700/60 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-xs font-bold transition active:scale-95 shadow-xs cursor-pointer"
                    title="Mở màn hình cảm ứng để Bệnh nhân / Người nhà ký tay"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Ký Tablet (Bệnh nhân)</span>
                  </button>

                  {/* Amend / Addendum Button (if signed) */}
                  {(selectedDoc.status === 'SIGNED' || selectedDoc.status === 'LOCKED') && (
                    <button
                      onClick={() => setIsAmendModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 hover:bg-amber-100 text-xs font-bold transition active:scale-95 cursor-pointer"
                      title="Lập bản đính chính v2 khi phát hiện sai sót y khoa"
                    >
                      <FileEdit className="w-3.5 h-3.5 text-amber-600" />
                      <span>Đính Chính (v2)</span>
                    </button>
                  )}

                  {/* Print Official Copy */}
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition active:scale-95 shadow-md shadow-indigo-500/20 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>In Văn Bản</span>
                  </button>
                </div>
              </div>

              {/* 2 Grid Cards: Signatures & Public Verification */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Card 1: Digital Signatures Trail (2 cols) */}
                <div className="lg:col-span-2 p-5 bg-white dark:bg-[#0d1829] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      Danh Sách Chữ Ký Số &amp; Dấu Thời Gian (Timestamp TSA)
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {(selectedDoc.signatures || []).length} chữ ký hợp pháp
                    </span>
                  </div>

                  {(!selectedDoc.signatures || selectedDoc.signatures.length === 0) ? (
                    <div className="p-6 text-center text-slate-400 text-xs space-y-1">
                      <Clock className="w-6 h-6 mx-auto text-amber-500/60 mb-2" />
                      <p className="font-bold">Chưa có chữ ký số nào được xác thực</p>
                      <p className="text-[11px]">Tài liệu đang ở trạng thái chờ Bác sĩ ký số hoặc Bệnh nhân ký cảm ứng trên Tablet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedDoc.signatures.map((sig: any, idx: number) => (
                        <div
                          key={sig.id || idx}
                          className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-3 text-xs"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              sig.signerType === 'PATIENT'
                                ? 'bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300'
                                : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                            }`}>
                              {sig.signerType === 'PATIENT' ? <Smartphone className="w-4 h-4" /> : <Award className="w-4 h-4" />}
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-slate-900 dark:text-white">{sig.signerName}</span>
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                  {sig.signerRole}
                                </span>
                              </div>
                              {sig.certificateSubject && (
                                <p className="text-[11px] text-slate-500 font-mono truncate max-w-md">{sig.certificateSubject}</p>
                              )}
                              <p className="text-[10px] text-slate-400 font-mono">
                                Nhà cấp: <b>{sig.certificateIssuer || 'Cảm ứng Tablet'}</b> · Ký lúc: <b>{new Date(sig.signedAt).toLocaleString('vi-VN')}</b>
                              </p>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0">
                            HỢP LỆ
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card 2: QR & Integrity Check (1 col) */}
                <div className="p-5 bg-white dark:bg-[#0d1829] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-indigo-500" />
                      Kiểm Thực Toàn Vẹn
                    </h3>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 text-center space-y-2 border border-slate-200 dark:border-slate-800">
                    <div className="w-28 h-28 mx-auto bg-white p-2 rounded-xl shadow-xs border flex items-center justify-center">
                      {/* Simulated QR Pattern */}
                      <div className="w-full h-full bg-slate-900 rounded-lg flex items-center justify-center text-white text-[10px] font-mono font-black text-center p-1">
                        QR SCAN VERIFY
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">ID: {selectedDoc.id?.slice(0, 18)}...</p>
                  </div>

                  <div className="space-y-1.5 text-[11px]">
                    <span className="text-slate-400 font-bold">Mã băm SHA-256 (Tính toàn vẹn):</span>
                    <p className="font-mono text-[10px] p-2 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 break-all select-all">
                      {selectedDoc.pdfSha256 || 'Đang cập nhật...'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Data Snapshot Inspector */}
              <div className="p-5 bg-white dark:bg-[#0d1829] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    Bản Chụp Dữ Liệu Lâm Sàng Đóng Băng (Data Snapshot JSON)
                  </h3>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                    ✓ Chống biến dạng sau 10–20 năm
                  </span>
                </div>
                <pre className="p-4 rounded-xl bg-slate-900 text-emerald-300 font-mono text-[11px] overflow-x-auto max-h-64 custom-scrollbar">
                  {JSON.stringify(selectedDoc.snapshotData || {}, null, 2)}
                </pre>
              </div>
            </>
          ) : (
            <div className="p-16 text-center text-slate-400 text-xs">Vui lòng chọn một tài liệu ở cây danh mục bên trái để kiểm tra</div>
          )}
        </div>
      </div>

      {/* Patient Tablet Modal */}
      {selectedDoc && (
        <PatientTabletSignModal
          isOpen={isTabletModalOpen}
          onClose={() => setIsTabletModalOpen(false)}
          documentId={selectedDoc.id}
          documentName={selectedDoc.documentName}
          patientName={selectedDoc.patientName}
          patientId={selectedDoc.patientId}
          onSignedSuccess={() => {
            fetchDocuments();
          }}
        />
      )}

      {/* Amend Document Modal */}
      {selectedDoc && (
        <AmendDocumentModal
          isOpen={isAmendModalOpen}
          onClose={() => setIsAmendModalOpen(false)}
          document={selectedDoc}
          onAmendSuccess={() => {
            fetchDocuments();
          }}
        />
      )}
    </div>
  );
};

export default EmrClinicalWorkspaceView;
