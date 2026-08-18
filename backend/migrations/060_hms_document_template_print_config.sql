ALTER TABLE hms_document_template
    ADD COLUMN IF NOT EXISTS print_config JSONB NOT NULL DEFAULT '{"paper":"A4","orientation":"PORTRAIT","margins":{"top":15,"right":15,"bottom":15,"left":15},"language":"vi-VN","formats":["pdf"]}'::jsonb;
