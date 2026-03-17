# Module: Online Booking

Hệ thống cho phép bệnh nhân đăng ký khám bệnh trực tuyến, chọn chuyên khoa và khung giờ linh hoạt qua giao diện web.

## Chức năng chính
- Đăng ký khám theo chuyên khoa.
- Tự động gợi ý khung giờ còn trống từ HIS.
- Tích hợp gửi SMS thông báo mã đặt chỗ (ReceptNo).
- Quản lý cấu hình: Template SMS, Quy tắc đặt lịch, Giờ làm việc.
- Kiểm tra trùng lặp thông tin CCCD từ HIS.

## Cấu trúc dữ liệu
Xem chi tiết các lệnh SQL nâng cấp trong thư mục `sql/`.
- `booking_online_database.sql`: Schema chính cho bệnh nhân và đặt chỗ.
- `create-settings-table.sql`: Lưu trữ các cấu hình linh hoạt.
- `create-sms-templates-table.sql`: Quản lý các mẫu tin nhắn SMS.

## Thành phần backend liên quan
- Controller: `booking.controller.js`
- Service: `bookingService.ts`, `settings.service.js`
- Routes: `booking.routes.js`
