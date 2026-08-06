# 🚀 Hướng Dẫn Deploy Nhanh vClinic

## 📦 Bước 1: Đóng gói tự động

Chạy lệnh sau trong thư mục `d:\AI\vClinic`:

```bash
npm run deploy
```

Script này sẽ tự động:
- ✅ Build frontend (tạo thư mục `dist/`)
- ✅ Đóng gói backend
- ✅ Đóng gói frontend đã build
- ✅ Tạo file cấu hình mẫu
- ✅ Tạo hướng dẫn deploy chi tiết
- ✅ Tạo script khởi động tự động

**Kết quả:** Thư mục `release/vClinic-deploy/` chứa toàn bộ package sẵn sàng deploy

---

## 📤 Bước 2: Upload lên Server

### Cách 1: Sử dụng WinSCP / FileZilla (Windows)
1. Kết nối đến server qua SFTP
2. Upload toàn bộ thư mục `release/vClinic-deploy/` lên server
3. Đặt ở vị trí như `/home/user/vClinic/` hoặc `/var/www/vClinic/`

### Cách 2: Sử dụng SCP (Command line)
```bash
scp -r release/vClinic-deploy/ user@your-server:/path/to/deploy/
```

### Cách 3: Sử dụng Git
```bash
# Commit và push
git add release/vClinic-deploy/
git commit -m "Deploy package"
git push

# Trên server
git pull
```

---

## ⚙️ Bước 3: Cấu hình trên Server

### 3.1. SSH vào server
```bash
ssh user@your-server
```

### 3.2. Di chuyển vào thư mục deploy
```bash
cd /path/to/vClinic-deploy
```

### 3.3. Cấu hình Backend
```bash
cd backend
cp .env.example .env
nano .env  # Hoặc vi .env
```

**Cập nhật các thông tin sau trong file `.env`:**
```env
PORT=8000
DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
VIMES_SECURITY_KEY=your_32_character_key_here
JWT_SECRET=your_jwt_secret_here
```

### 3.4. Cài đặt dependencies
```bash
npm install --production
```

---

## 🚀 Bước 4: Khởi động

### Cách 1: Sử dụng script tự động (Khuyến nghị)

**Linux/Mac:**
```bash
cd /path/to/vClinic-deploy
chmod +x start.sh
./start.sh
```

**Windows Server:**
```cmd
cd C:\path\to\vClinic-deploy
start.bat
```

### Cách 2: Khởi động thủ công với PM2
```bash
cd backend
pm2 start src/server.js --name vclinic-backend
pm2 save
pm2 startup
```

### Cách 3: Chạy trực tiếp (Development)
```bash
cd backend
npm start
```

---

## ✅ Bước 5: Kiểm tra

### Kiểm tra Backend API
```bash
curl http://localhost:8000/api/health
```

**Kết quả mong đợi:**
```json
{"status":"OK","message":"vClinic Backend API","version":"1.0.0"}
```

### Kiểm tra Frontend
Mở trình duyệt và truy cập:
```
http://your-server-ip:8000
```

**Lưu ý:** Backend sẽ tự động serve frontend từ thư mục `dist/`

---

## 🔄 Cập nhật khi có phiên bản mới

### Trên máy local:
```bash
# 1. Build lại
npm run deploy

# 2. Upload lên server (giữ nguyên file .env)
```

### Trên server:
```bash
# 1. Dừng backend
pm2 stop vclinic-backend

# 2. Backup (khuyến nghị)
cp -r vClinic-deploy vClinic-deploy.backup-$(date +%Y%m%d)

# 3. Upload phiên bản mới (đè lên cũ, KHÔNG đè .env)

# 4. Cài đặt dependencies mới
cd vClinic-deploy/backend
npm install --production

# 5. Khởi động lại
pm2 restart vclinic-backend
```

---

## 🐛 Xử lý lỗi thường gặp

### ❌ Lỗi: "Frontend not built"

**Nguyên nhân:** Thư mục `dist/` không tồn tại hoặc không đúng vị trí

**Giải pháp:**
```bash
# Kiểm tra cấu trúc
ls -la vClinic-deploy/

# Phải có:
# - backend/
# - dist/
# - start.sh
# - README.md
```

Nếu thiếu `dist/`:
1. Chạy lại `npm run deploy` trên local
2. Upload lại toàn bộ package

### ❌ Lỗi: Database connection failed

**Giải pháp:**
```bash
# 1. Kiểm tra PostgreSQL
sudo systemctl status postgresql

# 2. Test kết nối
psql -U your_db_user -d your_db_name -h localhost

# 3. Kiểm tra file .env
cat backend/.env
```

### ❌ Lỗi: Port 8000 already in use

**Giải pháp:**
```bash
# Tìm process đang dùng port
lsof -i :8000

# Hoặc kill process
kill -9 $(lsof -t -i:8000)

# Hoặc đổi PORT trong .env
```

---

## 📊 Quản lý với PM2

### Xem logs
```bash
pm2 logs vclinic-backend
pm2 logs vclinic-backend --lines 100
```

### Giám sát
```bash
pm2 monit
pm2 status
```

### Khởi động lại
```bash
pm2 restart vclinic-backend
```

### Dừng
```bash
pm2 stop vclinic-backend
```

### Xóa
```bash
pm2 delete vclinic-backend
```

---

## 📁 Cấu trúc Package Deploy

```
vClinic-deploy/
├── backend/              # Backend API
│   ├── src/             # Source code
│   │   ├── server.js    # Main server file
│   │   ├── controllers/
│   │   ├── services/
│   │   └── routes/
│   ├── sql/             # Database scripts
│   ├── package.json
│   └── .env.example     # Cấu hình mẫu
├── dist/                # Frontend đã build
│   ├── index.html
│   └── assets/
├── start.sh             # Script khởi động (Linux/Mac)
├── start.bat            # Script khởi động (Windows)
├── README.md            # Hướng dẫn nhanh
└── DEPLOY_INSTRUCTIONS.md  # Hướng dẫn chi tiết
```

---

## 🎯 Checklist Deploy

- [ ] Đã chạy `npm run deploy` thành công
- [ ] Đã upload toàn bộ thư mục `vClinic-deploy/` lên server
- [ ] Đã cấu hình file `.env` với thông tin database đúng
- [ ] Đã cài đặt `npm install --production`
- [ ] Đã import database scripts (nếu cần)
- [ ] Đã khởi động backend với PM2 hoặc npm start
- [ ] Đã test API endpoint `/api/health`
- [ ] Đã test frontend trên trình duyệt
- [ ] Đã cấu hình firewall mở port 8000 (nếu cần)

---

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra logs: `pm2 logs vclinic-backend`
2. Kiểm tra file `.env` đã cấu hình đúng
3. Kiểm tra database đã import đầy đủ
4. Kiểm tra firewall đã mở port
5. Xem file `DEPLOY_INSTRUCTIONS.md` để biết thêm chi tiết

---

**Chúc bạn deploy thành công! 🎉**
