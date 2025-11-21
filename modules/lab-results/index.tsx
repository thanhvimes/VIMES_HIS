
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LabDashboardView from './views/LabDashboardView';
import LabReceptionView from './views/LabReceptionView';
import LabProcessingView from './views/LabProcessingView';
import LabQCView from './views/LabQCView';
import LabDictionaryView from './views/LabDictionaryView';
import ReportsView from './views/ReportsView'; // Reuse existing simple report placeholder or create new

const LabResults: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<LabDashboardView />} />
      <Route path="reception" element={<LabReceptionView />} />
      <Route path="processing" element={<LabProcessingView />} />
      <Route path="qc" element={<LabQCView />} />
      <Route path="dictionary" element={<LabDictionaryView />} />
      <Route path="reports" element={<div className="text-center p-8">Báo cáo thống kê xét nghiệm đang được xây dựng.</div>} />
    </Routes>
  );
};

export default LabResults;
