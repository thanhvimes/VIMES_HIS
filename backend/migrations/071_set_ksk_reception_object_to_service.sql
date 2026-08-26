-- Migration 097: Cập nhật stored procedure hms_exm_registration_exam và gán mặc định đối tượng bệnh nhân từ gói KSK vào HIS là Dịch vụ (7)

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
    v_surname     VARCHAR(15);
    v_midname     VARCHAR(45);
    v_firstname   VARCHAR(15);
    
    v_birthdate   DATE;
    v_sex         VARCHAR(1);
    v_ethnic      INTEGER;
    v_occupation  INTEGER;
    v_provid      INTEGER;
    v_rank        INTEGER;
    v_status      VARCHAR(1);
    
    v_examdate    TIMESTAMP;
    v_receptno    INTEGER;
    v_receptidx   INTEGER;
    tmpInt        INTEGER;
    v_orderid     INTEGER;
    v_group       VARCHAR(5);
    tmpRec        RECORD;
    v_contract_id INTEGER;
    v_company_id  INTEGER;
    v_company_name VARCHAR(254);
    v_feeidx      INTEGER;
    v_object      INTEGER;
    v_phone       CHARACTER VARYING(11);
    v_fillter     CHARACTER VARYING(1);
    v_dept        TEXT;
    v_deptsetup   TEXT;
    v_usedept     CHARACTER VARYING(1);
    v_useage      CHARACTER VARYING(1);
    v_male_age    INTEGER;
    v_female_age  INTEGER;
    v_age         INTEGER;
    bIsAgeOk      BOOLEAN;
    bIsDeptOk     BOOLEAN;
    v_roomkey     INTEGER;
BEGIN
    v_examdate := TO_TIMESTAMP(p_examdate, 'YYYY-MM-DD HH24:MI');
    v_age := 0;
    IF v_examdate < CURRENT_TIMESTAMP THEN
        v_examdate := CURRENT_TIMESTAMP;
    END IF;

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

    IF v_status <> 'O' THEN
        RAISE NOTICE 'Benh nhan da duoc dang ky kham';
        RETURN v_docno;
    END IF;

    IF v_docno > 0 THEN
        RETURN v_docno;
    END IF;

    -- Lấy đối tượng từ hợp đồng khám, mặc định là 7 (Dịch vụ) nếu không có hoặc <= 0
    SELECT hec_object INTO v_object
    FROM hms_exm_contract
    WHERE hec_contract_id = v_contract_id;

    IF (v_object IS NULL OR v_object <= 0) THEN
        v_object := 7;
    END IF;

    v_docno := hms_getnextdocno();
    INSERT INTO hms_doc (
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
        hd_object,
        hd_telephone
    ) VALUES (
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

    SELECT COALESCE(MAX(he_receptno), 0) + 1
    INTO v_receptno
    FROM hms_exam
    WHERE he_deptid = p_deptid
      AND he_roomid = p_roomid
      AND TRUNC(he_examdate) = TRUNC(v_examdate);

    SELECT COALESCE(hfl_idx, 0)
    INTO v_feeidx
    FROM hms_fee_list
    WHERE hfl_feeid = p_examtype;

    SELECT hrl_key INTO v_roomkey
    FROM hms_roomlist
    WHERE hrl_deptid = p_deptid AND hrl_id = p_roomid;

    INSERT INTO hms_exam (
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
    ) VALUES (
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

    GET DIAGNOSTICS v_res := ROW_COUNT;
    IF v_res <= 0 THEN
        RETURN 0;
    END IF;

    UPDATE hms_exm_employee
    SET hee_docno = v_docno,
        hee_status = 'T'
    WHERE hee_employee_id = p_employee_id;

    RAISE NOTICE '%', v_docno;

    -- Tính tuổi của nhân viên
    IF (v_birthdate IS NOT NULL) THEN
        v_age := EXTRACT(YEAR FROM age(v_examdate, v_birthdate));
    ELSE
        v_age := 0;
    END IF;

    RAISE NOTICE 'tuoi: %', v_age;

    IF (p_createCLS = 'Y') THEN
        FOR tmpRec IN (
            SELECT hfl_groupid,
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
            WHERE hesp_contract_id = v_contract_id
              AND (hesp_gender = 'A' OR hesp_gender = v_sex)
              AND hesp_isactive = 'Y'
              AND hesp_itemid = hfl_feeid
        ) LOOP
            -- Kiểm tra giới hạn độ tuổi
            IF (tmpRec.hesp_minage IS NOT NULL AND v_age < tmpRec.hesp_minage) THEN
                CONTINUE;
            END IF;
            IF (tmpRec.hesp_maxage IS NOT NULL AND v_age > tmpRec.hesp_maxage) THEN
                CONTINUE;
            END IF;

            bIsAgeOk := TRUE;
            bIsDeptOk := TRUE;
            v_group := tmpRec.hfl_groupid;
            v_fillter := tmpRec.hsep_fillter_type;
            v_deptsetup := tmpRec.hsep_dept;
            v_useage := tmpRec.hsep_useage;
            v_usedept := tmpRec.hsep_use_dept;
            v_male_age := tmpRec.hsep_male_age;
            v_female_age := tmpRec.hsep_female_age;

            IF (v_fillter = 'A') THEN
                IF (v_useage = 'Y') THEN
                    IF (v_sex = 'M' AND v_age < v_male_age) THEN
                        bIsAgeOk := FALSE;
                        CONTINUE;
                    END IF;
                    IF (v_sex = 'F' AND v_age < v_female_age) THEN
                        bIsAgeOk := FALSE;
                        CONTINUE;
                    END IF;
                END IF;
                IF (v_usedept = 'Y') THEN
                    IF (POSITION(v_dept IN v_deptsetup) = 0) THEN
                        bIsDeptOk := FALSE;
                        CONTINUE;
                    END IF;
                END IF;
            ELSE
                IF (v_useage = 'Y') THEN
                    IF (v_sex = 'M' AND v_age < v_male_age) THEN
                        bIsAgeOk := FALSE;
                    END IF;
                    IF (v_sex = 'F' AND v_age < v_female_age) THEN
                        bIsAgeOk := FALSE;
                    END IF;
                END IF;
                IF (v_usedept = 'Y') THEN
                    IF (POSITION(v_dept IN v_deptsetup) = 0) THEN
                        bIsDeptOk := FALSE;
                    END IF;
                END IF;
                IF (v_useage = 'Y' AND v_usedept = 'Y') THEN
                    IF (bIsAgeOk = FALSE AND bIsDeptOk = FALSE) THEN
                        CONTINUE;
                    END IF;
                END IF;
                IF (v_useage = 'Y' AND v_usedept = 'N') THEN
                    IF (bIsAgeOk = FALSE) THEN
                        CONTINUE;
                    END IF;
                END IF;
                IF (v_useage = 'N' AND v_usedept = 'Y') THEN
                    IF (bIsDeptOk = FALSE) THEN
                        CONTINUE;
                    END IF;
                END IF;
            END IF;

            v_orderid := hms_paraclinic_add(p_userid, p_deptid, 0, p_roomid, 0, v_patientno, v_docno, TO_CHAR(v_examdate, 'YYYY-MM-DD HH24:MI:SS'), '', v_group, 'O', 'RM', 0);
            IF v_orderid > 0 THEN
                tmpInt := hms_paraclinic_addline(v_docno, v_orderid, tmpRec.hesp_itemid, v_group, 'RM', tmpRec.hesp_quantity, '');
            END IF;
        END LOOP;

        UPDATE hms_testorder
        SET hpc_status = 'S', hpc_orderdate = v_examdate
        WHERE hpc_docno = v_docno AND hpc_status = 'O';

        UPDATE hms_pacsorder
        SET hpc_status = 'S', hpc_orderdate = v_examdate
        WHERE hpc_docno = v_docno AND hpc_status = 'O';
    END IF;

    RETURN v_docno;
END;
$function$;

-- Cập nhật mặc định hec_object trong hms_exm_contract là 7 (Dịch vụ)
UPDATE hms_exm_contract
SET hec_object = 7
WHERE hec_object IS NULL OR hec_object = 0;

-- Cập nhật tất cả hồ sơ bệnh nhân tiếp nhận từ KSK trước đây mà chưa có đối tượng thành '7' (Dịch vụ)
UPDATE hms_doc
SET hd_object = 7
WHERE hd_docno IN (SELECT hee_docno FROM hms_exm_employee WHERE hee_docno IS NOT NULL AND hee_docno > 0)
  AND (hd_object IS NULL OR hd_object = 0);
