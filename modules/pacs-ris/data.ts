export interface ImagingRequest {
    id: string;
    patientId: string;
    patientName: string;
    age: number;
    gender: string;
    serviceName: string;
    modality: 'X-Ray' | 'CT' | 'MRI' | 'Ultrasound' | 'Endoscopy';
    bodyPart: string;
    requestDate: string;
    priority: 'Normal' | 'Urgent';
    status: 'Scheduled' | 'Processing' | 'Acquired' | 'Reported' | 'Approved';
    technician?: string;
    radiologist?: string;
    room?: string;
    imageUrl?: string; 
    report?: string;
    diagnosis?: string;
    patientType?: 'Dịch vụ' | 'Bảo hiểm';
    phone?: string;
    studyUid?: string;
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
        id: 'REQ-001',
        patientId: 'P101',
        patientName: 'Nguyễn Văn Mạnh',
        age: 45,
        gender: 'Nam',
        serviceName: 'X-Quang Ngực thẳng kỹ thuật số',
        modality: 'X-Ray',
        bodyPart: 'Chest',
        requestDate: '2026-06-12 08:30',
        priority: 'Normal',
        status: 'Acquired',
        technician: 'KTV. Nguyễn Văn Tú',
        room: 'P. X-Quang 01',
        imageUrl: 'https://prod-images-static.radiopaedia.org/images/31521/0a8d37d7996342775b761094577303_jumbo.jpeg',
        patientType: 'Dịch vụ',
        phone: '0905123456',
        studyUid: '1.2.840.113619.2.55.3.28311614'
    },
    {
        id: 'REQ-002',
        patientId: 'P102',
        patientName: 'Lê Thị Hồng',
        age: 38,
        gender: 'Nữ',
        serviceName: 'Siêu âm ổ bụng tổng quát',
        modality: 'Ultrasound',
        bodyPart: 'Abdomen',
        requestDate: '2026-06-12 08:45',
        priority: 'Urgent',
        status: 'Processing',
        technician: 'BS. Lê Văn Siêu',
        room: 'P. Siêu Âm 02',
        imageUrl: 'https://prod-images-static.radiopaedia.org/images/6057290/93d9667d9266733660227072365724_jumbo.jpg',
        patientType: 'Dịch vụ',
        phone: '0912345678',
        studyUid: '1.2.840.113619.2.55.3.28311615'
    },
    {
        id: 'REQ-003',
        patientId: 'P103',
        patientName: 'Phạm Hồng Thái',
        age: 29,
        gender: 'Nam',
        serviceName: 'CT Sọ não không cản quang',
        modality: 'CT',
        bodyPart: 'Head',
        requestDate: '2026-06-12 09:15',
        priority: 'Urgent',
        status: 'Acquired',
        technician: 'KTV. Lê Thị Mai',
        room: 'P. CT 01',
        imageUrl: 'https://prod-images-static.radiopaedia.org/images/2296062/c6c702c3e7c03a765f59049603e22e_jumbo.jpg',
        patientType: 'Bảo hiểm',
        phone: '0358987654',
        studyUid: '1.2.840.113619.2.55.3.28311616'
    },
    {
        id: 'REQ-004',
        patientId: 'P104',
        patientName: 'Trần Thị Thuỷ',
        age: 55,
        gender: 'Nữ',
        serviceName: 'MRI Cột sống thắt lưng',
        modality: 'MRI',
        bodyPart: 'Spine',
        requestDate: '2026-06-12 10:00',
        priority: 'Normal',
        status: 'Acquired',
        technician: 'KTV. Trần Văn M',
        room: 'P. MRI 01',
        imageUrl: 'https://prod-images-static.radiopaedia.org/images/523822/75b32f560343670853330762066550_jumbo.jpg',
        patientType: 'Bảo hiểm',
        phone: '0987654321',
        studyUid: '1.2.840.113619.2.55.3.28311617'
    },
    {
        id: 'REQ-005',
        patientId: 'P105',
        patientName: 'Hoàng Minh Quân',
        age: 18,
        gender: 'Nam',
        serviceName: 'X-Quang Cẳng tay trái thẳng nghiêng',
        modality: 'X-Ray',
        bodyPart: 'Arm',
        requestDate: '2026-06-12 10:15',
        priority: 'Normal',
        status: 'Scheduled',
        technician: 'KTV. Nguyễn Văn Tú',
        room: 'P. X-Quang 02',
        imageUrl: 'https://prod-images-static.radiopaedia.org/images/130629/20b977c70967402366936033320026_jumbo.jpg',
        patientType: 'Dịch vụ',
        phone: '0988776655',
        studyUid: '1.2.840.113619.2.55.3.28311618'
    }
];

export const mockTemplates: ReportTemplate[] = [
    {
        id: 'TPL-XR-01',
        name: 'X-Quang Ngực Thẳng Bình Thường',
        modality: 'X-Ray',
        content: `KỸ THUẬT: Chụp X-quang phổi thẳng đứng kỹ thuật số.

MÔ TẢ HÌNH ẢNH:
- Lồng ngực cân đối, không thấy tổn thương xương lồng ngực.
- Nhu mô phổi sáng đều hai bên, không thấy đám mờ khu trú hay xẹp phổi.
- Rốn phổi hai bên bình thường, không giãn.
- Hai góc sườn hoành nhọn, tự do.
- Vòm hoành hai bên đều, vị trí bình thường.
- Bóng tim kích thước trong giới hạn bình thường, chỉ số tim/ngực < 50%.
- Trung thất không giãn, khí quản thẳng đứng ở đường giữa.

KẾT LUẬN: Hình ảnh tim phổi bình thường.`
    },
    {
        id: 'TPL-US-01',
        name: 'Siêu Âm Ổ Bụng Bình Thường',
        modality: 'Ultrasound',
        content: `KỸ THUẬT: Siêu âm ổ bụng tổng quát tần số 3.5 MHz.

MÔ TẢ HÌNH ẢNH:
- GAN: Kích thước trong giới hạn bình thường, bờ đều, cấu trúc nhu mô đồng nhất, không thấy tổn thương khu trú. Hệ tĩnh mạch cửa và tĩnh mạch trên gan bình thường.
- ĐƯỜNG MẬT: Đường mật trong và ngoài gan không giãn, không thấy hình bóng cản sỏi.
- TÚI MẬT: Kích thước bình thường, thành mỏng < 3mm, dịch mật trong, không thấy sỏi hay polyp.
- TỤY: Kích thước bình thường, cấu trúc nhu mô đồng nhất, ống tụy không giãn.
- LÁCH: Kích thước bình thường, cấu trúc nhu mô đồng nhất, tĩnh mạch lách không giãn.
- HAI THẬN: Vị trí và kích thước bình thường, nhu mô thận đều, ranh giới tủy vỏ rõ. Đài bể thận không giãn, không thấy sỏi.
- BÀNG QUANG: Thành mỏng, nước tiểu trong, không thấy sỏi hay u sùi.
- TIỀN LIỆT TUYẾN / TỬ CUNG: Kích thước bình thường, cấu trúc nhu mô đồng nhất.
- KHÔNG THẤY: Dịch tự do ổ bụng hay hạch lớn bất thường dọc động mạch chủ bụng.

KẾT LUẬN: Hiện tại chưa thấy hình ảnh bất thường trên siêu âm bụng tổng quát.`
    },
    {
        id: 'TPL-CT-01',
        name: 'CT Sọ Não Bình Thường',
        modality: 'CT',
        content: `KỸ THUẬT: Chụp cắt lớp vi tính sọ não không tiêm thuốc cản quang.

MÔ TẢ HÌNH ẢNH:
- Không thấy ổ chảy máu cấp hay diện nhồi máu não vùng bán cầu đại não và thân não.
- Cấu trúc đường giữa cân đối, không bị di lệch.
- Hệ thống não thất bên, não thất ba, não thất tư kích thước bình thường, không giãn, không thấy tụ máu.
- Các bể não và rãnh cuốn não bình thường.
- Không thấy tổn thương xương sọ vùng vòm và nền sọ.
- Các xoang mặt thông khí tốt.

KẾT LUẬN: Chưa phát hiện bất thường trên hình ảnh cắt lớp vi tính sọ não.`
    },
    {
        id: 'TPL-MR-01',
        name: 'MRI Cột Sống Thắt Lưng Bình Thường',
        modality: 'MRI',
        content: `KỸ THUẬT: Chụp cộng hưởng từ cột sống thắt lưng các xung sagittal T1W, T2W, axial T2W.

MÔ TẢ HÌNH ẢNH:
- Đường cong sinh lý cột sống thắt lưng trong giới hạn bình thường.
- Chiều cao các thân đốt sống bình thường, tín hiệu tủy xương đồng nhất, không thấy tổn thương xương đốt sống.
- Các đĩa đệm thắt lưng chiều cao bình thường, tín hiệu trên T2W đồng nhất, không thấy hình ảnh thoát vị hay phình đĩa đệm gây hẹp ống sống hay chèn ép rễ thần kinh.
- Tủy sống thắt lưng - ngực và chóp tủy bình thường.
- Dây chằng vàng và khớp liên mấu không dày.

KẾT LUẬN: Hình ảnh cộng hưởng từ cột sống thắt lưng chưa phát hiện bất thường.`
    }
];
