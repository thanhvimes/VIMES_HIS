
import { apiClient } from './apiClient';

// Interface for BHYT Card Response
export interface InsuranceCardInfo {
    cardNumber: string;
    fullName: string;
    dob: string;
    gender: string;
    address: string;
    kcbBanDau: string; // Mã KCB Ban đầu
    dateStart: string;
    dateEnd: string;
    fiveYearMoment: string; // Thời điểm đủ 5 năm liên tục
    benefitRate: number; // Mức hưởng (80, 95, 100)
    areaCode: string; // K1, K2, K3
    isValid: boolean;
    message: string;
}

export interface InsuranceClaim {
    id: string;
    patientName: string;
    cardNumber: string;
    visitDate: string;
    totalAmount: number;
    insuranceAmount: number;
    patientAmount: number;
    status: 'Ready' | 'Sent' | 'Accepted' | 'Rejected' | 'Error';
    xmlStatus: 'Pending' | 'Generated';
    errorMessage?: string;
}

// --- NEW: Insurance Document Interface ---
export type DocumentType = 'GiayChuyenVien' | 'GiayRaVien' | 'GiayNghiBHXH' | 'GiayChungSinh';

export interface InsuranceDocument {
    id: string; // Mã Key
    patientName: string;
    yearOfBirth: number;
    gender: 'Nam' | 'Nữ';
    recordNumber: string; // Mã hồ sơ điều trị
    
    docTypeCode: DocumentType; // Mã loại phiếu
    docTypeName: string; // Tên hiển thị loại phiếu

    createdTime: string; // Ngày giờ tạo
    sentTime?: string; // Ngày giờ gửi
    transactionId?: string; // Mã giao dịch
    
    sendStatus: 'Unsent' | 'Sending' | 'Success' | 'Error';
    signatureStatus: 'Unsigned' | 'Signed';
    
    xmlData: string; // Dữ liệu XML
    errorMessage?: string;
}

export const insuranceService = {
    /**
     * Check thẻ BHYT Online (Giả lập gọi cổng giám định)
     */
    checkCardOnline: async (cardNumber: string, name: string): Promise<InsuranceCardInfo> => {
        // Trong thực tế, đây sẽ là API gọi sang cổng BHYT hoặc GW của BV
        return new Promise((resolve) => {
            setTimeout(() => {
                // Logic giả lập dựa trên mã thẻ
                const benefitCode = parseInt(cardNumber.substring(2, 3)) || 4;
                let rate = 80;
                if (benefitCode === 1 || benefitCode === 2) rate = 100;
                if (benefitCode === 3) rate = 95;

                const isValid = cardNumber.length === 15;

                resolve({
                    cardNumber: cardNumber.toUpperCase(),
                    fullName: name.toUpperCase() || "NGUYỄN VĂN TEST",
                    dob: "01/01/1990",
                    gender: "Nam",
                    address: "123 Giả Lập, Hà Nội",
                    kcbBanDau: "01-001 (BV Bạch Mai)",
                    dateStart: "01/01/2023",
                    dateEnd: "31/12/2023",
                    fiveYearMoment: "01/06/2020",
                    benefitRate: rate,
                    areaCode: "K1",
                    isValid: isValid,
                    message: isValid ? "Thẻ hợp lệ. Đang tham gia BHYT." : "Thẻ không tìm thấy trên cổng hoặc sai định dạng."
                });
            }, 1500);
        });
    },

    /**
     * Tính toán chi phí đồng chi trả
     */
    calculateCopayment: (totalCost: number, rate: number, isRightRoute: boolean, isEmergency: boolean, baseSalary: number = 1800000) => {
        // Logic BHYT Việt Nam cơ bản
        
        // 1. Nếu là cấp cứu => Coi như đúng tuyến
        const effectiveRoute = isEmergency ? true : isRightRoute;

        let insurancePay = 0;
        let patientPay = 0;

        if (!effectiveRoute) {
             insurancePay = 0;
             patientPay = totalCost;
        } else {
             // Đúng tuyến
             // Check tổng chi phí < 15% lương cơ sở (Hiện tại 1.8tr * 15% = 270k)
             if (totalCost < (baseSalary * 0.15)) {
                 insurancePay = totalCost;
                 patientPay = 0;
             } else {
                 insurancePay = totalCost * (rate / 100);
                 patientPay = totalCost - insurancePay;
             }
        }

        return {
            total: totalCost,
            insurancePay,
            patientPay,
            isExempt: totalCost < (baseSalary * 0.15) // Miễn cùng chi trả do thấp hơn 15% lương cơ sở
        };
    },

    /**
     * Lấy danh sách hồ sơ chờ đẩy cổng (Dùng cho view XML Export)
     */
    getClaimsList: async (): Promise<InsuranceClaim[]> => {
        // Mock data cho chức năng Export XML 4210
        const mockClaims: InsuranceClaim[] = [
            { id: 'CLM001', patientName: 'Nguyễn Văn An', cardNumber: 'GD4790215567890', visitDate: '2023-11-27', totalAmount: 1500000, insuranceAmount: 1200000, patientAmount: 300000, status: 'Accepted', xmlStatus: 'Generated' },
            { id: 'CLM002', patientName: 'Trần Thị Bích', cardNumber: 'DN4790215567891', visitDate: '2023-11-27', totalAmount: 850000, insuranceAmount: 680000, patientAmount: 170000, status: 'Sent', xmlStatus: 'Generated' },
        ];
        return new Promise(resolve => setTimeout(() => resolve(mockClaims), 800));
    },

    /**
     * Sinh file XML 130/4210 (Giả lập nội dung XML)
     */
    generateXML4210: (claimId: string) => {
        const xmlContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<CHECKOUT>
    <THONGTINBENHNHAN>
        <MA_BN>${claimId}</MA_BN>
        <HO_TEN>NGUYEN VAN A</HO_TEN>
        <TONG_CHI>1500000</TONG_CHI>
    </THONGTINBENHNHAN>
</CHECKOUT>`;
        return xmlContent;
    },

    /**
     * Gửi hồ sơ giám định 4210
     */
    sendToPortal: async (claimIds: string[]): Promise<boolean> => {
        return new Promise(resolve => setTimeout(() => resolve(true), 2000));
    },

    // --- NEW: Document Submission (REAL API) ---
    
    /**
     * Lấy danh sách giấy tờ từ Backend
     */
    getDocumentsList: async (): Promise<InsuranceDocument[]> => {
        try {
            return await apiClient.get<InsuranceDocument[]>('/insurance/documents');
        } catch (error) {
            console.warn("API Error (getDocumentsList), using mock data", error);
            // Fallback mock data if backend not ready
            return [
                {
                    id: 'DOC001', patientName: 'Nguyễn Văn An', yearOfBirth: 1985, gender: 'Nam', recordNumber: '2301001',
                    docTypeCode: 'GiayChuyenVien', docTypeName: 'Giấy chuyển tuyến',
                    createdTime: '2023-11-28 08:30', sendStatus: 'Unsent', signatureStatus: 'Signed',
                    xmlData: '<GiayChuyenVien>...</GiayChuyenVien>'
                }
            ];
        }
    },

    /**
     * Gửi giấy tờ lên cổng (API)
     */
    sendDocumentsToPortal: async (docIds: string[]): Promise<string[]> => {
        try {
            // Trả về danh sách ID bị lỗi (nếu có)
            return await apiClient.post<string[]>('/insurance/documents/send', { docIds });
        } catch (error) {
            console.error("API Error (sendDocumentsToPortal)", error);
            throw error;
        }
    },
    
    /**
     * Ký số giấy tờ (API)
     */
    signDocuments: async (docIds: string[]): Promise<boolean> => {
         try {
             await apiClient.post('/insurance/documents/sign', { docIds });
             return true;
         } catch (error) {
             console.error("API Error (signDocuments)", error);
             return false;
         }
    }
};
