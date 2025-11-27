
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ConsultationView from './views/ConsultationView';
import DashboardView from './views/DashboardView';
import PatientListView from './views/PatientListView';
import PatientRecordView from './views/PatientRecordView';
import HistoryView from './views/HistoryView';
import DocumentSigningView from './views/DocumentSigningView';

const Consultation: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<DashboardView />} />
      <Route path="list" element={<PatientListView />} />
      <Route path="record" element={<PatientRecordView />} />
      <Route path="record/:patientId" element={<PatientRecordView />} />
      <Route path="signing" element={<DocumentSigningView />} />
      <Route path="history" element={<HistoryView />} />
    </Routes>
  );
};

export default Consultation;
