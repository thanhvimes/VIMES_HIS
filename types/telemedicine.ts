
export type TeleStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled';

export interface TeleConsultationRequest {
    id: string;
    patientId: string;
    patientName: string;
    age: number;
    gender: string;
    reason: string; // Lý do hội chẩn
    specialty: string; // Chuyên khoa
    requester: string; // Bác sĩ yêu cầu
    hospital: string; // Bệnh viện yêu cầu
    consultant?: string; // Bác sĩ chuyên gia (được mời)
    scheduledTime: string; // Thời gian dự kiến
    status: TeleStatus;
    documents: string[]; // Links to docs
}

export interface LiveSession {
    id: string;
    requestId: string;
    participants: {
        id: string;
        name: string;
        role: 'host' | 'guest' | 'viewer';
        isMuted: boolean;
        isVideoOff: boolean;
    }[];
    chatHistory: {
        sender: string;
        message: string;
        time: string;
    }[];
}
