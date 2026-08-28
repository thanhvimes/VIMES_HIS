const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');
const releasesDir = path.join(rootDir, 'releases');

function getVersion() {
    try {
        const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
        if (pkg.version && pkg.version !== '0.0.0') return pkg.version;
        const bPkg = JSON.parse(fs.readFileSync(path.join(backendDir, 'package.json'), 'utf8'));
        if (bPkg.version) return bPkg.version;
    } catch (e) {}
    return '1.0.0';
}

function calculateSha256(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

async function main() {
    console.log('======================================================');
    console.log('       VIMES HIS - CÔNG CỤ ĐÓNG GÓI BẢN PHÁT HÀNH      ');
    console.log('======================================================\n');

    const version = getVersion();
    console.log(`📌 Phiên bản phát hành: v${version}`);

    if (!fs.existsSync(releasesDir)) {
        fs.mkdirSync(releasesDir, { recursive: true });
    }

    // 1. Build Frontend
    console.log('\n📦 [1/4] Đang biên dịch Frontend (Vite Build)...');
    execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
    console.log('✅ Frontend build hoàn tất.');

    // 2. Build Backend
    console.log('\n📦 [2/4] Đang biên dịch Backend (TypeScript Build)...');
    try {
        execSync('npx tsc', { cwd: path.join(backendDir, 'src'), stdio: 'inherit' });
    } catch (e) {
        // Fallback to backend root
        execSync('npx tsc', { cwd: backendDir, stdio: 'inherit' });
    }
    console.log('✅ Backend build hoàn tất.');

    // 3. Đóng gói vào file .tar.gz
    console.log('\n📦 [3/4] Đang đóng gói tệp tin phát hành .tar.gz...');
    const releaseArchiveName = `vimes-his-v${version}.tar.gz`;
    const releaseArchivePath = path.join(releasesDir, releaseArchiveName);

    // Tạo thư mục tạm để gom các thành phần cần release
    const stageDir = path.join(releasesDir, 'stage_temp');
    if (fs.existsSync(stageDir)) {
        fs.rmSync(stageDir, { recursive: true, force: true });
    }
    fs.mkdirSync(stageDir, { recursive: true });
    fs.mkdirSync(path.join(stageDir, 'backend'), { recursive: true });

    // Copy dist/
    if (fs.existsSync(path.join(rootDir, 'dist'))) {
        fs.cpSync(path.join(rootDir, 'dist'), path.join(stageDir, 'dist'), { recursive: true });
    }
    // Copy backend/dist
    if (fs.existsSync(path.join(backendDir, 'dist'))) {
        fs.cpSync(path.join(backendDir, 'dist'), path.join(stageDir, 'backend', 'dist'), { recursive: true });
    }
    // Copy backend/migrations
    if (fs.existsSync(path.join(backendDir, 'migrations'))) {
        fs.cpSync(path.join(backendDir, 'migrations'), path.join(stageDir, 'backend', 'migrations'), { recursive: true });
    }
    // Copy package.json
    fs.copyFileSync(path.join(rootDir, 'package.json'), path.join(stageDir, 'package.json'));
    if (fs.existsSync(path.join(backendDir, 'package.json'))) {
        fs.copyFileSync(path.join(backendDir, 'package.json'), path.join(stageDir, 'backend', 'package.json'));
    }

    // Nén thư mục stage_temp thành .tar.gz
    try {
        if (process.platform === 'win32') {
            execSync(`tar -czf "${releaseArchivePath}" -C "${stageDir}" .`, { stdio: 'inherit' });
        } else {
            execSync(`tar -czf "${releaseArchivePath}" -C "${stageDir}" .`, { stdio: 'inherit' });
        }
    } catch (tarErr) {
        console.error('Lỗi khi nén tar:', tarErr.message);
        throw tarErr;
    } finally {
        // Dọn dẹp stage_temp
        fs.rmSync(stageDir, { recursive: true, force: true });
    }

    const archiveSizeMB = (fs.statSync(releaseArchivePath).size / 1024 / 1024).toFixed(2);
    console.log(`✅ Đã tạo file nén: ${releaseArchiveName} (${archiveSizeMB} MB)`);

    // 4. Tính toán SHA-256 & Sinh file version.json
    console.log('\n📦 [4/4] Đang tính mã băm SHA-256 và sinh version.json...');
    const sha256 = calculateSha256(releaseArchivePath);

    const versionManifest = {
        version: version,
        buildDate: new Date().toISOString(),
        changelog: [
            `Bản phát hành cập nhật v${version}`,
            'Tự động đồng bộ cấu trúc cơ sở dữ liệu (Migrations)',
            'Tối ưu hóa hiệu năng và trải nghiệm người dùng'
        ],
        downloadUrl: `https://updates.vimes.vn/releases/${releaseArchiveName}`,
        sha256: sha256,
        requiredDbMigration: true
    };

    const versionJsonPath = path.join(releasesDir, 'version.json');
    fs.writeFileSync(versionJsonPath, JSON.stringify(versionManifest, null, 2), 'utf8');
    console.log('✅ Đã tạo version.json thành công.');

    console.log('\n======================================================');
    console.log('       🎉 ĐÓNG GÓI BẢN PHÁT HÀNH HOÀN TẤT!           ');
    console.log('======================================================');
    console.log(`📁 Thư mục xuất bản: ${releasesDir}`);
    console.log(`📦 Gói cập nhật   : ${releaseArchiveName} (${archiveSizeMB} MB)`);
    console.log(`🔑 Mã SHA-256     : ${sha256}`);
    console.log(`📄 Manifest       : version.json`);
    console.log('\n👉 HƯỚNG DẪN ĐƯA LÊN MÁY CHỦ CÔNG TY:');
    console.log(`1. Upload file "${releaseArchiveName}" vào thư mục releases/ trên Update Server.`);
    console.log(`2. Upload file "version.json" lên thư mục gốc của Update Server.`);
    console.log('3. Các máy trạm/máy chủ khách hàng mở Web HIS sẽ thấy thông báo cập nhật ngay lập tức!');
}

main().catch(err => {
    console.error('\n❌ Đóng gói thất bại:', err);
    process.exit(1);
});
