
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ResultsListView from './views/ResultsListView';
import ResultDetailView from './views/ResultDetailView';
import UploadView from './views/UploadView';
import DashboardView from './views/DashboardView';
import WorklistView from './views/WorklistView';
import ReadingView from './views/ReadingView';
import ConfigurationView from './views/ConfigurationView';
import ProcedureRecordView from './views/ProcedureRecordView';

const ImagingResults: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<DashboardView />} />
      <Route path="worklist" element={<WorklistView />} />
      {/* DICOM Workflow */}
      <Route path="reading" element={<ReadingView />} />
      <Route path="reading/:requestId" element={<ReadingView />} />
      {/* Non-DICOM Workflow (Endoscopy, Ultrasound) */}
      <Route path="capture/:requestId" element={<ProcedureRecordView />} />
      
      <Route path="list" element={<ResultsListView />} />
      <Route path="detail/:requestId" element={<ResultDetailView />} />
      <Route path="upload" element={<UploadView />} />
      <Route path="config" element={<ConfigurationView />} />
    </Routes>
  );
};

export default ImagingResults;
