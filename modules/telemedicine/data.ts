
import { TeleConsultationRequest } from '../../types/telemedicine';

export const mockTeleRequests: TeleConsultationRequest[] = [
    {
        id: 'TC-001',
        patientId: 'P003',
        patientName: 'Lê Hoàng Cường',
        age: 45,
        gender: 'Nam',
        reason: 'Khối u phổi thùy trên kích thước lớn, xâm lấn trung thất, cần hội chẩn hướng phẫu thuật.',
        specialty: 'Ung bướu - Lồng ngực',
        requester: 'BS. Trần Văn A (BV Đa khoa Tỉnh)',
        hospital: 'BV Đa khoa Tỉnh',
        consultant: 'GS. Nguyễn Văn B (BV Trung ương)',
        scheduledTime: '2023-11-20 14:00',
        status: 'scheduled',
        documents: ['CT Scan Ngực', 'Sinh thiết phổi']
    },
    {
        id: 'TC-002',
        patientId: 'P004',
        patientName: 'Phạm Thị Dung',
        age: 22,
        gender: 'Nữ',
        reason: 'Hội chứng thận hư kháng corticoid.',
        specialty: 'Thận - Tiết niệu',
        requester: 'BS. Lê Thị C',
        hospital: 'BV Huyện X',
        consultant: 'TS. Phạm Văn D',
        scheduledTime: '2023-11-21 09:00',
        status: 'scheduled',
        documents: ['Sinh hóa máu', 'Nước tiểu 24h']
    },
    {
        id: 'TC-003',
        patientId: 'P001',
        patientName: 'Nguyễn Văn An',
        age: 35,
        gender: 'Nam',
        reason: 'Nhồi máu cơ tim cấp giờ thứ 4, có biến chứng suy tim.',
        specialty: 'Tim mạch can thiệp',
        requester: 'BS. Trực Cấp Cứu',
        hospital: 'BV Đa khoa Quốc tế VIMES',
        consultant: 'BS.CKII Võ Văn Tim',
        scheduledTime: '2023-11-19 10:30',
        status: 'completed',
        documents: ['ECG', 'Men tim', 'Siêu âm tim']
    }
];
