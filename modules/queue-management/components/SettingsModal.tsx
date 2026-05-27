
import React, { useState, useEffect } from 'react';
import { Settings, Lock, Save, X, ScanBarcode, Monitor, Globe, Building2, MonitorPlay, LayoutDashboard, ChevronRight, Volume2 } from 'lucide-react';
import { AppSettings } from '../types';
import BrandTab from './settings/BrandTab';
import KioskTab from './settings/KioskTab';
import NetworkTab from './settings/NetworkTab';
import DeviceTab from './settings/DeviceTab';
import AdsTab from './settings/AdsTab';
import VoiceTab from './settings/VoiceTab';
import { apiFetch } from '../services/apiService';


interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onPreviewScreensaver?: () => void;
  onGoToAdmin?: () => void;
  onGoToDisplay?: () => void;
}

type TabType = 'BRAND' | 'KIOSK' | 'ADS' | 'NETWORK' | 'DEVICE' | 'VOICE';


const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentSettings, onSave, onPreviewScreensaver, onGoToAdmin, onGoToDisplay }) => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tempSettings, setTempSettings] = useState<AppSettings>(currentSettings);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('BRAND');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
        // Deep copy safely to avoid reference issues
        const safeSettings: AppSettings = JSON.parse(JSON.stringify(currentSettings));
        
        setTempSettings(safeSettings);
        setPassword('');
        setIsAuthenticated(false);
        setError('');
        setActiveTab('BRAND');
    }
  }, [isOpen, currentSettings]);

  if (!isOpen) return null;

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
        window.dispatchEvent(new Event('adminAuthSuccess'));
      } else {
        setError(response.message || 'Mật khẩu không đúng!');
      }
    } catch (e: any) {
      setError('Lỗi kết nối Server: ' + e.message);
    }
  };

  const handleSave = () => {
    onSave(tempSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-fade-in relative flex flex-col h-[90vh] border border-white/50">
        {/* Header - Fixed */}
        <div className="p-6 border-b border-gray-200/50 flex justify-between items-center shrink-0 bg-white/50 backdrop-blur-md">
          <h3 className="font-bold text-2xl flex items-center gap-2 text-gray-800">
            <Settings size={28} className="text-gray-600"/> Cấu hình hệ thống
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all p-2 rounded-full">
            <X size={28} />
          </button>
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!isAuthenticated ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-6 p-8 overflow-y-auto">
              <div className="text-center">
                  <div className="w-24 h-24 bg-gray-100/80 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-500 shadow-inner">
                      <Lock size={48} />
                  </div>
                  <h4 className="text-3xl font-bold text-gray-800 mb-2">Vùng quản trị viên</h4>
                  <p className="text-gray-500 text-lg">Vui lòng nhập mật khẩu để truy cập cài đặt nâng cao</p>
              </div>
              
              <div className="max-w-xs mx-auto w-full">
                <input 
                  type="password" 
                  className="w-full px-5 py-4 border border-gray-200 rounded-xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 outline-none transition-all text-center text-2xl tracking-widest bg-white/80 shadow-inner"
                  placeholder="******"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  autoFocus
                />
                {error && <p className="text-red-500 text-sm mt-3 text-center flex items-center justify-center gap-1 animate-pulse"><X size={14}/> {error}</p>}
              </div>

              <button 
                onClick={handleLogin}
                className="w-full max-w-xs mx-auto block bg-gradient-to-r from-gray-800 to-gray-900 text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all active:scale-95 transform duration-150 text-lg"
              >
                Xác nhận
              </button>
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
                {/* Tabs Navigation */}
                <div className="flex border-b border-gray-100 px-6 pt-4 gap-2 bg-white/30 shrink-0 overflow-x-auto no-scrollbar">
                    <button 
                        onClick={() => setActiveTab('BRAND')}
                        className={`py-3 px-5 rounded-t-xl font-bold text-sm uppercase tracking-wide transition-all flex items-center gap-2 whitespace-nowrap border-t border-x border-transparent mb-[-1px] ${activeTab === 'BRAND' ? 'bg-white/80 border-gray-200 text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-white/40'}`}
                    >
                        <Building2 size={18} /> Thương hiệu
                    </button>
                    <button 
                        onClick={() => setActiveTab('KIOSK')}
                        className={`py-3 px-5 rounded-t-xl font-bold text-sm uppercase tracking-wide transition-all flex items-center gap-2 whitespace-nowrap border-t border-x border-transparent mb-[-1px] ${activeTab === 'KIOSK' ? 'bg-white/80 border-gray-200 text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-white/40'}`}
                    >
                        <Monitor size={18} /> Kiosk
                    </button>
                    <button 
                        onClick={() => setActiveTab('ADS')}
                        className={`py-3 px-5 rounded-t-xl font-bold text-sm uppercase tracking-wide transition-all flex items-center gap-2 whitespace-nowrap border-t border-x border-transparent mb-[-1px] ${activeTab === 'ADS' ? 'bg-white/80 border-gray-200 text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-white/40'}`}
                    >
                        <MonitorPlay size={18} /> Quảng cáo
                    </button>
                    <button 
                        onClick={() => setActiveTab('NETWORK')}
                        className={`py-3 px-5 rounded-t-xl font-bold text-sm uppercase tracking-wide transition-all flex items-center gap-2 whitespace-nowrap border-t border-x border-transparent mb-[-1px] ${activeTab === 'NETWORK' ? 'bg-white/80 border-gray-200 text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-white/40'}`}
                    >
                        <Globe size={18} /> Hệ thống
                    </button>
                    <button 
                        onClick={() => setActiveTab('DEVICE')}
                        className={`py-3 px-5 rounded-t-xl font-bold text-sm uppercase tracking-wide transition-all flex items-center gap-2 whitespace-nowrap border-t border-x border-transparent mb-[-1px] ${activeTab === 'DEVICE' ? 'bg-white/80 border-gray-200 text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-white/40'}`}
                    >
                        <ScanBarcode size={18} /> Thiết bị
                    </button>
                    <button 
                        onClick={() => setActiveTab('VOICE')}
                        className={`py-3 px-5 rounded-t-xl font-bold text-sm uppercase tracking-wide transition-all flex items-center gap-2 whitespace-nowrap border-t border-x border-transparent mb-[-1px] ${activeTab === 'VOICE' ? 'bg-white/80 border-gray-200 text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-white/40'}`}
                    >
                        <Volume2 size={18} /> Âm thanh
                    </button>

                </div>

                {/* Tab Content - Scrollable */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/50 p-6 md:p-8">
                    {activeTab === 'BRAND' && (
                        <BrandTab settings={tempSettings} onUpdate={setTempSettings} />
                    )}

                    {activeTab === 'KIOSK' && (
                        <KioskTab 
                            settings={tempSettings} 
                            onUpdate={setTempSettings} 
                            onPreviewScreensaver={onPreviewScreensaver}
                        />
                    )}

                    {activeTab === 'ADS' && (
                        <AdsTab 
                            settings={tempSettings} 
                            onUpdate={setTempSettings} 
                            onPreviewScreensaver={onPreviewScreensaver}
                        />
                    )}

                    {activeTab === 'NETWORK' && (
                        <NetworkTab settings={tempSettings} onUpdate={setTempSettings} />
                    )}

                    {activeTab === 'DEVICE' && (
                        <DeviceTab settings={tempSettings} onUpdate={setTempSettings} />
                    )}

                    {activeTab === 'VOICE' && (
                        <VoiceTab settings={tempSettings} onUpdate={setTempSettings} />
                    )}
                </div>


                {/* Footer Actions - Fixed Bottom */}
                <div className="p-6 border-t border-gray-200 bg-white/50 backdrop-blur-md shrink-0 z-10 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] flex flex-col gap-4">

                    <button 
                        onClick={handleSave}
                        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-5 rounded-xl font-bold hover:shadow-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95 transform duration-150 text-xl"
                    >
                        <Save size={24} /> LƯU CẤU HÌNH HỆ THỐNG
                    </button>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
