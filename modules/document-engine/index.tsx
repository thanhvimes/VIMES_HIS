import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import DocumentView from './views/DocumentView';
import TemplateStudioView from './views/TemplateStudioView';
import EmrClinicalWorkspaceView from './views/EmrClinicalWorkspaceView';
import PublicDocVerificationView from './views/PublicDocVerificationView';

const PdfSigningDemoView = lazy(() => import('./views/PdfSigningDemoView'));

const Documents: React.FC = () => {
  return (
    <Routes>
      <Route path="workspace" element={<EmrClinicalWorkspaceView />} />
      <Route path="verify" element={<PublicDocVerificationView />} />
      <Route path="view/:documentId" element={<DocumentView />} />
      <Route path="preview/:template" element={<DocumentView />} />
      <Route path="template-studio" element={<TemplateStudioView />} />
      <Route
        path="signing-demo"
        element={
          <Suspense fallback={<div className="p-6 text-sm text-slate-500">Đang tải công cụ ký PDF…</div>}>
            <PdfSigningDemoView />
          </Suspense>
        }
      />
    </Routes>
  );
};

export default Documents;
