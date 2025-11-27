
import { SurgerySchedule, SurgeryResource } from '../../types';

export const resources: SurgeryResource[] = [
    { id: 'OR1', name: 'Phòng Mổ 1 (Chấn thương)', type: 'OR' },
    { id: 'OR2', name: 'Phòng Mổ 2 (Tiêu hóa)', type: 'OR' },
    { id: 'OR3', name: 'Phòng Mổ 3 (Tổng hợp)', type: 'OR' },
    { id: 'OR4', name: 'Phòng Tiểu Phẫu', type: 'OR' },
];

export const mockSurgeries: (SurgerySchedule & { 
    anesthesiologist?: string, 
    assistantSurgeons?: string, 
    nurses?: string,
    method?: string,
    diagnosis?: string
})[] = [
    {
        id: 'S001',
        patientName: 'Lê Hoàng Cường',
        patientId: 'P003',
        procedureName: 'Phẫu thuật nội soi cắt ruột thừa',
        surgeonName: 'BS. Nguyễn Văn A',
        roomId: 'OR2',
        date: new Date().toISOString().slice(0, 10),
        startTime: '08:00',
        endTime: '10:00',
        status: 'completed',
        notes: 'Bệnh nhân tiền sử dị ứng Penicillin',
        anesthesiologist: 'BS. Phạm Văn D',
        assistantSurgeons: 'BS. Trần Thị B',
        nurses: 'ĐD. Nguyễn Thị E, ĐD. Lê Văn H',
        method: 'Gây mê nội khí quản',
        diagnosis: 'Viêm ruột thừa cấp'
    },
    {
        id: 'S002',
        patientName: 'Trần Thị Bích',
        patientId: 'P002',
        procedureName: 'Mổ lấy thai lần 2',
        surgeonName: 'BS. Phạm Văn D',
        roomId: 'OR3',
        date: new Date().toISOString().slice(0, 10),
        startTime: '09:00',
        endTime: '11:30',
        status: 'in-progress',
        notes: 'Theo dõi sát huyết áp',
        anesthesiologist: 'BS. Nguyễn Văn Mê',
        assistantSurgeons: 'BS. Sản Khoa 1',
        nurses: 'ĐD. Nữ Hộ Sinh A',
        method: 'Gây tê tủy sống',
        diagnosis: 'Thai lần 2, 39 tuần, ngôi ngược'
    },
    {
        id: 'S003',
        patientName: 'Hoàng Văn Em',
        patientId: 'P005',
        procedureName: 'Kết hợp xương đùi',
        surgeonName: 'BS. Lê Văn C',
        roomId: 'OR1',
        date: new Date().toISOString().slice(0, 10),
        startTime: '13:00',
        endTime: '16:00',
        status: 'scheduled',
        anesthesiologist: 'BS. Gây Mê B',
        assistantSurgeons: 'BS. Chấn Thương 2',
        nurses: 'ĐD. Dụng Cụ C',
        method: 'Gây mê toàn thân',
        diagnosis: 'Gãy kín 1/3 giữa xương đùi (P)'
    },
    {
        id: 'S004',
        patientName: 'Nguyễn Văn X',
        patientId: 'P099',
        procedureName: 'Cấp cứu: Vỡ lách',
        surgeonName: 'BS. Trực',
        roomId: 'OR2',
        date: new Date().toISOString().slice(0, 10),
        startTime: '11:00',
        endTime: '13:00',
        status: 'emergency',
        notes: 'Chuẩn bị 2 đơn vị máu',
        anesthesiologist: 'BS. Gây Mê Trực',
        assistantSurgeons: 'BS. Ngoại 2',
        nurses: 'ĐD. Trực A',
        method: 'Gây mê nội khí quản',
        diagnosis: 'Chấn thương bụng kín, vỡ lách độ 3'
    },
    {
        id: 'S005',
        patientName: 'Phạm Thị Dung',
        patientId: 'P004',
        procedureName: 'Nội soi túi mật',
        surgeonName: 'BS. Nguyễn Văn A',
        roomId: 'OR2',
        date: new Date().toISOString().slice(0, 10),
        startTime: '14:00',
        endTime: '16:00',
        status: 'scheduled',
        anesthesiologist: 'BS. Phạm Văn D',
        assistantSurgeons: 'BS. Nội Trú 1',
        nurses: 'ĐD. Dụng Cụ B',
        method: 'Gây mê nội khí quản',
        diagnosis: 'Sỏi túi mật viêm mạn'
    },
    {
        id: 'S006',
        patientName: 'Đỗ Văn K',
        patientId: 'P006',
        procedureName: 'Phẫu thuật thoát vị bẹn',
        surgeonName: 'BS. Trần Văn B',
        roomId: 'OR3',
        date: new Date(Date.now() + 86400000).toISOString().slice(0, 10), // Tomorrow
        startTime: '08:00',
        endTime: '10:00',
        status: 'scheduled',
        anesthesiologist: 'BS. Gây Mê C',
        assistantSurgeons: 'BS. Ngoại 3',
        nurses: 'ĐD. Dụng Cụ D',
        method: 'Gây tê tủy sống',
        diagnosis: 'Thoát vị bẹn (T)'
    }
];
