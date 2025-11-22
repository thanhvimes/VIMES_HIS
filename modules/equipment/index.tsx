
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import EquipmentDashboardView from './views/EquipmentDashboardView';
import EquipmentInventoryView from './views/EquipmentInventoryView';
import MaintenanceView from './views/MaintenanceView';

const Equipment: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<EquipmentDashboardView />} />
      <Route path="inventory" element={<EquipmentInventoryView />} />
      <Route path="maintenance" element={<MaintenanceView />} />
      <Route path="transfer" element={<div className="text-center p-8 text-slate-500">Giao diện Kiểm kê & Điều chuyển đang được xây dựng.</div>} />
      <Route path="reports" element={<div className="text-center p-8 text-slate-500">Giao diện Báo cáo thiết bị đang được xây dựng.</div>} />
    </Routes>
  );
};

export default Equipment;
