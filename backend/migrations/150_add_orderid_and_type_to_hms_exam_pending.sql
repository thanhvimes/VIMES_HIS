-- Migration 150: Thêm các cột hep_orderid và hep_type vào hms_exam_pending nếu chưa có
-- Đảm bảo trigger hms_exam_pending_insert thực thi an toàn

ALTER TABLE hms_exam_pending ADD COLUMN IF NOT EXISTS hep_orderid integer;
ALTER TABLE hms_exam_pending ADD COLUMN IF NOT EXISTS hep_type character varying(32);
