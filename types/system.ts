export interface MedicalEquipment {
    id: string;
    name: string;
    model: string;
    serialNumber: string;
    manufacturer: string;
    supplier: string;
    purchaseDate: string;
    warrantyExpiry: string;
    department: string;
    status: 'active' | 'maintenance' | 'broken' | 'disposed';
    category: string;
    maintenanceSchedule: string;
    nextMaintenanceDate: string;
    image?: string;
}

export interface MaintenanceTask {
    id: string;
    equipmentId: string;
    equipmentName: string;
    type: 'Preventive' | 'Corrective' | 'Calibration';
    description: string;
    status: 'Scheduled' | 'In Progress' | 'Completed';
    assignedTo: string;
    scheduledDate: string;
    completionDate?: string;
}

export type LisMachineType = 'Hematology' | 'Biochemistry' | 'Immunology' | 'Urine' | 'Microbiology';

export interface LisMachineConfig {
    id: string;
    name: string;
    protocol: 'HL7' | 'ASTM' | 'Serial';
    ip: string;
    port: string;
    mode: 'Bidirectional' | 'Unidirectional';
    status: 'Online' | 'Offline';
    type: LisMachineType;
    autoSendOrder: boolean;
    lastActive?: string;
}

export interface LisLogEntry {
    id: string;
    timestamp: string;
    direction: 'IN' | 'OUT';
    message: string;
    type: 'DATA' | 'ACK' | 'NAK';
    parsedData?: any;
}

export interface LisResultData {
    testCode: string;
    value: string;
    unit: string;
    refRange: string;
    flag: string;
}