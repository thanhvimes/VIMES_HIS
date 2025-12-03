
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
    hfe_status: string;          // 'O': Open/Draft, 'P': Posted/Signed, 'C': Cancelled
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

export interface RevenueStat {
    label: string;
    date: string;
    amount: number;
    count: number;
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
     * Lấy danh sách hóa đơn thuộc về một bảng kê cụ thể
     */
    getInvoicesBySummaryId: async (orderId: number): Promise<InvoiceDetailDB[]> => {
        await new Promise(resolve => setTimeout(resolve, 300));
        return mockLines.filter(l => l.hfe_orderid === orderId);
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
     * Hủy bảng kê: Cập nhật trạng thái bảng kê và giải phóng các hóa đơn con
     */
    cancelSummarySheet: async (orderId: number): Promise<boolean> => {
        await new Promise(resolve => setTimeout(resolve, 600));
        
        // 1. Update Header status
        const headerIdx = mockHeaders.findIndex(h => h.hfe_orderid === orderId);
        if (headerIdx !== -1) {
            mockHeaders[headerIdx].hfe_status = 'C'; // Cancelled
        }

        // 2. Release lines (Reset hfe_orderid to 0 so they can be grouped again)
        mockLines = mockLines.map(l => {
            if (l.hfe_orderid === orderId) {
                return { ...l, hfe_orderid: 0 };
            }
            return l;
        });

        return true;
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
            hfe_number: eligibleLines.length, 
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
     */
    createElectronicInvoiceByDoc: async (orderId: number, docNo: number, postedBy: string, invoiceNo: number): Promise<number> => {
        console.log(`Calling Procedure: hms_electronicline_insert_doc_byinvoice(${orderId}, ${docNo}, '${postedBy}', ${invoiceNo})`);
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Logic giả lập: Tạo dòng mới trong mockLines hoặc cập nhật nếu tồn tại
        const existingIndex = mockLines.findIndex(l => l.hfe_docno === docNo && l.hfe_invoiceno === invoiceNo);
        
        if (existingIndex !== -1) {
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
            hfe_patientno: 0,
            hfe_cusname: 'Mới tạo từ Doc',
            hfe_cusaddress: '', 
            hfe_amount: 0,
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

    // --- REPORTING ---
    getRevenueStats: async (period: 'day' | 'month', year: number, month?: number): Promise<RevenueStat[]> => {
        await new Promise(resolve => setTimeout(resolve, 800)); // Sim latency

        const stats: RevenueStat[] = [];
        
        if (period === 'day' && month) {
            // Generate daily stats for a specific month
            const daysInMonth = new Date(year, month, 0).getDate();
            for (let i = 1; i <= daysInMonth; i++) {
                const date = new Date(year, month - 1, i);
                // Random logic to simulate fluctuation
                const hasRevenue = Math.random() > 0.2; 
                const count = hasRevenue ? Math.floor(Math.random() * 50) + 5 : 0;
                const amount = hasRevenue ? count * (Math.random() * 500000 + 100000) : 0;
                
                stats.push({
                    label: `${i.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}`,
                    date: date.toISOString(),
                    count: count,
                    amount: Math.round(amount)
                });
            }
        } else {
            // Generate monthly stats for a year
            for (let i = 1; i <= 12; i++) {
                const count = Math.floor(Math.random() * 500) + 50;
                const amount = count * (Math.random() * 800000 + 200000);
                
                stats.push({
                    label: `Tháng ${i}`,
                    date: new Date(year, i - 1, 1).toISOString(),
                    count: count,
                    amount: Math.round(amount)
                });
            }
        }
        return stats;
    },

    // --- EXPORT & PRINT MOCK ---
    exportToExcel: async (data: any[], fileName: string) => {
        console.log("Exporting Excel:", data);
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (!data || data.length === 0) {
            alert("Không có dữ liệu để xuất");
            return;
        }

        // Extract headers from the first object
        const headers = Object.keys(data[0]);

        // Create CSV rows with proper escaping for commas
        const csvRows = data.map(row => 
            headers.map(fieldName => {
                const val = row[fieldName] !== null && row[fieldName] !== undefined ? String(row[fieldName]) : '';
                // Wrap in quotes if contains comma or quote, escape existing quotes
                const escaped = val.replace(/"/g, '""');
                return `"${escaped}"`;
            }).join(',')
        );

        // Add BOM for UTF-8 (Fix for Excel Vietnamese font)
        const BOM = "\uFEFF";
        const csvContent = BOM + headers.join(',') + '\n' + csvRows.join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    getPrintUrl: (id: number | string) => {
        return `https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf?id=${id}`;
    }
};
