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