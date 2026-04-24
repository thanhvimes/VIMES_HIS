
import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueueProvider } from './context/QueueContext';
import { 
  Home, 
  DoctorConsole, 
  DisplayScreen, 
  CentralDisplay, 
  Settings, 
  Kiosk, 
  TvConnect, 
  AppointmentManager,
  SurgeryDisplay
} from './views';

/**
 * Queue Management Module
 * Main entry point with Routing and Provider
 */
const QueueModule: React.FC = () => {
  const [roomId, setRoomId] = useState<string>("KKB-P101");

  return (
    <QueueProvider roomId={roomId}>
      <Routes>
        <Route index element={<Home onSelectRoom={setRoomId} currentRoomId={roomId} />} />
        <Route path="doctor" element={<DoctorConsole onBack={() => window.history.back()} />} />
        <Route path="display" element={<DisplayScreen onBack={() => window.history.back()} />} />
        <Route path="central-display" element={<CentralDisplay onBack={() => window.history.back()} />} />
        <Route path="surgery-display" element={<SurgeryDisplay onBack={() => window.history.back()} />} />
        <Route path="settings" element={<Settings onBack={() => window.history.back()} onRoomChange={setRoomId} />} />
        <Route path="kiosk" element={<Kiosk onBack={() => window.history.back()} />} />
        <Route path="tv-connect" element={<TvConnect onBack={() => window.history.back()} onConfigReceived={setRoomId} />} />
        <Route path="appointments" element={<AppointmentManager onBack={() => window.history.back()} />} />
        <Route path="*" element={<Navigate to="" replace />} />
      </Routes>
    </QueueProvider>
  );
};

export default QueueModule;
