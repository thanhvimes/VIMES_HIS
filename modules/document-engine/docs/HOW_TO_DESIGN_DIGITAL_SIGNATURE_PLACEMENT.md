# HƯỚNG DẪN THIẾT KẾ VÀ ĐỊNH VỊ CHỮ KÝ SỐ (SIGNATURE PLACEMENT) CHO MẪU BIỂU

Trong hệ thống VIMES HIS, để định vị trước các vị trí ký số trên file PDF (gọi là **Signature Placeholders**) nhằm giúp bác sĩ/nhân viên y tế có thể bấm vào và ký trực tiếp trên màn hình, bạn có thể thiết lập theo 2 phương pháp dưới đây. Tùy vào mức độ động của biểu mẫu mà người thiết kế chọn phương pháp phù hợp.

---

## PHƯƠNG PHÁP 1: Chèn thẻ Text ẩn (Text Anchor) ngay trong Word
*(🌟 Khuyên dùng đối với các biểu mẫu động, bảng biểu có số lượng dòng thay đổi làm vị trí chữ ký bị đẩy xuống nhiều trang khác nhau)*

Phương pháp này dựa trên cơ chế kết xuất PDF của hệ thống: tự động dò tìm vị trí của một chuỗi ký tự ẩn để xác định tọa độ động (X, Y) và đặt khung ký số (Bounding Box) đè lên đó.

**Các bước thực hiện:**
1. **Chèn thẻ định vị:** Mở file thiết kế `.docx` bằng Microsoft Word. Tại dòng hoặc ô bảng mà bạn muốn đặt chữ ký số, gõ các thẻ đánh dấu theo quy ước ngoặc vuông.
   - Ví dụ: `[SIG_DOCTOR]` (dành cho Bác sĩ điều trị), `[SIG_PATIENT]` (Bệnh nhân), `[SIG_CASHIER]` (Thu ngân).
2. **Ẩn thẻ định vị:** Bôi đen đoạn text thẻ định vị vừa gõ. Đổi màu chữ (Font Color) thành **màu Trắng (White)** hoặc chỉnh kích thước chữ (Font Size) thành **1pt** để text "tàng hình".
   - *Mục đích:* Khi in văn bản ra giấy thường hoặc xem PDF chưa ký, người dùng sẽ không nhìn thấy các thẻ code này.
3. **Upload hệ thống:** Lưu file và đưa lên Template Studio. Khi render sang PDF, hệ thống sẽ tự động quét và tính toán động tọa độ để cho phép người dùng click vào vùng có text ẩn để kích hoạt dịch vụ Ký số (SmartCA/HSM).

---

## PHƯƠNG PHÁP 2: Vẽ vùng ký trực tiếp trên UI Template Studio (Drag & Drop)
*(🌟 Phù hợp với các biểu mẫu tĩnh, một trang, hoặc có vị trí chữ ký cố định (VD: Góc dưới cùng bên phải của trang 1). Không cần chỉnh sửa file Word)*

Phương pháp này sử dụng công cụ hỗ trợ giao diện trên phân hệ Template Studio để trực tiếp ghi nhận tọa độ (`crop_box`, `normalized_rect`) vào cấu hình Metadata.

**Các bước thực hiện:**
1. **Tạo bản nháp:** Upload file `.docx` bình thường lên Template Studio để tạo bản nháp `DRAFT v1`.
2. **Vào công cụ định vị:** Chuyển sang tab cấu hình **"Chữ ký số / Định vị (Placement)"**.
3. **Vẽ hộp chữ ký:** Hệ thống sẽ hiển thị bản Preview PDF. Dùng chuột **Kéo & Thả (Drag & Drop)** một hình chữ nhật tại vị trí muốn tạo khu vực ký.
4. **Phân quyền người ký:** Chọn vai trò được phép ký vào khung vừa vẽ (VD: Role = "Bác sĩ"). 
5. **Lưu cấu hình:** Hệ thống tự động trích xuất các thông số (`pageIndex`, `x1, y1, x2, y2`) và lưu lại. Khi bản nháp này được **Phát hành (Published)**, các thông số tọa độ sẽ trở thành Immutable (Không thể thay đổi) nhằm đảm bảo tính pháp lý.

---

## KẾT QUẢ TRẢI NGHIỆM NGƯỜI DÙNG CUỐI (END-USER)
Dù IT bệnh viện cấu hình bằng Phương pháp 1 hay 2, trải nghiệm của người dùng cuối (Bác sĩ, Kế toán) trên hệ thống là giống hệt nhau:
- Khi Bác sĩ mở file PDF cần duyệt, **Trình xem PDF (PDF Viewer)** của HIS sẽ tự động bôi mờ (highlight) hoặc làm nhấp nháy các vùng có định vị chữ ký của họ.
- Bác sĩ chỉ việc **Click chuột vào vùng sáng đó**, hệ thống lập tức hiển thị form xác nhận và nhúng chứng thư số trực tiếp vào file PDF tại tọa độ chính xác mà không cần tự động căn chỉnh kéo thả thủ công.

---
*Tài liệu được lưu trữ chính thức tại thư mục: `modules/document-engine/docs/` tuân thủ Quy định Quản lý Tài liệu Kỹ thuật VIMES HIS.*
