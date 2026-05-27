
import { TreeNode } from '../../components/ui/DocumentTree';

export interface ImagingRequest {
    id: string;
    patientId: string;
    patientName: string;
    age: number;
    gender: string;
    serviceName: string;
    modality: 'X-Ray' | 'CT' | 'MRI' | 'Ultrasound' | 'Endoscopy'; // Added Endoscopy
    bodyPart: string;
    requestDate: string;
    priority: 'Normal' | 'Urgent';
    status: 'Scheduled' | 'Processing' | 'Acquired' | 'Reported' | 'Approved';
    technician?: string;
    radiologist?: string;
    room?: string;
    imageUrl?: string; // Mock single image for demo
    report?: string;
    diagnosis?: string;
    patientType?: 'Dịch vụ' | 'Bảo hiểm';
    phone?: string;
}

export interface ReportTemplate {
    id: string;
    name: string;
    modality: 'X-Ray' | 'CT' | 'MRI' | 'Ultrasound' | 'Endoscopy';
    content: string;
    group?: string;
}

export const mockRequests: ImagingRequest[] = [
    {
        id: 'REQ-NS-001',
        patientId: 'P003',
        patientName: 'Lê Hoàng Cường',
        age: 45,
        gender: 'Nam',
        serviceName: 'Nội soi Dạ dày - Tá tràng (Gây mê)',
        modality: 'Endoscopy',
        bodyPart: 'Stomach',
        requestDate: '2023-11-16 08:15',
        priority: 'Normal',
        status: 'Processing',
        technician: 'ĐD. Nguyễn Thị B',
        radiologist: 'BS. Phạm Văn Soi',
        room: 'P. Nội Soi 01',
        imageUrl: '', // No single image, will simulate capture gallery
        patientType: 'Dịch vụ',
        phone: '0905123456'
    },
    {
        id: 'REQ-001',
        patientId: 'P003',
        patientName: 'Lê Hoàng Cường',
        age: 45,
        gender: 'Nam',
        serviceName: 'X-Quang Ngực thẳng',
        modality: 'X-Ray',
        bodyPart: 'Chest',
        requestDate: '2023-11-15 08:30',
        priority: 'Normal',
        status: 'Approved',
        technician: 'KTV. Nguyễn Văn Tú',
        radiologist: 'BS. Trần Thanh',
        room: 'P. XQ 01',
        // Chest X-Ray (Normal)
        imageUrl: 'https://prod-images-static.radiopaedia.org/images/31521/0a8d37d7996342775b761094577303_jumbo.jpeg',
        report: 'Kỹ thuật: Chụp X-quang ngực thẳng đứng.\n\nMô tả hình ảnh:\n- Lồng ngực cân đối.\n- Nhu mô phổi sáng đều hai bên.\n- Không thấy đám mờ khu trú.\n- Góc sườn hoành hai bên nhọn.\n- Bóng tim không to.\n\nKết luận: Hình ảnh tim phổi bình thường.',
        patientType: 'Dịch vụ',
        phone: '0905123456'
    },
    {
        id: 'REQ-002',
        patientId: 'P001',
        patientName: 'Nguyễn Văn An',
        age: 35,
        gender: 'Nam',
        serviceName: 'Siêu âm ổ bụng tổng quát',
        modality: 'Ultrasound',
        bodyPart: 'Abdomen',
        requestDate: '2023-11-15 09:00',
        priority: 'Urgent',
        status: 'Reported',
        technician: 'BS. Lê Văn Siêu',
        room: 'P. SA 02',
        // Ultrasound Liver/Kidney
        imageUrl: 'https://prod-images-static.radiopaedia.org/images/6057290/93d9667d9266733660227072365724_jumbo.jpg',
        report: 'GAN: Kích thước không lớn, bờ đều, nhu mô đồng nhất. Không thấy khối khu trú.\nĐƯỜNG MẬT: Không giãn, không sỏi.\nTÚI MẬT: Thành mỏng, không sỏi.\nTỤY: Bình thường.\nLÁCH: Kích thước bình thường.\nTHẬN: Hai thận không sỏi, không ứ nước.\n\nKẾT LUẬN: Hình ảnh siêu âm bụng chưa phát hiện bất thường.',
        patientType: 'Dịch vụ',
        phone: '0912345678'
    },
    {
        id: 'REQ-003',
        patientId: 'P004',
        patientName: 'Phạm Thị Dung',
        age: 22,
        gender: 'Nữ',
        serviceName: 'CT Sọ não không cản quang',
        modality: 'CT',
        bodyPart: 'Head',
        requestDate: '2023-11-15 09:15',
        priority: 'Normal',
        status: 'Acquired',
        technician: 'KTV. Lê Thị Mai',
        room: 'P. CT 01',
        // Brain CT (Normal Axial)
        imageUrl: 'https://prod-images-static.radiopaedia.org/images/2296062/c6c702c3e7c03a765f59049603e22e_jumbo.jpg',
        patientType: 'Dịch vụ',
        phone: '0358987654'
    },
    {
        id: 'REQ-004',
        patientId: 'P005',
        patientName: 'Hoàng Văn Em',
        age: 12,
        gender: 'Nam',
        serviceName: 'X-Quang Cẳng tay trái',
        modality: 'X-Ray',
        bodyPart: 'Extremity',
        requestDate: '2023-11-15 10:00',
        priority: 'Urgent',
        status: 'Acquired',
        technician: 'KTV. Nguyễn Văn Tú',
        room: 'P. XQ 02',
        // Forearm X-Ray (Greenstick Fracture)
        imageUrl: 'https://prod-images-static.radiopaedia.org/images/130629/20b977c70967402366936033320026_jumbo.jpg',
        patientType: 'Bảo hiểm',
        phone: '0988776655'
    },
    {
        id: 'REQ-005',
        patientId: 'P002',
        patientName: 'Trần Thị Bích',
        age: 31,
        gender: 'Nữ',
        serviceName: 'MRI Cột sống thắt lưng',
        modality: 'MRI',
        bodyPart: 'Spine',
        requestDate: '2023-11-15 11:00',
        priority: 'Normal',
        status: 'Acquired',
        technician: 'KTV. Trần Văn M',
        room: 'P. MRI 01',
        // MRI Lumbar Spine (Sagittal T2)
        imageUrl: 'https://prod-images-static.radiopaedia.org/images/523822/75b32f560343670853330762066550_jumbo.jpg',
        patientType: 'Bảo hiểm',
        phone: '0987654321'
    },
    {
        id: 'REQ-006',
        patientId: 'P003',
        patientName: 'Lê Hoàng Cường',
        age: 45,
        gender: 'Nam',
        serviceName: 'MRI Sọ não',
        modality: 'MRI',
        bodyPart: 'Head',
        requestDate: '2023-11-16 08:00',
        priority: 'Normal',
        status: 'Processing',
        technician: 'KTV. Trần Văn M',
        room: 'P. MRI 01',
        // MRI Brain (Normal Axial)
        imageUrl: 'https://prod-images-static.radiopaedia.org/images/157210/332498af42e8d265020d556e900d9a_jumbo.jpg',
        patientType: 'Dịch vụ',
        phone: '0905123456'
    },
    {
        id: 'REQ-007',
        patientId: 'P001',
        patientName: 'Nguyễn Văn An',
        age: 35,
        gender: 'Nam',
        serviceName: 'CT Ngực (Có cản quang)',
        modality: 'CT',
        bodyPart: 'Chest',
        requestDate: '2023-11-16 09:30',
        priority: 'Urgent',
        status: 'Acquired',
        technician: 'KTV. Lê Thị Mai',
        room: 'P. CT 01',
        // CT Pulmonary Angiogram (Embolism)
        imageUrl: 'https://prod-images-static.radiopaedia.org/images/54524293/d977529652c824095f654f7c352761_jumbo.jpg',
        patientType: 'Dịch vụ',
        phone: '0912345678'
    },
    {
        id: 'REQ-008',
        patientId: 'P004',
        patientName: 'Phạm Thị Dung',
        age: 22,
        gender: 'Nữ',
        serviceName: 'X-Quang Khớp gối thẳng/nghiêng',
        modality: 'X-Ray',
        bodyPart: 'Extremity',
        requestDate: '2023-11-16 10:45',
        priority: 'Normal',
        status: 'Scheduled',
        technician: 'KTV. Nguyễn Văn Tú',
        room: 'P. XQ 01',
        // Knee X-Ray (Normal)
        imageUrl: 'https://prod-images-static.radiopaedia.org/images/51665203/233d35423207068736406926750671_jumbo.jpeg',
        patientType: 'Dịch vụ',
        phone: '0358987654'
    }
];

export const mockTemplates: ReportTemplate[] = [
    {
        id: 'TPL-NS-01',
        name: 'Nội soi Dạ dày (Viêm sung huyết)',
        modality: 'Endoscopy',
        group: 'Tiêu hóa',
        content: "KỸ THUẬT: Nội soi thực quản - dạ dày - tá tràng bằng ống mềm.\n\nMÔ TẢ HÌNH ẢNH:\n- THỰC QUẢN: Niêm mạc hồng nhẵn, không loét, nhu động bình thường.\n- TÂM VỊ: Đóng mở tốt, niêm mạc phù nề nhẹ.\n- DẠ DÀY:\n  + Phình vị: Niêm mạc bình thường.\n  + Thân vị: Niêm mạc hồng, dịch trong.\n  + Hang vị: Niêm mạc sung huyết đỏ rải rác, không thấy ổ loét.\n  + Môn vị: Tròn, co bóp tốt.\n- HÀNH TÁ TRÀNG: Niêm mạc viêm đỏ nhẹ.\n- TÁ TRÀNG D2: Bình thường.\n- CLO-TEST: Âm tính (-)\n\nKẾT LUẬN: Viêm sung huyết hang vị dạ dày mức độ nhẹ."
    },
    {
        id: 'TPL-NS-02',
        name: 'Nội soi Đại tràng (Polyp)',
        modality: 'Endoscopy',
        group: 'Tiêu hóa',
        content: "KỸ THUẬT: Nội soi đại trực tràng toàn bộ.\n\nMÔ TẢ HÌNH ẢNH:\n- HẬU MÔN: Không có trĩ ngoại, cơ vòng co thắt tốt.\n- TRỰC TRÀNG: Niêm mạc hồng, mạch máu rõ.\n- ĐẠI TRÀNG XIGMA: Niêm mạc hồng nhẵn.\n- ĐẠI TRÀNG XUỐNG: Niêm mạc hồng.\n- ĐẠI TRÀNG NGANG: Niêm mạc hồng.\n- ĐẠI TRÀNG LÊN: Tại vị trí gần góc gan có 01 polyp kích thước ~0.5cm, bề mặt trơn láng, có cuống (0-Ip). Đã tiến hành cắt polyp bằng thòng lọng (snare).\n- MANH TRÀNG & VAN BAUGHIN: Bình thường.\n\nKẾT LUẬN: Polyp đại tràng lên (Đã cắt qua nội soi)."
    },
    {
        id: 'TPL-XQ-01',
        name: 'X-Quang Ngực Thẳng (Bình thường)',
        modality: 'X-Ray',
        group: 'Hô hấp',
        content: "KỸ THUẬT: Chụp X-quang ngực thẳng.\n\nMÔ TẢ HÌNH ẢNH:\n- Lồng ngực cân đối, không gù vẹo.\n- Nhu mô phổi sáng đều hai bên, không thấy đám mờ khu trú hay thâm nhiễm.\n- Rốn phổi hai bên bình thường.\n- Góc sườn hoành hai bên sáng, nhọn.\n- Bóng tim không to, chỉ số tim/lồng ngực < 0.5.\n- Khung xương thành ngực không thấy tổn thương.\n\nKẾT LUẬN: Hiện tại chưa thấy hình ảnh bất thường trên phim."
    },
    {
        id: 'TPL-XQ-02',
        name: 'X-Quang Ngực (Viêm phổi)',
        modality: 'X-Ray',
        group: 'Hô hấp',
        content: "KỸ THUẬT: Chụp X-quang ngực thẳng.\n\nMÔ TẢ HÌNH ẢNH:\n- Đám mờ không đồng nhất tại [VỊ TRÍ], giới hạn không rõ.\n- Tăng đậm các nhánh phế quản mạch máu.\n- Góc sườn hoành hai bên sáng.\n- Bóng tim bình thường.\n\nKẾT LUẬN: Hình ảnh theo dõi viêm phổi [VỊ TRÍ]."
    },
    {
        id: 'TPL-US-01',
        name: 'Siêu âm ổ bụng (Bình thường)',
        modality: 'Ultrasound',
        group: 'Tổng quát',
        content: "KỸ THUẬT: Siêu âm ổ bụng tổng quát.\n\nMÔ TẢ HÌNH ẢNH:\n1. Gan: Kích thước bình thường, nhu mô đều, bờ đều, không thấy khối khu trú. Đường mật trong và ngoài gan không giãn.\n2. Túi mật: Thành mỏng, không sỏi, dịch mật trong.\n3. Tụy: Kích thước, nhu mô bình thường.\n4. Lách: Kích thước bình thường, nhu mô đều.\n5. Thận: Hai thận vị trí bình thường, kích thước bình thường, không sỏi, không ứ nước. Phân biệt tủy vỏ rõ.\n6. Bàng quang: Thành mỏng, nước tiểu trong, không sỏi.\n7. Dịch tự do ổ bụng: Không có.\n\nKẾT LUẬN: Hình ảnh siêu âm ổ bụng trong giới hạn bình thường."
    },
    {
        id: 'TPL-CT-01',
        name: 'CT Sọ não (Bình thường)',
        modality: 'CT',
        group: 'Thần kinh',
        content: "KỸ THUẬT: Chụp CLVT sọ não không tiêm thuốc cản quang.\n\nMÔ TẢ:\n- Không thấy hình ảnh tụ máu nội sọ hay dưới màng cứng.\n- Nhu mô não tỷ trọng bình thường, phân biệt chất trắng chất xám rõ.\n- Không thấy khối choán chỗ hay phù nề nhu mô não.\n- Hệ thống não thất cân đối, không giãn.\n- Đường giữa cân đối.\n- Các xoang hơi vùng mặt thông khí tốt.\n- Xương sọ không thấy đường vỡ.\n\nKẾT LUẬN: Hình ảnh CLVT sọ não trong giới hạn bình thường."
    }
];

export const mockEMRData: TreeNode[] = [
    {
        id: 'EMR_ROOT',
        label: 'Hồ sơ Bệnh án (251050296)',
        type: 'folder',
        children: [
            {
                id: 'DOT_DIEU_TRI_01',
                label: 'Đợt: 15/11/2023 - Hiện tại',
                type: 'folder',
                children: [
                    {
                        id: 'CLS_GROUP',
                        label: 'Kết quả Cận lâm sàng',
                        type: 'folder',
                        children: [
                            { id: 'DOC_XN_01', label: 'Huyết học (15/11)', type: 'file', date: '15/11/2023', status: 'signed' },
                            { id: 'DOC_XN_02', label: 'Sinh hóa (15/11)', type: 'file', date: '15/11/2023', status: 'signed' },
                            { id: 'DOC_CDHA_01', label: 'X-Quang Ngực (15/11)', type: 'file', date: '15/11/2023', status: 'signed' },
                        ]
                    },
                    {
                        id: 'HC_GROUP',
                        label: 'Hành chính & Cam kết',
                        type: 'folder',
                        children: [
                            { id: 'DOC_HC_01', label: 'Phiếu vào viện', type: 'file', date: '15/11/2023', status: 'signed' },
                            { id: 'DOC_CK_01', label: 'Cam kết thủ thuật', type: 'file', date: '15/11/2023', status: 'signed' },
                        ]
                    }
                ]
            },
            {
                id: 'DOT_DIEU_TRI_OLD',
                label: 'Đợt: 10/05/2023 (Ngoại trú)',
                type: 'folder',
                children: [
                     { id: 'DOC_OLD_01', label: 'Đơn thuốc BHYT', type: 'file', date: '10/05/2023', status: 'signed' },
                     { id: 'DOC_OLD_02', label: 'Siêu âm ổ bụng', type: 'file', date: '10/05/2023', status: 'signed' },
                ]
            }
        ]
    }
];
