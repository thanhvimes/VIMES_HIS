-- Migration 164: Đảm bảo bảng sys_dept có cả cột sd_active (chuẩn vimes_130) và sd_isactive, đồng bộ 2 chiều
DO $$ 
BEGIN 
    -- 1. Đảm bảo có cột sd_active (chuẩn C++/vimes_130)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sys_dept' AND column_name='sd_active') THEN
        ALTER TABLE sys_dept ADD COLUMN sd_active VARCHAR(1) DEFAULT 'Y';
    END IF;

    -- 2. Đảm bảo có cột sd_isactive
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sys_dept' AND column_name='sd_isactive') THEN
        ALTER TABLE sys_dept ADD COLUMN sd_isactive VARCHAR(1) DEFAULT 'Y';
    END IF;

    -- 3. Đồng bộ giá trị giữa 2 cột cho các bản ghi hiện có
    UPDATE sys_dept 
    SET sd_active = COALESCE(sd_active, sd_isactive, 'Y'),
        sd_isactive = COALESCE(sd_isactive, sd_active, 'Y');

END $$;
