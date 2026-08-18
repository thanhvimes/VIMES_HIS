import React from 'react';
import { StudioTestCase, StudioTestRun } from '../../../services/templateStudioService';
import { TestCaseExportButton } from './TestCaseExportButton';

export const TestLabToolbar: React.FC<{ templateCode?: string; cases: StudioTestCase[]; runs: StudioTestRun[]; showAll: boolean; onRefresh: () => void; onToggle: () => void }> = ({ templateCode, cases, runs, showAll, onRefresh, onToggle }) => <div className="mb-2 flex items-center justify-between"><h4 className="text-sm font-semibold">Lịch sử chạy test</h4><div className="flex gap-2"><TestCaseExportButton templateCode={templateCode} cases={cases} /><button type="button" onClick={onRefresh} className="rounded border px-2 py-1 text-xs">Làm mới</button>{runs.length > 10 && <button type="button" onClick={onToggle} className="rounded border px-2 py-1 text-xs">{showAll ? 'Thu gọn' : `Xem tất cả (${runs.length})`}</button>}</div></div>;
