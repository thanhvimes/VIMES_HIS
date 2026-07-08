import { Request, Response } from 'express';
import { query } from '../../config/database';

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
                    e.hee_provid as prov_id,
                    e.hee_villid as vill_id,
                    e.hee_address as address,
                    (SELECT send_status FROM health_check_masters m 
                     WHERE m.his_employee_id::text = e.hee_employee_id::text AND m.his_contract_id::text = $1::text LIMIT 1) as sync_status
                FROM hms_exm_employee e
                WHERE e.hee_contract_id::text = $1::text AND e.hee_isactive='Y'
                ORDER BY e.hee_employee_id ASC
            `, [contractId]);

            return res.json(result.rows);
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi getContractEmployees:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // Import danh sách nhân viên từ Excel
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
            const maxIdRes = await query(`SELECT COALESCE(MAX(hee_employee_id), 0) as max_id FROM hms_exm_employee`);
            let currentMaxId = parseInt(maxIdRes.rows[0].max_id, 10);

            for (const emp of employees) {
                currentMaxId++;
                const fullName = String(emp.name || '').trim();
                
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

                let birthDate: Date | null = null;
                if (emp.birth_date) {
                    const parts = String(emp.birth_date).split('/');
                    if (parts.length === 3) {
                        birthDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
                    } else {
                        birthDate = new Date(emp.birth_date);
                    }
                }

                const empCode = emp.code || `NV${currentMaxId}`;

                const insertSql = `
                    INSERT INTO hms_exm_employee (
                        hee_employee_id, hee_contract_id, hee_id, 
                        hee_surname, hee_midname, hee_firstname, 
                        hee_birthdate, hee_sex, hee_docno, hee_phone, 
                        hee_note, hee_status, hee_isactive,
                        hee_dept, hee_position_desc, hee_address,
                        hee_provid, hee_distid, hee_villid,
                        hee_cardid, hee_cardid_date, hee_cardid_place,
                        hee_guardian_name, hee_guardian_cccd, hee_ethnic
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'O', 'Y', $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
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
                    emp.phone || '',
                    emp.note || '',
                    emp.dept || '',
                    emp.position || '',
                    emp.detail_address || '',
                    emp.province_id ? parseInt(String(emp.province_id), 10) : null,
                    emp.district_id ? parseInt(String(emp.district_id), 10) : null,
                    emp.ward_id ? parseInt(String(emp.ward_id), 10) : null,
                    emp.doc_no || '',
                    emp.cardid_date || '',
                    emp.cardid_place || '',
                    emp.guardian_name || '',
                    emp.guardian_cccd || '',
                    emp.ethnic ? parseInt(String(emp.ethnic), 10) : null
                ]);
            }

            return res.json({ success: true, count: employees.length });
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi importEmployees:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // Xóa nhân viên trong hợp đồng (soft delete)
    async deleteEmployee(req: Request, res: Response) {
        const { id } = req.params;
        const employeeId = parseInt(id as string, 10);
        try {
            // Kiểm tra xem nhân viên đã được tiếp đón chưa (có số hồ sơ hee_docno)
            const checkDoc = await query(`SELECT hee_docno, hee_contract_id FROM hms_exm_employee WHERE hee_employee_id = $1`, [employeeId]);
            if (checkDoc.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy nhân viên!' });
            }

            const emp = checkDoc.rows[0];
            
            // Nếu hợp đồng đã được khóa chốt, không cho phép xóa
            const contractRes = await query('SELECT hec_status FROM hms_exm_contract WHERE hec_contract_id = $1', [emp.hee_contract_id]);
            if (contractRes.rows.length > 0 && contractRes.rows[0].hec_status === 'A') {
                return res.status(400).json({ success: false, message: 'Gói khám đã được duyệt chốt, không thể xóa nhân viên!' });
            }

            if (emp.hee_docno && parseInt(String(emp.hee_docno), 10) > 0) {
                return res.status(400).json({ success: false, message: 'Nhân viên này đã được tiếp đón khám sức khỏe, không thể xóa!' });
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

            const insertSql = `
                INSERT INTO hms_exm_employee (
                    hee_employee_id, hee_contract_id, hee_id, 
                    hee_surname, hee_midname, hee_firstname, 
                    hee_birthdate, hee_sex, hee_docno, hee_phone, 
                    hee_note, hee_status, hee_isactive,
                    hee_address, hee_provid, hee_villid,
                    hee_cardid, hee_cardid_date, hee_cardid_place,
                    hee_ethnic
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, null, $9, $10, 'O', 'Y', $11, $12, $13, $14, $15, $16, $17)
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
                ethnic ? parseInt(String(ethnic), 10) : null
            ]);

            return res.json({ success: true, message: 'Thêm mới nhân viên thành công!', employeeId: nextEmployeeId });
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi createEmployee:', error);
            return res.status(500).json({ error: error.message });
        }
    }
}

export const employeesController = new EmployeesController();
