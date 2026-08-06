import { PoolClient } from 'pg';
import { query, transaction } from '../config/database';
import { TemplateStudioTemplate, TemplateStudioVersion, TemplateValidationResult, TemplateVersionStatus } from './types';

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
        createdBy: row.created_by,
        createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
    };
}

export class TemplateStudioRepository {
    async list(): Promise<TemplateStudioTemplate[]> {
        const result = await query(`
            SELECT t.*, row_to_json(v.*) AS latest_version
            FROM hms_document_template t
            LEFT JOIN LATERAL (
                SELECT * FROM hms_document_template_version candidate
                WHERE candidate.template_id = t.id
                ORDER BY candidate.version DESC LIMIT 1
            ) v ON TRUE
            WHERE t.is_active = TRUE
            ORDER BY t.name, t.code
        `);
        return result.rows.map(row => ({
            id: Number(row.id), code: row.code, name: row.name,
            documentType: row.document_type, moduleCode: row.module_code || undefined,
            description: row.description || undefined,
            activeVersionId: row.active_version_id === null ? undefined : Number(row.active_version_id),
            isActive: row.is_active,
            latestVersion: row.latest_version?.id ? mapVersion(row.latest_version) : undefined
        }));
    }

    async getVersion(id: number): Promise<TemplateStudioVersion & { templateCode: string; templateName: string }> {
        const result = await query(`
            SELECT v.*, t.code AS template_code, t.name AS template_name
            FROM hms_document_template_version v JOIN hms_document_template t ON t.id = v.template_id
            WHERE v.id = $1
        `, [id]);
        if (!result.rows[0]) throw Object.assign(new Error('Template version not found'), { status: 404 });
        return { ...mapVersion(result.rows[0]), templateCode: result.rows[0].template_code, templateName: result.rows[0].template_name };
    }

    async listVersions(templateId: number): Promise<TemplateStudioVersion[]> {
        const result = await query(`
            SELECT * FROM hms_document_template_version
            WHERE template_id=$1 ORDER BY version DESC
        `, [templateId]);
        return result.rows.map(mapVersion);
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

    async listTestCases(versionId: number): Promise<Array<{ id: number; name: string; testType: string; inputData: Record<string, unknown>; isRequired: boolean }>> {
        const result = await query(`SELECT * FROM hms_document_template_test_case WHERE template_version_id=$1 ORDER BY is_required DESC, id`, [versionId]);
        return result.rows.map(row => ({ id: Number(row.id), name: row.name, testType: row.test_type, inputData: row.input_data, isRequired: row.is_required }));
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

    async createTemplate(input: { code: string; name: string; documentType: string; moduleCode?: string; description?: string; sampleData?: Record<string, unknown> }, actor: string): Promise<number> {
        return transaction(async client => {
            const template = await client.query(`
                INSERT INTO hms_document_template (code, name, document_type, module_code, description, created_by)
                VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
            `, [input.code, input.name, input.documentType, input.moduleCode || null, input.description || null, actor]);
            const version = await client.query(`
                INSERT INTO hms_document_template_version (template_id, version, status, sample_data, created_by)
                VALUES ($1, 1, 'DRAFT', $2::jsonb, $3) RETURNING id
            `, [template.rows[0].id, JSON.stringify(input.sampleData || {}), actor]);
            await this.audit(client, actor, 'CREATE_TEMPLATE', 'VERSION', version.rows[0].id, { code: input.code, version: 1 });
            return Number(version.rows[0].id);
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

    async updateSampleData(id: number, data: Record<string, unknown>, actor: string): Promise<void> {
        const result = await query(`UPDATE hms_document_template_version SET sample_data=$2::jsonb WHERE id=$1 AND status='DRAFT'`, [id, JSON.stringify(data)]);
        if (!result.rowCount) throw Object.assign(new Error('Only a DRAFT version can be edited'), { status: 409 });
        await query(`INSERT INTO hms_document_template_audit (actor_id, action, entity_type, entity_id) VALUES ($1,'UPDATE_SAMPLE_DATA','VERSION',$2)`, [actor, id]);
    }

    async transition(id: number, expected: TemplateVersionStatus[], next: TemplateVersionStatus, actor: string): Promise<void> {
        await transaction(async client => {
            const current = await client.query(`SELECT v.*, t.id AS parent_id FROM hms_document_template_version v JOIN hms_document_template t ON t.id=v.template_id WHERE v.id=$1 FOR UPDATE`, [id]);
            const row = current.rows[0];
            if (!row) throw Object.assign(new Error('Template version not found'), { status: 404 });
            if (!expected.includes(row.status)) throw Object.assign(new Error(`Cannot change template from ${row.status} to ${next}`), { status: 409 });
            if (next === 'IN_REVIEW' && (!row.artifact_key || row.validation_result?.valid !== true)) throw Object.assign(new Error('Template must have a valid DOCX before review'), { status: 409 });
            const fields = next === 'IN_REVIEW' ? `submitted_by=$3, submitted_at=NOW()` :
                next === 'APPROVED' ? `reviewed_by=$3, reviewed_at=NOW()` :
                next === 'PUBLISHED' ? `published_by=$3, published_at=NOW()` : `reviewed_by=COALESCE(reviewed_by,$3)`;
            await client.query(`UPDATE hms_document_template_version SET status=$2, ${fields} WHERE id=$1`, [id, next, actor]);
            if (next === 'PUBLISHED') {
                await client.query(`UPDATE hms_document_template_version SET status='RETIRED' WHERE template_id=$1 AND id<>$2 AND status='PUBLISHED'`, [row.template_id, id]);
                await client.query(`UPDATE hms_document_template SET active_version_id=$2, updated_at=NOW() WHERE id=$1`, [row.template_id, id]);
            }
            await this.audit(client, actor, next, 'VERSION', id, { previousStatus: row.status });
        });
    }

    private async audit(client: PoolClient, actor: string, action: string, entityType: string, entityId: number, detail: object): Promise<void> {
        await client.query(`INSERT INTO hms_document_template_audit (actor_id, action, entity_type, entity_id, detail) VALUES ($1,$2,$3,$4,$5::jsonb)`,
            [actor, action, entityType, entityId, JSON.stringify(detail)]);
    }
}
