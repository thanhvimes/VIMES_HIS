BEGIN;

CREATE TABLE IF NOT EXISTS hms_document_mapping (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL,
  module_code TEXT NOT NULL,
  contract_code TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','PUBLISHED','RETIRED')),
  mappings JSONB NOT NULL DEFAULT '[]'::jsonb,
  description TEXT,
  created_by TEXT NOT NULL,
  published_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (code, version)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_hms_document_mapping_published
  ON hms_document_mapping(code) WHERE status = 'PUBLISHED';
CREATE INDEX IF NOT EXISTS idx_hms_document_mapping_lookup
  ON hms_document_mapping(module_code, contract_code, status);

COMMIT;
