CREATE OR REPLACE FUNCTION public.hms_card_trg_proc()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
  DECLARE
    vCount            INTEGER;
    company_type      VARCHAR(1);
    company_id        VARCHAR(15);
    company_provid    INTEGER;
    company_insprovid INTEGER;
    mRes              INTEGER;
    mInsLine          INTEGER;
  BEGIN
    IF TG_OP         = 'INSERT' THEN
      IF NEW.HC_IDX IS NULL THEN
        SELECT NEXTVAL('HMS_CARD_IDX_ASQ') INTO NEW.HC_IDX FROM dual;
      END IF;
      UPDATE hms_doc
      SET hd_insregdate  =NEW.hc_regdate,
        hd_insexpdate    = NEW.hc_expdate
      WHERE hd_patientno = NEW.hc_patientno
      AND hd_cardno      =NEW.hc_cardno
      AND hd_cardidx     = NEW.hc_idx;
    END IF;
    IF TG_OP = 'UPDATE' THEN
      UPDATE hms_doc
      SET hd_insexpdate        = NEW.hc_expdate
      WHERE hd_patientno       = NEW.hc_patientno
      AND hd_cardno            =NEW.hc_cardno
      AND hd_cardidx           = NEW.hc_idx
      AND hd_status           <> 'T'
      AND hdf_acceptedfee NOT IN('Y','A','P');
    END IF;
    mInsLine := 3;
    SELECT sc_type,
      sc_id,
      sc_provid,
      sc_insprovid
    INTO company_type,
      company_id,
      company_provid,
      company_insprovid
    FROM sys_company limit 1;
  --  WHERE ROWNUM            <=1;
    IF LENGTH(NEW.hc_cardno) = 20 THEN
      NEW.hc_regcode        := SUBSTR(NEW.hc_cardno, 16, 5);
    END IF;
    --SELECT hh_provid INTO hos_provid FROM hms_hospital WHERE hh_id=szInsRegCode;
    --Kiem tra neu benh vien tuyen 1 hoac benh vien tuyen 2
    IF(company_type='1' OR company_type='2') THEN
      --Kiem tra neu ma noi dang ky=ma benh vien -> tuyen 1
      --IF(cast(SUBSTR(NEW.hc_cardno,4,2) as integer)=company_insprovid ) THEN
      IF(cast(substring(NEW.hc_cardno from 16 for 2) as integer)=company_insprovid ) THEN
        IF(NEW.hc_regcode         = company_id ) THEN
          mInsLine               := 1;
        ELSE
          mInsLine := 2;
        END IF;
      ELSE
        mInsLine := 3;
      END IF;
    END IF;
    NEW.hc_line := mInsLine;
    RETURN NEW;
  END;
  $function$
