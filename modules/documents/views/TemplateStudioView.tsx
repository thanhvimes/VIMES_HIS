import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ContractField, StudioAudit, StudioTemplate, StudioTestCase, StudioVersion, templateStudioService } from '../../../services/templateStudioService';
import { useSession } from '../../../contexts/SessionContext';

const statusLabel: Record<string, string> = {
  DRAFT: 'Bản nháp', IN_REVIEW: 'Chờ duyệt', APPROVED: 'Đã duyệt', PUBLISHED: 'Đã phát hành', RETIRED: 'Ngừng sử dụng'
};

const FieldRows: React.FC<{ fields: ContractField[]; depth?: number }> = ({ fields, depth = 0 }) => <>
  {fields.map(field => <React.Fragment key={field.path}>
    <tr className="border-b border-slate-100 dark:border-slate-800">
      <td className="px-3 py-2 font-mono text-xs" style={{ paddingLeft: 12 + depth * 18 }}>{field.path}</td>
      <td className="px-3 py-2 text-xs text-slate-500">{field.type}</td>
      <td className="px-3 py-2"><code className="text-xs text-blue-700 dark:text-blue-300">{field.carboneTag || '—'}</code></td>
      <td className="px-3 py-2 text-right">
        {field.carboneTag && <button className="text-xs text-blue-600 hover:underline" onClick={() => { navigator.clipboard.writeText(field.carboneTag!); toast.success('Đã sao chép tag'); }}>Sao chép</button>}
      </td>
    </tr>
    {field.children && <FieldRows fields={field.children} depth={depth + 1} />}
  </React.Fragment>)}
</>;

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
  const [activeTab, setActiveTab] = useState<'fields' | 'test' | 'versions' | 'audit'>('fields');
  const selected = useMemo(() => templates.find(item => item.id === selectedId) || templates[0], [templates, selectedId]);
  const permissions = new Set(user?.permissions || []);
  const can = (permission: string) => user?.role === 'admin' || permissions.has('DOCUMENT_TEMPLATE_ADMIN') || permissions.has(permission);

  const load = async () => {
    setLoading(true);
    try {
      const data = await templateStudioService.list();
      setTemplates(data);
      if (!selectedId && data[0]) setSelectedId(data[0].id);
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Không tải được biểu mẫu'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!selected) return;
    const versionId = selected.latestVersion?.id;
    Promise.all([
      templateStudioService.fields(selected.code),
      templateStudioService.versions(selected.id),
      templateStudioService.audit(selected.id),
      versionId ? templateStudioService.testCases(versionId) : Promise.resolve([])
    ]).then(([contract, versionHistory, auditHistory, cases]) => {
      setFields(contract.fields); setVersions(versionHistory); setAudits(auditHistory); setTestCases(cases);
      setSampleText(JSON.stringify(selected.latestVersion?.sampleData || contract.sampleData, null, 2));
      setSelectedTestCaseId(cases[0]?.id);
    }).catch(error => toast.error(error.message));
  }, [selected?.code, selected?.latestVersion?.id]);

  const run = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true);
    try { await action(); toast.success(success); await load(); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Thao tác thất bại'); }
    finally { setBusy(false); }
  };

  const upload = (file?: File) => {
    if (!file || !selected?.latestVersion) return;
    if (!file.name.toLowerCase().endsWith('.docx')) return toast.error('Chỉ chấp nhận file DOCX');
    run(async () => {
      const result = await templateStudioService.upload(selected.latestVersion!.id, file);
      if (!result.valid) throw new Error(result.errors.map(item => item.message).join('; '));
    }, 'Upload và kiểm tra DOCX thành công');
  };

  const preview = (format: 'docx' | 'pdf') => run(async () => {
    if (!selected?.latestVersion) return;
    let testData = testCases.find(item => item.id === selectedTestCaseId)?.inputData;
    if (activeTab === 'test') {
      try { testData = JSON.parse(sampleText); }
      catch { throw new Error('Dữ liệu JSON không hợp lệ'); }
    }
    const blob = await templateStudioService.preview(selected.latestVersion.id, format, testData);
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }, `Đã tạo bản xem trước ${format.toUpperCase()}`);

  const download = () => run(async () => {
    if (!selected?.latestVersion) return;
    const blob = await templateStudioService.download(selected.latestVersion.id);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${selected.code}-v${selected.latestVersion.version}.docx`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, 'Đã tải DOCX');

  const saveSample = () => run(async () => {
    if (!selected?.latestVersion) return;
    let parsed: Record<string, unknown>;
    try { parsed = JSON.parse(sampleText); }
    catch { throw new Error('Dữ liệu JSON không hợp lệ'); }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Dữ liệu test phải là JSON object');
    await templateStudioService.updateSampleData(selected.latestVersion.id, parsed);
  }, 'Đã lưu dữ liệu kiểm thử');

  if (loading) return <div className="p-8 text-center text-slate-500">Đang tải Template Studio…</div>;
  if (!templates.length) return <div className="rounded-xl border bg-white dark:bg-slate-900 p-8 text-center"><h2 className="font-semibold">Chưa có biểu mẫu</h2><p className="mt-2 text-sm text-slate-500">Chạy lệnh import 5 mẫu ban đầu để bắt đầu sử dụng.</p><code className="mt-4 inline-block rounded bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs">npm run seed:template-studio</code></div>;

  const version = selected?.latestVersion;
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-bold">VIMES Template Studio</h1><p className="text-sm text-slate-500">Thiết kế bằng Word, kiểm thử và phát hành qua Carbone.</p></div>
      {can('DOCUMENT_TEMPLATE_EDIT') && <button disabled={busy} onClick={() => selected && run(() => templateStudioService.cloneVersion(selected.id, 'Tạo bản chỉnh sửa mới'), 'Đã tạo version nháp mới')} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Tạo version mới</button>}
    </div>
    <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
      <aside className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
        {templates.map(item => <button key={item.id} onClick={() => setSelectedId(item.id)} className={`mb-2 w-full rounded-lg p-3 text-left ${selected?.id === item.id ? 'bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-200' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
          <div className="font-medium">{item.name}</div><div className="mt-1 text-xs text-slate-500">{item.code} · v{item.latestVersion?.version || 0}</div>
        </button>)}
      </aside>
      <section className="space-y-5">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">{selected?.name}</h2><p className="text-sm text-slate-500">{selected?.code} · Phiên bản {version?.version}</p></div><span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium">{statusLabel[version?.status || '']}</span></div>
          {version?.validationResult && <div className={`mt-4 rounded-lg p-3 text-sm ${version.validationResult.valid ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}><div>{version.validationResult.valid ? `DOCX hợp lệ · ${version.validationResult.tags.length} trường · ${Math.round((version.artifactSize || 0) / 1024)} KB` : `${version.validationResult.errors.length} lỗi cần sửa`}</div>{[...version.validationResult.errors, ...version.validationResult.warnings].map((issue, index) => <div key={`${issue.code}-${index}`} className="mt-1 text-xs">{issue.code}: {issue.message}{issue.location ? ` (${issue.location})` : ''}</div>)}</div>}
          <div className="mt-4 flex flex-wrap gap-2">
            {version?.status === 'DRAFT' && can('DOCUMENT_TEMPLATE_EDIT') && <label className="cursor-pointer rounded-lg border px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">Upload DOCX<input type="file" accept=".docx" className="hidden" onChange={event => upload(event.target.files?.[0])} /></label>}
            {version?.artifactKey && <button onClick={download} className="rounded-lg border px-3 py-2 text-sm">Tải DOCX</button>}
            {version?.validationResult?.valid && can('DOCUMENT_TEMPLATE_TEST') && <><button disabled={busy} onClick={() => preview('pdf')} className="rounded-lg border px-3 py-2 text-sm">Test PDF</button><button disabled={busy} onClick={() => preview('docx')} className="rounded-lg border px-3 py-2 text-sm">Test DOCX</button></>}
            {version?.status === 'DRAFT' && version.validationResult?.valid && can('DOCUMENT_TEMPLATE_EDIT') && <button disabled={busy} onClick={() => run(() => templateStudioService.transition(version.id, 'submit'), 'Đã gửi duyệt')} className="rounded-lg bg-amber-500 px-3 py-2 text-sm text-white">Gửi duyệt</button>}
            {version?.status === 'IN_REVIEW' && can('DOCUMENT_TEMPLATE_REVIEW') && <><button onClick={() => run(() => templateStudioService.transition(version.id, 'approve'), 'Đã duyệt')} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white">Duyệt</button><button onClick={() => run(() => templateStudioService.transition(version.id, 'reject'), 'Đã trả lại')} className="rounded-lg border px-3 py-2 text-sm">Trả lại</button></>}
            {version?.status === 'APPROVED' && can('DOCUMENT_TEMPLATE_PUBLISH') && <button onClick={() => run(() => templateStudioService.transition(version.id, 'publish'), 'Đã phát hành')} className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white">Phát hành</button>}
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex flex-wrap gap-1 border-b p-2">{([['fields','Trường dữ liệu'],['test','Test Lab'],['versions','Phiên bản'],['audit','Nhật ký']] as const).map(([key,label]) => <button key={key} onClick={() => setActiveTab(key)} className={`rounded-lg px-3 py-2 text-sm ${activeTab === key ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>{label}</button>)}</div>
          {activeTab === 'fields' && <div className="max-h-[480px] overflow-auto"><table className="w-full"><thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 text-left text-xs"><tr><th className="px-3 py-2">Đường dẫn</th><th className="px-3 py-2">Kiểu</th><th className="px-3 py-2">Tag Carbone</th><th /></tr></thead><tbody><FieldRows fields={fields} /></tbody></table></div>}
          {activeTab === 'test' && <div className="grid gap-4 p-4 xl:grid-cols-[260px_1fr]"><div><label className="text-xs font-medium text-slate-500">Kịch bản kiểm thử</label><select value={selectedTestCaseId || ''} onChange={event => { const selectedCase = testCases.find(item => item.id === Number(event.target.value)); setSelectedTestCaseId(selectedCase?.id); if (selectedCase) setSampleText(JSON.stringify(selectedCase.inputData, null, 2)); }} className="mt-1 w-full rounded-lg border bg-transparent p-2 text-sm">{testCases.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><div className="mt-3 space-y-1 text-xs text-slate-500">{testCases.map(item => <div key={item.id}>{item.isRequired ? '●' : '○'} {item.testType}</div>)}</div></div><div><textarea value={sampleText} onChange={event => setSampleText(event.target.value)} spellCheck={false} className="h-80 w-full rounded-lg border bg-slate-950 p-3 font-mono text-xs text-slate-100" />{version?.status === 'DRAFT' && can('DOCUMENT_TEMPLATE_EDIT') && <button disabled={busy} onClick={saveSample} className="mt-2 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white">Lưu dữ liệu test</button>}</div></div>}
          {activeTab === 'versions' && <div className="divide-y">{versions.map(item => <div key={item.id} className="flex items-center justify-between p-4 text-sm"><div><b>Version {item.version}</b><div className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString('vi-VN')} · {item.createdBy}</div></div><span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs">{statusLabel[item.status]}</span></div>)}</div>}
          {activeTab === 'audit' && <div className="max-h-[480px] divide-y overflow-auto">{audits.map(item => <div key={item.id} className="p-4 text-sm"><b>{item.action}</b><div className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString('vi-VN')} · {item.actorId} · version id {item.entityId}</div></div>)}</div>}
        </div>
      </section>
    </div>
  </div>;
};

export default TemplateStudioView;
