import { apiClient } from './apiClient';
import { DetailedHistoryRecord } from '../types/clinical';

export interface PortalProfile {
    id: string;
    name: string;
    gender: string;
    birthDate: string;
    relationship: string;
    // Extended fields from portal_patient_profiles
    patient_no?: string;
    phone?: string;
    id_card?: string;
    id_card_issue_date?: string;
    province_code?: string;
    district_code?: string;
    address_detail?: string;
    is_primary?: boolean;
    ethnicity?: string;
    occupation?: string;
    email?: string;
}

export interface PortalAuthResponse {
    success: boolean;
    token: string;
    profiles?: PortalProfile[];
    selectedProfile?: PortalProfile;
    patient?: PortalProfile; // Backward compatibility
    message?: string;
}

export interface BillItem {
    name: string;
    quantity: number;
    price: number;
    total: number;
}

export interface PortalInvoice {
    id: string;
    patientId?: string;
    patientName?: string;
    date: string;
    service: string;
    amount: number;
    status: 'paid' | 'unpaid';
    items?: BillItem[];
    department?: string;
    createdAt?: string;
}

export interface PortalAppointment {
    id: string;
    date: string;
    time: string;
    name: string;
    status: string;
    deptName: string;
    roomName: string;
}

export const portalService = {
    /**
     * Patient Login
     */
    /**
     * Patient Login (Password or PID)
     */
    login: async (phone: string, password?: string, patientNo?: string): Promise<PortalAuthResponse> => {
        const response = await apiClient.post<PortalAuthResponse>('/portal/login', { phone, password, patientNo }, { skipAuthRedirect: true });

        if (response.success && response.token) {
            localStorage.setItem('portal_token', response.token);
            if (response.profiles) {
                localStorage.setItem('portal_profiles', JSON.stringify(response.profiles));
            }
            if (response.selectedProfile || response.patient) {
                localStorage.setItem('portal_patient', JSON.stringify(response.selectedProfile || response.patient));
            }
        }

        return response;
    },

    /**
     * Activate Account (Linking SĐT + CCCD)
     */
    activateAccount: async (phone: string, idCard: string, password: string): Promise<{ success: boolean; message: string }> => {
        return await apiClient.post<{ success: boolean; message: string }>('/portal/activate', { phone, idCard, password });
    },

    /**
     * Logout
     */
    logout: () => {
        localStorage.removeItem('portal_token');
        localStorage.removeItem('portal_patient');
        localStorage.removeItem('portal_profiles');
    },

    /**
     * Get Current Patient Info
     */
    getCurrentPatient: () => {
        const patientJson = localStorage.getItem('portal_patient');
        return patientJson ? JSON.parse(patientJson) : null;
    },

    /**
     * Get Token
     */
    getToken: () => {
        return localStorage.getItem('portal_token');
    },

    /**
     * Get Clinical History List
     */
    /**
     * Switch Active Profile
     */
    selectProfile: (profile: PortalProfile) => {
        localStorage.setItem('portal_patient', JSON.stringify(profile));
    },

    /**
     * Get Clinical History List
     */
    getHistoryList: async (): Promise<DetailedHistoryRecord[]> => {
        const token = localStorage.getItem('portal_token');
        const patient = portalService.getCurrentPatient();
        return await apiClient.get<DetailedHistoryRecord[]>(`/portal/history?patientId=${patient?.id}`, undefined, {
            headers: { Authorization: `Bearer ${token}` }
        });
    },

    /**
     * Get Clinical History Detail
     */
    getHistoryDetail: async (visitId: string): Promise<DetailedHistoryRecord> => {
        const token = localStorage.getItem('portal_token');
        const patient = portalService.getCurrentPatient();
        return await apiClient.get<DetailedHistoryRecord>(`/portal/history/${visitId}?patientId=${patient?.id}`, undefined, {
            headers: { Authorization: `Bearer ${token}` }
        });
    },

    /**
     * Link New Profile
     */
    linkProfile: async (patientNo: string, birthDate: string, relationship: string): Promise<{ success: boolean; message: string; profile?: PortalProfile }> => {
        const token = localStorage.getItem('portal_token');
        const response = await apiClient.post<{ success: boolean; message: string; profile?: PortalProfile }>('/portal/link',
            { patientNo, birthDate, relationship },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.success && response.profile) {
            // Update local profiles list
            const currentProfiles = JSON.parse(localStorage.getItem('portal_profiles') || '[]');
            const updatedProfiles = [...currentProfiles, response.profile];
            localStorage.setItem('portal_profiles', JSON.stringify(updatedProfiles));
        }

        return response;
    },

    /**
     * Get Invoices (Billing)
     */
    getInvoices: async (): Promise<PortalInvoice[]> => {
        const token = localStorage.getItem('portal_token');
        const patient = portalService.getCurrentPatient();
        return await apiClient.get<PortalInvoice[]>(`/portal/invoices?patientId=${patient?.id}`, undefined, {
            headers: { Authorization: `Bearer ${token}` }
        });
    },

    /**
     * Get Upcoming Appointments
     */
    getUpcomingAppointments: async (): Promise<PortalAppointment[]> => {
        const token = localStorage.getItem('portal_token');
        const patient = portalService.getCurrentPatient();
        return await apiClient.get<PortalAppointment[]>(`/portal/appointments?patientId=${patient?.id}`, undefined, {
            headers: { Authorization: `Bearer ${token}` }
        });
    },

    /**
     * Get Prescription PDF
     */
    getPrescriptionPdf: async (visitId: string): Promise<string> => {
        const token = localStorage.getItem('portal_token');
        return `${apiClient.baseUrl}/portal/reports/prescription/${visitId}?token=${token}`;
    },

    /**
     * Get Result PDF (Lab/Imaging)
     */
    getResultPdf: async (orderId: string): Promise<string> => {
        const token = localStorage.getItem('portal_token');
        return `${apiClient.baseUrl}/portal/reports/result/${orderId}?token=${token}`;
    },

    /**
     * Get Image URL (PACS/DICOM/JPG)
     */
    getImageUrl: async (orderId: string): Promise<string> => {
        const token = localStorage.getItem('portal_token');
        return `${apiClient.baseUrl}/portal/images/${orderId}?token=${token}`;
    },

    /**
     * Get Signed PDF Filename (Calls emr_get_sign_id in backend)
     */
    getSignedFilename: async (type: 'P' | 'T', visitId: string, orderId: string, itemId?: string): Promise<string> => {
        const token = localStorage.getItem('portal_token');
        const patient = portalService.getCurrentPatient();
        if (!patient || !patient.id) throw new Error('Patient not selected');

        const response = await apiClient.post<{ success: boolean; filename: string }>('/portal/reports/signed-file',
            { type, patientId: patient.id, visitId, orderId, itemId },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.filename;
    },

    /**
     * Download HIS Document (Proxy)
     */
    downloadHisDocument: async (filename: string): Promise<string> => {
        const token = localStorage.getItem('portal_token');
        const response = await apiClient.post<Blob>('/portal/documents/download',
            { filename },
            {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            }
        );
        // Create a blob URL to display in PDF Viewer
        return URL.createObjectURL(response as any); // Type assertion needed unless apiClient handles blob return types specifically
    },

    /**
     * Get all linked patient profiles
     */
    getProfiles: async (): Promise<PortalProfile[]> => {
        const token = localStorage.getItem('portal_token');
        const response = await apiClient.get<{ success: boolean; profiles: PortalProfile[] }>('/portal/profiles', undefined, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.profiles || [];
    },

    /**
     * Create/Link new patient profile
     */
    createProfile: async (patient_no: string, birthdate: string, relationship: string = 'Bản thân'): Promise<{ success: boolean; message: string; profileId?: number }> => {
        const token = localStorage.getItem('portal_token');
        return await apiClient.post('/portal/profiles',
            { patient_no, birthdate, relationship },
            { headers: { Authorization: `Bearer ${token}` } }
        );
    },

    /**
     * Update patient profile extended information
     */
    updateProfile: async (profileId: string, data: Partial<PortalProfile>): Promise<{ success: boolean; message: string }> => {
        const token = localStorage.getItem('portal_token');
        return await apiClient.put(`/portal/profiles/${profileId}`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
    },

    /**
     * Delete patient profile link
     */
    deleteProfile: async (profileId: string): Promise<{ success: boolean; message: string }> => {
        const token = localStorage.getItem('portal_token');
        return await apiClient.delete(`/portal/profiles/${profileId}`, undefined, {
            headers: { Authorization: `Bearer ${token}` }
        });
    },

    /**
     * Generate QR Payment Code
     */
    generatePaymentQR: async (billId: string, amount: number, patientId?: string): Promise<{
        success: boolean;
        transactionId?: number;
        qrPayload?: string;
        qrKey?: number;
        message?: string;
    }> => {
        const token = localStorage.getItem('portal_token');
        return await apiClient.post('/portal/payment/generate-qr',
            { billId, amount, patientId },
            { headers: { Authorization: `Bearer ${token}` } }
        );
    },

    /**
     * Check Payment Status
     */
    checkPaymentStatus: async (billId: string, qrKey?: number): Promise<{ isPaid: boolean }> => {
        const token = localStorage.getItem('portal_token');
        const url = qrKey ? `/portal/payment/status/${billId}?qrKey=${qrKey}` : `/portal/payment/status/${billId}`;
        return await apiClient.get(url, undefined, {
            headers: { Authorization: `Bearer ${token}` }
        });
    },

    /**
     * Complete Payment Transaction
     */
    completePayment: async (transactionId: number, bankTransactionId?: string): Promise<{ success: boolean; message?: string }> => {
        const token = localStorage.getItem('portal_token');
        return await apiClient.post('/portal/payment/complete',
            { transactionId, bankTransactionId },
            { headers: { Authorization: `Bearer ${token}` } }
        );
    }
};
