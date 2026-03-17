
-- =============================================================================
-- KÍCH HOẠT AUDIT LOG CHO CÁC BẢNG TIẾP ĐÓN
-- =============================================================================

-- HMS_PATIENT
DROP TRIGGER IF EXISTS trg_audit_hms_patient ON hms_patient;
CREATE TRIGGER trg_audit_hms_patient
AFTER INSERT OR UPDATE OR DELETE ON hms_patient
FOR EACH ROW EXECUTE FUNCTION fn_sys_audit_trigger();

-- HMS_DOC
DROP TRIGGER IF EXISTS trg_audit_hms_doc ON hms_doc;
CREATE TRIGGER trg_audit_hms_doc
AFTER INSERT OR UPDATE OR DELETE ON hms_doc
FOR EACH ROW EXECUTE FUNCTION fn_sys_audit_trigger();

-- HMS_EXAM
DROP TRIGGER IF EXISTS trg_audit_hms_exam ON hms_exam;
CREATE TRIGGER trg_audit_hms_exam
AFTER INSERT OR UPDATE OR DELETE ON hms_exam
FOR EACH ROW EXECUTE FUNCTION fn_sys_audit_trigger();
