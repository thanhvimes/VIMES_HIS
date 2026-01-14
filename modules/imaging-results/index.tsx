
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardView from './views/DashboardView';
import WorklistView from './views/WorklistView';
import ReadingView from './views/ReadingView';
import ResultsListView from './views/ResultsListView';
import ConfigurationView from './views/ConfigurationView';

const ImagingResults: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="worklist" replace />} />
      <Route path="dashboard" element={<DashboardView />} />
      <Route path="worklist" element={<WorklistView />} />
      
      {/* Route dành riêng cho bác sĩ đọc kết quả - Giao diện Workstation */}
      <Route path="reading" element={<ReadingView />} />
      <Route path="reading/:requestId" element={<ReadingView />} />
      
      {/* Tra cứu kết quả lịch sử */}
      <Route path="list" element={<ResultsListView />} />
      <Route path="config" element={<ConfigurationView />} />
      
      <Route path="*" element={<div className="p-10 text-center text-slate-400 font-bold uppercase">Chức năng đang được phát triển.</div>} />
    </Routes>
  );
};

export default ImagingResults;
