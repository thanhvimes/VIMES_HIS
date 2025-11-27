
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import EquipmentDashboardView from './views/EquipmentDashboardView';
import EquipmentInventoryView from './views/EquipmentInventoryView';
import MaintenanceView from './views/MaintenanceView';
import ReportsLayout from '../reports/ReportsLayout'; // Updated Import

const Equipment: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<EquipmentDashboardView />} />
      <Route path="inventory" element={<EquipmentInventoryView />} />
      <Route path="maintenance" element={<MaintenanceView />} />
      <Route path="transfer" element={<div className="text-center p-8 text-slate-500">Giao diện Kiểm kê & Điều chuyển đang được xây dựng.</div>} />
      {/* Use ReportsLayout with module filter */}
      <Route path="reports" element={<ReportsLayout moduleFilter="equipment" />} />
    </Routes>
  );
};

export default Equipment;
