-- Detached signatures returned by VIMES Workstation Agent.
-- Signatures and certificates are public cryptographic material; PIN/private keys are never stored.
CREATE TABLE IF NOT EXISTS hms_document_agent_signature (
  id BIGSERIAL PRIMARY KEY,
  signature_request_id UUID NOT NULL UNIQUE REFERENCES hms_document_signature_request(id) ON DELETE CASCADE,
  transaction_id VARCHAR(128) NOT NULL UNIQUE,
  document_sha256 CHAR(64) NOT NULL,
  hash_algorithm VARCHAR(16) NOT NULL CHECK (hash_algorithm IN ('SHA256', 'SHA384', 'SHA512')),
  signature_algorithm VARCHAR(32) NOT NULL,
  signature_base64 TEXT NOT NULL,
  certificate_base64 TEXT NOT NULL,
  certificate_chain_base64 JSONB NOT NULL DEFAULT '[]'::jsonb,
  certificate_thumbprint CHAR(40) NOT NULL,
  certificate_subject TEXT NOT NULL,
  certificate_issuer TEXT NOT NULL,
  certificate_serial VARCHAR(255) NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hms_document_agent_signature_request
  ON hms_document_agent_signature(signature_request_id);

COMMENT ON TABLE hms_document_agent_signature IS 'Verified detached signatures from VIMES Workstation Agent; never contains PIN or private keys';
