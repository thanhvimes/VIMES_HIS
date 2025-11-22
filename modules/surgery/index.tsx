
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SchedulerBoardView from './views/SchedulerBoardView';

const Surgery: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="scheduler" replace />} />
      <Route path="dashboard" element={<Navigate to="scheduler" replace />} /> {/* Temp redirect */}
      <Route path="scheduler" element={<SchedulerBoardView />} />
      <Route path="list" element={<div className="p-8 text-center">Danh sách phẫu thuật dạng bảng đang xây dựng.</div>} />
      <Route path="reports" element={<div className="p-8 text-center">Báo cáo phẫu thuật đang xây dựng.</div>} />
    </Routes>
  );
};

export default Surgery;
