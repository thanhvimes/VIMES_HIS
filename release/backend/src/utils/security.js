const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Thuật toán mã hóa
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const ITERATIONS = 100000;
const KEY_LENGTH = 32;

class SecurityUtils {
    /**
     * Lấy khóa bảo mật từ biến môi trường
     * Nếu không có, cảnh báo người dùng (trong prod phải có)
     */
    static getMasterKey() {
        const key = process.env.VIMES_SECURITY_KEY || 'default-secret-vClinic-2026-key-32chars';
        if (!process.env.VIMES_SECURITY_KEY && process.env.NODE_ENV === 'production') {
            console.error('❌ CRITICAL: VIMES_SECURITY_KEY is not set in production!');
        }
        return key;
    }

    /**
     * Mã hóa chuỗi văn bản
     */
    static encrypt(text) {
        try {
            const masterKey = this.getMasterKey();
            const salt = crypto.randomBytes(SALT_LENGTH);
            const iv = crypto.randomBytes(IV_LENGTH);

            const key = crypto.pbkdf2Sync(masterKey, salt, ITERATIONS, KEY_LENGTH, 'sha512');
            const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

            const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
            const tag = cipher.getAuthTag();

            return Buffer.concat([salt, iv, tag, encrypted]).toString('hex');
        } catch (error) {
            console.error('❌ Encryption Error:', error);
            throw new Error('Encryption failed');
        }
    }

    /**
     * Giải mã chuỗi
     */
    static decrypt(cipherText) {
        try {
            const masterKey = this.getMasterKey();
            const data = Buffer.from(cipherText, 'hex');

            const salt = data.subarray(0, SALT_LENGTH);
            const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
            const tag = data.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
            const text = data.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

            const key = crypto.pbkdf2Sync(masterKey, salt, ITERATIONS, KEY_LENGTH, 'sha512');
            const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
            decipher.setAuthTag(tag);

            return decipher.update(text, 'binary', 'utf8') + decipher.final('utf8');
        } catch (error) {
            console.error('❌ Decryption Error: Check if VIMES_SECURITY_KEY is correct.');
            throw new Error('Decryption failed');
        }
    }

    /**
     * Kiểm tra xem một chuỗi có được mã hóa không (bắt đầu bằng enc:)
     */
    static isEncrypted(val) {
        return typeof val === 'string' && val.startsWith('enc:');
    }

    /**
     * Xử lý giá trị: Giải mã nếu cần
     */
    static resolveSecret(val) {
        if (this.isEncrypted(val)) {
            return this.decrypt(val.replace('enc:', ''));
        }
        return val;
    }
}

module.exports = SecurityUtils;
