/*
	Lịch sử khám: Lấy ra tất cả các lần khám của bệnh nhân theo mã bệnh nhân hd_patientno (mã bệnh nhân), mỗi lần khám theo hd_docno(mã hồ sơ)
*/
 SELECT hp_patientno AS patientno, hd_docno as docno,
  trim(hp_surname
  ||' '
  ||hp_midname
  ||' '
  ||hp_firstname)                              AS pname,
  hms_getage(DATE(hd_admitdate), hp_birthdate) AS age,
  hp_birthdate,
  GET_SYSSEL_DESC('sys_sex', hp_sex) AS sex,
  hp_sex,
  GET_SYSSEL_DESC('sys_occupation', CAST(hp_occupation AS VARCHAR(15)))                                                                                   AS occupation,
  hp_workplace                                                                                                                                            AS workplace,
  COALESCE(hd_dtladdr,hp_dtladdr)                                                                                                                         AS detailaddress,
  hms_getaddress(COALESCE(zero_to_null(hd_provid),hp_provid), COALESCE(zero_to_null(hd_distid), hp_distid), COALESCE(zero_to_null(hd_villid), hp_villid)) AS address,
  hd_object                                                                                                                                               AS objectid,
  hd_cardno                                                                                                                                               AS cardno,
  hd_cardidx                                                                                                                                              AS cardidx,
  hd_rank                                                                                                                                                 AS rank,
  get_selection_desc('hms_rank', hd_rank)                                                                                                                 AS rankname,
  hd_admitdate                                                                                                                                            AS admitdate,
  hd_admitdept                                                                                                                                            AS admitdept,
  hd_status                                                                                                                                               AS status,
  hd_createdby                                                                                                                                            AS createdby,
  hd_doctor                                                                                                                                               AS doctor,
  GET_SYSSEL_DESC('hms_doc_status', hd_status)                                                                                                            AS statusdesc,
  hd_conclusion                                                                                                                                           AS conclusion,
  hd_suggestion                                                                                                                                           AS suggestion,
  hd_indept                                                                                                                                               AS todeptid,
  GET_SYSSEL_DESC('hms_suggestion', hd_suggestion)                                                                                                        AS suggestiondesc,
  hd_icd                                                                                                                                                  AS icd10,
  hd_tohosid                                                                                                                                              AS tohosid,
  hd_telephone                                                                                                                                            AS telephone,
  hd_enddate                                                                                                                                              AS enddate,
  hd_admitstate                                                                                                                                           AS patientstatus,
  hd_emergency,
  hd_insline,
  hd_healthexam,
  hd_isreq,
  hd_istransplant,
  hd_ma_loai_kcb
FROM hms_patient
LEFT JOIN hms_doc
ON(hd_patientno=hp_patientno)
WHERE hd_patientno =17082932 

/*
-- Lệnh lấy ra danh sách các phiếu CLS theo số hồ sơ hpc_docno = 22118862
Hiển thị danh sách theo nhóm: Xét nghiệm, Chẩn đoán hình ảnh
Số TT, Tên dịch vụ, Nút xem kết quả (nhấn vào gọi api xem pdf) , (Nếu là nhóm Hình ảnh có thêm nút xem hình ảnh->gọi api xem hình ảnh)
*/
SELECT hpc_orderid                              AS orderid,
  hpc_deptid                                    AS deptid,
  hpc_status                                    AS status,
  hfg_name                                      AS gname,
  hpc_groupid                                   AS groupid,
  get_username(hpc_createdby)                   AS createdby,
  get_username(hpc_doctor)                      AS doctor,
  TO_CHAR(hpc_orderdate,'DD/MM/YYYY HH24:MI')   AS orderdate,
  TO_CHAR(hpc_performdate,'DD/MM/YYYY HH24:MI') AS performdate,
  get_username(hpc_practitioner)                AS practitioner,
  hpc_treatidx,
  hpc_signed_labo AS signed_labo,
  hpc_order_type AS ordertype -- T: Xet nghiem, P: Hinh anh
FROM hmsv_paraclinic
LEFT JOIN hms_fee_group
ON(hfg_id      =hpc_groupid)
WHERE hpc_docno=22118862
ORDER BY hpc_orderdate,
  hpc_orderid


-- Lệnh lấy ra thông tin đơn thuốc theo số hồ sơ = hpo_docno (một số hồ sơ có thể có nhiều đơn thuốc theo bác sĩ khám kê) sắp sếp 
/*
1. Đơn thuốc A: Bác sĩ: Nguyễn Văn A, Ngày kê: -> chi tiết thuốc trong đơn 
2. Đơn thuốc B: Bác sĩ: Nguyễn Văn B, Ngày kê: -> chi tiết thuốc trong đơn 
*/
SELECT DATE(hpo_orderdate),
  hpo_doctor,
  hpol_line,
  hpol_product_id,
  hpol_productname,
  hpol_productuom,
  hpol_usage,
  SUM(hpol_qtyorder)                AS hpol_qtyorder,
  SUM(hpol_qtyorder*hpol_unitprice) AS hpol_amount,
  hpol_generic,
  hpol_content,
  CASE
    WHEN mpei_ten_thuoc IS NULL
    THEN hpol_productname
    WHEN LENGTH(mpei_ham_luong)>1
    THEN mpei_ten_thuoc
      ||'('
      ||mpei_ham_luong
      ||')'
    ELSE mpei_ten_thuoc
  END AS pharma
FROM hms_pharmaorder
LEFT JOIN hms_pharmaorderline_view
ON (hpol_orderid = hpo_orderid)
LEFT JOIN m_product_item
ON (mpi_product_item_id = hpol_product_item_id)
LEFT JOIN m_product_extra_info
ON (mpei_id = mpi_productextra_id)
LEFT JOIN hms_pharmaorder_usage
ON(hpou_orderid           =hpol_orderid
AND hpou_product_id       =hpol_product_id)
WHERE hpo_docno           =18200179
AND hpol_producttype NOT IN ('A1700','A1800','A1300','A1130','A1140' )
AND hpo_depttype          = 'E'
GROUP BY DATE(hpo_orderdate),
  hpo_doctor,
  hpol_orderid,
  hpou_qtyorder,
  hpol_line,
  hpol_product_id,
  hpol_productname,
  hpol_productuom,
  hpol_generic,
  hpol_usage,
  hpol_content,
  mpei_ham_luong,
  mpei_ten_thuoc
ORDER BY hpol_orderid,
  hpol_line


/*
Lấy danh sách hóa đơn đã thanh toán
*/
SELECT * FROM hms_fee_invoice WHERE hfe_docno = 18200179 AND hfe_invoiceno = 258092

-- Lấy danh sách chi tiết các mục phí trong hóa đơn
SELECT * FROM hms_fee WHERE hfe_docno = 18200179 AND hfe_invoiceno = 258092