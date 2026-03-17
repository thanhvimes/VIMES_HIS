-- Table: public.hms_roomlist

-- DROP TABLE IF EXISTS public.hms_roomlist;
CREATE TABLE IF NOT EXISTS public.sys_user
(
    su_userid character varying(15) COLLATE pg_catalog."default" NOT NULL,
    su_groupid character varying(1) COLLATE pg_catalog."default",
    su_name character varying(65) COLLATE pg_catalog."default",
    su_password character varying(254) COLLATE pg_catalog."default",
    su_deptid character varying(7) COLLATE pg_catalog."default",
    su_roomid integer,
    su_hms_xdept character varying(250) COLLATE pg_catalog."default",
    su_hms_xroom character varying(1024) COLLATE pg_catalog."default",
    su_hms_xobject character varying(81) COLLATE pg_catalog."default",
    su_hms_rmmodule character varying(1) COLLATE pg_catalog."default",
    su_hms_emmodule character varying(1) COLLATE pg_catalog."default",
    su_hms_tmmodule character varying(1) COLLATE pg_catalog."default",
    su_hms_usmodule character varying(1) COLLATE pg_catalog."default",
    su_hms_pamodule character varying(1) COLLATE pg_catalog."default",
    su_hms_esmodule character varying(1) COLLATE pg_catalog."default",
    su_hms_hfmodule character varying(1) COLLATE pg_catalog."default",
    su_hms_pmmodule character varying(1) COLLATE pg_catalog."default",
    su_hms_opmodule character varying(1) COLLATE pg_catalog."default",
    su_hms_crmodule character varying(1) COLLATE pg_catalog."default",
    su_hms_sysmodule character varying(1) COLLATE pg_catalog."default",
    su_erp_famodule character varying(1) COLLATE pg_catalog."default",
    su_erp_hrmodule character varying(1) COLLATE pg_catalog."default",
    su_erp_apmodule character varying(1) COLLATE pg_catalog."default",
    su_erp_armodule character varying(1) COLLATE pg_catalog."default",
    su_erp_glmodule character varying(1) COLLATE pg_catalog."default",
    su_erp_pomodule character varying(1) COLLATE pg_catalog."default",
    su_erp_somodule character varying(1) COLLATE pg_catalog."default",
    su_erp_simodule character varying(1) COLLATE pg_catalog."default",
    su_erp_bilmodule character varying(1) COLLATE pg_catalog."default",
    su_hms_labmodule character varying(1) COLLATE pg_catalog."default",
    su_ward character varying(7) COLLATE pg_catalog."default",
    su_hms_mmmodule character varying(1) COLLATE pg_catalog."default",
    su_hms_smmodule character varying(1) COLLATE pg_catalog."default",
    su_isactive character varying(1) COLLATE pg_catalog."default" DEFAULT 'Y'::character varying,
    su_hms_armodule character varying(1) COLLATE pg_catalog."default",
    su_hms_mamodule character varying(1) COLLATE pg_catalog."default",
    su_hms_bbmodule character varying(1) COLLATE pg_catalog."default",
    su_hms_prmodule character varying(1) COLLATE pg_catalog."default",
    su_hms_fammodule character varying(1) COLLATE pg_catalog."default",
    su_hms_sipmodule character varying(1) COLLATE pg_catalog."default",
    su_hms_stmodule character varying(1) COLLATE pg_catalog."default",
    su_hms_srmmodule character varying(1) COLLATE pg_catalog."default",
    su_hms_mramodule character varying(1) COLLATE pg_catalog."default",
    su_certificate character varying(254) COLLATE pg_catalog."default",
    su_tel character varying(15) COLLATE pg_catalog."default",
    su_hms_cmmodule character varying(1) COLLATE pg_catalog."default",
    su_hms_xdepts character varying(1024) COLLATE pg_catalog."default",
    su_signatureid character varying(254) COLLATE pg_catalog."default",
    su_signaturedesc character varying(254) COLLATE pg_catalog."default",
    su_signature character varying(1) COLLATE pg_catalog."default",
    su_position character varying(5) COLLATE pg_catalog."default",
    su_title character varying(24) COLLATE pg_catalog."default",
    su_sign_cert text COLLATE pg_catalog."default",
    su_namecchn character varying(254) COLLATE pg_catalog."default",
    su_ltdt_user character varying(254) COLLATE pg_catalog."default",
    su_ltdt_password character varying(254) COLLATE pg_catalog."default",
    su_hms_emrmodule character varying(1) COLLATE pg_catalog."default",
    su_cert_length integer,
    su_sobhyt character varying(10) COLLATE pg_catalog."default",
    su_hms_hmmodule character varying(1) COLLATE pg_catalog."default",
    su_sign_userid character varying(254) COLLATE pg_catalog."default",
    su_sign_passwd character varying(254) COLLATE pg_catalog."default",
    su_sign_partner character varying(15) COLLATE pg_catalog."default" DEFAULT 'TOKEN'::character varying,
    su_cccd character varying(12) COLLATE pg_catalog."default",
    su_name_bhxh character varying(254) COLLATE pg_catalog."default",
    su_sign_position character varying(254) COLLATE pg_catalog."default",
    su_sign_title character varying(254) COLLATE pg_catalog."default",
    su_sign_credential_id character varying(254) COLLATE pg_catalog."default",
    su_hms_tramodule character varying(1) COLLATE pg_catalog."default",
    su_hms_inmodule character varying(1) COLLATE pg_catalog."default",
    su_hms_nmmodule character varying(1) COLLATE pg_catalog."default",
    su_hms_tmvmodule character varying(1) COLLATE pg_catalog."default",
    su_hms_dsmmodule character varying(1) COLLATE pg_catalog."default",
    su_hms_itsmodule character varying(1) COLLATE pg_catalog."default",
    su_xorg_id character varying(15) COLLATE pg_catalog."default",
    su_setup_bckt character varying(2) COLLATE pg_catalog."default",
    su_setup_qt character varying(2) COLLATE pg_catalog."default",
    su_image_user character varying(512) COLLATE pg_catalog."default",
    su_sign_totp character varying(254) COLLATE pg_catalog."default",
    su_collect_payment character varying(1) COLLATE pg_catalog."default" DEFAULT 'N'::character varying,
    CONSTRAINT sys_user_su_userid PRIMARY KEY (su_userid)
)

CREATE TABLE IF NOT EXISTS public.sys_dept
(
    sd_createdby character varying(30) COLLATE pg_catalog."default",
    sd_createddate timestamp without time zone,
    sd_updatedby character varying(30) COLLATE pg_catalog."default",
    sd_updateddate timestamp without time zone,
    sd_id character varying(14) COLLATE pg_catalog."default" NOT NULL,
    sd_name character varying(254) COLLATE pg_catalog."default",
    sd_type character varying(3) COLLATE pg_catalog."default",
    sd_category integer,
    sd_zone character varying(14) COLLATE pg_catalog."default",
    sd_groupid character varying(7) COLLATE pg_catalog."default",
    sd_index integer,
    sd_isactive character varying(1) COLLATE pg_catalog."default" DEFAULT 'Y'::character varying,
    sd_org_id character varying(32) COLLATE pg_catalog."default" DEFAULT 'GL'::character varying,
    sd_planned_bed integer DEFAULT 0,
    sd_avaiable_bed integer DEFAULT 0,
    sd_insuranceid character varying(12) COLLATE pg_catalog."default",
    sd_bednumber integer,
    sd_truongkhoa_id character varying(25) COLLATE pg_catalog."default",
    sd_cchn_truong_khoa character varying(25) COLLATE pg_catalog."default",
    sd_ten_truong_khoa character varying(50) COLLATE pg_catalog."default",
    sd_xorg_id character varying COLLATE pg_catalog."default" DEFAULT '27009'::character varying,
    sd_index_stt integer,
    CONSTRAINT sys_dept_sd_id PRIMARY KEY (sd_id)
)
CREATE TABLE IF NOT EXISTS public.hms_roomlist_kios
(
    hrk_createdby character varying(15) COLLATE pg_catalog."default",
    hrk_createddate timestamp without time zone,
    hrk_updatedby character varying(15) COLLATE pg_catalog."default",
    hrk_updateddate timestamp without time zone,
    hrk_deptid character varying(7) COLLATE pg_catalog."default" NOT NULL,
    hrk_id integer NOT NULL,
    hrk_code integer NOT NULL,
    hrk_active character varying(1) COLLATE pg_catalog."default",
    hrk_idx integer,
    CONSTRAINT hms_roomlist_kios_pkey PRIMARY KEY (hrk_deptid, hrk_id, hrk_code)
)


CREATE TABLE IF NOT EXISTS public.hms_roomlist
(
    hrl_createdby character varying(15) COLLATE pg_catalog."default",
    hrl_createddate timestamp without time zone,
    hrl_updatedby character varying(15) COLLATE pg_catalog."default",
    hrl_updateddate timestamp without time zone,
    hrl_deptid character varying(7) COLLATE pg_catalog."default" NOT NULL,
    hrl_id integer NOT NULL,
    hrl_name character varying(64) COLLATE pg_catalog."default",
    hrl_type integer,
    hrl_section character varying(7) COLLATE pg_catalog."default",
    hrl_active character varying(1) COLLATE pg_catalog."default",
    hrl_doctorid character varying(15) COLLATE pg_catalog."default",
    hrl_code integer DEFAULT 0,
    hrl_isreq character varying(1) COLLATE pg_catalog."default",
    hrl_inscode character varying(7) COLLATE pg_catalog."default",
    hrl_watingboard character varying(1) COLLATE pg_catalog."default",
    hrl_waitingboard character varying(1) COLLATE pg_catalog."default",
    hrl_doctor character varying(24) COLLATE pg_catalog."default",
    hrl_vsscode integer,
    hrl_roomname character varying(30) COLLATE pg_catalog."default",
    hrl_appointnumer integer,
    hrl_address character varying(1024) COLLATE pg_catalog."default",
    hrl_key integer NOT NULL DEFAULT nextval('hms_roomlist_hrl_key_seq'::regclass),
    hrl_roomid integer,
    hrl_xdept character varying(64) COLLATE pg_catalog."default",
    hrl_kios character varying(1) COLLATE pg_catalog."default" DEFAULT 'Y'::character varying,
    hrl_index_sort integer,
    hrl_use_kiosk character varying(1) COLLATE pg_catalog."default" DEFAULT 'Y'::character varying,
    hrl_max integer,
    CONSTRAINT hms_roomlist_hrl_deptidhrl_id PRIMARY KEY (hrl_deptid, hrl_id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.hms_roomlist
    OWNER to postgres;
-- Index: hms_roomlist_hrl_deptid

-- DROP INDEX IF EXISTS public.hms_roomlist_hrl_deptid;

CREATE INDEX IF NOT EXISTS hms_roomlist_hrl_deptid
    ON public.hms_roomlist USING btree
    (hrl_deptid COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
	
-- Table: public.qms_patient

-- DROP TABLE IF EXISTS public.qms_patient;

CREATE TABLE IF NOT EXISTS public.qms_patient
(
    qms_createdby character varying(15) COLLATE pg_catalog."default",
    qms_createddate timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    qms_updatedby character varying(15) COLLATE pg_catalog."default",
    qms_updateddate timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    qms_idx integer NOT NULL DEFAULT nextval('qms_patient_qms_idx_seq'::regclass),
    qms_idcard character varying(32) COLLATE pg_catalog."default",
    qms_patientname character varying(65) COLLATE pg_catalog."default" NOT NULL,
    qms_sex character varying(1) COLLATE pg_catalog."default" NOT NULL,
    qms_birthdate date,
    qms_ethnic integer,
    qms_address character varying(254) COLLATE pg_catalog."default",
    qms_patientno integer,
    qms_docno integer,
    qms_startfacid integer,
    qms_endfacid integer,
    qms_chkindte timestamp without time zone,
    qms_chkoutdte timestamp without time zone,
    qms_storedte timestamp without time zone,
    qms_status character varying(1) COLLATE pg_catalog."default",
    qms_roomid integer,
    qms_cabinetid integer,
    qms_drawerid integer,
    qms_position integer,
    qms_patientid character varying(15) COLLATE pg_catalog."default",
    qms_cardid character varying(20) COLLATE pg_catalog."default",
    qms_comment character varying(512) COLLATE pg_catalog."default",
    qms_reason character varying(512) COLLATE pg_catalog."default",
    qms_type character varying(1) COLLATE pg_catalog."default",
    qms_receptno integer,
    qms_tungay date,
    qms_denngay date,
    qms_madkbd character varying(11) COLLATE pg_catalog."default",
    qms_cqbhxh character varying(254) COLLATE pg_catalog."default",
    qms_mahuong character varying(3) COLLATE pg_catalog."default",
    qms_makv character varying(3) COLLATE pg_catalog."default" DEFAULT 'UNK'::character varying,
    qms_trangthai character varying(1) COLLATE pg_catalog."default" DEFAULT 'N'::character varying,
    qms_du5nam date,
    qms_gate integer,
    qms_prov_id integer,
    qms_dist_id integer,
    qms_vill_id integer,
    qms_contact character varying(32) COLLATE pg_catalog."default",
    qms_email character varying(32) COLLATE pg_catalog."default",
    qms_examtype_id character varying(15) COLLATE pg_catalog."default",
    qms_fee_id character varying(15) COLLATE pg_catalog."default",
    qms_examdate date,
    qms_amount numeric(15,3),
    qms_deptid character varying(15) COLLATE pg_catalog."default",
    qms_onepay_code integer,
    qms_onepay_status character varying(1) COLLATE pg_catalog."default" DEFAULT 'N'::character varying,
    qms_appointment_date date,
    qms_appointment_time character varying(10) COLLATE pg_catalog."default",
    qms_doctor character varying(15) COLLATE pg_catalog."default",
    qms_occupation integer,
    qms_macheckin character varying(15) COLLATE pg_catalog."default",
    qms_session character varying(3) COLLATE pg_catalog."default",
    qms_idcard_issue_date date,
    CONSTRAINT qms_patient_pkey PRIMARY KEY (qms_idx)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.qms_patient
    OWNER to vimes;
	
  CREATE TABLE IF NOT EXISTS public.hms_schedule
(
    hs_id integer NOT NULL DEFAULT nextval('hms_schedule_hs_id_seq'::regclass),
    hs_createdby character varying(15) COLLATE pg_catalog."default",
    hs_createddate timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    hs_updatedby character varying(15) COLLATE pg_catalog."default",
    hs_updateddate timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    hs_deptid character varying(7) COLLATE pg_catalog."default" NOT NULL,
    hs_roomid integer NOT NULL,
    hs_date date NOT NULL,
    hs_dayofweek integer,
    hs_shift character varying(10) COLLATE pg_catalog."default",
    hs_start_time time without time zone NOT NULL,
    hs_end_time time without time zone NOT NULL,
    hs_slot_duration integer DEFAULT 15,
    hs_max_patients integer DEFAULT 3,
    hs_total_slots integer,
    hs_active character varying(1) COLLATE pg_catalog."default" DEFAULT 'Y'::character varying,
    hs_note text COLLATE pg_catalog."default",
    CONSTRAINT hms_schedule_pkey PRIMARY KEY (hs_id),
    CONSTRAINT hms_schedule_unique UNIQUE (hs_deptid, hs_roomid, hs_date, hs_shift)
)

-- Table: public.hms_schedule_exam

-- DROP TABLE IF EXISTS public.hms_schedule_exam;

CREATE TABLE IF NOT EXISTS public.hms_schedule_exam
(
    hse_deptid character varying(15) COLLATE pg_catalog."default" NOT NULL,
    hse_roomid integer NOT NULL,
    hse_doctor character varying(15) COLLATE pg_catalog."default",
    hse_receptno integer NOT NULL,
    hse_type character varying(1) COLLATE pg_catalog."default",
    hse_docno integer,
    hse_date date NOT NULL,
    hse_appointdate timestamp(6) without time zone,
    hse_time character varying(5) COLLATE pg_catalog."default",
    hse_status character varying(1) COLLATE pg_catalog."default" DEFAULT 'O'::character varying,
    hse_createddate timestamp(6) without time zone,
    hse_updateddate timestamp(6) without time zone,
    hse_appointment_id integer,
    hse_idx integer NOT NULL DEFAULT nextval('hms_schedule_exam_hse_idx_seq'::regclass),
    hse_todocno integer,
    hse_duration integer DEFAULT 1,
    hse_createdby character varying(15) COLLATE pg_catalog."default",
    CONSTRAINT hms_schedule_exam_pkey PRIMARY KEY (hse_deptid, hse_roomid, hse_receptno, hse_date)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.hms_schedule_exam
    OWNER to postgres;

GRANT ALL ON TABLE public.hms_schedule_exam TO PUBLIC;

GRANT ALL ON TABLE public.hms_schedule_exam TO postgres;

-- FUNCTION: public.hms_schedule_create(text, text, integer, date)
-- DROP FUNCTION IF EXISTS public.hms_schedule_create(text, text, integer, date);
CREATE OR REPLACE FUNCTION public.hms_schedule_create(
    puser text,
    pdeptid text,
    proomid INTEGER,
    pdate   DATE) RETURNS INTEGER LANGUAGE 'plpgsql' COST 100 VOLATILE PARALLEL UNSAFE
AS
  $BODY$
  DECLARE
    tmpInt INTEGER;
    tmpRec RECORD;
    nCount INTEGER;
    BedID TEXT;
    fdate        TIMESTAMP;
    tdate        TIMESTAMP;
    vAppointDate TIMESTAMP;
    vTimesAppoint text;
  BEGIN
    tmpInt:=0;
    -- kiem tra là phòng có trong danh sách được hẹn khám theo lịch hay không
    SELECT COUNT(*)
    INTO nCount
    FROM hms_schedule_exam_setup
    WHERE hses_deptid =pDeptId
    AND hses_roomid   = pRoomid;
    IF(nCount         =0) THEN
      RETURN nCount;
    END IF;
    -- kiểm tra đã có lịch hẹn nào chưa. nếu có rồi thì ko làm nữa
    SELECT COUNT(*)
    INTO nCount
    FROM hms_schedule_exam
    WHERE hse_deptid =pDeptId
    AND hse_roomid   = pRoomid
    AND hse_date     =pDate;
    IF(nCount        >0 ) THEN
      RETURN nCount;
    END IF;
    FOR tmpRec IN
    (SELECT     *
    FROM hms_schedule_exam_setup
    WHERE hses_deptid =pDeptId
    AND hses_roomid   = pRoomid
    ORDER BY hses_type DESC
    )
    LOOP
      fdate = to_timestamp(CAST(pDate AS text) ||' ' ||tmpRec.hses_starttime, 'YYYY/MM/DD HH24:MI');
      tdate = to_timestamp(CAST(pDate AS text)||' '||tmpRec.hses_endtime, 'YYYY/MM/DD HH24:MI');
      raise notice '%,%',
      fdate,
      tdate;
      WHILE fdate <= tdate
      LOOP
        tmpInt      :=tmpInt+1;
        vAppointDate:= fdate;
        raise notice '%,%',
        tmpInt,
        vAppointDate;
        INSERT
        INTO hms_schedule_exam
          (
            hse_deptid,
            hse_roomid,
            hse_doctor,
            hse_receptno,
            hse_type,
            hse_date,
            hse_appointdate,
            hse_time,
            hse_status,
            hse_createddate
          )
          VALUES
          (
            pDeptId,
            pRoomid,
            '',
            tmpInt,
            tmpRec.hses_type,
            pDate,
            vAppointDate,
            SUBSTR(CAST(vAppointDate AS text),12,5),
            'O',
            CURRENT_TIMESTAMP
          );
        EXECUTE 'SELECT timestamp '||''''||fdate||''''||' + '||'interval '||''''||tmpRec.hses_time||'minute'||'''' INTO fdate;
      END LOOP;
    END LOOP;
    RETURN tmpInt;
  END;
$BODY$;
ALTER
FUNCTION public.hms_schedule_create
  (
    text,
    text,
    INTEGER,
    DATE
  )
  OWNER TO postgres;
  
  
  
-- FUNCTION: public.qms_patient_create_booking(text, text, date, text, text, integer, integer, integer, text, text, text, integer, date, text, text, integer, text, text, text)
-- DROP FUNCTION IF EXISTS public.qms_patient_create_booking(text, text, date, text, text, integer, integer, integer, text, text, text, integer, date, text, text, integer, text, text, text);
CREATE OR REPLACE FUNCTION public.qms_patient_create_booking(
    p_cccd text,
    p_ho_ten text,
    p_ngay_sinh DATE,
    p_gioi_tinh text,
    p_dan_toc text,
    p_ma_tinh       INTEGER,
    p_ma_quan_huyen INTEGER,
    p_ma_phuong_xa  INTEGER,
    p_dia_chi_chi_tiet text,
    p_so_dien_thoai text,
    p_ma_khoa text,
    p_ma_phong_kham INTEGER,
    p_ngay_hen      DATE,
    p_gio_hen text,
    p_ly_do_kham text,
    p_occupation INTEGER,
    p_doctor text,
    p_email text DEFAULT ''::text,
    p_type text DEFAULT 'ONL'::text,
    p_idcard_issue_date date DEFAULT NULL) RETURNS INTEGER LANGUAGE 'plpgsql' COST 100 VOLATILE PARALLEL UNSAFE
AS
  $BODY$
  DECLARE
    v_res      INTEGER;
    v_idx      INTEGER;
    v_receptno INTEGER;
    v_count    INTEGER;
  BEGIN
    -- Kiểm tra xem block giờ hẹn đã được đăng ký chưa
    SELECT COUNT(*)
    INTO v_count
    FROM hms_schedule_exam
    WHERE hse_date = p_ngay_hen
    AND hse_deptid = p_ma_khoa
    AND hse_roomid = p_ma_phong_kham
    AND hse_time   = p_gio_hen
    AND hse_status = 'S';
    IF v_count     > 0 THEN
      RAISE NOTICE 'Block giờ hẹn đã được đăng ký';
      RETURN -1;
    END IF;
    -- Kiểm tra xem bệnh nhân đã đăng ký trong ngày chưa
    SELECT COUNT(*)
    INTO v_count
    FROM qms_patient
    WHERE qms_contact        = p_so_dien_thoai
    AND qms_deptid           = p_ma_khoa
    AND qms_appointment_date = p_ngay_hen
    AND qms_patientname      = p_ho_ten
    AND qms_birthdate        = p_ngay_sinh
    AND qms_sex              = p_gioi_tinh;
    IF v_count               > 0 THEN
      RAISE NOTICE 'Chỉ được đăng ký 1 lần trong ngày';
      RETURN -3;
    END IF;
    -- Lấy hse_receptno, nếu không có thì đặt v_receptno = 0
    SELECT hse_receptno
    INTO v_receptno
    FROM hms_schedule_exam
    WHERE hse_deptid   = p_ma_khoa
    AND hse_roomid     = p_ma_phong_kham
    AND hse_date::DATE = p_ngay_hen::DATE
    AND hse_time       = p_gio_hen;
    IF NOT FOUND THEN
      v_receptno := 0;
    END IF;
    IF v_receptno IS NULL OR v_receptno <= 0 THEN
      RAISE NOTICE 'Block chưa được tạo';
      RETURN -2;
    END IF;
    -- Lấy giá trị tiếp theo của sequence
    SELECT nextval('qms_idx_asq')
    INTO v_idx;
    -- Thêm bản ghi vào qms_patient
    INSERT
    INTO qms_patient
      (
        qms_idx,
        qms_idcard,
        qms_patientname,
        qms_birthdate,
        qms_sex,
        qms_ethnic,
        qms_prov_id,
        qms_dist_id,
        qms_vill_id,
        qms_address,
        qms_contact,
        qms_email,
        qms_deptid,
        qms_roomid,
        qms_appointment_date,
        qms_appointment_time,
        qms_reason,
        qms_status,
        qms_receptno,
        qms_occupation,
        qms_doctor,
        qms_type
      )
      VALUES
      (
        v_idx,
        p_cccd,
        p_ho_ten,
        p_ngay_sinh,
        p_gioi_tinh,
        p_dan_toc,
        p_ma_tinh,
        p_ma_quan_huyen,
        p_ma_phuong_xa,
        p_dia_chi_chi_tiet,
        p_so_dien_thoai,
        p_email,
        p_ma_khoa,
        p_ma_phong_kham,
        p_ngay_hen,
        p_gio_hen,
        p_ly_do_kham,
        'O',
        v_receptno,
        p_occupation,
        p_doctor,
        p_type,
        p_idcard_issue_date
      );
    -- Lấy số dòng ảnh hưởng
    GET DIAGNOSTICS v_res = ROW_COUNT;
    RAISE NOTICE 'Số bản ghi được chèn: %',
    v_res;
    RETURN v_idx;
  END;
$BODY$;
ALTER
FUNCTION public.qms_patient_create_booking
  (
    text,
    text,
    DATE,
    text,
    text,
    INTEGER,
    INTEGER,
    INTEGER,
    text,
    text,
    text,
    INTEGER,
    DATE,
    text,
    text,
    INTEGER,
    text,
    text,
    text,
    DATE
  )
  OWNER TO vimes;


-- FUNCTION: public.qms_register_ticket_online(character varying, character varying, character varying, character varying, character varying, character varying, date, text, character varying, boolean, character varying, character varying, character varying, integer, character varying, date, character varying)

-- DROP FUNCTION IF EXISTS public.qms_register_ticket_online(character varying, character varying, character varying, character varying, character varying, character varying, date, text, character varying, boolean, character varying, character varying, character varying, integer, character varying, date, character varying);

CREATE OR REPLACE FUNCTION public.qms_register_ticket_online(
	p_number_idx integer,
	p_kiosk_id character varying,
	p_kiosk_type character varying,
	p_patient_name character varying,
	p_identity_number character varying,
	p_phone character varying,
	p_dob date,
	p_address text,
	p_department_id character varying,
	p_is_priority boolean,
	p_insurance_card character varying,
	p_province_code character varying,
	p_ward_code character varying,
	p_roomid integer,
	p_gender character varying,
	p_identitydate date,
	p_examdate character varying)
    RETURNS TABLE(ticket_id integer, ticket_number character varying, roomname character varying, patient_name character varying, doc_no character varying, patient_id character varying, created_at timestamp without time zone) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
DECLARE
    v_patient_id    INT := 0;
    v_doc_no        INT := 0;
    v_exam_id       INT := 0;
	v_card_idx      INT := 0;
    v_new_ticket_id INT;
    v_created_at    TIMESTAMP := CURRENT_TIMESTAMP;
    v_surname       VARCHAR(50);
    v_midname       VARCHAR(50);
    v_firstname     VARCHAR(50);
	v_roomname      VARCHAR(100);
	v_roomid		INT := p_roomid;
	v_disrate		INT := 0;
	v_maphikham		VARCHAR(10);
	v_examdate		TIMESTAMP;
	v_gender		VARCHAR(10);
BEGIN
	
	v_examdate := TO_TIMESTAMP(p_examdate, 'YYYY-MM-DD HH24:MI:SS');
	v_gender := 'F';
	IF(lower(p_gender) = 'nam') THEN
	  v_gender := 'M';
	END IF;
	
    -- 1. XỬ LÝ BỆNH NHÂN (HMS_PATIENT)
    IF p_identity_number IS NOT NULL AND p_identity_number <> '' THEN
        SELECT hp_patientno INTO v_patient_id FROM hms_patient WHERE hp_sin = p_identity_number LIMIT 1;
    END IF;

	--v_objectid := hms_insert_card(v_patientno, 'BHYT', input_bhyt, '01001', '20240101', '20241231');
    -- 2. NẾU LÀ BỆNH NHÂN MỚI -> TẠO BỆNH NHÂN
    IF v_patient_id IS NULL OR v_patient_id = 0 THEN
        -- Tách tên
        SELECT surname, midname, firstname INTO v_surname, v_midname, v_firstname FROM split_fullname(p_patient_name);        
        -- Tạo BN mới
        v_patient_id := hms_insert_patient(v_surname, v_midname, v_firstname, p_dob, v_gender, p_province_code, p_province_code, p_ward_code, p_address, p_identity_number, p_identitydate, '', '', '');
	ELSE
		 -- 3. XỬ LÝ HỒ SƠ KHÁM TRONG NGÀY (HMS_DOC)
    	SELECT he_docno INTO v_doc_no FROM hms_exam WHERE he_patientno = v_patient_id AND DATE(he_examdate) = CURRENT_DATE LIMIT 1;
    END IF;

    IF v_doc_no IS NULL OR v_doc_no = 0 THEN
        -- Tạo mới hồ sơ (Visit)
        v_doc_no := hms_create_hms_doc(v_patient_id, p_phone, 5, p_insurance_card, 0, v_card_idx, p_department_id,'KIOS', v_examdate);
    END IF;
    
		
    v_exam_id := hms_insert_exam_online(v_patient_id, v_doc_no, p_department_id, p_roomid, '', v_maphikham);
	
	-- Fetch room name
	SELECT hrl_roomname INTO v_roomname FROM hms_roomlist WHERE hrl_deptid = p_department_id AND hrl_id = p_roomid;

    -- 5. TẠO PHIẾU HÀNG ĐỢI (QMS_PATIENTS)
    UPDATE qms_patient SET qms_patientno = v_patient_id, qms_docno = v_doc_no WHERE qms_idx = p_number_idx; 
    

    -- 6. TRẢ VỀ KẾT QUẢ
    RETURN QUERY
    SELECT v_roomid, v_exam_id::VARCHAR, v_roomname, p_patient_name, v_doc_no::VARCHAR, v_patient_id::VARCHAR, v_created_at;
END;
$BODY$;
