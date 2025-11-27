import { DrugItem, ICD10, DoctorItem, ServiceItem, CatalogItem } from '../types';

export const mockMasterDataService = {
    getDrugs: async (): Promise<DrugItem[]> => {
        // Simulate API
        return [
            { code: 'D001', name: 'Paracetamol 500mg', unit: 'Viên', price: 500, usageRoute: 'Uống', activeIngredient: 'Paracetamol', stock: 1000 },
            { code: 'D002', name: 'Amoxicillin 500mg', unit: 'Viên', price: 1200, usageRoute: 'Uống', activeIngredient: 'Amoxicillin', stock: 500 },
            { code: 'D003', name: 'Ibuprofen 400mg', unit: 'Viên', price: 1500, usageRoute: 'Uống', activeIngredient: 'Ibuprofen', stock: 300 },
            { code: 'D004', name: 'Omeprazol 20mg', unit: 'Viên', price: 2000, usageRoute: 'Uống', activeIngredient: 'Omeprazole', stock: 400 },
            { code: 'D005', name: 'Metformin 500mg', unit: 'Viên', price: 1800, usageRoute: 'Uống', activeIngredient: 'Metformin', stock: 600 },
        ];
    },

    getICD10: async (): Promise<CatalogItem[]> => {
        return [
            { code: 'A09', name: 'Tiêu chảy và viêm dạ dày ruột nguồn gốc nhiễm trùng' },
            { code: 'E10', name: 'Bệnh đái tháo đường phụ thuộc insuline' },
            { code: 'E11', name: 'Bệnh đái tháo đường không phụ thuộc insuline' },
            { code: 'I10', name: 'Bệnh tăng huyết áp vô căn (nguyên phát)' },
            { code: 'J00', name: 'Viêm mũi họng cấp tính [Cảm lạnh]' },
            { code: 'J02', name: 'Viêm họng cấp tính' },
            { code: 'R51', name: 'Đau đầu' },
        ];
    },

    getDoctors: async (): Promise<DoctorItem[]> => {
        return [
            { id: 'BS001', name: 'BS. Nguyễn Văn A', role: 'Trưởng khoa', department: 'Ngoại tổng quát' },
            { id: 'BS002', name: 'BS. Trần Thị B', role: 'Bác sĩ chính', department: 'Gây mê hồi sức' },
            { id: 'BS003', name: 'BS. Lê Văn C', role: 'Bác sĩ', department: 'Chấn thương chỉnh hình' },
            { id: 'BS004', name: 'BS. Phạm Văn D', role: 'Bác sĩ', department: 'Gây mê hồi sức' },
        ];
    }
};
