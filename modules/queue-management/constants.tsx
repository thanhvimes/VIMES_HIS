
import { ServiceItem, ServiceType, MedicalRecord } from './types';
import { NavItemType } from '../../types';
import { Squares2X2Icon, TvIcon, UserGroupIcon, ComputerDesktopIcon, CogIcon, HeartIcon } from '../../components/Icons';
import React from 'react';

export const SERVICE_CATALOG: ServiceItem[] = [
  { id: 'S001', name: 'Khám Nội tổng quát', unit: 'Lần', price: 150000, type: ServiceType.TECHNICAL, description: 'Khám lâm sàng chung' },
  { id: 'S002', name: 'Chụp X-Quang Ngực thẳng', unit: 'Lần', price: 120000, type: ServiceType.TECHNICAL },
  { id: 'S003', name: 'Siêu âm ổ bụng tổng quát', unit: 'Lần', price: 200000, type: ServiceType.TECHNICAL },
  { id: 'S004', name: 'Xét nghiệm công thức máu (24 chỉ số)', unit: 'Lần', price: 90000, type: ServiceType.TECHNICAL },
  { id: 'S005', name: 'MRI Sọ não', unit: 'Lần', price: 2500000, type: ServiceType.TECHNICAL },
  { id: 'M001', name: 'Paracetamol 500mg', unit: 'Viên', price: 500, type: ServiceType.MEDICINE },
  { id: 'M002', name: 'Augmentin 625mg', unit: 'Viên', price: 15000, type: ServiceType.MEDICINE },
  { id: 'M003', name: 'Nước muối sinh lý 0.9%', unit: 'Chai', price: 10000, type: ServiceType.MEDICINE },
  { id: 'M004', name: 'Vitamin C 500mg', unit: 'Vỉ', price: 20000, type: ServiceType.MEDICINE },
];

export const MOCK_RECORDS: MedicalRecord[] = [
  {
    id: 'BN123456',
    patientName: 'NGUYỄN VĂN A',
    gender: 'Nam',
    identityNumber: '001085000001',
    dob: '20/05/1985',
    age: 39,
    address: 'Số 12, Ngõ 5, Đường Láng, Hà Nội',
    insuranceCard: 'DN4010123456789',
    visitDate: '25/10/2023 09:30',
    department: 'Khoa Nội Hô Hấp',
    doctorName: 'BS.CKI Lê Thị B',
    reason: 'Ho khan kéo dài, tức ngực về đêm',
    diagnosis: 'Viêm phế quản cấp / Theo dõi Trào ngược dạ dày',
    icd10: 'J20.9 - K21.9',
    vitals: {
      pulse: 88,
      temperature: 37.2,
      bloodPressure: '120/80',
      respiratoryRate: 20,
      weight: 72,
      height: 175,
      bmi: 23.5,
      spo2: 98
    },
    labResults: [
      { category: 'Huyết học', name: 'WBC (Bạch cầu)', value: '12.5', unit: 'G/L', reference_range: '4.0-10.0', is_abnormal: true },
      { category: 'Huyết học', name: 'RBC (Hồng cầu)', value: '4.8', unit: 'T/L', reference_range: '3.8-5.3', is_abnormal: false },
      { category: 'Huyết học', name: 'PLT (Tiểu cầu)', value: '250', unit: 'G/L', reference_range: '150-450', is_abnormal: false },
      { category: 'Sinh hóa', name: 'CRP hs', value: '15.0', unit: 'mg/L', reference_range: '< 5.0', is_abnormal: true },
      { category: 'Sinh hóa', name: 'AST (GOT)', value: '30', unit: 'U/L', reference_range: '< 37', is_abnormal: false },
    ],
    imagingResults: [
      {
        name: 'X-Quang Ngực Thẳng',
        conclusion: 'Hình ảnh dày thành phế quản 2 bên rốn phổi.',
        description: 'Bóng tim không to. Góc sườn hoành sáng. Không thấy hình ảnh tổn thương nhu mô phổi khu trú.',
        imageUrl: 'https://prod-images-static.radiopaedia.org/images/53322548/3133971a06733230489b2510258100_big_gallery.jpeg'
      }
    ],
    prescription: [
      { drug_name: 'Augmentin 1g', quantity: '14', unit: 'Viên', dosage: 'Ngày uống 2 lần, mỗi lần 1 viên', instruction: 'Uống sau ăn no' },
      { drug_name: 'Acetylcystein 200mg', quantity: '20', unit: 'Gói', dosage: 'Ngày uống 2 lần, mỗi lần 1 gói', instruction: 'Hòa tan vào nước' },
      { drug_name: 'Esomeprazol 40mg', quantity: '14', unit: 'Viên', dosage: 'Ngày uống 1 lần, mỗi lần 1 viên', instruction: 'Uống trước ăn sáng 30 phút' },
    ]
  },
  {
    id: 'BN987654',
    patientName: 'TRẦN THỊ C',
    gender: 'Nữ',
    identityNumber: '079155000002',
    dob: '10/12/1955',
    age: 68,
    address: 'P. Thảo Điền, TP. Thủ Đức, TP.HCM',
    insuranceCard: 'HT2791123456789',
    visitDate: '26/10/2023 14:15',
    department: 'Khoa Nội Tiết',
    doctorName: 'ThS.BS Phạm Văn D',
    reason: 'Mệt mỏi, khát nước nhiều, sụt cân',
    diagnosis: 'Đái tháo đường type 2 - Rối loạn lipid máu',
    icd10: 'E11 - E78',
    vitals: {
      pulse: 76,
      temperature: 36.5,
      bloodPressure: '135/85',
      respiratoryRate: 18,
      weight: 60,
      height: 155,
      bmi: 25.0,
      spo2: 99
    },
    labResults: [
      { category: 'Sinh hóa', name: 'Glucose (Lúc đói)', value: '9.8', unit: 'mmol/L', reference_range: '3.9-6.4', is_abnormal: true },
      { category: 'Sinh hóa', name: 'HbA1c', value: '7.8', unit: '%', reference_range: '< 6.5', is_abnormal: true },
      { category: 'Sinh hóa', name: 'Cholesterol TP', value: '6.2', unit: 'mmol/L', reference_range: '< 5.2', is_abnormal: true },
      { category: 'Sinh hóa', name: 'Triglyceride', value: '2.5', unit: 'mmol/L', reference_range: '< 1.7', is_abnormal: true },
    ],
    imagingResults: [],
    prescription: [
      { drug_name: 'Glucophage XR 750mg', quantity: '60', unit: 'Viên', dosage: 'Ngày uống 2 viên', instruction: 'Uống sau bữa ăn tối' },
      { drug_name: 'Atorvastatin 20mg', quantity: '30', unit: 'Viên', dosage: 'Ngày uống 1 viên', instruction: 'Uống buổi tối' },
    ]
  }
];

export const QUEUE_NAV_ITEMS: NavItemType[] = [
  { name: 'Bảng điều khiển', path: '/queue-management', icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }), iconName: 'Squares2X2Icon' },
  
  // Nhóm THIẾT BỊ ĐẦU CUỐI
  { name: 'Máy lấy số (Kiosk)', path: '/queue-management/kiosk', icon: React.createElement(ComputerDesktopIcon, { className: "w-5 h-5" }), section: 'THIẾT BỊ ĐẦU CUỐI', iconName: 'ComputerDesktopIcon' },
  { name: 'Bảng hiển thị quầy', path: '/queue-management/display', icon: React.createElement(TvIcon, { className: "w-5 h-5" }), section: 'THIẾT BỊ ĐẦU CUỐI', iconName: 'TvIcon' },
  { name: 'Bảng sảnh trung tâm', path: '/queue-management/central', icon: React.createElement(TvIcon, { className: "w-5 h-5" }), section: 'THIẾT BỊ ĐẦU CUỐI', iconName: 'TvIcon' },
  { name: 'Bảng phòng mổ', path: '/queue-management/surgery', icon: React.createElement(HeartIcon, { className: "w-5 h-5" }), section: 'THIẾT BỊ ĐẦU CUỐI', iconName: 'HeartIcon' },

  // Nhóm PHỤC VỤ & GỌI SỐ
  { name: 'Bàn gọi số bác sĩ', path: '/queue-management/operator', icon: React.createElement(UserGroupIcon, { className: "w-5 h-5" }), section: 'PHỤC VỤ & GỌI SỐ', iconName: 'UserGroupIcon' },

  // Cấu hình
  { name: 'Cấu hình hệ thống QMS', path: '/queue-management/settings', icon: React.createElement(CogIcon, { className: "w-5 h-5" }), section: 'CẤU HÌNH', iconName: 'CogIcon' }
];