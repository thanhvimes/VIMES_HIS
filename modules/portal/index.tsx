
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
      {/* Login Route - Explicit path */}
      <Route path="/portal/login" element={<PortalLoginView />} />
      
      {/* Protected Routes - Inside Portal Layout */}
      {/* Parent route matches "/portal" prefix */}
      <Route path="/portal" element={<PortalLayout />}>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<PortalHomeView />} />
          <Route path="booking" element={<BookingView />} />
          <Route path="records" element={<HealthRecordsView />} />
          <Route path="finance" element={<FinanceView />} />
      </Route>

      {/* Catch all - Redirect to portal home */}
      <Route path="*" element={<Navigate to="/portal/home" replace />} />
    </Routes>
  );
};

export default Portal;
