-- ==========================================
-- SEED DATA FOR ONLINE BOOKING MODULE
-- ==========================================

-- 1. Danh mục Chuyên khoa Online
INSERT INTO dm_chuyenkhoa_online (id, name, description, quota_per_slot, active) VALUES
('S01', 'Nội tổng quát', 'Khám và điều trị các bệnh nội khoa', 10, true),
('S02', 'Ngoại khoa', 'Khám và phẫu thuật ngoại khoa', 5, true),
('S03', 'Nhi khoa', 'Khám và điều trị bệnh nhi', 15, true),
('S04', 'Sản phụ khoa', 'Khám thai, sản khoa và phụ khoa', 8, true),
('S05', 'Tai Mũi Họng', 'Khám và điều trị bệnh TMH', 8, true),
('S06', 'Mắt', 'Khám và điều trị bệnh mắt', 6, true),
('S07', 'Da liễu', 'Khám và điều trị bệnh da liễu', 10, true),
('S08', 'Tim mạch', 'Khám và điều trị bệnh tim mạch', 6, true),
('S09', 'Tiêu hóa', 'Khám và điều trị bệnh tiêu hóa', 8, true),
('S10', 'Cơ xương khớp', 'Khám và điều trị bệnh cơ xương khớp', 8, true)
ON CONFLICT (id) DO NOTHING;

-- 2. Khung giờ khám
INSERT INTO dm_khung_gio (time_slot, max_quota, active) VALUES
('08:00', 10, true),
('08:30', 10, true),
('09:00', 10, true),
('09:30', 10, true),
('10:00', 10, true),
('10:30', 10, true),
('11:00', 10, true),
('13:30', 10, true),
('14:00', 10, true),
('14:30', 10, true),
('15:00', 10, true),
('15:30', 10, true),
('16:00', 10, true),
('16:30', 10, true)
ON CONFLICT (time_slot) DO NOTHING;

-- 3. Danh mục Tỉnh/Thành phố (63 tỉnh thành Việt Nam)
INSERT INTO dm_tinh (id, name) VALUES
('01', 'Hà Nội'),
('02', 'Hà Giang'),
('04', 'Cao Bằng'),
('06', 'Bắc Kạn'),
('08', 'Tuyên Quang'),
('10', 'Lào Cai'),
('11', 'Điện Biên'),
('12', 'Lai Châu'),
('14', 'Sơn La'),
('15', 'Yên Bái'),
('17', 'Hòa Bình'),
('19', 'Thái Nguyên'),
('20', 'Lạng Sơn'),
('22', 'Quảng Ninh'),
('24', 'Bắc Giang'),
('25', 'Phú Thọ'),
('26', 'Vĩnh Phúc'),
('27', 'Bắc Ninh'),
('30', 'Hải Dương'),
('31', 'Hải Phòng'),
('33', 'Hưng Yên'),
('34', 'Thái Bình'),
('35', 'Hà Nam'),
('36', 'Nam Định'),
('37', 'Ninh Bình'),
('38', 'Thanh Hóa'),
('40', 'Nghệ An'),
('42', 'Hà Tĩnh'),
('44', 'Quảng Bình'),
('45', 'Quảng Trị'),
('46', 'Thừa Thiên Huế'),
('48', 'Đà Nẵng'),
('49', 'Quảng Nam'),
('51', 'Quảng Ngãi'),
('52', 'Bình Định'),
('54', 'Phú Yên'),
('56', 'Khánh Hòa'),
('58', 'Ninh Thuận'),
('60', 'Bình Thuận'),
('62', 'Kon Tum'),
('64', 'Gia Lai'),
('66', 'Đắk Lắk'),
('67', 'Đắk Nông'),
('68', 'Lâm Đồng'),
('70', 'Bình Phước'),
('72', 'Tây Ninh'),
('74', 'Bình Dương'),
('75', 'Đồng Nai'),
('77', 'Bà Rịa - Vũng Tàu'),
('79', 'TP. Hồ Chí Minh'),
('80', 'Long An'),
('82', 'Tiền Giang'),
('83', 'Bến Tre'),
('84', 'Trà Vinh'),
('86', 'Vĩnh Long'),
('87', 'Đồng Tháp'),
('89', 'An Giang'),
('91', 'Kiên Giang'),
('92', 'Cần Thơ'),
('93', 'Hậu Giang'),
('94', 'Sóc Trăng'),
('95', 'Bạc Liêu'),
('96', 'Cà Mau')
ON CONFLICT (id) DO NOTHING;

-- 4. Danh mục Quận/Huyện (Mẫu cho Hà Nội và TP.HCM)
INSERT INTO dm_huyen (id, province_id, name) VALUES
-- Hà Nội
('001', '01', 'Ba Đình'),
('002', '01', 'Hoàn Kiếm'),
('003', '01', 'Tây Hồ'),
('004', '01', 'Long Biên'),
('005', '01', 'Cầu Giấy'),
('006', '01', 'Đống Đa'),
('007', '01', 'Hai Bà Trưng'),
('008', '01', 'Hoàng Mai'),
('009', '01', 'Thanh Xuân'),
('010', '01', 'Hà Đông'),
('011', '01', 'Sơn Tây'),
('012', '01', 'Ba Vì'),
-- TP.HCM
('760', '79', 'Quận 1'),
('761', '79', 'Quận 2'),
('762', '79', 'Quận 3'),
('763', '79', 'Quận 4'),
('764', '79', 'Quận 5'),
('765', '79', 'Quận 6'),
('766', '79', 'Quận 7'),
('767', '79', 'Quận 8'),
('768', '79', 'Quận 9'),
('769', '79', 'Quận 10'),
('770', '79', 'Quận 11'),
('771', '79', 'Quận 12'),
('772', '79', 'Thủ Đức'),
('773', '79', 'Bình Thạnh'),
('774', '79', 'Tân Bình'),
('775', '79', 'Tân Phú'),
('776', '79', 'Phú Nhuận'),
('777', '79', 'Gò Vấp')
ON CONFLICT (ma_huyen) DO NOTHING;

-- 5. Danh mục Phường/Xã (Mẫu cho một số quận)
INSERT INTO dm_xa (ma_xa, ma_huyen, ten_xa) VALUES
-- Ba Đình, Hà Nội
('00001', '001', 'Phường Phúc Xá'),
('00002', '001', 'Phường Trúc Bạch'),
('00003', '001', 'Phường Vĩnh Phúc'),
('00004', '001', 'Phường Cống Vị'),
('00005', '001', 'Phường Liễu Giai'),
-- Quận 1, TP.HCM
('26734', '760', 'Phường Bến Nghé'),
('26737', '760', 'Phường Bến Thành'),
('26740', '760', 'Phường Nguyễn Thái Bình'),
('26743', '760', 'Phường Phạm Ngũ Lão'),
('26746', '760', 'Phường Cầu Ông Lãnh')
ON CONFLICT (ma_xa) DO NOTHING;

-- 6. Tạo một số booking mẫu để test
INSERT INTO bookings (
  booking_id, patient_id, patient_name, phone, dob, gender, 
  identity_card, province_id, ward_id, address_detail,
  speciality_id, booking_date, booking_time, reason, 
  is_priority, status, sms_status, source
) VALUES
('BK000001', 'P001', 'NGUYỄN VĂN A', '0901234567', '01/01/1990', 'Nam', 
 '001234567890', '01', '00001', '123 Đường ABC',
 'S01', '2026-01-20', '08:30', 'Khám tổng quát', 
 false, 'Pending', 'Pending', 'Portal'),
 
('BK000002', NULL, 'TRẦN THỊ B', '0912345678', '15/05/1985', 'Nữ', 
 '001234567891', '79', '26734', '456 Đường XYZ',
 'S03', '2026-01-20', '09:00', 'Khám cho bé', 
 false, 'Approved', 'Sent', 'Mobile App'),
 
('BK000003', 'P003', 'LÊ VĂN C', '0923456789', '20/12/1978', 'Nam', 
 '001234567892', '01', '00002', '789 Đường DEF',
 'S04', '2026-01-21', '14:00', 'Tái khám', 
 false, 'Approved', 'Sent', 'Portal')
ON CONFLICT (booking_id) DO NOTHING;

-- 7. Tạo một số log mẫu
INSERT INTO booking_logs (booking_id, action, user_id, note) VALUES
('BK000002', 'APPROVED', 'admin', 'Duyệt tự động'),
('BK000002', 'SMS_SENT', 'system', 'Gửi SMS xác nhận thành công'),
('BK000003', 'APPROVED', 'admin', 'Duyệt thủ công'),
('BK000003', 'SMS_SENT', 'system', 'Gửi SMS xác nhận thành công');

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================

-- Kiểm tra số lượng records
SELECT 'Chuyên khoa' as table_name, COUNT(*) as count FROM dm_chuyenkhoa_online
UNION ALL
SELECT 'Khung giờ', COUNT(*) FROM dm_khung_gio
UNION ALL
SELECT 'Tỉnh/TP', COUNT(*) FROM dm_tinh
UNION ALL
SELECT 'Quận/Huyện', COUNT(*) FROM dm_huyen
UNION ALL
SELECT 'Phường/Xã', COUNT(*) FROM dm_xa
UNION ALL
SELECT 'Bookings', COUNT(*) FROM bookings
UNION ALL
SELECT 'Booking Logs', COUNT(*) FROM booking_logs;
