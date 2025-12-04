
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HRDashboardView from './views/HRDashboardView';
import StaffListView from './views/StaffListView';
import SchedulingView from './views/SchedulingView';
import RecruitmentView from './views/RecruitmentView';
import PayrollView from './views/PayrollView';
import TimekeepingView from './views/TimekeepingView';

const HR: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<HRDashboardView />} />
      <Route path="timekeeping" element={<TimekeepingView />} /> {/* New Route */}
      <Route path="staff" element={<StaffListView />} />
      <Route path="scheduling" element={<SchedulingView />} />
      <Route path="recruitment" element={<RecruitmentView />} />
      <Route path="payroll" element={<PayrollView />} />
      <Route path="training" element={<div className="p-10 text-center text-slate-500">Quản lý Đào tạo & Đánh giá đang phát triển.</div>} />
      <Route path="reports" element={<div className="p-10 text-center text-slate-500">Báo cáo HR đang phát triển.</div>} />
    </Routes>
  );
};

export default HR;
