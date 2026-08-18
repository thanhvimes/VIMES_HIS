ALTER TABLE hms_document_template
    ADD COLUMN IF NOT EXISTS category VARCHAR(100),
    ADD COLUMN IF NOT EXISTS tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS scope JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_hms_document_template_category ON hms_document_template (category);
CREATE INDEX IF NOT EXISTS idx_hms_document_template_tags ON hms_document_template USING GIN (tags);
