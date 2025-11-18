import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardView from './views/DashboardView';

const ManagementReporting: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<DashboardView />} />
      <Route path="revenue" element={<div className="text-center p-8">Giao diện Báo cáo Doanh thu đang được xây dựng.</div>} />
      <Route path="patients" element={<div className="text-center p-8">Giao diện Báo cáo Bệnh nhân đang được xây dựng.</div>} />
    </Routes>
  );
};

export default ManagementReporting;