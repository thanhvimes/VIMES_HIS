
import { Patient } from '../types/patient';
import { mockPatients } from '../modules/reception/data';

export interface ApiPatientResponse {
    ticketNumber: string;
    recordNumber: string;
    name: string;
    age: string; 
    sex: string;
    priority: string;
    examinationDate: string;
    endDate: string | null;
    status: string;
    diagnostic: string;
    suggestion: string | null;
}

export const receptionService = {
    getPatientList: async (): Promise<Patient[]> => {
        try {
            console.log("Đang gọi API: http://localhost/api/erm/getListpatient...");
            const response = await fetch('http://localhost/api/erm/getListpatient');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: ApiPatientResponse[] = await response.json();
            console.log("Đã tải dữ liệu từ API thành công:", data);

            return data.map((item) => ({
                id: item.recordNumber, 
                recordNumber: item.recordNumber,
                name: item.name,
                dob: '', 
                age: parseInt(item.age) || 0,
                gender: item.sex as 'Nam' | 'Nữ' | 'Khác',
                ethnicity: 'Kinh', 
                occupation: '',
                address: '', 
                phone: '', 
                lastVisit: item.examinationDate ? new Date(item.examinationDate).toLocaleDateString('vi-VN') : '',
                patientType: item.priority === 'Dịch vụ' ? 'Dịch vụ' : 'Bảo hiểm',
                history: []
            }));
        } catch (error) {
            console.warn("Không thể gọi API (Backend có thể chưa chạy). Đang chuyển sang dữ liệu mẫu.", error);
            
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(mockPatients);
                }, 300); 
            });
        }
    },

    getPatientByRecordNumber: async (identifier: string): Promise<Patient | null> => {
        try {
            console.log(`Đang tìm kiếm bệnh nhân với ID/Mã: ${identifier}`);
            await new Promise(resolve => setTimeout(resolve, 300));
            
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
