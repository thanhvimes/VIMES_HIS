import { Request, Response } from 'express';
import { query } from '../../config/database';
import { generateXmlPayload } from './xml-generator';

export class ReceptionController {
    // Lấy danh sách phòng khám/phòng tiếp đón để chọn phòng đo sinh hiệu
    async getReceptionRooms(req: Request, res: Response) {
        try {
            const activeDeptId = (req as any).deptId || 'KB';
            console.log('🔍 [getReceptionRooms] activeDeptId:', activeDeptId);
            const result = await query(`
                SELECT hrl_id::text as id, hrl_name as name 
                FROM hms_roomlist 
                WHERE hrl_active = 'Y' AND hrl_deptid::text = $1::text
                ORDER BY hrl_name ASC
            `, [activeDeptId]);

            let rooms = result.rows;
            if (rooms.length === 0) {
                console.log('⚠️ [getReceptionRooms] fallback: tải toàn bộ phòng khám active do khoa đăng nhập không có phòng...');
                const fallbackRes = await query(`
                    SELECT hrl_id::text as id, hrl_name as name 
                    FROM hms_roomlist 
                    WHERE hrl_active = 'Y'
                    ORDER BY hrl_name ASC
                `);
                rooms = fallbackRes.rows;
            }

            // CHẨN ĐOÁN HỢP ĐỒNG & NHÂN VIÊN
            const contractsDiagnostic = await query(`
                SELECT c.hec_contract_id as id, c.hec_description as name,
                       (SELECT COUNT(*) FROM hms_exm_employee WHERE hee_contract_id = c.hec_contract_id) as total_emp,
                       (SELECT COUNT(*) FROM hms_exm_employee WHERE hee_contract_id = c.hec_contract_id AND hee_isactive = 'Y') as active_emp
                FROM hms_exm_contract c
                WHERE COALESCE(c.hec_status, 'O') = 'O'
            `);
            console.log('🔍 [Chẩn đoán Gói khám] Danh sách gói và số nhân viên:', contractsDiagnostic.rows);

            return res.json(rooms);
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi getReceptionRooms:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // Lấy danh sách loại phí khám cho thêm mới hợp đồng
    async getExamFees(req: Request, res: Response) {
        try {
            const activeDeptId = (req as any).deptId || 'KB';
            console.log('🔍 [getExamFees] activeDeptId:', activeDeptId);
            const result = await query(`
                SELECT TRIM(hfl_feeid) as id, hfl_name as name 
                FROM hms_fee_list 
                WHERE TRIM(UPPER(hfl_typeid)) = 'E'
                ORDER BY hfl_line
            `);

            return res.json(result.rows);
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi getExamFees:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // Tìm kiếm nhanh nhân viên hợp đồng phục vụ tiếp đón bằng thẻ CCCD hoặc SĐT
    async searchEmployeeByCard(req: Request, res: Response) {
        try {
            const { queryStr, contractId } = req.query;
            const term = queryStr ? String(queryStr).trim() : '';
            const cId = contractId ? String(contractId).trim() : '';

            console.log('🔍 [searchEmployeeByCard] Nhận tham số:', { term, cId });

            if (term === '' && cId === '') {
                return res.json([]);
            }

            let sql = `
                SELECT 
                    e.hee_employee_id as id,
                    e.hee_contract_id as contract_id,
                    c.hec_description as contract_name,
                    c.hec_company_id as company_id,
                    c.hec_no as contract_code,
                    COALESCE(w.hwp_name, 'Công ty chưa xác định') as company_name,
                    trim(COALESCE(e.hee_surname,'') || ' ' || COALESCE(e.hee_midname,'') || ' ' || e.hee_firstname) as name,
                    to_char(e.hee_birthdate, 'YYYY-MM-DD') as dob,
                    e.hee_sex as gender,
                    e.hee_cardid as card_id,
                    e.hee_phone as phone,
                    e.hee_address as address,
                    e.hee_docno as doc_no,
                    CASE WHEN e.hee_docno IS NOT NULL AND e.hee_docno > 0 THEN 'R' ELSE 'W' END as status,
                    e.hee_note as note,
                    e.hee_surname as surname,
                    e.hee_midname as midname,
                    e.hee_firstname as firstname,
                    e.hee_ethnic as ethnic,
                    e.hee_provid as prov_id,
                    e.hee_distid as dist_id,
                    e.hee_villid as vill_id,
                    e.hee_cardid_date as card_id_date,
                    e.hee_cardid_place as card_id_place,
                    e.hee_guardian_name as guardian_name,
                    e.hee_guardian_cccd as guardian_cccd,
                    p.sp_name as prov_name,
                    v.sv_name as vill_name
                FROM hms_exm_employee e
                JOIN hms_exm_contract c ON c.hec_contract_id = e.hee_contract_id
                LEFT JOIN hms_workplace w ON w.hwp_idx = c.hec_company_id::int
                LEFT JOIN sys_prov p ON p.sp_id::text = e.hee_provid::text
                LEFT JOIN sys_vill v ON v.sv_id::text = e.hee_villid::text
                WHERE e.hee_isactive = 'Y'
                  AND COALESCE(c.hec_status, 'O') = 'O'
            `;

            const params: any[] = [];
            let paramIndex = 1;

            if (term !== '') {
                sql += ` AND (
                    trim(e.hee_cardid) = $${paramIndex} 
                    OR trim(e.hee_phone) = $${paramIndex} 
                    OR trim(COALESCE(e.hee_surname,'') || ' ' || COALESCE(e.hee_midname,'') || ' ' || e.hee_firstname) ILIKE $${paramIndex + 1}
                )`;
                params.push(term);
                params.push(`%${term}%`);
                paramIndex += 2;
            }

            if (cId !== '') {
                sql += ` AND e.hee_contract_id = $${paramIndex}`;
                params.push(parseInt(cId, 10));
            }

            sql += ` ORDER BY name ASC LIMIT 100`;

            const result = await query(sql, params);
            return res.json(result.rows);
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi searchEmployeeByCard:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // Tiếp nhận nhân viên đoàn khám, đồng bộ tạo hồ sơ trên HIS và nạp dịch vụ gói
    async receiveContractEmployee(req: Request, res: Response) {
        try {
            const { employeeId, roomId } = req.body;
            const currentUser = (req as any).user?.username || 'admin';
            let activeDeptId = (req as any).deptId;
            if (!activeDeptId) {
                const deptRes = await query(`SELECT sd_id FROM sys_dept WHERE sd_type='KB' LIMIT 1`);
                activeDeptId = deptRes.rows[0]?.sd_id || 'KB';
            }

            if (!employeeId) {
                return res.status(400).json({ error: 'Thiếu mã nhân viên (employeeId)' });
            }

            // 1. Lấy thông tin nhân viên
            const empRes = await query(`
                SELECT e.*, c.hec_description as hec_name, c.hec_company_id, w.hwp_name as company_name,
                       c.hec_type as contract_exam_type, c.hec_object as contract_room_id,
                       c.hec_form_type as contract_form_type
                FROM hms_exm_employee e
                JOIN hms_exm_contract c ON c.hec_contract_id = e.hee_contract_id
                LEFT JOIN hms_workplace w ON w.hwp_idx = c.hec_company_id::int
                WHERE e.hee_employee_id = $1 AND e.hee_isactive = 'Y'
            `, [employeeId]);

            if (empRes.rows.length === 0) {
                return res.status(404).json({ error: 'Không tìm thấy nhân viên hoặc nhân viên đã bị vô hiệu hóa!' });
            }

            let emp = empRes.rows[0];

            // Nếu trạng thái nhân viên là 'A' (chưa tiếp nhận ở DB cũ), chuyển thành 'O' để thỏa mãn stored procedure HIS
            if (emp.hee_status === 'A') {
                await query(`UPDATE hms_exm_employee SET hee_status = 'O' WHERE hee_employee_id = $1`, [employeeId]);
                emp.hee_status = 'O';
            }

            // 2. Nếu bệnh nhân chưa có mã bệnh nhân (hee_patientno) trên HIS, tiến hành kiểm tra trùng CCCD trước khi tạo mới
            if (!emp.hee_patientno || parseInt(String(emp.hee_patientno), 10) <= 0) {
                let existingPatientNo: number | null = null;
                if (emp.hee_cardid && emp.hee_cardid.trim()) {
                    const checkSinRes = await query(`
                        SELECT hp_patientno 
                        FROM hms_patient 
                        WHERE trim(hp_sin) = $1 OR trim(hp_patientid) = $1
                        LIMIT 1
                    `, [emp.hee_cardid.trim()]);
                    if (checkSinRes.rows.length > 0) {
                        existingPatientNo = parseInt(String(checkSinRes.rows[0].hp_patientno), 10);
                    }
                }

                if (existingPatientNo && existingPatientNo > 0) {
                    console.log(`🔍 [Tiếp đón KSK] Bệnh nhân đã tồn tại trên HIS với mã bệnh nhân: ${existingPatientNo}. Tiến hành sử dụng lại...`);
                    await query(`
                        UPDATE hms_exm_employee 
                        SET hee_patientno = $1 
                        WHERE hee_employee_id = $2
                    `, [existingPatientNo, employeeId]);
                    emp.hee_patientno = existingPatientNo;
                } else {
                    console.log('🔍 [Tiếp đón KSK] Bệnh nhân chưa có mã và không trùng CCCD, tiến hành sinh mã mới...');
                    const patientNoRes = await query(`SELECT hms_getnextpatientno() AS patient_no`);
                    if (patientNoRes.rows.length === 0 || !patientNoRes.rows[0].patient_no) {
                        throw new Error('Không thể sinh mã bệnh nhân mới từ hàm hms_getnextpatientno() trên HIS.');
                    }
                    const newPatientNo = parseInt(String(patientNoRes.rows[0].patient_no), 10);

                    console.log(`🚀 Sinh mã bệnh nhân mới thành công: ${newPatientNo}, thực hiện chèn hms_patient...`);
                    await query(`
                        INSERT INTO hms_patient (
                            hp_patientno, hp_patientid,
                            hp_surname, hp_midname, hp_firstname,
                            hp_birthdate, hp_sex, hp_ethnic,
                            hp_provid, hp_distid, hp_villid,
                            hp_dtladdr, hp_createdby, hp_createddate
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
                    `, [
                        newPatientNo,
                        emp.hee_cardid || '',
                        emp.hee_surname || '',
                        emp.hee_midname || '',
                        emp.hee_firstname || '',
                        emp.hee_birthdate || null,
                        emp.hee_sex || 'M',
                        emp.hee_ethnic || null,
                        emp.hee_provid || null,
                        emp.hee_distid || null,
                        emp.hee_villid || null,
                        emp.hee_address || '',
                        currentUser
                    ]);

                    console.log(`🚀 Cập nhật mã bệnh nhân vào danh sách nhân viên khám...`);
                    await query(`
                        UPDATE hms_exm_employee 
                        SET hee_patientno = $1 
                        WHERE hee_employee_id = $2
                    `, [newPatientNo, employeeId]);

                    emp.hee_patientno = newPatientNo;
                }
            }

            // 2. Nếu đã có số hồ sơ (hee_docno), kiểm tra xem hồ sơ đó còn hoạt động trên HIS không
            if (emp.hee_docno) {
                const checkDoc = await query(`SELECT hd_docno FROM hms_doc WHERE hd_docno = $1`, [emp.hee_docno]);
                if (checkDoc.rows.length > 0) {
                    const servicesRes = await query(`
                        SELECT f.hfe_desc as name, f.hfe_unit as unit, f.hfe_quantity as quantity, f.hfe_unitprice as price
                        FROM hms_fee f
                        WHERE f.hfe_docno = $1 AND f.hfe_status != 'C'
                    `, [emp.hee_docno]);

                    return res.json({
                        success: true,
                        message: 'Nhân viên này đã được tiếp nhận trước đó!',
                        docNo: String(emp.hee_docno),
                        patientNo: String(emp.hee_patientno),
                        services: servicesRes.rows
                    });
                }
            }

            // 3. Gọi stored procedure hms_exm_registration_exam của HIS để thực hiện tiếp đón và sinh hồ sơ + chỉ định CLS
            const d = new Date();
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hour = String(d.getHours()).padStart(2, '0');
            const minute = String(d.getMinutes()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day} ${hour}:${minute}`;

            // Lấy mã phòng khám và loại phí khám từ cấu hình hợp đồng/gói khám
            const activeRoomId = emp.contract_room_id ? parseInt(String(emp.contract_room_id), 10) : (roomId ? parseInt(String(roomId), 10) : 1);
            const examType = emp.contract_exam_type || 'E01';

            console.log('🚀 Gọi hms_exm_registration_exam:', {
                employeeId,
                currentUser,
                activeDeptId,
                activeRoomId,
                examType,
                formattedDate
            });

            const registerRes = await query(
                `SELECT hms_exm_registration_exam($1::integer, $2::varchar, $3::varchar, $4::integer, $5::varchar, $6::varchar, $7::varchar) AS doc_no`,
                [
                    employeeId,
                    currentUser,
                    activeDeptId,
                    activeRoomId,
                    examType,
                    formattedDate,
                    'Y'
                ]
            );

            console.log('🔍 [PG hms_exm_registration_exam result]:', registerRes.rows);

            if (registerRes.rows.length === 0 || !registerRes.rows[0].doc_no || registerRes.rows[0].doc_no === '0' || registerRes.rows[0].doc_no === 0) {
                throw new Error(`Stored procedure hms_exm_registration_exam trả về kết quả tiếp nhận không hợp lệ (doc_no = ${registerRes.rows[0]?.doc_no}). Vui lòng kiểm tra Khoa/Phòng khám của phòng này trên HIS.`);
            }

            const newDocNo = parseInt(String(registerRes.rows[0].doc_no), 10);

            // 4. Lấy patientNo và kiểm tra trạng thái từ hms_exm_employee sau khi chạy stored procedure
            const updatedEmpRes = await query(`
                SELECT hee_patientno, hee_docno
                FROM hms_exm_employee
                WHERE hee_employee_id = $1
            `, [employeeId]);

            const newPatientNo = updatedEmpRes.rows[0]?.hee_patientno || 0;

            // 5. Lấy danh sách dịch vụ kỹ thuật đã được tự động chèn vào hms_fee
            const servicesRes = await query(`
                SELECT 
                    f.hfe_itemid as id,
                    f.hfe_desc as name,
                    f.hfe_quantity as quantity,
                    f.hfe_unit as unit,
                    f.hfe_unitprice as price
                FROM hms_fee f
                WHERE f.hfe_docno = $1
            `, [newDocNo]);

            const insertedServices = servicesRes.rows.map(s => ({
                name: s.name,
                unit: s.unit || 'Lần',
                quantity: s.quantity || 1,
                price: s.price || 0
            }));

            // 6. Tự động khởi tạo/đồng bộ hồ sơ KSK (health_check_masters & health_check_details)
            try {
                const parseDateSafely = (dateInput: any): Date | null => {
                    if (!dateInput) return null;
                    if (dateInput instanceof Date) {
                        return isNaN(dateInput.getTime()) ? null : dateInput;
                    }
                    const str = String(dateInput).trim();
                    const dmyRegex = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/;
                    const match = str.match(dmyRegex);
                    if (match) {
                        const day = parseInt(match[1], 10);
                        const month = parseInt(match[2], 10) - 1;
                        const year = parseInt(match[3], 10);
                        const parsedDate = new Date(year, month, day);
                        return isNaN(parsedDate.getTime()) ? null : parsedDate;
                    }
                    const parsed = new Date(str);
                    return isNaN(parsed.getTime()) ? null : parsed;
                };

                const patientName = `${emp.hee_surname || ''} ${emp.hee_midname || ''} ${emp.hee_firstname || ''}`.replace(/\s+/g, ' ').trim().toUpperCase();
                const genderVal = (emp.hee_sex || '').toLowerCase();
                const gender = (genderVal === 'm' || genderVal.includes('nam') || genderVal === '1') ? 'Nam' : 'Nữ';
                const cccd = emp.hee_cardid || '';
                const dob = parseDateSafely(emp.hee_birthdate);
                const dobStr = dob ? dob.toISOString().split('T')[0] : '1990-01-01';
                
                const formType = emp.contract_form_type || '2'; // Sử dụng mẫu cấu hình sẵn trên hợp đồng, mặc định '2'
                const docNo = String(newDocNo);

                const clinicalData: any = {
                    address: emp.hee_address || '',
                    phone: emp.hee_phone || '',
                    ethnic: emp.hee_ethnic ? String(emp.hee_ethnic).padStart(2, '0') : '01',
                    matinh_cu_tru: emp.hee_provid || '',
                    mahuyen_cu_tru: emp.hee_distid || '',
                    maxa_cu_tru: emp.hee_villid || '',
                    cccd_date: emp.hee_cardid_date || '',
                    cccd_place: emp.hee_cardid_place || '',
                    nguoi_giam_ho: emp.hee_guardian_name || '',
                    so_cccd_ngh: emp.hee_guardian_cccd || '',
                    blood_group: 'O', target_group: '14', funding_source: '9',
                    examination: { height: '', weight: '', bmi: '', blood_pressure: '', pulse: '' },
                    clinical_exam: {
                        internal: '', eye: '', ent: '', dental: '', external: '',
                        gynecology: gender === 'Nữ' ? 'Bình thường' : 'Không khám'
                    },
                    extra: {}
                };

                const labData: any = {
                    blood_test: { hemoglobin: '', glycemia: '' },
                    urine_test: { protein: '' },
                    kq_xn_khac: '',
                    paraclinical_items: []
                };

                const xmlData = generateXmlPayload(
                    formType,
                    { patientName, cccd, dob: dobStr, gender, docNo },
                    clinicalData, labData, null
                );

                // Kiểm tra xem đã có hồ sơ nào liên kết với nhân viên/số bệnh án này chưa
                const checkMaster = await query(`
                    SELECT id FROM health_check_masters 
                    WHERE his_employee_id = $1::varchar OR his_doc_no = $2::varchar OR doc_no = $3::varchar
                `, [String(employeeId), String(newDocNo), docNo]);

                if (checkMaster.rows.length > 0) {
                    const masterId = checkMaster.rows[0].id;
                    await query(`
                        UPDATE health_check_masters SET
                            patient_id = $1, patient_name = $2, cccd = $3, dob = $4, gender = $5,
                            doc_no = $6, form_type = $7, xml_data = $8,
                            his_employee_id = $9, his_contract_id = $10, his_doc_no = $11, 
                            sync_mode = 'HIS', updated_at = NOW()
                        WHERE id = $12
                    `, [String(newPatientNo), patientName, cccd, dob, gender,
                        docNo, formType, xmlData, String(employeeId), emp.hee_contract_id, String(newDocNo), masterId]);

                    await query(`
                        UPDATE health_check_details SET
                            clinical_data = $1, lab_data = $2, updated_at = NOW()
                        WHERE master_id = $3
                    `, [JSON.stringify(clinicalData), JSON.stringify(labData), masterId]);
                } else {
                    const insertMaster = await query(`
                        INSERT INTO health_check_masters (
                            patient_id, patient_name, cccd, dob, gender,
                            doc_no, form_type, xml_data,
                            signature_status, send_status,
                            his_employee_id, his_contract_id, his_doc_no, sync_mode
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Unsigned', 'Unsent', $9, $10, $11, 'HIS')
                        RETURNING id
                    `, [String(newPatientNo), patientName, cccd, dob, gender,
                        docNo, formType, xmlData, String(employeeId), emp.hee_contract_id, String(newDocNo)]);
                    
                    const masterId = insertMaster.rows[0].id;
                    await query(`
                        INSERT INTO health_check_details (master_id, clinical_data, lab_data, conclusion_data)
                        VALUES ($1, $2, $3, null)
                    `, [masterId, JSON.stringify(clinicalData), JSON.stringify(labData)]);
                }
                console.log(`✅ [receiveContractEmployee] Tự động khởi tạo hồ sơ KSK master & details cho BN: ${patientName} thành công.`);
            } catch (syncErr: any) {
                console.error('⚠️ [receiveContractEmployee] Không thể tự động tạo hồ sơ KSK trong bảng master/details:', syncErr);
            }

            return res.json({
                success: true,
                message: 'Đăng ký tiếp đón đoàn và đồng bộ chỉ định gói khám thành công!',
                docNo: String(newDocNo),
                patientNo: String(newPatientNo),
                services: insertedServices
            });
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi receiveContractEmployee:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // Cập nhật thông tin nhân viên hợp đồng trước khi tiếp nhận
    async updateEmployee(req: Request, res: Response) {
        try {
            const employeeId = parseInt(String(req.params.id), 10);
            const {
                surname,
                midname,
                firstname,
                dob,
                gender,
                cardId,
                phone,
                address,
                ethnic,
                provId,
                distId,
                villId,
                cardIdDate,
                cardIdPlace,
                guardianName,
                guardianCccd
            } = req.body;

            if (!employeeId) {
                return res.status(400).json({ error: 'Thiếu mã nhân viên' });
            }

            console.log('🔄 [updateEmployee] Cập nhật nhân viên:', { employeeId, surname, midname, firstname, cardId });

            await query(`
                UPDATE hms_exm_employee
                SET 
                    hee_surname = $1,
                    hee_midname = $2,
                    hee_firstname = $3,
                    hee_birthdate = $4,
                    hee_sex = $5,
                    hee_cardid = $6,
                    hee_phone = $7,
                    hee_address = $8,
                    hee_ethnic = $9,
                    hee_provid = $10,
                    hee_distid = $11,
                    hee_villid = $12,
                    hee_cardid_date = $13,
                    hee_cardid_place = $14,
                    hee_guardian_name = $15,
                    hee_guardian_cccd = $16
                WHERE hee_employee_id = $17
            `, [
                surname || '',
                midname || '',
                firstname || '',
                dob || null,
                gender || 'M',
                cardId || '',
                phone || '',
                address || '',
                ethnic || null,
                provId || null,
                distId || null,
                villId || null,
                cardIdDate || null,
                cardIdPlace || null,
                guardianName || null,
                guardianCccd || null,
                employeeId
            ]);

            return res.json({ success: true, message: 'Cập nhật thông tin thành công!' });
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi updateEmployee:', error);
            return res.status(500).json({ error: error.message });
        }
    }
}

export const receptionController = new ReceptionController();
