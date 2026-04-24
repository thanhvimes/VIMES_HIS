
import React, { useMemo } from 'react';
import { useQueue } from '../context/QueueContext';
import { DEPARTMENTS } from '../constants.tsx';
import { SurgeryDisplay } from './components/SurgeryDisplay';
import { StandardDisplay } from './components/StandardDisplay';

interface DisplayScreenProps {
  onBack: () => void;
}

export const DisplayScreen: React.FC<DisplayScreenProps> = ({ onBack }) => {
  const { patients, room } = useQueue();
  
  const screenType = useMemo(() => {
     if (!room || !room.id) return 'CLINIC';
     
     const roomFullId = room.id;
     const roomShortId = roomFullId.includes('-') ? roomFullId.split('-')[1] : roomFullId;

     const dept = DEPARTMENTS.find(d => 
        (room.departmentId && d.id === room.departmentId) || 
        (d.rooms && d.rooms.some(r => r.id === roomFullId || r.id === roomShortId))
     );
     
     return dept?.type || 'CLINIC';
  }, [room]);

  if (screenType === 'SURGERY') {
      return <SurgeryDisplay patients={patients || []} room={room} onBack={onBack} />;
  }

  return <StandardDisplay onBack={onBack} />;
};
