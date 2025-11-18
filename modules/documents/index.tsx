import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DocumentView from './views/DocumentView';

const Documents: React.FC = () => {
  return (
    <Routes>
      <Route path="view/:documentId" element={<DocumentView />} />
    </Routes>
  );
};

export default Documents;
