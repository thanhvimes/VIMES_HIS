import fs from 'node:fs/promises';
import { DocumentRenderer, DocumentOutputFormat, DocumentTemplateManifest } from './types';
import { TemplateRegistry } from './template-registry';
import { CircuitBreaker, CircuitBreakerOpenError } from './circuit-breaker';

export interface CarboneRendererOptions {
    baseUrl: string;
    token?: string;
    timeoutMs: number;
    converter: 'L' | 'O';
    circuitBreaker?: CircuitBreaker;
}

export const defaultCircuitBreaker = new CircuitBreaker({
    failureThreshold: 5,
    resetTimeoutMs: 10_000,
    halfOpenMaxCalls: 2
});

export class CarboneRenderer implements DocumentRenderer {
    private readonly templateCache = new Map<string, { modifiedMs: number; size: number; content: Buffer }>();
    readonly circuitBreaker: CircuitBreaker;

    constructor(private readonly registry: TemplateRegistry, private readonly options: CarboneRendererOptions) {
        this.circuitBreaker = options.circuitBreaker ?? defaultCircuitBreaker;
    }

    async render(template: DocumentTemplateManifest, data: Record<string, unknown>, outputFormat: DocumentOutputFormat): Promise<Buffer> {
        const templateContent = await this.readTemplateCached(this.registry.templatePath(template));
        return this.renderBuffer(templateContent, data, outputFormat);
    }

    async renderBuffer(templateContent: Buffer, data: Record<string, unknown>, outputFormat: DocumentOutputFormat): Promise<Buffer> {
        return this.circuitBreaker.execute(async () => {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs);
            try {
                const response = await fetch(`${this.options.baseUrl.replace(/\/$/, '')}/render/template?download=true`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'carbone-version': '5',
                        ...(this.options.token ? { Authorization: `Bearer ${this.options.token}` } : {})
                    },
                    body: JSON.stringify({
                        template: templateContent.toString('base64'),
                        data,
                        convertTo: outputFormat,
                        ...(outputFormat === 'pdf' ? { converter: this.options.converter } : {})
                    }),
                    signal: controller.signal
                });
                if (!response.ok) {
                    const detail = (await response.text()).slice(0, 500);
                    console.error(`[DocumentEngine] Carbone render failed (${response.status}): ${detail}`);
                    throw Object.assign(new Error('Document rendering service failed'), { status: 502 });
                }
                return Buffer.from(await response.arrayBuffer());
            } catch (error) {
                if ((error as Error).name === 'AbortError') throw Object.assign(new Error('Carbone render timed out'), { status: 504 });
                throw error;
            } finally {
                clearTimeout(timeout);
            }
        });
    }

    private async readTemplateCached(templatePath: string): Promise<Buffer> {
        const stat = await fs.stat(templatePath);
        const cached = this.templateCache.get(templatePath);
        if (cached && cached.modifiedMs === stat.mtimeMs && cached.size === stat.size) return cached.content;
        const content = await fs.readFile(templatePath);
        if (this.templateCache.size >= 64) this.templateCache.delete(this.templateCache.keys().next().value as string);
        this.templateCache.set(templatePath, { modifiedMs: stat.mtimeMs, size: stat.size, content });
        return content;
    }
}
