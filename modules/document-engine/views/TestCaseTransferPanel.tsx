import React, { useState } from 'react';
import { StudioTestCase } from '../../../services/templateStudioService';

export const TestCaseTransferPanel: React.FC<{ cases: StudioTestCase[]; onImport: (cases: StudioTestCase[]) => void; onError: (message: string) => void }> = ({ cases, onImport, onError }) => {
  const [busy, setBusy] = useState(false);
  const exportCases = () => { const blob = new Blob([JSON.stringify(cases, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'test-cases.json'; anchor.click(); URL.revokeObjectURL(url); };
  const importFile = async (file?: File) => { if (!file) return; setBusy(true); try { const value = JSON.parse(await file.text()); if (!Array.isArray(value)) throw new Error('Test cases phải là một mảng JSON'); if (value.some(item => !item?.name || !item?.testType || !item?.inputData || typeof item.inputData !== 'object')) throw new Error('Test case JSON không hợp lệ'); onImport(value); } catch (error) { onError(error instanceof Error ? error.message : 'Không import được test case'); } finally { setBusy(false); } };
  return <div className="flex flex-wrap gap-2"><button type="button" onClick={exportCases} disabled={!cases.length} className="rounded border px-3 py-1 text-xs disabled:opacity-50">Xuất JSON</button><label className="cursor-pointer rounded border px-3 py-1 text-xs">{busy ? 'Đang đọc…' : 'Import JSON'}<input type="file" accept="application/json,.json" className="hidden" onChange={e => importFile(e.target.files?.[0])} /></label></div>;
};
