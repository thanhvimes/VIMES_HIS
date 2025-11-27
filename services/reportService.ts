
// Mock Data Types
export interface RevenueReportItem {
    id: string;
    departmentName: string;   // Group Level 1 (VD: Khoa Xét nghiệm)
    serviceGroup: string;     // Group Level 2 (VD: Huyết học, Sinh hóa)
    serviceName: string;      // Detail Level 3 (VD: Tổng phân tích TB máu)
    quantity: number;
    unitPrice: number;
    totalRevenue: number;
    insurancePaid: number;
    patientPaid: number;
}

// Helper để tạo dữ liệu ngẫu nhiên
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const reportService = {
    /**
     * Giả lập gọi API lấy báo cáo doanh thu
     * Thực tế: Backend sẽ trả về 1 list phẳng, Frontend sẽ group hoặc Backend trả về Tree.
     * Ở đây ta giả lập trả về List phẳng (quy trình phổ biến nhất).
     */
    getRevenueReport: async (fromDate: string, toDate: string): Promise<RevenueReportItem[]> => {
        console.log(`[API] Fetching Revenue Report from ${fromDate} to ${toDate}...`);
        
        // Simulate Network Delay
        await new Promise(resolve => setTimeout(resolve, 800));

        const departments = ['Khoa Xét Nghiệm', 'Khoa Chẩn đoán hình ảnh', 'Khoa Nội Soi'];
        const groups: Record<string, string[]> = {
            'Khoa Xét Nghiệm': ['Huyết học', 'Sinh hóa', 'Miễn dịch', 'Vi sinh'],
            'Khoa Chẩn đoán hình ảnh': ['X-Quang', 'Siêu âm', 'CT Scanner', 'MRI'],
            'Khoa Nội Soi': ['Nội soi Tiêu hóa', 'Nội soi Tai Mũi Họng']
        };
        const services: Record<string, string[]> = {
            'Huyết học': ['Tổng phân tích TB máu', 'Đông máu cơ bản', 'Nhóm máu ABO'],
            'Sinh hóa': ['Glucose', 'Ure', 'Creatinine', 'AST', 'ALT', 'Lipid máu'],
            'Miễn dịch': ['HBsAg', 'HIV Ab', 'HCV Ab', 'Troponin T'],
            'Vi sinh': ['Cấy máu', 'Nhuộm Gram'],
            'X-Quang': ['XQ Ngực thẳng', 'XQ Cột sống thắt lưng', 'XQ Khớp gối'],
            'Siêu âm': ['Siêu âm ổ bụng', 'Siêu âm Tuyến giáp', 'Siêu âm Tim'],
            'CT Scanner': ['CT Sọ não', 'CT Ngực có cản quang'],
            'MRI': ['MRI Sọ não', 'MRI Cột sống'],
            'Nội soi Tiêu hóa': ['Nội soi Dạ dày gây mê', 'Nội soi Đại tràng'],
            'Nội soi Tai Mũi Họng': ['Nội soi Tai', 'Nội soi Mũi xoang']
        };

        const data: RevenueReportItem[] = [];
        let idCounter = 1;

        // Tạo dữ liệu mẫu ngẫu nhiên
        departments.forEach(dept => {
            const deptGroups = groups[dept];
            deptGroups.forEach(group => {
                const groupServices = services[group] || [];
                groupServices.forEach(svcName => {
                    // Random số liệu
                    const qty = getRandomInt(5, 100);
                    const price = getRandomInt(5, 50) * 10000; // 50k - 500k
                    const revenue = qty * price;
                    const insRatio = 0.8; // Giả sử BH chi trả 80%

                    data.push({
                        id: `REV_${idCounter++}`,
                        departmentName: dept,
                        serviceGroup: group,
                        serviceName: svcName,
                        quantity: qty,
                        unitPrice: price,
                        totalRevenue: revenue,
                        insurancePaid: revenue * insRatio,
                        patientPaid: revenue * (1 - insRatio)
                    });
                });
            });
        });

        return data;
    }
};
