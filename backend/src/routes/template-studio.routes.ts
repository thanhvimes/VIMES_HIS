import express, { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { templateStudioService } from '../template-studio/template-studio.service';
import { buildJsonSchema } from '../template-studio/contract-catalog';
import { enqueueTemplatePreview, getTemplatePreviewJob, listTemplatePreviewDlq, retryTemplatePreviewDlq, getTemplatePreviewQueueMetrics } from '../template-studio/render-queue';
import { createMapping } from '../template-studio/mapping-service';
import { applyMapping } from '../template-studio/mapping-engine';

const router = express.Router();
const rawDocx = express.raw({ type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', limit: '20mb' });
const rawZip = express.raw({ type: ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'], limit: '50mb' });
const actor = (req: AuthRequest) => String(req.userId || 'system');
const requestIp = (req: Request) => req.ip || req.socket?.remoteAddress || 'unknown';
export const requireStudioPermission = (...accepted: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => {
    const enforce = process.env.NODE_ENV !== 'test' && process.env.TEMPLATE_STUDIO_ENFORCE_PERMISSIONS !== 'false';
    if (!enforce) return next();
    const permissions = req.permissions || [];
    // Keep the platform super-admin convention consistent with the frontend
    // (user `admin` or master group `M`). These accounts must not be blocked
    // merely because the newer Template Studio permission rows are absent.
    const isPlatformAdmin = String(req.userId || '').toLowerCase() === 'admin' || String(req.groupId || '').toUpperCase() === 'M';
    if (isPlatformAdmin || permissions.includes('DOCUMENT_TEMPLATE_ADMIN') || accepted.some(permission => permissions.includes(permission))) return next();
    return res.status(403).json({ success: false, message: `Bạn không có quyền Template Studio (${accepted.join(' hoặc ')})` });
};
const id = (value: string) => {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) throw Object.assign(new Error('Invalid identifier'), { status: 400 });
    return parsed;
};

router.get('/mappings', requireStudioPermission('DOCUMENT_TEMPLATE_VIEW'), async (req, res, next) => {
    try { res.json({ success: true, data: await templateStudioService.repository.listMappings({ moduleCode: typeof req.query.moduleCode === 'string' ? req.query.moduleCode : undefined, contractCode: typeof req.query.contractCode === 'string' ? req.query.contractCode : undefined, status: typeof req.query.status === 'string' ? req.query.status : undefined }) }); }
    catch (error) { next(error); }
});
router.post('/mappings', requireStudioPermission('DOCUMENT_TEMPLATE_EDIT'), async (req, res, next) => {
    try { const draft = createMapping({ code: String(req.body?.code || ''), moduleCode: String(req.body?.moduleCode || ''), contractCode: String(req.body?.contractCode || ''), mappings: req.body?.mappings, createdBy: actor(req) }); const saved = await templateStudioService.repository.createMappingDraft(draft); res.status(201).json({ success: true, data: saved }); }
    catch (error) { next(error); }
});
router.post('/mappings/preview', requireStudioPermission('DOCUMENT_TEMPLATE_EDIT'), async (req, res, next) => {
    try { const result = applyMapping(req.body?.mappings, req.body?.sourceData || {}); if (result.errors.length) return res.status(400).json({ success: false, errors: result.errors }); res.json({ success: true, data: result.data }); }
    catch (error) { next(error); }
});
router.post('/mappings/:code/versions', requireStudioPermission('DOCUMENT_TEMPLATE_EDIT'), async (req, res, next) => {
    try { const saved = await templateStudioService.repository.createMappingVersion(req.params.code, req.body?.mappings, actor(req)); res.status(201).json({ success: true, data: saved }); } catch (error) { next(error); }
});
router.post('/mappings/:code/publish', requireStudioPermission('DOCUMENT_TEMPLATE_PUBLISH'), async (req, res, next) => {
    try { res.json({ success: true, data: await templateStudioService.repository.publishMapping(req.params.code) }); } catch (error) { next(error); }
});
router.post('/mappings/:code/retire', requireStudioPermission('DOCUMENT_TEMPLATE_PUBLISH'), async (req, res, next) => {
    try { res.json({ success: true, data: await templateStudioService.repository.retireMapping(req.params.code) }); } catch (error) { next(error); }
});

router.get('/templates', requireStudioPermission('DOCUMENT_TEMPLATE_VIEW'), async (req, res, next) => {
    try { res.json({ success: true, data: await templateStudioService.repository.list({ includeArchived: req.query.includeArchived === 'true', category: typeof req.query.category === 'string' ? req.query.category : undefined, tag: typeof req.query.tag === 'string' ? req.query.tag : undefined, q: typeof req.query.q === 'string' ? req.query.q : undefined, moduleCode: typeof req.query.moduleCode === 'string' ? req.query.moduleCode : undefined, createdBy: typeof req.query.createdBy === 'string' ? req.query.createdBy : undefined, updatedFrom: typeof req.query.updatedFrom === 'string' ? req.query.updatedFrom : undefined, updatedTo: typeof req.query.updatedTo === 'string' ? req.query.updatedTo : undefined, scope: { facility: typeof req.query.facility === 'string' ? req.query.facility : undefined, department: typeof req.query.department === 'string' ? req.query.department : undefined, room: typeof req.query.room === 'string' ? req.query.room : undefined }, limit: Number(req.query.limit) || 500, offset: Number(req.query.offset) || 0 }) }); }
    catch (error) { next(error); }
});
router.get('/templates/export', requireStudioPermission('DOCUMENT_TEMPLATE_VIEW'), async (req, res, next) => {
    try {
        const templates = await templateStudioService.repository.list({ includeArchived: req.query.includeArchived === 'true' });
        const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
        const rows = [
            ['code', 'name', 'documentType', 'moduleCode', 'category', 'tags', 'scope', 'active', 'latestVersion', 'status'],
            ...templates.map(item => [item.code, item.name, item.documentType, item.moduleCode, item.category, (item.tags || []).join('|'), JSON.stringify(item.scope || {}), item.isActive, item.latestVersion?.version, item.latestVersion?.status])
        ];
        res.type('text/csv; charset=utf-8').attachment('template-catalog.csv').send(`\uFEFF${rows.map(row => row.map(escape).join(',')).join('\r\n')}`);
    } catch (error) { next(error); }
});

router.get('/templates/:templateId/versions', requireStudioPermission('DOCUMENT_TEMPLATE_VIEW'), async (req, res, next) => {
    try { res.json({ success: true, data: await templateStudioService.repository.listVersions(id(req.params.templateId)) }); }
    catch (error) { next(error); }
});
router.get('/templates/:templateId/versions/compare', requireStudioPermission('DOCUMENT_TEMPLATE_VIEW'), async (req, res, next) => {
    try {
        const left = await templateStudioService.repository.getVersion(id(String(req.query.left)));
        const right = await templateStudioService.repository.getVersion(id(String(req.query.right)));
        res.json({ success: true, data: {
            left: { id: left.id, version: left.version, status: left.status, artifactKey: left.artifactKey, artifactSize: left.artifactSize, sha256: left.validationResult?.sha256, tags: left.validationResult?.tags || [], contract: left.templateCode, downloadUrl: `/api/template-studio/versions/${left.id}/artifact` },
            right: { id: right.id, version: right.version, status: right.status, artifactKey: right.artifactKey, artifactSize: right.artifactSize, sha256: right.validationResult?.sha256, tags: right.validationResult?.tags || [], contract: right.templateCode, downloadUrl: `/api/template-studio/versions/${right.id}/artifact` },
            changed: { status: left.status !== right.status, artifact: left.artifactKey !== right.artifactKey, checksum: left.validationResult?.sha256 !== right.validationResult?.sha256, tags: JSON.stringify(left.validationResult?.tags || []) !== JSON.stringify(right.validationResult?.tags || []), contract: left.templateCode !== right.templateCode }
        } });
    } catch (error) { next(error); }
});

router.get('/templates/:templateId/audit', requireStudioPermission('DOCUMENT_TEMPLATE_VIEW'), async (req, res, next) => {
    try { res.json({ success: true, data: await templateStudioService.repository.listAudit(id(req.params.templateId)) }); }
    catch (error) { next(error); }
});
router.get('/notifications', requireStudioPermission('DOCUMENT_TEMPLATE_VIEW'), async (req, res, next) => {
    try { res.json({ success: true, data: await templateStudioService.repository.listNotifications(typeof req.query.role === 'string' ? req.query.role : undefined, Number(req.query.limit) || 50) }); }
    catch (error) { next(error); }
});
router.post('/notifications/:notificationId/read', requireStudioPermission('DOCUMENT_TEMPLATE_VIEW'), async (req, res, next) => {
    try { await templateStudioService.repository.markNotificationRead(id(req.params.notificationId)); res.json({ success: true }); }
    catch (error) { next(error); }
});

router.post('/templates', requireStudioPermission('DOCUMENT_TEMPLATE_EDIT'), async (req: AuthRequest, res, next) => {
    try {
        const { code, name, documentType, moduleCode, description, category, tags, scope, sampleData } = req.body || {};
        if (!/^[A-Z][A-Z0-9_]{2,63}$/.test(code || '') || !name || !documentType) throw Object.assign(new Error('code, name and documentType are required'), { status: 400 });
        const duplicate = await templateStudioService.repository.findByCode(String(code));
        if (duplicate) throw Object.assign(new Error(`Template code ${code} already exists`), { status: 409 });
        if (tags !== undefined && (!Array.isArray(tags) || tags.some((tag: unknown) => typeof tag !== 'string'))) throw Object.assign(new Error('tags must be an array of strings'), { status: 400 });
        if (scope !== undefined && (!scope || typeof scope !== 'object' || Array.isArray(scope))) throw Object.assign(new Error('scope must be an object'), { status: 400 });
        const result = await templateStudioService.repository.createTemplate({ code, name, documentType, moduleCode, description, category, tags, scope, sampleData }, actor(req));
        const versionId = typeof result === 'object' ? result.versionId : result;
        const templateId = typeof result === 'object' ? result.templateId : undefined;

        // Auto-seed starter DOCX artifact for this template version
        try {
            const starterBuffer = await templateStudioService.getFallbackTemplateBuffer(code, documentType, name, category, sampleData);
            if (starterBuffer && starterBuffer.length > 0) {
                await templateStudioService.upload(versionId, starterBuffer, actor(req));
            }
        } catch (e) {
            console.warn('Auto starter docx seed notice:', e);
        }

        res.status(201).json({ success: true, data: { templateId, versionId } });
    } catch (error) { next(error); }
});

router.post('/templates/:templateId/versions', requireStudioPermission('DOCUMENT_TEMPLATE_EDIT'), async (req: AuthRequest, res, next) => {
    try {
        const versionId = await templateStudioService.repository.createNextVersion(id(req.params.templateId), actor(req), req.body?.changeNote);
        res.status(201).json({ success: true, data: { versionId } });
    } catch (error) { next(error); }
});
router.put('/templates/:templateId', requireStudioPermission('DOCUMENT_TEMPLATE_EDIT'), async (req: AuthRequest, res, next) => {
    try {
        const { name, documentType, moduleCode, description, category, tags, scope, printConfig } = req.body || {};
        if (!String(name || '').trim() || !String(documentType || '').trim()) throw Object.assign(new Error('name and documentType are required'), { status: 400 });
        if (tags !== undefined && (!Array.isArray(tags) || tags.some((tag: unknown) => typeof tag !== 'string'))) throw Object.assign(new Error('tags must be an array of strings'), { status: 400 });
        if (scope !== undefined && (!scope || typeof scope !== 'object' || Array.isArray(scope))) throw Object.assign(new Error('scope must be an object'), { status: 400 });
        if (printConfig !== undefined && (!printConfig || typeof printConfig !== 'object' || Array.isArray(printConfig))) throw Object.assign(new Error('printConfig must be an object'), { status: 400 });
        await templateStudioService.repository.updateTemplateMetadata(id(req.params.templateId), { name: String(name).trim(), documentType: String(documentType).trim(), moduleCode: String(moduleCode || '').trim() || undefined, description: String(description || '').trim() || undefined, category: String(category || '').trim() || undefined, tags: (tags || []).map((tag: string) => tag.trim()).filter(Boolean), scope, printConfig }, actor(req));
        res.json({ success: true });
    } catch (error) { next(error); }
});
router.post('/templates/:templateId/archive', requireStudioPermission('DOCUMENT_TEMPLATE_EDIT'), async (req: AuthRequest, res, next) => {
    try { await templateStudioService.repository.setActive(id(req.params.templateId), false, actor(req)); res.json({ success: true }); }
    catch (error) { next(error); }
});
router.post('/templates/:templateId/activate', requireStudioPermission('DOCUMENT_TEMPLATE_EDIT'), async (req: AuthRequest, res, next) => {
    try { await templateStudioService.repository.setActive(id(req.params.templateId), true, actor(req)); res.json({ success: true }); }
    catch (error) { next(error); }
});
router.post('/templates/:templateId/clone', requireStudioPermission('DOCUMENT_TEMPLATE_EDIT'), async (req: AuthRequest, res, next) => {
    try {
        const code = String(req.body?.code || '').trim().toUpperCase();
        const name = String(req.body?.name || '').trim();
        if (!/^[A-Z][A-Z0-9_]{2,63}$/.test(code) || !name) throw Object.assign(new Error('Valid code and name are required'), { status: 400 });
        if (await templateStudioService.repository.findByCode(code)) throw Object.assign(new Error(`Template code ${code} already exists`), { status: 409 });
        const versionId = await templateStudioService.repository.cloneTemplate(id(req.params.templateId), code, name, actor(req));
        res.status(201).json({ success: true, data: { versionId } });
    } catch (error) { next(error); }
});

router.get('/contracts/:code/fields', requireStudioPermission('DOCUMENT_TEMPLATE_VIEW'), async (req, res, next) => {
    try {
        const contract = await templateStudioService.contracts.get(req.params.code);
        res.json({ success: true, data: { code: contract.code, fields: contract.fields, sampleData: contract.sampleData, jsonSchema: contract.jsonSchema } });
    } catch (error) { next(error); }
});
router.get('/contracts', requireStudioPermission('DOCUMENT_TEMPLATE_VIEW'), async (_req, res, next) => {
    try { res.json({ success: true, data: await templateStudioService.repository.listContracts() }); } catch (error) { next(error); }
});
router.post('/contracts/preview', requireStudioPermission('DOCUMENT_TEMPLATE_EDIT'), async (req, res, next) => {
    try {
        const sampleData = req.body?.sampleData;
        if (!sampleData || typeof sampleData !== 'object' || Array.isArray(sampleData)) throw Object.assign(new Error('sampleData must be a JSON object'), { status: 400 });
        const schema = buildJsonSchema(sampleData);
        res.json({ success: true, data: { sampleData, jsonSchema: schema } });
    } catch (error) { next(error); }
});
router.post('/contracts', requireStudioPermission('DOCUMENT_TEMPLATE_EDIT'), async (req: AuthRequest, res, next) => {
    try {
        const code = String(req.body?.code || '').trim().toUpperCase();
        const name = String(req.body?.name || code).trim();
        const version = Number(req.body?.version || 1);
        const sampleData = req.body?.sampleData;
        if (!/^[A-Z][A-Z0-9_]{2,63}$/.test(code) || !Number.isInteger(version) || version < 1) throw Object.assign(new Error('Invalid contract code/version'), { status: 400 });
        if (!sampleData || typeof sampleData !== 'object' || Array.isArray(sampleData)) throw Object.assign(new Error('sampleData must be a JSON object'), { status: 400 });
        const result = await templateStudioService.repository.createContract({ code, name, version, sampleData, schema: buildJsonSchema(sampleData) }, actor(req));
        res.status(201).json({ success: true, data: result });
    } catch (error) { next(error); }
});
router.post('/contracts/:contractId/versions', requireStudioPermission('DOCUMENT_TEMPLATE_EDIT'), async (req: AuthRequest, res, next) => {
    try { res.status(201).json({ success: true, data: await templateStudioService.repository.createContractVersion(id(req.params.contractId), actor(req)) }); }
    catch (error) { next(error); }
});
router.put('/contracts/:contractId', requireStudioPermission('DOCUMENT_TEMPLATE_EDIT'), async (req: AuthRequest, res, next) => {
    try {
        const name = String(req.body?.name || '').trim();
        const schema = req.body?.jsonSchema;
        if (!name || !schema || typeof schema !== 'object' || Array.isArray(schema)) throw Object.assign(new Error('name and jsonSchema are required'), { status: 400 });
        await templateStudioService.repository.updateContract(id(req.params.contractId), { name, schema, sampleData: req.body?.sampleData }, actor(req));
        res.json({ success: true });
    } catch (error) { next(error); }
});
router.post('/contracts/:contractId/publish', requireStudioPermission('DOCUMENT_TEMPLATE_PUBLISH'), async (req: AuthRequest, res, next) => {
    try { await templateStudioService.repository.transitionContract(id(req.params.contractId), 'PUBLISHED', actor(req)); res.json({ success: true }); } catch (error) { next(error); }
});
router.post('/contracts/:contractId/retire', requireStudioPermission('DOCUMENT_TEMPLATE_PUBLISH'), async (req: AuthRequest, res, next) => {
    try { await templateStudioService.repository.transitionContract(id(req.params.contractId), 'RETIRED', actor(req)); res.json({ success: true }); } catch (error) { next(error); }
});

router.put('/versions/:versionId/artifact', requireStudioPermission('DOCUMENT_TEMPLATE_EDIT'), rawDocx, async (req: AuthRequest, res, next) => {
    try {
        if (!Buffer.isBuffer(req.body) || !req.body.length) throw Object.assign(new Error('DOCX body is required'), { status: 400 });
        const validation = await templateStudioService.upload(id(req.params.versionId), req.body, actor(req));
        res.json({ success: true, data: validation });
    } catch (error) { next(error); }
});

router.get('/versions/:versionId/artifact', requireStudioPermission('DOCUMENT_TEMPLATE_VIEW'), async (req, res, next) => {
    try {
        const result = await templateStudioService.download(id(req.params.versionId), actor(req as AuthRequest), requestIp(req));
        res.type('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.attachment(result.filename).send(result.content);
    } catch (error) { next(error); }
});
router.get('/versions/:versionId/artifact/signed-url', requireStudioPermission('DOCUMENT_TEMPLATE_VIEW'), async (req, res, next) => {
    try { res.json({ success: true, data: { url: await templateStudioService.artifactSignedUrl(id(req.params.versionId), Number(req.query.expiresIn) || 300, actor(req as AuthRequest), requestIp(req)) } }); }
    catch (error) { next(error); }
});

router.get('/versions/:versionId/package', requireStudioPermission('DOCUMENT_TEMPLATE_VIEW'), async (req, res, next) => {
    try {
        const result = await templateStudioService.exportPackage(id(req.params.versionId), actor(req as AuthRequest));
        res.type('application/zip');
        res.setHeader('X-Package-Manifest', JSON.stringify(result.manifest));
        res.attachment(result.filename).send(result.buffer);
    } catch (error) { next(error); }
});

router.post('/packages/preview', requireStudioPermission('DOCUMENT_TEMPLATE_EDIT'), rawZip, async (req: AuthRequest, res, next) => {
    try {
        let buffer: Buffer;
        if (Buffer.isBuffer(req.body) && req.body.length > 0) {
            buffer = req.body;
        } else if (req.body?.packageBase64) {
            buffer = Buffer.from(req.body.packageBase64, 'base64');
        } else {
            throw Object.assign(new Error('Package ZIP payload is required'), { status: 400 });
        }
        const result = await templateStudioService.previewPackage(buffer);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

router.post('/packages/import', requireStudioPermission('DOCUMENT_TEMPLATE_EDIT'), rawZip, async (req: AuthRequest, res, next) => {
    try {
        let buffer: Buffer;
        if (Buffer.isBuffer(req.body) && req.body.length > 0) {
            buffer = req.body;
        } else if (req.body?.packageBase64) {
            buffer = Buffer.from(req.body.packageBase64, 'base64');
        } else {
            throw Object.assign(new Error('Package ZIP payload is required'), { status: 400 });
        }
        const result = await templateStudioService.importPackage(buffer, actor(req));
        res.status(201).json({ success: true, data: result });
    } catch (error) { next(error); }
});

router.get('/starter-pack', requireStudioPermission('DOCUMENT_TEMPLATE_VIEW'), async (req, res, next) => {
    try {
        const code = typeof req.query.code === 'string' ? req.query.code : undefined;
        const result = await templateStudioService.generateStarterPack(code);
        res.type('application/zip');
        res.attachment(result.filename).send(result.buffer);
    } catch (error) { next(error); }
});

router.get('/test-runs/:testRunId/artifact', requireStudioPermission('DOCUMENT_TEMPLATE_VIEW'), async (req, res, next) => {
    try {
        const run = await templateStudioService.repository.getTestRun(id(req.params.testRunId));
        if (!run) throw Object.assign(new Error('Test run not found'), { status: 404 });
        const format = req.query.format === 'docx' ? 'docx' : 'pdf';
        const key = format === 'docx' ? run.docxSha256 : run.pdfSha256;
        const storageKey = format === 'docx' ? (run as any).docxKey || (run as any).docx_key : (run as any).pdfKey || (run as any).pdf_key;
        if (!storageKey) throw Object.assign(new Error(`Test run has no ${format.toUpperCase()} artifact`), { status: 404 });
        const content = await templateStudioService.storage.get(storageKey);
        res.type(format === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf');
        res.attachment(`test-run-${run.id}.${format}`).send(content);
    } catch (error) { next(error); }
});

router.put('/versions/:versionId/sample-data', requireStudioPermission('DOCUMENT_TEMPLATE_EDIT'), async (req: AuthRequest, res, next) => {
    try {
        if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) throw Object.assign(new Error('Sample data must be a JSON object'), { status: 400 });
        await templateStudioService.repository.updateSampleData(id(req.params.versionId), req.body, actor(req));
        res.json({ success: true });
    } catch (error) { next(error); }
});

router.get('/versions/:versionId/test-cases', requireStudioPermission('DOCUMENT_TEMPLATE_VIEW'), async (req, res, next) => {
    try { res.json({ success: true, data: await templateStudioService.repository.listTestCases(id(req.params.versionId)) }); }
    catch (error) { next(error); }
});

router.get('/versions/:versionId/test-runs', requireStudioPermission('DOCUMENT_TEMPLATE_VIEW'), async (req, res, next) => {
    try { res.json({ success: true, data: await templateStudioService.repository.listTestRuns(id(req.params.versionId)) }); }
    catch (error) { next(error); }
});

router.post('/versions/:versionId/test-cases', requireStudioPermission('DOCUMENT_TEMPLATE_TEST'), async (req: AuthRequest, res, next) => {
    try {
        const { id: testCaseId, name, testType = 'NORMAL', inputData, isRequired = true } = req.body || {};
        if (!name || !inputData || typeof inputData !== 'object' || Array.isArray(inputData)) throw Object.assign(new Error('name and object inputData are required'), { status: 400 });
        const resultId = await templateStudioService.repository.upsertTestCase(id(req.params.versionId), { id: testCaseId, name, testType, inputData, isRequired: Boolean(isRequired) }, actor(req));
        res.status(testCaseId ? 200 : 201).json({ success: true, data: { id: resultId } });
    } catch (error) { next(error); }
});

router.post('/versions/:versionId/test-runs', requireStudioPermission('DOCUMENT_TEMPLATE_TEST'), async (req: AuthRequest, res, next) => {
    try {
        const { testCaseId, data } = req.body || {};
        if (!data || typeof data !== 'object' || Array.isArray(data)) throw Object.assign(new Error('data must be a JSON object'), { status: 400 });
        const result = await templateStudioService.runTest(id(req.params.versionId), testCaseId ? id(String(testCaseId)) : undefined, data, actor(req));
        res.status(201).json({ success: true, data: result });
    } catch (error) { next(error); }
});
router.delete('/test-cases/:testCaseId', requireStudioPermission('DOCUMENT_TEMPLATE_EDIT'), async (req: AuthRequest, res, next) => {
    try { await templateStudioService.repository.deleteTestCase(id(req.params.testCaseId), actor(req)); res.json({ success: true }); }
    catch (error) { next(error); }
});
router.post('/test-cases/:testCaseId/clone', requireStudioPermission('DOCUMENT_TEMPLATE_EDIT'), async (req: AuthRequest, res, next) => {
    try { res.status(201).json({ success: true, data: { id: await templateStudioService.repository.cloneTestCase(id(req.params.testCaseId), actor(req)) } }); }
    catch (error) { next(error); }
});
router.post('/versions/:versionId/test-runs/all', requireStudioPermission('DOCUMENT_TEMPLATE_TEST'), async (req: AuthRequest, res, next) => {
    try { res.status(201).json({ success: true, data: await templateStudioService.runAllTests(id(req.params.versionId), actor(req)) }); }
    catch (error) { next(error); }
});

router.post('/versions/:versionId/preview', requireStudioPermission('DOCUMENT_TEMPLATE_TEST'), async (req, res, next) => {
    try {
        const format = req.body?.format;
        if (format !== 'docx' && format !== 'pdf') throw Object.assign(new Error('format must be docx or pdf'), { status: 400 });
        const result = await templateStudioService.preview(id(req.params.versionId), format, req.body?.data, actor(req as AuthRequest), requestIp(req));
        res.type(format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('X-Artifact-SHA256', result.sha256);
        res.attachment(result.filename).send(result.content);
    } catch (error) { next(error); }
});

router.post('/versions/:versionId/preview/jobs', requireStudioPermission('DOCUMENT_TEMPLATE_TEST'), async (req: AuthRequest, res, next) => {
    try {
        const format = req.body?.format;
        if (format !== 'docx' && format !== 'pdf') throw Object.assign(new Error('format must be docx or pdf'), { status: 400 });
        const result = await enqueueTemplatePreview({ versionId: id(req.params.versionId), format, data: req.body?.data, actor: actor(req), idempotencyKey: typeof req.body?.idempotencyKey === 'string' ? req.body.idempotencyKey : undefined });
        res.status(202).json({ success: true, data: result });
    } catch (error) { next(error); }
});
router.delete('/versions/:versionId', requireStudioPermission('DOCUMENT_TEMPLATE_EDIT'), async (req: AuthRequest, res, next) => {
    try {
        await templateStudioService.deleteVersion(id(req.params.versionId), actor(req));
        res.json({ success: true });
    } catch (error) { next(error); }
});

router.post('/versions/:versionId/rollback', requireStudioPermission('DOCUMENT_TEMPLATE_PUBLISH'), async (req: AuthRequest, res, next) => {
    try { await templateStudioService.rollback(id(req.params.versionId), actor(req), req.body?.reason); res.json({ success: true }); }
    catch (error) { next(error); }
});

router.get('/preview/jobs/:jobId', requireStudioPermission('DOCUMENT_TEMPLATE_TEST'), async (req, res, next) => {
    try { res.json({ success: true, data: await getTemplatePreviewJob(req.params.jobId) }); }
    catch (error) { next(error); }
});
router.get('/preview/jobs/:jobId/artifact', requireStudioPermission('DOCUMENT_TEMPLATE_TEST'), async (req, res, next) => {
    try {
        const job = await getTemplatePreviewJob(req.params.jobId);
        const key = (job.result as any)?.artifactKey;
        if (job.state !== 'completed' || !key) throw Object.assign(new Error('Preview artifact is not ready'), { status: 409 });
        const content = await templateStudioService.storage.get(key);
        res.type((job.result as any).filename?.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document').send(content);
    } catch (error) { next(error); }
});
router.get('/preview/dlq', requireStudioPermission('DOCUMENT_TEMPLATE_ADMIN'), async (req, res, next) => {
    try { res.json({ success: true, data: await listTemplatePreviewDlq(Number(req.query.limit) || 50) }); } catch (error) { next(error); }
});
router.post('/preview/dlq/:jobId/retry', requireStudioPermission('DOCUMENT_TEMPLATE_ADMIN'), async (req, res, next) => {
    try { res.status(202).json({ success: true, data: await retryTemplatePreviewDlq(req.params.jobId) }); } catch (error) { next(error); }
});
router.get('/preview/metrics', requireStudioPermission('DOCUMENT_TEMPLATE_ADMIN'), async (_req, res, next) => {
    try { res.json({ success: true, data: await getTemplatePreviewQueueMetrics() }); } catch (error) { next(error); }
});
router.get('/preview/metrics/latency', requireStudioPermission('DOCUMENT_TEMPLATE_ADMIN'), async (_req, res, next) => {
    try { res.json({ success: true, data: await templateStudioService.repository.renderLatencyMetrics() }); } catch (error) { next(error); }
});
router.get('/metrics/summary', requireStudioPermission('DOCUMENT_TEMPLATE_ADMIN'), async (_req, res, next) => {
    try { res.json({ success: true, data: await templateStudioService.metricsSummary() }); } catch (error) { next(error); }
});
router.get('/metrics/usage', requireStudioPermission('DOCUMENT_TEMPLATE_ADMIN'), async (req, res, next) => {
    try { res.json({ success: true, data: await templateStudioService.repository.usageSummary(Number(req.query.limit) || 100) }); }
    catch (error) { next(error); }
});
router.get('/metrics/storage', requireStudioPermission('DOCUMENT_TEMPLATE_ADMIN'), async (_req, res, next) => {
    try { res.json({ success: true, data: await templateStudioService.storageCapacity() }); } catch (error) { next(error); }
});
router.get('/artifacts', requireStudioPermission('DOCUMENT_TEMPLATE_ADMIN'), async (req, res, next) => {
    try {
        const templateId = req.query.templateId ? id(String(req.query.templateId)) : undefined;
        const artifacts = await templateStudioService.repository.listArtifacts(templateId);
        const data = await Promise.all(artifacts.map(async artifact => ({ ...artifact, storageExists: artifact.artifactKey ? await templateStudioService.storage.exists(artifact.artifactKey) : false })));
        res.json({ success: true, data });
    } catch (error) { next(error); }
});
router.get('/health', async (_req, res) => {
    const carboneUrl = process.env.CARBONE_URL || 'http://127.0.0.1:4000';
    let carbone = 'unknown';
    let redis = 'disabled';
    try { const response = await fetch(`${carboneUrl}/`, { signal: AbortSignal.timeout(1500) }); carbone = response.ok ? 'up' : 'down'; }
    catch { carbone = 'down'; }
    if (process.env.REDIS_URL) {
        try { await getTemplatePreviewQueueMetrics(); redis = 'up'; } catch { redis = 'down'; }
    }
    const ready = carbone === 'up' && redis !== 'down';
    res.status(ready ? 200 : 503).json({ success: ready, data: { carbone, redis, queueEnabled: redis === 'up', carboneVersion: process.env.CARBONE_VERSION || 'configured externally', converter: process.env.CARBONE_CONVERTER === 'O' ? 'LibreOffice' : 'Carbone', timestamp: new Date().toISOString() } });
});

// Workflow Governance Endpoints
router.get('/inbox', requireStudioPermission('DOCUMENT_TEMPLATE_VIEW'), async (req: AuthRequest, res, next) => {
    try {
        const result = await templateStudioService.getInbox(actor(req), {
            facilityId: req.query.facilityId ? String(req.query.facilityId) : undefined,
            departmentId: req.query.departmentId ? String(req.query.departmentId) : undefined
        });
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

router.post('/versions/:versionId/assignments', requireStudioPermission('DOCUMENT_TEMPLATE_EDIT'), async (req: AuthRequest, res, next) => {
    try {
        await templateStudioService.updateAssignments(id(req.params.versionId), req.body || {}, actor(req));
        res.json({ success: true });
    } catch (error) { next(error); }
});

router.get('/versions/:versionId/comments', requireStudioPermission('DOCUMENT_TEMPLATE_VIEW'), async (req, res, next) => {
    try {
        const comments = await templateStudioService.getComments(id(req.params.versionId));
        res.json({ success: true, data: comments });
    } catch (error) { next(error); }
});

router.post('/versions/:versionId/comments', requireStudioPermission('DOCUMENT_TEMPLATE_VIEW'), async (req: AuthRequest, res, next) => {
    try {
        const comment = await templateStudioService.addComment(id(req.params.versionId), req.body || {}, actor(req));
        res.json({ success: true, data: comment });
    } catch (error) { next(error); }
});

router.post('/versions/:versionId/checklist', requireStudioPermission('DOCUMENT_TEMPLATE_REVIEW'), async (req: AuthRequest, res, next) => {
    try {
        await templateStudioService.updateReviewChecklist(id(req.params.versionId), req.body || {}, actor(req));
        res.json({ success: true });
    } catch (error) { next(error); }
});

router.get('/permissions/users', requireStudioPermission('DOCUMENT_TEMPLATE_ADMIN'), async (req, res, next) => {
    try {
        const data = await templateStudioService.listUserPermissions(req.query.userId ? String(req.query.userId) : undefined);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.post('/permissions/users', requireStudioPermission('DOCUMENT_TEMPLATE_ADMIN'), async (req: AuthRequest, res, next) => {
    try {
        const result = await templateStudioService.grantUserPermission(req.body || {}, actor(req));
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

router.delete('/permissions/users/:id', requireStudioPermission('DOCUMENT_TEMPLATE_ADMIN'), async (req: AuthRequest, res, next) => {
    try {
        await templateStudioService.revokeUserPermission(id(req.params.id), actor(req));
        res.json({ success: true });
    } catch (error) { next(error); }
});

router.get('/notifications', requireStudioPermission('DOCUMENT_TEMPLATE_VIEW'), async (req: AuthRequest, res, next) => {
    try {
        const data = await templateStudioService.getNotifications(actor(req), Number(req.query.limit) || 50);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.post('/notifications/:id/read', requireStudioPermission('DOCUMENT_TEMPLATE_VIEW'), async (req: AuthRequest, res, next) => {
    try {
        await templateStudioService.markNotificationRead(id(req.params.id), actor(req));
        res.json({ success: true });
    } catch (error) { next(error); }
});

router.post('/scheduled-publishes/process', requireStudioPermission('DOCUMENT_TEMPLATE_ADMIN'), async (_req, res, next) => {
    try {
        const count = await templateStudioService.processScheduledPublishes();
        res.json({ success: true, data: { publishedCount: count } });
    } catch (error) { next(error); }
});

router.get('/metrics/operations', requireStudioPermission('DOCUMENT_TEMPLATE_VIEW'), async (_req, res, next) => {
    try {
        const data = await templateStudioService.getOperationsDashboardMetrics();
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.get('/artifacts/orphans', requireStudioPermission('DOCUMENT_TEMPLATE_ADMIN'), async (_req, res, next) => {
    try {
        const data = await templateStudioService.listOrphanArtifacts();
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.post('/artifacts/orphans/cleanup', requireStudioPermission('DOCUMENT_TEMPLATE_ADMIN'), async (req: AuthRequest, res, next) => {
    try {
        const keys = Array.isArray(req.body?.keys) ? req.body.keys : undefined;
        const cleanedCount = await templateStudioService.cleanupOrphanArtifacts(actor(req), keys);
        res.json({ success: true, data: { cleanedCount } });
    } catch (error) { next(error); }
});

router.get('/versions/:versionId/artifact/signed-url', requireStudioPermission('DOCUMENT_TEMPLATE_VIEW'), async (req: AuthRequest, res, next) => {
    try {
        const ttl = Number(req.query.expiresIn) || 300;
        const url = await templateStudioService.generateSignedArtifactUrl(id(req.params.versionId), ttl);
        res.json({ success: true, data: { signedUrl: url, expiresInSeconds: ttl } });
    } catch (error) { next(error); }
});

for (const transition of [
    { path: 'submit', expected: ['DRAFT'], next: 'IN_REVIEW' },
    { path: 'approve', expected: ['IN_REVIEW'], next: 'APPROVED' },
    { path: 'reject', expected: ['IN_REVIEW', 'APPROVED'], next: 'DRAFT' },
    { path: 'publish', expected: ['APPROVED'], next: 'PUBLISHED' },
    { path: 'retire', expected: ['PUBLISHED'], next: 'RETIRED' }
] as const) {
    const permission = transition.path === 'submit' ? 'DOCUMENT_TEMPLATE_EDIT' : transition.path === 'approve' || transition.path === 'reject' ? 'DOCUMENT_TEMPLATE_REVIEW' : 'DOCUMENT_TEMPLATE_PUBLISH';
    router.post(`/versions/:versionId/${transition.path}`, requireStudioPermission(permission), async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (transition.path === 'approve') {
                const version = await templateStudioService.repository.getVersion(id(req.params.versionId));
                const warnings = version.validationResult?.warnings || [];
                if (warnings.length && req.body?.confirmWarnings !== true) throw Object.assign(new Error(`Reviewer must confirm ${warnings.length} validation warning(s)`), { status: 409, details: warnings });
            }
            const note = typeof req.body?.note === 'string' && req.body.note.trim() ? req.body.note.trim() : (typeof req.body?.changeNote === 'string' && req.body.changeNote.trim() ? req.body.changeNote.trim() : 'Cập nhật biểu mẫu');
            if (transition.path === 'reject' && !req.body?.note) throw Object.assign(new Error('Reviewer comment is required when rejecting a template'), { status: 400 });
            await templateStudioService.transition(id(req.params.versionId), [...transition.expected], transition.next, actor(req), note);
            res.json({ success: true });
        } catch (error) { next(error); }
    });
}

export default router;
