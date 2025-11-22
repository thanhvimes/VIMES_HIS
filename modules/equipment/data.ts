
import { MedicalEquipment, MaintenanceTask } from '../../types';

export const mockEquipment: MedicalEquipment[] = [
    {
        id: 'EQ-001',
        name: 'Máy giúp thở GE Carescape R860',
        model: 'Carescape R860',
        serialNumber: 'GE-8823-X12',
        manufacturer: 'GE Healthcare',
        supplier: 'VietMedical',
        purchaseDate: '2021-05-15',
        warrantyExpiry: '2024-05-15',
        department: 'Hồi sức tích cực (ICU)',
        status: 'active',
        category: 'Hồi sức cấp cứu',
        maintenanceSchedule: 'Quarterly',
        nextMaintenanceDate: '2023-12-15',
        image: 'https://www.gehealthcare.com/-/media/b5f9f8f7f8f44f8f8f8f8f8f8f8f8f8f/product-images/respiratory-care/carescaper860/carescaper860_main_hero.png'
    },
    {
        id: 'EQ-002',
        name: 'Máy Siêu âm Voluson E8',
        model: 'Voluson E8',
        serialNumber: 'VOL-9921-A',
        manufacturer: 'GE Healthcare',
        supplier: 'TD Medical',
        purchaseDate: '2020-01-10',
        warrantyExpiry: '2023-01-10',
        department: 'Chẩn đoán hình ảnh',
        status: 'maintenance',
        category: 'Chẩn đoán hình ảnh',
        maintenanceSchedule: 'Monthly',
        nextMaintenanceDate: '2023-11-20'
    },
    {
        id: 'EQ-003',
        name: 'Máy X-Quang KTS Samsung GC85A',
        model: 'GC85A',
        serialNumber: 'SS-XQ-001',
        manufacturer: 'Samsung Medison',
        supplier: 'Samsung Vina',
        purchaseDate: '2019-08-20',
        warrantyExpiry: '2022-08-20',
        department: 'Chẩn đoán hình ảnh',
        status: 'active',
        category: 'Chẩn đoán hình ảnh',
        maintenanceSchedule: 'Yearly',
        nextMaintenanceDate: '2024-08-20'
    },
    {
        id: 'EQ-004',
        name: 'Máy Xét nghiệm Sinh hóa Cobas 6000',
        model: 'Cobas 6000',
        serialNumber: 'ROCHE-CB6-99',
        manufacturer: 'Roche Diagnostics',
        supplier: 'Roche Vietnam',
        purchaseDate: '2022-02-01',
        warrantyExpiry: '2025-02-01',
        department: 'Khoa Xét nghiệm',
        status: 'broken',
        category: 'Xét nghiệm',
        maintenanceSchedule: 'Monthly',
        nextMaintenanceDate: '2023-11-01'
    },
    {
        id: 'EQ-005',
        name: 'Giường bệnh điện 3 chức năng',
        model: 'Paramount Bed A5',
        serialNumber: 'PM-BED-102',
        manufacturer: 'Paramount Bed',
        supplier: 'Local Distributor',
        purchaseDate: '2023-06-01',
        warrantyExpiry: '2025-06-01',
        department: 'Nội trú',
        status: 'active',
        category: 'Nội thất y tế',
        maintenanceSchedule: 'Yearly',
        nextMaintenanceDate: '2024-06-01'
    }
];

export const mockMaintenanceTasks: MaintenanceTask[] = [
    {
        id: 'MT-001',
        equipmentId: 'EQ-002',
        equipmentName: 'Máy Siêu âm Voluson E8',
        type: 'Preventive',
        description: 'Bảo dưỡng định kỳ tháng 11: Vệ sinh đầu dò, kiểm tra nguồn điện.',
        status: 'In Progress',
        assignedTo: 'Kỹ sư Hùng',
        scheduledDate: '2023-11-20'
    },
    {
        id: 'MT-002',
        equipmentId: 'EQ-004',
        equipmentName: 'Máy Xét nghiệm Sinh hóa Cobas 6000',
        type: 'Corrective',
        description: 'Báo lỗi module ISE: Không hút được mẫu. Cần thay kim hút.',
        status: 'Scheduled',
        assignedTo: 'Kỹ sư hãng Roche',
        scheduledDate: '2023-11-22'
    },
    {
        id: 'MT-003',
        equipmentId: 'EQ-001',
        equipmentName: 'Máy giúp thở GE Carescape R860',
        type: 'Calibration',
        description: 'Kiểm định áp lực và lưu lượng khí hằng năm.',
        status: 'Completed',
        assignedTo: 'Trung tâm Kiểm định 2',
        scheduledDate: '2023-10-15',
        completionDate: '2023-10-15'
    }
];
