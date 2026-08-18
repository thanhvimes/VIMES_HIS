import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import GlobalLoading from '../../components/ui/GlobalLoading';

// Import 7 Pages from features
import { DashboardPage } from './features/dashboard/DashboardPage';
import { StudyListPage } from './features/studies/StudyListPage';
import { DoctorTaskManagerPage } from './features/tasks/DoctorTaskManagerPage';
import { PacsServerPage } from './features/pacs/PacsServerPage';
import { AuditLogPage } from './features/audit/AuditLogPage';
import { PatientPortalPage } from './features/portal/PatientPortalPage';
import { SettingsPage } from './features/settings/SettingsPage';

import { NotificationProvider } from './contexts/NotificationContext';

const ImagingResults: React.FC = () => {
  return (
    <NotificationProvider>
      <Suspense fallback={<GlobalLoading message="Đang tải phân hệ Chẩn đoán hình ảnh..." />}>
        <Routes>
          <Route index element={<Navigate to="/imaging-results/dashboard" replace />} />
          <Route path="/" element={<Navigate to="/imaging-results/dashboard" replace />} />
          
          {/* 1. Tổng quan */}
          <Route path="dashboard" element={<DashboardPage />} />
          
          {/* 2. Chẩn đoán hình ảnh */}
          <Route path="studies" element={<StudyListPage />} />
          <Route path="worklist" element={<StudyListPage />} />
          <Route path="tasks" element={<DoctorTaskManagerPage />} />
          
          {/* 3. Hệ thống & Bảo mật */}
          <Route path="pacs-server" element={<PacsServerPage />} />
          <Route path="audit-logs" element={<AuditLogPage />} />
          <Route path="portal" element={<PatientPortalPage />} />
          <Route path="settings" element={<SettingsPage />} />
          
          {/* Legacy / Direct study read & search */}
          <Route path="reading" element={<StudyListPage />} />
          <Route path="reading/:requestId" element={<StudyListPage />} />
          <Route path="search" element={<StudyListPage />} />
          
          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/imaging-results/dashboard" replace />} />
        </Routes>
      </Suspense>
    </NotificationProvider>
  );
};

export default ImagingResults;
