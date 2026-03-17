
import { Patient } from '../types/patient';
import { mockPatients } from '../modules/reception/data';
import { apiClient } from './apiClient';

// API Response Interface Mapping
export interface ApiPatientResponse {
    ticketNumber: string;
    recordNumber: string;
    name: string;
    age: string;
    sex: string;
    priority: string;
    examinationDate: string;
    endDate: string | null;
    status: string;
    diagnostic: string;
    suggestion: string | null;
}

export interface QueueStatus {
    id: string;
    name: string;
    currentNumber: number;
    currentPatientName: string;
    nextNumber: number;
    nextPatientName: string;
    waitingCount: number;
}

export interface ReceptionStatistics {
    stats: {
        received: number;
        receivedYesterday: number;
        growth: number;
        waiting: number;
        completed: number;
        booked: number;
        revenue: number;
        avgWaitTime: number;
    };
    hourlyData: Array<{
        hour: string;
        patients: number;
    }>;
}

// TOGGLE THIS TO FALSE WHEN BACKEND IS READY
const USE_MOCK_API = false;

export const receptionService = {
    // --- Patient Management ---
    getPatientList: async (filters: {
        startDate?: string,
        endDate?: string,
        roomId?: string,
        docNo?: string,
        patientName?: string,
        userId?: string
    } = {}): Promise<Patient[]> => {
        // 1. Mock Mode (Default for Frontend Demo)
        if (USE_MOCK_API) {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 800));
            return mockPatients;
        }

        // 2. Real API Mode
        try {
            console.log("Calling API: /reception/patients", filters);
            // Gọi API thật từ Backend với các tham số lọc
            const data = await apiClient.get<any>('/reception/patients', filters);

            // Map dữ liệu từ Backend sang cấu trúc Frontend
            const patientsList = Array.isArray(data) ? data : (data.data || []);

            // Map data
            return patientsList.map((item: any) => ({
                id: item.id?.toString() || '',
                recordNumber: (item.recordNumber || item.id)?.toString() || '',
                patientId: item.patientId?.toString() || '',
                name: item.name || 'Không rõ',
                dob: item.dob || '01/01/1990',
                age: item.age || 0,
                gender: item.gender || 'Khác',
                ethnicity: item.ethnic?.toString() || '1',
                occupation: item.occupation?.toString() || '',
                address: item.address || '',
                phone: item.phone || '',
                lastVisit: item.admitDate || '',
                patientType: item.objectType === 'I' ? 'Bảo hiểm' : 'Dịch vụ',
                history: [],
                examinationStatus: item.status === 'O' ? 'waiting' : (item.status === 'I' ? 'processing' : 'completed'),
                assignedDoctor: 'BS. Chỉ định',
                provinceId: item.provinceId,
                wardId: item.wardId,
                regRoom: item.roomId?.toString() || '',
                regDepartment: item.deptId || 'KKB',
                roomName: item.roomName || '',
                receptionist: item.receptionist || '',
                receptNo: item.receptNo || '0'
            }));

        } catch (error) {
            console.error("Lỗi gọi API patients:", error);
            throw error;
        }
    },

    getPatientByRecordNumber: async (identifier: string): Promise<Patient | null> => {
        if (USE_MOCK_API) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const searchKey = identifier.toString().trim();
            const found = mockPatients.find(p =>
                p.id === searchKey ||
                p.recordNumber === searchKey ||
                p.identityCard === searchKey ||
                (p.phone && p.phone.includes(searchKey))
            );
            return found || null;
        }

        try {
            const data = await apiClient.get<any>(`/reception/patients/${identifier}`);
            return data;
        } catch (error) {
            console.error("Error fetching patient:", error);
            // Fallback to mock search on error
            const searchKey = identifier.toString().trim();
            const found = mockPatients.find(p =>
                p.id === searchKey ||
                p.recordNumber === searchKey ||
                p.identityCard === searchKey ||
                (p.phone && p.phone.includes(searchKey))
            );
            return found || null;
        }
    },

    createPatient: async (patientData: Partial<Patient>): Promise<any> => {
        if (USE_MOCK_API) {
            await new Promise(resolve => setTimeout(resolve, 600));
            return {
                success: true,
                data: {
                    patientNo: `BN${Date.now()}`,
                    docNo: `REC${Date.now().toString().slice(-6)}`,
                    receptNo: 1
                }
            };
        }

        try {
            const result = await apiClient.post<any>('/reception/patients', patientData);
            return result;
        } catch (e) {
            console.error("API Error creating patient", e);
            throw e;
        }
    },

    updatePatient: async (id: string, patientData: Partial<Patient>): Promise<Patient> => {
        if (USE_MOCK_API) {
            await new Promise(resolve => setTimeout(resolve, 500));
            return { ...patientData, id } as Patient;
        }

        try {
            const result = await apiClient.put<any>(`/reception/patients/${id}`, patientData);
            return result;
        } catch (e) {
            console.error("API Error updating patient", e);
            throw e;
        }
    },

    deletePatient: async (id: string): Promise<any> => {
        if (USE_MOCK_API) {
            await new Promise(resolve => setTimeout(resolve, 500));
            return { success: true };
        }

        try {
            const result = await apiClient.delete<any>(`/reception/patients/${id}`);
            return result;
        } catch (e) {
            console.error("API Error deleting patient", e);
            throw e;
        }
    },

    // --- Queue Management ---
    getQueueStatus: async (counterId: string = 'DEFAULT'): Promise<QueueStatus> => {
        await new Promise(resolve => setTimeout(resolve, 200));
        return {
            id: counterId,
            name: 'Quầy Tiếp nhận 01',
            currentNumber: 105,
            currentPatientName: 'Nguyễn Thị Mơ',
            nextNumber: 106,
            nextPatientName: 'Trần Văn B',
            waitingCount: 12
        };
    },

    callNextPatient: async (counterId: string): Promise<QueueStatus> => {
        await new Promise(resolve => setTimeout(resolve, 400));
        return {
            id: counterId,
            name: 'Quầy Tiếp nhận 01',
            currentNumber: 106,
            currentPatientName: 'Trần Văn B',
            nextNumber: 107,
            nextPatientName: 'Lê Thị C',
            waitingCount: 11
        };
    },

    recallPatient: async (counterId: string, currentNumber: number): Promise<boolean> => {
        await new Promise(resolve => setTimeout(resolve, 200));
        console.log(`Recalling number ${currentNumber} at ${counterId}`);
        return true;
    },

    // --- BHYT (Insurance) ---
    checkInsuranceCard: async (params: { cardNo: string, patientName: string, birthYear: number }): Promise<any> => {
        try {
            const data = await apiClient.post<any>('/reception/insurance/check', params);
            return data;
        } catch (error) {
            console.error("Lỗi kiểm tra thẻ BHYT:", error);
            throw error;
        }
    },

    saveInsuranceCard: async (data: { docNo: string, patientNo: string, cardInfo: any, docFlags: any }): Promise<any> => {
        try {
            const result = await apiClient.post<any>('/reception/insurance/save', data);
            return result;
        } catch (error) {
            console.error("Lỗi lưu thẻ BHYT:", error);
            throw error;
        }
    },

    // --- Dashboard Statistics ---
    getDashboardStatistics: async (): Promise<ReceptionStatistics> => {
        try {
            const data = await apiClient.get<ReceptionStatistics>('/reception/statistics');
            return data;
        } catch (error) {
            console.error("Lỗi lấy thống kê dashboard:", error);
            throw error;
        }
    }
};
