// ==================== RECEPTION PATIENT CONTROLLER ====================
// File: backend/src/controllers/reception/patient.controller.ts

import { Request, Response } from 'express';
import { query, hmsQuery } from '../../config/database';
import {
    buildPatientPayload,
    buildDocPayload,
    buildCardPayload,
    buildExamPayload,
    ReceptionFormData
} from './helpers';
import { AuthRequest } from '../../middleware/authMiddleware';

class ReceptionPatientController {
    // ==================== DANH SÁCH BỆNH NHÂN ====================

    async getPatients(req: AuthRequest, res: Response) {
        try {
            const { startDate, endDate, roomId, docNo, patientName, userId, deptId: queryDeptId } = (req as any).query;
            const currentUserDept = req.deptId;

            let whereClause = "WHERE hd_status <> 'C' ";
            const params: any[] = [];
            let i = 1;

            // ─── PHÂN QUYỀN KHOA PHÒNG ───
            // Ưu tiên deptId từ query (nếu có), nếu không dùng deptId của user đăng nhập
            const effectiveDeptId = queryDeptId || currentUserDept;
            if (effectiveDeptId) {
                whereClause += `AND he_deptid = $${i++} `;
                params.push(effectiveDeptId);
            }

            if (startDate && endDate) {
                whereClause += `AND hd_admitdate BETWEEN $${i} AND $${i + 1} `;
                params.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
                i += 2;
            } else {
                whereClause += `AND DATE(hd_admitdate) = CURRENT_DATE `;
            }
            if (roomId) { whereClause += `AND he_roomid = $${i++} `; params.push(roomId); }
            if (userId) { whereClause += `AND hd_createdby = $${i++} `; params.push(userId); }
            if (docNo) { whereClause += `AND hd_docno = $${i++} `; params.push(docNo); }
            if (patientName) {
                whereClause += `AND (hp_surname || ' ' || COALESCE(hp_midname,'') || ' ' || hp_firstname) ILIKE $${i++} `;
                params.push(`%${patientName}%`);
            }

            const result = await query(`
                SELECT
                    hd_docno::text || '-' || he_receptno::text       AS "id",
                    hd_docno                                         AS "recordNumber",
                    hp_patientno                                     AS "patientId",
                    trim(COALESCE(hp_surname,'') || ' ' || COALESCE(hp_midname,'') || ' ' || COALESCE(hp_firstname,'')) AS "name",
                    hms_getage(DATE(hd_admitdate), hp_birthdate)     AS "age",
                    hp_sex                                           AS "gender",
                    to_char(hd_admitdate, 'DD/MM/YYYY HH24:MI')     AS "admitDate",
                    hms_getaddress(hp_provid, hp_distid, hp_villid)  AS "address",
                    hd_status                                        AS "status",
                    hd_emergency                                     AS "emergency",
                    CASE 
                        WHEN hd_object = '2' THEN 'BHYT'
                        WHEN hd_object = '4' THEN 'BHYT'
                        WHEN hd_object = '6' THEN 'BHYT'
                        ELSE 'Dịch vụ'
                    END                                             AS "patientType",
                    hd_object                                        AS "objectType",
                    he_roomid                                        AS "roomId",
                    COALESCE(hrl_roomname, hrl_name)                 AS "roomName",
                    he_deptid                                        AS "deptId",
                    he_receptno                                      AS "receptNo",
                    hfl_name                                         AS "examType",
                    hms_getusername(hd_createdby)                    AS "receptionist"
                FROM hms_patient
                LEFT JOIN hms_doc  ON hd_patientno = hp_patientno
                LEFT JOIN hms_exam ON he_docno = hd_docno
                LEFT JOIN hms_roomlist ON hrl_id = he_roomid AND hrl_deptid = he_deptid
                LEFT JOIN hms_feelist  ON hfl_feeid = he_examtype
                ${whereClause}
                ORDER BY hd_admitdate DESC, he_examdate DESC
            `, params);

            return res.json(result.rows);
        } catch (error: any) {
            console.error('❌ getPatients:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // ==================== TRA CỨU BỆNH NHÂN ====================

    async lookupPatient(req: Request, res: Response) {
        try {
            const { cccd, bhyt, docNo } = (req as any).query;

            if (docNo) {
                const r = await query(`
                    SELECT hd_docno as "docNo", hd_patientno as "patientNo",
                           trim(COALESCE(hp_surname,'') || ' ' || COALESCE(hp_midname,'') || ' ' || hp_firstname) as "name",
                           hd_cardno as "cardNo",
                           hd_status as "status",
                           to_char(hd_admitdate, 'YYYY-MM-DD') as "admitDate"
                    FROM hms_doc
                    JOIN hms_patient ON hp_patientno = hd_patientno
                    WHERE hd_docno::text = $1
                    LIMIT 1
                `, [docNo as string]);
                if (r.rows.length > 0) return res.json({ found: true, type: 'doc', data: r.rows[0] });
                return res.json({ found: false });
            }

            if (cccd) {
                const r = await query(
                    `SELECT hp_patientno as "patientNo" FROM hms_patient WHERE hp_sin = $1 LIMIT 1`,
                    [cccd as string]
                );
                if (r.rows.length > 0) return res.json({ found: true, type: 'patient', data: r.rows[0] });
                return res.json({ found: false });
            }

            if (bhyt) {
                const r = await query(`
                    SELECT hd_docno as "docNo", hd_patientno as "patientNo"
                    FROM hms_doc
                    WHERE hd_cardno = $1
                    ORDER BY hd_admitdate DESC
                    LIMIT 1
                `, [bhyt as string]);
                if (r.rows.length > 0) return res.json({ found: true, type: 'card', data: r.rows[0] });
                return res.json({ found: false });
            }

            return res.status(400).json({ error: 'Cần truyền ít nhất một trong: cccd, bhyt, docNo' });
        } catch (error: any) {
            console.error('❌ lookupPatient:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    async getPatientById(req: Request, res: Response) {
        try {
            const { id } = (req as any).params;
            if (!id) return res.status(400).json({ error: 'Mã định danh không được để trống' });

            // Try find by Record Number (docNo)
            let result = await query(`
                SELECT
                    hp_patientno                                     as "id",
                    hp_patientno                                     as "patientId",
                    hd_docno                                         as "recordNumber",
                    hd_status                                        as "status",
                    trim(COALESCE(hp_surname,'') || ' ' || COALESCE(hp_midname,'') || ' ' || hp_firstname) as "name",
                    to_char(hp_birthdate, 'YYYY-MM-DD')              as "dob",
                    to_char(hd_admitdate, 'YYYY-MM-DD"T"HH24:MI')     as "regDateTime",
                    hp_sex                                           as "gender",
                    hp_sin                                           as "identityCard",
                    hp_dtladdr                                       as "address",
                    hp_provid                                        as "provinceId",
                    prov.sp_name                                     as "provinceId_name",
                    hp_distid                                        as "districtId",
                    hp_villid                                        as "wardId",
                    vill.sv_name                                     as "wardId_name",
                    hp_occupation                                    as "occupation",
                    occ.ss_desc                                      as "occupation_name",
                    hp_ethnic                                        as "ethnicity",
                    eth.ss_desc                                      as "ethnicity_name",
                    hp_nationality                                   as "nationality",
                    hp_workplace                                     as "workplace",
                    hp_workplaceid                                   as "workplaceId",
                    hd_admitdept                                     as "regDepartment",
                    dept.sd_name                                     as "regDepartment_name",
                    hd_relation                                      as "relationship",
                    he_roomid                                        as "regRoom",
                    room.hrl_roomname                                as "regRoom_name",
                    hd_object                                        as "patientType",
                    hd_telephone                                     as "phone",
                    hd_relative                                      as "relativeInfo",
                    hd_contacttel                                    as "relativePhone",
                    hd_cardno                                        as "insuranceNumber",
                    to_char(hd_insregdate, 'YYYY-MM-DD')            as "insuranceRegDate",
                    to_char(hd_insexpdate, 'YYYY-MM-DD')            as "insuranceExp",
                    to_char(hd_over5yeardate, 'YYYY-MM-DD')         as "insurance5Year",
                    hc.hc_regcode                                   as "insuranceRegCode",
                    hc.hc_area                                      as "insuranceArea",
                    hd_transplaceid                                  as "transferHospitalCode",
                    hd_transplace                                    as "transferHospital",
                    hd_transdiagn                                    as "transferDiagnosis",
                    hd_reexam                                        as "_isTransferStr",
                    hd_insline                                       as "_insLine",
                    hd_emergency                                     as "_emergency",
                    hd_ma_doituong_kcb                               as "insuranceRouteType",
                    obj_kcb.ss_desc                                  as "insuranceRouteType_name",
                    he_examtype                                      as "regExamType",
                    fee.hfl_name                                     as "regExamType_name"
                FROM hms_doc
                JOIN hms_patient ON hp_patientno = hd_patientno
                LEFT JOIN hms_exam ON he_docno = hd_docno
                LEFT JOIN hms_card hc ON hc.hc_patientno = hp_patientno AND hc.hc_cardno = hd_cardno
                LEFT JOIN sys_prov prov ON prov.sp_id::text = hp_provid::text
                LEFT JOIN sys_vill vill ON vill.sv_id::text = hp_villid::text
                LEFT JOIN sys_sel occ ON occ.ss_id = 'sys_occupation' AND occ.ss_code = hp_occupation::text
                LEFT JOIN sys_sel eth ON eth.ss_id = 'sys_ethnic' AND eth.ss_code = hp_ethnic::text
                LEFT JOIN sys_dept dept ON dept.sd_id::text = hd_admitdept::text
                LEFT JOIN hms_roomlist room ON room.hrl_id = he_roomid AND room.hrl_deptid = hd_admitdept
                LEFT JOIN sys_sel obj_kcb ON obj_kcb.ss_id = 'sys_ma_doituong_kcb' AND obj_kcb.ss_code = hd_ma_doituong_kcb::text
                LEFT JOIN hms_feelist fee ON fee.hfl_feeid = he_examtype
                WHERE hd_docno::text = $1
                ORDER BY he_examdate DESC
                LIMIT 1
            `, [id]);

            // Try find by PID or CCCD
            if (result.rows.length === 0) {
                result = await query(`
                    SELECT
                        hp_patientno                                     as "id",
                        hp_patientno                                     as "patientId",
                        hd_docno                                         as "recordNumber",
                        trim(COALESCE(hp_surname,'') || ' ' || COALESCE(hp_midname,'') || ' ' || hp_firstname) as "name",
                        to_char(hp_birthdate, 'YYYY-MM-DD')              as "dob",
                        to_char(hd_admitdate, 'YYYY-MM-DD"T"HH24:MI')     as "regDateTime",
                        hp_sex                                           as "gender",
                        hp_sin                                           as "identityCard",
                        hp_dtladdr                                       as "address",
                        hp_provid                                        as "provinceId",
                        prov.sp_name                                     as "provinceId_name",
                        hp_distid                                        as "districtId",
                        hp_villid                                        as "wardId",
                        vill.sv_name                                     as "wardId_name",
                        hp_occupation                                    as "occupation",
                        occ.ss_desc                                      as "occupation_name",
                        hp_ethnic                                        as "ethnicity",
                        eth.ss_desc                                      as "ethnicity_name",
                        hp_nationality                                   as "nationality"
                    FROM hms_patient
                    LEFT JOIN hms_doc ON hd_patientno = hp_patientno AND DATE(hd_admitdate) = CURRENT_DATE AND hd_status <> 'T'
                    LEFT JOIN sys_prov prov ON prov.sp_id::text = hp_provid::text
                    LEFT JOIN sys_vill vill ON vill.sv_id::text = hp_villid::text
                    LEFT JOIN sys_sel occ ON occ.ss_id = 'sys_occupation' AND occ.ss_code = hp_occupation::text
                    LEFT JOIN sys_sel eth ON eth.ss_id = 'sys_ethnic' AND eth.ss_code = hp_ethnic::text
                    WHERE hp_patientno::text = $1 OR hp_sin = $1
                    ORDER BY hd_admitdate DESC NULLS LAST
                    LIMIT 1
                `, [id]);
            }

            if (result.rows.length === 0) return res.json(null);

            const data = result.rows[0];

            // Normalize ALL ID fields to String to match updated Catalog APIs
            const idFields = [
                'id', 'patientId', 'recordNumber', 'provinceId', 'districtId', 'wardId',
                'occupation', 'ethnicity', 'regDepartment', 'regRoom', 'insuranceRouteType', 'nationality', 'relationship', 'workplaceId',
                'regExamType'
            ];
            idFields.forEach(field => {
                if (data[field] !== undefined && data[field] !== null) {
                    data[field] = String(data[field]).trim();
                }
            });

            // Normalize data for Frontend
            if (data.gender) {
                const g = (data.gender || '').toLowerCase();
                data.gender = (g === 'm' || g.includes('nam')) ? 'Nam' : 'Nữ';
            }
            // Keep patientType as numeric ID from DB, UI will handle translation via Catalog

            data.isTransfer = data._isTransferStr === 'Y';
            if (data._insLine === 'Y') data.route = 'Trái tuyến';
            else if (data._emergency === 'Y') data.route = 'Cấp cứu';
            else data.route = 'Đúng tuyến';

            delete data._isTransferStr;
            delete data._insLine;
            delete data._emergency;

            const histRes = await query(`
                SELECT
                    he_docno as id,
                    to_char(MAX(he_examdate), 'DD/MM/YYYY HH24:MI') as "examDateTime",
                    he_docno     as "docNo",
                    MAX(he_receptno) as "receptNo",
                    string_agg(DISTINCT COALESCE(NULLIF(TRIM(hrl_roomname), ''), hrl_name), ', ') as "roomName",
                    MAX(hfl_name) as "examType",
                    MAX(he_doctor)   as "doctor",
                    COALESCE(NULLIF(string_agg(DISTINCT he_diagnostic, '; '), ''), MAX(he_diagnostic)) as "diagnosis",
                    CASE WHEN 'E' = ANY(array_agg(he_status)) THEN 'Đang khám' ELSE 'Đã kết thúc' END as "status"
                FROM hms_exam
                LEFT JOIN hms_roomlist ON hrl_id = he_roomid AND hrl_deptid = he_deptid
                LEFT JOIN hms_feelist  ON hfl_feeid = he_examtype
                WHERE he_patientno = $1
                GROUP BY he_docno
                ORDER BY MAX(he_examdate) DESC
                LIMIT 20
            `, [data.patientId || data.id]);

            data.history = histRes.rows;
            return res.json(data);
        } catch (error: any) {
            console.error('❌ getPatientById:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // ==================== TẠO MỚI BỆNH NHÂN + PHIẾU KHÁM ====================

    async createPatient(req: AuthRequest, res: Response) {
        try {
            const data: ReceptionFormData = (req as any).body;
            const currentUser = (req as any).user?.username || (req as any).user?.id || 'admin';

            if (!data.regRoom) {
                return res.status(400).json({ error: 'Thiếu Phòng khám (regRoom). Không thể tạo phiếu.' });
            }

            const payload = {
                mode: data.mode || 'ADD_PATIENT',
                currentUser: currentUser,
                patient: buildPatientPayload(data),
                doc: buildDocPayload(data, req.deptId),
                card: buildCardPayload(data),
                exam: buildExamPayload(data, req.deptId)
            };

            const result = await hmsQuery(req,
                `SELECT hms_register_patient_v2($1::jsonb) AS data`,
                [JSON.stringify(payload)]
            );
            const dbResult = result.rows[0].data;

            return res.status(201).json({
                success: true,
                message: payload.mode === 'ADD_EXAM' ? 'Thêm phiếu khám thành công' : 'Đăng ký tiếp đón thành công',
                data: dbResult
            });
        } catch (error: any) {
            console.error('❌ createPatient:', error);
            return res.status(500).json({ error: error.message || 'Lỗi hệ thống' });
        }
    }

    // ==================== THÊM HỒ SƠ KHÁM CHO BN CŨ ====================

    async addDocForExistingPatient(req: AuthRequest, res: Response) {
        try {
            const data: ReceptionFormData = (req as any).body;
            const currentUser = (req as any).user?.username || (req as any).user?.id || 'admin';

            const patientId = ((req as any).body.patientId || (req as any).body.id || (req as any).params.id);
            if (!patientId) {
                return res.status(400).json({ error: 'Thiếu patientId.' });
            }

            const payload = {
                mode: data.mode || 'ADD_DOC',
                currentUser: currentUser,
                patient: { patientNo: String(patientId) },
                doc: buildDocPayload(data, req.deptId),
                card: buildCardPayload(data),
                exam: buildExamPayload(data, req.deptId)
            };

            const result = await hmsQuery(req,
                `SELECT hms_register_patient_v2($1::jsonb) AS data`,
                [JSON.stringify(payload)]
            );
            const dbResult = result.rows[0].data;

            return res.status(201).json({
                success: true,
                message: payload.mode === 'ADD_EXAM' ? 'Thêm phiếu đăng ký thành công' : 'Tạo lượt khám mới thành công',
                data: dbResult
            });
        } catch (error: any) {
            console.error('❌ addDocForExistingPatient:', error);
            return res.status(500).json({ error: error.message || 'Lỗi hệ thống' });
        }
    }

    // ==================== THÊM PHIẾU KHÁM CHO HS ĐANG MỞ ====================

    async addExamForExistingPatient(req: AuthRequest, res: Response) {
        // Có thể dùng chung logic với addDoc nhưng với mode mặc định là ADD_EXAM
        (req as any).body.mode = 'ADD_EXAM';
        return this.addDocForExistingPatient(req, res);
    }

    // ==================== CẬP NHẬT THÔNG TIN BN ====================

    async updatePatient(req: AuthRequest, res: Response) {
        try {
            const { id } = (req as any).params;
            const data = (req as any).body;
            const currentUser = (req as any).user?.username || (req as any).user?.id || 'admin';

            const patientNo = data.id || data.patientId || id;
            const docNo = data.recordNumber;

            if (!patientNo) return res.status(400).json({ error: 'Thiếu patientNo' });

            // 1. FETCH CURRENT STATE FOR AUDIT AND SEQUENCE HANDLING
            const current = await query(
                `SELECT p.*, d.*, e.* 
                 FROM hms_patient p
                 LEFT JOIN hms_doc d ON d.hd_patientno = p.hp_patientno AND d.hd_docno = $2
                 LEFT JOIN hms_exam e ON e.he_docno = d.hd_docno AND e.he_receptidx = 1
                 WHERE p.hp_patientno = $1`,
                [patientNo, docNo || 0]
            );
            const old = current.rows[0] || {};

            const val = (newVal: any, oldVal: any) => {
                if (newVal === undefined || newVal === null || String(newVal).trim() === '') return oldVal;
                return newVal;
            };

            const nameParts = (data.name || '').trim().split(/\s+/);
            const firstName = nameParts.length > 0 ? nameParts.pop() || '' : '';
            const surname = nameParts.length > 0 ? nameParts.shift() || '' : '';
            const midName = nameParts.join(' ');

            // 2. UPDATE hms_patient
            await hmsQuery(req, `
                UPDATE hms_patient SET
                    hp_surname = $1, hp_firstname = $2, hp_midname = $17,
                    hp_birthdate = $3, hp_sex = $4, hp_sin = $5,
                    hp_provid = $6, hp_distid = $7, hp_villid = $8,
                    hp_dtladdr = $9, hp_occupation = $10, hp_ethnic = $11,
                    hp_workplace = $12, hp_workplaceid = $13, hp_nationality = $14,
                    hp_updatedby = $15, hp_updateddate = NOW()
                WHERE hp_patientno = $16
            `, [
                surname, firstName, data.dob || null, data.gender === 'Nam' ? 'M' : 'F',
                data.identityCard || '', parseInt(String(val(data.provinceId, old.hp_provid))) || 0,
                parseInt(String(val(data.districtId, old.hp_distid))) || 0, parseInt(String(val(data.wardId, old.hp_villid))) || 0,
                data.address || '', parseInt(String(val(data.occupation, old.hp_occupation))) || 0,
                parseInt(String(val(data.ethnicity, old.hp_ethnic))) || 0, data.workplace || '',
                val(data.workplaceId, old.hp_workplaceid), data.nationality || 'VN',
                currentUser, patientNo, midName
            ]);

            if (docNo) {
                // 3. RECNO RECALCULATION (If room changed)
                let receptNo = old.he_receptno;
                if (data.regRoom && Number(data.regRoom) !== Number(old.he_roomid)) {
                    const recRes = await query(
                        `SELECT hms_get_next_receptno($1, $2, CURRENT_DATE) as new_no`,
                        [data.regDepartment || old.he_deptid, data.regRoom]
                    );
                    receptNo = recRes.rows[0]?.new_no || 1;
                }

                // 4. OBJECT & RATES
                const pt = String(data.patientType || '7');
                let objectId: number;
                if (pt === 'Bảo hiểm' || pt === 'I') objectId = 4;
                else if (pt === 'Dịch vụ' || pt === 'S') objectId = 7;
                else objectId = parseInt(pt) || 7;
                let insLine = 'N', emergency = 'N', disRate = 80;
                if (data.route === 'Trái tuyến') { insLine = 'Y'; disRate = 48; }
                else if (data.route === 'Cấp cứu') { emergency = 'Y'; }

                // 5. UPDATE hms_doc
                await hmsQuery(req, `
                    UPDATE hms_doc SET
                        hd_telephone = $1, hd_relative = $2, hd_contacttel = $3,
                        hd_object = $4, hd_insline = $5, hd_emergency = $6,
                        hd_disrate = $7, hd_transplace = $8, hd_transdiagn = $9,
                        hd_transplaceid = $10, hd_reexam = $11, hd_ma_doituong_kcb = $12,
                        hd_relation = $13, hd_admitdate = $14, hd_admitdept = $15,
                        hd_cardno = $16,
                        hd_insregdate = $19, hd_insexpdate = $20, hd_over5yeardate = $21,
                        hd_updatedby = $17, hd_updateddate = NOW()
                    WHERE hd_docno = $18
                `, [
                    data.phone || '', data.relativeInfo || '', data.relativePhone || '',
                    objectId, insLine, emergency, disRate, data.transferHospital || '',
                    data.transferDiagnosis || '', data.transferHospitalCode || '',
                    data.isTransfer ? 'Y' : 'N', parseInt(String(val(data.insuranceRouteType, 1))) || 1,
                    parseInt(String(val(data.relationship, old.hd_relation || 0))) || 0, data.regDateTime || null,
                    val(data.regDepartment, old.hd_admitdept || req.deptId || 'KKB'), data.insuranceNumber || '',
                    currentUser, docNo,
                    data.insuranceRegDate || null, data.insuranceExp || null, data.insurance5Year || null
                ]);

                // 6. UPDATE/INSERT hms_card (BHYT)
                if (data.insuranceNumber) {
                    // Cari thẻ đang hoạt động của bệnh nhân để so sánh
                    const cardRes = await query(
                        `SELECT hc_idx, hc_cardno, hc_regdate, hc_expdate, hc_regcode 
                         FROM hms_card 
                         WHERE hc_patientno = $1 AND hc_active = 'Y'
                         ORDER BY hc_idx DESC LIMIT 1`,
                        [patientNo]
                    );
                    const oldCard = cardRes.rows[0];

                    if (!oldCard || oldCard.hc_cardno !== data.insuranceNumber) {
                        // Nếu chưa có thẻ hoặc số thẻ thay đổi -> Vô hiệu hóa thẻ cũ (nếu có) và tạo thẻ mới
                        if (oldCard) {
                            await hmsQuery(req, `UPDATE hms_card SET hc_active = 'N' WHERE hc_idx = $1`, [oldCard.hc_idx]);
                        }

                        const idxRes = await query(`SELECT nextval('hms_card_hc_idx_seq') as idx`);
                        const newIdx = idxRes.rows[0].idx;
                        await hmsQuery(req, `INSERT INTO hms_card (
                                hc_createdby, hc_createddate, hc_patientno, hc_cardno, hc_idx,
                                hc_regdate, hc_expdate, hc_regcode, hc_active, hc_discount
                            ) VALUES ($1, NOW(), $2, $3, $4, $5, $6, $7, 'Y', 80)
                        `, [currentUser, patientNo, data.insuranceNumber, newIdx, data.insuranceRegDate || null, data.insuranceExp || null, data.insuranceRegCode || '']);
                        await hmsQuery(req, `UPDATE hms_doc SET hd_cardidx = $1 WHERE hd_docno = $2`, [newIdx, docNo]);
                    } else {
                        // Nếu trùng số thẻ -> Kiểm tra xem có thay đổi ngày hạn hay nơi đăng ký không (gia hạn thẻ)
                        const hasCardChanges =
                            (data.insuranceRegDate && oldCard.hc_regdate && new Date(oldCard.hc_regdate).toISOString().slice(0, 10) !== data.insuranceRegDate) ||
                            (data.insuranceExp && oldCard.hc_expdate && new Date(oldCard.hc_expdate).toISOString().slice(0, 10) !== data.insuranceExp) ||
                            (oldCard.hc_regcode !== data.insuranceRegCode);

                        if (hasCardChanges) {
                            await hmsQuery(req, `UPDATE hms_card SET
                                hc_regdate = $1, hc_expdate = $2, hc_regcode = $3
                                WHERE hc_idx = $4
                            `, [data.insuranceRegDate || null, data.insuranceExp || null, data.insuranceRegCode || '', oldCard.hc_idx]);
                        }
                        await hmsQuery(req, `UPDATE hms_doc SET hd_cardidx = $1 WHERE hd_docno = $2`, [oldCard.hc_idx, docNo]);
                    }
                } else if (old.hd_cardno) {
                    await hmsQuery(req, `UPDATE hms_card SET hc_active = 'N' WHERE hc_patientno = $1 AND hc_cardno = $2`, [patientNo, old.hd_cardno]);
                    await hmsQuery(req, `UPDATE hms_doc SET hd_cardidx = 0, hd_cardno = '' WHERE hd_docno = $1`, [docNo]);
                }

                // 7. UPDATE PRIMARY EXAM (he_receptidx = 1)
                await hmsQuery(req, `
                    UPDATE hms_exam SET
                        he_roomid = $1, he_receptno = $2, he_examtype = $3,
                        he_diagnostic = $4, he_deptid = $5,
                        he_updatedby = $6, he_updateddate = NOW()
                    WHERE he_docno = $7 AND he_receptidx = 1
                `, [
                    data.regRoom, receptNo, data.regExamType,
                    data.regReason || '', data.regDepartment,
                    currentUser, docNo
                ]);
            }

            return res.status(200).json({ success: true, message: 'Cập nhật thông tin thành công' });
        } catch (error: any) {
            console.error('❌ updatePatient:', error);
            return res.status(500).json({ error: error.message || 'Lỗi hệ thống' });
        }
    }

    async getQueueStatus(req: Request, res: Response) {
        return res.json({ id: 'DEFAULT', name: 'Quầy Tiếp nhận chung', currentNumber: 0, waitingCount: 0 });
    }

    async callNextPatient(req: Request, res: Response) {
        return res.json({ success: true });
    }

    // ==================== XÓA TIẾP ĐÓN (DELETE) ====================

    async deletePatientRegistration(req: AuthRequest, res: Response) {
        try {
            const { id } = (req as any).params; // docNo
            const { receptIdx } = (req as any).body;
            const docNo = id;

            if (!docNo) return res.status(400).json({ error: 'Thiếu docNo' });

            // 1. KIỂM TRA ĐIỀU KIỆN XÓA (VIMES logic)
            // 1.1 Kiểm tra xem đã thanh toán chưa
            const payRes = await query(
                `SELECT count(*) FROM hms_fee_invoice WHERE hfi_docno = $1 AND hfi_type = 'A' AND hfi_status = 'P'`,
                [docNo]
            );
            if (parseInt(payRes.rows[0].count) > 0) {
                return res.status(400).json({ error: 'Bệnh nhân đã thanh toán viện phí. Không thể xóa tiếp đón.' });
            }

            // 1.2 Kiểm tra xem đã có chỉ định dịch vụ/CLS/thuốc chưa (trong hms_fee)
            const orderRes = await query(
                `SELECT count(*) FROM hms_fee WHERE hfe_docno = $1`,
                [docNo]
            );
            if (parseInt(orderRes.rows[0].count) > 0) {
                return res.status(400).json({ error: 'Bệnh nhân đã có chỉ định dịch vụ hoặc thuốc. Không thể xóa tiếp đón.' });
            }

            // 2. THỰC HIỆN XÓA
            // 2.1 Xóa hms_exam
            await hmsQuery(req, `DELETE FROM hms_exam WHERE he_docno = $1 AND he_receptidx = $2`, [docNo, receptIdx || 1]);

            // 2.2 Xóa hms_doc nếu không còn phiếu khám nào
            const remainingExams = await query(`SELECT count(*) FROM hms_exam WHERE he_docno = $1`, [docNo]);
            if (parseInt(remainingExams.rows[0].count) === 0) {
                const docInfo = await query(`SELECT hd_patientno FROM hms_doc WHERE hd_docno = $1`, [docNo]);
                const patientNo = docInfo.rows[0]?.hd_patientno;

                await hmsQuery(req, `DELETE FROM hms_doc WHERE hd_docno = $1`, [docNo]);

                // 2.3 Xóa hms_patient nếu không còn hồ sơ nào (optional, match legacy behavior)
                if (patientNo) {
                    const remainingDocs = await query(`SELECT count(*) FROM hms_doc WHERE hd_patientno = $1`, [patientNo]);
                    if (parseInt(remainingDocs.rows[0].count) === 0) {
                        await hmsQuery(req, `DELETE FROM hms_card WHERE hc_patientno = $1`, [patientNo]);
                        await hmsQuery(req, `DELETE FROM hms_patient WHERE hp_patientno = $1`, [patientNo]);
                    }
                }
            }

            return res.json({ success: true, message: 'Xóa tiếp đón thành công' });
        } catch (error: any) {
            console.error('❌ deletePatientRegistration:', error);
            return res.status(500).json({ error: error.message || 'Lỗi hệ thống' });
        }
    }

    // ==================== ĐÓNG HỒ SƠ ====================
    async terminateDoc(req: AuthRequest, res: Response) {
        try {
            const { docNo } = (req as any).params;
            const currentUser = (req as any).user?.username || 'admin';

            await query(`
                UPDATE hms_doc SET 
                    hd_status = 'T',
                    hd_updatedby = $2,
                    hd_updateddate = NOW()
                WHERE hd_docno = $1
            `, [docNo, currentUser]);

            return res.json({ success: true, message: 'Đã kết thúc hồ sơ thành công' });
        } catch (error: any) {
            console.error('❌ terminateDoc:', error);
            return res.status(500).json({ error: error.message });
        }
    }
}

export default new ReceptionPatientController();
