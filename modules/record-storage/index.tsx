
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RecordDashboardView from './views/RecordDashboardView';
import ReceptionView from './views/ReceptionView';
import StorageView from './views/StorageView';
import CirculationView from './views/CirculationView';
import DigitizationView from './views/DigitizationView';
import ReportsView from './views/ReportsView';

const RecordStorage: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<RecordDashboardView />} />
      <Route path="reception" element={<ReceptionView />} />
      <Route path="storage" element={<StorageView />} />
      <Route path="circulation" element={<CirculationView />} />
      <Route path="digitization" element={<DigitizationView />} />
      <Route path="reports" element={<ReportsView />} />
    </Routes>
  );
};

export default RecordStorage;
