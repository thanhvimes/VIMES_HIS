import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load .env robustly from multiple fallback locations
const envPath = fs.existsSync(path.join(__dirname, '../../.env'))
    ? path.join(__dirname, '../../.env')
    : fs.existsSync(path.join(process.cwd(), '.env'))
        ? path.join(process.cwd(), '.env')
        : fs.existsSync(path.join(process.cwd(), 'backend', '.env'))
            ? path.join(process.cwd(), 'backend', '.env')
            : null;

if (envPath) {
    dotenv.config({ path: envPath });
} else {
    dotenv.config();
}

// Encryption configuration constants
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const ITERATIONS = 100000;
const KEY_LENGTH = 32;

/**
 * Utility class for handling security operations such as encryption and decryption
 * within the VIMES HIS backend ecosystem.
 */
class SecurityUtils {
    /**
     * Retrieves the master security key from environment variables.
     * @returns The master key for generating cryptographic keys.
     */
    static getMasterKey(): string {
        const key = process.env.VIMES_SECURITY_KEY || 'default-secret-vClinic-2026-key-32chars';
        if (!process.env.VIMES_SECURITY_KEY && process.env.NODE_ENV === 'production') {
            console.error('❌ CRITICAL: VIMES_SECURITY_KEY is not set in production!');
        }
        return key;
    }

    /**
     * Encrypts a plain text string using AES-256-GCM.
     * @param text The plain text to encrypt.
     * @returns The encrypted data in hex format, including salt, IV, and auth tag.
     */
    static encrypt(text: string): string {
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
     * Decrypts a hex-encoded string previously encrypted by the encrypt method.
     * @param cipherText The hex-encoded encrypted data.
     * @returns The decrypted plain text string.
     */
    static decrypt(cipherText: string): string {
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

            return decipher.update(text, 'binary' as any, 'utf8') + decipher.final('utf8');
        } catch (error) {
            console.error('❌ Decryption Error: Check if VIMES_SECURITY_KEY is correct.');
            throw new Error('Decryption failed');
        }
    }

    /**
     * Checks if a given value is encrypted based on a specific prefix.
     * @param val The value to check.
     * @returns True if the value starts with the encryption prefix 'enc:'.
     */
    static isEncrypted(val: any): val is string {
        return typeof val === 'string' && val.startsWith('enc:');
    }

    /**
     * Resolves a potentially encrypted secret value.
     * @param val The value to resolve.
     * @returns The decrypted string if it was encrypted, otherwise the original value.
     */
    static resolveSecret(val: any): string {
        if (this.isEncrypted(val)) {
            return this.decrypt((val as string).replace('enc:', ''));
        }
        return String(val || '');
    }
}

export default SecurityUtils;
