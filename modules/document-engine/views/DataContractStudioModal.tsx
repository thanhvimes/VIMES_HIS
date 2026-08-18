import React, { useState } from 'react';
import { toast } from 'sonner';
import { findContractBreakingChanges, JsonSchema, templateStudioService } from '../../../services/templateStudioService';

interface DataContractStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ContractItem {
  id: number;
  code: string;
  version: number;
  name: string;
  status: string;
  jsonSchema: JsonSchema;
}

interface FieldDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  required?: boolean;
  example?: string;
}

export const DataContractStudioModal: React.FC<DataContractStudioModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [selectedContractId, setSelectedContractId] = useState<number>();
  const [contractName, setContractName] = useState('');
  const [schemaText, setSchemaText] = useState('{}');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [viewMode, setViewMode] = useState<'visual' | 'json' | 'preview'>('visual');

  // Quick field builder state
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<'string' | 'number' | 'boolean' | 'array' | 'object'>('string');
  const [newFieldDescription, setNewFieldDescription] = useState('');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldExample, setNewFieldExample] = useState('');

  const loadContracts = async () => {
    setLoading(true);
    try {
      const list = await templateStudioService.contractCodes();
      setContracts(list);
      if (list.length > 0) {
        const first = list[0];
        setSelectedContractId(first.id);
        setContractName(first.name);
        setSchemaText(JSON.stringify(first.jsonSchema, null, 2));
      }
    } catch (err: any) {
      toast.error('Không tải được danh sách contract: ' + (err.message || 'Lỗi'));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectContract = (id: number) => {
    setSelectedContractId(id);
    const item = contracts.find(c => c.id === id);
    if (item) {
      setContractName(item.name);
      setSchemaText(JSON.stringify(item.jsonSchema, null, 2));
    }
  };

  const selectedContract = contracts.find(c => c.id === selectedContractId);

  // Parse current schema to extract visual fields
  const parseCurrentFields = (): FieldDefinition[] => {
    try {
      const schema = JSON.parse(schemaText);
      const props = schema?.properties || {};
      const requiredList: string[] = schema?.required || [];
      return Object.entries(props).map(([name, prop]: [string, any]) => ({
        name,
        type: prop.type || 'string',
        description: prop.description || '',
        required: requiredList.includes(name),
        example: prop.example ? String(prop.example) : ''
      }));
    } catch {
      return [];
    }
  };

  const handleAddField = () => {
    const trimmedName = newFieldName.trim();
    if (!trimmedName || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmedName)) {
      toast.error('Tên trường chỉ gồm chữ cái, số và dấu gạch dưới (không bắt đầu bằng số)');
      return;
    }

    try {
      let schema = JSON.parse(schemaText);
      if (!schema || typeof schema !== 'object') {
        schema = { type: 'object', properties: {}, required: [] };
      }
      if (!schema.properties) schema.properties = {};
      if (!schema.required) schema.required = [];

      schema.properties[trimmedName] = {
        type: newFieldType,
        description: newFieldDescription.trim() || undefined,
        example: newFieldExample.trim() || undefined
      };

      if (newFieldType === 'array') {
        schema.properties[trimmedName].items = { type: 'object', properties: {} };
      }

      if (newFieldRequired && !schema.required.includes(trimmedName)) {
        schema.required.push(trimmedName);
      } else if (!newFieldRequired) {
        schema.required = schema.required.filter((r: string) => r !== trimmedName);
      }

      setSchemaText(JSON.stringify(schema, null, 2));
      setNewFieldName('');
      setNewFieldDescription('');
      setNewFieldExample('');
      setNewFieldRequired(false);
      toast.success(`Đã thêm trường "${trimmedName}" vào contract`);
    } catch (err: any) {
      toast.error('Không thể cập nhật JSON schema: ' + err.message);
    }
  };

  const handleDeleteField = (fieldName: string) => {
    try {
      const schema = JSON.parse(schemaText);
      if (schema.properties) {
        delete schema.properties[fieldName];
      }
      if (schema.required) {
        schema.required = schema.required.filter((r: string) => r !== fieldName);
      }
      setSchemaText(JSON.stringify(schema, null, 2));
      toast.success(`Đã xóa trường "${fieldName}"`);
    } catch (err: any) {
      toast.error('Lỗi khi xóa trường: ' + err.message);
    }
  };

  const generateSampleJsonFromSchema = () => {
    try {
      const schema = JSON.parse(schemaText);
      const props = schema?.properties || {};
      const sample: Record<string, unknown> = {};

      for (const [key, prop] of Object.entries(props) as [string, any][]) {
        if (prop.example !== undefined) {
          sample[key] = prop.example;
        } else if (prop.type === 'string') {
          sample[key] = `Mẫu ${prop.description || key}`;
        } else if (prop.type === 'number') {
          sample[key] = 100000;
        } else if (prop.type === 'boolean') {
          sample[key] = true;
        } else if (prop.type === 'array') {
          sample[key] = [
            { stt: 1, name: 'Dịch vụ mẫu 1', quantity: 1, price: 50000, amount: 50000 },
            { stt: 2, name: 'Dịch vụ mẫu 2', quantity: 2, price: 100000, amount: 200000 }
          ];
        } else {
          sample[key] = {};
        }
      }
      return sample;
    } catch {
      return {};
    }
  };

  const handleSave = async () => {
    if (!selectedContract) return;
    setBusy(true);
    try {
      let schema: JsonSchema;
      try {
        schema = JSON.parse(schemaText);
      } catch {
        throw new Error('JSON Schema không hợp lệ');
      }

      // Check for breaking changes
      const previous = selectedContract.jsonSchema;
      if (previous) {
        const breaking = findContractBreakingChanges(previous, schema);
        if (breaking.length > 0) {
          throw new Error(`Thay đổi phá vỡ contract: ${breaking.map(item => `${item.path} (${item.code})`).join(', ')}`);
        }
      }

      await templateStudioService.updateContract(selectedContract.id, contractName, schema);
      toast.success('Đã lưu Data Contract thành công');
      await loadContracts();
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi lưu contract');
    } finally {
      setBusy(false);
    }
  };

  const handleTransition = async (action: 'publish' | 'retire') => {
    if (!selectedContract) return;
    setBusy(true);
    try {
      if (action === 'publish') {
        await templateStudioService.publishContract(selectedContract.id);
        toast.success('Đã phát hành Data Contract thành công');
      } else {
        await templateStudioService.retireContract(selectedContract.id);
        toast.success('Đã chuyển Data Contract sang trạng thái Ngừng sử dụng');
      }
      await loadContracts();
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi thao tác');
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = (kind: 'schema' | 'sample') => {
    if (!selectedContract) return;
    try {
      const schema = JSON.parse(schemaText);
      const content = kind === 'schema' ? schema : generateSampleJsonFromSchema();
      const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedContract.code}-v${selectedContract.version}-${kind}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('JSON Schema không hợp lệ');
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      loadContracts();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const visualFields = parseCurrentFields();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-xl text-purple-700 dark:bg-purple-950/60 dark:text-purple-400">
              📋
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Data Contract Studio (Thiết kế Hợp đồng Dữ liệu)
              </h2>
              <p className="text-xs text-slate-500">
                Khai báo cấu trúc dữ liệu, trường bắt buộc, định dạng mẫu và xuất sinh thẻ Carbone tự động.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleDownload('schema')}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              📥 Xuất Schema
            </button>
            <button
              type="button"
              onClick={() => handleDownload('sample')}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              🎲 Xuất Sample JSON
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body Layout: Sidebar + Main Editor */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Contract List */}
          <div className="w-72 border-r border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/30 overflow-y-auto">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Danh sách Contracts ({contracts.length})
            </div>
            {loading ? (
              <div className="text-xs text-slate-500 py-4 text-center">Đang tải…</div>
            ) : (
              <div className="space-y-1.5">
                {contracts.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectContract(c.id)}
                    className={`w-full rounded-xl p-3 text-left transition-all ${
                      selectedContractId === c.id
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                        : 'bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-xs">{c.name}</div>
                    <div className={`text-[11px] mt-0.5 ${selectedContractId === c.id ? 'text-purple-100' : 'text-slate-500'}`}>
                      {c.code} · v{c.version}
                    </div>
                    <span className={`mt-1.5 inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${
                      selectedContractId === c.id
                        ? 'bg-purple-500/40 text-white'
                        : c.status === 'PUBLISHED'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {c.status}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Main Editor */}
          <div className="flex-1 flex flex-col overflow-y-auto p-6 bg-white dark:bg-slate-900">
            {selectedContract ? (
              <>
                {/* Meta info bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800 mb-4">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Tên Hợp đồng (Data Contract Name)
                    </label>
                    <input
                      disabled={selectedContract.status !== 'DRAFT'}
                      value={contractName}
                      onChange={e => setContractName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 focus:border-purple-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white disabled:opacity-60"
                    />
                  </div>
                  <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-800">
                    {[
                      { key: 'visual', label: '🛠️ Trực quan (GUI)' },
                      { key: 'json', label: '{ } JSON Schema' },
                      { key: 'preview', label: '👁️ Sample Preview' }
                    ].map(tab => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setViewMode(tab.key as any)}
                        className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                          viewMode === tab.key
                            ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* View 1: Visual Fields Builder */}
                {viewMode === 'visual' && (
                  <div className="space-y-5">
                    {/* Add Field Form */}
                    {selectedContract.status === 'DRAFT' && (
                      <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4 dark:border-purple-900/60 dark:bg-purple-950/20">
                        <h4 className="text-xs font-bold text-purple-900 dark:text-purple-300 mb-3">
                          ➕ Thêm Trường Dữ Liệu Mới (Add Field)
                        </h4>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                              Tên trường (path) *
                            </label>
                            <input
                              placeholder="VD: patient_name"
                              value={newFieldName}
                              onChange={e => setNewFieldName(e.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-mono dark:border-slate-700 dark:bg-slate-800"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                              Kiểu dữ liệu (type)
                            </label>
                            <select
                              value={newFieldType}
                              onChange={e => setNewFieldType(e.target.value as any)}
                              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                            >
                              <option value="string">string (Chuỗi/Chữ)</option>
                              <option value="number">number (Số/Tiền tệ)</option>
                              <option value="boolean">boolean (Đúng/Sai)</option>
                              <option value="array">array (Mảng/Bảng lặp)</option>
                              <option value="object">object (Đối tượng con)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                              Mô tả / Nhãn hiển thị
                            </label>
                            <input
                              placeholder="Họ và tên bệnh nhân"
                              value={newFieldDescription}
                              onChange={e => setNewFieldDescription(e.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                              Ví dụ mẫu (example)
                            </label>
                            <input
                              placeholder="Nguyễn Văn A"
                              value={newFieldExample}
                              onChange={e => setNewFieldExample(e.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                            />
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newFieldRequired}
                              onChange={e => setNewFieldRequired(e.target.checked)}
                              className="h-4 w-4 rounded border-slate-300 text-purple-600"
                            />
                            Bắt buộc có dữ liệu (Required)
                          </label>
                          <button
                            type="button"
                            onClick={handleAddField}
                            className="rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-purple-700 shadow-sm"
                          >
                            ➕ Thêm trường
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Fields Table */}
                    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b bg-slate-50 dark:border-slate-800 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                          <tr>
                            <th className="p-3">Tên trường</th>
                            <th className="p-3">Kiểu dữ liệu</th>
                            <th className="p-3">Thẻ Carbone (Tag)</th>
                            <th className="p-3">Bắt buộc</th>
                            <th className="p-3">Mô tả / Ví dụ</th>
                            {selectedContract.status === 'DRAFT' && <th className="p-3 text-right">Thao tác</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {visualFields.map(f => (
                            <tr key={f.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                                {f.name}
                              </td>
                              <td className="p-3">
                                <span className={`rounded px-2 py-0.5 font-mono text-[10px] font-semibold ${
                                  f.type === 'string' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                  : f.type === 'number' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : f.type === 'array' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                  : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                                }`}>
                                  {f.type}
                                </span>
                              </td>
                              <td className="p-3 font-mono text-[11px] text-purple-700 dark:text-purple-400">
                                {f.type === 'array' ? `{d.${f.name}[i].field}` : `{d.${f.name}}`}
                              </td>
                              <td className="p-3">
                                {f.required ? (
                                  <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800 dark:bg-red-950 dark:text-red-300">
                                    Bắt buộc
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">Tùy chọn</span>
                                )}
                              </td>
                              <td className="p-3 text-slate-600 dark:text-slate-400">
                                {f.description || f.example ? `${f.description || ''} ${f.example ? `(VD: ${f.example})` : ''}` : '—'}
                              </td>
                              {selectedContract.status === 'DRAFT' && (
                                <td className="p-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteField(f.name)}
                                    className="text-red-600 hover:text-red-800 font-semibold text-xs"
                                  >
                                    Xóa
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* View 2: JSON Schema Raw Editor */}
                {viewMode === 'json' && (
                  <div className="flex-1 flex flex-col">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      JSON Schema Định nghĩa
                    </label>
                    <textarea
                      disabled={selectedContract.status !== 'DRAFT'}
                      value={schemaText}
                      onChange={e => setSchemaText(e.target.value)}
                      spellCheck={false}
                      className="flex-1 h-96 w-full rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-100 focus:outline-none disabled:opacity-60"
                    />
                  </div>
                )}

                {/* View 3: Sample Preview */}
                {viewMode === 'preview' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Dữ liệu Mẫu Sinh Tự Động (Auto-generated Sample JSON)
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          const sample = generateSampleJsonFromSchema();
                          navigator.clipboard.writeText(JSON.stringify(sample, null, 2));
                          toast.success('Đã sao chép Sample JSON vào clipboard');
                        }}
                        className="rounded border border-slate-300 px-2.5 py-1 text-xs font-semibold hover:bg-slate-50 dark:border-slate-700"
                      >
                        📋 Sao chép JSON
                      </button>
                    </div>
                    <pre className="h-96 w-full overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-emerald-400">
                      {JSON.stringify(generateSampleJsonFromSchema(), null, 2)}
                    </pre>
                  </div>
                )}

                {/* Footer Action Buttons */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <div className="text-xs text-slate-500">
                    Trạng thái: <strong>{selectedContract.status}</strong> · Version: <strong>v{selectedContract.version}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                    >
                      Đóng
                    </button>
                    {selectedContract.status === 'DRAFT' && (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={handleSave}
                          className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          💾 Lưu Contract
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleTransition('publish')}
                          className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          🚀 Publish Contract
                        </button>
                      </>
                    )}
                    {selectedContract.status === 'PUBLISHED' && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleTransition('retire')}
                        className="rounded-lg border border-amber-600 px-4 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                      >
                        ⚠️ Retire Contract
                      </button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-64 items-center justify-center text-xs text-slate-500">
                Vui lòng chọn một Data Contract để bắt đầu chỉnh sửa.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
