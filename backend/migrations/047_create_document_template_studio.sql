CREATE TABLE IF NOT EXISTS hms_document_template (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    module_code VARCHAR(100),
    description TEXT,
    active_version_id BIGINT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hms_document_data_contract (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(64) NOT NULL,
    version INTEGER NOT NULL CHECK (version > 0),
    name VARCHAR(255) NOT NULL,
    json_schema JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED'
        CHECK (status IN ('DRAFT', 'PUBLISHED', 'RETIRED')),
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (code, version)
);

CREATE TABLE IF NOT EXISTS hms_document_template_version (
    id BIGSERIAL PRIMARY KEY,
    template_id BIGINT NOT NULL REFERENCES hms_document_template(id),
    version INTEGER NOT NULL CHECK (version > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'RETIRED')),
    contract_id BIGINT REFERENCES hms_document_data_contract(id),
    artifact_key TEXT,
    artifact_sha256 CHAR(64),
    artifact_size BIGINT CHECK (artifact_size IS NULL OR artifact_size >= 0),
    sample_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    change_note TEXT,
    validation_result JSONB,
    created_by VARCHAR(100) NOT NULL,
    submitted_by VARCHAR(100),
    reviewed_by VARCHAR(100),
    published_by VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    UNIQUE (template_id, version)
);

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_hms_document_template_active_version'
    ) THEN
        ALTER TABLE hms_document_template
            ADD CONSTRAINT fk_hms_document_template_active_version
            FOREIGN KEY (active_version_id) REFERENCES hms_document_template_version(id);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS hms_document_template_test_case (
    id BIGSERIAL PRIMARY KEY,
    template_version_id BIGINT NOT NULL REFERENCES hms_document_template_version(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    test_type VARCHAR(50) NOT NULL DEFAULT 'NORMAL',
    input_data JSONB NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    expected_page_min INTEGER,
    expected_page_max INTEGER,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hms_document_template_test_run (
    id BIGSERIAL PRIMARY KEY,
    template_version_id BIGINT NOT NULL REFERENCES hms_document_template_version(id),
    test_case_id BIGINT REFERENCES hms_document_template_test_case(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('QUEUED', 'RUNNING', 'PASSED', 'FAILED')),
    validation_errors JSONB NOT NULL DEFAULT '[]'::jsonb,
    validation_warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
    docx_key TEXT,
    pdf_key TEXT,
    docx_sha256 CHAR(64),
    pdf_sha256 CHAR(64),
    page_count INTEGER,
    duration_ms INTEGER,
    engine_version VARCHAR(100),
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS hms_document_template_audit (
    id BIGSERIAL PRIMARY KEY,
    actor_id VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    detail JSONB NOT NULL DEFAULT '{}'::jsonb,
    request_id VARCHAR(100),
    ip_address VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hms_document_template_status ON hms_document_template (is_active, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_hms_document_template_version_lookup ON hms_document_template_version (template_id, status, version DESC);
CREATE INDEX IF NOT EXISTS idx_hms_document_template_test_run_version ON hms_document_template_test_run (template_version_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hms_document_template_audit_entity ON hms_document_template_audit (entity_type, entity_id, created_at DESC);
