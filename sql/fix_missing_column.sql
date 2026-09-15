
-- Fix missing column sd_isactive in sys_dept
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sys_dept' AND column_name='sd_isactive') THEN
        ALTER TABLE sys_dept ADD COLUMN sd_isactive VARCHAR(1) DEFAULT 'Y';
    END IF;
END $$;
