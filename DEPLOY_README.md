# 📚 TÀI LIỆU DEPLOY vClinic

> **Tổng hợp tài liệu hướng dẫn deploy hệ thống vClinic lên server production**

---

## 📖 CÁC TÀI LIỆU HƯỚNG DẪN

### 1. 🚀 [QUICK_DEPLOY_GUIDE.md](./QUICK_DEPLOY_GUIDE.md)
**Hướng dẫn deploy nhanh - Tổng quan**

- ✅ Tổng quan quy trình deploy
- ✅ Các bước chính (tóm tắt)
- ✅ Xử lý lỗi thường gặp
- ✅ Quản lý với PM2

**Dành cho:** Người đã quen với deploy, cần tham khảo nhanh

---

### 2. 📘 [DEPLOY_STEP_BY_STEP.md](./DEPLOY_STEP_BY_STEP.md) ⭐ **KHUYẾN NGHỊ**
**Hướng dẫn chi tiết từng bước - Đầy đủ nhất**

- ✅ Hướng dẫn chi tiết từng bước
- ✅ Lệnh cụ thể cho từng bước
- ✅ Screenshot/Output mong đợi
- ✅ Xử lý sự cố chi tiết
- ✅ Cách sử dụng WinSCP/SCP
- ✅ Cấu hình database
- ✅ Quản lý và bảo trì

**Dành cho:** Người mới, cần hướng dẫn chi tiết từng bước

---

### 3. ✅ [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)
**Checklist đánh dấu từng bước**

- ✅ Checklist in ra để đánh dấu
- ✅ Các bước cần làm
- ✅ Thông tin cần ghi nhớ
- ✅ Lệnh thường dùng

**Dành cho:** In ra và đánh dấu khi deploy

---

### 4. 📦 [release/vClinic-deploy/DEPLOY_INSTRUCTIONS.md](./release/vClinic-deploy/DEPLOY_INSTRUCTIONS.md)
**Hướng dẫn trong package deploy**

- ✅ Hướng dẫn đi kèm package
- ✅ Cấu trúc package
- ✅ Quick start
- ✅ Troubleshooting

**Dành cho:** Người nhận package deploy

---

## 🎯 CHỌN TÀI LIỆU PHÙ HỢP

### Nếu bạn là người mới, chưa từng deploy:
👉 Đọc **[DEPLOY_STEP_BY_STEP.md](./DEPLOY_STEP_BY_STEP.md)**
- Hướng dẫn chi tiết nhất
- Giải thích từng bước
- Có ví dụ cụ thể

### Nếu bạn đã quen với deploy:
👉 Đọc **[QUICK_DEPLOY_GUIDE.md](./QUICK_DEPLOY_GUIDE.md)**
- Tóm tắt các bước
- Tham khảo nhanh
- Xử lý lỗi

### Nếu bạn muốn checklist để đánh dấu:
👉 In **[DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)**
- Đánh dấu từng bước
- Ghi chú thông tin
- Theo dõi tiến độ

---

## 🚀 QUY TRÌNH DEPLOY TỔNG QUAN

```
┌─────────────────────────────────────────────────────────────┐
│                    1. CHUẨN BỊ                              │
│  • Kiểm tra Node.js, npm                                    │
│  • Chuẩn bị thông tin server, database                      │
│  • Cài đặt công cụ upload (WinSCP/FileZilla)               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              2. ĐÓNG GÓI (Trên máy local)                   │
│                                                             │
│  $ cd d:\AI\vClinic                                         │
│  $ npm run deploy                                           │
│                                                             │
│  → Tạo thư mục: release/vClinic-deploy/                    │
│     ├── backend/                                            │
│     ├── dist/                                               │
│     ├── start.sh                                            │
│     └── DEPLOY_INSTRUCTIONS.md                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  3. UPLOAD LÊN SERVER                       │
│                                                             │
│  Cách 1: WinSCP (Windows)                                   │
│  • Kết nối SFTP đến server                                  │
│  • Kéo thả thư mục vClinic-deploy                          │
│                                                             │
│  Cách 2: SCP Command                                        │
│  $ scp -r vClinic-deploy/ user@server:/path/               │
│                                                             │
│  Cách 3: Git                                                │
│  $ git push → git pull trên server                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              4. CẤU HÌNH TRÊN SERVER                        │
│                                                             │
│  $ ssh user@server                                          │
│  $ cd vClinic-deploy/backend                                │
│  $ cp .env.example .env                                     │
│  $ nano .env  # Cập nhật DB_HOST, DB_NAME, etc.            │
│  $ npm install --production                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   5. KHỞI ĐỘNG                              │
│                                                             │
│  Cách 1: Script tự động                                     │
│  $ cd /path/to/vClinic-deploy                               │
│  $ chmod +x start.sh                                        │
│  $ ./start.sh                                               │
│                                                             │
│  Cách 2: PM2 thủ công                                       │
│  $ cd backend                                               │
│  $ pm2 start src/server.js --name vclinic-backend          │
│  $ pm2 save                                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   6. KIỂM TRA                               │
│                                                             │
│  $ pm2 status                                               │
│  $ pm2 logs vclinic-backend                                 │
│  $ curl http://localhost:8000/api/health                    │
│                                                             │
│  Trình duyệt: http://server-ip:8000                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    ✅ HOÀN THÀNH!
```

---

## 🛠️ LỆNH QUAN TRỌNG

### Đóng gói (Local)
```powershell
# Di chuyển vào thư mục project
cd d:\AI\vClinic

# Chạy lệnh đóng gói
npm run deploy

# Kiểm tra kết quả
cd release\vClinic-deploy
dir
```

### Upload (Local → Server)
```bash
# Sử dụng SCP
scp -r release/vClinic-deploy/ user@server-ip:/home/user/

# Hoặc dùng WinSCP (GUI)
```

### Cấu hình (Server)
```bash
# SSH vào server
ssh user@server-ip

# Di chuyển vào thư mục
cd vClinic-deploy/backend

# Tạo file .env
cp .env.example .env
nano .env

# Cài đặt dependencies
npm install --production
```

### Khởi động (Server)
```bash
# Cách 1: Script tự động
cd /path/to/vClinic-deploy
chmod +x start.sh
./start.sh

# Cách 2: PM2 thủ công
cd backend
pm2 start src/server.js --name vclinic-backend
pm2 save
pm2 startup
```

### Quản lý (Server)
```bash
# Xem status
pm2 status

# Xem logs
pm2 logs vclinic-backend

# Restart
pm2 restart vclinic-backend

# Stop
pm2 stop vclinic-backend

# Monitor
pm2 monit
```

---

## 🐛 XỬ LÝ LỖI NHANH

### Lỗi: "Frontend not built"
```bash
# Kiểm tra thư mục dist/
ls -la /path/to/vClinic-deploy/

# Phải có thư mục dist/ cùng cấp với backend/
# Nếu thiếu → Build lại trên local và upload lại
```

### Lỗi: Database connection failed
```bash
# Kiểm tra PostgreSQL
sudo systemctl status postgresql

# Kiểm tra file .env
cat backend/.env

# Test kết nối
psql -U db_user -d db_name -h localhost
```

### Lỗi: Port already in use
```bash
# Tìm process đang dùng port
sudo lsof -i :8000

# Kill process
sudo kill -9 <PID>
```

---

## 📁 CẤU TRÚC PACKAGE DEPLOY

```
vClinic-deploy/
├── backend/                    # Backend API
│   ├── src/
│   │   ├── server.js          # Main server file
│   │   ├── controllers/
│   │   ├── services/
│   │   └── routes/
│   ├── sql/                   # Database scripts
│   │   └── booking_online_database.sql
│   ├── package.json
│   └── .env.example           # Cấu hình mẫu
│
├── dist/                      # Frontend đã build
│   ├── index.html
│   └── assets/
│       ├── index-xxx.js
│       └── index-xxx.css
│
├── start.sh                   # Script khởi động (Linux/Mac)
├── start.bat                  # Script khởi động (Windows)
├── README.md                  # Hướng dẫn nhanh
└── DEPLOY_INSTRUCTIONS.md     # Hướng dẫn chi tiết
```

---

## ✅ CHECKLIST NHANH

### Trước khi deploy:
- [ ] Code đã commit và push
- [ ] Đã chạy `npm run deploy` thành công
- [ ] Thư mục `dist/` có đầy đủ files
- [ ] Đã chuẩn bị thông tin server và database

### Trên server:
- [ ] Node.js >= 18.x
- [ ] PM2 đã cài đặt
- [ ] PostgreSQL đang chạy
- [ ] File `.env` đã cấu hình
- [ ] Dependencies đã cài đặt
- [ ] Backend đang chạy (PM2 online)
- [ ] API `/api/health` trả về OK
- [ ] Frontend hiển thị đúng

---

## 🔄 CẬP NHẬT PHIÊN BẢN MỚI

### Local:
```powershell
npm run deploy
# Upload lên server (giữ nguyên .env)
```

### Server:
```bash
# Backup
cp -r vClinic-deploy vClinic-deploy.backup

# Stop
pm2 stop vclinic-backend

# Upload phiên bản mới

# Install
cd vClinic-deploy/backend
npm install --production

# Restart
pm2 restart vclinic-backend
```

---

## 📞 HỖ TRỢ

### Khi gặp vấn đề:

1. **Xem logs:**
   ```bash
   pm2 logs vclinic-backend --lines 100
   ```

2. **Kiểm tra cấu hình:**
   ```bash
   cat backend/.env
   pm2 status
   ```

3. **Tham khảo tài liệu:**
   - [DEPLOY_STEP_BY_STEP.md](./DEPLOY_STEP_BY_STEP.md) - Chi tiết từng bước
   - [QUICK_DEPLOY_GUIDE.md](./QUICK_DEPLOY_GUIDE.md) - Xử lý lỗi

4. **Test từng phần:**
   - Database: `psql -U user -d db`
   - API: `curl http://localhost:8000/api/health`
   - Frontend: `curl http://localhost:8000`

---

## 🎓 TÀI LIỆU KHÁC

### Tài liệu kỹ thuật:
- [BACKEND_INTEGRATION_GUIDE.md](./BACKEND_INTEGRATION_GUIDE.md) - Tích hợp backend
- [TECHNICAL_DOCS.md](./TECHNICAL_DOCS.md) - Tài liệu kỹ thuật
- [STRATEGY_GUIDE.md](./STRATEGY_GUIDE.md) - Chiến lược phát triển

### Tài liệu phát triển:
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Hướng dẫn đóng góp
- [GITHUB_GUIDE.md](./GITHUB_GUIDE.md) - Hướng dẫn Git
- [BUILD_ERROR_HELP.md](./BUILD_ERROR_HELP.md) - Xử lý lỗi build

---

## 📊 THỐNG KÊ

- **Thời gian đóng gói:** ~30 giây
- **Thời gian upload:** 2-5 phút (tùy mạng)
- **Thời gian cấu hình:** 5-10 phút
- **Tổng thời gian deploy:** ~15-20 phút

---

**Chúc bạn deploy thành công! 🚀**

*Cập nhật lần cuối: 2026-01-21*
