import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import EmrMasterWorkspaceView from './views/EmrMasterWorkspaceView';

const EmrModule: React.FC = () => {
  return (
    <Routes>
      <Route path="workspace" element={<EmrMasterWorkspaceView />} />
      <Route index element={<Navigate to="workspace" replace />} />
      <Route path="*" element={<Navigate to="workspace" replace />} />
    </Routes>
  );
};

export default EmrModule;
