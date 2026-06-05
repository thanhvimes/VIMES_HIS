
import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './modules/login/Login';
import GlobalLoading from './components/ui/GlobalLoading';
import ChatWidget from './components/ChatWidget';
import { Toaster } from 'sonner';

// --- LAZY LOAD MODULES ---
const Dashboard = React.lazy(() => import('./modules/dashboard/Dashboard'));
const Reception = React.lazy(() => import('./modules/reception/index'));
const OnlineBooking = React.lazy(() => import('./modules/online-booking/index')); // NEW
const Consultation = React.lazy(() => import('./modules/consultation/index'));
const InpatientTreatment = React.lazy(() => import('./modules/inpatient-treatment/index'));
const Surgery = React.lazy(() => import('./modules/surgery/index'));
const Equipment = React.lazy(() => import('./modules/equipment/index'));
const Billing = React.lazy(() => import('./modules/billing/index'));
const LabResults = React.lazy(() => import('./modules/lab-results/index'));
const ImagingResults = React.lazy(() => import('./modules/imaging-results/index'));
const Pharmacy = React.lazy(() => import('./modules/pharmacy/index'));
const MedicalSupplies = React.lazy(() => import('./modules/medical-supplies/index'));
const RecordStorage = React.lazy(() => import('./modules/record-storage/index'));
const Admin = React.lazy(() => import('./modules/admin/index'));
const ManagementReporting = React.lazy(() => import('./modules/management-reporting/index'));
const Documents = React.lazy(() => import('./modules/documents/index'));
const ReportsModule = React.lazy(() => import('./modules/reports/index'));
const InsuranceModule = React.lazy(() => import('./modules/insurance/index'));
const HealthCheckSyncModule = React.lazy(() => import('./modules/health-check-sync/index'));
const Telemedicine = React.lazy(() => import('./modules/telemedicine/index'));
const CRM = React.lazy(() => import('./modules/crm/index'));
const HR = React.lazy(() => import('./modules/hr/index'));
const Portal = React.lazy(() => import('./modules/portal/index'));
const CommandCenter = React.lazy(() => import('./modules/command-center/index'));
const QueueManagement = React.lazy(() => import('./modules/queue-management/index'));

import { PdfPreviewProvider } from './contexts/PdfPreviewContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { useSystemStore } from './stores/useSystemStore';
import { MasterDataProvider } from './contexts/MasterDataContext';
import { SessionProvider, useSession } from './contexts/SessionContext';
import { VoiceInputProvider } from './contexts/VoiceInputContext';
import { CatalogProvider } from './contexts/CatalogContext';
import { socketService } from './services/socketService';

// Module Title Map
const moduleTitles: { [key: string]: string } = {
  reception: 'Tiếp nhận',
  'online-booking': 'Đăng ký Online', // NEW
  consultation: 'Khám bệnh',
  'inpatient-treatment': 'Điều trị nội trú',
  surgery: 'Quản lý Phẫu thuật',
  equipment: 'Trang thiết bị Y tế',
  billing: 'Viện phí',
  'lab-results': 'KQ Xét nghiệm',
  'imaging-results': 'KQ Hình ảnh',
  pharmacy: 'Dược & Vật tư',
  'medical-supplies': 'Vật tư Y tế',
  'record-storage': 'Lưu trữ hồ sơ',
  admin: 'Quản trị Hệ thống',
  'management-reporting': 'Báo cáo Quản trị',
  insurance: 'Bảo hiểm Y tế',
  'health-check': 'Liên thông KSK VNeID',
  telemedicine: 'Hội chẩn từ xa',
  crm: 'CRM & CSKH',
  hr: 'Quản lý Nhân sự',
  'command-center': 'Trung tâm Điều hành Bệnh viện',
  'queue-management': 'Quản lý Hàng đợi',
  documents: 'Xem tài liệu',
  reports: 'Hệ thống Báo cáo',
  settings: 'Cài đặt',
};

const WorkspaceLayout: React.FC = () => {
  const { logout, user } = useSession();
  const { isSidebarCollapsed, toggleSidebar, isMobileSidebarOpen, setMobileSidebarOpen, getModuleNav, menuConfig } = useSystemStore();
  const [isChatVisible, setIsChatVisible] = useState(false);
  const location = useLocation();

  const isFullWidthPage = location.pathname.includes('/consultation/record') ||
    location.pathname.includes('/inpatient-treatment/record') ||
    location.pathname.includes('/documents') ||
    location.pathname.includes('/reports') ||
    location.pathname.includes('/telemedicine/live') ||
    location.pathname.includes('/reception') ||
    location.pathname.includes('/command-center') ||
    location.pathname.includes('/queue-management');

  const { pageTitle, moduleNavItems } = useMemo(() => {
    const currentModuleRoot = location.pathname.split('/')[1];
    const title = moduleTitles[currentModuleRoot] || 'VIMES';
    const navItems = getModuleNav(currentModuleRoot, user?.role);
    return { pageTitle: title, moduleNavItems: navItems };
  }, [location.pathname, getModuleNav, user?.role, menuConfig]);

  return (
    <div className="flex h-screen bg-background dark:bg-dark-background">
      {!location.pathname.includes('/command-center') && !location.pathname.includes('/queue-management') && (
        <Sidebar
          isMobileOpen={isMobileSidebarOpen}
          setMobileOpen={setMobileSidebarOpen}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebar}
          moduleNavItems={moduleNavItems}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header
          pageTitle={pageTitle}
          onToggleSidebar={() => setMobileSidebarOpen(!isMobileSidebarOpen)}
          onLogout={logout}
          showSidebarToggle={!location.pathname.includes('/command-center') && !location.pathname.includes('/queue-management')}
          isChatVisible={isChatVisible}
          onToggleChat={() => setIsChatVisible(!isChatVisible)}
          showBranding={false}
        />
        <main className={`flex-1 overflow-x-hidden overflow-y-auto ${isFullWidthPage ? '' : 'p-4 sm:p-6 lg:p-8'}`}>
          <Suspense fallback={<GlobalLoading />}>
            <Outlet />
          </Suspense>
        </main>
        {isChatVisible && <ChatWidget />}

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
        onToggleSidebar={() => { }}
        onLogout={logout}
        showSidebarToggle={false}
        showBranding={true}
        isChatVisible={isChatVisible}
        onToggleChat={() => setIsChatVisible(!isChatVisible)}
      />
      <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
        <Suspense fallback={<GlobalLoading message="Đang tải bảng điều khiển..." />}>
          <Dashboard />
        </Suspense>
      </main>
      {isChatVisible && <ChatWidget />}

    </div>
  );
};

const StaffSystem: React.FC = () => {
  return (
    <Routes>
      <Route path="/staff-dashboard" element={<DashboardLayout />} />
      <Route element={<WorkspaceLayout />}>
        <Route path="/reception/*" element={<Reception />} />
        <Route path="/online-booking/*" element={<OnlineBooking />} />
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
        <Route path="/medical-supplies/*" element={<MedicalSupplies />} />
        <Route path="/record-storage/*" element={<RecordStorage />} />
        <Route path="/admin/*" element={<Admin />} />
        <Route path="/management-reporting/*" element={<ManagementReporting />} />
        <Route path="/insurance/*" element={<InsuranceModule />} />
        <Route path="/health-check/*" element={<HealthCheckSyncModule />} />
        <Route path="/documents/*" element={<Documents />} />
        <Route path="/reports/*" element={<ReportsModule />} />
        <Route path="/command-center/*" element={<CommandCenter />} />
        <Route path="/queue-management/*" element={<QueueManagement />} />
        <Route path="/settings" element={<div className="text-center text-slate-500 dark:text-slate-400 p-10">Trang Cài đặt đang trong quá trình phát triển.</div>} />
      </Route>
      <Route path="*" element={<Navigate to="/staff-dashboard" replace />} />
    </Routes>
  );
};

const MainApp: React.FC = () => {
  const { isAuthenticated, user } = useSession();
  const location = useLocation();
  const fetchBrandingSettings = useSystemStore(state => state.fetchBrandingSettings);

  useEffect(() => {
    fetchBrandingSettings();
  }, [fetchBrandingSettings]);

  useEffect(() => {
    if (isAuthenticated && user) {
      socketService.connect(user.userId);
    }
  }, [isAuthenticated, user]);

  // Check if current route is a portal route
  const isPortalRoute = location.pathname.startsWith('/portal');

  return (
    <Routes>
      {/* Patient Portal - Independent routing with its own login */}
      <Route path="/portal/*" element={
        <Suspense fallback={<GlobalLoading message="Đang tải Cổng thông tin bệnh nhân..." />}>
          <Portal />
        </Suspense>
      } />

      {/* Staff System Routes */}
      <Route path="/" element={<Navigate to="/staff/login" replace />} />
      <Route path="/staff/login" element={isAuthenticated ? <Navigate to="/staff-dashboard" replace /> : <Login onLogin={() => { }} />} />

      {/* Staff wildcard - Only redirect to staff login if NOT a portal route */}
      <Route path="*" element={
        isPortalRoute ? null : (isAuthenticated ? <StaffSystem /> : <Navigate to="/staff/login" replace />)
      } />
    </Routes>
  );
}

const App: React.FC = () => {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => { e.preventDefault(); return false; };
    const handleKeyDown = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && ['+', '-', '=', '0'].includes(e.key)) e.preventDefault(); };
    document.addEventListener('contextmenu', handleContextMenu, { capture: true });
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <SessionProvider>
      <NotificationProvider>
        <MasterDataProvider>
          <CatalogProvider>
            <PdfPreviewProvider>
              <VoiceInputProvider>
                <MainApp />
                <Toaster position="top-right" richColors />
              </VoiceInputProvider>
            </PdfPreviewProvider>
          </CatalogProvider>
        </MasterDataProvider>
      </NotificationProvider>
    </SessionProvider>
  );
};

export default App;
