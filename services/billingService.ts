
import { apiClient } from './apiClient';

export interface DiscountRequest {
    patientId: string;
    recordId: string;
    amount: number;
    reason: string;
    authorizer: string; // Người duyệt/Người ký
    date: string;
    note?: string;
}

export const billingService = {
    // --- Discount Management ---
    
    /**
     * Tạo phiếu miễn giảm mới
     * @param data Thông tin phiếu miễn giảm
     */
    createDiscount: async (data: DiscountRequest): Promise<boolean> => {
        console.log(">>> [API] Creating Discount Receipt...", data);
        
        // Thực tế: Gọi API Backend
        // return await apiClient.post('/billing/discounts', data);

        // Giả lập delay mạng
        await new Promise(resolve => setTimeout(resolve, 800));
        
        return true;
    },

    /**
     * Lấy danh sách lịch sử miễn giảm của bệnh nhân
     */
    getDiscountsByPatient: async (patientId: string) => {
        // return await apiClient.get(`/billing/patients/${patientId}/discounts`);
        return []; // Mock empty
    }
};
