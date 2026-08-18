-- Digest prepared by pyHanko over CMS signed attributes for external PAdES signing.
ALTER TABLE hms_document_signature_request
  ADD COLUMN IF NOT EXISTS signing_digest_sha256 CHAR(64);

ALTER TABLE hms_document_agent_signature
  ADD COLUMN IF NOT EXISTS signed_digest_sha256 CHAR(64);

CREATE INDEX IF NOT EXISTS idx_hms_signature_request_provider_transaction
  ON hms_document_signature_request(provider_transaction_id);
