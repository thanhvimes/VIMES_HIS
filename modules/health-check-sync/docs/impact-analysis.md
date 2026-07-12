# PHÂN TÍCH TÁC ĐỘNG CỦA QUYẾT ĐỊNH SỬA ĐỔI QĐ 1551 (QĐ 2062/QĐ-BYT) ĐỐI VỚI VCLINIC HIS

Tài liệu này phân tích chi tiết tác động của việc nâng cấp liên thông Khám sức khỏe lên cổng VNeID theo Quyết định mới nhất 2062/QĐ-BYT đối với hệ thống phần mềm quản lý phòng khám vClinic.

---

## 1. Tác động đối với các Phân hệ (Modules)

### A. Phân hệ Tiếp đón (Reception)
* **Chức năng ảnh hưởng**: Quy trình đăng ký và tiếp nhận đoàn khám sức khỏe.
* **Chức năng cần sửa**:
  * Phân luồng tiếp nhận theo 3 nhóm tuổi mới (Dưới 6 tuổi, Từ 6 - dưới 18 tuổi, Trên 18 tuổi).
* **Chức năng bổ sung**:
  * Tích hợp máy quét CCCD chíp và tài khoản định danh VNeID để tự động điền và xác thực thông tin hành chính của đối tượng khám, đảm bảo dữ liệu "Đúng, Sạch".
* **CSDL cần thay đổi**:
  * Cấu hình lại các bảng lưu thông tin đoàn khám và gói khám để ánh xạ đúng loại nhóm tuổi.
* **Giao diện cần thay đổi**:
  * Bổ sung các trường nhập liệu của người giám hộ (dành cho trẻ dưới 6 tuổi).

### B. Phân hệ Khám lâm sàng & Dynamic Form KSK
* **Chức năng ảnh hưởng**: Form nhập liệu kết quả khám lâm sàng động của bác sỹ.
* **Chức năng cần sửa**:
  * Chuyển đổi 17 mẫu biểu cũ sang cấu trúc biểu mẫu nhập liệu lâm sàng thống nhất cho 3 nhóm tuổi chính.
* **Chức năng bổ sung**:
  * Bổ sung vùng ký số chuyên khoa của bác sỹ lâm sàng trực tiếp trên giao diện của từng chuyên khoa (Mắt, Răng Hàm Mặt, Tai Mũi Họng...).
* **CSDL cần thay đổi**:
  * Điều chỉnh JSONB Schema trong `health_check_details` để chứa thông tin phân loại chuyên khoa (Loại 1 - 5) và chữ ký số bác sỹ chuyên khoa tương ứng.
* **Giao diện cần thay đổi**:
  * Thiết kế lại giao diện Form khám lâm sàng chia theo Tab chuyên khoa y tế, hiển thị nút ký số chuyên khoa bên cạnh mỗi chuyên khoa.

### C. Phân hệ Cận lâm sàng & LIS/PACS
* **Chức năng ảnh hưởng**: Kết quả xét nghiệm và chẩn đoán hình ảnh.
* **Chức năng cần sửa**:
  * Quy trình đồng bộ tự động kết quả xét nghiệm (LIMS) và X-Quang/Siêu âm (PACS) sang bảng trung gian KSK.
* **Chức năng bổ sung**:
  * Lọc kết quả cận lâm sàng theo mã chỉ định để tự động điền vào tệp XML11.

### D. Phân hệ Chữ ký số & Liên thông cổng
* **Chức năng ảnh hưởng**: Đóng gói XML, ký số và gọi API đẩy dữ liệu lên cổng liên thông.
* **Chức năng cần sửa**:
  * Xây dựng lại logic xuất tệp XML: Gộp Envelope lớn chứa các tệp XML con từ XML1 đến XML12 Base64.
  * Sửa đổi Endpoint đẩy dữ liệu sang cổng Trục dữ liệu Bộ Y tế (`POST /api/platform/data-sync/push`).
* **Chức năng bổ sung**:
  * Lập trình giải thuật băm Checksum Signature RSA-SHA256 kép (`A + "." + B`).

---

## 2. Kế hoạch thay đổi Database Schema

Chi tiết các thay đổi DDL cần thực hiện được mô tả tại tài liệu [database-design.md](file:///d:/AI/vClinic/modules/health-check-sync/docs/database-design.md).
