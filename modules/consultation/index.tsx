import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ConsultationView from './views/ConsultationView';
import DashboardView from './views/DashboardView';

const Consultation: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<DashboardView />} />
      <Route path="record" element={<ConsultationView />} />
      <Route path="history" element={<div className="text-center p-8">Giao diện Lịch sử bệnh án đang được xây dựng.</div>} />
    </Routes>
  );
};

export default Consultation;