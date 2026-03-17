import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import BookingDashboardView from './views/BookingDashboardView';
import StaffBookingFormView from './views/StaffBookingFormView';
import BookingManagementView from './views/BookingManagementView';
import BookingReportsView from './views/BookingReportsView';
import ReceptionReportView from './views/ReceptionReportView';
import RoomSetupView from './views/RoomSetupView'; // NEW
import SettingsView from './views/SettingsView'; // NEW: Settings

const OnlineBooking: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<BookingDashboardView />} />
      <Route path="register" element={<StaffBookingFormView />} />
      <Route path="management" element={<BookingManagementView />} />
      <Route path="reports" element={<BookingReportsView />} />
      <Route path="reception-list" element={<ReceptionReportView />} />
      <Route path="room-setup" element={<RoomSetupView />} />
      <Route path="settings" element={<SettingsView />} />
    </Routes>
  );
};

export default OnlineBooking;
