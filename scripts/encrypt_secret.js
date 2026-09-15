/**
 * CLI Tool: Mã hóa mật khẩu/tài khoản Database
 * Cách dùng: node scripts/encrypt_secret.js "mat_khau_cua_ban"
 */
const security = require('../src/utils/security');

// Lấy tham số từ dòng lệnh
const secret = process.argv[2];

if (!secret) {
    console.log('\n❌ Lỗi: Thiếu nội dung cần mã hóa.');
    console.log('Sử dụng: node scripts/encrypt_secret.js "mat_khau_cua_ban"\n');
    process.exit(1);
}

try {
    const encrypted = security.encrypt(secret);

    console.log('\n' + '='.repeat(60));
    console.log('🔒 KẾT QUẢ MÃ HÓA THÀNH CÔNG');
    console.log('='.repeat(60));
    console.log('\nHãy sao chép chuỗi dưới đây vào file .env:\n');
    console.log(`enc:${encrypted}`);
    console.log('\n' + '='.repeat(60));
    console.log('⚠️ LƯU Ý: Đảm bảo bạn đã cấu hình VIMES_SECURITY_KEY trong .env');
    console.log('='.repeat(60) + '\n');

} catch (e) {
    console.error('❌ Thất bại:', e.message);
}
