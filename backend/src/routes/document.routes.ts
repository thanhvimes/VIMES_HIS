import { Router, Request, Response, NextFunction } from 'express';
import { documentService, templateRegistry } from '../document-engine/document.service';
import { RenderDocumentRequest } from '../document-engine/types';
import { renderCapacity } from '../document-engine/render-capacity';

const router = Router();

router.get('/templates', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const templates = await templateRegistry.list();
        res.json({
            success: true,
            data: templates.map(({ file: _file, ...publicTemplate }) => publicTemplate)
        });
    } catch (error) { next(error); }
});

router.get('/metrics', (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, data: renderCapacity.snapshot() });
});

router.post('/render', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = req.body as Partial<RenderDocumentRequest>;
        if (!body.templateCode || !body.outputFormat || !body.data) {
            return res.status(400).json({ success: false, message: 'templateCode, outputFormat and data are required' });
        }
        const result = await documentService.render(body as RenderDocumentRequest);
        res.setHeader('Content-Type', result.contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
        res.setHeader('X-Document-Template', `${result.template.code}@${result.template.version}`);
        res.setHeader('Cache-Control', 'no-store');
        return res.send(result.content);
    } catch (error: any) {
        if (error?.retryAfterSeconds) res.setHeader('Retry-After', String(error.retryAfterSeconds));
        next(error);
    }
});

export default router;
