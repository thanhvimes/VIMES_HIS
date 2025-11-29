
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PortalLayout from './components/PortalLayout';
import PortalLoginView from './views/PortalLoginView';
import PortalHomeView from './views/PortalHomeView';
import BookingView from './views/BookingView';
import HealthRecordsView from './views/HealthRecordsView';
import FinanceView from './views/FinanceView';

const Portal: React.FC = () => {
  return (
    <Routes>
      {/* Relative path "login" matches "/portal/login" */}
      <Route path="login" element={<PortalLoginView />} />
      
      {/* Main Portal Layout Routes */}
      <Route element={<PortalLayout />}>
          <Route path="home" element={<PortalHomeView />} />
          <Route path="booking" element={<BookingView />} />
          <Route path="records" element={<HealthRecordsView />} />
          <Route path="finance" element={<FinanceView />} />
          <Route index element={<Navigate to="home" replace />} />
      </Route>

      {/* Catch all redirect within portal */}
      <Route path="*" element={<Navigate to="home" replace />} />
    </Routes>
  );
};

export default Portal;
