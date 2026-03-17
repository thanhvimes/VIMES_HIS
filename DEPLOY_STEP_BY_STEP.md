# 📘 HƯỚNG DẪN DEPLOY CHI TIẾT - TỪNG BƯỚC

> **Mục đích:** Hướng dẫn chi tiết từng bước để deploy hệ thống vClinic lên server production

---

## 📋 MỤC LỤC

1. [Chuẩn bị trước khi deploy](#bước-1-chuẩn-bị-trước-khi-deploy)
2. [Đóng gói ứng dụng trên máy local](#bước-2-đóng-gói-ứng-dụng-trên-máy-local)
3. [Upload lên server](#bước-3-upload-lên-server)
4. [Cấu hình trên server](#bước-4-cấu-hình-trên-server)
5. [Khởi động ứng dụng](#bước-5-khởi-động-ứng-dụng)
6. [Kiểm tra và xác nhận](#bước-6-kiểm-tra-và-xác-nhận)
7. [Xử lý sự cố](#bước-7-xử-lý-sự-cố)

---

## BƯỚC 1: Chuẩn bị trước khi deploy

### 1.1. Kiểm tra môi trường local

**Mở PowerShell/Terminal** và chạy các lệnh sau:

```powershell
# Kiểm tra Node.js version (cần >= 18.x)
node --version

# Kiểm tra npm version
npm --version

# Di chuyển vào thư mục project
cd d:\AI\vClinic

# Kiểm tra Git status (đảm bảo code đã commit)
git status
```

**Kết quả mong đợi:**
```
v18.x.x hoặc cao hơn
9.x.x hoặc cao hơn
On branch main
nothing to commit, working tree clean
```

### 1.2. Chuẩn bị thông tin server

Bạn cần có sẵn các thông tin sau:

- [ ] **IP/Domain của server:** `___________________`
- [ ] **SSH Username:** `___________________`
- [ ] **SSH Password/Key:** `___________________`
- [ ] **Thư mục deploy trên server:** `/home/user/vClinic` (ví dụ)
- [ ] **Database Host:** `___________________`
- [ ] **Database Name:** `___________________`
- [ ] **Database User:** `___________________`
- [ ] **Database Password:** `___________________`

### 1.3. Cài đặt công cụ upload (nếu chưa có)

**Chọn 1 trong các cách sau:**

#### Cách A: WinSCP (Windows - Khuyến nghị cho người mới)
1. Tải về: https://winscp.net/eng/download.php
2. Cài đặt với các tùy chọn mặc định
3. Mở WinSCP lên để chuẩn bị

#### Cách B: FileZilla (Cross-platform)
1. Tải về: https://filezilla-project.org/download.php?type=client
2. Cài đặt với các tùy chọn mặc định

#### Cách C: SCP qua Command Line (Nâng cao)
- Windows: Cài Git Bash hoặc WSL
- Mac/Linux: Đã có sẵn

---

## BƯỚC 2: Đóng gói ứng dụng trên máy local

### 2.1. Mở PowerShell/Terminal

**Windows:**
- Nhấn `Win + X`
- Chọn "Windows PowerShell" hoặc "Terminal"

**Mac/Linux:**
- Nhấn `Cmd + Space` (Mac) hoặc `Ctrl + Alt + T` (Linux)
- Gõ "Terminal" và Enter

### 2.2. Di chuyển vào thư mục project

```powershell
# Windows
cd d:\AI\vClinic

# Mac/Linux (ví dụ)
cd ~/Projects/vClinic
```

**Kiểm tra bạn đang ở đúng thư mục:**
```powershell
# Windows
dir

# Mac/Linux
ls -la
```

**Bạn phải thấy các file/thư mục sau:**
- `backend/`
- `components/`
- `modules/`
- `package.json`
- `vite.config.ts`
- `index.html`

### 2.3. Chạy lệnh đóng gói

```powershell
npm run deploy
```

**Quá trình này sẽ:**
1. ✅ Build frontend (tạo thư mục `dist/`)
2. ✅ Tạo thư mục `release/vClinic-deploy/`
3. ✅ Copy backend vào package
4. ✅ Copy frontend đã build vào package
5. ✅ Tạo file cấu hình mẫu
6. ✅ Tạo script khởi động tự động

**Output mong đợi:**
```
🚀 Starting vClinic Deployment Packaging...

📦 Step 1/6: Building Frontend...
✅ Frontend build completed

📂 Step 2/6: Preparing release directory...
✅ Release directory ready

⚙️  Step 3/6: Packaging Backend...
✅ Backend packaged

🎨 Step 4/6: Packaging Frontend build...
✅ Frontend packaged

📝 Step 5/6: Creating configuration files...
✅ Configuration files created

📦 Step 6/6: Creating deployment archive...
⚠️  Archiver not installed, skipping zip creation

═══════════════════════════════════════════════════════════
✅ DEPLOYMENT PACKAGE CREATED SUCCESSFULLY!
═══════════════════════════════════════════════════════════
📍 Location: d:\AI\vClinic\release\vClinic-deploy
```

### 2.4. Kiểm tra package đã tạo

```powershell
# Windows
cd release\vClinic-deploy
dir

# Mac/Linux
cd release/vClinic-deploy
ls -la
```

**Bạn phải thấy:**
```
backend/                    # Thư mục backend
dist/                       # Thư mục frontend đã build
start.sh                    # Script khởi động Linux/Mac
start.bat                   # Script khởi động Windows
README.md                   # Hướng dẫn nhanh
DEPLOY_INSTRUCTIONS.md      # Hướng dẫn chi tiết
```

### 2.5. Kiểm tra thư mục dist/

```powershell
# Windows
cd dist
dir

# Mac/Linux
cd dist
ls -la
```

**Bạn phải thấy:**
```
assets/          # Thư mục chứa CSS, JS, images
index.html       # File HTML chính
```

**✅ Nếu thấy đầy đủ → Đóng gói thành công!**

---

## BƯỚC 3: Upload lên server

### CÁCH 1: Sử dụng WinSCP (Windows - Dễ nhất)

#### 3.1. Mở WinSCP

1. Mở ứng dụng WinSCP
2. Click "New Session"

#### 3.2. Cấu hình kết nối

Điền thông tin như sau:

| Trường | Giá trị |
|--------|---------|
| **File protocol** | SFTP |
| **Host name** | IP hoặc domain của server (ví dụ: `192.168.1.100`) |
| **Port number** | `22` (mặc định SSH) |
| **User name** | Username SSH của bạn (ví dụ: `ubuntu`, `root`) |
| **Password** | Password SSH của bạn |

#### 3.3. Kết nối đến server

1. Click nút **"Login"**
2. Nếu xuất hiện cảnh báo về host key → Click **"Yes"** để chấp nhận
3. Đợi kết nối thành công

**Giao diện sau khi kết nối:**
- **Bên trái:** Máy tính local của bạn (Windows)
- **Bên phải:** Server (Linux)

#### 3.4. Tạo thư mục trên server (nếu chưa có)

**Trên panel bên phải (Server):**

1. Di chuyển đến thư mục home:
   - Thường là `/home/your-username/`
   - Hoặc `/var/www/` (nếu dùng web server)

2. Click chuột phải → **"New"** → **"Directory"**
3. Đặt tên: `vClinic`
4. Click **"OK"**

#### 3.5. Upload thư mục vClinic-deploy

**Trên panel bên trái (Local):**

1. Di chuyển đến: `d:\AI\vClinic\release\`
2. Tìm thư mục `vClinic-deploy`
3. **Kéo thả** thư mục `vClinic-deploy` sang panel bên phải (Server)
   - Hoặc: Click chuột phải → **"Upload"**

**Quá trình upload:**
- Sẽ hiển thị thanh tiến trình
- Thời gian tùy thuộc vào tốc độ mạng (thường 2-5 phút)
- Đợi đến khi hiển thị "Upload completed"

**✅ Kiểm tra:** Trên server phải có thư mục `/home/your-username/vClinic-deploy/`

---

### CÁCH 2: Sử dụng SCP qua Command Line (Nâng cao)

#### 3.1. Mở Terminal/PowerShell

```powershell
# Di chuyển vào thư mục release
cd d:\AI\vClinic\release
```

#### 3.2. Upload bằng lệnh SCP

```bash
# Cú pháp:
# scp -r <thư-mục-local> <user>@<server-ip>:<đường-dẫn-server>

# Ví dụ:
scp -r vClinic-deploy/ ubuntu@192.168.1.100:/home/ubuntu/

# Hoặc nếu dùng SSH key:
scp -i ~/.ssh/your-key.pem -r vClinic-deploy/ ubuntu@192.168.1.100:/home/ubuntu/
```

**Giải thích:**
- `-r`: Upload đệ quy (cả thư mục con)
- `vClinic-deploy/`: Thư mục cần upload
- `ubuntu`: Username SSH
- `192.168.1.100`: IP server
- `/home/ubuntu/`: Đường dẫn đích trên server

**Nhập password khi được yêu cầu**

**Output mong đợi:**
```
vClinic-deploy/backend/package.json    100%  745   12.5KB/s   00:00
vClinic-deploy/backend/src/server.js   100% 2660   44.3KB/s   00:00
...
vClinic-deploy/dist/index.html         100% 13KB  220.5KB/s   00:00
```

---

### CÁCH 3: Sử dụng Git (Nếu server có Git)

#### 3.1. Commit code trên local

```bash
cd d:\AI\vClinic

# Add tất cả files
git add .

# Commit
git commit -m "Deploy package $(date +%Y-%m-%d)"

# Push lên repository
git push origin main
```

#### 3.2. Pull trên server

```bash
# SSH vào server
ssh ubuntu@192.168.1.100

# Clone hoặc pull
cd /home/ubuntu
git clone https://github.com/your-username/vClinic.git
# Hoặc nếu đã có:
cd vClinic
git pull origin main

# Build trên server
npm run deploy
```

---

## BƯỚC 4: Cấu hình trên server

### 4.1. SSH vào server

```bash
# Cú pháp:
ssh <username>@<server-ip>

# Ví dụ:
ssh ubuntu@192.168.1.100

# Hoặc dùng SSH key:
ssh -i ~/.ssh/your-key.pem ubuntu@192.168.1.100
```

**Nhập password khi được yêu cầu**

**Sau khi đăng nhập thành công, bạn sẽ thấy:**
```
Welcome to Ubuntu 22.04 LTS
ubuntu@server:~$
```

### 4.2. Di chuyển vào thư mục deploy

```bash
cd vClinic-deploy

# Kiểm tra cấu trúc
ls -la
```

**Bạn phải thấy:**
```
drwxr-xr-x  backend/
drwxr-xr-x  dist/
-rwxr-xr-x  start.sh
-rw-r--r--  README.md
-rw-r--r--  DEPLOY_INSTRUCTIONS.md
```

### 4.3. Cài đặt Node.js (nếu chưa có)

#### Kiểm tra Node.js hiện tại:
```bash
node --version
```

**Nếu chưa có hoặc version < 18:**

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Kiểm tra lại
node --version
npm --version
```

### 4.4. Cài đặt PM2 (Process Manager)

```bash
# Cài đặt PM2 global
sudo npm install -g pm2

# Kiểm tra
pm2 --version
```

**Output mong đợi:**
```
5.x.x
```

### 4.5. Cấu hình Backend

#### 4.5.1. Di chuyển vào thư mục backend

```bash
cd backend
```

#### 4.5.2. Tạo file .env

```bash
# Copy từ file mẫu
cp .env.example .env

# Chỉnh sửa file .env
nano .env
```

**Trong nano editor, cập nhật các giá trị sau:**

```env
# Server Configuration
PORT=8000
NODE_ENV=production

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vimes_db
DB_USER=vimes_user
DB_PASSWORD=your_strong_password_here

# Security Keys
VIMES_SECURITY_KEY=your_32_character_encryption_key_12345
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=*
```

**Lưu file trong nano:**
1. Nhấn `Ctrl + X`
2. Nhấn `Y` (Yes)
3. Nhấn `Enter`

#### 4.5.3. Cài đặt dependencies

```bash
# Cài đặt chỉ production dependencies
npm install --production
```

**Output mong đợi:**
```
added 150 packages in 30s
```

**Nếu gặp lỗi:**
```bash
# Xóa node_modules và package-lock.json
rm -rf node_modules package-lock.json

# Cài lại
npm install --production
```

### 4.6. Cấu hình Database (nếu cần)

#### 4.6.1. Kiểm tra PostgreSQL

```bash
# Kiểm tra PostgreSQL đang chạy
sudo systemctl status postgresql
```

**Nếu chưa cài đặt PostgreSQL:**

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### 4.6.2. Tạo database và user

```bash
# Đăng nhập vào PostgreSQL
sudo -u postgres psql

# Trong PostgreSQL prompt:
CREATE DATABASE vimes_db;
CREATE USER vimes_user WITH PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE vimes_db TO vimes_user;
\q
```

#### 4.6.3. Import database schema

```bash
# Di chuyển vào thư mục sql
cd sql

# Import file SQL
psql -U vimes_user -d vimes_db -f booking_online_database.sql

# Nhập password khi được yêu cầu
```

**Output mong đợi:**
```
CREATE FUNCTION
CREATE TABLE
INSERT 0 10
...
```

---

## BƯỚC 5: Khởi động ứng dụng

### CÁCH 1: Sử dụng script tự động (Khuyến nghị)

```bash
# Di chuyển về thư mục gốc
cd /home/ubuntu/vClinic-deploy

# Cấp quyền thực thi cho script
chmod +x start.sh

# Chạy script
./start.sh
```

**Output mong đợi:**
```
🚀 Starting vClinic Backend...
🔄 Starting with PM2...
[PM2] Starting /home/ubuntu/vClinic-deploy/backend/src/server.js in fork_mode (1 instance)
[PM2] Done.
✅ Backend started with PM2
📊 View logs: pm2 logs vclinic-backend
```

---

### CÁCH 2: Khởi động thủ công với PM2

```bash
# Di chuyển vào thư mục backend
cd /home/ubuntu/vClinic-deploy/backend

# Khởi động với PM2
pm2 start src/server.js --name vclinic-backend

# Lưu cấu hình PM2
pm2 save

# Cấu hình tự động khởi động khi reboot
pm2 startup
# Copy và chạy lệnh mà PM2 gợi ý (nếu có)
```

**Output mong đợi:**
```
┌─────┬──────────────────┬─────────┬─────────┬──────────┬────────┐
│ id  │ name             │ mode    │ status  │ cpu      │ memory │
├─────┼──────────────────┼─────────┼─────────┼──────────┼────────┤
│ 0   │ vclinic-backend  │ fork    │ online  │ 0%       │ 45.2mb │
└─────┴──────────────────┴─────────┴─────────┴──────────┴────────┘
```

---

### CÁCH 3: Chạy trực tiếp (Development/Testing)

```bash
cd /home/ubuntu/vClinic-deploy/backend
npm start
```

**Lưu ý:** Cách này chỉ dùng để test, khi đóng terminal thì app sẽ dừng.

---

## BƯỚC 6: Kiểm tra và xác nhận

### 6.1. Kiểm tra PM2 status

```bash
pm2 status
```

**Kết quả mong đợi:**
```
┌─────┬──────────────────┬─────────┬─────────┬──────────┬────────┐
│ id  │ name             │ mode    │ status  │ cpu      │ memory │
├─────┼──────────────────┼─────────┼─────────┼──────────┼────────┤
│ 0   │ vclinic-backend  │ fork    │ online  │ 0%       │ 45.2mb │
└─────┴──────────────────┴─────────┴─────────┴──────────┴────────┘
```

**Status phải là `online`** ✅

### 6.2. Xem logs

```bash
# Xem logs realtime
pm2 logs vclinic-backend

# Hoặc xem 50 dòng cuối
pm2 logs vclinic-backend --lines 50
```

**Output mong đợi:**
```
==================================================
🚀 vClinic Backend Server
📡 Running on port 8000
🌐 http://localhost:8000
📊 Database: vimes_db
==================================================
📂 Serving frontend from: /home/ubuntu/vClinic-deploy/dist
```

**Nhấn `Ctrl + C` để thoát logs**

### 6.3. Test API endpoint

```bash
# Test health check
curl http://localhost:8000/api/health
```

**Kết quả mong đợi:**
```json
{"status":"OK","message":"vClinic Backend API","version":"1.0.0"}
```

### 6.4. Kiểm tra frontend

```bash
# Test xem frontend có được serve không
curl http://localhost:8000
```

**Kết quả mong đợi:** HTML content của trang index.html

### 6.5. Cấu hình Firewall (nếu cần)

```bash
# Ubuntu/Debian - UFW
sudo ufw allow 8000/tcp
sudo ufw status

# CentOS/RHEL - Firewalld
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --reload
sudo firewall-cmd --list-all
```

### 6.6. Truy cập từ trình duyệt

**Mở trình duyệt và truy cập:**

```
http://your-server-ip:8000
```

**Ví dụ:**
```
http://192.168.1.100:8000
```

**Bạn phải thấy:**
- ✅ Giao diện đăng nhập vClinic
- ✅ Không có lỗi trong Console (F12)
- ✅ API calls thành công

---

## BƯỚC 7: Xử lý sự cố

### Lỗi 1: "Frontend not built"

**Triệu chứng:**
```json
{"error":"Frontend not built. Run \"npm run build\" first or use Vite dev server on port 3000"}
```

**Nguyên nhân:** Thư mục `dist/` không tồn tại hoặc sai vị trí

**Giải pháp:**

```bash
# Kiểm tra cấu trúc thư mục
cd /home/ubuntu/vClinic-deploy
ls -la

# Phải có thư mục dist/ cùng cấp với backend/
# Nếu thiếu:
```

**Trên máy local:**
```powershell
cd d:\AI\vClinic
npm run deploy
# Upload lại toàn bộ thư mục vClinic-deploy
```

---

### Lỗi 2: Database connection failed

**Triệu chứng:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Giải pháp:**

```bash
# 1. Kiểm tra PostgreSQL đang chạy
sudo systemctl status postgresql

# Nếu không chạy:
sudo systemctl start postgresql

# 2. Kiểm tra thông tin kết nối
cd /home/ubuntu/vClinic-deploy/backend
cat .env

# 3. Test kết nối database
psql -U vimes_user -d vimes_db -h localhost

# 4. Kiểm tra pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf
# Đảm bảo có dòng:
# local   all   all   md5
```

---

### Lỗi 3: Port 8000 already in use

**Triệu chứng:**
```
Error: listen EADDRINUSE: address already in use :::8000
```

**Giải pháp:**

```bash
# Tìm process đang dùng port 8000
sudo lsof -i :8000

# Hoặc
sudo netstat -tulpn | grep 8000

# Kill process
sudo kill -9 <PID>

# Hoặc đổi PORT trong .env
nano backend/.env
# Đổi PORT=8000 thành PORT=8001
```

---

### Lỗi 4: PM2 not found

**Triệu chứng:**
```
bash: pm2: command not found
```

**Giải pháp:**

```bash
# Cài đặt PM2
sudo npm install -g pm2

# Kiểm tra
pm2 --version

# Nếu vẫn không nhận:
export PATH=$PATH:/usr/local/bin
echo 'export PATH=$PATH:/usr/local/bin' >> ~/.bashrc
source ~/.bashrc
```

---

### Lỗi 5: Permission denied

**Triệu chứng:**
```
Error: EACCES: permission denied
```

**Giải pháp:**

```bash
# Cấp quyền cho thư mục
sudo chown -R $USER:$USER /home/ubuntu/vClinic-deploy

# Cấp quyền thực thi cho scripts
chmod +x start.sh
chmod +x backend/src/server.js
```

---

### Lỗi 6: Module not found

**Triệu chứng:**
```
Error: Cannot find module 'express'
```

**Giải pháp:**

```bash
cd /home/ubuntu/vClinic-deploy/backend

# Xóa và cài lại
rm -rf node_modules package-lock.json
npm install --production

# Restart
pm2 restart vclinic-backend
```

---

## 📊 QUẢN LÝ VÀ BẢO TRÌ

### Xem logs

```bash
# Logs realtime
pm2 logs vclinic-backend

# Logs với số dòng cụ thể
pm2 logs vclinic-backend --lines 100

# Xóa logs cũ
pm2 flush
```

### Giám sát hệ thống

```bash
# Monitor realtime
pm2 monit

# Xem status
pm2 status

# Xem thông tin chi tiết
pm2 show vclinic-backend
```

### Quản lý ứng dụng

```bash
# Restart
pm2 restart vclinic-backend

# Stop
pm2 stop vclinic-backend

# Start lại
pm2 start vclinic-backend

# Delete (xóa khỏi PM2)
pm2 delete vclinic-backend

# Restart tất cả
pm2 restart all
```

### Backup

```bash
# Backup toàn bộ thư mục
cd /home/ubuntu
tar -czf vClinic-backup-$(date +%Y%m%d).tar.gz vClinic-deploy/

# Backup database
pg_dump -U vimes_user vimes_db > vimes_db_backup_$(date +%Y%m%d).sql

# Backup file .env
cp vClinic-deploy/backend/.env vClinic-deploy/backend/.env.backup
```

---

## 🔄 CẬP NHẬT PHIÊN BẢN MỚI

### Trên máy local:

```powershell
# 1. Pull code mới (nếu dùng Git)
git pull origin main

# 2. Build lại
npm run deploy

# 3. Upload lên server (giữ nguyên .env)
```

### Trên server:

```bash
# 1. Backup phiên bản cũ
cd /home/ubuntu
cp -r vClinic-deploy vClinic-deploy.backup-$(date +%Y%m%d)

# 2. Stop ứng dụng
pm2 stop vclinic-backend

# 3. Upload phiên bản mới (KHÔNG đè file .env)

# 4. Cài đặt dependencies mới
cd vClinic-deploy/backend
npm install --production

# 5. Restart
pm2 restart vclinic-backend

# 6. Kiểm tra logs
pm2 logs vclinic-backend --lines 50
```

---

## ✅ CHECKLIST HOÀN THÀNH

### Trên máy local:
- [ ] Đã chạy `npm run deploy` thành công
- [ ] Thư mục `release/vClinic-deploy/` đã được tạo
- [ ] Có thư mục `dist/` với `index.html` và `assets/`
- [ ] Đã upload toàn bộ lên server

### Trên server:
- [ ] Node.js >= 18.x đã cài đặt
- [ ] PM2 đã cài đặt
- [ ] PostgreSQL đang chạy
- [ ] Database đã được tạo và import
- [ ] File `.env` đã cấu hình đúng
- [ ] Dependencies đã cài đặt (`npm install --production`)
- [ ] Backend đã khởi động với PM2
- [ ] PM2 status hiển thị `online`
- [ ] API `/api/health` trả về OK
- [ ] Frontend hiển thị đúng trên trình duyệt
- [ ] Firewall đã mở port 8000

---

## 📞 HỖ TRỢ

**Nếu gặp vấn đề không có trong hướng dẫn:**

1. Xem logs chi tiết:
   ```bash
   pm2 logs vclinic-backend --lines 200
   ```

2. Kiểm tra file .env:
   ```bash
   cat backend/.env
   ```

3. Test từng bước:
   - Database connection
   - Backend API
   - Frontend files

4. Tham khảo file `DEPLOY_INSTRUCTIONS.md` trong package

---

**Chúc bạn deploy thành công! 🎉**

*Nếu cần hỗ trợ thêm, hãy lưu lại logs và mô tả chi tiết lỗi bạn gặp phải.*
