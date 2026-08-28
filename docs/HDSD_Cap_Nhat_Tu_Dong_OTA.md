# HƯỚNG DẪN VẬN HÀNH HỆ THỐNG CẬP NHẬT TỰ ĐỘNG OTA (VIMES HIS)

---

## I. TỔNG QUAN KIẾN TRÚC

Hệ thống cập nhật VIMES HIS hoạt động theo mô hình **Over-The-Air (OTA Update)**:
- **Máy chủ công ty (Central Update Server)**: Lưu trữ file mô tả phiên bản (`version.json`) và gói cài đặt (`vimes-his-vX.Y.Z.tar.gz`).
- **Máy chủ khách hàng (Ubuntu / CentOS)**: Tự động kiểm tra và nhận diện khi có phiên bản mới từ máy chủ công ty (`https://updates.vimes.vn/version.json`).
- Quản trị viên tại đơn vị chỉ cần bấm nút **"Cập nhật ngay"** trên giao diện Web, toàn bộ quy trình tải gói, sao lưu dữ liệu cũ (backup), giải nén ghi đè, tự động chạy Database Migration (`npm run migrate`) và khởi động lại dịch vụ (PM2 / Systemd) sẽ diễn ra **hoàn toàn tự động trong 5 - 10 giây**.

---

## II. QUY TRÌNH PHÁT HÀNH PHIÊN BẢN MỚI (DÀNH CHO LẬP TRÌNH VIÊN)

Mỗi khi bạn sửa xong code hoặc thêm tính năng mới trên máy phát triển:

### Bước 1: Cập nhật số phiên bản
Mở file `package.json` ở thư mục gốc hoặc `backend/package.json`, tăng số phiên bản lên:
```json
{
  "name": "clinic-management-system",
  "version": "1.0.1"
}
```

### Bước 2: Đóng gói 1-Click (Automated Build & Package)
Trên máy tính phát triển (Windows):
- Click đúp chuột vào file **`build-release.bat`** (ở thư mục gốc của dự án).
- Hoặc chạy lệnh trong terminal:
  ```bash
  node scripts/build-release.cjs
  ```

**Kết quả thu được trong thư mục `releases/`:**
1. File **`vimes-his-v1.0.1.tar.gz`**: Gói mã nguồn đã build sẵn (`dist/`, `backend/dist/`, `backend/migrations/`, `package.json`) dung lượng siêu nhẹ (~4.9 MB).
2. File **`version.json`**: File mô tả phiên bản có chứa mã băm bảo mật SHA-256:
   ```json
   {
     "version": "1.0.1",
     "buildDate": "2026-08-28T20:45:00.000Z",
     "changelog": [
       "Khắc phục giữ nguyên Tab khám khi Bác sĩ duyệt/mở khám",
       "Chuẩn hóa số điện thoại tiếp đón vào hms_doc",
       "Tối ưu hóa hiệu năng hệ thống"
     ],
     "downloadUrl": "https://updates.vimes.vn/releases/vimes-his-v1.0.1.tar.gz",
     "sha256": "a1b2c3d4e5...",
     "requiredDbMigration": true
   }
   ```

### Bước 3: Đưa lên Máy chủ phát hành của Công ty (Central Release Server)
Upload 2 file vừa sinh ra lên web server công ty (Nginx / S3 / MinIO / GitHub Releases):
- Đặt file `vimes-his-v1.0.1.tar.gz` vào thư mục `releases/`.
- Đặt file `version.json` vào thư mục gốc web của Update Server.

---

## III. QUY TRÌNH CẬP NHẬT TẠI MÁY CHỦ KHÁCH HÀNG (UBUNTU / CENTOS)

### Cách 1: Cập nhật Trực tiếp 1-Click trên Giao diện Web (Khuyên dùng)
1. Mở trình duyệt truy cập vào phần mềm **VIMES HIS**.
2. Trên thanh Header góc trên bên phải, nhấn vào nút **`Cập nhật`** (hoặc mở Menu Tài khoản -> chọn **`Cập nhật hệ thống (OTA)`**).
3. Màn hình **Trung tâm Cập nhật Hệ thống** xuất hiện:
   - Hệ thống tự động kiểm tra và thông báo: *"Đã có bản cập nhật mới: v1.0.1"*.
   - Đọc danh sách các thay đổi (Changelog).
   - Nhấn nút **`Cập nhật ngay lên v1.0.1`**.
4. Màn hình hiển thị nhật ký tiến trình (Realtime Log):
   - `[1/5] Đang tải gói cập nhật từ máy chủ...`
   - `[2/5] Đang tạo bản sao lưu dự phòng vào thư mục backups/...`
   - `[3/5] Giải nén mã nguồn mới...`
   - `[4/5] Đồng bộ Database Migrations...`
   - `[5/5] Khởi động lại dịch vụ...`
5. Sau 5 giây đếm ngược, trang web tự động F5 tải lại với phiên bản mới nhất!

---

### Cách 2: Chạy trực tiếp bằng lệnh Terminal trên Linux (Dành cho IT Quản trị Server)
Nếu quản trị viên đang SSH vào máy chủ Ubuntu / CentOS:
```bash
cd /opt/vimes-his
# Kích hoạt cập nhật tự động từ URL
./scripts/update.sh https://updates.vimes.vn/releases/vimes-his-v1.0.1.tar.gz
```

---

## IV. CƠ CHẾ AN TOÀN & SAO LƯU DỰ PHÒNG (BACKUP & ROLLBACK)

1. **Sao lưu tự động trước mọi lần cập nhật**:
   - Trước khi ghi đè bất kỳ file nào, hệ thống tự động copy toàn bộ `dist/`, `backend/dist/`, `backend/migrations/` vào thư mục:
     `backups/backup_YYYYMMDD_HHMMSS/`
2. **Khôi phục bản cũ (Rollback)**:
   - Nếu bản cập nhật gặp sự cố, chỉ cần copy ngược từ thư mục `backups/backup_YYYYMMDD_HHMMSS/` về lại thư mục gốc và chạy `pm2 reload all`.
3. **Bảo toàn cơ sở dữ liệu**:
   - Toàn bộ script migration trong `backend/migrations/` đều được viết theo nguyên tắc **Idempotent** (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`), đảm bảo không bao giờ làm mất dữ liệu hiện có của khách hàng.
