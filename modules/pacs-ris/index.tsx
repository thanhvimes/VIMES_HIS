import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardView from './views/DashboardView';
import WorklistView from './views/WorklistView';
import ReadingView from './views/ReadingView';
import ResultsListView from './views/ResultsListView';
import ConfigurationView from './views/ConfigurationView';

const PacsRisModule: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="worklist" replace />} />
      <Route path="dashboard" element={<DashboardView />} />
      <Route path="worklist" element={<WorklistView />} />
      <Route path="reading" element={<ReadingView />} />
      <Route path="reading/:requestId" element={<ReadingView />} />
      <Route path="list" element={<ResultsListView />} />
      <Route path="config" element={<ConfigurationView />} />
      <Route path="*" element={<div className="p-10 text-center text-slate-400 font-bold uppercase">Chức năng PACS-RIS đang được tải hoặc không tồn tại.</div>} />
    </Routes>
  );
};

export default PacsRisModule;
