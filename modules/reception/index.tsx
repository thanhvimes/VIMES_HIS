
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RegistrationView from './views/RegistrationView';
import ListView from './views/ListView';
import DashboardView from './views/DashboardView';
import ScheduleView from './views/ScheduleView';
import ReportsView from './views/ReportsView';
import QueueManagementView from './views/QueueManagementView';

const Reception: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<DashboardView />} />
      <Route path="register" element={<RegistrationView />} />
      <Route path="register/:patientId" element={<RegistrationView />} />
      <Route path="list" element={<ListView />} />
      <Route path="schedule" element={<ScheduleView />} />
      <Route path="queue" element={<QueueManagementView />} />
      <Route path="reports" element={<ReportsView />} />
      <Route path="settings" element={<div className="text-center p-8">Giao diện Cài đặt đang được xây dựng.</div>} />
    </Routes>
  );
};

export default Reception;
