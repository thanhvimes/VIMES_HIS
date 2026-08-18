CREATE TABLE IF NOT EXISTS hms_document_template_notification (
  id BIGSERIAL PRIMARY KEY,
  template_version_id BIGINT NOT NULL REFERENCES hms_document_template_version(id) ON DELETE CASCADE,
  event_type VARCHAR(40) NOT NULL,
  target_role VARCHAR(40),
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hms_document_notification_role_unread ON hms_document_template_notification(target_role, is_read, created_at DESC);
