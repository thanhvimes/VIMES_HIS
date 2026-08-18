-- 062_hms_document_workflow_governance.sql
-- Migration: Add workflow governance, task assignments, version comments, review checklists, scheduled publishing, and user permissions.

-- 1. Extend hms_document_template_version with assignment and scheduling columns
ALTER TABLE hms_document_template_version ADD COLUMN IF NOT EXISTS assigned_designer VARCHAR(100);
ALTER TABLE hms_document_template_version ADD COLUMN IF NOT EXISTS assigned_tester VARCHAR(100);
ALTER TABLE hms_document_template_version ADD COLUMN IF NOT EXISTS assigned_reviewer VARCHAR(100);
ALTER TABLE hms_document_template_version ADD COLUMN IF NOT EXISTS assigned_publisher VARCHAR(100);
ALTER TABLE hms_document_template_version ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;
ALTER TABLE hms_document_template_version ADD COLUMN IF NOT EXISTS effective_from TIMESTAMPTZ;
ALTER TABLE hms_document_template_version ADD COLUMN IF NOT EXISTS effective_to TIMESTAMPTZ;
ALTER TABLE hms_document_template_version ADD COLUMN IF NOT EXISTS scheduled_publish_at TIMESTAMPTZ;
ALTER TABLE hms_document_template_version ADD COLUMN IF NOT EXISTS review_checklist JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 2. Create hms_document_template_comment for collaborative version review
CREATE TABLE IF NOT EXISTS hms_document_template_comment (
    id BIGSERIAL PRIMARY KEY,
    template_version_id BIGINT NOT NULL REFERENCES hms_document_template_version(id) ON DELETE CASCADE,
    author_id VARCHAR(100) NOT NULL,
    author_name VARCHAR(255),
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hms_doc_tmpl_comment_version
    ON hms_document_template_comment(template_version_id, created_at DESC);

-- 3. Create hms_document_template_user_permission for RBAC and scope management
CREATE TABLE IF NOT EXISTS hms_document_template_user_permission (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    user_name VARCHAR(255),
    role_code VARCHAR(50) NOT NULL,
    facility_id VARCHAR(100),
    department_id VARCHAR(100),
    granted_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hms_doc_tmpl_user_perm_user
    ON hms_document_template_user_permission(user_id);

-- 4. Extend or create hms_document_template_notification for in-app workflow notifications
CREATE TABLE IF NOT EXISTS hms_document_template_notification (
    id BIGSERIAL PRIMARY KEY,
    template_version_id BIGINT REFERENCES hms_document_template_version(id) ON DELETE CASCADE,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE hms_document_template_notification ADD COLUMN IF NOT EXISTS recipient_id VARCHAR(100);
ALTER TABLE hms_document_template_notification ADD COLUMN IF NOT EXISTS template_id BIGINT REFERENCES hms_document_template(id) ON DELETE CASCADE;
ALTER TABLE hms_document_template_notification ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE hms_document_template_notification ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE hms_document_template_notification ADD COLUMN IF NOT EXISTS type VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_hms_doc_tmpl_notif_recipient
    ON hms_document_template_notification(recipient_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_hms_doc_tmpl_version_sched
    ON hms_document_template_version(scheduled_publish_at)
    WHERE scheduled_publish_at IS NOT NULL AND status = 'APPROVED';
