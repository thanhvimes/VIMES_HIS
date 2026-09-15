// ==================== PORTAL PROFILE CONTROLLER ====================
// File: backend/src/controllers/portal/profile.controller.ts

import { Response } from 'express';
import { query } from '../../config/database';
import { AuthRequest } from '../../middleware/authMiddleware';

export interface PatientProfileUpdate {
    phone?: string;
    id_card?: string;
    id_card_issue_date?: string;
    province_code?: string;
    district_code?: string;
    address_detail?: string;
    ethnicity?: string;
    occupation?: string;
    email?: string;
}

class PortalProfileController {
    /**
     * Link Profile (PID + Birthday)
     */
    async linkProfile(req: AuthRequest, res: Response) {
        try {
            const { patientNo, birthDate, relationship } = (req as any).body;
            const accountId = req.userId;

            if (!patientNo || !birthDate) {
                return res.status(400).json({ error: 'Vui lòng nhập đầy đủ Mã bệnh nhân và Ngày sinh' });
            }

            // 1. Verify patient in HIS
            const hisResult = await query(`
                SELECT 
                    hp_patientno, 
                    to_char(hp_birthdate, 'DD/MM/YYYY') as "dob",
                    (COALESCE(hp_surname, '') || ' ' || COALESCE(hp_midname, '') || ' ' || COALESCE(hp_firstname, '')) as "name",
                    hp_sex as "gender"
                FROM hms_patient 
                WHERE hp_patientno::text = $1
            `, [patientNo]);

            if (hisResult.rows.length === 0) {
                return res.status(404).json({ error: 'Không tìm thấy hồ sơ bệnh nhân' });
            }

            const hisPatient = hisResult.rows[0];

            // Format check
            let formattedInputDate = birthDate as string;
            if (formattedInputDate.includes('-')) {
                const [y, m, d] = formattedInputDate.split('-');
                formattedInputDate = `${d}/${m}/${y}`;
            }

            if (hisPatient.dob !== formattedInputDate) {
                return res.status(400).json({ error: 'Ngày sinh không chính xác cho mã bệnh nhân này' });
            }

            // 2. Link to account
            await query(`
                INSERT INTO portal_patient_links (account_id, patient_no, relationship, is_primary)
                VALUES ($1, $2, $3, FALSE)
                ON CONFLICT (account_id, patient_no) DO UPDATE 
                SET relationship = EXCLUDED.relationship
            `, [accountId, patientNo, relationship || 'Khác']);

            return res.json({
                success: true,
                message: 'Liên kết hồ sơ thành công',
                profile: {
                    id: hisPatient.hp_patientno,
                    name: hisPatient.name,
                    gender: hisPatient.gender,
                    birthDate: hisPatient.dob,
                    relationship: relationship || 'Khác'
                }
            });

        } catch (error) {
            console.error('❌ Portal Link Error:', error);
            return res.status(500).json({ error: 'Lỗi hệ thống khi liên kết hồ sơ' });
        }
    }

    /**
     * Get all linked patient profiles for current user
     */
    async getProfiles(req: AuthRequest, res: Response) {
        try {
            const accountId = req.userId;

            const result = await query(`
                SELECT 
                    pp.id,
                    pp.patient_no,
                    pp.phone,
                    pp.id_card,
                    pp.id_card_issue_date,
                    pp.province_code,
                    pp.district_code,
                    pp.address_detail,
                    pp.relationship,
                    pp.is_primary,
                    TRIM(COALESCE(hp.hp_surname, '') || ' ' || COALESCE(hp.hp_midname, '') || ' ' || COALESCE(hp.hp_firstname, '')) as name,
                    hp.hp_sex as gender,
                    TO_CHAR(hp.hp_birthdate, 'DD/MM/YYYY') as birth_date
                FROM portal_patient_profiles pp
                LEFT JOIN hms_patient hp ON pp.patient_no = hp.hp_patientno::text
                WHERE pp.account_id = $1
                ORDER BY pp.is_primary DESC, pp.created_at ASC
            `, [accountId]);

            return res.json({ success: true, profiles: result.rows });

        } catch (error) {
            console.error('❌ Get Profiles Error:', error);
            return res.status(500).json({ error: 'Lỗi khi lấy danh sách hồ sơ' });
        }
    }

    /**
     * Create/Link new patient profile
     */
    async createProfile(req: AuthRequest, res: Response) {
        try {
            const accountId = req.userId;
            const { patient_no, birthdate, relationship = 'Bản thân' } = (req as any).body;

            if (!patient_no || !birthdate) {
                return res.status(400).json({ error: 'Vui lòng nhập Mã bệnh nhân và Ngày sinh' });
            }

            // Verify HIS
            const hisCheck = await query(`
                SELECT hp_patientno, hp_birthdate
                FROM hms_patient
                WHERE hp_patientno::text = $1
            `, [patient_no]);

            if (hisCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Không tìm thấy mã bệnh nhân trong hệ thống HIS' });
            }

            // ... (Logic remains identical, just with TS safety)
            const profileCount = await query(`
                SELECT COUNT(*) as count FROM portal_patient_profiles WHERE account_id = $1
            `, [accountId]);

            const isPrimary = profileCount.rows[0].count === '0';

            const insertResult = await query(`
                INSERT INTO portal_patient_profiles 
                (account_id, patient_no, relationship, is_primary)
                VALUES ($1, $2, $3, $4)
                RETURNING id
            `, [accountId, patient_no, relationship, isPrimary]);

            return res.json({
                success: true,
                message: 'Liên kết hồ sơ thành công',
                profileId: insertResult.rows[0].id
            });

        } catch (error) {
            console.error('❌ Create Profile Error:', error);
            return res.status(500).json({ error: 'Lỗi khi tạo hồ sơ' });
        }
    }

    /**
     * Update patient profile extended information
     */
    async updateProfile(req: AuthRequest, res: Response) {
        try {
            const accountId = req.userId;
            const profileId = (req as any).params.id;
            const data: PatientProfileUpdate = (req as any).body;

            const ownerCheck = await query(`
                SELECT id FROM portal_patient_profiles
                WHERE id = $1 AND account_id = $2
            `, [profileId, accountId]);

            if (ownerCheck.rows.length === 0) {
                return res.status(403).json({ error: 'Không có quyền cập nhật hồ sơ này' });
            }

            await query(`
                UPDATE portal_patient_profiles
                SET 
                    phone = COALESCE($1, phone),
                    id_card = COALESCE($2, id_card),
                    id_card_issue_date = COALESCE($3, id_card_issue_date),
                    province_code = COALESCE($4, province_code),
                    district_code = COALESCE($5, district_code),
                    address_detail = COALESCE($6, address_detail),
                    ethnicity = COALESCE($7, ethnicity),
                    occupation = COALESCE($8, occupation),
                    email = COALESCE($9, email),
                    updated_at = NOW()
                WHERE id = $10
            `, [data.phone, data.id_card, data.id_card_issue_date, data.province_code, data.district_code, data.address_detail, data.ethnicity, data.occupation, data.email, profileId]);

            return res.json({ success: true, message: 'Cập nhật hồ sơ thành công' });

        } catch (error) {
            console.error('❌ Update Profile Error:', error);
            return res.status(500).json({ error: 'Lỗi khi cập nhật hồ sơ' });
        }
    }

    /**
     * Delete patient profile link
     */
    async deleteProfile(req: AuthRequest, res: Response) {
        try {
            const accountId = req.userId;
            const profileId = (req as any).params.id;

            const profileCheck = await query(`
                SELECT is_primary FROM portal_patient_profiles
                WHERE id = $1 AND account_id = $2
            `, [profileId, accountId]);

            if (profileCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Không tìm thấy hồ sơ' });
            }

            if (profileCheck.rows[0].is_primary) {
                return res.status(403).json({ error: 'Không thể xóa hồ sơ chính' });
            }

            await query(`
                DELETE FROM portal_patient_profiles
                WHERE id = $1 AND account_id = $2
            `, [profileId, accountId]);

            return res.json({ success: true, message: 'Xóa hồ sơ thành công' });

        } catch (error) {
            console.error('❌ Delete Profile Error:', error);
            return res.status(500).json({ error: 'Lỗi khi xóa hồ sơ' });
        }
    }
}

export default new PortalProfileController();
