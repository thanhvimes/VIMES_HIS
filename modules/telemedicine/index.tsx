
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import TeleDashboardView from './views/TeleDashboardView';
import RequestListView from './views/RequestListView';
import LiveRoomView from './views/LiveRoomView';

const Telemedicine: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<TeleDashboardView />} />
      <Route path="requests" element={<RequestListView />} />
      <Route path="schedule" element={<div className="p-8 text-center text-slate-500">Lịch hội chẩn đang được xây dựng.</div>} />
      
      {/* Live Room usually opens in a separate full screen window/tab, but for SPA routing we put it here */}
      <Route path="live" element={<LiveRoomView />} />
      <Route path="live/:sessionId" element={<LiveRoomView />} />
    </Routes>
  );
};

export default Telemedicine;
