import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { documentService, templateRegistry } from '../document-engine/document.service';
import { RenderDocumentRequest, RenderedDocument } from '../document-engine/types';
import { renderCapacity } from '../document-engine/render-capacity';

const router = Router();

interface RenderJob {
    id: string;
    state: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    progress: number;
    request: RenderDocumentRequest;
    result?: RenderedDocument;
    error?: string;
    createdAt: string;
    completedAt?: string;
}

const asyncRenderJobs = new Map<string, RenderJob>();

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
    res.json({
        success: true,
        data: {
            ...renderCapacity.snapshot(),
            circuitBreaker: documentService.getCircuitBreakerStatus()
        }
    });
});

router.get('/health', (_req: Request, res: Response) => {
    const circuit = documentService.getCircuitBreakerStatus();
    const isHealthy = circuit.state !== 'OPEN';
    res.status(isHealthy ? 200 : 503).json({
        success: isHealthy,
        status: isHealthy ? 'HEALTHY' : 'DEGRADED',
        circuitBreaker: circuit,
        timestamp: new Date().toISOString()
    });
});

router.post('/render', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = req.body as Partial<RenderDocumentRequest>;
        if (!body.templateCode || !body.outputFormat || !body.data) {
            return res.status(400).json({ success: false, message: 'templateCode, outputFormat and data are required' });
        }

        const idempotencyKey = (req.headers['idempotency-key'] as string) || body.idempotencyKey;
        const isEmergency = Boolean(body.isEmergency || req.headers['x-emergency-priority'] === '1');

        const request: RenderDocumentRequest = {
            templateCode: body.templateCode,
            templateVersion: body.templateVersion,
            outputFormat: body.outputFormat,
            data: body.data,
            facilityId: body.facilityId,
            departmentId: body.departmentId,
            asOfDate: body.asOfDate,
            idempotencyKey,
            isEmergency,
            patientId: body.patientId,
            receptionId: body.receptionId,
            encounterId: body.encounterId,
            documentType: body.documentType
        };

        const result = await documentService.render(request);

        res.setHeader('Content-Type', result.contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
        res.setHeader('X-Document-Template', `${result.template.code}@${result.template.version}`);
        res.setHeader('X-Idempotency-Hit', result.isIdempotencyHit ? '1' : '0');
        if (result.renderDurationMs !== undefined) {
            res.setHeader('X-Render-Time-Ms', String(result.renderDurationMs));
        }
        res.setHeader('Cache-Control', 'no-store');
        return res.send(result.content);
    } catch (error: any) {
        if (error?.retryAfterSeconds) res.setHeader('Retry-After', String(error.retryAfterSeconds));
        next(error);
    }
});

// Async batch render job endpoints
router.post('/render/jobs', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = req.body as Partial<RenderDocumentRequest>;
        if (!body.templateCode || !body.outputFormat || !body.data) {
            return res.status(400).json({ success: false, message: 'templateCode, outputFormat and data are required' });
        }

        const jobId = `docjob_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        const job: RenderJob = {
            id: jobId,
            state: 'QUEUED',
            progress: 0,
            request: body as RenderDocumentRequest,
            createdAt: new Date().toISOString()
        };

        asyncRenderJobs.set(jobId, job);

        // Process in background
        setImmediate(async () => {
            job.state = 'PROCESSING';
            job.progress = 30;
            try {
                const result = await documentService.render(job.request);
                job.state = 'COMPLETED';
                job.progress = 100;
                job.result = result;
                job.completedAt = new Date().toISOString();
            } catch (err: any) {
                job.state = 'FAILED';
                job.error = err.message || 'Render failed';
                job.completedAt = new Date().toISOString();
            }
        });

        res.status(202).json({
            success: true,
            data: {
                jobId,
                status: 'QUEUED',
                checkUrl: `/api/v1/documents/render/jobs/${jobId}`
            }
        });
    } catch (error) { next(error); }
});

router.get('/render/jobs/:jobId', (req: Request, res: Response) => {
    const jobId = String(req.params.jobId);
    const job = asyncRenderJobs.get(jobId);
    if (!job) {
        return res.status(404).json({ success: false, message: 'Render job not found' });
    }

    if (req.query.download === 'true' && job.result) {
        res.setHeader('Content-Type', job.result.contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${job.result.filename}"`);
        return res.send(job.result.content);
    }

    res.json({
        success: true,
        data: {
            jobId: job.id,
            state: job.state,
            progress: job.progress,
            createdAt: job.createdAt,
            completedAt: job.completedAt,
            hasArtifact: Boolean(job.result),
            error: job.error
        }
    });
});

export default router;
