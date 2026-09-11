-- Migration 140: Create function hms_getnextpatientno if not exists
-- Description: Tạo hàm hms_getnextpatientno lấy số bệnh nhân tiếp theo từ sequence chuẩn nếu chưa tồn tại

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'hms_getnextpatientno'
    ) THEN
        EXECUTE '
            CREATE FUNCTION hms_getnextpatientno() 
            RETURNS integer AS $func$
            BEGIN
                RETURN nextval(''hms_patient_hp_patientno_seq'')::integer;
            END;
            $func$ LANGUAGE plpgsql;
        ';
    END IF;
END $$;
