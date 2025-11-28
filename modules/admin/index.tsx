
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardView from './views/DashboardView';
import AdvertisementManagerView from './views/AdvertisementManagerView';
import SettingsView from './views/SettingsView';
import UserManagementView from './views/UserManagementView';

const Admin: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<DashboardView />} />
      <Route path="advertisements" element={<AdvertisementManagerView />} />
      <Route path="settings" element={<SettingsView />} />
      <Route path="users" element={<UserManagementView />} />
    </Routes>
  );
};

export default Admin;
