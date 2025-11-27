
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LabDashboardView from './views/LabDashboardView';
import LabReceptionView from './views/LabReceptionView';
import LabProcessingView from './views/LabProcessingView';
import LabQCView from './views/LabQCView';
import LabDictionaryView from './views/LabDictionaryView';
import LabConnectionView from './views/LabConnectionView';
import LabScheduleView from './views/LabScheduleView';
import ReportsLayout from '../reports/ReportsLayout'; // Updated Import

const LabResults: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<LabDashboardView />} />
      <Route path="schedule" element={<LabScheduleView />} />
      <Route path="reception" element={<LabReceptionView />} />
      <Route path="processing" element={<LabProcessingView />} />
      <Route path="qc" element={<LabQCView />} />
      <Route path="connections" element={<LabConnectionView />} />
      <Route path="dictionary" element={<LabDictionaryView />} />
      {/* Use ReportsLayout with module filter */}
      <Route path="reports" element={<ReportsLayout moduleFilter="lab" />} />
    </Routes>
  );
};

export default LabResults;
