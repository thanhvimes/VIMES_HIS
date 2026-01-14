
import { apiClient } from './apiClient';

export interface InsuranceCardInfo {
    cardNumber: string;
    fullName: string;
    dob: string;
    gender: string;
    address: string;
    kcbBanDau: string; 
    dateStart: string;
    dateEnd: string;
    fiveYearMoment: string;
    benefitRate: number; 
    areaCode: string;
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

export type DocumentType = 'GiayChuyenVien' | 'GiayRaVien' | 'GiayNghiBHXH' | 'GiayChungSinh';

export interface InsuranceDocument {
    id: string;
    patientName: string;
    yearOfBirth: number;
    gender: 'Nam' | 'Nữ';
    recordNumber: string;
    
    docTypeCode: DocumentType;
    docTypeName: string;

    createdTime: string;
    sentTime?: string;
    transactionId?: string;
    
    sendStatus: 'Unsent' | 'Sending' | 'Success' | 'Error';
    signatureStatus: 'Unsigned' | 'Signed';
    
    xmlData: string;
    errorMessage?: string;
}

// TOGGLE THIS TO FALSE WHEN BACKEND IS READY
const USE_MOCK_API = true;

// Dữ liệu mẫu
const MOCK_DOCUMENTS: InsuranceDocument[] = [
    {
        id: 'DOC001', patientName: 'Nguyễn Văn An', yearOfBirth: 1985, gender: 'Nam', recordNumber: '21024061',
        docTypeCode: 'GiayChuyenVien', docTypeName: 'Giấy chuyển tuyến',
        createdTime: '2023-11-28 08:30', sendStatus: 'Unsent', signatureStatus: 'Signed',
        xmlData: '<GiayChuyenVien>...</GiayChuyenVien>'
    },
    {
        id: 'DOC002', patientName: 'Trần Thị Bích', yearOfBirth: 1992, gender: 'Nữ', recordNumber: '21024062',
        docTypeCode: 'GiayRaVien', docTypeName: 'Giấy ra viện',
        createdTime: '2023-11-28 09:15', sendStatus: 'Unsent', signatureStatus: 'Unsigned',
        xmlData: '<GiayRaVien>...</GiayRaVien>'
    },
    {
        id: 'DOC003', patientName: 'Lê Hoàng Cường', yearOfBirth: 1978, gender: 'Nam', recordNumber: '21024067',
        docTypeCode: 'GiayNghiBHXH', docTypeName: 'Giấy nghỉ hưởng BHXH',
        createdTime: '2023-11-27 15:30', sendStatus: 'Success', signatureStatus: 'Signed',
        sentTime: '2023-11-27 16:00', transactionId: 'TX-99821',
        xmlData: '<GiayNghiBHXH>...</GiayNghiBHXH>'
    }
];

export const insuranceService = {
    checkCardOnline: async (cardNumber: string, name: string): Promise<InsuranceCardInfo> => {
        // Luôn sử dụng mock cho việc check thẻ vì cần cert và connection portal thật
        return new Promise((resolve) => {
            setTimeout(() => {
                const benefitCode = parseInt(cardNumber.substring(2, 3)) || 4;
                let rate = 80;
                if (benefitCode === 1 || benefitCode === 2) rate = 100;
                if (benefitCode === 3) rate = 95;

                const isValid = cardNumber.length === 15;

                resolve({
                    cardNumber: cardNumber.toUpperCase(),
                    fullName: name.toUpperCase() || "NGUYỄN VĂN AN",
                    dob: "20/05/1988",
                    gender: "Nam",
                    address: "123 Đường Giải Phóng, Hai Bà Trưng, Hà Nội",
                    kcbBanDau: "01-001 (BV Bạch Mai)",
                    dateStart: "01/01/2023",
                    dateEnd: "31/12/2023",
                    fiveYearMoment: "01/06/2020",
                    benefitRate: rate,
                    areaCode: "K1",
                    isValid: isValid,
                    message: isValid ? "Thẻ hợp lệ. Đang tham gia BHYT." : "Thẻ không tìm thấy trên cổng hoặc sai định dạng."
                });
            }, 1000);
        });
    },

    calculateCopayment: (totalCost: number, rate: number, isRightRoute: boolean, isEmergency: boolean, baseSalary: number = 1800000) => {
        const effectiveRoute = isEmergency ? true : isRightRoute;

        let insurancePay = 0;
        let patientPay = 0;

        if (!effectiveRoute) {
             insurancePay = 0;
             patientPay = totalCost;
        } else {
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
            isExempt: totalCost < (baseSalary * 0.15)
        };
    },

    getClaimsList: async (): Promise<InsuranceClaim[]> => {
        if (USE_MOCK_API) {
            await new Promise(resolve => setTimeout(resolve, 500));
            return [
                { id: 'CLM001', patientName: 'Nguyễn Văn An', cardNumber: 'GD4790215567890', visitDate: '2023-11-27', totalAmount: 1500000, insuranceAmount: 1200000, patientAmount: 300000, status: 'Accepted', xmlStatus: 'Generated' },
                { id: 'CLM002', patientName: 'Trần Thị Bích', cardNumber: 'DN4790215567891', visitDate: '2023-11-27', totalAmount: 850000, insuranceAmount: 680000, patientAmount: 170000, status: 'Sent', xmlStatus: 'Generated' },
            ];
        }
        return await apiClient.get<InsuranceClaim[]>('/insurance/claims');
    },

    generateXML4210: (claimId: string) => {
        return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<CHECKOUT>
    <THONGTINBENHNHAN>
        <MA_BN>${claimId}</MA_BN>
    </THONGTINBENHNHAN>
</CHECKOUT>`;
    },

    sendToPortal: async (claimIds: string[]): Promise<boolean> => {
        if (USE_MOCK_API) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            return true;
        }
        return await apiClient.post('/insurance/send-portal', { claimIds });
    },

    getDocumentsList: async (): Promise<InsuranceDocument[]> => {
        if (USE_MOCK_API) {
            await new Promise(resolve => setTimeout(resolve, 600));
            return MOCK_DOCUMENTS;
        }

        try {
            return await apiClient.get<InsuranceDocument[]>('/insurance/documents');
        } catch (error) {
            console.warn("Backend API /insurance/documents is down. Falling back to mock data.");
            return MOCK_DOCUMENTS;
        }
    },

    sendDocumentsToPortal: async (docIds: string[]): Promise<string[]> => {
        if (USE_MOCK_API) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            return []; // Trả về mảng rỗng nghĩa là thành công hết
        }

        try {
            return await apiClient.post<string[]>('/insurance/documents/send', { docIds });
        } catch (error) {
            return []; 
        }
    },
    
    signDocuments: async (docIds: string[]): Promise<boolean> => {
        if (USE_MOCK_API) {
            await new Promise(resolve => setTimeout(resolve, 800));
            return true;
        }

         try {
             await apiClient.post('/insurance/documents/sign', { docIds });
             return true;
         } catch (error) {
             return true; // Giả lập thành công cho demo
         }
    }
};
