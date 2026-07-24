# CHECKLIST CHUẨN BỊ TRIỂN KHAI PRODUCTION (VẬN HÀNH THỰC TẾ)
## MODULE ĐỒNG BỘ KHÁM SỨC KHỎE VNeID (QĐ 1551/QĐ-BYT)

### 1. Chuẩn bị Tài khoản & Chứng thư số Production
- [ ] **Tài khoản API Production**: Đăng ký và lấy thông tin tài khoản API Production (`username_api`, `password_api`) từ Cổng EMRHub / Bộ Y Tế.
- [ ] **Cặp khóa RSA Cơ sở Y tế**: Khởi tạo cặp khóa RSA 2048-bit chính thức của Cơ sở KCB, gửi Public Key cho Cổng EMRHub Production để đăng ký.
- [ ] **Chứng thư số HSM**: Cấu hình tài khoản Ký số HSM chính thức (VNPT-CA, Viettel-CA, BKAV-CA...) để ký tự động dữ liệu XML.

### 2. Cấu hình Hệ thống trên HIS
- [ ] **URL Cổng liên thông**: Cập nhật URL Cổng Production: `https://api.emrhub.vn/api`.
- [ ] **Mã CSKCB & Mã GLN**: Điền chính xác Mã CSKCB 13 số (GLN) và Mã 5 số của Bộ Y Tế (`MA_CSKCB_BYT`).
- [ ] **Mã hóa khóa mật**: Kiểm tra chắc chắn Private Key và Password HSM đã được lưu mã hóa an toàn trong CSDL PostgreSQL (`health_check_settings`).

### 3. Quy trình Kiểm tra & Vận hành Dữ liệu
- [ ] **Rà soát dữ liệu đầu vào**: Đảm bảo các thông tin hành chính (CCCD 12 số, Số điện thoại 10 số, Ngày cấp CCCD, Mã ngành nghề, Mã tỉnh/xã) được thu thập đầy đủ và chính xác từ khâu Đón tiếp/Khám bệnh.
- [ ] **Ký số & Liên thông**: Thực hiện ký HSM và đẩy hồ sơ liên thông trong ngày sau khi kết thúc lượt khám sức khỏe.
- [ ] **Theo dõi Nhật ký & Báo cáo**: Thường xuyên kiểm tra các hồ sơ có trạng thái lỗi trên giao diện Quản lý đồng bộ để kịp thời xử lý.
