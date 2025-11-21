
export interface ImagingRequest {
    id: string;
    patientId: string;
    patientName: string;
    age: number;
    gender: string;
    serviceName: string;
    modality: 'X-Ray' | 'CT' | 'MRI' | 'Ultrasound';
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
}

export interface ReportTemplate {
    id: string;
    name: string;
    modality: 'X-Ray' | 'CT' | 'MRI' | 'Ultrasound';
    content: string;
}

export const mockRequests: ImagingRequest[] = [
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
        // Chest X-Ray
        imageUrl: 'https://prod-images-static.radiopaedia.org/images/54766339/9d0de6367f802d672324f4a844e2e211f95d83115f67b6f250d472e532402273_gallery.jpeg',
        report: 'Kỹ thuật: Chụp X-quang ngực thẳng đứng.\n\nMô tả hình ảnh:\n- Lồng ngực cân đối.\n- Nhu mô phổi sáng đều hai bên.\n- Không thấy đám mờ khu trú.\n- Góc sườn hoành hai bên nhọn.\n- Bóng tim không to.\n\nKết luận: Hình ảnh tim phổi bình thường.'
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
        // Ultrasound Abdomen
        imageUrl: 'https://prod-images-static.radiopaedia.org/images/51503620/0a1f9c6a534838c43993a341939f50_gallery.jpeg',
        report: 'GAN: Kích thước không lớn, bờ đều, nhu mô đồng nhất. Không thấy khối khu trú.\nĐƯỜNG MẬT: Không giãn, không sỏi.\nTÚI MẬT: Thành mỏng, không sỏi.\nTỤY: Bình thường.\nLÁCH: Kích thước bình thường.\nTHẬN: Hai thận không sỏi, không ứ nước.\n\nKẾT LUẬN: Hình ảnh siêu âm bụng chưa phát hiện bất thường.'
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
        // Brain CT
        imageUrl: 'https://prod-images-static.radiopaedia.org/images/29533634/689467c9c8e563d796306e34564f96_gallery.jpeg'
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
        // Forearm X-Ray (fracture)
        imageUrl: 'https://prod-images-static.radiopaedia.org/images/13868444/2a6902693226707332027205270697_gallery.jpeg'
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
        // Spine MRI
        imageUrl: 'https://prod-images-static.radiopaedia.org/images/3439437/3065205765c076c4a13577378f3294_gallery.jpeg'
    }
];

export const mockTemplates: ReportTemplate[] = [
    {
        id: 'TPL-XQ-01',
        name: 'X-Quang Ngực Thẳng (Bình thường)',
        modality: 'X-Ray',
        content: "KỸ THUẬT: Chụp X-quang ngực thẳng.\n\nMÔ TẢ HÌNH ẢNH:\n- Lồng ngực cân đối, không gù vẹo.\n- Nhu mô phổi sáng đều hai bên, không thấy đám mờ khu trú hay thâm nhiễm.\n- Rốn phổi hai bên bình thường.\n- Góc sườn hoành hai bên sáng, nhọn.\n- Bóng tim không to, chỉ số tim/lồng ngực < 0.5.\n- Khung xương thành ngực không thấy tổn thương.\n\nKẾT LUẬN: Hiện tại chưa thấy hình ảnh bất thường trên phim."
    },
    {
        id: 'TPL-XQ-02',
        name: 'X-Quang Ngực (Viêm phổi)',
        modality: 'X-Ray',
        content: "KỸ THUẬT: Chụp X-quang ngực thẳng.\n\nMÔ TẢ HÌNH ẢNH:\n- Đám mờ không đồng nhất tại [VỊ TRÍ], giới hạn không rõ.\n- Tăng đậm các nhánh phế quản mạch máu.\n- Góc sườn hoành hai bên sáng.\n- Bóng tim bình thường.\n\nKẾT LUẬN: Hình ảnh theo dõi viêm phổi [VỊ TRÍ]."
    },
    {
        id: 'TPL-US-01',
        name: 'Siêu âm ổ bụng (Bình thường)',
        modality: 'Ultrasound',
        content: "KỸ THUẬT: Siêu âm ổ bụng tổng quát.\n\nMÔ TẢ HÌNH ẢNH:\n1. Gan: Kích thước bình thường, nhu mô đều, bờ đều, không thấy khối khu trú. Đường mật trong và ngoài gan không giãn.\n2. Túi mật: Thành mỏng, không sỏi, dịch mật trong.\n3. Tụy: Kích thước, nhu mô bình thường.\n4. Lách: Kích thước bình thường, nhu mô đều.\n5. Thận: Hai thận vị trí bình thường, kích thước bình thường, không sỏi, không ứ nước. Phân biệt tủy vỏ rõ.\n6. Bàng quang: Thành mỏng, nước tiểu trong, không sỏi.\n7. Dịch tự do ổ bụng: Không có.\n\nKẾT LUẬN: Hình ảnh siêu âm ổ bụng trong giới hạn bình thường."
    },
    {
        id: 'TPL-CT-01',
        name: 'CT Sọ não (Bình thường)',
        modality: 'CT',
        content: "KỸ THUẬT: Chụp CLVT sọ não không tiêm thuốc cản quang.\n\nMÔ TẢ:\n- Không thấy hình ảnh tụ máu nội sọ hay dưới màng cứng.\n- Nhu mô não tỷ trọng bình thường, phân biệt chất trắng chất xám rõ.\n- Không thấy khối choán chỗ hay phù nề nhu mô não.\n- Hệ thống não thất cân đối, không giãn.\n- Đường giữa cân đối.\n- Các xoang hơi vùng mặt thông khí tốt.\n- Xương sọ không thấy đường vỡ.\n\nKẾT LUẬN: Hình ảnh CLVT sọ não trong giới hạn bình thường."
    }
];
