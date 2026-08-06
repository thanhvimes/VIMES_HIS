DO $$
DECLARE
    item RECORD;
BEGIN
    FOR item IN SELECT * FROM (VALUES
        ('hms_doc_template_audit', 'hms_document_template_audit'),
        ('hms_doc_template_test_run', 'hms_document_template_test_run'),
        ('hms_doc_template_test_case', 'hms_document_template_test_case'),
        ('hms_doc_template_version', 'hms_document_template_version'),
        ('hms_doc_data_contract', 'hms_document_data_contract'),
        ('hms_doc_template', 'hms_document_template')
    ) AS names(old_name, new_name)
    LOOP
        IF to_regclass('public.' || item.old_name) IS NOT NULL
           AND to_regclass('public.' || item.new_name) IS NULL THEN
            EXECUTE format('ALTER TABLE %I RENAME TO %I', item.old_name, item.new_name);
        END IF;
    END LOOP;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_hms_doc_template_active_version')
       AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_hms_document_template_active_version') THEN
        ALTER TABLE hms_document_template
            RENAME CONSTRAINT fk_hms_doc_template_active_version TO fk_hms_document_template_active_version;
    END IF;
END $$;

DO $$
DECLARE
    item RECORD;
BEGIN
    FOR item IN SELECT * FROM (VALUES
        ('idx_hms_doc_template_status', 'idx_hms_document_template_status'),
        ('idx_hms_doc_template_version_lookup', 'idx_hms_document_template_version_lookup'),
        ('idx_hms_doc_template_test_run_version', 'idx_hms_document_template_test_run_version'),
        ('idx_hms_doc_template_audit_entity', 'idx_hms_document_template_audit_entity')
    ) AS names(old_name, new_name)
    LOOP
        IF to_regclass('public.' || item.old_name) IS NOT NULL
           AND to_regclass('public.' || item.new_name) IS NULL THEN
            EXECUTE format('ALTER INDEX %I RENAME TO %I', item.old_name, item.new_name);
        END IF;
    END LOOP;
END $$;

