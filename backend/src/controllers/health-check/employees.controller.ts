import { Request, Response } from 'express';
import { query } from '../../config/database';
import { calculateAge, parseFitnessClassFromText, evaluateFitnessClass, buildSpecialtyMetadata } from '../../services/health-check-classifier.service';
import { hisIntegrationController } from './his-integration';

export class EmployeesController {
    // Lấy danh sách nhân viên trong hợp đồng
    async getContractEmployees(req: Request, res: Response) {
        const { id } = req.params;
        const contractId = parseInt(id as string, 10);
        try {
            const result = await query(`
                WITH contract_cls AS (
                    SELECT 
                        m.his_doc_no,
                        m.his_employee_id,
                        CASE WHEN (
                            d.lab_data IS NOT NULL AND (
                                (d.lab_data->>'kq_xn_khac' IS NOT NULL AND TRIM(d.lab_data->>'kq_xn_khac') <> '')
                                OR (d.lab_data->'blood_test'->>'glycemia' IS NOT NULL AND TRIM(d.lab_data->'blood_test'->>'glycemia') <> '')
                                OR (d.lab_data->'blood_test'->>'hemoglobin' IS NOT NULL AND TRIM(d.lab_data->'blood_test'->>'hemoglobin') <> '')
                                OR (d.lab_data->'urine_test'->>'protein' IS NOT NULL AND TRIM(d.lab_data->'urine_test'->>'protein') <> '')
                                OR (d.lab_data->>'paraclinical_items' LIKE '%"value":_%' AND d.lab_data->>'paraclinical_items' NOT LIKE '%"value":""%')
                            )
                        ) THEN true ELSE false END as has_cls
                    FROM health_check_masters m
                    JOIN health_check_details d ON d.master_id = m.id
                    WHERE m.his_contract_id::text = $1::text
                )
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
                    COALESCE(e.hee_funding_source, '9') as funding_source,
                    COALESCE(e.hee_funding_source, '9') as nguon_chi_tra,
                    COALESCE(NULLIF(TRIM(e.hee_prov_code), ''), e.hee_provid::text, '') as prov_id,
                    COALESCE(NULLIF(TRIM(e.hee_vill_code), ''), e.hee_villid::text, '') as vill_id,
                    p.sp_name as prov_name,
                    v.sv_name as vill_name,
                    COALESCE(e.hee_address, '') as address,
                    (SELECT send_status FROM health_check_masters m 
                     WHERE m.his_employee_id::text = e.hee_employee_id::text AND m.his_contract_id::text = $1::text LIMIT 1) as sync_status,
                    COALESCE(c1.has_cls, c2.has_cls, false) as has_cls_result,
                    e.hee_height as height,
                    e.hee_weight as weight,
                    e.hee_bloodpressure as blood_pressure,
                    e.hee_pulse as pulse,
                    e.hee_temperature as temperature,
                    e.hee_respiration as respiration,
                    e.hee_conclusion as conclusion,
                    e.hee_comment as comment,
                    e.hee_righteye as eye,
                    (e.hee_clinical_data IS NOT NULL OR e.hee_height IS NOT NULL OR e.hee_conclusion IS NOT NULL) as has_clinical_data,
                    e.hee_clinical_data as clinical_data,
                    e.hee_conclusion_data as conclusion_data
                FROM hms_exm_employee e
                LEFT JOIN sys_prov p ON p.sp_id::text = COALESCE(NULLIF(TRIM(e.hee_prov_code), ''), e.hee_provid::text)
                LEFT JOIN sys_vill v ON v.sv_id::text = COALESCE(NULLIF(TRIM(e.hee_vill_code), ''), e.hee_villid::text)
                LEFT JOIN sys_sel occ ON trim(occ.ss_id) = 'sys_occupation' AND trim(occ.ss_code) = trim(e.hee_occupation::text)
                LEFT JOIN contract_cls c1 ON (COALESCE(NULLIF(TRIM(e.hee_docno::text), ''), '0') <> '0' AND c1.his_doc_no = e.hee_docno::text)
                LEFT JOIN contract_cls c2 ON c2.his_employee_id = e.hee_employee_id::text
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
                const occRes = await query(`SELECT ss_code, ss_desc FROM sys_sel WHERE trim(ss_id)='sys_occupation'`);
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

            // 1.1. Tải trước danh sách nhân viên hiện có trong hợp đồng để tránh trùng lặp & hỗ trợ cập nhật kết quả khám
            const existingEmpsRes = await query(`
                SELECT hee_employee_id, hee_id, hee_cardid, hee_docno 
                FROM hms_exm_employee 
                WHERE hee_contract_id = $1 AND hee_isactive = 'Y'
            `, [contractId]);
            const existingByCard = new Map<string, { id: number, docNo: number }>();
            const existingByCode = new Map<string, { id: number, docNo: number }>();
            for (const row of existingEmpsRes.rows) {
                if (row.hee_cardid) existingByCard.set(String(row.hee_cardid).trim(), { id: row.hee_employee_id, docNo: row.hee_docno || 0 });
                if (row.hee_id) existingByCode.set(String(row.hee_id).trim().toLowerCase(), { id: row.hee_employee_id, docNo: row.hee_docno || 0 });
            }

            const maxIdRes = await query(`SELECT COALESCE(MAX(NULLIF(regexp_replace(hee_employee_id::text, '[^0-9]', '', 'g'), '')::bigint), 0) as max_id FROM hms_exm_employee`);
            let currentMaxId = parseInt(maxIdRes.rows[0].max_id, 10);

            // 2. Bắt đầu Transaction để thực thi nhanh & đảm bảo an toàn toàn vẹn dữ liệu
            await query('BEGIN');

            try {
                // Chunk nhỏ xử lý batch nếu cần
                const BATCH_SIZE = 50;
                for (let b = 0; b < employees.length; b += BATCH_SIZE) {
                    const batch = employees.slice(b, b + BATCH_SIZE);

                    for (const emp of batch) {
                        const fullName = String(emp.name || '').replace(/\s+/g, ' ').trim();
                        
                        const nameParts = fullName.split(/\s+/);
                        let surname = '';
                        let midname = '';
                        let firstname = '';

                        if (nameParts.length === 1) {
                            firstname = nameParts[0].slice(0, 15);
                        } else if (nameParts.length === 2) {
                            surname = nameParts[0].slice(0, 15);
                            firstname = nameParts[1].slice(0, 15);
                        } else if (nameParts.length > 2) {
                            surname = nameParts[0].slice(0, 15);
                            firstname = nameParts[nameParts.length - 1].slice(0, 15);
                            midname = nameParts.slice(1, nameParts.length - 1).join(' ').slice(0, 45);
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

                        // Cắt gọt và làm sạch các trường độ dài cố định (đảm bảo tương thích Stored Procedure hms_exm_registration_exam VARCHAR(15))
                        const empCode = String(emp.code || `NV${currentMaxId + 1}`).trim().slice(0, 15);
                        
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
                        const fundingSource = String(emp.funding_source || emp.nguon_chi_tra || '9').trim().slice(0, 50);

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

                        // Trích xuất Thể lực & Sinh hiệu
                        const rawHeight = emp.height ?? emp.chieu_cao ?? emp.clinical_data?.examination?.height;
                        const heightNum = rawHeight ? (parseFloat(String(rawHeight).replace(',', '.')) || null) : null;

                        const rawWeight = emp.weight ?? emp.can_nang ?? emp.clinical_data?.examination?.weight;
                        const weightNum = rawWeight ? (parseFloat(String(rawWeight).replace(',', '.')) || null) : null;

                        let bmiVal = emp.bmi ?? emp.clinical_data?.examination?.bmi;
                        if (!bmiVal && heightNum && weightNum && heightNum > 0 && weightNum > 0) {
                            bmiVal = (weightNum / Math.pow(heightNum / 100, 2)).toFixed(2);
                        }

                        const rawBp = emp.blood_pressure ?? emp.huyet_ap ?? emp.ha ?? emp.bp ?? emp.clinical_data?.examination?.blood_pressure;
                        const bpStr = rawBp ? String(rawBp).trim().slice(0, 20) : '';

                        const rawPulse = emp.pulse ?? emp.mach ?? emp.nhip_tim ?? emp.clinical_data?.examination?.pulse;
                        const pulseNum = rawPulse ? (parseFloat(String(rawPulse)) || null) : null;

                        const rawTemp = emp.temperature ?? emp.nhiet_do ?? emp.temp ?? emp.clinical_data?.examination?.temperature;
                        const tempNum = rawTemp ? (parseFloat(String(rawTemp).replace(',', '.')) || null) : null;

                        const rawResp = emp.breathing_rate ?? emp.respiration ?? emp.nhip_tho ?? emp.clinical_data?.examination?.breathing_rate;
                        const respNum = rawResp ? (parseFloat(String(rawResp)) || null) : null;

                        const physicalSummary = String(emp.physical_summary ?? emp.the_luc ?? emp.kham_the_luc ?? emp.clinical_data?.examination?.physical_summary ?? '').trim().slice(0, 254);

                        // Trích xuất Khám lâm sàng chuyên khoa
                        const internalStr = String(emp.internal ?? emp.noi_khoa ?? emp.noikhoa ?? emp.clinical_data?.clinical_exam?.internal ?? '').trim().slice(0, 254);
                        const externalStr = String(emp.external ?? emp.ngoai_khoa ?? emp.ngoaikhoa ?? emp.clinical_data?.clinical_exam?.external ?? '').trim().slice(0, 254);
                        const dermStr = String(emp.dermatology ?? emp.da_lieu ?? emp.dalieu ?? emp.clinical_data?.clinical_exam?.dermatology ?? '').trim().slice(0, 254);
                        const gynStr = String(emp.gynecology ?? emp.san_phu_khoa ?? emp.phu_khoa ?? emp.clinical_data?.clinical_exam?.gynecology ?? '').trim().slice(0, 254);
                        const eyeStr = String(emp.eye ?? emp.mat ?? emp.thi_luc ?? emp.clinical_data?.clinical_exam?.eye ?? '').trim().slice(0, 100);
                        const entStr = String(emp.ent ?? emp.tai_mui_hong ?? emp.tmh ?? emp.clinical_data?.clinical_exam?.ent ?? '').trim().slice(0, 254);
                        const dentalStr = String(emp.dental ?? emp.rang_ham_mat ?? emp.rhm ?? emp.clinical_data?.clinical_exam?.dental ?? '').trim().slice(0, 254);

                        const circStr = String(emp.circulatory ?? emp.tuan_hoan ?? emp.tim_mach ?? emp.clinical_data?.clinical_exam?.circulatory ?? '').trim().slice(0, 254);
                        const respSpecStr = String(emp.respiratory ?? emp.ho_hap ?? emp.clinical_data?.clinical_exam?.respiratory ?? '').trim().slice(0, 254);
                        const digestStr = String(emp.digestive ?? emp.tieu_hoa ?? emp.clinical_data?.clinical_exam?.digestive ?? '').trim().slice(0, 254);
                        const urinaryStr = String(emp.urinary ?? emp.than_tiet_nieu ?? emp.tiet_nieu ?? emp.clinical_data?.clinical_exam?.urinary ?? '').trim().slice(0, 254);
                        const endocStr = String(emp.endocrine ?? emp.noi_tiet ?? emp.clinical_data?.clinical_exam?.endocrine ?? '').trim().slice(0, 254);
                        const musculoStr = String(emp.musculoskeletal ?? emp.co_xuong_khop ?? emp.clinical_data?.clinical_exam?.musculoskeletal ?? '').trim().slice(0, 254);
                        const neuroStr = String(emp.neurology ?? emp.than_kinh ?? emp.clinical_data?.clinical_exam?.neurology ?? '').trim().slice(0, 254);
                        const psychStr = String(emp.psychiatry ?? emp.tam_than ?? emp.clinical_data?.clinical_exam?.psychiatry ?? '').trim().slice(0, 254);

                        // Kết luận & phân loại sức khỏe: CHỈ ghi nhận khi trong file Excel thực sự có nhập
                        const rawFitness = emp.fitness_class ?? emp.phan_loai_sk ?? emp.loai_sk ?? emp.conclusion_data?.fitness_class;
                        const fitnessClassNum = parseFitnessClassFromText(rawFitness);

                        const diagStr = String(emp.diagnosis ?? emp.ket_luan ?? emp.chan_doan ?? emp.conclusion_data?.diagnosis ?? '').trim().slice(0, 254);
                        const remarkStr = String(emp.cac_van_de_luu_y ?? emp.benh_tat_luu_y ?? emp.loi_dan ?? emp.remark ?? emp.conclusion_data?.cac_van_de_luu_y ?? '').trim().slice(0, 254);
                        const doctorName = String(emp.doctor_name ?? emp.bac_si_ket_luan ?? emp.conclusion_data?.doctor_name ?? '').trim().slice(0, 100);

                        const hasExplicitConclusion = !!(fitnessClassNum || diagStr);
                        const hasInternalData = !!(internalStr || circStr || respSpecStr || digestStr || urinaryStr || endocStr || musculoStr || neuroStr || psychStr);
                        const hasAnyExam = !!(
                            heightNum || weightNum || bpStr || pulseNum || tempNum || respNum || physicalSummary ||
                            hasInternalData || externalStr || dermStr || gynStr || eyeStr || entStr || dentalStr
                        );
                        const hasClinicalData = hasAnyExam || hasExplicitConclusion;

                        let clinicalDataJson: any = null;
                        let conclusionDataJson: any = null;

                        if (hasClinicalData) {
                            // Phân tích thị lực từ text khám mắt nếu có (ví dụ "10/10" hoặc "Mắt phải 10/10, Mắt trái 10/10")
                            let eyeRight = '';
                            let eyeLeft = '';
                            if (eyeStr) {
                                const fractionMatch = eyeStr.match(/(\d+\s*\/\s*\d+)/g);
                                if (fractionMatch && fractionMatch.length >= 2) {
                                    eyeRight = fractionMatch[0].replace(/\s+/g, '');
                                    eyeLeft = fractionMatch[1].replace(/\s+/g, '');
                                } else if (fractionMatch && fractionMatch.length === 1) {
                                    eyeRight = fractionMatch[0].replace(/\s+/g, '');
                                    eyeLeft = fractionMatch[0].replace(/\s+/g, '');
                                } else if (eyeStr.toLowerCase().includes('10/10')) {
                                    eyeRight = '10/10';
                                    eyeLeft = '10/10';
                                }
                            }

                            clinicalDataJson = {
                                examination: {
                                    height: heightNum ? String(heightNum) : '',
                                    weight: weightNum ? String(weightNum) : '',
                                    bmi: bmiVal ? String(bmiVal) : '',
                                    blood_pressure: bpStr,
                                    pulse: pulseNum ? String(pulseNum) : '',
                                    temperature: tempNum ? String(tempNum) : '',
                                    breathing_rate: respNum ? String(respNum) : '',
                                    physical_summary: physicalSummary,
                                    kham_the_luc_pl: (physicalSummary || emp.kham_the_luc_pl) ? '1' : ''
                                },
                                clinical_exam: {
                                    // Nội khoa tổng quát và chi tiết từng hệ cơ quan
                                    internal: internalStr || circStr || respSpecStr || digestStr || '',
                                    kq_tim_mach: circStr || (internalStr ? internalStr : ''),
                                    kq_ho_hap: respSpecStr || (internalStr ? 'Bình thường' : ''),
                                    noi_khoa_tieu_hoa: digestStr || (internalStr ? 'Bình thường' : ''),
                                    kq_tiet_nieu: urinaryStr || (internalStr ? 'Bình thường' : ''),
                                    kq_noi_tiet: endocStr || (internalStr ? 'Bình thường' : ''),
                                    kq_co_xuong_khop: musculoStr || (internalStr ? 'Bình thường' : ''),
                                    kq_than_kinh: neuroStr || (internalStr ? 'Bình thường' : ''),
                                    kq_tam_than: psychStr || (internalStr ? 'Bình thường' : ''),
                                    noi_khoa_tuan_hoan_pl: hasInternalData ? '1' : '',
                                    noi_khoa_ho_hap_pl: hasInternalData ? '1' : '',
                                    noi_khoa_tieu_hoa_pl: hasInternalData ? '1' : '',
                                    noi_khoa_than_tietnieu_pl: hasInternalData ? '1' : '',
                                    noi_khoa_noi_tiet_pl: hasInternalData ? '1' : '',
                                    noi_khoa_co_xuong_khop_pl: hasInternalData ? '1' : '',
                                    noi_khoa_than_kinh_pl: hasInternalData ? '1' : '',
                                    noi_khoa_tam_than_pl: hasInternalData ? '1' : '',

                                    // Ngoại khoa
                                    external: externalStr,
                                    kq_ngoai_khoa: externalStr,
                                    kham_ngoai_khoa_pl: externalStr ? '1' : '',

                                    // Da liễu
                                    dermatology: dermStr,
                                    kq_da_lieu: dermStr,
                                    kham_da_lieu_pl: dermStr ? '1' : '',

                                    // Sản phụ khoa (nữ)
                                    gynecology: gynStr,
                                    kham_san_phu_khoa: gynStr,
                                    kq_sinh_duc: gynStr,
                                    kham_san_phu_khoa_pl: gynStr ? '1' : '',

                                    // Mắt
                                    eye: eyeStr,
                                    benh_khac_mat: eyeStr,
                                    khong_kinh_mat_phai: eyeRight,
                                    khong_kinh_mat_trai: eyeLeft,
                                    kham_mat_pl: eyeStr ? '1' : '',

                                    // Tai Mũi Họng
                                    ent: entStr,
                                    benh_tai_mui_hong: entStr,
                                    kq_tai_mui_hong: entStr,
                                    kham_tai_mui_hong_pl: entStr ? '1' : '',
                                    tai_phai_noi_thuong: entStr ? '5m' : '',
                                    tai_trai_noi_thuong: entStr ? '5m' : '',
                                    tai_phai_noi_tham: entStr ? '0.5m' : '',
                                    tai_trai_noi_tham: entStr ? '0.5m' : '',

                                    // Răng Hàm Mặt
                                    dental: dentalStr,
                                    benh_rang_ham_mat: dentalStr,
                                    ham_tren: dentalStr || '',
                                    ham_duoi: dentalStr || '',
                                    kham_rang_ham_mat_pl: dentalStr ? '1' : '',

                                    circulatory: circStr,
                                    respiratory: respSpecStr,
                                    digestive: digestStr,
                                    urinary: urinaryStr,
                                    endocrine: endocStr,
                                    musculoskeletal: musculoStr,
                                    neurology: neuroStr,
                                    psychiatry: psychStr
                                }
                            };

                            if (hasExplicitConclusion) {
                                conclusionDataJson = {
                                    fitness_class: fitnessClassNum || '1',
                                    diagnosis: diagStr || (fitnessClassNum === '1' || fitnessClassNum === '2' ? 'Đủ sức khỏe làm việc' : 'Khám sức khỏe định kỳ'),
                                    cac_van_de_luu_y: remarkStr,
                                    doctor_name: doctorName || 'Bác sĩ Kết luận'
                                };
                            }

                            const specMetadata = buildSpecialtyMetadata({
                                clinicalData: clinicalDataJson,
                                labData: {},
                                conclusionData: conclusionDataJson || {},
                                doctorId: 'admin',
                                doctorName: doctorName || 'Bác sĩ Khám',
                                hasExam: hasAnyExam,
                                hasConclusion: hasExplicitConclusion
                            });
                            clinicalDataJson.specialty_metadata = specMetadata;
                            clinicalDataJson.clinical_exam.specialty_metadata = specMetadata;
                        }

                        // Kiểm tra nếu nhân viên đã tồn tại trong hợp đồng thì cập nhật (Update)
                        const existingMatch = (docNo && existingByCard.get(docNo)) || (empCode && existingByCode.get(empCode.toLowerCase()));

                        if (existingMatch) {
                            const updateSql = `
                                UPDATE hms_exm_employee SET
                                    hee_surname = $1, hee_midname = $2, hee_firstname = $3,
                                    hee_birthdate = COALESCE($4, hee_birthdate),
                                    hee_sex = $5,
                                    hee_phone = COALESCE(NULLIF($6, ''), hee_phone),
                                    hee_note = COALESCE(NULLIF($7, ''), hee_note),
                                    hee_dept = COALESCE(NULLIF($8, ''), hee_dept),
                                    hee_position_desc = COALESCE(NULLIF($9, ''), hee_position_desc),
                                    hee_address = COALESCE(NULLIF($10, ''), hee_address),
                                    hee_provid = COALESCE($11, hee_provid),
                                    hee_distid = COALESCE($12, hee_distid),
                                    hee_villid = COALESCE($13, hee_villid),
                                    hee_cardid = COALESCE(NULLIF($14, ''), hee_cardid),
                                    hee_cardid_date = COALESCE(NULLIF($15, ''), hee_cardid_date),
                                    hee_cardid_place = COALESCE(NULLIF($16, ''), hee_cardid_place),
                                    hee_guardian_name = COALESCE(NULLIF($17, ''), hee_guardian_name),
                                    hee_guardian_cccd = COALESCE(NULLIF($18, ''), hee_guardian_cccd),
                                    hee_ethnic = COALESCE($19, hee_ethnic),
                                    hee_prov_code = COALESCE(NULLIF($20, ''), hee_prov_code),
                                    hee_vill_code = COALESCE(NULLIF($21, ''), hee_vill_code),
                                    hee_occupation = COALESCE($22, hee_occupation),
                                    hee_target_group = COALESCE(NULLIF($23, ''), hee_target_group),
                                    hee_height = COALESCE($24, hee_height),
                                    hee_weight = COALESCE($25, hee_weight),
                                    hee_bloodpressure = COALESCE(NULLIF($26, ''), hee_bloodpressure),
                                    hee_pulse = COALESCE($27, hee_pulse),
                                    hee_temperature = COALESCE($28, hee_temperature),
                                    hee_respiration = COALESCE(NULLIF($29, ''), hee_respiration),
                                    hee_conclusion = COALESCE(NULLIF($30, ''), hee_conclusion),
                                    hee_comment = COALESCE(NULLIF($31, ''), hee_comment),
                                    hee_righteye = COALESCE(NULLIF($32, ''), hee_righteye),
                                    hee_clinical_data = COALESCE($33::jsonb, hee_clinical_data),
                                    hee_conclusion_data = COALESCE($34::jsonb, hee_conclusion_data),
                                    hee_funding_source = COALESCE(NULLIF($35, ''), hee_funding_source),
                                    hee_updateddate = CURRENT_TIMESTAMP
                                WHERE hee_employee_id = $36
                            `;
                            await query(updateSql, [
                                surname, midname, firstname, birthDate,
                                (emp.sex === 'Nữ' || emp.sex === 'F') ? 'F' : 'M',
                                phone, note, dept, position, address,
                                provNum, emp.district_id ? parseInt(String(emp.district_id), 10) : null, villNum,
                                docNo, cardIdDate, cardIdPlace, guardianName, guardianCccd,
                                emp.ethnic ? parseInt(String(emp.ethnic), 10) : null,
                                provCode || null, villCode || null, occNum, targetGroup,
                                heightNum, weightNum, bpStr, pulseNum, tempNum, respNum,
                                fitnessClassNum ? String(fitnessClassNum).slice(0, 2) : null,
                                diagStr ? diagStr.slice(0, 200) : null,
                                eyeStr ? eyeStr.slice(0, 15) : null,
                                clinicalDataJson ? JSON.stringify(clinicalDataJson) : null,
                                conclusionDataJson ? JSON.stringify(conclusionDataJson) : null,
                                fundingSource,
                                existingMatch.id
                            ]);

                            // Nếu nhân viên này đã tiếp nhận (có docNo) và có dữ liệu lâm sàng mới,
                            // cập nhật luôn sang health_check_details và pushback về HIS Core
                            if (existingMatch.docNo > 0 && hasClinicalData) {
                                try {
                                    await query(`
                                        UPDATE health_check_details 
                                        SET clinical_data = COALESCE($1::jsonb, clinical_data),
                                            conclusion_data = COALESCE($2::jsonb, conclusion_data),
                                            updated_at = NOW()
                                        WHERE master_id = (
                                            SELECT id FROM health_check_masters 
                                            WHERE his_employee_id = $3::varchar OR his_doc_no = $4::varchar 
                                            LIMIT 1
                                        )
                                    `, [
                                        JSON.stringify(clinicalDataJson),
                                        JSON.stringify(conclusionDataJson),
                                        String(existingMatch.id),
                                        String(existingMatch.docNo)
                                    ]);

                                    const clientWrapper = { query: (s: string, p?: any[]) => query(s, p) };
                                    await hisIntegrationController.pushbackClinicalAndConclusion(
                                        clientWrapper,
                                        existingMatch.docNo,
                                        clinicalDataJson,
                                        conclusionDataJson,
                                        (req as any).user?.username || 'admin',
                                        (req as any).user?.fullName || 'Bác sĩ Kết luận'
                                    );
                                } catch (pushErr: any) {
                                    console.warn(`⚠️ [importEmployees] Cập nhật HIS Core cho NV #${existingMatch.id} gặp cảnh báo:`, pushErr.message);
                                }
                            }
                        } else {
                            // Tạo mới nhân viên (Insert)
                            currentMaxId++;
                            const fullName = [surname, midname, firstname].filter(Boolean).join(' ') || (emp.name || emp.fullName || '');
                            const insertSql = `
                                INSERT INTO hms_exm_employee (
                                    hee_employee_id, hee_contract_id, hee_id, hee_name,
                                    hee_surname, hee_midname, hee_firstname, 
                                    hee_birthdate, hee_sex, hee_docno, hee_phone, 
                                    hee_note, hee_status, hee_isactive,
                                    hee_dept, hee_position_desc, hee_address,
                                    hee_provid, hee_distid, hee_villid,
                                    hee_cardid, hee_cardid_date, hee_cardid_place,
                                    hee_guardian_name, hee_guardian_cccd, hee_ethnic,
                                    hee_prov_code, hee_vill_code, hee_occupation,
                                    hee_target_group,
                                    hee_height, hee_weight, hee_bloodpressure, hee_pulse,
                                    hee_temperature, hee_respiration, hee_conclusion, hee_comment,
                                    hee_righteye, hee_clinical_data, hee_conclusion_data, hee_funding_source
                                ) VALUES (
                                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                                    $11, $12, 'O', 'Y', $13, $14, $15, $16, $17, $18,
                                    $19, $20, $21, $22, $23, $24, $25, $26, $27,
                                    $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40
                                )
                            `;
                            await query(insertSql, [
                                currentMaxId,
                                contractId,
                                empCode,
                                fullName,
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
                                targetGroup,
                                heightNum,
                                weightNum,
                                bpStr || null,
                                pulseNum,
                                tempNum,
                                respNum,
                                fitnessClassNum ? String(fitnessClassNum).slice(0, 2) : null,
                                diagStr ? diagStr.slice(0, 200) : null,
                                eyeStr ? eyeStr.slice(0, 15) : null,
                                clinicalDataJson ? JSON.stringify(clinicalDataJson) : null,
                                conclusionDataJson ? JSON.stringify(conclusionDataJson) : null,
                                fundingSource
                            ]);

                            if (docNo) existingByCard.set(docNo, { id: currentMaxId, docNo: 0 });
                            if (empCode) existingByCode.set(empCode.toLowerCase(), { id: currentMaxId, docNo: 0 });
                        }
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

            const fullName = [surname.trim(), (midname || '').trim(), firstname.trim()].filter(Boolean).join(' ');

            const insertSql = `
                INSERT INTO hms_exm_employee (
                    hee_employee_id, hee_contract_id, hee_id, hee_name,
                    hee_surname, hee_midname, hee_firstname, 
                    hee_birthdate, hee_sex, hee_docno, hee_phone, 
                    hee_note, hee_status, hee_isactive,
                    hee_address, hee_provid, hee_villid,
                    hee_cardid, hee_cardid_date, hee_cardid_place,
                    hee_ethnic, hee_occupation, hee_target_group
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, null, $10, $11, 'O', 'Y', $12, $13, $14, $15, $16, $17, $18, $19, $20)
            `;

            await query(insertSql, [
                nextEmployeeId,
                contractId,
                empCode,
                fullName,
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
