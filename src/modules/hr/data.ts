
export interface Staff {
    id: string;
    employeeCode: string; // Mã nhân viên
    fullName: string;
    gender: 'Nam' | 'Nữ';
    dob: string;
    phone: string;
    email: string;
    address: string;
    identityCard: string; // CCCD
    
    // Công việc
    department: string;
    role: string; // Chức danh/Vị trí
    type: 'Full-time' | 'Part-time' | 'Contract' | 'Probation';
    status: 'Active' | 'OnLeave' | 'Resigned' | 'Maternity';
    joinDate: string;
    contractEndDate?: string;
    
    // Lương & BH
    basicSalary: number;
    bankAccount: string;
    bankName: string;
    taxCode: string;
    socialInsuranceNo: string;

    avatar: string;
    licenseNumber: string; // Số CCHN
}

export interface Candidate {
    id: string;
    name: string;
    position: string;
    experience: string;
    appliedDate: string;
    status: 'New' | 'Screening' | 'Interview' | 'Offer' | 'Hired' | 'Rejected';
    avatar: string;
}

export interface PayrollRecord {
    id: string;
    staffId: string;
    staffName: string;
    role: string;
    basicSalary: number;
    allowance: number; // Phụ cấp
    overtimePay: number;
    deduction: number; // Khấu trừ (BHXH, Thuế)
    netSalary: number;
    status: 'Draft' | 'Approved' | 'Paid';
}

export const mockStaff: Staff[] = [
    { 
        id: 'NV001', 
        employeeCode: 'BS001',
        fullName: 'Trần Văn Minh', 
        gender: 'Nam',
        dob: '1985-05-20',
        role: 'Trưởng khoa', 
        department: 'Khoa Nội Tổng Quát', 
        phone: '0912345678', 
        email: 'minh.tv@vimes.com', 
        address: '123 Nguyễn Trãi, Thanh Xuân, Hà Nội',
        identityCard: '001085000xxx',
        type: 'Full-time',
        status: 'Active', 
        joinDate: '2018-05-01', 
        basicSalary: 35000000,
        bankAccount: '190333888999',
        bankName: 'Techcombank',
        taxCode: '833291023',
        socialInsuranceNo: '0123456789',
        licenseNumber: '00123/HNO-CCHN', 
        avatar: 'https://ui-avatars.com/api/?name=Tran+Minh&background=0D8ABC&color=fff' 
    },
    { 
        id: 'NV002', 
        employeeCode: 'DD005',
        fullName: 'Nguyễn Thị Lan', 
        gender: 'Nữ',
        dob: '1990-10-15',
        role: 'Điều dưỡng trưởng', 
        department: 'Khoa Nội Tổng Quát', 
        phone: '0909888777', 
        email: 'lan.nt@vimes.com', 
        address: '456 Tây Sơn, Đống Đa, Hà Nội',
        identityCard: '001090000xxx',
        type: 'Full-time',
        status: 'Active', 
        joinDate: '2019-02-15', 
        basicSalary: 15000000,
        bankAccount: '0021000333444',
        bankName: 'Vietcombank',
        taxCode: '822111333',
        socialInsuranceNo: '9876543210',
        licenseNumber: '00567/HNO-CCHN', 
        avatar: 'https://ui-avatars.com/api/?name=Nguyen+Lan&background=e11d48&color=fff' 
    },
    { 
        id: 'NV003', 
        employeeCode: 'KTV02',
        fullName: 'Lê Văn Hùng', 
        gender: 'Nam',
        dob: '1992-08-05',
        role: 'Kỹ thuật viên', 
        department: 'Chẩn đoán hình ảnh', 
        phone: '0933222111', 
        email: 'hung.lv@vimes.com', 
        address: '789 Giải Phóng, Hoàng Mai, Hà Nội',
        identityCard: '001092000xxx',
        type: 'Full-time',
        status: 'Active', 
        joinDate: '2021-10-10', 
        basicSalary: 12000000,
        bankAccount: '123456789',
        bankName: 'MB Bank',
        taxCode: '',
        socialInsuranceNo: '',
        licenseNumber: '00999/HNO-CCHN', 
        avatar: 'https://ui-avatars.com/api/?name=Le+Hung&background=059669&color=fff' 
    },
    { 
        id: 'NV004', 
        employeeCode: 'TD001',
        fullName: 'Phạm Thu Hà', 
        gender: 'Nữ',
        dob: '2000-01-01',
        role: 'Lễ tân', 
        department: 'Phòng Khám', 
        phone: '0944555666', 
        email: 'ha.pt@vimes.com', 
        address: 'Khu đô thị Times City, Hà Nội',
        identityCard: '001200000xxx',
        type: 'Probation',
        status: 'Active', 
        joinDate: '2023-01-01', 
        basicSalary: 7000000,
        bankAccount: '',
        bankName: '',
        taxCode: '',
        socialInsuranceNo: '',
        licenseNumber: '---', 
        avatar: 'https://ui-avatars.com/api/?name=Pham+Ha&background=d97706&color=fff' 
    },
    { 
        id: 'NV005', 
        employeeCode: 'BS009',
        fullName: 'Hoàng Văn Nam', 
        gender: 'Nam',
        dob: '1988-12-20',
        role: 'Bác sĩ Ngoại', 
        department: 'Khoa Ngoại', 
        phone: '0977888999', 
        email: 'nam.hv@vimes.com', 
        address: 'Khu tập thể Bách Khoa, Hà Nội',
        identityCard: '001088000xxx',
        type: 'Full-time',
        status: 'OnLeave', 
        joinDate: '2020-07-20', 
        basicSalary: 25000000,
        bankAccount: '',
        bankName: '',
        taxCode: '',
        socialInsuranceNo: '',
        licenseNumber: '00333/HNO-CCHN', 
        avatar: 'https://ui-avatars.com/api/?name=Hoang+Nam&background=4f46e5&color=fff' 
    },
];

export const mockCandidates: Candidate[] = [
    { id: 'CD01', name: 'Nguyễn Văn A', position: 'Bác sĩ Nội', experience: '5 năm', appliedDate: '2023-11-20', status: 'New', avatar: 'https://ui-avatars.com/api/?name=Nguyen+A&background=random' },
    { id: 'CD02', name: 'Trần Thị B', position: 'Điều dưỡng', experience: '2 năm', appliedDate: '2023-11-18', status: 'Interview', avatar: 'https://ui-avatars.com/api/?name=Tran+B&background=random' },
    { id: 'CD03', name: 'Lê Văn C', position: 'KTV X-Quang', experience: '3 năm', appliedDate: '2023-11-15', status: 'Offer', avatar: 'https://ui-avatars.com/api/?name=Le+C&background=random' },
    { id: 'CD04', name: 'Phạm Thị D', position: 'Lễ tân', experience: '1 năm', appliedDate: '2023-11-22', status: 'Screening', avatar: 'https://ui-avatars.com/api/?name=Pham+D&background=random' },
];

export const mockPayroll: PayrollRecord[] = [
    { id: 'PR001', staffId: 'NV001', staffName: 'Trần Văn Minh', role: 'Bác sĩ CKII', basicSalary: 25000000, allowance: 5000000, overtimePay: 2000000, deduction: 3000000, netSalary: 29000000, status: 'Approved' },
    { id: 'PR002', staffId: 'NV002', staffName: 'Nguyễn Thị Lan', role: 'Điều dưỡng', basicSalary: 12000000, allowance: 2000000, overtimePay: 1500000, deduction: 1500000, netSalary: 14000000, status: 'Approved' },
    { id: 'PR003', staffId: 'NV003', staffName: 'Lê Văn Hùng', role: 'KTV', basicSalary: 14000000, allowance: 2500000, overtimePay: 1000000, deduction: 1800000, netSalary: 15700000, status: 'Paid' },
    { id: 'PR004', staffId: 'NV004', staffName: 'Phạm Thu Hà', role: 'Tiếp đón', basicSalary: 8000000, allowance: 1000000, overtimePay: 500000, deduction: 900000, netSalary: 8600000, status: 'Draft' },
];

export const shifts = [
    { id: 'S', name: 'Sáng (7:00 - 11:30)', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { id: 'C', name: 'Chiều (13:30 - 17:00)', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { id: 'D', name: 'Đêm (22:00 - 6:00)', color: 'bg-slate-800 text-slate-200 border-slate-600' },
    { id: 'T', name: 'Trực 24h', color: 'bg-red-100 text-red-700 border-red-200 font-bold' },
    { id: 'OFF', name: 'Nghỉ', color: 'bg-gray-100 text-gray-400' },
];
