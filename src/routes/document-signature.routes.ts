import express, { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { signatureService } from '../document-signature/signature.service';
import { PlaceholderRepository } from '../document-signature/placeholder.repository';
import { pdfSigningClient } from '../document-signature/signing-client';
import { signaturePackagingService } from '../document-signature/signature-packaging.service';

const router = express.Router();
const actor = (req: AuthRequest) => String(req.userId || 'system');
export const requireSignaturePermission = (...accepted: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => {
    const enforce = process.env.NODE_ENV !== 'test' && process.env.DOCUMENT_SIGNATURE_ENFORCE_PERMISSIONS !== 'false';
    if (!enforce) return next();
    const permissions = req.permissions || [];
    const isPlatformAdmin = String(req.userId || '').toLowerCase() === 'admin' || String(req.groupId || '').toUpperCase() === 'M';
    if (isPlatformAdmin || permissions.includes('DOCUMENT_SIGNATURE_ADMIN') || accepted.some(permission => permissions.includes(permission))) return next();
    return res.status(403).json({ success: false, message: `Thiếu quyền ký số (${accepted.join(' hoặc ')})` });
};
const ip = (req: Request) => req.ip || req.socket?.remoteAddress || 'unknown';
const placeholders = new PlaceholderRepository();
const validatePlaceholderGeometry = (body: any) => { const values = ['pageIndex', 'x1Pt', 'y1Pt', 'x2Pt', 'y2Pt', 'pageWidthPt', 'pageHeightPt', 'pageRotation'].map(key => Number(body[key])); if (values.some(value => !Number.isFinite(value))) throw Object.assign(new Error('Placeholder geometry must be numeric'), { status: 422, code: 'INVALID_PLACEHOLDER_GEOMETRY' }); const [pageIndex, x1, y1, x2, y2, width, height, rotation] = values; if (pageIndex < 0 || width <= 0 || height <= 0 || x1 < 0 || y1 < 0 || x2 <= x1 || y2 <= y1 || x2 > width || y2 > height || ![0, 90, 180, 270].includes(rotation)) throw Object.assign(new Error('Placeholder geometry is outside page'), { status: 422, code: 'INVALID_PLACEHOLDER_GEOMETRY' }); };

router.get('/template-versions/:versionId/placeholders', requireSignaturePermission('DOCUMENT_SIGNATURE_VIEW'), async (req, res, next) => { try { res.json({ success: true, data: await placeholders.list(Number(req.params.versionId)) }); } catch (error) { next(error); } });
router.get('/health', requireSignaturePermission('DOCUMENT_SIGNATURE_VIEW'), async (_req, res) => { try { const data = await pdfSigningClient.readiness(); res.json({ success: true, data }); } catch (error: any) { res.status(error.status === 503 ? 503 : 502).json({ success: false, code: error.code || 'SIGNING_SERVICE_UNAVAILABLE', message: error.message }); } });
router.get('/provider-info', requireSignaturePermission('DOCUMENT_SIGNATURE_VIEW'), async (_req, res) => { try { const data = await pdfSigningClient.providerInfo(); res.json({ success: true, data }); } catch (error: any) { res.status(error.status === 503 ? 503 : 502).json({ success: false, code: error.code || 'SIGNING_PROVIDER_INFO_UNAVAILABLE', message: error.message }); } });
router.post('/template-versions/:versionId/placeholders', requireSignaturePermission('DOCUMENT_SIGNATURE_PLACEHOLDER_MANAGE'), async (req: AuthRequest, res, next) => { try { const body = req.body || {}; validatePlaceholderGeometry({ ...body, pageRotation: body.pageRotation || 0 }); const data = await placeholders.create(Number(req.params.versionId), { ...body, templateId: body.templateId ? Number(body.templateId) : undefined, pageIndex: Number(body.pageIndex), x1Pt: Number(body.x1Pt), y1Pt: Number(body.y1Pt), x2Pt: Number(body.x2Pt), y2Pt: Number(body.y2Pt), pageWidthPt: Number(body.pageWidthPt), pageHeightPt: Number(body.pageHeightPt), pageRotation: Number(body.pageRotation || 0) }, actor(req)); res.status(201).json({ success: true, data }); } catch (error) { next(error); } });
router.delete('/placeholders/:placeholderId', requireSignaturePermission('DOCUMENT_SIGNATURE_PLACEHOLDER_MANAGE'), async (req, res, next) => { try { res.json({ success: true, data: await placeholders.retire(Number(req.params.placeholderId)) }); } catch (error) { next(error); } });
router.put('/placeholders/:placeholderId', requireSignaturePermission('DOCUMENT_SIGNATURE_PLACEHOLDER_MANAGE'), async (req, res, next) => { try { const body = req.body || {}; if (['pageIndex', 'x1Pt', 'y1Pt', 'x2Pt', 'y2Pt', 'pageWidthPt', 'pageHeightPt', 'pageRotation'].some(key => body[key] !== undefined)) validatePlaceholderGeometry({ ...body, pageIndex: body.pageIndex ?? 0, x1Pt: body.x1Pt ?? 0, y1Pt: body.y1Pt ?? 0, x2Pt: body.x2Pt ?? 1, y2Pt: body.y2Pt ?? 1, pageWidthPt: body.pageWidthPt ?? 1, pageHeightPt: body.pageHeightPt ?? 1, pageRotation: body.pageRotation ?? 0 }); const data = await placeholders.update(Number(req.params.placeholderId), { ...body, pageIndex: body.pageIndex === undefined ? undefined : Number(body.pageIndex), x1Pt: body.x1Pt === undefined ? undefined : Number(body.x1Pt), y1Pt: body.y1Pt === undefined ? undefined : Number(body.y1Pt), x2Pt: body.x2Pt === undefined ? undefined : Number(body.x2Pt), y2Pt: body.y2Pt === undefined ? undefined : Number(body.y2Pt), pageWidthPt: body.pageWidthPt === undefined ? undefined : Number(body.pageWidthPt), pageHeightPt: body.pageHeightPt === undefined ? undefined : Number(body.pageHeightPt), pageRotation: body.pageRotation === undefined ? undefined : Number(body.pageRotation) }); res.json({ success: true, data }); } catch (error) { next(error); } });

router.post('/documents/:documentId/signing-sessions', requireSignaturePermission('DOCUMENT_SIGNATURE_SIGN'), async (req: AuthRequest, res, next) => {
    try {
        const body = req.body || {};
        const session = await signatureService.createSession({ documentId: req.params.documentId, documentVersion: Number(body.documentVersion), documentSha256: String(body.documentSha256 || ''), sourceArtifactKey: String(body.sourceArtifactKey || ''), expiresAt: new Date(body.expiresAt || Date.now() + 15 * 60 * 1000), createdBy: actor(req) });
        res.status(201).json({ success: true, data: session });
    } catch (error) { next(error); }
});

router.get('/signing-sessions/:sessionId', requireSignaturePermission('DOCUMENT_SIGNATURE_VIEW'), async (req, res, next) => {
    try { const session = await signatureService.repository.getSession(req.params.sessionId); const requests = await signatureService.repository.listRequests(req.params.sessionId); res.json({ success: true, data: { session, requests } }); }
    catch (error) { next(error); }
});
router.get('/signing-sessions/:sessionId/audit', requireSignaturePermission('DOCUMENT_SIGNATURE_AUDIT_VIEW'), async (req, res, next) => { try { res.json({ success: true, data: await signatureService.repository.listAudit(req.params.sessionId) }); } catch (error) { next(error); } });
router.post('/signing-sessions/:sessionId/cancel', requireSignaturePermission('DOCUMENT_SIGNATURE_SIGN'), async (req: AuthRequest, res, next) => { try { res.json({ success: true, data: await signatureService.cancelSession(req.params.sessionId, actor(req)) }); } catch (error) { next(error); } });
router.get('/signature-requests/:requestId', requireSignaturePermission('DOCUMENT_SIGNATURE_VIEW'), async (req, res, next) => { try { res.json({ success: true, data: await signatureService.repository.getRequest(req.params.requestId) }); } catch (error) { next(error); } });

router.post('/signing-sessions/:sessionId/requests', requireSignaturePermission('DOCUMENT_SIGNATURE_SIGN'), async (req: AuthRequest, res, next) => {
    try {
        const body = req.body || {};
        const key = String(req.header('Idempotency-Key') || body.idempotencyKey || '');
        if (!key) throw Object.assign(new Error('Idempotency-Key is required'), { status: 400, code: 'IDEMPOTENCY_KEY_REQUIRED' });
        const request = await signatureService.createRequest({ ...body, sessionId: req.params.sessionId, placementType: body.placementType, pageIndex: Number(body.pageIndex), x1Pt: Number(body.x1Pt), y1Pt: Number(body.y1Pt), x2Pt: Number(body.x2Pt), y2Pt: Number(body.y2Pt), pageWidthPt: Number(body.pageWidthPt), pageHeightPt: Number(body.pageHeightPt), pageRotation: Number(body.pageRotation || 0), signerUserId: actor(req), signerRole: String(body.signerRole || ''), idempotencyKey: key });
        res.status(201).json({ success: true, data: request });
    } catch (error) { next(error); }
});

router.post('/signature-requests/:requestId/prepare', requireSignaturePermission('DOCUMENT_SIGNATURE_SIGN'), async (req: AuthRequest, res, next) => {
    try { res.json({ success: true, data: await signatureService.prepare(req.params.requestId, actor(req)) }); }
    catch (error) { next(error); }
});

router.post('/signature-requests/:requestId/prepare-pdf', requireSignaturePermission('DOCUMENT_SIGNATURE_SIGN'), async (req: AuthRequest, res, next) => {
    try { res.json({ success: true, data: await signaturePackagingService.preparePdf(req.params.requestId, actor(req), String(req.body?.certificateBase64 || ''), Array.isArray(req.body?.certificateChainBase64) ? req.body.certificateChainBase64 : []) }); }
    catch (error) { next(error); }
});

router.post('/signature-requests/:requestId/agent-signature', requireSignaturePermission('DOCUMENT_SIGNATURE_SIGN'), async (req: AuthRequest, res, next) => {
    try { res.json({ success: true, data: await signatureService.authorizeAgentSignature(req.params.requestId, req.body || {}, actor(req)) }); }
    catch (error) { next(error); }
});

router.post('/signature-requests/:requestId/complete', requireSignaturePermission('DOCUMENT_SIGNATURE_SIGN'), async (req, res, next) => {
    try { res.json({ success: true, data: await signaturePackagingService.finalizePdf(req.params.requestId, actor(req)) }); }
    catch (error) { next(error); }
});

router.post('/signature-requests/:requestId/finalize-pdf', requireSignaturePermission('DOCUMENT_SIGNATURE_SIGN'), async (req: AuthRequest, res, next) => {
    try { res.json({ success: true, data: await signaturePackagingService.finalizePdf(req.params.requestId, actor(req)) }); }
    catch (error) { next(error); }
});

router.post('/signature-requests/:requestId/cancel', requireSignaturePermission('DOCUMENT_SIGNATURE_SIGN'), async (req: AuthRequest, res, next) => {
    try { res.json({ success: true, data: await signatureService.cancel(req.params.requestId, actor(req)) }); }
    catch (error) { next(error); }
});

export default router;
