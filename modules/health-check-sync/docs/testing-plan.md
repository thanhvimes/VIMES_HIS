# KẾ HOẠCH KIỂM THỬ TÍCH HỢP HỆ THỐNG (TESTING PLAN)

Tài liệu này xác định phương án kiểm thử, các kịch bản test chi tiết (Test Cases) để xác minh tính đúng đắn của module Khám sức khỏe liên thông VNeID sau khi nâng cấp theo Quyết định 2062/QĐ-BYT.

---

## 1. Phương án kiểm thử
* **Kiểm thử đơn vị (Unit Test)**: Đảm bảo logic sinh XML lồng nhau (`xml-generator.ts`) và thuật toán băm Checksum Signature RSA-SHA256 kép hoạt động chính xác.
* **Kiểm thử tích hợp (Integration Test)**: Xác minh dữ liệu đồng bộ thành công từ màn hình HIS tiếp đón -> Khám lâm sàng -> Gửi cổng Sandbox.
* **Kiểm thử hiệu năng (Performance Test)**: Đo latency khi ký số và liên thông hàng loạt (>100 hồ sơ đồng thời).

---

## 2. Danh sách kịch bản kiểm thử chi tiết (Test Cases)

### TC-01: Tiếp tiếp nhận và đồng bộ trẻ em dưới 6 tuổi thành công
* **Mục tiêu**: Đảm bảo trẻ dưới 6 tuổi bắt buộc có thông tin người giám hộ và sinh XML1 đúng chuẩn.
* **Input**:
  * Bệnh nhân: Nguyễn Văn B, ngày sinh `2022-05-15` (4 tuổi).
  * Người giám hộ: Nguyễn Văn A (bố), CCCD `038090012345`.
* **Quy trình thực hiện**:
  1. Đăng ký tiếp đón đoàn KSK cho trẻ.
  2. Nhập đầy đủ thông tin người giám hộ trên UI.
  3. Bác sỹ điền thông tin lâm sàng và thực hiện ký số.
  4. Nhấn "Gửi VNeID".
* **Kỳ vọng kết quả (Expected Output)**:
  * File XML1 được tạo chứa thẻ `<NGUOI_GIAM_HO>` và `<SO_CCCD_NGH>` đầy đủ.
  * Cổng tiếp nhận trả về `res_code: "CM_SUCCESS"`.

### TC-02: Chặn cập nhật hồ sơ đã liên thông thành công
* **Mục tiêu**: Đảm bảo an toàn thông tin, không cho phép ghi đè hồ sơ đã lên VNeID.
* **Input**:
  * Hồ sơ KSK của bệnh nhân có `send_status = 'Success'`.
* **Quy trình thực hiện**:
  1. Mở form chỉnh sửa hồ sơ.
  2. Thực hiện thay đổi chiều cao/cân nặng và nhấn "Lưu".
* **Kỳ vọng kết quả (Expected Output)**:
  * Hệ thống hiển thị cảnh báo lỗi: "Hồ sơ đã gửi liên thông VNeID thành công, không thể chỉnh sửa!".
  * API trả về mã lỗi `400 Bad Request`.

### TC-03: Kiểm tra giải thuật băm Checksum Signature
* **Mục tiêu**: Đảm bảo thuật toán băm kép RSA-SHA256 trùng khớp với cổng y tế để không bị từ chối tin.
* **Quy trình thực hiện**:
  1. Tạo header JSON và data Base64 giả lập.
  2. Chạy hàm băm Checksum.
* **Kỳ vọng kết quả (Expected Output)**:
  * Chuỗi hash `A` và `B` được viết hoa hoàn toàn (`Uppercase`).
  * Checksum chữ ký được mã hóa RSA-SHA256 đúng chuẩn khóa học.
