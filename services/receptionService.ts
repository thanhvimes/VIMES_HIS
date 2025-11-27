
import { Patient } from '../types';
import { mockPatients } from '../modules/reception/data';

// Định nghĩa kiểu dữ liệu trả về từ API
export interface ApiPatientResponse {
    ticketNumber: string;
    recordNumber: string;
    name: string;
    age: string; // API trả về string
    sex: string;
    priority: string;
    examinationDate: string;
    endDate: string | null;
    status: string;
    diagnostic: string;
    suggestion: string | null;
}

export const receptionService = {
    // Hàm gọi API lấy danh sách bệnh nhân
    getPatientList: async (): Promise<Patient[]> => {
        try {
            console.log("Đang gọi API: http://localhost/api/erm/getListpatient...");
            const response = await fetch('http://localhost/api/erm/getListpatient');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: ApiPatientResponse[] = await response.json();
            console.log("Đã tải dữ liệu từ API thành công:", data);

            // Map dữ liệu từ API sang cấu trúc Patient của ứng dụng
            return data.map((item) => ({
                id: item.recordNumber, // Dùng số hồ sơ làm ID tạm
                recordNumber: item.recordNumber,
                name: item.name,
                dob: '', // API chưa trả về ngày sinh, để trống
                age: parseInt(item.age) || 0,
                gender: item.sex as 'Nam' | 'Nữ' | 'Khác',
                ethnicity: 'Kinh', // Mặc định
                occupation: '',
                address: '', // API chưa có địa chỉ
                phone: '', // API chưa có SĐT
                lastVisit: item.examinationDate ? new Date(item.examinationDate).toLocaleDateString('vi-VN') : '',
                patientType: item.priority === 'Dịch vụ' ? 'Dịch vụ' : 'Bảo hiểm',
                history: []
            }));
        } catch (error) {
            console.warn("Không thể gọi API (Backend có thể chưa chạy). Đang chuyển sang dữ liệu mẫu.", error);
            
            // Fallback: Trả về dữ liệu mẫu nếu API lỗi để app không bị crash
            // Sử dụng mockPatients trực tiếp để đảm bảo ID khớp với logic chi tiết
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(mockPatients);
                }, 300); 
            });
        }
    },

    // Hàm lấy chi tiết bệnh nhân
    getPatientByRecordNumber: async (identifier: string): Promise<Patient | null> => {
        try {
            console.log(`Đang tìm kiếm bệnh nhân với ID/Mã: ${identifier}`);
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Tìm kiếm linh hoạt hơn: theo ID, Số hồ sơ, hoặc CCCD
            // Chuẩn hóa input về string và trim spaces
            const searchKey = identifier.toString().trim();

            const found = mockPatients.find(p => 
                p.id === searchKey || 
                p.recordNumber === searchKey || 
                p.identityCard === searchKey ||
                (p.phone && p.phone.includes(searchKey))
            );

            if (found) {
                console.log("Đã tìm thấy bệnh nhân trong Mock Data:", found);
                return found;
            }
            
            console.warn("Không tìm thấy bệnh nhân trong Mock Data.");
            return null;
        } catch (error) {
            console.error("Lỗi khi lấy chi tiết bệnh nhân:", error);
            return null;
        }
    }
};
