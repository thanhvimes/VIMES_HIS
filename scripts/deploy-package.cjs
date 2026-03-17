const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Optional: archiver for zip creation
let archiver = null;
try {
    archiver = require('archiver');
} catch (e) {
    // archiver not installed, will skip zip creation
}


const rootDir = path.join(__dirname, '..');
const releaseDir = path.join(rootDir, 'release');
const deployDir = path.join(releaseDir, 'vClinic-deploy');

// Helper to copy directory recursively
function copyDir(src, dest, exclude = []) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (let entry of entries) {
        if (exclude.includes(entry.name)) continue;

        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath, exclude);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Helper to remove directory
function removeDir(dir) {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

// Helper to create zip file
function createZipArchive(sourceDir, outPath) {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            console.log(`📦 Archive created: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
            resolve();
        });

        archive.on('error', (err) => reject(err));

        archive.pipe(output);
        archive.directory(sourceDir, false);
        archive.finalize();
    });
}

async function startPackaging() {
    console.log('🚀 Starting vClinic Deployment Packaging...\n');

    try {
        // 1. Build Frontend
        console.log('📦 Step 1/6: Building Frontend...');
        execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
        console.log('✅ Frontend build completed\n');

        // 2. Verify dist folder exists
        const distDir = path.join(rootDir, 'dist');
        if (!fs.existsSync(distDir)) {
            throw new Error('❌ dist/ folder not found after build!');
        }

        // 3. Prepare Release Directory
        console.log('📂 Step 2/6: Preparing release directory...');
        removeDir(deployDir);
        fs.mkdirSync(deployDir, { recursive: true });
        console.log('✅ Release directory ready\n');

        // 4. Copy Backend
        console.log('⚙️  Step 3/6: Packaging Backend...');
        const backendSrc = path.join(rootDir, 'backend');
        const backendDest = path.join(deployDir, 'backend');
        const backendExclude = ['node_modules', '.env', 'logs', '.git', 'coverage', 'test'];
        copyDir(backendSrc, backendDest, backendExclude);
        console.log('✅ Backend packaged\n');

        // 5. Copy Frontend Build (dist) to deploy directory
        console.log('🎨 Step 4/6: Packaging Frontend build...');
        const distDest = path.join(deployDir, 'dist');
        copyDir(distDir, distDest);
        console.log('✅ Frontend packaged\n');

        // 6. Create .env.example for backend
        console.log('📝 Step 5/6: Creating configuration files...');
        const envExample = `# vClinic Backend Configuration
# Copy this file to .env and update with your actual values

# Server Configuration
PORT=8000
NODE_ENV=production

# Database Configuration (Encrypted)
DB_HOST=your_encrypted_db_host
DB_PORT=5432
DB_NAME=your_encrypted_db_name
DB_USER=your_encrypted_db_user
DB_PASSWORD=your_encrypted_db_password

# Security
VIMES_SECURITY_KEY=your_32_character_encryption_key_here
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# CORS (if needed)
CORS_ORIGIN=*
`;
        fs.writeFileSync(path.join(backendDest, '.env.example'), envExample);

        // 7. Create deployment instructions
        const deployInstructions = `# 🚀 HƯỚNG DẪN TRIỂN KHAI vClinic

## 📋 Tổng quan
Package này chứa toàn bộ hệ thống vClinic đã được build và sẵn sàng deploy lên server.

### Cấu trúc thư mục:
\`\`\`
vClinic-deploy/
├── backend/          # Backend API server
│   ├── src/         # Source code
│   ├── sql/         # Database scripts
│   ├── package.json
│   └── .env.example # Cấu hình mẫu
└── dist/            # Frontend đã build (static files)
    ├── index.html
    └── assets/
\`\`\`

---

## 🔧 BƯỚC 1: Chuẩn bị Server

### Yêu cầu hệ thống:
- ✅ Node.js >= 18.x
- ✅ PostgreSQL >= 13.x
- ✅ PM2 (khuyến nghị cho production)

### Cài đặt PM2 (nếu chưa có):
\`\`\`bash
npm install -g pm2
\`\`\`

---

## 📤 BƯỚC 2: Upload lên Server

### Cách 1: Sử dụng SCP/SFTP
\`\`\`bash
# Upload toàn bộ thư mục vClinic-deploy
scp -r vClinic-deploy/ user@your-server:/path/to/deploy/
\`\`\`

### Cách 2: Sử dụng Git
\`\`\`bash
# Nếu bạn đã commit vào Git
git pull origin main
\`\`\`

---

## ⚙️ BƯỚC 3: Cấu hình Backend

### 3.1. Di chuyển vào thư mục backend
\`\`\`bash
cd vClinic-deploy/backend
\`\`\`

### 3.2. Cài đặt dependencies
\`\`\`bash
npm install --production
\`\`\`

### 3.3. Cấu hình môi trường
\`\`\`bash
# Copy file .env.example thành .env
cp .env.example .env

# Chỉnh sửa file .env với thông tin thực tế
nano .env  # hoặc vi .env
\`\`\`

**Lưu ý quan trọng:**
- Cập nhật thông tin database (đã mã hóa nếu dùng encryption)
- Đặt \`VIMES_SECURITY_KEY\` (32 ký tự)
- Đặt \`JWT_SECRET\` mạnh
- Kiểm tra \`PORT\` (mặc định 8000)

### 3.4. Cấu hình Database
\`\`\`bash
# Chạy các script SQL trong thư mục sql/
psql -U your_db_user -d your_db_name -f sql/booking_online_database.sql
\`\`\`

---

## 🚀 BƯỚC 4: Khởi động Backend

### Cách 1: Sử dụng PM2 (Khuyến nghị)
\`\`\`bash
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
\`\`\`

### Cách 2: Chạy trực tiếp (Development)
\`\`\`bash
npm start
\`\`\`

---

## 🌐 BƯỚC 5: Kiểm tra Deployment

### 5.1. Kiểm tra Backend
\`\`\`bash
# Test API health endpoint
curl http://localhost:8000/api/health

# Kết quả mong đợi:
# {"status":"OK","message":"vClinic Backend API","version":"1.0.0"}
\`\`\`

### 5.2. Kiểm tra Frontend
Mở trình duyệt và truy cập:
\`\`\`
http://your-server-ip:8000
\`\`\`

**Lưu ý:** Backend sẽ tự động serve frontend từ thư mục \`dist/\`

---

## 🔒 BƯỚC 6: Cấu hình Firewall (Tùy chọn)

### Mở port cho backend:
\`\`\`bash
# Ubuntu/Debian
sudo ufw allow 8000/tcp

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --reload
\`\`\`

---

## 🔄 CẬP NHẬT HỆ THỐNG

Khi có phiên bản mới:

\`\`\`bash
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
\`\`\`

---

## 🐛 XỬ LÝ SỰ CỐ

### Lỗi: "Frontend not built"
**Nguyên nhân:** Thư mục \`dist/\` không tồn tại hoặc không đúng vị trí

**Giải pháp:**
\`\`\`bash
# Kiểm tra cấu trúc thư mục
ls -la vClinic-deploy/

# Đảm bảo có thư mục dist/ cùng cấp với backend/
# Nếu thiếu, build lại trên local và upload
\`\`\`

### Lỗi: Database connection failed
**Giải pháp:**
\`\`\`bash
# 1. Kiểm tra PostgreSQL đang chạy
sudo systemctl status postgresql

# 2. Kiểm tra thông tin kết nối trong .env
# 3. Test kết nối database
psql -U your_db_user -d your_db_name -h localhost
\`\`\`

### Lỗi: Port already in use
**Giải pháp:**
\`\`\`bash
# Tìm process đang dùng port 8000
lsof -i :8000

# Hoặc thay đổi PORT trong file .env
\`\`\`

---

## 📊 GIÁM SÁT HỆ THỐNG

### Xem logs với PM2:
\`\`\`bash
# Xem logs realtime
pm2 logs vclinic-backend

# Xem logs cũ
pm2 logs vclinic-backend --lines 100

# Xóa logs cũ
pm2 flush
\`\`\`

### Giám sát tài nguyên:
\`\`\`bash
pm2 monit
\`\`\`

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề, kiểm tra:
1. ✅ Logs của PM2: \`pm2 logs\`
2. ✅ File .env đã cấu hình đúng
3. ✅ Database đã import đầy đủ
4. ✅ Firewall đã mở port
5. ✅ Node.js version >= 18.x

---

**Chúc bạn deploy thành công! 🎉**
`;

        fs.writeFileSync(path.join(deployDir, 'DEPLOY_INSTRUCTIONS.md'), deployInstructions);
        console.log('✅ Configuration files created\n');

        // 8. Create start script for easy deployment
        const startScript = `#!/bin/bash
# vClinic Quick Start Script

echo "🚀 Starting vClinic Backend..."

cd backend

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "📝 Please copy .env.example to .env and configure it first:"
    echo "   cp .env.example .env"
    echo "   nano .env"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --production
fi

# Start with PM2
if command -v pm2 &> /dev/null; then
    echo "🔄 Starting with PM2..."
    pm2 start src/server.js --name vclinic-backend
    pm2 save
    echo "✅ Backend started with PM2"
    echo "📊 View logs: pm2 logs vclinic-backend"
else
    echo "⚠️  PM2 not found, starting with npm..."
    npm start
fi
`;
        fs.writeFileSync(path.join(deployDir, 'start.sh'), startScript);
        fs.chmodSync(path.join(deployDir, 'start.sh'), '755');

        // 9. Create Windows start script
        const startScriptWin = `@echo off
REM vClinic Quick Start Script for Windows

echo Starting vClinic Backend...

cd backend

REM Check if .env exists
if not exist .env (
    echo Error: .env file not found!
    echo Please copy .env.example to .env and configure it first:
    echo    copy .env.example .env
    echo    notepad .env
    exit /b 1
)

REM Install dependencies if needed
if not exist node_modules (
    echo Installing dependencies...
    npm install --production
)

REM Start with PM2
where pm2 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Starting with PM2...
    pm2 start src/server.js --name vclinic-backend
    pm2 save
    echo Backend started with PM2
    echo View logs: pm2 logs vclinic-backend
) else (
    echo PM2 not found, starting with npm...
    npm start
)
`;
        fs.writeFileSync(path.join(deployDir, 'start.bat'), startScriptWin);

        console.log('✅ Start scripts created\n');

        // 10. Create README
        const readme = `# vClinic Deployment Package

📦 **Version:** ${new Date().toISOString().split('T')[0]}

## Quick Start

### Linux/Mac:
\`\`\`bash
chmod +x start.sh
./start.sh
\`\`\`

### Windows:
\`\`\`cmd
start.bat
\`\`\`

## Full Documentation
See [DEPLOY_INSTRUCTIONS.md](./DEPLOY_INSTRUCTIONS.md) for detailed deployment guide.

## Package Contents
- ✅ Backend API (Node.js/Express)
- ✅ Frontend (Pre-built React app)
- ✅ Database scripts
- ✅ Configuration templates
- ✅ Deployment scripts

---
Built with ❤️ for vClinic
`;
        fs.writeFileSync(path.join(deployDir, 'README.md'), readme);

        // 11. Optional: Create zip archive
        console.log('📦 Step 6/6: Creating deployment archive...');
        let zipPath = ''; // Declare zipPath here to ensure it's always defined

        if (archiver) {
            zipPath = path.join(releaseDir, `vClinic-deploy-${new Date().toISOString().split('T')[0]}.zip`);
            try {
                await createZipArchive(deployDir, zipPath);
                console.log(`✅ Archive created: ${zipPath}\n`);
            } catch (zipError) {
                console.log('⚠️  Failed to create zip archive:', zipError.message);
            }
        } else {
            console.log('⚠️  Archiver not installed, skipping zip creation');
            console.log('   Install with: npm install archiver --save-dev\n');
        }

        // Summary
        console.log('═'.repeat(60));
        console.log('✅ DEPLOYMENT PACKAGE CREATED SUCCESSFULLY!');
        console.log('═'.repeat(60));
        console.log(`📍 Location: ${deployDir}`);
        console.log(`📦 Archive:  ${zipPath}`);
        console.log('\n📋 Next Steps:');
        console.log('   1. Upload the vClinic-deploy folder to your server');
        console.log('   2. Follow instructions in DEPLOY_INSTRUCTIONS.md');
        console.log('   3. Run ./start.sh (Linux/Mac) or start.bat (Windows)');
        console.log('═'.repeat(60));

    } catch (error) {
        console.error('\n❌ Packaging failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

startPackaging();
