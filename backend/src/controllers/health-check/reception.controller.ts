import { Request, Response } from 'express';
import { query } from '../../config/database';
import { generateXmlPayload } from './xml-generator';
import { hisIntegrationController } from './his-integration';

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

    // Tiếp nhận một nhân viên (internal logic)
    private async processSingleEmployeeReception(
        employeeId: number, 
        roomId: number | undefined, 
        currentUser: string, 
        currentUserName: string, 
        activeDeptId: string
    ) {
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
            throw new Error('Không tìm thấy nhân viên hoặc nhân viên đã bị vô hiệu hóa!');
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

        // 3. Nếu đã có số hồ sơ (hee_docno), kiểm tra xem hồ sơ đó còn hoạt động trên HIS không
        if (emp.hee_docno) {
            const checkDoc = await query(`SELECT hd_docno FROM hms_doc WHERE hd_docno = $1`, [emp.hee_docno]);
            if (checkDoc.rows.length > 0) {
                const servicesRes = await query(`
                    SELECT f.hfe_desc as name, f.hfe_unit as unit, f.hfe_quantity as quantity, f.hfe_unitprice as price
                    FROM hms_fee f
                    WHERE f.hfe_docno = $1 AND f.hfe_status != 'C'
                `, [emp.hee_docno]);

                return {
                    alreadyReceived: true,
                    docNo: String(emp.hee_docno),
                    patientNo: String(emp.hee_patientno),
                    services: servicesRes.rows
                };
            }
        }

        // 4. Gọi stored procedure hms_exm_registration_exam của HIS để thực hiện tiếp đón và sinh hồ sơ + chỉ định CLS
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

        // 5. Lấy patientNo và kiểm tra trạng thái từ hms_exm_employee sau khi chạy stored procedure
        const updatedEmpRes = await query(`
            SELECT hee_patientno, hee_docno
            FROM hms_exm_employee
            WHERE hee_employee_id = $1
        `, [employeeId]);

        const newPatientNo = updatedEmpRes.rows[0]?.hee_patientno || 0;

        // 6. Lấy danh sách dịch vụ kỹ thuật đã được tự động chèn vào hms_fee
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

        // 7. Tự động khởi tạo/đồng bộ hồ sơ KSK (health_check_masters & health_check_details)
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
                matinh_cu_tru: emp.hee_prov_code || (emp.hee_provid !== null && emp.hee_provid !== undefined ? String(emp.hee_provid) : ''),
                mahuyen_cu_tru: emp.hee_distid !== null && emp.hee_distid !== undefined ? String(emp.hee_distid) : '',
                maxa_cu_tru: emp.hee_vill_code || (emp.hee_villid !== null && emp.hee_villid !== undefined ? String(emp.hee_villid) : ''),
                cccd_date: emp.hee_cardid_date || '',
                cccd_place: emp.hee_cardid_place || '',
                nguoi_giam_ho: emp.hee_guardian_name || '',
                so_cccd_ngh: emp.hee_guardian_cccd || '',
                blood_group: '', target_group: '14', funding_source: '9',
                examination: { height: '', weight: '', bmi: '', blood_pressure: '', pulse: '' },
                clinical_exam: {
                    internal: '', eye: '', ent: '', dental: '', external: '',
                    gynecology: ''
                },
                extra: {}
            };

            // Tự động tải chỉ định cận lâm sàng từ HIS ngay lúc tiếp nhận
            let liveParaclinical: any = null;
            try {
                liveParaclinical = await hisIntegrationController.fetchStructuredParaclinicalData(newDocNo);
                console.log(`🔍 [receiveContractEmployee] Tự động tải cận lâm sàng từ HIS cho docNo ${newDocNo}:`, liveParaclinical?.paraclinical_items?.length, 'items');
            } catch (fetchErr) {
                console.error('⚠️ [receiveContractEmployee] Lỗi tải cận lâm sàng từ HIS:', fetchErr);
            }

            const labData: any = {
                blood_test: { 
                    hemoglobin: liveParaclinical?.hemoglobin || '', 
                    glycemia: liveParaclinical?.glycemia || '' 
                },
                urine_test: { 
                    protein: liveParaclinical?.protein || '' 
                },
                kq_xn_khac: liveParaclinical?.kqXnKhac || '',
                paraclinical_items: liveParaclinical?.paraclinical_items || []
            };

            const xmlData = generateXmlPayload(
                formType,
                { patientName, cccd, dob: dobStr, gender, docNo },
                clinicalData, labData, null
            );

            // Kiểm tra xem đã có hồ sơ nào liên kết với nhân viên/số bệnh án này chưa
            const checkMaster = await query(`
                SELECT id, signature_status, send_status FROM health_check_masters 
                WHERE his_employee_id = $1::varchar OR his_doc_no = $2::varchar OR doc_no = $3::varchar
            `, [String(employeeId), String(newDocNo), docNo]);

            if (checkMaster.rows.length > 0) {
                if (checkMaster.rows[0].signature_status !== 'Signed' && checkMaster.rows[0].send_status !== 'Success') {
                    const masterId = checkMaster.rows[0].id;
                    await query(`
                        UPDATE health_check_masters SET
                            patient_id = $1, patient_name = $2, cccd = $3, dob = $4, gender = $5,
                            doc_no = $6, form_type = $7, xml_data = $8,
                            his_employee_id = $9, his_contract_id = $10, his_doc_no = $11, 
                            sync_mode = 'HIS', updated_at = NOW(),
                            created_by = COALESCE(created_by, $13),
                            created_by_name = COALESCE(created_by_name, $14)
                        WHERE id = $12
                    `, [String(newPatientNo), patientName, cccd, dob, gender,
                        docNo, formType, xmlData, String(employeeId), emp.hee_contract_id, String(newDocNo), masterId,
                        currentUser, currentUserName]);

                    await query(`
                        UPDATE health_check_details SET
                            clinical_data = $1, lab_data = $2, updated_at = NOW()
                        WHERE master_id = $3
                    `, [JSON.stringify(clinicalData), JSON.stringify(labData), masterId]);
                }
            } else {
                const insertMasterRes = await query(`
                    INSERT INTO health_check_masters (
                        patient_id, patient_name, cccd, dob, gender, doc_no, form_type, xml_data,
                        his_employee_id, his_contract_id, his_doc_no, sync_mode, created_at, updated_at,
                        created_by, created_by_name
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'HIS', NOW(), NOW(), $12, $13)
                    RETURNING id
                `, [String(newPatientNo), patientName, cccd, dob, gender,
                    docNo, formType, xmlData, String(employeeId), emp.hee_contract_id, String(newDocNo),
                    currentUser, currentUserName]);

                const masterId = insertMasterRes.rows[0].id;

                await query(`
                    INSERT INTO health_check_details (
                        master_id, clinical_data, lab_data, created_at, updated_at
                    ) VALUES ($1, $2, $3, NOW(), NOW())
                `, [masterId, JSON.stringify(clinicalData), JSON.stringify(labData)]);
            }
        } catch (syncErr: any) {
            console.error('⚠️ [Tiếp đón KSK] Lỗi khi tạo/đồng bộ hồ sơ KSK sang health_check_masters:', syncErr);
        }

        return {
            alreadyReceived: false,
            docNo: newDocNo,
            patientNo: newPatientNo,
            services: insertedServices
        };
    }

    // Tiếp nhận nhân viên đoàn khám, đồng bộ tạo hồ sơ trên HIS và nạp dịch vụ gói
    async receiveContractEmployee(req: Request, res: Response) {
        try {
            const { employeeId, roomId } = req.body;
            const currentUser = (req as any).user?.username || (req as any).userId || 'admin';
            let currentUserName = (req as any).user?.fullName || (req as any).user?.name || '';
            if (!currentUserName && currentUser) {
                try {
                    const uRes = await query(`SELECT su_name FROM sys_user WHERE su_userid = $1`, [currentUser]);
                    if (uRes.rows.length > 0 && uRes.rows[0].su_name) {
                        currentUserName = uRes.rows[0].su_name;
                    }
                } catch {}
            }
            let activeDeptId = (req as any).deptId;
            if (!activeDeptId) {
                const deptRes = await query(`SELECT sd_id FROM sys_dept WHERE sd_type='KB' LIMIT 1`);
                activeDeptId = deptRes.rows[0]?.sd_id || 'KB';
            }

            if (!employeeId) {
                return res.status(400).json({ error: 'Thiếu mã nhân viên (employeeId)' });
            }

            const result = await this.processSingleEmployeeReception(
                parseInt(String(employeeId), 10),
                roomId ? parseInt(String(roomId), 10) : undefined,
                currentUser,
                currentUserName,
                activeDeptId
            );

            return res.json({
                success: true,
                message: result.alreadyReceived ? 'Nhân viên này đã được tiếp nhận trước đó!' : 'Tiếp nhận nhân viên thành công!',
                data: {
                    docNo: result.docNo,
                    patientNo: result.patientNo,
                    services: result.services
                }
            });
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi receiveContractEmployee:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // Tiếp nhận toàn bộ nhân viên chưa tiếp đón trong gói khám (Bulk Reception)
    async receiveAllContractEmployees(req: Request, res: Response) {
        try {
            const contractId = parseInt(String(req.params.id || req.body.contractId), 10);
            const { roomId } = req.body;
            const currentUser = (req as any).user?.username || (req as any).userId || 'admin';
            let currentUserName = (req as any).user?.fullName || (req as any).user?.name || '';
            if (!currentUserName && currentUser) {
                try {
                    const uRes = await query(`SELECT su_name FROM sys_user WHERE su_userid = $1`, [currentUser]);
                    if (uRes.rows.length > 0 && uRes.rows[0].su_name) {
                        currentUserName = uRes.rows[0].su_name;
                    }
                } catch {}
            }
            let activeDeptId = (req as any).deptId;
            if (!activeDeptId) {
                const deptRes = await query(`SELECT sd_id FROM sys_dept WHERE sd_type='KB' LIMIT 1`);
                activeDeptId = deptRes.rows[0]?.sd_id || 'KB';
            }

            if (!contractId || isNaN(contractId)) {
                return res.status(400).json({ error: 'Thiếu mã hợp đồng/gói khám (contractId)' });
            }

            // Lấy danh sách nhân viên chưa tiếp đón trong hợp đồng
            const unreceivedRes = await query(`
                SELECT hee_employee_id, hee_firstname, hee_cardid
                FROM hms_exm_employee
                WHERE hee_contract_id = $1
                  AND hee_isactive = 'Y'
                  AND (hee_docno IS NULL OR hee_docno = 0)
                ORDER BY hee_employee_id ASC
            `, [contractId]);

            const unreceivedList = unreceivedRes.rows;
            if (unreceivedList.length === 0) {
                return res.json({
                    success: true,
                    total: 0,
                    count: 0,
                    failed: 0,
                    message: 'Tất cả nhân viên trong gói khám đã được tiếp đón trước đó!'
                });
            }

            console.log(`🚀 [receiveAllContractEmployees] Bắt đầu tiếp đón hàng loạt ${unreceivedList.length} nhân viên cho gói #${contractId}...`);

            let successCount = 0;
            const errors: string[] = [];

            for (const emp of unreceivedList) {
                try {
                    await this.processSingleEmployeeReception(
                        emp.hee_employee_id,
                        roomId ? parseInt(String(roomId), 10) : undefined,
                        currentUser,
                        currentUserName,
                        activeDeptId
                    );
                    successCount++;
                } catch (empErr: any) {
                    console.error(`❌ [receiveAllContractEmployees] Lỗi NV #${emp.hee_employee_id}:`, empErr.message);
                    errors.push(`NV #${emp.hee_employee_id} (${emp.hee_firstname || ''}): ${empErr.message}`);
                }
            }

            console.log(`✅ [receiveAllContractEmployees] Hoàn thành tiếp đón ${successCount}/${unreceivedList.length} nhân viên.`);

            return res.json({
                success: true,
                total: unreceivedList.length,
                count: successCount,
                failed: errors.length,
                message: `Đã tiếp đón thành công ${successCount}/${unreceivedList.length} nhân viên!`,
                errors: errors.slice(0, 10)
            });
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi receiveAllContractEmployees:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // Cập nhật thông tin nhân viên trong gói khám
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

            console.log('🔄 [updateEmployee] Cập nhật nhân viên:', { employeeId, surname, midname, firstname, cardId, provId, villId });

            // Lookup và chuẩn hóa mã tỉnh và mã xã
            let provCode = provId ? String(provId).trim() : '';
            let villCode = villId ? String(villId).trim() : '';
            let provNum: number | null = provCode ? (parseInt(provCode, 10) || null) : null;
            let villNum: number | null = villCode ? (parseInt(villCode, 10) || null) : null;

            if (provCode) {
                try {
                    const provRes = await query(`
                        SELECT sp_id, sp_name FROM sys_prov 
                        WHERE sp_id::text = $1 OR sp_name ILIKE $2
                        LIMIT 1
                    `, [provCode, `%${provCode}%`]);
                    if (provRes.rows.length > 0) {
                        provNum = parseInt(provRes.rows[0].sp_id, 10);
                        provCode = String(provRes.rows[0].sp_id).padStart(2, '0');
                    }
                } catch {}
            }

            if (villCode) {
                try {
                    const villRes = await query(`
                        SELECT sv_id, sv_name FROM sys_vill 
                        WHERE sv_id::text = $1 OR sv_name ILIKE $2
                        LIMIT 1
                    `, [villCode, `%${villCode}%`]);
                    if (villRes.rows.length > 0) {
                        villNum = parseInt(villRes.rows[0].sv_id, 10);
                        villCode = String(villRes.rows[0].sv_id).padStart(5, '0');
                    }
                } catch {}
            }

            // 1. Cập nhật hms_exm_employee
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
                    hee_guardian_cccd = $16,
                    hee_prov_code = $17,
                    hee_vill_code = $18
                WHERE hee_employee_id = $19
            `, [
                surname || '',
                midname || '',
                firstname || '',
                dob || null,
                gender || 'M',
                cardId || '',
                phone || '',
                address || '',
                ethnic ? parseInt(String(ethnic), 10) : null,
                provNum,
                distId ? parseInt(String(distId), 10) : null,
                villNum,
                cardIdDate || null,
                cardIdPlace || null,
                guardianName || null,
                guardianCccd || null,
                provCode || null,
                villCode || null,
                employeeId
            ]);

            // 2. Lấy thông tin nhân viên để đồng bộ hms_patient và hồ sơ KSK (nếu đã tiếp nhận)
            const empRes = await query(`SELECT hee_patientno, hee_docno, hee_contract_id FROM hms_exm_employee WHERE hee_employee_id = $1`, [employeeId]);
            const empInfo = empRes.rows[0];

            if (empInfo) {
                const patientNo = empInfo.hee_patientno ? parseInt(String(empInfo.hee_patientno), 10) : null;
                const docNo = empInfo.hee_docno ? String(empInfo.hee_docno) : null;

                // Đồng bộ sang hms_patient
                if (patientNo && patientNo > 0) {
                    try {
                        await query(`
                            UPDATE hms_patient
                            SET 
                                hp_surname = $1,
                                hp_midname = $2,
                                hp_firstname = $3,
                                hp_birthdate = $4,
                                hp_sex = $5,
                                hp_sin = $6,
                                hp_telephone = $7,
                                hp_dtladdr = $8,
                                hp_provid = $9,
                                hp_distid = $10,
                                hp_villid = $11,
                                hp_ethnic = $12
                            WHERE hp_patientno = $13
                        `, [
                            surname || '',
                            midname || '',
                            firstname || '',
                            dob || null,
                            gender || 'M',
                            cardId || '',
                            phone || '',
                            address || '',
                            provNum,
                            distId ? parseInt(String(distId), 10) : null,
                            villNum,
                            ethnic ? parseInt(String(ethnic), 10) : null,
                            patientNo
                        ]);
                    } catch (pErr) {
                        console.warn('⚠️ [updateEmployee] Không thể đồng bộ hms_patient:', pErr);
                    }
                }

                // Đồng bộ sang health_check_masters & health_check_details
                try {
                    const fullName = `${surname || ''} ${midname || ''} ${firstname || ''}`.replace(/\s+/g, ' ').trim().toUpperCase();
                    const mastersRes = await query(`
                        SELECT m.id, d.clinical_data 
                        FROM health_check_masters m
                        LEFT JOIN health_check_details d ON d.master_id = m.id
                        WHERE m.his_employee_id = $1::varchar 
                           OR ($2::varchar IS NOT NULL AND m.his_doc_no = $2::varchar)
                           OR ($2::varchar IS NOT NULL AND m.doc_no = $2::varchar)
                    `, [String(employeeId), docNo]);

                    for (const mRow of mastersRes.rows) {
                        const mId = mRow.id;
                        await query(`
                            UPDATE health_check_masters 
                            SET patient_name = $1, cccd = $2, dob = $3, gender = $4, updated_at = NOW()
                            WHERE id = $5
                        `, [
                            fullName,
                            cardId || '',
                            dob ? new Date(dob) : null,
                            (gender === 'F' || gender === 'Nữ' || gender === '2') ? 'Nữ' : 'Nam',
                            mId
                        ]);

                        let cData: any = {};
                        if (typeof mRow.clinical_data === 'string') {
                            try { cData = JSON.parse(mRow.clinical_data); } catch {}
                        } else if (typeof mRow.clinical_data === 'object' && mRow.clinical_data !== null) {
                            cData = mRow.clinical_data;
                        }

                        cData.address = address || cData.address || '';
                        cData.phone = phone || cData.phone || '';
                        cData.matinh_cu_tru = provCode || (provNum ? String(provNum) : '') || cData.matinh_cu_tru || '';
                        cData.mahuyen_cu_tru = distId ? String(distId) : cData.mahuyen_cu_tru || '';
                        cData.maxa_cu_tru = villCode || (villNum ? String(villNum) : '') || cData.maxa_cu_tru || '';
                        cData.cccd_date = cardIdDate || cData.cccd_date || '';
                        cData.cccd_place = cardIdPlace || cData.cccd_place || '';
                        cData.nguoi_giam_ho = guardianName || cData.nguoi_giam_ho || '';
                        cData.so_cccd_ngh = guardianCccd || cData.so_cccd_ngh || '';
                        if (ethnic) cData.ethnic = String(ethnic).padStart(2, '0');

                        await query(`
                            UPDATE health_check_details
                            SET clinical_data = $1, updated_at = NOW()
                            WHERE master_id = $2
                        `, [JSON.stringify(cData), mId]);
                    }
                } catch (kErr) {
                    console.warn('⚠️ [updateEmployee] Không thể đồng bộ health_check_masters:', kErr);
                }
            }

            return res.json({ success: true, message: 'Cập nhật thông tin thành công!' });
        } catch (error: any) {
            console.error('❌ KSK Controller: Lỗi updateEmployee:', error);
            return res.status(500).json({ error: error.message });
        }
    }
}

export const receptionController = new ReceptionController();
