
import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './modules/login/Login';
import GlobalLoading from './components/shared/GlobalLoading';
import ChatWidget from './components/ChatWidget';
import ToastContainer from './components/shared/ToastContainer';

// Import Nav Constants
import { RECEPTION_NAV_ITEMS } from './modules/reception/constants';
import { CONSULTATION_NAV_ITEMS } from './modules/consultation/constants';
import { INPATIENT_NAV_ITEMS } from './modules/inpatient-treatment/constants';
import { BILLING_NAV_ITEMS } from './modules/billing/constants';
import { LAB_RESULTS_NAV_ITEMS } from './modules/lab-results/constants';
import { IMAGING_RESULTS_NAV_ITEMS } from './modules/imaging-results/constants';
import { PHARMACY_NAV_ITEMS } from './modules/pharmacy/constants';
import { RECORD_STORAGE_NAV_ITEMS } from './modules/record-storage/constants';
import { ADMIN_NAV_ITEMS } from './modules/admin/constants';
import { MGMT_REPORTING_NAV_ITEMS } from './modules/management-reporting/constants';
import { SURGERY_NAV_ITEMS } from './modules/surgery/constants';
import { EQUIPMENT_NAV_ITEMS } from './modules/equipment/constants';
import { INSURANCE_NAV_ITEMS } from './modules/insurance/constants';
import { TELEMEDICINE_NAV_ITEMS } from './modules/telemedicine/constants';
import { CRM_NAV_ITEMS } from './modules/crm/constants';
import { HR_NAV_ITEMS } from './modules/hr/constants';

// --- LAZY LOAD MODULES ---
const Dashboard = React.lazy(() => import('./modules/dashboard/Dashboard'));
const Reception = React.lazy(() => import('./modules/reception/index'));
const Consultation = React.lazy(() => import('./modules/consultation/index'));
const InpatientTreatment = React.lazy(() => import('./modules/inpatient-treatment/index'));
const Surgery = React.lazy(() => import('./modules/surgery/index'));
const Equipment = React.lazy(() => import('./modules/equipment/index'));
const Billing = React.lazy(() => import('./modules/billing/index'));
const LabResults = React.lazy(() => import('./modules/lab-results/index'));
const ImagingResults = React.lazy(() => import('./modules/imaging-results/index'));
const Pharmacy = React.lazy(() => import('./modules/pharmacy/index'));
const RecordStorage = React.lazy(() => import('./modules/record-storage/index'));
const Admin = React.lazy(() => import('./modules/admin/index'));
const ManagementReporting = React.lazy(() => import('./modules/management-reporting/index'));
const Documents = React.lazy(() => import('./modules/documents/index'));
const ReportsModule = React.lazy(() => import('./modules/reports/index'));
const InsuranceModule = React.lazy(() => import('./modules/insurance/index'));
const Telemedicine = React.lazy(() => import('./modules/telemedicine/index'));
const CRM = React.lazy(() => import('./modules/crm/index'));
const HR = React.lazy(() => import('./modules/hr/index'));
const Portal = React.lazy(() => import('./modules/portal/index'));

import { PdfPreviewProvider } from './contexts/PdfPreviewContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SystemProvider } from './contexts/SystemContext';
import { MasterDataProvider } from './contexts/MasterDataContext'; 
import { SessionProvider, useSession } from './contexts/SessionContext';
import { VoiceInputProvider } from './contexts/VoiceInputContext';

// Module configuration map
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
  insurance: { title: 'Bảo hiểm Y tế', nav: INSURANCE_NAV_ITEMS },
  telemedicine: { title: 'Hội chẩn từ xa', nav: TELEMEDICINE_NAV_ITEMS },
  crm: { title: 'CRM & CSKH', nav: CRM_NAV_ITEMS },
  hr: { title: 'Quản lý Nhân sự', nav: HR_NAV_ITEMS },
  documents: { title: 'Xem tài liệu', nav: [] },
  reports: { title: 'Hệ thống Báo cáo', nav: [] },
  settings: { title: 'Cài đặt', nav: [] },
};

const WorkspaceLayout: React.FC = () => {
  const { logout } = useSession();
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sidebarCollapsed') || 'false'); } catch { return false; }
  });
  const [isChatVisible, setIsChatVisible] = useState(false);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const location = useLocation();
  const isFullWidthPage = location.pathname.includes('/consultation/record') || 
                          location.pathname.includes('/inpatient-treatment/record') ||
                          location.pathname.includes('/documents') ||
                          location.pathname.includes('/reports') ||
                          location.pathname.includes('/telemedicine/live');

  const { pageTitle, moduleNavItems } = useMemo(() => {
    const currentModuleRoot = location.pathname.split('/')[1];
    const config = moduleConfig[currentModuleRoot];
    return config ? { pageTitle: config.title, moduleNavItems: config.nav } : { pageTitle: 'VIMES', moduleNavItems: null };
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
            onLogout={logout}
            showSidebarToggle={true}
            isChatVisible={isChatVisible}
            onToggleChat={() => setIsChatVisible(!isChatVisible)}
            showBranding={false} // Always hide full branding inside modules to save space, use Title instead
        />
        <main className={`flex-1 overflow-x-hidden overflow-y-auto ${isFullWidthPage ? '' : 'p-4 sm:p-6 lg:p-8'}`}>
          <Suspense fallback={<GlobalLoading />}>
            <Outlet />
          </Suspense>
        </main>
        {isChatVisible && <ChatWidget />}
        <ToastContainer />
      </div>
    </div>
  );
};

const DashboardLayout: React.FC = () => {
  const { logout } = useSession();
  const [isChatVisible, setIsChatVisible] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-background dark:bg-dark-background relative">
      <Header 
        onToggleSidebar={() => {}} 
        onLogout={logout} 
        showSidebarToggle={false} 
        showBranding={true} // Only show full branding on Dashboard
        isChatVisible={isChatVisible}
        onToggleChat={() => setIsChatVisible(!isChatVisible)}
      />
      <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
         <Suspense fallback={<GlobalLoading message="Đang tải bảng điều khiển..." />}>
            <Dashboard />
         </Suspense>
      </main>
      {isChatVisible && <ChatWidget />}
      <ToastContainer />
    </div>
  );
};

// Staff Routes Container
const StaffSystem: React.FC = () => {
  return (
    <Routes>
      <Route path="/staff-dashboard" element={<DashboardLayout />} />
      
      <Route element={<WorkspaceLayout />}>
        <Route path="/reception/*" element={<Reception />} />
        <Route path="/consultation/*" element={<Consultation />} />
        <Route path="/inpatient-treatment/*" element={<InpatientTreatment />} />
        <Route path="/surgery/*" element={<Surgery />} />
        <Route path="/telemedicine/*" element={<Telemedicine />} />
        <Route path="/crm/*" element={<CRM />} />
        <Route path="/hr/*" element={<HR />} />
        <Route path="/equipment/*" element={<Equipment />} />
        <Route path="/billing/*" element={<Billing />} />
        <Route path="/lab-results/*" element={<LabResults />} />
        <Route path="/imaging-results/*" element={<ImagingResults />} />
        <Route path="/pharmacy/*" element={<Pharmacy />} />
        <Route path="/record-storage/*" element={<RecordStorage />} />
        <Route path="/admin/*" element={<Admin />} />
        <Route path="/management-reporting/*" element={<ManagementReporting />} />
        <Route path="/insurance/*" element={<InsuranceModule />} /> 
        <Route path="/documents/*" element={<Documents />} />
        <Route path="/reports/*" element={<ReportsModule />} />
        <Route path="/settings" element={<div className="text-center text-slate-500 dark:text-slate-400 p-10">Trang Cài đặt đang trong quá trình phát triển.</div>} />
      </Route>
      
      {/* Default Staff Redirect */}
      <Route path="*" element={<Navigate to="/staff-dashboard" replace />} />
    </Routes>
  );
};

// Main App Logic Wrapper
const MainApp: React.FC = () => {
  const { isAuthenticated, login } = useSession();

  // --- CẤU HÌNH ĐIỀU HƯỚNG MẶC ĐỊNH ---
  // Đặt true: Mặc định vào Cổng Bệnh nhân (/portal)
  // Đặt false: Mặc định vào Đăng nhập Nhân viên (/staff/login)
  const IS_DEFAULT_PORTAL = false; 

  return (
    <Routes>
      {/* 1. PUBLIC: Patient Portal (Accessible by everyone) */}
      <Route path="/portal/*" element={
          <Suspense fallback={<GlobalLoading message="Đang tải Cổng thông tin..." />}>
              <Portal />
          </Suspense>
      } />

      {/* 2. ROOT REDIRECT: Điều hướng dựa trên cấu hình IS_DEFAULT_PORTAL */}
      <Route path="/" element={<Navigate to={IS_DEFAULT_PORTAL ? "/portal/home" : "/staff/login"} replace />} />

      {/* 3. STAFF AUTH: Login for Employees */}
      <Route path="/staff/login" element={
          isAuthenticated ? <Navigate to="/staff-dashboard" replace /> : <Login onLogin={() => login()} />
      } />

      {/* 4. STAFF SYSTEM: Protected Routes */}
      <Route path="/*" element={
          isAuthenticated ? <StaffSystem /> : <Navigate to="/staff/login" replace />
      } />
    </Routes>
  );
}

const App: React.FC = () => {
  // --- CẤU HÌNH: CHẶN MENU CHUỘT PHẢI (CONTEXT MENU) ---
  // Đặt true để chặn menu chuột phải của trình duyệt
  // Đặt false để bật lại menu chuột phải (hữu ích khi debug)
  const DISABLE_BROWSER_CONTEXT_MENU = true; 

  useEffect(() => {
    if (DISABLE_BROWSER_CONTEXT_MENU) {
      const handleContextMenu = (e: MouseEvent) => {
        // Ngăn chặn hành vi mặc định ngay lập tức
        e.preventDefault();
        // Ngăn sự kiện lan truyền thêm
        e.stopPropagation(); 
        return false;
      };

      // Sử dụng { capture: true } để bắt sự kiện ngay từ document root 
      // trước khi nó lan truyền xuống các phần tử con.
      document.addEventListener('contextmenu', handleContextMenu, { capture: true });

      return () => {
        document.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      };
    }
  }, [DISABLE_BROWSER_CONTEXT_MENU]);

  return (
    <SystemProvider>
      <SessionProvider>
        <NotificationProvider>
          <MasterDataProvider>
            <PdfPreviewProvider>
              <VoiceInputProvider>
                 <MainApp />
              </VoiceInputProvider>
            </PdfPreviewProvider>
          </MasterDataProvider>
        </NotificationProvider>
      </SessionProvider>
    </SystemProvider>
  );
};

export default App;
