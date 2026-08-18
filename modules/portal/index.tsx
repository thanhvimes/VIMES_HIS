
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PortalAuthProvider } from '../../contexts/PortalAuthContext';
import PortalLayout from './components/PortalLayout';
import ProtectedRoute from './components/ProtectedRoute';
import PortalLoginView from './views/PortalLoginView';
import PortalHomeView from './views/PortalHomeView';
import BookingView from './views/BookingView';
import HealthRecordsView from './views/HealthRecordsView';
import FinanceView from './views/FinanceView';
import PublicDocVerificationView from '../document-engine/views/PublicDocVerificationView';

const Portal: React.FC = () => {
  console.log('[Portal] Component rendering');
  return (
    <PortalAuthProvider>
      <Routes>
        {/* Public Route - Login & Document Verification */}
        <Route path="login" element={<PortalLoginView />} />
        <Route path="verify-doc" element={<PublicDocVerificationView />} />

        {/* Protected Routes - Require Authentication */}
        <Route element={
          <ProtectedRoute>
            <PortalLayout />
          </ProtectedRoute>
        }>
          <Route path="home" element={<PortalHomeView />} />
          <Route path="booking" element={<BookingView />} />
          <Route path="records" element={<HealthRecordsView />} />
          <Route path="finance" element={<FinanceView />} />
        </Route>

        {/* Default redirect to login for unauthenticated access */}
        <Route index element={<Navigate to="login" replace />} />
        <Route path="*" element={<Navigate to="login" replace />} />
      </Routes>
    </PortalAuthProvider>
  );
};

export default Portal;
