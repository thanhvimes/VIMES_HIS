# ✅ CHECKLIST DEPLOY vClinic

> **In file này ra và đánh dấu từng bước khi hoàn thành**

---

## 📋 PHẦN 1: CHUẨN BỊ (Trên máy local)

### Kiểm tra môi trường
- [ ] Node.js >= 18.x đã cài đặt
- [ ] npm đã cài đặt
- [ ] Git status clean (đã commit code)

### Chuẩn bị thông tin server
- [ ] IP/Domain server: `_______________________`
- [ ] SSH Username: `_______________________`
- [ ] SSH Password/Key: `_______________________`
- [ ] Thư mục deploy: `_______________________`

### Thông tin Database
- [ ] DB Host: `_______________________`
- [ ] DB Name: `_______________________`
- [ ] DB User: `_______________________`
- [ ] DB Password: `_______________________`

### Công cụ upload
- [ ] WinSCP đã cài đặt (Windows)
- [ ] Hoặc FileZilla đã cài đặt
- [ ] Hoặc có thể dùng SCP command

---

## 📦 PHẦN 2: ĐÓNG GÓI (Trên máy local)

### Chạy lệnh đóng gói
```powershell
cd d:\AI\vClinic
npm run deploy
```

- [ ] Lệnh chạy thành công (không có lỗi)
- [ ] Thư mục `release/vClinic-deploy/` đã được tạo
- [ ] Thư mục `dist/` có file `index.html`
- [ ] Thư mục `backend/` đã được copy

### Kiểm tra package
```powershell
cd release\vClinic-deploy
dir
```

Phải có:
- [ ] `backend/` folder
- [ ] `dist/` folder
- [ ] `start.sh` file
- [ ] `start.bat` file
- [ ] `README.md` file
- [ ] `DEPLOY_INSTRUCTIONS.md` file

---

## 📤 PHẦN 3: UPLOAD LÊN SERVER

### Kết nối WinSCP
- [ ] Mở WinSCP
- [ ] Điền thông tin kết nối (Host, Username, Password)
- [ ] Click "Login"
- [ ] Kết nối thành công

### Upload files
- [ ] Tạo thư mục trên server (nếu chưa có)
- [ ] Kéo thả thư mục `vClinic-deploy` lên server
- [ ] Đợi upload hoàn tất (100%)
- [ ] Kiểm tra files đã upload đầy đủ

---

## 🔧 PHẦN 4: CẤU HÌNH TRÊN SERVER

### SSH vào server
```bash
ssh username@server-ip
```
- [ ] SSH thành công
- [ ] Di chuyển vào thư mục: `cd vClinic-deploy`

### Cài đặt Node.js (nếu chưa có)
```bash
node --version
```
- [ ] Node.js >= 18.x
- [ ] Nếu chưa có → Cài đặt Node.js

### Cài đặt PM2
```bash
sudo npm install -g pm2
pm2 --version
```
- [ ] PM2 đã cài đặt thành công

### Cấu hình Backend
```bash
cd backend
cp .env.example .env
nano .env
```
- [ ] File `.env` đã tạo
- [ ] Đã cập nhật `DB_HOST`
- [ ] Đã cập nhật `DB_NAME`
- [ ] Đã cập nhật `DB_USER`
- [ ] Đã cập nhật `DB_PASSWORD`
- [ ] Đã đặt `VIMES_SECURITY_KEY` (32 ký tự)
- [ ] Đã đặt `JWT_SECRET`
- [ ] Đã lưu file (Ctrl+X, Y, Enter)

### Cài đặt dependencies
```bash
npm install --production
```
- [ ] Cài đặt thành công (không có lỗi)
- [ ] Thư mục `node_modules/` đã được tạo

### Cấu hình Database
```bash
sudo systemctl status postgresql
```
- [ ] PostgreSQL đang chạy
- [ ] Database đã được tạo
- [ ] User database đã được tạo
- [ ] File SQL đã import thành công

---

## 🚀 PHẦN 5: KHỞI ĐỘNG

### Khởi động với script tự động
```bash
cd /path/to/vClinic-deploy
chmod +x start.sh
./start.sh
```
- [ ] Script chạy thành công
- [ ] PM2 hiển thị "online"

### Hoặc khởi động thủ công
```bash
cd backend
pm2 start src/server.js --name vclinic-backend
pm2 save
pm2 startup
```
- [ ] PM2 start thành công
- [ ] PM2 save thành công
- [ ] PM2 startup đã cấu hình

---

## ✅ PHẦN 6: KIỂM TRA

### Kiểm tra PM2
```bash
pm2 status
```
- [ ] Status hiển thị `online` (màu xanh)
- [ ] CPU và Memory ổn định

### Xem logs
```bash
pm2 logs vclinic-backend --lines 50
```
- [ ] Không có lỗi trong logs
- [ ] Hiển thị "🚀 vClinic Backend Server"
- [ ] Hiển thị "📂 Serving frontend from: .../dist"

### Test API
```bash
curl http://localhost:8000/api/health
```
- [ ] Trả về: `{"status":"OK",...}`

### Test Frontend
```bash
curl http://localhost:8000
```
- [ ] Trả về HTML content

### Cấu hình Firewall
```bash
sudo ufw allow 8000/tcp
sudo ufw status
```
- [ ] Port 8000 đã được mở
- [ ] Firewall status active

### Truy cập từ trình duyệt
```
http://server-ip:8000
```
- [ ] Trang đăng nhập hiển thị đúng
- [ ] Không có lỗi trong Console (F12)
- [ ] API calls thành công (Network tab)
- [ ] Có thể đăng nhập được

---

## 🎯 HOÀN THÀNH

### Checklist cuối cùng
- [ ] Backend đang chạy (PM2 online)
- [ ] Frontend hiển thị đúng
- [ ] Database kết nối thành công
- [ ] API hoạt động bình thường
- [ ] Có thể đăng nhập và sử dụng
- [ ] PM2 đã cấu hình auto-start
- [ ] Đã backup file `.env`
- [ ] Đã ghi chú thông tin server

---

## 📝 GHI CHÚ

### Thông tin quan trọng cần lưu:

**Server:**
- IP: `_______________________`
- Username: `_______________________`
- Thư mục deploy: `_______________________`

**Database:**
- Host: `_______________________`
- Database: `_______________________`
- User: `_______________________`

**Ứng dụng:**
- URL: `http://_______________________:8000`
- PM2 name: `vclinic-backend`

**Lệnh thường dùng:**
```bash
# Xem logs
pm2 logs vclinic-backend

# Restart
pm2 restart vclinic-backend

# Stop
pm2 stop vclinic-backend

# Status
pm2 status
```

**Ngày deploy:** `_____ / _____ / _____`

**Người deploy:** `_______________________`

**Ghi chú thêm:**
```
_____________________________________________________________

_____________________________________________________________

_____________________________________________________________
```

---

## 🆘 LIÊN HỆ HỖ TRỢ

Nếu gặp vấn đề:
1. Xem file `DEPLOY_STEP_BY_STEP.md` để biết chi tiết
2. Kiểm tra logs: `pm2 logs vclinic-backend`
3. Kiểm tra file `.env`
4. Liên hệ team support

---

**✅ Deploy thành công! Chúc mừng! 🎉**
