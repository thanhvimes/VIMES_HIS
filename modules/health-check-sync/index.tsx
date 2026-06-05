import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HealthCheckSyncView from './views/HealthCheckSyncView';

const HealthCheckSyncModule: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HealthCheckSyncView />} />
    </Routes>
  );
};

export default HealthCheckSyncModule;
