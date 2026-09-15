import path from 'node:path';
import crypto from 'node:crypto';
import { CarboneRenderer, defaultCircuitBreaker } from './carbone-renderer';
import { TemplateRegistry } from './template-registry';
import { DocumentOutputFormat, RenderDocumentRequest, RenderedDocument } from './types';
import { renderCapacity } from './render-capacity';
import { LocalTemplateArtifactStorage, S3TemplateArtifactStorage, TemplateArtifactStorage } from '../template-studio/local-template-storage';
import { sanitizeError } from './phi-sanitizer';

const templateRoot = path.resolve(process.env.DOCUMENT_TEMPLATE_DIR || path.join(process.cwd(), 'templates', 'documents'));
export const templateRegistry = new TemplateRegistry(templateRoot);
export const carboneRenderer = new CarboneRenderer(templateRegistry, {
    baseUrl: process.env.CARBONE_URL || 'http://127.0.0.1:4000',
    token: process.env.CARBONE_TOKEN,
    timeoutMs: Number(process.env.CARBONE_TIMEOUT_MS || 30_000),
    converter: process.env.CARBONE_CONVERTER === 'O' ? 'O' : 'L'
});
const publishedStorage: TemplateArtifactStorage = process.env.TEMPLATE_STUDIO_STORAGE === 's3'
    ? new S3TemplateArtifactStorage(String(process.env.S3_BUCKET || 'vimes-document-templates'))
    : new LocalTemplateArtifactStorage(path.resolve(process.env.TEMPLATE_STUDIO_STORAGE_DIR || path.join(process.cwd(), 'storage', 'template-studio')));

function assertSafeData(value: unknown, depth = 0): asserts value is Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw Object.assign(new Error('Document data must be a JSON object'), { status: 400 });
    if (depth > 12) throw Object.assign(new Error('Document data exceeds maximum nesting depth'), { status: 400 });
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length > 500) throw Object.assign(new Error('Document data contains too many fields'), { status: 400 });
    for (const [key, child] of entries) {
        if (['__proto__', 'prototype', 'constructor'].includes(key)) throw Object.assign(new Error('Document data contains a forbidden key'), { status: 400 });
        if (child && typeof child === 'object') {
            if (Array.isArray(child)) {
                if (child.length > 2_000) throw Object.assign(new Error('Document data array is too large'), { status: 400 });
                child.forEach(item => { if (item && typeof item === 'object') assertNested(item, depth + 1); });
            } else assertSafeData(child, depth + 1);
        }
    }
}

function assertNested(value: object, depth: number): void {
    if (Array.isArray(value)) {
        if (depth > 12 || value.length > 2_000) throw Object.assign(new Error('Document data is too complex'), { status: 400 });
        value.forEach(item => { if (item && typeof item === 'object') assertNested(item, depth + 1); });
        return;
    }
    assertSafeData(value, depth);
}

function assertFormat(value: unknown): asserts value is DocumentOutputFormat {
    if (value !== 'pdf' && value !== 'docx') throw Object.assign(new Error('outputFormat must be pdf or docx'), { status: 400 });
}

interface IdempotencyEntry {
    result: RenderedDocument;
    cachedAt: number;
}

export class DocumentService {
    private readonly inFlight = new Map<string, Promise<RenderedDocument>>();
    private readonly idempotencyCache = new Map<string, IdempotencyEntry>();
    private readonly IDEMPOTENCY_TTL_MS = 5 * 60 * 1000; // 5 minutes

    async render(request: RenderDocumentRequest): Promise<RenderedDocument> {
        const startTime = Date.now();
        assertFormat(request.outputFormat);
        assertSafeData(request.data);

        // Check Idempotency Key cache
        if (request.idempotencyKey) {
            const cached = this.idempotencyCache.get(request.idempotencyKey);
            if (cached && Date.now() - cached.cachedAt < this.IDEMPOTENCY_TTL_MS) {
                return {
                    ...cached.result,
                    isIdempotencyHit: true,
                    renderDurationMs: Date.now() - startTime
                };
            }
        }

        const useDatabaseRegistry = process.env.DOCUMENT_TEMPLATE_SOURCE !== 'filesystem';
        const template = useDatabaseRegistry
            ? await templateRegistry.resolveActive(request.templateCode, request.templateVersion, {
                facilityId: request.facilityId,
                departmentId: request.departmentId,
                asOfDate: request.asOfDate
            })
            : await templateRegistry.resolve(request.templateCode, request.templateVersion);

        const inFlightKey = crypto.createHash('sha256').update(JSON.stringify([
            template.code,
            template.version,
            request.outputFormat,
            request.data,
            request.facilityId,
            request.departmentId
        ])).digest('hex');

        const existing = this.inFlight.get(inFlightKey);
        if (existing) return existing;

        const renderAction = async (): Promise<RenderedDocument> => {
            try {
                const content = template.artifactKey
                    ? await carboneRenderer.renderBuffer(await publishedStorage.get(template.artifactKey), request.data, request.outputFormat)
                    : await carboneRenderer.render(template, request.data, request.outputFormat);
                const extension = request.outputFormat;
                const duration = Date.now() - startTime;
                const doc: RenderedDocument = {
                    content,
                    contentType: extension === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    filename: `${template.code.toLowerCase()}-v${template.version}.${extension}`,
                    template,
                    isIdempotencyHit: false,
                    renderDurationMs: duration
                };

                // Cache for Idempotency if key is present
                if (request.idempotencyKey) {
                    if (this.idempotencyCache.size >= 500) {
                        const oldestKey = this.idempotencyCache.keys().next().value;
                        if (oldestKey) this.idempotencyCache.delete(oldestKey);
                    }
                    this.idempotencyCache.set(request.idempotencyKey, {
                        result: doc,
                        cachedAt: Date.now()
                    });
                }

                return doc;
            } catch (error) {
                const sanitizedMsg = sanitizeError(error);
                console.error(`[DocumentService] Render error for template ${template.code}: ${sanitizedMsg}`);
                throw error;
            }
        };

        // If Emergency priority request, execute directly with high priority
        const pending = request.isEmergency
            ? renderAction()
            : renderCapacity.execute(renderAction);

        this.inFlight.set(inFlightKey, pending);
        try {
            return await pending;
        } finally {
            this.inFlight.delete(inFlightKey);
        }
    }

    clearIdempotencyCache(): void {
        this.idempotencyCache.clear();
    }

    getCircuitBreakerStatus() {
        return defaultCircuitBreaker.getMetrics();
    }
}

export const documentService = new DocumentService();
