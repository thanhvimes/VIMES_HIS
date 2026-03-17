# Module: Patient Portal

Cổng thông tin dành cho bệnh nhân tra cứu lịch sử khám bệnh và quản lý hồ sơ gia đình.

## Chức năng chính
- **Xác thực Hybrid**: Đăng nhập bằng mật khẩu (tiết kiệm phí SMS OTP) hoặc SĐT + PID.
- **Kích hoạt tài khoản**: Link SĐT với mã bệnh nhân (PID) và thiết lập mật khẩu lần đầu.
- **Tra cứu bệnh án**: Xem chi tiết các lần khám (Sinh hiệu, Chẩn đoán, Đơn thuốc, Xét nghiệm).
- **Quản lý gia đình**: Đăng nhập một lần, xem được hồ sơ của nhiều người thân liên kết.
- **Tái khám nhanh**: Đăng ký khám lại dựa trên thông tin lần khám trước.

## Cấu trúc dữ liệu
- `portal-schema.sql`: Lưu trữ thông tin tài khoản portal và liên kết hồ sơ (Dual-Mapping).

## Thành phần backend liên quan
- Controller: `portal.controller.js`
- Routes: `portal.routes.js`
