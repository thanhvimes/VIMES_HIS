import React, { useState, useMemo } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet, Link } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './modules/login/Login';
import Dashboard from './modules/dashboard/Dashboard';

// Import module entry points and constants
import Reception from './modules/reception';
import { RECEPTION_NAV_ITEMS } from './modules/reception/constants';
import Consultation from './modules/consultation';
import { CONSULTATION_NAV_ITEMS } from './modules/consultation/constants';
import Billing from './modules/billing';
import { BILLING_NAV_ITEMS } from './modules/billing/constants';
import LabResults from './modules/lab-results';
import { LAB_RESULTS_NAV_ITEMS } from './modules/lab-results/constants';
import ImagingResults from './modules/imaging-results';
import { IMAGING_RESULTS_NAV_ITEMS } from './modules/imaging-results/constants';
import Pharmacy from './modules/pharmacy';
import { PHARMACY_NAV_ITEMS } from './modules/pharmacy/constants';

import { SIDEBAR_NAV_ITEMS } from './constants/navigation';

// Module configuration map for dynamic routing and layout
const moduleConfig: { [key: string]: { title: string; nav: any[] } } = {
  reception: { title: 'Tiếp nhận', nav: RECEPTION_NAV_ITEMS },
  consultation: { title: 'Khám bệnh', nav: CONSULTATION_NAV_ITEMS },
  billing: { title: 'Viện phí', nav: BILLING_NAV_ITEMS },
  'lab-results': { title: 'KQ Xét nghiệm', nav: LAB_RESULTS_NAV_ITEMS },
  'imaging-results': { title: 'KQ Hình ảnh', nav: IMAGING_RESULTS_NAV_ITEMS },
  pharmacy: { title: 'Dược & Vật tư', nav: PHARMACY_NAV_ITEMS },
  reports: { title: 'Báo cáo', nav: [] },
  settings: { title: 'Cài đặt', nav: [] },
};

const WorkspaceLayout: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

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
        isOpen={isSidebarOpen} 
        setIsOpen={setSidebarOpen}
        moduleNavItems={moduleNavItems}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
            pageTitle={pageTitle} 
            onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
            onLogout={onLogout}
            showSidebarToggle={true}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const DashboardLayout: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  return (
    <div className="flex flex-col h-screen bg-background dark:bg-dark-background">
      <Header 
          onToggleSidebar={() => {}}
          onLogout={onLogout}
          showSidebarToggle={false}
          showBranding={true}
      />
      <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
        <Dashboard />
      </main>
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
    <Routes>
      <Route path="/" element={<DashboardLayout onLogout={handleLogout} />} />
      <Route element={<WorkspaceLayout onLogout={handleLogout} />}>
        <Route path="/reception/*" element={<Reception />} />
        <Route path="/consultation/*" element={<Consultation />} />
        <Route path="/billing/*" element={<Billing />} />
        <Route path="/lab-results/*" element={<LabResults />} />
        <Route path="/imaging-results/*" element={<ImagingResults />} />
        <Route path="/pharmacy/*" element={<Pharmacy />} />
        <Route path="/reports" element={<div className="text-center text-slate-500 dark:text-slate-400">Trang Báo cáo đang trong quá trình phát triển.</div>} />
        <Route path="/settings" element={<div className="text-center text-slate-500 dark:text-slate-400">Trang Cài đặt đang trong quá trình phát triển.</div>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
