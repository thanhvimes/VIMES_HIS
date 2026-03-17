// ==================== AUTH CONTROLLER ====================
// File: backend/src/controllers/auth.controller.ts

import { Request, Response } from 'express';
import { query } from '../config/db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { UserInfo, ModulePermissions } from '../types/user.types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

export class AuthController {

    // Đăng nhập
    async login(req: Request, res: Response) {
        try {
            const { userId, password } = req.body;

            if (!userId || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu tên đăng nhập hoặc mật khẩu'
                });
            }

            // Lấy thông tin user từ database
            const result = await query(`
                SELECT 
                    su_userid, su_name, su_password, su_groupid, su_deptid, su_roomid,
                    su_hms_xdept, su_hms_xroom, su_tel, su_certificate, su_position, su_title,
                    su_isactive,
                    -- HMS Modules
                    su_hms_rmmodule, su_hms_emmodule, su_hms_tmmodule, su_hms_usmodule,
                    su_hms_pamodule, su_hms_esmodule, su_hms_hfmodule, su_hms_pmmodule,
                    su_hms_opmodule, su_hms_crmodule, su_hms_sysmodule, su_hms_labmodule,
                    su_hms_mmmodule, su_hms_smmodule, su_hms_armodule, su_hms_mamodule,
                    su_hms_bbmodule, su_hms_prmodule, su_hms_fammodule, su_hms_sipmodule,
                    su_hms_stmodule, su_hms_srmmodule, su_hms_mramodule, su_hms_cmmodule,
                    su_hms_emrmodule, su_hms_hmmodule, su_hms_tramodule, su_hms_inmodule,
                    su_hms_nmmodule, su_hms_tmvmodule, su_hms_dsmmodule, su_hms_itsmodule,
                    -- ERP Modules
                    su_erp_famodule, su_erp_hrmodule, su_erp_apmodule, su_erp_armodule,
                    su_erp_glmodule, su_erp_pomodule, su_erp_somodule, su_erp_simodule,
                    su_erp_bilmodule
                FROM sys_user
                WHERE su_userid = $1
            `, [userId]);

            if (result.rows.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'Tên đăng nhập không tồn tại'
                });
            }

            const user = result.rows[0];

            // Kiểm tra tài khoản có active không
            if (user.su_isactive !== 'Y') {
                return res.status(401).json({
                    success: false,
                    message: 'Tài khoản đã bị khóa'
                });
            }

            // Verify password
            // Note: Nếu password trong DB đã được hash bằng bcrypt, dùng bcrypt.compare
            // Nếu chưa hash, so sánh trực tiếp (không an toàn, chỉ dùng cho dev)
            const isPasswordValid = await this.verifyPassword(password, user.su_password);

            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Mật khẩu không đúng'
                });
            }

            // Parse xDept (format: 'NOI,KB,KBTN' -> ['NOI', 'KB', 'KBTN'])
            const xDept = user.su_hms_xdept ? user.su_hms_xdept.split(',').map((d: string) => d.trim()) : [];

            // Build module permissions
            const modules: ModulePermissions = {
                rm: user.su_hms_rmmodule === '1',
                em: user.su_hms_emmodule === '1',
                tm: user.su_hms_tmmodule === '1',
                us: user.su_hms_usmodule === '1',
                pa: user.su_hms_pamodule === '1',
                es: user.su_hms_esmodule === '1',
                hf: user.su_hms_hfmodule === '1',
                pm: user.su_hms_pmmodule === '1',
                op: user.su_hms_opmodule === '1',
                cr: user.su_hms_crmodule === '1',
                sys: user.su_hms_sysmodule === '1',
                lab: user.su_hms_labmodule === '1',
                mm: user.su_hms_mmmodule === '1',
                sm: user.su_hms_smmodule === '1',
                ar: user.su_hms_armodule === '1',
                ma: user.su_hms_mamodule === '1',
                bb: user.su_hms_bbmodule === '1',
                pr: user.su_hms_prmodule === '1',
                fam: user.su_hms_fammodule === '1',
                sip: user.su_hms_sipmodule === '1',
                st: user.su_hms_stmodule === '1',
                srm: user.su_hms_srmmodule === '1',
                mra: user.su_hms_mramodule === '1',
                cm: user.su_hms_cmmodule === '1',
                emr: user.su_hms_emrmodule === '1',
                hm: user.su_hms_hmmodule === '1',
                tra: user.su_hms_tramodule === '1',
                in: user.su_hms_inmodule === '1',
                nm: user.su_hms_nmmodule === '1',
                tmv: user.su_hms_tmvmodule === '1',
                dsm: user.su_hms_dsmmodule === '1',
                its: user.su_hms_itsmodule === '1',
                fa: user.su_erp_famodule === '1',
                hr: user.su_erp_hrmodule === '1',
                ap: user.su_erp_apmodule === '1',
                erp_ar: user.su_erp_armodule === '1',
                gl: user.su_erp_glmodule === '1',
                po: user.su_erp_pomodule === '1',
                so: user.su_erp_somodule === '1',
                si: user.su_erp_simodule === '1',
                bil: user.su_erp_bilmodule === '1'
            };

            // Build UserInfo object
            const userInfo: UserInfo = {
                userId: user.su_userid,
                name: user.su_name,
                groupId: user.su_groupid,
                deptId: user.su_deptid,
                roomId: user.su_roomid,
                xDept: xDept,
                xRoom: user.su_hms_xroom || '',
                phone: user.su_tel,
                certificate: user.su_certificate,
                position: user.su_position,
                title: user.su_title,
                modules: modules,
                isActive: user.su_isactive === 'Y'
            };

            // Generate JWT token
            const token = jwt.sign(
                {
                    userId: userInfo.userId,
                    groupId: userInfo.groupId,
                    deptId: userInfo.deptId
                },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );

            res.json({
                success: true,
                token: token,
                user: userInfo,
                message: 'Đăng nhập thành công'
            });

        } catch (error: any) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi hệ thống: ' + error.message
            });
        }
    }

    // Verify password (hỗ trợ cả plain text và bcrypt)
    private async verifyPassword(inputPassword: string, storedPassword: string): Promise<boolean> {
        // Kiểm tra xem password có được hash bằng bcrypt không
        if (storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2a$')) {
            // Password đã được hash bằng bcrypt
            return await bcrypt.compare(inputPassword, storedPassword);
        } else {
            // Plain text password (không an toàn, chỉ dùng cho dev/testing)
            return inputPassword === storedPassword;
        }
    }

    // Lấy thông tin user hiện tại (từ token)
    async getCurrentUser(req: Request, res: Response) {
        try {
            // userId được gắn vào req bởi authMiddleware
            const userId = (req as any).userId;

            const result = await query(`
                SELECT 
                    su_userid, su_name, su_groupid, su_deptid, su_roomid,
                    su_hms_xdept, su_hms_xroom, su_tel, su_certificate, su_position, su_title,
                    su_isactive,
                    -- HMS Modules
                    su_hms_rmmodule, su_hms_emmodule, su_hms_tmmodule, su_hms_usmodule,
                    su_hms_pamodule, su_hms_esmodule, su_hms_hfmodule, su_hms_pmmodule,
                    su_hms_opmodule, su_hms_crmodule, su_hms_sysmodule, su_hms_labmodule,
                    su_hms_mmmodule, su_hms_smmodule, su_hms_armodule, su_hms_mamodule,
                    su_hms_bbmodule, su_hms_prmodule, su_hms_fammodule, su_hms_sipmodule,
                    su_hms_stmodule, su_hms_srmmodule, su_hms_mramodule, su_hms_cmmodule,
                    su_hms_emrmodule, su_hms_hmmodule, su_hms_tramodule, su_hms_inmodule,
                    su_hms_nmmodule, su_hms_tmvmodule, su_hms_dsmmodule, su_hms_itsmodule,
                    -- ERP Modules
                    su_erp_famodule, su_erp_hrmodule, su_erp_apmodule, su_erp_armodule,
                    su_erp_glmodule, su_erp_pomodule, su_erp_somodule, su_erp_simodule,
                    su_erp_bilmodule
                FROM sys_user
                WHERE su_userid = $1 AND su_isactive = 'Y'
            `, [userId]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User không tồn tại'
                });
            }

            const user = result.rows[0];
            const xDept = user.su_hms_xdept ? user.su_hms_xdept.split(',').map((d: string) => d.trim()) : [];

            // Build module permissions (same as login)
            const modules: ModulePermissions = {
                rm: user.su_hms_rmmodule === '1',
                em: user.su_hms_emmodule === '1',
                tm: user.su_hms_tmmodule === '1',
                us: user.su_hms_usmodule === '1',
                pa: user.su_hms_pamodule === '1',
                es: user.su_hms_esmodule === '1',
                hf: user.su_hms_hfmodule === '1',
                pm: user.su_hms_pmmodule === '1',
                op: user.su_hms_opmodule === '1',
                cr: user.su_hms_crmodule === '1',
                sys: user.su_hms_sysmodule === '1',
                lab: user.su_hms_labmodule === '1',
                mm: user.su_hms_mmmodule === '1',
                sm: user.su_hms_smmodule === '1',
                ar: user.su_hms_armodule === '1',
                ma: user.su_hms_mamodule === '1',
                bb: user.su_hms_bbmodule === '1',
                pr: user.su_hms_prmodule === '1',
                fam: user.su_hms_fammodule === '1',
                sip: user.su_hms_sipmodule === '1',
                st: user.su_hms_stmodule === '1',
                srm: user.su_hms_srmmodule === '1',
                mra: user.su_hms_mramodule === '1',
                cm: user.su_hms_cmmodule === '1',
                emr: user.su_hms_emrmodule === '1',
                hm: user.su_hms_hmmodule === '1',
                tra: user.su_hms_tramodule === '1',
                in: user.su_hms_inmodule === '1',
                nm: user.su_hms_nmmodule === '1',
                tmv: user.su_hms_tmvmodule === '1',
                dsm: user.su_hms_dsmmodule === '1',
                its: user.su_hms_itsmodule === '1',
                fa: user.su_erp_famodule === '1',
                hr: user.su_erp_hrmodule === '1',
                ap: user.su_erp_apmodule === '1',
                erp_ar: user.su_erp_armodule === '1',
                gl: user.su_erp_glmodule === '1',
                po: user.su_erp_pomodule === '1',
                so: user.su_erp_somodule === '1',
                si: user.su_erp_simodule === '1',
                bil: user.su_erp_bilmodule === '1'
            };

            const userInfo: UserInfo = {
                userId: user.su_userid,
                name: user.su_name,
                groupId: user.su_groupid,
                deptId: user.su_deptid,
                roomId: user.su_roomid,
                xDept: xDept,
                xRoom: user.su_hms_xroom || '',
                phone: user.su_tel,
                certificate: user.su_certificate,
                position: user.su_position,
                title: user.su_title,
                modules: modules,
                isActive: user.su_isactive === 'Y'
            };

            res.json({
                success: true,
                user: userInfo
            });

        } catch (error: any) {
            console.error('Get current user error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi hệ thống: ' + error.message
            });
        }
    }

    // Đăng xuất
    async logout(req: Request, res: Response) {
        // Với JWT, logout chỉ cần client xóa token
        // Server có thể implement blacklist nếu cần
        res.json({
            success: true,
            message: 'Đăng xuất thành công'
        });
    }
}
