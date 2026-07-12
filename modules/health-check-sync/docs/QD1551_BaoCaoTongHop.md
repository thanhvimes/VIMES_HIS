# BÁO CÁO TỔNG HỢP: ĐÁNH GIÁ TÁC ĐỘNG VÀ KẾ HOẠCH NÂNG CẤP LIÊN THÔNG KSK (QĐ 2062/QĐ-BYT)

Báo cáo tổng kết toàn diện kế hoạch nâng cấp phần mềm khám sức khỏe vClinic đáp ứng Quyết định số **2062/QĐ-BYT** (Sửa đổi QĐ 1551).

---

## 1. Tóm tắt các thay đổi quan trọng nhất
1. **Tinh gọn cấu trúc biểu mẫu**: Gom 17 mẫu biểu phức tạp thành **3 nhóm tuổi chính**: Dưới 6 tuổi, Từ 6 đến dưới 18 tuổi, và Từ đủ 18 tuổi trở lên.
2. **Cấu trúc XML lồng nhau (Envelope/Nested XML)**: Tách dữ liệu khám thành tệp tin XML Envelope lớn chứa các tệp XML1 đến XML12 con dạng Base64.
3. **Tiêu chuẩn dữ liệu "Đúng, Đủ, Sạch, Sống"**: Yêu cầu xác thực định danh (quét CCCD/VNeID) ngay từ khâu tiếp đón và bắt buộc ký số tổ chức của bệnh viện cũng như ký số cá nhân của bác sĩ chuyên khoa khám.
4. **Chuẩn hóa chữ ký Checksum**: Áp dụng chuẩn băm kép SHA256 trên cả header và data, sau đó mã hóa RSA-SHA256 làm signature trước khi truyền API.

---

## 2. Danh sách các điểm cần chỉnh sửa trong hệ thống vClinic

### A. Các bảng dữ liệu cần thay đổi (CSDL)
1. Bảng `health_check_masters`: Bổ sung các cột thông tin người giám hộ cho nhóm trẻ em.
2. Bảng `health_check_settings`: Bổ sung cột mã GLN bệnh viện `ma_gtin_cskcb` (13 số).
3. Tạo mới bảng `health_check_specialist_signatures` để lưu trữ chữ ký số chuyên khoa của từng bác sỹ khám lâm sàng.

### B. Các API cần thay đổi (Backend)
1. API `updateDocument` (`POST /documents/:id`): Bổ sung logic chặn không cho sửa đổi hồ sơ đã gửi cổng thành công (`send_status = 'Success'`).
2. API liên thông cổng (`POST /documents/send`):
   * Thay đổi endpoint đích sang Trục dữ liệu Bộ Y tế (`POST /api/platform/data-sync/push`).
   * Viết lại thuật toán băm Checksum Signature.
3. API sinh XML (`xml-generator.ts`): Thay đổi hoàn toàn cấu trúc XML phẳng sang cấu trúc XML Envelope chứa nhiều file con (XML1 -> XML12).

### C. Các màn hình cần thay đổi (Frontend)
1. Màn hình Tiếp đón đoàn KSK (`PatientReception.tsx`): Bổ sung tích hợp quét CCCD chíp/VNeID để đối chiếu hành chính.
2. Màn hình Nhập liệu lâm sàng (`DynamicForm.tsx`): Thay đổi giao diện 17 mẫu biểu thành 3 mẫu biểu nhóm tuổi chính; bổ sung nút ký số chuyên khoa cho bác sỹ lâm sàng chuyên khoa.

### D. Các báo cáo cần thay đổi (Reporting)
1. Báo cáo in ấn hồ sơ KSK (`PrintForm.tsx`): Cập nhật form in A4 theo mẫu biểu tinh giản mới của QĐ 2062.
2. File xuất excel danh sách liên thông: Bổ sung cột Trạng thái ký số chuyên khoa, Mã GLN cơ sở y tế.

---

## 3. Lộ trình triển khai đề xuất
* **Giai đoạn 1: Chuẩn bị & DB (Ngày 1 - Ngày 3)**: Cập nhật DB schema, cấu hình danh mục mã dùng chung.
* **Giai đoạn 2: Phát triển UI/UX (Ngày 4 - Ngày 8)**: Nâng cấp Form lâm sàng 3 nhóm tuổi mới trên Frontend.
* **Giai đoạn 3: Phát triển Backend (Ngày 9 - Ngày 14)**: Lập trình sinh XML Envelope lồng Base64 và thuật toán băm Checksum.
* **Giai đoạn 4: Kiểm thử & Triển khai (Ngày 15 - Ngày 20)**: Test kết nối Sandbox, đào tạo bác sỹ và Go-live.
