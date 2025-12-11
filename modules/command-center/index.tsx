
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CommandCenterView from './views/CommandCenterView';

const CommandCenter: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="overview" replace />} />
      <Route path="overview" element={<CommandCenterView />} />
    </Routes>
  );
};

export default CommandCenter;
