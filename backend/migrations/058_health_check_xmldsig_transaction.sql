CREATE TABLE IF NOT EXISTS hms_health_check_xmldsig_transaction (
    transaction_id VARCHAR(128) PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES health_check_masters(id) ON DELETE CASCADE,
    actor_id VARCHAR(100) NOT NULL,
    source_sha256 CHAR(64) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PREPARED' CHECK (status IN ('PREPARED','COMPLETED')),
    result_xml_sha256 CHAR(64),
    result_signature JSONB,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_hms_ksk_xmldsig_expiry ON hms_health_check_xmldsig_transaction(status, expires_at);

