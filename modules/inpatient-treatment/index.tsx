
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import InpatientDashboardView from './views/InpatientDashboardView';
import InpatientListView from './views/InpatientListView';
import InpatientRecordView from './views/InpatientRecordView';
import TreatmentHistoryView from './views/TreatmentHistoryView';

const InpatientTreatment: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<InpatientDashboardView />} />
      <Route path="list" element={<InpatientListView />} />
      <Route path="record" element={<InpatientRecordView />} />
      <Route path="record/:patientId" element={<InpatientRecordView />} />
      <Route path="history" element={<TreatmentHistoryView />} />
    </Routes>
  );
};

export default InpatientTreatment;
