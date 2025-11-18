import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RegistrationView from './views/RegistrationView';
import ListView from './views/ListView';
import DashboardView from './views/DashboardView';

const Reception: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<DashboardView />} />
      <Route path="register" element={<RegistrationView />} />
      <Route path="list" element={<ListView />} />
      {/* Placeholder for other views */}
      <Route path="schedule" element={<div className="text-center p-8">Giao diện Hẹn khám đang được xây dựng.</div>} />
      <Route path="reports" element={<div className="text-center p-8">Giao diện Báo cáo đang được xây dựng.</div>} />
      <Route path="settings" element={<div className="text-center p-8">Giao diện Cài đặt đang được xây dựng.</div>} />
    </Routes>
  );
};

export default Reception;