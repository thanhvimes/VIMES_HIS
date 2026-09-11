# HƯỚNG DẪN CẤU HÌNH VÀ VẬN HÀNH ĐỒNG BỘ ĐA CỔNG (BỘ Y TẾ & SỞ Y TẾ HÀ NỘI)

Tài liệu hướng dẫn thiết lập và vận hành phân hệ liên thông Khám sức khỏe (KSK) trên hệ thống VIMES HIS, hỗ trợ gửi đồng thời hoặc độc lập lên Cổng tiếp nhận Bộ Y tế (VNeID) và Cổng Hồ sơ sức khỏe điện tử Sở Y tế Hà Nội (theo **Công văn 7286/SYT-QLBHYTCNTT**).

---

## 1. TỔNG QUAN VÀ NGUYÊN TẮC THIẾT KẾ

### 1.1. Bối cảnh
- Các cơ sở khám chữa bệnh (CSKCB) trên toàn quốc thực hiện liên thông dữ liệu KSK theo chuẩn **Quyết định 1551/QĐ-BYT** và **Quyết định 2062/QĐ-BYT** lên Cổng tiếp nhận dữ liệu Bộ Y tế phục vụ hiển thị trên ứng dụng VNeID.
- Tại Hà Nội, Sở Y tế ban hành **Công văn số 7286/SYT-QLBHYTCNTT ngày 22/07/2026** yêu cầu các CSKCB liên thông dữ liệu KSK lên Hệ thống Hồ sơ sức khỏe điện tử TP Hà Nội (HSSKĐT).
- **Phân tích chuẩn dữ liệu**: Cổng Sở Y tế Hà Nội tiếp nhận dữ liệu định dạng XML tuân thủ **100% cấu trúc QĐ 2062/QĐ-BYT** kèm chữ ký số RSA-SHA256 bọc JSON, chỉ khác Gateway URL, tài khoản đăng nhập và tham số header `receiver_id = "VTS"`.

### 1.2. Nguyên tắc "Zero-Disruption" (Bảo toàn 100% luồng chạy hiện tại)
- Hệ thống sử dụng chung 1 ứng dụng đồng bộ (`health-check-sync`), **không cần tách thành 2 app riêng biệt**.
- Mặc định toàn hệ thống giữ nguyên chế độ `BYT_ONLY` (Chỉ gửi Cổng Bộ Y tế).
- Các đơn vị đang hoạt động hoàn toàn không bị ảnh hưởng hành vi cũ nếu không chủ động chuyển chế độ sang `BOTH` hoặc `SYT_ONLY`.

---

## 2. BA CHẾ ĐỘ GỬI LIÊN THÔNG (`sync_target_mode`)

Quản trị viên có thể cấu hình chế độ gửi tại giao diện **Cấu hình thiết lập -> Cấu hình chung**:

| Chế độ | Mã thiết lập | Mô tả chi tiết | Đối tượng áp dụng |
| :--- | :--- | :--- | :--- |
| **Chỉ Cổng Bộ Y tế** | `BYT_ONLY` *(Mặc định)* | Chỉ gửi hồ sơ KSK lên Cổng tiếp nhận Bộ Y tế / VNeID. Giữ nguyên 100% luồng nghiệp vụ hiện tại. | Các CSKCB ngoài Hà Nội hoặc cơ sở chưa thuộc diện gửi Cổng Sở Y tế Hà Nội. |
| **Gửi đồng thời CẢ HAI CỔNG** | `BOTH` | Hệ thống tự động gửi song song lên cả Cổng Bộ Y tế và Cổng Sở Y tế Hà Nội. Kiểm tra và quản lý trạng thái độc lập từng cổng. Nếu 1 cổng thành công và 1 cổng lỗi, khi bấm gửi lại hệ thống chỉ gửi tiếp cho cổng bị lỗi, không gửi lặp. | Các CSKCB trên địa bàn TP Hà Nội theo chỉ đạo tại CV 7286/SYT. |
| **Chỉ Cổng Sở Y tế** | `SYT_ONLY` | Chỉ gửi hồ sơ lên Cổng HSSKĐT Sở Y tế Hà Nội (`api-hssk.hanoi.gov.vn`). Không gửi lên Cổng Bộ Y tế. | Đơn vị KSK trực thuộc địa phương hoặc yêu cầu đặc thù. |

---

## 3. THÔNG SỐ CẤU HÌNH CỔNG SỞ Y TẾ HÀ NỘI

Khi chọn chế độ `BOTH` hoặc `SYT_ONLY`, biểu mẫu thông tin Cổng Sở Y tế sẽ hiển thị:

1. **URL Cổng Sở Y tế Hà Nội**:
   - URL chính thức: `https://api-hssk.hanoi.gov.vn`
   - Endpoint đăng nhập: `/api/v1/resource/authentication/login`
   - Endpoint gửi hồ sơ KSK: `/api/v1/medical-record/ksk-lien-thong/kham-suc-khoe`
2. **Tài khoản đăng nhập Cổng SYT**: Tài khoản do Sở Y tế Hà Nội / Viettel cấp cho đơn vị.
3. **Mật khẩu Cổng SYT**: Mật khẩu tương ứng (hệ thống mã hóa AES bảo mật tự động trong CSDL).
4. **Mã định danh nhận (`receiver_id`)**: Mặc định là `VTS` (theo mục 3.2 phụ lục CV 7286).
5. **Nút "Kiểm tra kết nối Cổng Sở Y tế"**: Cho phép ping trực tiếp tài khoản xác thực lên cổng SYT để xác nhận thông tuyến trước khi lưu.

---

## 4. QUẢN LÝ TRẠNG THÁI VÀ THEO DÕI HỒ SƠ

### 4.1. Cấu trúc dữ liệu trong CSDL
Bảng `health_check_masters` lưu trữ độc lập trạng thái của hai cổng:
- **Nhánh Bộ Y tế**:
  - `send_status`: `Unsent` | `Pending` | `Success` | `Error`
  - `sent_at`: Thời điểm gửi thành công lên BYT
  - `transaction_id`: Mã giao dịch cổng BYT
  - `error_message`: Thông báo lỗi BYT (nếu có)
  - `response_log`: Chi tiết raw response từ BYT
- **Nhánh Sở Y tế Hà Nội**:
  - `syt_send_status`: `Unsent` | `Pending` | `Success` | `Error`
  - `syt_sent_at`: Thời điểm gửi thành công lên SYT
  - `syt_transaction_id`: Mã giao dịch trả về từ SYT (`maGiaoDich` dùng để tra cứu trên trang `https://hssk.hanoi.gov.vn`)
  - `syt_error_message`: Thông báo lỗi SYT (nếu có)
  - `syt_response_log`: Chi tiết raw response từ SYT

### 4.2. Giao diện Danh sách Hồ sơ (`DocumentList`)
- Khi cơ sở ở chế độ `BOTH`: Cột **Trạng thái liên thông** hiển thị 2 dòng trực quan:
  - `BYT: [Thành công / Thất bại / Chờ gửi]`
  - `SYT: [Thành công / Thất bại / Chờ gửi]`
- Cột **Chi tiết giao dịch** hiển thị mã giao dịch tương ứng của cả hai cổng, kèm nút xem chi tiết log khi có lỗi.
- Khi ở chế độ `BYT_ONLY` (mặc định): Giao diện giữ nguyên hiển thị đơn lẻ gọn gàng như trước đây.

---

## 5. CƠ CHẾ GỬI LẠI THÔNG MINH (SMART RETRY)

- Khi bấm gửi hồ sơ đơn lẻ hoặc gửi hàng loạt trong chế độ `BOTH`:
  - Nếu hồ sơ đã có `send_status = 'Success'` (BYT đã nhận) nhưng `syt_send_status = 'Error'` hoặc `'Unsent'`, hệ thống **chỉ gửi lên Cổng Sở Y tế**, tuyệt đối không gửi trùng lặp lên Cổng Bộ Y tế.
  - Ngược lại, nếu SYT đã thành công mà BYT thất bại, hệ thống chỉ đẩy bù lên BYT.
- Background Worker tự động đồng bộ theo lịch (`auto_sync_interval`) cũng tuân thủ 100% nguyên tắc kiểm tra này.
