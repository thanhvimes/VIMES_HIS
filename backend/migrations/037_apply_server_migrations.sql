-- Migration 037: Extract server.ts hardcoded migrations

-- Add columns hesp_minage and hesp_maxage to hms_exm_servicepackage
ALTER TABLE hms_exm_servicepackage ADD COLUMN IF NOT EXISTS hesp_minage INTEGER;
ALTER TABLE hms_exm_servicepackage ADD COLUMN IF NOT EXISTS hesp_maxage INTEGER;

-- Update stored procedure hms_exm_registration_exam to support min_age and max_age checks
CREATE OR REPLACE FUNCTION public.hms_exm_registration_exam(
    p_employee_id integer,
    p_userid character varying,
    p_deptid character varying,
    p_roomid integer,
    p_examtype character varying,
    p_examdate character varying,
    p_createcls character varying DEFAULT 'Y'::character varying
)
RETURNS integer
LANGUAGE plpgsql
AS $function$
DECLARE
    v_res         INTEGER;
    v_count       INTEGER;
    v_patientno   INTEGER;
    v_docno       INTEGER;
    v_id          VARCHAR(15);
    v_surname        VARCHAR(15);
    v_midname        VARCHAR(45);
    v_firstname        VARCHAR(15);
    
    v_birthdate   DATE;
    v_sex         VARCHAR(1);
    v_ethnic integer;
    v_occupation integer;
    v_provid integer;
    v_rank    INTEGER;
    v_status      VARCHAR(1);
    
    v_examdate    TIMESTAMP;
    v_receptno integer;
    v_receptidx integer;
    tmpInt        INTEGER;
    v_orderid     INTEGER;
    v_group       VARCHAR(5);
    tmpRec	record;
    v_contract_id INTEGER;
    v_company_id integer;
    v_company_name varchar(254);
    v_feeidx integer;
    v_object integer;
    v_phone character varying(11);
    v_fillter character varying(1);
    v_dept text;
    v_deptsetup text;
    v_usedept character varying(1);
    v_useage character varying(1);
    v_male_age integer;
    v_female_age integer;
    v_age integer;
    bIsAgeOk bool;
    bIsDeptOk bool;
    v_roomkey       INTEGER;
BEGIN
    --
    v_examdate := TO_TIMESTAMP(p_examdate, 'YYYY-MM-DD HH24:MI');
    --
    v_age:=0;
    if v_examdate < CURRENT_TIMESTAMP then
        v_examdate := CURRENT_TIMESTAMP;
    end if;
    --
    SELECT hee_contract_id,
    hee_company_id,
    hee_id,
    hee_surname,
    hee_midname,
    hee_firstname,
    hee_birthdate,
    hee_sex,
    hee_ethnic,
    hee_occupation,
    hee_provid,
    hee_rank,
    hee_patientno,
    hee_status,
    hee_docno,
    hee_phone,
    hee_dept
    INTO v_contract_id,
    v_company_id,
    v_id,
    v_surname,
    v_midname,
    v_firstname,
    v_birthdate,
    v_sex,
    v_ethnic,
    v_occupation,
    v_provid,
    v_rank,
    v_patientno,
    v_status,
    v_docno,
    v_phone,
    v_dept
    FROM hms_exm_employee
    WHERE hee_employee_id = p_employee_id;
    IF v_status          <> 'O' THEN
    raise notice 'Benh nhan da duoc dang ky kham';
    RETURN v_docno;
    END IF;
    --
    IF v_docno > 0 THEN
    RETURN v_docno;
    END IF;
    --
    select hec_object into v_object
    from hms_exm_contract
    where hec_contract_id = v_contract_id;
    --
    v_docno := hms_getnextdocno();
    INSERT
    INTO hms_doc
    (
        hd_createdby,
        hd_createddate,
        hd_patientno,
        hd_docno,
        hd_admitdept,
        hd_admitdate,
        hd_enddept,
        hd_enddate,
        hd_admitstate,
        hd_nonexam,
        hd_object ,
        hd_telephone
    )
    VALUES
    (
        p_userid,
        CURRENT_TIMESTAMP,
        v_patientno,
        v_docno,
        p_deptid,
        v_examdate,
        p_deptid,
        v_examdate,
        'B',
        'Y',
        v_object,
        v_phone
    );
    --
    select coalesce(max(he_receptno), 0)+1
    into v_receptno
    from hms_exam
    where he_deptid = p_deptid
    and he_roomid = p_roomid
    and trunc(he_examdate) = trunc(v_examdate);
    
    --
    select coalesce(hfl_idx, 0)
    into v_feeidx
    from hms_fee_list
    where hfl_feeid = p_examtype;
    
    SELECT hrl_key into v_roomkey from hms_roomlist where hrl_deptid=p_deptid and hrl_id=p_roomid;
    
    --
    INSERT
    INTO hms_exam
    (
        he_createdby,
        he_createddate,
        he_patientno,
        he_docno,
        he_deptid,
        he_roomid,
        he_examtype,
        he_examdate,
        he_receptno,
        he_feeidx,
        he_roomkey
    )
    VALUES
    (
        p_userid,
        CURRENT_TIMESTAMP,
        v_patientno,
        v_docno,
        p_deptid,
        p_roomid,
        p_examtype,
        v_examdate,
        v_receptno,
        v_feeidx,
        v_roomkey
    );
    get diagnostics v_res := ROW_COUNT;
    IF v_res              <=0 THEN
    RETURN 0;
    END IF;
    UPDATE hms_exm_employee
    SET hee_docno         = v_docno,
    hee_status          ='T'
    WHERE hee_employee_id = p_employee_id;
    --
    raise notice '%',v_docno;
    
    -- Tính tuổi của nhân viên
    IF (v_birthdate IS NOT NULL) THEN
        v_age := EXTRACT(YEAR FROM age(v_examdate, v_birthdate));
    ELSE
        v_age := 0;
    END IF;

    raise notice 'tuoi: %',v_age;
    IF(p_createCLS='Y') THEN 
    FOR tmpRec IN
        (SELECT hfl_groupid,
            hesp_itemid,
            hesp_quantity,
            hesp_unitprice,
            hsep_fillter_type,
            hsep_useage,
            hsep_male_age,
            hsep_female_age,
            hsep_use_dept,
            hsep_dept,
            hesp_minage,
            hesp_maxage
        FROM hms_exm_servicepackage,
            hms_fee_list
        WHERE hesp_contract_id=v_contract_id
        AND (hesp_gender      = 'A'
        OR hesp_gender         =v_sex)
        AND hesp_isactive      ='Y'
        AND hesp_itemid       = hfl_feeid
        )
        LOOP
            -- 1. Kiểm tra giới hạn độ tuổi mới (hesp_minage, hesp_maxage)
            IF (tmpRec.hesp_minage IS NOT NULL AND v_age < tmpRec.hesp_minage) THEN
                CONTINUE;
            END IF;
            IF (tmpRec.hesp_maxage IS NOT NULL AND v_age > tmpRec.hesp_maxage) THEN
                CONTINUE;
            END IF;

            bIsAgeOk =true;
            bIsDeptOk =true;
            v_group   := tmpRec.hfl_groupid;
            v_fillter:=  tmpRec.hsep_fillter_type;
            v_deptsetup:= tmpRec.hsep_dept;
            v_useage:= tmpRec.hsep_useage;
            v_usedept:= tmpRec.hsep_use_dept;
            v_male_age:= tmpRec.hsep_male_age;
            v_female_age:= tmpRec.hsep_female_age;
            -- v_dept:= 
            
            if( v_fillter='A') THEN
            -- phai qua dc ca 2 truong hop tuoi va khoa thi moi cho ke
            IF(v_useage= 'Y') THEN
                if(v_sex= 'M'  and v_age < v_male_age ) THEN
                    bIsAgeOk= false;
                    continue;
                END IF;
                raise notice 'tuoi: % % %',v_age,v_sex,v_female_age;
                if(v_sex= 'F'  and v_age < v_female_age ) THEN
                    bIsAgeOk= false;
                    continue;
                END IF;
            END IF;
            IF(v_usedept= 'Y') THEN 
                if(position(v_dept IN v_deptsetup) =0) then
                    bIsDeptOk= false;
                    continue;
                end if;
                
            END IF;

            ELSE
            -- chi can thoa man 1 dieu kien la dc ke
            IF(v_useage= 'Y') THEN
                if(v_sex= 'M'  and v_age < v_male_age ) THEN
                    bIsAgeOk= false;
                END IF;
                if(v_sex= 'F'  and v_age < v_female_age ) THEN
                    bIsAgeOk= false;
                END IF;
            END IF;
            IF(v_usedept= 'Y') THEN 
                if(position(v_dept IN v_deptsetup) =0) then
                    bIsDeptOk= false;
                END IF;
                
            END IF;
            if( v_useage= 'Y' and v_usedept= 'Y') THEN
                IF(bIsAgeOk= false and bIsDeptOk =false) then
                    continue;
                end if;
            END IF;
            if( v_useage= 'Y' and v_usedept= 'N') THEN
                IF(bIsAgeOk= false ) then
                    continue;
                end if;
            END IF;
            if( v_useage= 'N' and v_usedept= 'Y') THEN
                IF( bIsDeptOk =false) then
                    continue;
                end if;
            END IF;
            

            END IF;
            v_orderid := hms_paraclinic_add(p_userid, p_deptid, 0, p_roomid, 0, v_patientno, v_docno, to_char(v_examdate, 'YYYY-MM-DD HH24:MI:SS'), '', v_group, 'O', 'RM', 0);
            if v_orderid > 0 then
                raise notice 'them  ';
            tmpInt    := hms_paraclinic_addline( v_docno, v_orderid, tmpRec.hesp_itemid, v_group, 'RM', tmpRec.hesp_quantity, '');
            raise notice ' them xong';
            end if;
        END LOOP;
        --
        update hms_testorder 
        set hpc_status='S', hpc_orderdate = v_examdate
        where hpc_docno = v_docno 
        and hpc_status='O';
        --
        update hms_pacsorder 
        set hpc_status='S', hpc_orderdate = v_examdate
        where hpc_docno = v_docno 
        and hpc_status='O';

END IF;

--
RETURN v_docno;
END;
$function$;

-- Migration 031: Add HIS sync tracking columns
ALTER TABLE health_check_masters ADD COLUMN IF NOT EXISTS his_employee_id VARCHAR(50);
ALTER TABLE health_check_masters ADD COLUMN IF NOT EXISTS his_contract_id INTEGER;
ALTER TABLE health_check_masters ADD COLUMN IF NOT EXISTS his_doc_no VARCHAR(50);
ALTER TABLE health_check_masters ADD COLUMN IF NOT EXISTS sync_mode VARCHAR(20) DEFAULT 'MANUAL';

-- Create Indexes (safe with IF NOT EXISTS)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_hc_masters_his_emp_contract') THEN
        CREATE UNIQUE INDEX idx_hc_masters_his_emp_contract ON health_check_masters(his_employee_id, his_contract_id) WHERE his_employee_id IS NOT NULL AND his_contract_id IS NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_hc_masters_his_contract') THEN
        CREATE INDEX idx_hc_masters_his_contract ON health_check_masters(his_contract_id) WHERE his_contract_id IS NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_hc_masters_his_doc_no') THEN
        CREATE INDEX idx_hc_masters_his_doc_no ON health_check_masters(his_doc_no) WHERE his_doc_no IS NOT NULL;
    END IF;
END $$;

ALTER TABLE hms_exm_contract ADD COLUMN IF NOT EXISTS hec_synced_count INTEGER DEFAULT 0;
ALTER TABLE hms_exm_contract ALTER COLUMN hec_type TYPE character varying(50);
ALTER TABLE hms_exm_contract ADD COLUMN IF NOT EXISTS hec_form_type VARCHAR(10);

-- Add QĐ 1551 columns to hms_exm_employee table
ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_cardid_date VARCHAR(50);
ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_cardid_place VARCHAR(255);
ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_guardian_name VARCHAR(255);
ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_guardian_cccd VARCHAR(50);

-- Migration 033: Create health_check_service_mappings table
CREATE TABLE IF NOT EXISTS health_check_service_mappings (
    service_code VARCHAR(50) PRIMARY KEY,
    cls_type VARCHAR(10) NOT NULL CHECK (cls_type IN ('XN', 'HA', 'TD')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO health_check_service_mappings (service_code, cls_type) VALUES
('A01.001', 'XN'),
('A01.002', 'XN'),
('A01.003', 'XN'),
('A01.004', 'XN'),
('A02.001', 'XN'),
('A02.002', 'XN'),
('A02.003', 'XN'),
('A02.004', 'XN'),
('A02.005', 'XN'),
('A02.006', 'XN'),
('A02.007', 'XN'),
('A03.001', 'XN'),
('A03.002', 'XN'),
('B20.001', 'HA'),
('B20.002', 'HA'),
('B20.003', 'HA'),
('B22.001', 'HA'),
('B22.002', 'HA'),
('B23.001', 'HA'),
('B24.001', 'HA'),
('D10.001', 'TD'),
('D10.002', 'TD'),
('D11.001', 'TD'),
('D12.001', 'TD'),
('D12.002', 'TD'),
('D13.001', 'TD')
ON CONFLICT (service_code) DO NOTHING;

-- Auto-migration: Add hob_ho_idx to hms_operation_board
ALTER TABLE hms_operation_board ADD COLUMN IF NOT EXISTS hob_ho_idx INTEGER;

CREATE OR REPLACE FUNCTION public.hms_operation_board_create(
    p_docno integer, 
    p_date text, 
    p_deptid text, 
    p_roomid integer, 
    p_operation_table integer, 
    p_status text, 
    p_rettime integer, 
    p_retdept text, 
    p_conscious_date text,
    p_ho_idx integer DEFAULT NULL
)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
  DECLARE
  v_board_id      INTEGER;
  v_res           INTEGER;
  v_count         INTEGER;
  v_orderdate     TIMESTAMP;
  v_consciousdate TIMESTAMP;
BEGIN
  v_res           := 0;
  v_orderdate     := to_timestamp(p_date, 'YYYY-MM-DD HH24:MI:SS');
  v_consciousdate := to_timestamp(p_conscious_date, 'YYYY-MM-DD HH24:MI:SS');
  
  IF trunc(v_orderdate) < TRUNC(CURRENT_DATE) THEN
    RETURN -1;
  END IF;
  
  IF TRUNC(v_consciousdate) < TRUNC(CURRENT_DATE) THEN
    RETURN -2;
  END IF;
  
  IF TRUNC(v_orderdate) > TRUNC(v_consciousdate) THEN
    RETURN -3;
  END IF;
  
  SELECT MAX(hob_operation_board_id)
  INTO v_board_id
  FROM hms_operation_board
  WHERE hob_docno     = p_docno
  AND TRUNC(hob_date) = trunc(v_orderdate);
  
  IF v_board_id > 0 THEN
    UPDATE hms_operation_board
    SET hob_date                 = trunc(v_orderdate),
      hob_performdate            = v_orderdate,
      hob_roomid                 = p_roomid,
      hob_deptid                 = p_deptid,
      hob_status                 = p_status,
      hob_rettime                = p_rettime,
      hob_retdept                = p_retdept,
      hob_conscious_date         = v_consciousdate,
      hob_operation_table        = p_operation_table,
      hob_ho_idx                 = COALESCE(p_ho_idx, hob_ho_idx)
    WHERE hob_operation_board_id = v_board_id;
    
    GET DIAGNOSTICS v_res = ROW_COUNT;
  ELSE
    SELECT COALESCE(MAX(hob_operation_board_id),0)+1
    INTO v_board_id
    FROM hms_operation_board;
    
    INSERT INTO hms_operation_board (
        HOB_OPERATION_BOARD_ID,
        HOB_DATE,
        HOB_PERFORMDATE,
        HOB_DOCNO,
        HOB_ROOMID,
        HOB_DEPTID,
        HOB_STATUS,
        HOB_RETTIME,
        HOB_RETDEPT,
        HOB_CONSCIOUS_DATE,
        HOB_OPERATION_TABLE,
        HOB_HO_IDX
    )
    VALUES (
        v_board_id,
        trunc(v_orderdate),
        v_orderdate,
        p_docno,
        p_roomid,
        p_deptid,
        p_status,
        p_rettime,
        p_retdept,
        v_consciousdate,
        p_operation_table,
        p_ho_idx
    );
    
    GET DIAGNOSTICS v_res = ROW_COUNT;
  END IF;
  
  RETURN v_res;
END;
$function$;

-- Checking and adding new module columns to sys_user
ALTER TABLE sys_user ADD COLUMN IF NOT EXISTS su_hms_hccmodule VARCHAR(1) DEFAULT '0';
ALTER TABLE sys_user ADD COLUMN IF NOT EXISTS su_hms_rolmodule VARCHAR(1) DEFAULT '0';
ALTER TABLE sys_user ADD COLUMN IF NOT EXISTS su_hms_qmsmodule VARCHAR(1) DEFAULT '0';
ALTER TABLE sys_user ADD COLUMN IF NOT EXISTS su_hms_kskmodule VARCHAR(1) DEFAULT '0';

-- Seed new modules in sys_version if not exists
ALTER TABLE sys_version ADD COLUMN IF NOT EXISTS sv_name VARCHAR(255);
ALTER TABLE sys_version ADD COLUMN IF NOT EXISTS sv_note TEXT;
INSERT INTO sys_version (sv_moduleid, sv_version, sv_name, sv_note) 
SELECT 'HCC', '1.0', 'VIMESCommandCenter', 'TT Điều hành' 
WHERE NOT EXISTS (SELECT 1 FROM sys_version WHERE sv_moduleid = 'HCC');

INSERT INTO sys_version (sv_moduleid, sv_version, sv_name, sv_note) 
SELECT 'ROL', '1.0', 'VIMESOnlineBooking', 'Đăng ký Online' 
WHERE NOT EXISTS (SELECT 1 FROM sys_version WHERE sv_moduleid = 'ROL');

INSERT INTO sys_version (sv_moduleid, sv_version, sv_name, sv_note) 
SELECT 'QMS', '1.0', 'VIMESQueueManagement', 'QMS – Gọi số' 
WHERE NOT EXISTS (SELECT 1 FROM sys_version WHERE sv_moduleid = 'QMS');

INSERT INTO sys_version (sv_moduleid, sv_version, sv_name, sv_note) 
SELECT 'KSK', '1.0', 'VIMESHealthCheckSync', 'Liên thông KSK VNeID' 
WHERE NOT EXISTS (SELECT 1 FROM sys_version WHERE sv_moduleid = 'KSK');
