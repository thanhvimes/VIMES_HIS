import { Request, Response } from 'express';
import { query } from '../../config/database';
import { calculateAge } from '../../services/health-check-classifier.service';

export class EmployeesController {
    // Lấy danh sách nhân viên trong hợp đồng
    async getContractEmployees(req: Request, res: Response) {
        const { id } = req.params;
        const contractId = parseInt(id as string, 10);
        try {
            const result = await query(`
                SELECT 
                    e.hee_employee_id as id,
                    e.hee_id as code,
                    trim(e.hee_surname||' '||e.hee_midname||' '||e.hee_firstname) as name,
                    e.hee_surname as surname,
                    e.hee_midname as midname,
                    e.hee_firstname as firstname,
                    to_char(e.hee_birthdate, 'DD/MM/YYYY') as birth_date,
                    e.hee_sex as sex,
                    e.hee_docno as doc_no,
                    e.hee_cardid as cccd,
                    e.hee_phone as phone,
                    e.hee_note as note,
                    e.hee_status as status,
                    e.hee_cardid_date as card_id_date,
                    e.hee_cardid_place as card_id_place,
                    e.hee_ethnic as ethnic,
                    e.hee_occupation::text as occupation,
                    e.hee_occupation as ma_nghe_nghiep,
                    COALESCE(occ.ss_desc, '') as occupation_name,
                    COALESCE(e.hee_target_group, '14') as target_group,
                    COALESCE(e.hee_target_group, '14') as doi_tuong_ksk,
                    COALESCE(NULLIF(TRIM(e.hee_prov_code), ''), e.hee_provid::text, '') as prov_id,
                    COALESCE(NULLIF(TRIM(e.hee_vill_code), ''), e.hee_villid::text, '') as vill_id,
                    p.sp_name as prov_name,
                    v.sv_name as vill_name,
                    COALESCE(e.hee_address, '') as address,
                    (SELECT send_status FROM health_check_masters m 
                     WHERE m.his_employee_id::text = e.hee_employee_id::text AND m.his_contract_id::text = $1::text LIMIT 1) as sync_status
                FROM hms_exm_employee e
                LEFT JOIN sys_prov p ON p.sp_id::text = COALESCE(NULLIF(TRIM(e.hee_prov_code), ''), e.hee_provid::text)
                LEFT JOIN sys_vill v ON v.sv_id::text = COALESCE(NULLIF(TRIM(e.hee_vill_code), ''), e.hee_villid::text)
                LEFT JOIN sys_sel occ ON trim(occ.ss_id) = 'sys_occupation' AND trim(occ.ss_code) = trim(e.hee_occupation::text)
                WHERE e.hee_contract_id::text = $1::text AND e.hee_isactive='Y'
                ORDER BY e.hee_employee_id ASC
            `, [contractId]);

            return res.json(result.rows);
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi getContractEmployees:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // Import danh sách nhân viên từ Excel (Tối ưu hóa hiệu năng & Làm sạch dữ liệu)
    async importEmployees(req: Request, res: Response) {
        const { id } = req.params;
        const contractId = parseInt(id as string, 10);
        const { employees } = req.body;

        if (!Array.isArray(employees) || employees.length === 0) {
            return res.status(400).json({ success: false, message: 'Danh sách nhân viên trống hoặc không hợp lệ!' });
        }

        try {
            const checkStatus = await query('SELECT hec_status FROM hms_exm_contract WHERE hec_contract_id = $1', [contractId]);
            if (checkStatus.rows.length > 0 && checkStatus.rows[0].hec_status === 'A') {
                return res.status(400).json({ success: false, message: 'Gói khám đã được duyệt chốt, không thể nhập thêm nhân viên!' });
            }

            // 1. Tải trước danh mục Tỉnh/Thành phố & Nghề nghiệp vào bộ đệm (Pre-cache map) để loại bỏ N+1 query
            const provMapById = new Map<string, { id: number, code: string }>();
            const provMapByName = new Map<string, { id: number, code: string }>();
            try {
                const provRes = await query(`SELECT sp_id, sp_name FROM sys_prov`);
                for (const row of provRes.rows) {
                    const idNum = parseInt(String(row.sp_id), 10);
                    const codeStr = String(row.sp_id);
                    provMapById.set(String(row.sp_id).trim(), { id: idNum, code: codeStr });
                    provMapByName.set(String(row.sp_name).toLowerCase().trim(), { id: idNum, code: codeStr });
                }
            } catch (pErr) {
                console.warn('⚠️ Không thể tải trước danh mục sys_prov:', pErr);
            }

            const occMapById = new Map<string, number>();
            const occMapByName = new Map<string, number>();
            try {
                const occRes = await query(`SELECT ss_code, ss_desc FROM sys_sel WHERE trim(ss_id)='sys_occupation' AND ss_isactive='Y'`);
                for (const row of occRes.rows) {
                    const codeNum = parseInt(String(row.ss_code).trim(), 10);
                    if (!isNaN(codeNum)) {
                        occMapById.set(String(row.ss_code).trim(), codeNum);
                        occMapByName.set(String(row.ss_desc).toLowerCase().trim(), codeNum);
                    }
                }
            } catch (oErr) {
                console.warn('⚠️ Không thể tải trước danh mục sys_occupation:', oErr);
            }

            const maxIdRes = await query(`SELECT COALESCE(MAX(hee_employee_id), 0) as max_id FROM hms_exm_employee`);
            let currentMaxId = parseInt(maxIdRes.rows[0].max_id, 10);

            // 2. Bắt đầu Transaction để thực thi nhanh & đảm bảo an toàn toàn vẹn dữ liệu
            await query('BEGIN');

            try {
                // Chunk nhỏ xử lý batch nếu cần
                const BATCH_SIZE = 50;
                for (let b = 0; b < employees.length; b += BATCH_SIZE) {
                    const batch = employees.slice(b, b + BATCH_SIZE);

                    for (const emp of batch) {
                        currentMaxId++;
                        const fullName = String(emp.name || '').replace(/\s+/g, ' ').trim();
                        
                        const nameParts = fullName.split(/\s+/);
                        let surname = '';
                        let midname = '';
                        let firstname = '';

                        if (nameParts.length === 1) {
                            firstname = nameParts[0];
                        } else if (nameParts.length === 2) {
                            surname = nameParts[0];
                            firstname = nameParts[1];
                        } else if (nameParts.length > 2) {
                            surname = nameParts[0];
                            firstname = nameParts[nameParts.length - 1];
                            midname = nameParts.slice(1, nameParts.length - 1).join(' ');
                        }

                        // Chuẩn hóa ngày sinh
                        let birthDate: Date | null = null;
                        if (emp.birth_date) {
                            const dateStr = String(emp.birth_date).trim();
                            const parts = dateStr.split(/[\/\-]/);
                            if (parts.length === 3) {
                                if (parts[0].length === 4) {
                                    // YYYY-MM-DD
                                    birthDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                                } else {
                                    // DD/MM/YYYY
                                    birthDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
                                }
                            } else if (!isNaN(Date.parse(dateStr))) {
                                birthDate = new Date(dateStr);
                            }
                        }

                        // Cắt gọt và làm sạch các trường độ dài cố định
                        const empCode = String(emp.code || `NV${currentMaxId}`).trim().slice(0, 30);
                        
                        // CCCD: chỉ giữ số, cắt tối đa 12 ký tự
                        const docNo = String(emp.doc_no || emp.cccd || '').replace(/\D/g, '').slice(0, 12);
                        
                        // SĐT: chỉ giữ số, format 84... -> 0..., cắt tối đa 10 ký tự
                        let phone = String(emp.phone || '').replace(/\D/g, '');
                        if (phone.startsWith('84') && (phone.length === 11 || phone.length === 12)) {
                            phone = '0' + phone.slice(2);
                        }
                        phone = phone.slice(0, 10);

                        // Ngày cấp & Nơi cấp CCCD
                        const cardIdDate = String(emp.cardid_date || emp.card_id_date || '').trim().slice(0, 50);
                        const cardIdPlace = String(emp.cardid_place || emp.card_id_place || '').trim().slice(0, 100);

                        // Người giám hộ
                        const guardianName = String(emp.guardian_name || '').trim().slice(0, 100);
                        const guardianCccd = String(emp.guardian_cccd || '').replace(/\D/g, '').slice(0, 12);

                        // Nghề nghiệp: map sang mã số nguyên sys_sel (sys_occupation)
                        let rawOcc = String(emp.occupation || emp.ma_nghe_nghiep || emp.job || emp.position || '').trim();
                        let occNum: number = 1539; // Mặc định: "Không có nghề nghiệp cụ thể"
                        if (rawOcc) {
                            const matchedCode = occMapById.get(rawOcc) || occMapByName.get(rawOcc.toLowerCase());
                            if (matchedCode) {
                                occNum = matchedCode;
                            } else {
                                const parsedInt = parseInt(rawOcc, 10);
                                if (!isNaN(parsedInt) && parsedInt > 0) {
                                    occNum = parsedInt;
                                }
                            }
                        }

                        // Đối tượng KSK (Target Group): map sang mã '1' -> '16'
                        let rawTg = String(emp.target_group || emp.doi_tuong_ksk || emp.madoituongksk || emp.doi_tuong || emp.targetGroup || '').trim();
                        let targetGroup = '';
                        if (rawTg) {
                            const tgMatch = rawTg.match(/^(\d+)/);
                            if (tgMatch) {
                                targetGroup = tgMatch[1];
                            } else {
                                const tgByName: Record<string, string> = {
                                    'người cao tuổi': '1',
                                    'người khuyết tật': '2',
                                    'người thuộc hộ nghèo, cận nghèo': '3',
                                    'hộ nghèo': '3',
                                    'người có công': '4',
                                    'người mắc bệnh mạn tính': '5',
                                    'bệnh mạn tính': '5',
                                    'người sống tại vùng đồng bào dân tộc thiểu số và miền núi': '6',
                                    'dân tộc thiểu số': '6',
                                    'người sống tại vùng có điều kiện kinh tế - xã hội khó khăn': '7',
                                    'vùng khó khăn': '7',
                                    'người sống tại xã đảo': '8',
                                    'xã đảo': '8',
                                    'người sống tại đặc khu': '9',
                                    'đặc khu': '9',
                                    'trẻ em trong cơ sở giáo dục mầm non': '10',
                                    'mầm non': '10',
                                    'học sinh trong các cơ sở giáo dục phổ thông': '11',
                                    'học sinh': '11',
                                    'sinh viên': '12',
                                    'người lao động': '13',
                                    'người lao động không chính thức': '14',
                                    'người chưa có bảo hiểm y tế': '15',
                                    'chưa có bhyt': '15',
                                    'các đối tượng khác': '16',
                                    'khác': '16'
                                };
                                targetGroup = tgByName[rawTg.toLowerCase()] || rawTg.slice(0, 50);
                            }
                        } else {
                            // Tự động gán theo tuổi: >= 60 tuổi là Mã 1 (Người cao tuổi), < 60 tuổi là Mã 3 (Hộ nghèo, cận nghèo)
                            const empAge = calculateAge(birthDate);
                            targetGroup = (empAge !== null && empAge >= 60) ? '1' : '3';
                        }

                        // Thông tin hành chính & địa chỉ
                        let provCode = String(emp.province_code || (emp.province_id !== undefined && emp.province_id !== null ? emp.province_id : '')).trim();
                        let villCode = String(emp.ward_code || (emp.ward_id !== undefined && emp.ward_id !== null ? emp.ward_id : '')).trim();
                        let provNum: number | null = null;
                        let villNum: number | null = villCode ? (parseInt(villCode, 10) || null) : null;

                        // Tra cứu nhanh trong Memory Map
                        if (provCode) {
                            const cached = provMapById.get(provCode) || provMapByName.get(provCode.toLowerCase());
                            if (cached) {
                                provNum = cached.id;
                                provCode = cached.code;
                            } else {
                                provNum = parseInt(provCode, 10) || null;
                                provCode = provNum ? String(provNum) : '';
                            }
                        }

                        const note = String(emp.note || '').trim().slice(0, 255);
                        const dept = String(emp.dept || '').trim().slice(0, 100);
                        const position = String(emp.position || '').trim().slice(0, 100);
                        const address = String(emp.detail_address || emp.address || '').trim().slice(0, 255);

                        const insertSql = `
                            INSERT INTO hms_exm_employee (
                                hee_employee_id, hee_contract_id, hee_id, 
                                hee_surname, hee_midname, hee_firstname, 
                                hee_birthdate, hee_sex, hee_docno, hee_phone, 
                                hee_note, hee_status, hee_isactive,
                                hee_dept, hee_position_desc, hee_address,
                                hee_provid, hee_distid, hee_villid,
                                hee_cardid, hee_cardid_date, hee_cardid_place,
                                hee_guardian_name, hee_guardian_cccd, hee_ethnic,
                                hee_prov_code, hee_vill_code, hee_occupation,
                                hee_target_group
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'O', 'Y', $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
                        `;
                        await query(insertSql, [
                            currentMaxId,
                            contractId,
                            empCode,
                            surname,
                            midname,
                            firstname,
                            birthDate,
                            (emp.sex === 'Nữ' || emp.sex === 'F') ? 'F' : 'M',
                            null,
                            phone,
                            note,
                            dept,
                            position,
                            address,
                            provNum,
                            emp.district_id ? parseInt(String(emp.district_id), 10) : null,
                            villNum,
                            docNo,
                            cardIdDate,
                            cardIdPlace,
                            guardianName,
                            guardianCccd,
                            emp.ethnic ? parseInt(String(emp.ethnic), 10) : null,
                            provCode || null,
                            villCode || null,
                            occNum,
                            targetGroup
                        ]);
                    }
                }

                await query('COMMIT');
                console.log(`✅ [importEmployees] Đã import thành công ${employees.length} nhân viên vào hợp đồng #${contractId}.`);
            } catch (insertError) {
                await query('ROLLBACK');
                throw insertError;
            }

            return res.json({ success: true, count: employees.length });
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi importEmployees:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // Xóa nhân viên trong hợp đồng (soft delete / dọn rác mồ côi)
    async deleteEmployee(req: Request, res: Response) {
        const { id } = req.params;
        const employeeId = parseInt(id as string, 10);
        try {
            // Kiểm tra xem nhân viên đã được tiếp đón chưa (có số hồ sơ hee_docno)
            const checkDoc = await query(`
                SELECT hee_docno, hee_contract_id, hee_status 
                FROM hms_exm_employee 
                WHERE hee_employee_id = $1
            `, [employeeId]);
            if (checkDoc.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy nhân viên!' });
            }

            const emp = checkDoc.rows[0];
            
            // Nếu hợp đồng đã được khóa chốt, không cho phép xóa
            const contractRes = await query('SELECT hec_status FROM hms_exm_contract WHERE hec_contract_id = $1', [emp.hee_contract_id]);
            if (contractRes.rows.length > 0 && contractRes.rows[0].hec_status === 'A') {
                return res.status(400).json({ success: false, message: 'Gói khám đã được duyệt chốt, không thể xóa nhân viên!' });
            }

            const docNoVal = emp.hee_docno ? parseInt(String(emp.hee_docno), 10) : 0;
            if (docNoVal > 0) {
                // Kiểm tra xem hồ sơ này còn tồn tại trên HIS không
                const docCheck = await query(`SELECT hd_docno FROM hms_doc WHERE hd_docno = $1`, [docNoVal]);
                if (docCheck.rows.length === 0) {
                    // Hồ sơ trên HIS đã bị xóa (Hồ sơ rác/mồ côi) -> Cho phép xóa trực tiếp khỏi gói!
                    console.log(`🧹 [deleteEmployee] Hồ sơ ${docNoVal} không còn trên HIS (hồ sơ rác), tiến hành xóa nhân viên ${employeeId}...`);
                    await query(`UPDATE hms_exm_employee SET hee_isactive = 'N' WHERE hee_employee_id = $1`, [employeeId]);
                    return res.json({ success: true, message: 'Xóa hồ sơ rác thành công!' });
                }

                // Nếu hồ sơ còn trên HIS nhưng có yêu cầu force = true:
                const force = req.query.force === 'true' || req.body?.force === true;
                if (force) {
                    const currentUser = (req as any).user?.username || (req as any).userId || 'admin';
                    try {
                        await query(`SELECT hms_exm_registration_cancel($1::integer, $2::varchar)`, [employeeId, currentUser]);
                    } catch (cancelErr) {
                        console.warn(`⚠️ [deleteEmployee] Lỗi hms_exm_registration_cancel:`, cancelErr);
                    }
                    await query(`UPDATE hms_exm_employee SET hee_isactive = 'N' WHERE hee_employee_id = $1`, [employeeId]);
                    return res.json({ success: true, message: 'Hủy tiếp nhận và xóa nhân viên thành công!' });
                }

                return res.status(400).json({ 
                    success: false, 
                    isReceived: true,
                    docNo: docNoVal,
                    message: 'Nhân viên này đã được tiếp đón khám sức khỏe. Vui lòng bấm "Hủy tiếp nhận" trước khi xóa!' 
                });
            }

            await query(`UPDATE hms_exm_employee SET hee_isactive = 'N' WHERE hee_employee_id = $1`, [employeeId]);
            return res.json({ success: true, message: 'Xóa nhân viên thành công!' });
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi deleteEmployee:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // Thêm mới nhân viên vào hợp đồng
    async createEmployee(req: Request, res: Response) {
        const {
            contractId,
            surname,
            midname,
            firstname,
            dob,
            gender,
            cardId,
            cardIdDate,
            cardIdPlace,
            phone,
            ethnic,
            occupation,
            targetGroup,
            target_group,
            doi_tuong_ksk,
            provId,
            villId,
            address,
            note
        } = req.body;

        if (!contractId) {
            return res.status(400).json({ success: false, message: 'Thiếu mã hợp đồng/gói khám!' });
        }
        if (!surname?.trim() && !firstname?.trim()) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập Họ & Tên nhân viên!' });
        }

        try {
            // Kiểm tra trạng thái gói khám
            const contractRes = await query('SELECT hec_status FROM hms_exm_contract WHERE hec_contract_id = $1', [contractId]);
            if (contractRes.rows.length > 0 && contractRes.rows[0].hec_status === 'A') {
                return res.status(400).json({ success: false, message: 'Gói khám đã được duyệt chốt, không thể thêm nhân viên!' });
            }

            // Sinh mã nhân viên mới
            const maxIdRes = await query(`SELECT COALESCE(MAX(hee_employee_id), 0) as max_id FROM hms_exm_employee`);
            const nextEmployeeId = parseInt(maxIdRes.rows[0].max_id, 10) + 1;
            const empCode = `NV${nextEmployeeId}`;

            let occNum = 1539;
            if (occupation) {
                const p = parseInt(String(occupation), 10);
                if (!isNaN(p) && p > 0) occNum = p;
            }

            const tgVal = String(targetGroup || target_group || doi_tuong_ksk || '14').trim();

            const insertSql = `
                INSERT INTO hms_exm_employee (
                    hee_employee_id, hee_contract_id, hee_id, 
                    hee_surname, hee_midname, hee_firstname, 
                    hee_birthdate, hee_sex, hee_docno, hee_phone, 
                    hee_note, hee_status, hee_isactive,
                    hee_address, hee_provid, hee_villid,
                    hee_cardid, hee_cardid_date, hee_cardid_place,
                    hee_ethnic, hee_occupation, hee_target_group
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, null, $9, $10, 'O', 'Y', $11, $12, $13, $14, $15, $16, $17, $18, $19)
            `;

            await query(insertSql, [
                nextEmployeeId,
                contractId,
                empCode,
                surname.trim(),
                (midname || '').trim(),
                firstname.trim(),
                dob || null,
                gender || 'M',
                phone || '',
                note || '',
                address || '',
                provId ? parseInt(String(provId), 10) : null,
                villId ? parseInt(String(villId), 10) : null,
                cardId || '',
                cardIdDate || '',
                cardIdPlace || '',
                ethnic ? parseInt(String(ethnic), 10) : null,
                occNum,
                tgVal
            ]);

            return res.json({ success: true, message: 'Thêm mới nhân viên thành công!', employeeId: nextEmployeeId });
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi createEmployee:', error);
            return res.status(500).json({ error: error.message });
        }
    }
}

export const employeesController = new EmployeesController();
