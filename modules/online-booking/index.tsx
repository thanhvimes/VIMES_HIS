
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import BookingDashboardView from './views/BookingDashboardView';
import StaffBookingFormView from './views/StaffBookingFormView';
import BookingManagementView from './views/BookingManagementView';
import BookingConfigurationView from './views/BookingConfigurationView';
import ActiveRoomSetupView from './views/ActiveRoomSetupView';
import BookingReportsView from './views/BookingReportsView';
import ReceptionReportView from './views/ReceptionReportView'; // NEW

const OnlineBooking: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<BookingDashboardView />} />
      <Route path="register" element={<StaffBookingFormView />} />
      <Route path="management" element={<BookingManagementView />} />
      <Route path="reports" element={<BookingReportsView />} />
      <Route path="reception-list" element={<ReceptionReportView />} />
      <Route path="active-rooms" element={<ActiveRoomSetupView />} />
      <Route path="config" element={<BookingConfigurationView />} />
    </Routes>
  );
};

export default OnlineBooking;
