
import { Patient } from '../types';

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

// Mock Claims Data
const mockClaims: InsuranceClaim[] = [
    { id: 'CLM001', patientName: 'Nguyễn Văn An', cardNumber: 'GD4790215567890', visitDate: '2023-11-27', totalAmount: 1500000, insuranceAmount: 1200000, patientAmount: 300000, status: 'Accepted', xmlStatus: 'Generated' },
    { id: 'CLM002', patientName: 'Trần Thị Bích', cardNumber: 'DN4790215567891', visitDate: '2023-11-27', totalAmount: 850000, insuranceAmount: 680000, patientAmount: 170000, status: 'Sent', xmlStatus: 'Generated' },
    { id: 'CLM003', patientName: 'Lê Hoàng Cường', cardNumber: 'HS4790215567892', visitDate: '2023-11-26', totalAmount: 2100000, insuranceAmount: 2100000, patientAmount: 0, status: 'Ready', xmlStatus: 'Pending' },
    { id: 'CLM004', patientName: 'Phạm Thị Dung', cardNumber: 'SV4790215567893', visitDate: '2023-11-26', totalAmount: 450000, insuranceAmount: 360000, patientAmount: 90000, status: 'Error', xmlStatus: 'Pending', errorMessage: 'Sai mã KCB ban đầu' },
];

export const insuranceService = {
    /**
     * Check thẻ BHYT Online (Giả lập gọi cổng giám định)
     */
    checkCardOnline: async (cardNumber: string, name: string): Promise<InsuranceCardInfo> => {
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
            // Trái tuyến (Ví dụ: Tỉnh -> TW được hưởng 40% nội trú, 0% ngoại trú - Giả lập đơn giản)
            // Giả sử đây là BV Huyện (Hưởng 100% chi phí khám chữa bệnh theo mức hưởng)
            // Nếu BV Tỉnh/TW thì logic phức tạp hơn.
            // Ở đây giả lập Trái tuyến được hưởng 0% ngoại trú (thường gặp)
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
     * Lấy danh sách hồ sơ chờ đẩy cổng
     */
    getClaimsList: async (): Promise<InsuranceClaim[]> => {
        return new Promise(resolve => setTimeout(() => resolve(mockClaims), 800));
    },

    /**
     * Sinh file XML 130/4210 (Giả lập nội dung XML)
     */
    generateXML4210: (claimId: string) => {
        // Tạo nội dung XML giả lập chuẩn 4210
        const xmlContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<CHECKOUT>
    <THONGTINBENHNHAN>
        <MA_BN>${claimId}</MA_BN>
        <HO_TEN>NGUYEN VAN A</HO_TEN>
        <NGAY_SINH>19900101</NGAY_SINH>
        <GIOI_TINH>1</GIOI_TINH>
        <DIA_CHI>Ha Noi</DIA_CHI>
        <MA_THE>GD4790215567890</MA_THE>
        <MA_DKBD>01001</MA_DKBD>
        <GT_THE_TU>20230101</GT_THE_TU>
        <GT_THE_DEN>20231231</GT_THE_DEN>
        <MA_BENH>E11</MA_BENH>
        <MA_BENH_KHAC>I10;E78</MA_BENH_KHAC>
        <NGAY_VAO>202311270800</NGAY_VAO>
        <NGAY_RA>202311271030</NGAY_RA>
        <NGAY_TTOAN>202311271030</NGAY_TTOAN>
        <TONG_CHI>1500000</TONG_CHI>
        <BHYT_TT>1200000</BHYT_TT>
        <BN_TT>300000</BN_TT>
    </THONGTINBENHNHAN>
</CHECKOUT>`;
        return xmlContent;
    },

    /**
     * Gửi hồ sơ lên cổng giám định (Simulation)
     */
    sendToPortal: async (claimIds: string[]): Promise<boolean> => {
        return new Promise(resolve => setTimeout(() => resolve(true), 2000));
    }
};
