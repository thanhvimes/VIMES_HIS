
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CrmDashboardView from './views/CrmDashboardView';
import LeadsView from './views/LeadsView';
import MarketingView from './views/MarketingView';
import CustomerCareView from './views/CustomerCareView';

const CRM: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<CrmDashboardView />} />
      <Route path="leads" element={<LeadsView />} />
      <Route path="marketing" element={<MarketingView />} />
      <Route path="care" element={<CustomerCareView />} />
      <Route path="loyalty" element={<div className="p-10 text-center text-slate-500">Module Khách hàng thân thiết đang phát triển.</div>} />
      <Route path="reports" element={<div className="p-10 text-center text-slate-500">Báo cáo CRM đang phát triển.</div>} />
    </Routes>
  );
};

export default CRM;
