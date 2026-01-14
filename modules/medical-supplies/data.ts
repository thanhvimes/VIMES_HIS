
export interface SupplyItem {
    id: string;
    code: string;
    name: string;
    unit: string;
    spec: string; // Quy cách
    category: string;
    stock: number;
    minStock: number;
    price: number;
    expiryDate: string;
    location: string;
}

export const mockSupplies: SupplyItem[] = [
    { id: 'S01', code: 'VT001', name: 'Găng tay y tế có bột (M)', unit: 'Đôi', spec: 'Hộp 50 đôi', category: 'Vật tư tiêu hao', stock: 1500, minStock: 500, price: 2500, expiryDate: '2025-12-30', location: 'Kệ A1' },
    { id: 'S02', code: 'VT002', name: 'Bơm kim tiêm 5ml', unit: 'Cái', spec: 'Thùng 100 cái', category: 'Vật tư tiêu hao', stock: 80, minStock: 200, price: 1200, expiryDate: '2026-05-15', location: 'Kệ B2' },
    { id: 'S03', code: 'VT003', name: 'Chỉ khâu phẫu thuật Vicryl 3.0', unit: 'Sợi', spec: 'Hộp 24 tép', category: 'Vật tư phẫu thuật', stock: 45, minStock: 50, price: 85000, expiryDate: '2024-11-20', location: 'Tủ chuyên dụng' },
    { id: 'S04', code: 'VT004', name: 'Dây truyền dịch', unit: 'Bộ', spec: 'Túi 1 bộ', category: 'Vật tư tiêu hao', stock: 300, minStock: 100, price: 5500, expiryDate: '2025-08-10', location: 'Kệ A3' },
];

export const mockSupplyVouchers = [
    { id: 'V01', voucherNo: 'NKVT001', date: '2023-11-25', supplier: 'Công ty Thiết bị Y tế Phương Đông', warehouse: 'KHO VẬT TƯ TỔNG', status: 'A', total: 15400000 },
    { id: 'V02', voucherNo: 'XKVT005', date: '2023-11-27', supplier: 'Khoa Ngoại Tổng Hợp', warehouse: 'KHO VẬT TƯ TỔNG', status: 'O', total: 2300000 },
];
