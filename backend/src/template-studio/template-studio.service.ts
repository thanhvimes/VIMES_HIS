import crypto from 'node:crypto';
import path from 'node:path';
import { CarboneRenderer } from '../document-engine/carbone-renderer';
import { TemplateRegistry } from '../document-engine/template-registry';
import { renderCapacity } from '../document-engine/render-capacity';
import { ContractCatalog } from './contract-catalog';
import { validateDocx } from './docx-validator';
import { LocalTemplateArtifactStorage } from './local-template-storage';
import { TemplateStudioRepository } from './template-studio.repository';

const templateRoot = path.resolve(process.env.DOCUMENT_TEMPLATE_DIR || path.join(process.cwd(), 'templates', 'documents'));
const artifactRoot = path.resolve(process.env.TEMPLATE_STUDIO_STORAGE_DIR || path.join(process.cwd(), 'storage', 'template-studio'));

export class TemplateStudioService {
    readonly repository = new TemplateStudioRepository();
    readonly contracts = new ContractCatalog(templateRoot);
    readonly storage = new LocalTemplateArtifactStorage(artifactRoot);
    private readonly renderer = new CarboneRenderer(new TemplateRegistry(templateRoot), {
        baseUrl: process.env.CARBONE_URL || 'http://127.0.0.1:4000',
        token: process.env.CARBONE_TOKEN,
        timeoutMs: Number(process.env.CARBONE_TIMEOUT_MS || 30_000),
        converter: process.env.CARBONE_CONVERTER === 'O' ? 'O' : 'L'
    });

    async upload(versionId: number, content: Buffer, actor: string) {
        const version = await this.repository.getVersion(versionId);
        const contract = await this.contracts.get(version.templateCode);
        const validation = validateDocx(content, contract.allowedFields);
        const key = `${version.templateCode}/v${version.version}/${validation.sha256}.docx`;
        await this.storage.put(key, content);
        await this.repository.updateArtifact(versionId, { key, sha256: validation.sha256, size: content.length, validation }, actor);
        return validation;
    }

    async download(versionId: number): Promise<{ content: Buffer; filename: string }> {
        const version = await this.repository.getVersion(versionId);
        if (!version.artifactKey) throw Object.assign(new Error('Template version has no DOCX artifact'), { status: 404 });
        return { content: await this.storage.get(version.artifactKey), filename: `${version.templateCode}-v${version.version}.docx` };
    }

    async preview(versionId: number, format: 'docx' | 'pdf', data?: Record<string, unknown>) {
        const version = await this.repository.getVersion(versionId);
        if (!version.artifactKey || version.validationResult?.valid !== true) throw Object.assign(new Error('A valid DOCX is required before preview'), { status: 409 });
        const template = await this.storage.get(version.artifactKey);
        const renderData = data || version.sampleData;
        const content = await renderCapacity.execute(() => this.renderer.renderBuffer(template, renderData, format));
        return {
            content,
            sha256: crypto.createHash('sha256').update(content).digest('hex'),
            filename: `${version.templateCode}-v${version.version}-preview.${format}`
        };
    }
}

export const templateStudioService = new TemplateStudioService();

