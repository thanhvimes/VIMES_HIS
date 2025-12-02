
import { apiClient } from './apiClient';

export interface InvoiceData {
    id?: string;
    receiptId: string; // Link to billing receipt
    pattern: string;   // Mẫu số
    serial: string;    // Ký hiệu
    invoiceNo?: string; // Số hóa đơn (Chỉ có khi đã phát hành)
    issueDate: string;
    buyerName: string;
    buyerTaxCode: string;
    buyerAddress: string;
    buyerPhone?: string;
    buyerEmail?: string;
    paymentMethod: string;
    items: InvoiceDetailItem[];
    totalAmount: number;
    vatRate: number;
    vatAmount: number;
    totalPayment: number;
    status: 'Draft' | 'Signed' | 'Cancelled';
    signedBy?: string; // Người ký
}

export interface InvoiceDetailItem {
    name: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    amount: number;
}

// Mock Data Store (In-memory)
let mockInvoicesStore: InvoiceData[] = [];

export const invoiceService = {
    // Lấy thông tin hóa đơn theo ID phiếu thu (Nếu đã tồn tại)
    getInvoiceByReceiptId: async (receiptId: string): Promise<InvoiceData | null> => {
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate latency
        const invoice = mockInvoicesStore.find(i => i.receiptId === receiptId);
        return invoice || null;
    },

    // Lưu hóa đơn (Tạo mới hoặc Cập nhật)
    saveInvoice: async (data: InvoiceData): Promise<InvoiceData> => {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const existingIndex = mockInvoicesStore.findIndex(i => i.id === data.id);
        
        let savedRecord: InvoiceData;

        if (existingIndex >= 0) {
            // Update
            savedRecord = { ...mockInvoicesStore[existingIndex], ...data };
            mockInvoicesStore[existingIndex] = savedRecord;
        } else {
            // Create
            savedRecord = { 
                ...data, 
                id: `EINV-${Date.now()}`, 
                status: 'Draft' 
            };
            mockInvoicesStore.push(savedRecord);
        }

        console.log(">>> [API] Saved Invoice:", savedRecord);
        return savedRecord;
    },

    // Phát hành hóa đơn (Ký số)
    releaseInvoice: async (id: string): Promise<InvoiceData> => {
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate signing time
        
        const invoiceIndex = mockInvoicesStore.findIndex(i => i.id === id);
        if (invoiceIndex === -1) throw new Error("Invoice not found");

        // Generate Invoice Number sequentially (Mock)
        const nextNo = (mockInvoicesStore.filter(i => i.status === 'Signed').length + 1).toString().padStart(7, '0');
        
        const updatedInvoice: InvoiceData = {
            ...mockInvoicesStore[invoiceIndex],
            status: 'Signed',
            invoiceNo: nextNo,
            signedBy: 'Director of ClinicMS'
        };
        
        mockInvoicesStore[invoiceIndex] = updatedInvoice;
        console.log(">>> [API] Released Invoice:", updatedInvoice);
        return updatedInvoice;
    },

    // Hủy hóa đơn
    cancelInvoice: async (id: string, reason: string): Promise<boolean> => {
        await new Promise(resolve => setTimeout(resolve, 500));
        const invoiceIndex = mockInvoicesStore.findIndex(i => i.id === id);
        if (invoiceIndex === -1) return false;

        mockInvoicesStore[invoiceIndex].status = 'Cancelled';
        console.log(`>>> [API] Cancelled Invoice ${id}. Reason: ${reason}`);
        return true;
    }
};
