# Giải pháp Hệ thống PACS & RIS Nội bộ (Native) trên vClinic

Tài liệu này trình bày phương án kiến trúc, luồng nghiệp vụ và kế hoạch xây dựng mới giải pháp **PACS (Picture Archiving and Communication System)** và **RIS (Radiology Information System)** tích hợp sẵn trực tiếp bên trong nền tảng **vClinic**, độc lập hoàn toàn với bên thứ ba (Mesoco) dựa trên những phân tích nghiệp vụ thực tế.

---

## 1. Mô hình Kiến trúc PACS/RIS Nội bộ của vClinic

Hệ thống sẽ bao gồm 3 thành phần cốt lõi được xây dựng nguyên bản trong kiến trúc vClinic:

```
+-----------------------------------------------------------------------+
|                              vClinic HIS                              |
|   (Hệ thống quản lý thông tin bệnh viện - Đăng ký, Chỉ định, Viện phí)|
+------------------------------------+----------------------------------+
                                     |
                                     v (Trực tiếp trong DB PostgreSQL)
+------------------------------------+----------------------------------+
|                            vClinic RIS                                |
|   - Quản lý hàng đợi phòng chụp (PACS Worklist)                       |
|   - Mẫu chẩn đoán cấu trúc động (Standard & Custom Templates)         |
|   - Phân hệ soạn thảo kết quả, Phê duyệt 2 bước & Ký số               |
|   - Trạm hội chẩn từ xa (PACS Tele)                                   |
+------------------------------------+----------------------------------+
                                     |
              +----------------------+----------------------+
              | (Lưu tệp DICOM)                             | (Xem & Thao tác hình ảnh)
              v                                             v
+-------------+-------------+                 +-------------+-------------+
|    vClinic DICOM Server   |                 |    vClinic DICOM Viewer   |
| (Lưu trữ tập tin hình ảnh)|                 | (CornerstoneJS / Web Viewer)|
+---------------------------+                 +---------------------------+
```

---

## 2. Các Phân hệ Nghiệp vụ Chi tiết

### A. Phân hệ Danh sách chờ (PACS Worklist & QMS)
*   **Hàng đợi thời gian thực:** Đồng bộ tức thời thông tin chỉ định CĐHA từ phòng khám thông qua Server-Sent Events (SSE). 
*   **Trạng thái vòng đời chỉ định:**
    1.  `Scheduled` (Chờ chụp): Bệnh nhân đã đóng phí chỉ định, đang đợi gọi số tại phòng chụp.
    2.  `Acquired` (Đã chụp - Có ảnh): Kỹ thuật viên (KTV) chụp xong, đẩy ảnh từ máy chụp lên DICOM Server.
    3.  `Processing` (Đang đọc): Bác sĩ chẩn đoán hình ảnh đang mở ca chụp để chẩn đoán.
    4.  `Approved` (Đã duyệt): Bác sĩ đã khóa kết quả và ký số, tự động đẩy về EMR của bác sĩ lâm sàng.
*   **Bộ lọc thông minh & Cá nhân hóa:** Cho phép bác sĩ/KTV ẩn/hiện các cột thông tin (Mã bệnh nhân, Tên bệnh nhân, Loại máy Modality, Thời gian chờ, Mức độ ưu tiên,...) và tự sắp xếp thứ tự cột.
*   **Ưu tiên Cấp cứu:** Các ca chỉ định Cấp cứu (Urgent) từ phòng cấp cứu tự động được đánh dấu màu đỏ, đẩy lên đầu danh sách và phát âm thanh cảnh báo.
*   **Favorites (Lưu trữ nhanh):** Thiết lập thư mục "Ca bệnh hay / Hội chẩn" để bác sĩ đánh dấu các ca chẩn đoán khó nhằm nghiên cứu, giảng dạy hoặc hội chẩn sau này.

### B. Trình xem ảnh DICOM Chuyên dụng (vClinic DICOM Viewer)
Xây dựng trên nền tảng **CornerstoneJS** (hoặc WebGL Canvas hiệu năng cao) cho phép xem ảnh gốc không suy giảm chất lượng:
*   **Công cụ xử lý ảnh cơ bản:** Phóng to/thu nhỏ (Zoom), dịch chuyển ảnh (Pan), điều chỉnh độ sáng/tương phản (Window Width / Window Level - WW/WL) bằng chuột kéo thả, xoay ảnh (Rotate), lật ảnh (Flip), đảo ngược màu (Invert).
*   **Bộ công cụ đo đạc chẩn đoán chuyên sâu (Measurements):**
    *   Đo khoảng cách (Distance) quy đổi sang đơn vị mm thực tế.
    *   Đo góc (Angle), đo diện tích hình tròn/hình chữ nhật (Area/ROI).
    *   Công cụ đo chỉ số tim ngực (Cardiothoracic Ratio) chuyên dụng cho X-quang phổi.
*   **Chế độ so sánh nhiều ca chụp (Multi-study):** Chia nhỏ màn hình (Grid layout 1x2, 2x2) để bác sĩ so sánh ca chụp hiện tại với các phim chụp cũ trong lịch sử của cùng một bệnh nhân.
*   **Đánh dấu ảnh chính (Key Image):** Bác sĩ click chọn 1 hoặc nhiều lát cắt/hình ảnh điển hình của khối u/tổn thương để lưu trữ làm "Ảnh chính", ảnh này sẽ được in ra trên phiếu trả kết quả.

### C. Phân hệ Nhập kết quả & Quản lý Mẫu (RIS Report & Templates)
*   **Giao diện 3 phân vùng thông minh:** Trình xem ảnh (Trái) - Danh sách chuỗi hình ảnh/Series (Dưới) - Giao diện soạn thảo kết quả (Phải).
*   **Nhập liệu độc lập 3 vùng:** 
    1.  *Kỹ thuật khảo sát* (Mặc định nạp theo mẫu).
    2.  *Mô tả hình ảnh* (Mô tả chi tiết tổn thương).
    3.  *Kết luận chẩn đoán* (Đồng bộ trực tiếp về HIS EMR).
*   **Quản lý mẫu chẩn đoán cấu trúc:**
    *   *Standard Templates:* Mẫu dùng chung toàn viện cấu hình theo Modality/Bộ phận cơ thể.
    *   *Custom Templates:* Bác sĩ có thể tùy biến và lưu mẫu soạn thảo riêng của cá nhân (`Lưu làm mẫu cá nhân...`) để sử dụng cho các ca sau.
*   **Ký số & Khóa kết quả:** Hỗ trợ tích hợp ký điện tử (Smart CA / USB Token). Khi nhấn "Duyệt & Ký số", toàn bộ nội dung chẩn đoán sẽ bị khóa, không thể chỉnh sửa trừ khi được cấp quyền mở khóa từ Admin.

### D. Phân hệ Hội chẩn / Đọc kết quả từ xa (PACS Tele)
*   **Gửi yêu cầu hội chẩn:** Phòng khám tuyến dưới/vệ tinh có thể nhấn nút "Yêu cầu Hội chẩn từ xa" đối với các ca khó. Hệ thống tự động đính kèm Tóm tắt bệnh án lâm sàng, các xét nghiệm liên quan và hình ảnh DICOM lên đám mây vClinic.
*   **Trạm tiếp nhận tuyến trên:** Bác sĩ tuyến trên nhận thông báo, mở phim DICOM, ghi nhận ý kiến tham vấn chẩn đoán.
*   **Phê duyệt tại chỗ:** Bác sĩ tại cơ sở nhận kết quả tư vấn từ tuyến trên, kiểm tra lại, thực hiện chỉnh sửa nếu cần và thực hiện ký số duyệt kết quả chính thức.

---

## 3. Các bước triển khai xây dựng

### Bước 1: Thiết kế Cơ sở Dữ liệu (Database Schema)
*   Tạo mới bảng lưu trữ mẫu báo cáo cá nhân `hms_pacs_template_custom` liên kết với tài khoản bác sĩ.
*   Bổ sung bảng `hms_pacs_favorites` để quản lý các ca bệnh được bác sĩ đánh dấu.
*   Tạo bảng lưu trữ ý kiến hội chẩn từ xa `hms_pacs_tele_consultation`.

### Bước 2: Nâng cấp Backend & DICOM Node (API)
*   Xây dựng dịch vụ DICOM Web Server đơn giản trong backend vClinic để tiếp nhận tệp DICOM từ máy chụp đẩy lên qua giao thức C-STORE (hoặc tải trực tiếp qua HTTP API).
*   Mở rộng API `/api/imaging/results` để hỗ trợ lưu trữ nhiều ảnh chính (Key Images) và trạng thái duyệt chi tiết.

### Bước 3: Hoàn thiện UI PACS Worklist & Bảng điều khiển
*   Phát triển giao diện quản lý cột (Hide/Show columns) và lưu cấu hình hiển thị của từng tài khoản bác sĩ vào `localStorage` hoặc database.
*   Bổ sung bộ lọc trạng thái chi tiết: Chờ chụp, Đã có ảnh, Đang đọc, Đã duyệt.
*   Xây dựng nút lưu nhanh "Favorites" (Biểu tượng Ngôi sao) bên cạnh mỗi dòng bệnh nhân.

### Bước 4: Nâng cấp DICOM Viewer & Đo đạc
*   Nâng cấp cấu trúc component `MockDicomViewer` để bổ sung thanh trượt cuộn lát cắt hình ảnh (Slice scroll), lưu trữ danh sách các điểm đo đạc hình học (Measurement list) trên Canvas.
*   Tích hợp chia đôi màn hình (Split screen) khi so sánh hai ca chụp.

### Bước 5: Kiểm thử và Tối ưu hiệu năng
*   Kiểm tra tốc độ tải hình ảnh độ phân giải cao trên Web. Sử dụng kỹ thuật lazy-loading và nén hình ảnh không suy hao khi hiển thị trên các thiết bị di động/mạng yếu.
