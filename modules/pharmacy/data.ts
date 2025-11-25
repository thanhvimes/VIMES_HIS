
import { DrugInteraction } from '../../types';

// Mock Inventory Data - reused from original file context if present, 
// but assuming we need to export mockInteractions here.

export const mockInteractions: DrugInteraction[] = [
    {
        id: 'INT-001',
        drugCode1: 'D004', // Omeprazol
        drugName1: 'Omeprazol',
        drugCode2: 'D006', // Clopidogrel (Assuming D006 was mapped to something else in previous mock, using text for simplicity in this context or creating a match)
        drugName2: 'Clopidogrel (Generic)',
        severity: 'Severe',
        description: 'Omeprazol làm giảm tác dụng ức chế ngưng tập tiểu cầu của Clopidogrel.',
        management: 'Tránh phối hợp. Nên thay thế Omeprazol bằng Pantoprazol.'
    },
    {
        id: 'INT-002',
        drugCode1: 'D002', // Amoxicillin
        drugName1: 'Amoxicillin',
        drugCode2: 'D005', // Methotrexate (Example)
        drugName2: 'Methotrexate (Generic)',
        severity: 'Moderate',
        description: 'Penicillins có thể làm giảm bài tiết Methotrexate, tăng nguy cơ độc tính.',
        management: 'Theo dõi chặt chẽ nồng độ Methotrexate và chức năng thận.'
    },
    {
        id: 'INT-003',
        drugCode1: 'D006', // Amlodipine
        drugName1: 'Amlodipine',
        drugCode2: 'D011', // Simvastatin (Hypothetical)
        drugName2: 'Simvastatin',
        severity: 'Moderate',
        description: 'Amlodipine có thể làm tăng nồng độ Simvastatin trong máu.',
        management: 'Giới hạn liều Simvastatin tối đa 20mg/ngày khi dùng chung.'
    },
    {
        id: 'INT-004',
        drugCode1: 'D007', // Vitamin C
        drugName1: 'Vitamin C',
        drugCode2: 'D012', // Aluminum Hydroxide (Antacid)
        drugName2: 'Nhôm Hydroxyd',
        severity: 'Mild',
        description: 'Vitamin C có thể làm tăng hấp thu Nhôm.',
        management: 'Uống cách xa nhau ít nhất 2 giờ.'
    }
];
