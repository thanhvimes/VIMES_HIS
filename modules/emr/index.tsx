import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { EMRDashboardView } from './views/EMRDashboardView';
import { EMRListView } from './views/EMRListView';
import { EMRDetailWorkspaceView } from './views/EMRDetailWorkspaceView';
import { EMRSubmissionHandoverView } from './views/EMRSubmissionHandoverView';
import { EMRUnlockAmendmentView } from './views/EMRUnlockAmendmentView';
import { EMRExtractionCopiesView } from './views/EMRExtractionCopiesView';
import { EMRConsultationReviewsView } from './views/EMRConsultationReviewsView';
import { EMRQualityAuditView } from './views/EMRQualityAuditView';
import { EMRDigitalSignatureView } from './views/EMRDigitalSignatureView';
import { EMRAccessApprovalView } from './views/EMRAccessApprovalView';
import { EMRInteroperabilityView } from './views/EMRInteroperabilityView';
import { EMRSettingsCatalogView } from './views/EMRSettingsCatalogView';

const EMRModule: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<EMRDashboardView />} />
      <Route path="records" element={<EMRListView />} />
      <Route path="records/:id" element={<EMRDetailWorkspaceView />} />
      <Route path="handover" element={<EMRSubmissionHandoverView />} />
      <Route path="unlock-requests" element={<EMRUnlockAmendmentView />} />
      <Route path="copies" element={<EMRExtractionCopiesView />} />
      <Route path="consultations" element={<EMRConsultationReviewsView />} />
      <Route path="quality-audit" element={<EMRQualityAuditView />} />
      <Route path="signatures" element={<EMRDigitalSignatureView />} />
      <Route path="access-requests" element={<EMRAccessApprovalView />} />
      <Route path="interop" element={<EMRInteroperabilityView />} />
      <Route path="settings" element={<EMRSettingsCatalogView />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
};

export default EMRModule;
