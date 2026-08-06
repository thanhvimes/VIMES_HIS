import path from 'node:path';
import crypto from 'node:crypto';
import { CarboneRenderer } from './carbone-renderer';
import { TemplateRegistry } from './template-registry';
import { DocumentOutputFormat, RenderDocumentRequest, RenderedDocument } from './types';
import { renderCapacity } from './render-capacity';

const templateRoot = path.resolve(process.env.DOCUMENT_TEMPLATE_DIR || path.join(process.cwd(), 'templates', 'documents'));
export const templateRegistry = new TemplateRegistry(templateRoot);
const carboneRenderer = new CarboneRenderer(templateRegistry, {
    baseUrl: process.env.CARBONE_URL || 'http://127.0.0.1:4000',
    token: process.env.CARBONE_TOKEN,
    timeoutMs: Number(process.env.CARBONE_TIMEOUT_MS || 30_000),
    converter: process.env.CARBONE_CONVERTER === 'O' ? 'O' : 'L'
});

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

export class DocumentService {
    private readonly inFlight = new Map<string, Promise<RenderedDocument>>();

    async render(request: RenderDocumentRequest): Promise<RenderedDocument> {
        assertFormat(request.outputFormat);
        assertSafeData(request.data);
        const template = await templateRegistry.resolve(request.templateCode, request.templateVersion);
        const key = crypto.createHash('sha256').update(JSON.stringify([template.code, template.version, request.outputFormat, request.data])).digest('hex');
        const existing = this.inFlight.get(key);
        if (existing) return existing;
        const pending = renderCapacity.execute(async () => {
            const content = await carboneRenderer.render(template, request.data, request.outputFormat);
            const extension = request.outputFormat;
            return {
                content,
                contentType: extension === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                filename: `${template.code.toLowerCase()}-v${template.version}.${extension}`,
                template
            };
        });
        this.inFlight.set(key, pending);
        try { return await pending; }
        finally { this.inFlight.delete(key); }
    }
}

export const documentService = new DocumentService();
