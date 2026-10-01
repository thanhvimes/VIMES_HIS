-- Migration: 152_alter_sys_user_su_position_length.sql
-- Description: Mở rộng độ dài cột su_position trong bảng sys_user lên VARCHAR(100) để lưu chức vụ tiếng Việt (tránh lỗi value too long for type character varying(5))

DO $$ 
BEGIN 
    -- 1. Mở rộng su_position lên VARCHAR(100)
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sys_user' 
          AND column_name = 'su_position' 
          AND (character_maximum_length IS NULL OR character_maximum_length < 100)
    ) THEN 
        ALTER TABLE sys_user ALTER COLUMN su_position TYPE VARCHAR(100);
    END IF;

    -- 2. Mở rộng su_title lên VARCHAR(100) để đảm bảo đồng bộ
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sys_user' 
          AND column_name = 'su_title' 
          AND (character_maximum_length IS NULL OR character_maximum_length < 100)
    ) THEN 
        ALTER TABLE sys_user ALTER COLUMN su_title TYPE VARCHAR(100);
    END IF;

    -- 3. Mở rộng su_sign_partner lên VARCHAR(50) phòng trường hợp mã đối tác ký dài
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sys_user' 
          AND column_name = 'su_sign_partner' 
          AND (character_maximum_length IS NULL OR character_maximum_length < 50)
    ) THEN 
        ALTER TABLE sys_user ALTER COLUMN su_sign_partner TYPE VARCHAR(50);
    END IF;
END $$;
