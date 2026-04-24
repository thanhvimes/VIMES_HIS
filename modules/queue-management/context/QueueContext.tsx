import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Patient, PatientStatus, Room, MediaItem } from '../types';
import { DEPARTMENTS } from '../constants';
import { queueService } from '../data/queueService';
import { socketService } from '../../../services/socketService';
import { announcePatient } from '../data/audioService';
import { broadcastUpdate, subscribeToUpdates, broadcastAudioTrigger } from '../data/syncService';

export const DEFAULT_ADS = [
  {
    id: 'def-1',
    title: 'Khám Sức Khỏe Định Kỳ',
    subtitle: 'Bảo vệ sức khỏe cho bạn và gia đình',
    desc: 'Gói khám tổng quát giảm giá 20% cho người cao tuổi. Đăng ký ngay tại quầy lễ tân để được tư vấn chi tiết.',
    bg: 'bg-gradient-to-br from-blue-600 to-indigo-800',
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
  },
  {
    id: 'def-2',
    title: 'Giữ Gìn Vệ Sinh Chung',
    subtitle: 'Vì một môi trường bệnh viện sạch đẹp',
    desc: 'Vui lòng không hút thuốc, vứt rác đúng nơi quy định và giữ trật tự trong khu vực chờ khám.',
    bg: 'bg-gradient-to-br from-emerald-600 to-teal-800',
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
  },
  {
    id: 'def-3',
    title: 'Tải Ứng Dụng Đặt Lịch',
    subtitle: 'Không cần xếp hàng, lấy số tại nhà',
    desc: 'Quét mã QR tại quầy để tải ứng dụng. Đặt lịch khám, xem kết quả xét nghiệm trực tuyến tiện lợi.',
    bg: 'bg-gradient-to-br from-purple-600 to-fuchsia-800',
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
  }
];

interface AudioQueueItem {
    patientName: string;
    roomName: string;
    code: string;
}

interface QueueContextType {
  patients: Patient[];
  room: Room;
  currentPatient: Patient | null;
  adMedia: MediaItem[];
  callPatient: (patientId: string) => Promise<void>;
  completePatient: (patientId: string) => void;
  moveToConclusion: (patientId: string) => void;
  transferPatient: (patientId: string, targetRoomId: string) => void;
  skipPatient: (patientId: string) => void;
  checkInAppointment: (patientId: string) => Promise<void>;
  sendToLab: (patientId: string, labRoomId: string) => Promise<void>;
  updatePatientInfo: (patientId: string, data: Partial<Patient>) => Promise<void>;
  deletePatient: (patientId: string) => Promise<void>;
  addPatient: (isPriority?: boolean, customData?: Partial<Patient>) => void;
  togglePriority: (patientId: string) => void;
  updateRoom: (updatedRoom: Room) => void;
  uploadMedia: (files: FileList) => void;
  removeMedia: (id: string) => void;
  isAnnouncing: boolean;
  roomId: string;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

export const useQueue = () => {
  const context = useContext(QueueContext);
  if (!context) throw new Error('useQueue must be used within a QueueProvider');
  return context;
};

const EMPTY_ROOM: Room = {
    id: "",
    code: "",
    name: "Đang tải dữ liệu...",
    description: "",
    doctorName: "...",
    startTime: "07:30",
    endTime: "17:00",
    avgDuration: 15,
    maxCapacity: 50,
    isActive: true,
    enabledDefaultAds: [],
    themeId: 'hospital-light'
};

export const QueueProvider: React.FC<{ children: ReactNode; roomId: string }> = ({ children, roomId }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [room, setRoom] = useState<Room>(EMPTY_ROOM);
  const [adMedia, setAdMedia] = useState<MediaItem[]>([]);
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const [audioQueue, setAudioQueue] = useState<AudioQueueItem[]>([]);

  const fetchData = useCallback(async () => {
    if (!roomId) return;
    try {
        const [qData, rData] = await Promise.all([
            queueService.getQueue(roomId),
            queueService.getRoom(roomId)
        ]);
        if (qData) setPatients(qData);
        if (rData) setRoom(rData);
        
        // Broadcast for other tabs (Simulation of real-time if socket fails or locally)
        broadcastUpdate(roomId, qData || [], rData || EMPTY_ROOM, adMedia);
    } catch (err) {
        console.error("QueueContext: Failed to fetch data:", err);
    }
  }, [roomId, adMedia]);

  useEffect(() => {
    fetchData();
    
    // Register for Socket updates
    socketService.emit('join_room', roomId);
    
    const handleQueueUpdate = (data: any) => {
        if (data.patients) setPatients(data.patients);
        if (data.room) setRoom(data.room);
    };

    const handleAudioRequest = (data: any) => {
        setAudioQueue(prev => [...prev, {
            patientName: data.patientName,
            roomName: data.roomName,
            code: data.code
        }]);
    };

    socketService.on('queue_update', handleQueueUpdate);
    socketService.on('play_audio', handleAudioRequest);
    
    // Also listen to Local Broadcast for multi-tab support without server
    const unsubSync = subscribeToUpdates(roomId, (data) => {
        setPatients(data.patients);
        setRoom(data.room);
    });

    return () => {
        socketService.off('queue_update', handleQueueUpdate);
        socketService.off('play_audio', handleAudioRequest);
        unsubSync();
    };
  }, [roomId, fetchData]);

  // Audio Processor
  useEffect(() => {
    const processQueue = async () => {
        if (audioQueue.length === 0 || isAnnouncing || !room || !room.voiceConfig) return;
        const item = audioQueue[0];
        try {
            setIsAnnouncing(true);
            await announcePatient(item.patientName, item.roomName, item.code, room.voiceConfig);
        } catch (error) {
            console.error("Audio announcement failed", error);
        } finally {
            setAudioQueue(prev => prev.slice(1));
            setIsAnnouncing(false);
        }
    };
    processQueue();
  }, [audioQueue, isAnnouncing, room?.voiceConfig]);

  const callPatient = async (patientId: string) => {
    await queueService.updatePatientStatus(patientId, roomId, PatientStatus.SERVING);
    await queueService.callPatient(patientId, roomId, room.voiceConfig);
    // fetchData() is triggered by socket or we can do it manually
    fetchData();
    
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
        broadcastAudioTrigger(roomId, patient.name, room.name, patient.code);
    }
  };

  const updateStatus = async (patientId: string, status: PatientStatus) => {
      await queueService.updatePatientStatus(patientId, roomId, status);
      fetchData();
  };

  const completePatient = (id: string) => updateStatus(id, PatientStatus.COMPLETED);
  const moveToConclusion = (id: string) => updateStatus(id, PatientStatus.CONCLUSION);
  const skipPatient = (id: string) => updateStatus(id, PatientStatus.SKIPPED);

  const transferPatient = async (patientId: string, targetRoomId: string) => {
      await queueService.transferPatient(patientId, roomId, targetRoomId);
      fetchData();
  };

  const updatePatientInfo = async (patientId: string, data: Partial<Patient>) => {
      await queueService.updatePatientInfo(patientId, roomId, data);
      fetchData();
  };

  const deletePatient = async (patientId: string) => {
      await queueService.deletePatient(patientId, roomId);
      fetchData();
  };

  const checkInAppointment = async (patientId: string) => {
      await queueService.checkInAppointment(patientId, roomId);
      fetchData();
  };

  const sendToLab = async (patientId: string, targetRoomId: string) => {
      await updateStatus(patientId, PatientStatus.CONCLUSION);
      const patient = patients.find(p => p.id === patientId);
      if (patient) {
          const deptId = DEPARTMENTS.find(d => d.rooms.some(r => r.id === targetRoomId))?.id || '';
          await queueService.createTicket(targetRoomId, {
             departmentId: deptId,
             name: patient.name,
             phone: patient.phone,
             birthYear: patient.birthYear,
             gender: patient.gender,
             address: patient.address,
             reason: 'Chỉ định CLS',
             isPriority: patient.isPriority
          });
      }
      fetchData();
  };

  const addPatient = async (isPriority: boolean = false, customData?: Partial<Patient>) => {
      await queueService.createTicket(roomId, {
          ...customData,
          isPriority
      });
      fetchData();
  };

  const togglePriority = (patientId: string) => {
      updatePatientInfo(patientId, { isPriority: !patients.find(p => p.id === patientId)?.isPriority });
  };

  const updateRoom = async (updatedRoom: Room) => {
      await queueService.updateRoomConfig(roomId, updatedRoom);
      fetchData();
  };

  const uploadMedia = async (files: FileList) => {
      // Logic for media upload could be added here if backend supports it
      console.log("Upload media items", files);
  };

  const removeMedia = (id: string) => {
      setAdMedia(prev => prev.filter(m => m.id !== id));
  };

  const currentPatient = patients.find(p => p.status === PatientStatus.SERVING) || null;

  return (
    <QueueContext.Provider value={{ 
      patients, room, currentPatient, adMedia,
      callPatient, completePatient, moveToConclusion, transferPatient, skipPatient, 
      checkInAppointment, sendToLab, updatePatientInfo, deletePatient,
      addPatient, togglePriority,
      updateRoom, uploadMedia, removeMedia, isAnnouncing, roomId
    }}>
      {children}
    </QueueContext.Provider>
  );
};
