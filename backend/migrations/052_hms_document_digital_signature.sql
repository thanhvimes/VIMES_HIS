-- Digital signature domain for PDF/PAdES workflows.
-- Document identifiers remain TEXT because clinical document tables differ by HIS module.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS hms_document_signature_placeholder (
  id BIGSERIAL PRIMARY KEY,
  template_id BIGINT NOT NULL REFERENCES hms_document_template(id) ON DELETE CASCADE,
  template_version_id BIGINT NOT NULL REFERENCES hms_document_template_version(id) ON DELETE CASCADE,
  code VARCHAR(100) NOT NULL,
  field_name VARCHAR(150),
  signer_role VARCHAR(100) NOT NULL,
  signing_order INTEGER NOT NULL DEFAULT 1 CHECK (signing_order > 0),
  page_index INTEGER NOT NULL CHECK (page_index >= 0),
  x1_pt NUMERIC(12,3) NOT NULL,
  y1_pt NUMERIC(12,3) NOT NULL,
  x2_pt NUMERIC(12,3) NOT NULL,
  y2_pt NUMERIC(12,3) NOT NULL,
  page_width_pt NUMERIC(12,3) NOT NULL CHECK (page_width_pt > 0),
  page_height_pt NUMERIC(12,3) NOT NULL CHECK (page_height_pt > 0),
  page_rotation SMALLINT NOT NULL DEFAULT 0 CHECK (page_rotation IN (0, 90, 180, 270)),
  crop_box JSONB NOT NULL DEFAULT '[0,0,0,0]'::jsonb,
  normalized_rect JSONB NOT NULL DEFAULT '{}'::jsonb,
  required BOOLEAN NOT NULL DEFAULT TRUE,
  appearance_profile_id VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('DRAFT', 'ACTIVE', 'RETIRED')),
  created_by VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_hms_sig_placeholder_rect CHECK (x1_pt >= 0 AND y1_pt >= 0 AND x2_pt > x1_pt AND y2_pt > y1_pt AND x2_pt <= page_width_pt AND y2_pt <= page_height_pt),
  CONSTRAINT uq_hms_sig_placeholder_code UNIQUE (template_version_id, code),
  CONSTRAINT uq_hms_sig_placeholder_field UNIQUE (template_version_id, field_name)
);

CREATE TABLE IF NOT EXISTS hms_document_signing_session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id TEXT NOT NULL,
  document_version BIGINT NOT NULL CHECK (document_version > 0),
  document_sha256 CHAR(64) NOT NULL,
  source_artifact_key TEXT NOT NULL,
  result_artifact_key TEXT,
  status VARCHAR(24) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'PROCESSING', 'PARTIALLY_SIGNED', 'COMPLETED', 'FAILED', 'EXPIRED', 'CANCELLED')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_by VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  row_version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS hms_document_signature_request (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES hms_document_signing_session(id) ON DELETE CASCADE,
  placeholder_id BIGINT REFERENCES hms_document_signature_placeholder(id) ON DELETE RESTRICT,
  placement_type VARCHAR(20) NOT NULL CHECK (placement_type IN ('FREESTYLE', 'PLACEHOLDER')),
  page_index INTEGER NOT NULL CHECK (page_index >= 0),
  x1_pt NUMERIC(12,3) NOT NULL,
  y1_pt NUMERIC(12,3) NOT NULL,
  x2_pt NUMERIC(12,3) NOT NULL,
  y2_pt NUMERIC(12,3) NOT NULL,
  signer_user_id VARCHAR(100) NOT NULL,
  signer_role VARCHAR(100) NOT NULL,
  signing_order INTEGER NOT NULL DEFAULT 1 CHECK (signing_order > 0),
  reason TEXT,
  location VARCHAR(255),
  appearance_profile_id VARCHAR(100),
  certificate_subject TEXT,
  certificate_issuer TEXT,
  certificate_serial VARCHAR(255),
  status VARCHAR(24) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PREPARED', 'AUTHORIZED', 'SIGNED', 'FAILED', 'CANCELLED', 'EXPIRED')),
  idempotency_key VARCHAR(255) NOT NULL,
  provider_transaction_id VARCHAR(255),
  result_artifact_key TEXT,
  result_artifact_sha256 CHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  signed_at TIMESTAMPTZ,
  UNIQUE (session_id, idempotency_key),
  CONSTRAINT ck_hms_sig_request_rect CHECK (x1_pt >= 0 AND y1_pt >= 0 AND x2_pt > x1_pt AND y2_pt > y1_pt)
);

CREATE TABLE IF NOT EXISTS hms_document_signature_audit (
  id BIGSERIAL PRIMARY KEY,
  document_id TEXT NOT NULL,
  session_id UUID REFERENCES hms_document_signing_session(id) ON DELETE SET NULL,
  signature_request_id UUID REFERENCES hms_document_signature_request(id) ON DELETE SET NULL,
  actor_id VARCHAR(100) NOT NULL,
  actor_role VARCHAR(100),
  action VARCHAR(80) NOT NULL,
  result VARCHAR(24) NOT NULL CHECK (result IN ('SUCCESS', 'FAILED', 'DENIED', 'INFO')),
  document_version BIGINT,
  document_sha256_before CHAR(64),
  document_sha256_after CHAR(64),
  certificate_serial VARCHAR(255),
  tsa_time TIMESTAMPTZ,
  ip_address INET,
  correlation_id VARCHAR(255),
  failure_code VARCHAR(100),
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hms_sig_placeholder_version ON hms_document_signature_placeholder(template_version_id, status, signing_order);
CREATE INDEX IF NOT EXISTS idx_hms_signing_session_document ON hms_document_signing_session(document_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hms_signing_session_status ON hms_document_signing_session(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_hms_signature_request_session ON hms_document_signature_request(session_id, signing_order, status);
CREATE INDEX IF NOT EXISTS idx_hms_signature_audit_document ON hms_document_signature_audit(document_id, created_at DESC);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ex_hms_sig_placeholder_no_overlap') THEN
    ALTER TABLE hms_document_signature_placeholder
      ADD CONSTRAINT ex_hms_sig_placeholder_no_overlap
      EXCLUDE USING gist (
        template_version_id WITH =,
        page_index WITH =,
        numrange(x1_pt::numeric, x2_pt::numeric, '[)') WITH &&,
        numrange(y1_pt::numeric, y2_pt::numeric, '[)') WITH &&
      ) WHERE (status <> 'RETIRED');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION hms_document_signature_placeholder_immutable() RETURNS trigger AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM hms_document_template_version v WHERE v.id = OLD.template_version_id AND v.status <> 'DRAFT') THEN
    RAISE EXCEPTION 'Signature placeholders are immutable after template publish' USING ERRCODE = '55006';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_hms_signature_placeholder_immutable ON hms_document_signature_placeholder;
CREATE TRIGGER trg_hms_signature_placeholder_immutable
  BEFORE UPDATE OR DELETE ON hms_document_signature_placeholder
  FOR EACH ROW EXECUTE FUNCTION hms_document_signature_placeholder_immutable();

COMMENT ON TABLE hms_document_signature_placeholder IS 'PDF signature fields/regions attached to an immutable template version';
COMMENT ON TABLE hms_document_signing_session IS 'Optimistically locked signing session for one document artifact version';
COMMENT ON TABLE hms_document_signature_request IS 'One idempotent signature operation, freestyle or predefined placeholder';
COMMENT ON TABLE hms_document_signature_audit IS 'Append-only audit trail; do not store private keys, PINs or raw PHI';
