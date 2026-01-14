
export interface Drug {
    id: string;
    name: string;
    dosage: string;
    stock: number;
}

export interface DrugItem {
    id?: string;
    code: string;
    name: string;
    unit: string;
    price: number;
    usageRoute: string;
    activeIngredient: string;
    stock?: number;
    categoryId?: string;
}

export interface PharmacyReturnItem {
    id: string;
    drugCode: string;
    drugName: string;
    unit: string;
    quantity: number;
    price: number;
    manufacturer: string;
    expiryDate: string;
    total: number;
}

export interface PharmacyReturn {
    id: string;
    voucherNo: string;
    date: string;
    issueDate?: string;
    status: 'O' | 'A' | 'C'; // O: Mới, A: Đã duyệt, C: Hủy
    type: string; // Kiểu nhập hoàn trả
    fromWarehouse: string; // Từ kho/khoa trả
    toWarehouse: string; // Kho nhập lại
    deliverer: string;
    receiver: string;
    description: string;
    totalAmount: number;
    items: PharmacyReturnItem[];
}

export interface MiscPharmacyVoucherItem {
    id: string;
    drugCode: string;
    drugName: string;
    unit: string;
    quantity: number;
    price: number;
    manufacturer: string;
    expiryDate: string;
    total: number;
}

export interface MiscPharmacyVoucher {
    id: string;
    voucherNo: string;
    date: string;
    issueDate?: string;
    warehouse: string;
    type: string; 
    deliverer: string;
    receiver: string;
    description: string;
    status: 'O' | 'A' | 'C'; 
    totalAmount: number;
    items: MiscPharmacyVoucherItem[];
}

export interface PharmacyReplenishmentItem {
    id: string;
    drugCode: string;
    drugName: string;
    unit: string;
    quantity: number;
    price: number;
    manufacturer: string;
    expiryDate: string;
    total: number;
}

export interface PharmacyReplenishment {
    id: string;
    voucherNo: string;
    date: string;
    issueDate?: string;
    fromWarehouse: string;
    toCabinet: string;
    deliverer: string;
    receiver: string;
    description: string;
    status: 'O' | 'A' | 'C'; 
    totalAmount: number;
    items: PharmacyReplenishmentItem[];
}

export interface PharmacyTransferItem {
    id: string;
    drugCode: string;
    drugName: string;
    unit: string;
    quantity: number;
    price: number;
    manufacturer: string;
    expiryDate: string;
    total: number;
}

export interface PharmacyTransfer {
    id: string;
    transferNo: string;
    date: string;
    issueDate?: string;
    fromWarehouse: string;
    toWarehouse: string;
    deliverer: string;
    receiver: string;
    description: string;
    status: 'O' | 'A' | 'C'; 
    totalAmount: number;
    items: PharmacyTransferItem[];
}

export interface PharmacyRequisition {
    id: string;
    reqNo: string;
    date: string;
    requester: string;
    fromWarehouse: string;
    toWarehouse: string;
    reason: string;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Draft';
    totalAmount: number;
    items: any[];
}

export interface DrugInteraction {
    id: string;
    drugCode1: string;
    drugName1: string;
    drugCode2: string;
    drugName2: string;
    severity: 'Mild' | 'Moderate' | 'Severe' | 'Contraindicated';
    description: string;
    management: string;
}

export interface ConsumableUsage {
    id: string;
    itemId: string;
    itemName: string;
    quantity: number;
    unit: string;
}

export interface Bill {
    id: string;
    customerId: string;
    date: string;
    consumption: number;
    cost: number;
    status: 'paid' | 'unpaid';
}

export interface FeeItem {
    id: string;
    name: string;
    category: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    insurancePaid: number;
    patientPaid: number;
    surcharge: number;
}
