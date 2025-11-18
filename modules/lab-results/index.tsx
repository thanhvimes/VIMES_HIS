import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ResultsListView from './views/ResultsListView';
import UploadView from './views/UploadView';
import DashboardView from './views/DashboardView';

const LabResults: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<DashboardView />} />
      <Route path="list" element={<ResultsListView />} />
      <Route path="upload" element={<UploadView />} />
    </Routes>
  );
};

export default LabResults;