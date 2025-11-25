
import { Patient } from '../types';

// Định nghĩa kiểu dữ liệu trả về từ API (khớp với mẫu JSON bạn cung cấp)
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
            const response = await fetch('http://localhost/api/erm/getListpatient');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: ApiPatientResponse[] = await response.json();

            // Map dữ liệu từ API sang cấu trúc Patient của ứng dụng
            return data.map((item) => ({
                id: item.recordNumber, // Dùng số hồ sơ làm ID tạm
                recordNumber: item.recordNumber,
                name: item.name,
                dob: '', // API chưa có ngày sinh, để trống
                age: parseInt(item.age) || 0,
                gender: item.sex as 'Nam' | 'Nữ' | 'Khác',
                ethnicity: 'Kinh', // Default
                occupation: '',
                address: '', // API chưa có địa chỉ
                phone: '', // API chưa có SĐT
                lastVisit: new Date(item.examinationDate).toLocaleDateString('vi-VN'), // Format ngày
                patientType: item.priority === 'Dịch vụ' ? 'Dịch vụ' : 'Bảo hiểm',
                history: []
            }));
        } catch (error) {
            console.error("Lỗi khi gọi API getListpatient:", error);
            throw error;
        }
    },

    // Hàm lấy chi tiết bệnh nhân (Tạm thời filter từ list vì API chưa có endpoint detail)
    getPatientByRecordNumber: async (recordNumber: string): Promise<Patient | null> => {
        try {
            // Trong thực tế, nên gọi API detail: fetch(`http://localhost/api/erm/patient/${recordNumber}`)
            // Ở đây ta tái sử dụng getPatientList và filter client-side
            const allPatients = await receptionService.getPatientList();
            const found = allPatients.find(p => p.recordNumber === recordNumber);
            return found || null;
        } catch (error) {
            console.error("Lỗi khi lấy chi tiết bệnh nhân:", error);
            return null;
        }
    }
};
