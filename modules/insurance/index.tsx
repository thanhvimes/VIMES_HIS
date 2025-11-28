
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import InsuranceDashboardView from './views/InsuranceDashboardView';
import CardCheckView from './views/CardCheckView';
import XMLExportView from './views/XMLExportView';
import ReportsLayout from '../reports/ReportsLayout';

const InsuranceModule: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<InsuranceDashboardView />} />
      <Route path="check-card" element={<CardCheckView />} />
      <Route path="xml-export" element={<XMLExportView />} />
      <Route path="reports" element={<ReportsLayout moduleFilter="insurance" />} />
    </Routes>
  );
};

export default InsuranceModule;
