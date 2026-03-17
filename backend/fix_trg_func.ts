
import { query } from './src/config/database';

async function fix() {
    try {
        console.log("Fixing hms_card_trg_proc to use the correct sequence and handle empty card numbers...");
        
        await query(`
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
        -- Fix: Use the correct sequence name found in the database
        SELECT NEXTVAL('hms_card_hc_idx_seq') INTO NEW.HC_IDX;
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
      -- Note: hdf_acceptedfee might be missing in some schemas, but we leave it for now
      AND (hdf_acceptedfee IS NULL OR hdf_acceptedfee NOT IN('Y','A','P'));
    END IF;
    
    mInsLine := 3;
    SELECT sc_type, sc_id, sc_provid, sc_insprovid
    INTO company_type, company_id, company_provid, company_insprovid
    FROM sys_company limit 1;

    -- Fix: Only perform transformations if cardno is NOT NULL and correctly formatted
    IF NEW.hc_cardno IS NOT NULL AND LENGTH(NEW.hc_cardno) = 20 THEN
      NEW.hc_regcode := SUBSTR(NEW.hc_cardno, 16, 5);
      
      IF(company_type='1' OR company_type='2') THEN
        -- Safer cast: check if it's numeric before casting
        IF (SUBSTR(NEW.hc_cardno, 16, 2) ~ '^[0-9]+$') THEN
          IF(cast(substring(NEW.hc_cardno from 16 for 2) as integer) = company_insprovid ) THEN
            IF(NEW.hc_regcode = company_id ) THEN
              mInsLine := 1;
            ELSE
              mInsLine := 2;
            END IF;
          ELSE
            mInsLine := 3;
          END IF;
        END IF;
      END IF;
    END IF;
    
    NEW.hc_line := mInsLine;
    RETURN NEW;
  END;
$function$;
        `);
        console.log("Success: Trigger function updated.");
        process.exit(0);
    } catch (e: any) {
        console.error("Fail:", e.message);
        process.exit(1);
    }
}
fix();
