import React from 'react';
import { StudioTestCase } from '../../../services/templateStudioService';

export const TestCaseExportButton: React.FC<{ templateCode?: string; cases: StudioTestCase[] }> = ({ templateCode, cases }) => {
  const exportCases = () => { const blob = new Blob([JSON.stringify(cases, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${templateCode || 'template'}-test-cases.json`; anchor.click(); URL.revokeObjectURL(url); };
  if (!cases.length) return null;
  return <div className="flex justify-end"><button type="button" onClick={exportCases} className="rounded border px-3 py-2 text-xs">Xuất test case JSON</button></div>;
};
