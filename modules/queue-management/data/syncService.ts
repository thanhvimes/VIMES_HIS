
import { Patient, Room, MediaItem } from '../types';

export interface SyncPayload {
  type: 'SYNC_UPDATE';
  data: {
    patients: Patient[];
    room: Room;
    adMedia: MediaItem[];
  };
}

export interface AudioPayload {
    type: 'TRIGGER_AUDIO';
    data: {
        roomId: string;
        patientName: string;
        roomName: string;
        code: string;
    }
}

const channels: Record<string, BroadcastChannel> = {};
let centralAudioChannel: BroadcastChannel | null = null;

export const getChannel = (roomId: string) => {
  if (!channels[roomId]) {
    const channelName = `clinic_queue_realtime_${roomId}`;
    channels[roomId] = new BroadcastChannel(channelName);
  }
  return channels[roomId];
};

export const broadcastUpdate = (roomId: string, patients: Patient[], room: Room, adMedia: MediaItem[]) => {
  const channel = getChannel(roomId);
  const payload: SyncPayload = {
    type: 'SYNC_UPDATE',
    data: { patients, room, adMedia }
  };
  channel.postMessage(payload);
};

export const subscribeToUpdates = (roomId: string, callback: (data: SyncPayload['data']) => void) => {
  const channel = getChannel(roomId);
  const handler = (event: MessageEvent) => {
    if (event.data && event.data.type === 'SYNC_UPDATE') {
      callback(event.data.data);
    }
  };
  channel.addEventListener('message', handler);
  return () => {
    channel.removeEventListener('message', handler);
  };
};

const getCentralAudioChannel = () => {
    if (!centralAudioChannel) {
        centralAudioChannel = new BroadcastChannel('clinic_central_audio_bus');
    }
    return centralAudioChannel;
}

export const broadcastAudioTrigger = (roomId: string, patientName: string, roomName: string, code: string) => {
    const channel = getCentralAudioChannel();
    const payload: AudioPayload = {
        type: 'TRIGGER_AUDIO',
        data: { roomId, patientName, roomName, code }
    };
    channel.postMessage(payload);
}

export const subscribeToAudioTriggers = (callback: (data: AudioPayload['data']) => void) => {
    const channel = getCentralAudioChannel();
    const handler = (event: MessageEvent) => {
        if (event.data && event.data.type === 'TRIGGER_AUDIO') {
            callback(event.data.data);
        }
    };
    channel.addEventListener('message', handler);
    return () => channel.removeEventListener('message', handler);
}
