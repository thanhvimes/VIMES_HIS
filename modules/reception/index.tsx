
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RegistrationView from './views/RegistrationView';
import ListView from './views/ListView';
import DashboardView from './views/DashboardView';
import ScheduleView from './views/ScheduleView';
import ReportsLayout from '../reports/ReportsLayout'; // Updated Import
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
      {/* Use ReportsLayout with module filter */}
      <Route path="reports" element={<ReportsLayout moduleFilter="reception" />} />
      <Route path="settings" element={<div className="text-center p-8">Giao diện Cài đặt đang được xây dựng.</div>} />
    </Routes>
  );
};

export default Reception;
