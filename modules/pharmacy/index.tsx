
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import InventoryView from './views/InventoryView';
import ImportExportView from './views/ImportExportView';
import ReportsView from './views/ReportsView';
import DashboardView from './views/DashboardView';
import InteractionView from './views/InteractionView';

const Pharmacy: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<DashboardView />} />
      <Route path="inventory" element={<InventoryView />} />
      <Route path="import-export" element={<ImportExportView />} />
      <Route path="interactions" element={<InteractionView />} />
      <Route path="reports" element={<ReportsView />} />
    </Routes>
  );
};

export default Pharmacy;
