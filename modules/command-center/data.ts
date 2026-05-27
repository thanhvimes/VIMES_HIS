
// Mock data representing real-time hospital status

export const mockBedCapacity = [
    { id: 'khoa-noi', name: 'Nội Tổng Quát', total: 50, occupied: 42, color: 'bg-blue-500' },
    { id: 'khoa-ngoai', name: 'Ngoại Khoa', total: 40, occupied: 35, color: 'bg-indigo-500' },
    { id: 'khoa-san', name: 'Sản Phụ Khoa', total: 30, occupied: 15, color: 'bg-pink-500' },
    { id: 'khoa-nhi', name: 'Nhi Khoa', total: 30, occupied: 28, color: 'bg-green-500' },
    { id: 'icu', name: 'Hồi Sức (ICU)', total: 15, occupied: 14, color: 'bg-red-600', alert: true },
    { id: 'cc', name: 'Cấp Cứu', total: 10, occupied: 6, color: 'bg-orange-500' },
];

export const mockPatientFlow = [
    { time: '07:00', in: 15, out: 2, wait: 10 },
    { time: '08:00', in: 45, out: 5, wait: 15 },
    { time: '09:00', in: 60, out: 12, wait: 25 },
    { time: '10:00', in: 55, out: 20, wait: 35 },
    { time: '11:00', in: 30, out: 25, wait: 40 },
    { time: '12:00', in: 10, out: 15, wait: 30 },
    { time: '13:00', in: 25, out: 8, wait: 20 },
    { time: '14:00', in: 40, out: 18, wait: 22 },
    { time: '15:00', in: 35, out: 22, wait: 25 },
];

export const mockORStatus = [
    { id: 'OR1', name: 'Phòng Mổ 1', status: 'In Use', patient: 'Lê Văn A', procedure: 'Ruột thừa NS', time: '01:30', surgeon: 'BS. Tuấn' },
    { id: 'OR2', name: 'Phòng Mổ 2', status: 'Cleaning', patient: '-', procedure: '-', time: '00:15', surgeon: '-' },
    { id: 'OR3', name: 'Phòng Mổ 3', status: 'In Use', patient: 'Trần Thị B', procedure: 'Mổ lấy thai', time: '00:45', surgeon: 'BS. Hương' },
    { id: 'OR4', name: 'Phòng Mổ 4', status: 'Available', patient: '-', procedure: '-', time: '-', surgeon: '-' },
    { id: 'OR5', name: 'Phòng Mổ 5', status: 'Available', patient: '-', procedure: '-', time: '-', surgeon: '-' },
];

export const mockWaitingTimes = [
    { area: 'Tiếp nhận', wait: 12, status: 'normal', icon: 'UserGroupIcon' },
    { area: 'Khám Nội', wait: 45, status: 'warning', icon: 'ActivityIcon' },
    { area: 'Xét nghiệm', wait: 25, status: 'normal', icon: 'FlaskIcon' },
    { area: 'Chẩn đoán hình ảnh', wait: 35, status: 'warning', icon: 'PhotographIcon' },
    { area: 'Dược BHYT', wait: 15, status: 'normal', icon: 'ArchiveIcon' },
];

export const mockAlerts = [
    { id: 1, type: 'critical', msg: 'ICU: Chỉ còn 1 giường trống. Cần điều phối chuyển khoa.', time: '10:15', department: 'Hồi Sức' },
    { id: 2, type: 'warning', msg: 'Khám Nội: Hàng đợi vượt 40 người. Cần tăng cường bác sĩ.', time: '09:45', department: 'Phòng Khám' },
    { id: 3, type: 'info', msg: 'Hệ thống LIS: Đã khôi phục kết nối máy Cobas.', time: '09:30', department: 'Xét Nghiệm' },
    { id: 4, type: 'critical', msg: 'Code Blue: Phòng 402 - Khoa Nội. Ekip phản ứng nhanh đã có mặt.', time: '10:32', department: 'Khoa Nội' },
];

export const mockStaffing = {
    total: 124,
    doctors: 32,
    nurses: 68,
    technicians: 24,
    onDuty: [
        { name: 'BS. Nguyễn Văn An', role: 'Trưởng kíp trực', status: 'active' },
        { name: 'BS. Lê Thị Bình', role: 'Cấp cứu', status: 'busy' },
        { name: 'ĐD. Trần Văn Cường', role: 'Điều dưỡng trưởng', status: 'active' },
    ]
};

export const mockResources = [
    { name: 'Máy thở (Ventilator)', total: 20, inUse: 14, status: 'normal' },
    { name: 'Máy Monitor', total: 50, inUse: 42, status: 'normal' },
    { name: 'Bơm tiêm điện', total: 100, inUse: 85, status: 'warning' },
    { name: 'Máy X-Quang di động', total: 4, inUse: 3, status: 'normal' },
];

export const mockRealtimeLogs = [
    { id: 1, time: '10:45:12', event: 'Tiếp nhận bệnh nhân mới: Nguyễn Văn X (Cấp cứu)', type: 'system' },
    { id: 2, time: '10:44:05', event: 'Phòng Mổ 2: Hoàn tất vệ sinh', type: 'operation' },
    { id: 3, time: '10:42:30', event: 'Cảnh báo: Khoa Nội quá tải hàng đợi (>50 BN)', type: 'alert' },
    { id: 4, time: '10:40:15', event: 'Kê đơn thuốc: BN Trần Thị Y (Khoa Sản)', type: 'medical' },
    { id: 5, time: '10:38:55', event: 'Kết quả X-Quang: BN Lê Văn Z (PACS)', type: 'system' },
];

export const mockComprehensiveStatus = {
    overview: {
        k1: {
            inpatients: 850,
            outpatients: 1200,
            bedOccupancy: 95, // %
            revenue: 2500000000, // 2.5B VND
            cashlessRate: 85, // %
            alert: "Khoa Nội quá tải"
        },
        k2: {
            inpatients: 420,
            outpatients: 850,
            bedOccupancy: 88,
            revenue: 1200000000,
            cashlessRate: 90,
            alert: "Bình thường"
        },
        k3: {
            inpatients: 1100,
            outpatients: 1500,
            bedOccupancy: 105,
            revenue: 3800000000,
            cashlessRate: 92,
            alert: "Thiếu giường hồi sức"
        }
    },
    zones: {
        ngoai: { mo: 120, noiTru: 450, bedOccupancy: 98, revenue: 1500000000, cashlessRate: 88, alert: "Bình thường" },
        noi: { truyenHC: 350, capCuu: 45 },
        xa: { xaTri: 280 },
        noiSoi: { soiDaDay: 150, soiDaiTrang: 80, noiSoiCanThiep: 25 },
        xQuang: { sieuAm: 500, xq: 300, ct: 120, mri: 85 },
        gpb: { xnGPB: 180, xnIHC: 65, xnGen: 30 },
        xetNghiem: { hh: 1200, sh: 1500 }
    },
    deepDive: {
        k1: {
            ngoaiQS1: { bn: 120, bedOccupancy: 95, ptYeuCau: 45 },
            ngoaiQS2: { bn: 110, bedOccupancy: 92, ptYeuCau: 30 },
            noiQS: { bn: 180, bedOccupancy: 102, dtYeuCau: 60 },
            ycqs: { bn: 85, bedOccupancy: 85, dtYeuCau: 85 },
            cdha: { sa: 200, xq: 150, ct: 60, mri: 40 },
            xetNghiem: { xnHh: 500, xnSh: 600 },
            ns: { soiDd: 80, soiDt: 40, noiSoiCanThiep: 10 },
            gpb: { xnGpb: 80, xnTbh: 40, xnGen: 15, xnIhc: 30 },
            kham: { soKham: 1200, dangKyMang: 850 }
        },
        k2: {
            khoaNgoai: { bn: 150, bedOccupancy: 88, ptYeuCau: 50 },
            khoaXa4: { bn: 120, bedOccupancy: 90, dtYeuCau: 40 },
            khoaNoi: { bn: 200, bedOccupancy: 95, dtYeuCau: 80 },
            chongDau: { bn: 45, bedOccupancy: 75, dtYeuCau: 15 },
            cdha: { sa: 150, xq: 100, ct: 40, mri: 20 },
            xetNghiem: { xnHh: 400, xnSh: 500 },
            ns: { soiDd: 60, soiDt: 30, noiSoiCanThiep: 5 },
            gpb: { xnGpb: 60, xnTbh: 30, xnGen: 10, xnIhc: 20 },
            kham: { soKham: 850, dangKyMang: 600 }
        },
        k3: {
            cacKhoaNgoai: { bn: 350, bedOccupancy: 105, ptYeuCau: 150 },
            cacKhoaNoi: { bn: 550, bedOccupancy: 110, dtYeuCau: 200 },
            cacKhoaXa: { bn: 400, bedOccupancy: 100, dtYeuCau: 180 },
            cdha: { sa: 300, xq: 200, ct: 100, mri: 60 },
            xetNghiem: { xnHh: 800, xnSh: 1000 },
            ns: { soiDd: 120, soiDt: 60, noiSoiCanThiep: 20 },
            gpb: { xnGpb: 100, xnTbh: 50, xnGen: 25, xnIhc: 40 },
            kham: { soKham: 1500, dangKyMang: 1100 }
        }
    }
};

export const mockExecutiveStatus = {
    grandTotal: {
        inpatients: 2310,
        outpatients: 3550,
        bedOccupancy: 101, // Average %
        revenue: 10910000000, // 10.91B
        cashlessRate: 89,
        alert: "Quá tải Khối Nội K3"
    },
    campuses: {
        k1: {
            inpatients: 495, outpatients: 1200, bedOccupancy: 95, revenue: 3200000000, cashlessRate: 85, alert: "Bình thường"
        },
        k2: {
            inpatients: 515, outpatients: 850, bedOccupancy: 88, revenue: 1710000000, cashlessRate: 90, alert: "Bình thường"
        },
        k3: {
            inpatients: 1300, outpatients: 1500, bedOccupancy: 105, revenue: 6000000000, cashlessRate: 92, alert: "Thiếu giường"
        }
    },
    clinicalZones: {
        ngoai: { inpatients: 730, bedOccupancy: 96, mo: 250, revenue: 3800000000, cashlessRate: 88, alert: "Tốt" },
        noi: { inpatients: 1060, bedOccupancy: 104, capCuu: 120, truyenHC: 800, revenue: 2300000000, cashlessRate: 90, alert: "Quá tải" },
        xa: { inpatients: 520, bedOccupancy: 98, xaTri: 650, revenue: 1400000000, cashlessRate: 91, alert: "Tốt" }
    },
    paraclinicalZones: {
        xQuang: { sieuAm: 650, xq: 450, ct: 200, mri: 120, revenue: 700000000 },
        xetNghiem: { hh: 1700, sh: 2100, revenue: 380000000 },
        noiSoi: { soiDaDay: 260, soiDaiTrang: 130, canThiep: 35, revenue: 500000000 },
        gpb: { gpb: 240, tbh: 120, gen: 50, ihc: 90, revenue: 830000000 }
    },
    deepDive: {
        k1: {
            ngoai: [
                { name: 'Ngoại QS1', bn: 120, bedOccupancy: 95, ptYc: 45, rev: 800 },
                { name: 'Ngoại QS2', bn: 110, bedOccupancy: 92, ptYc: 30, rev: 700 }
            ],
            noi: [
                { name: 'Nội QS', bn: 180, bedOccupancy: 102, dtYc: 60, rev: 600 },
                { name: 'Yêu cầu QS', bn: 85, bedOccupancy: 85, dtYc: 85, rev: 400 }
            ],
            xa: [],
            kham: { kham: 1200, online: 850 },
            cdha: { sa: 200, xq: 150, ct: 60, mri: 40, rev: 200 },
            xetNghiem: { hh: 500, sh: 600, rev: 100 },
            ns: { dd: 80, dt: 40, ct: 10, rev: 150 },
            gpb: { gpb: 80, tbh: 40, gen: 15, ihc: 30, rev: 250 }
        },
        k2: {
            ngoai: [
                { name: 'Khoa Ngoại', bn: 150, bedOccupancy: 88, ptYc: 50, rev: 500 }
            ],
            noi: [
                { name: 'Khoa Nội', bn: 200, bedOccupancy: 95, dtYc: 80, rev: 200 },
                { name: 'Chống đau', bn: 45, bedOccupancy: 75, dtYc: 15, rev: 100 }
            ],
            xa: [
                { name: 'Khoa Xạ 4', bn: 120, bedOccupancy: 90, dtYc: 40, rev: 400 }
            ],
            kham: { kham: 850, online: 600 },
            cdha: { sa: 150, xq: 100, ct: 40, mri: 20, rev: 150 },
            xetNghiem: { hh: 400, sh: 500, rev: 80 },
            ns: { dd: 60, dt: 30, ct: 5, rev: 100 },
            gpb: { gpb: 60, tbh: 30, gen: 10, ihc: 20, rev: 180 }
        },
        k3: {
            ngoai: [
                { name: 'Các Khoa Ngoại', bn: 350, bedOccupancy: 105, ptYc: 150, rev: 1800 }
            ],
            noi: [
                { name: 'Các Khoa Nội', bn: 550, bedOccupancy: 110, dtYc: 200, rev: 1000 }
            ],
            xa: [
                { name: 'Các Khoa Xạ', bn: 400, bedOccupancy: 100, dtYc: 180, rev: 1000 }
            ],
            kham: { kham: 1500, online: 1100 },
            cdha: { sa: 300, xq: 200, ct: 100, mri: 60, rev: 350 },
            xetNghiem: { hh: 800, sh: 1000, rev: 200 },
            ns: { dd: 120, dt: 60, ct: 20, rev: 250 },
            gpb: { gpb: 100, tbh: 50, gen: 25, ihc: 40, rev: 400 }
        }
    }
};

