
export interface Lead {
    id: string;
    name: string;
    phone: string;
    source: string; // Facebook, Website, Referral
    interest: string; // Dịch vụ quan tâm
    status: 'new' | 'contacted' | 'booked' | 'converted' | 'lost';
    lastAction: string;
    notes: string;
}

export interface Campaign {
    id: string;
    name: string;
    type: 'SMS' | 'Email' | 'Zalo';
    status: 'Draft' | 'Running' | 'Completed';
    sent: number;
    opened: number;
    converted: number;
    date: string;
}

export interface Ticket {
    id: string;
    patientName: string;
    phone: string;
    type: 'Complaint' | 'Support' | 'Feedback';
    subject: string;
    status: 'Open' | 'In Progress' | 'Resolved';
    priority: 'High' | 'Medium' | 'Low';
    createdDate: string;
}

export interface CrmCustomer {
    id: string;
    name: string;
    age: number;
    gender: string;
    phone: string;
    email: string;
    address: string;
    segment: 'VIP' | 'Loyal' | 'Potential' | 'AtRisk' | 'New'; // Phân khúc
    lifetimeValue: number; // Tổng chi tiêu
    lastVisitDate: string;
    tags: string[]; // Sở thích hoặc bệnh lý: "Tiểu đường", "Thích làm đẹp"
    interactionScore: number; // Điểm tương tác (0-100)
    history: {
        date: string;
        type: 'Visit' | 'Call' | 'SMS' | 'Email' | 'Zalo'; // Added 'Zalo'
        content: string;
    }[];
}

export const mockLeads: Lead[] = [
    { id: 'L01', name: 'Nguyễn Thị Mai', phone: '0912***789', source: 'Facebook Ads', interest: 'Niềng răng', status: 'new', lastAction: 'Vừa đăng ký', notes: 'Muốn tư vấn giá' },
    { id: 'L02', name: 'Trần Văn Long', phone: '0903***123', source: 'Website', interest: 'Khám tổng quát', status: 'contacted', lastAction: 'Gọi điện 2h trước', notes: 'Hẹn gọi lại sau 5h chiều' },
    { id: 'L03', name: 'Lê Thị Thu', phone: '0988***456', source: 'Giới thiệu', interest: 'Thai sản trọn gói', status: 'booked', lastAction: 'Đã đặt lịch 20/11', notes: 'Khám với BS. Bích' },
    { id: 'L04', name: 'Phạm Văn Minh', phone: '0358***999', source: 'Google Search', interest: 'Nội soi dạ dày', status: 'converted', lastAction: 'Đã khám xong', notes: 'Đã mua gói thuốc' },
    { id: 'L05', name: 'Đỗ Hải Yến', phone: '0977***222', source: 'Facebook Ads', interest: 'Tẩy trắng răng', status: 'lost', lastAction: 'Sai số', notes: 'Không liên lạc được' },
];

export const mockCampaigns: Campaign[] = [
    { id: 'CP01', name: 'Chúc mừng sinh nhật Tháng 11', type: 'SMS', status: 'Running', sent: 450, opened: 0, converted: 15, date: '01/11/2023' },
    { id: 'CP02', name: 'Ưu đãi tầm soát ung thư 20%', type: 'Zalo', status: 'Completed', sent: 1200, opened: 850, converted: 120, date: '15/10/2023' },
    { id: 'CP03', name: 'Nhắc lịch tái khám Đái tháo đường', type: 'SMS', status: 'Draft', sent: 0, opened: 0, converted: 0, date: '20/11/2023' },
];

export const mockTickets: Ticket[] = [
    { id: 'TK01', patientName: 'Lê Hoàng Cường', phone: '0905123456', type: 'Support', subject: 'Hỏi về bảo hiểm y tế', status: 'Open', priority: 'Medium', createdDate: '10 phút trước' },
    { id: 'TK02', patientName: 'Trần Thị Bích', phone: '0987654321', type: 'Complaint', subject: 'Thái độ nhân viên bảo vệ', status: 'In Progress', priority: 'High', createdDate: '1 giờ trước' },
    { id: 'TK03', patientName: 'Nguyễn Văn An', phone: '0912345678', type: 'Feedback', subject: 'Dịch vụ rất tốt', status: 'Resolved', priority: 'Low', createdDate: '1 ngày trước' },
];

export const mockCrmCustomers: CrmCustomer[] = [
    {
        id: 'C001',
        name: 'Lê Hoàng Cường',
        age: 45,
        gender: 'Nam',
        phone: '0905123456',
        email: 'cuong.le@email.com',
        address: 'Hà Nội',
        segment: 'VIP',
        lifetimeValue: 50000000,
        lastVisitDate: '2023-11-15',
        tags: ['Tiểu đường', 'Gói VIP', 'Quan tâm dinh dưỡng'],
        interactionScore: 95,
        history: [
            { date: '2023-11-15', type: 'Visit', content: 'Khám Nội tổng quát - BS. A' },
            { date: '2023-11-10', type: 'Call', content: 'CSKH gọi nhắc lịch tái khám' },
            { date: '2023-10-01', type: 'SMS', content: 'Gửi chúc mừng sinh nhật' }
        ]
    },
    {
        id: 'C002',
        name: 'Phạm Thị Dung',
        age: 22,
        gender: 'Nữ',
        phone: '0358987654',
        email: 'dung.pham@email.com',
        address: 'Hà Nội',
        segment: 'Potential',
        lifetimeValue: 2500000,
        lastVisitDate: '2023-10-20',
        tags: ['Da liễu', 'Sinh viên'],
        interactionScore: 60,
        history: [
            { date: '2023-10-20', type: 'Visit', content: 'Khám Da liễu - BS. C' },
            { date: '2023-10-19', type: 'Zalo', content: 'Hỏi giá gói trị mụn' }
        ]
    },
    {
        id: 'C003',
        name: 'Nguyễn Văn An',
        age: 35,
        gender: 'Nam',
        phone: '0912345678',
        email: 'an.nguyen@email.com',
        address: 'Hà Nội',
        segment: 'AtRisk', // Nguy cơ rời bỏ
        lifetimeValue: 1500000,
        lastVisitDate: '2023-05-10', // Lâu chưa quay lại
        tags: ['Cơ xương khớp'],
        interactionScore: 30,
        history: [
            { date: '2023-05-10', type: 'Visit', content: 'Khám Chấn thương chỉnh hình' }
        ]
    }
];
