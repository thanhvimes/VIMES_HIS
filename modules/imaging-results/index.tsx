
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ResultsListView from './views/ResultsListView';
import UploadView from './views/UploadView';
import DashboardView from './views/DashboardView';
import WorklistView from './views/WorklistView';
import ReadingView from './views/ReadingView';
import ConfigurationView from './views/ConfigurationView';

const ImagingResults: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<DashboardView />} />
      <Route path="worklist" element={<WorklistView />} />
      <Route path="reading" element={<ReadingView />} />
      <Route path="reading/:requestId" element={<ReadingView />} />
      <Route path="list" element={<ResultsListView />} />
      <Route path="upload" element={<UploadView />} />
      <Route path="config" element={<ConfigurationView />} />
    </Routes>
  );
};

export default ImagingResults;
