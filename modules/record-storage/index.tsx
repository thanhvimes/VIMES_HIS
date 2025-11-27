
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RecordDashboardView from './views/RecordDashboardView';
import ReceptionView from './views/ReceptionView';
import StorageView from './views/StorageView';
import CirculationView from './views/CirculationView';
import DigitizationView from './views/DigitizationView';
import ReportsLayout from '../reports/ReportsLayout'; // Updated Import

const RecordStorage: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<RecordDashboardView />} />
      <Route path="reception" element={<ReceptionView />} />
      <Route path="storage" element={<StorageView />} />
      <Route path="circulation" element={<CirculationView />} />
      <Route path="digitization" element={<DigitizationView />} />
      {/* Use ReportsLayout with module filter */}
      <Route path="reports" element={<ReportsLayout moduleFilter="record-storage" />} />
    </Routes>
  );
};

export default RecordStorage;
