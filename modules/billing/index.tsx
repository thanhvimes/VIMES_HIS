import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardView from './views/DashboardView';
import InvoiceListView from './views/InvoiceListView';
import ReportsView from './views/ReportsView';

const Billing: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<DashboardView />} />
      <Route path="invoices" element={<InvoiceListView />} />
      <Route path="reports" element={<ReportsView />} />
    </Routes>
  );
};

export default Billing;
