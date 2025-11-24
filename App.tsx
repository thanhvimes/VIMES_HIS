
import React, { useState, useMemo, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet, Link } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './modules/login/Login';
import Dashboard from './modules/dashboard/Dashboard';

// Import module entry points and constants
import Reception from './modules/reception/index';
import { RECEPTION_NAV_ITEMS } from './modules/reception/constants';
import Consultation from './modules/consultation/index';
import { CONSULTATION_NAV_ITEMS } from './modules/consultation/constants';
import InpatientTreatment from './modules/inpatient-treatment/index';
import { INPATIENT_NAV_ITEMS } from './modules/inpatient-treatment/constants';
import Billing from './modules/billing/index';
import { BILLING_NAV_ITEMS } from './modules/billing/constants';
import LabResults from './modules/lab-results/index';
import { LAB_RESULTS_NAV_ITEMS } from './modules/lab-results/constants';
import ImagingResults from './modules/imaging-results/index';
import { IMAGING_RESULTS_NAV_ITEMS } from './modules/imaging-results/constants';
import Pharmacy from './modules/pharmacy/index';
import { PHARMACY_NAV_ITEMS } from './modules/pharmacy/constants';
import RecordStorage from './modules/record-storage/index';
import { RECORD_STORAGE_NAV_ITEMS } from './modules/record-storage/constants';
import Admin from './modules/admin/index';
import { ADMIN_NAV_ITEMS } from './modules/admin/constants';
import ManagementReporting from './modules/management-reporting/index';
import { MGMT_REPORTING_NAV_ITEMS } from './modules/management-reporting/constants';
import Documents from './modules/documents/index';
// New Modules
import Surgery from './modules/surgery/index';
import { SURGERY_NAV_ITEMS } from './modules/surgery/constants';
import Equipment from './modules/equipment/index';
import { EQUIPMENT_NAV_ITEMS } from './modules/equipment/constants';

import { SIDEBAR_NAV_ITEMS } from './constants/navigation';
import { PdfPreviewProvider } from './contexts/PdfPreviewContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ToastContainer from './components/shared/ToastContainer';
import ChatWidget from './components/ChatWidget';

// Module configuration map for dynamic routing and layout
const moduleConfig: { [key: string]: { title: string; nav: any[] } } = {
  reception: { title: 'Tiếp nhận', nav: RECEPTION_NAV_ITEMS },
  consultation: { title: 'Khám bệnh', nav: CONSULTATION_NAV_ITEMS },
  'inpatient-treatment': { title: 'Điều trị nội trú', nav: INPATIENT_NAV_ITEMS },
  surgery: { title: 'Quản lý Phẫu thuật', nav: SURGERY_NAV_ITEMS },
  equipment: { title: 'Trang thiết bị Y tế', nav: EQUIPMENT_NAV_ITEMS },
  billing: { title: 'Viện phí', nav: BILLING_NAV_ITEMS },
  'lab-results': { title: 'KQ Xét nghiệm', nav: LAB_RESULTS_NAV_ITEMS },
  'imaging-results': { title: 'KQ Hình ảnh', nav: IMAGING_RESULTS_NAV_ITEMS },
  pharmacy: { title: 'Dược & Vật tư', nav: PHARMACY_NAV_ITEMS },
  'record-storage': { title: 'Lưu trữ hồ sơ', nav: RECORD_STORAGE_NAV_ITEMS },
  admin: { title: 'Quản trị Hệ thống', nav: ADMIN_NAV_ITEMS },
  'management-reporting': { title: 'Báo cáo Quản trị', nav: MGMT_REPORTING_NAV_ITEMS },
  documents: { title: 'Xem tài liệu', nav: [] },
  reports: { title: 'Báo cáo', nav: [] },
  settings: { title: 'Cài đặt', nav: [] },
};

const WorkspaceLayout: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  // State for mobile sidebar overlay
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  // State for desktop sidebar collapse, persisted in localStorage
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sidebarCollapsed') || 'false');
    } catch {
      return false;
    }
  });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const location = useLocation();

  // Logic to determine if the current page should be full width (no padding)
  const isFullWidthPage = location.pathname.includes('/consultation/record') || 
                          location.pathname.includes('/inpatient-treatment/record') ||
                          location.pathname.includes('/documents');

  const { pageTitle, moduleNavItems } = useMemo(() => {
    const currentModuleRoot = location.pathname.split('/')[1];
    const config = moduleConfig[currentModuleRoot];
    
    if (config) {
      return { pageTitle: config.title, moduleNavItems: config.nav };
    }
    
    // Fallback for non-module routes or errors
    return { pageTitle: 'ClinicMS', moduleNavItems: null };
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-background dark:bg-dark-background">
      <Sidebar 
        isMobileOpen={isMobileSidebarOpen} 
        setMobileOpen={setMobileSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!isSidebarCollapsed)}
        moduleNavItems={moduleNavItems}
      />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header 
            pageTitle={pageTitle} 
            onToggleSidebar={() => setMobileSidebarOpen(!isMobileSidebarOpen)}
            onLogout={onLogout}
            showSidebarToggle={true}
        />
        <main className={`flex-1 overflow-x-hidden overflow-y-auto ${isFullWidthPage ? '' : 'p-4 sm:p-6 lg:p-8'}`}>
          <Outlet />
        </main>
        {/* Global Widgets */}
        <ChatWidget />
        <ToastContainer />
      </div>
    </div>
  );
};

const DashboardLayout: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  return (
    <div className="flex flex-col h-screen bg-background dark:bg-dark-background relative">
      <Header 
          onToggleSidebar={() => {}}
          onLogout={onLogout}
          showSidebarToggle={false}
          showBranding={true}
      />
      <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
        <Dashboard />
      </main>
      {/* Global Widgets */}
      <ChatWidget />
      <ToastContainer />
    </div>
  );
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('isAuthenticated'));

  const handleLogin = () => {
    localStorage.setItem('isAuthenticated', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }
  
  return (
    <NotificationProvider>
      <PdfPreviewProvider>
        <Routes>
          <Route path="/" element={<DashboardLayout onLogout={handleLogout} />} />
          <Route element={<WorkspaceLayout onLogout={handleLogout} />}>
            <Route path="/reception/*" element={<Reception />} />
            <Route path="/consultation/*" element={<Consultation />} />
            <Route path="/inpatient-treatment/*" element={<InpatientTreatment />} />
            <Route path="/surgery/*" element={<Surgery />} />
            <Route path="/equipment/*" element={<Equipment />} />
            <Route path="/billing/*" element={<Billing />} />
            <Route path="/lab-results/*" element={<LabResults />} />
            <Route path="/imaging-results/*" element={<ImagingResults />} />
            <Route path="/pharmacy/*" element={<Pharmacy />} />
            <Route path="/record-storage/*" element={<RecordStorage />} />
            <Route path="/admin/*" element={<Admin />} />
            <Route path="/management-reporting/*" element={<ManagementReporting />} />
            <Route path="/documents/*" element={<Documents />} />
            <Route path="/reports" element={<div className="text-center text-slate-500 dark:text-slate-400">Trang Báo cáo đang trong quá trình phát triển.</div>} />
            <Route path="/settings" element={<div className="text-center text-slate-500 dark:text-slate-400">Trang Cài đặt đang trong quá trình phát triển.</div>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PdfPreviewProvider>
    </NotificationProvider>
  );
};

export default App;
