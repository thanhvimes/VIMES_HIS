const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const releaseDir = path.join(rootDir, 'release');
const frontendBuildDir = path.join(rootDir, 'dist');
const backendDir = path.join(rootDir, 'backend');

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

async function startPackaging() {
    console.log('🚀 Starting VIMES HIS Packaging Process...');

    try {
        // 1. Build Frontend
        console.log('📦 Building Frontend...');
        execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });

        // 2. Prepare Release Directory
        console.log('📂 Preparing release directory...');
        removeDir(releaseDir);
        fs.mkdirSync(releaseDir);

        // 3. Package Frontend
        console.log('🎨 Packaging Frontend...');
        const releaseFrontend = path.join(releaseDir, 'frontend');
        copyDir(frontendBuildDir, releaseFrontend);

        // 4. Package Backend
        console.log('⚙️ Packaging Backend...');
        const releaseBackend = path.join(releaseDir, 'backend');
        const backendExclude = ['node_modules', '.env', 'logs', '.git'];
        copyDir(backendDir, releaseBackend, backendExclude);

        // 5. Add Deployment instructions
        const instructions = `
# HƯỚNG DẪN TRIỂN KHAI HỆ THỐNG VIMES HIS

Chúc mừng! Bạn đã đóng gói thành công hệ thống VIMES HIS. Dưới đây là hướng dẫn chi tiết để đưa hệ thống lên máy chủ (Server).

## 1. Triển khai Giao diện (Frontend)
- **Thư mục:** \`release/frontend\`
- **Cách làm:** Copy toàn bộ nội dung trong thư mục này lên máy chủ Web (Nginx, Apache hoặc các dịch vụ Hosting).
- **Lưu ý cấu hình Nginx:** Để ứng dụng React hoạt động chính xác với các đường dẫn (Router), bạn cần cấu hình Nginx trỏ mọi yêu cầu về \`index.html\`.
  \`\`\`nginx
  location / {
      try_files $uri $uri/ /index.html;
  }
  \`\`\`

## 2. Triển khai Máy chủ (Backend)
- **Thư mục:** \`release/backend\`
- **Các bước thực hiện trên Server:**
    1. Copy thư mục \`backend\` lên Server.
    2. Cài đặt các gói thư viện (chỉ cài các gói cần cho production):
       \`\`\`bash
       npm install --production
       \`\`\`
    3. Cấu hình môi trường:
       - Tạo file \`.env\` dựa trên file \`.env.example\`.
       - Cập nhật các thông số kết nối Database, Port, và mã bảo mật.
    4. Chạy hệ thống bằng **PM2** (để tự động khởi động lại và duy trì ứng dụng):
       \`\`\`bash
       pm2 start src/server.js --name vimes-his-backend
       pm2 save
       \`\`\`

## 3. Cấu hình Cơ sở dữ liệu (Database)
- **Thư mục:** \`backend/sql/\`
- **Cách làm:** Sử dụng các công cụ quản lý PostgreSQL (như pgAdmin hoặc psql) để chạy các file SQL trong thư mục này.
- **Quan trọng:** Đảm bảo bạn đã chạy file \`booking_online_database.sql\` để đồng bộ các hàm xử lý mới nhất.

## 4. Kiểm tra (Verification)
- Sau khi triển khai, hãy kiểm tra console của trình duyệt để đảm bảo không có lỗi kết nối API (CORS).
- Đảm bảo Firewall của server đã mở port tương ứng cho Backend (mặc định là 3000).
`;
        fs.writeFileSync(path.join(releaseDir, 'DEPLOY_INSTRUCTIONS.md'), instructions);

        console.log('\n✅ Packaging successfully completed!');
        console.log(`📍 Release files are in: ${releaseDir}`);

    } catch (error) {
        console.error('\n❌ Packaging failed:', error.message);
        process.exit(1);
    }
}

startPackaging();
