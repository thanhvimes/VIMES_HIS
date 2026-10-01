-- ============================================================================
-- Migration 151: Đảm bảo cột sd_bednumber trong sys_dept để thiết lập giường kế hoạch (Sở giao)
-- và khởi tạo giá trị từ sd_planned_bed nếu sd_bednumber chưa có dữ liệu.
-- ============================================================================

DO $$ 
BEGIN 
    -- 1. Đảm bảo cột sd_bednumber tồn tại trong sys_dept
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sys_dept' AND column_name = 'sd_bednumber'
    ) THEN
        ALTER TABLE sys_dept ADD COLUMN sd_bednumber integer DEFAULT NULL;
    END IF;

    -- 2. Đồng bộ giá trị khởi tạo từ sd_planned_bed sang sd_bednumber nếu sd_bednumber đang null hoặc 0
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sys_dept' AND column_name = 'sd_planned_bed'
    ) THEN
        UPDATE sys_dept 
        SET sd_bednumber = sd_planned_bed 
        WHERE (sd_bednumber IS NULL OR sd_bednumber = 0) 
          AND sd_planned_bed IS NOT NULL 
          AND sd_planned_bed > 0;
    END IF;

END $$;
