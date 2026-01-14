
import { DrugItem, DrugInteraction, PharmacyRequisition, PharmacyTransfer, PharmacyReplenishment, MiscPharmacyVoucher, PharmacyReturn } from '../../types';

export interface Warehouse {
    id: string;
    name: string;
    dept: string;
    type: string;
    isActive: boolean;
}

export interface PharmacyVoucher {
    id: string;
    voucherNo: string;
    invoiceNo: string;
    date: string;
    invoiceDate: string;
    supplier: string;
    warehouse: string;
    status: 'A' | 'O';
    amount: number;
    vat: number;
    total: number;
    items: any[];
}

export const mockWarehouses: Warehouse[] = [
    { id: '1', name: 'NHÀ THUỐC', dept: 'Khoa dược', type: 'Quầy Thuốc', isActive: true },
    { id: '2', name: 'KHO BHYT', dept: 'Khoa dược', type: 'Kho Chính', isActive: true },
    { id: '3', name: 'KHO CHẴN BHYT', dept: 'Khoa dược', type: 'Kho Chính', isActive: true },
    { id: '4', name: 'TỦ TRỰC CẤP CỨU', dept: 'Khoa Cấp Cứu', type: 'Tủ trực', isActive: true },
    { id: '5', name: 'TỦ TRỰC KHOA NHI', dept: 'Khoa Nhi', type: 'Tủ trực', isActive: true },
    { id: '6', name: 'KHO VACCINE', dept: 'Khoa dược', type: 'Kho Chính', isActive: true },
    { id: '7', name: 'KHO VTYT', dept: 'Khoa dược', type: 'Kho Chính', isActive: true },
];

export const mockReturns: PharmacyReturn[] = [
    {
        id: 'R01',
        voucherNo: 'HT00000012',
        date: '2023-11-28',
        issueDate: '2023-11-28 10:15',
        status: 'A',
        type: 'Nhập hoàn trả khoa',
        fromWarehouse: 'KHOA NỘI TỔNG HỢP',
        toWarehouse: 'KHO BHYT',
        deliverer: 'ĐD. Nguyễn Thị Mai',
        receiver: 'DS. Trần Văn Kho',
        description: 'Hoàn trả thuốc thừa sau khi BN ra viện',
        totalAmount: 1250000,
        items: [
            { id: 'RI1', drugCode: 'D001', drugName: 'Paracetamol 500mg', unit: 'viên', quantity: 20, price: 500, manufacturer: 'Việt Nam', expiryDate: '31/12/2025', total: 10000 }
        ]
    }
];

export const mockMiscVouchers: MiscPharmacyVoucher[] = [
    {
        id: 'M01',
        voucherNo: 'PX00000075',
        date: '2021-12-27',
        issueDate: '2021-12-27 15:30',
        warehouse: 'KHO VACCINE',
        type: 'Xuất điều chỉnh',
        deliverer: 'DS. Nguyễn Văn Giao',
        receiver: 'Nhân viên nhận',
        description: 'xuất vaccine pk chưse',
        status: 'A',
        totalAmount: 15420000,
        items: [
            { id: 'I1', drugCode: 'V001', drugName: 'Abhayrab (dại)', unit: 'ống', quantity: 10, price: 164800, manufacturer: 'Việt Nam', expiryDate: '31/08/2025', total: 1648000 },
            { id: 'I2', drugCode: 'V002', drugName: 'GC FLU(cúm)', unit: 'ống', quantity: 10, price: 169500, manufacturer: 'Việt Nam', expiryDate: '21/07/2025', total: 1695000 },
        ]
    }
];

export const mockReplenishments: PharmacyReplenishment[] = [
    {
        id: 'BS01',
        voucherNo: 'BS2311-0001',
        date: '2023-11-18',
        issueDate: '2023-11-18 14:20',
        fromWarehouse: 'KHO BHYT',
        toCabinet: 'TỦ TRỰC CẤP CỨU',
        deliverer: 'DS. Nguyễn Văn Giao',
        receiver: 'ĐD. Lê Thị Nhận',
        description: 'Bổ sung thuốc cấp cứu định kỳ tuần 3',
        status: 'A',
        totalAmount: 1250000,
        items: []
    }
];

export const mockVouchers: PharmacyVoucher[] = [
    { 
        id: 'V01', voucherNo: 'PN001', invoiceNo: '199647', date: '2023-11-20', invoiceDate: '2023-11-20', 
        supplier: 'CÔNG TY CP DƯỢC TW 2', warehouse: 'KHO CHẴN BHYT', status: 'A', 
        amount: 16615290, vat: 830764.5, total: 17446054.5,
        items: []
    }
];

export const mockTransfers: PharmacyTransfer[] = [
    {
        id: 'T01',
        transferNo: 'DC00000405',
        date: '2023-11-07',
        issueDate: '2023-11-07 07:45',
        fromWarehouse: 'KHO CHẴN BHYT',
        toWarehouse: 'KHO BHYT',
        deliverer: 'Nguyễn Văn Giao',
        receiver: 'Trần Thị Nhận',
        description: 'Chuyển thuốc định kỳ từ kho chẵn sang kho lẻ',
        status: 'A',
        totalAmount: 679000,
        items: []
    }
];

export const mockRequisitions: PharmacyRequisition[] = [
    {
        id: 'REQ01',
        reqNo: 'DT2311-001',
        date: '2023-11-18',
        requester: 'ĐD. Nguyễn Thị Mai',
        fromWarehouse: 'Kho Lẻ BHYT',
        toWarehouse: 'KHO CHẴN BHYT',
        reason: 'Lĩnh thuốc định kỳ tuần 3 tháng 11',
        status: 'Pending',
        totalAmount: 5400000,
        items: []
    }
];

export const mockInteractions: DrugInteraction[] = [
    {
        id: 'INT-001',
        drugCode1: 'D004',
        drugName1: 'Omeprazol',
        drugCode2: 'D006',
        drugName2: 'Clopidogrel',
        severity: 'Severe',
        description: 'Omeprazol làm giảm tác dụng ức chế ngưng tập tiểu cầu của Clopidogrel.',
        management: 'Tránh phối hợp. Nên thay thế Omeprazol bằng Pantoprazol.'
    }
];
