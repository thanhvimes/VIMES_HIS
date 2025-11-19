
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ConsultationView from './views/ConsultationView';
import DashboardView from './views/DashboardView';
import PatientListView from './views/PatientListView';
import PatientRecordView from './views/PatientRecordView';

const Consultation: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<DashboardView />} />
      <Route path="list" element={<PatientListView />} />
      <Route path="record" element={<PatientRecordView />} />
      <Route path="record/:patientId" element={<PatientRecordView />} />
      <Route path="history" element={<div className="text-center p-8">Giao diện Lịch sử bệnh án đang được xây dựng.</div>} />
    </Routes>
  );
};

export default Consultation;
