≡ƒô¥ TS DB Config Initializing: {
  user: '[ENCRYPTED]',
  host: '10.1.3.200',
  database: 'vimes_jsc',
  port: '5432'
}
≡ƒÜÇ Running SQL from: D:\AI\vClinic\backend\sql\get_func_def_3.sql
Γ£à TS Database: Connected successfully
Executed query {
  text: 'SELECT pg_get_functiondef(p.oid)\nFROM pg_proc p\nJO...',
  duration: 35,
  rows: 1
}
Results:
CREATE OR REPLACE FUNCTION public.hms_insert_exam_online(p_patientno integer, p_docno integer, p_makhoa character varying, p_maphongkham integer, p_examdate character varying, p_receptno integer, p_maphikham character varying)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
  DECLARE
    tmpInt       INTEGER;
    docnonew     INTEGER;
    cardnewidx   INTEGER;
    nOject       INTEGER;
    nExamType    INTEGER;
    nReceptidx   INTEGER;
    v_Admitdate  TIMESTAMP;
    m_nPatientNo INTEGER;
    v_cardno     VARCHAR(20);
    nReceptNo    INTEGER;
    nRoomKey     INTEGER;
    vExamDate    TIMESTAMP;
    nFeeID       INTEGER;
    vXorg_id CHARACTER VARYING(5);
    vMaPhiKham CHARACTER VARYING(15);
    vPartner text;
  BEGIN
    vMaPhiKham:= trim(p_maphikham);
    IF(coalesce(vMaPhiKham,'') = '' OR LENGTH(vMaPhiKham) < 6) THEN
      vMaPhiKham:= 'D0000031';
    END IF;
	
	vExamDate := p_examdate::timestamp;
    --vExamDate:= CURRENT_TIMESTAMP;
    
	SELECT hrl_key
    INTO nRoomKey
    FROM hms_roomlist
    WHERE hrl_deptid =p_makhoa
    AND hrl_id       = p_maphongkham;	
	
    -- lay ra ma idx trong hms_fee_list
    BEGIN
      SELECT hfl_idx
      INTO nFeeID
      FROM hms_feelist
      WHERE hfl_typeid = 'E'
      AND hfl_feeid    = vMaPhiKham;
    EXCEPTION
    WHEN NO_DATA_FOUND THEN
      RETURN -1;
    END;
    -- Generate the next value for hms_exam_he_receptidx_asq
    SELECT nextval('hms_exam_he_receptidx_asq')
    INTO nReceptidx;
    INSERT
    INTO hms_exam
      (
        he_patientno,
        he_docno,
        he_deptid,
        he_roomid,
        he_receptno,
        he_examdate,
        he_hasfee,
        he_examtype,
        he_status,
        he_receptidx,
        he_doctor,
        he_typeid,
        he_feeidx,
        he_roomkey        
      )
      VALUES
      (
        p_patientno,
        p_docno,
        p_makhoa,
        p_maphongkham,
        p_receptno,
        vExamDate,
        'Y',
        vMaPhiKham,
        'O',
        nReceptidx,
        NULL,
        0,
        nFeeID,
        nRoomKey       
      );
   
    RETURN nReceptNo;
  END;
$function$

Γ£à SQL execution successful!
