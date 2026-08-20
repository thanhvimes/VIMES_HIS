import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ContractField, StudioAudit, StudioTemplate, StudioTestCase, StudioTestRun, StudioVersion, templateStudioService } from '../../../services/templateStudioService';
import { useSession } from '../../../contexts/SessionContext';
import { SignaturePlaceholdersPanel } from './SignaturePlaceholdersPanel';
import { CreateTemplateModal } from './CreateTemplateModal';
import { TemplatePreviewModal } from './TemplatePreviewModal';
import { 
  SparklesIcon, 
  DocumentTextIcon, 
  DownloadIcon, 
  ArrowUpTrayIcon, 
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  PlusIcon
} from '../../../components/Icons';

const statusLabel: Record<string, string> = {
  DRAFT: 'Bản nháp', 
  IN_REVIEW: 'Chờ duyệt', 
  APPROVED: 'Đã duyệt', 
  PUBLISHED: 'Đã phát hành', 
  RETIRED: 'Ngừng sử dụng'
};

const statusBadgeColor: Record<string, string> = {
  DRAFT: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300',
  IN_REVIEW: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300',
  APPROVED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300',
  PUBLISHED: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300',
  RETIRED: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300'
};

const FieldRows: React.FC<{ fields?: ContractField[]; depth?: number }> = ({ fields = [], depth = 0 }) => {
  if (!Array.isArray(fields) || fields.length === 0) return null;
  return <>
    {fields.map(field => {
      if (!field) return null;
      return (
        <React.Fragment key={field.path || Math.random()}>
          <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
            <td className="px-3.5 py-2.5 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300" style={{ paddingLeft: 12 + depth * 18 }}>
              {field.path}
            </td>
            <td className="px-3.5 py-2.5 text-xs text-slate-500 font-mono">{field.type || 'string'}</td>
            <td className="px-3.5 py-2.5">
              <code className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                {field.carboneTag || '—'}
              </code>
            </td>
            <td className="px-3.5 py-2.5 text-right">
              {field.carboneTag && (
                <button 
                  type="button"
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 dark:hover:text-blue-400 hover:underline px-2 py-1 bg-blue-50/50 dark:bg-blue-950/40 rounded transition-all" 
                  onClick={() => { navigator.clipboard.writeText(field.carboneTag!); toast.success(`Đã sao chép tag: ${field.carboneTag}`); }}
                >
                  📋 Sao chép
                </button>
              )}
            </td>
          </tr>
          {field.children && Array.isArray(field.children) && <FieldRows fields={field.children} depth={depth + 1} />}
        </React.Fragment>
      );
    })}
  </>;
};

const TemplateStudioView: React.FC = () => {
  const { user } = useSession();
  const [templates, setTemplates] = useState<StudioTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<number>();
  const [fields, setFields] = useState<ContractField[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [versions, setVersions] = useState<StudioVersion[]>([]);
  const [audits, setAudits] = useState<StudioAudit[]>([]);
  const [testCases, setTestCases] = useState<StudioTestCase[]>([]);
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<number>();
  const [sampleText, setSampleText] = useState('{}');
  const [activeTab, setActiveTab] = useState<'fields' | 'signatures' | 'test' | 'versions' | 'audit'>('signatures');
  const [testRuns, setTestRuns] = useState<StudioTestRun[]>([]);
  const [runningTest, setRunningTest] = useState(false);
  const [latestRunResult, setLatestRunResult] = useState<StudioTestRun | null>(null);
  
  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selected = useMemo(() => templates.find(item => item.id === selectedId) || templates[0], [templates, selectedId]);
  const permissions = new Set(user?.permissions || []);
  const can = (permission: string) => user?.role === 'admin' || permissions.has('DOCUMENT_TEMPLATE_ADMIN') || permissions.has(permission);

  const loadTestRuns = async (versionId?: number) => {
    if (!versionId) return;
    try {
      const runs = await templateStudioService.testRuns(versionId);
      setTestRuns(runs || []);
    } catch (_) {}
  };

  const load = async (preferSelectedId?: number) => {
    setLoading(true);
    try {
      const data = await templateStudioService.list();
      setTemplates(data || []);
      if (preferSelectedId) {
        setSelectedId(preferSelectedId);
      } else if (!selectedId && data && data[0]) {
        setSelectedId(data[0].id);
      }
    } catch (error) { 
      toast.error(error instanceof Error ? error.message : 'Không tải được danh mục biểu mẫu'); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!selected) return;
    const versionId = selected.latestVersion?.id;
    Promise.allSettled([
      templateStudioService.fields(selected.code),
      templateStudioService.versions(selected.id),
      templateStudioService.audit(selected.id),
      versionId ? templateStudioService.testCases(versionId) : Promise.resolve([])
    ]).then(([contractRes, versionsRes, auditsRes, casesRes]) => {
      const contract = contractRes.status === 'fulfilled' ? contractRes.value : null;
      const versionHistory = versionsRes.status === 'fulfilled' && Array.isArray(versionsRes.value) ? versionsRes.value : [];
      const auditHistory = auditsRes.status === 'fulfilled' && Array.isArray(auditsRes.value) ? auditsRes.value : [];
      const cases = casesRes.status === 'fulfilled' && Array.isArray(casesRes.value) ? casesRes.value : [];

      setFields(contract?.fields || []); 
      setVersions(versionHistory); 
      setAudits(auditHistory); 
      setTestCases(cases);
      setSampleText(JSON.stringify(selected.latestVersion?.sampleData || contract?.sampleData || {}, null, 2));
      setSelectedTestCaseId(cases[0]?.id);
    }).catch(error => console.error('Error loading template details:', error));
  }, [selected?.id, selected?.code, selected?.latestVersion?.id]);

  useEffect(() => {
    if (activeTab === 'test' && selected?.latestVersion?.id) {
      loadTestRuns(selected.latestVersion.id);
    }
  }, [activeTab, selected?.latestVersion?.id]);

  const handleExecuteTest = async () => {
    const versionId = selected?.latestVersion?.id;
    if (!versionId) return;
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(sampleText);
    } catch {
      toast.error('Dữ liệu JSON không hợp lệ! Vui lòng kiểm tra lại cú pháp.');
      return;
    }
    setRunningTest(true);
    try {
      const result = await templateStudioService.runTest(versionId, selectedTestCaseId, parsed);
      setLatestRunResult(result);
      if (result.status === 'PASSED') {
        toast.success(`Kiểm tra dữ liệu thành công (PASSED) · Thời gian render: ${result.durationMs || 0}ms`);
      } else {
        toast.error(`Kiểm tra dữ liệu thất bại (FAILED)`);
      }
      loadTestRuns(versionId);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi chạy kiểm tra dữ liệu');
    } finally {
      setRunningTest(false);
    }
  };

  const handleRunAll = async () => {
    const versionId = selected?.latestVersion?.id;
    if (!versionId) return;
    setRunningTest(true);
    try {
      const summary = await templateStudioService.runAllTests(versionId);
      toast.success(`Đã chạy kiểm tra toàn bộ (${summary.total} test cases): ${summary.passed} Đạt, ${summary.failed} Thất bại`);
      loadTestRuns(versionId);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi chạy kiểm tra hàng loạt');
    } finally {
      setRunningTest(false);
    }
  };

  const handleAddNewTestCase = async () => {
    const versionId = selected?.latestVersion?.id;
    if (!versionId) return;
    const name = window.prompt('Nhập tên kịch bản kiểm thử mới: (VD: Bệnh nhân ngoại tỉnh có BHYT)');
    if (!name) return;
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(sampleText);
    } catch {
      parsed = { patient_name: 'Nguyễn Văn Test', patient_id: 'BN-99999' };
    }
    try {
      await templateStudioService.saveTestCase(versionId, {
        name,
        testType: 'NORMAL',
        inputData: parsed,
        isRequired: true
      });
      toast.success(`Đã thêm kịch bản kiểm thử [${name}]`);
      const updatedCases = await templateStudioService.testCases(versionId);
      setTestCases(updatedCases);
    } catch (err: any) {
      toast.error(err.message || 'Không thể tạo kịch bản kiểm thử');
    }
  };

  const run = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true);
    try { 
      await action(); 
      toast.success(success); 
      await load(selected?.id); 
    }
    catch (error) { 
      toast.error(error instanceof Error ? error.message : 'Thao tác thất bại'); 
    }
    finally { 
      setBusy(false); 
    }
  };

  const upload = (file?: File) => {
    if (!file || !selected?.latestVersion) return;
    if (!file.name.toLowerCase().endsWith('.docx')) return toast.error('Chỉ chấp nhận tệp định dạng .docx (Word)');
    run(async () => {
      const result = await templateStudioService.upload(selected.latestVersion!.id, file);
      if (!result.valid) throw new Error(result.errors.map(item => item.message).join('; '));
    }, `Upload và kiểm tra tệp [${file.name}] thành công!`);
  };

  const download = () => run(async () => {
    if (!selected?.latestVersion) return;
    const blob = await templateStudioService.download(selected.latestVersion.id);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${selected.code}-v${selected.latestVersion.version}.docx`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, 'Đã tải tệp DOCX về máy');

  const saveSample = () => run(async () => {
    if (!selected?.latestVersion) return;
    let parsed: Record<string, unknown>;
    try { parsed = JSON.parse(sampleText); }
    catch { throw new Error('Dữ liệu JSON không hợp lệ'); }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Dữ liệu test phải là JSON object');
    await templateStudioService.updateSampleData(selected.latestVersion.id, parsed);
  }, 'Đã lưu dữ liệu kiểm thử');

  const filteredTemplates = useMemo(() => {
    if (!searchTerm.trim()) return templates;
    const s = searchTerm.toLowerCase();
    return templates.filter(t => t.name.toLowerCase().includes(s) || t.code.toLowerCase().includes(s));
  }, [templates, searchTerm]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-3 animate-fade-in">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
        <p className="text-sm font-semibold text-slate-500">Đang khởi tạo VIMES Template Studio…</p>
      </div>
    );
  }

  const version = selected?.latestVersion;
  const currentStatus = version?.status || 'DRAFT';

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      
      {/* TOP BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <DocumentTextIcon className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
              VIMES Template Studio
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Quy trình 5 bước khép kín: Thiết kế Word (.docx) $\rightarrow$ Đặt ô ký $\rightarrow$ Test PDF $\rightarrow$ Duyệt $\rightarrow$ Phát hành.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {can('DOCUMENT_TEMPLATE_EDIT') && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              ➕ Tạo Mẫu Biểu Mới
            </button>
          )}

          {can('DOCUMENT_TEMPLATE_EDIT') && selected && currentStatus === 'PUBLISHED' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => templateStudioService.cloneVersion(selected.id, 'Tạo bản chỉnh sửa nâng cấp'), 'Đã tạo bản nháp mới')}
              className="rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-all"
            >
              🚀 Tạo Version Nâng Cấp
            </button>
          )}
        </div>
      </div>

      {/* MAIN 2-COLUMN LAYOUT */}
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        
        {/* LEFT: TEMPLATE LIST & SEARCH */}
        <aside className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Danh mục biểu mẫu ({filteredTemplates.length})
              </span>
            </div>
            
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="🔍 Tìm theo mã hoặc tên..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs mb-3 font-medium outline-none focus:border-blue-500"
            />

            <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredTemplates.map(item => {
                const isSelected = selected?.id === item.id;
                const vStatus = item.latestVersion?.status || 'DRAFT';
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full rounded-xl p-3.5 text-left transition-all border ${
                      isSelected
                        ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 ring-2 ring-blue-500/10 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-xs text-slate-800 dark:text-white leading-snug">
                        {item.name}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${statusBadgeColor[vStatus] || ''}`}>
                        {statusLabel[vStatus]}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>{item.code}</span>
                      <span>v{item.latestVersion?.version || 1}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* RIGHT: TEMPLATE WORKSPACE & WORKFLOW */}
        <section className="space-y-6">
          
          {/* STEPPER & ACTION CARD */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
            
            {/* Template Header info */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                    {selected?.name}
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-black border ${statusBadgeColor[currentStatus] || ''}`}>
                    {statusLabel[currentStatus]} (v{version?.version || 1})
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-1">
                  Mã biểu mẫu: <b className="text-blue-600">{selected?.code}</b> · Phân hệ: <b>{selected?.moduleCode || 'clinical'}</b> · Loại: <b>{selected?.documentType}</b>
                </p>
              </div>

              {/* ACTION BUTTONS BASED ON WORKFLOW */}
              <div className="flex flex-wrap items-center gap-2">
                
                {/* 1. Download DOCX */}
                {version?.artifactKey && (
                  <button
                    type="button"
                    onClick={download}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 text-xs font-semibold"
                  >
                    <DownloadIcon className="w-4 h-4 text-slate-600" /> Tải DOCX
                  </button>
                )}

                {/* 2. Upload DOCX */}
                {currentStatus === 'DRAFT' && can('DOCUMENT_TEMPLATE_EDIT') && (
                  <label className="cursor-pointer flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all border border-slate-300 dark:border-slate-700">
                    <ArrowUpTrayIcon className="w-4 h-4 text-blue-600" /> Upload DOCX
                    <input type="file" accept=".docx" className="hidden" onChange={e => upload(e.target.files?.[0])} />
                  </label>
                )}

                {/* 3. Live Test PDF */}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setIsPreviewModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition-all"
                >
                  📄 Test PDF Trực Tiếp
                </button>

                {/* 4. Workflow Transition Buttons */}
                {currentStatus === 'DRAFT' && can('DOCUMENT_TEMPLATE_EDIT') && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(() => templateStudioService.transition(version!.id, 'submit'), 'Đã gửi biểu mẫu để kiểm duyệt')}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-xs font-bold text-white shadow-md shadow-amber-500/20 transition-all"
                  >
                    🚀 Gửi Duyệt
                  </button>
                )}

                {currentStatus === 'IN_REVIEW' && can('DOCUMENT_TEMPLATE_REVIEW') && (
                  <>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run(() => templateStudioService.transition(version!.id, 'approve'), 'Đã phê duyệt biểu mẫu')}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-all"
                    >
                      ✓ Phê Duyệt
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        const note = window.prompt('Nhập lý do yêu cầu chỉnh sửa lại:');
                        if (note) run(() => templateStudioService.transition(version!.id, 'reject', { note }), 'Đã trả lại bản nháp');
                      }}
                      className="px-3.5 py-2 rounded-xl border border-red-300 text-xs font-semibold text-red-600 hover:bg-red-50 transition-all"
                    >
                      Trả Lại
                    </button>
                  </>
                )}

                {currentStatus === 'APPROVED' && can('DOCUMENT_TEMPLATE_PUBLISH') && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(() => templateStudioService.transition(version!.id, 'publish'), 'Phát hành biểu mẫu thành công! Sẵn sàng dùng trên HIS.')}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-xs font-black text-white shadow-lg shadow-blue-600/20 transition-all"
                  >
                    🎉 Phát Hành Sử Dụng (Publish)
                  </button>
                )}
              </div>
            </div>

            {/* VISUAL WORKFLOW STEPPER */}
            <div className="grid grid-cols-5 gap-2 pt-2">
              {[
                { step: 1, title: '1. Soạn Thảo', sub: 'DOCX & Tags', active: currentStatus === 'DRAFT', done: ['IN_REVIEW', 'APPROVED', 'PUBLISHED'].includes(currentStatus) },
                { step: 2, title: '2. Vùng Ký Số', sub: 'Khung PAdES', active: activeTab === 'signatures', done: ['APPROVED', 'PUBLISHED'].includes(currentStatus) },
                { step: 3, title: '3. Test PDF', sub: 'Kiểm thử dữ liệu', active: false, done: ['IN_REVIEW', 'APPROVED', 'PUBLISHED'].includes(currentStatus) },
                { step: 4, title: '4. Kiểm Duyệt', sub: 'Quy chuẩn BYT', active: currentStatus === 'IN_REVIEW', done: ['APPROVED', 'PUBLISHED'].includes(currentStatus) },
                { step: 5, title: '5. Phát Hành', sub: 'Sẵn sàng HIS', active: currentStatus === 'PUBLISHED', done: currentStatus === 'PUBLISHED' }
              ].map(s => (
                <div 
                  key={s.step} 
                  className={`p-3 rounded-xl border text-center transition-all ${
                    s.done
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 text-emerald-800 dark:text-emerald-300 font-bold'
                      : s.active
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-300 font-bold ring-2 ring-blue-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="text-xs">{s.title}</div>
                  <div className="text-[10px] opacity-75 mt-0.5">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Validation badge if present */}
            {version?.validationResult && (
              <div className={`rounded-xl p-3.5 text-xs flex items-start gap-2.5 ${
                version.validationResult.valid 
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                  : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800'
              }`}>
                {version.validationResult.valid ? (
                  <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <ExclamationCircleIcon className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold">
                    {version.validationResult.valid 
                      ? `Tệp DOCX hợp lệ · ${(Array.isArray(version.validationResult.tags) ? version.validationResult.tags : []).length} biến trường dữ liệu · Kích thước: ${Math.round((version.artifactSize || 0) / 1024)} KB`
                      : `Phát hiện ${(Array.isArray(version.validationResult.errors) ? version.validationResult.errors : []).length} lỗi cần sửa trong tệp DOCX`}
                  </div>
                  {([
                    ...(Array.isArray(version.validationResult.errors) ? version.validationResult.errors : []),
                    ...(Array.isArray(version.validationResult.warnings) ? version.validationResult.warnings : [])
                  ]).map((issue, index) => (
                    <div key={`${issue.code || 'ISSUE'}-${index}`} className="mt-1 font-mono text-[11px] opacity-90">
                      • {issue.code || 'Lỗi'}: {issue.message || ''} {issue.location ? `(${issue.location})` : ''}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* TABS CONTAINER */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            
            {/* TAB SELECTOR */}
            <div className="flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-800 p-2.5 bg-slate-50/50 dark:bg-slate-800/40">
              {[
                ['signatures', '🖋️ Vùng Ký Số (PAdES)'],
                ['fields', '📋 Trường Dữ Liệu & Tag'],
                ['test', '🧪 Test Lab & Dữ Liệu Mẫu'],
                ['versions', '🕒 Lịch Sử Phiên Bản'],
                ['audit', '📜 Nhật Ký Hoạt Động']
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                    activeTab === key
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* TAB 1: SIGNATURE PLACEHOLDERS WITH CANVAS */}
            {activeTab === 'signatures' && selected && version && (
              <SignaturePlaceholdersPanel
                template={selected}
                version={version}
                canEdit={can('DOCUMENT_TEMPLATE_EDIT')}
              />
            )}

            {/* TAB 2: FIELDS & CARBONE TAGS */}
            {activeTab === 'fields' && (
              <div className="p-4 space-y-4">
                <div className="flex justify-between items-center bg-blue-50/60 dark:bg-blue-950/30 p-3 rounded-xl border border-blue-100 dark:border-blue-900">
                  <p className="text-xs text-blue-900 dark:text-blue-200 font-medium">
                    💡 Nhấp nút <b>"Sao chép"</b> bên cạnh trường dữ liệu để dán trực tiếp vào file Word. Carbone sẽ tự động lấp đầy dữ liệu thực tế khi Bác sĩ in phiếu.
                  </p>
                </div>
                <div className="max-h-[480px] overflow-auto border border-slate-200 dark:border-slate-800 rounded-xl custom-scrollbar">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      <tr>
                        <th className="px-3.5 py-2.5 font-bold">Đường dẫn trường</th>
                        <th className="px-3.5 py-2.5 font-bold">Kiểu</th>
                        <th className="px-3.5 py-2.5 font-bold">Tag Carbone</th>
                        <th className="px-3.5 py-2.5 text-right font-bold">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      <FieldRows fields={fields} />
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: TEST LAB & DATA VERIFICATION */}
            {activeTab === 'test' && (
              <div className="p-5 space-y-6">
                
                {/* TOP TEST CONTROLS */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      🧪 Kịch bản kiểm thử:
                    </span>
                    <select
                      value={selectedTestCaseId || ''}
                      onChange={event => {
                        const selectedCase = testCases.find(item => item.id === Number(event.target.value));
                        setSelectedTestCaseId(selectedCase?.id);
                        if (selectedCase) setSampleText(JSON.stringify(selectedCase.inputData, null, 2));
                      }}
                      className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold"
                    >
                      {testCases.map(item => (
                        <option key={item.id} value={item.id}>{item.name} ({item.testType})</option>
                      ))}
                    </select>

                    {can('DOCUMENT_TEMPLATE_EDIT') && (
                      <button
                        type="button"
                        onClick={handleAddNewTestCase}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        ➕ Thêm Kịch Bản Mới
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={runningTest}
                      onClick={handleExecuteTest}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-md shadow-blue-600/20 disabled:opacity-50 transition-all"
                    >
                      {runningTest ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : '⚡ Chạy Kiểm Tra (Run Test)'}
                    </button>

                    <button
                      type="button"
                      disabled={runningTest}
                      onClick={handleRunAll}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all"
                    >
                      🚀 Chạy Toàn Bộ Test Cases
                    </button>
                  </div>
                </div>

                {/* LATEST RUN RESULT CARD */}
                {latestRunResult && (
                  <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 animate-fade-in ${
                    latestRunResult.status === 'PASSED'
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                      : 'bg-red-50/80 border-red-300 text-red-900 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
                  }`}>
                    <div className="flex items-center gap-3">
                      {latestRunResult.status === 'PASSED' ? (
                        <CheckCircleIcon className="w-6 h-6 text-emerald-600 shrink-0" />
                      ) : (
                        <ExclamationCircleIcon className="w-6 h-6 text-red-600 shrink-0" />
                      )}
                      <div>
                        <div className="font-black text-sm">
                          Kết Quả Kiểm Tra: {latestRunResult.status === 'PASSED' ? '✅ ĐẠT YÊU CẦU (PASSED)' : '❌ THẤT BẠI (FAILED)'}
                        </div>
                        <div className="text-xs opacity-90 mt-0.5 font-mono">
                          Thời gian render: <b>{latestRunResult.durationMs || 0}ms</b> · PDF SHA-256: <b>{latestRunResult.pdfSha256?.substring(0, 16) || '—'}…</b>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsPreviewModalOpen(true)}
                      className="px-3.5 py-1.5 bg-white dark:bg-slate-900 rounded-lg text-xs font-bold shadow-sm border hover:bg-slate-50"
                    >
                      📄 Xem Bản PDF Test
                    </button>
                  </div>
                )}

                {/* JSON DATA EDITOR */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <span>Dữ liệu kiểm thử JSON đầu vào:</span>
                      {(() => {
                        try {
                          JSON.parse(sampleText);
                          return <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">✓ JSON hợp lệ</span>;
                        } catch {
                          return <span className="text-[10px] text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200">❌ Lỗi cú pháp JSON</span>;
                        }
                      })()}
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Chỉnh sửa trực tiếp dữ liệu bệnh nhân, chẩn đoán, thuốc để kiểm tra độ tương thích mẫu in.
                    </span>
                  </div>

                  <textarea
                    value={sampleText}
                    onChange={event => setSampleText(event.target.value)}
                    spellCheck={false}
                    className="h-72 w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-950 p-4 font-mono text-xs text-emerald-400 outline-none focus:border-blue-500 shadow-inner"
                  />

                  <div className="flex justify-between items-center pt-1">
                    <button
                      type="button"
                      onClick={() => setIsPreviewModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-md transition-all flex items-center gap-1.5"
                    >
                      📄 Render Xem Thử PDF Với Data Này
                    </button>

                    {currentStatus === 'DRAFT' && can('DOCUMENT_TEMPLATE_EDIT') && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={saveSample}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-bold text-white shadow transition-all"
                      >
                        💾 Lưu Thành Dữ Liệu Mẫu Của Phiên Bản
                      </button>
                    )}
                  </div>
                </div>

                {/* TEST RUNS HISTORY TABLE */}
                {testRuns.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        📋 Lịch Sử Kiểm Tra Dữ Liệu Gần Đây ({testRuns.length} lần test)
                      </span>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm max-h-56 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 sticky top-0">
                          <tr>
                            <th className="px-3.5 py-2 font-bold">Mã Lần Test</th>
                            <th className="px-3.5 py-2 font-bold">Trạng Thái</th>
                            <th className="px-3.5 py-2 font-bold">Thời Gian Render</th>
                            <th className="px-3.5 py-2 font-bold">Thời Điểm</th>
                            <th className="px-3.5 py-2 font-bold">Mã Hash PDF</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {testRuns.slice(0, 10).map((tr) => (
                            <tr key={tr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="px-3.5 py-2 font-mono font-bold text-blue-600">
                                #{tr.id}
                              </td>
                              <td className="px-3.5 py-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  tr.status === 'PASSED'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                                }`}>
                                  {tr.status}
                                </span>
                              </td>
                              <td className="px-3.5 py-2 font-mono text-slate-600 dark:text-slate-300">
                                {tr.durationMs || 0} ms
                              </td>
                              <td className="px-3.5 py-2 text-slate-400">
                                {tr.createdAt ? new Date(tr.createdAt).toLocaleTimeString('vi-VN') : '—'}
                              </td>
                              <td className="px-3.5 py-2 font-mono text-slate-400 text-[11px]">
                                {tr.pdfSha256 ? `${tr.pdfSha256.substring(0, 12)}…` : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* TAB 4: VERSIONS */}
            {activeTab === 'versions' && (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {versions.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 text-xs">
                    <div>
                      <b className="text-sm font-bold text-slate-800 dark:text-white">Phiên bản v{item.version}</b>
                      <div className="text-slate-400 mt-0.5">
                        Tạo ngày: {item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : '—'} · Người tạo: {item.createdBy || 'Admin'}
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusBadgeColor[item.status] || ''}`}>
                      {statusLabel[item.status]}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 5: AUDIT LOGS */}
            {activeTab === 'audit' && (
              <div className="max-h-[480px] divide-y divide-slate-100 dark:divide-slate-800 overflow-auto custom-scrollbar">
                {audits.map(item => (
                  <div key={item.id} className="p-4 text-xs">
                    <b className="text-blue-600">{item.action}</b>
                    <div className="text-slate-400 mt-0.5">
                      {new Date(item.createdAt).toLocaleString('vi-VN')} · Người thực hiện: <b>{item.actorId}</b>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </section>

      </div>

      {/* CREATE TEMPLATE MODAL */}
      <CreateTemplateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(newId) => load(newId)}
      />

      {/* LIVE TEST PDF PREVIEW MODAL */}
      {selected && version && (
        <TemplatePreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          version={version}
          templateCode={selected.code}
          templateName={selected.name}
          testCases={testCases}
          initialSampleData={selected.latestVersion?.sampleData}
        />
      )}

    </div>
  );
};

export default TemplateStudioView;
