
import { apiClient } from '../../../services/apiClient';
import { Patient, Room, PatientStatus, RoomVoiceConfig, Department } from '../types';

export const queueService = {
  
  async getDepartments(): Promise<Department[]> {
    try {
      return await apiClient.get<Department[]>('/departments');
    } catch (e) {
      console.error("queueService getDepartments Error:", e);
      return [];
    }
  },

  async getQueue(roomId: string): Promise<Patient[]> {
    try {
      return await apiClient.get<Patient[]>(`/rooms/${roomId}/queue`);
    } catch (error) {
      console.error("queueService getQueue Error:", error);
      return [];
    }
  },

  async createTicket(roomId: string | undefined, data: any): Promise<Patient | null> {
    try {
      return await apiClient.post<Patient | null>('/kiosk/ticket', { roomId, ...data });
    } catch (error) {
      console.error("queueService createTicket Error:", error);
      return null;
    }
  },

  async updatePatientStatus(patientId: string, roomId: string, status: PatientStatus): Promise<Patient | null> {
    try {
      return await apiClient.patch<Patient | null>(`/patients/${patientId}/status`, { status, roomId });
    } catch (error) {
      console.error("queueService updatePatientStatus Error:", error);
      return null;
    }
  },

  async updatePatientInfo(patientId: string, roomId: string, data: Partial<Patient>): Promise<boolean> {
    try {
      await apiClient.patch(`/patients/${patientId}`, { roomId, ...data });
      return true;
    } catch (error) {
      return false;
    }
  },

  async deletePatient(patientId: string, roomId: string): Promise<boolean> {
    try {
      await apiClient.delete(`/patients/${patientId}`, { roomId });
      return true;
    } catch (error) {
      return false;
    }
  },
  
  async callPatient(patientId: string, roomId: string, voiceConfig?: RoomVoiceConfig): Promise<boolean> {
    try {
      await apiClient.post(`/rooms/${roomId}/call`, { patientId, voiceConfig });
      return true;
    } catch (error) {
      return false;
    }
  },

  async transferPatient(patientId: string, currentRoomId: string, targetRoomId: string): Promise<boolean> {
    try {
      await apiClient.post(`/patients/${patientId}/transfer`, { fromRoomId: currentRoomId, toRoomId: targetRoomId });
      return true;
    } catch (error) {
      return false;
    }
  },

  async checkInAppointment(patientId: string, roomId: string): Promise<boolean> {
    try {
      await apiClient.post(`/patients/${patientId}/checkin`, { roomId });
      return true;
    } catch (error) {
      return false;
    }
  },

  async getRoom(roomId: string): Promise<Room | null> {
    try {
      return await apiClient.get<Room>(`/rooms/${roomId}`);
    } catch (e) {
      return null;
    }
  },

  async updateRoomConfig(roomId: string, roomData: Partial<Room>): Promise<Room | null> {
    try {
      return await apiClient.patch<Room>(`/rooms/${roomId}`, roomData);
    } catch (error) {
      return null;
    }
  },

  async getRoomsSummary(roomIds: string[]): Promise<any[]> {
    try {
      return await apiClient.post<any[]>('/rooms/summary', { roomIds });
    } catch (error) {
      return [];
    }
  },

  async uploadFile(file: File): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.upload<{ url: string }>('/upload', formData);
      return res.url;
    } catch (error) {
      return null;
    }
  }
};
