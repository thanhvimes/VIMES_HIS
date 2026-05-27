import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Portal from './views/Home';
import Kiosk from './views/Kiosk';
import OperatorConsole from './views/DoctorConsole';
import CentralDisplay from './views/CentralDisplay';
import CounterDisplay from './views/DisplayScreen';
import AdminConfig from './views/Settings';
import SurgeryWaitingRoom from './views/SurgeryDisplay';
import { AppSettings, ViewState } from './types';

const DEFAULT_SETTINGS: AppSettings = {
  hospitalName: 'BỆNH VIỆN ĐA KHOA VIMES',
  hospitalLogo: '/logo.png',
  hotline: '1900 1000',
  scannerMode: 'QR_DEVICE',
  scanInputMode: 'CCCD',
  kioskType: 'REGISTRATION',
  registrationMode: 'FULL',
  kioskId: 'QMS-01',
  departmentCode: 'KB',
  useArea: false,
  selectedRooms: [],
  kioskName: 'Hệ thống QMS',
  ipAddress: '127.0.0.1',
  serverUrl: `http://${window.location.hostname}:3000`,
  enableDepartmentSelection: true,
  enableMultiSpecialtySelection: false,
  enabledModules: {
    register: false,
    payment: false,
    history: false,
    catalog: false,
    feedback: false,
    intro: false
  },
  printerConfig: { enabled: true, type: 'DRIVER', language: 'ESC', printerName: 'Máy in 1', ipAddress: '127.0.0.1', port: 9100, printTemplate: '' },
  adConfig: { screensaverDelaySeconds: 30, slides: [], newsTicker: [] },
  displayTemplateId: 'airport-dark',
  bankConfig: {
    bankBin: '970415',
    accountNo: '123456789',
    accountName: 'BENH VIEN VIMES'
  },
  callingTemplate: 'Mời bệnh nhân {name}, số thứ tự {ticket}, đến {counter}'
};

const QueueManagementModule: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('vimesqms_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch (e) {
      console.error('Failed to parse vimesqms_settings:', e);
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    const handleUpdate = () => {
      try {
        const saved = localStorage.getItem('vimesqms_settings');
        if (saved) {
          setSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
        }
      } catch (e) {
        console.error('Failed to parse updated vimesqms_settings:', e);
      }
    };
    window.addEventListener('settingsUpdated', handleUpdate);
    return () => window.removeEventListener('settingsUpdated', handleUpdate);
  }, []);

  const handleSaveSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('vimesqms_settings', JSON.stringify(newSettings));
  };

  const handleNavigateView = (view: ViewState) => {
    switch (view) {
      case 'KIOSK':
        navigate('kiosk');
        break;
      case 'OPERATOR':
        navigate('operator');
        break;
      case 'CENTRAL_DISPLAY':
        navigate('central');
        break;
      case 'DISPLAY':
        navigate('display');
        break;
      case 'SETTINGS_ADMIN':
        navigate('settings');
        break;
      case 'SURGERY_DISPLAY':
        navigate('surgery');
        break;
      default:
        navigate('');
        break;
    }
  };

  return (
    <Routes>
      <Route path="/" element={<Portal onNavigate={handleNavigateView} settings={settings} onLogout={() => navigate('/staff-dashboard')} />} />
      <Route path="kiosk" element={<Kiosk settings={settings} onBack={() => navigate('/queue-management')} />} />
      <Route path="operator" element={
        <OperatorConsole 
          settings={settings} 
          counterId={settings.counterId || 1} 
          counterName={settings.counterName || 'Quầy số 1'} 
          onLogout={() => navigate('/queue-management')} 
        />
      } />
      <Route path="central" element={<CentralDisplay settings={settings} onBack={() => navigate('/queue-management')} />} />
      <Route path="display" element={<CounterDisplay settings={settings} onBack={() => navigate('/queue-management')} />} />
      <Route path="settings" element={<AdminConfig settings={settings} onSave={handleSaveSettings} onBack={() => navigate('/queue-management')} />} />
      <Route path="surgery" element={<SurgeryWaitingRoom settings={settings} onBack={() => navigate('/queue-management')} />} />
      <Route path="*" element={<Navigate to="" replace />} />
    </Routes>
  );
};

export default QueueManagementModule;
