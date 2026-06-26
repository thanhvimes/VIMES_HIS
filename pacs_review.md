# Đánh giá Hệ thống PMR PACS (Mesoco)

Bản phân tích này cung cấp cái nhìn chi tiết về hệ thống **PMR PACS & RIS** (do Công ty Cổ phần Công nghệ và Giải pháp Y tế Mesoco phát triển) đang vận hành trên cổng thông tin y tế `logindkninhbinhthanglong.pmr.vn:8080`.

---

## 1. Tổng quan Kiến trúc Hệ thống
Hệ thống PMR PACS là một giải pháp lai (Hybrid) kết hợp lưu trữ hình ảnh y tế tiêu chuẩn DICOM và phân hệ quản lý thông tin chẩn đoán hình ảnh (RIS).
*   **Công nghệ nền tảng:** Sử dụng ASP.NET làm web portal, tích hợp giao thức truyền thông điệp thời gian thực SignalR (để đồng bộ danh sách chờ đọc kết quả tức thời).
*   **Khả năng đa nền tảng:** Hỗ trợ đầy đủ ứng dụng Web Client và Mobile Client (iOS và Android) giúp bác sĩ xem ảnh và duyệt kết quả linh hoạt từ xa.

---

## 2. Quy trình Nghiệp vụ Chi tiết (PACS / RIS Workflow)

### A. Giao diện Danh sách chờ (PACS Worklist)
Màn hình Worklist đóng vai trò là trung tâm điều phối của phòng chẩn đoán hình ảnh:
*   **Trạng thái chỉ định:** Hiển thị danh sách bệnh nhân từ HIS đồng bộ sang thời gian thực. Phân chia rõ ràng các trạng thái: *Chờ chụp, Đã có ảnh (Acquired), Đang đọc (Processing), Đã duyệt (Approved)*.
*   **Cá nhân hóa bộ lọc:** Bác sĩ và kỹ thuật viên có thể ẩn/hiện và sắp xếp thứ tự các cột thông tin tùy theo nhu cầu sử dụng thực tế.
*   **Mức độ ưu tiên:** Đánh dấu rõ các ca Cấp cứu (Urgent) để đẩy lên đầu danh sách đọc kết quả.
*   **Thư mục lưu trữ nhanh (Favorites):** Cho phép bác sĩ đánh dấu các ca bệnh khó, ca lâm sàng hay để hội chẩn hoặc giảng dạy sau này.

### B. Cửa sổ xem ảnh (PACS Viewer)
Trình xem ảnh DICOM hỗ trợ đầy đủ các công cụ chẩn đoán chuyên sâu:
*   Xoay ảnh, phóng to/thu nhỏ, đảo ngược màu ảnh.
*   Điều chỉnh Window Width / Window Level (độ sáng/độ tương phản).
*   Đo khoảng cách, đo góc, đo diện tích, đo chỉ số tim ngực.
*   So sánh nhiều ca chụp (Multi-study) của cùng một bệnh nhân trên màn hình chia nhỏ.
*   **Đánh dấu ảnh chính (Key Image):** Đánh dấu các lát cắt/ảnh tổn thương điển hình để đính kèm vào kết quả in.

### C. Phân hệ Nhập kết quả (RIS Report Entry)
Tích hợp trực tiếp bên cạnh hoặc bên trong trình xem ảnh:
*   **Mẫu kết quả (Report Templates):** 
    *   *Standard Templates:* Các mẫu cấu trúc chẩn đoán chuẩn do bệnh viện thiết lập ban đầu (VD: X-quang phổi bình thường, siêu âm ổ bụng bình thường).
    *   *Custom Templates:* Bác sĩ có thể tự lưu các mẫu mô tả riêng của cá nhân (`Save report as...`) để tăng tốc độ gõ phím cho các ca bệnh sau.
*   **Quy trình 2 bước phê duyệt:** 
    1.  *Lưu nháp (Save draft):* Lưu tạm các mô tả và kết luận, trạng thái chuyển sang đang xử lý để bác sĩ có thể chỉnh sửa tiếp sau đó.
    2.  *Duyệt & Ký số (Approve & Sign):* Khóa kết quả chẩn đoán hình ảnh, đồng bộ kết luận và mô tả về hồ sơ bệnh án trung tâm trên HIS, kích hoạt trạng thái "Đã duyệt" để phòng khám lâm sàng nhận được kết quả ngay lập tức.

### D. Phân hệ Đọc kết quả từ xa (PACS TELE)
Đây là một điểm sáng lớn trong tính năng của hệ thống PMR PACS:
*   Cho phép các bệnh viện tuyến dưới hoặc phòng khám vệ tinh gửi ca chụp khó lên hệ thống đám mây để nhờ bác sĩ tuyến trên hỗ trợ đọc kết quả từ xa.
*   Khi gửi yêu cầu, người gửi sẽ nhập đầy đủ tóm tắt lâm sàng (triệu chứng, kết quả xét nghiệm, lý do chỉ định).
*   Bác sĩ tuyến trên nhận ca, ghi nhận mô tả/kết luận ý kiến tham vấn. Bác sĩ tại chỗ sẽ kiểm tra lại ý kiến chẩn đoán này trước khi nhấn duyệt ký số chính thức.

---

## 3. Đối chiếu So sánh giữa PMR PACS và Tích hợp RIS trên vClinic

Dưới đây là bảng so sánh giữa các tính năng của hệ thống **PMR PACS (Mesoco)** và giải pháp tích hợp chúng ta vừa hoàn thiện trong module **imaging-results** của **vClinic**:

| Tiêu chuẩn / Tính năng | PMR PACS (Mesoco) | Giải pháp vClinic (Đã triển khai) | Đánh giá & Định hướng |
| :--- | :--- | :--- | :--- |
| **Đồng bộ hàng đợi** | Sử dụng SignalR (Real-time) | Sử dụng Server-Sent Events (SSE) `broadcast` thời gian thực | **Tương đương.** Cả hai giải pháp đều đảm bảo danh sách chờ cập nhật ngay lập tức khi trạng thái thay đổi. |
| **Nhập kết quả (RIS)** | Phân chia Kỹ thuật, Mô tả, Kết luận. Chọn mẫu cấu trúc. | Hỗ trợ 3 ô nhập độc lập (Kỹ thuật, Mô tả, Kết luận) kết hợp Combobox chọn mẫu kết quả chuẩn theo Modality. | **Tương đương.** Giao diện vClinic đáp ứng đầy đủ trải nghiệm nhập liệu chẩn đoán của bác sĩ. |
| **Luồng Phê duyệt** | Lưu nháp + Duyệt & Ký số khóa dữ liệu | Lưu nháp (`hpcl_status = 'P'`) + Duyệt & Ký số (`hpcl_status = 'A'`) | **Đồng bộ.** Luồng xử lý dữ liệu và trạng thái trong DB tương khớp hoàn hảo với nghiệp vụ của PMR PACS. |
| **Đồng bộ Bệnh án (HIS)** | Đẩy chẩn đoán về EMR trung tâm | Tự động đồng bộ kết luận chẩn đoán hình ảnh vào trường `hd_diagnostic` của hồ sơ bệnh án `hms_doc` khi duyệt chính thức. | **Vượt trội.** Tích hợp chặt chẽ trực tiếp trong DB PostgreSQL giúp giảm thiểu tối đa độ trễ trao đổi dữ liệu. |
| **Xem ảnh DICOM** | PACS Viewer chuyên dụng (Web/Mobile) | Giao diện Viewer nhúng (Mock DICOM Viewer hiển thị ảnh chính của ca chụp) | **Định hướng phát triển:** Trong tương lai, vClinic có thể nhúng thư viện CornerstoneJS hoặc OHIF Viewer để mở tệp DICOM nguyên bản trực tiếp thay vì chỉ hiển thị URL ảnh tĩnh. |
