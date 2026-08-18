-- Shared idempotency store for multi-replica signing service.
-- Secrets and PDF payloads are never stored here.
CREATE TABLE IF NOT EXISTS hms_document_signature_idempotency (
  id BIGSERIAL PRIMARY KEY,
  idempotency_key VARCHAR(128) NOT NULL,
  request_fingerprint CHAR(64) NOT NULL,
  status VARCHAR(16) NOT NULL CHECK (status IN ('IN_PROGRESS', 'SUCCEEDED', 'FAILED')),
  request_id VARCHAR(128),
  result_artifact_key TEXT,
  result_artifact_sha256 CHAR(64),
  error_code VARCHAR(64),
  lease_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT uq_hms_document_signature_idempotency_key UNIQUE (idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_hms_document_signature_idempotency_expiry
  ON hms_document_signature_idempotency (expires_at);

CREATE INDEX IF NOT EXISTS idx_hms_document_signature_idempotency_status_lease
  ON hms_document_signature_idempotency (status, lease_expires_at);
