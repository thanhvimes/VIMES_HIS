
import { apiClient } from './apiClient';

// --- DATABASE MAPPING TYPES ---

// Map to table: hms_fee_electronicline (Chi tiết hóa đơn)
export interface InvoiceDetailDB {
    hfe_key: number;             // Primary Key
    hfe_orderid: number;         // FK linking to Summary Header
    hfe_patientno: number;
    hfe_docno?: number;          // Document Number (Hồ sơ)
    hfe_invoiceno?: number;      // Invoice Number (Hóa đơn nội bộ)
    hfe_cusname: string;
    hfe_cusaddress: string;
    hfe_custaxcode?: string;
    hfe_amount: number;          // Thành tiền
    hfe_vatamount: number;       // Tiền thuế
    hfe_patpaid: number;         // Bệnh nhân trả
    hfe_status: string;          // 'O': Open, 'P': Posted/Signed, 'C': Cancelled
    hfe_patter: string;          // Mẫu số
    hfe_serial: string;          // Ký hiệu
    hfe_invoice_number: string;  // Số hóa đơn
    hfe_invoice_date: string;    // Ngày hóa đơn
    hfe_createdby: string;       // Người tạo
    hfe_link_download_pdf?: string;
}

// Map to table: hms_fee_electronic (Phiếu tổng hợp)
export interface SummarySheetDB {
    hfe_orderid: number;         // Primary Key
    hfe_date: string;
    hfe_desc: string;            // Diễn giải
    hfe_amount: number;          // Tổng tiền
    hfe_number: number;          // Số lượng hóa đơn con
    hfe_status: string;
    hfe_createdby: string;
    hfe_createddate: string;
}

// --- NEW TYPES FOR ELECTRONIC INVOICE MODAL ---
export interface InvoiceDetailItem {
    name: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    amount: number;
}

export interface InvoiceData {
    id?: string;
    pattern: string;
    serial: string;
    invoiceNo: string;
    issueDate: string;
    paymentMethod: string;
    status: 'Draft' | 'Signed' | 'Cancelled';
    vatRate: number;
    vatAmount: number;
    receiptId?: string;
    buyerName: string;
    buyerTaxCode: string;
    buyerAddress: string;
    buyerPhone: string;
    totalAmount: number;
    totalPayment: number;
    items: InvoiceDetailItem[];
    
    // Fields for DB Procedure
    orderId?: number;
    docNo?: number;
    internalInvoiceNo?: number;
}

// Mock Data Stores
let mockLines: InvoiceDetailDB[] = Array.from({ length: 20 }).map((_, i) => ({
    hfe_key: 1000 + i,
    hfe_orderid: i < 5 ? 5001 : 0, // 5 item đầu đã thuộc về phiếu tổng 5001
    hfe_patientno: 21000 + i,
    hfe_docno: 36000 + i,
    hfe_invoiceno: 7000 + i,
    hfe_cusname: ['Nguyễn Văn A', 'Trần Thị B', 'Lê Hoàng C', 'Phạm Thị D'][i % 4],
    hfe_cusaddress: 'Hà Nội',
    hfe_amount: (i + 1) * 150000,
    hfe_vatamount: 0,
    hfe_patpaid: (i + 1) * 150000,
    hfe_status: i % 5 === 0 ? 'P' : 'O', // P=Posted, O=Open
    hfe_patter: '1/001',
    hfe_serial: 'C23TKA',
    hfe_invoice_number: i % 5 === 0 ? `0000${i}` : '',
    hfe_invoice_date: new Date().toISOString(),
    hfe_createdby: 'admin'
}));

let mockHeaders: SummarySheetDB[] = [
    {
        hfe_orderid: 5001,
        hfe_date: new Date().toISOString(),
        hfe_desc: 'Bảng kê hóa đơn ngày 01/12/2023',
        hfe_amount: 1500000,
        hfe_number: 5,
        hfe_status: 'P',
        hfe_createdby: 'admin',
        hfe_createddate: new Date().toISOString()
    }
];

// Store for E-Invoice Modal Data (Simulating DB)
let mockInvoiceDataStore: InvoiceData[] = [];

export const invoiceService = {
    // --- INVOICE LINES (hms_fee_electronicline) ---

    /**
     * Lấy danh sách hóa đơn chi tiết
     * @param status Lọc theo trạng thái (O, P)
     */
    getInvoiceLines: async (status?: string): Promise<InvoiceDetailDB[]> => {
        await new Promise(resolve => setTimeout(resolve, 500));
        let data = [...mockLines];
        if (status && status !== 'All') {
            data = data.filter(item => item.hfe_status === status);
        }
        return data.sort((a, b) => b.hfe_key - a.hfe_key);
    },

    /**
     * Tìm dòng chi tiết hóa đơn theo InvoiceNo (nội bộ) hoặc DocNo
     */
    getInvoiceLineByRef: async (docNo: number, invoiceNo: number): Promise<InvoiceDetailDB | null> => {
        await new Promise(resolve => setTimeout(resolve, 300));
        return mockLines.find(l => l.hfe_docno === docNo || l.hfe_invoiceno === invoiceNo) || null;
    },

    /**
     * Lưu/Cập nhật thông tin hóa đơn (Ví dụ: Ký số xong cập nhật lại số HĐ)
     */
    updateInvoiceLine: async (key: number, data: Partial<InvoiceDetailDB>): Promise<boolean> => {
        await new Promise(resolve => setTimeout(resolve, 500));
        const idx = mockLines.findIndex(i => i.hfe_key === key);
        if (idx !== -1) {
            mockLines[idx] = { ...mockLines[idx], ...data };
            return true;
        }
        return false;
    },

    // --- SUMMARY SHEETS (hms_fee_electronic) ---

    /**
     * Lấy danh sách phiếu tổng hợp
     */
    getSummarySheets: async (): Promise<SummarySheetDB[]> => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return [...mockHeaders].sort((a, b) => b.hfe_orderid - a.hfe_orderid);
    },

    /**
     * Tạo phiếu tổng hợp mới từ danh sách các hóa đơn lẻ (Old Logic - Deprecated or used for manual selection)
     * Nghệp vụ: Insert vào hms_fee_electronic -> Update hfe_orderid trong hms_fee_electronicline
     */
    createSummarySheet: async (description: string, selectedLineKeys: number[]): Promise<SummarySheetDB> => {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // 1. Calculate totals from selected lines
        const selectedLines = mockLines.filter(l => selectedLineKeys.includes(l.hfe_key));
        const totalAmount = selectedLines.reduce((sum, l) => sum + l.hfe_amount, 0);
        
        // 2. Create new Header
        const newOrderId = Math.max(...mockHeaders.map(h => h.hfe_orderid), 5000) + 1;
        const newSheet: SummarySheetDB = {
            hfe_orderid: newOrderId,
            hfe_date: new Date().toISOString(),
            hfe_desc: description,
            hfe_amount: totalAmount,
            hfe_number: selectedLines.length,
            hfe_status: 'O', // Open
            hfe_createdby: 'current_user',
            hfe_createddate: new Date().toISOString()
        };
        mockHeaders.unshift(newSheet);

        // 3. Update Foreign Keys in Lines
        mockLines = mockLines.map(line => {
            if (selectedLineKeys.includes(line.hfe_key)) {
                return { ...line, hfe_orderid: newOrderId };
            }
            return line;
        });

        return newSheet;
    },

    /**
     * API: hms_electronic_create(p_createdby, p_fromdate, p_todate)
     * Tạo bảng kê tự động dựa trên khoảng thời gian và người tạo
     */
    createElectronicSummary: async (createdBy: string, fromDate: string, toDate: string): Promise<SummarySheetDB> => {
        console.log(`Calling API: hms_electronic_create('${createdBy}', '${fromDate}', '${toDate}')`);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Logic giả lập: Tìm các hóa đơn trong khoảng thời gian chưa có bảng kê
        // Thực tế DB sẽ làm việc này
        const startDate = new Date(fromDate);
        const endDate = new Date(toDate);
        
        const eligibleLines = mockLines.filter(l => {
            const invDate = new Date(l.hfe_invoice_date);
            return l.hfe_orderid === 0 && // Chưa thuộc bảng kê nào
                   invDate >= startDate && 
                   invDate <= endDate;
        });

        // Tạo Header mới
        const newOrderId = Math.max(...mockHeaders.map(h => h.hfe_orderid), 5000) + 1;
        const totalAmount = eligibleLines.reduce((sum, l) => sum + l.hfe_amount, 0);

        const newSheet: SummarySheetDB = {
            hfe_orderid: newOrderId,
            hfe_date: new Date().toISOString(),
            hfe_desc: `Tổng hợp HĐĐT từ ${new Date(fromDate).toLocaleDateString('vi-VN')} đến ${new Date(toDate).toLocaleDateString('vi-VN')}`,
            hfe_amount: totalAmount,
            hfe_number: eligibleLines.length, // Có thể là 0 nếu không tìm thấy, giống behavior thực tế
            hfe_status: 'O',
            hfe_createdby: createdBy,
            hfe_createddate: new Date().toISOString()
        };

        mockHeaders.unshift(newSheet);

        // Update lines giả lập
        eligibleLines.forEach(l => {
            const idx = mockLines.findIndex(ml => ml.hfe_key === l.hfe_key);
            if (idx !== -1) mockLines[idx].hfe_orderid = newOrderId;
        });

        return newSheet;
    },

    /**
     * API: hms_electronicline_insert_doc_byinvoice
     * @param orderId p_orderid integer
     * @param docNo p_docno integer
     * @param postedBy p_postedby text
     * @param invoiceNo p_invoiceno integer
     * @returns integer (hfe_key or result code)
     */
    createElectronicInvoiceByDoc: async (orderId: number, docNo: number, postedBy: string, invoiceNo: number): Promise<number> => {
        console.log(`Calling Procedure: hms_electronicline_insert_doc_byinvoice(${orderId}, ${docNo}, '${postedBy}', ${invoiceNo})`);
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Logic giả lập: Tạo dòng mới trong mockLines hoặc cập nhật nếu tồn tại
        const existingIndex = mockLines.findIndex(l => l.hfe_docno === docNo && l.hfe_invoiceno === invoiceNo);
        
        if (existingIndex !== -1) {
            // Update existing (simulated behavior, DB logic might differ)
            mockLines[existingIndex].hfe_status = 'P'; // Assume 'Posted' implies saving/ready
            return mockLines[existingIndex].hfe_key;
        }

        // Insert New
        const newKey = Math.max(...mockLines.map(l => l.hfe_key), 1000) + 1;
        const newLine: InvoiceDetailDB = {
            hfe_key: newKey,
            hfe_orderid: orderId,
            hfe_docno: docNo,
            hfe_invoiceno: invoiceNo,
            hfe_patientno: 0, // DB would fetch this
            hfe_cusname: 'Mới tạo từ Doc', // DB would fetch this
            hfe_cusaddress: '', 
            hfe_amount: 0, // DB would calc this
            hfe_vatamount: 0,
            hfe_patpaid: 0,
            hfe_status: 'O',
            hfe_patter: '1/001',
            hfe_serial: 'C23TKA',
            hfe_invoice_number: '',
            hfe_invoice_date: new Date().toISOString(),
            hfe_createdby: postedBy
        };
        
        mockLines.unshift(newLine);
        return newKey;
    },


    // --- E-INVOICE MANAGEMENT (NEW METHODS) ---
    // Note: Updated to handle receiptId which we treat as invoiceNo internal reference
    getInvoiceByReceiptId: async (receiptId: string): Promise<InvoiceData | null> => {
        await new Promise(resolve => setTimeout(resolve, 400));
        return mockInvoiceDataStore.find(inv => inv.receiptId === receiptId) || null;
    },

    saveInvoice: async (data: InvoiceData): Promise<InvoiceData> => {
        await new Promise(resolve => setTimeout(resolve, 600));
        if (data.id) {
            const index = mockInvoiceDataStore.findIndex(inv => inv.id === data.id);
            if (index !== -1) {
                mockInvoiceDataStore[index] = data;
                return data;
            }
        }
        // Create new
        const newInvoice = { ...data, id: `EINV-${Date.now()}` };
        mockInvoiceDataStore.push(newInvoice);
        return newInvoice;
    },

    releaseInvoice: async (id: string): Promise<InvoiceData> => {
        await new Promise(resolve => setTimeout(resolve, 800));
        const index = mockInvoiceDataStore.findIndex(inv => inv.id === id);
        if (index !== -1) {
            const updated = {
                ...mockInvoiceDataStore[index],
                status: 'Signed' as const,
                invoiceNo: String(Math.floor(Math.random() * 1000000)).padStart(7, '0')
            };
            mockInvoiceDataStore[index] = updated;
            return updated;
        }
        throw new Error("Invoice not found");
    },

    // --- EXPORT & PRINT MOCK ---
    exportToExcel: async (data: any[], fileName: string) => {
        console.log("Exporting Excel:", data);
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Simulate download
        const csvContent = "data:text/csv;charset=utf-8,Key,Name,Amount\n" + data.map(r => Object.values(r).join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    getPrintUrl: (id: number | string) => {
        return `https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf?id=${id}`;
    }
};
