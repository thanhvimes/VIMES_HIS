# KẾ HOẠCH TRIỂN KHAI NÂNG CẤP MODULE LIÊN THÔNG KHÁM SỨC KHỎE THEO QUYẾT ĐỊNH 2062/QĐ-BYT

Tài liệu này vạch ra lộ trình triển khai chi tiết cho đội ngũ phát triển phần mềm vClinic để nâng cấp toàn diện hệ thống đáp ứng Quyết định 2062/QĐ-BYT (Sửa đổi QĐ 1551).

---

## 1. Phân chia Epic và Backlog kỹ thuật

### 📦 EPIC 01: CHUẨN HÓA CƠ SỞ DỮ LIỆU & DANH MỤC
* **User Story**: Là quản trị viên hệ thống, tôi muốn cơ sở dữ liệu lưu trữ đầy đủ các chỉ tiêu hành chính, lâm sàng mới để sẵn sàng cho việc xuất XML 3 nhóm tuổi.
* **Tasks**:
  * `Task 1.1`: Viết script migration bổ sung cột người giám hộ (`guardian_name`, `guardian_cccd`, `guardian_phone`, `guardian_relation`) vào bảng `health_check_masters`.
  * `Task 1.2`: Tạo bảng `health_check_specialist_signatures` lưu trữ chữ ký số chuyên khoa của từng bác sỹ khám lâm sàng.
  * `Task 1.3`: Import danh mục mã dùng chung (Mã đối tượng mới, mã nguồn chi trả, mã nghề nghiệp) vào cơ sở dữ liệu.

---

### 🖥️ EPIC 02: NÂNG CẤP DYNAMIC FORM LÂM SÀNG (FRONTEND)
* **User Story**: Là bác sỹ khám sức khỏe, tôi muốn giao diện nhập liệu lâm sàng được phân nhóm tự động theo 3 mẫu độ tuổi và hỗ trợ ký số chuyên khoa của riêng tôi.
* **Tasks**:
  * `Task 2.1`: Thiết kế lại component `DynamicForm.tsx` hiển thị giao diện phù hợp dựa trên 3 nhóm tuổi mới.
  * `Task 2.2`: Bổ sung tính năng cho phép bác sỹ từng chuyên khoa (Mắt, Tai mũi họng, Răng hàm mặt, Nội khoa...) chọn chứng thư số và thực hiện ký số trực tiếp trên phân hệ khám của mình.
  * `Task 2.3`: Tự động tính toán chỉ số BMI và hiển thị phân loại chuyên khoa (Loại 1 -> Loại 5) theo quy chuẩn.

---

### 📡 EPIC 03: LIÊN THÔNG DỮ LIỆU & THUẬT TOÁN KÝ SỐ MỚI (BACKEND)
* **User Story**: Là nhân viên phụ trách liên thông, tôi muốn hệ thống tự động băm dữ liệu, ký số Envelope và gửi tệp XML Base64 lên Trục dữ liệu Bộ Y tế thành công.
* **Tasks**:
  * `Task 3.1`: Viết lại helper `generateXmlPayload` trong `xml-generator.ts` để xuất cấu trúc Envelope chứa các tệp XML1 đến XML12 con Base64.
  * `Task 3.2`: Phát triển thuật toán băm Checksum Signature RSA-SHA256 theo công thức băm kép `A + "." + B` trong `health-check-sync.service.ts`.
  * `Task 3.3`: Thay đổi Endpoint đẩy dữ liệu sang trục emrhub (`POST /api/platform/data-sync/push`).

---

## 2. Kế hoạch triển khai & Đánh giá rủi ro

| Hạng mục nâng cấp | Độ phức tạp | Thời gian ước tính | Phụ thuộc | Rủi ro tiềm ẩn | Giải pháp khắc phục |
| :--- | :---: | :---: | :--- | :--- | :--- |
| **Nâng cấp DB Schema** | Thấp | 1 ngày | Không | Xung đột dữ liệu lịch sử khám sức khỏe cũ. | Thực hiện migration an toàn, sử dụng `ADD COLUMN IF NOT EXISTS`, không thay đổi kiểu dữ liệu các trường cũ. |
| **Tách 17 Mẫu thành 3 Nhóm Form** | Cao | 5 ngày | DB Schema | Giao diện hiển thị sai lệch ở các độ tuổi giáp ranh (như trẻ đúng 6 tuổi). | Validate chặt chẽ trường ngày sinh (`dob`) tại reception để phân luồng mẫu biểu chính xác. |
| **Lập trình sinh XML lồng Base64** | Rất cao | 7 ngày | Form Lâm sàng | XML lồng nhau dễ bị lỗi parse thẻ, sai định dạng Base64. | Viết Unit Test tự động parse thử XML kết quả bằng thư viện XML Parser chuẩn trước khi gửi cổng. |
| **Ký số & Checksum RSA-SHA256** | Cao | 4 ngày | XML Generator | Sai lệch chữ ký số do khoảng trắng/xuống dòng trong JSON header. | Chuẩn hóa JSON string bằng cách loại bỏ tất cả khoảng trắng ngoài, xuống dòng trước khi tính hash SHA256. |

---

## 3. Lộ trình triển khai dự kiến (Roadmap)
1. **Tuần 1**: Hoàn thành DB Schema + Tích hợp đầu đọc CCCD tại quầy tiếp đón + Xây dựng lại UI Form 3 nhóm tuổi.
2. **Tuần 2**: Hoàn thiện backend XML Generator (XML1 -> XML12) + Lập trình thuật toán Checksum băm kép RSA-SHA256.
3. **Tuần 3**: Chạy thử nghiệm trong môi trường Sandbox với Trục dữ liệu Bộ Y tế + Đào tạo bác sỹ ký số chuyên khoa + Nghiệm thu và Golive.
