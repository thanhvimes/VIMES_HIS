# HƯỚNG DẪN TRIỂN KHAI VÀ CÀI ĐẶT DỰ ÁN VIMES HIS
*(Dành cho Nhân viên Kỹ thuật triển khai cho Khách hàng)*

Tài liệu này hướng dẫn chi tiết quy trình lấy mã nguồn từ GitHub, cấu hình môi trường, chạy tự động Migration CSDL và thiết lập hệ thống **VIMES HIS** (Bao gồm phân hệ Khám sức khỏe VNeID QĐ 1551).

---

## 1. Yêu cầu Tiền đề (Prerequisites)

Kỹ thuật viên cần chuẩn bị máy chủ / máy trạm triển khai có cài đặt sẵn:
- **Node.js**: Phiên bản `>= 18.0.0` (Khuyên dùng Node LTS v20.x).
- **PostgreSQL Database Server**: Phiên bản `>= 12.0` (Khuyên dùng PostgreSQL 14/15).
- **Git Client**: Để kéo mã nguồn từ GitHub.
- Cơ sở dữ liệu trống hoặc CSDL VIMES HIS hiện hữu (tên ví dụ: `vimes_his` hoặc `vimes_nb`).

---

## 2. Bước 1: Kéo Mã nguồn từ GitHub (Git Clone)

Mở **Terminal / Command Prompt / PowerShell** trên máy triển khai:

```bash
git clone https://github.com/vimes-his/vimes-his-app.git
cd VIMES_HIS
```

---

## 3. Bước 2: Cấu hình Môi trường (Environment Setup)

### 3.1. Cấu hình Backend Server

Chuyển vào thư mục `backend`, sao chép file `.env.example` thành `.env`:

```bash
cd backend
cp .env.example .env
```

Mở file `backend/.env` bằng trình biên soạn text (Notepad, VS Code...) và chỉnh sửa các thông số kết nối CSDL thực tế của khách hàng:

```ini
# Môi trường chạy
NODE_ENV=production
PORT=3001

# Thông số kết nối PostgreSQL
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=vimes_his            # Tên CSDL trên PostgreSQL
DB_USER=postgres             # Username đăng nhập DB
DB_PASSWORD=your_password    # Mật khẩu DB thực tế

# Khóa bảo mật ngẫu nhiên (Tối thiểu 32 ký tự)
JWT_SECRET=VIMES_HIS_JWT_SECRET_KEY_CHANGE_THIS_STRING_32
VIMES_SECURITY_KEY=VIMES_HIS_SECURITY_KEY_CHANGE_THIS_STRING_32
```

---

## 4. Bước 3: Cài đặt Thư viện Dependencies

### Cài đặt thư viện Frontend và Backend:

1. **Cài đặt Backend**:
   ```bash
   cd d:\AI\VIMES_HIS\backend
   npm install
   ```

2. **Cài đặt Frontend**:
   ```bash
   cd d:\AI\VIMES_HIS
   npm install
   ```

---

## 5. Bước 4: Chạy Server Backend & Nâng cấp CSDL Tự động (Migration)

Hệ thống VIMES HIS đã được tích hợp **MigrationRunner tự động**. Khi chạy server backend, hệ thống sẽ tự động quét và áp dụng tất cả các script SQL nâng cấp CSDL trong thư mục `backend/migrations/` (Bao gồm 46+ script tạo bảng KSK, bổ sung cột VNeID, sửa lỗi trùng khớp số tiếp nhận HMS...).

Chạy câu lệnh sau để khởi tạo Backend:

```bash
cd d:\AI\VIMES_HIS\backend
npm start
```

*Màn hình Console thông báo thành công:*
```text
==================================================
🚀 Starting VIMES Backend initialization...
📊 Database: vimes_his
==================================================
🔄 Đang kiểm tra Database Migrations...
✅ TS Database: Connected successfully
✅ Database đã được cập nhật bản mới nhất. (No new migrations to apply)
✅ Migrations applied successfully
📊 Server started successfully
🌐 HTTP Server is now listening on port 3001
```

---

## 6. Bước 5: Build và Chạy Frontend

Mở một cửa sổ Terminal mới để build bản sản xuất Frontend:

```bash
cd d:\AI\VIMES_HIS
npm run build
```

Nội dung sau khi build sẽ tạo ra thư mục `/dist`. Server Backend sẽ tự động phục vụ file giao diện Frontend trên giao diện web.

---

## 7. Bước 6: Cấu hình Ban đầu cho Phân hệ Khám sức khỏe VNeID

1. Mở trình duyệt web truy cập: `http://localhost:3001` (Hoặc IP của máy chủ).
2. Đăng nhập bằng tài khoản Quản trị:
   - **Tài khoản**: `admin`
   - **Mật khẩu**: `1` (Sau đó tiến hành đổi mật khẩu mới trong phần Quản lý người dùng).
3. Vào menu **Đồng bộ KSK VNeID** -> Chọn mục **Cấu hình**:
   - **Mã Cơ sở KCB (BYT)**: Nhập Mã CSKCB của phòng khám/bệnh viện (Ví dụ: `8934285014297`).
   - **URL Cổng tiếp nhận**:
     - *Sandbox (Kiểm thử)*: `https://api-sandbox.emrhub.vn`
     - *Production (Chính thức)*: `https://api.emrhub.vn`
   - **Tài khoản Cổng**: Nhập Username được cấp (Ví dụ: `8934285014297_api`).
   - **Khóa tư nhân (Private Key RSA)**: Dán chuỗi Private Key RSA được cấp (Hệ thống chấp nhận cả chuỗi Base64 thuần hoặc chuỗi có tiêu đề `-----BEGIN PRIVATE KEY-----`).
4. Bấm **[Lưu cấu hình]**.

---

## 8. Bước 7: Kiểm tra & Nghiệm thu (Verification Checklist)

Sau khi cài đặt xong, Kỹ thuật viên tiến hành kiểm tra danh mục theo quy trình:

| STT | Tác vụ | Mong đợi | Đạt/Không đạt |
|---|---|---|---|
| 1 | Đăng nhập tài khoản `admin` | Vào màn hình tổng quan thành công | [ ] |
| 2 | Khởi tạo 01 hồ sơ KSK thử nghiệm | Chọn loại Mẫu (Mẫu 1: Trẻ em, Mẫu 2: Vị thành niên, Mẫu 3: Người lớn) | [ ] |
| 3 | Bấm **[Tạo XML]** | Hệ thống tự tạo mã XML chuẩn QĐ 1551 có đúng thẻ `<TYPE>` | [ ] |
| 4 | Bấm **[Gửi Cổng VNeID]** | Trạng thái báo `PS_SYNC_SUCCESS` và ghi nhận `transaction_id` | [ ] |

---

## 9. Xử lý Sự cố Thường gặp (Troubleshooting)

1. **Lỗi Kết nối Cơ sở dữ liệu (`ECONNREFUSED` / Password authentication failed)**:
   - Kiểm tra lại IP `DB_HOST`, Port `5432`, Username/Password trong file `backend/.env`.
   - Đảm bảo PostgreSQL đã bật kết nối từ xa (`pg_hba.conf` cho phép `0.0.0.0/0`).

2. **Lỗi CORS (`CORS origin denied`)**:
   - Bổ sung URL/IP của client vào dòng `CORS_ORIGINS` trong `backend/.env` (Ví dụ: `CORS_ORIGINS=http://192.168.1.10:5173,http://localhost:3001`).

3. **Lỗi chữ ký Cổng VNeID (`PS_SIGNATURE_INVALID`)**:
   - Kiểm tra lại Private Key dán trong màn hình Cấu hình. Đảm bảo Private Key khớp với Public Key đã đăng ký trên cổng EMRHub/VNeID.
