import { apiClient } from './apiClient';

export interface OutpatientKPI {
    totalReception: number;
    waitingCount: number;
    completedCount: number;
    revenueEst: number;
    normalReception: number;
    serviceReception: number;
    highestWaitingDept: string;
    completionRate: number;
}

export interface OutpatientFlow {
    time: string;
    reception: number;
    start: number;
    finish: number;
}

export interface RoomStatus {
    id: string | number;
    name: string;
    type: 'Normal' | 'Service' | 'VIP';
    status: number;
    doctor: string;
    waiting: number;
    completed: number;
}

export interface QueueStatus {
    name: string;
    waiting: number;
    processing: number;
    doctorCount: number;
    avgWait: number;
}

export interface BedCapacity {
    dept_name: string;
    dept_code: string;
    total_beds: number;
    occupied_beds: number;
    occupancy_rate: number;
}

export interface ORStatus {
    or_id: string;
    or_name: string;
    status: 'IN_USE' | 'CLEANING' | 'AVAILABLE';
    current_procedure?: string;
    surgeon_name?: string;
}

export interface WaitTime {
    stage: string;
    avg_minutes: number;
}

class CommandCenterService {
    async getOutpatientKPI(params?: { fromDate?: string; toDate?: string; deptCode?: string }): Promise<OutpatientKPI> {
        return apiClient.get<OutpatientKPI>('/command-center/outpatient/kpi', params);
    }

    async getOutpatientFlow(params?: { date?: string; deptCode?: string }): Promise<OutpatientFlow[]> {
        return apiClient.get<OutpatientFlow[]>('/command-center/outpatient/flow', params);
    }

    async getRoomStatus(params?: { deptCode?: string }): Promise<RoomStatus[]> {
        return apiClient.get<RoomStatus[]>('/command-center/outpatient/rooms', params);
    }

    async getQueueStatus(): Promise<QueueStatus[]> {
        return apiClient.get<QueueStatus[]>('/command-center/outpatient/queues');
    }

    async getBedCapacity(): Promise<BedCapacity[]> {
        return apiClient.get<BedCapacity[]>('/command-center/general/beds');
    }

    async getORStatus(): Promise<ORStatus[]> {
        return apiClient.get<ORStatus[]>('/command-center/general/or');
    }

    async getAvgWaitTimes(): Promise<WaitTime[]> {
        return apiClient.get<WaitTime[]>('/command-center/general/waits');
    }
}

export const commandCenterService = new CommandCenterService();
