
// Mock data representing real-time hospital status

export const mockBedCapacity = [
    { id: 'khoa-noi', name: 'Nội Tổng Quát', total: 50, occupied: 42, color: 'bg-blue-500' },
    { id: 'khoa-ngoai', name: 'Ngoại Khoa', total: 40, occupied: 35, color: 'bg-indigo-500' },
    { id: 'khoa-san', name: 'Sản Phụ Khoa', total: 30, occupied: 15, color: 'bg-pink-500' },
    { id: 'khoa-nhi', name: 'Nhi Khoa', total: 30, occupied: 28, color: 'bg-green-500' },
    { id: 'icu', name: 'Hồi Sức (ICU)', total: 15, occupied: 14, color: 'bg-red-600', alert: true },
    { id: 'cc', name: 'Cấp Cứu', total: 10, occupied: 6, color: 'bg-orange-500' },
];

export const mockPatientFlow = [
    { time: '07:00', in: 15, out: 2 },
    { time: '08:00', in: 45, out: 5 },
    { time: '09:00', in: 60, out: 12 },
    { time: '10:00', in: 55, out: 20 },
    { time: '11:00', in: 30, out: 25 },
    { time: '12:00', in: 10, out: 15 },
    { time: '13:00', in: 25, out: 8 },
    { time: '14:00', in: 40, out: 18 },
    { time: '15:00', in: 35, out: 22 },
];

export const mockORStatus = [
    { id: 'OR1', name: 'Phòng Mổ 1', status: 'In Use', patient: 'Lê Văn A', procedure: 'Ruột thừa NS', time: '01:30' },
    { id: 'OR2', name: 'Phòng Mổ 2', status: 'Cleaning', patient: '-', procedure: '-', time: '00:15' },
    { id: 'OR3', name: 'Phòng Mổ 3', status: 'In Use', patient: 'Trần Thị B', procedure: 'Mổ lấy thai', time: '00:45' },
    { id: 'OR4', name: 'Phòng Mổ 4', status: 'Available', patient: '-', procedure: '-', time: '-' },
];

export const mockWaitingTimes = [
    { area: 'Tiếp nhận', wait: 12, status: 'normal' },
    { area: 'Khám Nội', wait: 45, status: 'warning' },
    { area: 'Xét nghiệm', wait: 25, status: 'normal' },
    { area: 'Chẩn đoán hình ảnh', wait: 35, status: 'warning' },
    { area: 'Dược BHYT', wait: 15, status: 'normal' },
];

export const mockAlerts = [
    { id: 1, type: 'critical', msg: 'ICU: Chỉ còn 1 giường trống. Cần điều phối chuyển khoa.', time: '10:15' },
    { id: 2, type: 'warning', msg: 'Khám Nội: Hàng đợi vượt 40 người. Cần tăng cường bác sĩ.', time: '09:45' },
    { id: 3, type: 'info', msg: 'Hệ thống LIS: Đã khôi phục kết nối máy Cobas.', time: '09:30' },
];
