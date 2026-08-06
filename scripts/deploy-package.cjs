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
const deployDir = path.join(releaseDir, 'VIMES-HIS-deploy');

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
    console.log('🚀 Starting VIMES HIS Deployment Packaging...\n');

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
        const envExample = `# VIMES HIS Backend Configuration
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

        // 7. Create root package.json in deployment folder for copy & run convenience
        const rootPkg = {
            name: 'vimes-his-deploy',
            version: '1.0.0',
            private: true,
            description: 'VIMES HIS Production Deployment Package',
            scripts: {
                "setup": "cd backend && npm install",
                "dev": "cd backend && npm run dev",
                "start": "cd backend && npm start"
            }
        };
        fs.writeFileSync(path.join(deployDir, 'package.json'), JSON.stringify(rootPkg, null, 2));

        // 8. Create deployment instructions
        const deployInstructions = `# 🚀 HƯỚNG DẪN TRIỂN KHAI VIMES HIS

## 📋 Tổng quan
Package này chứa toàn bộ hệ thống VIMES HIS đã được build và sẵn sàng deploy lên server.

### Cấu trúc thư mục:
\`\`\`
VIMES-HIS-deploy/
├── package.json      # File điều khiển lệnh npm run dev / npm start
├── start.bat         # Script khởi chạy Windows
├── start.sh          # Script khởi chạy Linux/Mac
├── README.md         # Hướng dẫn nhanh
├── DEPLOY_INSTRUCTIONS.md # Hướng dẫn chi tiết này
├── backend/          # Backend API server (Node.js/Express + TypeScript)
│   ├── src/          # Source code backend
│   ├── migrations/   # Script nâng cấp CSDL tự động
│   ├── package.json
│   └── .env.example  # Cấu hình mẫu môi trường
└── dist/             # Frontend đã build tĩnh (React/Vite)
    ├── index.html
    └── assets/
\`\`\`

---

## ⚡ HƯỚNG DẪN TRIỂN KHAI NHANH (QUICK START)

### 1. Upload lên máy chủ
Copy toàn bộ thư mục \`VIMES-HIS-deploy\` (hoặc file zip giải nén) lên máy chủ của bạn.

### 2. Cấu hình môi trường (.env)
Vào thư mục \`backend/\`:
- Copy file \`.env.example\` thành \`.env\`
- Cập nhật các thông số CSDL (\`DB_HOST\`, \`DB_NAME\`, \`DB_USER\`, \`DB_PASSWORD\`) và chìa khóa bảo mật (\`JWT_SECRET\`, \`VIMES_SECURITY_KEY\`).

### 3. Chạy hệ thống
Tại thư mục gốc \`VIMES-HIS-deploy\`, thực hiện một trong các cách sau:

#### Cách 1: Sử dụng Lệnh NPM (Đơn giản nhất)
\`\`\`bash
npm run dev    # Chạy chế độ Development / Live Log
# hoặc
npm start      # Chạy chế độ Production
\`\`\`

#### Cách 2: Sử dụng Script Khởi chạy Tự động
- **Windows:** Mở Command Prompt hoặc double click \`start.bat\`
- **Linux / macOS:** 
  \`\`\`bash
  chmod +x start.sh
  ./start.sh
  \`\`\`

---

## 🌐 KIỂM TRA HỆ THỐNG
- **Giao diện Frontend:** \`http://<IP_MÁY_CHỦ>:8000\` (hoặc PORT bạn đã cấu hình trong .env)
- **API Backend Healthcheck:** \`http://<IP_MÁY_CHỦ>:8000/api/health\`

---

## 🔄 CẬP NHẬT & BẢO TRÌ
Khi có bản cập nhật mới:
1. Ghi đè các file mới trong gói lên server (giữ lại file \`backend/.env\`).
2. Chạy lại \`npm run dev\` hoặc \`start.bat\` / \`./start.sh\`.
`;

        fs.writeFileSync(path.join(deployDir, 'DEPLOY_INSTRUCTIONS.md'), deployInstructions);
        console.log('✅ Configuration files created\n');

        // 9. Create start script for easy deployment (Linux/Mac)
        const startScript = `#!/bin/bash
# VIMES HIS Quick Start Script for Linux/macOS

echo "🚀 Starting VIMES HIS System..."

cd "$(dirname "$0")"

# Check if backend/.env exists
if [ ! -f backend/.env ]; then
    if [ -f backend/.env.example ]; then
        echo "📝 Initializing backend/.env from .env.example..."
        cp backend/.env.example backend/.env
        echo "⚠️ Please edit backend/.env to configure database and security keys!"
    else
        echo "❌ Error: backend/.env file not found!"
        exit 1
    fi
fi

# Install dependencies if needed
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Start with PM2 if available, otherwise npm start
if command -v pm2 &> /dev/null; then
    echo "🔄 Starting with PM2..."
    cd backend && pm2 start npm --name "vimes-his" -- start && pm2 save && cd ..
    echo "✅ Backend started with PM2"
    echo "📊 View logs: pm2 logs vimes-his"
else
    echo "⚡ Starting backend with npm..."
    cd backend && npm start
fi
`;
        fs.writeFileSync(path.join(deployDir, 'start.sh'), startScript);
        fs.chmodSync(path.join(deployDir, 'start.sh'), '755');

        // 10. Create Windows start script
        const startScriptWin = `@echo off
REM VIMES HIS Quick Start Script for Windows

echo 🚀 Starting VIMES HIS System...

cd /d "%~dp0"

REM Check if backend\\.env exists
if not exist "backend\\.env" (
    if exist "backend\\.env.example" (
        echo 📝 Initializing backend\\.env from .env.example...
        copy "backend\\.env.example" "backend\\.env"
        echo ⚠️ Please edit backend\\.env to configure database and security keys!
    ) else (
        echo ❌ Error: backend\\.env file not found!
        pause
        exit /b 1
    )
)

REM Install dependencies if needed
if not exist "backend\\node_modules" (
    echo 📦 Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

REM Start with PM2 if available, otherwise npm start
where pm2 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo 🔄 Starting with PM2...
    cd backend
    call pm2 start npm --name "vimes-his" -- start
    call pm2 save
    cd ..
    echo ✅ Backend started with PM2
    echo 📊 View logs: pm2 logs vimes-his
) else (
    echo ⚡ Starting backend with npm...
    cd backend
    call npm start
)
`;
        fs.writeFileSync(path.join(deployDir, 'start.bat'), startScriptWin);

        console.log('✅ Start scripts created\n');

        // 11. Create README
        const readme = `# 🚀 VIMES HIS - HƯỚNG DẪN TRIỂN KHAI NHANH

📦 **Version:** ${new Date().toISOString().split('T')[0]}

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
Built with ❤️ for VIMES HIS
`;
        fs.writeFileSync(path.join(deployDir, 'README.md'), readme);

        // 11. Optional: Create zip archive
        console.log('📦 Step 6/6: Creating deployment archive...');
        let zipPath = ''; // Declare zipPath here to ensure it's always defined

        if (archiver) {
            zipPath = path.join(releaseDir, `VIMES-HIS-deploy-${new Date().toISOString().split('T')[0]}.zip`);
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
        console.log('   1. Upload the VIMES-HIS-deploy folder to your server');
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
