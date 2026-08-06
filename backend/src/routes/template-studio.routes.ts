import express, { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { templateStudioService } from '../template-studio/template-studio.service';

const router = express.Router();
const rawDocx = express.raw({ type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', limit: '20mb' });
const actor = (req: AuthRequest) => String(req.userId || 'system');
const requireStudioPermission = (...accepted: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => {
    const enforce = process.env.NODE_ENV === 'production' || process.env.TEMPLATE_STUDIO_ENFORCE_PERMISSIONS === 'true';
    if (!enforce) return next();
    const permissions = req.permissions || [];
    if (permissions.includes('DOCUMENT_TEMPLATE_ADMIN') || accepted.some(permission => permissions.includes(permission))) return next();
    return res.status(403).json({ success: false, message: `Bạn không có quyền Template Studio (${accepted.join(' hoặc ')})` });
};
const id = (value: string) => {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) throw Object.assign(new Error('Invalid identifier'), { status: 400 });
    return parsed;
};

router.get('/templates', async (_req, res, next) => {
    try { res.json({ success: true, data: await templateStudioService.repository.list() }); }
    catch (error) { next(error); }
});

router.get('/templates/:templateId/versions', async (req, res, next) => {
    try { res.json({ success: true, data: await templateStudioService.repository.listVersions(id(req.params.templateId)) }); }
    catch (error) { next(error); }
});

router.get('/templates/:templateId/audit', async (req, res, next) => {
    try { res.json({ success: true, data: await templateStudioService.repository.listAudit(id(req.params.templateId)) }); }
    catch (error) { next(error); }
});

router.post('/templates', requireStudioPermission('DOCUMENT_TEMPLATE_EDIT'), async (req: AuthRequest, res, next) => {
    try {
        const { code, name, documentType, moduleCode, description, sampleData } = req.body || {};
        if (!/^[A-Z][A-Z0-9_]{2,63}$/.test(code || '') || !name || !documentType) throw Object.assign(new Error('code, name and documentType are required'), { status: 400 });
        const versionId = await templateStudioService.repository.createTemplate({ code, name, documentType, moduleCode, description, sampleData }, actor(req));
        res.status(201).json({ success: true, data: { versionId } });
    } catch (error) { next(error); }
});

router.post('/templates/:templateId/versions', requireStudioPermission('DOCUMENT_TEMPLATE_EDIT'), async (req: AuthRequest, res, next) => {
    try {
        const versionId = await templateStudioService.repository.createNextVersion(id(req.params.templateId), actor(req), req.body?.changeNote);
        res.status(201).json({ success: true, data: { versionId } });
    } catch (error) { next(error); }
});

router.get('/contracts/:code/fields', async (req, res, next) => {
    try {
        const contract = await templateStudioService.contracts.get(req.params.code);
        res.json({ success: true, data: { code: contract.code, fields: contract.fields, sampleData: contract.sampleData } });
    } catch (error) { next(error); }
});

router.put('/versions/:versionId/artifact', requireStudioPermission('DOCUMENT_TEMPLATE_EDIT'), rawDocx, async (req: AuthRequest, res, next) => {
    try {
        if (!Buffer.isBuffer(req.body) || !req.body.length) throw Object.assign(new Error('DOCX body is required'), { status: 400 });
        const validation = await templateStudioService.upload(id(req.params.versionId), req.body, actor(req));
        res.json({ success: true, data: validation });
    } catch (error) { next(error); }
});

router.get('/versions/:versionId/artifact', async (req, res, next) => {
    try {
        const result = await templateStudioService.download(id(req.params.versionId));
        res.type('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.attachment(result.filename).send(result.content);
    } catch (error) { next(error); }
});

router.put('/versions/:versionId/sample-data', requireStudioPermission('DOCUMENT_TEMPLATE_EDIT'), async (req: AuthRequest, res, next) => {
    try {
        if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) throw Object.assign(new Error('Sample data must be a JSON object'), { status: 400 });
        await templateStudioService.repository.updateSampleData(id(req.params.versionId), req.body, actor(req));
        res.json({ success: true });
    } catch (error) { next(error); }
});

router.get('/versions/:versionId/test-cases', async (req, res, next) => {
    try { res.json({ success: true, data: await templateStudioService.repository.listTestCases(id(req.params.versionId)) }); }
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

router.post('/versions/:versionId/preview', requireStudioPermission('DOCUMENT_TEMPLATE_TEST'), async (req, res, next) => {
    try {
        const format = req.body?.format;
        if (format !== 'docx' && format !== 'pdf') throw Object.assign(new Error('format must be docx or pdf'), { status: 400 });
        const result = await templateStudioService.preview(id(req.params.versionId), format, req.body?.data);
        res.type(format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('X-Artifact-SHA256', result.sha256);
        res.attachment(result.filename).send(result.content);
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
            await templateStudioService.repository.transition(id(req.params.versionId), [...transition.expected], transition.next, actor(req));
            res.json({ success: true });
        } catch (error) { next(error); }
    });
}

export default router;
