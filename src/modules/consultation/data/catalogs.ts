
import { CatalogItem, DoctorItem, ServiceCategory, ServiceItem, ServiceTemplate } from '../../../types';
import { DrugItem } from '../../../types/finance';

// Re-export types for backward compatibility with existing imports
export type { CatalogItem, DoctorItem, ServiceCategory, ServiceItem, ServiceTemplate };

// Mock Data - In real app, these might be fetched or kept as static fallbacks
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
    { code: 'A09', name: 'Tiêu chảy và viêm dạ dày ruột nguồn gốc nhiễm trùng', group: 'Tiêu hóa' },
    { code: 'E10', name: 'Bệnh đái tháo đường phụ thuộc insuline', group: 'Nội tiết' },
    { code: 'E11', name: 'Bệnh đái tháo đường không phụ thuộc insuline', group: 'Nội tiết' },
    { code: 'E78', name: 'Rối loạn chuyển hóa lipoprotein và tình trạng tăng lipid máu khác', group: 'Nội tiết' },
    { code: 'I10', name: 'Bệnh tăng huyết áp vô căn (nguyên phát)', group: 'Tim mạch' },
    { code: 'I20', name: 'Cơn đau thắt ngực', group: 'Tim mạch' },
    { code: 'I21', name: 'Nhồi máu cơ tim cấp', group: 'Tim mạch' },
    { code: 'J00', name: 'Viêm mũi họng cấp tính [Cảm lạnh]', group: 'Hô hấp' },
    { code: 'J02', name: 'Viêm họng cấp tính', group: 'Hô hấp' },
    { code: 'J06', name: 'Nhiễm trùng đường hô hấp trên cấp tính ở nhiều vị trí', group: 'Hô hấp' },
    { code: 'J18', name: 'Viêm phổi, tác nhân không xác định', group: 'Hô hấp' },
    { code: 'J20', name: 'Viêm phế quản cấp tính', group: 'Hô hấp' },
    { code: 'K21', name: 'Bệnh trào ngược dạ dày - thực quản', group: 'Tiêu hóa' },
    { code: 'K29', name: 'Viêm dạ dày và tá tràng', group: 'Tiêu hóa' },
    { code: 'K35', name: 'Viêm ruột thừa cấp', group: 'Tiêu hóa' },
    { code: 'K80', name: 'Sỏi mật', group: 'Tiêu hóa' },
    { code: 'M54', name: 'Đau lưng', group: 'Cơ xương khớp' },
    { code: 'N10', name: 'Viêm thận - bể thận cấp', group: 'Tiết niệu' },
    { code: 'N30', name: 'Viêm bàng quang', group: 'Tiết niệu' },
    { code: 'R51', name: 'Đau đầu', group: 'Thần kinh' },
    { code: 'S01', name: 'Vết thương hở ở đầu', group: 'Chấn thương' },
    { code: 'S72', name: 'Gãy xương đùi', group: 'Chấn thương' },
    { code: 'S83', name: 'Tổn thương dây chằng đầu gối', group: 'Chấn thương' }
];

export const serviceCategories: ServiceCategory[] = [
    { id: 'CAT_HH', name: 'Xét nghiệm huyết học', type: 'XN' },
    { id: 'CAT_SH', name: 'Xét nghiệm hóa sinh', type: 'XN' },
    { id: 'CAT_MD', name: 'Xét nghiệm miễn dịch', type: 'XN' },
    { id: 'CAT_VS', name: 'Xét nghiệm vi sinh', type: 'XN' },
    { id: 'CAT_NUOC', name: 'Xét nghiệm nước tiểu', type: 'XN' },
    { id: 'CAT_XQ', name: 'X-Quang kỹ thuật số', type: 'CDHA' },
    { id: 'CAT_SA', name: 'Siêu âm chẩn đoán', type: 'CDHA' },
    { id: 'CAT_DT', name: 'Điện tim - Điện não', type: 'TDCN' },
];

export const serviceList: ServiceItem[] = [
    // Huyết học
    { id: 'S_001', code: 'HH01', name: 'Tổng phân tích tế bào máu ngoại vi', categoryId: 'CAT_HH', price: 110000, unit: 'Lần' },
    { id: 'S_002', code: 'HH02', name: 'Định nhóm máu hệ ABO', categoryId: 'CAT_HH', price: 80000, unit: 'Lần' },
    { id: 'S_003', code: 'HH03', name: 'Đông máu cơ bản (PT, APTT, Fibrinogen)', categoryId: 'CAT_HH', price: 250000, unit: 'Lần' },
    
    // Hóa sinh
    { id: 'S_004', code: 'SH01', name: 'Định lượng Glucose [Máu]', categoryId: 'CAT_SH', price: 30000, unit: 'Lần' },
    { id: 'S_005', code: 'SH02', name: 'Định lượng Urea [Máu]', categoryId: 'CAT_SH', price: 30000, unit: 'Lần' },
    { id: 'S_006', code: 'SH03', name: 'Định lượng Creatinine [Máu]', categoryId: 'CAT_SH', price: 30000, unit: 'Lần' },
    { id: 'S_007', code: 'SH04', name: 'Định lượng AST (GOT) [Máu]', categoryId: 'CAT_SH', price: 30000, unit: 'Lần' },
    { id: 'S_008', code: 'SH05', name: 'Định lượng ALT (GPT) [Máu]', categoryId: 'CAT_SH', price: 30000, unit: 'Lần' },
    { id: 'S_009', code: 'SH06', name: 'Định lượng Cholesterol toàn phần', categoryId: 'CAT_SH', price: 40000, unit: 'Lần' },
    { id: 'S_010', code: 'SH07', name: 'Định lượng Triglyceride', categoryId: 'CAT_SH', price: 40000, unit: 'Lần' },
    { id: 'S_011', code: 'SH08', name: 'Định lượng Acid Uric [Máu]', categoryId: 'CAT_SH', price: 30000, unit: 'Lần' },
    { id: 'S_012', code: 'SH09', name: 'Định lượng Bilirubin toàn phần', categoryId: 'CAT_SH', price: 30000, unit: 'Lần' },
    { id: 'S_013', code: 'SH10', name: 'Định lượng Bilirubin trực tiếp', categoryId: 'CAT_SH', price: 30000, unit: 'Lần' },
    { id: 'S_014', code: 'SH11', name: 'Điện giải đồ (Na, K, Cl)', categoryId: 'CAT_SH', price: 90000, unit: 'Lần' },

    // Miễn dịch
    { id: 'S_015', code: 'MD01', name: 'HBsAg (Test nhanh)', categoryId: 'CAT_MD', price: 80000, unit: 'Test' },
    { id: 'S_016', code: 'MD02', name: 'HCV Ab (Test nhanh)', categoryId: 'CAT_MD', price: 80000, unit: 'Test' },
    { id: 'S_017', code: 'MD03', name: 'HIV Ab (Test nhanh)', categoryId: 'CAT_MD', price: 100000, unit: 'Test' },
    { id: 'S_018', code: 'MD04', name: 'Định lượng T3, T4, TSH', categoryId: 'CAT_MD', price: 350000, unit: 'Lần' },

    // X-Quang
    { id: 'S_019', code: 'XQ01', name: 'Chụp X-quang ngực thẳng', categoryId: 'CAT_XQ', price: 150000, unit: 'Lần' },
    { id: 'S_020', code: 'XQ02', name: 'Chụp X-quang cột sống thắt lưng', categoryId: 'CAT_XQ', price: 180000, unit: 'Lần' },
    
    // Siêu âm
    { id: 'S_021', code: 'SA01', name: 'Siêu âm ổ bụng tổng quát', categoryId: 'CAT_SA', price: 120000, unit: 'Lần' },
    { id: 'S_022', code: 'SA02', name: 'Siêu âm tuyến giáp', categoryId: 'CAT_SA', price: 120000, unit: 'Lần' },

    // Điện tim
    { id: 'S_023', code: 'DT01', name: 'Điện tâm đồ thường', categoryId: 'CAT_DT', price: 80000, unit: 'Lần' },
];

export const serviceTemplates: ServiceTemplate[] = [
    {
        id: 'TMP_01',
        name: 'Khám sức khỏe tổng quát (Cơ bản)',
        description: 'Gói xét nghiệm máu, nước tiểu và X-quang ngực',
        serviceIds: ['S_001', 'S_004', 'S_005', 'S_006', 'S_007', 'S_008', 'S_019', 'S_021']
    },
    {
        id: 'TMP_02',
        name: 'Tầm soát Đái tháo đường - Mỡ máu',
        description: 'Bộ mỡ máu 4 chỉ số và đường huyết',
        serviceIds: ['S_004', 'S_009', 'S_010']
    },
    {
        id: 'TMP_03',
        name: 'Kiểm tra chức năng Gan - Thận',
        description: 'Men gan và chức năng thận',
        serviceIds: ['S_005', 'S_006', 'S_007', 'S_008']
    },
    {
        id: 'TMP_04',
        name: 'Tiền phẫu thuật (Cơ bản)',
        description: 'XN cần thiết trước khi mổ',
        serviceIds: ['S_001', 'S_002', 'S_003', 'S_015', 'S_017', 'S_004', 'S_005', 'S_006', 'S_019', 'S_023']
    }
];

export const drugList: DrugItem[] = [
    { code: 'D001', name: 'Paracetamol 500mg', unit: 'Viên', price: 500, usageRoute: 'Uống', activeIngredient: 'Paracetamol', stock: 1000 },
    { code: 'D002', name: 'Amoxicillin 500mg', unit: 'Viên', price: 1200, usageRoute: 'Uống', activeIngredient: 'Amoxicillin', stock: 500 },
    { code: 'D003', name: 'Ibuprofen 400mg', unit: 'Viên', price: 1500, usageRoute: 'Uống', activeIngredient: 'Ibuprofen', stock: 300 },
    { code: 'D004', name: 'Omeprazol 20mg', unit: 'Viên', price: 2000, usageRoute: 'Uống', activeIngredient: 'Omeprazole', stock: 400 },
    { code: 'D005', name: 'Metformin 500mg', unit: 'Viên', price: 1800, usageRoute: 'Uống', activeIngredient: 'Metformin', stock: 600 },
    { code: 'D006', name: 'Amlodipine 5mg', unit: 'Viên', price: 1000, usageRoute: 'Uống', activeIngredient: 'Amlodipine', stock: 700 },
    { code: 'D007', name: 'Vitamin C 500mg', unit: 'Viên', price: 800, usageRoute: 'Uống', activeIngredient: 'Ascorbic Acid', stock: 1200 },
    { code: 'D008', name: 'Natri Clorid 0.9% 10ml', unit: 'Lọ', price: 5000, usageRoute: 'Nhỏ mắt/mũi', activeIngredient: 'NaCl', stock: 200 },
    { code: 'D009', name: 'Berberin 100mg', unit: 'Viên', price: 500, usageRoute: 'Uống', activeIngredient: 'Berberine', stock: 500 },
    { code: 'D010', name: 'Oresol 27.9g', unit: 'Gói', price: 3000, usageRoute: 'Uống', activeIngredient: 'Glucose, Salts', stock: 300 },
];
