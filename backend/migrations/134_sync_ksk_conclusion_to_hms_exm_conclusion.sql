-- Migration 079: Sync and Backfill KSK Conclusion to hms_exm_conclusion
-- Description: Idempotently ensures unique index on hecl_docno and backfills hecl_conclusion, hecl_phanloai, vitals, specialties from health_check_masters, health_check_details, hms_doc, and hms_exm_employee

-- 1. Ensure unique index on hecl_docno for fast lookup and UPSERT safety
CREATE UNIQUE INDEX IF NOT EXISTS idx_hms_exm_conclusion_docno ON hms_exm_conclusion(hecl_docno);

-- 2. Backfill/UPSERT from existing health_check_masters + health_check_details + hms_doc
INSERT INTO hms_exm_conclusion (
    hecl_docno, hecl_theluc, hecl_tuanhoan, hecl_hohap, hecl_tieuhoa,
    hecl_thantietnieu, hecl_noitiet, hecl_coxuongkhop, hecl_thankinh, hecl_tamthan,
    hecl_ngoai, hecl_dalieu, hecl_mat, hecl_tmh, hecl_rhm, hecl_phukhoa,
    hecl_phanloai, hecl_conclusion, hecl_remark
)
SELECT 
    CAST(m.his_doc_no AS INTEGER) AS docno,
    SUBSTRING(COALESCE(d.clinical_data->'examination'->>'physical_summary', d.clinical_data->>'kham_the_luc', 'Thể lực bình thường'), 1, 254) AS theluc,
    SUBSTRING(COALESCE(d.clinical_data->'clinical_exam'->>'circulatory', d.clinical_data->'clinical_exam'->>'tuanhoan', d.clinical_data->'clinical_exam'->>'noi_khoa_tuan_hoan', ''), 1, 254) AS tuanhoan,
    SUBSTRING(COALESCE(d.clinical_data->'clinical_exam'->>'respiratory', d.clinical_data->'clinical_exam'->>'hohap', d.clinical_data->'clinical_exam'->>'noi_khoa_ho_hap', ''), 1, 254) AS hohap,
    SUBSTRING(COALESCE(d.clinical_data->'clinical_exam'->>'digestive', d.clinical_data->'clinical_exam'->>'tieuhoa', d.clinical_data->'clinical_exam'->>'noi_khoa_tieu_hoa', ''), 1, 254) AS tieuhoa,
    SUBSTRING(COALESCE(d.clinical_data->'clinical_exam'->>'urinary', d.clinical_data->'clinical_exam'->>'thantietnieu', d.clinical_data->'clinical_exam'->>'noi_khoa_than_tietnieu', ''), 1, 254) AS thantietnieu,
    SUBSTRING(COALESCE(d.clinical_data->'clinical_exam'->>'endocrine', d.clinical_data->'clinical_exam'->>'noitiet', d.clinical_data->'clinical_exam'->>'noi_khoa_noi_tiet', ''), 1, 254) AS noitiet,
    SUBSTRING(COALESCE(d.clinical_data->'clinical_exam'->>'musculoskeletal', d.clinical_data->'clinical_exam'->>'coxuongkhop', d.clinical_data->'clinical_exam'->>'noi_khoa_co_xuong_khop', ''), 1, 254) AS coxuongkhop,
    SUBSTRING(COALESCE(d.clinical_data->'clinical_exam'->>'neurology', d.clinical_data->'clinical_exam'->>'thankinh', d.clinical_data->'clinical_exam'->>'noi_khoa_than_kinh', ''), 1, 254) AS thankinh,
    SUBSTRING(COALESCE(d.clinical_data->'clinical_exam'->>'psychiatry', d.clinical_data->'clinical_exam'->>'tamthan', d.clinical_data->'clinical_exam'->>'noi_khoa_tam_than', ''), 1, 254) AS tamthan,
    SUBSTRING(COALESCE(d.clinical_data->'clinical_exam'->>'external', d.clinical_data->'clinical_exam'->>'ngoai', d.clinical_data->'clinical_exam'->>'ngoai_khoa', ''), 1, 254) AS ngoai,
    SUBSTRING(COALESCE(d.clinical_data->'clinical_exam'->>'dermatology', d.clinical_data->'clinical_exam'->>'dalieu', d.clinical_data->'clinical_exam'->>'da_lieu', ''), 1, 254) AS dalieu,
    SUBSTRING(COALESCE(d.clinical_data->'clinical_exam'->>'eye', d.clinical_data->'clinical_exam'->>'mat', ''), 1, 254) AS mat,
    SUBSTRING(COALESCE(d.clinical_data->'clinical_exam'->>'ent', d.clinical_data->'clinical_exam'->>'tmh', d.clinical_data->'clinical_exam'->>'tai_mui_hong', ''), 1, 254) AS tmh,
    SUBSTRING(COALESCE(d.clinical_data->'clinical_exam'->>'dental', d.clinical_data->'clinical_exam'->>'rhm', d.clinical_data->'clinical_exam'->>'rang_ham_mat', ''), 1, 254) AS rhm,
    SUBSTRING(COALESCE(d.clinical_data->'clinical_exam'->>'gynecology', d.clinical_data->'clinical_exam'->>'phukhoa', d.clinical_data->'clinical_exam'->>'san_phu_khoa', ''), 1, 254) AS phukhoa,
    SUBSTRING(
        CASE 
            WHEN d.conclusion_data->>'fitness_class' ~ '^[1-5]$' THEN 'Loại ' || (d.conclusion_data->>'fitness_class')
            WHEN h.hd_result IN ('1','2','3','4','5') THEN 'Loại ' || h.hd_result
            WHEN h.hd_conclusion ~* 'LOẠI\s*I(?!I|V)' THEN 'Loại 1'
            WHEN h.hd_conclusion ~* 'LOẠI\s*II(?!I)' THEN 'Loại 2'
            WHEN h.hd_conclusion ~* 'LOẠI\s*III' THEN 'Loại 3'
            WHEN h.hd_conclusion ~* 'LOẠI\s*IV' THEN 'Loại 4'
            WHEN h.hd_conclusion ~* 'LOẠI\s*V' THEN 'Loại 5'
            ELSE 'Loại 1'
        END, 1, 254
    ) AS phanloai,
    SUBSTRING(
        TRIM(REGEXP_REPLACE(
            COALESCE(
                NULLIF(TRIM(d.conclusion_data->>'diagnosis'), ''),
                NULLIF(TRIM(h.hd_conclusion), ''),
                NULLIF(TRIM(d.conclusion_data->>'ket_luan'), ''),
                'Đủ sức khỏe làm việc'
            ),
            '^[\s\-\*•\r\n]+|[\s\r\n]+$', '', 'g'
        )), 1, 254
    ) AS conclusion,
    SUBSTRING(COALESCE(d.conclusion_data->>'advise', d.conclusion_data->>'cac_van_de_luu_y', d.conclusion_data->>'ghi_chu', ''), 1, 254) AS remark
FROM health_check_masters m
JOIN hms_doc h ON m.his_doc_no ~ '^[0-9]+$' AND h.hd_docno = CAST(m.his_doc_no AS INTEGER)
LEFT JOIN health_check_details d ON d.master_id = m.id
ON CONFLICT (hecl_docno) DO UPDATE SET
    hecl_theluc = COALESCE(NULLIF(EXCLUDED.hecl_theluc, ''), hms_exm_conclusion.hecl_theluc),
    hecl_tuanhoan = COALESCE(NULLIF(EXCLUDED.hecl_tuanhoan, ''), hms_exm_conclusion.hecl_tuanhoan),
    hecl_hohap = COALESCE(NULLIF(EXCLUDED.hecl_hohap, ''), hms_exm_conclusion.hecl_hohap),
    hecl_tieuhoa = COALESCE(NULLIF(EXCLUDED.hecl_tieuhoa, ''), hms_exm_conclusion.hecl_tieuhoa),
    hecl_thantietnieu = COALESCE(NULLIF(EXCLUDED.hecl_thantietnieu, ''), hms_exm_conclusion.hecl_thantietnieu),
    hecl_noitiet = COALESCE(NULLIF(EXCLUDED.hecl_noitiet, ''), hms_exm_conclusion.hecl_noitiet),
    hecl_coxuongkhop = COALESCE(NULLIF(EXCLUDED.hecl_coxuongkhop, ''), hms_exm_conclusion.hecl_coxuongkhop),
    hecl_thankinh = COALESCE(NULLIF(EXCLUDED.hecl_thankinh, ''), hms_exm_conclusion.hecl_thankinh),
    hecl_tamthan = COALESCE(NULLIF(EXCLUDED.hecl_tamthan, ''), hms_exm_conclusion.hecl_tamthan),
    hecl_ngoai = COALESCE(NULLIF(EXCLUDED.hecl_ngoai, ''), hms_exm_conclusion.hecl_ngoai),
    hecl_dalieu = COALESCE(NULLIF(EXCLUDED.hecl_dalieu, ''), hms_exm_conclusion.hecl_dalieu),
    hecl_mat = COALESCE(NULLIF(EXCLUDED.hecl_mat, ''), hms_exm_conclusion.hecl_mat),
    hecl_tmh = COALESCE(NULLIF(EXCLUDED.hecl_tmh, ''), hms_exm_conclusion.hecl_tmh),
    hecl_rhm = COALESCE(NULLIF(EXCLUDED.hecl_rhm, ''), hms_exm_conclusion.hecl_rhm),
    hecl_phukhoa = COALESCE(NULLIF(EXCLUDED.hecl_phukhoa, ''), hms_exm_conclusion.hecl_phukhoa),
    hecl_phanloai = COALESCE(NULLIF(EXCLUDED.hecl_phanloai, ''), hms_exm_conclusion.hecl_phanloai),
    hecl_conclusion = COALESCE(NULLIF(EXCLUDED.hecl_conclusion, ''), hms_exm_conclusion.hecl_conclusion),
    hecl_remark = COALESCE(NULLIF(EXCLUDED.hecl_remark, ''), hms_exm_conclusion.hecl_remark);

-- 3. Backfill/UPSERT from completed KSK records in hms_exm_employee + hms_doc
INSERT INTO hms_exm_conclusion (
    hecl_docno, hecl_theluc, hecl_tuanhoan, hecl_hohap, hecl_tieuhoa,
    hecl_thantietnieu, hecl_noitiet, hecl_coxuongkhop, hecl_thankinh, hecl_tamthan,
    hecl_ngoai, hecl_dalieu, hecl_mat, hecl_tmh, hecl_rhm, hecl_phukhoa,
    hecl_phanloai, hecl_conclusion, hecl_remark
)
SELECT 
    h.hd_docno,
    'Thể lực bình thường', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
    SUBSTRING(
        CASE 
            WHEN h.hd_result IN ('1','2','3','4','5') THEN 'Loại ' || h.hd_result
            WHEN h.hd_conclusion ~* 'LOẠI\s*I(?!I|V)' THEN 'Loại 1'
            WHEN h.hd_conclusion ~* 'LOẠI\s*II(?!I)' THEN 'Loại 2'
            WHEN h.hd_conclusion ~* 'LOẠI\s*III' THEN 'Loại 3'
            WHEN h.hd_conclusion ~* 'LOẠI\s*IV' THEN 'Loại 4'
            WHEN h.hd_conclusion ~* 'LOẠI\s*V' THEN 'Loại 5'
            ELSE 'Loại 1'
        END, 1, 254
    ),
    SUBSTRING(
        TRIM(REGEXP_REPLACE(
            COALESCE(NULLIF(TRIM(h.hd_conclusion), ''), 'Đủ sức khỏe làm việc'),
            '^[\s\-\*•\r\n]+|[\s\r\n]+$', '', 'g'
        )), 1, 254
    ),
    ''
FROM hms_doc h
JOIN hms_exm_employee e ON e.hee_docno::text = h.hd_docno::text
WHERE h.hd_status = 'T'
ON CONFLICT (hecl_docno) DO UPDATE SET
    hecl_conclusion = COALESCE(NULLIF(hms_exm_conclusion.hecl_conclusion, ''), EXCLUDED.hecl_conclusion),
    hecl_phanloai = COALESCE(NULLIF(hms_exm_conclusion.hecl_phanloai, ''), EXCLUDED.hecl_phanloai);
