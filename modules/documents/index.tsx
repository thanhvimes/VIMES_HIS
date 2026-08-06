
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DocumentView from './views/DocumentView';
import TemplateStudioView from './views/TemplateStudioView';

const Documents: React.FC = () => {
  return (
    <Routes>
      <Route path="view/:documentId" element={<DocumentView />} />
      <Route path="preview/:template" element={<DocumentView />} />
      <Route path="template-studio" element={<TemplateStudioView />} />
    </Routes>
  );
};

export default Documents;
