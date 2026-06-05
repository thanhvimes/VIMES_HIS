// ==================== PORTAL AUTH CONTROLLER ====================
// File: backend/src/controllers/portal/auth.controller.ts

import { Request, Response } from 'express';
import { query } from '../../config/database';
import { sign } from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export interface PortalProfile {
    id: string;
    name: string;
    gender: string;
    birthDate: string;
    relationship?: string;
    is_primary: boolean;
}

class PortalAuthController {
    /**
     * Activate Account (CCCD + SĐT -> Set Password)
     * No SMS cost for first-time setup
     */
    async activateAccount(req: Request, res: Response) {
        try {
            const { phone, idCard, password } = (req as any).body;

            if (!phone || !idCard || !password) {
                return res.status(400).json({ error: 'Vui lòng nhập đầy đủ Số điện thoại, Số CCCD và Mật khẩu' });
            }

            // Validate CCCD format (12 digits only)
            const cccdRegex = /^\d{12}$/;
            if (!cccdRegex.test(idCard)) {
                return res.status(400).json({ error: 'Số CCCD phải có đúng 12 chữ số' });
            }

            // 1. Check if patient exists in HIS with matching CCCD (hp_sin)
            const hisResult = await query(`
                SELECT hp_patientno,
                       TRIM(COALESCE(hp_surname, '') || ' ' || COALESCE(hp_midname, '') || ' ' || COALESCE(hp_firstname, '')) as full_name
                FROM hms_patient 
                WHERE hp_sin = $1
            `, [idCard]);

            if (hisResult.rows.length === 0) {
                return res.status(404).json({ error: 'Không tìm thấy bệnh nhân với số CCCD này trong hệ thống' });
            }

            const hisPatient = hisResult.rows[0];
            const patientNo = hisPatient.hp_patientno;

            // 2. Verify phone matches from latest visit (hd_telephone in hms_doc)
            const phoneCheck = await query(`
                SELECT hd_telephone
                FROM hms_doc
                WHERE hd_patientno::text = $1
                ORDER BY hd_admitdate DESC
                LIMIT 1
            `, [patientNo]);

            // Verify phone if available in HIS
            if (phoneCheck.rows.length > 0 && phoneCheck.rows[0].hd_telephone) {
                const dbPhone = (phoneCheck.rows[0].hd_telephone || '').replace(/\s/g, '');
                const inputPhone = (phone as string).replace(/\s/g, '');

                // Flexible matching - last 7 digits
                if (dbPhone && !dbPhone.includes(inputPhone.slice(-7)) && !inputPhone.includes(dbPhone.slice(-7))) {
                    return res.status(401).json({ error: 'Số điện thoại không khớp với hồ sơ đã đăng ký' });
                }
            }

            // 3. Hash password
            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(password, saltRounds);

            // 4. Create or Update Account
            let accountId: number;
            const normalizedPhone = (phone as string).replace(/\s/g, '');
            const existingAccount = await query('SELECT id FROM portal_accounts WHERE phone = $1', [normalizedPhone]);

            if (existingAccount.rows.length > 0) {
                accountId = existingAccount.rows[0].id;
                await query('UPDATE portal_accounts SET password_hash = $1 WHERE id = $2', [passwordHash, accountId]);
            } else {
                const newAccount = await query(
                    'INSERT INTO portal_accounts (phone, password_hash) VALUES ($1, $2) RETURNING id',
                    [normalizedPhone, passwordHash]
                );
                accountId = newAccount.rows[0].id;
            }

            // 5. Create or Update Profile with CCCD
            await query(`
                INSERT INTO portal_patient_profiles (account_id, patient_no, id_card, phone, is_primary)
                VALUES ($1, $2, $3, $4, TRUE)
                ON CONFLICT (account_id, patient_no) 
                DO UPDATE SET id_card = EXCLUDED.id_card, phone = EXCLUDED.phone
            `, [accountId, patientNo, idCard, normalizedPhone]);

            // 6. Also maintain backward compatibility with portal_patient_links if it exists
            try {
                await query(`
                    INSERT INTO portal_patient_links (account_id, patient_no, is_primary)
                    VALUES ($1, $2, TRUE)
                    ON CONFLICT (account_id, patient_no) DO NOTHING
                `, [accountId, patientNo]);
            } catch (err) {
                console.log('ℹ️ portal_patient_links table not found, skipping...');
            }

            return res.json({
                success: true,
                message: `Kích hoạt tài khoản thành công cho ${hisPatient.full_name}. Bây giờ bạn có thể đăng nhập.`
            });

        } catch (error) {
            console.error('❌ Portal Activation Error:', error);
            return res.status(500).json({ error: 'Lỗi hệ thống khi kích hoạt tài khoản' });
        }
    }

    /**
     * Patient Login (Phone + Password)
     */
    async login(req: Request, res: Response) {
        try {
            const { phone, password } = (req as any).body;

            if (!phone || !password) {
                return res.status(400).json({ error: 'Vui lòng nhập số điện thoại và mật khẩu' });
            }

            const normalizedPhone = (phone as string).replace(/\s/g, '');
            const accountResult = await query('SELECT id, password_hash FROM portal_accounts WHERE phone = $1', [normalizedPhone]);

            if (accountResult.rows.length === 0) {
                return res.status(401).json({ error: 'Tài khoản chưa được kích hoạt hoặc sai thông tin' });
            }

            const account = accountResult.rows[0];
            const isMatch = await bcrypt.compare(password, account.password_hash);

            if (!isMatch) {
                return res.status(401).json({ error: 'Mật khẩu không chính xác' });
            }

            // Get linked profiles
            const links = await query(`
                SELECT 
                    l.patient_no as "id",
                    TRIM(COALESCE(p.hp_surname, '') || ' ' || COALESCE(p.hp_midname, '') || ' ' || COALESCE(p.hp_firstname, '')) as "name",
                    p.hp_sex as "gender",
                    TO_CHAR(p.hp_birthdate, 'DD/MM/YYYY') as "birthDate",
                    l.relationship,
                    l.is_primary
                FROM portal_patient_links l
                JOIN hms_patient p ON l.patient_no = p.hp_patientno::text
                WHERE l.account_id = $1
                ORDER BY l.is_primary DESC, l.linked_at ASC
            `, [account.id]);

            if (links.rows.length === 0) {
                return res.status(500).json({ error: 'Tài khoản chưa được liên kết với hồ sơ bệnh nhân' });
            }

            const token = sign(
                { userId: account.id, phone: normalizedPhone, role: 'PORTAL_USER' },
                process.env.JWT_SECRET || 'vimes_portal_secret_key',
                { expiresIn: '24h' as any }
            );

            return res.json({
                success: true,
                token,
                profiles: links.rows as PortalProfile[],
                selectedProfile: links.rows[0] as PortalProfile
            });

        } catch (error) {
            console.error('❌ Portal Login Error:', error);
            return res.status(500).json({ error: 'Lỗi hệ thống khi đăng nhập' });
        }
    }
}

export default new PortalAuthController();
