# REVIEW TỔNG THỂ MODULE KHÁM SỨC KHỎE VNeID (vClinic)

> **Mục tiêu:** Đánh giá tổng quan về kiến trúc nghiệp vụ, luồng quy trình công việc (workflow), liên thông dữ liệu cận lâm sàng (LIS/PACS), quy trình ký số (chữ ký số bác sĩ & tổ chức) và đồng bộ cổng liên thông VNeID (Quyết định 1551/QĐ-BYT).

---

## I. Sơ đồ luồng nghiệp vụ thực tế (Data & Process Lifecycle)

Quy trình hoạt động của module Khám sức khỏe trên hệ thống vClinic được thiết kế theo luồng khép kín từ lúc đón bệnh nhân cho đến khi liên thông thành công:

```mermaid
graph TD
    A["1. Đón tiếp & Quét VNeID/CCCD"] -->|Khởi tạo hồ sơ & gán MA_LK| B["2. Khám Lâm sàng chuyên khoa"]
    B -->|Bác sĩ ký số chuyên khoa nháp| C["3. Thực hiện Xét nghiệm (LIS) & CDHA (PACS)"]
    C -->|Ghép kết quả CLS tự động/chủ động| D["4. Bác sĩ Kết luận khám tổng thể"]
    D -->|Khóa hồ sơ & Ký số bác sĩ kết luận| E["5. Trình ký số Tổ chức (CSKCB)"]
    E -->|Đóng dấu số bệnh viện (HSM / Token)| F["6. background worker đóng gói XML & Gửi cổng"]
    F -->|Đạt chuẩn kiểm định| G["7. Đồng bộ hiển thị lên Sổ sức khỏe VNeID"]
```

---

## II. Đánh giá chi tiết các phân hệ nghiệp vụ chính

### 1. Phân hệ Tiếp nhận & Khởi tạo (Mẫu biểu động)
*   **Điểm mạnh**: 
    *   Hỗ trợ tự động phân loại đối tượng theo 17 mẫu biểu quy định của Bộ Y tế (ví dụ: Mẫu 01 cho trẻ < 6 tuổi, Mẫu 02 cho trẻ 6-18 tuổi, Mẫu 03 cho người lớn từ 18 tuổi, Mẫu khám sức khỏe lái xe, đường sắt, tàu biển...).
    *   Tự động gán mã liên kết liên thông duy nhất (`MA_LK`) liên kết đồng bộ thông tin hành chính từ Cơ sở dữ liệu quốc gia về dân cư.
*   **Nghiệp vụ lưu ý**: Việc chuyển đổi giữa các mẫu biểu cần linh hoạt vì nhiều trường hợp nhập thông tin ban đầu sai tuổi (nhân viên tiếp đón nhập nhầm ngày sinh), dẫn đến load sai form mẫu. Hệ thống hiện tại đã có nút cho phép thay đổi form động rất tốt.

### 2. Tiền sử dịch tễ & Vaccine (Sản khoa & Tiêm chủng đặc thù)
*   **Điểm mạnh**:
    *   Thiết kế form Tiền sử gia đình/bản thân tích hợp tìm kiếm mã ICD-10 trực tiếp từ danh mục cổng `hms_icd`.
    *   Đáp ứng trọn vẹn các chỉ mục tiêm chủng mở rộng đặc thù của trẻ em (Mẫu 01, Mẫu 02) và tiền sử sản phụ khoa đối với mẫu người lớn.
*   **Nghiệp vụ lưu ý**:
    *   Thông tin tiêm chủng cần cập nhật từ Sổ tiêm chủng quốc gia (nếu có kết nối API) hoặc nhập thủ công nhanh thông qua các nút check nhanh để giảm thiểu công sức cho điều dưỡng/bác sĩ.

### 3. Khám thể lực & Khám lâm sàng chuyên khoa
*   **Điểm mạnh**:
    *   Công thức tự động tính chỉ số BMI hiển thị tức thời khi nhập Chiều cao/Cân nặng.
    *   Thiết kế bảng phân khoa lâm sàng chuẩn chỉnh gồm: Tuần hoàn, Hô hấp, Tiêu hóa, Thận-Tiết niệu, Thần kinh, Tâm thần, Mắt, Tai Mũi Họng, Răng Hàm Mặt...
    *   Mỗi chuyên khoa đều tích hợp ô đánh giá kết luận lâm sàng chuyên khoa và dòng `Phân loại` tự động (Loại I đến V).
    *   **Ký số phân quyền**: Phân định rõ bác sĩ chuyên khoa nào khám thì chỉ được ký xác nhận trên chuyên khoa đó thông qua phân quyền metadata (`specialty_metadata`).
*   **Nghiệp vụ lưu ý**: Quy trình khám tại phòng khám/bệnh viện thường chạy song song (bệnh nhân đi khám mắt, tai mũi họng ở các phòng khác nhau). Việc phân rã trạng thái khám chuyên khoa (`CHUA_KHAM`, `DANG_KHAM`, `DA_KHAM`) giúp các bác sĩ không ghi đè dữ liệu của nhau khi lưu hồ sơ chung.

### 4. Tích hợp cận lâm sàng chủ động (LIMS/PACS)
*   **Điểm mạnh**:
    *   Tính năng **Đồng bộ kết quả từ HIS** cho phép lấy chủ động toàn bộ danh mục dịch vụ cận lâm sàng đã có kết quả từ hệ thống Xét nghiệm (LIS) và Chẩn đoán hình ảnh (PACS) đổ trực tiếp vào bảng tệp cận lâm sàng trang 4.
    *   Hỗ trợ chạy đồng bộ nhiều lần mà không làm mất hoặc ghi đè thông tin lâm sàng/tiền sử đã nhập trước đó.
*   **Nghiệp vụ lưu ý**: Việc lọc và ánh xạ dịch vụ từ HIS vào đúng 3 nhóm lớn của tệp liên thông XML (Xét nghiệm - XN, Chẩn đoán hình ảnh - HA, Thăm dò chức năng - TD) dựa trên cấu trúc tiền tố mã dịch vụ cần bảo trì liên tục khi HIS cập nhật danh mục dịch vụ mới.

### 5. Quy trình Ký số và Khóa hồ sơ (Security & Integrity)
*   **Điểm mạnh**:
    *   Cơ chế **Khóa hồ sơ (Locking)** ngăn chặn mọi hành vi thay đổi dữ liệu sau khi bác sĩ kết luận đã duyệt sức khỏe bệnh nhân.
    *   Hỗ trợ hai phương thức ký số linh hoạt:
        1.  **USB Token**: Phù hợp cho bác sĩ lâm sàng ký lẻ trực tiếp tại phòng khám.
        2.  **Cloud HSM (Cloud CA)**: Tối ưu cho ký số hàng loạt (Bulk signing) tại phòng hành chính/tổ chức liên thông dữ liệu lớn.
    *   Mộc ký số điện tử được chèn tự động lên giao diện bản in PDF và lưu trữ vĩnh viễn trên tệp để làm bằng chứng pháp lý phục vụ thanh kiểm tra y tế.
*   **Nghiệp vụ lưu ý**: Bất kỳ hành động sửa đổi hồ sơ sau khi đã ký sẽ lập tiếp hủy bỏ chữ ký cũ và chuyển trạng thái về `Chưa ký` (Unsigned) để đảm bảo tính toàn vẹn của dữ liệu y khoa trước khi gửi lên cổng.

### 6. Đóng gói Envelope XML & Liên thông dữ liệu
*   **Điểm mạnh**:
    *   Tự động chuyển đổi toàn bộ cấu trúc dữ liệu JSON từ Database sang schema XML chuẩn XML11/Envelope theo yêu cầu của Quyết định 1551.
    *   Tính toán mã hash checksum bảo mật RSA-SHA256 để kiểm soát tính toàn vẹn của gói tin.
    *   Worker chạy ngầm thông minh tự động thử lại (Retry) khi cổng y tế quốc gia bị nghẽn mạng, tránh làm gián đoạn công việc của nhân viên y tế.

---

## III. Các khuyến nghị tối ưu hóa quy trình (Recommendations)

1.  **Ràng buộc logic dữ liệu (Validation Rules) trước khi Ký số**:
    *   Cần thêm cảnh báo đỏ trên UI nếu chiều cao/cân nặng hoặc chỉ số sinh tồn vượt ngưỡng sinh lý bình thường của trẻ/người lớn mà chưa có kết luận ghi chú tương ứng.
    *   Bắt buộc điền mã ICD-10 hợp lệ nếu phân loại sức khỏe chung từ Loại III trở xuống hoặc kết luận là "Có vấn đề sức khỏe cần lưu ý".
2.  **Liên thông danh mục tiêm chủng tự động**:
    *   Nếu bệnh viện có kết nối với Hệ thống quản lý tiêm chủng quốc gia, nên phát triển cổng trung gian tự tải lịch sử tiêm chủng của trẻ về điền sẵn vào bảng Mẫu 02 để giảm tải thời gian hỏi bệnh tiền sử của bác sĩ.
3.  **Tự động cập nhật trạng thái ký số từ HIS**:
    *   Hệ thống HIS của vClinic nên tích hợp sâu hơn để tự động đồng bộ chữ ký số của bác sĩ khi họ thực hiện kết luận đợt điều trị/đợt khám sức khỏe trên HIS chính, từ đó giảm số bước click chuột của bác sĩ kết luận tại module Liên thông này.

---
*Báo cáo được thực hiện bởi Antigravity Pair-Programming Assistant — vClinic Project.*
