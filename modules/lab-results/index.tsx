
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LabDashboardView from './views/LabDashboardView';
import LabReceptionView from './views/LabReceptionView';
import LabProcessingView from './views/LabProcessingView';
import LabQCView from './views/LabQCView';
import LabDictionaryView from './views/LabDictionaryView';
import ReportsView from './views/ReportsView';
import LabConnectionView from './views/LabConnectionView';

const LabResults: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<LabDashboardView />} />
      <Route path="reception" element={<LabReceptionView />} />
      <Route path="processing" element={<LabProcessingView />} />
      <Route path="qc" element={<LabQCView />} />
      <Route path="connections" element={<LabConnectionView />} />
      <Route path="dictionary" element={<LabDictionaryView />} />
      <Route path="reports" element={<ReportsView />} />
    </Routes>
  );
};

export default LabResults;
