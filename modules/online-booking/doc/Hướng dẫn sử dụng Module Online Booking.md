# HƯỚNG DẪN SỬ DỤNG MODULE QUẢN LÝ ĐẶT LỊCH TRỰC TUYẾN (vClinic)

Tài liệu này hướng dẫn nhân viên y tế và quản trị viên vận hành Module Đặt lịch trực tuyến (Online Booking) từ giai đoạn tiếp nhận yêu cầu đến khi hoàn tất quy trình vào HIS.

---

## 1. Tổng quan quy trình
1. **Bệnh nhân:** Đăng ký khám qua Portal/Web.
2. **Nhân viên Tiếp nhận:** Kiểm tra danh sách chờ duyệt -> Duyệt/Từ chối.
3. **Đồng bộ HIS:** Sau khi duyệt, lịch hẹn tự động chuyển vào danh sách chờ khám thực tế tại phòng khám.

---

## 2. Hướng dẫn chi tiết các chức năng

### 2.1. Quản lý danh sách Đặt lịch (Booking Management)
Đây là màn hình chính để nhân viên theo dõi toàn bộ yêu cầu đặt lịch từ bệnh nhân.

*   **Truy cập:** Menu **Đặt lịch Online** -> **Quản lý đặt lịch**.
*   **Bộ lọc dữ liệu:**
    *   Lọc theo Ngày khám.
    *   Lọc theo Trạng thái (Chờ duyệt, Đã duyệt, Đã hủy).
    *   Lọc theo Chuyên khoa hoặc tìm kiếm nhanh bằng Tên/SĐT/Mã lịch hẹn.

> **[Hình ảnh mô tả: Giao diện danh sách đặt lịch với các bộ lọc và bảng dữ liệu]**

*   **Các hành động trên mỗi ca khám:**
    *   **Duyệt lịch (Nút Check xanh):** Xác nhận lịch hẹn và đẩy thông tin vào hệ thống HIS.
    *   **Từ chối (Nút X đỏ):** Hủy lịch hẹn (kèm theo lý do nếu cần).
    *   **In phiếu hẹn (Icon Máy in):** In phiếu có mã QR/Barcode để bệnh nhân cầm khi đến viện.
    *   **Gửi lại SMS (Icon Máy bay/Sms):** Gửi lại tin nhắn xác nhận nếu bệnh nhân chưa nhận được.

---

### 2.2. Tính năng Đăng ký nhanh chuyên khoa khác
Dành cho trường hợp bệnh nhân đã đặt một chuyên khoa, nhân viên muốn hỗ trợ đặt thêm chuyên khoa khác ngay lập tức mà không cần nhập lại thông tin cá nhân.

*   **Cách thực hiện:**
    1. Tìm bệnh nhân trong danh sách Quản lý đặt lịch.
    2. Nhấn nút **"Đăng ký thêm chuyên khoa"** (Icon tờ giấy có dấu cộng 📄+).
    3. Một cửa sổ (Modal) hiện ra với đầy đủ thông tin bệnh nhân đã có.
    4. Chỉ cần chọn **Chuyên khoa mới** -> **Ngày** -> **Giờ** còn trống.
    5. Nhấn **Xác nhận**.

> **[Hình ảnh mô tả: Cửa sổ Modal đăng ký nhanh với thông tin bệnh nhân đã được điền sẵn]**

---

### 2.3. Màn hình Tiếp nhận báo cáo (Reception Report)
Dùng để theo dõi số lượng bệnh nhân thực tế đến viện dựa trên lịch đã đặt.

*   **Chức năng:** Thống kê danh sách bệnh nhân theo từng ngày, biết được ai đã đến (Checked-in) và ai chưa đến.
*   **Xuất dữ liệu:** Hỗ trợ xuất danh sách ra file Excel để phục vụ báo cáo cuối ngày.

> **[Hình ảnh mô tả: Màn hình báo cáo tiếp nhận và nút xuất Excel]**

---

### 2.4. Đặt lịch thủ công cho nhân viên (Staff Booking)
Dành cho nhân viên trực tổng đài hỗ trợ đặt lịch qua điện thoại.

*   **Cách thực hiện:**
    1. Nhập SĐT hoặc Số CCCD của bệnh nhân vào ô tìm kiếm.
    2. Nếu là bệnh nhân cũ: Hệ thống tự điền thông tin hành chính từ HIS.
    3. Nếu là bệnh nhân mới: Nhập mới thông tin (Họ tên, ngày sinh, địa chỉ...).
    4. Chọn Chuyên khoa và Khung giờ.
    5. Nhấn **Lưu đăng ký**.

> **[Hình ảnh mô tả: Form nhập liệu đặt lịch dành cho nhân viên với chức năng tìm kiếm bệnh nhân cũ]**

---

### 2.5. Biểu đồ Thống kê (Dashboard & Analytics)
Theo dõi hiệu quả của module đặt lịch trực tuyến.

*   **Các chỉ số chính:**
    *   Tổng số lịch hẹn trong tuần/tháng.
    *   Tỷ lệ bệnh nhân đến khám thực tế (Arrival rate).
    *   Biểu đồ xu hướng đặt lịch theo ngày.
    *   Thống kê nguồn đặt lịch (Web, Mobile, Kiosk).

> **[Hình ảnh mô tả: Màn hình Dashboard với các biểu đồ cột và hình tròn]**

---

## 3. Các lưu ý quan trọng khi sử dụng
1.  **Trạng thái Slot giờ:** Nếu một khung giờ bị mờ hoặc không chọn được, nghĩa là slot đó đã đủ số lượng đăng ký tối đa.
2.  **Duyệt lịch:** Luôn ưu tiên duyệt lịch sớm để bệnh nhân nhận được tin nhắn SMS xác nhận.
3.  **Hủy lịch:** Khi bệnh nhân gọi điện báo hủy, nhân viên cần tìm lại lịch trong hệ thống và nhấn "Từ chối/Hủy" để giải phóng slot giờ cho người khác.
4.  **Thông tin CCCD:** Khuyến khích nhập đầy đủ số CCCD để hệ thống tự động liên kết hồ sơ y tế điện tử chính xác nhất.

---
**Bộ phận hỗ trợ kỹ thuật vClinic**
