import { query } from '../config/database';

interface SignatureFileObj {
    sfd_no: number;
    sfd_name: string;
}

class SignatureService {
    private normalizeName(str: string): string {
        if (!str) return '';
        return str
            .toString()
            .toLowerCase()
            .replace(/^(bsckii|bscki|ths|bs|kts|cn|kt)\.?\s*/gi, '')
            .replace(/[^a-z0-9àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệđìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/gi, '')
            .trim();
    }

    /**
     * Lấy danh sách chữ ký Base64 hàng loạt cho danh sách mã/tên bác sĩ
     * @param inputs Danh sách mã (username) hoặc họ tên bác sĩ
     * @returns Map kết quả Record<key, base64DataUrl>
     */
    async getMultipleDoctorSignatures(inputs: string[]): Promise<Record<string, string>> {
        const result: Record<string, string> = {};
        if (!inputs || inputs.length === 0) return result;

        const cleanInputs = Array.from(
            new Set(inputs.filter(u => u && typeof u === 'string' && u.trim().length > 0))
        );
        if (cleanInputs.length === 0) return result;

        try {
            // 1. Tải danh sách user bác sĩ từ sys_user và tất cả file chữ ký từ sys_filedir
            const usersRes = await query("SELECT su_userid, su_name FROM sys_user");
            const filesRes = await query("SELECT sfd_no, sfd_name FROM sys_filedir WHERE sfd_name ILIKE 'HMS_%'");

            const userMapByCode = new Map<string, string>();
            const userMapByName = new Map<string, string>();

            for (const u of usersRes.rows) {
                if (!u.su_userid) continue;
                const uid = u.su_userid.toLowerCase().trim();
                userMapByCode.set(uid, uid);
                
                if (u.su_name) {
                    const normName = this.normalizeName(u.su_name);
                    if (normName) {
                        userMapByName.set(normName, uid);
                    }
                }
            }

            // Map file theo userid được trích xuất từ sfd_name
            const fileByUserId = new Map<string, SignatureFileObj>();
            for (const f of filesRes.rows) {
                if (!f.sfd_name) continue;
                // Chuẩn hóa tên file: HMS_PATUAN.jpg. -> PATUAN
                const cleanedName = f.sfd_name.replace(/\.+$/, '');
                const match = cleanedName.match(/^HMS_(.+)\.jpg$/i) || cleanedName.match(/^HMS_(.+)$/i);
                if (match && match[1]) {
                    const fileUser = match[1].toLowerCase().trim();
                    fileByUserId.set(fileUser, f);
                    // Nếu kết thúc bằng 'ky' (ví dụ patuanky), lưu thêm bản không có 'ky'
                    if (fileUser.endsWith('ky') && fileUser.length > 2) {
                        fileByUserId.set(fileUser.slice(0, -2), f);
                    }
                }
            }

            // 2. Với mỗi input, tìm userid tương ứng và nạp chữ ký
            for (const rawInput of cleanInputs) {
                const inputStr = rawInput.trim();
                const inputKeyUpper = inputStr.toUpperCase();
                const normInput = this.normalizeName(inputStr);

                let targetUserId: string | null = null;

                // Thử khớp mã trực tiếp
                if (userMapByCode.has(inputStr.toLowerCase())) {
                    targetUserId = userMapByCode.get(inputStr.toLowerCase())!;
                }
                // Thử khớp theo tên đã chuẩn hóa
                else if (userMapByName.has(normInput)) {
                    targetUserId = userMapByName.get(normInput)!;
                }
                // Thử tìm khớp mờ theo tên
                else {
                    for (const [normName, uid] of userMapByName.entries()) {
                        if (normName && (normName.includes(normInput) || normInput.includes(normName))) {
                            targetUserId = uid;
                            break;
                        }
                    }
                }

                // Nếu nhập trực tiếp là mã file HMS (ví dụ HMS_PATUAN.JPG)
                if (!targetUserId && inputStr.toLowerCase().startsWith('hms_')) {
                    const match = inputStr.replace(/\.+$/, '').match(/^HMS_(.+)\.jpg$/i) || inputStr.match(/^HMS_(.+)$/i);
                    if (match && match[1]) {
                        targetUserId = match[1].toLowerCase();
                    }
                }

                // Nếu vẫn chưa có targetUserId, dùng trực tiếp inputStr như userid
                if (!targetUserId) {
                    targetUserId = inputStr.toLowerCase();
                }

                // 3. Tìm file chữ ký phù hợp với targetUserId
                let fileObj = fileByUserId.get(targetUserId);
                if (!fileObj) {
                    for (const [fUser, fObj] of fileByUserId.entries()) {
                        if (fUser.includes(targetUserId) || targetUserId.includes(fUser)) {
                            fileObj = fObj;
                            break;
                        }
                    }
                }

                // 4. Đọc chuỗi Base64 qua lo_get(sfd_no) hoặc sfd_data
                if (fileObj) {
                    try {
                        let base64Str: string | null = null;
                        if (fileObj.sfd_no && fileObj.sfd_no > 0) {
                            const loRes = await query("SELECT encode(lo_get($1::oid), 'base64') as img", [fileObj.sfd_no]);
                            if (loRes.rows.length > 0 && loRes.rows[0].img) {
                                base64Str = loRes.rows[0].img.replace(/\s+/g, '');
                            }
                        }

                        if (!base64Str) {
                            const dataRes = await query("SELECT encode(sfd_data::bytea, 'base64') as img FROM sys_filedir WHERE sfd_no = $1", [fileObj.sfd_no]);
                            if (dataRes.rows.length > 0 && dataRes.rows[0].img) {
                                base64Str = dataRes.rows[0].img.replace(/\s+/g, '');
                            }
                        }

                        if (base64Str) {
                            const dataUrl = `data:image/jpeg;base64,${base64Str}`;
                            result[inputKeyUpper] = dataUrl;
                            result[targetUserId.toUpperCase()] = dataUrl;
                        }
                    } catch (e: any) {
                        console.error(`[SignatureService] Lỗi đọc chữ ký cho file sfd_no ${fileObj.sfd_no}:`, e.message);
                    }
                }
            }
        } catch (error: any) {
            console.error(`[SignatureService] Lỗi lấy danh sách chữ ký:`, error);
        }

        return result;
    }

    /**
     * Lấy hình ảnh chữ ký điện tử Base64 của 1 bác sĩ
     */
    async getDoctorSignature(username: string): Promise<string | null> {
        if (!username || !username.trim()) return null;
        const res = await this.getMultipleDoctorSignatures([username]);
        return res[username.trim().toUpperCase()] || res[Object.keys(res)[0]] || null;
    }

    /**
     * Lưu hoặc cập nhật chữ ký điện tử của bác sĩ vào bảng sys_filedir (theo chuẩn Large Object của HIS)
     * @param userId Mã tài khoản / username của bác sĩ (ví dụ: 'PATUAN')
     * @param base64OrDataUrl Chuỗi base64 hoặc Data URL (data:image/jpeg;base64,...)
     * @param desc Mô tả chữ ký (tùy chọn)
     */
    async saveDoctorSignature(userId: string, base64OrDataUrl: string, desc?: string): Promise<{ success: boolean; sfd_no?: number; message?: string }> {
        if (!userId || !userId.trim()) {
            throw new Error('Thiếu mã người dùng (userId)');
        }
        if (!base64OrDataUrl || !base64OrDataUrl.trim()) {
            throw new Error('Thiếu dữ liệu ảnh chữ ký (base64)');
        }

        const cleanUserId = userId.trim().toUpperCase();
        const fileName = `HMS_${cleanUserId}.jpg`;
        const cleanBase64 = base64OrDataUrl.replace(/^data:image\/\w+;base64,/, '').replace(/\s+/g, '');
        const imageBuffer = Buffer.from(cleanBase64, 'base64');
        const fileSize = imageBuffer.length;

        // Giới hạn dung lượng tối đa 500 KB
        const MAX_FILE_SIZE = 500 * 1024;
        if (fileSize > MAX_FILE_SIZE) {
            const sizeKB = (fileSize / 1024).toFixed(1);
            throw new Error(`Dung lượng ảnh chữ ký quá lớn (${sizeKB} KB). Giới hạn tối đa là 500 KB.`);
        }

        const fileDesc = desc || `Chữ ký điện tử BS ${cleanUserId}`;

        try {
            // Kiểm tra xem đã có bản ghi trong sys_filedir chưa
            const existingRes = await query(
                "SELECT sfd_no FROM sys_filedir WHERE sfd_name ILIKE $1 OR sfd_name ILIKE $2 LIMIT 1",
                [fileName, `HMS_${cleanUserId}%`]
            );

            let sfdNo: number;

            // Tạo Large Object mới từ bytea
            const loRes = await query("SELECT lo_from_bytea(0, decode($1, 'base64')) as new_oid", [cleanBase64]);
            sfdNo = parseInt(loRes.rows[0].new_oid, 10);

            if (existingRes.rows.length > 0) {
                const oldNo = existingRes.rows[0].sfd_no;
                if (oldNo && oldNo !== sfdNo) {
                    try { await query("SELECT lo_unlink($1::oid)", [oldNo]); } catch (e) {}
                }
                // Cập nhật bản ghi hiện tại
                await query(
                    `UPDATE sys_filedir 
                     SET sfd_no = $1, sfd_name = $2, sfd_desc = $3, sfd_size = $4 
                     WHERE sfd_name ILIKE $5`,
                    [sfdNo, fileName, fileDesc, fileSize, `HMS_${cleanUserId}%`]
                );
                return { success: true, sfd_no: sfdNo, message: `Đã cập nhật chữ ký cho bác sĩ ${cleanUserId}` };
            } else {
                await query(
                    `INSERT INTO sys_filedir (sfd_no, sfd_name, sfd_desc, sfd_size) 
                     VALUES ($1, $2, $3, $4)`,
                    [sfdNo, fileName, fileDesc, fileSize]
                );
                return { success: true, sfd_no: sfdNo, message: `Đã thêm mới chữ ký cho bác sĩ ${cleanUserId}` };
            }
        } catch (error: any) {
            console.error(`[SignatureService] Lỗi khi lưu chữ ký cho ${cleanUserId}:`, error);
            throw error;
        }
    }
}

export default new SignatureService();
