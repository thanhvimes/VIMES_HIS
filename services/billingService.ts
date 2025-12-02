
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

export interface PaymentRequest {
    amount: number;
    orderInfo: string;
    method: 'Momo' | 'VNPAY' | string;
}

export const billingService = {
    // --- Discount Management ---
    
    createDiscount: async (data: DiscountRequest): Promise<boolean> => {
        console.log(">>> [API] Creating Discount Receipt...", data);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        return true;
    },

    getDiscountsByPatient: async (patientId: string) => {
        return []; 
    },

    // --- Payment Gateway Integration (Mock) ---

    /**
     * Tạo yêu cầu thanh toán sang cổng (Momo/VNPAY)
     * Trả về URL thanh toán hoặc QR String
     */
    createPaymentRequest: async (req: PaymentRequest): Promise<string> => {
        console.log(`>>> [API] Creating ${req.method} Payment Request:`, req);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Delay

        if (req.method === 'Momo') {
            // Return a mock deep link or QR content
            return `momo://payment?amount=${req.amount}&description=${encodeURIComponent(req.orderInfo)}`;
        } 
        
        if (req.method === 'VNPAY') {
            // Return a mock VNPAY sandbox URL
            return `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?amount=${req.amount}&info=${encodeURIComponent(req.orderInfo)}`;
        }

        return '';
    },

    /**
     * Kiểm tra trạng thái giao dịch (cho Polling)
     */
    checkTransactionStatus: async (transactionId: string): Promise<'PENDING' | 'SUCCESS' | 'FAILED'> => {
        // Mock random status
        return Math.random() > 0.7 ? 'SUCCESS' : 'PENDING';
    }
};
