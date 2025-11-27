
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ReportsLayout from './ReportsLayout';

const ReportsModule: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<ReportsLayout />} />
      {/* Hỗ trợ link trực tiếp đến báo cáo nếu cần: /reports/rep_01 */}
      <Route path=":reportId" element={<ReportsLayout />} /> 
    </Routes>
  );
};

export default ReportsModule;
