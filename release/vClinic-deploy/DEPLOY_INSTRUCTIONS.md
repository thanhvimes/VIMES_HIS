# 🚀 HƯỚNG DẪN TRIỂN KHAI vClinic

## 📋 Tổng quan
Package này chứa toàn bộ hệ thống vClinic đã được build và sẵn sàng deploy lên server.

### Cấu trúc thư mục:
```
vClinic-deploy/
├── backend/          # Backend API server
│   ├── src/         # Source code
│   ├── sql/         # Database scripts
│   ├── package.json
│   └── .env.example # Cấu hình mẫu
└── dist/            # Frontend đã build (static files)
    ├── index.html
    └── assets/
```

---

## 🔧 BƯỚC 1: Chuẩn bị Server

### Yêu cầu hệ thống:
- ✅ Node.js >= 18.x
- ✅ PostgreSQL >= 13.x
- ✅ PM2 (khuyến nghị cho production)

### Cài đặt PM2 (nếu chưa có):
```bash
npm install -g pm2
```

---

## 📤 BƯỚC 2: Upload lên Server

### Cách 1: Sử dụng SCP/SFTP
```bash
# Upload toàn bộ thư mục vClinic-deploy
scp -r vClinic-deploy/ user@your-server:/path/to/deploy/
```

### Cách 2: Sử dụng Git
```bash
# Nếu bạn đã commit vào Git
git pull origin main
```

---

## ⚙️ BƯỚC 3: Cấu hình Backend

### 3.1. Di chuyển vào thư mục backend
```bash
cd vClinic-deploy/backend
```

### 3.2. Cài đặt dependencies
```bash
npm install --production
```

### 3.3. Cấu hình môi trường
```bash
# Copy file .env.example thành .env
cp .env.example .env

# Chỉnh sửa file .env với thông tin thực tế
nano .env  # hoặc vi .env
```

**Lưu ý quan trọng:**
- Cập nhật thông tin database (đã mã hóa nếu dùng encryption)
- Đặt `VIMES_SECURITY_KEY` (32 ký tự)
- Đặt `JWT_SECRET` mạnh
- Kiểm tra `PORT` (mặc định 8000)

### 3.4. Cấu hình Database
```bash
# Chạy các script SQL trong thư mục sql/
psql -U your_db_user -d your_db_name -f sql/booking_online_database.sql
```

---

## 🚀 BƯỚC 4: Khởi động Backend

### Cách 1: Sử dụng PM2 (Khuyến nghị)
```bash
# Khởi động với PM2
pm2 start src/server.js --name vclinic-backend

# Lưu cấu hình để tự động khởi động khi reboot
pm2 save
pm2 startup

# Xem logs
pm2 logs vclinic-backend

# Các lệnh quản lý khác
pm2 restart vclinic-backend
pm2 stop vclinic-backend
pm2 delete vclinic-backend
```

### Cách 2: Chạy trực tiếp (Development)
```bash
npm start
```

---

## 🌐 BƯỚC 5: Kiểm tra Deployment

### 5.1. Kiểm tra Backend
```bash
# Test API health endpoint
curl http://localhost:8000/api/health

# Kết quả mong đợi:
# {"status":"OK","message":"vClinic Backend API","version":"1.0.0"}
```

### 5.2. Kiểm tra Frontend
Mở trình duyệt và truy cập:
```
http://your-server-ip:8000
```

**Lưu ý:** Backend sẽ tự động serve frontend từ thư mục `dist/`

---

## 🔒 BƯỚC 6: Cấu hình Firewall (Tùy chọn)

### Mở port cho backend:
```bash
# Ubuntu/Debian
sudo ufw allow 8000/tcp

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --reload
```

---

## 🔄 CẬP NHẬT HỆ THỐNG

Khi có phiên bản mới:

```bash
# 1. Dừng backend
pm2 stop vclinic-backend

# 2. Backup (khuyến nghị)
cp -r vClinic-deploy vClinic-deploy.backup

# 3. Upload phiên bản mới
# (giữ nguyên file .env)

# 4. Cài đặt dependencies mới (nếu có)
cd vClinic-deploy/backend
npm install --production

# 5. Khởi động lại
pm2 restart vclinic-backend
```

---

## 🐛 XỬ LÝ SỰ CỐ

### Lỗi: "Frontend not built"
**Nguyên nhân:** Thư mục `dist/` không tồn tại hoặc không đúng vị trí

**Giải pháp:**
```bash
# Kiểm tra cấu trúc thư mục
ls -la vClinic-deploy/

# Đảm bảo có thư mục dist/ cùng cấp với backend/
# Nếu thiếu, build lại trên local và upload
```

### Lỗi: Database connection failed
**Giải pháp:**
```bash
# 1. Kiểm tra PostgreSQL đang chạy
sudo systemctl status postgresql

# 2. Kiểm tra thông tin kết nối trong .env
# 3. Test kết nối database
psql -U your_db_user -d your_db_name -h localhost
```

### Lỗi: Port already in use
**Giải pháp:**
```bash
# Tìm process đang dùng port 8000
lsof -i :8000

# Hoặc thay đổi PORT trong file .env
```

---

## 📊 GIÁM SÁT HỆ THỐNG

### Xem logs với PM2:
```bash
# Xem logs realtime
pm2 logs vclinic-backend

# Xem logs cũ
pm2 logs vclinic-backend --lines 100

# Xóa logs cũ
pm2 flush
```

### Giám sát tài nguyên:
```bash
pm2 monit
```

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề, kiểm tra:
1. ✅ Logs của PM2: `pm2 logs`
2. ✅ File .env đã cấu hình đúng
3. ✅ Database đã import đầy đủ
4. ✅ Firewall đã mở port
5. ✅ Node.js version >= 18.x

---

**Chúc bạn deploy thành công! 🎉**
