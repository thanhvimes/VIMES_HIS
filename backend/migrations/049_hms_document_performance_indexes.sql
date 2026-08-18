-- Template Studio query indexes; safe to run repeatedly.
CREATE INDEX IF NOT EXISTS idx_hms_document_template_version_status
  ON hms_document_template_version (status, template_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_hms_document_template_version_active
  ON hms_document_template_version (template_id, status) WHERE status = 'PUBLISHED';
CREATE INDEX IF NOT EXISTS idx_hms_document_test_case_version_required
  ON hms_document_template_test_case (template_version_id, is_required, id);
CREATE INDEX IF NOT EXISTS idx_hms_document_test_run_version_status
  ON hms_document_template_test_run (template_version_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hms_document_audit_entity_created
  ON hms_document_template_audit (entity_type, entity_id, created_at DESC);
