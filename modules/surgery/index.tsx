
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SchedulerBoardView from './views/SchedulerBoardView';
import SurgeryDetailView from './views/SurgeryDetailView';
import SurgeryWaitingRoomView from './views/SurgeryWaitingRoomView';
import SurgeryListView from './views/SurgeryListView';
import ReportsLayout from '../reports/ReportsLayout'; // Updated Import

const Surgery: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="scheduler" replace />} />
      <Route path="scheduler" element={<SchedulerBoardView />} />
      <Route path="detail/:id" element={<SurgeryDetailView />} />
      <Route path="waiting-room" element={<SurgeryWaitingRoomView />} />
      <Route path="list" element={<SurgeryListView />} />
      {/* Use ReportsLayout with module filter */}
      <Route path="reports" element={<ReportsLayout moduleFilter="surgery" />} />
    </Routes>
  );
};

export default Surgery;
