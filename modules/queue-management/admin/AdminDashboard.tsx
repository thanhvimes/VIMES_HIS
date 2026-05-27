import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Monitor, Settings, LogOut, 
  ChevronLeft, ArrowRight, RefreshCcw, Bell, ArrowLeft,
  Activity, CheckCircle2, Clock, Play, MapPin, 
  MessageSquare, TrendingUp, Search, User, Filter, AlertCircle, Trash2
} from 'lucide-react';
import { apiFetch } from '../services/apiService';
import { AppSettings } from '../types';
import CallingConsole from './CallingConsole';
import ZoningSettings from './ZoningSettings';
import { getAdminPassword } from '../services/apiService';
import TestCallingTab from '../components/settings/TestCallingTab';
import { Megaphone } from 'lucide-react';

interface AdminDashboardProps {
  onBack: () => void;
  settings: AppSettings;
  initialTab?: 'CONSOLE' | 'ZONING' | 'SETTINGS';
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack, settings, initialTab = 'CONSOLE' }) => {
  const [activeTab, setActiveTab] = useState<'CONSOLE' | 'ZONING' | 'SETTINGS' | 'TEST'>(initialTab);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      const response = await apiFetch('/api/admin/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      if (response.success) {
        setIsAuthenticated(true);
        setError('');
        // Lưu vào localStorage để dùng cho các request API sau này
        localStorage.setItem('vimes_admin_password', password);
        // Refresh adminPassword in apiService (if possible)
        window.dispatchEvent(new Event('adminAuthSuccess'));
      } else {
        setError(response.message || 'Mật khẩu quản trị không đúng!');
      }
    } catch (e: any) {
      setError('Lỗi kết nối Server: ' + e.message);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="h-full w-full bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl animate-fade-in">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-800">
              <LayoutDashboard size={40} />
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-800 text-center mb-2 uppercase tracking-tight">Quản trị Hệ thống</h2>
          <p className="text-slate-500 text-center mb-8 font-medium italic">Vui lòng nhập mật khẩu quản trị viên để tiếp tục</p>
          
          <div className="space-y-6">
            <div>
              <input 
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all text-center text-3xl tracking-[1rem] placeholder:tracking-normal placeholder:text-lg"
                placeholder="••••••"
                autoFocus
              />
              {error && <p className="text-red-500 text-sm mt-3 text-center font-bold">{error}</p>}
            </div>
            
            <div className="flex flex-col gap-4">
              <button 
                onClick={handleLogin}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white py-5 rounded-2xl font-black text-xl shadow-xl transition-all active:scale-95"
              >
                ĐĂNG NHẬP
              </button>
              <button 
                onClick={onBack}
                className="w-full text-slate-400 hover:text-slate-600 font-bold py-2 transition-colors"
              >
                QUAY LẠI CỔNG CHUYỂN ĐỔI
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-slate-50 flex flex-col overflow-hidden">
      {/* Sidebar / TopNav Layout */}
      <div className="flex h-full">
        {/* Compact Sidebar */}
        <div className="w-24 bg-slate-900 flex flex-col items-center py-8 gap-8 shrink-0">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white mb-4">
            <img src={settings.hospitalLogo} alt="Logo" className="w-8 h-8 object-contain brightness-0 invert" />
          </div>
          
          <button 
            onClick={() => setActiveTab('CONSOLE')}
            className={`p-4 rounded-2xl transition-all ${activeTab === 'CONSOLE' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
            title="Bàn điều khiển gọi số"
          >
            <Users size={28} />
          </button>
          
          <button 
            onClick={() => setActiveTab('ZONING')}
            className={`p-4 rounded-2xl transition-all ${activeTab === 'ZONING' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
            title="Cấu hình phân khu"
          >
            <MapPin size={28} />
          </button>


          
          <button 
            onClick={() => setActiveTab('TEST')}
            className={`p-4 rounded-2xl transition-all ${activeTab === 'TEST' ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/40' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
            title="Test Gọi số"
          >
            <Megaphone size={28} />
          </button>

          <div className="mt-auto flex flex-col gap-6 items-center pb-4">
             <button 
              onClick={onBack}
              className="p-4 text-slate-500 hover:text-white hover:bg-blue-600 rounded-2xl transition-all shadow-lg"
              title="Quay lại Portal"
            >
              <ArrowLeft size={28} />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
             <div className="flex items-center gap-4">
                <button 
                  onClick={onBack}
                  className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all md:hidden"
                >
                   <ArrowLeft size={20} />
                </button>
                <div>
                   <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                     {activeTab === 'CONSOLE' && 'Bàn điều khiển gọi số'}
                     {activeTab === 'ZONING' && 'Cấu hình phân vùng & quầy'}
                     {activeTab === 'TEST' && 'Kiểm tra giả lập gọi số'}
                   </h1>
                   <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">{settings.hospitalName}</p>
                </div>
             </div>
             
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                   <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">A</div>
                   <div className="text-sm">
                      <p className="font-bold text-slate-700 leading-none">Quản trị viên</p>
                      <p className="text-[10px] text-slate-400 uppercase font-black">Hệ thống vimes</p>
                   </div>
                </div>
             </div>
          </header>

          {/* Dynamic Content */}
          <main className="flex-1 overflow-hidden">
            {activeTab === 'CONSOLE' && <CallingConsole settings={settings} />}
            {activeTab === 'ZONING' && <ZoningSettings settings={settings} />}
            {activeTab === 'TEST' && (
              <div className="p-8 h-full overflow-y-auto">
                <TestCallingTab settings={settings} />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

