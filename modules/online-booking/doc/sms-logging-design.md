# Tài Liệu Thiết Kế: Luồng Xử Lý Mẫu Tin Nhắn & Nhật Ký SMS Online Booking

## 1. Giới thiệu
Tài liệu này mô tả thiết kế và kiến trúc luồng truy vấn mẫu tin nhắn SMS theo Khoa/Đối tượng và cơ chế lưu trữ nhật ký (SMS Logs) cho phân hệ Đăng ký khám online (`online-booking`).

## 2. Cấu trúc Bảng Cơ Sở Dữ Liệu

### 2.1 Bảng `hms_booking_sms_templates` (Mẫu tin nhắn SMS)
- `template_id`: Khóa chính
- `template_type`: Loại tin nhắn (`confirmation`, `approved`, `cancellation`, `reminder`, `reschedule`)
- `dept_code`: Mã khoa điều trị (`KB`, `KBYC`... NULL là mặc định toàn viện)
- `patient_type`: Loại đối tượng (`BH` / `I` - Bảo hiểm, `DV` / `S` - Dịch vụ... NULL là áp dụng cả 2)
- `template_content`: Nội dung tin nhắn kèm các biến `{patientName}`, `{date}`, `{time}`, `{queueNumber}`, `{specialty}`, `{roomName}`, `{hotline}`

### 2.2 Bảng `hms_booking_sms_logs` (Nhật ký SMS)
- `log_id`: Khóa chính
- `booking_id`: Mã booking (`qms_patient.qms_idx`)
- `patient_name`: Tên bệnh nhân
- `phone`: Số điện thoại nhận tin
- `dept_code`: Mã khoa gửi tin (`qms_deptid`)
- `patient_type`: Đối tượng bệnh nhân (`BH`/`DV`)
- `sms_type`: Loại thông báo
- `message_content`: **Nguyên văn tin nhắn thực tế** sau khi đã format và gửi cho bệnh nhân
- `provider`: Cổng gửi SMS (`mock`, `caresoft`...)
- `provider_message_id`: ID phản hồi từ nhà mạng
- `status`: Trạng thái (`SUCCESS`, `FAILED`, `PENDING`)
- `error_message`: Chi tiết lỗi nếu thất bại
- `sent_at`: Thời gian gửi tin

## 3. Cơ chế Khớp Mẫu Tin Nhắn (4 Mức Ưu Tiên)

Khi gửi tin nhắn SMS cho một bệnh nhân đăng ký khám online thuộc khoa `qms_deptid` và đối tượng `patientType`, SQL thực hiện chọn mẫu tin nhắn khớp nhất theo thứ tự:

1. **Mức 1 (Đặc thù Khoa + Đúng Đối tượng)**:  
   `dept_code = qms_deptid` AND `patient_type = patientType`
2. **Mức 2 (Đặc thù Khoa + Cả 2 đối tượng)**:  
   `dept_code = qms_deptid` AND (`patient_type IS NULL` OR `patient_type = 'ALL'`)
3. **Mức 3 (Toàn viện + Đúng Đối tượng)**:  
   `dept_code IS NULL` AND `patient_type = patientType`
4. **Mức 4 (Mặc định Toàn viện + Cả 2 đối tượng)**:  
   `dept_code IS NULL` AND (`patient_type IS NULL` OR `patient_type = 'ALL'`)

## 4. API & Giao diện xem Nhật ký SMS
- Backend API:
  - `GET /api/v1/booking/:id/sms-history`: Trả về danh sách tất cả các tin nhắn SMS đã gửi của 1 lượt đăng ký.
- Frontend UI:
  - Component `SMSHistoryModal.tsx`: Hiển thị khung popup danh sách nguyên văn các tin nhắn SMS đã nhắn cho bệnh nhân kèm thời gian, trạng thái và cổng gửi.
