import { PoolClient } from 'pg';
import { query, transaction } from '../config/database';
import { TemplateComment, TemplateInbox, TemplateInboxItem, TemplateNotification, TemplateStudioTemplate, TemplateStudioVersion, TemplateTestRun, TemplateUserPermission, TemplateValidationResult, TemplateVersionStatus } from './types';

function mapVersion(row: any): TemplateStudioVersion {
    return {
        id: Number(row.id),
        templateId: Number(row.template_id),
        version: Number(row.version),
        status: row.status,
        artifactKey: row.artifact_key || undefined,
        artifactSha256: row.artifact_sha256 || undefined,
        artifactSize: row.artifact_size === null ? undefined : Number(row.artifact_size),
        sampleData: row.sample_data || {},
        changeNote: row.change_note || undefined,
        validationResult: row.validation_result || undefined,
        assignedDesigner: row.assigned_designer || undefined,
        assignedTester: row.assigned_tester || undefined,
        assignedReviewer: row.assigned_reviewer || undefined,
        assignedPublisher: row.assigned_publisher || undefined,
        dueDate: row.due_date instanceof Date ? row.due_date.toISOString() : row.due_date || undefined,
        effectiveFrom: row.effective_from instanceof Date ? row.effective_from.toISOString() : row.effective_from || undefined,
        effectiveTo: row.effective_to instanceof Date ? row.effective_to.toISOString() : row.effective_to || undefined,
        scheduledPublishAt: row.scheduled_publish_at instanceof Date ? row.scheduled_publish_at.toISOString() : row.scheduled_publish_at || undefined,
        reviewChecklist: row.review_checklist || undefined,
        submittedBy: row.submitted_by || undefined,
        submittedAt: row.submitted_at instanceof Date ? row.submitted_at.toISOString() : row.submitted_at || undefined,
        reviewedBy: row.reviewed_by || undefined,
        reviewedAt: row.reviewed_at instanceof Date ? row.reviewed_at.toISOString() : row.reviewed_at || undefined,
        publishedBy: row.published_by || undefined,
        publishedAt: row.published_at instanceof Date ? row.published_at.toISOString() : row.published_at || undefined,
        createdBy: row.created_by,
        createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
    };
}

function mapTestRun(row: any): TemplateTestRun {
    return {
        id: Number(row.id), templateVersionId: Number(row.template_version_id),
        testCaseId: row.test_case_id === null ? undefined : Number(row.test_case_id),
        status: row.status, validationErrors: row.validation_errors || [], validationWarnings: row.validation_warnings || [],
        docxKey: row.docx_key || undefined, pdfKey: row.pdf_key || undefined,
        docxSha256: row.docx_sha256 || undefined, pdfSha256: row.pdf_sha256 || undefined,
        docxSize: row.docx_size === null ? undefined : Number(row.docx_size), pdfSize: row.pdf_size === null ? undefined : Number(row.pdf_size),
        pageCount: row.page_count === null ? undefined : Number(row.page_count),
        durationMs: row.duration_ms === null ? undefined : Number(row.duration_ms),
        engineVersion: row.engine_version || undefined, createdBy: row.created_by,
        createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
        completedAt: row.completed_at instanceof Date ? row.completed_at.toISOString() : row.completed_at || undefined
    };
}

export class TemplateStudioRepository {
    async listMappings(filters: { moduleCode?: string; contractCode?: string; status?: string } = {}) {
        const result = await query(`SELECT id, code, module_code, contract_code, version, status, mappings, created_by, created_at, updated_at FROM hms_document_mapping WHERE ($1::text IS NULL OR module_code=$1) AND ($2::text IS NULL OR contract_code=$2) AND ($3::text IS NULL OR status=$3) ORDER BY code, version DESC LIMIT 1000`, [filters.moduleCode || null, filters.contractCode || null, filters.status || null]);
        return result.rows;
    }

    async createMappingDraft(input: { code: string; moduleCode: string; contractCode: string; mappings: unknown; createdBy: string }) {
        const result = await query(`INSERT INTO hms_document_mapping (code, module_code, contract_code, mappings, created_by) VALUES ($1,$2,$3,$4::jsonb,$5) RETURNING *`, [input.code, input.moduleCode, input.contractCode, JSON.stringify(input.mappings), input.createdBy]);
        return result.rows[0];
    }

    async createMappingVersion(code: string, mappings: unknown, actor: string) {
        const latest = await query(`SELECT * FROM hms_document_mapping WHERE code=$1 ORDER BY version DESC LIMIT 1`, [code]);
        if (!latest.rows[0]) throw Object.assign(new Error('Mapping not found'), { status: 404 });
        if (latest.rows[0].status === 'DRAFT') throw Object.assign(new Error('Existing draft must be completed first'), { status: 409 });
        const source = latest.rows[0];
        const result = await query(`INSERT INTO hms_document_mapping (code,module_code,contract_code,version,status,mappings,created_by) VALUES ($1,$2,$3,$4,'DRAFT',$5::jsonb,$6) RETURNING *`, [code, source.module_code, source.contract_code, Number(source.version) + 1, JSON.stringify(mappings), actor]);
        return result.rows[0];
    }

    async publishMapping(code: string) {
        const result = await query(`UPDATE hms_document_mapping SET status='PUBLISHED', updated_at=NOW() WHERE code=$1 AND status='DRAFT' RETURNING *`, [code]);
        if (!result.rows[0]) throw Object.assign(new Error('Only DRAFT mapping can be published'), { status: 409 });
        await query(`UPDATE hms_document_mapping SET status='RETIRED', updated_at=NOW() WHERE code=$1 AND id<>$2 AND status='PUBLISHED'`, [code, result.rows[0].id]);
        return result.rows[0];
    }

    async retireMapping(code: string) {
        const result = await query(`UPDATE hms_document_mapping SET status='RETIRED', updated_at=NOW() WHERE code=$1 AND status='PUBLISHED' RETURNING *`, [code]);
        if (!result.rows[0]) throw Object.assign(new Error('Only PUBLISHED mapping can be retired'), { status: 409 });
        return result.rows[0];
    }

    async list(filters: { includeArchived?: boolean; category?: string; tag?: string; q?: string; moduleCode?: string; createdBy?: string; updatedFrom?: string; updatedTo?: string; scope?: { facility?: string; department?: string; room?: string }; limit?: number; offset?: number } = {}): Promise<TemplateStudioTemplate[]> {
        const result = await query(`
            SELECT t.*, row_to_json(v.*) AS latest_version
            FROM hms_document_template t
            LEFT JOIN LATERAL (
                SELECT * FROM hms_document_template_version candidate
                WHERE candidate.template_id = t.id
                ORDER BY candidate.version DESC LIMIT 1
            ) v ON TRUE
            WHERE ($1::text IS NULL OR t.is_active = ($1 = 'ACTIVE'))
              AND ($2::text IS NULL OR COALESCE(t.category,'') ILIKE '%' || $2 || '%')
              AND ($3::text IS NULL OR COALESCE(t.tags::text,'') ILIKE '%' || $3 || '%')
              AND ($4::text IS NULL OR t.scope = '{}'::jsonb OR COALESCE(t.scope->'facilities','[]'::jsonb) ? $4 OR COALESCE(t.scope->'departments','[]'::jsonb) ? $4 OR COALESCE(t.scope->'rooms','[]'::jsonb) ? $4)
              AND ($5::text IS NULL OR t.code ILIKE '%' || $5 || '%' OR t.name ILIKE '%' || $5 || '%' OR COALESCE(t.description,'') ILIKE '%' || $5 || '%')
              AND ($6::text IS NULL OR t.module_code = $6)
              AND ($7::text IS NULL OR t.created_by = $7)
              AND ($8::timestamptz IS NULL OR t.updated_at >= $8::timestamptz)
              AND ($9::timestamptz IS NULL OR t.updated_at < ($9::timestamptz + interval '1 day'))
            ORDER BY t.name, t.code
            LIMIT $10 OFFSET $11
        `, [filters.includeArchived ? null : 'ACTIVE', filters.category || null, filters.tag || null, filters.scope?.facility || filters.scope?.department || filters.scope?.room || null, filters.q || null, filters.moduleCode || null, filters.createdBy || null, filters.updatedFrom || null, filters.updatedTo || null, Math.min(Math.max(filters.limit || 500, 1), 1000), Math.max(filters.offset || 0, 0)]);
        return result.rows.map(row => ({
            id: Number(row.id), code: row.code, name: row.name,
            documentType: row.document_type, moduleCode: row.module_code || undefined,
            description: row.description || undefined, category: row.category || undefined,
            tags: Array.isArray(row.tags) ? row.tags : [], scope: row.scope || {}, printConfig: row.print_config || {},
            activeVersionId: row.active_version_id === null ? undefined : Number(row.active_version_id),
            isActive: row.is_active,
            latestVersion: row.latest_version?.id ? mapVersion(row.latest_version) : undefined
        }));
    }

    async getVersion(id: number): Promise<TemplateStudioVersion & { templateCode: string; templateName: string; documentType?: string; category?: string }> {
        const result = await query(`
            SELECT v.*, t.code AS template_code, t.name AS template_name, t.document_type, t.category
            FROM hms_document_template_version v JOIN hms_document_template t ON t.id = v.template_id
            WHERE v.id = $1
        `, [id]);
        if (!result.rows[0]) throw Object.assign(new Error('Template version not found'), { status: 404 });
        return { ...mapVersion(result.rows[0]), templateCode: result.rows[0].template_code, templateName: result.rows[0].template_name, documentType: result.rows[0].document_type, category: result.rows[0].category };
    }

    async findByCode(code: string): Promise<{ id: number; code: string } | undefined> {
        const result = await query(`SELECT id, code FROM hms_document_template WHERE code=$1 LIMIT 1`, [code]);
        return result.rows[0] ? { id: Number(result.rows[0].id), code: result.rows[0].code } : undefined;
    }

    async createContract(input: { code: string; name: string; version: number; sampleData: Record<string, unknown>; schema: unknown }, actor: string): Promise<{ id: number; code: string; version: number }> {
        const result = await query(`INSERT INTO hms_document_data_contract (code, version, name, json_schema, status, created_by) VALUES ($1,$2,$3,$4::jsonb,'DRAFT',$5) RETURNING id, code, version`, [input.code, input.version, input.name, JSON.stringify(input.schema), actor]);
        await query(`INSERT INTO hms_document_template_audit (actor_id, action, entity_type, entity_id, detail) VALUES ($1,'CREATE_CONTRACT','CONTRACT',$2,$3::jsonb)`, [actor, result.rows[0].id, JSON.stringify({ code: input.code, version: input.version, sampleKeys: Object.keys(input.sampleData) })]);
        return { id: Number(result.rows[0].id), code: result.rows[0].code, version: Number(result.rows[0].version) };
    }

    async listContracts() {
        const result = await query(`SELECT id, code, version, name, json_schema, status, created_by, created_at FROM hms_document_data_contract ORDER BY code, version DESC LIMIT 1000`);
        return result.rows.map(row => ({ id: Number(row.id), code: row.code, version: Number(row.version), name: row.name, jsonSchema: row.json_schema, status: row.status, createdBy: row.created_by, createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at }));
    }

    async createContractVersion(contractId: number, actor: string): Promise<{ id: number; code: string; version: number }> {
        return transaction(async client => {
            const source = await client.query(`SELECT code, name, version, json_schema FROM hms_document_data_contract WHERE id=$1`, [contractId]);
            if (!source.rows[0]) throw Object.assign(new Error('Contract not found'), { status: 404 });
            const row = source.rows[0];
            const next = await client.query(`SELECT COALESCE(MAX(version),0)+1 AS version FROM hms_document_data_contract WHERE code=$1`, [row.code]);
            const version = Number(next.rows[0].version);
            const created = await client.query(`INSERT INTO hms_document_data_contract (code,version,name,json_schema,status,created_by) VALUES ($1,$2,$3,$4::jsonb,'DRAFT',$5) RETURNING id,code,version`, [row.code, version, row.name, JSON.stringify(row.json_schema), actor]);
            await this.audit(client, actor, 'CREATE_CONTRACT_VERSION', 'CONTRACT', created.rows[0].id, { sourceId: contractId, sourceVersion: row.version, version });
            return { id: Number(created.rows[0].id), code: created.rows[0].code, version: Number(created.rows[0].version) };
        });
    }

    async updateContract(id: number, input: { name: string; schema: unknown; sampleData?: Record<string, unknown> }, actor: string): Promise<void> {
        await transaction(async client => {
            const current = await client.query(`SELECT name, json_schema, status FROM hms_document_data_contract WHERE id=$1 FOR UPDATE`, [id]);
            if (!current.rows[0]) throw Object.assign(new Error('Contract not found'), { status: 404 });
            if (current.rows[0].status !== 'DRAFT') throw Object.assign(new Error('Only DRAFT contracts can be edited'), { status: 409 });
            await client.query(`UPDATE hms_document_data_contract SET name=$2, json_schema=$3::jsonb WHERE id=$1`, [id, input.name, JSON.stringify(input.schema)]);
            await this.audit(client, actor, 'UPDATE_CONTRACT', 'CONTRACT', id, { before: current.rows[0], after: { name: input.name, schema: input.schema, sampleDataKeys: Object.keys(input.sampleData || {}) } });
        });
    }

    async transitionContract(id: number, next: 'PUBLISHED' | 'RETIRED', actor: string): Promise<void> {
        await transaction(async client => {
            const current = await client.query(`SELECT code, version, status, json_schema FROM hms_document_data_contract WHERE id=$1 FOR UPDATE`, [id]);
            if (!current.rows[0]) throw Object.assign(new Error('Contract not found'), { status: 404 });
            const row = current.rows[0];
            if (next === 'PUBLISHED' && row.status !== 'DRAFT') throw Object.assign(new Error('Only DRAFT contract can be published'), { status: 409 });
            if (next === 'RETIRED' && row.status !== 'PUBLISHED') throw Object.assign(new Error('Only PUBLISHED contract can be retired'), { status: 409 });
            if (next === 'PUBLISHED') await client.query(`UPDATE hms_document_data_contract SET status='RETIRED' WHERE code=$1 AND status='PUBLISHED' AND id<>$2`, [row.code, id]);
            await client.query(`UPDATE hms_document_data_contract SET status=$2 WHERE id=$1`, [id, next]);
            await this.audit(client, actor, next === 'PUBLISHED' ? 'PUBLISH_CONTRACT' : 'RETIRE_CONTRACT', 'CONTRACT', id, { code: row.code, version: row.version, previousStatus: row.status });
        });
    }

    async updateTemplateMetadata(id: number, input: { name: string; documentType: string; moduleCode?: string; description?: string; category?: string; tags?: string[]; scope?: Record<string, unknown>; printConfig?: Record<string, unknown> }, actor: string): Promise<void> {
        await transaction(async client => {
            const current = await client.query(`SELECT t.name, t.document_type, t.module_code, t.description, t.category, t.tags, t.scope, EXISTS (SELECT 1 FROM hms_document_template_version v WHERE v.template_id=t.id AND v.status IN ('IN_REVIEW','APPROVED','PUBLISHED')) AS locked FROM hms_document_template t WHERE t.id=$1 FOR UPDATE`, [id]);
            if (!current.rows[0]) throw Object.assign(new Error('Template not found'), { status: 404 });
            if (current.rows[0].locked) throw Object.assign(new Error('Template metadata is locked while a version is under review or published'), { status: 409 });
            await client.query(`UPDATE hms_document_template SET name=$2, document_type=$3, module_code=$4, description=$5, category=$6, tags=$7::jsonb, scope=$8::jsonb, print_config=$9::jsonb, updated_at=NOW() WHERE id=$1`, [id, input.name, input.documentType, input.moduleCode || null, input.description || null, input.category || null, JSON.stringify(input.tags || []), JSON.stringify(input.scope || {}), JSON.stringify(input.printConfig || {})]);
            await this.audit(client, actor, 'UPDATE_TEMPLATE_METADATA', 'VERSION', id, { before: current.rows[0], after: input });
        });
    }

    async setActive(id: number, active: boolean, actor: string): Promise<void> {
        await transaction(async client => {
            const current = await client.query(`SELECT is_active FROM hms_document_template WHERE id=$1 FOR UPDATE`, [id]);
            if (!current.rows[0]) throw Object.assign(new Error('Template not found'), { status: 404 });
            await client.query(`UPDATE hms_document_template SET is_active=$2, updated_at=NOW() WHERE id=$1`, [id, active]);
            await this.audit(client, actor, active ? 'ACTIVATE_TEMPLATE' : 'ARCHIVE_TEMPLATE', 'VERSION', id, { before: current.rows[0].is_active, after: active });
        });
    }

    async cloneTemplate(sourceId: number, code: string, name: string, actor: string): Promise<number> {
        return transaction(async client => {
            const source = await client.query(`SELECT t.*, v.sample_data, v.contract_id FROM hms_document_template t LEFT JOIN LATERAL (SELECT sample_data, contract_id FROM hms_document_template_version WHERE template_id=t.id ORDER BY version DESC LIMIT 1) v ON TRUE WHERE t.id=$1`, [sourceId]);
            if (!source.rows[0]) throw Object.assign(new Error('Source template not found'), { status: 404 });
            const row = source.rows[0];
            const created = await client.query(`INSERT INTO hms_document_template (code,name,document_type,module_code,description,created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`, [code, name, row.document_type, row.module_code, `Sao chép từ ${row.code}. ${row.description || ''}`.trim(), actor]);
            const version = await client.query(`INSERT INTO hms_document_template_version (template_id,version,status,contract_id,sample_data,change_note,created_by) VALUES ($1,1,'DRAFT',$2,$3::jsonb,$4,$5) RETURNING id`, [created.rows[0].id, row.contract_id || null, JSON.stringify(row.sample_data || {}), `Cloned from ${row.code}`, actor]);
            await this.audit(client, actor, 'CLONE_TEMPLATE', 'VERSION', version.rows[0].id, { sourceTemplateId: sourceId, sourceCode: row.code, code });
            return Number(version.rows[0].id);
        });
    }

    async listVersions(templateId: number): Promise<TemplateStudioVersion[]> {
        const result = await query(`
            SELECT * FROM hms_document_template_version
            WHERE template_id=$1 ORDER BY version DESC
        `, [templateId]);
        return result.rows.map(mapVersion);
    }

    async listNotifications(role?: string, limit = 50) {
        const result = await query(`SELECT id, template_version_id, event_type, target_role, message, is_read, created_at FROM hms_document_template_notification WHERE ($1::text IS NULL OR target_role=$1) ORDER BY created_at DESC LIMIT $2`, [role || null, Math.min(Math.max(limit, 1), 200)]);
        return result.rows;
    }
    async renderLatencyMetrics() {
        const result = await query(`SELECT COUNT(*)::int AS samples, percentile_cont(0.50) WITHIN GROUP (ORDER BY duration_ms)::float AS p50, percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms)::float AS p95, percentile_cont(0.99) WITHIN GROUP (ORDER BY duration_ms)::float AS p99 FROM hms_document_template_test_run WHERE status='PASSED' AND duration_ms IS NOT NULL`);
        return result.rows[0];
    }

    async usageSummary(limit = 100) {
        const result = await query(`
            SELECT t.code AS template_code, t.name AS template_name, t.is_active,
                   COUNT(tr.id)::int AS test_runs,
                   COUNT(tr.id) FILTER (WHERE tr.status='PASSED')::int AS passed_runs,
                   COUNT(tr.id) FILTER (WHERE tr.status='FAILED')::int AS failed_runs,
                   MAX(tr.created_at) AS last_run_at,
                   ROUND(AVG(tr.duration_ms))::int AS avg_duration_ms
            FROM hms_document_template t
            LEFT JOIN hms_document_template_version v ON v.template_id=t.id
            LEFT JOIN hms_document_template_test_run tr ON tr.template_version_id=v.id
            GROUP BY t.id, t.code, t.name, t.is_active
            ORDER BY test_runs DESC, t.code
            LIMIT $1
        `, [Math.min(Math.max(limit, 1), 500)]);
        return result.rows;
    }

    async metricsSummary() {
        const [templates, versions, testRuns, latency, artifactSize, renderSizes, errorsByTemplate, failureRate, timeoutRuns, activity] = await Promise.all([
            query(`SELECT COUNT(*)::int AS total_active FROM hms_document_template WHERE is_active=true`),
            query(`SELECT status, COUNT(*)::int AS count FROM hms_document_template_version GROUP BY status`),
            query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='PASSED')::int AS passed, COUNT(*) FILTER (WHERE status='FAILED')::int AS failed, AVG(duration_ms)::float AS avg_duration_ms FROM hms_document_template_test_run`),
            this.renderLatencyMetrics(),
            query(`SELECT MIN(artifact_size)::int AS min_bytes, AVG(artifact_size)::float AS avg_bytes, MAX(artifact_size)::int AS max_bytes FROM hms_document_template_version WHERE artifact_size IS NOT NULL`),
            query(`SELECT MIN(docx_size)::int AS docx_min, AVG(docx_size)::float AS docx_avg, MAX(docx_size)::int AS docx_max, MIN(pdf_size)::int AS pdf_min, AVG(pdf_size)::float AS pdf_avg, MAX(pdf_size)::int AS pdf_max FROM hms_document_template_test_run WHERE status='PASSED'`),
            query(`
                SELECT t.code AS template_code, v.version, COUNT(tr.id)::int AS failed_runs
                FROM hms_document_template_test_run tr
                JOIN hms_document_template_version v ON v.id = tr.template_version_id
                JOIN hms_document_template t ON t.id = v.template_id
                WHERE tr.status = 'FAILED'
                GROUP BY t.code, v.version
                ORDER BY failed_runs DESC
                LIMIT 10
            `),
            query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='FAILED')::int AS failed FROM hms_document_template_test_run`),
            query(`SELECT COUNT(*)::int AS count FROM hms_document_template_test_run WHERE duration_ms > $1`, [Number(process.env.CARBONE_TIMEOUT_MS || 30000)]),
            query(`
                SELECT action, COUNT(*)::int AS count
                FROM hms_document_template_audit
                WHERE action IN ('PUBLISHED', 'ROLLBACK', 'UPLOAD', 'CREATE_VERSION', 'CREATE_TEMPLATE')
                GROUP BY action
            `)
        ]);

        const statusCounts: Record<string, number> = {};
        for (const row of versions.rows) {
            statusCounts[row.status] = Number(row.count);
        }

        const activityCounts: Record<string, number> = {};
        for (const row of activity.rows) {
            activityCounts[row.action] = Number(row.count);
        }

        const p95 = Number(latency.p95 || 0); const failurePercent = Number(failureRate.rows[0]?.total || 0) ? (Number(failureRate.rows[0]?.failed || 0) * 100) / Number(failureRate.rows[0].total) : 0;
        return {
            templates: {
                totalActive: templates.rows[0]?.total_active || 0
            },
            versions: {
                total: Object.values(statusCounts).reduce((a, b) => a + b, 0),
                byStatus: statusCounts
            },
            testRuns: {
                total: testRuns.rows[0]?.total || 0,
                passed: testRuns.rows[0]?.passed || 0,
                failed: testRuns.rows[0]?.failed || 0,
                avgDurationMs: Math.round(testRuns.rows[0]?.avg_duration_ms || 0)
            },
            latency,
            renderDuration: latency,
            artifactSize: {
                minBytes: artifactSize.rows[0]?.min_bytes || 0,
                avgBytes: Math.round(artifactSize.rows[0]?.avg_bytes || 0),
                maxBytes: artifactSize.rows[0]?.max_bytes || 0
            },
            renderSizes: renderSizes.rows[0] || {},
            errorsByTemplate: errorsByTemplate.rows,
            failureRate: { total: Number(failureRate.rows[0]?.total || 0), failed: Number(failureRate.rows[0]?.failed || 0), percent: Number(failureRate.rows[0]?.total || 0) ? Math.round((Number(failureRate.rows[0]?.failed || 0) * 10000) / Number(failureRate.rows[0].total)) / 100 : 0 },
            alerts: { failureRateExceeded: failurePercent > Number(process.env.TEMPLATE_ALERT_FAILURE_PERCENT || 1), p95Exceeded: p95 > Number(process.env.TEMPLATE_ALERT_P95_MS || 3000) },
            activity: activityCounts,
            rollbackAlert: Object.entries(activityCounts).some(([action, count]) => action === 'ROLLBACK' && count >= Number(process.env.TEMPLATE_ALERT_ROLLBACK_COUNT || 3)),
            timeoutAlert: Number(timeoutRuns.rows[0]?.count || 0) > 0,
            generatedAt: new Date().toISOString()
        };
    }

    async listAudit(templateId: number): Promise<Array<{ id: number; actorId: string; action: string; entityId: number; detail: Record<string, unknown>; createdAt: string }>> {
        const result = await query(`
            SELECT a.* FROM hms_document_template_audit a
            JOIN hms_document_template_version v ON v.id=a.entity_id
            WHERE a.entity_type='VERSION' AND v.template_id=$1
            ORDER BY a.created_at DESC LIMIT 200
        `, [templateId]);
        return result.rows.map(row => ({
            id: Number(row.id), actorId: row.actor_id, action: row.action,
            entityId: Number(row.entity_id), detail: row.detail || {},
            createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
        }));
    }

    async auditAccess(versionId: number, actor: string, action: 'DOWNLOAD' | 'PREVIEW' | 'PREVIEW_FAILED' | 'SIGNED_URL', detail: Record<string, unknown> = {}): Promise<void> {
        await query(`INSERT INTO hms_document_template_audit (actor_id, action, entity_type, entity_id, detail) VALUES ($1,$2,'VERSION',$3,$4::jsonb)`, [actor, action, versionId, JSON.stringify(detail)]);
    }

    async listArtifacts(templateId?: number): Promise<Array<{ templateId: number; templateCode: string; versionId: number; version: number; status: string; artifactKey?: string; sha256?: string; size?: number; createdAt: string }>> {
        const result = await query(`
            SELECT t.id AS template_id, t.code AS template_code, v.id AS version_id, v.version, v.status,
                   v.artifact_key, v.artifact_sha256, v.artifact_size, v.created_at
            FROM hms_document_template_version v
            JOIN hms_document_template t ON t.id=v.template_id
            WHERE ($1::bigint IS NULL OR t.id=$1) AND v.artifact_key IS NOT NULL
            ORDER BY v.created_at DESC
            LIMIT 1000
        `, [templateId || null]);
        return result.rows.map(row => ({
            templateId: Number(row.template_id), templateCode: row.template_code,
            versionId: Number(row.version_id), version: Number(row.version), status: row.status,
            artifactKey: row.artifact_key, sha256: row.artifact_sha256 || undefined,
            size: row.artifact_size === null ? undefined : Number(row.artifact_size),
            createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
        }));
    }

    async listTestCases(versionId: number): Promise<Array<{ id: number; name: string; testType: string; inputData: Record<string, unknown>; isRequired: boolean }>> {
        const result = await query(`SELECT * FROM hms_document_template_test_case WHERE template_version_id=$1 ORDER BY is_required DESC, id`, [versionId]);
        return result.rows.map(row => ({ id: Number(row.id), name: row.name, testType: row.test_type, inputData: row.input_data, isRequired: row.is_required }));
    }

    async listTestRuns(versionId: number, limit = 100): Promise<TemplateTestRun[]> {
        const result = await query(`
            SELECT * FROM hms_document_template_test_run
            WHERE template_version_id=$1 ORDER BY created_at DESC LIMIT $2
        `, [versionId, Math.min(Math.max(limit, 1), 500)]);
        return result.rows.map(mapTestRun);
    }

    async getTestRun(runId: number): Promise<TemplateTestRun | undefined> {
        const result = await query(`SELECT * FROM hms_document_template_test_run WHERE id=$1`, [runId]);
        return result.rows[0] ? mapTestRun(result.rows[0]) : undefined;
    }

    async createTestRun(versionId: number, testCaseId: number | undefined, actor: string): Promise<number> {
        const result = await query(`
            INSERT INTO hms_document_template_test_run
                (template_version_id, test_case_id, status, created_by)
            VALUES ($1,$2,'RUNNING',$3) RETURNING id
        `, [versionId, testCaseId || null, actor]);
        return Number(result.rows[0].id);
    }

    async completeTestRun(id: number, result: {
        status: 'PASSED' | 'FAILED'; validationErrors: unknown[]; validationWarnings: unknown[];
        docxKey?: string; pdfKey?: string; docxSha256?: string; pdfSha256?: string; docxSize?: number; pdfSize?: number;
        pageCount?: number; durationMs: number; engineVersion: string;
    }): Promise<void> {
        await query(`
            UPDATE hms_document_template_test_run SET status=$2, validation_errors=$3::jsonb,
                validation_warnings=$4::jsonb, docx_key=$5, pdf_key=$6, docx_sha256=$7,
                pdf_sha256=$8, page_count=$9, duration_ms=$10, engine_version=$11, docx_size=$12, pdf_size=$13, completed_at=NOW()
            WHERE id=$1
        `, [id, result.status, JSON.stringify(result.validationErrors), JSON.stringify(result.validationWarnings), result.docxKey || null,
            result.pdfKey || null, result.docxSha256 || null, result.pdfSha256 || null, result.pageCount || null, result.durationMs, result.engineVersion, result.docxSize || null, result.pdfSize || null]);
    }

    async upsertTestCase(versionId: number, input: { id?: number; name: string; testType: string; inputData: Record<string, unknown>; isRequired: boolean }, actor: string): Promise<number> {
        if (input.id) {
            const result = await query(`
                UPDATE hms_document_template_test_case
                SET name=$3, test_type=$4, input_data=$5::jsonb, is_required=$6
                WHERE id=$1 AND template_version_id=$2 RETURNING id
            `, [input.id, versionId, input.name, input.testType, JSON.stringify(input.inputData), input.isRequired]);
            if (!result.rows[0]) throw Object.assign(new Error('Test case not found'), { status: 404 });
            return Number(result.rows[0].id);
        }
        const result = await query(`
            INSERT INTO hms_document_template_test_case
                (template_version_id, name, test_type, input_data, is_required, created_by)
            VALUES ($1,$2,$3,$4::jsonb,$5,$6) RETURNING id
        `, [versionId, input.name, input.testType, JSON.stringify(input.inputData), input.isRequired, actor]);
        return Number(result.rows[0].id);
    }

    async createTemplate(input: { code: string; name: string; documentType: string; moduleCode?: string; description?: string; category?: string; tags?: string[]; scope?: Record<string, unknown>; sampleData?: Record<string, unknown> }, actor: string): Promise<{ templateId: number; versionId: number }> {
        return transaction(async client => {
            const template = await client.query(`
                INSERT INTO hms_document_template (code, name, document_type, module_code, description, category, tags, scope, created_by)
                VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9) RETURNING id
            `, [input.code, input.name, input.documentType, input.moduleCode || null, input.description || null, input.category || null, JSON.stringify(input.tags || []), JSON.stringify(input.scope || {}), actor]);
            const version = await client.query(`
                INSERT INTO hms_document_template_version (template_id, version, status, sample_data, created_by)
                VALUES ($1, 1, 'DRAFT', $2::jsonb, $3) RETURNING id
            `, [template.rows[0].id, JSON.stringify(input.sampleData || {}), actor]);
            await this.audit(client, actor, 'CREATE_TEMPLATE', 'VERSION', version.rows[0].id, { code: input.code, version: 1 });
            return { templateId: Number(template.rows[0].id), versionId: Number(version.rows[0].id) };
        });
    }

    async createNextVersion(templateId: number, actor: string, changeNote?: string): Promise<number> {
        return transaction(async client => {
            const source = await client.query(`SELECT * FROM hms_document_template_version WHERE template_id = $1 ORDER BY version DESC LIMIT 1 FOR UPDATE`, [templateId]);
            if (!source.rows[0]) throw Object.assign(new Error('Template not found'), { status: 404 });
            const row = source.rows[0];
            const result = await client.query(`
                INSERT INTO hms_document_template_version
                    (template_id, version, status, contract_id, artifact_key, artifact_sha256, artifact_size, sample_data, change_note, validation_result, created_by)
                VALUES ($1, $2, 'DRAFT', $3, $4, $5, $6, $7::jsonb, $8, $9::jsonb, $10) RETURNING id
            `, [templateId, Number(row.version) + 1, row.contract_id, row.artifact_key, row.artifact_sha256, row.artifact_size,
                JSON.stringify(row.sample_data || {}), changeNote || null, JSON.stringify(row.validation_result || null), actor]);
            await this.audit(client, actor, 'CREATE_VERSION', 'VERSION', result.rows[0].id, { sourceVersion: row.version });
            return Number(result.rows[0].id);
        });
    }

    async deleteVersion(id: number, actor: string): Promise<void> {
        await transaction(async client => {
            const versionResult = await client.query(`SELECT * FROM hms_document_template_version WHERE id = $1 FOR UPDATE`, [id]);
            const version = versionResult.rows[0];
            if (!version) throw Object.assign(new Error('Template version not found'), { status: 404 });
            if (version.status !== 'DRAFT') {
                throw Object.assign(new Error(`Cannot delete version with status ${version.status}. Only DRAFT versions can be deleted`), { status: 409 });
            }
            const countResult = await client.query(`SELECT COUNT(*)::int AS count FROM hms_document_template_version WHERE template_id = $1`, [version.template_id]);
            if (countResult.rows[0].count <= 1) {
                throw Object.assign(new Error('Cannot delete the only version of a template'), { status: 409 });
            }
            await client.query(`DELETE FROM hms_document_template_test_run WHERE template_version_id = $1`, [id]);
            await client.query(`DELETE FROM hms_document_template_test_case WHERE template_version_id = $1`, [id]);
            await client.query(`DELETE FROM hms_document_template_notification WHERE template_version_id = $1`, [id]);
            await client.query(`DELETE FROM hms_document_template_version WHERE id = $1`, [id]);
            await this.audit(client, actor, 'DELETE_VERSION', 'VERSION', id, { templateId: version.template_id, version: version.version });
        });
    }

    async updateArtifact(id: number, artifact: { key: string; sha256: string; size: number; validation: TemplateValidationResult }, actor: string): Promise<void> {
        const result = await query(`
            UPDATE hms_document_template_version SET artifact_key=$2, artifact_sha256=$3, artifact_size=$4,
                validation_result=$5::jsonb
            WHERE id=$1 AND status='DRAFT'
        `, [id, artifact.key, artifact.sha256, artifact.size, JSON.stringify(artifact.validation)]);
        if (!result.rowCount) throw Object.assign(new Error('Only a DRAFT version can receive a DOCX upload'), { status: 409 });
        await query(`INSERT INTO hms_document_template_audit (actor_id, action, entity_type, entity_id, detail) VALUES ($1,'UPLOAD','VERSION',$2,$3::jsonb)`,
            [actor, id, JSON.stringify({ sha256: artifact.sha256, size: artifact.size, valid: artifact.validation.valid })]);
    }

    async deleteTestCase(id: number, actor: string): Promise<void> {
        await transaction(async client => {
            const result = await client.query(`DELETE FROM hms_document_template_test_case tc USING hms_document_template_version v WHERE tc.id=$1 AND tc.template_version_id=v.id AND v.status='DRAFT' RETURNING tc.id`, [id]);
            if (!result.rowCount) throw Object.assign(new Error('Only test cases of a DRAFT version can be deleted'), { status: 409 });
            await this.audit(client, actor, 'DELETE_TEST_CASE', 'TEST_CASE', id, {});
        });
    }

    async cloneTestCase(id: number, actor: string): Promise<number> {
        return transaction(async client => {
            const source = await client.query(`SELECT tc.* FROM hms_document_template_test_case tc JOIN hms_document_template_version v ON v.id=tc.template_version_id WHERE tc.id=$1 AND v.status='DRAFT'`, [id]);
            if (!source.rows[0]) throw Object.assign(new Error('Only test cases of a DRAFT version can be cloned'), { status: 409 });
            const row = source.rows[0];
            const result = await client.query(`INSERT INTO hms_document_template_test_case (template_version_id,name,test_type,input_data,is_required) VALUES ($1,$2,$3,$4::jsonb,$5) RETURNING id`, [row.template_version_id, `${row.name} (copy)`, row.test_type, JSON.stringify(row.input_data), row.is_required]);
            const clonedId = result.rows[0].id;
            await this.audit(client, actor, 'CLONE_TEST_CASE', 'TEST_CASE', clonedId, { sourceId: id });
            return clonedId;
        });
    }

    async updateSampleData(id: number, data: Record<string, unknown>, actor: string): Promise<void> {
        const result = await query(`UPDATE hms_document_template_version SET sample_data=$2::jsonb WHERE id=$1 AND status='DRAFT'`, [id, JSON.stringify(data)]);
        if (!result.rowCount) throw Object.assign(new Error('Only a DRAFT version can be edited'), { status: 409 });
        await query(`INSERT INTO hms_document_template_audit (actor_id, action, entity_type, entity_id) VALUES ($1,'UPDATE_SAMPLE_DATA','VERSION',$2)`, [actor, id]);
    }

    async transition(id: number, expected: TemplateVersionStatus[], next: TemplateVersionStatus, actor: string, note?: string): Promise<void> {
        await transaction(async client => {
            const current = await client.query(`SELECT v.*, t.id AS parent_id FROM hms_document_template_version v JOIN hms_document_template t ON t.id=v.template_id WHERE v.id=$1 FOR UPDATE`, [id]);
            const row = current.rows[0];
            if (!row) throw Object.assign(new Error('Template version not found'), { status: 404 });
            if (!expected.includes(row.status)) throw Object.assign(new Error(`Cannot change template from ${row.status} to ${next}`), { status: 409 });
            if (next === 'IN_REVIEW' && !note?.trim()) throw Object.assign(new Error('Change note is required before submitting for review'), { status: 400 });
            if (next === 'APPROVED' && String(row.created_by) === actor && actor.toLowerCase() !== 'admin') throw Object.assign(new Error('The creator cannot approve their own template'), { status: 403 });
            if (next === 'IN_REVIEW' && (!row.artifact_key || row.validation_result?.valid !== true)) throw Object.assign(new Error('Template must have a valid DOCX before review'), { status: 409 });
            if (next === 'IN_REVIEW') {
                const required = await client.query(`
                    SELECT tc.id
                    FROM hms_document_template_test_case tc
                    WHERE tc.template_version_id=$1 AND tc.is_required=true
                      AND NOT EXISTS (
                        SELECT 1 FROM hms_document_template_test_run tr
                        WHERE tr.template_version_id=tc.template_version_id
                          AND tr.test_case_id=tc.id AND tr.status='PASSED'
                      )
                    LIMIT 1
                `, [id]);
                if (required.rowCount) throw Object.assign(new Error('All required test cases must pass before review'), { status: 409 });
            }
            const fields = next === 'IN_REVIEW' ? `submitted_by=$3, submitted_at=NOW()` :
                next === 'APPROVED' ? `reviewed_by=$3, reviewed_at=NOW()` :
                next === 'PUBLISHED' ? `published_by=$3, published_at=NOW()` : `reviewed_by=COALESCE(reviewed_by,$3)`;
            await client.query(`UPDATE hms_document_template_version SET status=$2, change_note=COALESCE($4, change_note), ${fields} WHERE id=$1`, [id, next, actor, note || null]);
            if (next === 'PUBLISHED') {
                await client.query(`UPDATE hms_document_template_version SET status='RETIRED' WHERE template_id=$1 AND id<>$2 AND status='PUBLISHED'`, [row.template_id, id]);
                await client.query(`UPDATE hms_document_template SET active_version_id=$2, updated_at=NOW() WHERE id=$1`, [row.template_id, id]);
            }
            await this.audit(client, actor, next, 'VERSION', id, { previousStatus: row.status, note: note || null });
            const notification = next === 'IN_REVIEW' ? ['SUBMITTED', 'REVIEWER', 'Mẫu biểu đang chờ duyệt'] : next === 'DRAFT' && row.status === 'IN_REVIEW' ? ['REJECTED', 'DESIGNER', 'Mẫu biểu đã bị trả lại'] : next === 'PUBLISHED' ? ['PUBLISHED', 'DESIGNER', 'Mẫu biểu đã được phát hành'] : null;
            if (notification) await client.query(`INSERT INTO hms_document_template_notification (template_version_id,event_type,target_role,message) VALUES ($1,$2,$3,$4)`, [id, notification[0], notification[1], notification[2]]);
        });
    }

    async rollback(id: number, actor: string, reason: string): Promise<void> {
        if (!reason?.trim()) throw Object.assign(new Error('Rollback reason is required'), { status: 400 });
        await transaction(async client => {
            const target = await client.query(`SELECT * FROM hms_document_template_version WHERE id=$1 FOR UPDATE`, [id]);
            const row = target.rows[0];
            if (!row) throw Object.assign(new Error('Template version not found'), { status: 404 });
            if (!['PUBLISHED', 'RETIRED'].includes(row.status)) throw Object.assign(new Error('Rollback target must have been published'), { status: 409 });
            await client.query(`UPDATE hms_document_template_version SET status='RETIRED' WHERE template_id=$1 AND status='PUBLISHED' AND id<>$2`, [row.template_id, id]);
            await client.query(`UPDATE hms_document_template_version SET status='PUBLISHED', published_by=$2, published_at=NOW() WHERE id=$1`, [id, actor]);
            await client.query(`UPDATE hms_document_template SET active_version_id=$2, updated_at=NOW() WHERE id=$1`, [row.template_id, id]);
            await this.audit(client, actor, 'ROLLBACK', 'VERSION', id, { reason, targetVersion: row.version, cacheInvalidated: true });
        });
    }

    async getPackageData(versionId: number): Promise<{
        template: { id: number; code: string; name: string; documentType: string; moduleCode?: string; description?: string; category?: string; tags: string[]; scope: Record<string, unknown>; printConfig: Record<string, unknown> };
        version: { id: number; version: number; status: string; artifactKey?: string; artifactSha256?: string; artifactSize?: number; sampleData: Record<string, unknown>; changeNote?: string };
        testCases: Array<{ name: string; testType: string; inputData: Record<string, unknown>; isRequired: boolean }>;
        contract?: { code: string; name: string; version: number; jsonSchema: Record<string, unknown>; sampleData?: Record<string, unknown> };
    }> {
        const verResult = await query(`
            SELECT v.*, t.id AS template_id, t.code AS template_code, t.name AS template_name,
                   t.document_type, t.module_code, t.description, t.category, t.tags, t.scope, t.print_config
            FROM hms_document_template_version v
            JOIN hms_document_template t ON t.id = v.template_id
            WHERE v.id = $1
        `, [versionId]);
        if (!verResult.rows[0]) throw Object.assign(new Error('Template version not found'), { status: 404 });
        const row = verResult.rows[0];

        const tcResult = await query(`SELECT name, test_type, input_data, is_required FROM hms_document_template_test_case WHERE template_version_id = $1 ORDER BY id`, [versionId]);
        const testCases = tcResult.rows.map(r => ({ name: r.name, testType: r.test_type, inputData: r.input_data || {}, isRequired: r.is_required }));

        let contract: { code: string; name: string; version: number; jsonSchema: Record<string, unknown>; sampleData?: Record<string, unknown> } | undefined;
        const contractResult = await query(`SELECT code, name, version, json_schema FROM hms_document_data_contract WHERE code = $1 ORDER BY version DESC LIMIT 1`, [row.template_code]);
        if (contractResult.rows[0]) {
            const cRow = contractResult.rows[0];
            contract = { code: cRow.code, name: cRow.name, version: Number(cRow.version), jsonSchema: cRow.json_schema || {} };
        }

        return {
            template: {
                id: Number(row.template_id),
                code: row.template_code,
                name: row.template_name,
                documentType: row.document_type,
                moduleCode: row.module_code || undefined,
                description: row.description || undefined,
                category: row.category || undefined,
                tags: Array.isArray(row.tags) ? row.tags : [],
                scope: row.scope || {},
                printConfig: row.print_config || {}
            },
            version: {
                id: Number(row.id),
                version: Number(row.version),
                status: row.status,
                artifactKey: row.artifact_key || undefined,
                artifactSha256: row.artifact_sha256 || undefined,
                artifactSize: row.artifact_size === null ? undefined : Number(row.artifact_size),
                sampleData: row.sample_data || {},
                changeNote: row.change_note || undefined
            },
            testCases,
            contract
        };
    }

    async importPackage(data: {
        metadata: {
            template: { code: string; name: string; documentType: string; moduleCode?: string; description?: string; category?: string; tags?: string[]; scope?: Record<string, unknown>; printConfig?: Record<string, unknown> };
            version: { version?: number; changeNote?: string; sampleData?: Record<string, unknown> };
            contract?: { code: string; name: string; version?: number; jsonSchema?: Record<string, unknown>; sampleData?: Record<string, unknown> };
            testCases?: Array<{ name: string; testType?: string; inputData?: Record<string, unknown>; isRequired?: boolean }>;
        };
        artifact?: { key: string; sha256: string; size: number; validation: any };
    }, actor: string): Promise<{ templateId: number; versionId: number; versionNumber: number; templateCode: string }> {
        return transaction(async client => {
            const t = data.metadata.template;
            let templateId: number;

            const existingTemplate = await client.query(`SELECT id, code FROM hms_document_template WHERE code = $1`, [t.code]);
            if (existingTemplate.rows[0]) {
                templateId = Number(existingTemplate.rows[0].id);
                // Update metadata if needed
                await client.query(`
                    UPDATE hms_document_template
                    SET name = COALESCE($2, name), document_type = COALESCE($3, document_type),
                        module_code = COALESCE($4, module_code), description = COALESCE($5, description),
                        category = COALESCE($6, category), tags = COALESCE($7::jsonb, tags),
                        scope = COALESCE($8::jsonb, scope), print_config = COALESCE($9::jsonb, print_config),
                        updated_at = NOW()
                    WHERE id = $1
                `, [templateId, t.name, t.documentType, t.moduleCode || null, t.description || null, t.category || null, JSON.stringify(t.tags || []), JSON.stringify(t.scope || {}), JSON.stringify(t.printConfig || {})]);
            } else {
                const createdT = await client.query(`
                    INSERT INTO hms_document_template (code, name, document_type, module_code, description, category, tags, scope, print_config, created_by)
                    VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9::jsonb, $10)
                    RETURNING id
                `, [t.code, t.name, t.documentType, t.moduleCode || null, t.description || null, t.category || null, JSON.stringify(t.tags || []), JSON.stringify(t.scope || {}), JSON.stringify(t.printConfig || {}), actor]);
                templateId = Number(createdT.rows[0].id);
            }

            // Next version number
            const maxVerResult = await client.query(`SELECT COALESCE(MAX(version), 0) + 1 AS next_ver FROM hms_document_template_version WHERE template_id = $1`, [templateId]);
            const versionNumber = Number(maxVerResult.rows[0].next_ver);

            const sampleData = data.metadata.version.sampleData || {};
            const changeNote = data.metadata.version.changeNote || `Imported from package (version ${data.metadata.version.version || versionNumber})`;

            const createdV = await client.query(`
                INSERT INTO hms_document_template_version
                    (template_id, version, status, sample_data, change_note, artifact_key, artifact_sha256, artifact_size, validation_result, created_by)
                VALUES ($1, $2, 'DRAFT', $3::jsonb, $4, $5, $6, $7, $8::jsonb, $9)
                RETURNING id
            `, [
                templateId, versionNumber, JSON.stringify(sampleData), changeNote,
                data.artifact?.key || null, data.artifact?.sha256 || null,
                data.artifact?.size || null, JSON.stringify(data.artifact?.validation || null),
                actor
            ]);
            const versionId = Number(createdV.rows[0].id);

            // Import contract if provided
            if (data.metadata.contract && data.metadata.contract.jsonSchema) {
                const c = data.metadata.contract;
                const existingContract = await client.query(`SELECT id FROM hms_document_data_contract WHERE code = $1 AND version = $2`, [c.code, c.version || 1]);
                if (!existingContract.rows[0]) {
                    await client.query(`
                        INSERT INTO hms_document_data_contract (code, version, name, json_schema, status, created_by)
                        VALUES ($1, $2, $3, $4::jsonb, 'DRAFT', $5)
                    `, [c.code, c.version || 1, c.name || t.name, JSON.stringify(c.jsonSchema), actor]);
                }
            }

            // Import test cases
            if (Array.isArray(data.metadata.testCases) && data.metadata.testCases.length > 0) {
                for (const tc of data.metadata.testCases) {
                    if (tc.name && tc.inputData && typeof tc.inputData === 'object') {
                        await client.query(`
                            INSERT INTO hms_document_template_test_case (template_version_id, name, test_type, input_data, is_required, created_by)
                            VALUES ($1, $2, $3, $4::jsonb, $5, $6)
                        `, [versionId, tc.name, tc.testType || 'NORMAL', JSON.stringify(tc.inputData), tc.isRequired !== false, actor]);
                    }
                }
            }

            await this.audit(client, actor, 'IMPORT_PACKAGE', 'VERSION', versionId, {
                templateCode: t.code,
                versionNumber,
                testCasesCount: data.metadata.testCases?.length || 0,
                hasArtifact: Boolean(data.artifact)
            });

            return { templateId, versionId, versionNumber, templateCode: t.code };
        });
    }

    async getInbox(actor: string, options: { facilityId?: string; departmentId?: string } = {}): Promise<TemplateInbox> {
        const rows = await query(`
            SELECT 
                t.id AS template_id,
                t.code,
                t.name,
                t.document_type,
                t.module_code,
                v.id AS version_id,
                v.version,
                v.status,
                v.assigned_designer,
                v.assigned_tester,
                v.assigned_reviewer,
                v.assigned_publisher,
                v.due_date,
                v.change_note,
                v.created_by,
                v.created_at,
                v.submitted_at,
                v.reviewed_at,
                CASE WHEN v.due_date IS NOT NULL AND v.due_date < NOW() AND v.status NOT IN ('PUBLISHED', 'RETIRED') THEN TRUE ELSE FALSE END AS is_overdue
            FROM hms_document_template t
            JOIN hms_document_template_version v ON v.template_id = t.id
            WHERE t.is_active = TRUE
              AND v.status IN ('DRAFT', 'IN_REVIEW', 'APPROVED')
            ORDER BY v.created_at DESC
        `);

        const allItems: TemplateInboxItem[] = rows.rows.map((r: any) => ({
            templateId: Number(r.template_id),
            versionId: Number(r.version_id),
            code: r.code,
            name: r.name,
            documentType: r.document_type,
            moduleCode: r.module_code || undefined,
            version: Number(r.version),
            status: r.status,
            assignedDesigner: r.assigned_designer || undefined,
            assignedTester: r.assigned_tester || undefined,
            assignedReviewer: r.assigned_reviewer || undefined,
            assignedPublisher: r.assigned_publisher || undefined,
            dueDate: r.due_date ? new Date(r.due_date).toISOString() : undefined,
            isOverdue: Boolean(r.is_overdue),
            createdBy: r.created_by,
            createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
            submittedAt: r.submitted_at ? new Date(r.submitted_at).toISOString() : undefined,
            reviewedAt: r.reviewed_at ? new Date(r.reviewed_at).toISOString() : undefined,
            changeNote: r.change_note || undefined
        }));

        const myDrafts = allItems.filter(item => item.status === 'DRAFT' && (item.createdBy === actor || item.assignedDesigner === actor));
        const pendingReview = allItems.filter(item => item.status === 'IN_REVIEW' && (item.assignedReviewer === actor || !item.assignedReviewer));
        const pendingPublish = allItems.filter(item => item.status === 'APPROVED' && (item.assignedPublisher === actor || !item.assignedPublisher));
        const rejected = allItems.filter(item => item.status === 'DRAFT' && item.reviewedAt && (item.createdBy === actor || item.assignedDesigner === actor));
        const overdue = allItems.filter(item => item.isOverdue);

        return {
            myDrafts,
            pendingReview,
            pendingPublish,
            rejected,
            overdue,
            stats: {
                totalDrafts: myDrafts.length,
                totalPendingReview: pendingReview.length,
                totalPendingPublish: pendingPublish.length,
                totalOverdue: overdue.length,
                totalRejected: rejected.length
            }
        };
    }

    async updateAssignments(versionId: number, data: {
        assignedDesigner?: string;
        assignedTester?: string;
        assignedReviewer?: string;
        assignedPublisher?: string;
        dueDate?: string;
        effectiveFrom?: string;
        effectiveTo?: string;
        scheduledPublishAt?: string;
    }, actor: string): Promise<void> {
        await transaction(async client => {
            const current = await client.query(`SELECT v.*, t.id AS template_id, t.code, t.name FROM hms_document_template_version v JOIN hms_document_template t ON t.id=v.template_id WHERE v.id=$1`, [versionId]);
            if (!current.rows[0]) throw Object.assign(new Error('Version not found'), { status: 404 });
            const v = current.rows[0];

            await client.query(`
                UPDATE hms_document_template_version SET
                    assigned_designer = COALESCE($2, assigned_designer),
                    assigned_tester = COALESCE($3, assigned_tester),
                    assigned_reviewer = COALESCE($4, assigned_reviewer),
                    assigned_publisher = COALESCE($5, assigned_publisher),
                    due_date = COALESCE($6::timestamptz, due_date),
                    effective_from = COALESCE($7::timestamptz, effective_from),
                    effective_to = COALESCE($8::timestamptz, effective_to),
                    scheduled_publish_at = COALESCE($9::timestamptz, scheduled_publish_at)
                WHERE id = $1
            `, [
                versionId,
                data.assignedDesigner !== undefined ? data.assignedDesigner : null,
                data.assignedTester !== undefined ? data.assignedTester : null,
                data.assignedReviewer !== undefined ? data.assignedReviewer : null,
                data.assignedPublisher !== undefined ? data.assignedPublisher : null,
                data.dueDate || null,
                data.effectiveFrom || null,
                data.effectiveTo || null,
                data.scheduledPublishAt || null
            ]);

            await this.audit(client, actor, 'UPDATE_ASSIGNMENTS', 'VERSION', versionId, data);

            // Send notification to assigned reviewer if newly assigned
            if (data.assignedReviewer && data.assignedReviewer !== v.assigned_reviewer) {
                await client.query(`
                    INSERT INTO hms_document_template_notification (recipient_id, template_id, template_version_id, title, message, type, event_type)
                    VALUES ($1, $2, $3, $4, $5, 'ASSIGNED', 'ASSIGNED')
                `, [data.assignedReviewer, v.template_id, versionId, `Phân công thẩm định mẫu ${v.code}`, `Bạn được phân công làm Reviewer cho mẫu ${v.name} (v${v.version})`]);
            }
        });
    }

    async getComments(versionId: number): Promise<TemplateComment[]> {
        const result = await query(`
            SELECT id, template_version_id, author_id, author_name, content, category, created_at
            FROM hms_document_template_comment
            WHERE template_version_id = $1
            ORDER BY created_at ASC
        `, [versionId]);
        return result.rows.map((r: any) => ({
            id: Number(r.id),
            templateVersionId: Number(r.template_version_id),
            authorId: r.author_id,
            authorName: r.author_name || undefined,
            content: r.content,
            category: r.category,
            createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at
        }));
    }

    async addComment(versionId: number, data: { content: string; category?: string; authorName?: string }, actor: string): Promise<TemplateComment> {
        return transaction(async client => {
            const current = await client.query(`SELECT v.*, t.id AS template_id, t.code, t.name FROM hms_document_template_version v JOIN hms_document_template t ON t.id=v.template_id WHERE v.id=$1`, [versionId]);
            if (!current.rows[0]) throw Object.assign(new Error('Version not found'), { status: 404 });
            const v = current.rows[0];

            const result = await client.query(`
                INSERT INTO hms_document_template_comment (template_version_id, author_id, author_name, content, category)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `, [versionId, actor, data.authorName || actor, data.content.trim(), data.category || 'GENERAL']);
            const r = result.rows[0];

            await this.audit(client, actor, 'ADD_COMMENT', 'VERSION', versionId, { commentId: r.id, category: r.category });

            // Notify template creator if comment is by another actor
            if (v.created_by && v.created_by !== actor) {
                await client.query(`
                    INSERT INTO hms_document_template_notification (recipient_id, template_id, template_version_id, title, message, type, event_type)
                    VALUES ($1, $2, $3, $4, $5, 'ASSIGNED', 'COMMENT_ADDED')
                `, [v.created_by, v.template_id, versionId, `Bình luận mới trên mẫu ${v.code}`, `${actor} đã thêm bình luận: "${data.content.slice(0, 50)}"`]);
            }

            return {
                id: Number(r.id),
                templateVersionId: Number(r.template_version_id),
                authorId: r.author_id,
                authorName: r.author_name || undefined,
                content: r.content,
                category: r.category,
                createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at
            };
        });
    }

    async updateReviewChecklist(versionId: number, checklist: Record<string, unknown>, actor: string): Promise<void> {
        await transaction(async client => {
            const result = await client.query(`
                UPDATE hms_document_template_version
                SET review_checklist = $2::jsonb
                WHERE id = $1
            `, [versionId, JSON.stringify(checklist)]);
            if (!result.rowCount) throw Object.assign(new Error('Version not found'), { status: 404 });
            await this.audit(client, actor, 'UPDATE_REVIEW_CHECKLIST', 'VERSION', versionId, checklist);
        });
    }

    async listUserPermissions(userId?: string): Promise<TemplateUserPermission[]> {
        const result = await query(`
            SELECT id, user_id, user_name, role_code, facility_id, department_id, granted_by, created_at
            FROM hms_document_template_user_permission
            WHERE ($1::text IS NULL OR user_id = $1)
            ORDER BY created_at DESC
        `, [userId || null]);
        return result.rows.map((r: any) => ({
            id: Number(r.id),
            userId: r.user_id,
            userName: r.user_name || undefined,
            roleCode: r.role_code,
            facilityId: r.facility_id || undefined,
            departmentId: r.department_id || undefined,
            grantedBy: r.granted_by,
            createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at
        }));
    }

    async grantUserPermission(data: { userId: string; userName?: string; roleCode: string; facilityId?: string; departmentId?: string }, actor: string): Promise<TemplateUserPermission> {
        return transaction(async client => {
            const result = await client.query(`
                INSERT INTO hms_document_template_user_permission (user_id, user_name, role_code, facility_id, department_id, granted_by)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `, [data.userId, data.userName || null, data.roleCode, data.facilityId || null, data.departmentId || null, actor]);
            const r = result.rows[0];
            await this.audit(client, actor, 'GRANT_PERMISSION', 'PERMISSION', r.id, data);
            return {
                id: Number(r.id),
                userId: r.user_id,
                userName: r.user_name || undefined,
                roleCode: r.role_code,
                facilityId: r.facility_id || undefined,
                departmentId: r.department_id || undefined,
                grantedBy: r.granted_by,
                createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at
            };
        });
    }

    async revokeUserPermission(id: number, actor: string): Promise<void> {
        await transaction(async client => {
            const result = await client.query(`DELETE FROM hms_document_template_user_permission WHERE id = $1 RETURNING id`, [id]);
            if (!result.rowCount) throw Object.assign(new Error('Permission not found'), { status: 404 });
            await this.audit(client, actor, 'REVOKE_PERMISSION', 'PERMISSION', id, {});
        });
    }

    async getNotifications(recipientId: string, limit = 50): Promise<TemplateNotification[]> {
        const result = await query(`
            SELECT n.id, n.recipient_id, n.template_id, n.template_version_id, n.title, n.message, n.type, n.is_read, n.created_at,
                   t.code AS template_code, t.name AS template_name, v.version AS version_number
            FROM hms_document_template_notification n
            LEFT JOIN hms_document_template t ON t.id = n.template_id
            LEFT JOIN hms_document_template_version v ON v.id = n.template_version_id
            WHERE n.recipient_id = $1
            ORDER BY n.created_at DESC
            LIMIT $2
        `, [recipientId, limit]);
        return result.rows.map((r: any) => ({
            id: Number(r.id),
            recipientId: r.recipient_id,
            templateId: Number(r.template_id),
            templateVersionId: r.template_version_id ? Number(r.template_version_id) : undefined,
            title: r.title,
            message: r.message,
            type: r.type,
            isRead: Boolean(r.is_read),
            createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
            templateCode: r.template_code,
            templateName: r.template_name,
            versionNumber: r.version_number ? Number(r.version_number) : undefined
        }));
    }

    async markNotificationRead(id: number, recipientId?: string): Promise<void> {
        await query(`
            UPDATE hms_document_template_notification
            SET is_read = TRUE
            WHERE id = $1 AND ($2::text IS NULL OR recipient_id = $2)
        `, [id, recipientId || null]);
    }

    async processScheduledPublishes(): Promise<number> {
        return transaction(async client => {
            const due = await client.query(`
                SELECT v.id, v.template_id, v.version, t.code, t.name
                FROM hms_document_template_version v
                JOIN hms_document_template t ON t.id = v.template_id
                WHERE v.status = 'APPROVED'
                  AND v.scheduled_publish_at IS NOT NULL
                  AND v.scheduled_publish_at <= NOW()
                FOR UPDATE
            `);
            let count = 0;
            for (const row of due.rows) {
                await client.query(`
                    UPDATE hms_document_template_version
                    SET status = 'RETIRED'
                    WHERE template_id = $1 AND id <> $2 AND status = 'PUBLISHED'
                `, [row.template_id, row.id]);
                await client.query(`
                    UPDATE hms_document_template_version
                    SET status = 'PUBLISHED', published_by = 'SYSTEM_SCHEDULER', published_at = NOW()
                    WHERE id = $1
                `, [row.id]);
                await client.query(`
                    UPDATE hms_document_template
                    SET active_version_id = $2, updated_at = NOW()
                    WHERE id = $1
                `, [row.template_id, row.id]);
                await this.audit(client, 'SYSTEM_SCHEDULER', 'SCHEDULED_PUBLISH', 'VERSION', row.id, {
                    templateCode: row.code,
                    versionNumber: row.version
                });
                count += 1;
            }
            return count;
        });
    }

    async listOrphanArtifacts(storageFiles: Array<{ key: string; size: number; modifiedAt: string }>): Promise<Array<{ key: string; size: number; modifiedAt: string }>> {
        const dbKeysResult = await query(`
            SELECT DISTINCT artifact_key FROM hms_document_template_version WHERE artifact_key IS NOT NULL
        `);
        const dbKeys = new Set(dbKeysResult.rows.map(r => r.artifact_key));
        return storageFiles.filter(f => !dbKeys.has(f.key));
    }

    async cleanupOrphanArtifacts(actorId: string, keys: string[]): Promise<number> {
        for (const key of keys) {
            await query(`
                INSERT INTO hms_document_template_audit (actor_id, action, entity_type, entity_id, detail)
                VALUES ($1, 'ORPHAN_CLEANUP', 'STORAGE', 0, $2::jsonb)
            `, [actorId, JSON.stringify({ deletedKey: key, cleanedAt: new Date().toISOString() })]);
        }
        return keys.length;
    }

    async getOperationsDashboardMetrics() {
        const templatesByStatus = await query(`
            SELECT
                COUNT(*) FILTER (WHERE is_active = true) as total_active,
                COUNT(*) FILTER (WHERE is_active = false) as total_archived,
                COUNT(*) as total
            FROM hms_document_template
        `);

        const versionsByStatus = await query(`
            SELECT status, COUNT(*) as count
            FROM hms_document_template_version
            GROUP BY status
        `);

        const statusDistribution: Record<string, number> = {
            DRAFT: 0,
            IN_REVIEW: 0,
            APPROVED: 0,
            PUBLISHED: 0,
            RETIRED: 0
        };
        for (const r of versionsByStatus.rows) {
            statusDistribution[r.status] = Number(r.count);
        }

        const testRunsStats = await query(`
            SELECT
                COUNT(*) as total_runs,
                COUNT(*) FILTER (WHERE status = 'PASSED') as passed_runs,
                COUNT(*) FILTER (WHERE status = 'FAILED') as failed_runs,
                COALESCE(AVG(duration_ms), 0) as avg_duration_ms,
                COALESCE(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY duration_ms), 0) as p50_ms,
                COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms), 0) as p95_ms,
                COALESCE(PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration_ms), 0) as p99_ms
            FROM hms_document_template_test_run
        `);

        const storageStats = await query(`
            SELECT
                COUNT(artifact_key) as total_artifacts,
                COALESCE(SUM(artifact_size), 0) as total_bytes,
                COALESCE(AVG(artifact_size), 0) as avg_bytes,
                COALESCE(MAX(artifact_size), 0) as max_bytes
            FROM hms_document_template_version
            WHERE artifact_key IS NOT NULL
        `);

        const recentAudits = await query(`
            SELECT a.id, a.actor_id, a.action, a.entity_type, a.entity_id, a.detail, a.created_at
            FROM hms_document_template_audit a
            ORDER BY a.created_at DESC
            LIMIT 10
        `);

        const tr = testRunsStats.rows[0];
        const totalRuns = Number(tr?.total_runs || 0);
        const passedRuns = Number(tr?.passed_runs || 0);
        const failedRuns = Number(tr?.failed_runs || 0);
        const passRate = totalRuns > 0 ? Math.round((passedRuns / totalRuns) * 10000) / 100 : 100;

        return {
            templates: {
                total: Number(templatesByStatus.rows[0]?.total || 0),
                totalActive: Number(templatesByStatus.rows[0]?.total_active || 0),
                totalArchived: Number(templatesByStatus.rows[0]?.total_archived || 0),
                byStatus: statusDistribution
            },
            testRuns: {
                total: totalRuns,
                passed: passedRuns,
                failed: failedRuns,
                passRate,
                avgDurationMs: Math.round(Number(tr?.avg_duration_ms || 0)),
                p50Ms: Math.round(Number(tr?.p50_ms || 0)),
                p95Ms: Math.round(Number(tr?.p95_ms || 0)),
                p99Ms: Math.round(Number(tr?.p99_ms || 0))
            },
            storage: {
                totalArtifacts: Number(storageStats.rows[0]?.total_artifacts || 0),
                totalBytes: Number(storageStats.rows[0]?.total_bytes || 0),
                avgBytes: Math.round(Number(storageStats.rows[0]?.avg_bytes || 0)),
                maxBytes: Number(storageStats.rows[0]?.max_bytes || 0)
            },
            health: {
                database: 'HEALTHY',
                storage: 'HEALTHY',
                carbone: 'HEALTHY',
                queue: 'HEALTHY'
            },
            recentActivity: recentAudits.rows.map(r => ({
                id: Number(r.id),
                actorId: r.actor_id,
                action: r.action,
                entityType: r.entity_type,
                detail: r.detail || {},
                createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at
            })),
            generatedAt: new Date().toISOString()
        };
    }

    private async audit(client: PoolClient, actor: string, action: string, entityType: string, entityId: number, detail: object): Promise<void> {
        await client.query(`INSERT INTO hms_document_template_audit (actor_id, action, entity_type, entity_id, detail) VALUES ($1,$2,$3,$4,$5::jsonb)`,
            [actor, action, entityType, entityId, JSON.stringify(detail)]);
    }
}
