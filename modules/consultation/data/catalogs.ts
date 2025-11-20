
// Catalog Types
export interface CatalogItem {
    code: string;
    name: string;
    group?: string;
    price?: number;
}

export interface DoctorItem {
    id: string;
    name: string;
    role: string;
    department: string;
}

// Mock Data
export const doctorOptions: DoctorItem[] = [
    { id: 'BS001', name: 'BS. Nguyễn Văn A', role: 'Trưởng khoa', department: 'Ngoại tổng quát' },
    { id: 'BS002', name: 'BS. Trần Thị B', role: 'Bác sĩ chính', department: 'Gây mê hồi sức' },
    { id: 'BS003', name: 'BS. Lê Văn C', role: 'Bác sĩ', department: 'Chấn thương chỉnh hình' },
    { id: 'BS004', name: 'BS. Phạm Văn D', role: 'Bác sĩ', department: 'Gây mê hồi sức' },
    { id: 'BS005', name: 'BS. Võ Văn Tim', role: 'Bác sĩ', department: 'Tim mạch can thiệp' },
    { id: 'DD001', name: 'ĐD. Nguyễn Thị E', role: 'Điều dưỡng', department: 'Phòng mổ' },
    { id: 'DD002', name: 'ĐD. Trần Văn F', role: 'Điều dưỡng', department: 'Hồi sức' },
    { id: 'KTV01', name: 'KTV. Lê Thị G', role: 'Kỹ thuật viên', department: 'Hình ảnh' }
];

export const surgeryOptions: CatalogItem[] = [
    { code: 'PT001', name: 'Phẫu thuật nội soi cắt ruột thừa', group: 'Tiêu hóa', price: 5000000 },
    { code: 'PT002', name: 'Phẫu thuật cắt túi mật nội soi', group: 'Tiêu hóa', price: 7500000 },
    { code: 'PT003', name: 'Phẫu thuật kết hợp xương đùi', group: 'Chấn thương', price: 12000000 },
    { code: 'PT004', name: 'Phẫu thuật thoát vị bẹn', group: 'Ngoại chung', price: 4500000 },
    { code: 'PT005', name: 'Phẫu thuật cắt trĩ Longo', group: 'Hậu môn - Trực tràng', price: 8000000 },
    { code: 'PT006', name: 'Phẫu thuật lấy thai', group: 'Sản khoa', price: 6000000 },
    { code: 'PT007', name: 'Phẫu thuật NS tái tạo dây chằng chéo', group: 'Chấn thương', price: 15000000 },
    { code: 'PT008', name: 'Phẫu thuật cắt dạ dày', group: 'Tiêu hóa', price: 18000000 },
    { code: 'PT009', name: 'Phẫu thuật thay khớp háng', group: 'Chấn thương', price: 45000000 }
];

export const procedureOptions: CatalogItem[] = [
    { code: 'TT001', name: 'Khâu vết thương phần mềm dưới 5cm', group: 'Tiểu phẫu' },
    { code: 'TT002', name: 'Nắn chỉnh sai khớp vai', group: 'Chấn thương' },
    { code: 'TT003', name: 'Chọc hút dịch màng phổi', group: 'Hô hấp' },
    { code: 'TT004', name: 'Đặt catheter tĩnh mạch trung tâm', group: 'Hồi sức' },
    { code: 'TT005', name: 'Nội soi dạ dày can thiệp', group: 'Tiêu hóa' },
    { code: 'TT006', name: 'Tiểu phẫu u bã đậu', group: 'Tiểu phẫu' },
    { code: 'TT007', name: 'Bó bột cẳng tay', group: 'Chấn thương' },
    { code: 'TT008', name: 'Thay băng vết thương nhiễm trùng', group: 'Điều dưỡng' },
    { code: 'TT009', name: 'Cắt chỉ', group: 'Điều dưỡng' }
];

export const diagnosisOptions: CatalogItem[] = [
    { code: 'K35', name: 'Viêm ruột thừa cấp', group: 'Tiêu hóa' },
    { code: 'K80', name: 'Sỏi mật', group: 'Tiêu hóa' },
    { code: 'S72', name: 'Gãy xương đùi', group: 'Chấn thương' },
    { code: 'K40', name: 'Thoát vị bẹn', group: 'Ngoại chung' },
    { code: 'I84', name: 'Trĩ nội', group: 'Hậu môn' },
    { code: 'O82', name: 'Mổ lấy thai', group: 'Sản khoa' },
    { code: 'S83', name: 'Tổn thương dây chằng đầu gối', group: 'Chấn thương' },
    { code: 'K29', name: 'Viêm dạ dày', group: 'Tiêu hóa' },
    { code: 'S01', name: 'Vết thương hở ở đầu', group: 'Chấn thương' }
];
