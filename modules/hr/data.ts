
export interface Staff {
    id: string;
    fullName: string;
    role: string; // Bác sĩ, Điều dưỡng, KTV...
    department: string;
    phone: string;
    email: string;
    joinDate: string;
    status: 'Active' | 'OnLeave' | 'Probation';
    licenseNumber: string; // Số CCHN
    avatar: string;
}

export const mockStaff: Staff[] = [
    { id: 'NV001', fullName: 'Trần Văn Minh', role: 'Bác sĩ CKII', department: 'Khoa Nội Tổng Quát', phone: '0912345678', email: 'minh.tv@clinic.com', joinDate: '2018-05-01', status: 'Active', licenseNumber: '00123/HNO-CCHN', avatar: 'https://ui-avatars.com/api/?name=Tran+Minh&background=0D8ABC&color=fff' },
    { id: 'NV002', fullName: 'Nguyễn Thị Lan', role: 'Điều dưỡng trưởng', department: 'Khoa Nội Tổng Quát', phone: '0909888777', email: 'lan.nt@clinic.com', joinDate: '2019-02-15', status: 'Active', licenseNumber: '00567/HNO-CCHN', avatar: 'https://ui-avatars.com/api/?name=Nguyen+Lan&background=e11d48&color=fff' },
    { id: 'NV003', fullName: 'Lê Văn Hùng', role: 'Kỹ thuật viên', department: 'CĐHA', phone: '0933222111', email: 'hung.lv@clinic.com', joinDate: '2021-10-10', status: 'Active', licenseNumber: '00999/HNO-CCHN', avatar: 'https://ui-avatars.com/api/?name=Le+Hung&background=059669&color=fff' },
    { id: 'NV004', fullName: 'Phạm Thu Hà', role: 'Tiếp đón', department: 'Phòng Khám', phone: '0944555666', email: 'ha.pt@clinic.com', joinDate: '2023-01-01', status: 'Probation', licenseNumber: '---', avatar: 'https://ui-avatars.com/api/?name=Pham+Ha&background=d97706&color=fff' },
    { id: 'NV005', fullName: 'Hoàng Văn Nam', role: 'Bác sĩ', department: 'Khoa Ngoại', phone: '0977888999', email: 'nam.hv@clinic.com', joinDate: '2020-07-20', status: 'OnLeave', licenseNumber: '00333/HNO-CCHN', avatar: 'https://ui-avatars.com/api/?name=Hoang+Nam&background=4f46e5&color=fff' },
];

export const shifts = [
    { id: 'S', name: 'Sáng (7:00 - 11:30)', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { id: 'C', name: 'Chiều (13:30 - 17:00)', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { id: 'D', name: 'Đêm (22:00 - 6:00)', color: 'bg-slate-800 text-slate-200 border-slate-600' },
    { id: 'T', name: 'Trực 24h', color: 'bg-red-100 text-red-700 border-red-200 font-bold' },
    { id: 'OFF', name: 'Nghỉ', color: 'bg-gray-100 text-gray-400' },
];
